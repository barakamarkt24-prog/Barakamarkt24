import React from 'react';
import { PackageOpen } from 'lucide-react';

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  actionText?: string;
  onAction?: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  actionText,
  onAction
}) => {
  return (
    <div className="py-12 px-4 text-center space-y-3 bg-white rounded-3xl border border-stone-200/80 shadow-2xs my-4 max-w-md mx-auto">
      <div className="w-14 h-14 rounded-2xl bg-stone-100 text-stone-400 flex items-center justify-center mx-auto">
        {icon || <PackageOpen className="w-7 h-7" />}
      </div>
      <h3 className="font-bold text-sm text-stone-900">{title}</h3>
      {description && (
        <p className="text-xs text-stone-500 max-w-xs mx-auto leading-relaxed">{description}</p>
      )}
      {actionText && onAction && (
        <button
          onClick={onAction}
          className="mt-2 bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-bold px-5 py-2.5 rounded-2xl shadow-sm cursor-pointer transition-all active:scale-95"
        >
          {actionText}
        </button>
      )}
    </div>
  );
};
