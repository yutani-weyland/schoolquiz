'use client';

import { useState, useEffect } from 'react';
import { CreditCard, Calendar, AlertCircle, CheckCircle, XCircle, ExternalLink, Loader2 } from 'lucide-react';

interface SubscriptionData {
  plan: string;
  status: string;
  billingPeriod: 'monthly' | 'annual' | null;
  currentPeriodStart?: string;
  currentPeriodEnd?: string;
  subscriptionEndsAt?: string;
  nextRenewalDate?: string;
  isCancelled: boolean;
  cancelledAt?: string;
}

export function SubscriptionBillingTab() {
  const [subscription, setSubscription] = useState<SubscriptionData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCancelling, setIsCancelling] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchSubscription();
  }, []);

  const fetchSubscription = async () => {
    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        setError('Not authenticated');
        setIsLoading(false);
        return;
      }

      const response = await fetch('/api/user/subscription', {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setSubscription(data);
      } else {
        setError('Failed to load subscription information');
      }
    } catch (err) {
      setError('Failed to load subscription information');
    } finally {
      setIsLoading(false);
    }
  };

  const handleManageBilling = async () => {
    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        setError('Not authenticated');
        return;
      }

      const response = await fetch('/api/user/billing-portal', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.url) {
          window.location.href = data.url;
        }
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to open billing portal');
      }
    } catch (err) {
      setError('Failed to open billing portal');
    }
  };

  const handleCancelSubscription = async () => {
    setIsCancelling(true);
    setError(null);

    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        throw new Error('Not authenticated');
      }

      const response = await fetch('/api/user/subscription/cancel', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to cancel subscription');
      }

      // Refresh subscription data
      await fetchSubscription();
      setShowCancelConfirm(false);
    } catch (err: any) {
      setError(err.message || 'Failed to cancel subscription');
    } finally {
      setIsCancelling(false);
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-AU', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      ACTIVE: { color: 'bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400', icon: CheckCircle, label: 'Active' },
      FREE_TRIAL: { color: 'bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400', icon: Calendar, label: 'Free Trial' },
      TRIALING: { color: 'bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400', icon: Calendar, label: 'Trialing' },
      PAST_DUE: { color: 'bg-yellow-100 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400', icon: AlertCircle, label: 'Past Due' },
      CANCELLED: { color: 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-400', icon: XCircle, label: 'Cancelled' },
      EXPIRED: { color: 'bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400', icon: XCircle, label: 'Expired' },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.EXPIRED;
    const Icon = config.icon;

    return (
      <span className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold ${config.color}`}>
        <Icon className="w-4 h-4" />
        {config.label}
      </span>
    );
  };

  const getPlanDisplayName = (plan?: string) => {
    if (!plan) return 'No plan';
    if (plan.includes('MONTHLY')) return 'Premium Monthly';
    if (plan.includes('ANNUAL')) return 'Premium Annual';
    if (plan.includes('ORG')) {
      if (plan.includes('MONTHLY')) return 'Organisation Monthly';
      if (plan.includes('ANNUAL')) return 'Organisation Annual';
      return 'Organisation Plan';
    }
    return plan;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    );
  }

  if (!subscription) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-gray-900 dark:text-white mb-4">
            Subscription & Billing
          </h1>
          <p className="text-lg md:text-xl text-gray-600 dark:text-gray-400 max-w-2xl">
            Manage your subscription and billing information
          </p>
        </div>
        <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-200/50 dark:border-gray-800/50 p-8 text-center shadow-sm">
          <p className="text-gray-600 dark:text-gray-400 mb-4">{error || 'No subscription found'}</p>
          <a
            href="/upgrade"
            className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-full font-medium hover:bg-blue-700 transition-colors"
          >
            Upgrade to Premium
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Subscription & Billing
          </h1>
          <p className="text-base md:text-lg text-gray-600 dark:text-gray-400 max-w-2xl">
            Manage your subscription and billing information
          </p>
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4 text-red-700 dark:text-red-400">
          {error}
        </div>
      )}

      {/* Plan Details Card */}
      <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-200/50 dark:border-gray-800/50 p-8 space-y-6 shadow-sm">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
            <CreditCard className="w-6 h-6" />
            Plan Details
          </h2>
          {getStatusBadge(subscription.status)}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Plan
            </label>
            <div className="text-xl font-semibold text-gray-900 dark:text-white">
              {getPlanDisplayName(subscription.plan)}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Billing Period
            </label>
            <div className="text-xl font-semibold text-gray-900 dark:text-white">
              {subscription.billingPeriod === 'monthly' ? 'Monthly' : subscription.billingPeriod === 'annual' ? 'Annual' : 'N/A'}
            </div>
          </div>

          {subscription.currentPeriodStart && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Current Period Start
              </label>
              <div className="text-lg text-gray-900 dark:text-white">
                {formatDate(subscription.currentPeriodStart)}
              </div>
            </div>
          )}

          {(subscription.currentPeriodEnd || subscription.nextRenewalDate) && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {subscription.isCancelled ? 'Access Until' : 'Next Renewal'}
              </label>
              <div className="text-lg text-gray-900 dark:text-white">
                {formatDate(subscription.currentPeriodEnd || subscription.nextRenewalDate)}
              </div>
            </div>
          )}
        </div>

        {subscription.isCancelled && subscription.currentPeriodEnd && (
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-xl p-4">
            <p className="text-sm text-yellow-800 dark:text-yellow-300">
              Your subscription has been cancelled. You'll retain access until{' '}
              <strong>{formatDate(subscription.currentPeriodEnd)}</strong>.
            </p>
          </div>
        )}
      </div>

      {/* Billing Actions Card */}
      <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-200/50 dark:border-gray-800/50 p-8 space-y-4 shadow-sm">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Billing</h2>
        
        <button
          onClick={handleManageBilling}
          className="w-full md:w-auto px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-full font-medium transition-colors flex items-center justify-center gap-2"
        >
          <ExternalLink className="w-4 h-4" />
          Manage Billing Portal
        </button>

        <p className="text-sm text-gray-600 dark:text-gray-400">
          Update your payment method, view invoices, and manage billing settings through our secure billing portal.
        </p>
      </div>

      {/* Cancel Subscription */}
      {!subscription.isCancelled && subscription.status === 'ACTIVE' && (
        <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-200/50 dark:border-gray-800/50 p-8 space-y-4 shadow-sm">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Cancel Subscription</h2>
          
          {!showCancelConfirm ? (
            <>
              <p className="text-gray-600 dark:text-gray-400">
                If you cancel your subscription, you'll retain access until{' '}
                {subscription.currentPeriodEnd ? formatDate(subscription.currentPeriodEnd) : 'the end of your billing period'}.
                After that, you'll lose access to premium features.
              </p>
              <button
                onClick={() => setShowCancelConfirm(true)}
                className="px-6 py-3 bg-red-600 text-white rounded-full font-medium hover:bg-red-700 transition-colors"
              >
                Cancel Subscription
              </button>
            </>
          ) : (
            <div className="space-y-4">
              <p className="text-gray-900 dark:text-white font-medium">
                Are you sure you want to cancel your subscription?
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                You'll retain access until{' '}
                {subscription.currentPeriodEnd ? formatDate(subscription.currentPeriodEnd) : 'the end of your billing period'}.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={handleCancelSubscription}
                  disabled={isCancelling}
                  className="px-6 py-3 bg-red-600 text-white rounded-full font-medium hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  {isCancelling ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Cancelling...
                    </>
                  ) : (
                    'Yes, Cancel Subscription'
                  )}
                </button>
                <button
                  onClick={() => setShowCancelConfirm(false)}
                  disabled={isCancelling}
                  className="px-6 py-3 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-full font-medium hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors disabled:opacity-50"
                >
                  Keep Subscription
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Billing History Placeholder */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-8">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Billing History</h2>
        <p className="text-gray-600 dark:text-gray-400 text-sm">
          {/* TODO: Implement billing history */}
          Billing history will be available here once integrated with payment processor.
        </p>
      </div>
    </div>
  );
}

