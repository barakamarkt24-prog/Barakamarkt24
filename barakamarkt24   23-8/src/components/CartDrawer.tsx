import React, { useState } from 'react';
import { 
  X, 
  Trash2, 
  Plus, 
  Minus, 
  ShoppingBag, 
  Truck, 
  Snowflake, 
  Sparkles, 
  ArrowLeft, 
  ArrowRight, 
  Tag, 
  MessageCircle,
  ShieldCheck,
  Zap
} from 'lucide-react';
import { CartItem, Currency, Language } from '../types';
import { formatPrice, DICTIONARY } from '../utils/helpers';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  items: CartItem[];
  onUpdateQuantity: (productId: string, quantity: number) => void;
  onRemoveItem: (productId: string) => void;
  onClearCart: () => void;
  currency: Currency;
  language: Language;
  onProceedToCheckout: () => void;
  appliedCoupon: string | null;
  onApplyCoupon: (code: string) => boolean;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({
  isOpen,
  onClose,
  items,
  onUpdateQuantity,
  onRemoveItem,
  onClearCart,
  currency,
  language,
  onProceedToCheckout,
  appliedCoupon,
  onApplyCoupon
}) => {
  if (!isOpen) return null;

  const [couponInput, setCouponInput] = useState('');
  const [couponError, setCouponError] = useState('');
  const t = DICTIONARY[language];
  const isRtl = language === 'ar';

  const subtotal = items.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  const FREE_SHIPPING_THRESHOLD = 20.0; // 20€ threshold for Greifswald
  const isFreeShipping = subtotal >= FREE_SHIPPING_THRESHOLD;
  const remainingForFreeShipping = Math.max(0, FREE_SHIPPING_THRESHOLD - subtotal);
  const progressPercent = Math.min(100, (subtotal / FREE_SHIPPING_THRESHOLD) * 100);

  const discountAmount = appliedCoupon ? subtotal * 0.10 : 0;
  const standardShippingFee = items.length === 0 ? 0 : (isFreeShipping ? 0 : 2.50);
  const total = Math.max(0, subtotal - discountAmount + standardShippingFee);

  const hasColdItems = items.some(item => item.product.isColdShipping);

  const handleApplyCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    if (!couponInput.trim()) return;
    const success = onApplyCoupon(couponInput.trim());
    if (!success) {
      setCouponError('كود الخصم غير صالح. جرب كود: BARAKA10');
    } else {
      setCouponError('');
      setCouponInput('');
    }
  };

  // Pre-generate WhatsApp message for 1-click ordering in Greifswald
  const handleWhatsAppOrder = () => {
    const itemListText = items.map(item => `- ${item.product.nameAr} (${item.quantity} × ${item.product.price}€)`).join('\n');
    const msg = `مرحباً بركة ماركت غرايفسفالد 👋\nأرغب بتأكيد طلبيتي للتوصيل خلال ساعتين:\n${itemListText}\n\nالمجموع: ${total.toFixed(2)}€\nالرجاء إرسال المندوب لعنواني في غرايفسفالد. شكراً!`;
    const encoded = encodeURIComponent(msg);
    window.open(`https://wa.me/4915000000000?text=${encoded}`, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/60 backdrop-blur-xs flex justify-end animate-in fade-in duration-200">
      
      {/* Click outside backdrop */}
      <div className="absolute inset-0" onClick={onClose} />

      {/* Slide Drawer Content */}
      <div 
        className="relative w-full max-w-md bg-[#FDFBF7] h-full shadow-2xl flex flex-col justify-between text-[#1B3022] z-10 animate-in slide-in-from-right duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* Header */}
        <div className="p-4 border-b border-[#D5E5D7] flex items-center justify-between bg-[#F4F8F4]">
          <div className="flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-[#3D6E4B]" />
            <div>
              <h2 className="font-extrabold text-base sm:text-lg text-[#1B3022]">
                {t.cartTitle} ({items.reduce((acc, i) => acc + i.quantity, 0)})
              </h2>
              <span className="text-[10px] text-[#527059] font-medium block">
                توصيل فوري داخل غرايفسفالد خلال ساعتين ⚡
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {items.length > 0 && (
              <button
                onClick={onClearCart}
                className="text-xs text-rose-600 hover:text-rose-700 hover:underline cursor-pointer font-semibold"
              >
                تفريغ السلة
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1.5 text-[#1B3022] hover:bg-[#E2EFE4] rounded-lg transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Free Shipping Progress Indicator */}
        <div className="bg-[#3D6E4B] text-white p-3 text-xs space-y-1.5 shadow-inner">
          <div className="flex items-center justify-between font-semibold">
            <span className="flex items-center gap-1.5">
              <Zap className="w-4 h-4 text-amber-300" />
              {isFreeShipping ? '🎉 حصلت على توصيل مجاني في غرايفسفالد!' : `أضف بقيمة ${formatPrice(remainingForFreeShipping, currency)} لتوصيل مجاني`}
            </span>
            <span className="font-bold text-amber-200">{Math.round(progressPercent)}%</span>
          </div>
          
          <div className="w-full bg-[#294B33] rounded-full h-2 overflow-hidden">
            <div 
              className="bg-gradient-to-r from-amber-400 to-amber-200 h-full rounded-full transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* Cold Packaging Alert if required */}
        {hasColdItems && (
          <div className="bg-cyan-50 border-y border-cyan-200 px-3.5 py-2 text-xs flex items-center gap-2 text-cyan-950">
            <Snowflake className="w-4 h-4 text-cyan-700 shrink-0" />
            <span>
              <strong>تغليف مبرد مجاني:</strong> سلتك تحتوي على أجبان/ألبان طازجة، ستصلك مبردة ومحفوظة بعناية.
            </span>
          </div>
        )}

        {/* Items List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 divide-y divide-[#EDF4EE]">
          {items.length === 0 ? (
            <div className="py-16 text-center space-y-3">
              <div className="w-16 h-16 bg-[#EBF3EC] rounded-full flex items-center justify-center mx-auto text-[#527059]">
                <ShoppingBag className="w-8 h-8" />
              </div>
              <h3 className="font-bold text-[#1B3022] text-base">{t.emptyCart}</h3>
              <p className="text-xs text-[#527059] max-w-xs mx-auto leading-relaxed">
                {t.emptyCartDesc}
              </p>
              <button
                onClick={onClose}
                className="mt-2 bg-[#3D6E4B] hover:bg-[#315A3D] text-white font-bold text-xs px-4 py-2 rounded-xl transition-all cursor-pointer shadow-xs"
              >
                {t.continueShopping}
              </button>
            </div>
          ) : (
            items.map((item) => (
              <div key={item.product.id} className="pt-3 flex gap-3 items-center group">
                <img 
                  src={item.product.image} 
                  alt={item.product.nameAr}
                  className="w-16 h-16 object-cover rounded-xl border border-[#D5E5D7] shrink-0"
                />

                <div className="flex-1 min-w-0">
                  <h4 className="font-bold text-xs sm:text-sm text-[#1B3022] line-clamp-1">
                    {language === 'ar' ? item.product.nameAr : (language === 'de' ? item.product.nameDe : item.product.nameEn)}
                  </h4>
                  <div className="flex items-center gap-2 text-[11px] text-[#527059] mt-0.5">
                    <span>{item.product.weight}</span>
                    <span>•</span>
                    <span className="font-bold text-[#3D6E4B]">
                      {formatPrice(item.product.price, currency)}
                    </span>
                  </div>

                  {/* Quantity controls */}
                  <div className="flex items-center justify-between mt-2">
                    <div className="flex items-center border border-[#D5E5D7] rounded-lg overflow-hidden bg-white">
                      <button
                        onClick={() => onUpdateQuantity(item.product.id, item.quantity - 1)}
                        className="p-1 text-[#527059] hover:bg-[#EBF3EC] transition-colors cursor-pointer"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="w-7 text-center font-bold text-[#1B3022] text-xs">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => onUpdateQuantity(item.product.id, item.quantity + 1)}
                        className="p-1 text-[#527059] hover:bg-[#EBF3EC] transition-colors cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="font-black text-[#1B3022] text-xs sm:text-sm font-sans">
                        {formatPrice(item.product.price * item.quantity, currency)}
                      </span>
                      <button
                        onClick={() => onRemoveItem(item.product.id)}
                        className="text-stone-400 hover:text-rose-600 p-1 transition-colors cursor-pointer"
                        title="حذف"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer Checkout Summary */}
        {items.length > 0 && (
          <div className="p-4 border-t border-[#D5E5D7] bg-white space-y-3">
            
            {/* Coupon input */}
            <form onSubmit={handleApplyCoupon} className="flex gap-2">
              <div className="relative flex-1">
                <input
                  type="text"
                  placeholder={t.couponCode}
                  value={couponInput}
                  onChange={(e) => setCouponInput(e.target.value)}
                  className="w-full bg-[#F9FAF9] text-xs px-3 py-2 rounded-xl border border-[#D5E5D7] focus:border-[#3D6E4B] focus:outline-hidden uppercase font-mono text-[#1B3022]"
                />
                <Tag className="w-3.5 h-3.5 text-[#527059] absolute left-2.5 top-1/2 -translate-y-1/2" />
              </div>
              <button
                type="submit"
                className="bg-[#3D6E4B] hover:bg-[#315A3D] text-white text-xs font-bold px-3 py-2 rounded-xl transition-colors cursor-pointer shrink-0"
              >
                تطبيق
              </button>
            </form>
            {couponError && <p className="text-rose-600 text-[11px] font-semibold">{couponError}</p>}
            {appliedCoupon && <p className="text-[#3D6E4B] text-[11px] font-bold">✨ تم تطبيق كود {appliedCoupon} (خصم 10%)</p>}

            {/* Calculations Breakdown */}
            <div className="space-y-1.5 text-xs text-[#527059] pt-1">
              <div className="flex justify-between">
                <span>{t.subtotal}</span>
                <span className="font-semibold text-[#1B3022]">{formatPrice(subtotal, currency)}</span>
              </div>

              {appliedCoupon && (
                <div className="flex justify-between text-[#3D6E4B] font-medium">
                  <span>خصم الكوبون (10%)</span>
                  <span>- {formatPrice(discountAmount, currency)}</span>
                </div>
              )}

              <div className="flex justify-between">
                <span>توصيل غرايفسفالد (خلال ساعتين)</span>
                <span className="font-semibold text-[#1B3022]">
                  {isFreeShipping ? <span className="text-[#3D6E4B] font-bold">مجاني</span> : formatPrice(standardShippingFee, currency)}
                </span>
              </div>

              <div className="flex justify-between pt-2 border-t border-[#EDF4EE] text-sm sm:text-base font-black text-[#1B3022]">
                <span>{t.total}</span>
                <span className="text-[#3D6E4B] font-sans">{formatPrice(total, currency)}</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-2 pt-1">
              <button
                onClick={() => {
                  onClose();
                  onProceedToCheckout();
                }}
                className="w-full bg-[#3D6E4B] hover:bg-[#315A3D] text-white font-bold py-3 px-4 rounded-xl shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 text-sm cursor-pointer"
              >
                <span>{t.checkout}</span>
                {isRtl ? <ArrowLeft className="w-4 h-4" /> : <ArrowRight className="w-4 h-4" />}
              </button>

              <button
                onClick={handleWhatsAppOrder}
                className="w-full bg-[#E2EFE4] hover:bg-[#D3E8D6] text-[#245233] font-bold py-2.5 px-4 rounded-xl border border-[#C5DEC8] transition-colors flex items-center justify-center gap-2 text-xs cursor-pointer"
              >
                <MessageCircle className="w-4 h-4 text-[#3D6E4B]" />
                <span>إتمام الطلب عبر واتساب غرايفسفالد 💬</span>
              </button>
            </div>

          </div>
        )}

      </div>
    </div>
  );
};
