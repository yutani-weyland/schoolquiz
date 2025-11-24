/**
 * Stripe Webhook Handler
 * 
 * Handles Stripe events, particularly:
 * - customer.subscription.created
 * - customer.subscription.updated
 * - invoice.payment_succeeded
 * 
 * When a referred user becomes Premium, triggers referral rewards
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@schoolquiz/db'
import { processReferralReward } from '@/lib/referral-rewards'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2024-11-20.acacia',
})

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET

/**
 * POST /api/stripe/webhook
 * Handle Stripe webhook events
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.text()
    const signature = request.headers.get('stripe-signature')

    if (!signature || !webhookSecret) {
      console.error('[Stripe Webhook] Missing signature or webhook secret')
      return NextResponse.json(
        { error: 'Missing webhook signature or secret' },
        { status: 400 }
      )
    }

    let event: Stripe.Event

    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
    } catch (err: any) {
      console.error('[Stripe Webhook] Signature verification failed:', err.message)
      return NextResponse.json(
        { error: `Webhook signature verification failed: ${err.message}` },
        { status: 400 }
      )
    }

    // Handle the event
    switch (event.type) {
      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription

        // Find user by Stripe customer ID
        const subscriptionRecord = await (prisma as any).subscription.findUnique({
          where: { stripeSubscriptionId: subscription.id },
          include: { user: true },
        })

        if (subscriptionRecord?.user) {
          const userId = subscriptionRecord.user.id

          // Update user subscription status
          const isActive = subscription.status === 'active' || subscription.status === 'trialing'
          
          await prisma.user.update({
            where: { id: userId },
            data: {
              tier: isActive ? 'premium' : 'basic',
              subscriptionStatus: isActive ? 'ACTIVE' : 'EXPIRED',
              subscriptionPlan: subscription.items.data[0]?.price.id || null,
              subscriptionEndsAt: new Date(subscription.current_period_end * 1000),
            },
          })

          // If subscription is active and user was referred, process referral reward
          if (isActive && subscriptionRecord.user.referredBy) {
            console.log(`[Stripe Webhook] Processing referral reward for user ${userId}`)
            const rewardResult = await processReferralReward(userId)
            console.log(`[Stripe Webhook] Referral reward result:`, rewardResult)
          }
        }

        break
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice

        if (invoice.subscription) {
          // Find subscription and user
          const subscriptionRecord = await (prisma as any).subscription.findUnique({
            where: { stripeSubscriptionId: invoice.subscription as string },
            include: { user: true },
          })

          if (subscriptionRecord?.user) {
            const userId = subscriptionRecord.user.id

            // Update user to Premium
            await prisma.user.update({
              where: { id: userId },
              data: {
                tier: 'premium',
                subscriptionStatus: 'ACTIVE',
                subscriptionEndsAt: invoice.period_end
                  ? new Date(invoice.period_end * 1000)
                  : null,
              },
            })

            // Process referral reward if user was referred
            if (subscriptionRecord.user.referredBy) {
              console.log(`[Stripe Webhook] Processing referral reward for user ${userId} (invoice paid)`)
              const rewardResult = await processReferralReward(userId)
              console.log(`[Stripe Webhook] Referral reward result:`, rewardResult)
            }
          }
        }

        break
      }

      default:
        console.log(`[Stripe Webhook] Unhandled event type: ${event.type}`)
    }

    return NextResponse.json({ received: true })
  } catch (error: any) {
    console.error('[Stripe Webhook] Error:', error)
    return NextResponse.json(
      { error: 'Webhook handler failed', details: error.message },
      { status: 500 }
    )
  }
}

