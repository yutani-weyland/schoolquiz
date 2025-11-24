'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { PageLayout } from '@/components/layout/PageLayout';
import { PageContainer } from '@/components/layout/PageContainer';
import { PageHeader } from '@/components/layout/PageHeader';
import { ContentCard } from '@/components/layout/ContentCard';
import { AccountTab } from '@/components/premium/AccountTab';
import { ReferralTab } from '@/components/premium/ReferralTab';
import { SubscriptionTab } from '@/components/premium/SubscriptionTab';
import { OrganisationBrandingTab } from '@/components/premium/OrganisationBrandingTab';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Gift, CreditCard, Building2 } from 'lucide-react';
import { useUserTier } from '@/hooks/useUserTier';

type TabId = 'account' | 'referral' | 'subscription' | 'organisation';

export default function AccountPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabId>('account');
  // Use premium status from useUserTier hook (already fetches subscription data)
  const { tier, isPremium: isPremiumTier, isLoading: tierLoading } = useUserTier();

  // Redirect if not authenticated
  useEffect(() => {
    const token = localStorage.getItem('authToken');
    if (!token) {
      router.push('/sign-in');
    }
  }, [router]);

  if (tierLoading) {
    return (
      <PageLayout>
        <PageContainer maxWidth="2xl">
          <div className="flex items-center justify-center min-h-[calc(100vh-12rem)]">
            <div className="text-center">
              <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
              <p className="text-gray-600 dark:text-gray-400">Loading...</p>
            </div>
          </div>
        </PageContainer>
      </PageLayout>
    );
  }

  // Define tabs
  const tabs = [
    { id: 'account' as TabId, label: 'Account', icon: User },
    { id: 'referral' as TabId, label: 'Refer & Earn', icon: Gift },
    { id: 'subscription' as TabId, label: 'Subscription', icon: CreditCard },
    { id: 'organisation' as TabId, label: 'Organisation', icon: Building2 },
  ];

  return (
    <PageLayout>
      <PageContainer maxWidth="2xl">
        <div className="flex items-center justify-center min-h-[calc(100vh-12rem)]">
          <div className="w-full max-w-3xl">
            <PageHeader
              title="Account Settings"
              subtitle="Manage your account, preferences, and subscription"
              centered
            />

            {/* Mobile: Separate Cards */}
            <div className="md:hidden space-y-6">
              <ContentCard padding="xl" rounded="3xl" hoverAnimation={false}>
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                    <User className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">Account</h2>
                </div>
                <AccountTab isPremium={isPremiumTier} />
              </ContentCard>

              <ContentCard padding="xl" rounded="3xl" hoverAnimation={false}>
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                    <Gift className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">Refer & Earn</h2>
                </div>
                <ReferralTab />
              </ContentCard>

              <ContentCard padding="xl" rounded="3xl" hoverAnimation={false}>
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                    <CreditCard className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">Subscription</h2>
                </div>
                <SubscriptionTab />
              </ContentCard>

              <ContentCard padding="xl" rounded="3xl" hoverAnimation={false}>
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                    <Building2 className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">Organisation Branding</h2>
                </div>
                <OrganisationBrandingTab />
              </ContentCard>
            </div>

            {/* Desktop: Tab Switcher */}
            <div className="hidden md:block">
              <ContentCard padding="xl" rounded="3xl" hoverAnimation={false}>
                {/* Tab Switcher */}
                <div className="flex gap-1 mb-8 p-1 bg-gray-100 dark:bg-gray-700 rounded-full overflow-x-auto">
                  {tabs.map((tab) => {
                    const Icon = tab.icon;
                    const isActive = activeTab === tab.id;
                    
                    return (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex-1 min-w-0 px-3 sm:px-4 py-2 rounded-full text-sm font-medium transition-all flex items-center justify-center gap-1.5 sm:gap-2 ${
                          isActive
                            ? "bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm"
                            : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                        }`}
                      >
                        <Icon className="w-4 h-4 flex-shrink-0" />
                        <span className="hidden min-[400px]:inline truncate">{tab.label}</span>
                        <span className="min-[400px]:hidden">{tab.label.split(' ')[0]}</span>
                      </button>
                    );
                  })}
                </div>

                {/* Tab Content */}
                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeTab}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ duration: 0.2 }}
                  >
                    {activeTab === 'account' && <AccountTab isPremium={isPremiumTier} />}
                    {activeTab === 'referral' && <ReferralTab />}
                    {activeTab === 'subscription' && <SubscriptionTab />}
                    {activeTab === 'organisation' && <OrganisationBrandingTab />}
                  </motion.div>
                </AnimatePresence>
              </ContentCard>
            </div>
          </div>
        </div>
      </PageContainer>
    </PageLayout>
  );
}
