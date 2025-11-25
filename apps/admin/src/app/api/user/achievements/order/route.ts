import { NextRequest, NextResponse } from 'next/server';
import { requireApiUserId } from '@/lib/api-auth';

export async function PUT(request: NextRequest) {
  try {
    // Verify authentication
    await requireApiUserId();

    const body = await request.json();
    const { order } = body;

    if (!Array.isArray(order)) {
      return NextResponse.json(
        { error: 'Order must be an array' },
        { status: 400 }
      );
    }

    // In a real app, save to database
    // For now, we'll just return success
    // The order is already saved to localStorage on the client side
    
    return NextResponse.json({ 
      success: true,
      message: 'Achievement order saved'
    });
  } catch (error: any) {
    console.error('Error saving achievement order:', error);
    return NextResponse.json(
      { error: 'Failed to save achievement order', details: error.message },
      { status: 500 }
    );
  }
}

