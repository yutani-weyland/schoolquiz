import React, { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Menu, X, RotateCcw, Share2, LayoutList, MonitorPlay } from "lucide-react";
import { AchievementNotification, Achievement } from "../AchievementNotification";
import { QuizThemeMode } from "./types";

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
  const [bucketRotate, setBucketRotate] = useState(0);
  const [shareFeedback, setShareFeedback] = useState<string | null>(null);

  const isLightText = textColor === "white";
  const isDarkMode = themeMode === "dark";
  // Logo color should match the card text color: white if card text is white, black if card text is black
  const logoColorClass = textColor === "white" ? "text-white" : "text-gray-900";
  const labelClass = isLightText ? "text-white/70" : "text-gray-600";
  const menuButtonClass = isLightText
    ? "bg-white/15 text-white hover:bg-white/25"
    : "bg-black/10 text-gray-900 hover:bg-black/15";

  const menuPanelClass = isLightText
    ? "bg-gray-900/95 border-gray-700"
    : "bg-white/95 border-gray-200";

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
    setBucketRotate((prev) => prev + 1);
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
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
              onClick={() => setIsMenuOpen(false)}
            />
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className={`fixed top-20 right-4 w-80 max-h-[calc(100vh-6rem)] rounded-3xl shadow-2xl border flex flex-col z-50 overflow-hidden ${menuPanelClass}`}
            >
              <div className="p-6 overflow-y-auto flex-1">
                <div className="space-y-1">
                  <motion.button
                    onClick={handleThemeToggle}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-base font-medium transition-all duration-200 ${
                      isLightText ? "text-gray-300 hover:bg-gray-800/40 hover:text-white" : "text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                    }`}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <motion.div key={bucketRotate} initial={false} animate={bucketRotate > 0 ? { rotate: [0, 360] } : { rotate: 0 }} transition={{ duration: 0.5 }}>
                      <PaintBucketIcon className="h-5 w-5" />
                    </motion.div>
                    <span>Change Theme</span>
                  </motion.button>

                  <motion.button
                    onClick={handleRestart}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-base font-medium transition-all duration-200 ${
                      isLightText ? "text-gray-300 hover:bg-gray-800/40 hover:text-white" : "text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                    }`}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <RotateCcw className="h-5 w-5" />
                    <span>Restart Quiz</span>
                  </motion.button>

                  <motion.button
                    onClick={handleExit}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-base font-medium transition-all duration-200 ${
                      isLightText ? "text-red-300 hover:bg-red-900/30 hover:text-red-200" : "text-red-600 hover:bg-red-50 hover:text-red-700"
                    }`}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <X className="h-5 w-5" />
                    <span>Exit Quiz</span>
                  </motion.button>
                </div>
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
