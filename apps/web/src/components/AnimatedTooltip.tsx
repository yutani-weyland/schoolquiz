"use client";

import React, { useState, useRef } from "react";
import {
  motion,
  useTransform,
  AnimatePresence,
  useMotionValue,
  useSpring,
} from "framer-motion";

export type AnimatedTooltipProps = {
  content: string;
  children: React.ReactNode;
  position?: "top" | "bottom" | "left" | "right";
  className?: string;
};

export const AnimatedTooltip = ({ 
  content, 
  children, 
  position = "top",
  className = ""
}: AnimatedTooltipProps) => {
  const [isHovered, setIsHovered] = useState(false);
  const springConfig = { stiffness: 100, damping: 15 };
  const x = useMotionValue(0);
  const animationFrameRef = useRef<number | null>(null);
  
  const rotate = useSpring(
    useTransform(x, [-100, 100], [-3, 3]),
    springConfig
  );
  const translateX = useSpring(
    useTransform(x, [-100, 100], [-10, 10]),
    springConfig
  );

  const handleMouseMove = (event: any) => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    animationFrameRef.current = requestAnimationFrame(() => {
      const halfWidth = event.target.offsetWidth / 2;
      x.set(event.nativeEvent.offsetX - halfWidth);
    });
  };

  return (
    <div
      className={`relative ${className}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onMouseMove={handleMouseMove}
    >
      <AnimatePresence>
        {isHovered && (
          <motion.div
            initial={{ 
              opacity: 0, 
              y: position === "top" ? 20 : position === "bottom" ? -20 : 0,
              x: position === "left" ? 10 : position === "right" ? -10 : 0,
              scale: 0.6 
            }}
            animate={{
              opacity: 1,
              y: 0,
              x: 0,
              scale: 1,
              transition: {
                type: "spring",
                stiffness: 260,
                damping: 10,
              },
            }}
            exit={{ 
              opacity: 0, 
              y: position === "top" ? 20 : position === "bottom" ? -20 : 0,
              x: position === "left" ? 10 : position === "right" ? -10 : 0,
              scale: 0.6 
            }}
            style={{
              translateX: position === "left" || position === "right" ? 0 : translateX,
              translateY: position === "left" || position === "right" ? 0 : undefined,
              rotate: position === "left" || position === "right" ? 0 : rotate,
              whiteSpace: "nowrap",
            }}
            className={`absolute z-50 flex items-center justify-center rounded-md bg-black px-4 py-2 text-xs shadow-xl pointer-events-none ${
              position === "top" 
                ? "-top-16 -translate-y-2 left-1/2 -translate-x-1/2" 
                : position === "bottom"
                ? "-bottom-16 translate-y-2 left-1/2 -translate-x-1/2"
                : position === "left"
                ? "right-full mr-3 top-1/2 -translate-y-1/2"
                : "left-full ml-3 top-1/2 -translate-y-1/2"
            }`}
          >
            {/* Gradient decorations only for top/bottom tooltips */}
            {(position === "top" || position === "bottom") && (
              <>
                <div className="absolute z-30 inset-x-10 -bottom-px h-px w-[20%] bg-gradient-to-r from-transparent via-emerald-500 to-transparent" />
                <div className="absolute z-30 -bottom-px left-10 h-px w-[40%] bg-gradient-to-r from-transparent via-sky-500 to-transparent" />
              </>
            )}
            <div className="relative z-30 text-base font-bold text-white whitespace-nowrap">
              {content}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      {children}
    </div>
  );
};
