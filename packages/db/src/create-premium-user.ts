import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('👑 Creating premium user...')

  // Check if premium user already exists
  const existingUser = await prisma.user.findUnique({
    where: { email: 'premium@example.com' }
  })

  if (existingUser) {
    console.log('⚠️  Premium user already exists, updating to premium tier...')
    
    const updatedUser = await prisma.user.update({
      where: { id: existingUser.id },
      data: {
        tier: 'premium',
        subscriptionStatus: 'ACTIVE',
        subscriptionPlan: 'PREMIUM_MONTHLY',
        name: 'Premium User',
      },
    })
    
    console.log('✅ Updated user to premium:', {
      id: updatedUser.id,
      email: updatedUser.email,
      name: updatedUser.name,
      tier: updatedUser.tier,
      subscriptionStatus: updatedUser.subscriptionStatus,
    })
  } else {
    // Create new premium user
    const premiumUser = await prisma.user.create({
      data: {
        email: 'premium@example.com',
        name: 'Premium User',
        tier: 'premium',
        subscriptionStatus: 'ACTIVE',
        subscriptionPlan: 'PREMIUM_MONTHLY',
        emailVerified: true,
        signupMethod: 'email',
      },
    })

    console.log('✅ Created premium user:', {
      id: premiumUser.id,
      email: premiumUser.email,
      name: premiumUser.name,
      tier: premiumUser.tier,
      subscriptionStatus: premiumUser.subscriptionStatus,
    })
  }

  console.log('')
  console.log('📝 Login credentials:')
  console.log('   Email: premium@example.com')
  console.log('   Password: abc123 (if using mock auth)')
  console.log('')
  console.log('🎉 Premium user setup complete!')
}

main()
  .catch((e) => {
    console.error('❌ Failed to create premium user:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

