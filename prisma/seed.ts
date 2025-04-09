import { PrismaClient } from '@prisma/client';
import { darkConcept, gradientConcept, modernConcept } from './templates/concept';
import { darkRhyme, gradientRhyme, modernRhyme } from './templates/rhyme';
import { darkSequence, gradientSequence, modernSequence } from './templates/sequence';
import { darkWordle, gradientWordle, modernWordle } from './templates/wordle';

const prisma = new PrismaClient();

async function main() {
  // Clean up existing data
  console.log('Cleaning up existing data...');
  await prisma.quiz.deleteMany();
  await prisma.template.deleteMany();

  // Find or create a default user
  console.log('Finding or creating default user...');
  const defaultUser = await prisma.user.findFirst({
    where: { role: 'ADMIN' }
  });

  let userId: string;

  if (defaultUser) {
    userId = defaultUser.id;
    console.log(`Using existing user: ${defaultUser.email}`);
  } else {
    // Create a default admin user if none exists
    const newUser = await prisma.user.create({
      data: {
        name: 'Admin User',
        email: 'admin@example.com',
        role: 'ADMIN'
      }
    });
    userId = newUser.id;
    console.log(`Created new admin user with ID: ${userId}`);
  }

  // Create templates
  console.log('Creating new templates...');
  await prisma.template.createMany({
    data: [
      // Wordle templates
      { ...modernWordle, userId },
      { ...darkWordle, userId },
      { ...gradientWordle, userId },

      // Number Sequence templates
      { ...modernSequence, userId },
      { ...darkSequence, userId },
      { ...gradientSequence, userId },

      // Rhyme Time templates
      { ...modernRhyme, userId },
      { ...darkRhyme, userId },
      { ...gradientRhyme, userId },

      // Concept Connection templates
      { ...modernConcept, userId },
      { ...darkConcept, userId },
      { ...gradientConcept, userId },
    ],
  });

  console.log('Database seeded successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 