/**
 * Referral Rewards System
 * 
 * When a referred user becomes Premium:
 * - BOTH referrer and referred user get +1 month free
 * - Max 3 free months per user
 * - Only triggers when referred user becomes Premium (not on signup)
 */

import { prisma } from '@schoolquiz/db'

const MAX_FREE_MONTHS = 3

/**
 * Grant +1 month free to a user
 * Handles both free users (sets freeTrialUntil) and paying users (sets nextCycleFree)
 */
async function grantFreeMonth(userId: string): Promise<{ success: boolean; message: string }> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
  })

  if (!user) {
    return { success: false, message: 'User not found' }
  }

  // Check if user has already earned max free months
  if (user.freeMonthsGranted >= MAX_FREE_MONTHS) {
    return { success: false, message: 'User has already earned maximum free months' }
  }

  const now = new Date()

  // Calculate new free months granted count
  const newFreeMonthsGranted = user.freeMonthsGranted + 1

  if (user.tier === 'basic' || user.subscriptionStatus !== 'ACTIVE') {
    // Free user or inactive subscription: Grant 1 month free premium
    const freeTrialUntil = new Date()
    freeTrialUntil.setMonth(freeTrialUntil.getMonth() + 1)

    // If user already has freeTrialUntil, extend it
    const currentFreeUntil = user.freeTrialUntil ? new Date(user.freeTrialUntil) : null
    const extendedUntil = currentFreeUntil && currentFreeUntil > now
      ? new Date(currentFreeUntil.getTime() + 30 * 24 * 60 * 60 * 1000) // Add 30 days
      : freeTrialUntil

    await prisma.user.update({
      where: { id: userId },
      data: {
        tier: 'premium',
        freeTrialUntil: extendedUntil,
        freeMonthsGranted: newFreeMonthsGranted,
        freeMonthGrantedAt: now,
        subscriptionStatus: 'FREE_TRIAL', // Ensure they get premium access
      },
    })

    return { success: true, message: 'Granted 1 month free premium' }
  } else if (user.tier === 'premium' && user.subscriptionStatus === 'ACTIVE') {
    // Paying user: Mark next billing cycle as free
    await prisma.user.update({
      where: { id: userId },
      data: {
        nextCycleFree: true,
        freeMonthsGranted: newFreeMonthsGranted,
        freeMonthGrantedAt: now,
      },
    })

    return { success: true, message: 'Next billing cycle will be free' }
  }

  return { success: false, message: 'Unable to grant free month' }
}

/**
 * Process referral reward when referred user becomes Premium
 * Grants +1 month free to BOTH referrer and referred user
 */
export async function processReferralReward(referredUserId: string): Promise<{
  success: boolean
  referrerRewarded: boolean
  referredRewarded: boolean
  message: string
}> {
  try {
    // Find the referral record
    const referral = await (prisma as any).referral.findUnique({
      where: { referredUserId },
      include: {
        referrer: true,
        referredUser: true,
      },
    })

    if (!referral) {
      return {
        success: false,
        referrerRewarded: false,
        referredRewarded: false,
        message: 'No referral record found',
      }
    }

    // Check if already rewarded
    if (referral.status === 'REWARDED') {
      return {
        success: true,
        referrerRewarded: referral.referrerRewarded,
        referredRewarded: referral.referredRewarded,
        message: 'Referral already processed',
      }
    }

    // Check if referred user is actually Premium
    const referredUser = referral.referredUser
    const isPremium =
      referredUser.tier === 'premium' ||
      referredUser.subscriptionStatus === 'ACTIVE' ||
      (referredUser.freeTrialUntil && new Date(referredUser.freeTrialUntil) > new Date())

    if (!isPremium) {
      return {
        success: false,
        referrerRewarded: false,
        referredRewarded: false,
        message: 'Referred user is not Premium yet',
      }
    }

    // Grant free month to referrer
    const referrerResult = await grantFreeMonth(referral.referrerId)
    const referrerRewarded = referrerResult.success

    // Grant free month to referred user
    const referredResult = await grantFreeMonth(referredUserId)
    const referredRewarded = referredResult.success

    // Update referral record
    const now = new Date()
    await (prisma as any).referral.update({
      where: { id: referral.id },
      data: {
        status: 'REWARDED',
        rewardGrantedAt: now,
        referrerRewarded,
        referredRewarded,
      },
    })

    return {
      success: referrerRewarded || referredRewarded,
      referrerRewarded,
      referredRewarded,
      message: referrerRewarded && referredRewarded
        ? 'Both users received free month'
        : referrerRewarded
        ? 'Referrer received free month (referred user at max)'
        : referredRewarded
        ? 'Referred user received free month (referrer at max)'
        : 'Both users at maximum free months',
    }
  } catch (error: any) {
    console.error('Error processing referral reward:', error)
    return {
      success: false,
      referrerRewarded: false,
      referredRewarded: false,
      message: error.message || 'Failed to process referral reward',
    }
  }
}

