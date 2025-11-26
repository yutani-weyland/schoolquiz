'use client'

import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { GripVertical } from 'lucide-react'

interface League {
    id: string
    name: string
    description?: string | null
    inviteCode?: string
    createdByUserId?: string
    color?: string
    organisation?: {
        id: string
        name: string
    } | null
    creator?: {
        id: string
        name: string | null
        email: string
    }
    members?: Array<{
        id: string
        userId: string
        joinedAt: string
        user: {
            id: string
            name: string | null
            email: string
            teamName: string | null
        }
    }>
    _count?: {
        members: number
    }
}

interface SortableLeagueItemProps {
    league: League
    isSelected: boolean
    onSelect: () => void
    leagueAccentColor: string
    isCreator?: boolean
}

export function SortableLeagueItem({
    league,
    isSelected,
    onSelect,
    leagueAccentColor,
    isCreator
}: SortableLeagueItemProps) {
    // Defensive check - ensure league exists
    if (!league) {
        return null
    }

    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: league.id })

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
    }

    // Safely get member count
    const memberCount = league._count?.members ?? league.members?.length ?? 0

    return (
        <div ref={setNodeRef} style={style}>
            <button
                onClick={onSelect}
                className={`w-full text-left p-2.5 rounded-lg transition-all relative group ${isSelected
                    ? 'text-white shadow-md'
                    : 'bg-gray-50 dark:bg-gray-700/50 text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700'
                    }`}
                style={isSelected ? { backgroundColor: league.color || leagueAccentColor } : {}}
            >
                <div className="flex items-center gap-2.5">
                    <div
                        {...attributes}
                        {...listeners}
                        className="cursor-grab active:cursor-grabbing text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                        <GripVertical className="w-3.5 h-3.5" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                            <div className="font-medium text-sm truncate">{league.name || 'Unnamed League'}</div>
                            {isCreator && (
                                <span className={`text-xs px-1.5 py-0.5 rounded ${isSelected
                                    ? 'bg-white/20 text-white'
                                    : 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400'
                                    }`}>
                                    Admin
                                </span>
                            )}
                            {!isCreator && (
                                <span className={`text-xs px-1.5 py-0.5 rounded ${isSelected
                                    ? 'bg-white/20 text-white'
                                    : 'bg-gray-200 dark:bg-gray-600 text-gray-600 dark:text-gray-400'
                                    }`}>
                                    Member
                                </span>
                            )}
                        </div>
                        <div className={`text-xs mt-0.5 ${isSelected ? 'opacity-90' : 'opacity-70'}`}>
                            {league.organisation && (
                                <span className="truncate">{league.organisation.name}</span>
                            )}
                            {league.organisation && memberCount > 0 && <span className="mx-1">•</span>}
                            {memberCount > 0 && (
                                <span>{memberCount} member{memberCount !== 1 ? 's' : ''}</span>
                            )}
                            {!league.organisation && memberCount === 0 && (
                                <span className="opacity-50">No members</span>
                            )}
                        </div>
                    </div>
                </div>
            </button>
        </div>
    )
}
