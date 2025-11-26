'use client'

import { useState, useCallback } from 'react'
import dynamic from 'next/dynamic'
import { Trophy, Users, Plus, Search, X, Copy, Mail, Calendar, Edit2, Trash2, LogOut, UserX } from 'lucide-react'
import { useUserTier } from '@/hooks/useUserTier'
import { useUserAccess } from '@/contexts/UserAccessContext'
import { UpgradeModal } from '@/components/premium/UpgradeModal'
import { SiteHeader } from '@/components/SiteHeader'
import { Footer } from '@/components/Footer'

// Dynamic imports for heavy components - loads only when needed
// Dynamic imports for heavy components - loads only when needed
const DraggableLeaguesList = dynamic(() => import('./DraggableLeaguesList').then(mod => mod.DraggableLeaguesList), {
    loading: () => <div className="space-y-2">{[...Array(3)].map((_, i) => (
        <div key={i} className="h-20 bg-gray-100 dark:bg-gray-700/50 rounded-xl animate-pulse" />
    ))}</div>,
    ssr: false, // DnD Kit doesn't work with SSR
})

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

interface LeagueStats {
    id: string
    userId: string
    quizSlug: string | null
    score: number | null
    totalQuestions: number | null
    totalCorrectAnswers: number
    bestStreak: number
    currentStreak: number
    quizzesPlayed: number
    user: {
        id: string
        name: string | null
        teamName: string | null
    }
}

export default function LeaguesPage() {
    const { tier, isPremium } = useUserTier()
    const { userName } = useUserAccess()
    const [showUpgradeModal, setShowUpgradeModal] = useState(false)
    const [leagues, setLeagues] = useState<League[]>([])
    const [selectedLeague, setSelectedLeague] = useState<League | null>(null)
    const [leagueStats, setLeagueStats] = useState<{
        stats: LeagueStats[]
        quizSlugs: string[]
        overallStats: LeagueStats[]
    } | null>(null)
    const [selectedQuiz, setSelectedQuiz] = useState<string | null>(null)
    const [loading, setLoading] = useState(true)

    // ... rest of the component logic stays the same
    // This is just showing the pattern for dynamic imports

    return (
        <>
            <SiteHeader />
            <main className="min-h-screen bg-white dark:bg-[#0F1419] text-gray-900 dark:text-white pt-24 sm:pt-32 pb-16 px-4 sm:px-8">
                <div className="max-w-6xl mx-auto">
                    {/* Use the dynamically imported component */}
                    {isPremium && leagues.length > 0 && (
                        <DraggableLeaguesList
                            leagues={leagues}
                            selectedLeague={selectedLeague}
                            onSelectLeague={setSelectedLeague}
                            onReorderLeagues={setLeagues}
                            leagueAccentColor="#3b82f6"
                        />
                    )}
                </div>
            </main>
            <Footer />
        </>
    )
}
