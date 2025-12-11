import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@schoolquiz/db";

/**
 * GET /api/user/teams/check
 * Diagnostic endpoint to check if teams table exists
 * (No auth required for debugging)
 */
export async function GET(request: NextRequest) {
  try {
    // First check if prisma.team exists
    if (!prisma.team) {
      return NextResponse.json({
        success: false,
        error: "Prisma Team model not available",
        message: "Prisma client needs to be regenerated. Run: cd packages/db && pnpm db:generate",
        hasTeamModel: false,
        prismaKeys: Object.keys(prisma).filter(key => !key.startsWith('_') && typeof prisma[key as keyof typeof prisma] === 'object'),
      }, { status: 503 });
    }

    // Try to query the teams table
    const count = await prisma.team.count();
    
    return NextResponse.json({
      success: true,
      message: "Teams table exists",
      teamCount: count,
      hasTeamModel: true,
    });
  } catch (error: any) {
    const errorMessage = error.message?.toLowerCase() || '';
    const isTableMissing = 
      error.code === 'P2021' || 
      error.code === '42P01' ||
      errorMessage.includes('does not exist') ||
      (errorMessage.includes('relation') && errorMessage.includes('does not exist')) ||
      (errorMessage.includes('table') && errorMessage.includes('does not exist')) ||
      (errorMessage.includes('teams') && errorMessage.includes('does not exist'));

    if (isTableMissing) {
      return NextResponse.json({
        success: false,
        error: "Teams table does not exist",
        code: error.code,
        message: error.message,
        solution: "Run migration: supabase/migrations/017_add_teams_feature.sql",
      }, { status: 503 });
    }

    return NextResponse.json({
      success: false,
      error: "Unknown error",
      code: error.code,
      message: error.message,
      meta: error.meta,
    }, { status: 500 });
  }
}
