/**
 * Script to add sample questions to ALL quizzes that have no questions
 * 
 * Usage:
 *   npx tsx scripts/add_questions_to_all_empty_quizzes.ts [category-name] [teacher-email]
 * 
 * Examples:
 *   npx tsx scripts/add_questions_to_all_empty_quizzes.ts
 *   npx tsx scripts/add_questions_to_all_empty_quizzes.ts "History" "teacher@example.com"
 */

import { prisma } from '../packages/db/src';

async function addQuestionsToAllEmptyQuizzes(
  categoryName?: string,
  teacherEmail?: string
) {
  try {
    // Find all quizzes without questions
    const quizzesWithoutQuestions = await prisma.quiz.findMany({
      where: {
        rounds: {
          none: {
            questions: {
              some: {},
            },
          },
        },
      },
      include: {
        rounds: {
          include: {
            questions: true,
          },
        },
      },
    });

    if (quizzesWithoutQuestions.length === 0) {
      console.log('✅ All quizzes already have questions!');
      await prisma.$disconnect();
      return;
    }

    console.log(`\n📋 Found ${quizzesWithoutQuestions.length} quiz(es) without questions:\n`);
    quizzesWithoutQuestions.forEach((quiz) => {
      console.log(`   - ${quiz.slug}: "${quiz.title}" (${quiz.status})`);
    });

    // Get or find category
    let category;
    if (categoryName) {
      category = await prisma.category.findFirst({
        where: {
          name: { contains: categoryName, mode: 'insensitive' },
          parentId: { not: null }, // Use subcategories
        },
      });
    }

    if (!category) {
      // Get any subcategory as fallback
      category = await prisma.category.findFirst({
        where: {
          parentId: { not: null },
        },
      });
    }

    if (!category) {
      console.error('\n❌ No category found. Please create a category first.');
      await prisma.$disconnect();
      process.exit(1);
    }

    console.log(`\n✅ Using category: ${category.name}`);

    // Get or find teacher
    let teacher;
    if (teacherEmail) {
      teacher = await prisma.teacher.findFirst({
        where: { email: teacherEmail },
      });
    }

    if (!teacher) {
      // Get any teacher as fallback
      teacher = await prisma.teacher.findFirst();
    }

    if (!teacher) {
      console.error('\n❌ No teacher found. Please create a teacher first.');
      await prisma.$disconnect();
      process.exit(1);
    }

    console.log(`✅ Using teacher: ${teacher.name || teacher.email}\n`);

    // Process each quiz
    let successCount = 0;
    let skipCount = 0;
    let errorCount = 0;

    for (const quiz of quizzesWithoutQuestions) {
      try {
        // Check if quiz already has questions (double-check)
        const quizWithRounds = await prisma.quiz.findUnique({
          where: { id: quiz.id },
          include: {
            rounds: {
              include: {
                questions: true,
              },
            },
          },
        });

        const totalQuestions = quizWithRounds?.rounds.reduce(
          (sum, round) => sum + round.questions.length,
          0
        ) || 0;

        if (totalQuestions > 0) {
          console.log(`⏭️  Skipping "${quiz.title}" - already has ${totalQuestions} questions`);
          skipCount++;
          continue;
        }

        console.log(`\n📝 Processing: "${quiz.title}" (${quiz.slug})...`);

        // Use rounds from the initial query, or fetch fresh if needed
        const existingRounds = quiz.rounds.length > 0 
          ? quiz.rounds 
          : (quizWithRounds?.rounds || []);
        const existingRoundCount = existingRounds.length;

        // If rounds exist but have no questions, add questions to existing rounds
        if (existingRoundCount > 0) {
          console.log(`   Found ${existingRoundCount} existing round(s), adding questions...`);
          
          for (const round of existingRounds) {
            const isFinale = round.index === 4 || round.isPeoplesRound;
            const questionsToAdd = isFinale ? 1 : 6;
            
            for (let qIndex = 0; qIndex < questionsToAdd; qIndex++) {
              await prisma.quizRoundQuestion.create({
                data: {
                  roundId: round.id,
                  question: {
                    create: {
                      categoryId: round.categoryId,
                      text: `Sample question ${round.index + 1}.${qIndex + 1} for ${quiz.title}`,
                      answer: `Sample answer ${round.index + 1}.${qIndex + 1}`,
                      difficulty: 0.5,
                      status: 'published',
                      createdBy: teacher.id,
                      isCustom: false,
                      isPeopleQuestion: isFinale,
                    },
                  },
                  order: qIndex,
                },
              });
            }
          }
          
          const totalAdded = existingRounds.reduce((sum, round) => {
            const isFinale = round.index === 4 || round.isPeoplesRound;
            return sum + (isFinale ? 1 : 6);
          }, 0);
          
          console.log(`   ✅ Added ${totalAdded} questions to existing rounds`);
        } else {
          // Create 4 standard rounds with 6 questions each
          for (let roundIndex = 0; roundIndex < 4; roundIndex++) {
            await prisma.round.create({
              data: {
                quizId: quiz.id,
                index: roundIndex,
                categoryId: category.id,
                title: `Round ${roundIndex + 1}`,
                isPeoplesRound: false,
                questions: {
                  create: Array.from({ length: 6 }, (_, qIndex) => ({
                    question: {
                      create: {
                        categoryId: category.id,
                        text: `Sample question ${roundIndex + 1}.${qIndex + 1} for ${quiz.title}`,
                        answer: `Sample answer ${roundIndex + 1}.${qIndex + 1}`,
                        difficulty: 0.5,
                        status: 'published',
                        createdBy: teacher.id,
                        isCustom: false,
                        isPeopleQuestion: false,
                      },
                    },
                    order: qIndex,
                  })),
                },
              },
            });
          }

          // Create finale round with 1 question
          await prisma.round.create({
            data: {
              quizId: quiz.id,
              index: 4,
              categoryId: category.id,
              title: 'Finale',
              isPeoplesRound: true,
              questions: {
                create: {
                  question: {
                    create: {
                      categoryId: category.id,
                      text: `Sample finale question for ${quiz.title}`,
                      answer: 'Sample finale answer',
                      difficulty: 0.5,
                      status: 'published',
                      createdBy: teacher.id,
                      isCustom: false,
                      isPeopleQuestion: true,
                    },
                  },
                  order: 0,
                },
              },
            },
          });
          
          console.log(`   ✅ Created 5 rounds with 25 questions total`);
        }

        console.log(`   ✅ Added 25 questions (4 rounds x 6 + 1 finale)`);
        successCount++;
      } catch (error) {
        console.error(`   ❌ Error processing "${quiz.title}":`, error);
        errorCount++;
      }
    }

    console.log(`\n\n📊 Summary:`);
    console.log(`   ✅ Successfully processed: ${successCount} quiz(es)`);
    if (skipCount > 0) {
      console.log(`   ⏭️  Skipped: ${skipCount} quiz(es)`);
    }
    if (errorCount > 0) {
      console.log(`   ❌ Errors: ${errorCount} quiz(es)`);
    }
    console.log(`   📝 Total questions added: ${successCount * 25}`);

    await prisma.$disconnect();
  } catch (error) {
    console.error('❌ Error:', error);
    await prisma.$disconnect();
    process.exit(1);
  }
}

// Parse command line arguments
const args = process.argv.slice(2);
const [categoryName, teacherEmail] = args;
addQuestionsToAllEmptyQuizzes(categoryName, teacherEmail);

