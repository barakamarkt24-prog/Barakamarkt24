import React, { useState } from 'react';
import { 
  ShoppingBag, 
  Search, 
  Heart, 
  Truck, 
  Sparkles, 
  ChefHat, 
  Globe, 
  ChevronDown, 
  Phone,
  PackageCheck,
  X,
  Layers
} from 'lucide-react';
import { Currency, Language, Product } from '../types';
import { CURRENCY_CONFIGS, DICTIONARY, formatPrice } from '../utils/helpers';
import { CATEGORIES } from '../data/categories';

interface NavbarProps {
  language: Language;
  setLanguage: (lang: Language) => void;
  currency: Currency;
  setCurrency: (cur: Currency) => void;
  cartCount: number;
  openCart: () => void;
  wishlistCount: number;
  openWishlist: () => void;
  openChefAI: () => void;
  openTrackOrder: () => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  selectedCategory: string | null;
  setSelectedCategory: (catId: string | null) => void;
  products: Product[];
  onSelectProduct: (product: Product) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  language,
  setLanguage,
  currency,
  setCurrency,
  cartCount,
  openCart,
  wishlistCount,
  openWishlist,
  openChefAI,
  openTrackOrder,
  searchQuery,
  setSearchQuery,
  selectedCategory,
  setSelectedCategory,
  products,
  onSelectProduct
}) => {
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [showCategoryMenu, setShowCategoryMenu] = useState(false);
  const t = DICTIONARY[language];

  // Filter search suggestions
  const searchSuggestions = searchQuery.trim().length > 1
    ? products.filter(p => 
        p.nameAr.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.nameEn.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.brand.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.origin.toLowerCase().includes(searchQuery.toLowerCase())
      ).slice(0, 6)
    : [];

  return (
    <header className="sticky top-0 z-40 bg-[#F4F8F4]/95 backdrop-blur-md border-b border-[#D5E5D7] shadow-xs">
      {/* Top Announcement Bar */}
      <div className="bg-[#3D6E4B] text-[#E8F4EA] text-xs font-medium py-2 px-4 border-b border-[#315A3D]">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1.5 bg-[#2E553A] text-amber-200 px-2.5 py-0.5 rounded-full text-[11px] font-bold border border-[#4B7D5A] shadow-xs">
              <Truck className="w-3 h-3 text-amber-300" />
              {t.freeShippingNotice}
            </span>
            <span className="hidden md:inline-block text-[#B8DCBF]">|</span>
            <span className="hidden md:inline-flex items-center gap-1 text-[#D2EAD6] text-[11px]">
              📍 غرايفسفالد (Greifswald) • توصيل للمنازل
            </span>
          </div>

          <div className="flex items-center gap-3.5 text-[12px]">
            <button 
              onClick={openTrackOrder}
              className="hover:text-white transition-colors flex items-center gap-1 cursor-pointer font-medium"
            >
              <PackageCheck className="w-3.5 h-3.5 text-amber-300" />
              <span>{t.trackOrder}</span>
            </button>

            <span className="text-[#5A8E68]">|</span>

            {/* Currency Selector */}
            <div className="relative flex items-center gap-1">
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value as Currency)}
                className="bg-[#2E553A] text-[#E8F4EA] text-xs rounded-md px-2 py-0.5 border border-[#4B7D5A] focus:outline-hidden cursor-pointer"
              >
                {Object.keys(CURRENCY_CONFIGS).map((cur) => (
                  <option key={cur} value={cur}>
                    {cur} ({CURRENCY_CONFIGS[cur as Currency].symbol})
                  </option>
                ))}
              </select>
            </div>

            {/* Language Selector */}
            <div className="flex items-center gap-1 bg-[#2E553A] rounded-md px-1.5 py-0.5 border border-[#4B7D5A]">
              <Globe className="w-3 h-3 text-[#B8DCBF]" />
              <button 
                onClick={() => setLanguage('ar')} 
                className={`px-1.5 py-0.2 rounded text-[11px] transition-colors ${language === 'ar' ? 'bg-[#3D6E4B] text-amber-200 font-bold' : 'text-[#B8DCBF] hover:text-white'}`}
              >
                العربية
              </button>
              <button 
                onClick={() => setLanguage('de')} 
                className={`px-1.5 py-0.2 rounded text-[11px] transition-colors ${language === 'de' ? 'bg-[#3D6E4B] text-amber-200 font-bold' : 'text-[#B8DCBF] hover:text-white'}`}
              >
                DE
              </button>
              <button 
                onClick={() => setLanguage('en')} 
                className={`px-1.5 py-0.2 rounded text-[11px] transition-colors ${language === 'en' ? 'bg-[#3D6E4B] text-amber-200 font-bold' : 'text-[#B8DCBF] hover:text-white'}`}
              >
                EN
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Navigation Bar */}
      <div className="max-w-7xl mx-auto px-4 py-3 sm:py-3.5">
        <div className="flex items-center justify-between gap-3 sm:gap-6">
          
          {/* Logo & Brand Identity */}
          <div 
            onClick={() => { setSelectedCategory(null); setSearchQuery(''); }}
            className="flex items-center gap-2.5 cursor-pointer group select-none shrink-0"
          >
            <div className="w-10 h-10 sm:w-11 sm:h-11 bg-[#3D6E4B] rounded-xl flex items-center justify-center text-amber-300 shadow-md shadow-[#3D6E4B]/15 group-hover:scale-105 transition-transform duration-200 border border-[#4E825D]">
              <span className="text-xl sm:text-2xl font-black font-serif">ب</span>
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-lg sm:text-xl tracking-tight text-[#1B3022] font-sans">
                  Baraka<span className="text-[#3D6E4B]">markt</span>
                </span>
                <span className="bg-[#E2EFE4] text-[#245233] text-[10px] font-extrabold px-2 py-0.5 rounded-full border border-[#C5DEC8]">
                  غرايفسفالد 📍
                </span>
              </div>
              <p className="text-[11px] text-[#4A6350] font-medium hidden sm:block">
                مؤونة المدن السورية • توصيل خلال ساعتين ⚡
              </p>
            </div>
          </div>

          {/* Search Input with Autocomplete */}
          <div className="flex-1 max-w-2xl relative">
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => setIsSearchFocused(true)}
                onBlur={() => setTimeout(() => setIsSearchFocused(false), 250)}
                placeholder={t.searchPlaceholder}
                className="w-full bg-[#EBF3EC] hover:bg-[#E2EFE4] focus:bg-white text-[#1B3022] placeholder:text-[#64806A] text-xs sm:text-sm rounded-xl py-2.5 sm:py-3 pr-10 pl-10 border border-[#D1E3D4] focus:border-[#3D6E4B] focus:ring-2 focus:ring-[#3D6E4B]/15 outline-hidden transition-all shadow-inner"
              />
              <Search className="w-4 h-4 text-[#64806A] absolute right-3.5 top-1/2 -translate-y-1/2" />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 p-0.5"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Live Autocomplete Dropdown */}
            {isSearchFocused && searchSuggestions.length > 0 && (
              <div className="absolute top-full right-0 left-0 mt-2 bg-white rounded-2xl shadow-xl border border-[#D5E5D7] overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                <div className="p-2.5 bg-[#F4F8F4] border-b border-[#D5E5D7] text-xs font-semibold text-[#3D6E4B] flex justify-between items-center">
                  <span>منتجات متوفرة للتوصيل الفوري بغرايفسفالد</span>
                  <span className="bg-[#E2EFE4] text-[#245233] px-2 py-0.5 rounded-full font-bold text-[11px]">{searchSuggestions.length} نتيجة</span>
                </div>
                <div className="divide-y divide-[#EDF4EE] max-h-80 overflow-y-auto">
                  {searchSuggestions.map((product) => (
                    <div
                      key={product.id}
                      onClick={() => {
                        onSelectProduct(product);
                        setIsSearchFocused(false);
                      }}
                      className="p-2.5 hover:bg-[#F4F8F4] cursor-pointer flex items-center justify-between gap-3 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <img 
                          src={product.image} 
                          alt={product.nameAr}
                          className="w-10 h-10 object-cover rounded-xl border border-[#D5E5D7]"
                        />
                        <div>
                          <p className="text-sm font-bold text-[#1B3022] line-clamp-1">
                            {language === 'ar' ? product.nameAr : (language === 'de' ? product.nameDe : product.nameEn)}
                          </p>
                          <div className="flex items-center gap-2 text-xs text-[#527059]">
                            <span className="text-[#3D6E4B] font-bold">📍 {product.origin}</span>
                            <span>•</span>
                            <span>{product.weight}</span>
                          </div>
                        </div>
                      </div>
                      <div className="text-left font-extrabold text-[#3D6E4B] text-sm whitespace-nowrap">
                        {formatPrice(product.price, currency)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
            {/* Chef AI Assistant Button */}
            <button
              onClick={openChefAI}
              className="hidden lg:flex items-center gap-1.5 bg-[#E8F4EA] hover:bg-[#D7ECDA] text-[#245233] text-xs font-bold px-3 py-2 rounded-xl border border-[#B8DCBF] transition-all cursor-pointer shadow-xs"
            >
              <ChefHat className="w-4 h-4 text-[#3D6E4B]" />
              <span>{t.chefAIButton}</span>
            </button>

            {/* Wishlist Button */}
            <button
              onClick={openWishlist}
              className="p-2 sm:p-2.5 text-[#3D6E4B] hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors relative cursor-pointer border border-transparent hover:border-rose-200"
              title="المفضلة"
            >
              <Heart className="w-5 h-5" />
              {wishlistCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-rose-600 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                  {wishlistCount}
                </span>
              )}
            </button>

            {/* Cart Button */}
            <button
              onClick={openCart}
              className="flex items-center gap-2 bg-[#3D6E4B] hover:bg-[#315A3D] text-white px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl shadow-md shadow-[#3D6E4B]/15 hover:shadow-lg transition-all cursor-pointer group"
            >
              <div className="relative">
                <ShoppingBag className="w-5 h-5 group-hover:scale-110 transition-transform text-amber-200" />
                {cartCount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-amber-400 text-[#1B3022] text-[11px] font-black w-5 h-5 rounded-full flex items-center justify-center border-2 border-white animate-bounce">
                    {cartCount}
                  </span>
                )}
              </div>
              <span className="hidden sm:inline font-bold text-xs sm:text-sm">
                {t.cartTitle}
              </span>
            </button>
          </div>

        </div>

        {/* Category Quick Tabs Bar */}
        <div className="mt-2.5 pt-2 border-t border-[#D5E5D7]/80 flex items-center justify-between overflow-x-auto no-scrollbar gap-2 text-xs">
          <div className="flex items-center gap-1.5 overflow-x-auto py-1">
            <button
              onClick={() => setSelectedCategory(null)}
              className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-all cursor-pointer text-xs ${
                selectedCategory === null
                  ? 'bg-[#3D6E4B] text-white shadow-xs'
                  : 'bg-[#EBF3EC] text-[#245233] hover:bg-[#DCECE0]'
              }`}
            >
              {t.allCategories}
            </button>

            {CATEGORIES.slice(0, 8).map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3 py-1.5 rounded-xl font-medium whitespace-nowrap transition-all cursor-pointer text-xs ${
                  selectedCategory === cat.id
                    ? 'bg-[#3D6E4B] text-white font-bold shadow-xs'
                    : 'bg-[#EBF3EC] text-[#245233] hover:bg-[#DCECE0]'
                }`}
              >
                {language === 'ar' ? cat.nameAr.split(' ')[0] + ' ' + (cat.nameAr.split(' ')[1] || '') : (language === 'de' ? cat.nameDe : cat.nameEn)}
              </button>
            ))}
          </div>

          <button
            onClick={openChefAI}
            className="lg:hidden flex items-center gap-1 text-[#245233] font-bold bg-[#E2EFE4] px-2.5 py-1 rounded-lg border border-[#C5DEC8] text-xs shrink-0"
          >
            <Sparkles className="w-3.5 h-3.5 text-[#3D6E4B]" />
            <span>وصفات وشيف</span>
          </button>
        </div>
      </div>
    </header>
  );
};
