import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const regions = [
    'Klagenfurt Nord',
    'Klagenfurt West',
    'Klagenfurt Ost',
    'Klagenfurt Süd',
  ];

  for (const name of regions) {
    await prisma.region.upsert({
      where: { name },
      update: {},
      create: { name },
    });
  }
}

main()
  .finally(async () => prisma.$disconnect());
