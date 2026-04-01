import { PrismaClient } from '@prisma/client';
import { hashPassword } from '../src/lib/auth/password';

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await hashPassword('Shipstack123');

  const devUser = await prisma.user.upsert({
    where: { email: 'dev@shipstack.local' },
    update: {
      name: 'Dev User',
      passwordHash,
      role: 'ADMIN',
      isActive: true,
    },
    create: {
      email: 'dev@shipstack.local',
      name: 'Dev User',
      passwordHash,
      role: 'ADMIN',
      isActive: true,
    },
  });

  console.log('Created dev user:', devUser.id);
  console.log('Dev login email: dev@shipstack.local');
  console.log('Dev login password: Shipstack123');
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
