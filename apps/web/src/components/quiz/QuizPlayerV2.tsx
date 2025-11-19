"use client";

import React, { useEffect, useMemo } from "react";
import { AppBar } from "./AppBar";
import { HUD } from "./HUD";
import { QuestionCard } from "./QuestionCard";
import { useQuizState, Mode } from "./useQuizState";

interface Question {
	id: number;
	question: string;
	answer: string;
	roundNumber: number;
}

interface Round {
	number: number;
	title: string;
	blurb: string;
}

interface QuizPlayerProps {
	quizTitle: string;
	quizColor: string;
	quizSlug: string;
	questions: Question[];
	rounds: Round[];
}

export function QuizPlayerV2({ quizTitle, quizColor, quizSlug, questions, rounds }: QuizPlayerProps) {
	// Debug logging
	useEffect(() => {
		console.log('QuizPlayerV2 mounted', { 
			quizTitle, 
			quizColor, 
			quizSlug, 
			questionsCount: questions?.length,
			roundsCount: rounds?.length,
			questions: questions?.slice(0, 3)
		});
	}, [quizTitle, quizColor, quizSlug, questions, rounds]);

	// Read mode from URL
	const mode: Mode = useMemo(() => {
		if (typeof window !== 'undefined') {
			const params = new URLSearchParams(window.location.search);
			return params.get('mode') === 'presenter' ? 'presenter' : 'flow';
		}
		return 'flow';
	}, []);

	const { state, dispatch } = useQuizState(quizSlug, mode);

	// Questions are already flat, sorted by round
	const flat = useMemo(() => {
		const sorted = [...questions].sort((a, b) => {
			if (a.roundNumber !== b.roundNumber) {
				return a.roundNumber - b.roundNumber;
			}
			return a.id - b.id;
		});
		console.log('Flattened questions:', sorted.length, sorted.slice(0, 3));
		return sorted;
	}, [questions]);

	// 4 rounds of 6 questions each (24 questions) + 1 peoples round question (25 total)
	const cursor = state.r < 4 ? state.r * 6 + state.q : 24; // r=4, q=0 maps to index 24
	const currentQuestion = flat[cursor];
	const isFirst = cursor === 0;
	const isLast = cursor === flat.length - 1;

	// Debug current state
	useEffect(() => {
		console.log('Current state:', { cursor, r: state.r, q: state.q, hasQuestion: !!currentQuestion });
	}, [cursor, state.r, state.q, currentQuestion]);

	// Keyboard shortcuts
	useEffect(() => {
		const onKey = (e: KeyboardEvent) => {
			if (e.key === "ArrowRight" || e.key === " ") {
				e.preventDefault();
				dispatch({ type: "NEXT" });
			}
			if (e.key === "ArrowLeft") {
				e.preventDefault();
				dispatch({ type: "PREV" });
			}
			if (e.key.toLowerCase() === "c") {
				dispatch({ type: "MARK_CORRECT" });
			}
			if (e.key.toLowerCase() === "t") {
				dispatch({ type: "TOGGLE_TIMER" });
			}
			if (e.key === "Escape") {
				if (typeof window !== 'undefined') {
					window.location.href = "/quizzes";
				}
			}
		};
		window.addEventListener("keydown", onKey);
		return () => window.removeEventListener("keydown", onKey);
	}, [dispatch]);

	const handleExit = () => {
		if (typeof window !== 'undefined') {
			window.location.href = "/quizzes";
		}
	};

	// Safety checks
	if (!questions || questions.length === 0) {
		return (
			<div className="min-h-dvh grid place-items-center bg-gray-100">
				<div className="text-center">
					<p className="text-lg text-gray-600 mb-2">Loading questions...</p>
					<p className="text-sm text-gray-400">Questions: {questions?.length || 0}</p>
				</div>
			</div>
		);
	}

	if (!currentQuestion) {
		return (
			<div className="min-h-dvh grid place-items-center bg-gray-100">
				<div className="text-center">
					<p className="text-lg text-gray-600 mb-2">Question not found</p>
					<p className="text-sm text-gray-400">
						Cursor: {cursor}, Total: {flat.length}, R: {state.r}, Q: {state.q}
					</p>
					<button 
						onClick={() => dispatch({ type: "RESET" })}
						className="mt-4 px-4 py-2 bg-blue-600 text-white rounded"
					>
						Reset Quiz
					</button>
				</div>
			</div>
		);
	}

	return (
		<div 
			className="min-h-dvh quiz-surface text-gray-900"
			style={{ ["--quiz" as any]: quizColor }}
		>
			<AppBar
				title={quizTitle}
				score={state.score}
				outOf={flat.length}
				showTimer={state.showTimer}
				startedAt={state.startedAt}
				onToggleTimer={() => dispatch({ type: "TOGGLE_TIMER" })}
				onExit={handleExit}
			/>

			<div className="mb-[var(--space-2)]">
				<HUD
					total={flat.length}
					current={cursor}
					segments={[6, 6, 6, 6, 1]}
					onJump={(i) => {
						if (i < 24) {
							// Standard rounds: 6 questions each
							dispatch({ type: "GOTO", r: Math.floor(i / 6), q: i % 6 });
						} else {
							// Peoples round: 1 question
							dispatch({ type: "GOTO", r: 4, q: 0 });
						}
					}}
				/>
			</div>

			<main className="container px-0 grid place-items-center py-[var(--space-4)]">
				<QuestionCard
					text={currentQuestion.question}
					mode={mode}
					isFirst={isFirst}
					isLast={isLast}
					onCorrect={() => dispatch({ type: "MARK_CORRECT" })}
					onNext={() => dispatch({ type: "NEXT" })}
					onPrev={() => dispatch({ type: "PREV" })}
				/>
			</main>

			<div className="h-[var(--space-6)]" />
		</div>
	);
}

