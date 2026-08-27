import React, { useState, useEffect, useMemo } from 'react';
import { 
  X, 
  Star, 
  Plus, 
  Minus, 
  ShoppingBag, 
  Heart, 
  Snowflake, 
  ShieldCheck, 
  MapPin, 
  Truck, 
  CheckCircle2, 
  Share2, 
  Sparkles, 
  Tag, 
  Package, 
  Check, 
  Clock, 
  ChevronLeft,
  ChevronRight,
  Info,
  AlertTriangle
} from 'lucide-react';
import { Product, Review } from '../types';
import { useApp } from '../context/AppContext';
import { OptimizedImage } from './common/OptimizedImage';

interface ProductDetailModalProps {
  product?: Product | null;
  onClose?: () => void;
  onAddToCart?: (product: Product, quantity: number) => void;
  isWishlisted?: boolean;
  onToggleWishlist?: (product: Product) => void;
}

export const ProductDetailModal: React.FC<ProductDetailModalProps> = (props) => {
  const { 
    activeDetailProduct, 
    closeProductDetails, 
    addToCart, 
    updateQuantity,
    removeFromCart,
    cart,
    toggleWishlist, 
    isInWishlist, 
    currencySymbol, 
    products, 
    categories, 
    subcategories,
    openProductDetails,
    navigateTo,
    showToast,
    dir,
    t,
    getProductName,
    getProductDescription
  } = useApp();

  const product = props.product !== undefined ? props.product : activeDetailProduct;
  const onClose = props.onClose || closeProductDetails;

  // Real-time synchronization with cart state
  const cartItem = useMemo(() => {
    if (!product) return null;
    return cart.find(item => item.product.id === product.id || (item.product as any).productId === product.id) || null;
  }, [cart, product?.id]);

  const currentCartQuantity = cartItem ? cartItem.quantity : 0;

  const [quantity, setQuantity] = useState<number>(1);
  const [selectedImageIndex, setSelectedImageIndex] = useState<number>(0);
  const [activeTab, setActiveTab] = useState<'info' | 'storage' | 'reviews'>('info');
  const [copiedLink, setCopiedLink] = useState<boolean>(false);
  const [showAddedSuccess, setShowAddedSuccess] = useState<boolean>(false);

  // Reviews state for customer ratings
  const [reviews, setReviews] = useState<Review[]>([]);
  const [newReviewAuthor, setNewReviewAuthor] = useState('');
  const [newReviewComment, setNewReviewComment] = useState('');
  const [newReviewRating, setNewReviewRating] = useState(5);
  const [reviewSubmitted, setReviewSubmitted] = useState(false);

  // Reset local state and load actual cart quantity when target product changes
  useEffect(() => {
    if (product) {
      const existingInCart = cart.find(item => item.product.id === product.id || (item.product as any).productId === product.id);
      setQuantity(existingInCart ? existingInCart.quantity : 1);
      setSelectedImageIndex(0);
      setActiveTab('info');
      setCopiedLink(false);
      setShowAddedSuccess(false);
      setReviews(product.reviews || [
        {
          id: 'rev-1',
          author: 'أبو أحمد السوري (Greifswald)',
          rating: 5,
          comment: 'طعم الشام الأصلي والمنتج طازج ومحفوظ بعناية مع أكياس الثلج. بارك الله فيكم.',
          date: 'منذ يومين',
          verified: true
        },
        {
          id: 'rev-2',
          author: 'أم يوسف (Schönwalde)',
          rating: 5,
          comment: 'جودة ممتازة وسرعة في التوصيل، التغليف نظيف ومحكم جداً.',
          date: 'منذ 5 أيام',
          verified: true
        }
      ]);
    }
  }, [product?.id]);

  // Keep local quantity aligned if modified from cart elsewhere
  useEffect(() => {
    if (currentCartQuantity > 0) {
      setQuantity(currentCartQuantity);
    }
  }, [currentCartQuantity]);

  // Lock background body scroll when bottom sheet is active
  useEffect(() => {
    if (product) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [Boolean(product)]);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && product) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [product, onClose]);

  if (!product) return null;

  const isFavorite = props.isWishlisted !== undefined ? props.isWishlisted : isInWishlist(product.id);
  const category = categories.find(c => c.id === product.categoryId);
  const subcategory = subcategories.find(s => s.id === product.subcategoryId || s.nameAr === product.subCategory);

  const rawStock = product.stock !== undefined && product.stock !== null 
    ? product.stock 
    : (product.stockCount !== undefined && product.stockCount !== null ? product.stockCount : 100);
  
  const isAvailable = product.isAvailable !== false && product.inStock !== false && rawStock > 0;
  const isLowStock = isAvailable && rawStock <= 5;

  const oldPrice = product.oldPrice || product.originalPrice;
  const hasDiscount = Boolean((oldPrice && oldPrice > product.price) || (product.discount && product.discount > 0));
  const discountPercent = product.discount || (oldPrice && oldPrice > product.price ? Math.round(((oldPrice - product.price) / oldPrice) * 100) : null);

  const imagesList = product.images && product.images.length > 0 
    ? product.images 
    : [product.image || 'https://images.unsplash.com/photo-1552767059-ce182ead6c1b?auto=format&fit=crop&w=600&q=80'];

  const currentImage = imagesList[selectedImageIndex] || imagesList[0];

  // Related items in the same category
  const relatedProducts = products
    .filter(p => p.categoryId === product.categoryId && p.id !== product.id && p.isAvailable !== false)
    .slice(0, 4);

  const handleQuantityMinus = () => {
    if (currentCartQuantity > 0) {
      if (currentCartQuantity === 1) {
        removeFromCart(product.id);
        setQuantity(1);
        setShowAddedSuccess(false);
      } else {
        updateQuantity(product.id, currentCartQuantity - 1);
        setQuantity(currentCartQuantity - 1);
      }
    } else {
      setQuantity(prev => Math.max(1, prev - 1));
    }
  };

  const handleQuantityPlus = () => {
    const currentVal = currentCartQuantity > 0 ? currentCartQuantity : quantity;
    if (currentVal >= rawStock) {
      showToast(`الحد الأقصى للمخزون المتوفر هو ${rawStock} ${product.unit || 'قطع'}`);
      return;
    }

    if (currentCartQuantity > 0) {
      updateQuantity(product.id, currentCartQuantity + 1);
      setQuantity(currentCartQuantity + 1);
    } else {
      setQuantity(prev => prev + 1);
    }
  };

  const handleAddToCart = () => {
    if (!isAvailable) return;
    if (props.onAddToCart) {
      props.onAddToCart(product, quantity);
    } else {
      addToCart(product, quantity);
    }
    setShowAddedSuccess(true);
  };

  const handleToggleFavorite = () => {
    if (props.onToggleWishlist) {
      props.onToggleWishlist(product);
    } else {
      toggleWishlist(product);
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

  const handleAddReview = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newReviewAuthor.trim() || !newReviewComment.trim()) return;

    const newRev: Review = {
      id: `rev-${Date.now()}`,
      author: newReviewAuthor.trim(),
      rating: newReviewRating,
      comment: newReviewComment.trim(),
      date: 'الآن',
      verified: true
    };

    setReviews(prev => [newRev, ...prev]);
    setNewReviewAuthor('');
    setNewReviewComment('');
    setReviewSubmitted(true);
    showToast('شكراً لمشاركتنا تقييمك!');
    setTimeout(() => setReviewSubmitted(false), 3000);
  };

  const localizedName = product ? getProductName(product) : '';
  const localizedDesc = product ? getProductDescription(product) : '';

  return (
    <div 
      className="fixed inset-0 z-50 overflow-hidden bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 transition-opacity duration-300"
      onClick={onClose}
      dir={dir}
    >
      {/* Bottom Sheet / Modal Container */}
      <div 
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-2xl bg-[#FDFBF7] rounded-t-[28px] sm:rounded-3xl max-h-[92vh] sm:max-h-[88vh] flex flex-col shadow-2xl border border-stone-200/80 overflow-hidden text-[#2D1B10] animate-in slide-in-from-bottom duration-300 relative"
      >
        {/* Mobile Drag Indicator Handle */}
        <div className="w-full pt-2.5 pb-1 flex justify-center sm:hidden bg-[#FDFBF7]">
          <div className="w-12 h-1.5 bg-stone-300 rounded-full" />
        </div>

        {/* Top Header Bar */}
        <div className="px-4 py-2 sm:py-3 flex items-center justify-between border-b border-stone-200/70 bg-white/80 backdrop-blur-xs shrink-0">
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-stone-100 hover:bg-stone-200 text-stone-700 flex items-center justify-center transition-colors cursor-pointer active:scale-95"
              aria-label="إغلاق"
              title="إغلاق"
            >
              <X className="w-4 h-4" />
            </button>
            <span className="text-xs font-bold text-stone-500">
              {category ? (category.nameAr || category.name) : t('product.details')}
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={handleShare}
              className="w-8 h-8 rounded-full bg-stone-100 hover:bg-stone-200 text-stone-700 flex items-center justify-center transition-colors cursor-pointer active:scale-95"
              aria-label={t('product.share')}
              title={t('product.share')}
            >
              {copiedLink ? <Check className="w-4 h-4 text-emerald-700" /> : <Share2 className="w-4 h-4 text-stone-600" />}
            </button>

            <button
              onClick={handleToggleFavorite}
              className="w-8 h-8 rounded-full bg-stone-100 hover:bg-rose-50 text-stone-700 hover:text-rose-500 flex items-center justify-center transition-colors cursor-pointer active:scale-95"
              aria-label={t('nav.wishlist')}
              title={isFavorite ? t('product.removeFromWishlist') : t('product.addToWishlist')}
            >
              <Heart className={`w-4 h-4 transition-transform ${isFavorite ? 'text-rose-500 fill-rose-500' : 'text-stone-600'}`} />
            </button>
          </div>
        </div>

        {/* Scrollable Content Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 no-scrollbar">
          
          {/* Main Media Stage & Gallery */}
          <div className="space-y-2.5">
            <div className="relative aspect-4/3 sm:aspect-16/10 w-full rounded-2xl overflow-hidden bg-stone-100 border border-stone-200/80 shadow-2xs">
              <OptimizedImage
                src={currentImage}
                alt={localizedName}
                className="w-full h-full object-cover transition-all duration-300"
                targetWidth={600}
                quality={85}
              />

              {/* Floating Badges */}
              <div className="absolute top-2.5 right-2.5 flex flex-col gap-1.5 items-end z-10">
                {hasDiscount && discountPercent && (
                  <span className="bg-rose-600 text-white text-[11px] font-black px-2.5 py-0.5 rounded-full shadow-md flex items-center gap-1">
                    <Tag className="w-3 h-3" />
                    <span>%{discountPercent}-</span>
                  </span>
                )}

                {product.isColdShipping && (
                  <span className="bg-cyan-800/95 backdrop-blur-xs text-white text-[10px] font-bold px-2.5 py-0.5 rounded-full shadow-md flex items-center gap-1">
                    <Snowflake className="w-3 h-3 text-cyan-200" />
                    <span>{t('product.chilledDelivery')} ❄️</span>
                  </span>
                )}

                {product.isFeatured && (
                  <span className="bg-emerald-800 text-amber-300 text-[10px] font-bold px-2 py-0.5 rounded-full shadow-md flex items-center gap-1">
                    <Sparkles className="w-3 h-3" />
                    <span>{t('product.featured')}</span>
                  </span>
                )}
              </div>

              {/* Origin badge */}
              {product.origin && (
                <div className="absolute bottom-2.5 right-2.5 z-10">
                  <span className="bg-stone-900/85 backdrop-blur-xs text-white text-[10px] font-bold px-2.5 py-1 rounded-xl shadow-xs flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-amber-400" />
                    <span>{t('product.origin')}: {product.origin}</span>
                  </span>
                </div>
              )}

              {/* Out of stock overlay */}
              {!isAvailable && (
                <div className="absolute inset-0 bg-stone-900/70 backdrop-blur-[2px] flex items-center justify-center z-20">
                  <span className="bg-rose-600 text-white text-xs font-bold px-3 py-1.5 rounded-xl shadow-lg">
                    {t('product.outOfStock')}
                  </span>
                </div>
              )}
            </div>

            {/* Multiple Images Thumbnails Carousel */}
            {imagesList.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
                {imagesList.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedImageIndex(idx)}
                    className={`w-14 h-14 rounded-xl overflow-hidden border-2 shrink-0 transition-all cursor-pointer ${
                      selectedImageIndex === idx 
                        ? 'border-emerald-800 ring-2 ring-emerald-800/20 scale-105 shadow-xs' 
                        : 'border-stone-200 opacity-60 hover:opacity-100'
                    }`}
                  >
                    <OptimizedImage 
                      src={img} 
                      alt="" 
                      className="w-full h-full object-cover" 
                      targetWidth={100}
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Header & Pricing */}
          <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-stone-200/80 space-y-2.5 shadow-2xs">
            <div className="flex items-center justify-between text-xs">
              <span className="bg-emerald-50 text-emerald-800 font-bold px-2.5 py-0.5 rounded-lg border border-emerald-100">
                {product.brand || 'Barakamarkt24'} {product.unit ? `• ${product.unit}` : ''}
              </span>
              
              <div className="flex items-center gap-1 text-amber-500 font-bold">
                <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                <span className="text-stone-800 text-xs">{product.rating ? product.rating.toFixed(1) : '5.0'}</span>
                <span className="text-stone-400 text-[10px]">({reviews.length})</span>
              </div>
            </div>

            <div>
              <h2 className="text-base sm:text-lg font-black text-stone-900 leading-snug">
                {localizedName}
              </h2>
              {(product.nameDe || product.nameEn) && product.nameAr !== localizedName && (
                <p className="text-xs text-stone-500 font-sans mt-0.5">
                  {product.nameDe || product.nameEn}
                </p>
              )}
            </div>

            {/* Price Box */}
            <div className="pt-2 border-t border-stone-100 flex items-center justify-between">
              <div>
                <div className="flex items-baseline gap-2">
                  <span className="text-xl sm:text-2xl font-black text-emerald-800 font-sans">
                    {currencySymbol}{product.price.toFixed(2)}
                  </span>
                  {oldPrice && oldPrice > product.price && (
                    <span className="text-xs text-stone-400 line-through font-sans">
                      {currencySymbol}{oldPrice.toFixed(2)}
                    </span>
                  )}
                </div>
                <span className="text-[10px] text-stone-500 block mt-0.5">
                  {t('product.vatIncluded')}
                </span>
              </div>

              {/* Stock Status Badge */}
              <div>
                {isAvailable ? (
                  isLowStock ? (
                    <span className="bg-amber-100 text-amber-900 border border-amber-200 text-[10px] font-bold px-2.5 py-1 rounded-lg flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3 text-amber-600" />
                      <span>{t('product.onlyLeft', { count: rawStock })}</span>
                    </span>
                  ) : (
                    <span className="bg-emerald-100 text-emerald-900 border border-emerald-200 text-[10px] font-bold px-2.5 py-1 rounded-lg flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3 text-emerald-700" />
                      <span>{t('product.inStock')}</span>
                    </span>
                  )
                ) : (
                  <span className="bg-stone-100 text-stone-600 text-[10px] font-bold px-2.5 py-1 rounded-lg">
                    {t('product.outOfStock')}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Quick Perks / Guarantees */}
          <div className="grid grid-cols-3 gap-2 text-center text-[10px]">
            <div className="bg-white p-2.5 rounded-xl border border-stone-200/70 space-y-1">
              <Truck className="w-4 h-4 text-emerald-700 mx-auto" />
              <span className="font-bold text-stone-800 block">{t('product.fastDelivery')}</span>
              <span className="text-stone-500">{t('product.fastDeliverySub')}</span>
            </div>
            <div className="bg-white p-2.5 rounded-xl border border-stone-200/70 space-y-1">
              <ShieldCheck className="w-4 h-4 text-emerald-700 mx-auto" />
              <span className="font-bold text-stone-800 block">{t('product.authenticTaste')}</span>
              <span className="text-stone-500">{t('product.halalGuaranteed')}</span>
            </div>
            <div className="bg-white p-2.5 rounded-xl border border-stone-200/70 space-y-1">
              <Snowflake className="w-4 h-4 text-cyan-700 mx-auto" />
              <span className="font-bold text-stone-800 block">{t('product.chilledStorage')}</span>
              <span className="text-stone-500">{t('product.insulatedBags')}</span>
            </div>
          </div>

          {/* Info Tabs */}
          <div className="bg-white rounded-2xl border border-stone-200/80 overflow-hidden shadow-2xs">
            <div className="flex border-b border-stone-200/80 text-xs font-bold">
              <button
                onClick={() => setActiveTab('info')}
                className={`flex-1 py-2.5 text-center transition-colors cursor-pointer border-b-2 ${
                  activeTab === 'info'
                    ? 'border-emerald-800 text-emerald-800 bg-emerald-50/40'
                    : 'border-transparent text-stone-500 hover:text-stone-800'
                }`}
              >
                {t('product.description')}
              </button>
              <button
                onClick={() => setActiveTab('storage')}
                className={`flex-1 py-2.5 text-center transition-colors cursor-pointer border-b-2 ${
                  activeTab === 'storage'
                    ? 'border-emerald-800 text-emerald-800 bg-emerald-50/40'
                    : 'border-transparent text-stone-500 hover:text-stone-800'
                }`}
              >
                {t('product.storageMethod')}
              </button>
              <button
                onClick={() => setActiveTab('reviews')}
                className={`flex-1 py-2.5 text-center transition-colors cursor-pointer border-b-2 ${
                  activeTab === 'reviews'
                    ? 'border-emerald-800 text-emerald-800 bg-emerald-50/40'
                    : 'border-transparent text-stone-500 hover:text-stone-800'
                }`}
              >
                {t('product.reviews')} ({reviews.length})
              </button>
            </div>

            <div className="p-3.5 text-xs text-stone-700 leading-relaxed min-h-[90px]">
              {activeTab === 'info' && (
                <div className="space-y-2.5">
                  <p className="text-stone-800 whitespace-pre-line">
                    {localizedDesc || t('product.defaultDesc')}
                  </p>

                  {(product.descriptionDe || product.descriptionEn) && product.descriptionAr !== localizedDesc && (
                    <p className="text-stone-500 font-sans text-[11px] pt-1 border-t border-stone-100">
                      {product.descriptionDe || product.descriptionEn}
                    </p>
                  )}

                  {product.ingredientsAr && (
                    <div className="bg-emerald-50/70 p-2.5 rounded-xl border border-emerald-100/80">
                      <span className="font-bold text-emerald-900 block mb-0.5">{t('product.ingredients')}:</span>
                      <p className="text-emerald-950">{product.ingredientsAr}</p>
                    </div>
                  )}

                  {product.nutrition && (
                    <div className="grid grid-cols-4 gap-1.5 pt-1 text-center font-sans">
                      <div className="bg-stone-50 p-1.5 rounded-lg border border-stone-200/60">
                        <span className="text-[9px] text-stone-500 block">{t('product.calories')}</span>
                        <span className="font-bold text-stone-800 text-xs">{product.nutrition.calories} kcal</span>
                      </div>
                      <div className="bg-stone-50 p-1.5 rounded-lg border border-stone-200/60">
                        <span className="text-[9px] text-stone-500 block">{t('product.protein')}</span>
                        <span className="font-bold text-stone-800 text-xs">{product.nutrition.protein}</span>
                      </div>
                      <div className="bg-stone-50 p-1.5 rounded-lg border border-stone-200/60">
                        <span className="text-[9px] text-stone-500 block">{t('product.fat')}</span>
                        <span className="font-bold text-stone-800 text-xs">{product.nutrition.fat}</span>
                      </div>
                      <div className="bg-stone-50 p-1.5 rounded-lg border border-stone-200/60">
                        <span className="text-[9px] text-stone-500 block">{t('product.carbs')}</span>
                        <span className="font-bold text-stone-800 text-xs">{product.nutrition.carbs}</span>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'storage' && (
                <div className="space-y-2">
                  <div className="bg-cyan-50 p-3 rounded-xl border border-cyan-200/70 text-cyan-950 space-y-1">
                    <span className="font-bold text-xs flex items-center gap-1">
                      <Snowflake className="w-3.5 h-3.5 text-cyan-700" />
                      <span>{t('product.storageMethod')}:</span>
                    </span>
                    <p className="text-[11px] leading-relaxed">
                      {product.storageAr || t('product.defaultStorage')}
                    </p>
                  </div>
                </div>
              )}

              {activeTab === 'reviews' && (
                <div className="space-y-3">
                  {/* Add Review */}
                  <form onSubmit={handleAddReview} className="bg-stone-50 p-3 rounded-xl border border-stone-200/80 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-stone-900">{t('product.addReview')}:</span>
                      <div className="flex gap-1">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <button
                            type="button"
                            key={s}
                            onClick={() => setNewReviewRating(s)}
                            className="cursor-pointer"
                          >
                            <Star className={`w-3.5 h-3.5 ${s <= newReviewRating ? 'fill-amber-400 text-amber-400' : 'text-stone-300'}`} />
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="text"
                        placeholder={t('product.nameAndCity')}
                        value={newReviewAuthor}
                        onChange={(e) => setNewReviewAuthor(e.target.value)}
                        className="bg-white px-2.5 py-1.5 rounded-lg border border-stone-200 text-xs w-full text-stone-800"
                        required
                      />
                      <button
                        type="submit"
                        className="bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-bold py-1.5 rounded-lg transition-colors cursor-pointer"
                      >
                        {t('product.submitReview')}
                      </button>
                    </div>

                    <textarea
                      placeholder={t('product.reviewPlaceholder')}
                      value={newReviewComment}
                      onChange={(e) => setNewReviewComment(e.target.value)}
                      className="bg-white px-2.5 py-1.5 rounded-lg border border-stone-200 text-xs w-full h-14 resize-none text-stone-800"
                      required
                    />

                    {reviewSubmitted && (
                      <p className="text-emerald-700 text-[11px] font-bold">{t('product.reviewThanks')}</p>
                    )}
                  </form>

                  {/* Reviews List */}
                  <div className="space-y-2 max-h-48 overflow-y-auto no-scrollbar">
                    {reviews.map((rev) => (
                      <div key={rev.id} className="bg-stone-50/70 p-2.5 rounded-xl border border-stone-200/60 space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-stone-900 text-xs">{rev.author}</span>
                          <div className="flex items-center gap-0.5">
                            {[...Array(rev.rating)].map((_, i) => (
                              <Star key={i} className="w-3 h-3 fill-amber-400 text-amber-400" />
                            ))}
                          </div>
                        </div>
                        <p className="text-stone-600 text-[11px] leading-relaxed">{rev.comment}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Related Products in same category */}
          {relatedProducts.length > 0 && (
            <div className="space-y-2 pt-1">
              <div className="flex items-center justify-between">
                <h3 className="font-extrabold text-xs text-stone-900">{t('product.similarProducts')}</h3>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {relatedProducts.map((rel) => (
                  <div
                    key={rel.id}
                    onClick={() => openProductDetails(rel)}
                    className="bg-white p-2 rounded-xl border border-stone-200/80 hover:border-emerald-700/40 transition-all flex items-center gap-2 cursor-pointer shadow-2xs hover:shadow-xs group"
                  >
                    <div className="w-12 h-12 rounded-lg overflow-hidden bg-stone-50 shrink-0">
                      <OptimizedImage
                        src={rel.image || (rel.images && rel.images[0])}
                        alt={getProductName(rel)}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        targetWidth={80}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-[11px] text-stone-900 truncate">
                        {getProductName(rel)}
                      </h4>
                      <span className="font-black text-xs text-emerald-800 font-sans block mt-0.5">
                        {currencySymbol}{rel.price.toFixed(2)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>

        {/* Sticky Bottom Action Footer */}
        <div className="p-3.5 sm:p-4 bg-white border-t border-stone-200/80 shrink-0 shadow-lg" dir={dir}>
          {!isAvailable ? (
            <button
              disabled
              className="w-full bg-stone-100 text-stone-400 font-bold py-3.5 px-4 rounded-2xl flex items-center justify-center gap-2 text-xs sm:text-sm cursor-not-allowed border border-stone-200"
            >
              <span>{t('product.outOfStock')}</span>
            </button>
          ) : showAddedSuccess ? (
            /* Success confirmation banner with 2 buttons */
            <div className="w-full flex flex-col gap-2.5 animate-fadeIn">
              {/* Success Badge */}
              <div className="flex items-center justify-center gap-1.5 py-1.5 px-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs sm:text-sm font-black">
                <Check className="w-4 h-4 text-emerald-600 stroke-[3]" />
                <span>{t('product.addedSuccessTitle') || '✓ تمت إضافة المنتج بنجاح'}</span>
              </div>

              {/* Action Buttons: Continue Shopping vs Go to Cart */}
              <div className="flex items-center gap-2.5">
                <button
                  onClick={() => {
                    setShowAddedSuccess(false);
                    onClose();
                  }}
                  className="flex-1 py-3 px-3 rounded-2xl font-bold text-xs sm:text-sm bg-stone-100 hover:bg-stone-200 text-stone-700 active:scale-98 transition-all flex items-center justify-center border border-stone-200 cursor-pointer"
                >
                  <span>{t('product.continueShopping') || 'متابعة التسوق'}</span>
                </button>

                <button
                  onClick={() => {
                    setShowAddedSuccess(false);
                    onClose();
                    navigateTo('cart');
                  }}
                  className="flex-1 py-3 px-3 rounded-2xl font-black text-xs sm:text-sm bg-[#005A36] hover:bg-[#00472a] text-white active:scale-98 transition-all flex items-center justify-center gap-1.5 shadow-md cursor-pointer"
                >
                  <ShoppingBag className="w-4 h-4 text-amber-300" />
                  <span>{t('product.goToCart') || 'الذهاب إلى السلة'}</span>
                </button>
              </div>
            </div>
          ) : currentCartQuantity > 0 ? (
            /* Product is in Cart: Show Full Stepper with Live Subtotal & Direct Modifiers */
            <div className="flex items-center gap-3">
              <div className="flex-1 flex items-center justify-between bg-stone-50 border-2 border-[#005A36]/30 rounded-2xl p-1.5 shadow-inner">
                <button
                  onClick={handleQuantityMinus}
                  className="w-11 h-11 rounded-xl bg-white text-stone-800 hover:bg-stone-100 active:scale-95 flex items-center justify-center shadow-xs transition-all cursor-pointer"
                  aria-label="-"
                  title={currentCartQuantity === 1 ? (t('cart.remove') || 'إزالة') : '-'}
                >
                  <Minus className="w-5 h-5 text-stone-700" />
                </button>

                <div className="flex flex-col items-center justify-center px-3">
                  <div className="flex items-center gap-1.5">
                    <span className="font-black text-lg text-stone-900 font-sans">{currentCartQuantity}</span>
                    <span className="text-[11px] font-bold text-stone-500">{product.unit || 'قطع'}</span>
                  </div>
                  <span className="text-[10px] font-bold text-emerald-800 flex items-center gap-1">
                    <Check className="w-3 h-3 text-emerald-600 stroke-[3]" />
                    {t('product.addedToCart')}
                  </span>
                </div>

                <button
                  onClick={handleQuantityPlus}
                  disabled={currentCartQuantity >= rawStock}
                  className="w-11 h-11 rounded-xl bg-[#005A36] text-white hover:bg-[#00472a] active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center shadow-xs transition-all cursor-pointer"
                  aria-label="+"
                >
                  <Plus className="w-5 h-5" />
                </button>
              </div>

              {/* Total Price for items currently in cart */}
              <div className="flex flex-col items-end justify-center min-w-20 sm:min-w-24 px-1 text-end">
                <span className="text-[10px] text-stone-400 font-medium">{t('cart.subtotal') || 'الإجمالي'}:</span>
                <span className="text-base sm:text-lg font-black text-[#005A36] font-sans">
                  {currencySymbol || '€'}{(product.price * currentCartQuantity).toFixed(2)}
                </span>
              </div>
            </div>
          ) : (
            /* Product is NOT in Cart: Stepper + Big Add to Cart Button */
            <div className="flex items-center gap-3">
              {/* Quantity Pre-selector Stepper */}
              <div className="flex items-center border border-stone-200 rounded-2xl overflow-hidden bg-stone-50 shrink-0">
                <button
                  onClick={handleQuantityMinus}
                  disabled={quantity <= 1}
                  className="w-10 h-12 flex items-center justify-center text-stone-700 hover:bg-stone-200 disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
                  aria-label="-"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span className="w-9 text-center font-black text-stone-900 text-sm font-sans">
                  {quantity}
                </span>
                <button
                  onClick={handleQuantityPlus}
                  disabled={quantity >= rawStock}
                  className="w-10 h-12 flex items-center justify-center text-stone-700 hover:bg-stone-200 disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
                  aria-label="+"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              {/* Add to Cart Button */}
              <button
                onClick={handleAddToCart}
                className="flex-1 bg-[#005A36] hover:bg-[#00472a] active:scale-98 text-white font-black h-12 px-4 rounded-2xl shadow-md transition-all flex items-center justify-center gap-2 text-xs sm:text-sm cursor-pointer"
              >
                <ShoppingBag className="w-4 h-4" />
                <span>
                  {`${t('product.addToCart')} • ${currencySymbol || '€'}${((product.price) * quantity).toFixed(2)}`}
                </span>
              </button>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
