import React from 'react';
import { Heart, Plus, Minus, Check } from 'lucide-react';
import { Product } from '../../types';
import { useApp } from '../../context/AppContext';
import { OptimizedImage } from './OptimizedImage';

interface ProductCardProps {
  product: Product;
  onSelect?: (product: Product) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product, onSelect }) => {
  const { 
    setSelectedProduct, 
    navigateTo, 
    addToCart, 
    cart, 
    updateQuantity, 
    toggleWishlist, 
    isInWishlist, 
    currencySymbol 
  } = useApp();

  const isFavorited = isInWishlist(product.id);
  const cartItem = cart.find(item => item.product.id === product.id || (item.product as any).productId === product.id);
  const currentQuantity = cartItem ? cartItem.quantity : 0;

  const rawStock = product.stock !== undefined && product.stock !== null 
    ? product.stock 
    : (product.stockCount !== undefined && product.stockCount !== null ? product.stockCount : 100);
  const isAvailable = product.isAvailable !== false && product.inStock !== false && rawStock > 0;

  const handleClick = () => {
    if (onSelect) {
      onSelect(product);
    } else {
      setSelectedProduct(product);
      navigateTo('product_detail');
    }
  };

  const handleAddToCart = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isAvailable) return;
    addToCart(product, 1);
  };

  const handleIncrement = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isAvailable) return;
    if (rawStock && currentQuantity >= rawStock) {
      return;
    }
    updateQuantity(product.id, currentQuantity + 1);
  };

  const handleDecrement = (e: React.MouseEvent) => {
    e.stopPropagation();
    updateQuantity(product.id, currentQuantity - 1);
  };

  const handleToggleFav = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggleWishlist(product);
  };

  return (
    <div 
      onClick={handleClick}
      className="bg-white rounded-2xl p-2.5 border border-stone-200/80 hover:border-emerald-700/40 shadow-2xs hover:shadow-xs transition-all flex flex-col justify-between cursor-pointer group relative"
      dir="rtl"
    >
      {/* Top badges & Favorite button */}
      <div className="relative w-full aspect-square bg-stone-50 rounded-xl overflow-hidden mb-2">
        <OptimizedImage
          src={product.image || (product.images && product.images[0])}
          alt={product.nameAr || product.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />

        {/* Favorite Button */}
        <button
          onClick={handleToggleFav}
          aria-label="إضافة للمفضلة"
          className="absolute top-1.5 left-1.5 w-7 h-7 rounded-full bg-white/90 backdrop-blur-xs flex items-center justify-center text-stone-600 hover:text-rose-500 shadow-2xs transition-colors cursor-pointer z-10"
        >
          <Heart className={`w-3.5 h-3.5 ${isFavorited ? 'fill-rose-500 text-rose-500' : ''}`} />
        </button>

        {/* Badges */}
        <div className="absolute top-1.5 right-1.5 flex flex-col gap-1 z-10">
          {product.discount && product.discount > 0 && (
            <span className="bg-rose-600 text-white text-[10px] font-black px-1.5 py-0.5 rounded-md shadow-2xs">
              {product.discount}%-
            </span>
          )}
          {product.isFeatured && (
            <span className="bg-emerald-800 text-amber-300 text-[9px] font-bold px-1.5 py-0.5 rounded-md shadow-2xs">
              مميز
            </span>
          )}
        </div>

        {!isAvailable && (
          <div className="absolute inset-0 bg-white/80 backdrop-blur-[1px] flex items-center justify-center">
            <span className="bg-stone-900 text-white text-[10px] font-bold px-2.5 py-1 rounded-lg">
              نفد من المخزن
            </span>
          </div>
        )}
      </div>

      {/* Product Details */}
      <div className="space-y-1.5 flex-1 flex flex-col justify-between">
        <div>
          <span className="text-[10px] text-stone-400 font-medium block truncate">
            {product.origin || 'بركة ماركت'} {product.unit ? `• ${product.unit}` : ''}
          </span>
          <h4 className="font-bold text-xs text-stone-900 line-clamp-2 leading-snug">
            {product.nameAr || product.name}
          </h4>
          {(product.nameDe || product.nameEn) && (
            <span className="text-[10px] text-stone-400 font-sans block truncate pt-0.5">
              {product.nameDe || product.nameEn}
            </span>
          )}
        </div>

        <div className="pt-2 flex items-center justify-between mt-auto">
          <div>
            <div className="flex items-baseline gap-1">
              <span className="font-black text-sm text-emerald-800 font-sans">
                {currencySymbol || '€'}{product.price.toFixed(2)}
              </span>
              {product.oldPrice && product.oldPrice > product.price && (
                <span className="text-[10px] text-stone-400 line-through font-sans">
                  {currencySymbol || '€'}{product.oldPrice.toFixed(2)}
                </span>
              )}
            </div>
          </div>

          {/* Add / Quantity Controller */}
          {isAvailable ? (
            currentQuantity > 0 ? (
              <div 
                onClick={(e) => e.stopPropagation()}
                className="flex items-center gap-1 bg-emerald-800 text-white rounded-xl p-0.5 shadow-2xs"
              >
                <button
                  onClick={handleDecrement}
                  aria-label="تقليل الكمية"
                  className="w-6 h-6 rounded-lg hover:bg-emerald-700 flex items-center justify-center cursor-pointer transition-colors"
                >
                  <Minus className="w-3 h-3" />
                </button>
                <span className="text-xs font-bold font-sans px-1 min-w-4 text-center">
                  {currentQuantity}
                </span>
                <button
                  onClick={handleIncrement}
                  aria-label="زيادة الكمية"
                  className="w-6 h-6 rounded-lg hover:bg-emerald-700 flex items-center justify-center cursor-pointer transition-colors"
                >
                  <Plus className="w-3 h-3" />
                </button>
              </div>
            ) : (
              <button
                onClick={handleAddToCart}
                aria-label="إضافة للسلة"
                className="w-8 h-8 rounded-xl bg-stone-100 hover:bg-emerald-800 hover:text-white text-stone-800 flex items-center justify-center cursor-pointer transition-all shadow-2xs active:scale-95"
              >
                <Plus className="w-4 h-4" />
              </button>
            )
          ) : (
            <button
              disabled
              className="w-8 h-8 rounded-xl bg-stone-100 text-stone-300 flex items-center justify-center cursor-not-allowed"
            >
              <Minus className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
