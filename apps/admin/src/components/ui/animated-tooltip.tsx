"use client";
import {
  motion,
  AnimatePresence,
  useMotionValue,
  useSpring,
  useTransform,
} from "framer-motion";
import React, { useState } from "react";

// Avatar-style tooltip for multiple items
export const AnimatedTooltip = ({
  items,
}: {
  items: {
    id: number;
    name: string;
    designation?: string;
    image?: string;
  }[];
}) => {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const springConfig = { stiffness: 100, damping: 5 };
  const x = useMotionValue(0);

  const rotate = useSpring(
    useTransform(x, [-100, 100], [-45, 45]),
    springConfig
  );
  const translateX = useSpring(
    useTransform(x, [-100, 100], [-50, 50]),
    springConfig
  );

  const handleMouseMove = (event: any) => {
    const halfWidth = event.target.offsetWidth / 2;
    x.set(event.nativeEvent.offsetX - halfWidth);
  };

  return (
    <>
      {items.map((item) => (
        <div
          className="-mr-4 relative group"
          key={item.id}
          onMouseEnter={() => setHoveredIndex(item.id)}
          onMouseLeave={() => setHoveredIndex(null)}
        >
          <AnimatePresence mode="popLayout">
            {hoveredIndex === item.id && (
              <motion.div
                initial={{ opacity: 0, y: 20, scale: 0.6 }}
                animate={{
                  opacity: 1,
                  y: 0,
                  scale: 1,
                  transition: {
                    type: "spring",
                    stiffness: 260,
                    damping: 10,
                  },
                }}
                exit={{ opacity: 0, y: 20, scale: 0.6 }}
                style={{
                  translateX: translateX,
                  rotate: rotate,
                  whiteSpace: "nowrap",
                }}
                className="absolute -top-16 -left-1/2 translate-x-1/2 flex text-xs flex-col items-center justify-center rounded-md bg-black z-50 shadow-xl px-4 py-2"
              >
                <div className="absolute inset-x-10 z-30 w-[20%] -bottom-px bg-gradient-to-r from-transparent via-emerald-500 to-transparent h-px" />
                <div className="absolute left-10 w-[40%] z-30 -bottom-px bg-gradient-to-r from-transparent via-sky-500 to-transparent h-px" />
                <div className="font-bold text-white relative z-30 text-base">
                  {item.name}
                </div>
                {item.designation && (
                  <div className="text-white text-xs">{item.designation}</div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
          {item.image ? (
            <img
              onMouseMove={handleMouseMove}
              height={100}
              width={100}
              src={item.image}
              alt={item.name}
              className="object-cover !m-0 !p-0 object-top rounded-full h-14 w-14 border-2 group-hover:scale-105 group-hover:z-30 border-white relative transition duration-500"
            />
          ) : (
            <div
              onMouseMove={handleMouseMove}
              className="object-cover !m-0 !p-0 object-top rounded-full h-14 w-14 border-2 group-hover:scale-105 group-hover:z-30 border-white relative transition duration-500 bg-black flex items-center justify-center text-white font-bold text-xl"
            >
              {item.name.charAt(0)}
            </div>
          )}
        </div>
      ))}
    </>
  );
};

// Simple tooltip wrapper for single string content
export const SimpleAnimatedTooltip = ({
  content,
  children,
  position = "top",
  offsetX = 0,
  offsetY = 0,
}: {
  content: string;
  children: React.ReactNode;
  position?: "top" | "bottom" | "left" | "right";
  offsetX?: number;
  offsetY?: number;
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [tooltipStyle, setTooltipStyle] = useState<React.CSSProperties>({});
  const tooltipRef = React.useRef<HTMLDivElement>(null);
  const containerRef = React.useRef<HTMLDivElement>(null);
  const springConfig = { stiffness: 260, damping: 10 };
  const x = useMotionValue(0);

  const rotate = useSpring(
    useTransform(x, [-100, 100], [-10, 10]),
    springConfig
  );

  const handleMouseMove = (event: React.MouseEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const halfWidth = rect.width / 2;
    x.set(event.clientX - rect.left - halfWidth);
  };

  // Calculate position to prevent clipping
  const calculatePosition = React.useCallback(() => {
    if (!isHovered || !tooltipRef.current || !containerRef.current) return;
    
    const tooltip = tooltipRef.current;
    const container = containerRef.current;
    const tooltipRect = tooltip.getBoundingClientRect();
    const containerRect = container.getBoundingClientRect();
    
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const padding = 10; // Padding from edges
    const gap = 12; // Gap between tooltip and trigger
    
    let finalLeft = containerRect.left + containerRect.width / 2 - tooltipRect.width / 2;
    let finalTop = 0;
    
    // Calculate vertical position based on preferred position
    if (position === "top" || position === "bottom") {
      if (position === "top") {
        finalTop = containerRect.top - tooltipRect.height - gap + offsetY;
        // Check if tooltip would clip top
        if (finalTop < padding) {
          // Flip to bottom
          finalTop = containerRect.bottom + gap + offsetY;
        }
      } else {
        finalTop = containerRect.bottom + gap + offsetY;
        // Check if tooltip would clip bottom
        if (finalTop + tooltipRect.height > viewportHeight - padding) {
          // Flip to top
          finalTop = containerRect.top - tooltipRect.height - gap + offsetY;
        }
      }
      
      // Apply horizontal offset
      finalLeft += offsetX;
      
      // Adjust horizontal position to prevent clipping
      if (finalLeft < padding) {
        finalLeft = padding;
      } else if (finalLeft + tooltipRect.width > viewportWidth - padding) {
        finalLeft = viewportWidth - tooltipRect.width - padding;
      }
    } else if (position === "left" || position === "right") {
      // Handle left/right positioning
      finalTop = containerRect.top + containerRect.height / 2 - tooltipRect.height / 2 + offsetY;
      
      if (position === "left") {
        finalLeft = containerRect.left - tooltipRect.width - gap + offsetX;
        // Check if would clip left
        if (finalLeft < padding) {
          // Flip to right
          finalLeft = containerRect.right + gap + offsetX;
        }
      } else {
        finalLeft = containerRect.right + gap + offsetX;
        // Check if would clip right
        if (finalLeft + tooltipRect.width > viewportWidth - padding) {
          // Flip to left
          finalLeft = containerRect.left - tooltipRect.width - gap + offsetX;
        }
      }
      
      // Adjust vertical position to prevent clipping
      if (finalTop < padding) {
        finalTop = padding;
      } else if (finalTop + tooltipRect.height > viewportHeight - padding) {
        finalTop = viewportHeight - tooltipRect.height - padding;
      }
    }
    
    setTooltipStyle({
      left: `${finalLeft}px`,
      top: `${finalTop}px`,
    });
  }, [isHovered, position, offsetX, offsetY]);

  React.useEffect(() => {
    calculatePosition();
  }, [calculatePosition]);

  // Recalculate position on scroll to fix glitchiness with scrollable container
  React.useEffect(() => {
    if (!isHovered) return;

    const handleScroll = () => {
      // Use requestAnimationFrame to debounce and smooth out position updates
      requestAnimationFrame(() => {
        calculatePosition();
      });
    };

    // Listen to scroll events on window and all parent elements (capture phase)
    window.addEventListener('scroll', handleScroll, true);
    // Also listen to resize in case viewport changes
    window.addEventListener('resize', handleScroll);
    
    return () => {
      window.removeEventListener('scroll', handleScroll, true);
      window.removeEventListener('resize', handleScroll);
    };
  }, [isHovered, calculatePosition]);

  return (
    <div
      ref={containerRef}
      className="relative"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onMouseMove={handleMouseMove}
      style={{ zIndex: isHovered ? 9999 : 1 }}
    >
      <AnimatePresence mode="popLayout">
        {isHovered && (
          <motion.div
            ref={tooltipRef}
            initial={{ opacity: 0, y: position === "top" ? 10 : -10, scale: 0.6 }}
            animate={{
              opacity: 1,
              y: 0,
              scale: 1,
              transition: {
                type: "spring",
                stiffness: 260,
                damping: 10,
              },
            }}
            exit={{ opacity: 0, y: position === "top" ? 10 : -10, scale: 0.6 }}
            style={{
              rotate: rotate,
              whiteSpace: "nowrap",
              position: "fixed",
              ...tooltipStyle,
            }}
            className="flex flex-col items-center justify-center rounded-lg bg-black/95 backdrop-blur-sm z-[99999] shadow-xl px-4 py-2.5 pointer-events-none border border-white/10"
          >
            <div className="font-medium text-white relative text-base">
              {content}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      {children}
    </div>
  );
};

