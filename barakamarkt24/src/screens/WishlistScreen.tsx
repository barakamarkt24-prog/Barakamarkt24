import React from 'react';
import { Heart, ShoppingBag, LogIn, Sparkles, ArrowRight } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { ProductCard } from '../components/common/ProductCard';

export const WishlistScreen: React.FC = () => {
  const { wishlist, addToCart, navigateTo, showToast, currentUser } = useApp();

  const handleAddAllToCart = () => {
    let added = 0;
    wishlist.forEach(p => {
      const rawStock = p.stock !== undefined && p.stock !== null 
        ? p.stock 
        : (p.stockCount !== undefined && p.stockCount !== null ? p.stockCount : 100);
      const isAvailable = p.isAvailable !== false && p.inStock !== false && rawStock > 0;
      
      if (isAvailable) {
        addToCart(p, 1);
        added++;
      }
    });

    if (added > 0) {
      showToast(`تمت إضافة ${added} منتجات متوفرة إلى السلة`);
    } else {
      showToast('لا توجد منتجات متوفرة حالياً في المفضلة لإضافتها');
    }
  };

  // 1. Guest View: Prompt login nicely
  if (!currentUser) {
    return (
      <div className="p-4 space-y-4 pb-24 max-w-lg mx-auto" dir="rtl">
        <div className="py-12 text-center space-y-4 bg-white rounded-3xl p-6 border border-stone-200/80 shadow-2xs">
          <div className="w-16 h-16 rounded-2xl bg-rose-50 text-rose-500 flex items-center justify-center mx-auto shadow-inner">
            <Heart className="w-8 h-8 fill-rose-100 text-rose-500" />
          </div>
          <div className="space-y-1.5">
            <h2 className="font-black text-base text-stone-900">سجّل دخولك لحفظ مفضلتك</h2>
            <p className="text-xs text-stone-500 max-w-xs mx-auto leading-relaxed">
              المفضلة ترتبط بحسابك الشخصي وتتيح لك حفظ المنتجات المفضلة ومزامنتها على جميع أجهزتك بسهولة.
            </p>
          </div>
          <div className="pt-2 flex flex-col sm:flex-row gap-2 justify-center">
            <button
              onClick={() => navigateTo('auth')}
              className="bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-bold px-6 py-3 rounded-2xl cursor-pointer shadow-md active:scale-95 transition-all flex items-center justify-center gap-2"
            >
              <LogIn className="w-4 h-4" />
              <span>تسجيل الدخول / حساب جديد</span>
            </button>
            <button
              onClick={() => navigateTo('products')}
              className="bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-bold px-5 py-3 rounded-2xl cursor-pointer transition-all"
            >
              <span>تصفح المنتجات</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 2. Logged-in View
  return (
    <div className="p-4 space-y-4 pb-24 max-w-3xl mx-auto" dir="rtl">
      
      {/* Header Info */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-black text-lg text-stone-900 flex items-center gap-2">
            <Heart className="w-5 h-5 text-rose-500 fill-rose-500" />
            <span>قائمة المفضلة</span>
          </h1>
          <p className="text-xs text-stone-500 font-medium">{wishlist.length} منتجات محفوظة في حسابك</p>
        </div>

        {wishlist.length > 0 && (
          <button
            onClick={handleAddAllToCart}
            className="bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-bold px-3.5 py-2 rounded-2xl flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-95 transition-all"
          >
            <ShoppingBag className="w-3.5 h-3.5 text-amber-300" />
            <span>إضافة الكل للسلة</span>
          </button>
        )}
      </div>

      {/* Grid or Empty */}
      {wishlist.length === 0 ? (
        <div className="py-16 text-center space-y-3 bg-white rounded-3xl p-6 border border-stone-200/80 shadow-2xs my-4">
          <div className="w-16 h-16 rounded-2xl bg-rose-50 text-rose-400 flex items-center justify-center mx-auto">
            <Heart className="w-8 h-8" />
          </div>
          <h3 className="font-bold text-sm text-stone-900">قائمة المفضلة فارغة حالياً</h3>
          <p className="text-xs text-stone-500 max-w-xs mx-auto leading-relaxed">
            اضغط على أيقونة القلب على أي منتج أثناء التصفح لحفظه والرجوع إليه بسرعة لاحقاً.
          </p>
          <button
            onClick={() => navigateTo('products')}
            className="bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-bold px-6 py-2.5 rounded-2xl shadow-sm cursor-pointer active:scale-95 transition-all inline-flex items-center gap-1.5"
          >
            <span>استكشاف المنتجات</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {wishlist.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}

    </div>
  );
};

