const { PrismaClient } = require('@prisma/client');

// Create two Prisma clients - one for local and one for Supabase
const localPrisma = new PrismaClient({
    datasources: {
        db: {
            url: "postgresql://said:@localhost:5432/fbquiz"
        }
    }
});

const supabasePrisma = new PrismaClient({
    datasources: {
        db: {
            url: "postgres://postgres.sfrafxfmasyrtqfuztlz:xr4VHrejbXQBE1lA@aws-0-us-east-1.pooler.supabase.com:5432/postgres?sslmode=require"
        }
    }
});

async function transferData() {
    try {
        console.log('Starting data transfer...\n');

        // Transfer Templates
        console.log('Transferring Templates...');
        const templates = await localPrisma.template.findMany();
        for (const template of templates) {
            await supabasePrisma.template.create({
                data: template
            });
        }
        console.log(`✅ Transferred ${templates.length} templates`);

        // Transfer Users
        console.log('\nTransferring Users...');
        const users = await localPrisma.user.findMany();
        for (const user of users) {
            await supabasePrisma.user.create({
                data: user
            });
        }
        console.log(`✅ Transferred ${users.length} users`);

        // Transfer Sessions
        console.log('\nTransferring Sessions...');
        const sessions = await localPrisma.session.findMany();
        for (const session of sessions) {
            await supabasePrisma.session.create({
                data: session
            });
        }
        console.log(`✅ Transferred ${sessions.length} sessions`);

        // Transfer Quizzes
        console.log('\nTransferring Quizzes...');
        const quizzes = await localPrisma.quiz.findMany();
        for (const quiz of quizzes) {
            await supabasePrisma.quiz.create({
                data: quiz
            });
        }
        console.log(`✅ Transferred ${quizzes.length} quizzes`);

        // Transfer ScheduledPosts
        console.log('\nTransferring Scheduled Posts...');
        const scheduledPosts = await localPrisma.scheduledPost.findMany();
        for (const post of scheduledPosts) {
            await supabasePrisma.scheduledPost.create({
                data: post
            });
        }
        console.log(`✅ Transferred ${scheduledPosts.length} scheduled posts`);

        // Transfer AutoScheduleSlots
        console.log('\nTransferring Auto Schedule Slots...');
        const slots = await localPrisma.autoScheduleSlot.findMany();
        for (const slot of slots) {
            await supabasePrisma.autoScheduleSlot.create({
                data: slot
            });
        }
        console.log(`✅ Transferred ${slots.length} auto schedule slots`);

        // Transfer Settings
        console.log('\nTransferring Settings...');
        const settings = await localPrisma.settings.findMany();
        for (const setting of settings) {
            await supabasePrisma.settings.create({
                data: setting
            });
        }
        console.log(`✅ Transferred ${settings.length} settings`);

        // Transfer Facebook Settings
        console.log('\nTransferring Facebook Settings...');
        const fbSettings = await localPrisma.facebookSettings.findMany();
        for (const setting of fbSettings) {
            await supabasePrisma.facebookSettings.create({
                data: setting
            });
        }
        console.log(`✅ Transferred ${fbSettings.length} Facebook settings`);

        // Transfer Word Usage
        console.log('\nTransferring Word Usage...');
        const wordUsage = await localPrisma.wordUsage.findMany();
        for (const usage of wordUsage) {
            await supabasePrisma.wordUsage.create({
                data: usage
            });
        }
        console.log(`✅ Transferred ${wordUsage.length} word usage records`);

        console.log('\n✨ Data transfer completed successfully!');

    } catch (error) {
        console.error('Error during transfer:', error);
        throw error;
    } finally {
        await localPrisma.$disconnect();
        await supabasePrisma.$disconnect();
    }
}

// Run the transfer
transferData()
    .catch((error) => {
        console.error('Transfer failed:', error);
        process.exit(1);
    }); 