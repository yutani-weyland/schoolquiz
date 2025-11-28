import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { validateRequest } from '@/lib/api-validation';
import { ContactSupportSchema } from '@/lib/validation/schemas';
import { handleApiError } from '@/lib/api-error';

/**
 * POST /api/contact/support
 * Submit a support request (premium subscribers only)
 */
export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();
    // Validate request body with Zod
    const { subject, message } = await validateRequest(request, ContactSupportSchema);

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
    // Handle authentication errors
    if (error.message === 'Unauthorized') {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    // Use centralized error handling (handles ValidationError automatically)
    return handleApiError(error);
  }
}

