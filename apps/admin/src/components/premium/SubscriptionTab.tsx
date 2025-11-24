'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { CreditCard, Calendar, CheckCircle, XCircle, ExternalLink, Loader2, AlertCircle } from 'lucide-react';

export function SubscriptionTab() {
  const [subscription, setSubscription] = useState<any>(null);
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
      const userId = localStorage.getItem('userId');
      if (!token) {
        setError('Not authenticated');
        setIsLoading(false);
        return;
      }

      const headers: HeadersInit = { Authorization: `Bearer ${token}` };
      if (userId) {
        headers['X-User-Id'] = userId;
      }

      const response = await fetch('/api/user/subscription', {
        headers,
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
      const userId = localStorage.getItem('userId');
      if (!token) {
        setError('Not authenticated');
        return;
      }

      const headers: HeadersInit = {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      };
      if (userId) {
        headers['X-User-Id'] = userId;
      }

      const response = await fetch('/api/user/billing-portal', {
        method: 'POST',
        headers,
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

      const userId = localStorage.getItem('userId');
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      };
      if (userId) {
        headers['X-User-Id'] = userId;
      }

      const response = await fetch('/api/user/subscription/cancel', {
        method: 'POST',
        headers,
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to cancel subscription');
      }

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
    const statusConfig: Record<string, { color: string; icon: any; label: string }> = {
      ACTIVE: { color: 'bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400', icon: CheckCircle, label: 'Active' },
      FREE_TRIAL: { color: 'bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400', icon: Calendar, label: 'Free Trial' },
      TRIALING: { color: 'bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400', icon: Calendar, label: 'Trialing' },
      PAST_DUE: { color: 'bg-yellow-100 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400', icon: AlertCircle, label: 'Past Due' },
      CANCELLED: { color: 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-400', icon: XCircle, label: 'Cancelled' },
      EXPIRED: { color: 'bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400', icon: XCircle, label: 'Expired' },
    };

    const config = statusConfig[status] || statusConfig.EXPIRED;
    const Icon = config.icon;

    return (
      <span className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold ${config.color}`}>
        <Icon className="w-4 h-4" />
        {config.label}
      </span>
    );
  };

  const getPlanDisplayName = (plan?: string) => {
    if (!plan) return 'Free';
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
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
      </div>
    );
  }

  if (!subscription) {
    return (
      <div className="text-center space-y-4 py-12">
        <div className="space-y-2">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">
            No Active Subscription
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            Consider signing up for access to premium features
          </p>
        </div>
        <motion.a
          href="/upgrade"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="inline-flex items-center gap-2 px-6 py-3 bg-[#3B82F6] hover:bg-[#2563EB] text-white rounded-full font-medium transition-all"
        >
          Upgrade to Premium
        </motion.a>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-full text-red-600 dark:text-red-400 text-sm"
        >
          {error}
        </motion.div>
      )}

      {/* Plan Status */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">
            {getPlanDisplayName(subscription.plan)}
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {subscription.billingPeriod === 'monthly' ? 'Monthly billing' : subscription.billingPeriod === 'annual' ? 'Annual billing' : 'No active plan'}
          </p>
        </div>
        {getStatusBadge(subscription.status)}
      </div>

      {/* Dates */}
      {(subscription.currentPeriodEnd || subscription.nextRenewalDate) && (
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            {subscription.isCancelled ? 'Access Until' : 'Next Renewal'}
          </label>
          <div className="flex items-center gap-2 text-gray-900 dark:text-white">
            <Calendar className="w-4 h-4 text-gray-400" />
            <span>{formatDate(subscription.currentPeriodEnd || subscription.nextRenewalDate)}</span>
          </div>
        </div>
      )}

      {subscription.isCancelled && subscription.currentPeriodEnd && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-full"
        >
          <p className="text-sm text-yellow-800 dark:text-yellow-300">
            Your subscription has been cancelled. You'll retain access until{' '}
            <strong>{formatDate(subscription.currentPeriodEnd)}</strong>.
          </p>
        </motion.div>
      )}

      {/* Actions */}
      <div className="space-y-3 pt-4 border-t border-gray-200 dark:border-gray-800">
        <motion.button
          onClick={handleManageBilling}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="w-full px-6 py-3 bg-[#3B82F6] hover:bg-[#2563EB] text-white rounded-full font-medium transition-all flex items-center justify-center gap-2"
        >
          <ExternalLink className="w-4 h-4" />
          Manage Billing Portal
        </motion.button>

        {!subscription.isCancelled && subscription.status === 'ACTIVE' && (
          <>
            {!showCancelConfirm ? (
              <motion.button
                onClick={() => setShowCancelConfirm(true)}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-full px-6 py-3 border border-red-300 dark:border-red-800 text-red-600 dark:text-red-400 rounded-full font-medium hover:bg-red-50 dark:hover:bg-red-900/20 transition-all"
              >
                Cancel Subscription
              </motion.button>
            ) : (
              <div className="space-y-3">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Are you sure? You'll retain access until{' '}
                  {subscription.currentPeriodEnd ? formatDate(subscription.currentPeriodEnd) : 'the end of your billing period'}.
                </p>
                <div className="flex gap-2">
                  <motion.button
                    onClick={handleCancelSubscription}
                    disabled={isCancelling}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="flex-1 px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-full font-medium transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {isCancelling ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Cancelling...
                      </>
                    ) : (
                      'Yes, Cancel'
                    )}
                  </motion.button>
                  <motion.button
                    onClick={() => setShowCancelConfirm(false)}
                    disabled={isCancelling}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="px-6 py-3 border border-gray-300 dark:border-gray-600 rounded-full text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition-all disabled:opacity-50"
                  >
                    Keep
                  </motion.button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

