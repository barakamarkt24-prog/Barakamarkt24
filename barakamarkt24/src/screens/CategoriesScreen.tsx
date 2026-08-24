import React, { useState } from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
  Grid, 
  Layers, 
  Package, 
  ArrowRight,
  Sparkles,
  Filter
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Category, Subcategory } from '../types';
import { OptimizedImage } from '../components/common/OptimizedImage';
import { FALLBACK_CATEGORY_IMAGE } from '../utils/imageOptimizer';

export const CategoriesScreen: React.FC = () => {
  const { 
    categories, 
    subcategories, 
    products, 
    navigateTo, 
    setSelectedCategoryId, 
    setSelectedSubcategoryId 
  } = useApp();

  // Active category selected for viewing subcategories (hierarchical navigation)
  const [activeCategory, setActiveCategory] = useState<Category | null>(null);

  // Active categories only
  const activeCategories = categories.filter(c => c.isActive !== false);

  const getProductCount = (categoryId: string, subCategoryName?: string) => {
    if (subCategoryName) {
      const subLower = subCategoryName.toLowerCase().trim();
      return products.filter(p => {
        if (p.categoryId !== categoryId) return false;
        if (!p.subCategory) return false;
        const pSub = p.subCategory.toLowerCase();
        return pSub.includes(subLower) || subLower.includes(pSub);
      }).length;
    }
    return products.filter(p => p.categoryId === categoryId).length;
  };

  const getCategorySubcategories = (categoryId: string): Subcategory[] => {
    return subcategories.filter(s => s.categoryId === categoryId && s.isActive !== false);
  };

  // Handler when clicking a main category
  const handleCategoryClick = (category: Category) => {
    const subs = getCategorySubcategories(category.id);
    if (subs.length > 0) {
      // Step 2: Show subcategories
      setActiveCategory(category);
    } else {
      // Step 4: If no subcategories, show products directly
      setSelectedCategoryId(category.id);
      setSelectedSubcategoryId(null);
      navigateTo('products', { categoryId: category.id });
    }
  };

  // Handler when clicking a subcategory
  const handleSubcategoryClick = (category: Category, subcategory: Subcategory) => {
    setSelectedCategoryId(category.id);
    setSelectedSubcategoryId(subcategory.id);
    navigateTo('products', { 
      categoryId: category.id, 
      subcategoryId: subcategory.nameAr || subcategory.name 
    });
  };

  // Handler to view all products in category from subcategory screen
  const handleViewAllCategoryProducts = (category: Category) => {
    setSelectedCategoryId(category.id);
    setSelectedSubcategoryId(null);
    navigateTo('products', { categoryId: category.id });
  };

  return (
    <div className="p-4 space-y-4 pb-12 max-w-5xl mx-auto">
      
      {/* If drilling down into a category */}
      {activeCategory ? (
        <div className="space-y-4 animate-fadeIn">
          {/* Breadcrumb / Back Button */}
          <div className="flex items-center justify-between bg-white p-3 rounded-2xl border border-stone-200/80 shadow-2xs">
            <button
              onClick={() => setActiveCategory(null)}
              className="flex items-center gap-1.5 text-xs font-bold text-emerald-800 hover:text-emerald-900 px-2 py-1.5 rounded-xl hover:bg-emerald-50 transition-colors cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
              <span>العودة إلى جميع الأقسام</span>
            </button>
            <span className="text-xs font-semibold text-stone-500">
              {getCategorySubcategories(activeCategory.id).length} أقسام فرعية
            </span>
          </div>

          {/* Active Category Header Card */}
          <div className="relative rounded-2xl overflow-hidden border border-stone-200/80 bg-stone-900 text-white shadow-xs">
            <OptimizedImage 
              src={activeCategory.image} 
              alt={activeCategory.nameAr || activeCategory.name} 
              className="w-full h-36 sm:h-44 object-cover opacity-40"
              targetWidth={500}
              quality={75}
              fallbackSrc={FALLBACK_CATEGORY_IMAGE}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent p-4 flex flex-col justify-end">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-600 text-white text-[11px] font-bold">
                  قسم رئيسي
                </span>
                <span className="text-xs text-stone-300">
                  {getProductCount(activeCategory.id)} منتج إجمالي
                </span>
              </div>
              <h2 className="text-lg font-black text-white mt-1">
                {activeCategory.nameAr || activeCategory.name}
              </h2>
              {(activeCategory.descriptionAr || activeCategory.description) && (
                <p className="text-xs text-stone-300 line-clamp-2 mt-0.5">
                  {activeCategory.descriptionAr || activeCategory.description}
                </p>
              )}
            </div>
          </div>

          {/* Direct "View All" in Category */}
          <div 
            onClick={() => handleViewAllCategoryProducts(activeCategory)}
            className="bg-emerald-50 border border-emerald-200/80 rounded-2xl p-3.5 flex items-center justify-between cursor-pointer hover:bg-emerald-100/70 transition-all group"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-800 text-white flex items-center justify-center font-bold">
                <Package className="w-4 h-4" />
              </div>
              <div>
                <h4 className="font-bold text-xs text-emerald-950">عرض جميع منتجات {activeCategory.nameAr || activeCategory.name}</h4>
                <p className="text-[11px] text-emerald-700">تصفح كافة الأصناف دون فلترة فرعية ({getProductCount(activeCategory.id)} صنف)</p>
              </div>
            </div>
            <div className="flex items-center gap-1 text-xs font-bold text-emerald-900 group-hover:-translate-x-1 transition-transform">
              <span>عرض الكل</span>
              <ChevronLeft className="w-4 h-4" />
            </div>
          </div>

          {/* Subcategories Grid */}
          <div className="space-y-2">
            <h3 className="font-bold text-xs text-stone-700 flex items-center gap-1.5 px-1">
              <Layers className="w-3.5 h-3.5 text-emerald-700" />
              <span>الأقسام الفرعية التابعة:</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {getCategorySubcategories(activeCategory.id).map((sub) => {
                const subCount = getProductCount(activeCategory.id, sub.nameAr || sub.name);
                return (
                  <div
                    key={sub.id}
                    onClick={() => handleSubcategoryClick(activeCategory, sub)}
                    className="bg-white rounded-2xl border border-stone-200/80 p-3 shadow-2xs hover:shadow-md hover:border-emerald-300 transition-all cursor-pointer flex items-center justify-between group active:scale-[0.99]"
                  >
                    <div className="flex items-center gap-3 overflow-hidden">
                      {sub.image ? (
                        <img 
                          src={sub.image} 
                          alt={sub.nameAr || sub.name}
                          className="w-12 h-12 rounded-xl object-cover border border-stone-100 shrink-0" 
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-xl bg-stone-100 flex items-center justify-center text-stone-400 shrink-0">
                          <Layers className="w-5 h-5" />
                        </div>
                      )}
                      <div className="space-y-0.5 truncate">
                        <h4 className="font-bold text-xs text-stone-900 group-hover:text-emerald-800 transition-colors truncate">
                          {sub.nameAr || sub.name}
                        </h4>
                        {sub.nameEn && (
                          <p className="text-[10px] text-stone-400 truncate">{sub.nameEn}</p>
                        )}
                        <span className="inline-block text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
                          {subCount > 0 ? `${subCount} صنف` : 'متوفر للطلب'}
                        </span>
                      </div>
                    </div>

                    <div className="w-7 h-7 rounded-lg bg-stone-50 group-hover:bg-emerald-800 group-hover:text-white flex items-center justify-center text-stone-400 transition-colors shrink-0 mr-2">
                      <ChevronLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      ) : (
        /* Main Categories View */
        <div className="space-y-4">
          {/* Header Banner */}
          <div className="bg-white p-4 rounded-2xl border border-stone-200/80 shadow-2xs flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
                <Grid className="w-5 h-5" />
              </div>
              <div>
                <h2 className="font-extrabold text-sm text-stone-900">أقسام المؤونة والبقالية السورية</h2>
                <p className="text-xs text-stone-500">اضغط على أي قسم لاستعراض أقسامه الفرعية وأصنافه البلدية</p>
              </div>
            </div>
            <span className="text-xs font-bold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-xl border border-emerald-200/60 hidden sm:inline-block">
              {activeCategories.length} قسم معتمد
            </span>
          </div>

          {/* Main Categories Grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3.5">
            {activeCategories.map((cat) => {
              const count = getProductCount(cat.id);
              const subsCount = getCategorySubcategories(cat.id).length;

              return (
                <div
                  key={cat.id}
                  onClick={() => handleCategoryClick(cat)}
                  className="bg-white rounded-2xl border border-stone-200/80 overflow-hidden shadow-2xs hover:shadow-md hover:border-emerald-300 transition-all cursor-pointer flex flex-col justify-between group active:scale-[0.98]"
                >
                  {/* Image & Count badges */}
                  <div className="relative aspect-4/3 overflow-hidden bg-stone-100">
                    <OptimizedImage 
                      src={cat.image} 
                      alt={cat.nameAr || cat.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      targetWidth={300}
                      quality={75}
                      fallbackSrc={FALLBACK_CATEGORY_IMAGE}
                    />
                    <div className="absolute top-2 right-2 flex flex-col gap-1">
                      {subsCount > 0 && (
                        <span className="bg-stone-900/85 backdrop-blur-xs text-white text-[10px] font-bold px-2 py-0.5 rounded-md shadow-xs">
                          {subsCount} أقسام فرعية
                        </span>
                      )}
                    </div>
                    <span className="absolute bottom-2 right-2 bg-emerald-800/90 backdrop-blur-xs text-white text-[10px] font-bold px-2 py-0.5 rounded-md">
                      {count} أصناف
                    </span>
                  </div>

                  {/* Text info */}
                  <div className="p-3 space-y-1 grow flex flex-col justify-between">
                    <div>
                      <h3 className="font-bold text-xs text-stone-900 group-hover:text-emerald-800 transition-colors line-clamp-1">
                        {cat.nameAr || cat.name}
                      </h3>
                      {(cat.descriptionAr || cat.description) && (
                        <p className="text-[10px] text-stone-500 line-clamp-2 leading-relaxed mt-1">
                          {cat.descriptionAr || cat.description}
                        </p>
                      )}
                    </div>

                    {/* Browse footer */}
                    <div className="pt-2 flex items-center justify-between text-[11px] font-bold text-emerald-800 border-t border-stone-100 mt-2">
                      <span>{subsCount > 0 ? 'تصفح الأقسام الفرعية' : 'تصفح المنتجات'}</span>
                      <ChevronLeft className="w-3.5 h-3.5 group-hover:-translate-x-1 transition-transform" />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

    </div>
  );
};
