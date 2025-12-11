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
  // Right leaning: positive rotation (cards lean to the right like a deck) - increased angle to match design
  const defaultRotate = index * 1.2;

  // Use viewport-based card width that scales proportionally
  // Base width: 380px max on xl/2xl screens, scales down proportionally
  // This matches the CSS max-width of 380px
  const baseCardWidth = 380;
  const baseCardOverlap = 340; // ~90% overlap for smoother fan effect
  
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
  const maxSpreadY = -index * 3; // Slight upward angle as cards fan out
  // Right leaning spread: positive rotation - increased angle to match design
  const maxSpreadRotate = index * 2.5 - (totalCards - 1) * 1.25;

  const xTransform = useTransform(spreadProgress, (progress) => {
    return defaultX + (maxSpreadX - defaultX) * progress;
  });
  const yTransform = useTransform(spreadProgress, (progress) => {
    return defaultY + (maxSpreadY - defaultY) * progress;
  });
  const rotateTransform = useTransform(spreadProgress, (progress) => {
    return defaultRotate + (maxSpreadRotate - defaultRotate) * progress;
  });

  // Reverse z-index so last card (index = totalCards - 1) is on top
  // Last card should have highest z-index
  const zIndex = index + 1;
  
  return (
    <motion.div
      style={{
        x: xTransform,
        y: yTransform,
        rotate: rotateTransform,
        zIndex: zIndex,
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
        "lg:w-[400px] lg:-ml-[200px]",
        "xl:w-[380px] xl:-ml-[190px]",
        "2xl:w-[380px] 2xl:-ml-[190px]",
        "aspect-[3/4]"
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
        "w-full max-w-[95vw] md:max-w-[1000px] lg:max-w-[1050px] xl:max-w-[1100px] 2xl:max-w-[1100px]",
        "aspect-[2/1.2] min-h-[340px]",
        "sm:min-h-[380px] md:min-h-[420px] lg:min-h-[440px]",
        "max-h-[500px] lg:max-h-[520px] xl:max-h-[500px]",
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
