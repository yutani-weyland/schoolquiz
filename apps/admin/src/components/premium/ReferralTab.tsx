'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Copy, Check, Users, Sparkles } from 'lucide-react';
import { useUserTier } from '@/hooks/useUserTier';

export function ReferralTab() {
  const { tier } = useUserTier();
  const [referralCount, setReferralCount] = useState(0);
  const [referralCode, setReferralCode] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | undefined>();

  useEffect(() => {
    if (tier === 'premium') return;

    // Get userId from localStorage
    const storedUserId = localStorage.getItem('userId');
    if (storedUserId) {
      setUserId(storedUserId);
    }

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
  }, [tier]);

  // Only show for free users
  if (tier === 'premium' || loading) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600 dark:text-gray-400">
          {tier === 'premium' 
            ? 'Refer & Earn is only available for free users.'
            : 'Loading...'}
        </p>
      </div>
    );
  }

  const progress = Math.min(referralCount, 3);
  const progressPercentage = (progress / 3) * 100;
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start gap-3">
        <div className="w-12 h-12 rounded-full bg-[#3B82F6]/10 dark:bg-[#3B82F6]/20 flex items-center justify-center flex-shrink-0">
          <Users className="w-6 h-6 text-[#3B82F6] dark:text-blue-400" />
        </div>
        <div className="flex-1">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
            Invite Your Colleagues
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
            Share your referral link with 3 teachers, parents, or friends. When they sign up using your link, you'll unlock 1 month of Premium features at no cost.
          </p>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            {progress} of 3 people signed up
          </span>
          {progress === 3 && (
            <span className="text-sm font-bold text-green-600 dark:text-green-400">
              All set!
            </span>
          )}
        </div>
        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${progressPercentage}%` }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            className={`h-full rounded-full ${
              progress === 3
                ? 'bg-gradient-to-r from-green-500 to-emerald-500'
                : 'bg-[#3B82F6]'
            }`}
          />
        </div>
      </div>

      {/* Referral Link */}
      {referralLink && (
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Your referral link
          </label>
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
            Share this link with anyone who might be interested
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

      {/* Success Message */}
      {progress === 3 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-full flex items-center gap-3"
        >
          <Sparkles className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0" />
          <div>
            <p className="text-sm font-semibold text-green-900 dark:text-green-100">
              Congratulations!
            </p>
            <p className="text-xs text-green-700 dark:text-green-300">
              You've unlocked 1 month of Premium! Your account will be upgraded automatically.
            </p>
          </div>
        </motion.div>
      )}
    </div>
  );
}

