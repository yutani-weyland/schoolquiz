import React from "react";
import { motion } from "framer-motion";
import { springs } from "../motion";

interface CardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
}

export const Card: React.FC<CardProps> = ({
  children,
  className = "",
  hover = true
}) => {
  const baseClasses = "bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm";
  
  return (
    <motion.div
      className={`${baseClasses} ${className}`}
      whileHover={hover ? { scale: 1.02, boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1)" } : undefined}
      transition={springs.micro}
    >
      {children}
    </motion.div>
  );
};
