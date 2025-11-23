import React from 'react';

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    // Middleware now handles the primary authentication check.
    // This layout serves as a boundary for the dashboard area.
    // Future: Add DashboardSidebar, DashboardHeader, etc. here.

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-[#0F1419]">
            <main className="flex-1">
                {children}
            </main>
        </div>
    );
}
