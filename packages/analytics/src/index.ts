/**
 * Wilson Score Confidence Interval calculation
 * Provides confidence bands that behave well at small sample sizes
 */
export interface WilsonCI {
  successRate: number
  ciLower: number
  ciUpper: number
  nExposed: number
  nRuns: number
}

export function calculateWilsonCI(
  nCorrect: number,
  nIncorrect: number,
  confidenceLevel: number = 0.95
): WilsonCI {
  const nExposed = nCorrect + nIncorrect
  const successRate = nExposed > 0 ? nCorrect / nExposed : 0
  
  if (nExposed === 0) {
    return {
      successRate: 0,
      ciLower: 0,
      ciUpper: 0,
      nExposed: 0,
      nRuns: 0
    }
  }

  // Z-score for confidence level (95% = 1.96)
  const z = confidenceLevel === 0.95 ? 1.96 : 2.576 // 99% = 2.576
  
  const denom = 1 + (z * z) / nExposed
  const centre = successRate + (z * z) / (2 * nExposed)
  const margin = z * Math.sqrt((successRate * (1 - successRate) + (z * z) / (4 * nExposed)) / nExposed)
  
  const ciLower = Math.max(0, (centre - margin) / denom)
  const ciUpper = Math.min(1, (centre + margin) / denom)

  return {
    successRate,
    ciLower,
    ciUpper,
    nExposed,
    nRuns: 0 // This will be set separately
  }
}

/**
 * Calculate difficulty index (0-1, higher = harder)
 */
export function calculateDifficultyIndex(successRate: number): number {
  return 1 - successRate
}

/**
 * Calculate recency-weighted score with exponential decay
 * Half-life of 28 days
 */
export function calculateRecencyWeightedScore(
  dailyData: Array<{ date: Date; nCorrect: number; nIncorrect: number }>,
  halfLifeDays: number = 28
): number {
  const now = new Date()
  const decayConstant = Math.log(2) / halfLifeDays
  
  let weightedCorrect = 0
  let weightedTotal = 0
  
  for (const day of dailyData) {
    const daysDiff = (now.getTime() - day.date.getTime()) / (1000 * 60 * 60 * 24)
    const weight = Math.exp(-decayConstant * daysDiff)
    
    weightedCorrect += day.nCorrect * weight
    weightedTotal += (day.nCorrect + day.nIncorrect) * weight
  }
  
  return weightedTotal > 0 ? weightedCorrect / weightedTotal : 0
}

/**
 * Check if data meets k-anonymity requirements
 */
export function meetsKAnonymity(
  nExposed: number,
  nRuns: number,
  minExposed: number = 100,
  minRuns: number = 5
): boolean {
  return nExposed >= minExposed && nRuns >= minRuns
}

