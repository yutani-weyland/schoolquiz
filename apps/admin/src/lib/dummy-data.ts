// Dummy data for testing admin interface without database

export const dummyOrganisations = [
  {
    id: 'org-1',
    name: 'Melbourne High School',
    emailDomain: 'melbournehigh.edu.au',
    status: 'ACTIVE',
    plan: 'ORG_ANNUAL',
    maxSeats: 50,
    currentPeriodEnd: new Date(Date.now() + 335 * 24 * 60 * 60 * 1000).toISOString(),
    owner: {
      id: 'user-1',
      name: 'Sarah Johnson',
      email: 'sarah@melbournehigh.edu.au',
    },
    _count: {
      members: 4,
      groups: 2,
    },
    createdAt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'org-2',
    name: 'Sydney Grammar School',
    emailDomain: 'sydneygrammar.edu.au',
    status: 'ACTIVE',
    plan: 'ORG_MONTHLY',
    maxSeats: 30,
    currentPeriodEnd: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000).toISOString(),
    owner: {
      id: 'user-3',
      name: 'Emma Wilson',
      email: 'emma@sydneygrammar.edu.au',
    },
    _count: {
      members: 1,
      groups: 1,
    },
    createdAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'org-3',
    name: 'Brisbane Grammar School',
    emailDomain: 'brisbanegrammar.edu.au',
    status: 'PAST_DUE',
    plan: 'ORG_MONTHLY',
    maxSeats: 25,
    currentPeriodEnd: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    owner: {
      id: 'user-4',
      name: 'David Brown',
      email: 'david@brisbanegrammar.edu.au',
    },
    _count: {
      members: 1,
      groups: 0,
    },
    createdAt: new Date(Date.now() - 120 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'org-4',
    name: 'Trial School',
    emailDomain: 'trialschool.edu.au',
    status: 'TRIALING',
    plan: 'INDIVIDUAL',
    maxSeats: 10,
    currentPeriodEnd: new Date(Date.now() + 25 * 24 * 60 * 60 * 1000).toISOString(),
    owner: {
      id: 'user-2',
      name: 'Michael Chen',
      email: 'michael@trialschool.edu.au',
    },
    _count: {
      members: 1,
      groups: 0,
    },
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
  },
]

export const dummyUsers = [
  {
    id: 'user-1',
    name: 'Sarah Johnson',
    email: 'sarah@melbournehigh.edu.au',
    tier: 'premium',
    platformRole: 'TEACHER',
    subscriptionStatus: 'ACTIVE',
    organisationMembers: [
      {
        organisation: {
          id: 'org-1',
          name: 'Melbourne High School',
        },
      },
    ],
    _count: {
      organisationMembers: 1,
      quizCompletions: 45,
      achievements: 12,
    },
    lastLoginAt: new Date().toISOString(),
    createdAt: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'user-2',
    name: 'Michael Chen',
    email: 'michael@trialschool.edu.au',
    tier: 'basic',
    platformRole: 'TEACHER',
    subscriptionStatus: 'FREE_TRIAL',
    organisationMembers: [
      {
        organisation: {
          id: 'org-4',
          name: 'Trial School',
        },
      },
    ],
    _count: {
      organisationMembers: 1,
      quizCompletions: 8,
      achievements: 3,
    },
    lastLoginAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'user-3',
    name: 'Emma Wilson',
    email: 'emma@sydneygrammar.edu.au',
    tier: 'premium',
    platformRole: 'TEACHER',
    subscriptionStatus: 'ACTIVE',
    organisationMembers: [
      {
        organisation: {
          id: 'org-2',
          name: 'Sydney Grammar School',
        },
      },
    ],
    _count: {
      organisationMembers: 1,
      quizCompletions: 67,
      achievements: 18,
    },
    lastLoginAt: new Date().toISOString(),
    createdAt: new Date(Date.now() - 200 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'user-4',
    name: 'David Brown',
    email: 'david@brisbanegrammar.edu.au',
    tier: 'basic',
    platformRole: 'TEACHER',
    subscriptionStatus: 'EXPIRED',
    organisationMembers: [
      {
        organisation: {
          id: 'org-3',
          name: 'Brisbane Grammar School',
        },
      },
    ],
    _count: {
      organisationMembers: 1,
      quizCompletions: 23,
      achievements: 7,
    },
    lastLoginAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    createdAt: new Date(Date.now() - 150 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'user-5',
    name: 'Alex Smith',
    email: 'alex@melbournehigh.edu.au',
    tier: 'basic',
    platformRole: 'STUDENT',
    subscriptionStatus: 'FREE_TRIAL',
    organisationMembers: [
      {
        organisation: {
          id: 'org-1',
          name: 'Melbourne High School',
        },
      },
    ],
    _count: {
      organisationMembers: 1,
      quizCompletions: 34,
      achievements: 9,
    },
    lastLoginAt: new Date().toISOString(),
    createdAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'user-6',
    name: 'Jordan Taylor',
    email: 'jordan@melbournehigh.edu.au',
    tier: 'basic',
    platformRole: 'STUDENT',
    subscriptionStatus: 'FREE_TRIAL',
    organisationMembers: [
      {
        organisation: {
          id: 'org-1',
          name: 'Melbourne High School',
        },
      },
    ],
    _count: {
      organisationMembers: 1,
      quizCompletions: 28,
      achievements: 6,
    },
    lastLoginAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    createdAt: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString(),
  },
]

export const getDummyOrganisationDetail = (id: string) => {
  const org = dummyOrganisations.find(o => o.id === id)
  if (!org) return null

  // Get additional members based on org
  const additionalMembers: any[] = []
  if (id === 'org-1') {
    // Melbourne High has more members
    additionalMembers.push(
      {
        id: 'member-2',
        role: 'TEACHER',
        status: 'ACTIVE',
        user: {
          id: 'user-5',
          name: 'Alex Smith',
          email: 'alex@melbournehigh.edu.au',
          tier: 'basic',
        },
        createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: 'member-3',
        role: 'STUDENT',
        status: 'ACTIVE',
        user: {
          id: 'user-6',
          name: 'Jordan Taylor',
          email: 'jordan@melbournehigh.edu.au',
          tier: 'basic',
        },
        createdAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
      }
    )
  }

  return {
    ...org,
    members: [
      {
        id: 'member-1',
        role: 'OWNER',
        status: 'ACTIVE',
        user: {
          id: org.owner.id,
          name: org.owner.name,
          email: org.owner.email,
          tier: 'premium',
        },
        createdAt: org.createdAt,
      },
      ...additionalMembers,
    ],
    groups: id === 'org-1' || id === 'org-2' ? [
      {
        id: `group-${id}-1`,
        name: id === 'org-1' ? 'Year 10' : 'Year 9',
        type: 'YEAR_GROUP',
        _count: { members: id === 'org-1' ? 2 : 1 },
        createdAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
      },
      ...(id === 'org-1' ? [{
        id: `group-${id}-2`,
        name: 'Science Faculty',
        type: 'FACULTY',
        _count: { members: 1 },
        createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
      }] : []),
    ] : [],
    leaderboards: id === 'org-1' ? [
      {
        id: `leaderboard-${id}-1`,
        name: 'Term 1 Leaderboard',
        createdAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: `leaderboard-${id}-2`,
        name: 'Term 2 Leaderboard',
        createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: `leaderboard-${id}-3`,
        name: 'Term 3 Leaderboard',
        createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
      },
    ] : [],
    activity: [
      {
        id: `activity-${id}-1`,
        type: 'MEMBER_ADDED',
        description: additionalMembers.length > 0 
          ? `Added ${additionalMembers[0].user.name} as member`
          : 'Organisation created',
        user: {
          id: org.owner.id,
          name: org.owner.name,
          email: org.owner.email,
        },
        createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
      },
      ...(id === 'org-1' || id === 'org-2' ? [{
        id: `activity-${id}-2`,
        type: 'GROUP_CREATED',
        description: `Created ${id === 'org-1' ? 'Year 10' : 'Year 9'} group`,
        user: {
          id: org.owner.id,
          name: org.owner.name,
          email: org.owner.email,
        },
        createdAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
      }] : []),
    ],
    _count: {
      members: 1 + additionalMembers.length,
      groups: id === 'org-1' ? 2 : (id === 'org-2' ? 1 : 0),
      leaderboards: id === 'org-1' ? 3 : 0,
    },
    stripeCustomerId: `cus_${id}`,
    stripeSubscriptionId: `sub_${id}`,
    currentPeriodStart: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    gracePeriodEnd: null,
  }
}

export const getDummyUserDetail = (id: string) => {
  const user = dummyUsers.find(u => u.id === id)
  if (!user) return null

  // Get the organisation from the user's memberships
  const orgMember = user.organisationMembers?.[0]
  const org = orgMember?.organisation

  // Map of user IDs to their organisation ownership
  const ownerMap: Record<string, string> = {
    'user-1': 'org-1', // Sarah owns Melbourne High
    'user-3': 'org-2', // Emma owns Sydney Grammar
    'user-4': 'org-3', // David owns Brisbane Grammar
    'user-2': 'org-4', // Michael owns Trial School
  }

  return {
    ...user,
    phone: null,
    subscriptionPlan: user.tier === 'premium' ? 'PREMIUM_MONTHLY' : null,
    subscriptionEndsAt: user.tier === 'premium' ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() : null,
    emailVerified: true,
    phoneVerified: false,
    organisationMembers: user.organisationMembers.map((member: any) => {
      const isOwner = ownerMap[user.id] === member.organisation.id
      return {
        id: `member-${user.id}-${member.organisation.id}`,
        role: user.platformRole === 'TEACHER' ? (isOwner ? 'OWNER' : 'TEACHER') : 'STUDENT',
        status: 'ACTIVE',
        organisation: {
          id: member.organisation.id,
          name: member.organisation.name,
          status: 'ACTIVE',
        },
        createdAt: user.createdAt,
      }
    }),
    createdOrganisations: user.platformRole === 'TEACHER' && org ? [
      {
        id: org.id,
        name: org.name,
        status: 'ACTIVE',
      },
    ] : [],
    quizCompletions: Array.from({ length: Math.min(10, user._count.quizCompletions) }, (_, i) => ({
      id: `completion-${user.id}-${i}`,
      completedAt: new Date(Date.now() - i * 7 * 24 * 60 * 60 * 1000).toISOString(),
      quiz: {
        id: `quiz-${i}`,
        slug: `quiz-${i}`,
        title: `Weekly Quiz #${i + 1}`,
      },
    })),
    achievements: Array.from({ length: Math.min(10, user._count.achievements) }, (_, i) => ({
      id: `achievement-${user.id}-${i}`,
      unlockedAt: new Date(Date.now() - i * 10 * 24 * 60 * 60 * 1000).toISOString(),
      achievement: {
        id: `ach-${i}`,
        name: `Achievement ${i + 1}`,
        rarity: ['common', 'uncommon', 'rare', 'epic', 'legendary'][i % 5],
      },
    })),
    referrer: null,
    referrals: [],
    _count: {
      organisationMembers: user._count.organisationMembers,
      quizCompletions: user._count.quizCompletions,
      achievements: user._count.achievements,
      referrals: 0,
      createdOrganisations: user.platformRole === 'TEACHER' && org ? 1 : 0,
    },
  }
}

