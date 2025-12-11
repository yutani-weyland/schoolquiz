"use client";

import React, { useState, useEffect, useCallback } from "react";
import { signIn } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";
import { Mail, Phone, ArrowRight, Loader2, Gift, Sparkles, CheckCircle2, XCircle } from "lucide-react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { ContentCard } from "@/components/layout/ContentCard";

type SignupMethod = "email" | "phone";
type ReferralValidationState = "idle" | "validating" | "valid" | "invalid";

export default function SignUpForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [method, setMethod] = useState<SignupMethod>("email");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [referralCode, setReferralCode] = useState("");
  const [referralValidation, setReferralValidation] = useState<ReferralValidationState>("idle");
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

  // Validate referral code
  const validateReferralCode = useCallback(async (code: string) => {
    if (!code || code.length < 3) {
      setReferralValidation("idle");
      return;
    }

    setReferralValidation("validating");

    try {
      const response = await fetch(`/api/referral/validate?code=${encodeURIComponent(code.trim().toUpperCase())}`);
      const data = await response.json();

      if (data.valid) {
        setReferralValidation("valid");
      } else {
        setReferralValidation("invalid");
      }
    } catch (err) {
      setReferralValidation("invalid");
    }
  }, []);

  // Debounced validation effect
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      validateReferralCode(referralCode);
    }, 500); // 500ms debounce

    return () => clearTimeout(timeoutId);
  }, [referralCode, validateReferralCode]);

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
      
      // If signup returns credentials, sign in with NextAuth
      if (data.email && data.password) {
        // Sign in with the credentials provided by signup
        const result = await signIn('credentials', {
          email: data.email,
          password: data.password,
          redirect: false,
        });

        if (result?.ok) {
          // Redirect after successful sign-in
          setTimeout(() => {
            window.location.href = "/quizzes";
          }, 1500);
        } else {
          // If auto-signin fails, redirect to sign-in page
          setTimeout(() => {
            router.push("/sign-in?email=" + encodeURIComponent(data.email));
          }, 1500);
        }
      } else {
        // If no credentials returned, redirect to sign-in
        setTimeout(() => {
          router.push("/sign-in");
        }, 1500);
      }
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
              <label htmlFor="signup-email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Email address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  id="signup-email"
                  name="email"
                  type="email"
                  autoComplete="email"
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
              <label htmlFor="signup-phone" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Phone number
              </label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  id="signup-phone"
                  name="phone"
                  type="tel"
                  autoComplete="tel"
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
        <div className="space-y-3">
          <label htmlFor="referral-code" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Referral code (optional)
          </label>
          <div className="relative">
            <input
              id="referral-code"
              name="referralCode"
              type="text"
              autoComplete="off"
              value={referralCode}
              onChange={(e) => setReferralCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ""))}
              maxLength={8}
              className={`w-full pl-4 pr-12 py-3 border rounded-full bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 transition-all uppercase text-sm font-semibold tracking-wider ${
                referralValidation === "valid"
                  ? "border-green-300 dark:border-green-700 focus:ring-green-500 focus:border-green-400 dark:focus:border-green-600"
                  : referralValidation === "invalid"
                  ? "border-red-300 dark:border-red-700 focus:ring-red-500 focus:border-red-400 dark:focus:border-red-600"
                  : "border-gray-300 dark:border-gray-600 focus:ring-blue-500 focus:border-blue-400 dark:focus:border-blue-600"
              }`}
              placeholder="ABC12345"
            />
            
            {/* Validation status icon */}
            {referralCode && referralValidation !== "idle" && (
              <div className="absolute right-3.5 top-1/2 -translate-y-1/2">
                {referralValidation === "validating" && (
                  <Loader2 className="w-5 h-5 text-gray-400 animate-spin" />
                )}
                {referralValidation === "valid" && (
                  <CheckCircle2 className="w-5 h-5 text-green-500 dark:text-green-400" />
                )}
                {referralValidation === "invalid" && (
                  <XCircle className="w-5 h-5 text-red-500 dark:text-red-400" />
                )}
              </div>
            )}
          </div>
          
          {/* Show validation feedback */}
          {referralCode && referralValidation === "valid" && (
            <motion.div
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-2 px-3 py-2 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800"
            >
              <CheckCircle2 className="w-4 h-4 text-green-600 dark:text-green-400 flex-shrink-0" />
              <span className="text-xs text-green-800 dark:text-green-200">
                Valid code! You and your referrer will both get 1 month free when you upgrade to Premium.
              </span>
            </motion.div>
          )}
          
          {referralCode && referralValidation === "invalid" && (
            <motion.div
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-2 px-3 py-2 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800"
            >
              <XCircle className="w-4 h-4 text-red-600 dark:text-red-400 flex-shrink-0" />
              <span className="text-xs text-red-800 dark:text-red-200">
                Invalid referral code. Please check and try again.
              </span>
            </motion.div>
          )}
        </div>

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
          name="submit"
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

      {/* Premium path CTA */}
      <div className="mt-6 pt-6 border-t border-gray-100 dark:border-gray-700/50 text-center">
        <p className="text-sm text-gray-600 dark:text-gray-300 mb-1.5 font-medium">
          Running this with multiple classes?
        </p>
        <Link
          href="/upgrade"
          className="inline-flex items-center gap-1.5 text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-semibold transition-colors"
        >
          Start with Premium
          <ArrowRight className="w-4 h-4" />
        </Link>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1.5">
          Class teams, printable PDFs and every quiz ever made.
        </p>
      </div>
    </ContentCard>
  );
}

