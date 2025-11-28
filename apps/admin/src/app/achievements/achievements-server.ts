import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@schoolquiz/db'
import { unstable_cache } from 'next/cache'

export type AchievementStatus = "unlocked" | "locked_free" | "locked_premium"

export interface Achievement {
	id: string
	slug: string
	name: string
	shortDescription: string
	longDescription?: string
	category: string
	rarity: string
	isPremiumOnly: boolean
	seasonTag?: string | null
	iconKey?: string | null
	series?: string | null
	cardVariant?: 'standard' | 'foil' | 'foilGold' | 'foilSilver' | 'shiny' | 'fullArt'
	status: AchievementStatus
	unlockedAt?: string
	quizSlug?: string | null
	progressValue?: number
	progressMax?: number
}

function getUserTier(user: {
	tier: string | null
	subscriptionStatus: string | null
	freeTrialUntil?: Date | null
}): 'visitor' | 'free' | 'premium' {
	const isPremium = 
		user.tier === 'premium' ||
		user.subscriptionStatus === 'ACTIVE' ||
		user.subscriptionStatus === 'TRIALING' ||
		(user.freeTrialUntil && new Date(user.freeTrialUntil) > new Date())
	
	return isPremium ? 'premium' : 'free'
}

/**
 * Fetch achievements data server-side
 * Reuses the same logic as the API route for consistency
 */
async function getAchievementsDataUncached(userId: string | null, tier: 'visitor' | 'free' | 'premium') {
	try {
		// Get all achievements - use cached version
		const { getAllAchievements } = await import('@/lib/cache-helpers')
		const allAchievements = await getAllAchievements()
		
		// Debug logging in development
		if (process.env.NODE_ENV === 'development') {
			console.log('[Achievements Server] getAllAchievements returned:', {
				count: allAchievements?.length || 0,
				firstFew: allAchievements?.slice(0, 3).map((a: any) => ({ id: a.id, name: a.name })),
			})
		}
		
		// Get user's unlocked achievements and progress if logged in
		let userAchievements: Array<{ achievementId: string; unlockedAt: Date; progressValue?: number; progressMax?: number }> = []
		let userProgress: Map<string, { progressValue: number; progressMax: number }> = new Map()
		
		if (userId) {
			try {
				const unlocked = await prisma.userAchievement.findMany({
					where: { userId: userId },
				})
				
				userAchievements = unlocked.map((ua: any) => ({
					achievementId: ua.achievementId || ua.achievementKey || '',
					unlockedAt: ua.unlockedAt,
					progressValue: ua.progressValue,
					progressMax: ua.progressMax,
				})).filter((ua) => ua.achievementId)
				
				userAchievements.forEach((ua) => {
					if (ua.progressValue !== null && ua.progressValue !== undefined && 
						ua.progressMax !== null && ua.progressMax !== undefined) {
						userProgress.set(ua.achievementId, {
							progressValue: ua.progressValue,
							progressMax: ua.progressMax,
						})
					}
				})
			} catch (error: any) {
				if (error.message?.includes('does not exist') || error.message?.includes('Unknown model')) {
					console.warn('User achievements table not found')
				} else {
					console.error('Error fetching user achievements:', error)
				}
			}
		}
		
		const unlockedAchievementIds = new Set(userAchievements.map((ua) => ua.achievementId))
		
		// Debug logging in development
		if (process.env.NODE_ENV === 'development') {
			console.log('[Achievements Server] Processing achievements:', {
				totalAchievements: allAchievements?.length || 0,
				userAchievementsCount: userAchievements.length,
				unlockedIds: Array.from(unlockedAchievementIds),
			})
		}
		
		// Map achievements with status and progress
		const achievementsWithStatus = (allAchievements || []).map((achievement: any) => {
			const userAchievement = userAchievements.find((ua) => ua.achievementId === achievement.id)
			const isUnlocked = unlockedAchievementIds.has(achievement.id)
			const canEarn = !achievement.isPremiumOnly || tier === 'premium'
			
			let progress = userProgress.get(achievement.id)
			if (userAchievement && userAchievement.progressValue !== null && userAchievement.progressValue !== undefined) {
				progress = {
					progressValue: userAchievement.progressValue,
					progressMax: userAchievement.progressMax || 0,
				}
			}
			
			return {
				id: achievement.id,
				slug: achievement.slug,
				name: achievement.name,
				shortDescription: achievement.shortDescription,
				longDescription: achievement.longDescription,
				category: achievement.category,
				rarity: achievement.rarity,
				isPremiumOnly: achievement.isPremiumOnly,
				seasonTag: achievement.seasonTag,
				iconKey: achievement.iconKey,
				series: achievement.series || null,
				cardVariant: achievement.cardVariant || 'standard',
				status: (isUnlocked
					? 'unlocked'
					: !canEarn
					? 'locked_premium'
					: 'locked_free') as AchievementStatus,
				unlockedAt: isUnlocked && userAchievement
					? userAchievement.unlockedAt.toISOString()
					: undefined,
				progressValue: progress?.progressValue,
				progressMax: progress?.progressMax,
			} as Achievement
		})
		
		return {
			achievements: achievementsWithStatus,
			tier,
		}
	} catch (error: any) {
		console.error('[Achievements Server] Error fetching achievements:', error)
		// Return empty achievements on error
		return {
			achievements: [],
			tier,
		}
	}
}

export interface AchievementsPageData {
	achievements: Achievement[]
	tier: 'visitor' | 'free' | 'premium'
	isPremium: boolean
}

/**
 * Main function to fetch all data needed for the Achievements page
 */
export async function getAchievementsPageData(): Promise<AchievementsPageData> {
	const user = await getCurrentUser()
	
	if (!user) {
		const tier = 'visitor'
		const cacheKey = 'anonymous'
		const getCachedAchievements = unstable_cache(
			async (uid: string | null, t: 'visitor' | 'free' | 'premium') => getAchievementsDataUncached(uid, t),
			[`achievements-${cacheKey}`],
			{ 
				revalidate: 60,
				tags: [`achievements-${cacheKey}`]
			}
		)
		const data = await getCachedAchievements(null, tier)
		return {
			...data,
			isPremium: false,
		}
	}
	
	const tier = getUserTier(user)
	const isPremium = tier === 'premium'
	const cacheKey = user.id
	
	// Cache achievements data for 60 seconds per user
	const getCachedAchievements = unstable_cache(
		async (uid: string | null, t: 'visitor' | 'free' | 'premium') => getAchievementsDataUncached(uid, t),
		[`achievements-${cacheKey}`],
		{ 
			revalidate: 60,
			tags: [`achievements-${cacheKey}`]
		}
	)
	
	const data = await getCachedAchievements(user.id, tier)
	
	return {
		...data,
		isPremium,
	}
}

