import React from 'react';
import type { PlatformId, PostStatus } from '../types/workspace';
import { PLATFORM_SPECS } from '../utils/scheduler';
import { CheckCircle2, Clock, AlertCircle, FileEdit, Send } from 'lucide-react';

interface PlatformIconProps {
  platform: PlatformId;
  size?: number;
  showLabel?: boolean;
  className?: string;
}

export const PlatformIcon: React.FC<PlatformIconProps> = ({
  platform,
  size = 15,
  showLabel = false,
  className = '',
}) => {
  const spec = PLATFORM_SPECS[platform];

  const renderSvg = () => {
    switch (platform) {
      case 'linkedin':
        return (
          <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.88 8.56a1.68 1.68 0 0 0 1.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 0 0-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37h2.77z" />
          </svg>
        );
      case 'instagram':
        return (
          <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
            <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
            <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
          </svg>
        );
      case 'facebook':
        return (
          <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M12 2C6.477 2 2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.879V14.89h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.989C18.343 21.129 22 16.99 22 12c0-5.523-4.477-10-10-10z" />
          </svg>
        );
      case 'x':
        return (
          <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
          </svg>
        );
      case 'youtube':
        return (
          <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
          </svg>
        );
      case 'pinterest':
        return (
          <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M12 2C6.477 2 2 6.477 2 12c0 4.237 2.636 7.855 6.356 9.312-.088-.791-.167-2.005.035-2.868.181-.78 1.172-4.97 1.172-4.97s-.299-.6-.299-1.486c0-1.39.806-2.428 1.81-2.428.852 0 1.264.64 1.264 1.408 0 .858-.546 2.14-.828 3.33-.236.995.5 1.807 1.48 1.807 1.778 0 3.144-1.874 3.144-4.58 0-2.393-1.72-4.068-4.176-4.068-2.845 0-4.516 2.135-4.516 4.34 0 .859.331 1.781.745 2.281a.3.3 0 0 1 .069.288l-.278 1.133c-.044.183-.145.223-.335.134-1.249-.581-2.03-2.407-2.03-3.874 0-3.154 2.292-6.052 6.608-6.052 3.469 0 6.165 2.473 6.165 5.776 0 3.447-2.173 6.22-5.19 6.22-1.013 0-1.965-.525-2.291-1.148l-.623 2.378c-.226.869-.835 1.958-1.244 2.621.937.29 1.931.446 2.962.446 5.523 0 10-4.477 10-10S17.523 2 12 2z" />
          </svg>
        );
      case 'tiktok':
        return (
          <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z" />
          </svg>
        );
    }
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 whitespace-nowrap shrink-0 ${className}`}
      title={spec.label}
    >
      <span
        className="inline-flex items-center justify-center text-slate-700 dark:text-slate-200"
        style={{ color: platform === 'x' || platform === 'tiktok' ? undefined : spec.brandHex }}
      >
        {renderSvg()}
      </span>
      {showLabel && <span className="text-xs font-medium">{spec.label}</span>}
    </span>
  );
};

export const StatusLabel: React.FC<{ status: PostStatus }> = ({ status }) => {
  switch (status) {
    case 'Published':
      return (
        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-700 dark:text-emerald-400 whitespace-nowrap shrink-0">
          <CheckCircle2 className="w-3.5 h-3.5" aria-hidden="true" />
          Published
        </span>
      );
    case 'Scheduled':
      return (
        <span className="inline-flex items-center gap-1.5 text-xs font-medium brand-accent-text whitespace-nowrap shrink-0">
          <Clock className="w-3.5 h-3.5" aria-hidden="true" />
          Scheduled
        </span>
      );
    case 'Approved':
      return (
        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-700 dark:text-emerald-400 whitespace-nowrap shrink-0">
          <CheckCircle2 className="w-3.5 h-3.5" aria-hidden="true" />
          Approved
        </span>
      );
    case 'In Review':
      return (
        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-amber-700 dark:text-amber-400 whitespace-nowrap shrink-0">
          <Send className="w-3.5 h-3.5" aria-hidden="true" />
          In Review
        </span>
      );
    case 'Changes Requested':
      return (
        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-rose-700 dark:text-rose-400 whitespace-nowrap shrink-0">
          <AlertCircle className="w-3.5 h-3.5" aria-hidden="true" />
          Changes Requested
        </span>
      );
    case 'Draft':
    default:
      return (
        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 dark:text-slate-400 whitespace-nowrap shrink-0">
          <FileEdit className="w-3.5 h-3.5" aria-hidden="true" />
          Draft
        </span>
      );
  }
};
