"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Check, Star, ArrowRight, Loader2 } from "lucide-react";

export default function UpgradePage() {
  const [loading, setLoading] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<"monthly" | "annual">("monthly");
  const [userStatus, setUserStatus] = useState<{
    subscriptionStatus: string;
    freeTrialEndsAt: string | null;
  } | null>(null);

  useEffect(() => {
    // Check if user is logged in
    const token = localStorage.getItem("authToken");
    if (!token) {
      window.location.href = "/sign-in";
      return;
    }

    // Fetch user status
    fetch("/api/auth/me", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.subscriptionStatus) {
          setUserStatus({
            subscriptionStatus: data.subscriptionStatus,
            freeTrialEndsAt: data.freeTrialEndsAt,
          });
        }
      })
      .catch(() => {
        // If not authenticated, redirect to sign in
        window.location.href = "/sign-in";
      });
  }, []);

  const handleUpgrade = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("authToken");
      const response = await fetch("/api/auth/upgrade", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          plan: selectedPlan,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Upgrade failed");
      }

      // Redirect to payment or success page
      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
      } else {
        // Success - refresh status
        setUserStatus({
          subscriptionStatus: "ACTIVE",
          freeTrialEndsAt: null,
        });
      }
    } catch (err: any) {
      alert(err.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const isTrialActive =
    userStatus?.subscriptionStatus === "FREE_TRIAL" &&
    userStatus.freeTrialEndsAt &&
    new Date(userStatus.freeTrialEndsAt) > new Date();

  const trialDaysRemaining = userStatus?.freeTrialEndsAt
    ? Math.ceil(
        (new Date(userStatus.freeTrialEndsAt).getTime() - Date.now()) /
          (1000 * 60 * 60 * 24)
      )
    : 0;

  return (
    <div className="max-w-6xl mx-auto px-4 py-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-12"
      >
        <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">
          Upgrade to Premium
        </h1>
        <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
          Unlock unlimited access to all quizzes, premium features, and exclusive content
        </p>
      </motion.div>

      {isTrialActive && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-2xl mx-auto mb-8 p-6 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-2xl"
        >
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
              <Star className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                Free Trial Active
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {trialDaysRemaining > 0
                  ? `${trialDaysRemaining} day${trialDaysRemaining !== 1 ? "s" : ""} remaining`
                  : "Your trial ends soon"}
              </p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Plan Selector */}
      <div className="max-w-2xl mx-auto mb-8">
        <div className="flex gap-2 p-1 bg-gray-100 dark:bg-gray-700 rounded-xl">
          <button
            onClick={() => setSelectedPlan("monthly")}
            className={`flex-1 px-6 py-3 rounded-lg font-medium transition-all ${
              selectedPlan === "monthly"
                ? "bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm"
                : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
            }`}
          >
            Monthly
          </button>
          <button
            onClick={() => setSelectedPlan("annual")}
            className={`flex-1 px-6 py-3 rounded-lg font-medium transition-all ${
              selectedPlan === "annual"
                ? "bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm"
                : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
            }`}
          >
            Annual
            <span className="ml-2 text-xs bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 px-2 py-0.5 rounded-full">
              Save 20%
            </span>
          </button>
        </div>
      </div>

      {/* Pricing Cards */}
      <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto mb-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white dark:bg-gray-800 rounded-2xl border-2 border-gray-200 dark:border-gray-700 p-8"
        >
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Premium Monthly
          </h3>
          <div className="mb-6">
            <span className="text-4xl font-bold text-gray-900 dark:text-white">$9</span>
            <span className="text-gray-600 dark:text-gray-400">/month</span>
          </div>
          <ul className="space-y-3 mb-8">
            {[
              "Unlimited quiz access",
              "All premium quizzes",
              "Early access to new content",
              "Ad-free experience",
              "Priority support",
            ].map((feature) => (
              <li key={feature} className="flex items-center gap-3">
                <Check className="w-5 h-5 text-green-500 flex-shrink-0" />
                <span className="text-gray-700 dark:text-gray-300">{feature}</span>
              </li>
            ))}
          </ul>
          {selectedPlan === "monthly" && (
            <motion.button
              onClick={handleUpgrade}
              disabled={loading}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  Upgrade Now
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </motion.button>
          )}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl border-2 border-blue-500 p-8 relative overflow-hidden"
        >
          <div className="absolute top-4 right-4">
            <span className="bg-white/20 text-white text-xs font-semibold px-3 py-1 rounded-full">
              BEST VALUE
            </span>
          </div>
          <h3 className="text-2xl font-bold text-white mb-2">Premium Annual</h3>
          <div className="mb-6">
            <span className="text-4xl font-bold text-white">$72</span>
            <span className="text-blue-100">/year</span>
            <div className="text-sm text-blue-100 mt-1">
              Save $36 compared to monthly
            </div>
          </div>
          <ul className="space-y-3 mb-8">
            {[
              "Everything in Monthly",
              "2 months free",
              "Exclusive annual content",
              "Priority feature requests",
              "Annual progress reports",
            ].map((feature) => (
              <li key={feature} className="flex items-center gap-3">
                <Check className="w-5 h-5 text-white flex-shrink-0" />
                <span className="text-white">{feature}</span>
              </li>
            ))}
          </ul>
          {selectedPlan === "annual" && (
            <motion.button
              onClick={handleUpgrade}
              disabled={loading}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full bg-white hover:bg-gray-100 text-blue-600 font-semibold py-3 px-6 rounded-xl transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  Upgrade Now
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </motion.button>
          )}
        </motion.div>
      </div>

      {/* Features Section */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="max-w-4xl mx-auto bg-gray-50 dark:bg-gray-900/50 rounded-2xl p-8"
      >
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 text-center">
          What you get with Premium
        </h2>
        <div className="grid md:grid-cols-2 gap-6">
          {[
            {
              title: "Unlimited Access",
              description: "Play as many quizzes as you want, whenever you want",
            },
            {
              title: "Premium Content",
              description: "Access exclusive quizzes and premium-only rounds",
            },
            {
              title: "Early Access",
              description: "Get new quizzes before they're released publicly",
            },
            {
              title: "Ad-Free Experience",
              description: "Enjoy quizzes without any interruptions",
            },
            {
              title: "Progress Tracking",
              description: "Track your scores and improvement over time",
            },
            {
              title: "Priority Support",
              description: "Get help faster with priority customer support",
            },
          ].map((feature, index) => (
            <div key={index} className="flex gap-4">
              <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
                <Check className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                  {feature.title}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {feature.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}

