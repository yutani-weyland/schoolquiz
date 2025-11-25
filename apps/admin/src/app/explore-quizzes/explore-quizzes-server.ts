import { prisma } from '@schoolquiz/db'

export interface QuizRound {
	id: string
	category: string
	title: string
	blurb: string
	color: string
	questions: Array<{
		id: string
		question: string
		answer: string
		explanation?: string
		category: string
	}>
}

export interface Quiz {
	id: string
	number: number
	title: string
	description: string
	status: 'draft' | 'scheduled' | 'published'
	scheduledDate?: string | null
	publishedDate?: string | null
	rounds: QuizRound[]
	submissions?: number
	averageScore?: number
	averageTime?: number
	categories: string[]
}

export interface ExploreQuizzesPageData {
	quizzes: Quiz[]
	total: number
}

/**
 * Fetch quizzes for explore page server-side
 * This can be cached with ISR since quiz data doesn't change frequently
 */
export async function getExploreQuizzesPageData(
	search?: string,
	status?: string,
	sortBy: string = 'createdAt',
	sortOrder: 'asc' | 'desc' = 'desc'
): Promise<ExploreQuizzesPageData> {
	try {
		// Build where clause
		const where: any = {}
		if (status && status !== 'all') {
			where.status = status.toUpperCase()
		}
		if (search) {
			where.OR = [
				{ title: { contains: search, mode: 'insensitive' as const } },
				{ blurb: { contains: search, mode: 'insensitive' as const } },
				{ slug: { contains: search, mode: 'insensitive' as const } },
			]
		}

		// Build orderBy clause
		const orderBy: any = {}
		if (sortBy === 'publicationDate') {
			orderBy.publicationDate = sortOrder
		} else if (sortBy === 'title') {
			orderBy.title = sortOrder
		} else if (sortBy === 'status') {
			orderBy.status = sortOrder
		} else {
			orderBy.createdAt = sortOrder
		}

		// Fetch quizzes with rounds included
		const [quizzes, total] = await Promise.all([
			prisma.quiz.findMany({
				where,
				take: 100, // Limit for explore page
				orderBy,
				select: {
					id: true,
					slug: true,
					title: true,
					blurb: true,
					status: true,
					publicationDate: true,
					createdAt: true,
					rounds: {
						select: {
							id: true,
							index: true,
							title: true,
							blurb: true,
							category: {
								select: {
									id: true,
									name: true,
								},
							},
							questions: {
								select: {
									question: {
										select: {
											id: true,
											text: true,
											answer: true,
											explanation: true,
										},
									},
								},
								orderBy: { order: 'asc' },
							},
						},
						orderBy: { index: 'asc' },
					},
					_count: {
						select: {
							runs: true,
						},
					},
				},
			}),
			prisma.quiz.count({ where }),
		])

		// Transform to component format
		const transformedQuizzes: Quiz[] = quizzes.map((q: any) => {
			// Extract categories from rounds
			const categories = q.rounds?.map((r: any) => 
				r.category?.name || r.title || 'Unknown'
			).filter(Boolean) || []
			
			// Extract number from slug (if it's numeric)
			const number = q.slug && /^\d+$/.test(q.slug) ? parseInt(q.slug) : 0

			return {
				id: q.id,
				number,
				title: q.title,
				description: q.blurb || '',
				status: (q.status?.toLowerCase() || 'draft') as 'draft' | 'scheduled' | 'published',
				publishedDate: q.publicationDate ? q.publicationDate.toISOString() : null,
				scheduledDate: q.publicationDate ? q.publicationDate.toISOString() : null,
				rounds: (q.rounds || []).map((r: any, idx: number) => ({
					id: r.id,
					category: r.category?.name || r.title || 'Unknown',
					title: r.title || r.category?.name || 'Round',
					blurb: r.blurb || '',
					color: `bg-blue-${100 + idx * 100} dark:bg-blue-${900}/30`,
					questions: (r.questions || []).map((rq: any) => ({
						id: rq.question?.id || '',
						question: rq.question?.text || '',
						answer: rq.question?.answer || '',
						explanation: rq.question?.explanation || undefined,
						category: r.category?.name || '',
					})),
				})),
				submissions: q._count?.runs || 0,
				averageScore: 0, // TODO: Calculate from completion data
				averageTime: 0, // TODO: Calculate from completion data
				categories,
			}
		})

		return {
			quizzes: transformedQuizzes,
			total,
		}
	} catch (error) {
		console.error('[Explore Quizzes Server] Error fetching quizzes:', error)
		// Return empty on error
		return {
			quizzes: [],
			total: 0,
		}
	}
}

