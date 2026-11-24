import bcrypt from 'bcryptjs';
import prisma from '../../database/prisma.js';
import { ApiError } from '../../utils/apiError.js';
import { ROLES } from '../../constants/roles.js';

export class PatientService {
  /**
   * Helper: Calculate age from Date of Birth
   */
  static calculateAge(dob) {
    if (!dob) return null;
    const birthDate = new Date(dob);
    if (isNaN(birthDate.getTime())) return null;

    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();

    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age >= 0 ? age : 0;
  }

  /**
   * Helper: Formats patient database record for standardized API responses
   */
  static formatPatientResponse(user) {
    if (!user) return null;

    const profile = user.patientProfile;
    const dobStr = profile?.dateOfBirth instanceof Date
      ? profile.dateOfBirth.toISOString().split('T')[0]
      : profile?.dateOfBirth || null;

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      isActive: user.isActive,
      profile: profile ? {
        id: profile.id,
        gender: profile.gender,
        dateOfBirth: dobStr,
        age: this.calculateAge(profile.dateOfBirth),
        bloodGroup: profile.bloodGroup,
        emergencyContact: profile.emergencyContact,
        address: profile.address,
        medicalHistory: profile.medicalHistory,
        createdAt: profile.createdAt,
        updatedAt: profile.updatedAt
      } : null,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    };
  }

  /**
   * Helper: Searches patient by User ID or PatientProfile ID
   */
  static async findPatientRecord(id) {
    let user = await prisma.user.findFirst({
      where: {
        id,
        role: ROLES.PATIENT
      },
      include: {
        patientProfile: true
      }
    });

    if (!user) {
      const profile = await prisma.patientProfile.findUnique({
        where: { id },
        include: { user: true }
      });

      if (profile && profile.user && profile.user.role === ROLES.PATIENT) {
        user = {
          ...profile.user,
          patientProfile: profile
        };
      }
    }

    return user;
  }

  /**
   * 1. Create a new Patient with User account and PatientProfile (Admin/Receptionist)
   */
  static async createPatient(data) {
    const {
      name,
      email,
      password,
      phone,
      gender,
      dateOfBirth,
      bloodGroup,
      emergencyContact,
      address,
      medicalHistory
    } = data;

    // Check if email already exists
    const existing = await prisma.user.findUnique({
      where: { email }
    });

    if (existing) {
      throw ApiError.conflict('An account with this email address already exists.');
    }

    // Hash password with bcrypt (salt rounds = 12)
    const salt = await bcrypt.genSalt(12);
    const passwordHash = await bcrypt.hash(password, salt);

    const parsedDob = dateOfBirth ? new Date(dateOfBirth) : null;

    const newPatient = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          name,
          email,
          passwordHash,
          phone: phone || null,
          role: ROLES.PATIENT,
          isActive: true
        }
      });

      const profile = await tx.patientProfile.create({
        data: {
          userId: user.id,
          gender: gender || null,
          dateOfBirth: parsedDob,
          bloodGroup: bloodGroup || null,
          emergencyContact: emergencyContact || null,
          address: address || null,
          medicalHistory: medicalHistory || null
        }
      });

      return {
        ...user,
        patientProfile: profile
      };
    });

    return this.formatPatientResponse(newPatient);
  }

  /**
   * 2. Get all patients with pagination, text search, and filters (Admin/Receptionist/Doctor)
   */
  static async getAllPatients(queryParams = {}) {
    const {
      page = 1,
      limit = 10,
      search,
      gender,
      bloodGroup,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = queryParams;

    const skip = (page - 1) * limit;

    const userWhere = {
      role: ROLES.PATIENT
    };

    const profileWhere = {};

    if (gender) {
      profileWhere.gender = gender.toUpperCase();
    }

    if (bloodGroup) {
      profileWhere.bloodGroup = bloodGroup.toUpperCase();
    }

    if (search) {
      userWhere.OR = [
        { name: { contains: search } },
        { email: { contains: search } },
        { phone: { contains: search } },
        {
          patientProfile: {
            address: { contains: search }
          }
        },
        {
          patientProfile: {
            emergencyContact: { contains: search }
          }
        }
      ];
    }

    if (Object.keys(profileWhere).length > 0) {
      userWhere.patientProfile = {
        ...(userWhere.patientProfile || {}),
        ...profileWhere
      };
    }

    let orderBy = {};
    if (sortBy === 'name') {
      orderBy = { name: sortOrder };
    } else if (sortBy === 'dateOfBirth') {
      orderBy = {
        patientProfile: {
          dateOfBirth: sortOrder
        }
      };
    } else {
      orderBy = { createdAt: sortOrder };
    }

    const [total, patients] = await prisma.$transaction([
      prisma.user.count({ where: userWhere }),
      prisma.user.findMany({
        where: userWhere,
        include: {
          patientProfile: true
        },
        skip,
        take: limit,
        orderBy
      })
    ]);

    return {
      patients: patients.map((p) => this.formatPatientResponse(p)),
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  /**
   * 3. Get single patient by ID with RBAC check
   */
  static async getPatientById(requesterUser, id) {
    const patient = await this.findPatientRecord(id);

    if (!patient) {
      throw ApiError.notFound(`Patient with ID '${id}' was not found.`);
    }

    // RBAC: Patients can only view their own profile
    if (requesterUser.role === ROLES.PATIENT && requesterUser.id !== patient.id) {
      throw ApiError.forbidden('You are not authorized to view this patient profile.');
    }

    return this.formatPatientResponse(patient);
  }

  /**
   * 4. Update Patient (Admin or Receptionist)
   */
  static async updatePatient(id, data) {
    const patient = await this.findPatientRecord(id);

    if (!patient) {
      throw ApiError.notFound(`Patient with ID '${id}' was not found.`);
    }

    const {
      name,
      phone,
      isActive,
      gender,
      dateOfBirth,
      bloodGroup,
      emergencyContact,
      address,
      medicalHistory
    } = data;

    const userData = {};
    if (name !== undefined) userData.name = name;
    if (phone !== undefined) userData.phone = phone;
    if (isActive !== undefined) userData.isActive = isActive;

    const profileData = {};
    if (gender !== undefined) profileData.gender = gender;
    if (dateOfBirth !== undefined) profileData.dateOfBirth = dateOfBirth ? new Date(dateOfBirth) : null;
    if (bloodGroup !== undefined) profileData.bloodGroup = bloodGroup;
    if (emergencyContact !== undefined) profileData.emergencyContact = emergencyContact;
    if (address !== undefined) profileData.address = address;
    if (medicalHistory !== undefined) profileData.medicalHistory = medicalHistory;

    const updated = await prisma.$transaction(async (tx) => {
      let updatedUser = patient;
      if (Object.keys(userData).length > 0) {
        updatedUser = await tx.user.update({
          where: { id: patient.id },
          data: userData
        });
      }

      let updatedProfile = patient.patientProfile;
      if (Object.keys(profileData).length > 0) {
        if (patient.patientProfile) {
          updatedProfile = await tx.patientProfile.update({
            where: { userId: patient.id },
            data: profileData
          });
        } else {
          updatedProfile = await tx.patientProfile.create({
            data: {
              userId: patient.id,
              ...profileData
            }
          });
        }
      }

      return {
        ...updatedUser,
        patientProfile: updatedProfile
      };
    });

    return this.formatPatientResponse(updated);
  }

  /**
   * 5. Delete Patient (Admin only)
   * Cascades to PatientProfile, Appointments, and RefreshTokens
   */
  static async deletePatient(id) {
    const patient = await this.findPatientRecord(id);

    if (!patient) {
      throw ApiError.notFound(`Patient with ID '${id}' was not found.`);
    }

    await prisma.user.delete({
      where: { id: patient.id }
    });

    return {
      deletedPatientId: patient.id,
      name: patient.name,
      email: patient.email
    };
  }

  /**
   * 6. Get Patient Profile for logged-in Patient (Self-service)
   */
  static async getPatientProfileByUserId(userId) {
    let user = await prisma.user.findFirst({
      where: {
        id: userId,
        role: ROLES.PATIENT
      },
      include: {
        patientProfile: true
      }
    });

    if (!user) {
      throw ApiError.notFound('Patient account was not found.');
    }

    // Auto-create patient profile if missing
    if (!user.patientProfile) {
      const profile = await prisma.patientProfile.create({
        data: { userId: user.id }
      });
      user.patientProfile = profile;
    }

    return this.formatPatientResponse(user);
  }

  /**
   * 7. Update Patient Profile for logged-in Patient (Self-service)
   */
  static async updatePatientProfileByUserId(userId, data) {
    return this.updatePatient(userId, data);
  }

  /**
   * 8. Get Medical History (Patient, Doctor, Admin)
   */
  static async getMedicalHistory(requesterUser, id) {
    const patient = await this.findPatientRecord(id);

    if (!patient) {
      throw ApiError.notFound(`Patient with ID '${id}' was not found.`);
    }

    if (requesterUser.role === ROLES.PATIENT && requesterUser.id !== patient.id) {
      throw ApiError.forbidden('You are not authorized to view this patient medical history.');
    }

    return {
      patientId: patient.id,
      patientName: patient.name,
      bloodGroup: patient.patientProfile?.bloodGroup || null,
      medicalHistory: patient.patientProfile?.medicalHistory || null,
      lastUpdated: patient.patientProfile?.updatedAt || null
    };
  }

  /**
   * 9. Update or Append Medical History (Patient, Doctor, Admin)
   */
  static async updateMedicalHistory(requesterUser, id, medicalHistoryContent, append = false) {
    const patient = await this.findPatientRecord(id);

    if (!patient) {
      throw ApiError.notFound(`Patient with ID '${id}' was not found.`);
    }

    if (requesterUser.role === ROLES.PATIENT && requesterUser.id !== patient.id) {
      throw ApiError.forbidden('You are not authorized to update this patient medical history.');
    }

    let finalHistory = medicalHistoryContent;

    if (append && patient.patientProfile?.medicalHistory) {
      const dateStr = new Date().toISOString().split('T')[0];
      const entryHeader = `\n--- [Entry on ${dateStr} by ${requesterUser.name} (${requesterUser.role})] ---\n`;
      finalHistory = `${patient.patientProfile.medicalHistory}${entryHeader}${medicalHistoryContent}`;
    }

    const updatedProfile = await prisma.patientProfile.upsert({
      where: { userId: patient.id },
      update: { medicalHistory: finalHistory },
      create: {
        userId: patient.id,
        medicalHistory: finalHistory
      }
    });

    return {
      patientId: patient.id,
      patientName: patient.name,
      bloodGroup: updatedProfile.bloodGroup,
      medicalHistory: updatedProfile.medicalHistory,
      updatedAt: updatedProfile.updatedAt
    };
  }
}
