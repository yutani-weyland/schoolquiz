#!/usr/bin/env node

/**
 * Sync .env.local from project root to apps/admin/.env.local
 * This ensures Next.js can find environment variables
 */

const fs = require('fs');
const path = require('path');

const rootEnvPath = path.join(__dirname, '..', '.env.local');
const adminEnvPath = path.join(__dirname, '..', 'apps', 'admin', '.env.local');

function syncEnvFile() {
  if (!fs.existsSync(rootEnvPath)) {
    console.log('⚠️  No .env.local found in project root');
    console.log('   Create it from env.local.example if needed');
    return;
  }

  // Read root .env.local
  const envContent = fs.readFileSync(rootEnvPath, 'utf-8');

  // Write to admin directory
  fs.writeFileSync(adminEnvPath, envContent, 'utf-8');
  
  console.log('✅ Synced .env.local to apps/admin/.env.local');
}

syncEnvFile();







