/**
 * Script to add sample questions to a quiz that has no questions
 * 
 * Usage:
 *   npx tsx scripts/add_questions_to_quiz.ts <quiz-slug> [category-name] [teacher-email]
 * 
 * Examples:
 *   npx tsx scripts/add_questions_to_quiz.ts quiz-12
 *   npx tsx scripts/add_questions_to_quiz.ts quiz-12 "History" "teacher@example.com"
 */

import { prisma } from '../packages/db/src';

async function addQuestionsToQuiz(
  quizSlug: string,
  categoryName?: string,
  teacherEmail?: string
) {
  try {
    // Find the quiz
    const quiz = await prisma.quiz.findUnique({
      where: { slug: quizSlug },
      include: {
        rounds: {
          include: {
            questions: true,
          },
        },
      },
    });

    if (!quiz) {
      console.error(`❌ Quiz with slug "${quizSlug}" not found`);
      process.exit(1);
    }

    // Check if quiz already has questions
    const totalQuestions = quiz.rounds.reduce(
      (sum, round) => sum + round.questions.length,
      0
    );

    if (totalQuestions > 0) {
      console.log(`⚠️  Quiz "${quiz.title}" already has ${totalQuestions} questions`);
      console.log('   Skipping question creation.');
      process.exit(0);
    }

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
      console.error('❌ No category found. Please create a category first.');
      process.exit(1);
    }

    console.log(`✅ Using category: ${category.name}`);

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
      console.error('❌ No teacher found. Please create a teacher first.');
      process.exit(1);
    }

    console.log(`✅ Using teacher: ${teacher.name || teacher.email}`);

    // Create 4 standard rounds with 6 questions each
    const rounds = [];
    for (let roundIndex = 0; roundIndex < 4; roundIndex++) {
      const round = await prisma.round.create({
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
                  text: `Sample question ${roundIndex + 1}.${qIndex + 1}`,
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
      rounds.push(round);
      console.log(`✅ Created round ${roundIndex + 1} with 6 questions`);
    }

    // Create finale round with 1 question
    const finaleRound = await prisma.round.create({
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
                text: 'Sample finale question',
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

    console.log(`✅ Created finale round with 1 question`);

    console.log(`\n🎉 Successfully added 25 questions (4 rounds x 6 + 1 finale) to quiz "${quiz.title}"`);
    console.log(`   Quiz slug: ${quiz.slug}`);
    console.log(`   Total rounds: 5`);
    console.log(`   Total questions: 25`);

    await prisma.$disconnect();
  } catch (error) {
    console.error('❌ Error adding questions:', error);
    await prisma.$disconnect();
    process.exit(1);
  }
}

// Parse command line arguments
const args = process.argv.slice(2);
if (args.length === 0) {
  console.error('Usage: npx tsx scripts/add_questions_to_quiz.ts <quiz-slug> [category-name] [teacher-email]');
  process.exit(1);
}

const [quizSlug, categoryName, teacherEmail] = args;
addQuestionsToQuiz(quizSlug, categoryName, teacherEmail);







