import React, { useMemo } from 'react';
import { 
  Sparkles, 
  Truck, 
  Tag, 
  Flame, 
  ShieldCheck, 
  Bell, 
  Gift, 
  Percent 
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { AnnouncementItem } from '../../types';
import { DEFAULT_ANNOUNCEMENTS } from '../../services/adminService';
import { getLocalizedAnnouncementText } from '../../locales';

interface AnnouncementTickerProps {
  onPressAction?: () => void;
}

const getAnnouncementIcon = (iconName?: string) => {
  switch (iconName) {
    case 'truck':
      return Truck;
    case 'shield':
      return ShieldCheck;
    case 'tag':
      return Tag;
    case 'flame':
      return Flame;
    case 'bell':
      return Bell;
    case 'gift':
      return Gift;
    case 'percent':
      return Percent;
    case 'sparkles':
    default:
      return Sparkles;
  }
};

export const AnnouncementTicker: React.FC<AnnouncementTickerProps> = ({ onPressAction }) => {
  const { storeSettings, navigateTo, language, dir, t } = useApp();

  // Extract and prepare announcements: filter active, non-empty localized text, and sort by order
  const activeAnnouncements = useMemo<AnnouncementItem[]>(() => {
    const rawList = storeSettings?.announcements;
    if (Array.isArray(rawList) && rawList.length > 0) {
      const filtered = rawList
        .filter(item => {
          if (item.isActive === false) return false;
          const localized = getLocalizedAnnouncementText(item, language);
          return Boolean(localized && localized.trim().length > 0);
        })
        .sort((a, b) => (a.order || 0) - (b.order || 0));
      
      if (filtered.length > 0) {
        return filtered;
      }
    }

    // Fallback: If legacy announcementText exists and differs from defaults, wrap it
    const legacyText = storeSettings?.announcementText?.trim();
    if (legacyText && !rawList) {
      return [
        { 
          id: 'legacy-ann', 
          text: legacyText, 
          textAr: legacyText,
          isActive: true, 
          order: 1, 
          icon: 'sparkles', 
          isHighlight: true 
        },
        ...DEFAULT_ANNOUNCEMENTS
      ];
    }

    // Default fallback
    return DEFAULT_ANNOUNCEMENTS;
  }, [storeSettings?.announcements, storeSettings?.announcementText, language]);

  const handleTickerClick = () => {
    if (onPressAction) {
      onPressAction();
    } else {
      navigateTo('products');
    }
  };

  // If literally no announcements are configured to show, don't break layout
  if (activeAnnouncements.length === 0) {
    return null;
  }

  const isRtl = dir === 'rtl';

  return (
    <div 
      onClick={handleTickerClick}
      className="relative overflow-hidden bg-gradient-to-r from-[#004D2E] via-[#005A36] to-[#004D2E] text-white py-2 px-3 border-y border-[#003822] shadow-2xs cursor-pointer group select-none transition-colors hover:brightness-105"
      dir={dir}
      title={t('common.viewProducts') || 'انقر لتصفح أحدث العروض والمنتجات'}
    >
      {/* Subtle edge fade overlays */}
      <div className="absolute top-0 right-0 bottom-0 w-8 bg-gradient-to-l from-[#004D2E] to-transparent z-10 pointer-events-none" />
      <div className="absolute top-0 left-0 bottom-0 w-8 bg-gradient-to-r from-[#004D2E] to-transparent z-10 pointer-events-none" />

      {/* Infinite loop track */}
      <div className="flex overflow-hidden">
        <div className={`${isRtl ? 'animate-marquee-rtl' : 'animate-marquee-ltr'} flex items-center gap-8 py-0.5`}>
          {/* Triple repetition ensures seamless continuous loop across all screen sizes */}
          {[...activeAnnouncements, ...activeAnnouncements, ...activeAnnouncements].map((item, index) => {
            const Icon = getAnnouncementIcon(item.icon);
            const textToDisplay = getLocalizedAnnouncementText(item, language);

            return (
              <div 
                key={`${item.id}-${index}`}
                className="flex items-center gap-2 whitespace-nowrap text-xs font-semibold"
              >
                <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${
                  item.isHighlight ? 'bg-amber-400 text-stone-950 shadow-xs' : 'bg-white/15 text-[#86EFAC]'
                }`}>
                  <Icon className="w-3 h-3" />
                </div>
                <span className={item.isHighlight ? 'text-amber-200 font-bold tracking-wide' : 'text-emerald-50'}>
                  {textToDisplay}
                </span>
                <span className={`text-white/30 text-xs ${isRtl ? 'mr-4' : 'ml-4'}`}>•</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};


