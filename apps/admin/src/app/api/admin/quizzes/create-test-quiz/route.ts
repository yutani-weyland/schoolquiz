import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@schoolquiz/db'

/**
 * POST /api/admin/quizzes/create-test-quiz
 * Creates a complete test quiz with all fields filled for PDF testing
 */
export async function POST(request: NextRequest) {
  try {
    // First, ensure we have a school
    let school = await prisma.school.findFirst({
      where: { name: 'Test School' },
    })

    if (!school) {
      school = await prisma.school.create({
        data: {
          name: 'Test School',
          region: 'Test Region',
        },
      })
    }

    // Get or create a teacher/admin user for createdBy
    let adminUser = await prisma.teacher.findFirst({
      where: { email: 'admin@test.com' },
    })

    if (!adminUser) {
      adminUser = await prisma.teacher.create({
        data: {
          email: 'admin@test.com',
          name: 'Test Admin',
          role: 'PlatformAdmin',
          schoolId: school.id,
        },
      })
    }

    // First, ensure we have categories
    // Use findUnique if name is unique, otherwise findFirst
    let historyCategory = await prisma.category.findFirst({
      where: { name: 'History' },
    })

    if (!historyCategory) {
      try {
        historyCategory = await prisma.category.create({
          data: {
            name: 'History',
            parentId: null,
            createdBy: adminUser.id,
          },
        })
      } catch (createError: any) {
        // If unique constraint error, try to find again
        if (createError.code === 'P2002') {
          historyCategory = await prisma.category.findFirst({
            where: { name: 'History' },
          })
        } else {
          throw createError
        }
      }
    }

    let geographyCategory = await prisma.category.findFirst({
      where: { name: 'Geography' },
    })

    if (!geographyCategory) {
      try {
        geographyCategory = await prisma.category.create({
          data: {
            name: 'Geography',
            parentId: null,
            createdBy: adminUser.id,
          },
        })
      } catch (createError: any) {
        if (createError.code === 'P2002') {
          geographyCategory = await prisma.category.findFirst({
            where: { name: 'Geography' },
          })
        } else {
          throw createError
        }
      }
    }

    let scienceCategory = await prisma.category.findFirst({
      where: { name: 'Science' },
    })

    if (!scienceCategory) {
      try {
        scienceCategory = await prisma.category.create({
          data: {
            name: 'Science',
            parentId: null,
            createdBy: adminUser.id,
          },
        })
      } catch (createError: any) {
        if (createError.code === 'P2002') {
          scienceCategory = await prisma.category.findFirst({
            where: { name: 'Science' },
          })
        } else {
          throw createError
        }
      }
    }

    let cultureCategory = await prisma.category.findFirst({
      where: { name: 'Culture' },
    })

    if (!cultureCategory) {
      try {
        cultureCategory = await prisma.category.create({
          data: {
            name: 'Culture',
            parentId: null,
            createdBy: adminUser.id,
          },
        })
      } catch (createError: any) {
        if (createError.code === 'P2002') {
          cultureCategory = await prisma.category.findFirst({
            where: { name: 'Culture' },
          })
        } else {
          throw createError
        }
      }
    }

    // Create the quiz
    const quiz = await prisma.quiz.create({
      data: {
        title: 'Test Quiz: World Knowledge Challenge',
        status: 'draft',
        createdBy: adminUser.id,
        rounds: {
          create: [
            // Round 1: History
            {
              index: 0,
              categoryId: historyCategory.id,
              title: 'World War II History',
              isPeoplesRound: false,
              questions: {
                create: [
                  {
                    order: 0,
                    question: {
                      create: {
                        text: 'In which year did World War II end?',
                        answer: '1945',
                        explanation: 'World War II ended in 1945 with the surrender of Japan.',
                        categoryId: historyCategory.id,
                        createdBy: adminUser.id,
                        difficulty: 0.5,
                        status: 'published',
                      },
                    },
                  },
                  {
                    order: 1,
                    question: {
                      create: {
                        text: 'Which country was known as the "Third Reich" during WWII?',
                        answer: 'Germany',
                        explanation: 'Nazi Germany was referred to as the Third Reich.',
                        categoryId: historyCategory.id,
                        createdBy: adminUser.id,
                        difficulty: 0.6,
                        status: 'published',
                      },
                    },
                  },
                  {
                    order: 2,
                    question: {
                      create: {
                        text: 'What was the code name for the D-Day landings?',
                        answer: 'Operation Overlord',
                        explanation: 'Operation Overlord was the code name for the Battle of Normandy.',
                        categoryId: historyCategory.id,
                        createdBy: adminUser.id,
                        difficulty: 0.7,
                        status: 'published',
                      },
                    },
                  },
                  {
                    order: 3,
                    question: {
                      create: {
                        text: 'Which two cities were atomic bombs dropped on in Japan?',
                        answer: 'Hiroshima and Nagasaki',
                        explanation: 'The atomic bombs were dropped on Hiroshima (August 6) and Nagasaki (August 9, 1945).',
                        categoryId: historyCategory.id,
                        createdBy: adminUser.id,
                        difficulty: 0.6,
                        status: 'published',
                      },
                    },
                  },
                  {
                    order: 4,
                    question: {
                      create: {
                        text: 'Who was the Prime Minister of the United Kingdom for most of WWII?',
                        answer: 'Winston Churchill',
                        explanation: 'Winston Churchill served as Prime Minister from 1940 to 1945.',
                        categoryId: historyCategory.id,
                        createdBy: adminUser.id,
                        difficulty: 0.5,
                        status: 'published',
                      },
                    },
                  },
                  {
                    order: 5,
                    question: {
                      create: {
                        text: 'What was the name of the German air force during WWII?',
                        answer: 'Luftwaffe',
                        explanation: 'The Luftwaffe was the aerial warfare branch of the German Wehrmacht.',
                        categoryId: historyCategory.id,
                        createdBy: adminUser.id,
                        difficulty: 0.6,
                        status: 'published',
                      },
                    },
                  },
                ],
              },
            },
            // Round 2: Geography
            {
              index: 1,
              categoryId: geographyCategory.id,
              title: 'World Geography',
              isPeoplesRound: false,
              questions: {
                create: [
                  {
                    order: 0,
                    question: {
                      create: {
                        text: 'What is the largest ocean on Earth?',
                        answer: 'Pacific Ocean',
                        explanation: 'The Pacific Ocean covers about one-third of the Earth\'s surface.',
                        categoryId: geographyCategory.id,
                        createdBy: adminUser.id,
                        difficulty: 0.4,
                        status: 'published',
                      },
                    },
                  },
                  {
                    order: 1,
                    question: {
                      create: {
                        text: 'Which is the longest river in the world?',
                        answer: 'Nile River',
                        explanation: 'The Nile River is approximately 6,650 km (4,130 miles) long.',
                        categoryId: geographyCategory.id,
                        createdBy: adminUser.id,
                        difficulty: 0.5,
                        status: 'published',
                      },
                    },
                  },
                  {
                    order: 2,
                    question: {
                      create: {
                        text: 'What is the smallest country in the world by land area?',
                        answer: 'Vatican City',
                        explanation: 'Vatican City is only 0.17 square miles (0.44 km²).',
                        categoryId: geographyCategory.id,
                        createdBy: adminUser.id,
                        difficulty: 0.6,
                        status: 'published',
                      },
                    },
                  },
                  {
                    order: 3,
                    question: {
                      create: {
                        text: 'Which mountain range separates Europe from Asia?',
                        answer: 'Ural Mountains',
                        explanation: 'The Ural Mountains form a natural boundary between Europe and Asia.',
                        categoryId: geographyCategory.id,
                        createdBy: adminUser.id,
                        difficulty: 0.6,
                        status: 'published',
                      },
                    },
                  },
                  {
                    order: 4,
                    question: {
                      create: {
                        text: 'What is the capital city of Australia?',
                        answer: 'Canberra',
                        explanation: 'Canberra became the capital in 1913, chosen as a compromise between Sydney and Melbourne.',
                        categoryId: geographyCategory.id,
                        createdBy: adminUser.id,
                        difficulty: 0.5,
                        status: 'published',
                      },
                    },
                  },
                  {
                    order: 5,
                    question: {
                      create: {
                        text: 'Which desert is the largest hot desert in the world?',
                        answer: 'Sahara Desert',
                        explanation: 'The Sahara covers most of North Africa and is about 9.2 million square kilometers.',
                        categoryId: geographyCategory.id,
                        createdBy: adminUser.id,
                        difficulty: 0.5,
                        status: 'published',
                      },
                    },
                  },
                ],
              },
            },
            // Round 3: Science
            {
              index: 2,
              categoryId: scienceCategory.id,
              title: 'General Science',
              isPeoplesRound: false,
              questions: {
                create: [
                  {
                    order: 0,
                    question: {
                      create: {
                        text: 'What is the chemical symbol for gold?',
                        answer: 'Au',
                        explanation: 'Au comes from the Latin word "aurum" meaning gold.',
                        categoryId: scienceCategory.id,
                        createdBy: adminUser.id,
                        difficulty: 0.5,
                        status: 'published',
                      },
                    },
                  },
                  {
                    order: 1,
                    question: {
                      create: {
                        text: 'How many bones are in the adult human body?',
                        answer: '206',
                        explanation: 'An adult human skeleton typically has 206 bones.',
                        categoryId: scienceCategory.id,
                        createdBy: adminUser.id,
                        difficulty: 0.6,
                        status: 'published',
                      },
                    },
                  },
                  {
                    order: 2,
                    question: {
                      create: {
                        text: 'What is the speed of light in a vacuum?',
                        answer: '299,792,458 meters per second',
                        explanation: 'Light travels at approximately 300,000 km/s in a vacuum.',
                        categoryId: scienceCategory.id,
                        createdBy: adminUser.id,
                        difficulty: 0.7,
                        status: 'published',
                      },
                    },
                  },
                  {
                    order: 3,
                    question: {
                      create: {
                        text: 'Which planet is known as the Red Planet?',
                        answer: 'Mars',
                        explanation: 'Mars appears red due to iron oxide (rust) on its surface.',
                        categoryId: scienceCategory.id,
                        createdBy: adminUser.id,
                        difficulty: 0.4,
                        status: 'published',
                      },
                    },
                  },
                  {
                    order: 4,
                    question: {
                      create: {
                        text: 'What is the hardest natural substance on Earth?',
                        answer: 'Diamond',
                        explanation: 'Diamond is the hardest known natural material.',
                        categoryId: scienceCategory.id,
                        createdBy: adminUser.id,
                        difficulty: 0.5,
                        status: 'published',
                      },
                    },
                  },
                  {
                    order: 5,
                    question: {
                      create: {
                        text: 'What process do plants use to make food?',
                        answer: 'Photosynthesis',
                        explanation: 'Photosynthesis converts light energy into chemical energy.',
                        categoryId: scienceCategory.id,
                        createdBy: adminUser.id,
                        difficulty: 0.5,
                        status: 'published',
                      },
                    },
                  },
                ],
              },
            },
            // Round 4: Culture
            {
              index: 3,
              categoryId: cultureCategory.id,
              title: 'World Culture',
              isPeoplesRound: false,
              questions: {
                create: [
                  {
                    order: 0,
                    question: {
                      create: {
                        text: 'Which language is spoken by the most people as their first language?',
                        answer: 'Mandarin Chinese',
                        explanation: 'Mandarin Chinese has over 900 million native speakers.',
                        categoryId: cultureCategory.id,
                        createdBy: adminUser.id,
                        difficulty: 0.6,
                        status: 'published',
                      },
                    },
                  },
                  {
                    order: 1,
                    question: {
                      create: {
                        text: 'In which country did the Olympic Games originate?',
                        answer: 'Greece',
                        explanation: 'The ancient Olympic Games began in Olympia, Greece around 776 BCE.',
                        categoryId: cultureCategory.id,
                        createdBy: adminUser.id,
                        difficulty: 0.5,
                        status: 'published',
                      },
                    },
                  },
                  {
                    order: 2,
                    question: {
                      create: {
                        text: 'Who painted the Mona Lisa?',
                        answer: 'Leonardo da Vinci',
                        explanation: 'Leonardo da Vinci painted the Mona Lisa between 1503 and 1519.',
                        categoryId: cultureCategory.id,
                        createdBy: adminUser.id,
                        difficulty: 0.5,
                        status: 'published',
                      },
                    },
                  },
                  {
                    order: 3,
                    question: {
                      create: {
                        text: 'What is the national sport of Japan?',
                        answer: 'Sumo wrestling',
                        explanation: 'Sumo wrestling is considered Japan\'s national sport.',
                        categoryId: cultureCategory.id,
                        createdBy: adminUser.id,
                        difficulty: 0.6,
                        status: 'published',
                      },
                    },
                  },
                  {
                    order: 4,
                    question: {
                      create: {
                        text: 'Which festival is known as the "Festival of Lights"?',
                        answer: 'Diwali',
                        explanation: 'Diwali is a major Hindu festival celebrated in India and other countries.',
                        categoryId: cultureCategory.id,
                        createdBy: adminUser.id,
                        difficulty: 0.6,
                        status: 'published',
                      },
                    },
                  },
                  {
                    order: 5,
                    question: {
                      create: {
                        text: 'What is the traditional dance of Spain?',
                        answer: 'Flamenco',
                        explanation: 'Flamenco is a passionate dance form from Andalusia, Spain.',
                        categoryId: cultureCategory.id,
                        createdBy: adminUser.id,
                        difficulty: 0.5,
                        status: 'published',
                      },
                    },
                  },
                ],
              },
            },
            // Round 5: People's Question
            {
              index: 4,
              categoryId: cultureCategory.id,
              title: "People's Question",
              isPeoplesRound: true,
              questions: {
                create: [
                  {
                    order: 0,
                    question: {
                      create: {
                        text: 'What is your favorite way to spend a weekend?',
                        answer: 'Answers will vary',
                        explanation: 'This is a subjective question where participants share their personal preferences.',
                        categoryId: cultureCategory.id,
                        createdBy: adminUser.id,
                        difficulty: 0.3,
                        status: 'published',
                      },
                    },
                  },
                ],
              },
            },
          ],
        },
      },
      include: {
        rounds: {
          include: {
            questions: {
              include: {
                question: true,
              },
              orderBy: { order: 'asc' },
            },
            category: true,
          },
          orderBy: { index: 'asc' },
        },
      },
    })

    return NextResponse.json({
      success: true,
      quiz: {
        id: quiz.id,
        title: quiz.title,
        status: quiz.status,
        message: 'Test quiz created successfully! You can now test the PDF functionality.',
      },
    })
  } catch (error: any) {
    console.error('Error creating test quiz:', error)
    
    // Provide more detailed error information
    let errorMessage = 'Failed to create test quiz'
    let errorDetails = error.message || 'Unknown error'
    
    // Handle Prisma-specific errors
    if (error.code === 'P2002') {
      errorMessage = 'Unique constraint violation'
      errorDetails = `A record with this value already exists: ${error.meta?.target?.join(', ') || 'unknown field'}`
    } else if (error.code === 'P2003') {
      errorMessage = 'Foreign key constraint violation'
      errorDetails = `Referenced record does not exist: ${error.meta?.field_name || 'unknown field'}`
    } else if (error.code === 'P2025') {
      errorMessage = 'Record not found'
      errorDetails = error.meta?.cause || error.message
    }
    
    return NextResponse.json(
      {
        error: errorMessage,
        details: errorDetails,
        code: error.code,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      },
      { status: 500 }
    )
  }
}

