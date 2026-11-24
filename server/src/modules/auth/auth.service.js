import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../../database/prisma.js';
import { ENV } from '../../config/env.js';
import { ApiError } from '../../utils/apiError.js';
import { ROLES } from '../../constants/roles.js';

export class AuthService {
  /**
   * Helper: Generate Access and Refresh JWTs
   */
  static generateTokens(user) {
    const payload = {
      userId: user.id,
      email: user.email,
      role: user.role
    };

    const accessToken = jwt.sign(payload, ENV.JWT_ACCESS_SECRET, {
      expiresIn: ENV.JWT_ACCESS_EXPIRES_IN
    });

    const refreshToken = jwt.sign({ userId: user.id }, ENV.JWT_REFRESH_SECRET, {
      expiresIn: ENV.JWT_REFRESH_EXPIRES_IN
    });

    return { accessToken, refreshToken };
  }

  /**
   * Register a new user with password hashing and role profile initialization
   */
  static async register(data) {
    const { name, email, password, role, phone, doctorDetails, patientDetails } = data;

    // Check existing email
    const existing = await prisma.user.findUnique({
      where: { email }
    });

    if (existing) {
      throw ApiError.conflict('An account with this email address already exists.');
    }

    // Hash password with bcrypt (salt rounds = 12)
    const salt = await bcrypt.genSalt(12);
    const passwordHash = await bcrypt.hash(password, salt);

    // Create user along with profile based on role in a single transaction
    const newUser = await prisma.$transaction(async (tx) => {
      const createdUser = await tx.user.create({
        data: {
          name,
          email,
          passwordHash,
          role: role || ROLES.PATIENT,
          phone: phone || null
        }
      });

      // Role-specific profile initialization
      if (createdUser.role === ROLES.DOCTOR && doctorDetails) {
        await tx.doctorProfile.create({
          data: {
            userId: createdUser.id,
            specialization: doctorDetails.specialization,
            qualification: doctorDetails.qualification || null,
            department: doctorDetails.department || null,
            experienceYears: doctorDetails.experienceYears || 0,
            consultationFee: doctorDetails.consultationFee || 0,
            availableDays: doctorDetails.availableDays || null
          }
        });
      } else if (createdUser.role === ROLES.PATIENT) {
        await tx.patientProfile.create({
          data: {
            userId: createdUser.id,
            gender: patientDetails?.gender || null,
            dateOfBirth: patientDetails?.dateOfBirth ? new Date(patientDetails.dateOfBirth) : null,
            bloodGroup: patientDetails?.bloodGroup || null,
            emergencyContact: patientDetails?.emergencyContact || null,
            address: patientDetails?.address || null,
            medicalHistory: patientDetails?.medicalHistory || null
          }
        });
      }

      return createdUser;
    });

    // Generate tokens
    const tokens = this.generateTokens(newUser);

    // Save refresh token to database
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days
    await prisma.refreshToken.create({
      data: {
        token: tokens.refreshToken,
        userId: newUser.id,
        expiresAt
      }
    });

    return {
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        phone: newUser.phone,
        createdAt: newUser.createdAt
      },
      tokens
    };
  }

  /**
   * Login user with credentials and issue tokens
   */
  static async login(email, password) {
    console.log(`[AuthService.login] Initiating login flow for: ${email}`);
    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        doctorProfile: true,
        patientProfile: true
      }
    });

    if (!user) {
      console.warn(`[AuthService.login] Failed: User not found (${email})`);
      throw ApiError.unauthorized('Invalid email or password.');
    }

    console.log(`[AuthService.login] User found: ${user.id} | Role: ${user.role}`);

    if (!user.isActive) {
      console.warn(`[AuthService.login] Failed: Account deactivated (${email})`);
      throw ApiError.forbidden('Your account has been deactivated. Please contact administrator.');
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      console.warn(`[AuthService.login] Failed: Invalid password for user (${email})`);
      throw ApiError.unauthorized('Invalid email or password.');
    }

    console.log(`[AuthService.login] Password validated successfully for ${email}`);

    // Update lastLoginAt
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() }
    });

    // Generate tokens
    console.log(`[AuthService.login] Generating tokens for role: ${user.role}`);
    const tokens = this.generateTokens(user);

    // Persist refresh token
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);
    await prisma.refreshToken.create({
      data: {
        token: tokens.refreshToken,
        userId: user.id,
        expiresAt
      }
    });
    
    console.log(`[AuthService.login] Login completed successfully for ${email}`);

    return {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        doctorProfile: user.doctorProfile,
        patientProfile: user.patientProfile
      },
      tokens
    };
  }

  /**
   * Refresh JWT tokens using a valid refresh token
   */
  static async refreshTokens(rawToken) {
    let decoded;
    try {
      decoded = jwt.verify(rawToken, ENV.JWT_REFRESH_SECRET);
    } catch (err) {
      throw ApiError.unauthorized('Invalid or expired refresh token.');
    }

    const storedToken = await prisma.refreshToken.findUnique({
      where: { token: rawToken },
      include: { user: true }
    });

    if (!storedToken || storedToken.revoked) {
      throw ApiError.unauthorized('Refresh token has been revoked or is invalid.');
    }

    if (new Date() > storedToken.expiresAt) {
      throw ApiError.unauthorized('Refresh token has expired. Please login again.');
    }

    if (!storedToken.user || !storedToken.user.isActive) {
      throw ApiError.unauthorized('User account is inactive or not found.');
    }

    // Rotate refresh token: revoke old one
    await prisma.refreshToken.update({
      where: { id: storedToken.id },
      data: { revoked: true }
    });

    // Generate new tokens
    const tokens = this.generateTokens(storedToken.user);

    // Save new refresh token
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);
    await prisma.refreshToken.create({
      data: {
        token: tokens.refreshToken,
        userId: storedToken.user.id,
        expiresAt
      }
    });

    return tokens;
  }

  /**
   * Logout user by revoking refresh token
   */
  static async logout(rawToken) {
    if (!rawToken) return;

    await prisma.refreshToken.updateMany({
      where: { token: rawToken },
      data: { revoked: true }
    });
  }

  /**
   * Change user password
   */
  static async changePassword(userId, currentPassword, newPassword) {
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      throw ApiError.notFound('User not found.');
    }

    const isMatch = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isMatch) {
      throw ApiError.badRequest('Current password is incorrect.');
    }

    const salt = await bcrypt.genSalt(12);
    const passwordHash = await bcrypt.hash(newPassword, salt);

    await prisma.user.update({
      where: { id: userId },
      data: { passwordHash }
    });

    // Invalidate all existing refresh tokens for security
    await prisma.refreshToken.updateMany({
      where: { userId },
      data: { revoked: true }
    });
  }

  /**
   * Get full authenticated user profile
   */
  static async getCurrentUser(userId) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        phone: true,
        isActive: true,
        lastLoginAt: true,
        createdAt: true,
        updatedAt: true,
        doctorProfile: true,
        patientProfile: true
      }
    });

    if (!user) {
      throw ApiError.notFound('User not found.');
    }

    return user;
  }
}
