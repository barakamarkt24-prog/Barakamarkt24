import React from 'react';
import { Sparkles, ShieldCheck, Snowflake, Zap, ArrowLeft, ArrowRight, MapPin, Clock } from 'lucide-react';
import { Language } from '../types';
import { DICTIONARY } from '../utils/helpers';

interface HeroBannerProps {
  language: Language;
  onSearchTag: (tag: string) => void;
  onSelectCategory: (catId: string) => void;
  onSelectOrigin?: (origin: string) => void;
}

export const HeroBanner: React.FC<HeroBannerProps> = ({
  language,
  onSearchTag,
  onSelectCategory,
  onSelectOrigin
}) => {
  const t = DICTIONARY[language];
  const isRtl = language === 'ar';

  const POPULAR_TAGS = [
    { label: '🧀 جبنة شلل حموية', query: 'شلل' },
    { label: '🫒 مكدوس شامي بالجوز', query: 'مكدوس' },
    { label: '🌾 فريكة حلبية خضراء', query: 'فريكة' },
    { label: '🫒 زيت زيتون عفرين بكر', query: 'عفرين' },
    { label: '☕ بن الحموي بالهال', query: 'الحموي' },
    { label: '🌿 صابون غار حلبي طبيعي', query: 'غار' },
    { label: '🍯 مية زهر ودبس رمان', query: 'رمان' }
  ];

  const SYRIAN_CITIES = [
    { name: 'حلب الشهباء', query: 'حلب', badge: 'فريكة وغار وزعتر' },
    { name: 'دمشق الفيحاء', query: 'دمشق', badge: 'مكدوس وبن ومربيات' },
    { name: 'حماة النواعير', query: 'حماة', badge: 'أجبان شلل وحلاوة الجبن' },
    { name: 'عفرين وإدلب', query: 'عفرين', badge: 'زيت زيتون بكر وزيتون' },
    { name: 'درعا وحوران', query: 'درعا', badge: 'حبوب وبرغل وبقوليات' },
    { name: 'اللاذقية والساحل', query: 'الساحل', badge: 'توابل ومؤونة جبلية' }
  ];

  return (
    <div className="relative overflow-hidden bg-gradient-to-br from-[#3D6E4B] via-[#356141] to-[#2B5036] text-white rounded-3xl mx-4 my-4 sm:my-6 shadow-xl border border-[#4F845D]">
      
      {/* Background Subtle Organic Texture */}
      <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#E8F5E9_1px,transparent_1px)] [background-size:20px_20px] pointer-events-none" />
      
      {/* Soft Glow Ambient Orbs */}
      <div className="absolute -top-24 -right-24 w-96 h-96 bg-[#81C784]/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-[#A7D7C5]/15 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 max-w-7xl mx-auto p-5 sm:p-8 lg:p-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          
          {/* Left / Main Text Column */}
          <div className="lg:col-span-7 space-y-4 sm:space-y-5">
            
            {/* Greifswald Delivery Trust Pill */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="inline-flex items-center gap-1.5 bg-[#25492F] text-amber-200 text-xs font-bold px-3 py-1.5 rounded-full border border-[#4B7C57] shadow-xs">
                <Clock className="w-3.5 h-3.5 text-amber-300 animate-pulse" />
                <span>مشروع غرايفسفالد: توصيل سريع خلال ساعتين عمل ⚡</span>
              </div>
              <div className="inline-flex items-center gap-1 bg-[#4A7D58] text-[#E8F4EA] text-[11px] font-semibold px-2.5 py-1 rounded-full border border-[#5C946C]">
                <MapPin className="w-3 h-3 text-amber-200" />
                <span>Greifswald & Umgebung</span>
              </div>
            </div>

            {/* Headline */}
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight leading-snug sm:leading-tight">
              مؤونة المدن السورية الأصيلة <br className="hidden sm:block" />
              <span className="text-amber-300">
                بركة ماركت غرايفسفالد | Barakamarkt
              </span>
            </h1>

            {/* Subtext */}
            <p className="text-xs sm:text-sm text-[#E2F0E5] max-w-2xl leading-relaxed">
              بقالية ومؤونة سورية مستوردة من خيرات حلب ودمشق وحماة وعفرين: أجبان وألبان طازجة، مكدوس بيتي بالجوز، فريكة حلبية على الحطب، وزيت زيتون بلدي بكر. تصل لباب منزلك في غرايفسفالد خلال ساعتين عمل فقط!
            </p>

            {/* Key Perks Mini Row */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 pt-1">
              <div className="flex items-center gap-2.5 bg-[#2E553A] rounded-2xl p-2.5 border border-[#487954] shadow-xs">
                <div className="w-8 h-8 rounded-xl bg-[#3D6E4B] flex items-center justify-center shrink-0">
                  <Zap className="w-4 h-4 text-amber-300" />
                </div>
                <div className="text-xs">
                  <p className="font-bold text-white">توصيل خلال ساعتين</p>
                  <p className="text-[10px] text-[#C2E2C8]">مندوب محلي في غرايفسفالد</p>
                </div>
              </div>

              <div className="flex items-center gap-2.5 bg-[#2E553A] rounded-2xl p-2.5 border border-[#487954] shadow-xs">
                <div className="w-8 h-8 rounded-xl bg-[#3D6E4B] flex items-center justify-center shrink-0">
                  <Snowflake className="w-4 h-4 text-cyan-200" />
                </div>
                <div className="text-xs">
                  <p className="font-bold text-white">شحن مبرد طازج</p>
                  <p className="text-[10px] text-[#C2E2C8]">حفظ حراري للأجبان</p>
                </div>
              </div>

              <div className="flex items-center gap-2.5 bg-[#2E553A] rounded-2xl p-2.5 border border-[#487954] shadow-xs col-span-2 sm:col-span-1">
                <div className="w-8 h-8 rounded-xl bg-[#3D6E4B] flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-4 h-4 text-amber-300" />
                </div>
                <div className="text-xs">
                  <p className="font-bold text-white">مستورد 100% أصيل</p>
                  <p className="text-[10px] text-[#C2E2C8]">من منتجي المدن السورية</p>
                </div>
              </div>
            </div>

            {/* Popular Search Tags */}
            <div className="pt-1">
              <p className="text-xs font-semibold text-[#D2EAD6] mb-1.5">الأكثر طلباً في غرايفسفالد:</p>
              <div className="flex flex-wrap gap-1.5">
                {POPULAR_TAGS.map((tag, idx) => (
                  <button
                    key={idx}
                    onClick={() => onSearchTag(tag.query)}
                    className="text-xs bg-[#2E553A] hover:bg-amber-400 hover:text-[#1B3022] text-[#E8F4EA] px-2.5 py-1 rounded-xl border border-[#487954] transition-all cursor-pointer font-medium shadow-xs"
                  >
                    {tag.label}
                  </button>
                ))}
              </div>
            </div>

          </div>

          {/* Right Showcase Card */}
          <div className="lg:col-span-5">
            <div className="bg-[#2B5036] p-4 sm:p-5 rounded-3xl border border-[#4A7D58] shadow-2xl relative">
              
              <div className="flex items-center justify-between mb-3.5 border-b border-[#3D6E4B] pb-2.5">
                <div>
                  <span className="text-amber-300 text-xs font-bold tracking-wide block">سلة المؤونة الأسبوعية</span>
                  <h2 className="text-base font-bold text-white">فطور شامي بلدي متكامل</h2>
                </div>
                <span className="bg-amber-400 text-[#1B3022] text-xs font-extrabold px-2.5 py-1 rounded-full shadow-xs">
                  توصيل ساعتين ⚡
                </span>
              </div>

              {/* Grid of featured Syrian pantry items */}
              <div className="grid grid-cols-3 gap-2 mb-3.5">
                <div className="bg-[#356141] rounded-2xl p-2 text-center border border-[#4C7F59]">
                  <img 
                    src="https://images.unsplash.com/photo-1552767059-ce182ead6c1b?auto=format&fit=crop&w=300&q=80" 
                    alt="جبنة شلل"
                    className="w-full h-14 object-cover rounded-xl mb-1 border border-[#4C7F59]"
                  />
                  <p className="text-[11px] font-bold text-[#E8F4EA] line-clamp-1">جبنة شلل حموية</p>
                  <p className="text-[10px] text-cyan-200 font-semibold">مبرد ❄️</p>
                </div>

                <div className="bg-[#356141] rounded-2xl p-2 text-center border border-[#4C7F59]">
                  <img 
                    src="https://images.unsplash.com/photo-1541256942802-7b2996a84f97?auto=format&fit=crop&w=300&q=80" 
                    alt="مكدوس بالجوز"
                    className="w-full h-14 object-cover rounded-xl mb-1 border border-[#4C7F59]"
                  />
                  <p className="text-[11px] font-bold text-[#E8F4EA] line-clamp-1">مكدوس دمشقي</p>
                  <p className="text-[10px] text-amber-200 font-semibold">بيتي بالجوز</p>
                </div>

                <div className="bg-[#356141] rounded-2xl p-2 text-center border border-[#4C7F59]">
                  <img 
                    src="https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?auto=format&fit=crop&w=300&q=80" 
                    alt="زيت عفرين"
                    className="w-full h-14 object-cover rounded-xl mb-1 border border-[#4C7F59]"
                  />
                  <p className="text-[11px] font-bold text-[#E8F4EA] line-clamp-1">زيت عفرين بكر</p>
                  <p className="text-[10px] text-emerald-200 font-semibold">عصرة أولى</p>
                </div>
              </div>

              <div className="bg-[#356141] rounded-2xl p-3 border border-[#4C7F59] text-xs text-[#D2EAD6] flex items-center justify-between gap-2">
                <div>
                  <p className="font-bold text-white">توصيل محلي في غرايفسفالد</p>
                  <p className="text-[10px] text-[#BDE2C4]">يصلك طازجاً خلال ساعتين عمل</p>
                </div>
                <button
                  onClick={() => onSelectCategory('dairy-cheese')}
                  className="bg-amber-400 hover:bg-amber-300 text-[#1B3022] font-black px-3 py-1.5 rounded-xl transition-colors flex items-center gap-1 text-xs cursor-pointer shadow-xs whitespace-nowrap"
                >
                  <span>تسوق الأجبان</span>
                  {isRtl ? <ArrowLeft className="w-3.5 h-3.5" /> : <ArrowRight className="w-3.5 h-3.5" />}
                </button>
              </div>

            </div>
          </div>

        </div>

        {/* Syrian Cities Origin Ticker / Filter */}
        <div className="mt-6 pt-4 border-t border-[#4A7D58] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-[#D2EAD6]">
          <div className="flex items-center gap-2 font-bold text-amber-200">
            <Sparkles className="w-4 h-4 text-amber-300" />
            <span>مستورد مباشرة من خيرات المدن السورية:</span>
          </div>
          <div className="flex flex-wrap gap-1.5 justify-center sm:justify-end">
            {SYRIAN_CITIES.map((city, i) => (
              <button
                key={i}
                onClick={() => onSelectOrigin ? onSelectOrigin(city.query) : onSearchTag(city.query)}
                className="bg-[#2E553A] hover:bg-white hover:text-[#1B3022] px-2.5 py-1 rounded-xl border border-[#487954] text-[11px] font-medium transition-colors cursor-pointer flex items-center gap-1 shadow-xs"
                title={city.badge}
              >
                <span>📍 {city.name}</span>
              </button>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
};
