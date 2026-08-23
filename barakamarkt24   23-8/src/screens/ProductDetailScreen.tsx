import React, { useState } from 'react';
import { 
  Heart, 
  ShoppingBag, 
  Plus, 
  Minus, 
  Check, 
  ShieldCheck, 
  Truck, 
  MapPin, 
  Sparkles,
  ChevronRight,
  Star,
  Package,
  Layers,
  Info,
  AlertCircle,
  Clock,
  Share2,
  CheckCircle2,
  Tag
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { ProductCard } from '../components/common/ProductCard';
import { OptimizedImage } from '../components/common/OptimizedImage';

export const ProductDetailScreen: React.FC = () => {
  const { 
    selectedProductId, 
    products, 
    categories,
    subcategories,
    addToCart, 
    toggleWishlist, 
    isInWishlist, 
    goBack, 
    navigateTo,
    showToast,
    currencySymbol
  } = useApp();

  const [quantity, setQuantity] = useState<number>(1);
  const [selectedImageIndex, setSelectedImageIndex] = useState<number>(0);
  const [copiedLink, setCopiedLink] = useState<boolean>(false);

  const product = products.find(p => p.id === selectedProductId) || products[0];

  if (!product) {
    return (
      <div className="p-8 text-center space-y-4 my-12" dir="rtl">
        <div className="w-16 h-16 rounded-full bg-stone-100 text-stone-400 flex items-center justify-center mx-auto">
          <Package className="w-8 h-8" />
        </div>
        <p className="text-sm font-bold text-stone-700">لم يتم العثور على المنتج المطلوب.</p>
        <button
          onClick={goBack}
          className="bg-emerald-800 text-white text-xs font-bold px-5 py-2.5 rounded-xl cursor-pointer shadow-sm hover:bg-emerald-900"
        >
          العودة للمتجر
        </button>
      </div>
    );
  }

  const category = categories.find(c => c.id === product.categoryId);
  const subcategory = subcategories.find(s => s.id === product.subcategoryId || s.nameAr === product.subCategory);

  const isFavorite = isInWishlist(product.id);
  const oldPrice = product.oldPrice || product.originalPrice;
  const hasDiscount = Boolean((oldPrice && oldPrice > product.price) || (product.discount && product.discount > 0));
  const discountPercent = product.discount || (oldPrice && oldPrice > product.price ? Math.round(((oldPrice - product.price) / oldPrice) * 100) : null);
  
  // Multiple images or fallback single image
  const imagesList = product.images && product.images.length > 0 
    ? product.images 
    : [product.image || 'https://images.unsplash.com/photo-1552767059-ce182ead6c1b?auto=format&fit=crop&w=600&q=80'];

  const currentImage = imagesList[selectedImageIndex] || imagesList[0];
  
  // Stock determination
  const rawStock = product.stock !== undefined && product.stock !== null 
    ? product.stock 
    : (product.stockCount !== undefined && product.stockCount !== null ? product.stockCount : 100);
  
  const isAvailable = product.isAvailable !== false && product.inStock !== false && rawStock > 0;
  const isLowStock = isAvailable && rawStock <= 5;

  const relatedProducts = products
    .filter(p => p.categoryId === product.categoryId && p.id !== product.id && p.isAvailable !== false)
    .slice(0, 4);

  const handleQuantityChange = (newQty: number) => {
    if (newQty < 1) return;
    if (newQty > rawStock) {
      showToast(`الحد الأقصى للمخزون المتوفر هو ${rawStock} ${product.unit || 'قطع'}`);
      return;
    }
    setQuantity(newQty);
  };

  const handleAddToCart = () => {
    if (isAvailable) {
      addToCart(product, quantity);
    }
  };

  const handleShare = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      setCopiedLink(true);
      showToast('تم نسخ رابط المنتج بنجاح');
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  return (
    <div className="pb-28" dir="rtl">
      
      {/* 1. Product Image Stage with Multi-image gallery & floating buttons */}
      <div className="relative aspect-square w-full bg-stone-100 overflow-hidden shadow-2xs">
        <OptimizedImage 
          src={currentImage} 
          alt={product.nameAr || product.name} 
          className="w-full h-full object-cover transition-all duration-300"
          targetWidth={600}
          quality={80}
        />

        {/* Back and Action Buttons */}
        <div className="absolute top-4 inset-x-4 flex items-center justify-between z-10">
          <button
            onClick={goBack}
            className="w-9 h-9 rounded-full bg-white/90 backdrop-blur-xs text-stone-800 flex items-center justify-center shadow-md cursor-pointer active:scale-95 transition-all hover:bg-white"
            aria-label="رجوع"
          >
            <ChevronRight className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={handleShare}
              className="w-9 h-9 rounded-full bg-white/90 backdrop-blur-xs text-stone-800 flex items-center justify-center shadow-md cursor-pointer active:scale-95 transition-all hover:bg-white"
              aria-label="مشاركة"
              title="مشاركة المنتج"
            >
              {copiedLink ? <Check className="w-4 h-4 text-emerald-700" /> : <Share2 className="w-4 h-4 text-stone-700" />}
            </button>

            <button
              onClick={() => toggleWishlist(product)}
              className="w-9 h-9 rounded-full bg-white/90 backdrop-blur-xs text-stone-800 flex items-center justify-center shadow-md cursor-pointer active:scale-95 transition-all hover:bg-white"
              aria-label="المفضلة"
              title={isFavorite ? 'إزالة من المفضلة' : 'إضافة للمفضلة'}
            >
              <Heart className={`w-4 h-4 transition-transform active:scale-125 ${isFavorite ? 'text-rose-500 fill-rose-500' : 'text-stone-700'}`} />
            </button>
          </div>
        </div>

        {/* Badges Overlay */}
        <div className="absolute bottom-3 right-3 flex items-center gap-1.5 z-10 flex-wrap">
          {product.origin && (
            <span className="bg-stone-900/85 backdrop-blur-xs text-white text-[11px] font-semibold px-2.5 py-1 rounded-xl shadow-xs flex items-center gap-1">
              <MapPin className="w-3 h-3 text-amber-400" />
              <span>منشأ: {product.origin}</span>
            </span>
          )}
          {product.isFeatured && (
            <span className="bg-amber-500 text-stone-950 text-[11px] font-black px-2.5 py-1 rounded-xl shadow-xs flex items-center gap-1">
              <Sparkles className="w-3 h-3" />
              <span>صنف مميز</span>
            </span>
          )}
          {hasDiscount && discountPercent && (
            <span className="bg-rose-600 text-white text-[11px] font-black px-2.5 py-1 rounded-xl shadow-xs flex items-center gap-1">
              <Tag className="w-3 h-3" />
              <span>خصم {discountPercent}%</span>
            </span>
          )}
        </div>
      </div>

      {/* 2. Thumbnails Gallery Bar if multiple images exist */}
      {imagesList.length > 1 && (
        <div className="flex gap-2 p-3 bg-white border-b border-stone-200/80 overflow-x-auto no-scrollbar">
          {imagesList.map((img, idx) => (
            <button
              key={idx}
              onClick={() => setSelectedImageIndex(idx)}
              className={`w-14 h-14 rounded-xl overflow-hidden border-2 shrink-0 transition-all cursor-pointer ${
                selectedImageIndex === idx 
                  ? 'border-emerald-700 ring-2 ring-emerald-700/20 scale-105 shadow-xs' 
                  : 'border-stone-200 opacity-70 hover:opacity-100'
              }`}
            >
              <OptimizedImage 
                src={img} 
                alt="" 
                className="w-full h-full object-cover" 
                targetWidth={100}
                quality={70}
              />
            </button>
          ))}
        </div>
      )}

      {/* 3. Main Product Information Body */}
      <div className="p-4 space-y-4">
        
        {/* Title, Brand, Category, Pricing and Stock Header */}
        <div className="bg-white p-4 rounded-3xl border border-stone-200/80 shadow-2xs space-y-3">
          
          {/* Brand & Category Breadcrumb */}
          <div className="flex items-center justify-between text-xs text-stone-500 flex-wrap gap-2">
            <div className="flex items-center gap-1.5">
              <span className="font-semibold text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-lg border border-emerald-100">
                {product.brand || 'بركة ماركت'}
              </span>
              {category && (
                <span className="bg-stone-100 text-stone-700 px-2 py-0.5 rounded-lg">
                  {category.nameAr || category.name}
                </span>
              )}
              {subcategory && (
                <span className="bg-stone-100 text-stone-700 px-2 py-0.5 rounded-lg">
                  {subcategory.nameAr || subcategory.name}
                </span>
              )}
            </div>
            
            <span className="text-[11px] text-stone-600 font-medium">
              العبوة: <strong className="text-stone-800">{product.unit || 'قطعة'}</strong> ({product.weight || '500g'})
            </span>
          </div>

          {/* Product Name */}
          <h1 className="text-lg sm:text-xl font-black text-stone-900 leading-snug">
            {product.nameAr || product.name}
          </h1>

          {/* Price & Stock Row */}
          <div className="flex items-center justify-between pt-2 border-t border-stone-100">
            
            {/* Price section with old price and discount */}
            <div className="space-y-0.5">
              <span className="text-[10px] text-stone-400 font-medium block">السعر الحالي:</span>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-black text-emerald-800 font-sans">
                  {currencySymbol || '€'}{product.price.toFixed(2)}
                </span>
                {hasDiscount && oldPrice && (
                  <span className="text-sm text-stone-400 line-through font-sans">
                    {currencySymbol || '€'}{oldPrice.toFixed(2)}
                  </span>
                )}
              </div>
            </div>

            {/* Stock status indicator */}
            <div className="text-left space-y-1">
              <div className="flex items-center gap-1.5 justify-end">
                <span className={`w-2.5 h-2.5 rounded-full ${
                  !isAvailable ? 'bg-rose-500' : isLowStock ? 'bg-amber-500 animate-pulse' : 'bg-emerald-500'
                }`} />
                <span className={`text-xs font-black ${
                  !isAvailable ? 'text-rose-600' : isLowStock ? 'text-amber-700' : 'text-emerald-800'
                }`}>
                  {!isAvailable 
                    ? 'غير متوفر حالياً' 
                    : isLowStock 
                    ? `متبقي كمية محدودة (${rawStock} ${product.unit || 'قطعة'})` 
                    : `متوفر بالمخزن (${rawStock} ${product.unit || 'قطعة'})`}
                </span>
              </div>
              <span className="text-[10px] text-stone-400 block font-medium">
                {isAvailable ? 'جاهز للشحن الفوري' : 'سيتم إعادة توفيره قريباً'}
              </span>
            </div>

          </div>

        </div>

        {/* 4. Quantity Stepper & Stock Limits Selector */}
        {isAvailable && (
          <div className="bg-white p-4 rounded-3xl border border-stone-200/80 shadow-2xs flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-stone-900 block">اختر الكمية:</span>
              <span className="text-[11px] text-stone-500">
                الحد الأقصى المتاح: <strong className="text-stone-800 font-mono">{rawStock}</strong> {product.unit || 'قطعة'}
              </span>
            </div>
            
            <div className="flex items-center gap-2 bg-stone-50 p-1.5 rounded-2xl border border-stone-200">
              <button
                onClick={() => handleQuantityChange(quantity - 1)}
                disabled={quantity <= 1}
                className="w-8 h-8 rounded-xl bg-white text-stone-800 flex items-center justify-center font-bold disabled:opacity-40 cursor-pointer shadow-2xs hover:bg-stone-100 transition-colors"
                aria-label="تقليل الكمية"
              >
                <Minus className="w-3.5 h-3.5" />
              </button>
              
              <span className="w-8 text-center font-black text-sm font-sans text-stone-900">
                {quantity}
              </span>
              
              <button
                onClick={() => handleQuantityChange(quantity + 1)}
                disabled={quantity >= rawStock}
                className="w-8 h-8 rounded-xl bg-white text-stone-800 flex items-center justify-center font-bold disabled:opacity-40 cursor-pointer shadow-2xs hover:bg-stone-100 transition-colors"
                aria-label="زيادة الكمية"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* 5. Description & Specifications */}
        <div className="bg-white p-4 rounded-3xl border border-stone-200/80 shadow-2xs space-y-3.5">
          <div>
            <h3 className="font-bold text-xs text-stone-900 mb-1.5 flex items-center gap-1.5">
              <Info className="w-4 h-4 text-emerald-800" />
              <span>وصف ومميزات المنتج:</span>
            </h3>
            <p className="text-xs text-stone-600 leading-relaxed">
              {product.descriptionAr || product.description || 'منتج بلدي سوري فاخر محضر ومختار بعناية وفق أعلى معايير الجودة والأصالة.'}
            </p>
          </div>

          {product.ingredientsAr && (
            <div className="pt-3 border-t border-stone-100">
              <h4 className="font-bold text-[11px] text-stone-800 mb-1">المكونات:</h4>
              <p className="text-xs text-stone-500 leading-relaxed">
                {product.ingredientsAr}
              </p>
            </div>
          )}

          {product.storageAr && (
            <div className="pt-3 border-t border-stone-100">
              <h4 className="font-bold text-[11px] text-stone-800 mb-1">طريقة الحفظ والتخزين:</h4>
              <p className="text-xs text-stone-500 leading-relaxed">
                {product.storageAr}
              </p>
            </div>
          )}
        </div>

        {/* 6. Service Perks & Delivery Guarantee */}
        <div className="grid grid-cols-2 gap-2.5">
          <div className="bg-white p-3.5 rounded-2xl border border-stone-200/70 shadow-2xs flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-800 flex items-center justify-center shrink-0">
              <Truck className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[11px] font-bold text-stone-900 block">شحن مبرد وسريع</span>
              <span className="text-[10px] text-stone-500">لكافة المدن والمناطق</span>
            </div>
          </div>

          <div className="bg-white p-3.5 rounded-2xl border border-stone-200/70 shadow-2xs flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-800 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[11px] font-bold text-stone-900 block">ضمان الجودة 100%</span>
              <span className="text-[10px] text-stone-500">طعم بلدي سوري أصيل</span>
            </div>
          </div>
        </div>

        {/* 7. Related Products from Same Category */}
        {relatedProducts.length > 0 && (
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between">
              <h3 className="font-extrabold text-sm text-stone-900">منتجات مقترحة من نفس القسم</h3>
              <button
                onClick={() => {
                  if (product.categoryId) {
                    navigateTo('products', { categoryId: product.categoryId });
                  }
                }}
                className="text-xs font-bold text-emerald-800 hover:text-emerald-900 cursor-pointer"
              >
                عرض المزيد
              </button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {relatedProducts.map(rel => (
                <ProductCard key={rel.id} product={rel} />
              ))}
            </div>
          </div>
        )}

      </div>

      {/* 8. Sticky Bottom Action Bar with Subtotal & Add to Cart button */}
      <div className="fixed bottom-0 left-0 right-0 sm:max-w-md sm:mx-auto bg-white/95 backdrop-blur-md border-t border-stone-200 p-3.5 z-40 shadow-xl flex items-center justify-between gap-3">
        <div className="flex flex-col">
          <span className="text-[10px] text-stone-500 font-medium">الإجمالي ({quantity} {product.unit || 'قطع'}):</span>
          <span className="text-base font-black text-emerald-800 font-sans">
            {currencySymbol || '€'}{(product.price * quantity).toFixed(2)}
          </span>
        </div>

        <button
          onClick={handleAddToCart}
          disabled={!isAvailable}
          className={`flex-1 py-3.5 px-4 rounded-2xl font-black text-xs sm:text-sm flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md ${
            !isAvailable
              ? 'bg-stone-200 text-stone-500 cursor-not-allowed'
              : 'bg-emerald-800 hover:bg-emerald-900 text-white active:scale-98'
          }`}
        >
          <ShoppingBag className="w-4 h-4 text-amber-300" />
          <span>{isAvailable ? 'إضافة إلى سلة المشتريات' : 'المنتج غير متوفر بالمخزن'}</span>
        </button>
      </div>

    </div>
  );
};
