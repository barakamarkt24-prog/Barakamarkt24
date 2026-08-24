import React, { useState } from 'react';
import { X, Search, Package, Truck, CheckCircle2, Clock, Snowflake, MapPin, Zap } from 'lucide-react';
import { Currency, Language, Order } from '../types';
import { formatPrice } from '../utils/helpers';

interface TrackOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  orders: Order[];
  currency: Currency;
  language: Language;
}

export const TrackOrderModal: React.FC<TrackOrderModalProps> = ({
  isOpen,
  onClose,
  orders,
  currency,
  language
}) => {
  if (!isOpen) return null;

  const [searchCode, setSearchCode] = useState('');
  const [searchedOrder, setSearchedOrder] = useState<Order | null>(orders[0] || null);
  const [error, setError] = useState('');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchCode.trim()) return;

    const found = orders.find(
      o => o.id.toLowerCase().includes(searchCode.toLowerCase().trim()) ||
           o.customerInfo.phone.includes(searchCode.trim())
    );

    if (found) {
      setSearchedOrder(found);
      setError('');
    } else {
      setError('لم يتم العثور على طلب بهذا الرقم. تأكد من رقم الطلب (مثال: BM24-123456) أو رقم الهاتف في غرايفسفالد.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div 
        className="bg-[#FDFBF7] rounded-3xl max-w-xl w-full shadow-2xl border border-[#D5E5D7] p-5 sm:p-7 space-y-5 animate-in fade-in zoom-in-95 duration-200 relative text-[#1B3022]"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#EDF4EE] pb-3">
          <div className="flex items-center gap-2">
            <Package className="w-5 h-5 text-[#3D6E4B]" />
            <div>
              <h3 className="font-black text-lg text-[#1B3022]">تتبع حالة طلبيتك بغرايفسفالد</h3>
              <span className="text-[11px] text-[#527059] block">توصيل سريع خلال ساعتين داخل المدينة ⚡</span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-[#527059] hover:text-[#1B3022] hover:bg-[#EBF3EC] rounded-lg cursor-pointer transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search Input */}
        <form onSubmit={handleSearch} className="flex gap-2">
          <div className="relative flex-1">
            <input
              type="text"
              placeholder="أدخل رقم الطلب (#BM24-XXXXXX) أو رقم هاتفك"
              value={searchCode}
              onChange={(e) => setSearchCode(e.target.value)}
              className="w-full bg-[#F9FAF9] border border-[#D5E5D7] text-xs px-3.5 py-2.5 rounded-xl focus:border-[#3D6E4B] focus:outline-hidden text-[#1B3022]"
            />
            <Search className="w-4 h-4 text-[#527059] absolute left-3 top-1/2 -translate-y-1/2" />
          </div>
          <button
            type="submit"
            className="bg-[#3D6E4B] hover:bg-[#315A3D] text-white font-bold text-xs px-4 py-2.5 rounded-xl transition-colors cursor-pointer shadow-md"
          >
            بحث
          </button>
        </form>

        {error && <p className="text-rose-600 text-xs font-semibold">{error}</p>}

        {/* Order Details Preview */}
        {searchedOrder ? (
          <div className="space-y-4 pt-2">
            <div className="bg-[#EBF3EC] border border-[#D5E5D7] rounded-2xl p-4 space-y-3">
              <div className="flex items-center justify-between text-xs">
                <div>
                  <span className="font-bold text-[#1B3022] text-sm block">{searchedOrder.id}</span>
                  <span className="text-[#527059] text-[11px]">{searchedOrder.createdAt}</span>
                </div>
                <span className="bg-[#3D6E4B] text-white text-[11px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1">
                  <Zap className="w-3 h-3 text-amber-300" />
                  <span>توصيل خلال ساعتين 🚚</span>
                </span>
              </div>

              {/* Progress Timeline */}
              <div className="pt-2">
                <div className="grid grid-cols-4 gap-1 text-center text-[10px]">
                  <div className="space-y-1">
                    <div className="w-6 h-6 rounded-full bg-[#3D6E4B] text-white flex items-center justify-center mx-auto text-xs font-bold">✓</div>
                    <span className="font-bold text-[#3D6E4B]">مؤكد</span>
                  </div>
                  <div className="space-y-1">
                    <div className="w-6 h-6 rounded-full bg-[#3D6E4B] text-white flex items-center justify-center mx-auto text-xs font-bold">✓</div>
                    <span className="font-bold text-[#3D6E4B]">التجهيز</span>
                  </div>
                  <div className="space-y-1">
                    <div className="w-6 h-6 rounded-full bg-[#3D6E4B] text-white flex items-center justify-center mx-auto text-xs font-bold animate-pulse">🚚</div>
                    <span className="font-bold text-[#245233]">مع المندوب</span>
                  </div>
                  <div className="space-y-1">
                    <div className="w-6 h-6 rounded-full bg-[#D5E5D7] text-[#527059] flex items-center justify-center mx-auto text-xs font-bold">4</div>
                    <span className="text-[#527059]">التسليم</span>
                  </div>
                </div>
              </div>

              <div className="pt-2 border-t border-[#D5E5D7] text-xs text-[#1B3022] flex justify-between">
                <span>المستلم: {searchedOrder.customerInfo.fullName} • {searchedOrder.customerInfo.city}</span>
                <span className="font-bold text-[#3D6E4B] font-sans">{formatPrice(searchedOrder.total, currency)}</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-6 text-[#527059] text-xs">
            أدخل رقم طلبك للاطلاع على حالة التوصيل السريع داخل غرايفسفالد.
          </div>
        )}

      </div>
    </div>
  );
};
