import React from 'react';
import { 
  CheckCircle, 
  Package, 
  Truck, 
  Snowflake, 
  Calendar, 
  MapPin, 
  Printer, 
  MessageCircle, 
  Home,
  CheckCircle2,
  Clock,
  Sparkles,
  Zap
} from 'lucide-react';
import { Currency, Language, Order } from '../types';
import { formatPrice } from '../utils/helpers';

interface OrderConfirmationModalProps {
  order: Order | null;
  onClose: () => void;
  currency: Currency;
  language: Language;
}

export const OrderConfirmationModal: React.FC<OrderConfirmationModalProps> = ({
  order,
  onClose,
  currency,
  language
}) => {
  if (!order) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleWhatsAppShare = () => {
    const msg = `مرحباً بركة ماركت غرايفسفالد! لقد قمت بالطلب برقم: ${order.id}\nالإجمالي: ${formatPrice(order.total, currency)}\nالعنوان: ${order.customerInfo.street}, ${order.customerInfo.city}`;
    window.open(`https://wa.me/4915000000000?text=${encodeURIComponent(msg)}`, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div 
        className="bg-[#FDFBF7] rounded-3xl max-w-2xl w-full max-h-[92vh] overflow-y-auto shadow-2xl border border-[#D5E5D7] animate-in fade-in zoom-in-95 duration-200 relative text-[#1B3022] p-5 sm:p-7 space-y-5"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* Success Header */}
        <div className="text-center space-y-2">
          <div className="w-14 h-14 bg-[#E2EFE4] text-[#245233] rounded-full flex items-center justify-center mx-auto shadow-inner border border-[#C5DEC8]">
            <CheckCircle className="w-8 h-8 text-[#3D6E4B]" />
          </div>
          <span className="inline-flex items-center gap-1 bg-[#E2EFE4] text-[#245233] text-xs font-black px-3 py-1 rounded-full border border-[#C5DEC8]">
            <Zap className="w-3.5 h-3.5 text-amber-500" />
            <span>تم استلام وتأكيد طلبك بنجاح • توصيل خلال ساعتين</span>
          </span>
          <h2 className="text-xl sm:text-2xl font-black text-[#1B3022]">
            ألف صحة وهنا! طلبك قيد التجهيز في غرايفسفالد
          </h2>
          <p className="text-xs text-[#527059]">
            رقم الطلب: <span className="font-mono font-bold text-[#3D6E4B] text-sm">{order.id}</span> • تاريخ الطلب: {order.createdAt}
          </p>
        </div>

        {/* Live Delivery Status Stepper */}
        <div className="bg-white rounded-2xl p-4 border border-[#D5E5D7] space-y-3">
          <h3 className="font-bold text-xs text-[#1B3022] flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-[#3D6E4B]" />
              <span>مراحل توصيل طلبك في غرايفسفالد:</span>
            </span>
            <span className="text-[11px] font-extrabold text-[#245233] bg-[#E2EFE4] px-2 py-0.5 rounded-full border border-[#C5DEC8]">
              خلال ساعتين ⚡
            </span>
          </h3>

          <div className="grid grid-cols-4 gap-1 text-center text-[10px] sm:text-xs">
            
            <div className="space-y-1">
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-[#3D6E4B] text-white flex items-center justify-center mx-auto font-bold shadow-xs">
                ✓
              </div>
              <p className="font-bold text-[#3D6E4B]">تم التأكيد</p>
            </div>

            <div className="space-y-1">
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-[#3D6E4B] text-white flex items-center justify-center mx-auto font-bold shadow-xs animate-pulse">
                📦
              </div>
              <p className="font-bold text-[#3D6E4B]">التجهيز الفوري</p>
            </div>

            <div className="space-y-1">
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-[#EBF3EC] text-[#527059] flex items-center justify-center mx-auto font-bold">
                🚚
              </div>
              <p className="text-[#527059]">مع المندوب</p>
            </div>

            <div className="space-y-1">
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-[#EBF3EC] text-[#527059] flex items-center justify-center mx-auto font-bold">
                🏠
              </div>
              <p className="text-[#527059]">عند الباب</p>
            </div>

          </div>

          {order.coldShippingIncluded && (
            <div className="bg-cyan-50 border border-cyan-200 rounded-xl p-2.5 text-xs text-cyan-950 flex items-center gap-2">
              <Snowflake className="w-4 h-4 text-cyan-700 shrink-0" />
              <span>يتضمن الطلب تغليفاً مبرداً لحفظ جودة الأجبان والألبان السورية.</span>
            </div>
          )}
        </div>

        {/* Order Details & Summary List */}
        <div className="space-y-3">
          <h3 className="font-bold text-sm text-[#1B3022] border-b border-[#EDF4EE] pb-1.5">
            تفاصيل المنتجات والمؤونة
          </h3>

          <div className="divide-y divide-[#EDF4EE] max-h-44 overflow-y-auto text-xs">
            {order.items.map((item) => (
              <div key={item.product.id} className="py-2 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <img 
                    src={item.product.image} 
                    alt={item.product.nameAr}
                    className="w-8 h-8 rounded-lg object-cover border border-[#D5E5D7]"
                  />
                  <div>
                    <span className="font-bold text-[#1B3022]">{item.product.nameAr}</span>
                    <span className="text-[11px] text-[#527059] block">
                      {item.quantity} × {formatPrice(item.product.price, currency)}
                    </span>
                  </div>
                </div>
                <span className="font-bold text-[#3D6E4B] font-sans">
                  {formatPrice(item.product.price * item.quantity, currency)}
                </span>
              </div>
            ))}
          </div>

          <div className="bg-white rounded-xl p-3 space-y-1 text-xs text-[#527059] border border-[#D5E5D7]">
            <div className="flex justify-between">
              <span>المجموع الفرعي:</span>
              <span className="font-bold text-[#1B3022] font-sans">{formatPrice(order.subtotal, currency)}</span>
            </div>
            {order.discount > 0 && (
              <div className="flex justify-between text-[#3D6E4B] font-semibold">
                <span>الخصم المطبق:</span>
                <span className="font-sans">- {formatPrice(order.discount, currency)}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span>التوصيل في غرايفسفالد:</span>
              <span className="font-bold text-[#1B3022]">
                {order.shippingFee === 0 ? <span className="text-[#3D6E4B]">مجاني</span> : <span className="font-sans">{formatPrice(order.shippingFee, currency)}</span>}
              </span>
            </div>
            <div className="flex justify-between text-sm font-black text-[#3D6E4B] pt-1 border-t border-[#EDF4EE]">
              <span>الإجمالي:</span>
              <span className="font-sans">{formatPrice(order.total, currency)}</span>
            </div>
          </div>
        </div>

        {/* Delivery Address Summary */}
        <div className="bg-white rounded-xl p-3 text-xs text-[#1B3022] border border-[#D5E5D7] space-y-1">
          <span className="font-bold text-[#1B3022] block">عنوان الاستلام:</span>
          <p>{order.customerInfo.fullName} • {order.customerInfo.phone}</p>
          <p>{order.customerInfo.street}, {order.customerInfo.postalCode} {order.customerInfo.city}, {order.customerInfo.country}</p>
        </div>

        {/* Actions Footer */}
        <div className="flex flex-col sm:flex-row gap-2 pt-1">
          <button
            onClick={onClose}
            className="flex-1 bg-[#3D6E4B] hover:bg-[#315A3D] text-white font-bold py-3 rounded-xl transition-all flex items-center justify-center gap-2 text-xs cursor-pointer shadow-md"
          >
            <Home className="w-4 h-4 text-amber-300" />
            <span>العودة لمتجر بركة ماركت</span>
          </button>

          <button
            onClick={handleWhatsAppShare}
            className="bg-[#E2EFE4] hover:bg-[#D3E8D6] text-[#245233] font-bold py-3 px-4 rounded-xl border border-[#C5DEC8] transition-colors flex items-center justify-center gap-2 text-xs cursor-pointer"
          >
            <MessageCircle className="w-4 h-4 text-[#3D6E4B]" />
            <span>متابعة على واتساب</span>
          </button>

          <button
            onClick={handlePrint}
            className="bg-white hover:bg-[#F4F8F4] text-[#1B3022] font-bold py-3 px-4 rounded-xl border border-[#D5E5D7] transition-colors flex items-center justify-center gap-2 text-xs cursor-pointer"
          >
            <Printer className="w-4 h-4 text-[#527059]" />
            <span>طباعة الفاتورة</span>
          </button>
        </div>

      </div>
    </div>
  );
};
