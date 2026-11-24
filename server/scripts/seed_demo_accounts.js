import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const accountsToCreate = [
  {
    email: 'admin@medpulse.com',
    name: 'System Admin',
    role: 'ADMIN',
    password: 'MedPulse@123',
    phone: '111-1111'
  },
  {
    email: 'reception@medpulse.com',
    name: 'Front Desk Reception',
    role: 'RECEPTIONIST',
    password: 'MedPulse@123',
    phone: '222-2222'
  },
  {
    email: 'gregory@medpulse.com',
    name: 'Dr. Gregory House',
    role: 'DOCTOR',
    password: 'MedPulse@123',
    phone: '333-3331',
    profile: {
      specialization: 'Diagnostician',
      department: 'Diagnostics',
      experienceYears: 20,
      consultationFee: 200,
      availabilityStatus: 'AVAILABLE'
    }
  },
  {
    email: 'john@medpulse.com',
    name: 'Dr. John Watson',
    role: 'DOCTOR',
    password: 'MedPulse@123',
    phone: '333-3332',
    profile: {
      specialization: 'General Physician',
      department: 'General Medicine',
      experienceYears: 15,
      consultationFee: 100,
      availabilityStatus: 'AVAILABLE'
    }
  },
  {
    email: 'james@medpulse.com',
    name: 'Dr. James Wilson',
    role: 'DOCTOR',
    password: 'MedPulse@123',
    phone: '333-3333',
    profile: {
      specialization: 'Oncologist',
      department: 'Oncology',
      experienceYears: 18,
      consultationFee: 150,
      availabilityStatus: 'AVAILABLE'
    }
  },
  {
    email: 'patient1@medpulse.com',
    name: 'Patient One',
    role: 'PATIENT',
    password: 'MedPulse@123',
    phone: '444-4441',
    patientProfile: {
      gender: 'MALE',
      bloodGroup: 'O+',
      emergencyContact: '123-456-7890'
    }
  },
  {
    email: 'patient2@medpulse.com',
    name: 'Patient Two',
    role: 'PATIENT',
    password: 'MedPulse@123',
    phone: '444-4442',
    patientProfile: {
      gender: 'FEMALE',
      bloodGroup: 'A-',
      emergencyContact: '987-654-3210'
    }
  }
];

async function seed() {
  console.log('Seeding specific demo accounts...');

  for (const account of accountsToCreate) {
    const existing = await prisma.user.findUnique({
      where: { email: account.email }
    });

    if (existing) {
      await prisma.user.delete({ where: { email: account.email } });
      console.log(`Deleted existing account ${account.email}`);
    }

    // Delete any existing user with the same exact name to avoid conflict, especially for doctors
    const existingName = await prisma.user.findFirst({
        where: { name: account.name, role: account.role }
    });
    if (existingName) {
        await prisma.user.delete({ where: { id: existingName.id } });
        console.log(`Deleted existing account with name ${account.name}`);
    }

    const passwordHash = await bcrypt.hash(account.password, 10);

    const userData = {
      email: account.email,
      name: account.name,
      passwordHash,
      role: account.role,
      phone: account.phone,
      isActive: true
    };

    if (account.role === 'DOCTOR') {
      userData.doctorProfile = {
        create: account.profile
      };
    } else if (account.role === 'PATIENT') {
      userData.patientProfile = {
        create: account.patientProfile
      };
    }

    await prisma.user.create({ data: userData });
    console.log(`Successfully created account: ${account.email} (${account.role})`);
  }

  console.log('Demo accounts seeded successfully!');
}

seed().catch(console.error).finally(() => prisma.$disconnect());
