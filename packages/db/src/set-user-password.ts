/**
 * Script to set a password for an existing user
 * 
 * Usage:
 *   pnpm tsx packages/db/src/set-user-password.ts <email> <password>
 * 
 * Example:
 *   pnpm tsx packages/db/src/set-user-password.ts andrew@example.com abc123
 */

// Load environment variables from .env.local
import { config } from 'dotenv'
import { resolve } from 'path'

// Try to load from root .env.local first, then apps/admin/.env.local
config({ path: resolve(process.cwd(), '../../.env.local') })
config({ path: resolve(process.cwd(), '../../apps/admin/.env.local') })

import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  const email = process.argv[2]
  const password = process.argv[3]

  if (!email || !password) {
    console.error('❌ Usage: pnpm tsx packages/db/src/set-user-password.ts <email> <password>')
    console.error('   Example: pnpm tsx packages/db/src/set-user-password.ts andrew@example.com abc123')
    process.exit(1)
  }

  console.log(`🔐 Setting password for user: ${email}`)

  // Find user
  const user = await prisma.user.findUnique({
    where: { email: email.toLowerCase().trim() },
  })

  if (!user) {
    console.error(`❌ User not found: ${email}`)
    process.exit(1)
  }

  // Hash password using bcrypt
  console.log('🔒 Hashing password...')
  const SALT_ROUNDS = 12
  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS)

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
  console.log(`   Has password: ${updatedUser.passwordHash ? 'Yes' : 'No'}`)
  console.log('')
  console.log('🎉 You can now sign in with:')
  console.log(`   Email: ${email}`)
  console.log(`   Password: ${password}`)
}

main()
  .catch((e) => {
    console.error('❌ Failed to set password:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

