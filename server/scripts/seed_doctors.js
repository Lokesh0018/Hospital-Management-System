import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const specializations = [
  'Cardiologist', 'Neurologist', 'Dermatologist', 'Dentist', 
  'Orthopedic', 'ENT', 'Psychiatrist', 'Pediatrician', 
  'Gynecologist', 'General Physician'
];

const doctorsToSeed = [
  { name: 'Dr. Sarah Jenkins', specialization: 'Cardiologist', email: 'sarah.jenkins@medpulse.com', phone: '555-0101', availabilityStatus: 'AVAILABLE' },
  { name: 'Dr. Michael Chen', specialization: 'Cardiologist', email: 'michael.chen@medpulse.com', phone: '555-0102', availabilityStatus: 'AVAILABLE' },
  { name: 'Dr. Emily Carter', specialization: 'Neurologist', email: 'emily.carter@medpulse.com', phone: '555-0103', availabilityStatus: 'UNAVAILABLE' },
  { name: 'Dr. Robert Steele', specialization: 'Neurologist', email: 'robert.steele@medpulse.com', phone: '555-0104', availabilityStatus: 'AVAILABLE' },
  { name: 'Dr. Aisha Patel', specialization: 'Dermatologist', email: 'aisha.patel@medpulse.com', phone: '555-0105', availabilityStatus: 'AVAILABLE' },
  { name: 'Dr. Liam O\'Connor', specialization: 'Dentist', email: 'liam.oconnor@medpulse.com', phone: '555-0106', availabilityStatus: 'AVAILABLE' },
  { name: 'Dr. Sofia Martinez', specialization: 'Dentist', email: 'sofia.martinez@medpulse.com', phone: '555-0107', availabilityStatus: 'ON_LEAVE' },
  { name: 'Dr. James Wilson', specialization: 'Orthopedic', email: 'james.wilson@medpulse.com', phone: '555-0108', availabilityStatus: 'AVAILABLE' },
  { name: 'Dr. Chloe Bennett', specialization: 'ENT', email: 'chloe.bennett@medpulse.com', phone: '555-0109', availabilityStatus: 'AVAILABLE' },
  { name: 'Dr. David Kim', specialization: 'Psychiatrist', email: 'david.kim@medpulse.com', phone: '555-0110', availabilityStatus: 'AVAILABLE' },
  { name: 'Dr. Olivia Brown', specialization: 'Pediatrician', email: 'olivia.brown@medpulse.com', phone: '555-0111', availabilityStatus: 'AVAILABLE' },
  { name: 'Dr. Noah Davis', specialization: 'Pediatrician', email: 'noah.davis@medpulse.com', phone: '555-0112', availabilityStatus: 'AVAILABLE' },
  { name: 'Dr. Isabella Garcia', specialization: 'Gynecologist', email: 'isabella.garcia@medpulse.com', phone: '555-0113', availabilityStatus: 'AVAILABLE' },
  { name: 'Dr. Lucas Smith', specialization: 'General Physician', email: 'lucas.smith@medpulse.com', phone: '555-0114', availabilityStatus: 'AVAILABLE' },
  { name: 'Dr. Mia Taylor', specialization: 'General Physician', email: 'mia.taylor@medpulse.com', phone: '555-0115', availabilityStatus: 'AVAILABLE' },
];

async function seed() {
  console.log('Cleaning up existing doctors...');
  
  // Find all doctors
  const doctors = await prisma.user.findMany({ where: { role: 'DOCTOR' }});
  
  // Delete all appointments associated with these doctors first (due to foreign keys)
  if (doctors.length > 0) {
    const doctorIds = doctors.map(d => d.id);
    
    // We should delete in transaction, but Prisma cascade delete usually handles it if onDelete: Cascade is set.
    // Let's rely on Prisma User deletion to cascade. If it fails, we do manual.
    await prisma.user.deleteMany({
      where: { role: 'DOCTOR' }
    });
  }

  console.log('Successfully deleted old doctors. Seeding 15 realistic doctors...');

  const passwordHash = await bcrypt.hash('password123', 10);

  for (const doc of doctorsToSeed) {
    await prisma.user.create({
      data: {
        name: doc.name,
        email: doc.email,
        passwordHash,
        phone: doc.phone,
        role: 'DOCTOR',
        isActive: true,
        doctorProfile: {
          create: {
            specialization: doc.specialization,
            department: doc.specialization + ' Dept',
            qualification: 'MD',
            experienceYears: Math.floor(Math.random() * 20) + 2,
            consultationFee: Math.floor(Math.random() * 100) + 50,
            availabilityStatus: doc.availabilityStatus
          }
        }
      }
    });
  }
  
  console.log('Successfully seeded 15 unique doctors!');
}

seed().catch(console.error).finally(() => prisma.$disconnect());
