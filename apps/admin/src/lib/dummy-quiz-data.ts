// Dummy data for quizzes and runs for testing admin interface
import { getQuizColor } from './colors'

// Helper to extract numeric ID from quiz ID string (e.g., 'quiz-1' -> 1)
function getNumericId(quizId: string): number {
  const match = quizId.match(/\d+/)
  return match ? parseInt(match[0], 10) : 1
}

export const dummyQuizzes = [
  {
    id: 'quiz-1',
    title: 'Week 1 - Australian History & Geography',
    blurb: 'Test your knowledge of Australian history and geography',
    audience: 'Year 7-9',
    difficultyBand: 'Intermediate',
    theme: 'Australia',
    seasonalTag: null,
    publicationDate: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
    status: 'published',
    colorHex: getQuizColor(getNumericId('quiz-1')),
    createdBy: 'user-1',
    createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
    _count: {
      rounds: 5,
      runs: 12,
    },
  },
  {
    id: 'quiz-2',
    title: 'Week 2 - Science & Nature',
    blurb: 'Explore the wonders of science and nature',
    audience: 'Year 7-9',
    difficultyBand: 'Intermediate',
    theme: 'Science',
    seasonalTag: null,
    publicationDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    status: 'published',
    colorHex: getQuizColor(getNumericId('quiz-2')),
    createdBy: 'user-1',
    createdAt: new Date(Date.now() - 23 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    _count: {
      rounds: 5,
      runs: 8,
    },
  },
  {
    id: 'quiz-3',
    title: 'Week 3 - Pop Culture & Entertainment',
    blurb: 'Test your knowledge of movies, music, and pop culture',
    audience: 'Year 7-9',
    difficultyBand: 'Intermediate',
    theme: 'Entertainment',
    seasonalTag: null,
    publicationDate: new Date().toISOString(),
    status: 'published',
    colorHex: getQuizColor(getNumericId('quiz-3')),
    createdBy: 'user-3',
    createdAt: new Date(Date.now() - 16 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date().toISOString(),
    _count: {
      rounds: 5,
      runs: 3,
    },
  },
  {
    id: 'quiz-4',
    title: 'Week 4 - Sports & Athletics',
    blurb: 'Challenge yourself with sports trivia',
    audience: 'Year 7-9',
    difficultyBand: 'Intermediate',
    theme: 'Sports',
    seasonalTag: null,
    publicationDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    status: 'scheduled',
    colorHex: getQuizColor(getNumericId('quiz-4')),
    createdBy: 'user-1',
    createdAt: new Date(Date.now() - 9 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    _count: {
      rounds: 5,
      runs: 0,
    },
  },
  {
    id: 'quiz-5',
    title: 'Week 5 - Civics & Government',
    blurb: 'Learn about Australian government and civics',
    audience: 'Year 7-9',
    difficultyBand: 'Intermediate',
    theme: 'Civics',
    seasonalTag: null,
    publicationDate: null,
    status: 'draft',
    colorHex: getQuizColor(getNumericId('quiz-5')),
    createdBy: 'user-1',
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    _count: {
      rounds: 3,
      runs: 0,
    },
  },
]

export const dummyRuns = [
  {
    id: 'run-1',
    quizId: 'quiz-1',
    schoolId: 'org-1',
    teacherId: 'user-1',
    startedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    finishedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000 + 45 * 60 * 1000).toISOString(),
    audienceSize: 25,
    notes: 'Great engagement from students',
    source: 'projected',
    quiz: {
      id: 'quiz-1',
      title: 'Week 1 - Australian History & Geography',
    },
    school: {
      id: 'org-1',
      name: 'Melbourne High School',
    },
    teacher: {
      id: 'user-1',
      name: 'Sarah Johnson',
      email: 'sarah@melbournehigh.edu.au',
    },
  },
  {
    id: 'run-2',
    quizId: 'quiz-1',
    schoolId: 'org-2',
    teacherId: 'user-3',
    startedAt: new Date(Date.now() - 9 * 24 * 60 * 60 * 1000).toISOString(),
    finishedAt: new Date(Date.now() - 9 * 24 * 60 * 60 * 1000 + 50 * 60 * 1000).toISOString(),
    audienceSize: 18,
    notes: null,
    source: 'projected',
    quiz: {
      id: 'quiz-1',
      title: 'Week 1 - Australian History & Geography',
    },
    school: {
      id: 'org-2',
      name: 'Sydney Grammar School',
    },
    teacher: {
      id: 'user-3',
      name: 'Emma Wilson',
      email: 'emma@sydneygrammar.edu.au',
    },
  },
  {
    id: 'run-3',
    quizId: 'quiz-2',
    schoolId: 'org-1',
    teacherId: 'user-1',
    startedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    finishedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000 + 42 * 60 * 1000).toISOString(),
    audienceSize: 30,
    notes: 'Students loved the science questions',
    source: 'projected',
    quiz: {
      id: 'quiz-2',
      title: 'Week 2 - Science & Nature',
    },
    school: {
      id: 'org-1',
      name: 'Melbourne High School',
    },
    teacher: {
      id: 'user-1',
      name: 'Sarah Johnson',
      email: 'sarah@melbournehigh.edu.au',
    },
  },
]

export const dummyScheduledJobs = [
  {
    id: 'job-1',
    type: 'PUBLISH_QUIZ',
    status: 'COMPLETED',
    name: 'Publish Week 3 Quiz',
    description: 'Automatically publish Week 3 - Pop Culture & Entertainment',
    scheduledFor: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    executedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    nextRunAt: null,
    config: JSON.stringify({ quizId: 'quiz-3' }),
    attempts: 1,
    maxAttempts: 3,
    lastError: null,
    result: JSON.stringify({ success: true, quizId: 'quiz-3' }),
    isRecurring: false,
    recurrencePattern: null,
    createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    createdBy: 'user-1',
  },
  {
    id: 'job-2',
    type: 'PUBLISH_QUIZ',
    status: 'SCHEDULED',
    name: 'Publish Week 4 Quiz',
    description: 'Automatically publish Week 4 - Sports & Athletics',
    scheduledFor: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    executedAt: null,
    nextRunAt: null,
    config: JSON.stringify({ quizId: 'quiz-4' }),
    attempts: 0,
    maxAttempts: 3,
    lastError: null,
    result: null,
    isRecurring: false,
    recurrencePattern: null,
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    createdBy: 'user-1',
  },
  {
    id: 'job-3',
    type: 'PUBLISH_QUIZ',
    status: 'SCHEDULED',
    name: 'Weekly Quiz Publishing',
    description: 'Recurring job to publish weekly quiz every Monday at 7am',
    scheduledFor: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString(),
    executedAt: null,
    nextRunAt: new Date(Date.now() + 8 * 24 * 60 * 60 * 1000).toISOString(),
    config: JSON.stringify({ autoCreate: true }),
    attempts: 0,
    maxAttempts: 3,
    lastError: null,
    result: null,
    isRecurring: true,
    recurrencePattern: '0 7 * * 1', // Every Monday at 7am
    createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    createdBy: 'user-1',
  },
  {
    id: 'job-4',
    type: 'MAINTENANCE_WINDOW',
    status: 'SCHEDULED',
    name: 'Weekly Maintenance',
    description: 'System maintenance window every Sunday 2am-4am',
    scheduledFor: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
    executedAt: null,
    nextRunAt: new Date(Date.now() + 12 * 24 * 60 * 60 * 1000).toISOString(),
    config: JSON.stringify({ duration: 7200, message: 'Scheduled maintenance' }),
    attempts: 0,
    maxAttempts: 1,
    lastError: null,
    result: null,
    isRecurring: true,
    recurrencePattern: '0 2 * * 0', // Every Sunday at 2am
    createdAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    createdBy: 'user-1',
  },
]

export const getDummyQuizDetail = (id: string) => {
  const quiz = dummyQuizzes.find(q => q.id === id)
  if (!quiz) return null

  const runs = dummyRuns.filter(r => r.quizId === id)

  return {
    ...quiz,
    rounds: [
      {
        id: `round-${id}-1`,
        index: 1,
        categoryId: 'cat-history',
        category: {
          id: 'cat-history',
          name: 'History',
        },
        blurb: 'Australian history questions',
        targetDifficulty: 0.5,
        questions: [
          {
            id: `q-${id}-1-1`,
            order: 1,
            question: {
              id: `q-${id}-1-1`,
              text: 'What year did Australia become a federation?',
              answer: '1901',
              difficulty: 0.6,
            },
          },
          {
            id: `q-${id}-1-2`,
            order: 2,
            question: {
              id: `q-${id}-1-2`,
              text: 'Who was the first Prime Minister of Australia?',
              answer: 'Edmund Barton',
              difficulty: 0.7,
            },
          },
          {
            id: `q-${id}-1-3`,
            order: 3,
            question: {
              id: `q-${id}-1-3`,
              text: 'When did the First Fleet arrive in Australia?',
              answer: '1788',
              difficulty: 0.6,
            },
          },
          {
            id: `q-${id}-1-4`,
            order: 4,
            question: {
              id: `q-${id}-1-4`,
              text: 'What was the name of the first European explorer to land in Australia?',
              answer: 'Captain James Cook',
              difficulty: 0.7,
            },
          },
          {
            id: `q-${id}-1-5`,
            order: 5,
            question: {
              id: `q-${id}-1-5`,
              text: 'In which year did women gain the right to vote in Australia?',
              answer: '1902',
              difficulty: 0.8,
            },
          },
          {
            id: `q-${id}-1-6`,
            order: 6,
            question: {
              id: `q-${id}-1-6`,
              text: 'What was the name of the Australian Prime Minister during World War II?',
              answer: 'John Curtin',
              difficulty: 0.7,
            },
          },
        ],
      },
      {
        id: `round-${id}-2`,
        index: 2,
        categoryId: 'cat-geography',
        category: {
          id: 'cat-geography',
          name: 'Geography',
        },
        blurb: 'Australian geography questions',
        targetDifficulty: 0.5,
        questions: [
          {
            id: `q-${id}-2-1`,
            order: 1,
            question: {
              id: `q-${id}-2-1`,
              text: 'What is the capital of Western Australia?',
              answer: 'Perth',
              difficulty: 0.4,
            },
          },
          {
            id: `q-${id}-2-2`,
            order: 2,
            question: {
              id: `q-${id}-2-2`,
              text: 'What is the largest state in Australia by area?',
              answer: 'Western Australia',
              difficulty: 0.5,
            },
          },
          {
            id: `q-${id}-2-3`,
            order: 3,
            question: {
              id: `q-${id}-2-3`,
              text: 'What is the longest river in Australia?',
              answer: 'Murray River',
              difficulty: 0.6,
            },
          },
          {
            id: `q-${id}-2-4`,
            order: 4,
            question: {
              id: `q-${id}-2-4`,
              text: 'What is the highest mountain in Australia?',
              answer: 'Mount Kosciuszko',
              difficulty: 0.5,
            },
          },
          {
            id: `q-${id}-2-5`,
            order: 5,
            question: {
              id: `q-${id}-2-5`,
              text: 'What is the largest desert in Australia?',
              answer: 'Great Victoria Desert',
              difficulty: 0.6,
            },
          },
          {
            id: `q-${id}-2-6`,
            order: 6,
            question: {
              id: `q-${id}-2-6`,
              text: 'What is the capital of Queensland?',
              answer: 'Brisbane',
              difficulty: 0.4,
            },
          },
        ],
      },
      {
        id: `round-${id}-3`,
        index: 3,
        categoryId: 'cat-science',
        category: {
          id: 'cat-science',
          name: 'Science',
        },
        blurb: 'Science and nature questions',
        targetDifficulty: 0.5,
        questions: [
          {
            id: `q-${id}-3-1`,
            order: 1,
            question: {
              id: `q-${id}-3-1`,
              text: 'What is the chemical symbol for gold?',
              answer: 'Au',
              difficulty: 0.5,
            },
          },
          {
            id: `q-${id}-3-2`,
            order: 2,
            question: {
              id: `q-${id}-3-2`,
              text: 'How many planets are in our solar system?',
              answer: '8',
              difficulty: 0.4,
            },
          },
          {
            id: `q-${id}-3-3`,
            order: 3,
            question: {
              id: `q-${id}-3-3`,
              text: 'What is the speed of light in a vacuum?',
              answer: '299,792,458 meters per second',
              difficulty: 0.7,
            },
          },
          {
            id: `q-${id}-3-4`,
            order: 4,
            question: {
              id: `q-${id}-3-4`,
              text: 'What is the smallest unit of matter?',
              answer: 'Atom',
              difficulty: 0.5,
            },
          },
          {
            id: `q-${id}-3-5`,
            order: 5,
            question: {
              id: `q-${id}-3-5`,
              text: 'What process do plants use to make food?',
              answer: 'Photosynthesis',
              difficulty: 0.6,
            },
          },
          {
            id: `q-${id}-3-6`,
            order: 6,
            question: {
              id: `q-${id}-3-6`,
              text: 'What is the hardest natural substance on Earth?',
              answer: 'Diamond',
              difficulty: 0.5,
            },
          },
        ],
      },
      {
        id: `round-${id}-4`,
        index: 4,
        categoryId: 'cat-culture',
        category: {
          id: 'cat-culture',
          name: 'Culture',
        },
        blurb: 'Australian culture and society',
        targetDifficulty: 0.5,
        questions: [
          {
            id: `q-${id}-4-1`,
            order: 1,
            question: {
              id: `q-${id}-4-1`,
              text: 'What is the national animal of Australia?',
              answer: 'Kangaroo',
              difficulty: 0.4,
            },
          },
          {
            id: `q-${id}-4-2`,
            order: 2,
            question: {
              id: `q-${id}-4-2`,
              text: 'What is Australia Day?',
              answer: 'National day celebrating the arrival of the First Fleet',
              difficulty: 0.6,
            },
          },
          {
            id: `q-${id}-4-3`,
            order: 3,
            question: {
              id: `q-${id}-4-3`,
              text: 'What is the most popular sport in Australia?',
              answer: 'Australian Rules Football',
              difficulty: 0.5,
            },
          },
          {
            id: `q-${id}-4-4`,
            order: 4,
            question: {
              id: `q-${id}-4-4`,
              text: 'What is the name of the famous opera house in Sydney?',
              answer: 'Sydney Opera House',
              difficulty: 0.4,
            },
          },
          {
            id: `q-${id}-4-5`,
            order: 5,
            question: {
              id: `q-${id}-4-5`,
              text: 'What is ANZAC Day?',
              answer: 'Day commemorating Australian and New Zealand soldiers',
              difficulty: 0.6,
            },
          },
          {
            id: `q-${id}-4-6`,
            order: 6,
            question: {
              id: `q-${id}-4-6`,
              text: 'What is the national flower of Australia?',
              answer: 'Golden Wattle',
              difficulty: 0.5,
            },
          },
        ],
      },
      {
        id: `round-${id}-5`,
        index: 5,
        categoryId: 'cat-peoples',
        category: {
          id: 'cat-peoples',
          name: "People's Question",
        },
        blurb: "A question submitted by the community",
        targetDifficulty: 0.5,
        isPeoplesRound: true,
        questions: [
          {
            id: `q-${id}-5-1`,
            order: 1,
            question: {
              id: `q-${id}-5-1`,
              text: 'What is the most interesting fact you know about Australia?',
              answer: 'Various answers accepted',
              difficulty: 0.5,
              isPeopleQuestion: true,
            },
          },
        ],
      },
    ],
    runs: runs,
    analytics: {
      totalRuns: runs.length,
      totalParticipants: runs.reduce((sum, r) => sum + r.audienceSize, 0),
      averageAudienceSize: runs.length > 0 ? runs.reduce((sum, r) => sum + r.audienceSize, 0) / runs.length : 0,
      completionRate: 0.85,
      averageScore: 72.5,
    },
    creator: {
      id: quiz.createdBy,
      name: quiz.createdBy === 'user-1' ? 'Sarah Johnson' : 'Emma Wilson',
      email: quiz.createdBy === 'user-1' ? 'sarah@melbournehigh.edu.au' : 'emma@sydneygrammar.edu.au',
    },
  }
}

