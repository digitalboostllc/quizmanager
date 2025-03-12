import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkQuizzes() {
  try {
    const quizzes = await prisma.quiz.findMany({
      include: {
        template: true,
      },
    });

    console.log('Fetched quizzes from the database:', JSON.stringify(quizzes, null, 2));
  } catch (error) {
    console.error('Error fetching quizzes:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkQuizzes(); 