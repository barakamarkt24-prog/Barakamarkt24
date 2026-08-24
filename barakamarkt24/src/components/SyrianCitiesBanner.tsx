import React from 'react';
import { MapPin, Sparkles, CheckCircle2, ChevronLeft, ChevronRight } from 'lucide-react';
import { Language } from '../types';

interface SyrianCitiesBannerProps {
  selectedOrigin: string;
  onSelectOrigin: (origin: string) => void;
  language: Language;
}

interface CityInfo {
  id: string;
  nameAr: string;
  nameEn: string;
  nameDe: string;
  taglineAr: string;
  icon: string;
  specialtyAr: string;
  specialtyDe: string;
}

const SYRIAN_CITIES_DATA: CityInfo[] = [
  {
    id: 'all',
    nameAr: 'كافة المدن السورية',
    nameEn: 'All Syrian Cities',
    nameDe: 'Alle syrischen Städte',
    taglineAr: 'خيرات ومؤونة بلاد الشام',
    icon: '🇸🇾',
    specialtyAr: 'جميع الأصناف والمؤونة',
    specialtyDe: 'Gesamtes Sortiment'
  },
  {
    id: 'حلب',
    nameAr: 'حلب الشهباء',
    nameEn: 'Aleppo',
    nameDe: 'Aleppo',
    taglineAr: 'عاصمة المذاق والمؤونة',
    icon: '🏰',
    specialtyAr: 'فريكة خضراء، صابون غار، زعتر حلبي، بهارات كبة',
    specialtyDe: 'Grünes Freekeh, Lorbeerseife, Zaatar'
  },
  {
    id: 'دمشق',
    nameAr: 'دمشق الفيحاء',
    nameEn: 'Damascus',
    nameDe: 'Damaskus',
    taglineAr: 'عراقة الشام والأسواق القديمة',
    icon: '🌸',
    specialtyAr: 'مكدوس بالجوز، بن الحموي بالهال، مربى القرع والمشمش',
    specialtyDe: 'Makdous, Damaszener Kaffee, Konfitüren'
  },
  {
    id: 'حماة',
    nameAr: 'حماة النواعير',
    nameEn: 'Hama',
    nameDe: 'Hama',
    taglineAr: 'أرض الأجبان والألبان البلدية',
    icon: '🌊',
    specialtyAr: 'جبنة شلل بلدية، جبنة حلوم، سميد حلاوة الجبن',
    specialtyDe: 'Zopfkäse (Mshlaleh), Halloumi, Grieß'
  },
  {
    id: 'عفرين',
    nameAr: 'عفرين وإدلب',
    nameEn: 'Afrin & Idlib',
    nameDe: 'Afrin & Idlib',
    taglineAr: 'أشجار الزيتون والعصر البكر',
    icon: '🫒',
    specialtyAr: 'زيت زيتون بكر ممتاز، زيتون مكبوس، ورق عنب بلدي',
    specialtyDe: 'Natives Olivenöl extra, Eingelegte Oliven'
  },
  {
    id: 'درعا',
    nameAr: 'سهل حوران ودرعا',
    nameEn: 'Daraa & Houran',
    nameDe: 'Daraa & Hauran',
    taglineAr: 'قمح حوران والخيرات الزراعية',
    icon: '🌾',
    specialtyAr: 'برغل خشن وناعم، حمص حب بلدي، عدس مجروش',
    specialtyDe: 'Bulgur, Kichererbsen, Linsen'
  },
  {
    id: 'الساحل',
    nameAr: 'اللاذقية والساحل',
    nameEn: 'Latakia Coast',
    nameDe: 'Latakia & Küste',
    taglineAr: 'خيرات الجبال الساحلية والغابات',
    icon: '🌿',
    specialtyAr: 'زعتر بري، دبس رمان طبيعي، ماء زهر بلدي',
    specialtyDe: 'Wilder Thymian, Granatapfelsirup, Orangenblütenwasser'
  }
];

export const SyrianCitiesBanner: React.FC<SyrianCitiesBannerProps> = ({
  selectedOrigin,
  onSelectOrigin,
  language
}) => {
  return (
    <section className="max-w-7xl mx-auto px-4 my-6">
      <div className="bg-white rounded-3xl p-5 sm:p-6 border border-[#D5E5D7] shadow-xs">
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-3 border-b border-[#EDF4EE]">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-8 h-8 rounded-xl bg-[#E2EFE4] text-[#245233] flex items-center justify-center font-bold text-sm">
                📍
              </span>
              <div>
                <h3 className="text-base sm:text-lg font-black text-[#1B3022]">
                  مستورد حصرياً من المدن السورية الأصيلة
                </h3>
                <p className="text-xs text-[#527059]">
                  تصفح المنتجات حسب المدينة السورية المنتجة وتصلك في غرايفسفالد خلال ساعتين
                </p>
              </div>
            </div>
          </div>

          {selectedOrigin !== 'all' && (
            <button
              onClick={() => onSelectOrigin('all')}
              className="text-xs font-bold text-[#3D6E4B] hover:text-[#245233] bg-[#EBF3EC] px-3 py-1.5 rounded-xl border border-[#D1E3D4] transition-colors cursor-pointer self-start sm:self-auto"
            >
              عرض كافة المدن
            </button>
          )}
        </div>

        {/* Cities Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-2.5">
          {SYRIAN_CITIES_DATA.map((city) => {
            const isSelected = selectedOrigin === city.id;
            return (
              <button
                key={city.id}
                onClick={() => onSelectOrigin(city.id)}
                className={`p-3 rounded-2xl border text-right sm:text-center transition-all cursor-pointer group flex flex-col justify-between relative ${
                  isSelected
                    ? 'bg-[#3D6E4B] text-white border-[#3D6E4B] shadow-md shadow-[#3D6E4B]/20 ring-2 ring-[#3D6E4B]/30'
                    : 'bg-[#F9FAF9] hover:bg-[#F2F7F2] text-[#1B3022] border-[#D5E5D7] hover:border-[#3D6E4B]/60'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between sm:justify-center mb-1.5">
                    <span className="text-xl">{city.icon}</span>
                    {isSelected && (
                      <CheckCircle2 className="w-4 h-4 text-amber-300 sm:hidden" />
                    )}
                  </div>
                  <h4 className="text-xs font-extrabold leading-snug">
                    {language === 'ar' ? city.nameAr : (language === 'de' ? city.nameDe : city.nameEn)}
                  </h4>
                  <p className={`text-[10px] mt-0.5 font-medium line-clamp-1 ${
                    isSelected ? 'text-[#D2EAD6]' : 'text-[#67826E]'
                  }`}>
                    {city.taglineAr}
                  </p>
                </div>

                <div className={`mt-2 pt-1.5 border-t text-[9px] line-clamp-2 leading-tight ${
                  isSelected ? 'border-[#4F845D] text-amber-200' : 'border-[#E2EFE4] text-[#4A6350]'
                }`}>
                  {city.specialtyAr}
                </div>
              </button>
            );
          })}
        </div>

      </div>
    </section>
  );
};
