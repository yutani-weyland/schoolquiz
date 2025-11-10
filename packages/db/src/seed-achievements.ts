import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding achievements, seasons, and flair...')

  // Create seasons (Australian school years: Jan/Feb to Dec)
  const seasons = await Promise.all([
    prisma.season.create({
      data: {
        slug: '2024',
        name: '2024 Season',
        startDate: new Date('2024-01-29'), // Approximate start of school year
        endDate: new Date('2024-12-20'),
      },
    }),
    prisma.season.create({
      data: {
        slug: '2025',
        name: '2025 Season',
        startDate: new Date('2025-01-27'),
        endDate: new Date('2025-12-19'),
      },
    }),
    prisma.season.create({
      data: {
        slug: '2026',
        name: '2026 Season',
        startDate: new Date('2026-01-26'),
        endDate: new Date('2026-12-18'),
      },
    }),
    prisma.season.create({
      data: {
        slug: '2027',
        name: '2027 Season',
        startDate: new Date('2027-02-01'),
        endDate: new Date('2027-12-17'),
      },
    }),
  ])

  console.log('✅ Created seasons')

  // Create achievements - Common (free + premium)
  const commonAchievements = await Promise.all([
    prisma.achievement.create({
      data: {
        slug: 'hail-caesar',
        name: 'Hail Caesar',
        shortDescription: 'Get 5/5 in a History round',
        longDescription: 'Achieve a perfect score in a round focused on historical topics',
        category: 'performance',
        rarity: 'common',
        isPremiumOnly: false,
        iconKey: 'hail-caesar',
        unlockConditionType: 'score_5_of_5',
        unlockConditionConfig: JSON.stringify({ category: 'history', requiredScore: 5 }),
      },
    }),
    prisma.achievement.create({
      data: {
        slug: 'addicted',
        name: 'Addicted',
        shortDescription: 'Play 3 quizzes in a single day',
        longDescription: 'Complete three quizzes within 24 hours',
        category: 'engagement',
        rarity: 'common',
        isPremiumOnly: false,
        iconKey: 'addicted',
        unlockConditionType: 'play_n_quizzes',
        unlockConditionConfig: JSON.stringify({ count: 3, timeWindow: 'day' }),
      },
    }),
    prisma.achievement.create({
      data: {
        slug: 'time-traveller',
        name: 'Time Traveller',
        shortDescription: 'Complete a quiz from 3+ weeks ago',
        longDescription: 'Revisit and complete a quiz that was originally published at least 3 weeks earlier',
        category: 'engagement',
        rarity: 'common',
        isPremiumOnly: false,
        iconKey: 'time-traveller',
        unlockConditionType: 'time_window',
        unlockConditionConfig: JSON.stringify({ weeksAgo: 3 }),
      },
    }),
    prisma.achievement.create({
      data: {
        slug: 'deja-vu',
        name: 'Déjà Vu',
        shortDescription: 'Complete the same quiz twice',
        longDescription: 'Play and complete a quiz you have already completed before',
        category: 'engagement',
        rarity: 'common',
        isPremiumOnly: false,
        iconKey: 'deja-vu',
        unlockConditionType: 'repeat_quiz',
        unlockConditionConfig: JSON.stringify({ minCompletions: 2 }),
      },
    }),
  ])

  // Create achievements - Uncommon (free + premium)
  const uncommonAchievements = await Promise.all([
    prisma.achievement.create({
      data: {
        slug: 'blitzkrieg',
        name: 'Blitzkrieg',
        shortDescription: 'Finish a History round under 2 minutes',
        longDescription: 'Complete a history-themed round in less than 2 minutes',
        category: 'performance',
        rarity: 'uncommon',
        isPremiumOnly: false,
        iconKey: 'blitzkrieg',
        unlockConditionType: 'time_limit',
        unlockConditionConfig: JSON.stringify({ category: 'history', maxSeconds: 120 }),
      },
    }),
    prisma.achievement.create({
      data: {
        slug: 'routine-genius',
        name: 'Routine Genius',
        shortDescription: 'Play for 4 consecutive weeks',
        longDescription: 'Maintain a weekly quiz playing streak for 4 weeks',
        category: 'engagement',
        rarity: 'uncommon',
        isPremiumOnly: false,
        iconKey: 'routine-genius',
        unlockConditionType: 'streak',
        unlockConditionConfig: JSON.stringify({ weeks: 4 }),
      },
    }),
    prisma.achievement.create({
      data: {
        slug: 'hat-trick',
        name: 'Hat Trick',
        shortDescription: 'Win 3 sports rounds',
        longDescription: 'Achieve perfect scores in three different sports-themed rounds',
        category: 'performance',
        rarity: 'uncommon',
        isPremiumOnly: false,
        iconKey: 'hat-trick',
        unlockConditionType: 'score_5_of_5',
        unlockConditionConfig: JSON.stringify({ category: 'sports', count: 3 }),
      },
    }),
  ])

  // Create achievements - Rare (premium only)
  const rareAchievements = await Promise.all([
    prisma.achievement.create({
      data: {
        slug: 'ace',
        name: 'Ace',
        shortDescription: 'Get 5/5 in a sports-themed round',
        longDescription: 'Perfect score in a round focused on sports knowledge',
        category: 'performance',
        rarity: 'rare',
        isPremiumOnly: true,
        iconKey: 'ace',
        unlockConditionType: 'score_5_of_5',
        unlockConditionConfig: JSON.stringify({ category: 'sports', requiredScore: 5 }),
      },
    }),
    prisma.achievement.create({
      data: {
        slug: 'olympiad',
        name: 'Olympiad',
        shortDescription: 'Get 5/5 in an Olympics round',
        longDescription: 'Perfect score in a special Olympics-themed quiz round',
        category: 'event',
        rarity: 'rare',
        isPremiumOnly: true,
        seasonTag: 'olympics-2026',
        iconKey: 'olympiad',
        unlockConditionType: 'score_5_of_5',
        unlockConditionConfig: JSON.stringify({ seasonTag: 'olympics-2026', requiredScore: 5 }),
      },
    }),
    prisma.achievement.create({
      data: {
        slug: 'torchbearer',
        name: 'Torchbearer',
        shortDescription: 'Play in a special Olympic event week',
        longDescription: 'Participate in a quiz during a special Olympics event period',
        category: 'event',
        rarity: 'rare',
        isPremiumOnly: true,
        seasonTag: 'olympics-2026',
        iconKey: 'torchbearer',
        unlockConditionType: 'event_round',
        unlockConditionConfig: JSON.stringify({ eventTag: 'olympics-2026' }),
      },
    }),
  ])

  // Create achievements - Epic (premium only, seasonal)
  const epicAchievements = await Promise.all([
    prisma.achievement.create({
      data: {
        slug: 'term-1-champion',
        name: 'Term 1 Champion',
        shortDescription: 'Complete all quizzes in Term 1',
        longDescription: 'Play and complete every quiz published during Term 1 of the school year',
        category: 'engagement',
        rarity: 'epic',
        isPremiumOnly: true,
        seasonTag: '2025-term-1',
        iconKey: 'term-champion',
        unlockConditionType: 'season_completion',
        unlockConditionConfig: JSON.stringify({ term: 1, season: '2025' }),
      },
    }),
    prisma.achievement.create({
      data: {
        slug: 'all-rounder-2025',
        name: '2025 All-Rounder',
        shortDescription: 'Play at least once every term in 2025',
        longDescription: 'Maintain engagement across all four terms of the 2025 school year',
        category: 'engagement',
        rarity: 'epic',
        isPremiumOnly: true,
        seasonTag: '2025',
        iconKey: 'all-rounder',
        unlockConditionType: 'season_engagement',
        unlockConditionConfig: JSON.stringify({ season: '2025', minPerTerm: 1 }),
      },
    }),
  ])

  // Create achievements - Legendary (premium only)
  const legendaryAchievements = await Promise.all([
    prisma.achievement.create({
      data: {
        slug: 'iron-quizzer-2025',
        name: '2025 Iron Quizzer',
        shortDescription: 'Maintain a streak through Term 4',
        longDescription: 'Keep your weekly quiz streak alive throughout the entire fourth term',
        category: 'engagement',
        rarity: 'legendary',
        isPremiumOnly: true,
        seasonTag: '2025-term-4',
        iconKey: 'iron-quizzer',
        unlockConditionType: 'streak',
        unlockConditionConfig: JSON.stringify({ term: 4, season: '2025', consecutiveWeeks: 10 }),
      },
    }),
    prisma.achievement.create({
      data: {
        slug: 'perfect-year',
        name: 'Perfect Year',
        shortDescription: 'Complete every quiz in a full school year',
        longDescription: 'Play and complete every single quiz published during an entire school year',
        category: 'engagement',
        rarity: 'legendary',
        isPremiumOnly: true,
        iconKey: 'perfect-year',
        unlockConditionType: 'full_season_completion',
        unlockConditionConfig: JSON.stringify({ allQuizzes: true }),
      },
    }),
  ])

  console.log('✅ Created achievements')

  // Create flair items
  const flairItems = await Promise.all([
    prisma.flair.create({
      data: {
        slug: 'premium-member',
        name: 'Premium Member',
        description: 'Active Premium subscription holder',
        rarity: 'status',
        isPremiumOnly: true,
        unlockConditionType: 'subscription',
        unlockConditionConfig: JSON.stringify({ tier: 'premium' }),
        iconKey: 'premium-badge',
      },
    }),
    prisma.flair.create({
      data: {
        slug: 'quiz-master',
        name: 'Quiz Master',
        description: 'Unlocked by achieving 10 perfect scores',
        rarity: 'status',
        isPremiumOnly: true,
        unlockConditionType: 'achievement_combo',
        unlockConditionConfig: JSON.stringify({ perfectScores: 10 }),
        iconKey: 'quiz-master',
      },
    }),
    prisma.flair.create({
      data: {
        slug: 'gold-frame',
        name: 'Gold Frame',
        description: 'Earned by unlocking 5 legendary achievements',
        rarity: 'frame',
        isPremiumOnly: true,
        unlockConditionType: 'achievement_combo',
        unlockConditionConfig: JSON.stringify({ rarity: 'legendary', count: 5 }),
        iconKey: 'gold-frame',
      },
    }),
    prisma.flair.create({
      data: {
        slug: 'league-captain',
        name: 'League Captain',
        description: 'Top performer in a leaderboard',
        rarity: 'badge',
        isPremiumOnly: true,
        unlockConditionType: 'season_rank',
        unlockConditionConfig: JSON.stringify({ rank: 1, leaderboardType: 'season' }),
        iconKey: 'league-captain',
      },
    }),
  ])

  console.log('✅ Created flair items')
  console.log('🎉 Achievements, seasons, and flair seeded successfully!')
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

