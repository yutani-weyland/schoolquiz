import { Variants } from "framer-motion";

// Motion presets for consistent animations
export const motionPreset = {
  fadeInUp: (stagger = 0.1, delay = 0): Variants => ({
    hidden: { opacity: 0, y: 10 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.18,
        ease: [0.22, 1, 0.36, 1],
        delay
      }
    }
  }),
  
  fadeIn: (delay = 0): Variants => ({
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        duration: 0.18,
        ease: [0.22, 1, 0.36, 1],
        delay
      }
    }
  }),

  scaleIn: (delay = 0): Variants => ({
    hidden: { opacity: 0, scale: 0.98 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: {
        duration: 0.22,
        ease: [0.22, 1, 0.36, 1],
        delay
      }
    }
  }),

  slideIn: (direction: "left" | "right" | "up" | "down", delay = 0): Variants => {
    const directions = {
      left: { x: -20, y: 0 },
      right: { x: 20, y: 0 },
      up: { x: 0, y: 20 },
      down: { x: 0, y: -20 }
    };
    
    return {
      hidden: { opacity: 0, ...directions[direction] },
      visible: {
        opacity: 1,
        x: 0,
        y: 0,
        transition: {
          duration: 0.18,
          ease: [0.22, 1, 0.36, 1],
          delay
        }
      }
    };
  }
};

// Spring configurations for micro-interactions
export const springs = {
  micro: { type: "spring" as const, stiffness: 380, damping: 28, mass: 0.8 },
  gentle: { type: "spring" as const, stiffness: 200, damping: 25, mass: 1 },
  snappy: { type: "spring" as const, stiffness: 500, damping: 30, mass: 0.5 }
};

// Transition presets
export const transitions = {
  fast: { duration: 0.18, ease: [0.22, 1, 0.36, 1] },
  medium: { duration: 0.24, ease: [0.22, 1, 0.36, 1] },
  slow: { duration: 0.4, ease: [0.22, 1, 0.36, 1] },
  easeOut: { duration: 0.22, ease: [0.22, 1, 0.36, 1] },
  easeInOut: { duration: 0.24, ease: [0.45, 0, 0.40, 1] }
};

// Stagger utilities
export const stagger = {
  container: (delay = 0) => ({
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: delay
      }
    }
  }),
  
  item: {
    hidden: { opacity: 0, y: 10 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.18,
        ease: [0.22, 1, 0.36, 1]
      }
    }
  }
};
