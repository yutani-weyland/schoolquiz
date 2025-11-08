import { describe, it, expect } from 'vitest';
import {
  calculateWilsonCI,
  calculateDifficultyIndex,
  calculateRecencyWeightedScore,
  meetsKAnonymity,
} from './index';

describe('calculateWilsonCI', () => {
  it('should calculate CI for normal case', () => {
    const result = calculateWilsonCI(80, 20, 0.95);
    expect(result.successRate).toBe(0.8);
    expect(result.ciLower).toBeGreaterThan(0);
    expect(result.ciUpper).toBeLessThanOrEqual(1);
    expect(result.ciLower).toBeLessThan(result.successRate);
    expect(result.ciUpper).toBeGreaterThan(result.successRate);
    expect(result.nExposed).toBe(100);
  });

  it('should handle zero attempts', () => {
    const result = calculateWilsonCI(0, 0, 0.95);
    expect(result.successRate).toBe(0);
    expect(result.ciLower).toBe(0);
    expect(result.ciUpper).toBe(0);
    expect(result.nExposed).toBe(0);
  });

  it('should handle all correct', () => {
    const result = calculateWilsonCI(100, 0, 0.95);
    expect(result.successRate).toBe(1);
    expect(result.ciLower).toBeGreaterThanOrEqual(0);
    expect(result.ciUpper).toBeLessThanOrEqual(1);
    expect(result.nExposed).toBe(100);
  });

  it('should handle all incorrect', () => {
    const result = calculateWilsonCI(0, 100, 0.95);
    expect(result.successRate).toBe(0);
    expect(result.ciLower).toBeGreaterThanOrEqual(0);
    expect(result.ciUpper).toBeLessThanOrEqual(1);
    expect(result.nExposed).toBe(100);
  });

  it('should use different confidence level (0.99)', () => {
    const result95 = calculateWilsonCI(80, 20, 0.95);
    const result99 = calculateWilsonCI(80, 20, 0.99);
    // 99% CI should be wider than 95% CI
    expect(result99.ciUpper - result99.ciLower).toBeGreaterThan(
      result95.ciUpper - result95.ciLower
    );
  });

  it('should keep CI bounds within [0, 1]', () => {
    const result = calculateWilsonCI(1, 1, 0.95);
    expect(result.ciLower).toBeGreaterThanOrEqual(0);
    expect(result.ciUpper).toBeLessThanOrEqual(1);
  });

  it('should handle small sample sizes', () => {
    const result = calculateWilsonCI(3, 2, 0.95);
    expect(result.successRate).toBe(0.6);
    expect(result.nExposed).toBe(5);
    expect(result.ciLower).toBeGreaterThanOrEqual(0);
    expect(result.ciUpper).toBeLessThanOrEqual(1);
  });
});

describe('calculateDifficultyIndex', () => {
  it('should return 1 for successRate = 0 (hardest)', () => {
    expect(calculateDifficultyIndex(0)).toBe(1);
  });

  it('should return 0 for successRate = 1 (easiest)', () => {
    expect(calculateDifficultyIndex(1)).toBe(0);
  });

  it('should return 0.5 for successRate = 0.5', () => {
    expect(calculateDifficultyIndex(0.5)).toBe(0.5);
  });

  it('should return correct values for various success rates', () => {
    expect(calculateDifficultyIndex(0.25)).toBe(0.75);
    expect(calculateDifficultyIndex(0.75)).toBe(0.25);
    expect(calculateDifficultyIndex(0.9)).toBeCloseTo(0.1, 10);
    expect(calculateDifficultyIndex(0.1)).toBe(0.9);
  });
});

describe('calculateRecencyWeightedScore', () => {
  it('should calculate score for single day data', () => {
    const now = new Date();
    const data = [
      { date: now, nCorrect: 8, nIncorrect: 2 },
    ];
    const result = calculateRecencyWeightedScore(data);
    expect(result).toBe(0.8);
  });

  it('should weight recent data more heavily', () => {
    const now = new Date();
    const oldDate = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000); // 60 days ago
    const recentDate = new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000); // 5 days ago
    
    const data = [
      { date: oldDate, nCorrect: 0, nIncorrect: 10 }, // Old: all wrong
      { date: recentDate, nCorrect: 10, nIncorrect: 0 }, // Recent: all right
    ];
    
    const result = calculateRecencyWeightedScore(data);
    // Recent data should dominate, so result should be > 0.5
    expect(result).toBeGreaterThan(0.5);
  });

  it('should return 0 for zero total attempts', () => {
    const now = new Date();
    const data = [
      { date: now, nCorrect: 0, nIncorrect: 0 },
    ];
    const result = calculateRecencyWeightedScore(data);
    expect(result).toBe(0);
  });

  it('should use custom half-life', () => {
    const now = new Date();
    // Use mixed data to show the difference in weighting
    const data = [
      { date: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000), nCorrect: 5, nIncorrect: 5 }, // 30 days ago: 50% correct
      { date: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000), nCorrect: 10, nIncorrect: 0 }, // 5 days ago: 100% correct
    ];
    
    const result28 = calculateRecencyWeightedScore(data, 28);
    const result14 = calculateRecencyWeightedScore(data, 14);
    
    // With 14-day half-life, older data (30 days) gets less weight than with 28-day half-life
    // So result14 should be higher (more influenced by recent 100% correct data)
    expect(result14).toBeGreaterThan(result28);
  });

  it('should handle multiple days with decay', () => {
    const now = new Date();
    const data = [
      { date: new Date(now.getTime() - 0 * 24 * 60 * 60 * 1000), nCorrect: 5, nIncorrect: 5 },
      { date: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000), nCorrect: 5, nIncorrect: 5 },
      { date: new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000), nCorrect: 5, nIncorrect: 5 },
    ];
    
    const result = calculateRecencyWeightedScore(data);
    expect(result).toBe(0.5); // All are 50/50, weighted average should be 0.5
  });

  it('should handle empty array', () => {
    const result = calculateRecencyWeightedScore([]);
    expect(result).toBe(0);
  });
});

describe('meetsKAnonymity', () => {
  it('should return true when thresholds are met', () => {
    expect(meetsKAnonymity(100, 5)).toBe(true);
    expect(meetsKAnonymity(150, 10)).toBe(true);
    expect(meetsKAnonymity(100, 5, 100, 5)).toBe(true);
  });

  it('should return false when nExposed is below threshold', () => {
    expect(meetsKAnonymity(50, 5)).toBe(false);
    expect(meetsKAnonymity(99, 5)).toBe(false);
  });

  it('should return false when nRuns is below threshold', () => {
    expect(meetsKAnonymity(100, 4)).toBe(false);
    expect(meetsKAnonymity(100, 0)).toBe(false);
  });

  it('should return false when both are below thresholds', () => {
    expect(meetsKAnonymity(50, 4)).toBe(false);
  });

  it('should use custom thresholds', () => {
    expect(meetsKAnonymity(200, 10, 200, 10)).toBe(true);
    expect(meetsKAnonymity(200, 10, 300, 15)).toBe(false);
    expect(meetsKAnonymity(200, 10, 150, 20)).toBe(false);
  });

  it('should handle edge cases', () => {
    expect(meetsKAnonymity(0, 0)).toBe(false);
    expect(meetsKAnonymity(100, 0)).toBe(false);
    expect(meetsKAnonymity(0, 5)).toBe(false);
  });
});

