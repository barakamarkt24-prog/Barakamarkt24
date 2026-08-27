import React, { useState, useRef, useEffect } from 'react';
import { Globe, ChevronDown, Check } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { LANGUAGES } from '../../locales';
import { Language } from '../../types';

interface LanguageSwitcherProps {
  variant?: 'compact' | 'full' | 'dropdown' | 'bar';
  className?: string;
}

export const LanguageSwitcher: React.FC<LanguageSwitcherProps> = ({
  variant = 'compact',
  className = ''
}) => {
  const { language, setLanguage, openLanguageModal, dir } = useApp();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const currentOption = LANGUAGES.find(l => l.code === language) || LANGUAGES[0];

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Compact variant: opens modal or quick toggle
  if (variant === 'compact') {
    return (
      <button
        onClick={openLanguageModal}
        className={`bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-bold px-2 py-1.5 sm:px-2.5 rounded-xl border border-stone-200/80 transition-all flex items-center gap-1 sm:gap-1.5 cursor-pointer shadow-2xs active:scale-95 shrink-0 ${className}`}
        title="تغيير اللغة / Change Language"
        aria-label="Change Language"
      >
        <span className="text-sm leading-none shrink-0">{currentOption.flag}</span>
        <span className="text-[11px] font-extrabold uppercase sm:hidden leading-none">{currentOption.code}</span>
        <span className="text-[11px] font-extrabold hidden sm:inline leading-none">{currentOption.name}</span>
        <Globe className="w-3.5 h-3.5 text-stone-500 shrink-0 hidden xs:block" />
      </button>
    );
  }

  // Bar variant: horizontal pills with all 5 languages (ideal for Settings / Profile / Modals)
  if (variant === 'bar') {
    return (
      <div className={`flex items-center gap-1.5 flex-wrap ${className}`}>
        {LANGUAGES.map((opt) => {
          const isSelected = language === opt.code;
          return (
            <button
              key={opt.code}
              onClick={() => setLanguage(opt.code)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                isSelected
                  ? 'bg-emerald-800 text-amber-300 shadow-xs ring-2 ring-emerald-900/20'
                  : 'bg-stone-100 hover:bg-stone-200 text-stone-700'
              }`}
            >
              <span>{opt.flag}</span>
              <span>{opt.name}</span>
            </button>
          );
        })}
      </div>
    );
  }

  // Dropdown variant
  return (
    <div className={`relative ${className}`} ref={dropdownRef} dir={dir}>
      <button
        type="button"
        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
        className="bg-white hover:bg-stone-50 text-stone-800 text-xs font-bold px-3 py-2 rounded-xl border border-stone-200 transition-all flex items-center gap-2 cursor-pointer shadow-2xs"
      >
        <span className="text-sm leading-none">{currentOption.flag}</span>
        <span className="text-xs">{currentOption.name}</span>
        <ChevronDown className="w-3.5 h-3.5 text-stone-400" />
      </button>

      {isDropdownOpen && (
        <div className="absolute top-full mt-1.5 z-50 bg-white rounded-2xl shadow-xl border border-stone-200/80 p-1.5 min-w-[150px] animate-in fade-in-50 zoom-in-95">
          {LANGUAGES.map((opt) => {
            const isSelected = language === opt.code;
            return (
              <button
                key={opt.code}
                type="button"
                onClick={() => {
                  setLanguage(opt.code);
                  setIsDropdownOpen(false);
                }}
                className={`w-full px-3 py-2 rounded-xl text-xs font-bold flex items-center justify-between transition-colors cursor-pointer text-left ${
                  isSelected ? 'bg-emerald-50 text-emerald-900' : 'hover:bg-stone-50 text-stone-700'
                }`}
                dir={opt.dir}
              >
                <div className="flex items-center gap-2">
                  <span>{opt.flag}</span>
                  <span>{opt.name}</span>
                </div>
                {isSelected && <Check className="w-3.5 h-3.5 text-emerald-700" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
