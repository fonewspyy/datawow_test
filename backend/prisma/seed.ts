import { PrismaClient, Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const adminPassword = await bcrypt.hash('admin123', 10);
  const userPassword = await bcrypt.hash('user1234', 10);

  await prisma.user.upsert({
    where: { username: 'admin' },
    update: {
      password: adminPassword,
      role: Role.ADMIN,
    },
    create: {
      username: 'admin',
      password: adminPassword,
      role: Role.ADMIN,
    },
  });

  await prisma.user.upsert({
    where: { username: 'sarajohn' },
    update: {
      password: userPassword,
      role: Role.USER,
    },
    create: {
      username: 'sarajohn',
      password: userPassword,
      role: Role.USER,
    },
  });

  const existingConcerts = await prisma.concert.count();

  if (existingConcerts === 0) {
    await prisma.concert.createMany({
      data: [
        {
          name: 'Concert Name 1',
          description:
            'Lorem ipsum dolor sit amet consectetur. Elit purus nam gravida porttitor nibh urna sit ornare a. Proin dolor morbi id ornare aenean non. Fusce dignissim turpis sed non est orci sed in.',
          totalSeats: 500,
        },
        {
          name: 'Concert Name 2',
          description:
            'Lorem ipsum dolor sit amet consectetur. Elit purus nam gravida porttitor nibh urna sit ornare a. Proin dolor morbi id ornare aenean non. Fusce dignissim turpis sed non est orci sed in.',
          totalSeats: 200,
        },
      ],
    });
  }
}

main()
  .catch(async (error) => {
    console.error(error);
    process.exitCode = 1;
    await prisma.$disconnect();
  })
  .finally(async () => {
    await prisma.$disconnect();
  });