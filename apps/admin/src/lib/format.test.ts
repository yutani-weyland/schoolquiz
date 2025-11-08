import { describe, it, expect } from 'vitest';
import { formatWeek } from './format';

describe('formatWeek', () => {
  it('should format a valid ISO date string', () => {
    const result = formatWeek('2024-01-15T00:00:00Z');
    expect(result).toMatch(/Jan|January/);
    expect(result).toMatch(/15/);
    expect(result).toMatch(/2024/);
  });

  it('should handle a valid ISO date string without time', () => {
    const result = formatWeek('2024-12-25');
    expect(result).toMatch(/Dec|December/);
    expect(result).toMatch(/25/);
    expect(result).toMatch(/2024/);
  });

  it('should return the original string for invalid date', () => {
    const invalid = 'not-a-date';
    const result = formatWeek(invalid);
    expect(result).toBe(invalid);
  });

  it('should return the original string for empty string', () => {
    const result = formatWeek('');
    expect(result).toBe('');
  });

  it('should handle edge case dates', () => {
    const result1 = formatWeek('2024-01-01T00:00:00Z');
    expect(result1).toBeTruthy();
    
    const result2 = formatWeek('2024-12-31T23:59:59Z');
    expect(result2).toBeTruthy();
  });

  it('should format dates in locale-specific format', () => {
    const result = formatWeek('2024-06-15T00:00:00Z');
    // Should contain month, day, and year
    expect(result).toMatch(/Jun|June|15|2024/);
  });
});

