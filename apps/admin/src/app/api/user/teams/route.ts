import { NextRequest, NextResponse } from "next/server";
import { requireApiAuth } from "@/lib/api-auth";
import { handleApiError, ForbiddenError } from "@/lib/api-error";
import { prisma } from "@schoolquiz/db";
import { validateRequest } from '@/lib/api-validation';
import { CreateTeamSchema } from '@/lib/validation/schemas';

const MAX_TEAMS_PER_USER = 10;

/**
 * Check if user is premium
 */
function checkPremium(user: any): boolean {
  return (
    user.tier === 'premium' ||
    user.subscriptionStatus === 'ACTIVE' ||
    user.subscriptionStatus === 'TRIALING' ||
    (user.freeTrialUntil && new Date(user.freeTrialUntil) > new Date())
  );
}

/**
 * GET /api/user/teams
 * List all teams for the authenticated user
 */
export async function GET(request: NextRequest) {
  try {
    const user = await requireApiAuth();
    
    // Check if user is premium
    if (!checkPremium(user)) {
      throw new ForbiddenError('Teams feature is only available to premium users');
    }

    // Check if prisma.team exists (Prisma client might not be regenerated)
    if (!prisma.team) {
      console.error('❌ prisma.team is undefined. Prisma client needs to be regenerated.');
      return NextResponse.json(
        {
          error: 'Prisma Team model not available',
          code: 'PRISMA_NOT_GENERATED',
          details: 'Run: cd packages/db && pnpm db:generate, then restart your dev server',
        },
        { status: 503 }
      );
    }

    // Fetch user's teams with completion counts
    let teams;
    try {
      teams = await prisma.team.findMany({
        where: { userId: user.id },
        orderBy: [
          { isDefault: 'desc' }, // Default team first
          { createdAt: 'asc' }, // Then by creation date
        ],
      });
    } catch (dbError: any) {
      // Check if it's a table doesn't exist error
      const errorMessage = dbError.message?.toLowerCase() || '';
      const isTableMissing = 
        dbError.code === 'P2021' || 
        dbError.code === '42P01' || // PostgreSQL: relation does not exist
        errorMessage.includes('does not exist') ||
        (errorMessage.includes('relation') && errorMessage.includes('does not exist')) ||
        (errorMessage.includes('table') && errorMessage.includes('does not exist')) ||
        (errorMessage.includes('teams') && errorMessage.includes('does not exist'));
      
      if (isTableMissing) {
        console.error('❌ Teams table does not exist. Please run migration 017_add_teams_feature.sql');
        console.error('Full error:', {
          code: dbError.code,
          message: dbError.meta || dbError.message,
        });
        return NextResponse.json(
          {
            error: 'Teams table does not exist. Please run the database migration first.',
            code: 'MIGRATION_REQUIRED',
            details: 'Run migration: supabase/migrations/017_add_teams_feature.sql',
            migrationError: process.env.NODE_ENV === 'development' ? dbError.message : undefined,
          },
          { status: 503 }
        );
      }
      // Re-throw other database errors
      throw dbError;
    }

    // OPTIMIZATION: Get completion counts in a single query using groupBy
    // This is much faster than N separate count queries
    let completionCounts = new Map<string, number>();
    try {
      const counts = await prisma.quizCompletion.groupBy({
        by: ['teamId'],
        where: {
          teamId: { in: teams.map(t => t.id) },
        },
        _count: {
          id: true,
        },
      });
      
      counts.forEach((count) => {
        if (count.teamId) {
          completionCounts.set(count.teamId, count._count.id);
        }
      });
    } catch (countError: any) {
      // If counting fails, just use empty map (all counts will be 0)
      console.warn('Failed to count completions:', countError.message);
    }

    // Map teams with their completion counts
    const teamsWithCounts = teams.map((team) => ({
      id: team.id,
      name: team.name,
      color: team.color,
      isDefault: team.isDefault,
      createdAt: team.createdAt.toISOString(),
      updatedAt: team.updatedAt.toISOString(),
      quizCount: completionCounts.get(team.id) || 0,
    }));

    return NextResponse.json({
      teams: teamsWithCounts,
      count: teamsWithCounts.length,
      maxTeams: MAX_TEAMS_PER_USER,
    });
  } catch (error: any) {
    // Log the full error for debugging
    console.error('❌ Teams API GET Error:', {
      message: error.message,
      code: error.code,
      meta: error.meta,
      stack: error.stack,
    });
    return handleApiError(error);
  }
}

/**
 * POST /api/user/teams
 * Create a new team
 */
export async function POST(request: NextRequest) {
  try {
    const user = await requireApiAuth();
    
    // Check if user is premium
    if (!checkPremium(user)) {
      throw new ForbiddenError('Teams feature is only available to premium users');
    }

    // Validate request body
    const body = await validateRequest(request, CreateTeamSchema);
    const { name, color } = body;

    // Check team limit
    const teamCount = await prisma.team.count({
      where: { userId: user.id },
    });

    if (teamCount >= MAX_TEAMS_PER_USER) {
      return NextResponse.json(
        { error: `Maximum of ${MAX_TEAMS_PER_USER} teams allowed` },
        { status: 400 }
      );
    }

    // Check if team name already exists for this user
    const existingTeam = await prisma.team.findUnique({
      where: {
        userId_name: {
          userId: user.id,
          name: name.trim(),
        },
      },
    });

    if (existingTeam) {
      return NextResponse.json(
        { error: 'A team with this name already exists' },
        { status: 400 }
      );
    }

    // If this is the first team, make it default
    const isFirstTeam = teamCount === 0;

    // Create the team
    const team = await prisma.team.create({
      data: {
        userId: user.id,
        name: name.trim(),
        color: color || null,
        isDefault: isFirstTeam,
      },
    });

    return NextResponse.json({
      id: team.id,
      name: team.name,
      color: team.color,
      isDefault: team.isDefault,
      createdAt: team.createdAt.toISOString(),
      updatedAt: team.updatedAt.toISOString(),
      quizCount: 0,
    }, { status: 201 });
  } catch (error: any) {
    // Log the full error for debugging
    console.error('❌ Teams API POST Error:', {
      message: error.message,
      code: error.code,
      meta: error.meta,
      stack: error.stack,
    });
    
    // Check if it's a table doesn't exist error
    if (error.code === 'P2021' || error.message?.includes('does not exist') || (error.message?.includes('relation') && error.message?.includes('does not exist'))) {
      console.error('❌ Teams table does not exist. Please run migration 017_add_teams_feature.sql');
      return NextResponse.json(
        {
          error: 'Teams table does not exist. Please run the database migration first.',
          code: 'MIGRATION_REQUIRED',
          details: 'Run migration: supabase/migrations/017_add_teams_feature.sql',
        },
        { status: 503 }
      );
    }
    
    return handleApiError(error);
  }
}
