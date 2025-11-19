"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { QuizPlayer } from "@/components/quiz/QuizPlayer";
import { DemoEndScreen } from "@/components/quiz/DemoEndScreen";
import { useUserAccess } from "@/contexts/UserAccessContext";
import { getQuizColor } from '@/lib/colors';
import { useQuiz } from "@/hooks/useQuiz";
import { QuizLoadingSkeleton } from "@/components/quiz/QuizLoadingSkeleton";
import { QuizError } from "@/components/quiz/QuizError";

export default function DemoQuizPage() {
	const router = useRouter();
	const { isLoading } = useUserAccess();
	const [showResults, setShowResults] = React.useState(false);
	const [demoScore, setDemoScore] = React.useState(0);

	// Show loading while context is determining user status
	if (isLoading) {
		return <QuizLoadingSkeleton />;
	}

	// Handle quiz completion
	const handleQuizComplete = (score: number) => {
		setDemoScore(score);
		setShowResults(true);
	};

	if (showResults) {
		return (
			<DemoEndScreen
				score={demoScore}
				totalQuestions={25} // Standard quiz format: 4 rounds of 6 + 1 peoples round
				onRestart={() => {
					setShowResults(false);
					setDemoScore(0);
					// Reload to restart quiz
					window.location.reload();
				}}
			/>
		);
	}

	return (
		<RestrictedQuizPlayer
			onComplete={handleQuizComplete}
		/>
	);
}

// Wrapper component for quiz with gameplay restrictions
function RestrictedQuizPlayer({ onComplete }: { onComplete: (score: number) => void }) {
	const { data: quizData, loading, error, refetch } = useQuiz("demo");
	
	React.useEffect(() => {
		console.log('[Demo Page] Quiz data state:', { loading, error: error?.message, hasData: !!quizData, questionsCount: quizData?.questions?.length, roundsCount: quizData?.rounds?.length });
	}, [loading, error, quizData]);
	
	const handleQuizComplete = (score: number, totalQuestions: number) => {
		onComplete(score);
	};

	if (loading) {
		console.log('[Demo Page] Showing loading skeleton');
		return <QuizLoadingSkeleton />;
	}

	if (error) {
		console.error('[Demo Page] Error loading quiz:', error);
		return <QuizError error={error} onRetry={refetch} slug="demo" />;
	}

	if (!quizData) {
		console.warn('[Demo Page] No quiz data available');
		return (
			<div className="min-h-screen flex items-center justify-center">
				<div className="text-center">
					<h2 className="text-2xl font-bold mb-4">Demo quiz not found</h2>
					<p className="text-gray-600">Please try again later.</p>
				</div>
			</div>
		);
	}

	// Safety check: ensure we have valid questions and rounds
	if (!quizData.questions || quizData.questions.length === 0) {
		console.error('[Demo Page] Quiz data has no questions');
		return (
			<div className="min-h-screen flex items-center justify-center">
				<div className="text-center">
					<h2 className="text-2xl font-bold mb-4">Demo quiz has no questions</h2>
					<p className="text-gray-600">Please try again later.</p>
					<button 
						onClick={() => refetch()} 
						className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
					>
						Retry
					</button>
				</div>
			</div>
		);
	}

	if (!quizData.rounds || quizData.rounds.length === 0) {
		console.error('[Demo Page] Quiz data has no rounds');
		return (
			<div className="min-h-screen flex items-center justify-center">
				<div className="text-center">
					<h2 className="text-2xl font-bold mb-4">Demo quiz has no rounds</h2>
					<p className="text-gray-600">Please try again later.</p>
					<button 
						onClick={() => refetch()} 
						className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
					>
						Retry
					</button>
				</div>
			</div>
		);
	}

	console.log('[Demo Page] Rendering QuizPlayer with data:', { 
		questionsCount: quizData.questions.length, 
		roundsCount: quizData.rounds.length,
		isDemo: true 
	});

	return (
		<QuizPlayer
			quizTitle="Try Before You Sign Up"
			quizColor={getQuizColor(279)}
			quizSlug="demo"
			questions={quizData.questions}
			rounds={quizData.rounds}
			weekISO="2024-01-15"
			isNewest={true}
			isDemo={true}
			maxQuestions={undefined}
			onDemoComplete={handleQuizComplete}
		/>
	);
}

