// Shared in-memory store for quiz colorHex updates (until we switch to real DB)
// This allows color changes to persist across API endpoints during testing

const quizColorStore = new Map<string, string>()

export function getQuizColor(quizId: string): string | undefined {
  return quizColorStore.get(quizId)
}

export function setQuizColor(quizId: string, colorHex: string | null): void {
  if (colorHex) {
    quizColorStore.set(quizId, colorHex)
  } else {
    quizColorStore.delete(quizId)
  }
}

export function hasQuizColor(quizId: string): boolean {
  return quizColorStore.has(quizId)
}

export function clearQuizColor(quizId: string): void {
  quizColorStore.delete(quizId)
}


