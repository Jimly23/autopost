import React from 'react';
import { PostStatus } from '../../types/post';

interface BadgeProps {
  children?: React.ReactNode;
  status?: PostStatus;
  variant?: 'slate' | 'blue' | 'emerald' | 'amber' | 'rose' | 'purple';
  size?: 'sm' | 'md';
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  status,
  variant,
  size = 'md',
  className = '',
}) => {
  let computedVariant = variant || 'slate';

  if (status) {
    switch (status) {
      case 'published':
        computedVariant = 'emerald';
        break;
      case 'scheduled':
        computedVariant = 'blue';
        break;
      case 'draft':
        computedVariant = 'slate';
        break;
      case 'processing':
        computedVariant = 'amber';
        break;
      case 'failed':
        computedVariant = 'rose';
        break;
      case 'cancelled':
        computedVariant = 'purple';
        break;
    }
  }

  const variantStyles = {
    slate: 'bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 border-slate-200 dark:border-white/10',
    blue: 'bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-500/20',
    emerald: 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20',
    amber: 'bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-500/20',
    rose: 'bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-500/20',
    purple: 'bg-purple-50 dark:bg-purple-500/10 text-purple-700 dark:text-purple-400 border-purple-200 dark:border-purple-500/20',
  };

  const sizeStyles = {
    sm: 'text-[10px] px-2 py-0.5 font-medium',
    md: 'text-xs px-2.5 py-1 font-medium',
  };

  const displayText = children || (status ? status.charAt(0).toUpperCase() + status.slice(1) : '');

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border ${sizeStyles[size]} ${variantStyles[computedVariant]} ${className}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${
        computedVariant === 'emerald' ? 'bg-emerald-500' :
        computedVariant === 'blue' ? 'bg-blue-500' :
        computedVariant === 'amber' ? 'bg-amber-500' :
        computedVariant === 'rose' ? 'bg-rose-500' :
        computedVariant === 'purple' ? 'bg-purple-500' : 'bg-slate-400'
      }`} />
      {displayText}
    </span>
  );
};
