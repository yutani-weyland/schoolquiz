'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { motion } from 'framer-motion';
import { Copy, Check, Loader2, Send } from 'lucide-react';
import { useUserTier } from '@/hooks/useUserTier';

interface ReferralData {
  referralCode: string;
  freeMonthsGranted: number;
  maxFreeMonths: number;
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

  const { referralCode, freeMonthsGranted, maxFreeMonths } = referralData;
  const progress = Math.min(freeMonthsGranted, maxFreeMonths);
  const progressPercentage = (progress / maxFreeMonths) * 100;
  const referralLink = referralCode
    ? `${typeof window !== 'undefined' ? window.location.origin : ''}/sign-up?ref=${referralCode}`
    : null;

  const handleCopy = async () => {
    if (!referralCode) return;
    try {
      await navigator.clipboard.writeText(referralCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  const handleEmail = () => {
    if (!referralCode || !referralLink) return;
    const subject = encodeURIComponent('Join The School Quiz with my referral code!');
    const body = encodeURIComponent(
      `Hi!\n\nI've been using The School Quiz and thought you might like it too!\n\n` +
      `Use my referral code: ${referralCode}\n\n` +
      `Or sign up directly here: ${referralLink}\n\n` +
      `When you upgrade to Premium, we both get 1 month free!\n\n` +
      `Thanks!`
    );
    window.location.href = `mailto:?subject=${subject}&body=${body}`;
  };


  return (
    <div className="space-y-6">
      {/* Header - Centered */}
      <div className="text-center">
        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
          Refer & Earn Free Months
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed max-w-2xl mx-auto">
          Share your referral code with friends. When they sign up and upgrade to Premium, 
          <strong className="text-gray-900 dark:text-white"> both of you get 1 month free</strong>. 
          You can earn up to {maxFreeMonths} free months total.
        </p>
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

      {/* Referral Code */}
      {referralCode && (
        <div className="space-y-4">
          <div className="text-center">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Your referral code
            </label>
            <div className="flex items-center justify-center gap-2 max-w-md mx-auto">
              <input
                type="text"
                value={referralCode}
                readOnly
                className="flex-1 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-full bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-lg font-mono font-semibold text-center focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <motion.button
                onClick={handleCopy}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-4 py-3 bg-[#3B82F6] hover:bg-[#2563EB] text-white rounded-full transition-all flex items-center gap-2 font-medium"
                title="Copy code"
              >
                {copied ? (
                  <Check className="w-4 h-4" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </motion.button>
              <motion.button
                onClick={handleEmail}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-4 py-3 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-full transition-all flex items-center gap-2 font-medium"
                title="Email code"
              >
                <Send className="w-4 h-4" />
              </motion.button>
            </div>
            {copied && (
              <p className="text-xs text-green-600 dark:text-green-400 mt-2">Code copied to clipboard!</p>
            )}
          </div>
        </div>
      )}

    </div>
  );
}
