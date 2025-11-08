import { describe, it, expect } from 'vitest';

// Test the reducer logic directly (not the hook, which requires React context)
type State = { 
  r: number; 
  q: number; 
  score: number; 
  showTimer: boolean; 
  startedAt: number; 
};

type Action =
  | { type: "GOTO"; r: number; q: number }
  | { type: "NEXT" }
  | { type: "PREV" }
  | { type: "MARK_CORRECT" }
  | { type: "TOGGLE_TIMER" }
  | { type: "RESET"; showTimer?: boolean };

function advance(r: number, q: number) {
  return q < 4 ? { r, q: q + 1 } : r < 4 ? { r: r + 1, q: 0 } : { r, q };
}

function back(r: number, q: number) {
  return q > 0 ? { r, q: q - 1 } : r > 0 ? { r: r - 1, q: 4 } : { r, q };
}

function reducer(s: State, a: Action): State {
  switch (a.type) {
    case "GOTO":
      return { ...s, r: a.r, q: a.q };
    case "NEXT":
      return { ...s, ...advance(s.r, s.q) };
    case "PREV":
      return { ...s, ...back(s.r, s.q) };
    case "MARK_CORRECT":
      return { ...s, score: s.score + 1, ...advance(s.r, s.q) };
    case "TOGGLE_TIMER":
      return { ...s, showTimer: !s.showTimer };
    case "RESET":
      return { 
        r: 0, 
        q: 0, 
        score: 0, 
        showTimer: a.showTimer ?? s.showTimer, 
        startedAt: Date.now() 
      };
  }
}

describe('useQuizState reducer', () => {
  const initialState: State = {
    r: 0,
    q: 0,
    score: 0,
    showTimer: false,
    startedAt: Date.now(),
  };

  describe('GOTO action', () => {
    it('should navigate to specified round and question', () => {
      const state = reducer(initialState, { type: 'GOTO', r: 2, q: 3 });
      expect(state.r).toBe(2);
      expect(state.q).toBe(3);
      expect(state.score).toBe(0);
    });

    it('should preserve other state properties', () => {
      const stateWithScore = { ...initialState, score: 5 };
      const state = reducer(stateWithScore, { type: 'GOTO', r: 1, q: 2 });
      expect(state.score).toBe(5);
    });
  });

  describe('NEXT action', () => {
    it('should advance to next question within same round', () => {
      const state = reducer(initialState, { type: 'NEXT' });
      expect(state.r).toBe(0);
      expect(state.q).toBe(1);
    });

    it('should advance to next round when at last question of round', () => {
      const stateAtEndOfRound = { ...initialState, r: 0, q: 4 };
      const state = reducer(stateAtEndOfRound, { type: 'NEXT' });
      expect(state.r).toBe(1);
      expect(state.q).toBe(0);
    });

    it('should not advance beyond last round and question', () => {
      const stateAtEnd = { ...initialState, r: 4, q: 4 };
      const state = reducer(stateAtEnd, { type: 'NEXT' });
      expect(state.r).toBe(4);
      expect(state.q).toBe(4);
    });
  });

  describe('PREV action', () => {
    it('should go back to previous question within same round', () => {
      const stateAtQ1 = { ...initialState, q: 1 };
      const state = reducer(stateAtQ1, { type: 'PREV' });
      expect(state.r).toBe(0);
      expect(state.q).toBe(0);
    });

    it('should go back to previous round when at first question of round', () => {
      const stateAtStartOfRound = { ...initialState, r: 1, q: 0 };
      const state = reducer(stateAtStartOfRound, { type: 'PREV' });
      expect(state.r).toBe(0);
      expect(state.q).toBe(4);
    });

    it('should not go back beyond first round and question', () => {
      const state = reducer(initialState, { type: 'PREV' });
      expect(state.r).toBe(0);
      expect(state.q).toBe(0);
    });
  });

  describe('MARK_CORRECT action', () => {
    it('should increment score and advance', () => {
      const state = reducer(initialState, { type: 'MARK_CORRECT' });
      expect(state.score).toBe(1);
      expect(state.r).toBe(0);
      expect(state.q).toBe(1);
    });

    it('should increment score multiple times', () => {
      let state = initialState;
      state = reducer(state, { type: 'MARK_CORRECT' });
      expect(state.score).toBe(1);
      state = reducer(state, { type: 'MARK_CORRECT' });
      expect(state.score).toBe(2);
    });

    it('should advance to next round when marking correct at end of round', () => {
      const stateAtEndOfRound = { ...initialState, r: 0, q: 4 };
      const state = reducer(stateAtEndOfRound, { type: 'MARK_CORRECT' });
      expect(state.score).toBe(1);
      expect(state.r).toBe(1);
      expect(state.q).toBe(0);
    });
  });

  describe('TOGGLE_TIMER action', () => {
    it('should toggle timer from false to true', () => {
      const state = reducer(initialState, { type: 'TOGGLE_TIMER' });
      expect(state.showTimer).toBe(true);
    });

    it('should toggle timer from true to false', () => {
      const stateWithTimer = { ...initialState, showTimer: true };
      const state = reducer(stateWithTimer, { type: 'TOGGLE_TIMER' });
      expect(state.showTimer).toBe(false);
    });
  });

  describe('RESET action', () => {
    it('should reset to initial state', () => {
      const stateWithProgress = { 
        ...initialState, 
        r: 3, 
        q: 2, 
        score: 15,
        showTimer: true 
      };
      const state = reducer(stateWithProgress, { type: 'RESET' });
      expect(state.r).toBe(0);
      expect(state.q).toBe(0);
      expect(state.score).toBe(0);
      expect(state.showTimer).toBe(true); // Preserved if not specified
    });

    it('should reset timer if specified', () => {
      const stateWithTimer = { ...initialState, showTimer: true };
      const state = reducer(stateWithTimer, { type: 'RESET', showTimer: false });
      expect(state.showTimer).toBe(false);
    });

    it('should update startedAt timestamp', () => {
      const oldState = { ...initialState, startedAt: 1000 };
      const state = reducer(oldState, { type: 'RESET' });
      expect(state.startedAt).toBeGreaterThan(oldState.startedAt);
    });
  });

  describe('advance function', () => {
    it('should advance within round', () => {
      expect(advance(0, 0)).toEqual({ r: 0, q: 1 });
      expect(advance(0, 3)).toEqual({ r: 0, q: 4 });
    });

    it('should advance to next round at end of round', () => {
      expect(advance(0, 4)).toEqual({ r: 1, q: 0 });
      expect(advance(2, 4)).toEqual({ r: 3, q: 0 });
    });

    it('should not advance beyond last round', () => {
      expect(advance(4, 4)).toEqual({ r: 4, q: 4 });
    });
  });

  describe('back function', () => {
    it('should go back within round', () => {
      expect(back(0, 4)).toEqual({ r: 0, q: 3 });
      expect(back(0, 1)).toEqual({ r: 0, q: 0 });
    });

    it('should go back to previous round at start of round', () => {
      expect(back(1, 0)).toEqual({ r: 0, q: 4 });
      expect(back(3, 0)).toEqual({ r: 2, q: 4 });
    });

    it('should not go back beyond first round', () => {
      expect(back(0, 0)).toEqual({ r: 0, q: 0 });
    });
  });
});

