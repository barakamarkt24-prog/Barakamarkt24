import React, { useState, useMemo, useEffect, useRef } from 'react';
import { 
  Search, 
  X, 
  SlidersHorizontal, 
  ArrowUpDown, 
  Check, 
  ShoppingBag,
  Sparkles,
  Layers,
  ChevronLeft,
  ChevronRight,
  Filter,
  RotateCcw,
  Tag,
  Euro,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { ProductCard } from '../components/common/ProductCard';
import { ProductCardSkeleton } from '../components/common/LoadingSkeletons';
import { EmptyState } from '../components/common/EmptyState';
import { SortOption } from '../types';

export const ProductsScreen: React.FC = () => {
  const { 
    products, 
    categories, 
    subcategories, 
    selectedCategoryId, 
    setSelectedCategoryId,
    selectedSubcategoryId,
    setSelectedSubcategoryId,
    searchQuery,
    setSearchQuery,
    currentUser,
    currencySymbol,
    isLoadingProducts
  } = useApp();

  const productListRef = useRef<HTMLDivElement>(null);

  // Sorting & Filtering State
  const [sortBy, setSortBy] = useState<SortOption>('featured');
  const [inStockOnly, setInStockOnly] = useState<boolean>(true); // Default to showing available in-stock only as requested
  const [showFilterDrawer, setShowFilterDrawer] = useState<boolean>(false);
  
  // Price Filters State
  const [priceRange, setPriceRange] = useState<{ min: string; max: string }>({ min: '', max: '' });
  const [selectedPricePreset, setSelectedPricePreset] = useState<string>('all');

  // Pagination State
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [itemsPerPage, setItemsPerPage] = useState<number>(12);

  // Determine overall min and max price across all products
  const { maxStorePrice } = useMemo(() => {
    if (!products.length) return { maxStorePrice: 100 };
    const prices = products.map(p => p.price);
    return {
      maxStorePrice: Math.ceil(Math.max(...prices, 50))
    };
  }, [products]);

  // Subcategories belonging to the active category
  const availableSubcategories = useMemo(() => {
    if (!selectedCategoryId || selectedCategoryId === 'all') {
      return subcategories.filter(s => s.isActive !== false);
    }
    return subcategories.filter(s => s.categoryId === selectedCategoryId && s.isActive !== false);
  }, [subcategories, selectedCategoryId]);

  // Handle Quick Price Preset selection
  const handlePricePreset = (preset: string) => {
    setSelectedPricePreset(preset);
    switch (preset) {
      case 'under-5':
        setPriceRange({ min: '', max: '5' });
        break;
      case '5-15':
        setPriceRange({ min: '5', max: '15' });
        break;
      case '15-30':
        setPriceRange({ min: '15', max: '30' });
        break;
      case 'above-30':
        setPriceRange({ min: '30', max: '' });
        break;
      case 'all':
      default:
        setPriceRange({ min: '', max: '' });
        break;
    }
    setCurrentPage(1);
  };

  // Filtered & Sorted products
  const filteredProducts = useMemo(() => {
    let list = [...products];

    // 1. Availability / Stock Filter (عرض المنتجات المتوفرة فقط)
    if (inStockOnly) {
      list = list.filter(p => p.isAvailable !== false && p.inStock !== false && (p.stockCount === undefined || p.stockCount > 0));
    } else if (currentUser?.role !== 'admin') {
      // Non-admins shouldn't see hidden products
      list = list.filter(p => p.isAvailable !== false);
    }

    // 2. Category Filter (تصفية حسب القسم)
    if (selectedCategoryId && selectedCategoryId !== 'all') {
      list = list.filter(p => p.categoryId === selectedCategoryId);
    }

    // 3. Subcategory Filter (تصفية حسب القسم الفرعي)
    if (selectedSubcategoryId && selectedSubcategoryId !== 'all') {
      const sub = subcategories.find(s => 
        s.id === selectedSubcategoryId || 
        s.subcategoryId === selectedSubcategoryId || 
        s.nameAr === selectedSubcategoryId || 
        s.name === selectedSubcategoryId
      );
      const targetName = (sub ? (sub.nameAr || sub.name) : selectedSubcategoryId).toLowerCase().trim();
      const targetId = sub ? sub.id : selectedSubcategoryId;
      
      list = list.filter(p => {
        if (p.subcategoryId && (p.subcategoryId === targetId || p.subcategoryId === selectedSubcategoryId)) return true;
        if (p.subCategory) {
          const pSub = p.subCategory.toLowerCase();
          return pSub.includes(targetName) || targetName.includes(pSub) || pSub === targetId;
        }
        return false;
      });
    }

    // 4. Search by Product Name & Details (البحث باسم المنتج)
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(p => 
        (p.nameAr && p.nameAr.toLowerCase().includes(q)) ||
        (p.name && p.name.toLowerCase().includes(q)) ||
        (p.nameEn && p.nameEn.toLowerCase().includes(q)) ||
        (p.nameDe && p.nameDe.toLowerCase().includes(q)) ||
        (p.descriptionAr && p.descriptionAr.toLowerCase().includes(q)) ||
        (p.origin && p.origin.toLowerCase().includes(q)) ||
        (p.brand && p.brand.toLowerCase().includes(q))
      );
    }

    // 5. Price Filter (تصفية حسب السعر)
    const minVal = parseFloat(priceRange.min);
    const maxVal = parseFloat(priceRange.max);
    
    if (!isNaN(minVal) && minVal > 0) {
      list = list.filter(p => p.price >= minVal);
    }
    if (!isNaN(maxVal) && maxVal > 0) {
      list = list.filter(p => p.price <= maxVal);
    }

    // 6. Sorting
    switch (sortBy) {
      case 'price-asc':
        list.sort((a, b) => a.price - b.price);
        break;
      case 'price-desc':
        list.sort((a, b) => b.price - a.price);
        break;
      case 'rating':
        list.sort((a, b) => (b.rating || 0) - (a.rating || 0));
        break;
      case 'newest':
        list.sort((a, b) => {
          const timeA = (a.createdAt as any)?.seconds || 0;
          const timeB = (b.createdAt as any)?.seconds || 0;
          return timeB - timeA;
        });
        break;
      case 'featured':
      default:
        list.sort((a, b) => (b.isFeatured ? 1 : 0) - (a.isFeatured ? 1 : 0));
        break;
    }

    return list;
  }, [products, selectedCategoryId, selectedSubcategoryId, subcategories, searchQuery, inStockOnly, priceRange, sortBy, currentUser]);

  // Reset to page 1 whenever filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedCategoryId, selectedSubcategoryId, searchQuery, inStockOnly, priceRange, sortBy]);

  // Pagination Math
  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage) || 1;
  const paginatedProducts = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredProducts.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredProducts, currentPage, itemsPerPage]);

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
      if (productListRef.current) {
        productListRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  };

  // Reset all filters
  const handleResetFilters = () => {
    setSelectedCategoryId(null);
    setSelectedSubcategoryId(null);
    setSearchQuery('');
    setInStockOnly(true);
    setPriceRange({ min: '', max: '' });
    setSelectedPricePreset('all');
    setSortBy('featured');
    setCurrentPage(1);
  };

  // Active filters count
  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (selectedCategoryId && selectedCategoryId !== 'all') count++;
    if (selectedSubcategoryId && selectedSubcategoryId !== 'all') count++;
    if (searchQuery.trim()) count++;
    if (priceRange.min || priceRange.max || selectedPricePreset !== 'all') count++;
    if (!inStockOnly) count++; // if user changed default
    return count;
  }, [selectedCategoryId, selectedSubcategoryId, searchQuery, priceRange, selectedPricePreset, inStockOnly]);

  const activeCategory = categories.find(c => c.id === selectedCategoryId);
  const activeCategoryName = activeCategory ? (activeCategory.nameAr || activeCategory.name) : undefined;
  
  const activeSubcategory = subcategories.find(s => 
    s.id === selectedSubcategoryId || 
    s.subcategoryId === selectedSubcategoryId || 
    s.nameAr === selectedSubcategoryId || 
    s.name === selectedSubcategoryId
  );
  const activeSubcategoryName = activeSubcategory ? (activeSubcategory.nameAr || activeSubcategory.name) : (selectedSubcategoryId || undefined);

  return (
    <div className="space-y-4 pb-12 max-w-6xl mx-auto" dir="rtl" ref={productListRef}>
      
      {/* 1. Main Search & Filter Control Bar */}
      <div className="bg-white p-4 rounded-b-3xl border-b border-stone-200/80 shadow-2xs space-y-3">
        
        {/* Search Input Box */}
        <div className="relative">
          <input
            type="text"
            placeholder="ابحث باسم المنتج (مكدوس، زيت زيتون، فريكة، زعتر...)"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-stone-50 border border-stone-200/90 text-xs px-4 py-3 rounded-2xl pr-10 pl-20 focus:bg-white focus:border-emerald-700 focus:ring-2 focus:ring-emerald-700/10 focus:outline-hidden shadow-2xs text-stone-900 placeholder:text-stone-400 transition-all font-medium"
          />
          <Search className="w-4 h-4 text-stone-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
          
          <div className="absolute left-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="text-stone-400 hover:text-stone-700 p-1.5 rounded-lg hover:bg-stone-100 cursor-pointer transition-colors"
                title="مسح البحث"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
            
            {/* Filter Toggle Button */}
            <button
              onClick={() => setShowFilterDrawer(!showFilterDrawer)}
              className={`p-2 rounded-xl flex items-center gap-1 text-[11px] font-bold transition-all cursor-pointer ${
                showFilterDrawer || activeFiltersCount > 0
                  ? 'bg-emerald-800 text-white shadow-xs'
                  : 'bg-white border border-stone-200 text-stone-700 hover:bg-stone-100'
              }`}
              title="خيارات التصفية والفلاتر"
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">فلاتر</span>
              {activeFiltersCount > 0 && (
                <span className="bg-amber-400 text-stone-900 text-[10px] font-black w-4 h-4 rounded-full flex items-center justify-center">
                  {activeFiltersCount}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* 2. Category Filter Chips (تصفية حسب القسم) */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-[11px] font-bold text-stone-600 px-1">
            <span className="flex items-center gap-1">
              <Tag className="w-3 h-3 text-emerald-700" />
              الأقسام الرئيسية
            </span>
            {selectedCategoryId && (
              <button 
                onClick={() => {
                  setSelectedCategoryId(null);
                  setSelectedSubcategoryId(null);
                }}
                className="text-emerald-800 hover:text-emerald-900 cursor-pointer font-bold text-[10px]"
              >
                إلغاء تحديد القسم
              </button>
            )}
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
            <button
              onClick={() => {
                setSelectedCategoryId(null);
                setSelectedSubcategoryId(null);
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer shrink-0 ${
                !selectedCategoryId || selectedCategoryId === 'all'
                  ? 'bg-emerald-800 text-white shadow-xs'
                  : 'bg-stone-50 text-stone-600 border border-stone-200/80 hover:bg-stone-100'
              }`}
            >
              جميع الأقسام ({products.length})
            </button>

            {categories.filter(c => c.isActive !== false).map((cat) => {
              const isSelected = selectedCategoryId === cat.id;
              const catProductCount = products.filter(p => p.categoryId === cat.id).length;
              return (
                <button
                  key={cat.id}
                  onClick={() => {
                    setSelectedCategoryId(isSelected ? null : cat.id);
                    setSelectedSubcategoryId(null);
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer shrink-0 flex items-center gap-1.5 ${
                    isSelected
                      ? 'bg-emerald-800 text-white shadow-xs'
                      : 'bg-stone-50 text-stone-700 border border-stone-200/80 hover:bg-stone-100'
                  }`}
                >
                  <span>{cat.nameAr || cat.name}</span>
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                    isSelected ? 'bg-emerald-950 text-emerald-200' : 'bg-stone-200 text-stone-600'
                  }`}>
                    {catProductCount}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* 3. Subcategory Filter Chips (تصفية حسب القسم الفرعي) */}
        {availableSubcategories.length > 0 && (
          <div className="space-y-1.5 pt-1 border-t border-stone-100">
            <div className="flex items-center justify-between text-[11px] font-bold text-stone-600 px-1">
              <span className="flex items-center gap-1">
                <Layers className="w-3 h-3 text-emerald-700" />
                الأقسام الفرعية
                {activeCategoryName && <span className="text-emerald-800 font-normal">({activeCategoryName})</span>}
              </span>
              {selectedSubcategoryId && (
                <button 
                  onClick={() => setSelectedSubcategoryId(null)}
                  className="text-stone-500 hover:text-stone-800 cursor-pointer font-bold text-[10px]"
                >
                  الكل
                </button>
              )}
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
              <button
                onClick={() => setSelectedSubcategoryId(null)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold whitespace-nowrap transition-all cursor-pointer shrink-0 ${
                  !selectedSubcategoryId
                    ? 'bg-stone-900 text-white shadow-2xs'
                    : 'bg-white text-stone-600 border border-stone-200 hover:bg-stone-50'
                }`}
              >
                الكل
              </button>

              {availableSubcategories.map((sub) => {
                const isSelected = selectedSubcategoryId === sub.id || selectedSubcategoryId === sub.nameAr || selectedSubcategoryId === sub.name;
                return (
                  <button
                    key={sub.id}
                    onClick={() => setSelectedSubcategoryId(isSelected ? null : (sub.nameAr || sub.name || sub.id))}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold whitespace-nowrap transition-all cursor-pointer shrink-0 ${
                      isSelected
                        ? 'bg-emerald-700 text-white shadow-xs'
                        : 'bg-white text-stone-700 hover:bg-stone-50 border border-stone-200/80'
                    }`}
                  >
                    {sub.nameAr || sub.name}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* 4. Collapsible Advanced Filter Drawer (Price Filter & In-stock toggle) */}
        {showFilterDrawer && (
          <div className="pt-3 border-t border-stone-200/70 space-y-3 bg-stone-50/80 p-3 rounded-2xl animate-in fade-in slide-in-from-top-2 duration-200">
            
            {/* Price Filter Section (تصفية حسب السعر) */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-stone-900">
                <span className="flex items-center gap-1.5">
                  <Euro className="w-3.5 h-3.5 text-emerald-800" />
                  تصفية حسب السعر ({currencySymbol || '€'})
                </span>
                {(priceRange.min || priceRange.max) && (
                  <button
                    onClick={() => handlePricePreset('all')}
                    className="text-[10px] text-rose-600 hover:text-rose-800 font-bold cursor-pointer"
                  >
                    إلغاء تصفية السعر
                  </button>
                )}
              </div>

              {/* Price Preset Chips */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                {[
                  { id: 'all', label: 'جميع الأسعار' },
                  { id: 'under-5', label: `أقل من 5 ${currencySymbol || '€'}` },
                  { id: '5-15', label: `5 - 15 ${currencySymbol || '€'}` },
                  { id: '15-30', label: `15 - 30 ${currencySymbol || '€'}` },
                ].map((preset) => (
                  <button
                    key={preset.id}
                    onClick={() => handlePricePreset(preset.id)}
                    className={`py-1.5 px-2 rounded-xl text-[11px] font-bold text-center transition-all cursor-pointer ${
                      selectedPricePreset === preset.id
                        ? 'bg-emerald-800 text-white shadow-2xs'
                        : 'bg-white border border-stone-200 text-stone-700 hover:bg-stone-100'
                    }`}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>

              {/* Custom Min / Max Price Inputs */}
              <div className="flex items-center gap-2 pt-1">
                <div className="flex-1 flex items-center bg-white border border-stone-200 rounded-xl px-2.5 py-1.5 shadow-2xs">
                  <span className="text-[10px] text-stone-400 font-bold ml-1">من:</span>
                  <input
                    type="number"
                    min="0"
                    placeholder="0"
                    value={priceRange.min}
                    onChange={(e) => {
                      setSelectedPricePreset('custom');
                      setPriceRange(prev => ({ ...prev, min: e.target.value }));
                    }}
                    className="w-full text-xs font-bold text-stone-900 bg-transparent focus:outline-hidden"
                  />
                  <span className="text-[10px] text-stone-400 font-bold">{currencySymbol || '€'}</span>
                </div>

                <span className="text-stone-400 font-bold text-xs">-</span>

                <div className="flex-1 flex items-center bg-white border border-stone-200 rounded-xl px-2.5 py-1.5 shadow-2xs">
                  <span className="text-[10px] text-stone-400 font-bold ml-1">إلى:</span>
                  <input
                    type="number"
                    min="0"
                    placeholder={maxStorePrice.toString()}
                    value={priceRange.max}
                    onChange={(e) => {
                      setSelectedPricePreset('custom');
                      setPriceRange(prev => ({ ...prev, max: e.target.value }));
                    }}
                    className="w-full text-xs font-bold text-stone-900 bg-transparent focus:outline-hidden"
                  />
                  <span className="text-[10px] text-stone-400 font-bold">{currencySymbol || '€'}</span>
                </div>
              </div>
            </div>

            {/* In-Stock & Availability Toggle (عرض المنتجات المتوفرة فقط) */}
            <div className="pt-2 border-t border-stone-200/60 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle2 className={`w-4 h-4 ${inStockOnly ? 'text-emerald-700' : 'text-stone-400'}`} />
                <div>
                  <span className="text-xs font-bold text-stone-900 block">عرض المتوفر في المخزن فقط</span>
                  <span className="text-[10px] text-stone-500">إخفاء الأصناف غير المتوفرة حالياً</span>
                </div>
              </div>
              
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={inStockOnly}
                  onChange={(e) => setInStockOnly(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-10 h-5 bg-stone-300 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-stone-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-700"></div>
              </label>
            </div>

            {/* Items Per Page Selector for Pagination */}
            <div className="pt-2 border-t border-stone-200/60 flex items-center justify-between text-xs">
              <span className="font-bold text-stone-700">عدد المنتجات في كل صفحة:</span>
              <div className="flex items-center gap-1">
                {[8, 12, 24, 48].map((size) => (
                  <button
                    key={size}
                    onClick={() => {
                      setItemsPerPage(size);
                      setCurrentPage(1);
                    }}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                      itemsPerPage === size
                        ? 'bg-emerald-800 text-white'
                        : 'bg-white border border-stone-200 text-stone-600 hover:bg-stone-100'
                    }`}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>

          </div>
        )}

      </div>

      {/* 5. Results Count, Quick Stock Toggle & Sort Bar */}
      <div className="px-4 flex flex-wrap items-center justify-between gap-2 text-xs">
        
        {/* Results Counter */}
        <div className="text-stone-600 font-medium">
          تم العثور على <span className="font-extrabold text-stone-900">{filteredProducts.length}</span> منتج
          {filteredProducts.length > 0 && (
            <span className="text-stone-400 text-[11px] mr-1">
              (الصفحة {currentPage} من {totalPages})
            </span>
          )}
        </div>

        {/* Quick Actions (In-stock button & Sort Dropdown) */}
        <div className="flex items-center gap-2 shrink-0">
          
          {/* Quick In-Stock Filter Toggle */}
          <button
            onClick={() => setInStockOnly(!inStockOnly)}
            className={`px-2.5 py-1.5 rounded-xl text-[11px] font-bold border transition-all cursor-pointer flex items-center gap-1 ${
              inStockOnly 
                ? 'bg-emerald-50 text-emerald-800 border-emerald-300 shadow-2xs' 
                : 'bg-white text-stone-600 border-stone-200 hover:bg-stone-50'
            }`}
            title="تبديل عرض المتوفر فقط"
          >
            <Check className={`w-3 h-3 ${inStockOnly ? 'text-emerald-700' : 'text-stone-400'}`} />
            <span>المتوفر فقط</span>
          </button>

          {/* Sort Dropdown */}
          <div className="relative flex items-center">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              className="bg-white border border-stone-200 text-stone-800 text-[11px] font-bold rounded-xl px-2.5 py-1.5 focus:border-emerald-700 focus:ring-1 focus:ring-emerald-700/20 focus:outline-hidden cursor-pointer shadow-2xs"
            >
              <option value="featured">الأكثر تميزاً</option>
              <option value="newest">الأحدث وصولاً</option>
              <option value="price-asc">السعر: من الأقل للأعلى</option>
              <option value="price-desc">السعر: من الأعلى للأقل</option>
              <option value="rating">الأعلى تقييماً</option>
            </select>
          </div>

        </div>

      </div>

      {/* 6. Active Filters Badges */}
      {activeFiltersCount > 0 && (
        <div className="px-4 flex flex-wrap items-center gap-1.5">
          <span className="text-[11px] text-stone-400 font-bold">الفلاتر المطبقة:</span>
          
          {activeCategoryName && (
            <span className="bg-emerald-50 text-emerald-800 text-[11px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1 border border-emerald-200">
              القسم: {activeCategoryName}
              <button 
                onClick={() => {
                  setSelectedCategoryId(null);
                  setSelectedSubcategoryId(null);
                }} 
                className="hover:text-emerald-950 cursor-pointer"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          )}

          {activeSubcategoryName && (
            <span className="bg-stone-100 text-stone-800 text-[11px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1 border border-stone-200">
              الفرعي: {activeSubcategoryName}
              <button 
                onClick={() => setSelectedSubcategoryId(null)} 
                className="hover:text-stone-950 cursor-pointer"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          )}

          {searchQuery && (
            <span className="bg-stone-100 text-stone-800 text-[11px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1 border border-stone-200">
              البحث: "{searchQuery}"
              <button onClick={() => setSearchQuery('')} className="hover:text-stone-950 cursor-pointer">
                <X className="w-3 h-3" />
              </button>
            </span>
          )}

          {(priceRange.min || priceRange.max) && (
            <span className="bg-amber-50 text-amber-900 text-[11px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1 border border-amber-200">
              السعر: {priceRange.min || '0'} - {priceRange.max || maxStorePrice} {currencySymbol || '€'}
              <button onClick={() => handlePricePreset('all')} className="hover:text-amber-950 cursor-pointer">
                <X className="w-3 h-3" />
              </button>
            </span>
          )}

          {/* Clear All Reset Button */}
          <button
            onClick={handleResetFilters}
            className="text-[11px] font-bold text-rose-600 hover:text-rose-800 flex items-center gap-1 mr-1 cursor-pointer"
          >
            <RotateCcw className="w-3 h-3" />
            <span>إعادة ضبط الكل</span>
          </button>
        </div>
      )}

      {/* 7. Product Grid with Firebase Data */}
      <div className="px-4">
        {isLoadingProducts && products.length === 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3.5">
            <ProductCardSkeleton count={8} />
          </div>
        ) : paginatedProducts.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3.5">
            {paginatedProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <EmptyState
            title="لا توجد منتجات مطابقة لخيارات البحث"
            description="حاول تقليل الفلاتر أو البحث بكلمات أخرى أو تعديل نطاق السعر المحدد"
            actionText="إعادة ضبط وعرض كافة المنتجات"
            onAction={handleResetFilters}
          />
        )}
      </div>

      {/* 8. Pagination Navigation Bar (دعم Pagination) */}
      {totalPages > 1 && (
        <div className="px-4 pt-4">
          <div className="bg-white rounded-2xl border border-stone-200/80 p-3 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-3">
            
            {/* Previous Page Button */}
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className={`w-full sm:w-auto px-4 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                currentPage === 1
                  ? 'bg-stone-100 text-stone-400 cursor-not-allowed'
                  : 'bg-stone-50 hover:bg-emerald-50 text-stone-700 hover:text-emerald-800 border border-stone-200/80 active:scale-95'
              }`}
            >
              <ChevronRight className="w-4 h-4" />
              <span>الصفحة السابقة</span>
            </button>

            {/* Numeric Page Buttons */}
            <div className="flex items-center gap-1 overflow-x-auto no-scrollbar py-1">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => {
                // Show first, last, current, and adjacent pages
                const isAdjacent = Math.abs(pageNum - currentPage) <= 1;
                const isFirstOrLast = pageNum === 1 || pageNum === totalPages;

                if (!isAdjacent && !isFirstOrLast) {
                  if (pageNum === 2 || pageNum === totalPages - 1) {
                    return <span key={pageNum} className="text-stone-400 text-xs px-1">...</span>;
                  }
                  return null;
                }

                const isActive = currentPage === pageNum;

                return (
                  <button
                    key={pageNum}
                    onClick={() => handlePageChange(pageNum)}
                    className={`w-8 h-8 rounded-xl text-xs font-bold flex items-center justify-center transition-all cursor-pointer font-mono ${
                      isActive
                        ? 'bg-emerald-800 text-white shadow-xs scale-105'
                        : 'bg-stone-50 text-stone-700 hover:bg-stone-100 border border-stone-200/70'
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
            </div>

            {/* Next Page Button */}
            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className={`w-full sm:w-auto px-4 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                currentPage === totalPages
                  ? 'bg-stone-100 text-stone-400 cursor-not-allowed'
                  : 'bg-stone-50 hover:bg-emerald-50 text-stone-700 hover:text-emerald-800 border border-stone-200/80 active:scale-95'
              }`}
            >
              <span>الصفحة التالية</span>
              <ChevronLeft className="w-4 h-4" />
            </button>

          </div>

          {/* Bottom Summary Bar */}
          <div className="text-center pt-2 text-[11px] text-stone-500 font-medium">
            عرض {paginatedProducts.length} من إجمالي {filteredProducts.length} منتج
          </div>
        </div>
      )}

    </div>
  );
};
