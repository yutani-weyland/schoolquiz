"use client";

import React, { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, Star, ArrowRight, Loader2, Users, Building2, TrendingDown, Sparkles } from "lucide-react";

export default function UpgradePage() {
  const [loading, setLoading] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<"monthly" | "annual">("monthly");
  const [userStatus, setUserStatus] = useState<{
    subscriptionStatus: string;
    freeTrialEndsAt: string | null;
  } | null>(null);
  const [teacherCount, setTeacherCount] = useState(5);

  useEffect(() => {
    const token = localStorage.getItem("authToken");
    if (!token) {
      window.location.href = "/sign-in";
      return;
    }

    fetch("/api/auth/me", {
      headers: { Authorization: `Bearer ${token}` },
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
        body: JSON.stringify({ plan: selectedPlan }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Upgrade failed");

      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
      } else {
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
    ? Math.ceil((new Date(userStatus.freeTrialEndsAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : 0;

  // Calculate organization pricing
  const orgPricing = useMemo(() => {
    const basePrice = selectedPlan === "monthly" ? 9 : 6;
    let discountPercent = 0;
    if (teacherCount >= 50) discountPercent = 30;
    else if (teacherCount >= 10) discountPercent = 15;

    const totalBase = teacherCount * basePrice;
    const discountAmount = totalBase * (discountPercent / 100);
    const total = totalBase - discountAmount;
    const perTeacher = basePrice * (1 - discountPercent / 100);

    return { totalBase, discountAmount, total, perTeacher, discountPercent };
  }, [teacherCount, selectedPlan]);

  const discountTier = useMemo(() => {
    if (teacherCount >= 50) return { label: "District", discount: 30, min: 50, max: 100 };
    if (teacherCount >= 10) return { label: "School", discount: 15, min: 10, max: 49 };
    return { label: "Standard", discount: 0, min: 1, max: 9 };
  }, [teacherCount]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 via-white to-gray-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 lg:py-24">
        {/* Header */}
        <motion.header
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12 sm:mb-16 space-y-4"
        >
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 dark:text-white tracking-tight">
            Upgrade to Premium
          </h1>
          <p className="text-lg sm:text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Unlock unlimited access to all quizzes, premium features, and exclusive content
          </p>
        </motion.header>

        {/* Trial Banner */}
        <AnimatePresence>
          {isTrialActive && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="max-w-2xl mx-auto mb-8 sm:mb-12"
            >
              <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900 rounded-2xl p-6 sm:p-8 backdrop-blur-sm">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-12 h-12 bg-blue-100 dark:bg-blue-900/50 rounded-xl flex items-center justify-center">
                    <Star className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-1 text-lg">
                      Free Trial Active
                    </h3>
                    <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
                      {trialDaysRemaining > 0
                        ? `${trialDaysRemaining} day${trialDaysRemaining !== 1 ? "s" : ""} remaining`
                        : "Your trial ends soon"}
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Plan Selector */}
        <div className="max-w-2xl mx-auto mb-8 sm:mb-12">
          <div className="inline-flex gap-2 p-1.5 bg-gray-100 dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700">
            <button
              onClick={() => setSelectedPlan("monthly")}
              className={`relative px-6 sm:px-8 py-3 sm:py-3.5 rounded-xl font-semibold text-sm sm:text-base transition-all duration-200 ${
                selectedPlan === "monthly"
                  ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-md"
                  : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setSelectedPlan("annual")}
              className={`relative px-6 sm:px-8 py-3 sm:py-3.5 rounded-xl font-semibold text-sm sm:text-base transition-all duration-200 ${
                selectedPlan === "annual"
                  ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-md"
                  : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
              }`}
            >
              Annual
              <span className="ml-2 text-xs bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 px-2 py-0.5 rounded-full font-medium">
                Save 20%
              </span>
            </button>
          </div>
        </div>

        {/* Individual Pricing Cards */}
        <div className="grid sm:grid-cols-2 gap-6 lg:gap-8 max-w-5xl mx-auto mb-12 sm:mb-16">
          {/* Monthly Plan */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="group relative bg-white dark:bg-gray-900 rounded-3xl border-2 border-gray-200 dark:border-gray-800 p-6 sm:p-8 lg:p-10 hover:border-gray-300 dark:hover:border-gray-700 transition-all duration-300"
          >
            <div className="space-y-6">
              <div>
                <h3 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-2">
                  Premium Monthly
                </h3>
                <div className="flex items-baseline gap-2">
                  <span className="text-5xl sm:text-6xl font-bold text-gray-900 dark:text-white">$9</span>
                  <span className="text-lg text-gray-600 dark:text-gray-400">/month</span>
                </div>
              </div>

              <ul className="space-y-3">
                {[
                  "Unlimited quiz access",
                  "All premium quizzes",
                  "Early access to new content",
                  "Ad-free experience",
                  "Priority support",
                ].map((feature) => (
                  <li key={feature} className="flex items-start gap-3">
                    <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-700 dark:text-gray-300 text-sm sm:text-base">{feature}</span>
                  </li>
                ))}
              </ul>

              {selectedPlan === "monthly" && (
                <motion.button
                  onClick={handleUpgrade}
                  disabled={loading}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-semibold py-3.5 px-6 rounded-xl transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
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
            </div>
          </motion.div>

          {/* Annual Plan */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="group relative bg-gradient-to-br from-gray-900 to-gray-800 dark:from-gray-800 dark:to-gray-900 rounded-3xl border-2 border-gray-900 dark:border-gray-700 p-6 sm:p-8 lg:p-10 text-white"
          >
            <div className="absolute top-4 right-4 sm:top-6 sm:right-6">
              <span className="bg-white/20 backdrop-blur-sm text-white text-xs font-semibold px-3 py-1.5 rounded-full">
                BEST VALUE
              </span>
            </div>

            <div className="space-y-6">
              <div>
                <h3 className="text-2xl sm:text-3xl font-bold mb-2">Premium Annual</h3>
                <div className="flex items-baseline gap-2">
                  <span className="text-5xl sm:text-6xl font-bold">$72</span>
                  <span className="text-lg text-gray-300">/year</span>
                </div>
                <p className="text-sm text-gray-300 mt-2">Save $36 compared to monthly</p>
              </div>

              <ul className="space-y-3">
                {[
                  "Everything in Monthly",
                  "2 months free",
                  "Exclusive annual content",
                  "Priority feature requests",
                  "Annual progress reports",
                ].map((feature) => (
                  <li key={feature} className="flex items-start gap-3">
                    <Check className="w-5 h-5 text-white flex-shrink-0 mt-0.5" />
                    <span className="text-white/90 text-sm sm:text-base">{feature}</span>
                  </li>
                ))}
              </ul>

              {selectedPlan === "annual" && (
                <motion.button
                  onClick={handleUpgrade}
                  disabled={loading}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full bg-white text-gray-900 font-semibold py-3.5 px-6 rounded-xl transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl hover:bg-gray-50"
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
            </div>
          </motion.div>
        </div>

        {/* Organization Pricing Section */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="max-w-5xl mx-auto mb-12 sm:mb-16"
        >
          <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-200 dark:border-gray-800 p-6 sm:p-8 lg:p-10 shadow-lg">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-8">
              <div className="flex-shrink-0 w-14 h-14 bg-gray-100 dark:bg-gray-800 rounded-2xl flex items-center justify-center">
                <Building2 className="w-7 h-7 text-gray-700 dark:text-gray-300" />
              </div>
              <div className="flex-1">
                <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-2">
                  Organization & School Plans
                </h2>
                <p className="text-gray-600 dark:text-gray-400 text-sm sm:text-base">
                  Get Premium for your entire school or organization. The more licenses you add, the bigger the discount!
                </p>
              </div>
            </div>

            {/* Slider Section */}
            <div className="bg-gray-50 dark:bg-gray-800/50 rounded-2xl p-6 sm:p-8 mb-8 border border-gray-200 dark:border-gray-700">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
                <div className="flex-1">
                  <label className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white flex items-center gap-2 mb-2">
                    <Users className="w-5 h-5 sm:w-6 sm:h-5" />
                    Number of Licenses
                  </label>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Adjust the slider to see volume discounts
                  </p>
                </div>
                <div className="text-center sm:text-right">
                  <div className="text-4xl sm:text-5xl font-bold text-gray-900 dark:text-white">
                    {teacherCount}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    {teacherCount === 1 ? "license" : "licenses"}
                  </div>
                </div>
              </div>

              {/* Modern Slider */}
              <div className="relative mb-8">
                <input
                  type="range"
                  min="1"
                  max="100"
                  value={teacherCount}
                  onChange={(e) => setTeacherCount(parseInt(e.target.value))}
                  className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full appearance-none cursor-pointer accent-gray-900 dark:accent-white"
                  style={{
                    background: `linear-gradient(to right, rgb(17 24 39) 0%, rgb(17 24 39) ${((teacherCount - 1) / 99) * 100}%, rgb(229 231 235) ${((teacherCount - 1) / 99) * 100}%, rgb(229 231 235) 100%)`,
                  }}
                />
                <div className="flex justify-between mt-2 text-xs text-gray-500 dark:text-gray-400">
                  <span>1</span>
                  <span>25</span>
                  <span>50</span>
                  <span>75</span>
                  <span>100</span>
                </div>
              </div>

              {/* Discount Tiers */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {[
                  { min: 1, max: 9, discount: 0, label: "Standard", color: "gray" },
                  { min: 10, max: 49, discount: 15, label: "School", color: "blue" },
                  { min: 50, max: 100, discount: 30, label: "District", color: "purple" },
                ].map((tier) => {
                  const isActive = teacherCount >= tier.min && teacherCount <= tier.max;
                  return (
                    <motion.div
                      key={tier.label}
                      animate={{
                        scale: isActive ? 1.02 : 1,
                        borderColor: isActive
                          ? tier.color === "purple"
                            ? "rgb(168 85 247)"
                            : tier.color === "blue"
                            ? "rgb(59 130 246)"
                            : "rgb(107 114 128)"
                          : "rgb(229 231 235)",
                      }}
                      className={`p-4 sm:p-5 rounded-xl border-2 transition-all ${
                        isActive
                          ? tier.color === "purple"
                            ? "bg-purple-50 dark:bg-purple-950/30 border-purple-500"
                            : tier.color === "blue"
                            ? "bg-blue-50 dark:bg-blue-950/30 border-blue-500"
                            : "bg-gray-100 dark:bg-gray-800 border-gray-500"
                          : "bg-white dark:bg-gray-800/50 border-gray-200 dark:border-gray-700"
                      }`}
                    >
                      <div
                        className={`text-sm font-semibold mb-2 ${
                          isActive
                            ? tier.color === "purple"
                              ? "text-purple-700 dark:text-purple-300"
                              : tier.color === "blue"
                              ? "text-blue-700 dark:text-blue-300"
                              : "text-gray-700 dark:text-gray-300"
                            : "text-gray-600 dark:text-gray-400"
                        }`}
                      >
                        {tier.label}
                      </div>
                      <div
                        className={`text-3xl font-bold mb-1 ${
                          isActive
                            ? tier.color === "purple"
                              ? "text-purple-600 dark:text-purple-400"
                              : tier.color === "blue"
                              ? "text-blue-600 dark:text-blue-400"
                              : "text-gray-600 dark:text-gray-400"
                            : "text-gray-400 dark:text-gray-500"
                        }`}
                      >
                        {tier.discount}%
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-500">
                        {tier.min}-{tier.max} licenses
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>

            {/* Pricing Breakdown */}
            <div className="bg-gray-50 dark:bg-gray-800/50 rounded-2xl p-6 sm:p-8 border border-gray-200 dark:border-gray-700">
              <h3 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-6">
                Pricing Breakdown
              </h3>

              <div className="space-y-4 mb-6">
                <div className="flex items-center justify-between py-3 border-b border-gray-200 dark:border-gray-700">
                  <span className="text-gray-600 dark:text-gray-400">
                    {teacherCount} × ${selectedPlan === "monthly" ? "9" : "6"}/month
                  </span>
                  <span className="text-lg font-semibold text-gray-900 dark:text-white">
                    ${orgPricing.totalBase}
                  </span>
                </div>

                {orgPricing.discountPercent > 0 && (
                  <motion.div
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="flex items-center justify-between py-3 border-b border-gray-200 dark:border-gray-700"
                  >
                    <span className="text-green-600 dark:text-green-400 flex items-center gap-2 font-medium">
                      <TrendingDown className="w-4 h-4" />
                      Volume Discount ({orgPricing.discountPercent}%)
                    </span>
                    <span className="text-lg font-semibold text-green-600 dark:text-green-400">
                      -${orgPricing.discountAmount.toFixed(2)}
                    </span>
                  </motion.div>
                )}

                <div className="flex items-center justify-between pt-2">
                  <span className="text-xl font-bold text-gray-900 dark:text-white">
                    Total per {selectedPlan === "monthly" ? "month" : "year"}
                  </span>
                  <motion.span
                    key={orgPricing.total}
                    initial={{ scale: 1.1 }}
                    animate={{ scale: 1 }}
                    className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white"
                  >
                    ${orgPricing.total.toFixed(2)}
                  </motion.span>
                </div>

                <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                  <p className="text-center text-sm text-gray-600 dark:text-gray-400">
                    <span className="font-semibold">${orgPricing.perTeacher.toFixed(2)}</span> per license per{" "}
                    {selectedPlan === "monthly" ? "month" : "year"}
                  </p>
                </div>
              </div>

              <motion.button
                onClick={handleUpgrade}
                disabled={loading}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-full bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-semibold py-4 px-6 rounded-xl transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    Get Organization Plan
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </motion.button>
            </div>
          </div>
        </motion.section>

        {/* Features Grid */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="max-w-5xl mx-auto"
        >
          <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-200 dark:border-gray-800 p-6 sm:p-8 lg:p-10 shadow-lg">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-8 sm:mb-10 text-center">
              What you get with Premium
            </h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[
                { title: "Unlimited Access", desc: "Play as many quizzes as you want, whenever you want" },
                { title: "Premium Content", desc: "Access exclusive quizzes and premium-only rounds" },
                { title: "Early Access", desc: "Get new quizzes before they're released publicly" },
                { title: "Ad-Free Experience", desc: "Enjoy quizzes without any interruptions" },
                { title: "Progress Tracking", desc: "Track your scores and improvement over time" },
                { title: "Priority Support", desc: "Get help faster with priority customer support" },
              ].map((feature, index) => (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 + index * 0.05 }}
                  className="flex gap-4 p-4 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                >
                  <div className="flex-shrink-0 w-10 h-10 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center">
                    <Check className="w-5 h-5 text-gray-700 dark:text-gray-300" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-1 text-sm sm:text-base">
                      {feature.title}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{feature.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.section>
      </div>
    </div>
  );
}
