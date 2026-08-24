import React, { useMemo, useState, useEffect } from 'react';
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
  RefreshCw,
  AlertCircle,
  RotateCcw,
  X,
  SlidersHorizontal,
  SearchX
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { ProductCard } from '../components/common/ProductCard';
import { ProductCardSkeleton, CategoryPillsSkeleton } from '../components/common/LoadingSkeletons';
import { EmptyState } from '../components/common/EmptyState';
import { OptimizedImage } from '../components/common/OptimizedImage';
import { FALLBACK_CATEGORY_IMAGE } from '../utils/imageOptimizer';
import { orderService } from '../services/orderService';
import { Order } from '../types';
import { searchProducts, POPULAR_SEARCH_SUGGESTIONS } from '../utils/searchEngine';

export const HomeScreen: React.FC = () => {
  const { 
    categories, 
    subcategories,
    products, 
    navigateTo, 
    setSelectedCategoryId,
    searchQuery,
    setSearchQuery,
    cartCount,
    currentUser,
    isLoadingProducts,
    storeSettings,
    currencySymbol,
    reorderOrder
  } = useApp();

  // Local immediate search input state for instantaneous keystroke responsiveness
  const [searchTerm, setSearchTerm] = useState<string>(searchQuery);

  // Debounce syncing local searchTerm to global searchQuery (250ms)
  useEffect(() => {
    const handler = setTimeout(() => {
      if (searchTerm !== searchQuery) {
        setSearchQuery(searchTerm);
      }
    }, 250);

    return () => clearTimeout(handler);
  }, [searchTerm, searchQuery, setSearchQuery]);

  // Keep local searchTerm in sync if external code updates searchQuery
  useEffect(() => {
    setSearchTerm(searchQuery);
  }, [searchQuery]);

  // Category filter inside search results (if user wants to narrow down search results)
  const [searchCategoryFilter, setSearchCategoryFilter] = useState<string>('all');

  // Selected quick filter pill for categories in new arrivals
  const [selectedQuickCategory, setSelectedQuickCategory] = useState<string>('all');
  
  // Pagination / Limit for newly added / general products stream
  const [visibleNewCount, setVisibleNewCount] = useState<number>(8);

  // Last delivered order for logged in customer
  const [lastDeliveredOrder, setLastDeliveredOrder] = useState<Order | null>(null);

  useEffect(() => {
    if (currentUser?.id) {
      const unsub = orderService.subscribeToOrders((userOrders) => {
        const delivered = userOrders.find(o => o.status === 'delivered') || userOrders[0] || null;
        setLastDeliveredOrder(delivered);
      }, currentUser.id);

      return () => unsub();
    } else {
      setLastDeliveredOrder(null);
    }
  }, [currentUser?.id]);

  // Filter active categories for display
  const activeCategories = useMemo(() => {
    return categories.filter(c => c.isActive !== false);
  }, [categories]);

  // Filter products that are available/visible
  const visibleProducts = useMemo(() => {
    return products.filter(p => p.isAvailable !== false);
  }, [products]);

  // Perform smart search on visible products
  const searchResults = useMemo(() => {
    const query = searchTerm.trim();
    if (!query) return [];
    return searchProducts(visibleProducts, query, {
      categories: activeCategories,
      subcategories,
      includeUnavailable: false,
      limit: 60
    });
  }, [visibleProducts, searchTerm, activeCategories, subcategories]);

  // Filter search results by category if user selected a category filter
  const filteredSearchResults = useMemo(() => {
    if (searchCategoryFilter === 'all') return searchResults;
    return searchResults.filter(r => r.product.categoryId === searchCategoryFilter);
  }, [searchResults, searchCategoryFilter]);

  // Available categories in the current search results for quick chips
  const searchResultCategories = useMemo(() => {
    if (searchResults.length === 0) return [];
    const catIdSet = new Set(searchResults.map(r => r.product.categoryId));
    return activeCategories.filter(c => catIdSet.has(c.id));
  }, [searchResults, activeCategories]);

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
    setSearchQuery(searchTerm);
  };

  const handleClearSearch = () => {
    setSearchTerm('');
    setSearchQuery('');
    setSearchCategoryFilter('all');
  };

  const handleSelectQuickTag = (tagQuery: string) => {
    setSearchTerm(tagQuery);
    setSearchQuery(tagQuery);
    setSearchCategoryFilter('all');
  };

  const isSearchActive = Boolean(searchTerm.trim().length > 0);

  return (
    <div className="space-y-5 pb-12" dir="rtl">
      
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

      {/* 2. Professional Multi-language Intelligent Search Bar */}
      <div className="px-4 space-y-2">
        <form onSubmit={handleSearchSubmit} className="relative">
          <input
            type="text"
            placeholder="ابحث بالعربية أو الألمانية أو الإنجليزية (جبنة، زيت، Schafskäse)..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-white border border-stone-200 text-xs px-4 py-3 rounded-2xl pr-10 pl-20 focus:border-emerald-700 focus:ring-2 focus:ring-emerald-700/10 focus:outline-hidden shadow-2xs text-stone-900 placeholder:text-stone-400 transition-all font-medium"
          />
          <Search className="w-4 h-4 text-emerald-800 absolute right-3.5 top-1/2 -translate-y-1/2" />
          
          <div className="absolute left-1.5 top-1/2 -translate-y-1/2 flex items-center gap-1">
            {searchTerm.trim().length > 0 && (
              <button
                type="button"
                onClick={handleClearSearch}
                className="p-1.5 text-stone-400 hover:text-stone-700 rounded-lg hover:bg-stone-100 transition-colors"
                title="مسح البحث"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
            <button
              type="submit"
              className="bg-emerald-800 hover:bg-emerald-900 text-white text-[11px] font-bold px-3 py-1.5 rounded-xl cursor-pointer transition-colors active:scale-95 shadow-2xs"
            >
              بحث
            </button>
          </div>
        </form>

        {/* Popular Quick Search Suggestion Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar pt-0.5">
          <span className="text-[10px] text-stone-400 font-bold shrink-0 flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-amber-500" />
            شائع:
          </span>
          {POPULAR_SEARCH_SUGGESTIONS.map((sug, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleSelectQuickTag(sug.query)}
              className={`text-[10px] font-bold px-2.5 py-1 rounded-xl shrink-0 transition-all cursor-pointer ${
                searchTerm.trim() === sug.query
                  ? 'bg-emerald-800 text-white shadow-2xs'
                  : 'bg-stone-100 hover:bg-stone-200/80 text-stone-600 border border-stone-200/60'
              }`}
            >
              {sug.label}
            </button>
          ))}
        </div>
      </div>

      {/* ========================================================= */}
      {/* 3. CONDITIONAL RENDER: SEARCH RESULTS OR HOME STOREFRONT   */}
      {/* ========================================================= */}
      {isSearchActive ? (
        <div className="px-4 space-y-4 pt-1">
          {/* Search Header Bar */}
          <div className="bg-stone-50 border border-stone-200/80 rounded-2xl p-3.5 space-y-2.5">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-extrabold text-sm text-stone-900 flex items-center gap-1.5">
                  <span>نتائج البحث عن:</span>
                  <span className="text-emerald-800 font-serif font-black">"{searchTerm}"</span>
                </h3>
                <p className="text-[11px] text-stone-500 font-medium pt-0.5">
                  تم العثور على <span className="font-bold text-stone-800 font-sans">{searchResults.length}</span> منتج متوفر
                </p>
              </div>
              <button
                type="button"
                onClick={handleClearSearch}
                className="text-xs text-rose-600 hover:text-rose-700 bg-rose-50 border border-rose-200/60 font-bold px-2.5 py-1.5 rounded-xl flex items-center gap-1 cursor-pointer transition-colors shadow-2xs active:scale-95"
              >
                <X className="w-3.5 h-3.5" />
                <span>إلغاء البحث</span>
              </button>
            </div>

            {/* If fuzzy / spelling similarity matches are surfaced */}
            {searchResults.some(r => r.isFuzzyMatch) && (
              <div className="bg-amber-50 border border-amber-200/70 text-amber-900 text-[11px] font-medium p-2 rounded-xl flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                <span>عرضنا نتائج مطابقة وتقريبية ذكية تشمل الكلمات المشابهة لبحثك.</span>
              </div>
            )}

            {/* Category Filter Chips for search results if multiple categories exist */}
            {searchResultCategories.length > 1 && (
              <div className="flex items-center gap-1.5 overflow-x-auto pt-1 no-scrollbar">
                <button
                  onClick={() => setSearchCategoryFilter('all')}
                  className={`text-[11px] font-bold px-2.5 py-1 rounded-xl shrink-0 transition-all cursor-pointer ${
                    searchCategoryFilter === 'all'
                      ? 'bg-emerald-800 text-white shadow-2xs'
                      : 'bg-white text-stone-600 border border-stone-200 hover:bg-stone-50'
                  }`}
                >
                  جميع النتائج ({searchResults.length})
                </button>
                {searchResultCategories.map((cat) => {
                  const catMatchesCount = searchResults.filter(r => r.product.categoryId === cat.id).length;
                  return (
                    <button
                      key={cat.id}
                      onClick={() => setSearchCategoryFilter(cat.id)}
                      className={`text-[11px] font-bold px-2.5 py-1 rounded-xl shrink-0 transition-all cursor-pointer ${
                        searchCategoryFilter === cat.id
                          ? 'bg-emerald-800 text-white shadow-2xs'
                          : 'bg-white text-stone-600 border border-stone-200 hover:bg-stone-50'
                      }`}
                    >
                      {cat.nameAr || cat.name} ({catMatchesCount})
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Search Results Grid or Empty State */}
          {filteredSearchResults.length === 0 ? (
            <div className="bg-white rounded-3xl p-6 border border-stone-200/80 text-center space-y-4 shadow-2xs">
              <div className="w-16 h-16 rounded-full bg-amber-50 text-amber-700 flex items-center justify-center mx-auto">
                <SearchX className="w-8 h-8" />
              </div>
              <div className="space-y-1">
                <h4 className="font-extrabold text-sm text-stone-900">
                  لم نجد أي منتج يطابق "{searchTerm}"
                </h4>
                <p className="text-xs text-stone-500 leading-relaxed max-w-sm mx-auto">
                  تأكد من كتابة الكلمة بشكل صحيح، أو جرب البحث بكلمات عامة مثل (جبن، زيت، فريكة، زعتر) أو باللغة الألمانية/الإنجليزية (Käse, Oil).
                </p>
              </div>

              {/* Suggestions to click */}
              <div className="space-y-2 pt-2 border-t border-stone-100">
                <span className="text-xs font-bold text-stone-700 block">اقتراحات بحث شائعة:</span>
                <div className="flex flex-wrap justify-center gap-1.5">
                  {POPULAR_SEARCH_SUGGESTIONS.map((sug, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSelectQuickTag(sug.query)}
                      className="text-xs font-bold px-3 py-1.5 rounded-xl bg-stone-100 hover:bg-emerald-50 hover:text-emerald-800 text-stone-700 border border-stone-200/60 cursor-pointer transition-colors"
                    >
                      {sug.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleClearSearch}
                  className="bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-xs px-5 py-2.5 rounded-xl shadow-2xs cursor-pointer transition-all active:scale-95"
                >
                  مسح البحث وتصفح كافة الأقسام
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {filteredSearchResults.map((result) => (
                <ProductCard 
                  key={result.product.id} 
                  product={result.product} 
                />
              ))}
            </div>
          )}
        </div>
      ) : (
        <>
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

          {/* 4.1 Last Purchases Section for Logged-In Customer */}
          {currentUser && lastDeliveredOrder && lastDeliveredOrder.items && lastDeliveredOrder.items.length > 0 && (
            <div className="px-4">
              <div className="bg-stone-900 text-white rounded-3xl p-4 shadow-sm space-y-3 border border-stone-800">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-emerald-800 text-amber-300 flex items-center justify-center shadow-2xs">
                      <RotateCcw className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="font-black text-xs text-white">آخر مشترياتك</h3>
                      <p className="text-[10px] text-stone-400">طلب #{lastDeliveredOrder.orderId || lastDeliveredOrder.id} • {lastDeliveredOrder.items.length} أصناف</p>
                    </div>
                  </div>
                  <button
                    onClick={() => reorderOrder(lastDeliveredOrder)}
                    className="bg-amber-400 hover:bg-amber-300 text-stone-950 text-[11px] font-black px-3 py-1.5 rounded-xl cursor-pointer shadow-xs active:scale-95 transition-all flex items-center gap-1.5"
                  >
                    <ShoppingBag className="w-3.5 h-3.5" />
                    <span>إعادة طلب الكل</span>
                  </button>
                </div>

                <div className="flex gap-2.5 overflow-x-auto pb-1 no-scrollbar">
                  {lastDeliveredOrder.items.slice(0, 6).map((item, idx) => {
                    const liveProduct = products.find(p => p.id === item.product?.id || p.productId === item.product?.id);
                    const displayPrice = liveProduct ? liveProduct.price : item.product?.price;
                    const isAvail = liveProduct ? (liveProduct.isAvailable !== false && liveProduct.inStock !== false) : true;

                    return (
                      <div key={idx} className="bg-stone-800/80 rounded-2xl p-2 shrink-0 w-28 border border-stone-700/60 flex flex-col justify-between">
                        <div className="relative w-full h-16 rounded-xl overflow-hidden mb-1.5 bg-stone-900">
                          <img 
                            src={item.product?.image || 'https://images.unsplash.com/photo-1552767059-ce182ead6c1b?auto=format&fit=crop&w=150&q=80'} 
                            alt={item.product?.nameAr}
                            className="w-full h-full object-cover"
                          />
                          {!isAvail && (
                            <span className="absolute inset-0 bg-black/60 text-white text-[8px] font-bold flex items-center justify-center text-center p-1">
                              غير متاح
                            </span>
                          )}
                        </div>
                        <div>
                          <span className="text-[10px] font-bold text-stone-100 line-clamp-1 block">
                            {item.product?.nameAr || item.product?.name}
                          </span>
                          <span className="text-[9px] text-amber-300 font-sans font-bold">
                            {item.quantity} × {currencySymbol || '€'}{displayPrice?.toFixed(2)}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

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
        </>
      )}

    </div>
  );
};
