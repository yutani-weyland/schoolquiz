import { fetchOfficialQuizzes } from './quizzes-server'
import type { Quiz } from "@/components/quiz/QuizCard"
import { unstable_cache } from 'next/cache'

/**
 * Fetch official quizzes from database with caching
 * OPTIMIZATION: Cache official quizzes separately from user data
 * Official quizzes change weekly, so cache for 15 minutes (much longer than user data)
 */
export async function getCachedOfficialQuizzes(): Promise<Quiz[]> {
  return unstable_cache(
    async () => {
      const quizzes = await fetchOfficialQuizzes()
      return quizzes
    },
    ['official-quizzes-v3'], // Cache key version
    {
      revalidate: 900, // 15 minutes - quizzes change weekly, longer cache is safe
      tags: ['official-quizzes'],
    }
  )()
}

