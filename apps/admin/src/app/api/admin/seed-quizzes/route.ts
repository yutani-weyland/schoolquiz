/**
 * POST /api/admin/seed-quizzes
 * Seed database with quiz data from fixtures
 * 
 * This endpoint seeds the database with quiz data from the mock fixtures.
 * Run this once to populate the database.
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@schoolquiz/db';
import { MOCK_QUIZ_DATA } from '@/lib/mock/quiz-fixtures';

// Helper to generate CUID-like IDs
function generateId(): string {
  return `c${Date.now().toString(36)}${Math.random().toString(36).substr(2, 9)}`;
}

export async function POST(request: NextRequest) {
  try {
    console.log('🌱 Starting quiz seeding...');

    // Get or create a default teacher (needed for quiz creation)
    let teacher = await prisma.teacher.findFirst();
    if (!teacher) {
      // Create a default school first
      const school = await prisma.school.create({
        data: {
          id: generateId(),
          name: 'Default School',
          region: 'NSW',
        },
      });

      // Create a default teacher
      teacher = await prisma.teacher.create({
        data: {
          id: generateId(),
          schoolId: school.id,
          email: 'admin@schoolquiz.com',
          name: 'Admin Teacher',
          role: 'admin',
        },
      });
      console.log('✅ Created default school and teacher');
    }

    // Get or create default category
    let category = await prisma.category.findFirst({
      where: { name: 'General Knowledge' },
    });
    if (!category) {
      category = await prisma.category.create({
        data: {
          id: generateId(),
          name: 'General Knowledge',
          description: 'General knowledge questions',
          createdBy: teacher.id,
        },
      });
      console.log('✅ Created default category');
    }

    const results = {
      created: 0,
      skipped: 0,
      errors: [] as string[],
    };

    // Process each quiz in the fixtures
    for (const [slug, quizData] of Object.entries(MOCK_QUIZ_DATA)) {
      try {
        console.log(`\n📝 Processing quiz: ${slug}`);

        // Check if quiz already exists
        const existingQuiz = await prisma.quiz.findUnique({
          where: { slug },
        });

        if (existingQuiz) {
          console.log(`  ⏭️  Quiz ${slug} already exists, skipping...`);
          results.skipped++;
          continue;
        }

        // Create quiz
        const quiz = await prisma.quiz.create({
          data: {
            id: generateId(),
            slug,
            title: `Quiz ${slug}`,
            blurb: `Quiz number ${slug}`,
            status: 'published',
            colorHex: '#FFE135', // Default yellow
            createdBy: teacher.id,
            weekISO: new Date().toISOString().split('T')[0], // Today's date as ISO
          },
        });
        console.log(`  ✅ Created quiz: ${quiz.id}`);

        // Create rounds
        for (let i = 0; i < quizData.rounds.length; i++) {
          const roundData = quizData.rounds[i];
          const isPeoplesRound = i === quizData.rounds.length - 1; // Last round is people's round

          const round = await prisma.round.create({
            data: {
              id: generateId(),
              quizId: quiz.id,
              index: i, // 0-indexed
              categoryId: category.id,
              title: roundData.title || null,
              blurb: roundData.blurb || null,
              isPeoplesRound,
            },
          });
          console.log(`    ✅ Created round ${i + 1}: ${roundData.title || 'Untitled'}`);

          // Get questions for this round
          const roundQuestions = quizData.questions.filter(
            (q) => q.roundNumber === i + 1
          );

          // Create questions and link them to the round
          for (let j = 0; j < roundQuestions.length; j++) {
            const questionData = roundQuestions[j];

            // Create question
            const question = await prisma.question.create({
              data: {
                id: generateId(),
                categoryId: category.id,
                text: questionData.question,
                answer: questionData.answer,
                difficulty: 0.5, // Default difficulty
                status: 'published',
                createdBy: teacher.id,
                isPeopleQuestion: isPeoplesRound,
              },
            });

            // Link question to round
            await prisma.quizRoundQuestion.create({
              data: {
                id: generateId(),
                roundId: round.id,
                questionId: question.id,
                order: j, // 0-indexed
              },
            });
          }
          console.log(`      ✅ Created ${roundQuestions.length} questions for round ${i + 1}`);
        }

        results.created++;
      } catch (error: any) {
        const errorMsg = `Error seeding quiz ${slug}: ${error.message}`;
        console.error(`  ❌ ${errorMsg}`);
        results.errors.push(errorMsg);
      }
    }

    console.log('\n🎉 Quiz seeding complete!');
    console.log(`Created: ${results.created}, Skipped: ${results.skipped}, Errors: ${results.errors.length}`);

    return NextResponse.json({
      success: true,
      message: 'Quiz seeding completed',
      results,
    });
  } catch (error: any) {
    console.error('❌ Error seeding quizzes:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to seed quizzes',
        details: error.message,
      },
      { status: 500 }
    );
  }
}

