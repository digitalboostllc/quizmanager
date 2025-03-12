require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

console.log('Testing environment variables...\n');

// Database URLs
console.log('Database URLs:');
console.log('DATABASE_URL:', process.env.DATABASE_URL);
console.log('POSTGRES_PRISMA_URL:', process.env.POSTGRES_PRISMA_URL);
console.log('POSTGRES_URL:', process.env.POSTGRES_URL);
console.log('POSTGRES_URL_NON_POOLING:', process.env.POSTGRES_URL_NON_POOLING);

// Supabase Configuration
console.log('\nSupabase Configuration:');
console.log('SUPABASE_URL:', process.env.SUPABASE_URL);
console.log('NEXT_PUBLIC_SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL);
console.log('SUPABASE_JWT_SECRET exists:', !!process.env.SUPABASE_JWT_SECRET);
console.log('NEXT_PUBLIC_SUPABASE_ANON_KEY exists:', !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
console.log('SUPABASE_SERVICE_ROLE_KEY exists:', !!process.env.SUPABASE_SERVICE_ROLE_KEY);

// Test Supabase Connection
const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function testSupabaseConnection() {
    try {
        const { data, error } = await supabase.auth.getSession();
        if (error) {
            console.log('\nSupabase Connection Test: FAILED');
            console.log('Error:', error.message);
        } else {
            console.log('\nSupabase Connection Test: SUCCESS');
        }
    } catch (err) {
        console.log('\nSupabase Connection Test: FAILED');
        console.log('Error:', err.message);
    }
}

// Blob Storage
console.log('\nBlob Storage:');
console.log('BLOB_READ_WRITE_TOKEN exists:', !!process.env.BLOB_READ_WRITE_TOKEN);

// Next.js Configuration
console.log('\nNext.js Configuration:');
console.log('NEXT_PUBLIC_APP_URL:', process.env.NEXT_PUBLIC_APP_URL);
console.log('NEXTAUTH_URL:', process.env.NEXTAUTH_URL);
console.log('NEXTAUTH_SECRET exists:', !!process.env.NEXTAUTH_SECRET);

testSupabaseConnection(); 