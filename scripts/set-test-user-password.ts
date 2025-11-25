/**
 * Set password for test user created by RESET_TEST_DATA.sql
 * This properly hashes the password using bcrypt
 * 
 * Usage: cd packages/db && pnpm tsx ../../scripts/set-test-user-password.ts
 */

import { config } from 'dotenv'
import { resolve } from 'path'
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

// Load environment variables (same as other db scripts)
config({ path: resolve(process.cwd(), '../../apps/admin/.env.local') })
config({ path: resolve(process.cwd(), '../../.env.local') })

const prisma = new PrismaClient()

const SALT_ROUNDS = 12
const TEST_PASSWORD = 'abc123'

async function main() {
  console.log('🔐 Setting password for test user...')

  try {
    // Find the test user
    const user = await prisma.user.findUnique({
      where: { email: 'premium@test.com' },
    })

    if (!user) {
      console.error('❌ Test user not found: premium@test.com')
      console.error('   Please run scripts/RESET_TEST_DATA.sql first')
      process.exit(1)
    }

    // Hash password using bcrypt
    console.log('🔒 Hashing password...')
    const passwordHash = await bcrypt.hash(TEST_PASSWORD, SALT_ROUNDS)

    // Update user
    console.log('💾 Updating user...')
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash },
    })

    console.log('✅ Password set successfully!')
    console.log('')
    console.log('📝 User details:')
    console.log(`   ID: ${updatedUser.id}`)
    console.log(`   Email: ${updatedUser.email}`)
    console.log(`   Name: ${updatedUser.name || 'N/A'}`)
    console.log(`   Tier: ${updatedUser.tier}`)
    console.log(`   Subscription Status: ${updatedUser.subscriptionStatus}`)
    console.log(`   Has password: ${updatedUser.passwordHash ? 'Yes' : 'No'}`)
    console.log('')
    console.log('🎉 You can now sign in with:')
    console.log(`   Email: premium@test.com`)
    console.log(`   Password: ${TEST_PASSWORD}`)
  } catch (error) {
    console.error('❌ Failed to set password:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

main()

