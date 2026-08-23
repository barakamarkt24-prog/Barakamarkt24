import React from 'react';
import { 
  Milk, 
  Citrus, 
  Wheat, 
  Droplet, 
  Flame, 
  Box, 
  Coffee, 
  Cookie, 
  Sparkles, 
  Heart, 
  ShieldCheck, 
  Smile, 
  Baby, 
  Utensils,
  LayoutGrid
} from 'lucide-react';
import { Category, CategoryId, Language } from '../types';
import { CATEGORIES } from '../data/categories';
import { DICTIONARY } from '../utils/helpers';

interface CategoryFilterBarProps {
  selectedCategory: CategoryId | null;
  onSelectCategory: (categoryId: CategoryId | null) => void;
  language: Language;
  productCounts: Record<string, number>;
}

// Icon mapper
const ICON_MAP: Record<string, React.ReactNode> = {
  Milk: <Milk className="w-5 h-5" />,
  Citrus: <Citrus className="w-5 h-5" />,
  Wheat: <Wheat className="w-5 h-5" />,
  Droplet: <Droplet className="w-5 h-5" />,
  Flame: <Flame className="w-5 h-5" />,
  Box: <Box className="w-5 h-5" />,
  Coffee: <Coffee className="w-5 h-5" />,
  Cookie: <Cookie className="w-5 h-5" />,
  Sparkles: <Sparkles className="w-5 h-5" />,
  Heart: <Heart className="w-5 h-5" />,
  ShieldCheck: <ShieldCheck className="w-5 h-5" />,
  Smile: <Smile className="w-5 h-5" />,
  Baby: <Baby className="w-5 h-5" />,
  Utensils: <Utensils className="w-5 h-5" />
};

export const CategoryFilterBar: React.FC<CategoryFilterBarProps> = ({
  selectedCategory,
  onSelectCategory,
  language,
  productCounts
}) => {
  const t = DICTIONARY[language];
  const totalProducts = Object.values(productCounts).reduce<number>((a, b) => a + Number(b), 0);

  return (
    <div className="max-w-7xl mx-auto px-4 my-6">
      <div className="flex items-center justify-between mb-3.5">
        <div>
          <h2 className="text-lg sm:text-xl font-black text-[#1B3022] flex items-center gap-2">
            <span>أقسام البقالية والمؤونة السورية</span>
            <span className="text-xs bg-[#E2EFE4] text-[#245233] font-extrabold px-2.5 py-0.5 rounded-full border border-[#C5DEC8]">
              14 قسم واضح
            </span>
          </h2>
          <p className="text-xs text-[#527059] mt-0.5">
            منتجات بلدية مستوردة من المدن السورية مع توصيل فوري خلال ساعتين بغرايفسفالد
          </p>
        </div>

        {selectedCategory && (
          <button
            onClick={() => onSelectCategory(null)}
            className="text-xs text-[#3D6E4B] hover:text-[#245233] font-extrabold underline cursor-pointer"
          >
            عرض جميع المنتجات ({totalProducts})
          </button>
        )}
      </div>

      {/* Grid / Horizontal Scroll for Categories */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-2.5 sm:gap-3">
        
        {/* All Products Tile */}
        <button
          onClick={() => onSelectCategory(null)}
          className={`flex flex-col items-center justify-center p-3 rounded-2xl border transition-all cursor-pointer group text-center ${
            selectedCategory === null
              ? 'bg-[#3D6E4B] text-white border-[#3D6E4B] shadow-md shadow-[#3D6E4B]/20 ring-2 ring-[#3D6E4B]/25'
              : 'bg-white text-[#1B3022] border-[#D5E5D7] hover:border-[#3D6E4B] hover:bg-[#F4F8F4] shadow-xs'
          }`}
        >
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-1.5 transition-transform group-hover:scale-105 ${
            selectedCategory === null ? 'bg-[#2E553A] text-amber-300' : 'bg-[#EBF3EC] text-[#3D6E4B]'
          }`}>
            <LayoutGrid className="w-5 h-5" />
          </div>
          <span className="text-xs font-bold leading-tight">كل الأقسام</span>
          <span className={`text-[10px] mt-0.5 font-semibold ${
            selectedCategory === null ? 'text-[#CDE3D2]' : 'text-[#67826E]'
          }`}>
            {totalProducts} صنف
          </span>
        </button>

        {/* 14 Departments */}
        {CATEGORIES.map((cat) => {
          const isSelected = selectedCategory === cat.id;
          const count = productCounts[cat.id] || 0;
          const icon = ICON_MAP[cat.icon] || <Sparkles className="w-5 h-5" />;

          return (
            <button
              key={cat.id}
              onClick={() => onSelectCategory(cat.id)}
              className={`flex flex-col items-center justify-center p-3 rounded-2xl border transition-all cursor-pointer group text-center relative ${
                isSelected
                  ? 'bg-[#3D6E4B] text-white border-[#3D6E4B] shadow-md shadow-[#3D6E4B]/20 ring-2 ring-[#3D6E4B]/25'
                  : 'bg-white text-[#1B3022] border-[#D5E5D7] hover:border-[#3D6E4B] hover:bg-[#F4F8F4] shadow-xs'
              }`}
            >
              {cat.id === 'dairy-cheese' && (
                <span className="absolute -top-1.5 -right-1.5 bg-cyan-700 text-white text-[9px] font-black px-1.5 py-0.2 rounded-full shadow-xs">
                  مبرد ❄️
                </span>
              )}

              <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-1.5 transition-transform group-hover:scale-105 ${
                isSelected ? 'bg-[#2E553A] text-amber-300' : 'bg-[#EBF3EC] text-[#3D6E4B]'
              }`}>
                {icon}
              </div>

              <span className="text-xs font-bold leading-tight line-clamp-1">
                {language === 'ar' ? cat.nameAr : (language === 'de' ? cat.nameDe : cat.nameEn)}
              </span>

              <span className={`text-[10px] mt-0.5 font-semibold ${
                isSelected ? 'text-[#CDE3D2]' : 'text-[#67826E]'
              }`}>
                {count} أصناف
              </span>
            </button>
          );
        })}

      </div>
    </div>
  );
};
