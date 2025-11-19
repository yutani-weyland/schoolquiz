/**
 * Component shown when quiz is not found
 */

import { FileQuestion } from 'lucide-react';
import Link from 'next/link';

interface QuizNotFoundProps {
	slug?: string;
}

export function QuizNotFound({ slug }: QuizNotFoundProps) {
	return (
		<div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
			<div className="max-w-md w-full text-center space-y-6">
				<div className="flex justify-center">
					<FileQuestion className="h-16 w-16 text-gray-400" />
				</div>
				<div className="space-y-2">
					<h1 className="text-2xl font-bold text-gray-900 dark:text-white">
						Quiz Not Found
					</h1>
					<p className="text-gray-600 dark:text-gray-400">
						{slug
							? `The quiz "${slug}" could not be found.`
							: 'The requested quiz could not be found.'}
					</p>
				</div>
				<Link
					href="/quizzes"
					className="inline-flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
				>
					Back to Quizzes
				</Link>
			</div>
		</div>
	);
}

