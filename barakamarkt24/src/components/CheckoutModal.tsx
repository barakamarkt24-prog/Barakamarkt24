import React, { useState } from 'react';
import { 
  X, 
  CreditCard, 
  Truck, 
  ShieldCheck, 
  MapPin, 
  Phone, 
  Mail, 
  User, 
  CheckCircle2, 
  Snowflake, 
  Wallet,
  MessageCircle,
  Building,
  Lock
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { CartItem, Currency, CustomerOrderInfo, Language, Order, PaymentMethod } from '../types';
import { formatPrice, DICTIONARY } from '../utils/helpers';

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  items: CartItem[];
  currency: Currency;
  language: Language;
  appliedCoupon: string | null;
  onOrderPlaced: (order: Order) => void;
}

export const CheckoutModal: React.FC<CheckoutModalProps> = ({
  isOpen,
  onClose,
  items,
  currency,
  language,
  appliedCoupon,
  onOrderPlaced
}) => {
  if (!isOpen) return null;

  const [customerInfo, setCustomerInfo] = useState<CustomerOrderInfo>({
    fullName: '',
    phone: '',
    email: '',
    country: 'ألمانيا (Deutschland)',
    city: 'غرايفسفالد (Greifswald)',
    street: '',
    postalCode: '17489',
    notes: ''
  });

  const [deliverySlot, setDeliverySlot] = useState<string>('خلال ساعتين عمل فوري ⚡');
  const [district, setDistrict] = useState<string>('Schönwalde I');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cod');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const t = DICTIONARY[language];
  const subtotal = items.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  const isFreeShipping = subtotal >= 20;
  const shippingFee = items.length === 0 ? 0 : (isFreeShipping ? 0 : 2.50);
  const discount = appliedCoupon ? subtotal * 0.10 : 0;
  const total = subtotal - discount + shippingFee;
  const hasColdItems = items.some(item => item.product.isColdShipping);

  const GREIFSWALD_DISTRICTS = [
    'Schönwalde I (شونفالده 1)',
    'Schönwalde II (شونفالده 2)',
    'Innenstadt / Zentrum (مركز المدينة)',
    'Fleischervorstadt',
    'Fettenvorstadt',
    'Eldena (إلدينا)',
    'Wieck (فيك)',
    'Ostseeviertel',
    'Stadtrandsiedlung',
    'Neuenkirchen (ضواحي غرايفسفالد)',
    'Wackerow'
  ];

  const handleSubmitOrder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerInfo.fullName || !customerInfo.phone || !customerInfo.street) {
      alert('يرجى تعبئة كافة الحقول المطلوبة لعنوان التوصيل في غرايفسفالد');
      return;
    }

    setIsSubmitting(true);

    setTimeout(() => {
      // Trigger confetti
      confetti({
        particleCount: 120,
        spread: 70,
        origin: { y: 0.6 }
      });

      const orderNumber = `HGW-${Math.floor(100000 + Math.random() * 900000)}`;
      const newOrder: Order = {
        id: orderNumber,
        orderId: orderNumber,
        userId: 'guest',
        phone: customerInfo.phone || '',
        address: `${customerInfo.street} - ${district}`,
        city: `Greifswald - ${district}`,
        items,
        subtotal,
        shippingFee,
        discount,
        total,
        customerInfo: {
          ...customerInfo,
          city: `Greifswald - ${district}`
        },
        paymentMethod,
        status: 'pending',
        createdAt: new Date().toLocaleDateString('ar-SY', { dateStyle: 'medium', timeStyle: 'short' }),
        deliveryDateEstimated: 'خلال ساعتين عمل (توصيل غرايفسفالد السريع)',
        coldShippingIncluded: hasColdItems
      };

      setIsSubmitting(false);
      onOrderPlaced(newOrder);
      onClose();
    }, 900);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div 
        className="bg-[#FDFBF7] rounded-3xl max-w-4xl w-full max-h-[92vh] overflow-y-auto shadow-2xl border border-[#D5E5D7] animate-in fade-in zoom-in-95 duration-200 relative text-[#1B3022]"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* Header */}
        <div className="sticky top-0 z-20 bg-[#F4F8F4]/95 backdrop-blur-md p-4 sm:p-5 border-b border-[#D5E5D7] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 bg-[#3D6E4B] text-amber-300 rounded-xl flex items-center justify-center font-black shadow-xs">
              ⚡
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-[#1B3022] flex items-center gap-2">
                <span>إتمام الطلب • توصيل سريع في غرايفسفالد</span>
              </h2>
              <p className="text-xs text-[#527059]">
                بركة ماركت غرايفسفالد • التوصيل خلال ساعتين عمل لباب منزلك
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-[#1B3022] hover:bg-[#E2EFE4] rounded-full transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body Form */}
        <form onSubmit={handleSubmitOrder} className="p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-5">
          
          {/* Left Form: Delivery Address & Payment */}
          <div className="lg:col-span-7 space-y-5">
            
            {/* Section 1: Customer Contact Info */}
            <div className="bg-white rounded-2xl p-4 border border-[#D5E5D7] space-y-3">
              <h3 className="font-bold text-sm text-[#1B3022] flex items-center gap-2 border-b border-[#EDF4EE] pb-2">
                <User className="w-4 h-4 text-[#3D6E4B]" />
                <span>1. معلومات المستلم والتواصل</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-[#1B3022] block mb-1">الاسم الكامل *</label>
                  <input
                    type="text"
                    required
                    placeholder="مثال: محمد الحلبي"
                    value={customerInfo.fullName}
                    onChange={(e) => setCustomerInfo({ ...customerInfo, fullName: e.target.value })}
                    className="w-full bg-[#F9FAF9] px-3 py-2 text-xs rounded-xl border border-[#D5E5D7] focus:border-[#3D6E4B] focus:ring-1 focus:ring-[#3D6E4B] outline-hidden text-[#1B3022]"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-[#1B3022] block mb-1">رقم الهاتف / واتساب لتنسيق الوصول *</label>
                  <input
                    type="tel"
                    required
                    placeholder="+49 152 00000000"
                    value={customerInfo.phone}
                    onChange={(e) => setCustomerInfo({ ...customerInfo, phone: e.target.value })}
                    className="w-full bg-[#F9FAF9] px-3 py-2 text-xs rounded-xl border border-[#D5E5D7] focus:border-[#3D6E4B] focus:ring-1 focus:ring-[#3D6E4B] outline-hidden dir-ltr text-right text-[#1B3022]"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="text-xs font-semibold text-[#1B3022] block mb-1">البريد الإلكتروني (اختياري)</label>
                  <input
                    type="email"
                    placeholder="name@example.com"
                    value={customerInfo.email}
                    onChange={(e) => setCustomerInfo({ ...customerInfo, email: e.target.value })}
                    className="w-full bg-[#F9FAF9] px-3 py-2 text-xs rounded-xl border border-[#D5E5D7] focus:border-[#3D6E4B] outline-hidden text-[#1B3022]"
                  />
                </div>
              </div>
            </div>

            {/* Section 2: Delivery Address in Greifswald */}
            <div className="bg-white rounded-2xl p-4 border border-[#D5E5D7] space-y-3">
              <div className="flex items-center justify-between border-b border-[#EDF4EE] pb-2">
                <h3 className="font-bold text-sm text-[#1B3022] flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-[#3D6E4B]" />
                  <span>2. عنوان التوصيل داخل غرايفسفالد (Greifswald)</span>
                </h3>
                <span className="text-[11px] font-bold text-[#245233] bg-[#E2EFE4] px-2 py-0.5 rounded-full border border-[#C5DEC8]">
                  توصيل خلال ساعتين ⚡
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                
                <div>
                  <label className="text-xs font-bold text-[#1B3022] block mb-1">الحي / المنطقة في غرايفسفالد *</label>
                  <select
                    value={district}
                    onChange={(e) => setDistrict(e.target.value)}
                    className="w-full bg-[#F9FAF9] px-3 py-2 text-xs rounded-xl border border-[#D5E5D7] focus:border-[#3D6E4B] outline-hidden cursor-pointer text-[#1B3022] font-semibold"
                  >
                    {GREIFSWALD_DISTRICTS.map((d) => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-[#1B3022] block mb-1">الرمز البريدي (PLZ) *</label>
                  <select
                    value={customerInfo.postalCode}
                    onChange={(e) => setCustomerInfo({ ...customerInfo, postalCode: e.target.value })}
                    className="w-full bg-[#F9FAF9] px-3 py-2 text-xs rounded-xl border border-[#D5E5D7] focus:border-[#3D6E4B] outline-hidden cursor-pointer text-[#1B3022]"
                  >
                    <option value="17489">17489 Greifswald</option>
                    <option value="17491">17491 Greifswald</option>
                    <option value="17493">17493 Greifswald (Eldena / Wieck)</option>
                    <option value="17498">17498 Neuenkirchen</option>
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label className="text-xs font-bold text-[#1B3022] block mb-1">الشارع ورقم البناء والشقة (Straße & Hausnr.) *</label>
                  <input
                    type="text"
                    required
                    placeholder="مثال: Makarenkostraße 15, WG 3"
                    value={customerInfo.street}
                    onChange={(e) => setCustomerInfo({ ...customerInfo, street: e.target.value })}
                    className="w-full bg-[#F9FAF9] px-3 py-2 text-xs rounded-xl border border-[#D5E5D7] focus:border-[#3D6E4B] outline-hidden text-[#1B3022]"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="text-xs font-semibold text-[#1B3022] block mb-1">ملاحظات التوصيل لمندوب البقالية</label>
                  <input
                    type="text"
                    placeholder="مثال: يرجى رن الجرس باسم العائلة أو الاتصال قبل 10 دقائق"
                    value={customerInfo.notes}
                    onChange={(e) => setCustomerInfo({ ...customerInfo, notes: e.target.value })}
                    className="w-full bg-[#F9FAF9] px-3 py-2 text-xs rounded-xl border border-[#D5E5D7] focus:border-[#3D6E4B] outline-hidden text-[#1B3022]"
                  />
                </div>
              </div>
            </div>

            {/* Section 3: Payment Method */}
            <div className="bg-white rounded-2xl p-4 border border-[#D5E5D7] space-y-3">
              <h3 className="font-bold text-sm text-[#1B3022] flex items-center gap-2 border-b border-[#EDF4EE] pb-2">
                <Wallet className="w-4 h-4 text-[#3D6E4B]" />
                <span>3. طريقة الدفع</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                
                {/* Cash on Delivery */}
                <label className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                  paymentMethod === 'cod'
                    ? 'bg-[#EBF3EC] border-[#3D6E4B] ring-2 ring-[#3D6E4B]/20'
                    : 'bg-[#F9FAF9] border-[#D5E5D7] hover:bg-[#F4F8F4]'
                }`}>
                  <input
                    type="radio"
                    name="payment"
                    value="cod"
                    checked={paymentMethod === 'cod'}
                    onChange={() => setPaymentMethod('cod')}
                    className="accent-[#3D6E4B]"
                  />
                  <div>
                    <span className="font-bold text-xs text-[#1B3022] block">الدفع كاش عند الاستلام</span>
                    <span className="text-[11px] text-[#527059]">ادفع نقداً لمندوب التوصيل</span>
                  </div>
                </label>

                {/* PayPal */}
                <label className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                  paymentMethod === 'paypal'
                    ? 'bg-[#EBF3EC] border-[#3D6E4B] ring-2 ring-[#3D6E4B]/20'
                    : 'bg-[#F9FAF9] border-[#D5E5D7] hover:bg-[#F4F8F4]'
                }`}>
                  <input
                    type="radio"
                    name="payment"
                    value="paypal"
                    checked={paymentMethod === 'paypal'}
                    onChange={() => setPaymentMethod('paypal')}
                    className="accent-[#3D6E4B]"
                  />
                  <div>
                    <span className="font-bold text-xs text-[#1B3022] block">PayPal باي بال</span>
                    <span className="text-[11px] text-[#527059]">دفع سريع وآمن</span>
                  </div>
                </label>

                {/* Card Payment */}
                <label className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                  paymentMethod === 'card'
                    ? 'bg-[#EBF3EC] border-[#3D6E4B] ring-2 ring-[#3D6E4B]/20'
                    : 'bg-[#F9FAF9] border-[#D5E5D7] hover:bg-[#F4F8F4]'
                }`}>
                  <input
                    type="radio"
                    name="payment"
                    value="card"
                    checked={paymentMethod === 'card'}
                    onChange={() => setPaymentMethod('card')}
                    className="accent-[#3D6E4B]"
                  />
                  <div>
                    <span className="font-bold text-xs text-[#1B3022] block">بطاقة EC / فيزا عند الباب</span>
                    <span className="text-[11px] text-[#527059]">جهاز نقاط بيع مع المندوب</span>
                  </div>
                </label>

                {/* Klarna / Überweisung */}
                <label className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                  paymentMethod === 'klarna'
                    ? 'bg-[#EBF3EC] border-[#3D6E4B] ring-2 ring-[#3D6E4B]/20'
                    : 'bg-[#F9FAF9] border-[#D5E5D7] hover:bg-[#F4F8F4]'
                }`}>
                  <input
                    type="radio"
                    name="payment"
                    value="klarna"
                    checked={paymentMethod === 'klarna'}
                    onChange={() => setPaymentMethod('klarna')}
                    className="accent-[#3D6E4B]"
                  />
                  <div>
                    <span className="font-bold text-xs text-[#1B3022] block">تحويل بنكي / Klarna</span>
                    <span className="text-[11px] text-[#527059]">Überweisung</span>
                  </div>
                </label>

              </div>
            </div>

          </div>

          {/* Right Summary: Order review and Place order button */}
          <div className="lg:col-span-5 space-y-4">
            
            <div className="bg-white rounded-2xl p-4 border border-[#D5E5D7] space-y-4">
              <h3 className="font-bold text-sm text-[#1B3022] border-b border-[#EDF4EE] pb-2 flex items-center justify-between">
                <span>ملخص السلة ({items.length} صنف)</span>
                <span className="text-xs text-[#3D6E4B] font-bold">غرايفسفالد</span>
              </h3>

              {/* Items mini list */}
              <div className="max-h-48 overflow-y-auto space-y-2 text-xs divide-y divide-[#EDF4EE]">
                {items.map((item) => (
                  <div key={item.product.id} className="pt-2 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <img 
                        src={item.product.image} 
                        alt={item.product.nameAr}
                        className="w-8 h-8 rounded-lg object-cover border border-[#D5E5D7]"
                      />
                      <div className="min-w-0">
                        <p className="font-bold text-[#1B3022] truncate">{item.product.nameAr}</p>
                        <p className="text-[10px] text-[#527059]">{item.quantity} × {formatPrice(item.product.price, currency)}</p>
                      </div>
                    </div>
                    <span className="font-bold text-[#3D6E4B] whitespace-nowrap">
                      {formatPrice(item.product.price * item.quantity, currency)}
                    </span>
                  </div>
                ))}
              </div>

              {/* Cold packaging notice */}
              {hasColdItems && (
                <div className="bg-cyan-50 border border-cyan-200 rounded-xl p-2.5 text-xs text-cyan-950 flex items-center gap-2">
                  <Snowflake className="w-4 h-4 text-cyan-700 shrink-0" />
                  <span>تغليف حراري خاص للأجبان والمنتجات الطازجة</span>
                </div>
              )}

              {/* 2-Hour Delivery Promise Box */}
              <div className="bg-[#EBF3EC] border border-[#C5DEC8] rounded-xl p-2.5 text-xs text-[#245233] flex items-center gap-2">
                <Truck className="w-4 h-4 text-[#3D6E4B] shrink-0" />
                <div>
                  <p className="font-bold">موعد التوصيل المتوقع:</p>
                  <p className="text-[11px] text-[#3E6547]">خلال ساعتين عمل من تأكيد الطلب</p>
                </div>
              </div>

              {/* Total calculations */}
              <div className="space-y-1.5 text-xs text-[#527059] pt-2 border-t border-[#EDF4EE]">
                <div className="flex justify-between">
                  <span>المجموع الفرعي</span>
                  <span className="font-bold text-[#1B3022]">{formatPrice(subtotal, currency)}</span>
                </div>

                {appliedCoupon && (
                  <div className="flex justify-between text-[#3D6E4B] font-semibold">
                    <span>خصم الكوبون</span>
                    <span>- {formatPrice(discount, currency)}</span>
                  </div>
                )}

                <div className="flex justify-between">
                  <span>توصيل غرايفسفالد</span>
                  <span className="font-bold text-[#1B3022]">
                    {isFreeShipping ? <span className="text-[#3D6E4B]">توصيل مجاني (طلب +20€)</span> : formatPrice(shippingFee, currency)}
                  </span>
                </div>

                <div className="flex justify-between pt-2 border-t border-[#EDF4EE] text-base font-black text-[#1B3022]">
                  <span>المبلغ الإجمالي</span>
                  <span className="text-[#3D6E4B] font-sans">{formatPrice(total, currency)}</span>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-[#3D6E4B] hover:bg-[#315A3D] text-white font-bold py-3.5 px-4 rounded-xl shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 text-sm cursor-pointer disabled:opacity-50"
              >
                <Lock className="w-4 h-4 text-amber-300" />
                <span>{isSubmitting ? 'جاري تأكيد وتوجيه الطلب للمندوب...' : `تأكيد الطلب الآن (${formatPrice(total, currency)})`}</span>
              </button>

              <div className="flex items-center justify-center gap-2 text-[11px] text-[#527059] pt-1">
                <ShieldCheck className="w-3.5 h-3.5 text-[#3D6E4B]" />
                <span>توصيل محلي مباشر في غرايفسفالد • كاش أو إلكتروني</span>
              </div>

            </div>

          </div>

        </form>

      </div>
    </div>
  );
};
