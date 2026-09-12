import React from 'react';
import { MeetlioIcon } from './icon';

interface LogoProps {
  className?: string;
  iconSize?: string;
  showText?: boolean;
}

export function MeetlioLogo({ className = "", iconSize = "w-8 h-8", showText = true }: LogoProps) {
  return (
    <div className={`inline-flex items-center gap-2.5 font-bold tracking-tight text-slate-900 dark:text-white ${className}`}>
      <MeetlioIcon className={iconSize} />
      {showText && (
        <span className="text-xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-slate-900 via-brand-700 to-brand-600 dark:from-white dark:via-brand-300 dark:to-brand-400">
          Meetlio
        </span>
      )}
    </div>
  );
}
