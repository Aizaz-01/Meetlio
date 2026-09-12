'use client';

import React, { useState } from 'react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Clock, Video, Edit, Copy, Check, ExternalLink, Trash2, Power } from 'lucide-react';
import Link from 'next/link';

export interface EventTypeCardProps {
  id: string;
  name: string;
  slug: string;
  duration: number;
  locationType: string;
  locationInfo?: string | null;
  description?: string | null;
  isActive: boolean;
  username: string;
  onEdit?: () => void;
  onDelete?: () => void;
  onToggleActive?: (id: string, newActiveState: boolean) => void;
}

export function EventTypeCard({
  id,
  name,
  slug,
  duration,
  locationType,
  locationInfo,
  description,
  isActive,
  username,
  onEdit,
  onDelete,
  onToggleActive,
}: EventTypeCardProps) {
  const [copied, setCopied] = useState(false);
  const publicUrl = `/booking/${username}/${slug}`;

  const handleCopy = () => {
    const fullUrl = `${window.location.origin}${publicUrl}`;
    navigator.clipboard.writeText(fullUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Card hoverEffect className="flex flex-col justify-between p-6 relative group">
      <div>
        <div className="flex items-start justify-between gap-2 mb-3">
          <div className="flex items-center gap-2">
            <h3 className="text-base font-bold text-slate-900 dark:text-white leading-tight">{name}</h3>
            <button
              onClick={() => onToggleActive && onToggleActive(id, !isActive)}
              title={isActive ? 'Click to deactivate' : 'Click to activate'}
              className="cursor-pointer"
            >
              <Badge variant={isActive ? 'success' : 'neutral'}>
                {isActive ? 'Active' : 'Inactive'}
              </Badge>
            </button>
          </div>
          <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 shrink-0">
            {duration} min
          </span>
        </div>

        {description && (
          <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mb-4">
            {description}
          </p>
        )}

        <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 dark:text-slate-400 mb-4">
          <span className="flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-brand-500" />
            {duration} minutes
          </span>
          <span className="flex items-center gap-1.5">
            <Video className="w-3.5 h-3.5 text-brand-500" />
            {locationType.replace('_', ' ')}
          </span>
        </div>

        <div className="text-[11px] text-slate-400 truncate bg-slate-50 dark:bg-slate-800/60 p-2 rounded-lg mb-4 font-mono">
          meetlio.com/{username}/{slug}
        </div>
      </div>

      <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          <Button variant="outline" size="sm" onClick={onEdit} leftIcon={<Edit className="w-3.5 h-3.5" />}>
            Edit
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleCopy}
            leftIcon={copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
          >
            {copied ? 'Copied' : 'Share'}
          </Button>
        </div>

        <div className="flex items-center gap-1.5">
          <Link href={publicUrl} target="_blank">
            <Button variant="secondary" size="sm" rightIcon={<ExternalLink className="w-3.5 h-3.5" />}>
              Preview
            </Button>
          </Link>
          {onDelete && (
            <button
              onClick={onDelete}
              className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors"
              title="Delete event type"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </Card>
  );
}
