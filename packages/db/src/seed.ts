import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting database seed...')

  // Create schools
  const school1 = await prisma.school.create({
    data: {
      name: 'Melbourne High School',
      region: 'Victoria',
    },
  })

  const school2 = await prisma.school.create({
    data: {
      name: 'Sydney Grammar School',
      region: 'New South Wales',
    },
  })

  console.log('✅ Created schools')

  // Create teachers
  const teacher1 = await prisma.teacher.create({
    data: {
      email: 'teacher1@melbournehigh.edu.au',
      name: 'Sarah Johnson',
      role: 'admin',
      schoolId: school1.id,
    },
  })

  const teacher2 = await prisma.teacher.create({
    data: {
      email: 'teacher2@melbournehigh.edu.au',
      name: 'Michael Chen',
      role: 'editor',
      schoolId: school1.id,
    },
  })

  const teacher3 = await prisma.teacher.create({
    data: {
      email: 'teacher3@sydneygrammar.edu.au',
      name: 'Emma Wilson',
      role: 'teacher',
      schoolId: school2.id,
    },
  })

  console.log('✅ Created teachers')

  // Create categories
  const categories = await Promise.all([
    prisma.category.create({
      data: {
        name: 'Science & Nature',
        description: 'Questions about biology, chemistry, physics, and natural phenomena',
        difficultyMin: 0.3,
        difficultyMax: 0.8,
        createdBy: teacher1.id,
      },
    }),
    prisma.category.create({
      data: {
        name: 'History & Geography',
        description: 'Historical events, world geography, and cultural knowledge',
        difficultyMin: 0.4,
        difficultyMax: 0.7,
        createdBy: teacher1.id,
      },
    }),
    prisma.category.create({
      data: {
        name: 'Pop Culture',
        description: 'Movies, music, TV shows, and current trends',
        difficultyMin: 0.2,
        difficultyMax: 0.6,
        createdBy: teacher2.id,
      },
    }),
    prisma.category.create({
      data: {
        name: 'Sports',
        description: 'Athletics, team sports, and sporting achievements',
        difficultyMin: 0.3,
        difficultyMax: 0.7,
        createdBy: teacher2.id,
      },
    }),
    prisma.category.create({
      data: {
        name: 'Literature & Arts',
        description: 'Books, authors, artists, and creative works',
        difficultyMin: 0.4,
        difficultyMax: 0.8,
        createdBy: teacher3.id,
      },
    }),
  ])

  console.log('✅ Created categories')

  // Create sample questions
  const questions = await Promise.all([
    prisma.question.create({
      data: {
        categoryId: categories[0].id,
        text: 'What is the chemical symbol for gold?',
        answer: 'Au',
        explanation: 'Gold has the chemical symbol Au, derived from the Latin word "aurum".',
        difficulty: 0.6,
        tags: 'chemistry,science,elements',
        status: 'published',
        createdBy: teacher1.id,
      },
    }),
    prisma.question.create({
      data: {
        categoryId: categories[1].id,
        text: 'Which country is known as the "Land of the Rising Sun"?',
        answer: 'Japan',
        explanation: 'Japan is called the "Land of the Rising Sun" because it is located east of China.',
        difficulty: 0.5,
        tags: 'geography,countries,nicknames',
        status: 'published',
        createdBy: teacher1.id,
      },
    }),
    prisma.question.create({
      data: {
        categoryId: categories[2].id,
        text: 'What streaming service created the series "Stranger Things"?',
        answer: 'Netflix',
        explanation: 'Stranger Things is a Netflix original series created by the Duffer Brothers.',
        difficulty: 0.4,
        tags: 'streaming,tv,netflix',
        status: 'published',
        createdBy: teacher2.id,
      },
    }),
  ])

  console.log('✅ Created questions')

  // Create a sample quiz
  const quiz = await prisma.quiz.create({
    data: {
      title: 'Weekly Quiz #1',
      blurb: 'A fun quiz covering science, history, and pop culture',
      audience: 'Year 10 students',
      difficultyBand: 'medium',
      status: 'published',
      createdBy: teacher1.id,
      schoolId: school1.id,
    },
  })

  console.log('✅ Created quiz')

  // Create rounds for the quiz
  const rounds = await Promise.all([
    prisma.round.create({
      data: {
        quizId: quiz.id,
        index: 1,
        categoryId: categories[0].id,
        blurb: 'Test your science knowledge',
        targetDifficulty: 0.6,
      },
    }),
    prisma.round.create({
      data: {
        quizId: quiz.id,
        index: 2,
        categoryId: categories[1].id,
        blurb: 'History and geography challenge',
        targetDifficulty: 0.5,
      },
    }),
  ])

  console.log('✅ Created rounds')

  // Add questions to rounds
  await Promise.all([
    prisma.quizRoundQuestion.create({
      data: {
        roundId: rounds[0].id,
        questionId: questions[0].id,
        order: 1,
      },
    }),
    prisma.quizRoundQuestion.create({
      data: {
        roundId: rounds[1].id,
        questionId: questions[1].id,
        order: 1,
      },
    }),
  ])

  console.log('✅ Added questions to rounds')

  // Create a sample run
  const run = await prisma.run.create({
    data: {
      quizId: quiz.id,
      schoolId: school1.id,
      teacherId: teacher1.id,
      audienceSize: 25,
      notes: 'First quiz run with Year 10 students',
      source: 'projected',
    },
  })

  console.log('✅ Created run')

  // Create run statistics
  await Promise.all([
    prisma.runQuestionStat.create({
      data: {
        runId: run.id,
        questionId: questions[0].id,
        shownOrder: 1,
        correct: 18,
        incorrect: 5,
        skipped: 2,
        avgSecs: 12.5,
      },
    }),
    prisma.runQuestionStat.create({
      data: {
        runId: run.id,
        questionId: questions[1].id,
        shownOrder: 2,
        correct: 22,
        incorrect: 2,
        skipped: 1,
        avgSecs: 8.3,
      },
    }),
  ])

  console.log('✅ Created run statistics')
  console.log('🎉 Database seeded successfully!')
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

