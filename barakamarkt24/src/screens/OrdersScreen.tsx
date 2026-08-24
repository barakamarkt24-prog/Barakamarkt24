import React, { useState, useEffect } from 'react';
import { 
  Package, 
  Clock, 
  CheckCircle2, 
  Truck, 
  XCircle, 
  ChevronDown, 
  ChevronUp, 
  ShoppingBag,
  MapPin,
  Phone,
  User,
  Calendar,
  AlertCircle,
  RotateCcw,
  Sparkles,
  ArrowLeft,
  Receipt,
  FileCheck2,
  Box,
  LogIn
} from 'lucide-react';
import { Order, OrderStatus } from '../types';
import { orderService } from '../services/orderService';
import { useApp } from '../context/AppContext';

export const ORDER_STATUS_CONFIG: Record<OrderStatus, { label: string; bg: string; text: string; border: string; step: number; desc: string }> = {
  received: {
    label: 'تم الاستلام',
    bg: 'bg-amber-50',
    text: 'text-amber-800',
    border: 'border-amber-200',
    step: 1,
    desc: 'تم استلام طلبك وجاري مراجعته وتأكيده من قبل فريق المتجر.'
  },
  pending: {
    label: 'قيد الانتظار',
    bg: 'bg-amber-50',
    text: 'text-amber-800',
    border: 'border-amber-200',
    step: 1,
    desc: 'تم استلام طلبك وجاري مراجعته وتأكيده من قبل فريق المتجر.'
  },
  confirmed: {
    label: 'تم التأكيد',
    bg: 'bg-blue-50',
    text: 'text-blue-800',
    border: 'border-blue-200',
    step: 2,
    desc: 'تم تأكيد الطلب واعتماد الفاتورة بنجاح.'
  },
  preparing: {
    label: 'قيد التحضير',
    bg: 'bg-purple-50',
    text: 'text-purple-800',
    border: 'border-purple-200',
    step: 3,
    desc: 'جاري تغليف وتجهيز منتجات المؤونة بعناية للشحن.'
  },
  ready_for_pickup: {
    label: 'جاهز للاستلام',
    bg: 'bg-indigo-50',
    text: 'text-indigo-800',
    border: 'border-indigo-200',
    step: 3,
    desc: 'الطلب جاهز في الفرع بانتظار استلام السائق.'
  },
  on_the_way: {
    label: 'في الطريق',
    bg: 'bg-cyan-50',
    text: 'text-cyan-800',
    border: 'border-cyan-200',
    step: 4,
    desc: 'الطلب في طريقه إليك مع مندوب التوصيل الآن.'
  },
  out_for_delivery: {
    label: 'في الطريق',
    bg: 'bg-cyan-50',
    text: 'text-cyan-800',
    border: 'border-cyan-200',
    step: 4,
    desc: 'الطلب في طريقه إليك مع مندوب التوصيل الآن.'
  },
  delivered: {
    label: 'تم التسليم',
    bg: 'bg-emerald-50',
    text: 'text-emerald-800',
    border: 'border-emerald-200',
    step: 5,
    desc: 'تم تسليم الطلب بنجاح. صحة وهنا!'
  },
  delivery_failed: {
    label: 'تعذر التسليم',
    bg: 'bg-red-50',
    text: 'text-red-800',
    border: 'border-red-200',
    step: 0,
    desc: 'تعذر تسليم الطلب للعميل، يرجى التواصل مع خدمة العملاء.'
  },
  cancelled: {
    label: 'ملغي',
    bg: 'bg-rose-50',
    text: 'text-rose-800',
    border: 'border-rose-200',
    step: 0,
    desc: 'تم إلغاء هذا الطلب.'
  }
};

export const OrdersScreen: React.FC = () => {
  const { navigateTo, currentUser, currencySymbol, reorderOrder } = useApp();
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'delivered' | 'cancelled'>('all');

  const fetchOrders = async () => {
    setIsLoading(true);
    try {
      if (currentUser?.role === 'admin') {
        const data = await orderService.getOrders('all');
        setOrders(data);
      } else if (currentUser?.id) {
        const data = await orderService.getOrders(currentUser.id);
        setOrders(data);
      } else {
        setOrders([]);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    setIsLoading(true);
    let unsubscribe = () => {};

    if (currentUser?.role === 'admin') {
      unsubscribe = orderService.subscribeToOrders((data) => {
        setOrders(data);
        setIsLoading(false);
      }, 'all');
    } else if (currentUser?.id) {
      unsubscribe = orderService.subscribeToOrders((data) => {
        setOrders(data);
        setIsLoading(false);
      }, currentUser.id);
    } else {
      setOrders([]);
      setIsLoading(false);
    }

    return () => {
      unsubscribe();
    };
  }, [currentUser]);

  const getStatusBadge = (status: OrderStatus) => {
    const config = ORDER_STATUS_CONFIG[status] || ORDER_STATUS_CONFIG.received;
    return (
      <span className={`${config.bg} ${config.text} ${config.border} text-[11px] font-bold px-2.5 py-0.5 rounded-full border inline-flex items-center gap-1`}>
        <span className="w-1.5 h-1.5 rounded-full bg-current"></span>
        <span>{config.label}</span>
      </span>
    );
  };

  const filteredOrders = orders.filter(o => {
    if (filterStatus === 'active') return ['received', 'pending', 'confirmed', 'preparing', 'on_the_way', 'out_for_delivery'].includes(o.status);
    if (filterStatus === 'delivered') return o.status === 'delivered';
    if (filterStatus === 'cancelled') return o.status === 'cancelled';
    return true;
  });

  const TRACKING_STEPS: { id: string; stepNumber: number; label: string }[] = [
    { id: 'received', stepNumber: 1, label: 'مستلم' },
    { id: 'confirmed', stepNumber: 2, label: 'تأكيد' },
    { id: 'preparing', stepNumber: 3, label: 'تحضير' },
    { id: 'on_the_way', stepNumber: 4, label: 'في الطريق' },
    { id: 'delivered', stepNumber: 5, label: 'تم التسليم' }
  ];

  if (!currentUser) {
    return (
      <div className="p-6 space-y-6 max-w-md mx-auto text-center my-8" dir="rtl">
        <div className="w-20 h-20 bg-stone-100 text-stone-400 rounded-3xl flex items-center justify-center mx-auto border border-stone-200 shadow-2xs">
          <Package className="w-10 h-10 text-emerald-800" />
        </div>

        <div className="space-y-1.5">
          <h2 className="text-lg font-black text-stone-900">سجل طلباتك في بركة ماركت</h2>
          <p className="text-xs text-stone-500 leading-relaxed max-w-xs mx-auto">
            سجّل الدخول لتتمكن من متابعة وتتبع طلباتك، معرفة مراحل التوصيل، وإعادة طلب مشترياتك السابقة بضغطة زر.
          </p>
        </div>

        <button
          onClick={() => navigateTo('auth')}
          className="w-full bg-emerald-800 hover:bg-emerald-900 text-white font-bold py-3.5 px-4 rounded-2xl text-xs sm:text-sm flex items-center justify-center gap-2 cursor-pointer shadow-md active:scale-98 transition-all"
        >
          <LogIn className="w-4 h-4 text-amber-300" />
          <span>تسجيل الدخول / إنشاء حساب</span>
        </button>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4 pb-24 max-w-3xl mx-auto" dir="rtl">
      
      {/* Header Info */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-black text-lg text-stone-900 flex items-center gap-2">
            <Package className="w-5 h-5 text-emerald-800" />
            <span>سجل طلباتي</span>
          </h1>
          <p className="text-xs text-stone-500 font-medium">متابعة وتتبع طلبيات المؤونة وحالتها من المخزن</p>
        </div>

        <button
          onClick={fetchOrders}
          className="text-xs text-stone-600 hover:text-stone-900 bg-stone-100 hover:bg-stone-200 p-2 rounded-xl border border-stone-200 flex items-center gap-1 cursor-pointer transition-colors"
          title="تحديث قائمة الطلبات"
        >
          <RotateCcw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          <span className="hidden sm:inline">تحديث</span>
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex bg-stone-100 p-1 rounded-2xl border border-stone-200/80 text-xs font-bold">
        <button
          onClick={() => setFilterStatus('all')}
          className={`flex-1 py-2 rounded-xl transition-all cursor-pointer ${
            filterStatus === 'all' ? 'bg-white text-stone-900 shadow-xs' : 'text-stone-500 hover:text-stone-800'
          }`}
        >
          الكل ({orders.length})
        </button>
        <button
          onClick={() => setFilterStatus('active')}
          className={`flex-1 py-2 rounded-xl transition-all cursor-pointer ${
            filterStatus === 'active' ? 'bg-white text-stone-900 shadow-xs' : 'text-stone-500 hover:text-stone-800'
          }`}
        >
          النشطة ({orders.filter(o => ['pending', 'confirmed', 'preparing', 'out_for_delivery'].includes(o.status)).length})
        </button>
        <button
          onClick={() => setFilterStatus('delivered')}
          className={`flex-1 py-2 rounded-xl transition-all cursor-pointer ${
            filterStatus === 'delivered' ? 'bg-white text-stone-900 shadow-xs' : 'text-stone-500 hover:text-stone-800'
          }`}
        >
          المكتملة ({orders.filter(o => o.status === 'delivered').length})
        </button>
        <button
          onClick={() => setFilterStatus('cancelled')}
          className={`flex-1 py-2 rounded-xl transition-all cursor-pointer ${
            filterStatus === 'cancelled' ? 'bg-white text-stone-900 shadow-xs' : 'text-stone-500 hover:text-stone-800'
          }`}
        >
          الملغية ({orders.filter(o => o.status === 'cancelled').length})
        </button>
      </div>

      {/* Loading Skeleton */}
      {isLoading && (
        <div className="space-y-3">
          {[1, 2].map((i) => (
            <div key={i} className="bg-white p-4 rounded-3xl border border-stone-200 animate-pulse space-y-3">
              <div className="flex justify-between">
                <div className="w-28 h-4 bg-stone-200 rounded"></div>
                <div className="w-16 h-4 bg-stone-200 rounded"></div>
              </div>
              <div className="w-48 h-3 bg-stone-100 rounded"></div>
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!isLoading && filteredOrders.length === 0 && (
        <div className="py-16 text-center space-y-3 bg-white rounded-3xl p-6 border border-stone-200/80 shadow-2xs my-4">
          <div className="w-16 h-16 rounded-3xl bg-stone-100 text-stone-400 flex items-center justify-center mx-auto border border-stone-200">
            <ShoppingBag className="w-8 h-8" />
          </div>
          <div className="space-y-1">
            <h3 className="font-black text-sm text-stone-900">لا توجد طلبات في هذا القسم</h3>
            <p className="text-xs text-stone-500 max-w-xs mx-auto leading-relaxed">
              عندما تقوم بتأكيد وشراء سلتك من المتجر، ستظهر جميع تفاصيل الطلبات وحالات التوصيل هنا فوراً.
            </p>
          </div>
          <button
            onClick={() => navigateTo('products')}
            className="bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-bold px-5 py-3 rounded-2xl shadow-md cursor-pointer transition-all active:scale-95 inline-flex items-center gap-1.5"
          >
            <span>تصفح المنتجات واطلب الآن</span>
          </button>
        </div>
      )}

      {/* Orders List */}
      {!isLoading && filteredOrders.length > 0 && (
        <div className="space-y-3.5">
          {filteredOrders.map((order) => {
            const isExpanded = expandedOrderId === order.id;
            const currentConfig = ORDER_STATUS_CONFIG[order.status] || ORDER_STATUS_CONFIG.pending;
            const totalItemsCount = order.items.reduce((sum, item) => sum + item.quantity, 0);

            return (
              <div 
                key={order.id}
                className="bg-white rounded-3xl border border-stone-200/80 shadow-2xs overflow-hidden transition-all hover:border-stone-300"
              >
                {/* Order Summary Card Header */}
                <div 
                  onClick={() => setExpandedOrderId(isExpanded ? null : order.id)}
                  className="p-4 flex items-center justify-between cursor-pointer hover:bg-stone-50/60 select-none transition-colors"
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-black text-xs text-stone-900 font-mono bg-stone-100 px-2 py-0.5 rounded-lg border border-stone-200">
                        #{order.orderId || order.id}
                      </span>
                      {getStatusBadge(order.status)}
                    </div>
                    
                    <div className="flex items-center gap-2 text-[11px] text-stone-500">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-stone-400" />
                        <span>{order.createdAt}</span>
                      </span>
                      <span>•</span>
                      <span className="font-medium">{totalItemsCount} أصناف</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5 text-left">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        reorderOrder(order);
                      }}
                      className="bg-stone-100 hover:bg-emerald-50 hover:text-emerald-800 text-stone-700 text-xs font-bold px-3 py-1.5 rounded-xl border border-stone-200 hover:border-emerald-300 flex items-center gap-1.5 cursor-pointer active:scale-95 transition-all shadow-2xs"
                      title="إعادة طلب هذه الأصناف"
                    >
                      <RotateCcw className="w-3.5 h-3.5 text-emerald-700" />
                      <span className="hidden sm:inline">إعادة الطلب</span>
                    </button>

                    <div className="text-left">
                      <span className="font-black text-sm text-emerald-800 font-sans block">
                        {currencySymbol || '€'}{order.total.toFixed(2)}
                      </span>
                      <span className="text-[10px] text-stone-400 font-medium">المجموع النهائي</span>
                    </div>
                    <div className="w-8 h-8 rounded-xl bg-stone-100 flex items-center justify-center text-stone-500">
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </div>
                  </div>
                </div>

                {/* Progress Stepper Bar */}
                {order.status !== 'cancelled' ? (
                  <div className="px-4 py-2.5 bg-stone-50/80 border-t border-stone-100 text-[10px]">
                    <div className="grid grid-cols-5 gap-1 text-center font-bold">
                      {TRACKING_STEPS.map((step) => {
                        const isReached = currentConfig.step >= step.stepNumber;
                        const isCurrent = currentConfig.step === step.stepNumber;

                        return (
                          <div key={step.id} className="flex flex-col items-center gap-1">
                            <div 
                              className={`w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-mono transition-all ${
                                isCurrent 
                                  ? 'bg-emerald-800 text-white ring-2 ring-emerald-500/30 font-bold'
                                  : isReached 
                                    ? 'bg-emerald-600 text-white' 
                                    : 'bg-stone-200 text-stone-500'
                              }`}
                            >
                              {isReached ? '✓' : step.stepNumber}
                            </div>
                            <span className={`text-[9px] leading-tight ${isCurrent ? 'text-emerald-900 font-black' : isReached ? 'text-stone-800' : 'text-stone-400'}`}>
                              {step.label}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  <div className="px-4 py-2 bg-rose-50/80 border-t border-rose-100 text-[11px] text-rose-800 font-semibold flex items-center gap-1.5">
                    <XCircle className="w-3.5 h-3.5 text-rose-600" />
                    <span>تم إلغاء هذا الطلب.</span>
                  </div>
                )}

                {/* Expanded Details Section */}
                {isExpanded && (
                  <div className="p-4 pt-3 border-t border-stone-100 bg-stone-50/40 space-y-3.5 text-xs animate-in fade-in duration-150">
                    
                    {/* Status Note Description */}
                    <div className="bg-white p-3 rounded-2xl border border-stone-200/80 text-[11px] text-stone-700 flex items-start gap-2">
                      <Sparkles className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-bold text-stone-900 block">حالة الشحنة الحالية:</span>
                        <p className="text-stone-600">{currentConfig.desc}</p>
                      </div>
                    </div>

                    {/* Timeline History if available */}
                    {order.timeline && order.timeline.length > 0 && (
                      <div className="bg-white p-3.5 rounded-2xl border border-stone-200/80 space-y-2">
                        <span className="font-bold text-xs text-stone-900 flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-emerald-800" />
                          <span>سجل وتاريخ تحديثات الطلب (Timeline):</span>
                        </span>
                        <div className="space-y-2 pt-1 border-r-2 border-emerald-700/30 pr-3 mr-1">
                          {order.timeline.map((t, tIdx) => (
                            <div key={tIdx} className="relative text-[11px] space-y-0.5">
                              <span className="w-2 h-2 rounded-full bg-emerald-800 absolute -right-[17px] top-1"></span>
                              <div className="flex items-center justify-between gap-2 flex-wrap">
                                <span className="font-bold text-stone-900">{t.labelAr || t.status}</span>
                                <span className="text-[10px] text-stone-400 font-sans">{t.timestamp}</span>
                              </div>
                              {t.note && (
                                <p className="text-stone-500 text-[10px]">{t.note}</p>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Ordered Items List */}
                    <div className="space-y-2">
                      <span className="font-black text-xs text-stone-800 block">قائمة المنتجات والكميات ({totalItemsCount}):</span>
                      <div className="space-y-1.5">
                        {order.items.map((item, idx) => (
                          <div 
                            key={idx} 
                            className="flex justify-between items-center bg-white p-2.5 rounded-2xl border border-stone-100 text-xs gap-2"
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <img 
                                src={item.product.image || 'https://images.unsplash.com/photo-1552767059-ce182ead6c1b?auto=format&fit=crop&w=150&q=80'} 
                                alt={item.product.nameAr}
                                className="w-10 h-10 rounded-xl object-cover border border-stone-100 shrink-0" 
                              />
                              <div className="min-w-0">
                                <span className="font-bold text-stone-900 block line-clamp-1">
                                  {item.product.nameAr || item.product.name}
                                </span>
                                <span className="text-[10px] text-stone-500">
                                  {item.quantity} × {currencySymbol || '€'}{item.product.price.toFixed(2)} {item.product.unit ? `(${item.product.unit})` : ''}
                                </span>
                              </div>
                            </div>

                            <span className="font-bold text-emerald-800 font-sans shrink-0">
                              {currencySymbol || '€'}{(item.product.price * item.quantity).toFixed(2)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Delivery & Customer Info */}
                    <div className="bg-white p-3.5 rounded-2xl border border-stone-200/80 space-y-2 text-[11px] text-stone-600">
                      <div className="flex items-center justify-between border-b border-stone-100 pb-1.5">
                        <span className="font-bold text-stone-900 flex items-center gap-1">
                          <User className="w-3.5 h-3.5 text-stone-400" />
                          <span>المستلم:</span>
                        </span>
                        <span className="font-bold text-stone-800">{order.customerName || 'عميل المتجر'}</span>
                      </div>

                      <div className="flex items-center justify-between border-b border-stone-100 pb-1.5">
                        <span className="font-bold text-stone-900 flex items-center gap-1">
                          <Phone className="w-3.5 h-3.5 text-stone-400" />
                          <span>رقم الهاتف:</span>
                        </span>
                        <span className="font-sans font-bold text-stone-800 text-right">{order.phone}</span>
                      </div>

                      <div className="flex items-start justify-between border-b border-stone-100 pb-1.5">
                        <span className="font-bold text-stone-900 flex items-center gap-1 shrink-0">
                          <MapPin className="w-3.5 h-3.5 text-emerald-700 mt-0.5" />
                          <span>عنوان التوصيل:</span>
                        </span>
                        <span className="text-stone-800 text-left font-medium">
                          {order.address} {order.plz ? `(${order.plz} ${order.city || 'Greifswald'})` : order.city ? `(${order.city})` : ''}
                        </span>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="font-bold text-stone-900 flex items-center gap-1">
                          <Receipt className="w-3.5 h-3.5 text-stone-400" />
                          <span>طريقة الدفع:</span>
                        </span>
                        <span className="font-bold text-stone-800 bg-stone-100 px-2 py-0.5 rounded-md border border-stone-200 text-[10px]">
                          {order.paymentMethod === 'bank_transfer'
                            ? 'تحويل بنكي (Bank Transfer)'
                            : order.paymentMethod === 'card'
                            ? 'بطاقة بنكية (Card)'
                            : 'الدفع نقداً عند الاستلام (COD)'}
                        </span>
                      </div>

                      {order.notes && (
                        <div className="pt-1.5 border-t border-stone-100 text-[10px] text-stone-500">
                          <span className="font-bold text-stone-700">ملاحظات: </span>
                          <span>{order.notes}</span>
                        </div>
                      )}
                    </div>

                    {/* Cost Summary Breakdown */}
                    <div className="bg-white p-3.5 rounded-2xl border border-stone-200/80 text-xs space-y-1.5">
                      <div className="flex justify-between text-stone-600">
                        <span>المجموع الفرعي:</span>
                        <span className="font-sans font-bold text-stone-900">{currencySymbol || '€'}{order.subtotal.toFixed(2)}</span>
                      </div>
                      
                      <div className="flex justify-between text-stone-600">
                        <span>رسوم الشحن والتوصيل:</span>
                        <span className="font-sans font-bold">
                          {order.deliveryFee === 0 ? (
                            <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md font-bold text-[10px]">مجاني</span>
                          ) : (
                            `${currencySymbol || '€'}${order.deliveryFee?.toFixed(2)}`
                          )}
                        </span>
                      </div>

                      <div className="pt-2 border-t border-stone-100 flex justify-between font-black text-stone-900 text-sm">
                        <span>المجموع الكلي:</span>
                        <span className="font-sans text-emerald-800 text-base">{currencySymbol || '€'}{order.total.toFixed(2)}</span>
                      </div>
                    </div>

                    {/* Reorder Action Button */}
                    <button
                      onClick={() => reorderOrder(order)}
                      className="w-full bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-bold py-3 rounded-2xl flex items-center justify-center gap-2 cursor-pointer shadow-md active:scale-98 transition-all"
                    >
                      <RotateCcw className="w-4 h-4 text-amber-300" />
                      <span>إعادة طلب محتويات هذه الفاتورة للسلة (بالأسعار الحالية)</span>
                    </button>

                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

    </div>
  );
};
