import { Suspense } from 'react'
import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth'
import { getQuizzesPageData } from './quizzes-server'
import { QuizzesClient } from './QuizzesClient'
import { QuizCardGridSkeleton } from '@/components/ui/Skeleton'
import { getQuizColor } from '@/lib/colors'
import type { Quiz } from "@/components/quiz/QuizCard"

// Force dynamic rendering for user-specific data
export const dynamic = 'force-dynamic'

// Official quizzes list (static data)
const quizzes: Quiz[] = [
	{
		id: 12,
		slug: "12",
		title: "Shape Up, Pumpkins, Famous First Words, Crazes, and Next In Sequence.",
		blurb: "A weekly selection mixing patterns, pop culture and logic.",
		weekISO: "2024-01-15",
		colorHex: getQuizColor(12),
		status: "available",
		tags: ["Patterns", "Pop Culture", "Logic", "Famous Quotes", "Sequences"]
	},
	{
		id: 11,
		slug: "11",
		title: "Opposite Day, Lights, Common Ground, Robots Etc, and First Ladies.",
		blurb: "Wordplay meets trivia.",
		weekISO: "2024-01-08",
		colorHex: getQuizColor(11),
		status: "available",
		tags: ["Wordplay", "History", "Technology", "Politics", "General Knowledge"]
	},
	{
		id: 10,
		slug: "10",
		title: "Back to the Past, Name That Nation, Name the Other, Analog Games, and What Does It Stand For?",
		blurb: "History, geography and acronyms.",
		weekISO: "2024-01-01",
		colorHex: getQuizColor(10),
		status: "available",
		tags: ["History", "Geography", "Games", "Acronyms", "Trivia"]
	},
	{
		id: 9,
		slug: "9",
		title: "Holiday Trivia, Winter Sports, Year End Review, and Festive Fun.",
		blurb: "Seasonal mixed bag.",
		weekISO: "2023-12-25",
		colorHex: getQuizColor(9),
		status: "available",
		tags: ["Seasonal", "Sports", "Year Review", "Holidays", "Winter"]
	},
	{
		id: 8,
		slug: "8",
		title: "Movie Magic, Tech Trends, Sports Moments, and Pop Culture.",
		blurb: "Headlines and highlights.",
		weekISO: "2023-12-18",
		colorHex: getQuizColor(8),
		status: "available",
		tags: ["Movies", "Technology", "Sports", "Pop Culture", "Entertainment"]
	},
	{
		id: 7,
		slug: "7",
		title: "World Wonders, Historical Events, Science Facts, and Geography.",
		blurb: "Curiosities around the world.",
		weekISO: "2023-12-11",
		colorHex: getQuizColor(7),
		status: "available",
		tags: ["Science", "Geography", "History", "World Facts", "Nature"]
	},
	{
		id: 6,
		slug: "6",
		title: "Literature Classics, Music Legends, Art Movements, and Cultural Icons.",
		blurb: "Explore the arts and humanities.",
		weekISO: "2023-12-04",
		colorHex: getQuizColor(6),
		status: "available",
		tags: ["Literature", "Music", "Art", "Culture", "Humanities"]
	},
	{
		id: 5,
		slug: "5",
		title: "Space Exploration, Ocean Depths, Animal Kingdom, and Natural Phenomena.",
		blurb: "Discover the wonders of nature.",
		weekISO: "2023-11-27",
		colorHex: getQuizColor(5),
		status: "available",
		tags: ["Space", "Ocean", "Animals", "Nature", "Science"]
	},
	{
		id: 4,
		slug: "4",
		title: "Food & Drink, Cooking Techniques, World Cuisines, and Culinary History.",
		blurb: "A feast for the mind.",
		weekISO: "2023-11-20",
		colorHex: getQuizColor(4),
		status: "available",
		tags: ["Food", "Cooking", "Cuisine", "History", "Culture"]
	},
	{
		id: 3,
		slug: "3",
		title: "Sports Legends, Olympic Moments, World Records, and Athletic Achievements.",
		blurb: "Celebrate sporting excellence.",
		weekISO: "2023-11-13",
		colorHex: getQuizColor(3),
		status: "available",
		tags: ["Sports", "Olympics", "Records", "Athletics", "Achievement"]
	},
	{
		id: 2,
		slug: "2",
		title: "Mathematics Puzzles, Logic Problems, Number Patterns, and Brain Teasers.",
		blurb: "Exercise your logical mind.",
		weekISO: "2023-11-06",
		colorHex: getQuizColor(2),
		status: "available",
		tags: ["Math", "Logic", "Puzzles", "Patterns", "Brain Teasers"]
	},
	{
		id: 1,
		slug: "1",
		title: "Famous Inventions, Scientific Discoveries, Medical Breakthroughs, and Innovation.",
		blurb: "Celebrate human ingenuity.",
		weekISO: "2023-10-30",
		colorHex: getQuizColor(1),
		status: "available",
		tags: ["Inventions", "Science", "Medicine", "Innovation", "Discovery"]
	}
]

/**
 * Server Component - Quizzes Page
 * Fetches data server-side and streams to client component
 */
export default async function QuizzesPage() {
	// Get quiz slugs for fetching completions
	const quizSlugs = quizzes.map(q => q.slug)
	
	// Fetch page data server-side
	const pageData = await getQuizzesPageData(quizSlugs)

	// For visitors, redirect to latest quiz intro
	if (!pageData.isLoggedIn) {
		redirect('/quizzes/12/intro')
	}

	return (
		<Suspense fallback={<QuizCardGridSkeleton count={6} />}>
			<QuizzesClient initialData={pageData} quizzes={quizzes} />
		</Suspense>
	)
}
