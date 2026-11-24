import bcrypt from 'bcryptjs';
import prisma from '../../database/prisma.js';
import { ApiError } from '../../utils/apiError.js';
import { ROLES } from '../../constants/roles.js';

export class DoctorService {
  /**
   * Helper: Formats doctor database record for API responses
   */
  static formatDoctorResponse(user) {
    if (!user) return null;
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      isActive: user.isActive,
      profile: user.doctorProfile ? {
        id: user.doctorProfile.id,
        specialization: user.doctorProfile.specialization,
        department: user.doctorProfile.department,
        qualification: user.doctorProfile.qualification,
        experienceYears: user.doctorProfile.experienceYears,
        consultationFee: user.doctorProfile.consultationFee,
        availableDays: user.doctorProfile.availableDays,
        availabilityStatus: user.doctorProfile.availabilityStatus,
        createdAt: user.doctorProfile.createdAt,
        updatedAt: user.doctorProfile.updatedAt
      } : null,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    };
  }

  /**
   * Create a new Doctor with User account and DoctorProfile (Admin)
   */
  static async createDoctor(data) {
    const {
      name,
      email,
      password,
      phone,
      specialization,
      department,
      qualification,
      experienceYears,
      consultationFee,
      availableDays,
      availabilityStatus
    } = data;

    // Check if email or doctor name already exists
    const existing = await prisma.user.findFirst({
      where: {
        OR: [
          { email },
          { name, role: ROLES.DOCTOR }
        ]
      }
    });

    if (existing) {
      if (existing.email === email) {
        throw ApiError.conflict('An account with this email address already exists.');
      } else {
        throw ApiError.conflict(`A doctor named '${name}' already exists in the system.`);
      }
    }

    // Hash password with bcrypt (salt rounds = 12)
    const salt = await bcrypt.genSalt(12);
    const passwordHash = await bcrypt.hash(password, salt);

    // Create User and DoctorProfile within a transaction
    const newDoctor = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          name,
          email,
          passwordHash,
          phone: phone || null,
          role: ROLES.DOCTOR,
          isActive: true
        }
      });

      const profile = await tx.doctorProfile.create({
        data: {
          userId: user.id,
          specialization,
          department: department || null,
          qualification: qualification || null,
          experienceYears: experienceYears ?? 0,
          consultationFee: consultationFee ?? 0.0,
          availableDays: availableDays || null,
          availabilityStatus: availabilityStatus || 'AVAILABLE'
        }
      });

      return {
        ...user,
        doctorProfile: profile
      };
    });

    return this.formatDoctorResponse(newDoctor);
  }

  /**
   * Get all doctors with pagination, search, and filtering
   */
  static async getAllDoctors(queryParams = {}) {
    const {
      page = 1,
      limit = 10,
      search,
      specialization,
      department,
      availabilityStatus,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = queryParams;

    const skip = (page - 1) * limit;

    // Base user condition: role must be DOCTOR
    const userWhere = {
      role: ROLES.DOCTOR
    };

    // Filter doctor profile conditions
    const profileWhere = {};

    if (specialization) {
      profileWhere.specialization = specialization;
    }

    if (department) {
      profileWhere.department = {
        contains: department
      };
    }

    if (availabilityStatus) {
      profileWhere.availabilityStatus = availabilityStatus;
    }

    // Text search query across name, email, department, or qualification
    if (search) {
      userWhere.OR = [
        { name: { contains: search } },
        { email: { contains: search } },
        {
          doctorProfile: {
            department: { contains: search }
          }
        },
        {
          doctorProfile: {
            qualification: { contains: search }
          }
        }
      ];
    }

    if (Object.keys(profileWhere).length > 0) {
      userWhere.doctorProfile = {
        ...(userWhere.doctorProfile || {}),
        ...profileWhere
      };
    }

    // Determine sorting order
    let orderBy = {};
    if (sortBy === 'name') {
      orderBy = { name: sortOrder };
    } else if (sortBy === 'experienceYears' || sortBy === 'consultationFee') {
      orderBy = {
        doctorProfile: {
          [sortBy]: sortOrder
        }
      };
    } else {
      orderBy = { createdAt: sortOrder };
    }

    const [total, doctors] = await prisma.$transaction([
      prisma.user.count({ where: userWhere }),
      prisma.user.findMany({
        where: userWhere,
        include: {
          doctorProfile: true
        },
        skip,
        take: limit,
        orderBy
      })
    ]);

    return {
      doctors: doctors.map((doc) => this.formatDoctorResponse(doc)),
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  /**
   * Find doctor helper: searches by User ID or DoctorProfile ID
   */
  static async findDoctorRecord(id) {
    let user = await prisma.user.findFirst({
      where: {
        id,
        role: ROLES.DOCTOR
      },
      include: {
        doctorProfile: true
      }
    });

    // If not found by user id, check if ID corresponds to DoctorProfile id
    if (!user) {
      const profile = await prisma.doctorProfile.findUnique({
        where: { id },
        include: {
          user: true
        }
      });

      if (profile && profile.user && profile.user.role === ROLES.DOCTOR) {
        user = {
          ...profile.user,
          doctorProfile: profile
        };
      }
    }

    return user;
  }

  /**
   * Get single doctor by ID
   */
  static async getDoctorById(id) {
    const doctor = await this.findDoctorRecord(id);

    if (!doctor) {
      throw ApiError.notFound(`Doctor with ID '${id}' was not found.`);
    }

    return this.formatDoctorResponse(doctor);
  }

  /**
   * Update doctor details (Admin)
   */
  static async updateDoctor(id, data) {
    const doctor = await this.findDoctorRecord(id);

    if (!doctor) {
      throw ApiError.notFound(`Doctor with ID '${id}' was not found.`);
    }

    const {
      name,
      phone,
      isActive,
      specialization,
      department,
      qualification,
      experienceYears,
      consultationFee,
      availableDays,
      availabilityStatus
    } = data;

    // Prepare User fields
    const userData = {};
    if (name !== undefined) userData.name = name;
    if (phone !== undefined) userData.phone = phone;
    if (isActive !== undefined) userData.isActive = isActive;

    // Prepare Profile fields
    const profileData = {};
    if (specialization !== undefined) profileData.specialization = specialization;
    if (department !== undefined) profileData.department = department;
    if (qualification !== undefined) profileData.qualification = qualification;
    if (experienceYears !== undefined) profileData.experienceYears = experienceYears;
    if (consultationFee !== undefined) profileData.consultationFee = consultationFee;
    if (availableDays !== undefined) profileData.availableDays = availableDays;
    if (availabilityStatus !== undefined) profileData.availabilityStatus = availabilityStatus;

    const updated = await prisma.$transaction(async (tx) => {
      let updatedUser = doctor;
      if (Object.keys(userData).length > 0) {
        updatedUser = await tx.user.update({
          where: { id: doctor.id },
          data: userData
        });
      }

      let updatedProfile = doctor.doctorProfile;
      if (Object.keys(profileData).length > 0) {
        if (doctor.doctorProfile) {
          updatedProfile = await tx.doctorProfile.update({
            where: { userId: doctor.id },
            data: profileData
          });
        } else {
          updatedProfile = await tx.doctorProfile.create({
            data: {
              userId: doctor.id,
              specialization: profileData.specialization || 'General Physician',
              ...profileData
            }
          });
        }
      }

      return {
        ...updatedUser,
        doctorProfile: updatedProfile
      };
    });

    return this.formatDoctorResponse(updated);
  }

  /**
   * Delete doctor (Admin)
   * Cascade deletes DoctorProfile and RefreshTokens
   */
  static async deleteDoctor(id) {
    const doctor = await this.findDoctorRecord(id);

    if (!doctor) {
      throw ApiError.notFound(`Doctor with ID '${id}' was not found.`);
    }

    await prisma.user.delete({
      where: { id: doctor.id }
    });

    return {
      deletedDoctorId: doctor.id,
      name: doctor.name,
      email: doctor.email
    };
  }

  /**
   * Get doctor profile for currently authenticated doctor
   */
  static async getDoctorProfileByUserId(userId) {
    const user = await prisma.user.findFirst({
      where: {
        id: userId,
        role: ROLES.DOCTOR
      },
      include: {
        doctorProfile: true
      }
    });

    if (!user) {
      throw ApiError.notFound('Doctor profile not found for this account.');
    }

    return this.formatDoctorResponse(user);
  }

  /**
   * Update doctor profile for currently authenticated doctor
   */
  static async updateDoctorProfileByUserId(userId, data) {
    return this.updateDoctor(userId, data);
  }

  /**
   * Update doctor availability status
   */
  static async updateAvailabilityStatus(idOrUserId, availabilityStatus) {
    const doctor = await this.findDoctorRecord(idOrUserId);

    if (!doctor) {
      throw ApiError.notFound(`Doctor with ID '${idOrUserId}' was not found.`);
    }

    const updatedProfile = await prisma.doctorProfile.upsert({
      where: { userId: doctor.id },
      update: { availabilityStatus },
      create: {
        userId: doctor.id,
        specialization: 'General Physician',
        availabilityStatus
      }
    });

    return {
      doctorId: doctor.id,
      doctorName: doctor.name,
      availabilityStatus: updatedProfile.availabilityStatus,
      updatedAt: updatedProfile.updatedAt
    };
  }
}
