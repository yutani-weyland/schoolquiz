import { NextRequest, NextResponse } from 'next/server';
import { getQuizzes, createQuiz } from '../../../lib/supabase';
import { requireAuth } from '../../../lib/auth';

// Quizzes API using Supabase client
export async function GET(request: NextRequest) {
  try {
    // Require authentication
    await requireAuth();

    const quizzes = await getQuizzes();
    return NextResponse.json({ quizzes, pagination: { total: quizzes.length } });
  } catch (error) {
    console.error('Error fetching quizzes:', error);
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.json(
      { error: 'Failed to fetch quizzes' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Require authentication
    await requireAuth();

    const body = await request.json();
    const quiz = await createQuiz(body);
    return NextResponse.json(quiz, { status: 201 });
  } catch (error) {
    console.error('Error creating quiz:', error);
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.json(
      { error: 'Failed to create quiz' },
      { status: 500 }
    );
  }
}
