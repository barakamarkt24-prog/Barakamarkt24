import React, { useMemo, useState } from 'react';
import { 
  Search, 
  Sparkles, 
  Flame, 
  Percent, 
  Truck, 
  ShieldCheck, 
  Clock,
  ChevronLeft,
  ShoppingBag,
  User as UserIcon,
  Tag,
  ArrowRight,
  PackagePlus,
  RefreshCw
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { ProductCard } from '../components/common/ProductCard';
import { ProductCardSkeleton, CategoryPillsSkeleton } from '../components/common/LoadingSkeletons';
import { EmptyState } from '../components/common/EmptyState';
import { OptimizedImage } from '../components/common/OptimizedImage';
import { FALLBACK_CATEGORY_IMAGE } from '../utils/imageOptimizer';

export const HomeScreen: React.FC = () => {
  const { 
    categories, 
    products, 
    navigateTo, 
    setSelectedCategoryId,
    searchQuery,
    setSearchQuery,
    cartCount,
    currentUser,
    isLoadingProducts,
    storeSettings
  } = useApp();

  // Selected quick filter pill for categories (or 'all')
  const [selectedQuickCategory, setSelectedQuickCategory] = useState<string>('all');
  
  // Pagination / Limit for newly added / general products stream
  const [visibleNewCount, setVisibleNewCount] = useState<number>(8);

  // Filter active categories for display
  const activeCategories = useMemo(() => {
    return categories.filter(c => c.isActive !== false);
  }, [categories]);

  // Filter products that are available/visible
  const visibleProducts = useMemo(() => {
    return products.filter(p => p.isAvailable !== false);
  }, [products]);

  // 1. Featured Products (منتجات مميزة)
  const featuredProducts = useMemo(() => {
    return visibleProducts
      .filter(p => p.isFeatured || p.isBestseller)
      .slice(0, 6);
  }, [visibleProducts]);

  // 2. Discounted Products & Offers (عروض وتخفيضات)
  const discountProducts = useMemo(() => {
    return visibleProducts
      .filter(p => {
        const oldP = p.oldPrice || p.originalPrice;
        return Boolean((oldP && oldP > p.price) || (p.discount && p.discount > 0));
      })
      .slice(0, 6);
  }, [visibleProducts]);

  // 3. New Arrivals (منتجات جديدة) - sorted by createdAt timestamp/date
  const newArrivals = useMemo(() => {
    let sorted = [...visibleProducts];
    sorted.sort((a, b) => {
      const getTimestamp = (val: any) => {
        if (!val) return 0;
        if (typeof val === 'number') return val;
        if (val.seconds) return val.seconds * 1000;
        if (typeof val === 'string') {
          const t = new Date(val).getTime();
          return isNaN(t) ? 0 : t;
        }
        return 0;
      };
      const timeA = getTimestamp(a.createdAt);
      const timeB = getTimestamp(b.createdAt);
      return timeB - timeA;
    });

    if (selectedQuickCategory !== 'all') {
      sorted = sorted.filter(p => p.categoryId === selectedQuickCategory);
    }

    return sorted;
  }, [visibleProducts, selectedQuickCategory]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigateTo('products');
    }
  };

  return (
    <div className="space-y-6 pb-12" dir="rtl">
      
      {/* Dynamic Announcement Banner from Firebase Store Settings */}
      {storeSettings?.announcementText && storeSettings.announcementText.trim() !== '' && (
        <div className="bg-emerald-900 text-amber-200 text-xs px-4 py-2 font-bold text-center border-b border-emerald-950/40 flex items-center justify-center gap-2 shadow-xs">
          <Sparkles className="w-3.5 h-3.5 text-amber-300 animate-pulse shrink-0" />
          <span>{storeSettings.announcementText}</span>
        </div>
      )}

      {/* Store Closed Notice Banner if isOpen is false */}
      {storeSettings?.isOpen === false && (
        <div className="mx-4 bg-amber-500/15 border border-amber-500/40 text-amber-950 p-3.5 rounded-2xl flex items-start gap-3 shadow-2xs">
          <AlertCircle className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
          <div className="text-xs space-y-0.5">
            <div className="font-extrabold text-amber-900">المتجر مغلق حاليًا لاستقبال الطلبات الجديدة</div>
            <div className="text-[11px] text-amber-800/90 leading-relaxed">
              {storeSettings.closedMessageAr || 'يمكنك تصفح المنتجات وإضافتها لقائمة الرغبات. نرحب بطلباتكم فور إعادة الافتتاح.'}
            </div>
          </div>
        </div>
      )}

      {/* 1. Header with Store Logo, Name, Quick Cart and Account buttons */}
      <div className="bg-white px-4 pt-3.5 pb-2.5 border-b border-stone-100/80 shadow-2xs">
        <div className="flex items-center justify-between gap-3">
          
          {/* Brand Logo & Store Name */}
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-emerald-800 text-amber-300 font-black font-serif flex items-center justify-center shadow-xs text-lg border border-emerald-700/50 select-none">
              ب
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-1">
                <span className="font-black text-base text-stone-900 tracking-tight leading-none">
                  Baraka<span className="text-emerald-700">markt</span><span className="text-amber-600 text-xs">24</span>
                </span>
                <span className="bg-emerald-50 text-emerald-800 text-[9px] font-bold px-1.5 py-0.2 rounded-md border border-emerald-200/50">
                  بلدي
                </span>
              </div>
              <span className="text-[10px] text-stone-500 font-medium">سوق ومؤونة شامية أصيلة</span>
            </div>
          </div>

          {/* Action Quick Buttons: Cart & Account */}
          <div className="flex items-center gap-2">
            
            {/* Quick Cart Button */}
            <button
              onClick={() => navigateTo('cart')}
              className="relative p-2.5 rounded-2xl bg-stone-50 hover:bg-emerald-50 text-stone-700 hover:text-emerald-800 border border-stone-200/80 hover:border-emerald-200 transition-all cursor-pointer active:scale-95 shadow-2xs flex items-center justify-center"
              aria-label="سلة المشتريات"
              title="سلة المشتريات"
            >
              <ShoppingBag className="w-4 h-4" />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-emerald-700 text-white text-[10px] font-black w-4.5 h-4.5 rounded-full flex items-center justify-center shadow-xs animate-in zoom-in font-sans">
                  {cartCount}
                </span>
              )}
            </button>

            {/* Quick Account Button */}
            <button
              onClick={() => navigateTo(currentUser ? 'profile' : 'auth')}
              className="p-2.5 rounded-2xl bg-stone-50 hover:bg-emerald-50 text-stone-700 hover:text-emerald-800 border border-stone-200/80 hover:border-emerald-200 transition-all cursor-pointer active:scale-95 shadow-2xs flex items-center justify-center"
              aria-label={currentUser ? 'حسابي' : 'تسجيل الدخول'}
              title={currentUser ? 'حسابي' : 'تسجيل الدخول'}
            >
              <UserIcon className="w-4 h-4" />
            </button>

          </div>

        </div>
      </div>

      {/* 2. Modern Arabic Search Bar */}
      <div className="px-4">
        <form onSubmit={handleSearchSubmit} className="relative">
          <input
            type="text"
            placeholder="ابحث عن مكدوس، زيت زيتون، فريكة، جبنة بلدية..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white border border-stone-200 text-xs px-4 py-3 rounded-2xl pr-10 pl-16 focus:border-emerald-700 focus:ring-2 focus:ring-emerald-700/10 focus:outline-hidden shadow-2xs text-stone-900 placeholder:text-stone-400 transition-all"
          />
          <Search className="w-4 h-4 text-stone-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
          <button
            type="submit"
            className="absolute left-1.5 top-1/2 -translate-y-1/2 bg-stone-900 hover:bg-stone-800 text-white text-[11px] font-bold px-3 py-1.5 rounded-xl cursor-pointer transition-colors active:scale-95"
          >
            بحث
          </button>
        </form>
      </div>

      {/* 3. Hero Promo Banner */}
      <div className="px-4">
        <div className="bg-gradient-to-l from-emerald-900 via-emerald-800 to-emerald-950 text-white rounded-3xl p-5 shadow-sm relative overflow-hidden">
          <div className="relative z-10 max-w-[72%] space-y-2">
            <span className="inline-flex items-center gap-1 bg-amber-400/20 text-amber-300 text-[10px] font-bold px-2 py-0.5 rounded-full border border-amber-400/30">
              <Sparkles className="w-3 h-3" />
              <span>مؤونة شامية بلدية 100%</span>
            </span>
            <h2 className="text-lg font-black leading-tight text-white">
              خيرات المدن السورية <br />
              <span className="text-amber-300">طازجة حتى باب بيتك</span>
            </h2>
            <p className="text-[11px] text-emerald-100/90 leading-normal">
              أجبان حماة، زيتون وزعتر حلب، وزيت زيتون عفرين عصرة أولى.
            </p>
            <button
              onClick={() => navigateTo('products')}
              className="mt-2 bg-white hover:bg-stone-100 text-emerald-900 text-xs font-black px-4 py-2 rounded-xl shadow-xs inline-flex items-center gap-1.5 cursor-pointer active:scale-95 transition-all"
            >
              <span>تسوق الأصناف</span>
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="absolute -left-6 -bottom-6 w-36 h-36 bg-emerald-700/50 rounded-full blur-xl pointer-events-none" />
          <div className="absolute left-2 bottom-2 text-6xl opacity-25 select-none pointer-events-none">
            🏺
          </div>
        </div>
      </div>

      {/* 4. Quick Perks Badges */}
      <div className="px-4">
        <div className="grid grid-cols-3 gap-2 bg-white p-3 rounded-2xl border border-stone-200/70 text-center shadow-2xs">
          <div className="flex flex-col items-center gap-1">
            <Truck className="w-4 h-4 text-emerald-700" />
            <span className="text-[10px] font-bold text-stone-800">شحن سريع</span>
            <span className="text-[9px] text-stone-500">لكافة المدن</span>
          </div>
          <div className="flex flex-col items-center gap-1 border-x border-stone-100">
            <ShieldCheck className="w-4 h-4 text-emerald-700" />
            <span className="text-[10px] font-bold text-stone-800">جودة أصلية</span>
            <span className="text-[9px] text-stone-500">طعم بلدي سوري</span>
          </div>
          <div className="flex flex-col items-center gap-1">
            <Clock className="w-4 h-4 text-emerald-700" />
            <span className="text-[10px] font-bold text-stone-800">طلب سهل</span>
            <span className="text-[9px] text-stone-500">خطوات سريعة</span>
          </div>
        </div>
      </div>

      {/* 5. Categories Section (Loaded dynamically from Firebase) */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between px-4">
          <div>
            <h3 className="font-extrabold text-sm text-stone-900">أقسام المتجر</h3>
            <p className="text-[11px] text-stone-500">تصفح حسب تصنيف المؤونة</p>
          </div>
          <button
            onClick={() => navigateTo('categories')}
            className="text-xs font-bold text-emerald-800 hover:text-emerald-900 flex items-center gap-0.5 cursor-pointer"
          >
            <span>عرض الكل</span>
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>
        </div>

        {activeCategories.length === 0 && isLoadingProducts ? (
          <div className="px-4">
            <CategoryPillsSkeleton count={5} />
          </div>
        ) : (
          <div className="flex gap-3 overflow-x-auto px-4 pb-2 no-scrollbar scroll-smooth">
            {activeCategories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => {
                  setSelectedCategoryId(cat.id);
                  navigateTo('products', { categoryId: cat.id });
                }}
                className="flex flex-col items-center gap-1.5 shrink-0 w-18 text-center group cursor-pointer"
              >
                <div className="w-16 h-16 rounded-2xl overflow-hidden bg-stone-100 border border-stone-200/80 p-0.5 group-hover:border-emerald-700 transition-colors shadow-2xs">
                  <OptimizedImage 
                    src={cat.image} 
                    alt={cat.nameAr || cat.name} 
                    className="w-full h-full object-cover rounded-xl group-hover:scale-105 transition-transform"
                    targetWidth={120}
                    quality={75}
                    fallbackSrc={FALLBACK_CATEGORY_IMAGE}
                  />
                </div>
                <span className="text-[10px] font-bold text-stone-800 line-clamp-1 leading-tight group-hover:text-emerald-800 transition-colors">
                  {cat.nameAr || cat.name}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* 6. Special Offers & Discounts Section (العروض والتخفيضات) */}
      {(discountProducts.length > 0 || (isLoadingProducts && products.length === 0)) && (
        <div className="space-y-3 px-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center shadow-2xs">
                <Percent className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-extrabold text-sm text-stone-900">عروض وتخفيضات خاصة</h3>
                <p className="text-[11px] text-stone-500">وفر على مشترياتك المفضلة</p>
              </div>
            </div>
            <button
              onClick={() => navigateTo('products')}
              className="text-xs font-bold text-emerald-800 hover:text-emerald-900 flex items-center gap-0.5 cursor-pointer"
            >
              <span>المزيد</span>
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {isLoadingProducts && products.length === 0 ? (
              <ProductCardSkeleton count={2} />
            ) : (
              discountProducts.map((prod) => (
                <ProductCard key={prod.id} product={prod} />
              ))
            )}
          </div>
        </div>
      )}

      {/* 7. Featured Products Section (المنتجات المميزة) */}
      {(featuredProducts.length > 0 || (isLoadingProducts && products.length === 0)) && (
        <div className="space-y-3 px-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shadow-2xs">
                <Flame className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-extrabold text-sm text-stone-900">المنتجات المميزة والأكثر طلباً</h3>
                <p className="text-[11px] text-stone-500">أفضل اختيارات المائدة السورية</p>
              </div>
            </div>
            <button
              onClick={() => navigateTo('products')}
              className="text-xs font-bold text-emerald-800 hover:text-emerald-900 flex items-center gap-0.5 cursor-pointer"
            >
              <span>عرض الكل</span>
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {isLoadingProducts && products.length === 0 ? (
              <ProductCardSkeleton count={2} />
            ) : (
              featuredProducts.map((prod) => (
                <ProductCard key={prod.id} product={prod} />
              ))
            )}
          </div>
        </div>
      )}

      {/* 8. New Arrivals Section (المنتجات الجديدة) with Category Filters & Lazy Loading / Pagination */}
      <div className="space-y-3 px-4 pt-1">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center shadow-2xs">
              <PackagePlus className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm text-stone-900">أحدث المنتجات والمؤونة</h3>
              <p className="text-[11px] text-stone-500">تمت إضافتها حديثاً إلى المتجر</p>
            </div>
          </div>
          <span className="text-[10px] text-stone-400 font-medium">
            {newArrivals.length} صنف متوفر
          </span>
        </div>

        {/* Category Filter Chips for New Products */}
        {categories.length > 0 && (
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
            <button
              onClick={() => {
                setSelectedQuickCategory('all');
                setVisibleNewCount(8);
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 transition-all cursor-pointer ${
                selectedQuickCategory === 'all'
                  ? 'bg-emerald-800 text-white shadow-xs'
                  : 'bg-white text-stone-600 border border-stone-200/80 hover:bg-stone-50'
              }`}
            >
              جميع الأصناف
            </button>

            {categories.map(cat => (
              <button
                key={cat.id}
                onClick={() => {
                  setSelectedQuickCategory(cat.id);
                  setVisibleNewCount(8);
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 transition-all cursor-pointer ${
                  selectedQuickCategory === cat.id
                    ? 'bg-emerald-800 text-white shadow-xs'
                    : 'bg-white text-stone-600 border border-stone-200/80 hover:bg-stone-50'
                }`}
              >
                {cat.nameAr || cat.name}
              </button>
            ))}
          </div>
        )}

        {/* New Products Grid or Skeleton or Empty State */}
        {isLoadingProducts && products.length === 0 ? (
          <div className="grid grid-cols-2 gap-3">
            <ProductCardSkeleton count={4} />
          </div>
        ) : newArrivals.length === 0 ? (
          <EmptyState
            title="لا توجد منتجات مسجلة في هذا القسم حالياً"
            description="جرب اختيار قسم آخر أو تصفح جميع الأصناف المتوفرة لدينا."
            actionText="عرض جميع الأصناف"
            onAction={() => {
              setSelectedQuickCategory('all');
              setVisibleNewCount(8);
            }}
          />
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {newArrivals.slice(0, visibleNewCount).map((prod) => (
              <ProductCard key={prod.id} product={prod} />
            ))}
          </div>
        )}

        {/* Load More Button (Pagination/Lazy Loading) */}
        {newArrivals.length > visibleNewCount && (
          <div className="pt-2 text-center">
            <button
              onClick={() => setVisibleNewCount(prev => prev + 8)}
              className="w-full bg-white hover:bg-stone-50 text-stone-800 border border-stone-200/90 text-xs font-bold py-3 rounded-2xl shadow-2xs flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-98"
            >
              <RefreshCw className="w-3.5 h-3.5 text-emerald-800" />
              <span>عرض المزيد من المنتجات ({newArrivals.length - visibleNewCount} متبقية)</span>
            </button>
          </div>
        )}

      </div>

    </div>
  );
};
