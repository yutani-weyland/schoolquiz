import { NextRequest, NextResponse } from 'next/server';

/**
 * POST /api/contact/suggestion
 * Submit a suggestion (available to everyone)
 */
export async function POST(request: NextRequest) {
  try {
    const { name, email, subject, message } = await request.json();

    if (!name || !email || !subject || !message) {
      return NextResponse.json(
        { error: 'All fields are required' },
        { status: 400 }
      );
    }

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
    console.error('Error submitting suggestion:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to submit suggestion' },
      { status: 500 }
    );
  }
}

