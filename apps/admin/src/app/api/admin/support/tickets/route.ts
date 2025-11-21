import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@schoolquiz/db'
import { dummySupportTickets } from '@/lib/dummy-billing-data'

/**
 * GET /api/admin/support/tickets
 * List support tickets (admin only)
 * 
 * TODO: Create SupportTicket model in database schema
 * Suggested schema:
 * model SupportTicket {
 *   id             String   @id @default(cuid())
 *   subject        String
 *   status         String   @default("OPEN") // OPEN, IN_PROGRESS, CLOSED
 *   priority       String   @default("MEDIUM") // HIGH, MEDIUM, LOW
 *   category       String   // TECHNICAL, BILLING, FEATURE_REQUEST, etc.
 *   organisationId String?
 *   userId         String
 *   message        String
 *   assignedTo     String?
 *   createdAt      DateTime @default(now())
 *   updatedAt      DateTime @updatedAt
 *   user           User     @relation(fields: [userId], references: [id])
 *   organisation   Organisation? @relation(fields: [organisationId], references: [id])
 *   replies        SupportTicketReply[]
 * }
 * 
 * model SupportTicketReply {
 *   id        String   @id @default(cuid())
 *   ticketId  String
 *   userId    String
 *   message   String
 *   createdAt DateTime @default(now())
 *   ticket    SupportTicket @relation(fields: [ticketId], references: [id], onDelete: Cascade)
 *   user      User     @relation(fields: [userId], references: [id])
 * }
 */
export async function GET(request: NextRequest) {
  try {
    // Skip auth for testing
    // TODO: Re-enable authentication in production
    // const user = await getCurrentUser()
    // if (!user) {
    //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    // }

    // TODO: Add proper admin role check

    const searchParams = request.nextUrl.searchParams
    const status = searchParams.get('status') || ''
    const priority = searchParams.get('priority') || ''
    const search = searchParams.get('search') || ''
    const page = parseInt(searchParams.get('page') || '1', 10)
    const limit = parseInt(searchParams.get('limit') || '50', 10)
    const skip = (page - 1) * limit
    const sortBy = searchParams.get('sortBy') || 'createdAt'
    const sortOrder = searchParams.get('sortOrder') || 'desc'

    // TODO: Replace with database query when SupportTicket model is created
    // For now, use dummy data with filtering, search, pagination, and sorting
    console.log('Using dummy data for support tickets (database model not yet created)')
    
    let filtered = [...dummySupportTickets]

    // Apply status filter
    if (status) {
      filtered = filtered.filter(ticket => ticket.status === status)
    }

    // Apply priority filter
    if (priority) {
      filtered = filtered.filter(ticket => ticket.priority === priority)
    }

    // Apply search filter
    if (search) {
      const searchLower = search.toLowerCase()
      filtered = filtered.filter(ticket =>
        ticket.subject.toLowerCase().includes(searchLower) ||
        ticket.message.toLowerCase().includes(searchLower) ||
        ticket.userName.toLowerCase().includes(searchLower) ||
        ticket.userEmail.toLowerCase().includes(searchLower) ||
        (ticket.organisationName && ticket.organisationName.toLowerCase().includes(searchLower)) ||
        ticket.category.toLowerCase().includes(searchLower)
      )
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let aVal: any = a[sortBy as keyof typeof a]
      let bVal: any = b[sortBy as keyof typeof b]

      // Handle date strings
      if (sortBy === 'createdAt' || sortBy === 'updatedAt') {
        aVal = new Date(aVal).getTime()
        bVal = new Date(bVal).getTime()
      } else if (typeof aVal === 'string') {
        aVal = aVal.toLowerCase()
        bVal = (bVal || '').toLowerCase()
      }

      if (aVal < bVal) return sortOrder === 'asc' ? -1 : 1
      if (aVal > bVal) return sortOrder === 'asc' ? 1 : -1
      return 0
    })

    // Calculate pagination
    const total = filtered.length
    const totalPages = Math.ceil(total / limit)
    const startIndex = skip
    const endIndex = startIndex + limit
    const paginated = filtered.slice(startIndex, endIndex)

    return NextResponse.json({
      tickets: paginated,
      pagination: {
        page,
        limit,
        total,
        totalPages,
      }
    })
  } catch (error: any) {
    console.error('Error fetching support tickets:', error)
    return NextResponse.json(
      { error: 'Failed to fetch support tickets', details: error.message },
      { status: 500 }
    )
  }
}

