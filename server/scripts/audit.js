import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function checkDoctors() {
  const allUsers = await prisma.user.findMany({ 
    where: { role: 'DOCTOR' }, 
    include: { doctorProfile: true }
  });
  console.log(`Total DOCTOR users: ${allUsers.length}`);

  const byName = {};
  allUsers.forEach(u => {
    byName[u.name] = byName[u.name] || [];
    byName[u.name].push(u);
  });

  const duplicateNames = Object.keys(byName).filter(n => byName[n].length > 1);
  console.log(`Names with duplicates: ${duplicateNames.length}`);
  if (duplicateNames.length > 0) {
    duplicateNames.forEach(n => console.log(`${n}: ${byName[n].length} records`));
  }
}

checkDoctors().catch(console.error).finally(() => prisma.$disconnect());
