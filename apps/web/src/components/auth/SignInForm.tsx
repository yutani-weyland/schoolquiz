"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { Mail, Phone, Key, ArrowRight, Loader2 } from "lucide-react";

type SigninMethod = "email" | "phone" | "code";

export default function SignInForm() {
  const [method, setMethod] = useState<SigninMethod>("email");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [signupCode, setSignupCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await fetch("/api/auth/signin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          method,
          email: method === "email" ? email : undefined,
          phone: method === "phone" ? phone : undefined,
          signupCode: method === "code" ? signupCode : undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Sign in failed");
      }

      // Store user session
      if (data.token) {
        localStorage.setItem("authToken", data.token);
        localStorage.setItem("isLoggedIn", "true");
        localStorage.setItem("userId", data.userId);
        if (data.email) localStorage.setItem("userEmail", data.email);
      }

      // Redirect
      window.location.href = "/quizzes";
    } catch (err: any) {
      setError(err.message || "Something went wrong. Please try again.");
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="bg-white dark:bg-[#1A1F2E] border border-gray-200 dark:border-[#2D3748] shadow-lg rounded-3xl p-10 md:p-12"
    >

      {/* Method Selector */}
      <div className="flex gap-2 mb-6 p-1 bg-gray-100 dark:bg-[#1A1F2E] rounded-full">
        <button
          onClick={() => setMethod("email")}
          className={`flex-1 px-4 py-2 rounded-full font-medium transition-all ${
            method === "email"
              ? "bg-white dark:bg-[#252B3A] text-gray-900 dark:text-white shadow-sm"
              : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
          }`}
        >
          Email
        </button>
        <button
          onClick={() => setMethod("phone")}
          className={`flex-1 px-4 py-2 rounded-full font-medium transition-all ${
            method === "phone"
              ? "bg-white dark:bg-[#252B3A] text-gray-900 dark:text-white shadow-sm"
              : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
          }`}
        >
          Phone
        </button>
        <button
          onClick={() => setMethod("code")}
          className={`flex-1 px-4 py-2 rounded-full font-medium transition-all ${
            method === "code"
              ? "bg-white dark:bg-[#252B3A] text-gray-900 dark:text-white shadow-sm"
              : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
          }`}
        >
          Code
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {method === "email" && (
          <div className="relative">
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
                className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-[#2D3748] rounded-xl bg-white dark:bg-[#1A1F2E] text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                placeholder="you@example.com"
              />
            </div>
          </div>
        )}

        {method === "phone" && (
          <div className="relative">
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
                className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-[#2D3748] rounded-xl bg-white dark:bg-[#1A1F2E] text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                placeholder="+61 400 000 000"
              />
            </div>
          </div>
        )}

        {method === "code" && (
          <div className="relative">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Signup code
            </label>
            <div className="relative">
              <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={signupCode}
                onChange={(e) => setSignupCode(e.target.value)}
                required
                className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-[#2D3748] rounded-xl bg-white dark:bg-[#1A1F2E] text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                placeholder="Enter your signup code"
              />
            </div>
          </div>
        )}

        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-red-600 dark:text-red-400 text-sm"
          >
            {error}
          </motion.div>
        )}

        <motion.button
          type="submit"
          disabled={loading}
          whileHover={{ scale: loading ? 1 : 1.02 }}
          whileTap={{ scale: loading ? 1 : 0.98 }}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
        >
          {loading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Signing in...
            </>
          ) : (
            <>
              Sign in
              <ArrowRight className="w-5 h-5" />
            </>
          )}
        </motion.button>
      </form>

      <div className="mt-6 text-center">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Don't have an account?{" "}
          <a
            href="/sign-up"
            className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium transition-colors"
          >
            Sign up
          </a>
        </p>
      </div>
    </motion.div>
  );
}

