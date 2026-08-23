import React from 'react';
import { Heart, Plus, ShoppingBag, Check, Sparkles } from 'lucide-react';
import { Product } from '../../types';
import { useApp } from '../../context/AppContext';
import { OptimizedImage } from './OptimizedImage';

export const ProductCard: React.FC<{ product: Product; variant?: 'grid' | 'horizontal' }> = ({ 
  product, 
  variant = 'grid' 
}) => {
  const { navigateTo, addToCart, toggleWishlist, isInWishlist, cart } = useApp();

  const isFavorite = isInWishlist(product.id);
  const cartItem = cart.find(item => item.product.id === product.id);
  const qtyInCart = cartItem?.quantity || 0;

  const oldPrice = product.oldPrice || product.originalPrice;
  const hasDiscount = Boolean((oldPrice && oldPrice > product.price) || (product.discount && product.discount > 0));
  const discountPercent = product.discount || (oldPrice && oldPrice > product.price ? Math.round(((oldPrice - product.price) / oldPrice) * 100) : null);
  
  const isAvailable = product.isAvailable !== false && product.inStock;
  const displayImage = product.image || (product.images && product.images[0]);

  const handleCardClick = () => {
    navigateTo('product-detail', { productId: product.id });
  };

  const handleAddToCart = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isAvailable) {
      addToCart(product, 1);
    }
  };

  const handleToggleWishlist = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggleWishlist(product);
  };

  if (variant === 'horizontal') {
    return (
      <div 
        onClick={handleCardClick}
        className="bg-white rounded-2xl p-2.5 border border-stone-200/70 shadow-2xs hover:shadow-xs transition-all flex items-center gap-3 cursor-pointer active:scale-[0.99]"
      >
        {/* Image */}
        <div className="relative w-20 h-20 rounded-xl overflow-hidden bg-stone-100 shrink-0 border border-stone-100">
          <OptimizedImage 
            src={displayImage} 
            alt={product.nameAr || product.name} 
            className="w-full h-full object-cover"
            targetWidth={160}
            quality={75}
          />
          {hasDiscount && discountPercent && (
            <span className="absolute top-1 right-1 bg-rose-600 text-white text-[9px] font-black px-1.5 py-0.5 rounded-md">
              -{discountPercent}%
            </span>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 text-[10px] text-stone-500 mb-0.5 flex-wrap">
            {product.origin && (
              <span className="bg-stone-100 px-1.5 py-0.5 rounded text-stone-700 font-medium">📍 {product.origin}</span>
            )}
            <span>•</span>
            <span>{product.unit || 'قطعة'} ({product.weight || '500g'})</span>
          </div>
          <h4 className="font-bold text-xs text-stone-900 line-clamp-1">
            {product.nameAr || product.name}
          </h4>
          <div className="flex items-baseline gap-1.5 mt-1">
            <span className="font-black text-emerald-800 text-sm font-sans">
              €{product.price.toFixed(2)}
            </span>
            {hasDiscount && oldPrice && (
              <span className="text-[10px] text-stone-400 line-through font-sans">
                €{oldPrice.toFixed(2)}
              </span>
            )}
          </div>
        </div>

        {/* Action button */}
        <div className="shrink-0 flex flex-col items-center gap-1">
          <button
            onClick={handleToggleWishlist}
            className="p-1.5 text-stone-400 hover:text-rose-500 rounded-lg cursor-pointer"
          >
            <Heart className={`w-4 h-4 ${isFavorite ? 'text-rose-500 fill-rose-500' : ''}`} />
          </button>
          <button
            onClick={handleAddToCart}
            disabled={!isAvailable}
            className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all cursor-pointer shadow-xs ${
              !isAvailable 
                ? 'bg-stone-100 text-stone-400 cursor-not-allowed'
                : qtyInCart > 0 
                  ? 'bg-emerald-800 text-white' 
                  : 'bg-stone-900 hover:bg-stone-800 text-white'
            }`}
          >
            {qtyInCart > 0 ? (
              <span className="text-xs font-bold font-sans">{qtyInCart}</span>
            ) : (
              <Plus className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div 
      onClick={handleCardClick}
      className={`bg-white rounded-2xl border transition-all flex flex-col justify-between overflow-hidden group cursor-pointer active:scale-[0.98] ${
        product.isFeatured 
          ? 'border-amber-300 shadow-xs ring-1 ring-amber-200/60' 
          : 'border-stone-200/70 shadow-2xs hover:shadow-md'
      }`}
    >
      {/* Product Image Box */}
      <div className="relative aspect-square w-full bg-stone-50 overflow-hidden">
        <OptimizedImage 
          src={displayImage} 
          alt={product.nameAr || product.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          targetWidth={380}
          quality={75}
        />

        {/* Top Badges */}
        <div className="absolute top-2 right-2 flex flex-col gap-1 items-start z-10">
          {product.isFeatured && (
            <span className="bg-amber-500 text-stone-950 text-[9px] font-black px-2 py-0.5 rounded-full shadow-xs flex items-center gap-0.5">
              <Sparkles className="w-2.5 h-2.5" />
              <span>مميز</span>
            </span>
          )}
          {hasDiscount && discountPercent && (
            <span className="bg-rose-600 text-white text-[9px] font-black px-2 py-0.5 rounded-full shadow-xs font-sans">
              خصم {discountPercent}%
            </span>
          )}
          {product.badge && !hasDiscount && !product.isFeatured && (
            <span className="bg-emerald-800 text-white text-[9px] font-bold px-2 py-0.5 rounded-full shadow-xs">
              {product.badge}
            </span>
          )}
          {!isAvailable && (
            <span className="bg-stone-900/90 text-white text-[9px] font-bold px-2 py-0.5 rounded-full shadow-xs">
              نفد مؤقتاً
            </span>
          )}
        </div>

        {/* Wishlist Button */}
        <button
          onClick={handleToggleWishlist}
          className="absolute top-2 left-2 w-7 h-7 rounded-full bg-white/90 backdrop-blur-xs text-stone-600 hover:text-rose-600 flex items-center justify-center shadow-xs cursor-pointer active:scale-90 transition-all z-10"
          aria-label="إضافة للمفضلة"
        >
          <Heart className={`w-3.5 h-3.5 ${isFavorite ? 'text-rose-500 fill-rose-500' : ''}`} />
        </button>

        {/* Origin tag */}
        {product.origin && (
          <div className="absolute bottom-2 right-2 bg-stone-900/75 backdrop-blur-xs text-white text-[9px] font-medium px-2 py-0.5 rounded-md">
            📍 {product.origin}
          </div>
        )}
      </div>

      {/* Details Box */}
      <div className="p-3 flex-1 flex flex-col justify-between space-y-2">
        <div className="space-y-1">
          <div className="flex items-center justify-between text-[10px] text-stone-500">
            <span className="truncate">{product.brand || 'بركة ماركت'}</span>
            <span>{product.unit || 'قطعة'} ({product.weight || '500g'})</span>
          </div>

          <h3 className="font-bold text-xs text-stone-900 line-clamp-2 leading-snug">
            {product.nameAr || product.name}
          </h3>
        </div>

        {/* Price & Add to Cart */}
        <div className="flex items-center justify-between pt-1 border-t border-stone-100">
          <div>
            <div className="font-black text-sm text-emerald-800 font-sans">
              €{product.price.toFixed(2)}
            </div>
            {hasDiscount && oldPrice && (
              <div className="text-[10px] text-stone-400 line-through font-sans -mt-0.5">
                €{oldPrice.toFixed(2)}
              </div>
            )}
          </div>

          <button
            onClick={handleAddToCart}
            disabled={!isAvailable}
            className={`h-8 px-2.5 rounded-xl flex items-center justify-center gap-1 text-xs font-bold transition-all cursor-pointer active:scale-90 shadow-2xs ${
              !isAvailable
                ? 'bg-stone-100 text-stone-400 cursor-not-allowed'
                : qtyInCart > 0
                  ? 'bg-emerald-800 text-white'
                  : 'bg-stone-900 hover:bg-stone-800 text-white'
            }`}
          >
            {qtyInCart > 0 ? (
              <>
                <Check className="w-3.5 h-3.5" />
                <span className="font-sans">{qtyInCart}</span>
              </>
            ) : (
              <>
                <ShoppingBag className="w-3.5 h-3.5 text-amber-300" />
                <span className="text-[11px]">أضف</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
