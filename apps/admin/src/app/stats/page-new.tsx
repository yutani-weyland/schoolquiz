import { Suspense } from 'react';
import { StatsClient } from './StatsClient';
import { SiteHeader } from '@/components/SiteHeader';
import { Footer } from '@/components/Footer';
import { LockedFeature } from '@/components/access/LockedFeature';

// This is now a Server Component (no 'use client')
// It can fetch data on the server for faster initial loads

async function getServerSideProps() {
    // In a real app, you'd check auth on server
    // For now, we'll let the client handle it
    return {
        isPremium: false, // Will be determined client-side
    };
}

export default async function StatsPage() {
    const { isPremium } = await getServerSideProps();

    return (
        <>
            <SiteHeader />
            <Suspense fallback={
                <div className="flex items-center justify-center min-h-screen">
                    <div className="text-center">
                        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                        <p className="text-gray-600 dark:text-gray-400">Loading stats...</p>
                    </div>
                </div>
            }>
                <StatsClientWrapper />
            </Suspense>
            <Footer />
        </>
    );
}

// Wrapper to handle client-side premium check
function StatsClientWrapper() {
    // This will be handled by StatsClient
    return <StatsClient initialData={null} isPremium={true} />;
}
