/**
 * OPTIMIZATION: Server-side context helpers for Custom Quizzes
 * Gets user's organisation and group membership for tab visibility
 */

import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@schoolquiz/db'

export interface CustomQuizzesContext {
	hasGroups: boolean
	hasOrganisation: boolean
}

/**
 * OPTIMIZATION: Get user's organisation and group context
 * Used to determine which tabs to show
 */
export async function getCustomQuizzesContext(): Promise<CustomQuizzesContext> {
	const user = await getCurrentUser()

	if (!user) {
		return {
			hasGroups: false,
			hasOrganisation: false,
		}
	}

	try {
		// OPTIMIZATION: Single query to check org membership and groups
		const orgMember = await prisma.organisationMember.findFirst({
			where: {
				userId: user.id,
				status: 'ACTIVE',
				deletedAt: null,
			},
			select: {
				organisationId: true,
				groupMembers: {
					where: {
						group: {
							deletedAt: null,
						},
					},
					select: {
						group: {
							select: {
								id: true,
							},
						},
					},
					take: 1, // Only need to know if exists
				},
			},
		})

		return {
			hasGroups: (orgMember?.groupMembers.length || 0) > 0,
			hasOrganisation: !!orgMember?.organisationId,
		}
	} catch (error) {
		console.error('[Custom Quizzes Context] Error fetching context:', error)
		return {
			hasGroups: false,
			hasOrganisation: false,
		}
	}
}







