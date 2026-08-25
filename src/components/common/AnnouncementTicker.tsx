import React from 'react';
import { Sparkles, Truck, Tag, Flame, ShieldCheck, ChevronLeft } from 'lucide-react';
import { useApp } from '../../context/AppContext';

interface AnnouncementTickerProps {
  onPressAction?: () => void;
}

export const AnnouncementTicker: React.FC<AnnouncementTickerProps> = ({ onPressAction }) => {
  const { storeSettings, navigateTo } = useApp();

  const customText = storeSettings?.announcementText?.trim();

  // Curated list of announcements combining live store announcement and verified store perks
  const announcementItems = [
    ...(customText ? [{ id: 'custom', icon: Sparkles, text: customText, isHighlight: true }] : []),
    { id: 'shipping', icon: Truck, text: 'شحن سريع لباب منزلك في غرايفسفالد والمناطق المجاورة' },
    { id: 'quality', icon: ShieldCheck, text: 'أجود المنتجات العربية والعالمية طازجة وبأفضل الأسعار' },
    { id: 'offers', icon: Tag, text: 'تخفيضات أسبوعية وعروض حصرية متجددة في متجر بركة ماركت 24' }
  ];

  const handleTickerClick = () => {
    if (onPressAction) {
      onPressAction();
    } else {
      navigateTo('products');
    }
  };

  return (
    <div 
      onClick={handleTickerClick}
      className="relative overflow-hidden bg-gradient-to-r from-[#004D2E] via-[#005A36] to-[#004D2E] text-white py-2 px-3 border-y border-[#003822] shadow-2xs cursor-pointer group select-none transition-colors hover:brightness-105"
      dir="rtl"
      title="انقر لتصفح أحدث العروض والمنتجات"
    >
      {/* Subtle edge fade overlays */}
      <div className="absolute top-0 right-0 bottom-0 w-8 bg-gradient-to-l from-[#004D2E] to-transparent z-10 pointer-events-none" />
      <div className="absolute top-0 left-0 bottom-0 w-8 bg-gradient-to-r from-[#004D2E] to-transparent z-10 pointer-events-none" />

      {/* Infinite loop track */}
      <div className="flex overflow-hidden">
        <div className="animate-marquee-rtl flex items-center gap-8 py-0.5">
          {/* Double repetition ensures seamless continuous loop */}
          {[...announcementItems, ...announcementItems, ...announcementItems].map((item, index) => {
            const Icon = item.icon;
            return (
              <div 
                key={`${item.id}-${index}`}
                className="flex items-center gap-2 whitespace-nowrap text-xs font-semibold"
              >
                <div className={`w-5 h-5 rounded-full flex items-center justify-center ${
                  item.isHighlight ? 'bg-amber-400 text-stone-950' : 'bg-white/15 text-[#86EFAC]'
                }`}>
                  <Icon className="w-3 h-3" />
                </div>
                <span className={item.isHighlight ? 'text-amber-200 font-bold' : 'text-emerald-50'}>
                  {item.text}
                </span>
                <span className="text-white/30 text-xs mr-4">•</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
