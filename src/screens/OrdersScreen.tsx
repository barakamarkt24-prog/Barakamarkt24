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
  Receipt,
  CreditCard,
  Banknote,
  Building2,
  LogIn,
  Check,
  History,
  Activity,
  ArrowRight
} from 'lucide-react';
import { Order, OrderStatus } from '../types';
import { orderService } from '../services/orderService';
import { useApp } from '../context/AppContext';
import { auth } from '../services/firebaseConfig';

export const ORDER_STATUS_CONFIG: Record<OrderStatus, { 
  label: string; 
  bg: string; 
  text: string; 
  border: string; 
  badgeBg: string;
  step: number; 
  desc: string 
}> = {
  received: {
    label: 'تم استلام الطلب',
    bg: 'bg-amber-50',
    text: 'text-amber-800',
    border: 'border-amber-200',
    badgeBg: 'bg-amber-500',
    step: 1,
    desc: 'تم استلام طلبك بنجاح وهو الآن بانتظار المراجعة والتأكيد من فريق المتجر.'
  },
  pending: {
    label: 'قيد المراجعة والتأكيد',
    bg: 'bg-amber-50',
    text: 'text-amber-800',
    border: 'border-amber-200',
    badgeBg: 'bg-amber-500',
    step: 1,
    desc: 'تم استلام طلبك وجاري مراجعته وتأكيده مع الفرع المختص.'
  },
  confirmed: {
    label: 'تم تأكيد الطلب',
    bg: 'bg-blue-50',
    text: 'text-blue-800',
    border: 'border-blue-200',
    badgeBg: 'bg-blue-500',
    step: 2,
    desc: 'تم تأكيد طلبك واعتماد الفاتورة وبدء توجيهها لقسم التجهيز.'
  },
  preparing: {
    label: 'قيد التجهيز والتغليف',
    bg: 'bg-purple-50',
    text: 'text-purple-800',
    border: 'border-purple-200',
    badgeBg: 'bg-purple-500',
    step: 3,
    desc: 'جاري اختيار وتغليف منتجات المؤونة بعناية للشحن والتسليم.'
  },
  ready_for_pickup: {
    label: 'جاهز للتسليم للسائق',
    bg: 'bg-indigo-50',
    text: 'text-indigo-800',
    border: 'border-indigo-200',
    badgeBg: 'bg-indigo-500',
    step: 3,
    desc: 'الطلب جاهز في المستودع بانتظار استلام السائق لبدء خط التوصيل.'
  },
  on_the_way: {
    label: 'في الطريق إليك',
    bg: 'bg-cyan-50',
    text: 'text-cyan-800',
    border: 'border-cyan-200',
    badgeBg: 'bg-cyan-500',
    step: 4,
    desc: 'الطلب مع مندوب التوصيل الآن وفي طريقه إلى عنوانك المحدد.'
  },
  out_for_delivery: {
    label: 'خرج للتوصيل الآن',
    bg: 'bg-cyan-50',
    text: 'text-cyan-800',
    border: 'border-cyan-200',
    badgeBg: 'bg-cyan-500',
    step: 4,
    desc: 'مندوب التوصيل في الحي وقريب من موقعك لتسليم الطلبية.'
  },
  delivered: {
    label: 'تم التسليم بنجاح',
    bg: 'bg-emerald-50',
    text: 'text-emerald-800',
    border: 'border-emerald-200',
    badgeBg: 'bg-emerald-600',
    step: 5,
    desc: 'تم تسليم الطلب بنجاح. شكراً لتسوقك من بركة ماركت 24!'
  },
  delivery_failed: {
    label: 'تعذر التسليم',
    bg: 'bg-rose-50',
    text: 'text-rose-800',
    border: 'border-rose-200',
    badgeBg: 'bg-rose-500',
    step: 0,
    desc: 'تعذر تسليم الطلب. يرجى مراجعة تفاصيل العنوان أو التواصل مع الدعم.'
  },
  cancelled: {
    label: 'تم إلغاء الطلب',
    bg: 'bg-stone-100',
    text: 'text-stone-700',
    border: 'border-stone-200',
    badgeBg: 'bg-stone-400',
    step: 0,
    desc: 'تم إلغاء هذا الطلب.'
  }
};

const ACTIVE_STATUSES: OrderStatus[] = [
  'received', 
  'pending', 
  'confirmed', 
  'preparing', 
  'ready_for_pickup', 
  'on_the_way', 
  'out_for_delivery'
];

const TRACKING_STEPS = [
  { id: 'received', stepNumber: 1, label: 'استلام الطلب' },
  { id: 'confirmed', stepNumber: 2, label: 'التأكيد' },
  { id: 'preparing', stepNumber: 3, label: 'التجهيز' },
  { id: 'on_the_way', stepNumber: 4, label: 'في الطريق' },
  { id: 'delivered', stepNumber: 5, label: 'تم التسليم' }
];

export const OrdersScreen: React.FC = () => {
  const { navigateTo, currentUser, isAuthReady, isLoadingAuth, currencySymbol, reorderOrder } = useApp();
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);
  const [isPastOrdersOpen, setIsPastOrdersOpen] = useState<boolean>(true);
  const [expandedItemsOrderIds, setExpandedItemsOrderIds] = useState<Set<string>>(new Set());

  const effectiveUserId = auth.currentUser?.uid || currentUser?.id;

  const fetchOrders = async () => {
    setIsLoading(true);
    setLoadError(null);
    try {
      if (currentUser?.role === 'admin') {
        const data = await orderService.getOrders('all');
        setOrders(data);
      } else if (effectiveUserId) {
        const data = await orderService.getOrders(effectiveUserId);
        setOrders(data);
      } else {
        setOrders([]);
      }
    } catch (e: any) {
      console.error('[OrdersScreen] Error fetching orders:', e);
      setLoadError(e?.message || 'تعذر جلب الطلبات من الخادم');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // If auth state is still initializing from Firebase, wait before querying
    if (!isAuthReady || isLoadingAuth) {
      setIsLoading(true);
      return;
    }

    setIsLoading(true);
    setLoadError(null);
    let unsubscribe = () => {};

    if (currentUser?.role === 'admin') {
      unsubscribe = orderService.subscribeToOrders(
        (data) => {
          setOrders(data);
          setIsLoading(false);
          setLoadError(null);
        },
        'all',
        (err) => {
          console.error('[OrdersScreen] Admin real-time orders subscription error:', err);
          setLoadError('تعذر المزامنة الحية للطلبات، يرجى التحديث يدوياً.');
          setIsLoading(false);
        }
      );
    } else if (effectiveUserId) {
      unsubscribe = orderService.subscribeToOrders(
        (data) => {
          setOrders(data);
          setIsLoading(false);
          setLoadError(null);
        },
        effectiveUserId,
        (err) => {
          console.error('[OrdersScreen] Customer real-time orders subscription error:', err);
          setLoadError('تعذر الاتصال بقاعدة بيانات الطلبات، يرجى التحقق من اتصالك والمحاولة ثانية.');
          setIsLoading(false);
        }
      );
    } else {
      setOrders([]);
      setIsLoading(false);
    }

    return () => {
      unsubscribe();
    };
  }, [currentUser, effectiveUserId, isAuthReady, isLoadingAuth]);

  // Helper for toggling items list expansion
  const toggleItemsExpand = (orderId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedItemsOrderIds(prev => {
      const next = new Set(prev);
      if (next.has(orderId)) {
        next.delete(orderId);
      } else {
        next.add(orderId);
      }
      return next;
    });
  };

  // Status Badge Component
  const renderStatusBadge = (status: OrderStatus) => {
    const config = ORDER_STATUS_CONFIG[status] || ORDER_STATUS_CONFIG.received;
    return (
      <span className={`${config.bg} ${config.text} ${config.border} text-[11px] font-bold px-2.5 py-1 rounded-full border inline-flex items-center gap-1.5 shadow-2xs`}>
        <span className={`w-1.5 h-1.5 rounded-full ${config.badgeBg}`}></span>
        <span>{config.label}</span>
      </span>
    );
  };

  // Payment Method & Status Formatter
  const getPaymentDetails = (method?: string, status?: string) => {
    let methodText = 'الدفع عند الاستلام';
    let icon = <Banknote className="w-3.5 h-3.5 text-stone-500" />;

    if (method === 'bank_transfer') {
      methodText = 'تحويل بنكي';
      icon = <Building2 className="w-3.5 h-3.5 text-blue-600" />;
    } else if (method === 'card') {
      methodText = 'بطاقة بنكية';
      icon = <CreditCard className="w-3.5 h-3.5 text-purple-600" />;
    }

    let statusBadge = (
      <span className="text-[10px] font-semibold text-stone-600 bg-stone-100 px-2 py-0.5 rounded-md border border-stone-200">
        قيد الدفع
      </span>
    );

    if (status === 'paid') {
      statusBadge = (
        <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
          مدفوع ✓
        </span>
      );
    } else if (status === 'awaiting_transfer') {
      statusBadge = (
        <span className="text-[10px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200">
          بانتظار التحويل
        </span>
      );
    }

    return { methodText, icon, statusBadge };
  };

  // Separate Orders logically
  const activeOrders = orders.filter(o => ACTIVE_STATUSES.includes(o.status));
  const pastOrders = orders.filter(o => !ACTIVE_STATUSES.includes(o.status));

  // Determine if active orders contain today's orders
  const isOrderFromToday = (order: Order) => {
    if (!order.timestamp && !order.createdAt) return false;
    const dateStr = order.timestamp || order.createdAt;
    const orderDate = new Date(dateStr);
    const today = new Date();
    return (
      orderDate.getDate() === today.getDate() &&
      orderDate.getMonth() === today.getMonth() &&
      orderDate.getFullYear() === today.getFullYear()
    );
  };

  const todayActiveOrders = activeOrders.filter(isOrderFromToday);
  const otherActiveOrders = activeOrders.filter(o => !isOrderFromToday(o));

  // Format order date & time clearly
  const formatOrderTime = (order: Order) => {
    if (order.createdAt && !order.createdAt.includes('T')) {
      return order.createdAt;
    }
    if (order.timestamp) {
      try {
        const d = new Date(order.timestamp);
        return d.toLocaleDateString('ar-SY', {
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        });
      } catch {
        return order.createdAt || order.timestamp;
      }
    }
    return order.createdAt || '';
  };

  // While restoring auth session, display the skeleton loader to avoid flashing the login prompt
  if (!isAuthReady || isLoadingAuth) {
    return (
      <div className="p-4 space-y-4 pb-24 max-w-3xl mx-auto" dir="rtl">
        <div className="flex items-center justify-between">
          <div className="h-7 w-36 bg-stone-200 rounded-xl animate-pulse"></div>
          <div className="h-7 w-20 bg-stone-200 rounded-xl animate-pulse"></div>
        </div>
        <div className="space-y-4">
          {[1, 2].map((i) => (
            <div key={i} className="bg-white p-5 rounded-3xl border border-stone-200 animate-pulse space-y-4 shadow-2xs">
              <div className="flex justify-between items-center">
                <div className="w-32 h-5 bg-stone-200 rounded-lg"></div>
                <div className="w-24 h-5 bg-stone-200 rounded-full"></div>
              </div>
              <div className="w-48 h-3.5 bg-stone-100 rounded"></div>
              <div className="h-10 bg-stone-50 rounded-2xl"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // If auth is completely ready and user is not authenticated
  if (!currentUser) {
    return (
      <div className="p-6 space-y-6 max-w-md mx-auto text-center my-10" dir="rtl">
        <div className="w-20 h-20 bg-emerald-50 text-emerald-800 rounded-3xl flex items-center justify-center mx-auto border border-emerald-100 shadow-sm">
          <Package className="w-10 h-10" />
        </div>

        <div className="space-y-2">
          <h2 className="text-xl font-black text-stone-900">سجل طلباتك في بركة ماركت</h2>
          <p className="text-xs text-stone-500 leading-relaxed max-w-xs mx-auto">
            سجّل الدخول لمتابعة طلباتك الحالية لحظياً، معرفة مراحل التوصيل، وإعادة طلب مشترياتك السابقة بضغطة زر.
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

  // Render a Single Order Card
  const renderOrderCard = (order: Order, isPastOrder: boolean = false) => {
    const isExpanded = expandedOrderId === order.id;
    const currentConfig = ORDER_STATUS_CONFIG[order.status] || ORDER_STATUS_CONFIG.received;
    const totalItemsCount = order.items.reduce((sum, item) => sum + item.quantity, 0);
    const paymentInfo = getPaymentDetails(order.paymentMethod, order.paymentStatus);
    const isShowAllItems = expandedItemsOrderIds.has(order.id);
    const displayedItems = isShowAllItems ? order.items : order.items.slice(0, 3);
    const hasMoreItems = order.items.length > 3;

    return (
      <div 
        key={order.id}
        className={`bg-white rounded-3xl border transition-all overflow-hidden ${
          isPastOrder 
            ? 'border-stone-200/80 hover:border-stone-300 shadow-2xs' 
            : 'border-emerald-700/20 ring-1 ring-emerald-700/5 shadow-xs hover:border-emerald-700/30'
        }`}
      >
        {/* Order Main Summary Bar (Clickable) */}
        <div 
          onClick={() => setExpandedOrderId(isExpanded ? null : order.id)}
          className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer hover:bg-stone-50/70 select-none transition-colors"
        >
          {/* Top/Right: ID, Status, and Date */}
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-black text-xs text-stone-900 font-mono bg-stone-100 px-2.5 py-1 rounded-xl border border-stone-200">
                #{order.orderId || order.id}
              </span>
              {renderStatusBadge(order.status)}
              {isOrderFromToday(order) && !isPastOrder && (
                <span className="bg-amber-100 text-amber-900 text-[10px] font-extrabold px-2 py-0.5 rounded-full border border-amber-200">
                  اليوم
                </span>
              )}
            </div>

            <div className="flex items-center gap-2.5 text-[11px] text-stone-500">
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-stone-400" />
                <span>{formatOrderTime(order)}</span>
              </span>
              <span>•</span>
              <span className="font-medium text-stone-700">{totalItemsCount} أصناف</span>
              <span>•</span>
              <span className="flex items-center gap-1">
                {paymentInfo.icon}
                <span>{paymentInfo.methodText}</span>
              </span>
            </div>
          </div>

          {/* Left/Bottom: Price & Actions */}
          <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-stone-100">
            <div className="text-right sm:text-left">
              <div className="flex items-center gap-1.5 sm:justify-end">
                <span className="font-black text-base text-emerald-800 font-sans">
                  {currencySymbol || '€'}{order.total.toFixed(2)}
                </span>
              </div>
              <div className="flex items-center gap-1 text-[10px] text-stone-400">
                <span>الحالة:</span>
                {paymentInfo.statusBadge}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  reorderOrder(order);
                }}
                className="bg-stone-100 hover:bg-emerald-50 hover:text-emerald-800 text-stone-700 text-xs font-bold px-3 py-2 rounded-xl border border-stone-200 hover:border-emerald-300 flex items-center gap-1.5 cursor-pointer active:scale-95 transition-all shadow-2xs"
                title="إعادة طلب هذه الأصناف للسلة"
              >
                <RotateCcw className="w-3.5 h-3.5 text-emerald-700" />
                <span className="text-[11px]">إعادة الطلب</span>
              </button>

              <div className="w-8 h-8 rounded-xl bg-stone-100 flex items-center justify-center text-stone-500 shrink-0">
                {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </div>
            </div>
          </div>
        </div>

        {/* Live Stepper (Visible on active orders or when expanded) */}
        {order.status !== 'cancelled' && order.status !== 'delivery_failed' ? (
          <div className="px-4 py-3 bg-stone-50/90 border-t border-stone-100 text-[10px]">
            <div className="grid grid-cols-5 gap-1 text-center font-bold relative">
              {TRACKING_STEPS.map((step) => {
                const isReached = currentConfig.step >= step.stepNumber;
                const isCurrent = currentConfig.step === step.stepNumber;

                return (
                  <div key={step.id} className="flex flex-col items-center gap-1.5">
                    <div 
                      className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-mono transition-all ${
                        isCurrent 
                          ? 'bg-emerald-800 text-white ring-4 ring-emerald-500/20 font-bold shadow-2xs'
                          : isReached 
                            ? 'bg-emerald-600 text-white' 
                            : 'bg-stone-200 text-stone-400'
                      }`}
                    >
                      {isReached ? <Check className="w-3 h-3 stroke-[3]" /> : step.stepNumber}
                    </div>
                    <span className={`text-[10px] leading-tight ${
                      isCurrent 
                        ? 'text-emerald-900 font-black' 
                        : isReached 
                          ? 'text-stone-800' 
                          : 'text-stone-400'
                    }`}>
                      {step.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="px-4 py-2.5 bg-stone-50 border-t border-stone-100 text-xs text-stone-600 font-semibold flex items-center gap-2">
            <XCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{currentConfig.desc}</span>
          </div>
        )}

        {/* Expanded Details Section */}
        {isExpanded && (
          <div className="p-4 sm:p-5 pt-3 border-t border-stone-100 bg-stone-50/50 space-y-4 text-xs">
            
            {/* Status Description Banner */}
            <div className="bg-white p-3.5 rounded-2xl border border-stone-200/80 text-xs text-stone-700 flex items-start gap-2.5 shadow-2xs">
              <Sparkles className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-stone-900 block mb-0.5">تفاصيل مرحلة الشحنة:</span>
                <p className="text-stone-600 leading-relaxed">{currentConfig.desc}</p>
              </div>
            </div>

            {/* Order Timeline History if recorded */}
            {order.timeline && order.timeline.length > 0 && (
              <div className="bg-white p-4 rounded-2xl border border-stone-200/80 space-y-3 shadow-2xs">
                <span className="font-bold text-xs text-stone-900 flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-emerald-800" />
                  <span>سجل تحديثات الطلب (Timeline):</span>
                </span>
                <div className="space-y-2.5 pt-1 border-r-2 border-emerald-700/30 pr-3.5 mr-1">
                  {order.timeline.map((t, tIdx) => (
                    <div key={tIdx} className="relative text-xs space-y-0.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-800 absolute -right-[19px] top-1"></span>
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <span className="font-bold text-stone-900">{t.labelAr || t.status}</span>
                        <span className="text-[10px] text-stone-400 font-sans">{t.timestamp}</span>
                      </div>
                      {t.note && (
                        <p className="text-stone-500 text-[11px] leading-relaxed">{t.note}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Products List Breakdown */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-black text-xs text-stone-900">
                  المنتجات المشمولة في الطلب ({totalItemsCount} قطعة):
                </span>
                {hasMoreItems && (
                  <button 
                    onClick={(e) => toggleItemsExpand(order.id, e)}
                    className="text-[11px] font-bold text-emerald-800 hover:text-emerald-900 cursor-pointer"
                  >
                    {isShowAllItems ? 'عرض أقل' : `عرض جميع المنتجات (${order.items.length})`}
                  </button>
                )}
              </div>

              <div className="space-y-2">
                {displayedItems.map((item, idx) => (
                  <div 
                    key={idx} 
                    className="flex justify-between items-center bg-white p-3 rounded-2xl border border-stone-200/70 text-xs gap-3 shadow-2xs"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <img 
                        src={item.product.image || 'https://images.unsplash.com/photo-1552767059-ce182ead6c1b?auto=format&fit=crop&w=150&q=80'} 
                        alt={item.product.nameAr}
                        className="w-11 h-11 rounded-xl object-cover border border-stone-100 shrink-0 bg-stone-50" 
                        referrerPolicy="no-referrer"
                      />
                      <div className="min-w-0">
                        <span className="font-bold text-stone-900 block truncate">
                          {item.product.nameAr || item.product.name}
                        </span>
                        <span className="text-[11px] text-stone-500 font-medium">
                          {item.quantity} × {currencySymbol || '€'}{item.product.price.toFixed(2)} {item.product.unit ? `(${item.product.unit})` : ''}
                        </span>
                      </div>
                    </div>

                    <span className="font-black text-emerald-800 font-sans shrink-0 text-xs sm:text-sm">
                      {currencySymbol || '€'}{(item.product.price * item.quantity).toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Delivery & Customer Info Card */}
            <div className="bg-white p-4 rounded-2xl border border-stone-200/80 space-y-2.5 text-xs text-stone-600 shadow-2xs">
              <div className="flex items-center justify-between border-b border-stone-100 pb-2">
                <span className="font-bold text-stone-900 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-stone-400" />
                  <span>اسم المستلم:</span>
                </span>
                <span className="font-bold text-stone-800">{order.customerName || 'عميل المتجر'}</span>
              </div>

              <div className="flex items-center justify-between border-b border-stone-100 pb-2">
                <span className="font-bold text-stone-900 flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-stone-400" />
                  <span>رقم الهاتف للتواصل:</span>
                </span>
                <span className="font-sans font-bold text-stone-800 text-left">{order.phone}</span>
              </div>

              <div className="flex items-start justify-between border-b border-stone-100 pb-2">
                <span className="font-bold text-stone-900 flex items-center gap-1.5 shrink-0">
                  <MapPin className="w-3.5 h-3.5 text-emerald-700 mt-0.5" />
                  <span>عنوان التوصيل:</span>
                </span>
                <span className="text-stone-800 text-left font-medium max-w-[65%]">
                  {order.address} {order.plz ? `(${order.plz} ${order.city || 'Greifswald'})` : order.city ? `(${order.city})` : ''}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="font-bold text-stone-900 flex items-center gap-1.5">
                  <Receipt className="w-3.5 h-3.5 text-stone-400" />
                  <span>طريقة وحالة الدفع:</span>
                </span>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-stone-800 bg-stone-100 px-2.5 py-1 rounded-lg border border-stone-200 text-[11px]">
                    {paymentInfo.methodText}
                  </span>
                  {paymentInfo.statusBadge}
                </div>
              </div>

              {order.notes && (
                <div className="pt-2 border-t border-stone-100 text-[11px] text-stone-500">
                  <span className="font-bold text-stone-700">ملاحظات التوصيل: </span>
                  <span>{order.notes}</span>
                </div>
              )}
            </div>

            {/* Financial Summary */}
            <div className="bg-white p-4 rounded-2xl border border-stone-200/80 text-xs space-y-2 shadow-2xs">
              <div className="flex justify-between text-stone-600">
                <span>المجموع الفرعي للمنتجات:</span>
                <span className="font-sans font-bold text-stone-900">{currencySymbol || '€'}{order.subtotal.toFixed(2)}</span>
              </div>
              
              <div className="flex justify-between text-stone-600">
                <span>رسوم التوصيل:</span>
                <span className="font-sans font-bold">
                  {order.deliveryFee === 0 ? (
                    <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md font-bold text-[10px]">مجاني</span>
                  ) : (
                    `${currencySymbol || '€'}${order.deliveryFee?.toFixed(2)}`
                  )}
                </span>
              </div>

              {order.discount && order.discount > 0 ? (
                <div className="flex justify-between text-emerald-700 font-bold">
                  <span>الخصم المطبق:</span>
                  <span className="font-sans">-{currencySymbol || '€'}{order.discount.toFixed(2)}</span>
                </div>
              ) : null}

              <div className="pt-2.5 border-t border-stone-100 flex justify-between font-black text-stone-900 text-sm">
                <span>المبلغ الإجمالي النهائي:</span>
                <span className="font-sans text-emerald-800 text-base">{currencySymbol || '€'}{order.total.toFixed(2)}</span>
              </div>
            </div>

            {/* Bottom Action Button */}
            <button
              onClick={() => reorderOrder(order)}
              className="w-full bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-bold py-3.5 rounded-2xl flex items-center justify-center gap-2 cursor-pointer shadow-md active:scale-98 transition-all"
            >
              <RotateCcw className="w-4 h-4 text-amber-300" />
              <span>إعادة طلب محتويات هذه الفاتورة للسلة</span>
            </button>

          </div>
        )}
      </div>
    );
  };

  return (
    <div className="p-4 sm:p-6 space-y-6 pb-24 max-w-3xl mx-auto" dir="rtl">
      
      {/* Header Info */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-black text-xl text-stone-900 flex items-center gap-2">
            <Package className="w-6 h-6 text-emerald-800" />
            <span>سجل طلباتي</span>
          </h1>
          <p className="text-xs text-stone-500 font-medium mt-0.5">
            متابعة وتتبع طلباتك لحظياً من تجهيز المتجر حتى باب منزلك
          </p>
        </div>

        <button
          onClick={fetchOrders}
          className="text-xs text-stone-700 hover:text-stone-900 bg-stone-100 hover:bg-stone-200 px-3 py-2 rounded-xl border border-stone-200 flex items-center gap-1.5 cursor-pointer transition-colors shadow-2xs"
          title="تحديث قائمة الطلبات"
        >
          <RotateCcw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-emerald-700' : ''}`} />
          <span className="font-bold">تحديث</span>
        </button>
      </div>

      {/* Error State Banner */}
      {loadError && (
        <div className="bg-amber-50 border border-amber-200 text-amber-900 p-4 rounded-2xl text-xs flex items-center justify-between gap-3 shadow-2xs">
          <div className="flex items-center gap-2.5">
            <AlertCircle className="w-5 h-5 text-amber-700 shrink-0" />
            <span className="font-medium">{loadError}</span>
          </div>
          <button
            onClick={fetchOrders}
            className="bg-amber-600 hover:bg-amber-700 text-white px-3.5 py-1.5 rounded-xl font-bold text-xs shrink-0 cursor-pointer active:scale-95 transition-all shadow-2xs"
          >
            إعادة المحاولة
          </button>
        </div>
      )}

      {/* Loading Skeleton */}
      {isLoading && (
        <div className="space-y-4">
          {[1, 2].map((i) => (
            <div key={i} className="bg-white p-5 rounded-3xl border border-stone-200 animate-pulse space-y-3.5 shadow-2xs">
              <div className="flex justify-between items-center">
                <div className="w-32 h-5 bg-stone-200 rounded-lg"></div>
                <div className="w-24 h-5 bg-stone-200 rounded-full"></div>
              </div>
              <div className="w-48 h-3.5 bg-stone-100 rounded"></div>
              <div className="h-12 bg-stone-50 rounded-2xl"></div>
            </div>
          ))}
        </div>
      )}

      {/* Empty State when zero total orders */}
      {!isLoading && !loadError && orders.length === 0 && (
        <div className="py-16 text-center space-y-4 bg-white rounded-3xl p-6 border border-stone-200/80 shadow-2xs my-4">
          <div className="w-20 h-20 rounded-3xl bg-emerald-50 text-emerald-800 flex items-center justify-center mx-auto border border-emerald-100 shadow-2xs">
            <ShoppingBag className="w-10 h-10" />
          </div>
          <div className="space-y-1.5">
            <h3 className="font-black text-base text-stone-900">لم تقم بإجراء أي طلبات بعد</h3>
            <p className="text-xs text-stone-500 max-w-xs mx-auto leading-relaxed">
              عندما تقوم بإتمام طلبك الأول من تشكيلة المؤونة والمنتجات الشامية، ستتمكن من تتبع مساره ومراحل توصيله هنا فوراً.
            </p>
          </div>
          <button
            onClick={() => navigateTo('products')}
            className="bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-bold px-6 py-3.5 rounded-2xl shadow-md cursor-pointer transition-all active:scale-95 inline-flex items-center gap-2"
          >
            <span>تصفح المنتجات واطلب الآن</span>
            <ArrowRight className="w-4 h-4 rotate-180" />
          </button>
        </div>
      )}

      {/* Active Orders Section (Always on top) */}
      {!isLoading && activeOrders.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 animate-pulse"></span>
              <h2 className="font-black text-sm text-stone-900">
                {todayActiveOrders.length > 0 ? 'طلبات اليوم النشطة' : 'الطلبات الحالية والنشطة'}
              </h2>
            </div>
            <span className="text-[11px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full">
              {activeOrders.length} طلب قيد المتابعة
            </span>
          </div>

          <div className="space-y-3">
            {activeOrders.map((order) => renderOrderCard(order, false))}
          </div>
        </div>
      )}

      {/* Past Orders Section (Clean & Collapsible) */}
      {!isLoading && pastOrders.length > 0 && (
        <div className="space-y-3 pt-2">
          <div 
            onClick={() => setIsPastOrdersOpen(!isPastOrdersOpen)}
            className="flex items-center justify-between cursor-pointer p-2 -mx-2 rounded-2xl hover:bg-stone-100/70 select-none transition-colors"
          >
            <div className="flex items-center gap-2">
              <History className="w-4 h-4 text-stone-500" />
              <h2 className="font-black text-sm text-stone-700">الطلبات السابقة</h2>
              <span className="text-xs text-stone-400 font-bold">({pastOrders.length})</span>
            </div>
            
            <div className="flex items-center gap-1.5 text-xs text-stone-500 font-medium">
              <span>{isPastOrdersOpen ? 'إخفاء' : 'عرض'}</span>
              {isPastOrdersOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </div>
          </div>

          {isPastOrdersOpen && (
            <div className="space-y-3 animate-in fade-in duration-150">
              {pastOrders.map((order) => renderOrderCard(order, true))}
            </div>
          )}
        </div>
      )}

    </div>
  );
};
