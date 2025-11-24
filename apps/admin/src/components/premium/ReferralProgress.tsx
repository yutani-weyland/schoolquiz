'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Users, Copy, Check, Gift, Sparkles } from 'lucide-react';
import { useUserTier } from '@/hooks/useUserTier';

interface ReferralProgressProps {
  userId?: string;
  organisationDomain?: string;
}

export function ReferralProgress({ userId, organisationDomain }: ReferralProgressProps) {
  const { tier, isBasic } = useUserTier();
  const [referralCount, setReferralCount] = useState(0);
  const [referralCode, setReferralCode] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isBasic || !userId) return;

    // Fetch referral data
    const fetchReferralData = async () => {
      try {
        const token = localStorage.getItem('authToken');
        if (!token) return;

        const response = await fetch('/api/user/referral', {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (response.ok) {
          const data = await response.json();
          setReferralCount(data.referralCount || 0);
          setReferralCode(data.referralCode);
        }
      } catch (error) {
        console.error('Failed to fetch referral data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchReferralData();
  }, [userId, isBasic]);

  // Only show for basic users
  if (!isBasic || loading) return null;

  const progress = Math.min(referralCount, 3);
  const progressPercentage = (progress / 3) * 100;
  const referralLink = referralCode
    ? `${window.location.origin}/sign-up?ref=${referralCode}`
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

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 border border-purple-200 dark:border-purple-800 rounded-2xl p-6 shadow-lg"
    >
      <div className="flex items-start gap-4 mb-4">
        <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center">
          <Gift className="w-6 h-6 text-white" />
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">
            Refer & Earn Premium
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Refer friends and earn 1 month free Premium when they upgrade. Earn up to 3 free months total.
          </p>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Progress: {progress} / 3 free months earned
          </span>
          <span className="text-sm font-bold text-purple-600 dark:text-purple-400">
            {progress === 3 ? 'Maximum reached!' : `${3 - progress} more to go`}
          </span>
        </div>
        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${progressPercentage}%` }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            className={`h-full rounded-full ${
              progress === 3
                ? 'bg-gradient-to-r from-green-500 to-emerald-500'
                : 'bg-gradient-to-r from-purple-500 to-blue-500'
            }`}
          />
        </div>
      </div>

      {/* Referral Link */}
      {referralLink && (
        <div className="space-y-2">
          <label className="text-xs font-medium text-gray-700 dark:text-gray-300">
            Your referral link:
          </label>
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={referralLink}
              readOnly
              className="flex-1 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg text-sm font-mono text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
            <motion.button
              onClick={handleCopy}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors flex items-center gap-2"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4" />
                  <span className="text-sm font-medium">Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  <span className="text-sm font-medium">Copy</span>
                </>
              )}
            </motion.button>
          </div>
        </div>
      )}

      {/* Success Message */}
      {progress === 3 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="mt-4 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg flex items-center gap-3"
        >
          <Sparkles className="w-5 h-5 text-green-600 dark:text-green-400" />
          <div>
            <p className="text-sm font-semibold text-green-900 dark:text-green-100">
              Congratulations!
            </p>
            <p className="text-xs text-green-700 dark:text-green-300">
              You've earned the maximum 3 free months! Free months are applied when your referrals upgrade to Premium.
            </p>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}

