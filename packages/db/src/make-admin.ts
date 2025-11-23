/**
 * Quick script to make a user a platform admin
 * Usage: 
 *   tsx src/make-admin.ts <email>
 *   or
 *   tsx src/make-admin.ts <email> --create
 * 
 * If --create flag is used, it will create the user if they don't exist
 */

import { PrismaClient } from '@prisma/client'

// Check if DATABASE_URL is set
if (!process.env.DATABASE_URL) {
  console.error('❌ DATABASE_URL is not set!')
  console.error('Please set DATABASE_URL in your environment or .env.local file')
  process.exit(1)
}

const prisma = new PrismaClient()

async function main() {
  const email = process.argv[2]
  const shouldCreate = process.argv.includes('--create')

  if (!email) {
    console.error('❌ Please provide an email address')
    console.error('Usage: tsx src/make-admin.ts <email> [--create]')
    console.error('Example: tsx src/make-admin.ts user@example.com')
    console.error('Example: tsx src/make-admin.ts user@example.com --create')
    process.exit(1)
  }

  try {
    // Try to find existing user
    let user = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    })

    if (!user) {
      if (shouldCreate) {
        console.log(`📝 Creating new user: ${email}`)
        user = await prisma.user.create({
          data: {
            email: email.toLowerCase().trim(),
            name: 'Admin User',
            tier: 'premium',
            platformRole: 'PLATFORM_ADMIN',
            subscriptionStatus: 'ACTIVE',
            emailVerified: true,
          },
        })
        console.log('✅ Created user and set as Platform Admin!')
        console.log(`   User ID: ${user.id}`)
        console.log(`   Email: ${user.email}`)
        console.log(`   Role: ${user.platformRole}`)
      } else {
        console.error(`❌ User with email ${email} not found`)
        console.error('   Use --create flag to create the user:')
        console.error(`   tsx src/make-admin.ts ${email} --create`)
        process.exit(1)
      }
    } else {
      // Update existing user
      console.log(`📝 Found user: ${user.email}`)
      user = await prisma.user.update({
        where: { id: user.id },
        data: {
          platformRole: 'PLATFORM_ADMIN',
          tier: 'premium', // Also set to premium
          subscriptionStatus: 'ACTIVE',
        },
      })
      console.log('✅ Updated user to Platform Admin!')
      console.log(`   User ID: ${user.id}`)
      console.log(`   Email: ${user.email}`)
      console.log(`   Role: ${user.platformRole}`)
    }

    console.log('\n🎉 Success! You can now access /admin with this account')
    console.log('   Make sure you are signed in with this email address')
  } catch (error: any) {
    console.error('❌ Error:', error.message)
    if (error.code === 'P2002') {
      console.error('   This email is already in use')
    }
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

main()

