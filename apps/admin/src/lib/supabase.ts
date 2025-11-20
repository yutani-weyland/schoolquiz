import { createClient } from '@supabase/supabase-js'
import { unstable_cache, revalidateTag } from 'next/cache'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

export const supabase = createClient(supabaseUrl, supabaseKey)

// Server-side Supabase client with service role key for admin operations
export const supabaseAdmin = supabaseServiceKey
  ? createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })
  : null

// Internal function to fetch questions (not cached)
async function _getQuestionsUncached() {
  const { data, error } = await supabase
    .from('questions')
    .select(`
      id,
      text,
      answer,
      difficulty,
      explanation,
      tags,
      status,
      created_at,
      categories:category_id (
        id,
        name
      )
    `)
    .order('created_at', { ascending: false })
  
  if (error) throw error
  return data || []
}

// Database operations using Supabase client with caching
// Cache for 60 seconds to improve performance
export async function getQuestions() {
  return unstable_cache(
    async () => _getQuestionsUncached(),
    ['questions'],
    {
      revalidate: 60, // Cache for 60 seconds
      tags: ['questions']
    }
  )()
}

export async function createQuestion(questionData: any) {
  const { data, error } = await supabase
    .from('questions')
    .insert(questionData)
    .select()
    .single()
  
  if (error) throw error
  
  // Invalidate cache after creating a question
  revalidateTag('questions')
  
  return data
}

// Internal function to fetch quizzes (not cached)
async function _getQuizzesUncached() {
  const { data, error } = await supabase
    .from('quizzes')
    .select(`
      id,
      title,
      description,
      status,
      created_at,
      teachers:created_by (
        id,
        name
      )
    `)
    .order('created_at', { ascending: false })
  
  if (error) throw error
  return data || []
}

// Cached version - cache for 60 seconds
export async function getQuizzes() {
  return unstable_cache(
    async () => _getQuizzesUncached(),
    ['quizzes'],
    {
      revalidate: 60, // Cache for 60 seconds
      tags: ['quizzes']
    }
  )()
}

export async function createQuiz(quizData: any) {
  const { data, error } = await supabase
    .from('quizzes')
    .insert(quizData)
    .select()
    .single()
  
  if (error) throw error
  
  // Invalidate cache after creating a quiz
  revalidateTag('quizzes')
  
  return data
}

// Get quiz by slug (for static generation)
async function _getQuizBySlugUncached(slug: string) {
  const { data, error } = await supabase
    .from('quizzes')
    .select(`
      id,
      slug,
      title,
      description,
      status,
      created_at
    `)
    .eq('slug', slug)
    .single()
  
  if (error) throw error
  return data
}

// Cached version - cache for 60 seconds
export async function getQuizBySlug(slug: string) {
  return unstable_cache(
    async () => _getQuizBySlugUncached(slug),
    ['quiz', slug],
    {
      revalidate: 60, // Cache for 60 seconds
      tags: ['quizzes', `quiz-${slug}`]
    }
  )()
}
