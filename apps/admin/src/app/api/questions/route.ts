import { NextRequest, NextResponse } from 'next/server';
import { getQuestions, createQuestion } from '../../../lib/supabase';

// Questions API using Supabase client
export async function GET(request: NextRequest) {
  try {
    const questions = await getQuestions();
    return NextResponse.json({ questions, pagination: { total: questions.length } });
  } catch (error) {
    console.error('Error fetching questions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch questions' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const question = await createQuestion(body);
    return NextResponse.json(question, { status: 201 });
  } catch (error) {
    console.error('Error creating question:', error);
    return NextResponse.json(
      { error: 'Failed to create question' },
      { status: 500 }
    );
  }
}
