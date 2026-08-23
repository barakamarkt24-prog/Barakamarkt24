import React, { useState } from 'react';
import { 
  Plus, 
  Minus, 
  Heart, 
  Eye, 
  Check, 
  Star, 
  Snowflake, 
  ShieldCheck, 
  Sparkles,
  MapPin
} from 'lucide-react';
import { Currency, Language, Product } from '../types';
import { formatPrice, DICTIONARY } from '../utils/helpers';

interface ProductCardProps {
  product: Product;
  currency: Currency;
  language: Language;
  onAddToCart: (product: Product, quantity?: number) => void;
  onQuickView: (product: Product) => void;
  isWishlisted: boolean;
  onToggleWishlist: (product: Product) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  currency,
  language,
  onAddToCart,
  onQuickView,
  isWishlisted,
  onToggleWishlist
}) => {
  const [isAddedRecently, setIsAddedRecently] = useState(false);
  const t = DICTIONARY[language];

  const handleAdd = (e: React.MouseEvent) => {
    e.stopPropagation();
    onAddToCart(product, 1);
    setIsAddedRecently(true);
    setTimeout(() => setIsAddedRecently(false), 1400);
  };

  const discountPercent = product.originalPrice && product.originalPrice > product.price
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : null;

  return (
    <div 
      onClick={() => onQuickView(product)}
      className="bg-white rounded-2xl border border-[#D5E5D7] hover:border-[#3D6E4B] shadow-xs hover:shadow-xl transition-all duration-300 flex flex-col justify-between overflow-hidden group cursor-pointer relative"
    >
      
      {/* Top Image Container with Badges */}
      <div className="relative aspect-4/3 w-full overflow-hidden bg-[#EBF3EC]">
        <img 
          src={product.image} 
          alt={product.nameAr}
          className="w-full h-full object-cover group-hover:scale-106 transition-transform duration-500"
          loading="lazy"
        />

        {/* Gradient Overlay on top */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-black/10 opacity-0 group-hover:opacity-100 transition-opacity" />

        {/* Top Badges Left/Right */}
        <div className="absolute top-2.5 right-2.5 flex flex-col gap-1.5 items-end z-10">
          {discountPercent && (
            <span className="bg-amber-400 text-[#1B3022] text-[11px] font-black px-2 py-0.5 rounded-full shadow-md">
              خصم {discountPercent}%
            </span>
          )}

          {product.isColdShipping && (
            <span className="bg-cyan-700/90 backdrop-blur-xs text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-md flex items-center gap-1">
              <Snowflake className="w-3 h-3 text-cyan-200" />
              <span>شحن مبرد ❄️</span>
            </span>
          )}

          {product.isBestseller && !discountPercent && (
            <span className="bg-[#E2EFE4] text-[#245233] border border-[#B8DCBF] text-[10px] font-extrabold px-2 py-0.5 rounded-full shadow-xs">
              الأكثر طلباً ⭐
            </span>
          )}
        </div>

        {/* Origin City Badge (Bottom Left of Image) */}
        <div className="absolute bottom-2 right-2 z-10">
          <span className="bg-[#1B3022]/90 backdrop-blur-xs text-[#E8F4EA] text-[11px] font-bold px-2 py-0.5 rounded-lg border border-[#3D6E4B] flex items-center gap-1 shadow-xs">
            <MapPin className="w-3 h-3 text-amber-300" />
            <span>{product.origin}</span>
          </span>
        </div>

        {/* Wishlist Button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggleWishlist(product);
          }}
          className={`absolute top-2.5 left-2.5 p-2 rounded-full transition-all z-10 ${
            isWishlisted 
              ? 'bg-rose-600 text-white shadow-md' 
              : 'bg-white/85 hover:bg-white text-stone-700 hover:text-rose-600 shadow-xs'
          }`}
          title="حفظ في المفضلة"
        >
          <Heart className={`w-4 h-4 ${isWishlisted ? 'fill-white' : ''}`} />
        </button>

        {/* Quick View Hover Action */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onQuickView(product);
          }}
          className="absolute inset-x-4 bottom-3 bg-[#3D6E4B]/95 hover:bg-[#315A3D] text-white text-xs font-bold py-2 rounded-xl backdrop-blur-xs opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-200 flex items-center justify-center gap-1.5 shadow-lg cursor-pointer"
        >
          <Eye className="w-3.5 h-3.5 text-amber-300" />
          <span>{t.quickView}</span>
        </button>
      </div>

      {/* Product Content Body */}
      <div className="p-3.5 sm:p-4 flex-1 flex flex-col justify-between space-y-3">
        
        <div>
          {/* Brand & Weight header */}
          <div className="flex items-center justify-between text-xs text-[#527059] mb-1">
            <span className="font-bold text-[#245233] bg-[#E2EFE4] px-2 py-0.5 rounded-md border border-[#C5DEC8]">
              {product.brand}
            </span>
            <span className="font-semibold text-[#527059]">
              {product.weight}
            </span>
          </div>

          {/* Product Name */}
          <h3 className="font-bold text-[#1B3022] text-sm sm:text-base line-clamp-2 leading-snug group-hover:text-[#3D6E4B] transition-colors">
            {language === 'ar' ? product.nameAr : (language === 'de' ? product.nameDe : product.nameEn)}
          </h3>

          {/* Rating Stars & Halal */}
          <div className="flex items-center gap-3 mt-2 text-xs">
            <div className="flex items-center gap-1 text-amber-600 font-bold">
              <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
              <span>{product.rating.toFixed(1)}</span>
              <span className="text-stone-400 text-[10px] font-normal">({product.reviewsCount})</span>
            </div>

            <span className="text-stone-300">•</span>

            <span className="text-[#3D6E4B] text-[11px] font-bold flex items-center gap-0.5">
              <ShieldCheck className="w-3 h-3 text-[#3D6E4B]" />
              حلال 100%
            </span>
          </div>
        </div>

        {/* Pricing & Add to Cart Row */}
        <div className="pt-2 border-t border-[#EDF4EE] flex items-center justify-between gap-2">
          
          {/* Price Block */}
          <div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-base sm:text-lg font-black text-[#3D6E4B] font-sans">
                {formatPrice(product.price, currency)}
              </span>
              {product.originalPrice && (
                <span className="text-xs text-stone-400 line-through font-sans">
                  {formatPrice(product.originalPrice, currency)}
                </span>
              )}
            </div>
            <span className="text-[10px] text-[#67826E] block font-medium">
              شامل الضريبة
            </span>
          </div>

          {/* Add to Cart Button */}
          <button
            onClick={handleAdd}
            className={`px-3 py-2 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-xs ${
              isAddedRecently
                ? 'bg-emerald-600 text-white scale-105'
                : 'bg-[#3D6E4B] hover:bg-[#315A3D] text-white hover:shadow-md'
            }`}
          >
            {isAddedRecently ? (
              <>
                <Check className="w-4 h-4 text-emerald-200" />
                <span>تمت الإضافة</span>
              </>
            ) : (
              <>
                <Plus className="w-4 h-4" />
                <span>{t.addToCart}</span>
              </>
            )}
          </button>

        </div>

      </div>

    </div>
  );
};
