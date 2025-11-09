import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';

/**
 * POST /api/contact/support
 * Submit a support request (premium subscribers only)
 */
export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();
    const { subject, message } = await request.json();

    if (!subject || !message) {
      return NextResponse.json(
        { error: 'Subject and message are required' },
        { status: 400 }
      );
    }

    // TODO: Check premium status
    // For now, we'll just require authentication
    // In production, verify user has active premium subscription
    // const subscription = await getSubscription(user.id);
    // if (!subscription || !['ACTIVE', 'TRIALING'].includes(subscription.status)) {
    //   return NextResponse.json(
    //     { error: 'Premium subscription required' },
    //     { status: 403 }
    //   );
    // }

    // TODO: In production, this would:
    // 1. Save to database with priority flag
    // 2. Send email notification to support team
    // 3. Create ticket in support system
    // 4. Send confirmation email to user

    console.log('Support request submitted:', {
      userId: user.id,
      email: user.email,
      subject,
      message,
      timestamp: new Date().toISOString(),
      priority: 'premium',
    });

    // Mock success response
    return NextResponse.json({
      success: true,
      message: 'Support request submitted successfully',
    });
  } catch (error: any) {
    console.error('Error submitting support request:', error);
    
    if (error.message === 'Unauthorized') {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    return NextResponse.json(
      { error: error.message || 'Failed to submit support request' },
      { status: 500 }
    );
  }
}

