'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { motion, AnimatePresence } from 'framer-motion';
import { Copy, Check, Users, Sparkles, Gift, TrendingUp, Loader2, CheckCircle2, Clock, Mail, Calendar, Crown } from 'lucide-react';
import { useUserTier } from '@/hooks/useUserTier';

interface ReferredUser {
  email: string;
  name: string;
  tier: string;
  subscriptionStatus: string;
  signedUpAt: string;
}

interface Referral {
  id: string;
  referredUserId: string;
  status: 'PENDING' | 'REWARDED';
  rewardGrantedAt: string | null;
  createdAt: string;
  user: ReferredUser;
}

interface ReferralData {
  referralCode: string;
  freeMonthsGranted: number;
  maxFreeMonths: number;
  referralsMade: number;
  rewardedReferrals: number;
  referrals: Referral[];
}

export function ReferralTab() {
  const { data: session, status } = useSession();
  const { tier } = useUserTier();
  const [referralData, setReferralData] = useState<ReferralData | null>(null);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);

  // Fetch referral data
  const fetchReferralData = async () => {
    try {
      if (!session?.user?.id) {
        setLoading(false);
        return;
      }

      const response = await fetch('/api/user/referral', {
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        setReferralData(data);
      }
    } catch (error) {
      console.error('Failed to fetch referral data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (status === 'authenticated' && session?.user?.id) {
      fetchReferralData();
    } else if (status === 'unauthenticated') {
      setLoading(false);
    }
  }, [status, session]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
      </div>
    );
  }

  if (!referralData) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600 dark:text-gray-400">
          Unable to load referral data. Please try again later.
        </p>
      </div>
    );
  }

  const { referralCode, freeMonthsGranted, maxFreeMonths, referralsMade, rewardedReferrals, referrals } = referralData;
  const progress = Math.min(freeMonthsGranted, maxFreeMonths);
  const progressPercentage = (progress / maxFreeMonths) * 100;
  const referralLink = referralCode
    ? `${typeof window !== 'undefined' ? window.location.origin : ''}/sign-up?ref=${referralCode}`
    : null;

  const handleCopy = async () => {
    if (!referralLink) return;
    try {
      await navigator.clipboard.writeText(referralLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-AU', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getStatusBadge = (referral: Referral) => {
    const isPremium = referral.user.tier === 'premium' || 
                     referral.user.subscriptionStatus === 'ACTIVE' || 
                     referral.user.subscriptionStatus === 'TRIALING';

    if (referral.status === 'REWARDED') {
      return {
        label: 'Rewarded',
        icon: CheckCircle2,
        color: 'bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400',
        borderColor: 'border-green-200 dark:border-green-800',
      };
    }

    if (isPremium) {
      return {
        label: 'Upgraded - Reward Pending',
        icon: Crown,
        color: 'bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400',
        borderColor: 'border-blue-200 dark:border-blue-800',
      };
    }

    return {
      label: 'Signed Up',
      icon: Clock,
      color: 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-400',
      borderColor: 'border-gray-200 dark:border-gray-700',
    };
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start gap-3">
        <div className="w-12 h-12 rounded-full bg-[#3B82F6]/10 dark:bg-[#3B82F6]/20 flex items-center justify-center flex-shrink-0">
          <Gift className="w-6 h-6 text-[#3B82F6] dark:text-blue-400" />
        </div>
        <div className="flex-1">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
            Refer & Earn Free Months
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
            Share your referral link with friends. When they sign up and upgrade to Premium, 
            <strong className="text-gray-900 dark:text-white"> both of you get 1 month free</strong>. 
            You can earn up to {maxFreeMonths} free months total.
          </p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-3 gap-4">
        <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2 mb-1">
            <Users className="w-4 h-4 text-gray-500 dark:text-gray-400" />
            <span className="text-xs text-gray-500 dark:text-gray-400">Total Referrals</span>
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{referralsMade}</p>
        </div>
        <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2 mb-1">
            <Crown className="w-4 h-4 text-blue-500 dark:text-blue-400" />
            <span className="text-xs text-gray-500 dark:text-gray-400">Upgraded</span>
          </div>
          <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
            {referrals.filter(r => r.user.tier === 'premium' || r.user.subscriptionStatus === 'ACTIVE' || r.user.subscriptionStatus === 'TRIALING').length}
          </p>
        </div>
        <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2 mb-1">
            <CheckCircle2 className="w-4 h-4 text-green-500 dark:text-green-400" />
            <span className="text-xs text-gray-500 dark:text-gray-400">Rewarded</span>
          </div>
          <p className="text-2xl font-bold text-green-600 dark:text-green-400">{rewardedReferrals}</p>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            {progress} of {maxFreeMonths} free months earned
          </span>
          {progress >= maxFreeMonths && (
            <span className="text-sm font-bold text-green-600 dark:text-green-400">
              Maximum reached!
            </span>
          )}
        </div>
        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${progressPercentage}%` }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            className={`h-full rounded-full ${
              progress >= maxFreeMonths
                ? 'bg-gradient-to-r from-green-500 to-emerald-500'
                : 'bg-[#3B82F6]'
            }`}
          />
        </div>
        <p className="text-xs text-gray-500 dark:text-gray-400">
          Free months are granted when your referred users upgrade to Premium
        </p>
      </div>

      {/* Referral Link */}
      {referralLink && (
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Your referral link
          </label>
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
            Share this link with friends. When they sign up and upgrade to Premium, you both get 1 month free!
          </p>
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={referralLink}
              readOnly
              className="flex-1 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-full bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <motion.button
              onClick={handleCopy}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-6 py-3 bg-[#3B82F6] hover:bg-[#2563EB] text-white rounded-full transition-all flex items-center gap-2 font-medium"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  Copy
                </>
              )}
            </motion.button>
          </div>
        </div>
      )}

      {/* Referrals List */}
      {referrals && referrals.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <Users className="w-4 h-4" />
            Your Referrals ({referrals.length})
          </h4>
          <div className="space-y-2">
            <AnimatePresence>
              {referrals.map((referral, index) => {
                const statusBadge = getStatusBadge(referral);
                const StatusIcon = statusBadge.icon;
                const isPremium = referral.user.tier === 'premium' || 
                                 referral.user.subscriptionStatus === 'ACTIVE' || 
                                 referral.user.subscriptionStatus === 'TRIALING';

                return (
                  <motion.div
                    key={referral.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ delay: index * 0.05 }}
                    className={`p-4 rounded-xl border ${statusBadge.borderColor} bg-white dark:bg-gray-800/50`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-gray-900 dark:text-white truncate">
                              {referral.user.name}
                            </p>
                            <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                              <Mail className="w-3 h-3" />
                              <span className="truncate">{referral.user.email}</span>
                            </div>
                          </div>
                          {isPremium && (
                            <Crown className="w-4 h-4 text-blue-500 dark:text-blue-400 flex-shrink-0" />
                          )}
                        </div>
                        <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                          <div className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            <span>Signed up {formatDate(referral.user.signedUpAt)}</span>
                          </div>
                          {referral.rewardGrantedAt && (
                            <div className="flex items-center gap-1 text-green-600 dark:text-green-400">
                              <Gift className="w-3 h-3" />
                              <span>Rewarded {formatDate(referral.rewardGrantedAt)}</span>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex-shrink-0">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium ${statusBadge.color}`}>
                          <StatusIcon className="w-3.5 h-3.5" />
                          {statusBadge.label}
                        </span>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        </div>
      )}

      {referrals && referrals.length === 0 && (
        <div className="text-center py-8 px-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-200 dark:border-gray-700">
          <Users className="w-8 h-8 text-gray-400 mx-auto mb-2" />
          <p className="text-sm text-gray-600 dark:text-gray-400">
            No referrals yet. Share your link to get started!
          </p>
        </div>
      )}

      {/* Success Message */}
      {progress >= maxFreeMonths && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl flex items-center gap-3"
        >
          <Sparkles className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0" />
          <div>
            <p className="text-sm font-semibold text-green-900 dark:text-green-100">
              Maximum Free Months Reached!
            </p>
            <p className="text-xs text-green-700 dark:text-green-300">
              You've earned the maximum {maxFreeMonths} free months. Keep sharing to help others!
            </p>
          </div>
        </motion.div>
      )}

      {/* Info Box */}
      <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl">
        <p className="text-sm text-blue-900 dark:text-blue-100 mb-2">
          <strong>How it works:</strong>
        </p>
        <ul className="space-y-2 text-xs text-blue-800 dark:text-blue-200">
          <li className="flex items-start gap-2">
            <span className="text-blue-600 dark:text-blue-400 mt-0.5">•</span>
            <span>Share your referral link with friends, colleagues, or anyone interested in The School Quiz</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-blue-600 dark:text-blue-400 mt-0.5">•</span>
            <span>When they sign up using your code and upgrade to Premium, <strong>both of you get 1 month free</strong></span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-blue-600 dark:text-blue-400 mt-0.5">•</span>
            <span>You can earn up to {maxFreeMonths} free months total (one per successful referral)</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-blue-600 dark:text-blue-400 mt-0.5">•</span>
            <span>Free months are automatically applied to your subscription when your referral upgrades to Premium</span>
          </li>
        </ul>
      </div>
    </div>
  );
}
