import React from 'react';

interface BrandLogoProps {
  variant?: 'full' | 'compact' | 'icon' | 'white';
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  showSubtitle?: boolean;
}

export const BrandLogo: React.FC<BrandLogoProps> = ({
  variant = 'compact',
  size = 'md',
  className = '',
  showSubtitle = true
}) => {
  // Height mappings for consistent responsive sizing
  const sizeClasses = {
    xs: 'h-7',
    sm: 'h-9',
    md: 'h-11',
    lg: 'h-14',
    xl: 'h-20'
  };

  const isWhite = variant === 'white';
  const greenColor = isWhite ? '#FFFFFF' : '#005A36';
  const tealColor = isWhite ? '#E0F2FE' : '#3B8EAA';
  const leafColor = isWhite ? '#86EFAC' : '#16A34A';
  const leafGradient = isWhite ? '#4ADE80' : '#22C55E';
  const textColor = isWhite ? '#FFFFFF' : '#1E293B';
  const subtextColor = isWhite ? '#CBD5E1' : '#64748B';

  if (variant === 'icon') {
    return (
      <svg
        viewBox="0 0 100 80"
        className={`${sizeClasses[size]} w-auto ${className} select-none`}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="leafGradIcon" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={leafColor} />
            <stop offset="100%" stopColor={leafGradient} />
          </linearGradient>
        </defs>

        {/* Stylized 'B' */}
        <path
          d="M 12 12 H 42 C 54 12 58 24 50 33 C 60 42 56 68 40 68 H 12 V 12 Z M 24 24 V 34 H 38 C 42 34 44 24 38 24 H 24 Z M 24 44 V 56 H 40 C 45 56 46 44 40 44 H 24 Z"
          fill={greenColor}
        />

        {/* Stylized 'M' */}
        <path
          d="M 52 12 H 66 L 76 40 L 86 12 H 98 V 68 H 86 V 34 L 78 56 H 72 L 64 34 V 68 H 52 V 12 Z"
          fill={tealColor}
        />

        {/* Central Shopping Bag */}
        <g transform="translate(32, 18)">
          {/* Handle */}
          <path
            d="M 12 10 C 12 2 24 2 24 10"
            stroke={tealColor}
            strokeWidth="3.5"
            strokeLinecap="round"
            fill="none"
          />
          {/* Bag Body */}
          <polygon
            points="4,10 32,10 36,46 0,46"
            fill="#FFFFFF"
            stroke={tealColor}
            strokeWidth="2.5"
            strokeLinejoin="round"
          />
          {/* Fresh Leaf */}
          <path
            d="M 7 38 C 7 38 7 24 25 16 C 25 16 27 30 14 38 C 10 40 7 38 7 38 Z"
            fill="url(#leafGradIcon)"
          />
          <path
            d="M 10 36 Q 16 28 23 20"
            stroke="#FFFFFF"
            strokeWidth="1.2"
            strokeLinecap="round"
            opacity="0.8"
          />
        </g>
      </svg>
    );
  }

  return (
    <div className={`flex items-center gap-2.5 ${className} select-none`} dir="ltr">
      {/* Emblem SVG */}
      <svg
        viewBox="0 0 100 80"
        className={`${sizeClasses[size]} w-auto shrink-0`}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="leafGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={leafColor} />
            <stop offset="100%" stopColor={leafGradient} />
          </linearGradient>
        </defs>

        {/* Stylized 'B' */}
        <path
          d="M 8 10 H 40 C 52 10 56 22 48 31 C 58 40 54 68 38 68 H 8 V 10 Z M 21 22 V 33 H 36 C 40 33 42 22 36 22 H 21 Z M 21 43 V 56 H 38 C 43 56 44 43 38 43 H 21 Z"
          fill={greenColor}
        />

        {/* Stylized 'M' */}
        <path
          d="M 50 10 H 64 L 75 38 L 85 10 H 98 V 68 H 86 V 32 L 77 54 H 72 L 63 32 V 68 H 50 V 10 Z"
          fill={tealColor}
        />

        {/* Central Shopping Bag */}
        <g transform="translate(30, 16)">
          {/* Handle */}
          <path
            d="M 13 10 C 13 1 27 1 27 10"
            stroke={tealColor}
            strokeWidth="3.5"
            strokeLinecap="round"
            fill="none"
          />
          {/* Bag Body */}
          <polygon
            points="4,10 36,10 40,48 0,48"
            fill="#FFFFFF"
            stroke={tealColor}
            strokeWidth="2.5"
            strokeLinejoin="round"
          />
          {/* Fresh Leaf inside */}
          <path
            d="M 8 40 C 8 40 8 25 28 17 C 28 17 30 32 16 40 C 12 42 8 40 8 40 Z"
            fill="url(#leafGrad)"
          />
          <path
            d="M 11 38 Q 18 29 26 21"
            stroke="#FFFFFF"
            strokeWidth="1.2"
            strokeLinecap="round"
            opacity="0.9"
          />
        </g>
      </svg>

      {/* Brand Text */}
      {variant !== 'icon' && (
        <div className="flex flex-col text-left">
          <div className="flex items-center text-base sm:text-lg font-black tracking-wider leading-none">
            <span style={{ color: greenColor }} className="font-extrabold">BARAKA</span>
            <span style={{ color: tealColor }} className="font-extrabold">MARKT24</span>
          </div>
          {showSubtitle && (
            <div 
              style={{ color: subtextColor }}
              className="text-[9px] sm:text-[10px] font-medium tracking-tight mt-0.5 whitespace-nowrap"
            >
              Arabic & International Products • Greifswald
            </div>
          )}
        </div>
      )}
    </div>
  );
};
