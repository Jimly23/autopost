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
    slate: 'bg-slate-100 text-slate-700 border-slate-200',
    blue: 'bg-blue-50 text-blue-700 border-blue-200',
    emerald: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    amber: 'bg-amber-50 text-amber-700 border-amber-200',
    rose: 'bg-rose-50 text-rose-700 border-rose-200',
    purple: 'bg-purple-50 text-purple-700 border-purple-200',
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
