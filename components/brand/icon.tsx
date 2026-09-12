import React from 'react';

export function MeetlioIcon({ className = "w-8 h-8", ...props }: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      {...props}
    >
      <rect width="40" height="40" rx="10" className="fill-brand-600 dark:fill-brand-500" />
      {/* Calendar Grid & Pulse Dot Graphic */}
      <path
        d="M12 14C12 12.8954 12.8954 12 14 12H26C27.1046 12 28 12.8954 28 14V26C28 27.1046 27.1046 28 26 28H14C12.8954 28 12 27.1046 12 26V14Z"
        fill="white"
        fillOpacity="0.2"
      />
      <path
        d="M11 16H29"
        stroke="white"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <circle cx="16" cy="21" r="2" fill="white" />
      <circle cx="24" cy="21" r="2" fill="white" />
      <circle cx="20" cy="25" r="2" fill="#F43F5E" />
    </svg>
  );
}
