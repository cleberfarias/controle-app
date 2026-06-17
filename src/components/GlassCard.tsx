import React from 'react';
import { motion } from 'framer-motion';

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  hover3d?: boolean;
  style?: React.CSSProperties;
}

export const GlassCard: React.FC<GlassCardProps> = ({ children, className = '', delay = 0, hover3d = true, style }) => {
  return (
    <motion.div
      className={`glass-card ${className}`}
      initial={{ opacity: 0, y: 30, rotateX: -5 }}
      animate={{ opacity: 1, y: 0, rotateX: 0 }}
      transition={{ duration: 0.6, delay, ease: [0.16, 1, 0.3, 1] }}
      whileHover={hover3d ? {
        y: -6,
        rotateX: 2,
        rotateY: -2,
        scale: 1.02,
        boxShadow: '0 25px 60px rgba(0,0,0,0.15), 0 0 40px rgba(99,102,241,0.08)',
        transition: { duration: 0.3 }
      } : undefined}
      style={{ perspective: 1000, transformStyle: 'preserve-3d', ...style }}
    >
      {children}
    </motion.div>
  );
};
