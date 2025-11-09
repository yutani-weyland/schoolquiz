/**
 * Feature gating utilities for Basic vs Premium users
 */

export type UserTier = 'basic' | 'premium';

/**
 * Check if user has premium access
 */
export function isPremium(tier: string | null | undefined): boolean {
  return tier === 'premium';
}

/**
 * Check if user has basic (free) tier
 */
export function isBasic(tier: string | null | undefined): boolean {
  return !tier || tier === 'basic';
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
      return false; // Basic users cannot unlock achievements (but can view them greyed out)
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

