import React from 'react';
import { X, Heart, ShoppingBag, Trash2, ArrowLeft, ArrowRight } from 'lucide-react';
import { Currency, Language, Product } from '../types';
import { formatPrice } from '../utils/helpers';

interface WishlistDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  wishlistItems: Product[];
  onRemoveFromWishlist: (product: Product) => void;
  onAddToCart: (product: Product, quantity?: number) => void;
  currency: Currency;
  language: Language;
}

export const WishlistDrawer: React.FC<WishlistDrawerProps> = ({
  isOpen,
  onClose,
  wishlistItems,
  onRemoveFromWishlist,
  onAddToCart,
  currency,
  language
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/60 backdrop-blur-xs flex justify-end animate-in fade-in duration-200">
      <div className="absolute inset-0" onClick={onClose} />

      <div 
        className="relative w-full max-w-md bg-[#FDFBF7] h-full shadow-2xl flex flex-col justify-between text-[#1B3022] z-10 animate-in slide-in-from-right duration-300 border-r border-[#D5E5D7]"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* Header */}
        <div className="p-4 border-b border-[#D5E5D7] flex items-center justify-between bg-[#EBF3EC]">
          <div className="flex items-center gap-2">
            <Heart className="w-5 h-5 text-rose-500 fill-rose-500" />
            <h2 className="font-extrabold text-base sm:text-lg text-[#1B3022]">
              قائمة المفضلة والمؤونة ({wishlistItems.length})
            </h2>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-[#1B3022] hover:bg-[#D5E5D7] rounded-lg cursor-pointer transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Wishlist Items Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 divide-y divide-[#EDF4EE]">
          {wishlistItems.length === 0 ? (
            <div className="py-20 text-center space-y-3">
              <div className="w-16 h-16 bg-rose-50 text-rose-400 rounded-full flex items-center justify-center mx-auto border border-rose-200">
                <Heart className="w-8 h-8" />
              </div>
              <h3 className="font-bold text-[#1B3022] text-sm">قائمة المفضلة فارغة</h3>
              <p className="text-xs text-[#527059] max-w-xs mx-auto">
                اضغط على أيقونة القلب عند أي منتج لحفظه في قائمتك المفضلة والرجوع إليه لاحقاً.
              </p>
            </div>
          ) : (
            wishlistItems.map((prod) => (
              <div key={prod.id} className="pt-3 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <img 
                    src={prod.image} 
                    alt={prod.nameAr} 
                    className="w-14 h-14 rounded-xl object-cover border border-[#D5E5D7]"
                  />
                  <div className="min-w-0">
                    <h4 className="font-bold text-xs text-[#1B3022] truncate">{prod.nameAr}</h4>
                    <p className="text-[11px] text-[#527059]">{prod.weight} • {prod.origin}</p>
                    <span className="font-black text-[#3D6E4B] text-xs mt-0.5 block font-sans">
                      {formatPrice(prod.price, currency)}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      onAddToCart(prod, 1);
                      onRemoveFromWishlist(prod);
                    }}
                    className="bg-[#3D6E4B] hover:bg-[#315A3D] text-white p-2 rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
                    title="نقل إلى السلة"
                  >
                    <ShoppingBag className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => onRemoveFromWishlist(prod)}
                    className="text-[#527059]/60 hover:text-rose-600 p-2 cursor-pointer transition-colors"
                    title="إزالة"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        {wishlistItems.length > 0 && (
          <div className="p-4 border-t border-[#D5E5D7] bg-[#EBF3EC]">
            <button
              onClick={() => {
                wishlistItems.forEach(p => onAddToCart(p, 1));
                onClose();
              }}
              className="w-full bg-[#3D6E4B] hover:bg-[#315A3D] text-white font-bold py-3 rounded-xl transition-all flex items-center justify-center gap-2 text-xs cursor-pointer shadow-md"
            >
              <ShoppingBag className="w-4 h-4 text-amber-300" />
              <span>إضافة جميع المنتجات المفضلة للسلة</span>
            </button>
          </div>
        )}

      </div>
    </div>
  );
};
