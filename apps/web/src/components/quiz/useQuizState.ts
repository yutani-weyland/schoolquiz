import { useEffect, useReducer } from "react";

export type Mode = "presenter" | "flow";

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

const key = (id: string) => `tsq:v2:${id}`;

function advance(r: number, q: number) {
	return q < 4 ? { r, q: q + 1 } : r < 4 ? { r: r + 1, q: 0 } : { r, q };
}

function back(r: number, q: number) {
	return q > 0 ? { r, q: q - 1 } : r > 0 ? { r: r - 1, q: 4 } : { r, q };
}

export function useQuizState(quizId: string, mode: Mode) {
	const init: State = { 
		r: 0, 
		q: 0, 
		score: 0, 
		showTimer: mode === "presenter", 
		startedAt: Date.now() 
	};

	const [state, dispatch] = useReducer(
		(s: State, a: Action): State => {
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
		},
		init,
		(base) => {
			if (typeof window === 'undefined') return base;
			const cache = sessionStorage.getItem(key(quizId));
			return cache ? { ...base, ...JSON.parse(cache) } : base;
		}
	);

	useEffect(() => {
		if (typeof window !== 'undefined') {
			sessionStorage.setItem(key(quizId), JSON.stringify(state));
		}
	}, [state, quizId]);

	return { state, dispatch };
}

