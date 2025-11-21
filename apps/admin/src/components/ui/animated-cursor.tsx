"use client";

import React, { createContext, useContext, useEffect, useState, useRef, useLayoutEffect } from "react";
import { motion, useSpring, useMotionValue, useTransform, SpringOptions, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

type Align = 
  | "center"
  | "top"
  | "top-left"
  | "top-right"
  | "bottom"
  | "bottom-left"
  | "bottom-right"
  | "left"
  | "right";

interface CursorContextType {
  mouseX: ReturnType<typeof useMotionValue<number>>;
  mouseY: ReturnType<typeof useMotionValue<number>>;
  isActive: boolean;
  setIsActive: (active: boolean) => void;
}

const CursorContext = createContext<CursorContextType | null>(null);

export function CursorProvider({ 
  children, 
  className 
}: { 
  children: React.ReactNode; 
  className?: string;
}) {
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const [isActive, setIsActive] = useState(false);
  const [hasPointer, setHasPointer] = useState(false);

  useEffect(() => {
    // Only enable on devices with pointer (mouse/trackpad), not touch
    const checkPointer = () => {
      const hasFinePointer = window.matchMedia("(pointer: fine)").matches;
      setHasPointer(hasFinePointer);
    };
    
    checkPointer();
    const mediaQuery = window.matchMedia("(pointer: fine)");
    const handleChange = () => checkPointer();
    mediaQuery.addEventListener("change", handleChange);
    
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, []);

  useEffect(() => {
    // Always track mouse position, even if hasPointer is false initially
    const handleMouseMove = (e: MouseEvent) => {
      mouseX.set(e.clientX);
      mouseY.set(e.clientY);
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, [mouseX, mouseY]);

  return (
    <CursorContext.Provider value={{ mouseX, mouseY, isActive, setIsActive }}>
      <div className={cn(hasPointer && isActive && "cursor-none", className)}>
        {children}
      </div>
    </CursorContext.Provider>
  );
}

export function useCursor() {
  const context = useContext(CursorContext);
  if (!context) {
    throw new Error("useCursor must be used within CursorProvider");
  }
  return context;
}

interface CursorProps {
  children: React.ReactNode;
  className?: string;
}

export function Cursor({ children, className }: CursorProps) {
  const { mouseX, mouseY, isActive } = useCursor();
  const cursorX = useSpring(mouseX, { stiffness: 500, damping: 50 });
  const cursorY = useSpring(mouseY, { stiffness: 500, damping: 50 });
  
  // Always call hooks - don't conditionally return before hooks
  // For pointer cursor, position tip at cursor (top-left corner of SVG)
  const xTransform = useTransform(cursorX, (x) => x);
  const yTransform = useTransform(cursorY, (y) => y);

  return (
    <motion.div
      className={cn(
        "fixed top-0 left-0 pointer-events-none z-[9999]",
        className
      )}
      style={{
        x: xTransform,
        y: yTransform,
        opacity: isActive ? 1 : 0,
        pointerEvents: isActive ? "auto" : "none",
      }}
    >
      {children}
    </motion.div>
  );
}

interface CursorFollowProps {
  children: React.ReactNode;
  sideOffset?: number;
  align?: Align;
  transition?: SpringOptions;
  className?: string;
}

export function CursorFollow({
  children,
  sideOffset = 15,
  align = "bottom-right",
  transition = { stiffness: 500, damping: 50, bounce: 0 },
  className,
}: CursorFollowProps) {
  const { mouseX, mouseY, isActive } = useCursor();
  const followX = useSpring(mouseX, transition);
  const followY = useSpring(mouseY, transition);
  const elementRef = useRef<HTMLDivElement>(null);
  const offsetX = useMotionValue(0);
  const offsetY = useMotionValue(0);
  const [isMounted, setIsMounted] = useState(false);
  
  // Always call hooks - use motion values for offset to avoid closure issues
  const xTransform = useTransform([followX, offsetX], ([x, ox]) => x + ox);
  const yTransform = useTransform([followY, offsetY], ([y, oy]) => y + oy);

  // Measure element and calculate offset
  useLayoutEffect(() => {
    if (!elementRef.current || !isActive) {
      setIsMounted(false);
      return;
    }

    const updateOffset = () => {
      const rect = elementRef.current?.getBoundingClientRect();
      if (!rect) return;

      const width = rect.width;
      const height = rect.height;

      let x = 0;
      let y = 0;

      switch (align) {
        case "center":
          x = -width / 2;
          y = -height / 2;
          break;
        case "top":
          x = -width / 2;
          y = -height - sideOffset;
          break;
        case "top-left":
          x = -width - sideOffset;
          y = -height - sideOffset;
          break;
        case "top-right":
          x = sideOffset;
          y = -height - sideOffset;
          break;
        case "bottom":
          x = -width / 2;
          y = sideOffset;
          break;
        case "bottom-left":
          x = -width - sideOffset;
          y = sideOffset;
          break;
        case "bottom-right":
          x = sideOffset;
          y = sideOffset;
          break;
        case "left":
          x = -width - sideOffset;
          y = -height / 2;
          break;
        case "right":
          x = sideOffset;
          y = -height / 2;
          break;
      }

      offsetX.set(x);
      offsetY.set(y);
      setIsMounted(true);
    };

    // Use requestAnimationFrame to ensure element is rendered
    const rafId = requestAnimationFrame(() => {
      updateOffset();
    });

    window.addEventListener("resize", updateOffset);
    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener("resize", updateOffset);
    };
  }, [align, sideOffset, isActive, children]);

  return (
    <AnimatePresence>
      {isActive && isMounted && (
        <motion.div
          ref={elementRef}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          className={cn(
            "fixed top-0 left-0 pointer-events-none z-[9998]",
            className
          )}
          style={{
            x: xTransform,
            y: yTransform,
          }}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

