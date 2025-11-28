import { NextRequest, NextResponse } from 'next/server';
import { validateRequest } from '@/lib/api-validation';
import { ContactSuggestionSchema } from '@/lib/validation/schemas';
import { handleApiError } from '@/lib/api-error';

/**
 * POST /api/contact/suggestion
 * Submit a suggestion (available to everyone)
 */
export async function POST(request: NextRequest) {
  try {
    // Validate request body with Zod
    const { name, email, subject, message } = await validateRequest(request, ContactSuggestionSchema);

    // TODO: In production, this would:
    // 1. Save to database
    // 2. Send email notification
    // 3. Maybe add to a ticketing system

    console.log('Suggestion submitted:', {
      name,
      email,
      subject,
      message,
      timestamp: new Date().toISOString(),
    });

    // Mock success response
    return NextResponse.json({
      success: true,
      message: 'Suggestion submitted successfully',
    });
  } catch (error: any) {
    // Use centralized error handling (handles ValidationError automatically)
    return handleApiError(error);
  }
}

