import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const devUser = await prisma.user.upsert({
    where: { email: 'dev@ai-startup-builder.local' },
    update: {},
    create: {
      email: 'dev@ai-startup-builder.local',
      name: 'Dev User',
      sessionId: 'sess_dev_local_12345',
    },
  });

  console.log('Created dev user:', devUser.id);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error('Seed error:', error);
    await prisma.$disconnect();
    process.exit(1);
  });
