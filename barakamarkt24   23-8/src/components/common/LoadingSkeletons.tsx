import React from 'react';

/**
 * Grid Product Card Skeleton
 */
export const ProductCardSkeleton: React.FC<{ count?: number }> = ({ count = 4 }) => {
  return (
    <>
      {Array.from({ length: count }).map((_, idx) => (
        <div 
          key={idx}
          className="bg-white rounded-2xl border border-stone-100 p-3 flex flex-col justify-between overflow-hidden shadow-2xs animate-pulse"
        >
          {/* Image skeleton */}
          <div className="w-full aspect-square bg-stone-200/70 rounded-xl mb-3" />
          
          {/* Metadata skeleton */}
          <div className="space-y-2">
            <div className="h-2.5 bg-stone-200/60 rounded-md w-1/3" />
            <div className="h-3.5 bg-stone-200/80 rounded-md w-4/5" />
            <div className="h-3 bg-stone-200/50 rounded-md w-2/3" />
          </div>

          {/* Price & button skeleton */}
          <div className="flex items-center justify-between pt-3 mt-3 border-t border-stone-100">
            <div className="h-5 bg-stone-200/80 rounded-md w-14" />
            <div className="w-8 h-8 bg-stone-200/80 rounded-xl" />
          </div>
        </div>
      ))}
    </>
  );
};

/**
 * Horizontal Product Card Skeleton
 */
export const HorizontalProductSkeleton: React.FC<{ count?: number }> = ({ count = 3 }) => {
  return (
    <div className="space-y-2.5">
      {Array.from({ length: count }).map((_, idx) => (
        <div 
          key={idx}
          className="bg-white rounded-2xl p-2.5 border border-stone-100 shadow-2xs flex items-center gap-3 animate-pulse"
        >
          <div className="w-20 h-20 bg-stone-200/70 rounded-xl shrink-0" />
          <div className="flex-1 space-y-2">
            <div className="h-2.5 bg-stone-200/60 rounded-md w-1/4" />
            <div className="h-3.5 bg-stone-200/80 rounded-md w-3/4" />
            <div className="h-4 bg-stone-200/80 rounded-md w-16" />
          </div>
          <div className="w-8 h-8 bg-stone-200/70 rounded-xl shrink-0" />
        </div>
      ))}
    </div>
  );
};

/**
 * Category Pills Skeleton
 */
export const CategoryPillsSkeleton: React.FC<{ count?: number }> = ({ count = 6 }) => {
  return (
    <div className="flex items-center gap-2 overflow-hidden py-1">
      {Array.from({ length: count }).map((_, idx) => (
        <div 
          key={idx}
          className="h-8 bg-stone-200/70 rounded-full shrink-0 animate-pulse"
          style={{ width: `${60 + (idx % 3) * 20}px` }}
        />
      ))}
    </div>
  );
};

/**
 * Banner / Hero Skeleton
 */
export const BannerSkeleton: React.FC = () => {
  return (
    <div className="w-full aspect-21/9 sm:aspect-16/6 bg-stone-200/70 rounded-3xl animate-pulse" />
  );
};
