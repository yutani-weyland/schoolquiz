import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ScoreCounter } from './ScoreCounter';

describe('ScoreCounter', () => {
  it('should display score and total', () => {
    render(<ScoreCounter score={5} total={25} />);
    expect(screen.getByText('Score')).toBeInTheDocument();
    expect(screen.getByText('5/25')).toBeInTheDocument();
  });

  it('should display zero score', () => {
    render(<ScoreCounter score={0} total={25} />);
    expect(screen.getByText('0/25')).toBeInTheDocument();
  });

  it('should display full score', () => {
    render(<ScoreCounter score={25} total={25} />);
    expect(screen.getByText('25/25')).toBeInTheDocument();
  });

  it('should update when score changes', () => {
    const { rerender } = render(<ScoreCounter score={5} total={25} />);
    expect(screen.getByText('5/25')).toBeInTheDocument();
    
    rerender(<ScoreCounter score={10} total={25} />);
    expect(screen.getByText('10/25')).toBeInTheDocument();
  });
});

