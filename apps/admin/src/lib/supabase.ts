import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseKey)

// Database operations using Supabase client
export async function getQuestions() {
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

export async function createQuestion(questionData: any) {
  const { data, error } = await supabase
    .from('questions')
    .insert(questionData)
    .select()
    .single()
  
  if (error) throw error
  return data
}

export async function getQuizzes() {
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

export async function createQuiz(quizData: any) {
  const { data, error } = await supabase
    .from('quizzes')
    .insert(quizData)
    .select()
    .single()
  
  if (error) throw error
  return data
}
