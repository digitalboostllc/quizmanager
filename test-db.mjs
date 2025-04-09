import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    try {
        console.log('Attempting to connect to the database...');

        // Test connection with a simple query
        const templateCount = await prisma.template.count();

        console.log(`✅ Successfully connected to database!`);
        console.log(`Found ${templateCount} templates`);

        if (templateCount > 0) {
            // Fetch a sample template
            const template = await prisma.template.findFirst();
            console.log('Sample template:', template);
        }

    } catch (error) {
        console.error('❌ Database connection failed:');
        console.error(error);
    } finally {
        await prisma.$disconnect();
    }
}

main(); 