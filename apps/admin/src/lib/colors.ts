/**
 * Small, curated color palette for quizzes
 * Fixed colors to ensure consistency between quiz cards and presenter view
 * No randomness - deterministic assignment based on quiz ID
 */

// Small, curated palette - 12 vibrant but distinct colors
export const quizColors = [
  '#4FD1C7', // Vibrant teal
  '#8B5CF6', // Vibrant purple
  '#FF8C69', // Coral
  '#60A5FA', // Bright blue
  '#FDE047', // Bright yellow
  '#4ADE80', // Bright green
  '#FF6B9D', // Hot pink
  '#00CED1', // Turquoise
  '#FFD700', // Gold
  '#FF6347', // Tomato red
  '#9B7EDE', // Purple-blue
  '#5EEAD4', // Cyan-teal
];

// Legacy exports for backward compatibility
export const trending2025Colors = quizColors;
export const modernColors = quizColors;
export const allColors = quizColors;

/**
 * Get a color for a quiz deterministically based on quiz ID
 * This ensures the same quiz always gets the same color (no hydration issues)
 */
export function getQuizColor(quizId: number): string {
  return quizColors[quizId % quizColors.length];
}

/**
 * Get a color by index (for backward compatibility)
 */
export function getModernColor(index: number): string {
  return quizColors[index % quizColors.length];
}

/**
 * Get colors distributed to avoid similar colors appearing next to each other
 * Now uses deterministic assignment based on quiz order
 */
export function getDistributedColors(count: number): string[] {
  // Simply return the first N colors from our palette
  // This is deterministic and avoids hydration issues
  return quizColors.slice(0, Math.min(count, quizColors.length));
}

/**
 * Get a random color from the palette (deterministic based on seed if needed)
 */
export function getRandomModernColor(): string {
  return quizColors[0]; // Return first color as default
}

/**
 * Get colors that work well together (from the same palette group)
 */
export function getColorGroup(baseIndex: number): string[] {
  return quizColors;
}

/**
 * Get colors from a specific trend category (legacy support)
 */
export function getColorsByTrend(trend: 'futuristic' | 'pastel' | 'nostalgic' | 'neon' | 'gradient' | 'earthy' | 'warm2025'): string[] {
  return quizColors;
}
