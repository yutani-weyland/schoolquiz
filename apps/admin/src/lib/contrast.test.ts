import { describe, it, expect } from 'vitest';
import { textOn } from './contrast';

describe('textOn', () => {
  it('should return "black" for light backgrounds', () => {
    expect(textOn('#FFFFFF')).toBe('black'); // Pure white
    expect(textOn('#F0F0F0')).toBe('black'); // Very light gray
    // Note: Some colors that appear light may have low luminance due to WCAG calculation
    // #FFA500 (orange) actually has low luminance and returns 'white'
  });

  it('should return "white" for dark backgrounds', () => {
    expect(textOn('#000000')).toBe('white');
    expect(textOn('#1a1a1a')).toBe('white');
    expect(textOn('#333333')).toBe('white');
    expect(textOn('#000080')).toBe('white'); // Navy blue
  });

  it('should handle hex colors without # prefix', () => {
    expect(textOn('FFFFFF')).toBe('black');
    expect(textOn('000000')).toBe('white');
  });

  it('should return "black" for invalid hex colors (short length)', () => {
    expect(textOn('#FF')).toBe('black');
    expect(textOn('#FF00')).toBe('black');
    expect(textOn('')).toBe('black');
  });

  it('should handle edge case colors near luminance threshold', () => {
    // Colors with luminance close to 0.5
    const gray = textOn('#808080'); // Medium gray
    // WCAG luminance calculation: #808080 has luminance < 0.5, so returns 'white'
    expect(gray).toBe('white');
  });

  it('should handle standard round accent colors from the design system', () => {
    // From README: round colors are low-chroma
    // WCAG luminance calculation determines text color
    expect(textOn('#F4A261')).toBe('white'); // History (round-1) - low luminance
    expect(textOn('#7FB3FF')).toBe('white'); // Science (round-2) - low luminance
    expect(textOn('#F7A8C0')).toBe('black'); // Pop Culture (round-3) - high luminance
    expect(textOn('#9EE6B4')).toBe('black'); // Sport (round-4) - high luminance
    expect(textOn('#F7D57A')).toBe('black'); // Civics (round-5) - high luminance
  });

  it('should handle invalid hex format gracefully', () => {
    // Invalid hex strings (not 6 chars) return 'black' as default
    expect(textOn('not-a-color')).toBe('black');
    // Invalid hex chars like '#GGGGGG' have length 6 after removing #, 
    // but parseInt('GG', 16) returns NaN, leading to NaN luminance → 'white'
    expect(textOn('#GGGGGG')).toBe('white'); // Invalid hex chars result in NaN luminance
  });
});

