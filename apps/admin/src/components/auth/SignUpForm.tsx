"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mail, Phone, ArrowRight, Loader2, Gift, Sparkles } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ContentCard } from "@/components/layout/ContentCard";

type SignupMethod = "email" | "phone";

export default function SignUpForm() {
  const searchParams = useSearchParams();
  const [method, setMethod] = useState<SignupMethod>("email");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [referralCode, setReferralCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  // Extract referral code from URL if present
  useEffect(() => {
    const refCode = searchParams?.get("ref");
    if (refCode) {
      setReferralCode(refCode.toUpperCase());
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          method,
          email: method === "email" ? email : undefined,
          phone: method === "phone" ? phone : undefined,
          referralCode: referralCode.trim() || undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Sign up failed");
      }

      setSuccess(true);
      
      // Store user session
      if (data.token) {
        localStorage.setItem("authToken", data.token);
        localStorage.setItem("isLoggedIn", "true");
        localStorage.setItem("userId", data.userId);
        if (data.email) localStorage.setItem("userEmail", data.email);
      }

      // Redirect after a moment
      setTimeout(() => {
        window.location.href = "/quizzes";
      }, 1500);
    } catch (err: any) {
      setError(err.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 200, damping: 15 }}
          className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4"
        >
          <svg
            className="w-8 h-8 text-green-600 dark:text-green-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 13l4 4L19 7"
            />
          </svg>
        </motion.div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Welcome to the community!
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          You now have free access to the latest edition of <span className="font-bold text-blue-600 dark:text-blue-400">The School Quiz</span>. Check your email for reminders!
        </p>
      </motion.div>
    );
  }

  return (
    <ContentCard padding="xl" rounded="3xl" hoverAnimation={false}>

      {/* Method Selector */}
      <div className="flex gap-2 mb-6 p-1 bg-gray-100 dark:bg-gray-700 rounded-full">
        <button
          onClick={() => setMethod("email")}
          className={`flex-1 px-4 py-2 rounded-full font-medium transition-all ${
            method === "email"
              ? "bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm"
              : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
          }`}
        >
          Email
        </button>
        <button
          onClick={() => setMethod("phone")}
          className={`flex-1 px-4 py-2 rounded-full font-medium transition-all ${
            method === "phone"
              ? "bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm"
              : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
          }`}
        >
          Phone
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <AnimatePresence mode="wait">
          {method === "email" && (
            <motion.div
              key="email"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="relative"
            >
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Email address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-full bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  placeholder="you@example.com"
                />
              </div>
            </motion.div>
          )}

          {method === "phone" && (
            <motion.div
              key="phone"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="relative"
            >
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Phone number
              </label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-full bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  placeholder="+61 400 000 000"
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Divider */}
        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-200 dark:border-gray-700"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-4 bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400">
              Optional
            </span>
          </div>
        </div>

        {/* Referral Code Section */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`relative overflow-hidden rounded-2xl border transition-all ${
            referralCode
              ? "bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/20 border-blue-200 dark:border-blue-800/50 shadow-sm"
              : "bg-gradient-to-br from-gray-50 to-slate-50 dark:from-gray-800/50 dark:to-slate-800/30 border-gray-200 dark:border-gray-700"
          }`}
        >
          {/* Decorative background element */}
          <div className={`absolute top-0 right-0 w-32 h-32 rounded-full blur-3xl opacity-20 ${
            referralCode
              ? "bg-blue-400 dark:bg-blue-600"
              : "bg-gray-300 dark:bg-gray-600"
          }`} />
          
          <div className="relative p-5">
            <div className="flex items-start gap-4 mb-4">
              <div className={`p-2.5 rounded-xl shadow-sm transition-all ${
                referralCode
                  ? "bg-blue-100 dark:bg-blue-900/40 ring-2 ring-blue-200 dark:ring-blue-800"
                  : "bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600"
              }`}>
                <Gift className={`w-5 h-5 transition-colors ${
                  referralCode
                    ? "text-blue-600 dark:text-blue-400"
                    : "text-gray-500 dark:text-gray-400"
                }`} />
              </div>
              <div className="flex-1 min-w-0">
                <label className="block text-sm font-bold text-gray-900 dark:text-white mb-1.5">
                  Have a referral code?
                </label>
                <p className="text-xs leading-relaxed text-gray-600 dark:text-gray-400">
                  {referralCode
                    ? "Great! You and your referrer will both get 1 month free when you upgrade to Premium."
                    : "Enter a friend's code and you'll both get 1 month free when you upgrade to Premium."}
                </p>
              </div>
            </div>
            
            <div className="relative">
              <input
                type="text"
                value={referralCode}
                onChange={(e) => setReferralCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ""))}
                maxLength={8}
                className={`w-full pl-11 pr-4 py-3 border-2 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 transition-all uppercase text-sm font-semibold tracking-wider shadow-sm ${
                  referralCode
                    ? "border-blue-300 dark:border-blue-700 focus:ring-blue-500 focus:border-blue-400 dark:focus:border-blue-600"
                    : "border-gray-300 dark:border-gray-600 focus:ring-blue-500 focus:border-blue-400 dark:focus:border-blue-600"
                }`}
                placeholder="ABC12345"
              />
              <Gift className={`absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 transition-colors ${
                referralCode
                  ? "text-blue-500 dark:text-blue-400"
                  : "text-gray-400 dark:text-gray-500"
              }`} />
            </div>
            
            {referralCode && (
              <motion.div
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-4 flex items-center gap-2.5 px-3 py-2.5 bg-blue-100/80 dark:bg-blue-900/30 rounded-lg border border-blue-200 dark:border-blue-800"
              >
                <Sparkles className="w-4 h-4 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                <span className="text-xs font-medium text-blue-800 dark:text-blue-200">
                  Referral code applied! Both you and your referrer will benefit.
                </span>
              </motion.div>
            )}
          </div>
        </motion.div>

        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-full text-red-600 dark:text-red-400 text-sm"
          >
            {error}
          </motion.div>
        )}

        <motion.button
          type="submit"
          disabled={loading}
          whileHover={{ scale: loading ? 1 : 1.02 }}
          whileTap={{ scale: loading ? 1 : 0.98 }}
          className="w-full bg-[#3B82F6] hover:bg-[#2563EB] text-white font-medium py-3 px-6 rounded-full transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
        >
          {loading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Creating account...
            </>
          ) : (
            <>
              Sign Up
              <ArrowRight className="w-5 h-5" />
            </>
          )}
        </motion.button>
      </form>

      <div className="mt-6 text-center">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Already have an account?{" "}
          <Link
            href="/sign-in"
            className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium transition-colors"
          >
            Sign in
          </Link>
        </p>
      </div>
    </ContentCard>
  );
}

