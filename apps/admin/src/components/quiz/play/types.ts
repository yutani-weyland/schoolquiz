export interface QuizQuestion {
  id: number;
  question: string;
  answer: string;
  roundNumber: number;
  submittedBy?: string;
  submissionDisplayStyle?: "full" | "first_name" | "anonymous";
}

export interface QuizRound {
  number: number;
  title: string;
  blurb: string;
  type?: "standard" | "finale";
  questionCount?: number;
}

export type QuizThemeMode = "colored" | "light" | "dark";
