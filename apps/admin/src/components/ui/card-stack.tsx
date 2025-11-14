"use client";

/**
 * @author: @dorian_baffier (adapted from KokonutUI)
 * @description: Card Stack - Stack of cards that expand on click
 * @version: 1.0.0
 * @license: MIT
 * @website: https://kokonutui.com
 */

import React, { useRef } from "react";
import { motion, useScroll, useTransform, MotionValue, useSpring } from "framer-motion";
import { cn } from "@/lib/utils";

interface CardItemProps {
  children: React.ReactNode;
  index: number;
  totalCards: number;
  spreadProgress: MotionValue<number>;
}

function CardItem({ children, index, totalCards, spreadProgress }: CardItemProps) {
  // Calculate center offset based on total cards
  const centerOffset = (totalCards - 1) * 5;

  // Initial stacked position - centered with slight overlap
  const defaultX = index * 10 - centerOffset;
  const defaultY = index * 2;
  const defaultRotate = index * 1.5;

  // Use viewport-based card width that scales proportionally
  // Base width: 520px max on xl screens, scales down proportionally
  // This matches the CSS max-width of 520px
  const baseCardWidth = 520;
  const baseCardOverlap = 470; // ~90% overlap for smoother fan effect
  
  // Calculate proportional card width based on container
  // We'll use CSS clamp to scale between min and max widths
  const cardWidth = baseCardWidth;
  const cardOverlap = baseCardOverlap;
  const totalExpandedWidth =
    cardWidth + (totalCards - 1) * (cardWidth - cardOverlap);
  const expandedCenterOffset = totalExpandedWidth / 2;

  // Fanned out position - centered spread with overlap
  const maxSpreadX =
    index * (cardWidth - cardOverlap) -
    expandedCenterOffset +
    cardWidth / 2;
  const maxSpreadY = 0;
  const maxSpreadRotate = index * 3 - (totalCards - 1) * 1.5;

  const xTransform = useTransform(spreadProgress, (progress) => {
    return defaultX + (maxSpreadX - defaultX) * progress;
  });
  const yTransform = useTransform(spreadProgress, (progress) => {
    return defaultY + (maxSpreadY - defaultY) * progress;
  });
  const rotateTransform = useTransform(spreadProgress, (progress) => {
    return defaultRotate + (maxSpreadRotate - defaultRotate) * progress;
  });

  return (
    <motion.div
      style={{
        x: xTransform,
        y: yTransform,
        rotate: rotateTransform,
        zIndex: totalCards - index,
        transformStyle: "preserve-3d",
        perspective: "2000px",
        left: "50%",
      }}
      className={cn(
        "absolute rounded-2xl",
        "transform-gpu overflow-hidden",
        // Fixed sizes at breakpoints for predictable scaling
        "w-[280px] -ml-[140px]",
        "sm:w-[320px] sm:-ml-[160px]",
        "md:w-[380px] md:-ml-[190px]",
        "lg:w-[480px] lg:-ml-[240px]",
        "xl:w-[520px] xl:-ml-[260px]",
        "aspect-[5/7.5]"
      )}
    >
      {children}
    </motion.div>
  );
}

interface CardStackProps {
  children: React.ReactNode;
  className?: string;
}

export function CardStack({ children, className = "" }: CardStackProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const childrenArray = React.Children.toArray(children);
  const totalCards = childrenArray.length;

  // Use scroll position to determine spread
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"]
  });

  // Transform scroll progress: cards spread as you scroll down, stay spread, reclose when scrolling up
  // Map [0, 0.5, 1] to [0, 0.5, 0.5] so cards stay spread when scrolling past the section
  const spreadProgress = useSpring(
    useTransform(scrollYProgress, [0, 0.5, 1], [0, 0.5, 0.5]),
    {
      stiffness: 100,
      damping: 30,
    }
  );

  return (
    <div
      ref={containerRef}
      className={cn(
        "relative mx-auto",
        // Scale height proportionally with width using aspect ratio
        // Base aspect ratio maintains proportions as width changes
        "w-full max-w-[95vw] md:max-w-[1100px] lg:max-w-[1200px] xl:max-w-[1400px]",
        "aspect-[2/1.5] min-h-[400px]",
        "sm:min-h-[450px] md:min-h-[500px] lg:min-h-[550px]",
        "max-h-[600px] lg:max-h-[700px]",
        "flex items-center justify-center",
        className
      )}
    >
      {childrenArray.map((child, index) => (
        <CardItem
          key={index}
          index={index}
          totalCards={totalCards}
          spreadProgress={spreadProgress}
        >
          {child}
        </CardItem>
      ))}
    </div>
  );
}
