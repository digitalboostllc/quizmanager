require('dotenv').config({ path: '.env.local' });

// Construct the Supabase connection URL
const supabaseConnectionString = `postgres://postgres.sfrafxfmasyrtqfuztlz:xr4VHrejbXQBE1lA@aws-0-us-east-1.pooler.supabase.com:5432/postgres?sslmode=require`;

// Temporarily override the DATABASE_URL
process.env.DATABASE_URL = supabaseConnectionString;

console.log('Migration environment prepared.');
console.log('Database URL set to Supabase connection.');
console.log('\nYou can now run:');
console.log('npx prisma migrate deploy');
console.log('\nThis will apply all existing migrations to Supabase.'); 