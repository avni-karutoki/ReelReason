import React from 'react';
import { motion, type Variants } from 'motion/react';
import { useLocation } from 'react-router-dom';

const STUDIO_EASE = [0.16, 1, 0.3, 1] as const;

/* ------------------------------------------------------------------ */
/* Reveal — fades/slides content in the first time it scrolls into view */
/* ------------------------------------------------------------------ */

interface RevealProps {
  children: React.ReactNode;
  className?: string;
  /** Seconds to wait before starting the animation */
  delay?: number;
  /** Vertical distance (px) the element rises from */
  y?: number;
  /** Horizontal distance (px) to slide from */
  x?: number;
  /** Initial scale */
  scale?: number;
  /** Only animate the first time it enters the viewport */
  once?: boolean;
}

export const Reveal: React.FC<RevealProps> = ({
  children,
  className,
  delay = 0,
  y = 24,
  x = 0,
  scale,
  once = true,
}) => (
  <motion.div
    className={className}
    initial={{ opacity: 0, y, x, ...(scale !== undefined ? { scale } : {}) }}
    whileInView={{ opacity: 1, y: 0, x: 0, ...(scale !== undefined ? { scale: 1 } : {}) }}
    viewport={{ once, margin: '-40px' }}
    transition={{ duration: 0.55, delay, ease: STUDIO_EASE }}
  >
    {children}
  </motion.div>
);

/* ------------------------------------------------------------------ */
/* Staggered groups — children reveal one after another while entering  */
/* ------------------------------------------------------------------ */

export const staggerContainer: Variants = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.09, delayChildren: 0.08 },
  },
};

export const staggerItem: Variants = {
  hidden: { opacity: 0, y: 22 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: STUDIO_EASE },
  },
};

/** Wraps a grid/list and staggers its <StaggerItem> children on scroll into view. */
export const StaggerGroup: React.FC<{
  children: React.ReactNode;
  className?: string;
  /** Stagger interval between children (seconds) */
  interval?: number;
  once?: boolean;
}> = ({ children, className, interval = 0.09, once = true }) => (
  <motion.div
    className={className}
    variants={staggerContainer}
    initial="hidden"
    whileInView="show"
    viewport={{ once, margin: '-40px' }}
    transition={{ staggerChildren: interval }}
  >
    {children}
  </motion.div>
);

/** Wrap each child of a <StaggerGroup> with this to give it the reveal treatment. */
export const StaggerItem: React.FC<{
  children: React.ReactNode;
  className?: string;
}> = ({ children, className }) => (
  <motion.div className={className} variants={staggerItem}>
    {children}
  </motion.div>
);

/* ------------------------------------------------------------------ */
/* Page transition — every route fades/slides in on navigation          */
/* ------------------------------------------------------------------ */
export const PageFade: React.FC<{
  children: React.ReactNode;
  className?: string;
}> = ({ children, className }) => {
  const { pathname } = useLocation();
  return (
    <motion.div
      // Re-key on navigation so the enter animation replays on every route change
      key={pathname}
      className={className}
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: STUDIO_EASE }}
    >
      {children}
    </motion.div>
  );
};
