'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { PageLayout } from '@/components/layout/PageLayout';
import { PageContainer } from '@/components/layout/PageContainer';
import { SidebarNav } from '@/components/premium/SidebarNav';
import { PrivateLeaguesTab } from '@/components/premium/PrivateLeaguesTab';
import { AccountProfileTab } from '@/components/premium/AccountProfileTab';
import { SubscriptionBillingTab } from '@/components/premium/SubscriptionBillingTab';
import Link from 'next/link';
import { User, Trophy, CreditCard, Building2, ChevronRight } from 'lucide-react';

type TabId = 'leagues' | 'account' | 'billing' | 'organisation';

export default function AccountPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState<TabId>('account');
  const [isPremium, setIsPremium] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [hasOrgAdmin, setHasOrgAdmin] = useState(false);

  useEffect(() => {
    // Check premium status
    const checkPremium = async () => {
      try {
        const token = localStorage.getItem('authToken');
        if (!token) {
          router.push('/sign-in');
          return;
        }

        // Check subscription status
        const response = await fetch('/api/user/subscription', {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (response.ok) {
          const data = await response.json();
          // Consider ACTIVE, TRIALING, or FREE_TRIAL as premium access
          const premiumStatuses = ['ACTIVE', 'TRIALING', 'FREE_TRIAL'];
          setIsPremium(premiumStatuses.includes(data.status));
        } else {
          setIsPremium(false);
        }

        // TODO: Check if user has org admin role
        // For now, set to false
        setHasOrgAdmin(false);
      } catch (err) {
        console.error('Failed to check premium status:', err);
        setIsPremium(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkPremium();

    // Get tab from URL
    const tab = searchParams.get('tab') as TabId | null;
    if (tab && ['leagues', 'account', 'billing', 'organisation'].includes(tab)) {
      setActiveTab(tab);
    }
  }, [router, searchParams]);

  const handleTabChange = (tab: TabId) => {
    // Organisation admin is handled by Link in sidebar
    if (tab === 'organisation') return;
    
    setActiveTab(tab);
    // Update URL without page reload
    const newUrl = new URL(window.location.href);
    newUrl.searchParams.set('tab', tab);
    window.history.pushState({}, '', newUrl.toString());
  };

  if (isLoading) {
    return (
      <PageLayout>
        <PageContainer>
          <div className="flex items-center justify-center min-h-screen">
            <div className="text-center">
              <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
              <p className="text-gray-600 dark:text-gray-400">Loading...</p>
            </div>
          </div>
        </PageContainer>
      </PageLayout>
    );
  }

  // All users have access to settings - premium gate removed

  const sections = [
    { id: 'account' as TabId, label: 'Account & Profile', icon: User, component: <AccountProfileTab /> },
    { id: 'leagues' as TabId, label: 'Private Leagues', icon: Trophy, component: <PrivateLeaguesTab /> },
    { id: 'billing' as TabId, label: 'Subscription & Billing', icon: CreditCard, component: <SubscriptionBillingTab /> },
  ];

  if (hasOrgAdmin) {
    sections.push({
      id: 'organisation' as TabId,
      label: 'Organisation Admin',
      icon: Building2,
      component: (
        <div className="space-y-8">
          <div>
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-gray-900 dark:text-white mb-4">
              Organisation Admin
            </h1>
            <p className="text-lg md:text-xl text-gray-600 dark:text-gray-400 max-w-2xl">
              Manage your organisation settings, members, and billing
            </p>
          </div>
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-8">
            <p className="text-gray-600 dark:text-gray-400">
              Organisation admin features coming soon. This will link to your organisation management dashboard.
            </p>
          </div>
        </div>
      ),
    });
  }

  return (
    <PageLayout>
      <PageContainer maxWidth="6xl">
        {/* Mobile Layout - Cards stacked */}
        <div className="lg:hidden space-y-6">
          <div className="max-w-2xl mx-auto space-y-6">
          {/* Page Header */}
          <div className="mb-8">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-2">
              Account
            </h1>
            <p className="text-base text-gray-600 dark:text-gray-400">
              Manage your account settings and preferences
            </p>
          </div>

          {/* Section Cards */}
          {sections.map((section) => {
            const Icon = section.icon;
            const isActive = activeTab === section.id;
            
            return (
              <div key={section.id}>
                {/* Card Header - Clickable */}
                <button
                  onClick={() => handleTabChange(section.id)}
                  className={`
                    w-full flex items-center justify-between p-6 rounded-2xl border-2 transition-all
                    ${
                      isActive
                        ? 'border-blue-600 dark:border-blue-400 bg-blue-50 dark:bg-blue-900/20'
                        : 'border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 hover:border-gray-300 dark:hover:border-gray-700'
                    }
                  `}
                >
                  <div className="flex items-center gap-4">
                    <div className={`
                      w-12 h-12 rounded-xl flex items-center justify-center
                      ${isActive ? 'bg-blue-100 dark:bg-blue-900/40' : 'bg-gray-100 dark:bg-gray-800'}
                    `}>
                      <Icon className={`w-6 h-6 ${isActive ? 'text-blue-600 dark:text-blue-400' : 'text-gray-700 dark:text-gray-300'}`} />
                    </div>
                    <div className="text-left">
                      <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                        {section.label}
                      </h2>
                    </div>
                  </div>
                  <ChevronRight className={`w-5 h-5 transition-transform ${isActive ? 'rotate-90' : ''} text-gray-400`} />
                </button>

                {/* Card Content - Expandable */}
                {isActive && (
                  <div className="mt-4 bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6">
                    {section.component}
                  </div>
                )}
              </div>
            );
          })}
          </div>
        </div>

        {/* Desktop Layout - Sidebar + Content */}
        <div className="hidden lg:flex flex-row min-h-[calc(100vh-6rem)] gap-8">
        {/* Sidebar Container */}
        <div className="w-72 flex-shrink-0 sticky top-24 self-start h-[calc(100vh-8rem)] overflow-hidden">
          <SidebarNav
            activeTab={activeTab}
            onTabChange={handleTabChange}
            hasOrgAdmin={hasOrgAdmin}
          />
        </div>

        {/* Main Content */}
        <main className="flex-1 min-h-[calc(100vh-6rem)] py-8 overflow-x-hidden">
          <div className="max-w-4xl">
            {activeTab === 'leagues' && <PrivateLeaguesTab />}
            {activeTab === 'account' && <AccountProfileTab />}
            {activeTab === 'billing' && <SubscriptionBillingTab />}
            {activeTab === 'organisation' && (
              <div className="space-y-8">
                <div>
                  <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">
                    Organisation Admin
                  </h1>
                  <p className="text-lg md:text-xl text-gray-600 dark:text-gray-400 max-w-2xl">
                    Manage your organisation settings, members, and billing
                  </p>
                </div>
                <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-200 dark:border-gray-800 p-8">
                  <p className="text-gray-600 dark:text-gray-400">
                    Organisation admin features coming soon. This will link to your organisation management dashboard.
                  </p>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
      </PageContainer>
    </PageLayout>
  );
}
