import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { QuestionCard } from './QuestionCard';

// Mock framer-motion to avoid animation issues in tests
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    button: ({ children, ...props }: any) => <button {...props}>{children}</button>,
  },
  AnimatePresence: ({ children }: any) => children,
}));

// Mock @schoolquiz/ui
vi.mock('@schoolquiz/ui', () => ({
  springs: {
    micro: { type: 'spring', stiffness: 380, damping: 28, mass: 0.8 },
  },
  transitions: {
    fast: { duration: 0.18, ease: [0.22, 1, 0.36, 1] },
    medium: { duration: 0.24, ease: [0.22, 1, 0.36, 1] },
  },
}));

const mockQuestion = {
  id: '1',
  question_text: 'What is the capital of Australia?',
  answer: 'Canberra',
  points: 1,
};

describe('QuestionCard', () => {
  it('should render question text and points', () => {
    const onAnswer = vi.fn();
    render(
      <QuestionCard
        question={mockQuestion}
        onAnswer={onAnswer}
        accentColor="#F4A261"
      />
    );

    expect(screen.getByText('What is the capital of Australia?')).toBeInTheDocument();
    expect(screen.getByText('1 point')).toBeInTheDocument();
  });

  it('should display plural points correctly', () => {
    const questionWithMultiplePoints = { ...mockQuestion, points: 5 };
    const onAnswer = vi.fn();
    render(
      <QuestionCard
        question={questionWithMultiplePoints}
        onAnswer={onAnswer}
        accentColor="#F4A261"
      />
    );

    expect(screen.getByText('5 points')).toBeInTheDocument();
  });

  it('should reveal answer when reveal button is clicked', () => {
    const onAnswer = vi.fn();
    render(
      <QuestionCard
        question={mockQuestion}
        onAnswer={onAnswer}
        accentColor="#F4A261"
      />
    );

    const revealButton = screen.getByText('Reveal answer');
    fireEvent.click(revealButton);

    expect(screen.getByText('Canberra')).toBeInTheDocument();
    expect(screen.getByText('✓ Got it right')).toBeInTheDocument();
    expect(screen.getByText('✗ Got it wrong')).toBeInTheDocument();
  });

  it('should call onAnswer(true) when correct button is clicked', () => {
    const onAnswer = vi.fn();
    render(
      <QuestionCard
        question={mockQuestion}
        onAnswer={onAnswer}
        accentColor="#F4A261"
      />
    );

    // Reveal answer first
    fireEvent.click(screen.getByText('Reveal answer'));
    // Then mark correct
    fireEvent.click(screen.getByText('✓ Got it right'));

    expect(onAnswer).toHaveBeenCalledWith(true);
  });

  it('should call onAnswer(false) when incorrect button is clicked', () => {
    const onAnswer = vi.fn();
    render(
      <QuestionCard
        question={mockQuestion}
        onAnswer={onAnswer}
        accentColor="#F4A261"
      />
    );

    // Reveal answer first
    fireEvent.click(screen.getByText('Reveal answer'));
    // Then mark incorrect
    fireEvent.click(screen.getByText('✗ Got it wrong'));

    expect(onAnswer).toHaveBeenCalledWith(false);
  });

  it('should show stats when statsEnabled is true', () => {
    const onAnswer = vi.fn();
    render(
      <QuestionCard
        question={mockQuestion}
        onAnswer={onAnswer}
        accentColor="#F4A261"
        statsEnabled={true}
        nationalPercentage={75}
      />
    );

    // Reveal answer first
    fireEvent.click(screen.getByText('Reveal answer'));
    
    expect(screen.getByText(/75% got this correct/)).toBeInTheDocument();
  });

  it('should not show stats when statsEnabled is false', () => {
    const onAnswer = vi.fn();
    render(
      <QuestionCard
        question={mockQuestion}
        onAnswer={onAnswer}
        accentColor="#F4A261"
        statsEnabled={false}
      />
    );

    // Reveal answer first
    fireEvent.click(screen.getByText('Reveal answer'));
    
    // Stats should not be visible
    expect(screen.queryByText(/%/)).not.toBeInTheDocument();
  });
});

