"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { QuizPlayer } from "@/components/quiz/QuizPlayer";
import { DemoEndScreen } from "@/components/quiz/DemoEndScreen";
import { useUserAccess } from "@/contexts/UserAccessContext";
import { getQuizColor } from '@/lib/colors';

import { getMockQuizData } from '@/lib/mock/quiz-fixtures';

// Get demo quiz data from centralized fixtures
const demoQuizData = getMockQuizData("demo");
const QUIZ_QUESTIONS = demoQuizData?.questions || [];
const QUIZ_ROUNDS = demoQuizData?.rounds || [];

export default function DemoQuizPage() {
	const router = useRouter();
	const { isVisitor } = useUserAccess();
	const [showResults, setShowResults] = React.useState(false);
	const [demoScore, setDemoScore] = React.useState(0);

	// Redirect if logged in
	React.useEffect(() => {
		if (!isVisitor) {
			router.replace('/quizzes');
		}
	}, [isVisitor, router]);

	if (!isVisitor) {
		return null;
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
				totalQuestions={QUIZ_QUESTIONS.length}
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
	const handleQuizComplete = (score: number, totalQuestions: number) => {
		onComplete(score);
	};

	return (
		<QuizPlayer
			quizTitle="Try Before You Sign Up"
			quizColor={getQuizColor(279)}
			quizSlug="demo"
			questions={QUIZ_QUESTIONS}
			rounds={QUIZ_ROUNDS}
			weekISO="2024-01-15"
			isNewest={true}
			isDemo={true}
			maxQuestions={undefined}
			onDemoComplete={handleQuizComplete}
		/>
	);
}

