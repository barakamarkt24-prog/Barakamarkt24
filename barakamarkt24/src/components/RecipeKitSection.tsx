import React from 'react';
import { ChefHat, ShoppingBag, Clock, Users, Sparkles, Check, Zap } from 'lucide-react';
import { Currency, Language, Product, SyrianRecipeKit } from '../types';
import { RECIPE_KITS } from '../data/recipes';
import { formatPrice } from '../utils/helpers';

interface RecipeKitSectionProps {
  products: Product[];
  currency: Currency;
  language: Language;
  onAddRecipeToCart: (kit: SyrianRecipeKit) => void;
}

export const RecipeKitSection: React.FC<RecipeKitSectionProps> = ({
  products,
  currency,
  language,
  onAddRecipeToCart
}) => {
  return (
    <div className="max-w-7xl mx-auto px-4 my-10">
      
      {/* Section Title */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-6 gap-2">
        <div>
          <div className="inline-flex items-center gap-1.5 bg-[#E2EFE4] text-[#245233] text-xs font-bold px-3 py-1 rounded-full mb-1.5 border border-[#C5DEC8]">
            <ChefHat className="w-3.5 h-3.5 text-[#3D6E4B]" />
            <span>طبخات ومؤونة سورية جاهزة بنقرة زر</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-[#1B3022]">
            سلات الطبخات والمؤونة الشامية الكاملة
          </h2>
          <p className="text-xs sm:text-sm text-[#527059]">
            اختر أكلتك المفضلة، وسنقوم بجمع كافة بهاراتها ومكوناتها السورية في سلتك فوراً وتوصيلها خلال ساعتين بغرايفسفالد
          </p>
        </div>
      </div>

      {/* Grid of Recipe Kits */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {RECIPE_KITS.map((kit) => {
          const kitProducts = products.filter(p => kit.productIds.includes(p.id));
          const kitPrice = kitProducts.reduce((sum, p) => sum + p.price, 0);

          return (
            <div 
              key={kit.id}
              className="bg-white rounded-3xl border border-[#D5E5D7] overflow-hidden shadow-xs hover:shadow-xl transition-all duration-300 flex flex-col justify-between group"
            >
              <div>
                {/* Image */}
                <div className="relative aspect-16/9 overflow-hidden bg-[#F4F8F4]">
                  <img 
                    src={kit.image} 
                    alt={kit.titleAr}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute top-3 right-3 bg-[#1B3022]/85 backdrop-blur-xs text-amber-300 text-xs font-bold px-2.5 py-1 rounded-full border border-[#3D6E4B]/40">
                    📍 {kit.cityOrigin}
                  </div>
                </div>

                {/* Body */}
                <div className="p-4 sm:p-5 space-y-3">
                  <div className="flex items-center gap-3 text-xs text-[#527059]">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-[#3D6E4B]" />
                      {kit.cookTime}
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Users className="w-3.5 h-3.5 text-[#3D6E4B]" />
                      تكفي {kit.serves} أشخاص
                    </span>
                  </div>

                  <h3 className="font-extrabold text-base sm:text-lg text-[#1B3022] line-clamp-1 group-hover:text-[#3D6E4B] transition-colors">
                    {kit.titleAr}
                  </h3>

                  <p className="text-xs text-[#527059] leading-relaxed line-clamp-2">
                    {kit.descriptionAr}
                  </p>

                  {/* Included Ingredients Preview */}
                  <div className="bg-[#F9FAF9] p-3 rounded-2xl border border-[#D5E5D7] space-y-1.5">
                    <span className="text-[11px] font-bold text-[#1B3022] block">المكونات المتضمنة بالسلة:</span>
                    <div className="space-y-1">
                      {kitProducts.map(prod => (
                        <div key={prod.id} className="text-xs text-[#527059] flex items-center justify-between">
                          <span className="flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#3D6E4B]" />
                            <span className="line-clamp-1">{prod.nameAr}</span>
                          </span>
                          <span className="text-[11px] font-bold text-[#3D6E4B] whitespace-nowrap font-sans">
                            {formatPrice(prod.price, currency)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                </div>
              </div>

              {/* Action Button */}
              <div className="p-4 sm:p-5 pt-0">
                <button
                  onClick={() => onAddRecipeToCart(kit)}
                  className="w-full bg-[#3D6E4B] hover:bg-[#315A3D] text-white font-bold py-3 px-4 rounded-2xl shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 text-xs sm:text-sm cursor-pointer"
                >
                  <ShoppingBag className="w-4 h-4 text-amber-300" />
                  <span>إضافة السلة بالكامل • {formatPrice(kitPrice, currency)}</span>
                </button>
              </div>

            </div>
          );
        })}
      </div>

    </div>
  );
};
