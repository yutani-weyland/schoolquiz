'use client'

import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { GripVertical } from 'lucide-react'

interface League {
    id: string
    name: string
    description: string | null
    inviteCode: string
    createdByUserId: string
    color?: string
    creator: {
        id: string
        name: string | null
        email: string
    }
    members: Array<{
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
    _count: {
        members: number
    }
}

interface SortableLeagueItemProps {
    league: League
    isSelected: boolean
    onSelect: () => void
    leagueAccentColor: string
}

export function SortableLeagueItem({
    league,
    isSelected,
    onSelect,
    leagueAccentColor
}: SortableLeagueItemProps) {
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

    return (
        <div ref={setNodeRef} style={style}>
            <button
                onClick={onSelect}
                className={`w-full text-left p-4 rounded-xl transition-all relative group ${isSelected
                        ? 'text-white shadow-md'
                        : 'bg-gray-50 dark:bg-gray-700/50 text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700'
                    }`}
                style={isSelected ? { backgroundColor: league.color || leagueAccentColor } : {}}
            >
                <div className="flex items-center gap-3">
                    <div
                        {...attributes}
                        {...listeners}
                        className="cursor-grab active:cursor-grabbing text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                        <GripVertical className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <div className="font-medium mb-1 truncate">{league.name}</div>
                        <div className={`text-sm ${isSelected ? 'opacity-90' : 'opacity-75'}`}>
                            {league._count.members} member{league._count.members !== 1 ? 's' : ''}
                        </div>
                    </div>
                </div>
            </button>
        </div>
    )
}
