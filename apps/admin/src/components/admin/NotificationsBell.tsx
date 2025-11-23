'use client'

import { useState, useEffect } from 'react'
import { Bell } from 'lucide-react'
import Link from 'next/link'
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover'
import { Badge } from './ui/Badge'

interface SupportTicket {
  id: string
  subject: string
  status: string
  priority: string
  createdAt: string
}

export function NotificationsBell() {
  const [notifications, setNotifications] = useState<SupportTicket[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchNotifications()
    // Poll for new notifications every 30 seconds
    const interval = setInterval(fetchNotifications, 30000)
    return () => clearInterval(interval)
  }, [])

  const fetchNotifications = async () => {
    try {
      const response = await fetch('/api/admin/support/tickets?status=OPEN')
      const data = await response.json()

      if (response.ok) {
        // Get open tickets, prioritize HIGH priority
        const openTickets = (data.tickets || []).filter((t: SupportTicket) => t.status === 'OPEN')
        const sorted = openTickets.sort((a: SupportTicket, b: SupportTicket) => {
          if (a.priority === 'HIGH' && b.priority !== 'HIGH') return -1
          if (b.priority === 'HIGH' && a.priority !== 'HIGH') return 1
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        })
        setNotifications(sorted.slice(0, 5)) // Show top 5
      }
    } catch (error) {
      console.error('Failed to fetch notifications:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const unreadCount = notifications.length
  const highPriorityCount = notifications.filter(t => t.priority === 'HIGH').length

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays < 7) return `${diffDays}d ago`
    return date.toLocaleDateString('en-AU', { day: '2-digit', month: 'short' })
  }

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <button
          className="relative p-2.5 rounded-xl bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--muted))]/80 hover:text-[hsl(var(--foreground))] border border-[hsl(var(--border))] transition-colors"
          title="Notifications"
        >
          <Bell className="w-4 h-4" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[10px] font-bold text-white bg-red-500 rounded-full">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent
        className="w-80 max-h-[400px] overflow-hidden p-0"
        sideOffset={8}
        align="end"
      >
        <div className="p-4 border-b border-[hsl(var(--border))]">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-[hsl(var(--foreground))]">Notifications</h3>
            {unreadCount > 0 && (
              <Badge variant="error" className="text-xs">
                {unreadCount} {unreadCount === 1 ? 'ticket' : 'tickets'}
              </Badge>
            )}
          </div>
        </div>
        <div className="overflow-y-auto max-h-[320px]">
          {isLoading ? (
            <div className="p-8 text-center">
              <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-[hsl(var(--primary))]"></div>
            </div>
          ) : notifications.length === 0 ? (
            <div className="p-8 text-center text-sm text-[hsl(var(--muted-foreground))]">
              <Bell className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p>No new notifications</p>
            </div>
          ) : (
            <div className="divide-y divide-[hsl(var(--border))]">
              {notifications.map((ticket) => (
                <Link
                  key={ticket.id}
                  href="/admin/support"
                  onClick={() => setIsOpen(false)}
                  className="block p-4 hover:bg-[hsl(var(--muted))] transition-colors"
                >
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <p className="text-sm font-medium text-[hsl(var(--foreground))] line-clamp-1">
                      {ticket.subject}
                    </p>
                    {ticket.priority === 'HIGH' && (
                      <Badge variant="error" className="text-xs flex-shrink-0">
                        High
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-[hsl(var(--muted-foreground))]">
                    {formatTimeAgo(ticket.createdAt)}
                  </p>
                </Link>
              ))}
            </div>
          )}
        </div>
        {notifications.length > 0 && (
          <div className="p-3 border-t border-[hsl(var(--border))]">
            <Link
              href="/admin/support"
              onClick={() => setIsOpen(false)}
              className="block text-center text-sm text-[hsl(var(--primary))] hover:underline"
            >
              View all tickets
            </Link>
          </div>
        )}
      </PopoverContent>
    </Popover>
  )
}

