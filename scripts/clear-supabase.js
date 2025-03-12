const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
    datasources: {
        db: {
            url: "postgres://postgres.sfrafxfmasyrtqfuztlz:xr4VHrejbXQBE1lA@aws-0-us-east-1.pooler.supabase.com:5432/postgres?sslmode=require"
        }
    }
});

async function clearData() {
    try {
        console.log('Clearing Supabase data...\n');

        // Delete in correct order to respect foreign key constraints
        console.log('Clearing Word Usage...');
        await prisma.wordUsage.deleteMany();

        console.log('Clearing Scheduled Posts...');
        await prisma.scheduledPost.deleteMany();

        console.log('Clearing Quizzes...');
        await prisma.quiz.deleteMany();

        console.log('Clearing Sessions...');
        await prisma.session.deleteMany();

        console.log('Clearing Users...');
        await prisma.user.deleteMany();

        console.log('Clearing Templates...');
        await prisma.template.deleteMany();

        console.log('Clearing Auto Schedule Slots...');
        await prisma.autoScheduleSlot.deleteMany();

        console.log('Clearing Settings...');
        await prisma.settings.deleteMany();

        console.log('Clearing Facebook Settings...');
        await prisma.facebookSettings.deleteMany();

        console.log('\n✨ All data cleared successfully!');

    } catch (error) {
        console.error('Error during clearing:', error);
        throw error;
    } finally {
        await prisma.$disconnect();
    }
}

// Run the clear operation
clearData()
    .catch((error) => {
        console.error('Clear operation failed:', error);
        process.exit(1);
    }); 