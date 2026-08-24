import React from 'react';

export const ProductCardSkeleton: React.FC = () => {
  return (
    <div className="bg-white rounded-2xl p-2.5 border border-stone-200/80 animate-pulse flex flex-col justify-between">
      <div className="w-full h-32 bg-stone-200 rounded-xl mb-2.5"></div>
      <div className="space-y-2">
        <div className="h-3.5 bg-stone-200 rounded w-3/4"></div>
        <div className="h-3 bg-stone-200 rounded w-1/2"></div>
        <div className="flex justify-between items-center pt-2">
          <div className="h-4 bg-stone-200 rounded w-1/3"></div>
          <div className="w-8 h-8 bg-stone-200 rounded-xl"></div>
        </div>
      </div>
    </div>
  );
};

export const CategoryPillsSkeleton: React.FC = () => {
  return (
    <div className="flex gap-2 overflow-x-auto py-2 no-scrollbar">
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <div key={i} className="h-10 w-24 bg-stone-200 rounded-2xl animate-pulse shrink-0"></div>
      ))}
    </div>
  );
};

