import React from 'react';
import { Globe, Check, X, Sparkles } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { LANGUAGES } from '../../locales';
import { Language } from '../../types';

interface LanguageSelectModalProps {
  isOpen: boolean;
  onClose: () => void;
  isFirstTime?: boolean;
}

export const LanguageSelectModal: React.FC<LanguageSelectModalProps> = ({
  isOpen,
  onClose,
  isFirstTime = false
}) => {
  const { 
    language, 
    setLanguage, 
    dir, 
    t, 
    closeLanguageModal, 
    closeFirstTimeLanguageModal 
  } = useApp();

  if (!isOpen) return null;

  const handleSelectLanguage = (langCode: Language) => {
    setLanguage(langCode);
    closeFirstTimeLanguageModal();
    closeLanguageModal();
    if (typeof onClose === 'function') {
      onClose();
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200"
      dir={dir}
    >
      <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-stone-200/80 space-y-5 animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-stone-100 pb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-800 flex items-center justify-center border border-emerald-200 shadow-2xs">
              <Globe className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-base text-stone-900">
                {t('nav.selectLanguage')}
              </h3>
              <p className="text-xs text-stone-500 font-medium">
                {isFirstTime ? 'Choose your preferred language / اختر لغتك المفضلة' : t('profile.languageSetting')}
              </p>
            </div>
          </div>

          {!isFirstTime && (
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-stone-100 hover:bg-stone-200 text-stone-500 flex items-center justify-center transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* First time welcome badge */}
        {isFirstTime && (
          <div className="bg-amber-50 border border-amber-200/80 rounded-2xl p-3 flex items-center gap-2.5 text-amber-900 text-xs font-semibold">
            <Sparkles className="w-4 h-4 text-amber-600 shrink-0" />
            <span>
              أهلاً بكم في بركة ماركت 24! يمكنك تغيير اللغة في أي وقت من الإعدادات.
            </span>
          </div>
        )}

        {/* Languages Options Grid */}
        <div className="grid grid-cols-1 gap-2.5">
          {LANGUAGES.map((langOption) => {
            const isSelected = language === langOption.code;
            return (
              <button
                key={langOption.code}
                onClick={() => handleSelectLanguage(langOption.code)}
                className={`w-full p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between text-left group ${
                  isSelected
                    ? 'bg-emerald-50/90 border-emerald-600 text-emerald-950 ring-2 ring-emerald-500/20 shadow-xs'
                    : 'bg-stone-50/60 hover:bg-stone-100/80 border-stone-200 text-stone-700'
                }`}
                dir={langOption.dir}
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl drop-shadow-xs">{langOption.flag}</span>
                  <div>
                    <div className="font-extrabold text-sm text-stone-900 group-hover:text-emerald-900 transition-colors">
                      {langOption.name}
                    </div>
                    <div className="text-[10px] text-stone-400 font-mono">
                      {langOption.code.toUpperCase()} • {langOption.dir.toUpperCase()}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {isSelected ? (
                    <div className="w-7 h-7 rounded-full bg-emerald-800 text-amber-300 flex items-center justify-center shadow-xs">
                      <Check className="w-4 h-4 stroke-[3]" />
                    </div>
                  ) : (
                    <div className="w-5 h-5 rounded-full border border-stone-300 group-hover:border-emerald-600 transition-colors" />
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {/* Bottom Notice */}
        <div className="pt-2 border-t border-stone-100 flex items-center justify-between text-[11px] text-stone-400">
          <span>Barakamarkt24 • Greifswald</span>
          <span>5 Languages Available</span>
        </div>

      </div>
    </div>
  );
};
