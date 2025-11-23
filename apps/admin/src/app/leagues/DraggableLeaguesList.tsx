'use client'

import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragEndEvent,
} from '@dnd-kit/core'
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { SortableLeagueItem } from './SortableLeagueItem'

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

interface DraggableLeaguesListProps {
    leagues: League[]
    selectedLeague: League | null
    onSelectLeague: (league: League) => void
    onReorderLeagues: (leagues: League[]) => void
    leagueAccentColor: string
}

export function DraggableLeaguesList({
    leagues,
    selectedLeague,
    onSelectLeague,
    onReorderLeagues,
    leagueAccentColor,
}: DraggableLeaguesListProps) {
    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    )

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event

        if (over && active.id !== over.id) {
            const oldIndex = leagues.findIndex((item) => item.id === active.id)
            const newIndex = leagues.findIndex((item) => item.id === over.id)
            const newOrder = arrayMove(leagues, oldIndex, newIndex)
            onReorderLeagues(newOrder)
        }
    }

    return (
        <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
        >
            <SortableContext
                items={leagues.map(l => l.id)}
                strategy={verticalListSortingStrategy}
            >
                <div className="space-y-2">
                    {leagues.map((league) => (
                        <SortableLeagueItem
                            key={league.id}
                            league={league}
                            isSelected={selectedLeague?.id === league.id}
                            onSelect={() => onSelectLeague(league)}
                            leagueAccentColor={leagueAccentColor}
                        />
                    ))}
                </div>
            </SortableContext>
        </DndContext>
    )
}
