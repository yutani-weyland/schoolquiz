export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      quizzes: {
        Row: {
          id: string
          title: string
          slug: string
          week_of: string
          published_at: string | null
          archived_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          slug: string
          week_of: string
          published_at?: string | null
          archived_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          slug?: string
          week_of?: string
          published_at?: string | null
          archived_at?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      categories: {
        Row: {
          id: string
          quiz_id: string
          title: string
          blurb: string
          accent_color: string
          round_number: number
          type: "standard" | "quick-fire"
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          quiz_id: string
          title: string
          blurb: string
          accent_color: string
          round_number: number
          type?: "standard" | "quick-fire"
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          quiz_id?: string
          title?: string
          blurb?: string
          accent_color?: string
          round_number?: number
          type?: "standard" | "quick-fire"
          created_at?: string
          updated_at?: string
        }
      }
      questions: {
        Row: {
          id: string
          category_id: string
          question_text: string
          answer: string
          points: number
          order: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          category_id: string
          question_text: string
          answer: string
          points?: number
          order: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          category_id?: string
          question_text?: string
          answer?: string
          points?: number
          order?: number
          created_at?: string
          updated_at?: string
        }
      }
      organisations: {
        Row: {
          id: string
          name: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          created_at?: string
          updated_at?: string
        }
      }
      user_organisation: {
        Row: {
          id: string
          user_id: string
          organisation_id: string
          role: "teacher" | "admin"
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          organisation_id: string
          role: "teacher" | "admin"
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          organisation_id?: string
          role?: "teacher" | "admin"
          created_at?: string
        }
      }
      classes: {
        Row: {
          id: string
          organisation_id: string
          name: string
          created_by: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          organisation_id: string
          name: string
          created_by: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          organisation_id?: string
          name?: string
          created_by?: string
          created_at?: string
          updated_at?: string
        }
      }
      quiz_sessions: {
        Row: {
          id: string
          quiz_id: string
          user_id: string | null
          class_id: string | null
          mode: "individual" | "class"
          started_at: string
          completed_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          quiz_id: string
          user_id?: string | null
          class_id?: string | null
          mode: "individual" | "class"
          started_at: string
          completed_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          quiz_id?: string
          user_id?: string | null
          class_id?: string | null
          mode?: "individual" | "class"
          started_at?: string
          completed_at?: string | null
          created_at?: string
        }
      }
      quiz_scores: {
        Row: {
          id: string
          session_id: string
          score: number
          total_questions: number
          created_at: string
        }
        Insert: {
          id?: string
          session_id: string
          score: number
          total_questions: number
          created_at?: string
        }
        Update: {
          id?: string
          session_id?: string
          score?: number
          total_questions?: number
          created_at?: string
        }
      }
      answer_stats: {
        Row: {
          id: string
          quiz_id: string
          question_id: string
          total_attempts: number
          correct_attempts: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          quiz_id: string
          question_id: string
          total_attempts?: number
          correct_attempts?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          quiz_id?: string
          question_id?: string
          total_attempts?: number
          correct_attempts?: number
          created_at?: string
          updated_at?: string
        }
      }
    }
    Views: {
      answer_stats_pct: {
        Row: {
          quiz_id: string
          question_id: string
          percentage_correct: number
        }
      }
    }
    Functions: {
      bump_answer_stats: {
        Args: {
          p_quiz_id: string
          p_question_id: string
          p_is_correct: boolean
        }
        Returns: void
      }
      publish_due_quizzes: {
        Args: Record<PropertyKey, never>
        Returns: void
      }
    }
  }
}
