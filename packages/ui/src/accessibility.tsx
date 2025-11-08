import React, { createContext, useContext, useEffect, useState } from "react";

interface AccessibilityContextType {
  shouldReduceMotion: boolean;
  setShouldReduceMotion: (value: boolean) => void;
  fontFamily: "default" | "dyslexic";
  setFontFamily: (value: "default" | "dyslexic") => void;
  theme: "default" | "high-contrast";
  setTheme: (value: "default" | "high-contrast") => void;
  textSize: "normal" | "large";
  setTextSize: (value: "normal" | "large") => void;
}

const AccessibilityContext = createContext<AccessibilityContextType | undefined>(undefined);

export const useAccessibility = () => {
  const context = useContext(AccessibilityContext);
  if (!context) {
    throw new Error("useAccessibility must be used within a ReducedMotionProvider");
  }
  return context;
};

interface ReducedMotionProviderProps {
  children: React.ReactNode;
}

export const ReducedMotionProvider: React.FC<ReducedMotionProviderProps> = ({ children }) => {
  const [shouldReduceMotion, setShouldReduceMotion] = useState(false);
  const [fontFamily, setFontFamily] = useState<"default" | "dyslexic">("default");
  const [theme, setTheme] = useState<"default" | "high-contrast">("default");
  const [textSize, setTextSize] = useState<"normal" | "large">("normal");

  useEffect(() => {
    // Check for system preference
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const htmlDataMotion = document.documentElement.getAttribute("data-motion");
    
    const initialReducedMotion = mediaQuery.matches || htmlDataMotion === "off";
    setShouldReduceMotion(initialReducedMotion);

    // Load saved preferences
    const savedFontFamily = localStorage.getItem("schoolquiz-font-family") as "default" | "dyslexic" | null;
    const savedTheme = localStorage.getItem("schoolquiz-theme") as "default" | "high-contrast" | null;
    const savedTextSize = localStorage.getItem("schoolquiz-text-size") as "normal" | "large" | null;

    if (savedFontFamily) setFontFamily(savedFontFamily);
    if (savedTheme) setTheme(savedTheme);
    if (savedTextSize) setTextSize(savedTextSize);

    // Listen for changes
    const handleChange = (e: MediaQueryListEvent) => {
      setShouldReduceMotion(e.matches || document.documentElement.getAttribute("data-motion") === "off");
    };

    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, []);

  useEffect(() => {
    // Apply motion preference to document
    if (shouldReduceMotion) {
      document.documentElement.setAttribute("data-motion", "off");
    } else {
      document.documentElement.removeAttribute("data-motion");
    }
  }, [shouldReduceMotion]);

  useEffect(() => {
    // Apply font family
    if (fontFamily === "dyslexic") {
      document.documentElement.classList.add("font-dyslexic");
    } else {
      document.documentElement.classList.remove("font-dyslexic");
    }
    localStorage.setItem("schoolquiz-font-family", fontFamily);
  }, [fontFamily]);

  useEffect(() => {
    // Apply theme
    if (theme === "high-contrast") {
      document.documentElement.classList.add("theme-high-contrast");
    } else {
      document.documentElement.classList.remove("theme-high-contrast");
    }
    localStorage.setItem("schoolquiz-theme", theme);
  }, [theme]);

  useEffect(() => {
    // Apply text size
    if (textSize === "large") {
      document.documentElement.classList.add("text-large");
    } else {
      document.documentElement.classList.remove("text-large");
    }
    localStorage.setItem("schoolquiz-text-size", textSize);
  }, [textSize]);

  return (
    <AccessibilityContext.Provider
      value={{
        shouldReduceMotion,
        setShouldReduceMotion,
        fontFamily,
        setFontFamily,
        theme,
        setTheme,
        textSize,
        setTextSize
      }}
    >
      {children}
    </AccessibilityContext.Provider>
  );
};
