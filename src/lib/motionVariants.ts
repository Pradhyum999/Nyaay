/**
 * Shared Framer Motion animation variants for NYAAYNEETI
 * Spring physics tuned for premium mobile feel.
 */

export const SPRING_GENTLE = { type: 'spring', stiffness: 320, damping: 28 };
export const SPRING_SNAPPY = { type: 'spring', stiffness: 500, damping: 35 };
export const SPRING_BOUNCY = { type: 'spring', stiffness: 420, damping: 22 };

/** Standard card stagger container */
export const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.06,
      delayChildren: 0.05,
    },
  },
};

/** Standard item that slides up with fade */
export const itemVariants = {
  hidden: { opacity: 0, y: 18, scale: 0.97 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: SPRING_GENTLE,
  },
};

/** Slide-up from bottom (for bottom sheets / modals) */
export const slideUpVariants = {
  hidden: { opacity: 0, y: 60 },
  visible: {
    opacity: 1,
    y: 0,
    transition: SPRING_GENTLE,
  },
  exit: {
    opacity: 0,
    y: 40,
    transition: { duration: 0.18, ease: 'easeIn' },
  },
};

/** Fade + scale for overlay backdrops */
export const backdropVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.2 } },
  exit: { opacity: 0, transition: { duration: 0.15 } },
};

/** Chat bubble slide-in from left */
export const bubbleLeftVariants = {
  hidden: { opacity: 0, x: -16, scale: 0.94 },
  visible: {
    opacity: 1,
    x: 0,
    scale: 1,
    transition: SPRING_GENTLE,
  },
};

/** Chat bubble slide-in from right */
export const bubbleRightVariants = {
  hidden: { opacity: 0, x: 16, scale: 0.94 },
  visible: {
    opacity: 1,
    x: 0,
    scale: 1,
    transition: SPRING_GENTLE,
  },
};

/** Page transition — slide left (forward) */
export const pageForwardVariants = {
  hidden: { opacity: 0, x: 40 },
  visible: { opacity: 1, x: 0, transition: SPRING_GENTLE },
  exit: { opacity: 0, x: -40, transition: { duration: 0.15, ease: 'easeIn' } },
};

/** Page transition — slide right (back) */
export const pageBackVariants = {
  hidden: { opacity: 0, x: -40 },
  visible: { opacity: 1, x: 0, transition: SPRING_GENTLE },
  exit: { opacity: 0, x: 40, transition: { duration: 0.15, ease: 'easeIn' } },
};

/** Scale pop for badges / notifications */
export const badgePopVariants = {
  hidden: { scale: 0, opacity: 0 },
  visible: {
    scale: 1,
    opacity: 1,
    transition: SPRING_BOUNCY,
  },
  exit: { scale: 0, opacity: 0, transition: { duration: 0.1 } },
};

/** Stagger for in-view cards (Lawyer Directory, Chat Inbox) */
export const scrollStaggerContainer = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.07,
    },
  },
};

export const scrollStaggerItem = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: SPRING_GENTLE,
  },
};

