import { PrismaClient } from '@prisma/client';
import { modernWordle, darkWordle, gradientWordle } from './templates/wordle';
import { modernSequence, darkSequence, gradientSequence } from './templates/sequence';
import { modernRhyme, darkRhyme, gradientRhyme } from './templates/rhyme';
import { modernConcept, darkConcept, gradientConcept } from './templates/concept';

const prisma = new PrismaClient();

async function main() {
  // Clean up existing data
  console.log('Cleaning up existing data...');
  await prisma.quiz.deleteMany();
  await prisma.template.deleteMany();

  // Create templates
  console.log('Creating new templates...');
  await prisma.template.createMany({
    data: [
      // Wordle templates
      modernWordle,
      darkWordle,
      gradientWordle,

      // Number Sequence templates
      modernSequence,
      darkSequence,
      gradientSequence,

      // Rhyme Time templates
      modernRhyme,
      darkRhyme,
      gradientRhyme,

      // Concept Connection templates
      modernConcept,
      darkConcept,
      gradientConcept,
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