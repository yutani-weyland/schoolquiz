/**
 * DELETE /api/admin/delete-quizzes
 * Delete all quizzes (for re-seeding)
 * 
 * WARNING: This deletes all quizzes, rounds, and questions!
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@schoolquiz/db';

export async function DELETE(request: NextRequest) {
  try {
    console.log('🗑️  Deleting all quizzes...');

    // Delete all quizzes (cascade will delete rounds and questions)
    const deleted = await prisma.quiz.deleteMany({});
    
    console.log(`✅ Deleted ${deleted.count} quizzes`);

    return NextResponse.json({
      success: true,
      message: `Deleted ${deleted.count} quizzes`,
      deleted: deleted.count,
    });
  } catch (error: any) {
    console.error('❌ Error deleting quizzes:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to delete quizzes',
        details: error.message,
      },
      { status: 500 }
    );
  }
}

