#!/usr/bin/env node

/**
 * This script resets the NextAuth state by clearing
 * temporary files and restarting the development server.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('📦 Resetting NextAuth state...');

// Check for .next directory
const nextDir = path.join(__dirname, '..', '.next');
if (fs.existsSync(nextDir)) {
    console.log('🗑️  Removing .next directory...');
    try {
        if (process.platform === 'win32') {
            // Windows requires a different command for recursive deletion
            execSync(`rmdir /s /q "${nextDir}"`, { stdio: 'inherit' });
        } else {
            execSync(`rm -rf "${nextDir}"`, { stdio: 'inherit' });
        }
        console.log('✅ .next directory removed successfully.');
    } catch (error) {
        console.error('❌ Failed to remove .next directory:', error.message);
    }
}

// Generate Prisma client
console.log('🔄 Generating Prisma client...');
try {
    execSync('npx prisma generate', { stdio: 'inherit' });
    console.log('✅ Prisma client generated successfully.');
} catch (error) {
    console.error('❌ Failed to generate Prisma client:', error.message);
}

// Restart the development server
console.log('🚀 Starting development server...');
console.log('---------------------------------------');
console.log('Open http://localhost:3000/auth/test to test authentication');
console.log('Login, then try accessing http://localhost:3000/dashboard');
console.log('---------------------------------------');

try {
    execSync('npm run dev', { stdio: 'inherit' });
} catch (error) {
    // This will execute if the user terminates the dev server
    console.log('🛑 Development server stopped.');
} 