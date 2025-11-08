import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '../../../lib/supabase';

// Analytics API using Supabase client
export async function GET(request: NextRequest) {
  try {
    // Mock analytics data for now
    const analytics = {
      summary: {
        totalRuns: 0,
        avgSuccessRate: 0.73,
        totalQuestions: 0,
        totalQuizzes: 0
      },
      charts: {
        dailyRuns: [],
        categoryPerformance: [],
        difficultyDistribution: []
      }
    };

    return NextResponse.json(analytics);
  } catch (error) {
    console.error('Error fetching analytics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch analytics' },
      { status: 500 }
    );
  }
}
