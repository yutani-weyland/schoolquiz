/**
 * Error component for quiz play page
 */

import { AlertCircle, RefreshCw } from 'lucide-react';
import Link from 'next/link';

interface QuizErrorProps {
	error: Error;
	onRetry?: () => void;
	slug?: string;
}

export function QuizError({ error, onRetry, slug }: QuizErrorProps) {
	return (
		<div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
			<div className="max-w-md w-full text-center space-y-6">
				<div className="flex justify-center">
					<AlertCircle className="h-16 w-16 text-red-500" />
				</div>
				<div className="space-y-2">
					<h1 className="text-2xl font-bold text-gray-900 dark:text-white">
						Failed to Load Quiz
					</h1>
					<p className="text-gray-600 dark:text-gray-400">
						{error.message || 'An unexpected error occurred while loading the quiz.'}
					</p>
				</div>
				<div className="flex flex-col sm:flex-row gap-3 justify-center">
					{onRetry && (
						<button
							onClick={onRetry}
							className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
						>
							<RefreshCw className="h-4 w-4" />
							Try Again
						</button>
					)}
					<Link
						href="/quizzes"
						className="inline-flex items-center justify-center px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
					>
						Back to Quizzes
					</Link>
				</div>
			</div>
		</div>
	);
}

