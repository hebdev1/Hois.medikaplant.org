'use client';

import React from 'react';
import { motion, useInView, type Variants } from 'motion/react';

type AnimationVariants = Variants & {
  hidden: Record<string, unknown>;
  visible: (i: number) => Record<string, unknown>;
};

type TimelineContentProps<T extends keyof JSX.IntrinsicElements = 'div'> = {
  as?: T;
  animationNum: number;
  timelineRef: React.RefObject<HTMLElement | null>;
  customVariants: AnimationVariants;
  className?: string;
  children: React.ReactNode;
};

/**
 * Scroll-triggered animation wrapper used by the pricing section.
 * Each child runs the same variants with a per-child custom index
 * (`animationNum`) so the timeline staggers automatically based on
 * the variants' `visible(i)` definition.
 *
 * Lightweight replacement for the missing `@/components/ui/timeline-animation`
 * import in the shadcn pricing demo.
 */
export function TimelineContent<T extends keyof JSX.IntrinsicElements = 'div'>({
  as,
  animationNum,
  timelineRef,
  customVariants,
  className,
  children,
}: TimelineContentProps<T>) {
  const isInView = useInView(timelineRef as React.RefObject<HTMLElement>, {
    once: true,
    amount: 0.15,
  });

  const Comp = motion[(as ?? 'div') as keyof typeof motion] as React.ElementType;

  return (
    <Comp
      custom={animationNum}
      initial="hidden"
      animate={isInView ? 'visible' : 'hidden'}
      variants={customVariants}
      className={className}
    >
      {children}
    </Comp>
  );
}
