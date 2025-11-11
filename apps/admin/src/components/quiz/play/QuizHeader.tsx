import React, { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Menu, X, RotateCcw, Share2, LayoutList, MonitorPlay, Sun, Moon, Crown } from "lucide-react";
import { AchievementNotification, Achievement } from "../AchievementNotification";
import { QuizThemeMode } from "./types";
import { useUserAccess } from "@/contexts/UserAccessContext";
import Link from "next/link";

interface QuizHeaderProps {
  quizLabel?: string;
  textColor: "white" | "black";
  headerTone: "white" | "black";
  backgroundColor: string;
  achievements: Achievement[];
  onDismissAchievement: (id: string) => void;
  themeMode: QuizThemeMode;
  onThemeModeChange: (nextMode: QuizThemeMode) => void;
  onRestartQuiz: () => void;
  onExitQuiz: () => void;
  currentScreen: "round-intro" | "question";
  onOpenGridView?: () => void;
  onOpenPresenterView?: () => void;
  isGridView?: boolean;
  isPresenterView?: boolean; // Add this prop
}

const THEME_MODES: QuizThemeMode[] = ["colored", "light", "dark"];

function PaintBucketIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="-2.56 -2.56 37.12 37.12"
      version="1.1"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      fill="currentColor"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M22.347 14.827v0l-10.4-10.453-0.213 0.16v-0.267c0-1.76-1.44-3.2-3.2-3.2s-3.2 1.44-3.2 3.2v6.667l-4.427 4.427c-1.227 1.227-1.227 3.2 0 4.427l6.027 6.027c0.587 0.64 1.44 0.907 2.24 0.907s1.6-0.32 2.24-0.907l7.627-7.68h6.56l-3.253-3.307zM6.4 4.267c0-1.173 0.96-2.133 2.133-2.133s2.133 0.96 2.133 2.133v1.333l-4.267 4.267v-5.6zM18.613 17.067l-8 8c-0.373 0.373-0.907 0.587-1.493 0.587-0.533 0-1.067-0.213-1.44-0.587l-6.027-6.027c-0.8-0.8-0.8-2.133 0-2.933l9.013-8.96v6.72h1.067v-7.787l0.16-0.16 11.147 11.147h-4.427z" />
      <path d="M28.213 26.987c-0.32-2.88-3.413-6.72-3.413-6.72s-3.147 3.893-3.413 6.773c0 0.16 0 0.267 0 0.427 0 1.92 1.547 3.467 3.467 3.467s3.467-1.547 3.467-3.467c-0.053-0.16-0.053-0.32-0.107-0.48zM24.8 29.867c-1.333 0-2.4-1.067-2.4-2.4 0-0.107 0-0.16 0-0.267v0 0c0.16-1.6 1.387-3.68 2.347-5.12 0.96 1.387 2.187 3.52 2.4 5.067 0 0.107 0 0.213 0 0.32 0.053 1.333-1.013 2.4-2.347 2.4z" />
    </svg>
  );
}

export function QuizHeader({
  quizLabel,
  textColor,
  headerTone: _headerTone,
  backgroundColor,
  achievements,
  onDismissAchievement,
  themeMode,
  onThemeModeChange,
  onRestartQuiz,
  onExitQuiz,
  currentScreen,
  onOpenGridView,
  onOpenPresenterView,
  isGridView = false,
  isPresenterView = false,
}: QuizHeaderProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isTopBarHovered, setIsTopBarHovered] = useState(false);
  const [shareFeedback, setShareFeedback] = useState<string | null>(null);
  const { userName, isLoggedIn, isPremium, isFree } = useUserAccess();

  // Sync document dark mode with themeMode
  useEffect(() => {
    if (themeMode === "dark") {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [themeMode]);

  const isLightText = textColor === "white";
  const isDarkMode = themeMode === "dark";
  // Logo color should match the card text color: white if card text is white, black if card text is black
  const logoColorClass = textColor === "white" ? "text-white" : "text-gray-900";
  const labelClass = isLightText ? "text-white/70" : "text-gray-600";
  const menuButtonClass = isLightText
    ? "bg-white/15 text-white hover:bg-white/25 border border-white/20 backdrop-blur-sm"
    : "bg-black/10 text-gray-900 hover:bg-black/15 border border-black/20 backdrop-blur-sm";

  const menuPanelClass = "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700";

  const shareButtonClass = menuButtonClass;

  const resolveShareUrl = () => {
    if (typeof window === "undefined") return "/";
    try {
      return window.location.href;
    } catch {
      return "/";
    }
  };

  const handleShareQuiz = async () => {
    const url = resolveShareUrl();
    const shareTitle = quizLabel ? `${quizLabel} · The School Quiz` : "The School Quiz";

    const nav = typeof navigator !== "undefined" ? navigator : null;

    try {
      if (nav?.share) {
        await nav.share({
          title: shareTitle,
          url,
        });
        setShareFeedback("Quiz shared");
        return;
      }
    } catch (error) {
      // fall back to clipboard when share is cancelled or fails
      console.warn("Native share failed, falling back to clipboard", error);
    }

    try {
      if (nav?.clipboard?.writeText) {
        await nav.clipboard.writeText(url);
        setShareFeedback("Link copied to clipboard");
      } else {
        throw new Error("Clipboard API unavailable");
      }
    } catch (error) {
      console.warn("Clipboard copy failed", error);
      setShareFeedback(`Copy link manually: ${url}`);
    }
  };

  useEffect(() => {
    if (!shareFeedback) return;
    const timeout = setTimeout(() => setShareFeedback(null), 3500);
    return () => clearTimeout(timeout);
  }, [shareFeedback]);

  const handleThemeToggle = () => {
    const currentIndex = THEME_MODES.indexOf(themeMode);
    const nextMode = THEME_MODES[(currentIndex + 1) % THEME_MODES.length];
    onThemeModeChange(nextMode);
  };

  const handleRestart = () => {
    onRestartQuiz();
    setIsMenuOpen(false);
  };

  const handleExit = () => {
    onExitQuiz();
    setIsMenuOpen(false);
  };

  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 96);
    };
    handleResize();
    handleScroll();
    window.addEventListener("resize", handleResize);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  const showBranding = !(isMobile && isScrolled) && !(isGridView && isScrolled);
  const headerBackground = showBranding ? backgroundColor : "transparent";

  return (
    <div
      className="fixed top-0 left-0 right-0 z-50 py-3 px-6 transition-colors duration-300 ease-out"
      style={{
        pointerEvents: "auto",
        backgroundColor: headerBackground,
        transition: "background-color 300ms ease-in-out, color 300ms ease-in-out",
      }}
    >
      <div className="flex items-center justify-between w-full gap-4">
        {showBranding ? (
          <div className="flex flex-col items-start gap-4 relative">
            <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.4 }}>
              <motion.a
                href="/"
                onClick={(event) => {
                  event.preventDefault();
                  if (typeof window !== "undefined") {
                    const isLoggedIn = localStorage.getItem("isLoggedIn") === "true";
                    window.location.href = isLoggedIn ? "/quizzes" : "/";
                  }
                }}
                className={`text-2xl font-bold tracking-tight transition-opacity duration-300 hover:opacity-80 cursor-pointer ${logoColorClass}`}
              >
                The School Quiz
              </motion.a>
              {quizLabel ? <span className={`text-xs font-medium mt-0.5 ${labelClass}`}>{quizLabel}</span> : null}
            </motion.div>

            {achievements.length > 0 && (
              <div className="fixed top-6 right-6 w-[380px] max-w-[calc(100vw-2rem)] pointer-events-none z-[80] space-y-3">
                <AnimatePresence mode="popLayout">
                  {achievements.slice(0, 5).map((achievement, index) => (
                    <motion.div
                      key={achievement.id}
                      className="pointer-events-auto"
                      initial={{ opacity: 0, x: 120, scale: 0.95 }}
                      animate={{ opacity: 1, x: 0, scale: 1 }}
                      exit={{ opacity: 0, x: 120, scale: 0.95 }}
                      transition={{ type: "spring", stiffness: 300, damping: 30, delay: index * 0.15 }}
                    >
                      <AchievementNotification achievement={achievement} onDismiss={() => onDismissAchievement(achievement.id)} textColor={textColor} />
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}
          </div>
        ) : (
          <div className="flex-1" />
        )}

        <div className="flex items-center gap-3">
          {onOpenPresenterView && (
            <motion.button
              onClick={onOpenPresenterView}
              className={`hidden sm:flex h-12 w-12 items-center justify-center rounded-full transition-colors duration-300 ease-out ${menuButtonClass}`}
              whileHover={{ scale: 1.07 }}
              whileTap={{ scale: 0.95 }}
              title="Switch to presenter view"
              aria-label="Switch to presenter view"
            >
              <MonitorPlay className="h-5 w-5" />
            </motion.button>
          )}
          {onOpenGridView && (
            <motion.button
              onClick={onOpenGridView}
              className={`hidden sm:flex h-12 w-12 items-center justify-center rounded-full transition-colors duration-300 ease-out ${menuButtonClass}`}
              whileHover={{ scale: 1.07 }}
              whileTap={{ scale: 0.95 }}
              title="Switch to grid view"
              aria-label="Switch to grid view"
            >
              <LayoutList className="h-5 w-5" />
            </motion.button>
          )}
          <motion.button
            onClick={handleShareQuiz}
            className={`w-12 h-12 rounded-full transition-colors duration-300 ease-out flex items-center justify-center ${shareButtonClass}`}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            aria-label="Share quiz"
          >
            <Share2 className="h-5 w-5" />
          </motion.button>
          <motion.button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className={`w-12 h-12 rounded-full transition-colors duration-300 ease-out flex items-center justify-center relative ${menuButtonClass}`}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            aria-haspopup="menu"
            aria-expanded={isMenuOpen}
            aria-label={isMenuOpen ? "Close menu" : "Open menu"}
          >
            <AnimatePresence mode="wait">
              {isMenuOpen ? (
                <motion.div key="close" initial={{ opacity: 0, rotate: -90 }} animate={{ opacity: 1, rotate: 0 }} exit={{ opacity: 0, rotate: 90 }} transition={{ duration: 0.2 }}>
                  <X className="h-5 w-5" />
                </motion.div>
              ) : (
                <motion.div key="menu" initial={{ opacity: 0, rotate: 90 }} animate={{ opacity: 1, rotate: 0 }} exit={{ opacity: 0, rotate: -90 }} transition={{ duration: 0.2 }}>
                  <Menu className="h-5 w-5" />
                </motion.div>
              )}
            </AnimatePresence>
          </motion.button>
        </div>
      </div>

      <AnimatePresence>
        {isMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="fixed inset-0 bg-black/30 backdrop-blur-md z-40"
              onClick={() => setIsMenuOpen(false)}
            />
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className={`fixed top-20 right-4 w-80 max-w-[calc(100vw-2rem)] max-h-[calc(100vh-6rem)] rounded-3xl border flex flex-col z-50 overflow-hidden ${menuPanelClass}`}
            >
              <div className="p-6 overflow-y-auto flex-1">
                {/* User Profile Section - Only for logged-in users */}
                {isLoggedIn && (
                  <div className="px-0 py-0 mb-4 pb-4 border-b border-gray-100 dark:border-gray-700/50">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-full bg-blue-600 dark:bg-blue-500 flex items-center justify-center text-white font-semibold text-base relative flex-shrink-0">
                        {(userName || localStorage.getItem('userName')) ? (userName || localStorage.getItem('userName'))?.charAt(0).toUpperCase() : 'U'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-gray-900 dark:text-white text-base truncate">
                            {userName || localStorage.getItem('userName') || 'User'}
                          </p>
                          {isPremium && (
                            <Crown className="w-4 h-4 text-amber-500 dark:text-amber-400 flex-shrink-0" />
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Menu Items */}
                <div className="py-2">
                  {/* View Mode Toggle */}
                  {onOpenGridView && onOpenPresenterView && (
                    <>
                      {isPresenterView ? (
                        <button
                          onClick={() => {
                            onOpenGridView();
                            setIsMenuOpen(false);
                          }}
                          className="flex items-center gap-3 px-4 py-3 rounded-xl text-base text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors w-full text-left"
                        >
                          <LayoutList className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                          Switch to Grid View
                        </button>
                      ) : (
                        <button
                          onClick={() => {
                            onOpenPresenterView();
                            setIsMenuOpen(false);
                          }}
                          className="flex items-center gap-3 px-4 py-3 rounded-xl text-base text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors w-full text-left"
                        >
                          <MonitorPlay className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                          Switch to Presenter View
                        </button>
                      )}
                    </>
                  )}

                  {/* Theme Mode 3-Way Switch */}
                  <div className="border-t border-gray-100 dark:border-gray-700/50 my-1"></div>
                  <div className="py-2 px-4">
                    <div className="flex items-center justify-between">
                      <span className="text-base text-gray-700 dark:text-gray-200">Theme</span>
                      <button
                        onClick={() => {
                          handleThemeToggle();
                        }}
                        className="relative inline-flex h-8 w-24 items-center rounded-full bg-gray-200 dark:bg-gray-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                        aria-label={`Current theme: ${themeMode}. Click to cycle theme.`}
                      >
                        <motion.div
                          className="absolute left-1 flex h-6 w-6 items-center justify-center rounded-full bg-white shadow-sm"
                          initial={false}
                          animate={{
                            x: themeMode === "colored" ? 2 : themeMode === "light" ? 40 : 78,
                          }}
                          transition={{ type: "spring", stiffness: 500, damping: 30 }}
                        >
                          <AnimatePresence mode="wait">
                            {themeMode === "colored" && (
                              <motion.div
                                key="colored"
                                initial={{ scale: 0, rotate: -180 }}
                                animate={{ scale: 1, rotate: 0 }}
                                exit={{ scale: 0, rotate: 180 }}
                                transition={{ duration: 0.2 }}
                              >
                                <PaintBucketIcon className="h-4 w-4 text-blue-600" />
                              </motion.div>
                            )}
                            {themeMode === "light" && (
                              <motion.div
                                key="light"
                                initial={{ scale: 0, rotate: -180 }}
                                animate={{ scale: 1, rotate: 0 }}
                                exit={{ scale: 0, rotate: 180 }}
                                transition={{ duration: 0.2 }}
                              >
                                <Sun className="h-4 w-4 text-yellow-600" />
                              </motion.div>
                            )}
                            {themeMode === "dark" && (
                              <motion.div
                                key="dark"
                                initial={{ scale: 0, rotate: -180 }}
                                animate={{ scale: 1, rotate: 0 }}
                                exit={{ scale: 0, rotate: 180 }}
                                transition={{ duration: 0.2 }}
                              >
                                <Moon className="h-4 w-4 text-gray-700" />
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </motion.div>
                        <div className="flex w-full items-center justify-around px-1">
                          <PaintBucketIcon className={`h-4 w-4 transition-opacity ${themeMode === "colored" ? "opacity-100" : "opacity-40"}`} />
                          <Sun className={`h-4 w-4 transition-opacity ${themeMode === "light" ? "opacity-100" : "opacity-40"}`} />
                          <Moon className={`h-4 w-4 transition-opacity ${themeMode === "dark" ? "opacity-100" : "opacity-40"}`} />
                        </div>
                      </button>
                    </div>
                  </div>

                  {/* Restart Quiz */}
                  <button
                    onClick={handleRestart}
                    className="flex items-center gap-3 px-4 py-3 rounded-xl text-base text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors w-full text-left"
                  >
                    <RotateCcw className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                    Restart Quiz
                  </button>

                  {/* Exit Quiz */}
                  <button
                    onClick={handleExit}
                    className="flex items-center gap-3 px-4 py-3 rounded-xl text-base text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors w-full text-left"
                  >
                    <X className="w-5 h-5 text-red-600 dark:text-red-400" />
                    Exit Quiz
                  </button>
                </div>

                {/* Upgrade CTA for Free Users */}
                {isFree && (
                  <>
                    <div className="border-t border-gray-100 dark:border-gray-700/50 my-1"></div>
                    <div className="py-2">
                      <Link
                        href="/upgrade"
                        onClick={() => setIsMenuOpen(false)}
                        className="flex items-center justify-center gap-2 px-6 py-3 rounded-full text-base font-medium bg-[#3B82F6] text-white hover:bg-[#2563EB] transition-colors w-full"
                      >
                        <Crown className="w-4 h-4" />
                        Upgrade to Premium
                      </Link>
                    </div>
                  </>
                )}

              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <span className="sr-only" aria-live="polite">
        {shareFeedback || ""}
      </span>
    </div>
  );
}
