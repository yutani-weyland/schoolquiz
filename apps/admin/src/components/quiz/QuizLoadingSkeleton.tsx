/**
 * Loading skeleton for quiz play page
 * OPTIMIZATION: Consistent spinner style across all quiz loading states
 */

'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';

export function QuizLoadingSkeleton() {
	return (
		<div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
			<motion.div
				className="flex flex-col items-center gap-4"
				initial={{ opacity: 0, scale: 0.9 }}
				animate={{ opacity: 1, scale: 1 }}
				transition={{ duration: 0.3 }}
			>
				<Loader2 className="w-12 h-12 text-blue-600 dark:text-blue-400 animate-spin" />
				<p className="text-gray-600 dark:text-gray-400 text-lg font-medium">
					Loading quiz...
				</p>
			</motion.div>
		</div>
	);
}
