import { getQuizzes } from '@/lib/supabase';

// Helper function to get all quiz slugs for static generation
async function getAllQuizSlugs(): Promise<string[]> {
	// Try to fetch from database first (if available)
	try {
		const quizzes = await getQuizzes();
		if (quizzes && Array.isArray(quizzes) && quizzes.length > 0) {
			const slugs = quizzes
				.filter((q: any) => q.slug && (q.status === 'published' || q.status === 'available'))
				.map((q: any) => q.slug)
				.filter(Boolean); // Remove any null/undefined slugs
			if (slugs.length > 0) {
				return slugs;
			}
		}
	} catch (error) {
		// Fallback to hardcoded data if database unavailable
		// This is expected during build if Supabase env vars aren't set
		console.warn('Could not fetch quizzes from database for static generation:', error);
	}
	
	// Fallback to hardcoded slugs (from the DATA array in page.tsx)
	// These are the known quiz slugs
	return ['12', '11', '10', '9', '8', '7', '6', '5', '4', '3', '2', '1'];
}

// Generate static params for all quiz pages
// This pre-renders quiz pages at build time for instant loads
export async function generateStaticParams() {
	const slugs = await getAllQuizSlugs();
	return slugs.map((slug) => ({
		slug: slug,
	}));
}

// Revalidate pages every hour (ISR - Incremental Static Regeneration)
// This means pages are pre-rendered but can be updated without rebuilding
export const revalidate = 3600; // 1 hour

export default function QuizPlayLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return <>{children}</>;
}

