'use client';

// Animated badge/chip. Adapted from a generic dark badge to the Hoïs palette
// (forest / gold / green / amber / rose) and wired to the project's `motion`
// package (motion/react) rather than framer-motion. Used as a CMS page block
// ("Badj") and for status chips in the admin builder UI.

import React from 'react';
import { cn } from '@/lib/utils';
import { motion } from 'motion/react';
import { X, Loader2 } from 'lucide-react';

export type BadgeVariant = 'primary' | 'secondary' | 'success' | 'warning' | 'error';
export type BadgeAppearance = 'solid' | 'outline' | 'subtle';

type BadgeProps = {
  label: string;
  variant?: BadgeVariant;
  size?: 'small' | 'medium' | 'large';
  icon?: React.ReactNode;
  onClick?: () => void;
  removable?: boolean;
  className?: string;
  maxWidth?: string | number;
  appearance?: BadgeAppearance;
  onRemove?: () => void;
  isLoading?: boolean;
};

const VARIANT_STYLES: Record<BadgeVariant, Record<BadgeAppearance, string>> = {
  primary: {
    solid: 'bg-forest-700 text-white',
    outline: 'border-2 border-forest-700 text-forest-700',
    subtle: 'bg-forest-50 text-forest-800',
  },
  secondary: {
    solid: 'bg-gold-400 text-white',
    outline: 'border-2 border-gold-400 text-gold-700',
    subtle: 'bg-gold-100 text-gold-700',
  },
  success: {
    solid: 'bg-green-600 text-white',
    outline: 'border-2 border-green-600 text-green-700',
    subtle: 'bg-green-100 text-green-700',
  },
  warning: {
    solid: 'bg-amber-500 text-white',
    outline: 'border-2 border-amber-500 text-amber-600',
    subtle: 'bg-amber-100 text-amber-700',
  },
  error: {
    solid: 'bg-rose-600 text-white',
    outline: 'border-2 border-rose-600 text-rose-700',
    subtle: 'bg-rose-100 text-rose-700',
  },
};

const SIZE_STYLES = {
  small: 'text-xs px-2 py-0.5',
  medium: 'text-sm px-3 py-1',
  large: 'text-base px-4 py-1.5',
} as const;

export const Badge = ({
  label,
  variant = 'primary',
  size = 'medium',
  icon,
  onClick,
  removable = false,
  className,
  maxWidth,
  appearance = 'solid',
  onRemove,
  isLoading = false,
}: BadgeProps) => {
  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onClick?.();
  };

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    onRemove?.();
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96, y: 6 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      whileHover={onClick ? { scale: 1.04 } : undefined}
      onClick={handleClick}
      style={{ maxWidth }}
      className={cn(
        'rounded-full font-semibold shadow-sm inline-flex items-center gap-1.5',
        VARIANT_STYLES[variant][appearance],
        SIZE_STYLES[size],
        onClick && 'cursor-pointer',
        className
      )}
    >
      {isLoading ? (
        <motion.span
          animate={{ rotate: 360 }}
          transition={{ duration: 1, ease: 'linear', repeat: Infinity }}
          className="flex-shrink-0"
        >
          <Loader2 className="h-3.5 w-3.5" />
        </motion.span>
      ) : (
        icon && <span className="flex-shrink-0">{icon}</span>
      )}
      <span className="truncate">{label}</span>
      {removable && (
        <button
          type="button"
          aria-label="Retire"
          className="ml-0.5 grid place-items-center rounded-full p-0.5 opacity-70 hover:opacity-100 hover:bg-black/10 transition"
          onClick={handleRemove}
        >
          <X className="h-3.5 w-3.5" />
        </button>
      )}
    </motion.div>
  );
};

export default Badge;
