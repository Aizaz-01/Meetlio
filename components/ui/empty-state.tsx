import React from 'react';
import { CalendarX } from 'lucide-react';
import { Button } from './button';

export interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  action?: React.ReactNode;
  className?: string;
}

export function EmptyState({
  icon = <CalendarX className="w-12 h-12 text-slate-400" />,
  title,
  description,
  actionLabel,
  onAction,
  action,
  className = '',
}: EmptyStateProps) {
  return (
    <div className={`flex flex-col items-center justify-center text-center p-8 sm:p-12 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl ${className}`}>
      <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-full mb-4">{icon}</div>
      <h4 className="text-lg font-bold text-slate-900 dark:text-white">{title}</h4>
      <p className="text-sm text-slate-500 dark:text-slate-400 max-w-sm mt-1 mb-6">{description}</p>
      {action ? (
        action
      ) : (
        actionLabel && onAction && (
          <Button variant="primary" onClick={onAction}>
            {actionLabel}
          </Button>
        )
      )}
    </div>
  );
}
