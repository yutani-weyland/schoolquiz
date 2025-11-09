import { NextRequest, NextResponse } from 'next/server';

export async function PUT(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

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

