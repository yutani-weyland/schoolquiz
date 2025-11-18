import { PrismaClient } from '@prisma/client'

// Check if DATABASE_URL is set
if (!process.env.DATABASE_URL) {
  console.error('❌ DATABASE_URL is not set!')
  console.error('Please set DATABASE_URL in your environment or .env.local file')
  console.error('Example: DATABASE_URL=postgresql://user:password@localhost:5432/dbname')
  process.exit(1)
}

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting admin seed data...')

  // Create Platform Admin user
  const platformAdmin = await prisma.user.upsert({
    where: { email: 'admin@schoolquiz.com' },
    update: {},
    create: {
      email: 'admin@schoolquiz.com',
      name: 'Platform Admin',
      tier: 'premium',
      platformRole: 'PLATFORM_ADMIN',
      subscriptionStatus: 'ACTIVE',
      emailVerified: true,
      lastLoginAt: new Date(),
    },
  })
  console.log('✅ Created platform admin:', platformAdmin.email)

  // Create Org Admin user
  const orgAdmin = await prisma.user.upsert({
    where: { email: 'orgadmin@example.com' },
    update: {},
    create: {
      email: 'orgadmin@example.com',
      name: 'Organisation Admin',
      tier: 'premium',
      platformRole: 'ORG_ADMIN',
      subscriptionStatus: 'ACTIVE',
      emailVerified: true,
      lastLoginAt: new Date(),
    },
  })
  console.log('✅ Created org admin:', orgAdmin.email)

  // Create Teacher users
  const teacher1 = await prisma.user.upsert({
    where: { email: 'teacher1@melbournehigh.edu.au' },
    update: {},
    create: {
      email: 'teacher1@melbournehigh.edu.au',
      name: 'Sarah Johnson',
      tier: 'premium',
      platformRole: 'TEACHER',
      subscriptionStatus: 'ACTIVE',
      emailVerified: true,
      lastLoginAt: new Date(),
    },
  })

  const teacher2 = await prisma.user.upsert({
    where: { email: 'teacher2@melbournehigh.edu.au' },
    update: {},
    create: {
      email: 'teacher2@melbournehigh.edu.au',
      name: 'Michael Chen',
      tier: 'basic',
      platformRole: 'TEACHER',
      subscriptionStatus: 'FREE_TRIAL',
      emailVerified: true,
      lastLoginAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
    },
  })

  const teacher3 = await prisma.user.upsert({
    where: { email: 'teacher3@sydneygrammar.edu.au' },
    update: {},
    create: {
      email: 'teacher3@sydneygrammar.edu.au',
      name: 'Emma Wilson',
      tier: 'premium',
      platformRole: 'TEACHER',
      subscriptionStatus: 'ACTIVE',
      emailVerified: true,
      lastLoginAt: new Date(),
    },
  })

  const teacher4 = await prisma.user.upsert({
    where: { email: 'teacher4@brisbanegrammar.edu.au' },
    update: {},
    create: {
      email: 'teacher4@brisbanegrammar.edu.au',
      name: 'David Brown',
      tier: 'basic',
      platformRole: 'TEACHER',
      subscriptionStatus: 'EXPIRED',
      emailVerified: true,
      lastLoginAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
    },
  })
  console.log('✅ Created teachers')

  // Create Student users
  const student1 = await prisma.user.upsert({
    where: { email: 'student1@melbournehigh.edu.au' },
    update: {},
    create: {
      email: 'student1@melbournehigh.edu.au',
      name: 'Alex Smith',
      tier: 'basic',
      platformRole: 'STUDENT',
      subscriptionStatus: 'FREE_TRIAL',
      emailVerified: true,
      lastLoginAt: new Date(),
    },
  })

  const student2 = await prisma.user.upsert({
    where: { email: 'student2@melbournehigh.edu.au' },
    update: {},
    create: {
      email: 'student2@melbournehigh.edu.au',
      name: 'Jordan Taylor',
      tier: 'basic',
      platformRole: 'STUDENT',
      subscriptionStatus: 'FREE_TRIAL',
      emailVerified: true,
      lastLoginAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
    },
  })
  console.log('✅ Created students')

  // Create Parent user
  const parent1 = await prisma.user.upsert({
    where: { email: 'parent1@example.com' },
    update: {},
    create: {
      email: 'parent1@example.com',
      name: 'Jennifer Smith',
      tier: 'basic',
      platformRole: 'PARENT',
      subscriptionStatus: 'FREE_TRIAL',
      emailVerified: true,
      lastLoginAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
    },
  })
  console.log('✅ Created parent')

  // Create Organisations
  const org1 = await prisma.organisation.upsert({
    where: { id: 'org-melbourne-high' },
    update: {},
    create: {
      id: 'org-melbourne-high',
      name: 'Melbourne High School',
      emailDomain: 'melbournehigh.edu.au',
      ownerUserId: teacher1.id,
      plan: 'ORG_ANNUAL',
      status: 'ACTIVE',
      maxSeats: 50,
      currentPeriodStart: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
      currentPeriodEnd: new Date(Date.now() + 335 * 24 * 60 * 60 * 1000), // 335 days from now
      stripeCustomerId: 'cus_melbournehigh123',
      stripeSubscriptionId: 'sub_melbournehigh123',
    },
  })

  const org2 = await prisma.organisation.upsert({
    where: { id: 'org-sydney-grammar' },
    update: {},
    create: {
      id: 'org-sydney-grammar',
      name: 'Sydney Grammar School',
      emailDomain: 'sydneygrammar.edu.au',
      ownerUserId: teacher3.id,
      plan: 'ORG_MONTHLY',
      status: 'ACTIVE',
      maxSeats: 30,
      currentPeriodStart: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000), // 10 days ago
      currentPeriodEnd: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000), // 20 days from now
      stripeCustomerId: 'cus_sydneygrammar123',
      stripeSubscriptionId: 'sub_sydneygrammar123',
    },
  })

  const org3 = await prisma.organisation.upsert({
    where: { id: 'org-brisbane-grammar' },
    update: {},
    create: {
      id: 'org-brisbane-grammar',
      name: 'Brisbane Grammar School',
      emailDomain: 'brisbanegrammar.edu.au',
      ownerUserId: teacher4.id,
      plan: 'ORG_MONTHLY',
      status: 'PAST_DUE',
      maxSeats: 25,
      currentPeriodStart: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000), // 60 days ago
      currentPeriodEnd: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago (expired)
      gracePeriodEnd: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000), // 10 days from now
      stripeCustomerId: 'cus_brisbanegrammar123',
      stripeSubscriptionId: 'sub_brisbanegrammar123',
    },
  })

  const org4 = await prisma.organisation.upsert({
    where: { id: 'org-trial-school' },
    update: {},
    create: {
      id: 'org-trial-school',
      name: 'Trial School',
      emailDomain: 'trialschool.edu.au',
      ownerUserId: orgAdmin.id,
      plan: 'INDIVIDUAL',
      status: 'TRIALING',
      maxSeats: 10,
      currentPeriodStart: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
      currentPeriodEnd: new Date(Date.now() + 25 * 24 * 60 * 60 * 1000), // 25 days from now
    },
  })
  console.log('✅ Created organisations')

  // Create Organisation Members
  // Melbourne High School members
  await prisma.organisationMember.upsert({
    where: {
      organisationId_userId: {
        organisationId: org1.id,
        userId: teacher1.id,
      },
    },
    update: {},
    create: {
      organisationId: org1.id,
      userId: teacher1.id,
      role: 'OWNER',
      status: 'ACTIVE',
      seatAssignedAt: new Date(),
    },
  })

  await prisma.organisationMember.upsert({
    where: {
      organisationId_userId: {
        organisationId: org1.id,
        userId: teacher2.id,
      },
    },
    update: {},
    create: {
      organisationId: org1.id,
      userId: teacher2.id,
      role: 'ADMIN',
      status: 'ACTIVE',
      seatAssignedAt: new Date(),
    },
  })

  await prisma.organisationMember.upsert({
    where: {
      organisationId_userId: {
        organisationId: org1.id,
        userId: student1.id,
      },
    },
    update: {},
    create: {
      organisationId: org1.id,
      userId: student1.id,
      role: 'TEACHER', // Students are members with TEACHER role in this system
      status: 'ACTIVE',
      seatAssignedAt: new Date(),
    },
  })

  await prisma.organisationMember.upsert({
    where: {
      organisationId_userId: {
        organisationId: org1.id,
        userId: student2.id,
      },
    },
    update: {},
    create: {
      organisationId: org1.id,
      userId: student2.id,
      role: 'TEACHER',
      status: 'ACTIVE',
      seatAssignedAt: new Date(),
    },
  })

  // Sydney Grammar School members
  await prisma.organisationMember.upsert({
    where: {
      organisationId_userId: {
        organisationId: org2.id,
        userId: teacher3.id,
      },
    },
    update: {},
    create: {
      organisationId: org2.id,
      userId: teacher3.id,
      role: 'OWNER',
      status: 'ACTIVE',
      seatAssignedAt: new Date(),
    },
  })

  // Brisbane Grammar School members
  await prisma.organisationMember.upsert({
    where: {
      organisationId_userId: {
        organisationId: org3.id,
        userId: teacher4.id,
      },
    },
    update: {},
    create: {
      organisationId: org3.id,
      userId: teacher4.id,
      role: 'OWNER',
      status: 'ACTIVE',
      seatAssignedAt: new Date(),
    },
  })

  // Trial School members
  await prisma.organisationMember.upsert({
    where: {
      organisationId_userId: {
        organisationId: org4.id,
        userId: orgAdmin.id,
      },
    },
    update: {},
    create: {
      organisationId: org4.id,
      userId: orgAdmin.id,
      role: 'OWNER',
      status: 'ACTIVE',
      seatAssignedAt: new Date(),
    },
  })
  console.log('✅ Created organisation members')

  // Create some activity logs
  await prisma.organisationActivity.createMany({
    data: [
      {
        organisationId: org1.id,
        userId: teacher1.id,
        type: 'MEMBER_ADDED',
        metadata: JSON.stringify({
          memberEmail: teacher2.email,
          memberName: teacher2.name,
        }),
      },
      {
        organisationId: org1.id,
        userId: teacher1.id,
        type: 'MEMBER_ROLE_CHANGED',
        metadata: JSON.stringify({
          memberEmail: teacher2.email,
          oldRole: 'TEACHER',
          newRole: 'ADMIN',
        }),
      },
      {
        organisationId: org2.id,
        userId: teacher3.id,
        type: 'LEADERBOARD_CREATED',
        metadata: JSON.stringify({
          leaderboardName: 'Year 10 Leaderboard',
        }),
      },
      {
        organisationId: org1.id,
        userId: teacher1.id,
        type: 'GROUP_CREATED',
        metadata: JSON.stringify({
          groupName: 'Year 10 Science',
          groupType: 'YEAR_GROUP',
        }),
      },
    ],
    skipDuplicates: true,
  })
  console.log('✅ Created activity logs')

  // Create some Organisation Groups
  const group1 = await prisma.organisationGroup.create({
    data: {
      organisationId: org1.id,
      name: 'Year 10',
      type: 'YEAR_GROUP',
      description: 'Year 10 students',
      createdByUserId: teacher1.id,
    },
  })

  const group2 = await prisma.organisationGroup.create({
    data: {
      organisationId: org1.id,
      name: 'Science Faculty',
      type: 'FACULTY',
      description: 'Science department',
      createdByUserId: teacher1.id,
    },
  })

  const group3 = await prisma.organisationGroup.create({
    data: {
      organisationId: org2.id,
      name: 'Year 11',
      type: 'YEAR_GROUP',
      description: 'Year 11 students',
      createdByUserId: teacher3.id,
    },
  })
  console.log('✅ Created organisation groups')

  // Add members to groups
  const member1 = await prisma.organisationMember.findUnique({
    where: {
      organisationId_userId: {
        organisationId: org1.id,
        userId: student1.id,
      },
    },
  })

  const member2 = await prisma.organisationMember.findUnique({
    where: {
      organisationId_userId: {
        organisationId: org1.id,
        userId: student2.id,
      },
    },
  })

  if (member1) {
    await prisma.organisationGroupMember.upsert({
      where: {
        organisationGroupId_organisationMemberId: {
          organisationGroupId: group1.id,
          organisationMemberId: member1.id,
        },
      },
      update: {},
      create: {
        organisationGroupId: group1.id,
        organisationMemberId: member1.id,
      },
    })
  }

  if (member2) {
    await prisma.organisationGroupMember.upsert({
      where: {
        organisationGroupId_organisationMemberId: {
          organisationGroupId: group1.id,
          organisationMemberId: member2.id,
        },
      },
      update: {},
      create: {
        organisationGroupId: group1.id,
        organisationMemberId: member2.id,
      },
    })
  }
  console.log('✅ Added members to groups')

  console.log('🎉 Admin seed data created successfully!')
  console.log('\n📋 Test Users:')
  console.log('  Platform Admin: admin@schoolquiz.com (PLATFORM_ADMIN)')
  console.log('  Org Admin: orgadmin@example.com (ORG_ADMIN)')
  console.log('  Teacher 1: teacher1@melbournehigh.edu.au (TEACHER, Premium)')
  console.log('  Teacher 2: teacher2@melbournehigh.edu.au (TEACHER, Basic)')
  console.log('  Teacher 3: teacher3@sydneygrammar.edu.au (TEACHER, Premium)')
  console.log('  Teacher 4: teacher4@brisbanegrammar.edu.au (TEACHER, Basic, Expired)')
  console.log('  Student 1: student1@melbournehigh.edu.au (STUDENT)')
  console.log('  Student 2: student2@melbournehigh.edu.au (STUDENT)')
  console.log('  Parent: parent1@example.com (PARENT)')
  console.log('\n🏢 Organisations:')
  console.log('  Melbourne High School (ACTIVE, 50 seats, 4 members)')
  console.log('  Sydney Grammar School (ACTIVE, 30 seats, 1 member)')
  console.log('  Brisbane Grammar School (PAST_DUE, 25 seats, 1 member)')
  console.log('  Trial School (TRIALING, 10 seats, 1 member)')
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

