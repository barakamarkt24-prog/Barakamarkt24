import React from 'react';
import { Heart, ShoppingBag, Trash2, ArrowLeft } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { ProductCard } from '../components/common/ProductCard';

export const WishlistScreen: React.FC = () => {
  const { wishlist, addToCart, navigateTo, showToast } = useApp();

  const handleAddAllToCart = () => {
    wishlist.forEach(p => {
      if (p.inStock) {
        addToCart(p, 1);
      }
    });
    showToast('تمت إضافة جميع المنتجات المتوفرة إلى السلة');
  };

  return (
    <div className="p-4 space-y-4 pb-12">
      
      {/* Header Info */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-extrabold text-base text-stone-900">قائمة المفضلة</h2>
          <p className="text-xs text-stone-500">{wishlist.length} منتجات محفوظة</p>
        </div>

        {wishlist.length > 0 && (
          <button
            onClick={handleAddAllToCart}
            className="bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-bold px-3 py-1.5 rounded-xl flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-95 transition-all"
          >
            <ShoppingBag className="w-3.5 h-3.5" />
            <span>إضافة الكل للسلة</span>
          </button>
        )}
      </div>

      {/* Grid or Empty */}
      {wishlist.length === 0 ? (
        <div className="py-16 text-center space-y-3 bg-white rounded-3xl p-6 border border-stone-200/80 shadow-2xs my-4">
          <div className="w-16 h-16 rounded-2xl bg-rose-50 text-rose-500 flex items-center justify-center mx-auto">
            <Heart className="w-8 h-8" />
          </div>
          <h3 className="font-bold text-sm text-stone-900">قائمة المفضلة فارغة حالياً</h3>
          <p className="text-xs text-stone-500 max-w-xs mx-auto">
            اضغط على أيقونة القلب على أي منتج أثناء التصفح لحفظه والرجوع إليه بسهولة لاحقاً.
          </p>
          <button
            onClick={() => navigateTo('products')}
            className="bg-stone-900 hover:bg-stone-800 text-white text-xs font-bold px-5 py-2.5 rounded-xl cursor-pointer"
          >
            استكشاف المنتجات
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {wishlist.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}

    </div>
  );
};
