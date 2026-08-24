import React from 'react';
import { 
  ChevronRight, 
  Heart, 
  Search, 
  ShieldCheck, 
  ShoppingBag, 
  Store,
  User as UserIcon
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const AppHeader: React.FC = () => {
  const { 
    currentScreen, 
    goBack, 
    navigateTo, 
    wishlist, 
    currentUser, 
    searchQuery,
    setSearchQuery 
  } = useApp();

  const isSubScreen = !['home', 'categories', 'cart', 'orders', 'profile'].includes(currentScreen);

  const getScreenTitle = () => {
    switch (currentScreen) {
      case 'categories': return 'الأقسام والمؤونة';
      case 'products': return 'قائمة المنتجات';
      case 'product-detail': return 'تفاصيل المنتج';
      case 'cart': return 'سلة المشتريات';
      case 'auth': return 'تسجيل الدخول والتسجيل';
      case 'profile': return 'حسابي';
      case 'orders': return 'طلباتي';
      case 'wishlist': return 'المفضلة';
      case 'admin': return 'لوحة تحكم المدير';
      default: return 'Barakamarkt24';
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-stone-100 px-4 py-3 select-none">
      <div className="flex items-center justify-between gap-2">
        
        {/* Left Side: Brand Logo or Back Button */}
        <div className="flex items-center gap-2">
          {isSubScreen ? (
            <button
              onClick={goBack}
              className="w-9 h-9 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-800 flex items-center justify-center transition-colors cursor-pointer active:scale-95"
              aria-label="رجوع"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          ) : (
            <button 
              onClick={() => navigateTo('home')}
              className="flex items-center gap-2 text-left cursor-pointer"
            >
              <div className="w-8 h-8 rounded-xl bg-emerald-800 text-amber-300 font-black font-serif flex items-center justify-center shadow-xs">
                ب
              </div>
              <div className="flex flex-col">
                <span className="font-black text-base text-stone-900 tracking-tight leading-none">
                  Baraka<span className="text-emerald-700">markt</span><span className="text-amber-600 text-xs">24</span>
                </span>
                <span className="text-[9px] text-stone-600 font-medium">سوق ومؤونة شامية</span>
              </div>
            </button>
          )}

          {isSubScreen && (
            <h1 className="font-bold text-sm text-stone-900 line-clamp-1">
              {getScreenTitle()}
            </h1>
          )}
        </div>

        {/* Right Side: Quick Action Icons */}
        <div className="flex items-center gap-1.5">
          
          {/* Admin Dashboard Tag (Only visible for admin accounts) */}
          {currentUser?.role === 'admin' && (
            <button
              onClick={() => {
                if (currentScreen === 'admin') {
                  navigateTo('home');
                } else {
                  navigateTo('admin');
                }
              }}
              className={`text-[10px] font-bold px-2.5 py-1.5 rounded-xl border flex items-center gap-1 transition-all cursor-pointer ${
                currentScreen === 'admin'
                  ? 'bg-amber-600 text-white border-amber-600 shadow-xs'
                  : 'bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100'
              }`}
              title="لوحة تحكم المدير"
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span className="hidden xs:inline">{currentScreen === 'admin' ? 'وضع المتجر' : 'لوحة المدير'}</span>
            </button>
          )}

          {/* Search Trigger (takes to products screen with search focus) */}
          {currentScreen !== 'products' && (
            <button
              onClick={() => navigateTo('products')}
              className="w-9 h-9 rounded-xl bg-stone-50 hover:bg-stone-100 text-stone-700 flex items-center justify-center border border-stone-200/80 cursor-pointer active:scale-95 transition-colors"
              aria-label="البحث"
            >
              <Search className="w-4 h-4" />
            </button>
          )}

          {/* Wishlist Icon */}
          <button
            onClick={() => navigateTo('wishlist')}
            className="w-9 h-9 rounded-xl bg-stone-50 hover:bg-stone-100 text-stone-700 flex items-center justify-center border border-stone-200/80 relative cursor-pointer active:scale-95 transition-colors"
            aria-label="المفضلة"
          >
            <Heart className={`w-4 h-4 ${wishlist.length > 0 ? 'text-rose-500 fill-rose-500' : 'text-stone-600'}`} />
            {wishlist.length > 0 && (
              <span className="absolute -top-1 -right-1 bg-rose-500 text-white text-[9px] font-black w-4 h-4 rounded-full flex items-center justify-center shadow-xs">
                {wishlist.length}
              </span>
            )}
          </button>

        </div>

      </div>
    </header>
  );
};
