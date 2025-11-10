/**
 * Feature gating utilities for Basic vs Premium users
 */

export type UserTier = 'visitor' | 'free' | 'premium';

/**
 * Check if user has premium access
 */
export function isPremium(tier: string | null | undefined): boolean {
  return tier === 'premium';
}

/**
 * Check if user has free tier
 */
export function isFree(tier: string | null | undefined): boolean {
  return tier === 'free';
}

/**
 * Check if user is a visitor (not logged in)
 */
export function isVisitor(tier: string | null | undefined): boolean {
  return !tier || tier === 'visitor';
}

/**
 * Check if a user can earn a specific achievement based on their tier
 */
export function canEarnAchievement(
  tier: UserTier | string | null | undefined,
  achievement: { isPremiumOnly?: boolean }
): boolean {
  const normalizedTier = normalizeTier(tier);
  
  if (!achievement.isPremiumOnly) {
    return normalizedTier === 'free' || normalizedTier === 'premium';
  }
  return normalizedTier === 'premium';
}

/**
 * Normalize tier string to UserTier type
 */
function normalizeTier(tier: string | null | undefined): UserTier {
  if (!tier || tier === 'visitor') return 'visitor';
  if (tier === 'premium' || tier === 'basic') {
    // Map 'basic' to 'free' for consistency
    return tier === 'premium' ? 'premium' : 'free';
  }
  return 'free';
}

/**
 * Feature gate: Require premium access
 * Throws error if user is not premium
 */
export function requirePremium(tier: string | null | undefined): void {
  if (!isPremium(tier)) {
    throw new Error('Premium access required');
  }
}

/**
 * Feature gate: Check if feature is available to user
 */
export function canAccessFeature(
  tier: string | null | undefined,
  feature: 'previous_quizzes' | 'private_leagues' | 'analytics' | 'achievements' | 'all_leaderboards'
): boolean {
  if (isPremium(tier)) {
    return true; // Premium users have access to everything
  }

  // Basic users have limited access
  switch (feature) {
    case 'previous_quizzes':
      return false; // Basic users can only access latest quiz
    case 'private_leagues':
      return false; // Basic users cannot create/join private leagues
    case 'analytics':
      return false; // Basic users cannot view analytics
    case 'achievements':
      return true; // Free users can view achievements
    case 'all_leaderboards':
      return false; // Basic users can only see organisation leaderboards
    default:
      return false;
  }
}

/**
 * Check if user can access a specific quiz
 * Basic users can only access the latest weekly quiz
 */
export function canAccessQuiz(
  tier: string | null | undefined,
  isLatestQuiz: boolean
): boolean {
  if (isPremium(tier)) {
    return true; // Premium users can access all quizzes
  }
  return isLatestQuiz; // Basic users can only access latest quiz
}

