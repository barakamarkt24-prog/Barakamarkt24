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
  ChevronRight, 
  ShoppingBag, 
  User as UserIcon, 
  LogIn, 
  Tag, 
  ArrowRight, 
  PackagePlus, 
  RefreshCw, 
  AlertCircle, 
  RotateCcw, 
  X, 
  SlidersHorizontal, 
  SearchX, 
  Grid 
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { ProductCard } from '../components/common/ProductCard';
import { ProductCardSkeleton, CategoryPillsSkeleton } from '../components/common/LoadingSkeletons';
import { EmptyState } from '../components/common/EmptyState';
import { OptimizedImage } from '../components/common/OptimizedImage';
import { FALLBACK_CATEGORY_IMAGE } from '../utils/imageOptimizer';
import { BrandLogo } from '../components/common/BrandLogo';
import { AnnouncementTicker } from '../components/common/AnnouncementTicker';
import { LanguageSwitcher } from '../components/common/LanguageSwitcher';
import { orderService } from '../services/orderService';
import { Order, Product } from '../types';
import { searchProducts, POPULAR_SEARCH_SUGGESTIONS } from '../utils/searchEngine';

export const HomeScreen: React.FC = () => {
  const { 
    categories, 
    subcategories, 
    products, 
    navigateTo, 
    selectedCategoryId, 
    setSelectedCategoryId, 
    searchQuery, 
    setSearchQuery, 
    cartCount, 
    currentUser, 
    isLoadingProducts, 
    storeSettings, 
    currencySymbol, 
    reorderOrder,
    dir,
    t,
    getCategoryName,
    getProductName
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

  // Category filter inside search results
  const [searchCategoryFilter, setSearchCategoryFilter] = useState<string>('all');

  // Active home filter tab: 'all' | 'offers' | 'featured' | 'new' or specific category id
  const [activeTabFilter, setActiveTabFilter] = useState<string>('all');
  
  // Selected category on home page (defaults to 'all' or active selected category)
  const [activeCategoryFilter, setActiveCategoryFilter] = useState<string>('all');

  // Pagination / Limit for products stream
  const [visibleProductsCount, setVisibleProductsCount] = useState<number>(12);

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

  // Filtered displayed products based on selected tab and category
  const displayedProducts = useMemo(() => {
    let list = [...visibleProducts];

    // Filter by category if selected
    if (activeCategoryFilter !== 'all') {
      list = list.filter(p => p.categoryId === activeCategoryFilter);
    }

    // Filter or sort by tab
    if (activeTabFilter === 'offers') {
      list = list.filter(p => {
        const oldP = p.oldPrice || p.originalPrice;
        return Boolean((oldP && oldP > p.price) || (p.discount && p.discount > 0));
      });
    } else if (activeTabFilter === 'featured') {
      list = list.filter(p => p.isFeatured || p.isBestseller);
    } else if (activeTabFilter === 'new') {
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
      list.sort((a, b) => getTimestamp(b.createdAt) - getTimestamp(a.createdAt));
    }

    return list;
  }, [visibleProducts, activeCategoryFilter, activeTabFilter]);

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

  const handleCategorySelect = (categoryId: string) => {
    if (activeCategoryFilter === categoryId) {
      setActiveCategoryFilter('all');
    } else {
      setActiveCategoryFilter(categoryId);
    }
    setVisibleProductsCount(12);
  };

  const isSearchActive = Boolean(searchTerm.trim().length > 0);

  return (
    <div className="space-y-4 pb-12 max-w-5xl mx-auto" dir={dir}>
      
      {/* 1. Header with Official Logo, Language Switcher, Cart and Account buttons */}
      <header className="bg-white px-4 pt-3 pb-2.5 border-b border-stone-200/80 shadow-2xs sticky top-0 z-40 backdrop-blur-md bg-white/95">
        <div className="flex items-center justify-between gap-3 max-w-5xl mx-auto">
          
          {/* Brand Official Logo */}
          <button 
            onClick={() => {
              setActiveCategoryFilter('all');
              setActiveTabFilter('all');
              setSearchTerm('');
              setSearchQuery('');
            }}
            className="cursor-pointer text-left transition-transform active:scale-98"
          >
            <BrandLogo variant="compact" size="md" showSubtitle={true} />
          </button>

          {/* Action Buttons: Language Switcher, Quick Cart & Account / Login */}
          <div className="flex items-center gap-2">
            
            {/* Language Switcher Button */}
            <LanguageSwitcher variant="compact" />

            {/* Quick Cart Button */}
            <button
              onClick={() => navigateTo('cart')}
              className="relative p-2.5 rounded-2xl bg-stone-50 hover:bg-emerald-50 text-stone-700 hover:text-[#005A36] border border-stone-200/80 hover:border-emerald-200 transition-all cursor-pointer active:scale-95 shadow-2xs flex items-center justify-center"
              aria-label={t('nav.cart')}
              title={t('nav.cart')}
            >
              <ShoppingBag className="w-4 h-4" />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-[#005A36] text-white text-[10px] font-black w-4.5 h-4.5 rounded-full flex items-center justify-center shadow-xs animate-in zoom-in font-sans">
                  {cartCount}
                </span>
              )}
            </button>

            {/* Quick Account / Login Button */}
            {currentUser ? (
              <button
                onClick={() => navigateTo('profile')}
                className="px-3 py-2 rounded-2xl bg-stone-50 hover:bg-emerald-50 text-stone-700 hover:text-[#005A36] border border-stone-200/80 hover:border-emerald-200 transition-all cursor-pointer active:scale-95 shadow-2xs flex items-center gap-1.5 text-xs font-bold"
                aria-label={t('nav.profile')}
                title={t('nav.profile')}
              >
                <UserIcon className="w-4 h-4 text-[#005A36]" />
                <span className="hidden sm:inline line-clamp-1 max-w-[90px]">
                  {currentUser.name ? currentUser.name.split(' ')[0] : t('nav.profile')}
                </span>
              </button>
            ) : (
              <button
                onClick={() => navigateTo('auth')}
                className="px-3 py-2 rounded-2xl bg-[#005A36] hover:bg-[#00472a] text-white transition-all cursor-pointer active:scale-95 shadow-2xs flex items-center gap-1.5 text-xs font-bold"
                aria-label={t('auth.loginBtn')}
                title={t('auth.loginBtn')}
              >
                <LogIn className="w-3.5 h-3.5 text-[#3B8EAA]" />
                <span>{t('auth.loginBtn')}</span>
              </button>
            )}

          </div>

        </div>
      </header>

      {/* 2. Announcement Ticker (Directly below Header and above Search) */}
      <AnnouncementTicker />

      {/* Store Closed Notice Banner if isOpen is false in Firebase settings */}
      {storeSettings?.isOpen === false && (
        <div className="mx-4 bg-amber-500/10 border border-amber-500/30 text-amber-950 p-3.5 rounded-2xl flex items-start gap-3 shadow-2xs">
          <AlertCircle className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
          <div className="text-xs space-y-0.5">
            <div className="font-extrabold text-amber-900">{t('home.storeClosed')}</div>
            <div className="text-[11px] text-amber-800/90 leading-relaxed">
              {storeSettings.closedMessageAr || t('home.storeClosedDesc')}
            </div>
          </div>
        </div>
      )}

      {/* 3. Search Bar (Below Announcement) */}
      <div className="px-4 space-y-2">
        <form onSubmit={handleSearchSubmit} className="relative">
          <input
            type="text"
            placeholder={t('home.searchPlaceholder')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={`w-full bg-white border border-stone-200 text-xs px-4 py-3 rounded-2xl ${dir === 'rtl' ? 'pr-10 pl-20' : 'pl-10 pr-20'} focus:border-[#005A36] focus:ring-2 focus:ring-[#005A36]/10 focus:outline-hidden shadow-2xs text-stone-900 placeholder:text-stone-400 transition-all font-medium`}
          />
          <Search className={`w-4 h-4 text-[#005A36] absolute ${dir === 'rtl' ? 'right-3.5' : 'left-3.5'} top-1/2 -translate-y-1/2`} />
          
          <div className={`absolute ${dir === 'rtl' ? 'left-1.5' : 'right-1.5'} top-1/2 -translate-y-1/2 flex items-center gap-1`}>
            {searchTerm.trim().length > 0 && (
              <button
                type="button"
                onClick={handleClearSearch}
                className="p-1.5 text-stone-400 hover:text-stone-700 rounded-lg hover:bg-stone-100 transition-colors"
                title={t('common.clear')}
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
            <button
              type="submit"
              className="bg-[#005A36] hover:bg-[#00472a] text-white text-[11px] font-bold px-3 py-1.5 rounded-xl cursor-pointer transition-colors active:scale-95 shadow-2xs"
            >
              {t('common.search')}
            </button>
          </div>
        </form>

        {/* Popular Quick Search Suggestion Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar pt-0.5">
          <span className="text-[10px] text-stone-400 font-bold shrink-0 flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-[#3B8EAA]" />
            {t('home.popular')}:
          </span>
          {POPULAR_SEARCH_SUGGESTIONS.map((sug, idx) => {
            const label = t(sug.key) !== sug.key ? t(sug.key) : sug.fallbackLabel;
            return (
              <button
                key={idx}
                type="button"
                onClick={() => handleSelectQuickTag(sug.query)}
                className={`text-[10px] font-bold px-2.5 py-1 rounded-xl shrink-0 transition-all cursor-pointer ${
                  searchTerm.trim() === sug.query
                    ? 'bg-[#005A36] text-white shadow-2xs'
                    : 'bg-white hover:bg-stone-100 text-stone-600 border border-stone-200/70'
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>

      {/* ========================================================= */}
      {/* 4. CONDITIONAL RENDER: SEARCH RESULTS OR STOREFRONT       */}
      {/* ========================================================= */}
      {isSearchActive ? (
        <div className="px-4 space-y-4 pt-1">
          {/* Search Header Bar */}
          <div className="bg-white border border-stone-200/80 rounded-2xl p-3.5 space-y-2.5 shadow-2xs">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-extrabold text-sm text-stone-900 flex items-center gap-1.5">
                  <span>{t('home.searchResultsFor')}:</span>
                  <span className="text-[#005A36] font-serif font-black">"{searchTerm}"</span>
                </h3>
                <p className="text-[11px] text-stone-500 font-medium pt-0.5">
                  {t('home.foundProducts', { count: searchResults.length })}
                </p>
              </div>
              <button
                type="button"
                onClick={handleClearSearch}
                className="text-xs text-rose-600 hover:text-rose-700 bg-rose-50 border border-rose-200/60 font-bold px-2.5 py-1.5 rounded-xl flex items-center gap-1 cursor-pointer transition-colors shadow-2xs active:scale-95"
              >
                <X className="w-3.5 h-3.5" />
                <span>{t('home.clearSearch')}</span>
              </button>
            </div>

            {/* If fuzzy / spelling similarity matches are surfaced */}
            {searchResults.some(r => r.isFuzzyMatch) && (
              <div className="bg-teal-50 border border-teal-200/70 text-[#2B7A8D] text-[11px] font-medium p-2 rounded-xl flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-[#3B8EAA] shrink-0" />
                <span>{t('home.fuzzyNotice')}</span>
              </div>
            )}

            {/* Category Filter Chips for search results if multiple categories exist */}
            {searchResultCategories.length > 1 && (
              <div className="flex items-center gap-1.5 overflow-x-auto pt-1 no-scrollbar">
                <button
                  onClick={() => setSearchCategoryFilter('all')}
                  className={`text-[11px] font-bold px-2.5 py-1 rounded-xl shrink-0 transition-all cursor-pointer ${
                    searchCategoryFilter === 'all'
                      ? 'bg-[#005A36] text-white shadow-2xs'
                      : 'bg-white text-stone-600 border border-stone-200 hover:bg-stone-50'
                  }`}
                >
                  {t('home.allResults')} ({searchResults.length})
                </button>
                {searchResultCategories.map((cat) => {
                  const catMatchesCount = searchResults.filter(r => r.product.categoryId === cat.id).length;
                  return (
                    <button
                      key={cat.id}
                      onClick={() => setSearchCategoryFilter(cat.id)}
                      className={`text-[11px] font-bold px-2.5 py-1 rounded-xl shrink-0 transition-all cursor-pointer ${
                        searchCategoryFilter === cat.id
                          ? 'bg-[#005A36] text-white shadow-2xs'
                          : 'bg-white text-stone-600 border border-stone-200 hover:bg-stone-50'
                      }`}
                    >
                      {getCategoryName(cat)} ({catMatchesCount})
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Search Results Grid or Empty State */}
          {filteredSearchResults.length === 0 ? (
            <div className="bg-white rounded-3xl p-6 border border-stone-200/80 text-center space-y-4 shadow-2xs">
              <div className="w-16 h-16 rounded-full bg-stone-100 text-stone-600 flex items-center justify-center mx-auto">
                <SearchX className="w-8 h-8 text-[#3B8EAA]" />
              </div>
              <div className="space-y-1">
                <h4 className="font-extrabold text-sm text-stone-900">
                  {t('home.noResultsFound')} "{searchTerm}"
                </h4>
                <p className="text-xs text-stone-500 leading-relaxed max-w-sm mx-auto">
                  {t('home.noResultsDesc')}
                </p>
              </div>

              {/* Suggestions to click */}
              <div className="space-y-2 pt-2 border-t border-stone-100">
                <span className="text-xs font-bold text-stone-700 block">{t('home.popularSuggestions')}:</span>
                <div className="flex flex-wrap justify-center gap-1.5">
                  {POPULAR_SEARCH_SUGGESTIONS.map((sug, idx) => {
                    const label = t(sug.key) !== sug.key ? t(sug.key) : sug.fallbackLabel;
                    return (
                      <button
                        key={idx}
                        onClick={() => handleSelectQuickTag(sug.query)}
                        className="text-xs font-bold px-3 py-1.5 rounded-xl bg-stone-100 hover:bg-emerald-50 hover:text-[#005A36] text-stone-700 border border-stone-200/60 cursor-pointer transition-colors"
                      >
                        {label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleClearSearch}
                  className="bg-[#005A36] hover:bg-[#00472a] text-white font-bold text-xs px-5 py-2.5 rounded-xl shadow-2xs cursor-pointer transition-all active:scale-95"
                >
                  {t('home.clearAndBrowse')}
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
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
          {/* 4. Categories Section (Below Search - Clean & Compact) */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between px-4">
              <div>
                <h3 className="font-extrabold text-sm text-stone-900 flex items-center gap-1.5">
                  <Grid className="w-4 h-4 text-[#005A36]" />
                  <span>{t('home.storeCategories')}</span>
                </h3>
                <p className="text-[11px] text-stone-500">{t('home.selectCategorySub')}</p>
              </div>
              <button
                onClick={() => navigateTo('categories')}
                className="text-xs font-bold text-[#005A36] hover:text-[#00472a] flex items-center gap-0.5 cursor-pointer py-1 px-2 rounded-xl hover:bg-emerald-50 transition-colors"
              >
                <span>{t('common.viewAll')}</span>
                {dir === 'rtl' ? <ChevronLeft className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
              </button>
            </div>

            {activeCategories.length === 0 && isLoadingProducts ? (
              <div className="px-4">
                <CategoryPillsSkeleton count={5} />
              </div>
            ) : (
              <div className="flex gap-2.5 overflow-x-auto px-4 pb-1 no-scrollbar scroll-smooth">
                {/* All Categories Button */}
                <button
                  onClick={() => handleCategorySelect('all')}
                  className={`flex flex-col items-center gap-1.5 shrink-0 w-16 text-center group cursor-pointer transition-all`}
                >
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center border transition-all shadow-2xs ${
                    activeCategoryFilter === 'all'
                      ? 'bg-[#005A36] text-white border-[#005A36] shadow-xs'
                      : 'bg-white text-stone-700 border-stone-200/80 group-hover:border-[#005A36]'
                  }`}>
                    <Grid className="w-6 h-6" />
                  </div>
                  <span className={`text-[10px] font-bold line-clamp-1 leading-tight ${
                    activeCategoryFilter === 'all' ? 'text-[#005A36] font-extrabold' : 'text-stone-700'
                  }`}>
                    {t('common.all')}
                  </span>
                </button>

                {/* Firestore Categories */}
                {activeCategories.map((cat) => {
                  const isSelected = activeCategoryFilter === cat.id;
                  const localizedCatName = getCategoryName(cat);
                  return (
                    <button
                      key={cat.id}
                      onClick={() => handleCategorySelect(cat.id)}
                      className="flex flex-col items-center gap-1.5 shrink-0 w-16 text-center group cursor-pointer transition-all"
                    >
                      <div className={`w-14 h-14 rounded-2xl overflow-hidden bg-stone-100 border p-0.5 transition-all shadow-2xs ${
                        isSelected 
                          ? 'border-[#005A36] ring-2 ring-[#005A36]/30 shadow-xs' 
                          : 'border-stone-200/80 group-hover:border-[#005A36]'
                      }`}>
                        <OptimizedImage 
                          src={cat.image} 
                          alt={localizedCatName} 
                          className="w-full h-full object-cover rounded-xl group-hover:scale-105 transition-transform"
                          targetWidth={100}
                          quality={75}
                          fallbackSrc={FALLBACK_CATEGORY_IMAGE}
                        />
                      </div>
                      <span className={`text-[10px] font-bold line-clamp-1 leading-tight transition-colors ${
                        isSelected ? 'text-[#005A36] font-extrabold' : 'text-stone-800 group-hover:text-[#005A36]'
                      }`}>
                        {localizedCatName}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Quick Repeat Last Order banner if logged in */}
          {currentUser && lastDeliveredOrder && lastDeliveredOrder.items && lastDeliveredOrder.items.length > 0 && (
            <div className="px-4">
              <div className="bg-stone-900 text-white rounded-2xl p-3.5 shadow-2xs space-y-2.5 border border-stone-800">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-xl bg-[#005A36] text-white flex items-center justify-center shadow-2xs">
                      <RotateCcw className="w-3.5 h-3.5 text-[#3B8EAA]" />
                    </div>
                    <div>
                      <h3 className="font-bold text-xs text-white">{t('home.lastPurchases')}</h3>
                      <p className="text-[10px] text-stone-400">{t('orders.orderNumber')} #{lastDeliveredOrder.orderId || lastDeliveredOrder.id}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => reorderOrder(lastDeliveredOrder)}
                    className="bg-[#3B8EAA] hover:bg-[#2B7A8D] text-white text-[11px] font-bold px-3 py-1.5 rounded-xl cursor-pointer shadow-xs active:scale-95 transition-all flex items-center gap-1.5"
                  >
                    <ShoppingBag className="w-3.5 h-3.5" />
                    <span>{t('orders.reorder')}</span>
                  </button>
                </div>

                <div className="flex gap-2 overflow-x-auto pb-0.5 no-scrollbar">
                  {lastDeliveredOrder.items.slice(0, 5).map((item, idx) => (
                    <span key={idx} className="bg-stone-800 text-stone-200 text-[10px] px-2 py-1 rounded-lg shrink-0 border border-stone-700/60">
                      {(item.product ? getProductName(item.product) : item.name) || ''} ({item.quantity})
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* 5. Products Section (Directly Below Categories) */}
          <div className="space-y-3 px-4 pt-1">
            {/* Products Header & Tab Filters */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 bg-white p-3 rounded-2xl border border-stone-200/80 shadow-2xs">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-xl bg-emerald-50 text-[#005A36] flex items-center justify-center shadow-2xs">
                  <PackagePlus className="w-4 h-4 text-[#005A36]" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm text-stone-900">
                    {activeCategoryFilter === 'all'
                      ? t('home.allProducts')
                      : (categories.find(c => c.id === activeCategoryFilter) ? getCategoryName(categories.find(c => c.id === activeCategoryFilter)!) : t('home.allProducts'))}
                  </h3>
                  <p className="text-[11px] text-stone-500">
                    {displayedProducts.length} {t('common.products')}
                  </p>
                </div>
              </div>

              {/* Filter Tabs */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 no-scrollbar">
                <button
                  onClick={() => {
                    setActiveTabFilter('all');
                    setVisibleProductsCount(12);
                  }}
                  className={`text-[11px] font-bold px-3 py-1.5 rounded-xl shrink-0 transition-all cursor-pointer ${
                    activeTabFilter === 'all'
                      ? 'bg-[#005A36] text-white shadow-2xs'
                      : 'bg-stone-50 hover:bg-stone-100 text-stone-600 border border-stone-200/70'
                  }`}
                >
                  {t('common.all')}
                </button>

                <button
                  onClick={() => {
                    setActiveTabFilter('offers');
                    setVisibleProductsCount(12);
                  }}
                  className={`text-[11px] font-bold px-2.5 py-1.5 rounded-xl shrink-0 transition-all cursor-pointer flex items-center gap-1 ${
                    activeTabFilter === 'offers'
                      ? 'bg-rose-600 text-white shadow-2xs'
                      : 'bg-rose-50 hover:bg-rose-100/80 text-rose-700 border border-rose-200/60'
                  }`}
                >
                  <Percent className="w-3 h-3" />
                  <span>{t('home.specialOffers')}</span>
                </button>

                <button
                  onClick={() => {
                    setActiveTabFilter('featured');
                    setVisibleProductsCount(12);
                  }}
                  className={`text-[11px] font-bold px-2.5 py-1.5 rounded-xl shrink-0 transition-all cursor-pointer flex items-center gap-1 ${
                    activeTabFilter === 'featured'
                      ? 'bg-[#3B8EAA] text-white shadow-2xs'
                      : 'bg-teal-50 hover:bg-teal-100/80 text-[#2B7A8D] border border-teal-200/60'
                  }`}
                >
                  <Flame className="w-3 h-3" />
                  <span>{t('home.bestsellers')}</span>
                </button>

                <button
                  onClick={() => {
                    setActiveTabFilter('new');
                    setVisibleProductsCount(12);
                  }}
                  className={`text-[11px] font-bold px-2.5 py-1.5 rounded-xl shrink-0 transition-all cursor-pointer flex items-center gap-1 ${
                    activeTabFilter === 'new'
                      ? 'bg-[#005A36] text-white shadow-2xs'
                      : 'bg-stone-50 hover:bg-stone-100 text-stone-600 border border-stone-200/70'
                  }`}
                >
                  <Sparkles className="w-3 h-3 text-amber-500" />
                  <span>{t('home.newArrivals')}</span>
                </button>
              </div>
            </div>

            {/* Products Grid or Skeleton or Empty State */}
            {isLoadingProducts && products.length === 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                <ProductCardSkeleton count={4} />
              </div>
            ) : displayedProducts.length === 0 ? (
              <EmptyState
                title={t('home.noCategoryProducts')}
                description={t('home.noCategoryProductsDesc')}
                actionText={t('home.viewAllProducts')}
                onAction={() => {
                  setActiveCategoryFilter('all');
                  setActiveTabFilter('all');
                  setVisibleProductsCount(12);
                }}
              />
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {displayedProducts.slice(0, visibleProductsCount).map((prod) => (
                  <ProductCard key={prod.id} product={prod} />
                ))}
              </div>
            )}

            {/* Load More Button (Pagination/Lazy Loading) */}
            {displayedProducts.length > visibleProductsCount && (
              <div className="pt-2 text-center">
                <button
                  onClick={() => setVisibleProductsCount(prev => prev + 12)}
                  className="w-full bg-white hover:bg-stone-50 text-stone-800 border border-stone-200/90 text-xs font-bold py-3 rounded-2xl shadow-2xs flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-98"
                >
                  <RefreshCw className="w-3.5 h-3.5 text-[#005A36]" />
                  <span>{t('home.loadMore')} ({displayedProducts.length - visibleProductsCount})</span>
                </button>
              </div>
            )}

          </div>
        </>
      )}

    </div>
  );
};
