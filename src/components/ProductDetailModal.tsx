import React, { useState } from 'react';
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
  MessageCircle,
  Sparkles,
  Info,
  Zap
} from 'lucide-react';
import { Currency, Language, Product, Review } from '../types';
import { formatPrice, DICTIONARY } from '../utils/helpers';

interface ProductDetailModalProps {
  product: Product | null;
  onClose: () => void;
  currency: Currency;
  language: Language;
  onAddToCart: (product: Product, quantity: number) => void;
  isWishlisted: boolean;
  onToggleWishlist: (product: Product) => void;
}

export const ProductDetailModal: React.FC<ProductDetailModalProps> = ({
  product,
  onClose,
  currency,
  language,
  onAddToCart,
  isWishlisted,
  onToggleWishlist
}) => {
  if (!product) return null;

  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState<'info' | 'nutrition' | 'reviews'>('info');
  const [reviews, setReviews] = useState<Review[]>(product.reviews || [
    {
      id: 'rev-1',
      author: 'أبو أحمد السوري (غرايفسفالد)',
      rating: 5,
      comment: 'طعم الشام الأصلي كما عهدناه، وصل الطلب خلال ساعة ونصف في غرايفسفالد مع أكياس الثلج. بارك الله فيكم.',
      date: 'منذ يومين',
      city: 'Greifswald',
      verified: true
    },
    {
      id: 'rev-2',
      author: 'أم يوسف (غرايفسفالد المركز)',
      rating: 5,
      comment: 'جودة لا يعلى عليها، السمنة والمكدوس والجبنة بيذكرونا ببيتنا بالشام، والتوصيل سريع جداً.',
      date: 'منذ 5 أيام',
      city: 'Greifswald',
      verified: true
    }
  ]);
  const [newReviewAuthor, setNewReviewAuthor] = useState('');
  const [newReviewComment, setNewReviewComment] = useState('');
  const [newReviewRating, setNewReviewRating] = useState(5);
  const [reviewSubmitted, setReviewSubmitted] = useState(false);

  const t = DICTIONARY[language];

  const handleAddReview = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newReviewAuthor || !newReviewComment) return;

    const newRev: Review = {
      id: `rev-${Date.now()}`,
      author: newReviewAuthor,
      rating: newReviewRating,
      comment: newReviewComment,
      date: 'الآن',
      verified: true
    };

    setReviews([newRev, ...reviews]);
    setNewReviewAuthor('');
    setNewReviewComment('');
    setReviewSubmitted(true);
    setTimeout(() => setReviewSubmitted(false), 3000);
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: product.nameAr,
        text: `تسوق ${product.nameAr} من بركة ماركت غرايفسفالد`,
        url: window.location.href
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert('تم نسخ رابط المنتج بنجاح!');
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div 
        className="bg-[#FDFBF7] rounded-3xl max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-[#D5E5D7] animate-in fade-in zoom-in-95 duration-200 relative text-[#1B3022]"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 left-4 z-20 bg-white/90 hover:bg-[#EBF3EC] text-[#1B3022] p-2 rounded-full transition-colors cursor-pointer border border-[#D5E5D7]"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-5 sm:p-8">
          
          {/* Left / Product Media Column */}
          <div className="space-y-4">
            <div className="relative aspect-square rounded-2xl overflow-hidden bg-[#F4F8F4] border border-[#D5E5D7]">
              <img 
                src={product.image} 
                alt={product.nameAr}
                className="w-full h-full object-cover"
              />

              {product.isColdShipping && (
                <div className="absolute top-3 right-3 bg-cyan-800 text-white text-xs font-bold px-2.5 py-1 rounded-full shadow-lg flex items-center gap-1.5">
                  <Snowflake className="w-4 h-4 text-cyan-200" />
                  <span>تغليف مبرد ❄️</span>
                </div>
              )}

              <div className="absolute bottom-3 right-3 bg-[#1B3022]/85 backdrop-blur-xs text-white text-xs font-bold px-2.5 py-1 rounded-lg flex items-center gap-1.5 border border-[#3D6E4B]/40">
                <MapPin className="w-3.5 h-3.5 text-amber-400" />
                <span>{product.origin}</span>
              </div>
            </div>

            {/* Guarantees Box */}
            <div className="bg-[#EBF3EC] border border-[#D5E5D7] rounded-2xl p-3.5 space-y-2 text-xs">
              <div className="flex items-center gap-2 text-[#245233] font-bold">
                <ShieldCheck className="w-4 h-4 text-[#3D6E4B]" />
                <span>ضمان الجودة والمؤونة السورية في غرايفسفالد:</span>
              </div>
              <ul className="text-[#245233]/90 space-y-1 pr-5 list-disc text-[11px]">
                <li>مستورد أصلي من المزارع والورش الحرفية السورية (حلب، دمشق، حماة...)</li>
                <li>حلال 100% ومفحوص الجودة</li>
                <li>توصيل سريع حتى باب المنزل في غرايفسفالد خلال ساعتين</li>
                <li>إمكانية الاسترجاع أو الاستبدال فوراً</li>
              </ul>
            </div>
          </div>

          {/* Right / Product Details Column */}
          <div className="flex flex-col justify-between space-y-4">
            
            <div className="space-y-3">
              
              {/* Category & Brand tags */}
              <div className="flex items-center justify-between text-xs">
                <span className="bg-[#E2EFE4] text-[#245233] font-bold px-2.5 py-0.5 rounded-full border border-[#C5DEC8]">
                  {product.brand}
                </span>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={handleShare}
                    className="p-1.5 text-[#527059] hover:text-[#1B3022] rounded-lg hover:bg-[#EBF3EC]"
                    title="مشاركة المنتج"
                  >
                    <Share2 className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => onToggleWishlist(product)}
                    className={`p-1.5 rounded-lg transition-colors ${
                      isWishlisted ? 'text-rose-600 bg-rose-50' : 'text-[#527059] hover:text-rose-600 hover:bg-[#EBF3EC]'
                    }`}
                    title="إضافة للمفضلة"
                  >
                    <Heart className={`w-4 h-4 ${isWishlisted ? 'fill-rose-600' : ''}`} />
                  </button>
                </div>
              </div>

              {/* Title */}
              <h2 className="text-xl sm:text-2xl font-black text-[#1B3022] leading-tight">
                {language === 'ar' ? product.nameAr : (language === 'de' ? product.nameDe : product.nameEn)}
              </h2>

              {/* Rating & reviews count */}
              <div className="flex items-center gap-2 text-xs">
                <div className="flex items-center gap-1 text-amber-600 font-bold">
                  <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                  <span className="text-[#1B3022] text-sm">{product.rating.toFixed(1)}</span>
                </div>
                <span className="text-[#527059]">({reviews.length} تقييم زبون حقيقي)</span>
                <span className="text-[#D5E5D7]">•</span>
                <span className="text-[#3D6E4B] font-semibold">{product.weight}</span>
              </div>

              {/* Price Banner */}
              <div className="bg-white rounded-2xl p-3.5 border border-[#D5E5D7] flex items-center justify-between">
                <div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-black text-[#3D6E4B] font-sans">
                      {formatPrice(product.price, currency)}
                    </span>
                    {product.originalPrice && (
                      <span className="text-sm text-stone-400 line-through font-sans">
                        {formatPrice(product.originalPrice, currency)}
                      </span>
                    )}
                  </div>
                  <span className="text-[11px] text-[#527059] flex items-center gap-1 mt-0.5">
                    <Zap className="w-3 h-3 text-amber-500" />
                    <span>الضريبة مشمولة • توصيل غرايفسفالد خلال ساعتين</span>
                  </span>
                </div>

                <span className="bg-[#3D6E4B] text-white text-xs font-bold px-2.5 py-1 rounded-lg">
                  {t.inStock}
                </span>
              </div>

              {/* Nav Tabs (Details / Nutrition / Reviews) */}
              <div className="flex border-b border-[#D5E5D7] text-xs font-bold gap-2 pt-2">
                <button
                  onClick={() => setActiveTab('info')}
                  className={`pb-2 px-2 border-b-2 transition-colors cursor-pointer ${
                    activeTab === 'info'
                      ? 'border-[#3D6E4B] text-[#3D6E4B]'
                      : 'border-transparent text-[#527059] hover:text-[#1B3022]'
                  }`}
                >
                  الوصف والمكونات
                </button>
                <button
                  onClick={() => setActiveTab('nutrition')}
                  className={`pb-2 px-2 border-b-2 transition-colors cursor-pointer ${
                    activeTab === 'nutrition'
                      ? 'border-[#3D6E4B] text-[#3D6E4B]'
                      : 'border-transparent text-[#527059] hover:text-[#1B3022]'
                  }`}
                >
                  القيم الغذائية والحفظ
                </button>
                <button
                  onClick={() => setActiveTab('reviews')}
                  className={`pb-2 px-2 border-b-2 transition-colors cursor-pointer ${
                    activeTab === 'reviews'
                      ? 'border-[#3D6E4B] text-[#3D6E4B]'
                      : 'border-transparent text-[#527059] hover:text-[#1B3022]'
                  }`}
                >
                  تقييمات الزبائن ({reviews.length})
                </button>
              </div>

              {/* Tab Content */}
              <div className="text-xs text-[#1B3022]/90 leading-relaxed min-h-[100px]">
                {activeTab === 'info' && (
                  <div className="space-y-2.5">
                    <p>{product.descriptionAr}</p>
                    {product.ingredientsAr && (
                      <div className="bg-[#EBF3EC] p-2.5 rounded-xl border border-[#D5E5D7]">
                        <span className="font-bold text-[#1B3022] block mb-0.5">المكونات:</span>
                        <p className="text-[#245233]">{product.ingredientsAr}</p>
                      </div>
                    )}
                  </div>
                )}

                {activeTab === 'nutrition' && (
                  <div className="space-y-2.5">
                    {product.nutrition ? (
                      <div className="grid grid-cols-4 gap-2 text-center">
                        <div className="bg-white border border-[#D5E5D7] p-2 rounded-xl">
                          <span className="text-[10px] text-[#527059] block">سعرات</span>
                          <span className="font-bold text-[#1B3022]">{product.nutrition.calories} kcal</span>
                        </div>
                        <div className="bg-white border border-[#D5E5D7] p-2 rounded-xl">
                          <span className="text-[10px] text-[#527059] block">بروتين</span>
                          <span className="font-bold text-[#1B3022]">{product.nutrition.protein}</span>
                        </div>
                        <div className="bg-white border border-[#D5E5D7] p-2 rounded-xl">
                          <span className="text-[10px] text-[#527059] block">دهون</span>
                          <span className="font-bold text-[#1B3022]">{product.nutrition.fat}</span>
                        </div>
                        <div className="bg-white border border-[#D5E5D7] p-2 rounded-xl">
                          <span className="text-[10px] text-[#527059] block">كارب</span>
                          <span className="font-bold text-[#1B3022]">{product.nutrition.carbs}</span>
                        </div>
                      </div>
                    ) : (
                      <p className="text-[#527059]">طبيعي 100% بدون إضافات كيميائية أو مواد حافظة.</p>
                    )}

                    {product.storageAr && (
                      <div className="bg-cyan-50 p-2.5 rounded-xl border border-cyan-200 text-cyan-950">
                        <span className="font-bold block mb-0.5">تعليمات الحفظ والتوصيل:</span>
                        <p>{product.storageAr}</p>
                      </div>
                    )}
                  </div>
                )}

                {activeTab === 'reviews' && (
                  <div className="space-y-3">
                    {/* Add Review Form */}
                    <form onSubmit={handleAddReview} className="bg-white p-2.5 rounded-xl border border-[#D5E5D7] space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-[#1B3022] text-[11px]">أضف رأيك في هذا المنتج:</span>
                        <div className="flex gap-1">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <button
                              type="button"
                              key={star}
                              onClick={() => setNewReviewRating(star)}
                              className="cursor-pointer"
                            >
                              <Star className={`w-3.5 h-3.5 ${star <= newReviewRating ? 'fill-amber-400 text-amber-400' : 'text-stone-300'}`} />
                            </button>
                          ))}
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <input
                          type="text"
                          placeholder="اسمك وحيك في غرايفسفالد (مثال: أبو عمر - Schönwalde)"
                          value={newReviewAuthor}
                          onChange={(e) => setNewReviewAuthor(e.target.value)}
                          className="bg-[#F9FAF9] px-2 py-1 rounded-lg border border-[#D5E5D7] text-xs w-full text-[#1B3022]"
                          required
                        />
                        <button
                          type="submit"
                          className="bg-[#3D6E4B] hover:bg-[#315A3D] text-white text-xs font-bold py-1 rounded-lg transition-colors cursor-pointer"
                        >
                          نشر التقييم
                        </button>
                      </div>
                      <textarea
                        placeholder="ما رأيك في الطعم والتغليف وسرعة التوصيل؟"
                        value={newReviewComment}
                        onChange={(e) => setNewReviewComment(e.target.value)}
                        className="bg-[#F9FAF9] px-2 py-1 rounded-lg border border-[#D5E5D7] text-xs w-full h-12 resize-none text-[#1B3022]"
                        required
                      />
                      {reviewSubmitted && (
                        <p className="text-[#3D6E4B] text-[11px] font-bold">شكراً لتقييمك! تم نشره بنجاح.</p>
                      )}
                    </form>

                    {/* Review List */}
                    <div className="space-y-2 max-h-40 overflow-y-auto">
                      {reviews.map((rev) => (
                        <div key={rev.id} className="bg-white p-2.5 rounded-xl border border-[#D5E5D7]">
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-bold text-[#1B3022] text-xs">{rev.author}</span>
                            <div className="flex items-center gap-0.5">
                              {[...Array(rev.rating)].map((_, i) => (
                                <Star key={i} className="w-3 h-3 fill-amber-400 text-amber-400" />
                              ))}
                            </div>
                          </div>
                          <p className="text-[#527059] text-[11px]">{rev.comment}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

            </div>

            {/* Quantity Stepper & Add to Cart Footer */}
            <div className="pt-3 border-t border-[#D5E5D7] flex items-center gap-3">
              <div className="flex items-center border border-[#D5E5D7] rounded-xl overflow-hidden bg-white">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="p-2 text-[#527059] hover:bg-[#EBF3EC] transition-colors cursor-pointer"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span className="w-10 text-center font-bold text-[#1B3022] text-sm">
                  {quantity}
                </span>
                <button
                  onClick={() => setQuantity(quantity + 1)}
                  className="p-2 text-[#527059] hover:bg-[#EBF3EC] transition-colors cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              <button
                onClick={() => {
                  onAddToCart(product, quantity);
                  onClose();
                }}
                className="flex-1 bg-[#3D6E4B] hover:bg-[#315A3D] text-white font-bold py-3 px-4 rounded-xl shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 text-sm cursor-pointer"
              >
                <ShoppingBag className="w-4 h-4" />
                <span>إضافة {quantity} للسلة • {formatPrice(product.price * quantity, currency)}</span>
              </button>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
};
