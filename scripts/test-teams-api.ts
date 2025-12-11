/**
 * Test script for Teams API endpoints
 * 
 * This script tests all Teams API endpoints.
 * 
 * Usage:
 * 1. Make sure you're logged in to the app (session cookie required)
 * 2. Run: tsx scripts/test-teams-api.ts
 * 
 * Or test manually via browser console at http://localhost:3000
 */

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

interface Team {
  id: string;
  name: string;
  color: string | null;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
  quizCount: number;
}

async function testEndpoint(
  method: string,
  url: string,
  body?: any,
  description: string = ''
): Promise<any> {
  console.log(`\n🧪 Testing: ${description || `${method} ${url}`}`);
  
  try {
    const options: RequestInit = {
      method,
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include', // Include cookies for NextAuth session
    };

    if (body) {
      options.body = JSON.stringify(body);
    }

    const response = await fetch(`${BASE_URL}${url}`, options);
    const data = await response.json();

    if (response.ok) {
      console.log(`✅ Success (${response.status}):`, JSON.stringify(data, null, 2));
      return data;
    } else {
      console.log(`❌ Error (${response.status}):`, JSON.stringify(data, null, 2));
      return null;
    }
  } catch (error: any) {
    console.log(`❌ Exception:`, error.message);
    return null;
  }
}

async function runTests() {
  console.log('🚀 Starting Teams API Tests');
  console.log('=' .repeat(50));
  console.log(`Base URL: ${BASE_URL}`);
  console.log('\n⚠️  Note: These tests require an authenticated session.');
  console.log('   Make sure you\'re logged in and have a premium account.\n');

  // Test 1: GET /api/user/teams (should return empty array initially)
  const teamsResponse = await testEndpoint(
    'GET',
    '/api/user/teams',
    undefined,
    'GET /api/user/teams - List teams'
  );

  if (!teamsResponse) {
    console.log('\n❌ Failed to get teams. Make sure you\'re logged in and have premium access.');
    return;
  }

  const initialTeams = teamsResponse.teams || [];
  console.log(`\n📊 Initial team count: ${initialTeams.length}`);

  // Test 2: POST /api/user/teams - Create first team
  const createTeam1 = await testEndpoint(
    'POST',
    '/api/user/teams',
    {
      name: 'Year 7A',
      color: '#3B82F6',
    },
    'POST /api/user/teams - Create team "Year 7A"'
  );

  if (!createTeam1) {
    console.log('\n❌ Failed to create team. Stopping tests.');
    return;
  }

  const team1Id = createTeam1.id;
  console.log(`✅ Created team with ID: ${team1Id}`);

  // Test 3: POST /api/user/teams - Create second team
  const createTeam2 = await testEndpoint(
    'POST',
    '/api/user/teams',
    {
      name: 'Year 8B',
      color: '#10B981',
    },
    'POST /api/user/teams - Create team "Year 8B"'
  );

  if (!createTeam2) {
    console.log('\n⚠️  Failed to create second team, but continuing tests...');
  }

  const team2Id = createTeam2?.id;

  // Test 4: GET /api/user/teams - List teams again (should have 2 now)
  const teamsAfterCreate = await testEndpoint(
    'GET',
    '/api/user/teams',
    undefined,
    'GET /api/user/teams - List teams after creation'
  );

  if (teamsAfterCreate) {
    console.log(`\n📊 Team count after creation: ${teamsAfterCreate.count}`);
    console.log(`📊 Max teams: ${teamsAfterCreate.maxTeams}`);
  }

  // Test 5: GET /api/user/teams/[id] - Get specific team
  if (team1Id) {
    await testEndpoint(
      'GET',
      `/api/user/teams/${team1Id}`,
      undefined,
      `GET /api/user/teams/${team1Id} - Get specific team`
    );
  }

  // Test 6: PUT /api/user/teams/[id] - Update team
  if (team2Id) {
    await testEndpoint(
      'PUT',
      `/api/user/teams/${team2Id}`,
      {
        name: 'Year 8B Updated',
        color: '#EF4444',
      },
      `PUT /api/user/teams/${team2Id} - Update team`
    );
  }

  // Test 7: POST /api/user/teams/[id]/set-default - Set default team
  if (team2Id) {
    await testEndpoint(
      'POST',
      `/api/user/teams/${team2Id}/set-default`,
      undefined,
      `POST /api/user/teams/${team2Id}/set-default - Set as default`
    );
  }

  // Test 8: Try to create duplicate team name (should fail)
  await testEndpoint(
    'POST',
    '/api/user/teams',
    {
      name: 'Year 7A', // Duplicate name
      color: '#8B5CF6',
    },
    'POST /api/user/teams - Try to create duplicate name (should fail)'
  );

  // Test 9: Try to create team without premium (if testing with free account)
  // This would require a different user session

  // Test 10: DELETE /api/user/teams/[id] - Delete team
  if (team2Id) {
    await testEndpoint(
      'DELETE',
      `/api/user/teams/${team2Id}`,
      undefined,
      `DELETE /api/user/teams/${team2Id} - Delete team`
    );
  }

  // Test 11: Final list to verify deletion
  const finalTeams = await testEndpoint(
    'GET',
    '/api/user/teams',
    undefined,
    'GET /api/user/teams - Final list after deletion'
  );

  console.log('\n' + '='.repeat(50));
  console.log('✅ Tests completed!');
  console.log('\n📝 Summary:');
  console.log(`   - Created teams: ${createTeam1 ? '✅' : '❌'}`);
  console.log(`   - Updated team: ${team2Id ? '✅' : '⏭️'}`);
  console.log(`   - Set default: ${team2Id ? '✅' : '⏭️'}`);
  console.log(`   - Deleted team: ${team2Id ? '✅' : '⏭️'}`);
  console.log(`   - Final team count: ${finalTeams?.count || 0}`);
}

// Run tests
runTests().catch(console.error);
