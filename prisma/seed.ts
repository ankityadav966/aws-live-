import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');
  
  await prisma.todo.deleteMany({});
  
  await prisma.todo.createMany({
    data: [
      {
        title: 'Complete Todo Application',
        description: 'Finish the full-stack todo application using React, Node.js, and Prisma.',
        completed: false,
        priority: 'HIGH',
      },
      {
        title: 'Review PRs',
        description: 'Review pending pull requests on GitHub.',
        completed: false,
        priority: 'MEDIUM',
      },
      {
        title: 'Buy Groceries',
        description: 'Milk, Eggs, Bread, Vegetables.',
        completed: true,
        priority: 'LOW',
      }
    ]
  });

  console.log('Demo todos created!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
