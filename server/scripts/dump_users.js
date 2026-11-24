import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany({
    include: {
      doctorProfile: true,
      patientProfile: true
    }
  });

  console.log("Total users:", users.length);
  for (const user of users) {
    console.log(`- ${user.email} | Role: ${user.role} | HasDocProf: ${!!user.doctorProfile} | HasPatProf: ${!!user.patientProfile} | PassHash: ${user.passwordHash.substring(0, 10)}...`);
  }
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
