import React from 'react';
import { PackageOpen, SearchX, RotateCcw } from 'lucide-react';

interface EmptyStateProps {
  title?: string;
  description?: string;
  actionText?: string;
  onAction?: () => void;
  iconType?: 'search' | 'package' | 'default';
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title = 'لا توجد منتجات حالياً',
  description = 'لم نتمكن من العثور على أي عناصر تطابق اختيارك. جرب تعديل البحث أو الفلاتر.',
  actionText,
  onAction,
  iconType = 'package'
}) => {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-6 text-center bg-white rounded-3xl border border-stone-200/60 shadow-2xs my-4">
      <div className="w-16 h-16 rounded-2xl bg-amber-50 text-amber-600 border border-amber-200/60 flex items-center justify-center mb-3.5 shadow-xs">
        {iconType === 'search' ? (
          <SearchX className="w-8 h-8 text-stone-500" />
        ) : (
          <PackageOpen className="w-8 h-8 text-amber-700" />
        )}
      </div>

      <h3 className="font-bold text-sm text-stone-900 mb-1">
        {title}
      </h3>
      
      <p className="text-xs text-stone-500 max-w-xs leading-relaxed mb-4">
        {description}
      </p>

      {actionText && onAction && (
        <button
          type="button"
          onClick={onAction}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-800 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-xs cursor-pointer active:scale-95"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>{actionText}</span>
        </button>
      )}
    </div>
  );
};
