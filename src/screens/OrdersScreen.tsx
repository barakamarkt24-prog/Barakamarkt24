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
  User as UserIcon, 
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
  ArrowRight,
  MessageSquare,
  Send,
  HelpCircle,
  CheckCircle,
  AlertTriangle,
  FileEdit,
  X,
  Bell
} from 'lucide-react';
import { Order, OrderStatus, CustomerNoteStatus } from '../types';
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
  desc: string;
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
    desc: 'تم استلام طلبك وجاري مراجعته وتأكيده مع المتجر.'
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
    label: 'جاهز لاستلام المندوب',
    bg: 'bg-indigo-50',
    text: 'text-indigo-800',
    border: 'border-indigo-200',
    badgeBg: 'bg-indigo-500',
    step: 3,
    desc: 'الطلب جاهز في المتجر بانتظار استلام السائق لبدء خط التوصيل.'
  },
  on_the_way: {
    label: 'في الطريق إليك 🚚',
    bg: 'bg-cyan-50',
    text: 'text-cyan-800',
    border: 'border-cyan-200',
    badgeBg: 'bg-cyan-500',
    step: 4,
    desc: 'الطلب مع مندوب التوصيل الآن وفي طريقه إلى عنوانك المحدد.'
  },
  out_for_delivery: {
    label: 'خرج للتوصيل الآن 🚚',
    bg: 'bg-cyan-50',
    text: 'text-cyan-800',
    border: 'border-cyan-200',
    badgeBg: 'bg-cyan-500',
    step: 4,
    desc: 'مندوب التوصيل في منطقتك وقريب من موقعك لتسليم الطلبية.'
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

const ISSUE_CATEGORIES = [
  { id: 'broken_item', label: 'المنتج وصل مكسوراً أو تالفاً', icon: '💔' },
  { id: 'missing_item', label: 'يوجد منتج ناقص في الطلب', icon: '📦' },
  { id: 'wrong_item', label: 'المنتج المستلم غير صحيح أو مختلف', icon: '🔄' },
  { id: 'delay', label: 'تأخير في موعد التوصيل', icon: '⏳' },
  { id: 'general', label: 'ملاحظة عامة / استفسار عن الطلب', icon: '💬' }
];

export const OrdersScreen: React.FC = () => {
  const { navigateTo, currentUser, isAuthReady, isLoadingAuth, currencySymbol, reorderOrder } = useApp();
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  
  // Expanded Order Cards
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);
  
  // Past / Delivered Orders Section (Collapsed by default)
  const [isPastOrdersOpen, setIsPastOrdersOpen] = useState<boolean>(false);
  const [expandedItemsOrderIds, setExpandedItemsOrderIds] = useState<Set<string>>(new Set());

  // Customer Note Modal / Form State
  const [activeNoteOrder, setActiveNoteOrder] = useState<Order | null>(null);
  const [noteCategory, setNoteCategory] = useState<string>('broken_item');
  const [noteText, setNoteText] = useState<string>('');
  const [isSubmittingNote, setIsSubmittingNote] = useState<boolean>(false);
  const [noteFeedback, setNoteFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

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

  // Open note modal for a specific order
  const handleOpenNoteModal = (order: Order, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setActiveNoteOrder(order);
    setNoteCategory(order.customerNoteCategory || 'broken_item');
    setNoteText(order.customerNote || '');
    setNoteFeedback(null);
  };

  // Submit Note on Order
  const handleSubmitNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeNoteOrder) return;
    if (!noteText.trim()) {
      setNoteFeedback({ type: 'error', message: 'يرجى كتابة نص الملاحظة أو تفاصيل المشكلة' });
      return;
    }

    setIsSubmittingNote(true);
    setNoteFeedback(null);
    try {
      await orderService.submitCustomerNote(activeNoteOrder.id, noteText.trim(), noteCategory);
      setNoteFeedback({ 
        type: 'success', 
        message: 'تم إرسال ملاحظتك بنجاح إلى إدارة المتجر. سنقوم بمراجعتها والرد عليك في أقرب وقت.' 
      });
      setTimeout(() => {
        setActiveNoteOrder(null);
        setNoteFeedback(null);
      }, 2200);
    } catch (err: any) {
      setNoteFeedback({ type: 'error', message: err?.message || 'تعذر إرسال الملاحظة، يرجى المحاولة ثانية' });
    } finally {
      setIsSubmittingNote(false);
    }
  };

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

  // Render Issue & Note Status Badge
  const renderNoteStatusBadge = (order: Order) => {
    if (!order.customerNoteStatus || order.customerNoteStatus === 'none') {
      return null;
    }

    if (order.customerNoteStatus === 'resolved') {
      return (
        <span className="bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10px] font-extrabold px-2.5 py-1 rounded-full inline-flex items-center gap-1 shadow-2xs">
          <CheckCircle className="w-3 h-3 text-emerald-600" />
          <span>تمت معالجة الملاحظة ✓</span>
        </span>
      );
    }

    if (order.customerNoteStatus === 'replied') {
      return (
        <span className="bg-blue-50 text-blue-800 border border-blue-200 text-[10px] font-extrabold px-2.5 py-1 rounded-full inline-flex items-center gap-1 shadow-2xs animate-pulse">
          <MessageSquare className="w-3 h-3 text-blue-600" />
          <span>تم الرد من الإدارة 💬</span>
        </span>
      );
    }

    // 'open'
    return (
      <span className="bg-amber-50 text-amber-900 border border-amber-200 text-[10px] font-extrabold px-2.5 py-1 rounded-full inline-flex items-center gap-1 shadow-2xs">
        <Clock className="w-3 h-3 text-amber-600" />
        <span>ملاحظة قيد المراجعة ⏳</span>
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

  // Separate Active Orders from Completed/Delivered Orders
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

  // While restoring auth session
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

  // If user is not authenticated
  if (!currentUser) {
    return (
      <div className="p-6 space-y-6 max-w-md mx-auto text-center my-10" dir="rtl">
        <div className="w-20 h-20 bg-emerald-50 text-[#005A36] rounded-3xl flex items-center justify-center mx-auto border border-emerald-100 shadow-sm">
          <Package className="w-10 h-10" />
        </div>

        <div className="space-y-2">
          <h2 className="text-xl font-black text-stone-900">سجل طلباتك في بركة ماركت</h2>
          <p className="text-xs text-stone-500 leading-relaxed max-w-xs mx-auto">
            سجّل الدخول لمتابعة طلباتك الحالية لحظياً، معرفة مراحل التوصيل، الإبلاغ عن أي ملاحظة على طلبك، وإعادة طلب مشترياتك السابقة بضغطة زر.
          </p>
        </div>

        <button
          onClick={() => navigateTo('auth')}
          className="w-full bg-[#005A36] hover:bg-[#00472a] text-white font-bold py-3.5 px-4 rounded-2xl text-xs sm:text-sm flex items-center justify-center gap-2 cursor-pointer shadow-md active:scale-98 transition-all"
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
            : 'border-[#005A36]/20 ring-1 ring-[#005A36]/5 shadow-xs hover:border-[#005A36]/30'
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
              {renderNoteStatusBadge(order)}
              {isOrderFromToday(order) && !isPastOrder && (
                <span className="bg-amber-100 text-amber-900 text-[10px] font-extrabold px-2 py-0.5 rounded-full border border-amber-200">
                  اليوم
                </span>
              )}
            </div>

            <div className="flex items-center gap-2.5 text-[11px] text-stone-500 flex-wrap">
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
                <span className="font-black text-base text-[#005A36] font-sans">
                  {currencySymbol || '€'}{order.total.toFixed(2)}
                </span>
              </div>
              <div className="flex items-center gap-1 text-[10px] text-stone-400">
                <span>الحالة:</span>
                {paymentInfo.statusBadge}
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* Report Issue / Note Button */}
              <button
                onClick={(e) => handleOpenNoteModal(order, e)}
                className={`text-xs font-bold px-3 py-2 rounded-xl border flex items-center gap-1.5 cursor-pointer active:scale-95 transition-all shadow-2xs ${
                  order.customerNote
                    ? 'bg-amber-50 hover:bg-amber-100 text-amber-900 border-amber-200'
                    : 'bg-stone-50 hover:bg-stone-100 text-stone-700 border-stone-200'
                }`}
                title="ملاحظة أو إبلاغ عن مشكلة في هذا الطلب"
              >
                <MessageSquare className="w-3.5 h-3.5 text-amber-700" />
                <span className="text-[11px]">{order.customerNote ? 'ملاحظة الطلب' : 'ملاحظة على الطلب'}</span>
              </button>

              {/* Reorder Button */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  reorderOrder(order);
                }}
                className="bg-stone-100 hover:bg-emerald-50 hover:text-[#005A36] text-stone-700 text-xs font-bold px-3 py-2 rounded-xl border border-stone-200 hover:border-emerald-300 flex items-center gap-1.5 cursor-pointer active:scale-95 transition-all shadow-2xs"
                title="إعادة طلب هذه الأصناف للسلة"
              >
                <RotateCcw className="w-3.5 h-3.5 text-[#005A36]" />
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
                          ? 'bg-[#005A36] text-white ring-4 ring-[#005A36]/20 font-bold shadow-2xs'
                          : isReached 
                            ? 'bg-[#16A34A] text-white' 
                            : 'bg-stone-200 text-stone-400'
                      }`}
                    >
                      {isReached ? <Check className="w-3 h-3 stroke-[3]" /> : step.stepNumber}
                    </div>
                    <span className={`text-[10px] leading-tight ${
                      isCurrent 
                        ? 'text-[#005A36] font-black' 
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

            {/* Customer Note & Admin Reply Block (If exists) */}
            {order.customerNote && (
              <div className="bg-white p-4 rounded-2xl border border-amber-200/80 space-y-3 shadow-2xs">
                <div className="flex items-center justify-between border-b border-stone-100 pb-2">
                  <span className="font-bold text-xs text-stone-900 flex items-center gap-1.5">
                    <MessageSquare className="w-4 h-4 text-amber-600" />
                    <span>ملاحظتك المسجلة على هذا الطلب:</span>
                  </span>
                  {renderNoteStatusBadge(order)}
                </div>

                <div className="bg-amber-50/60 p-3 rounded-xl border border-amber-100 text-stone-800 space-y-1">
                  <div className="flex items-center justify-between text-[10px] text-stone-500">
                    <span className="font-bold text-amber-900">
                      {ISSUE_CATEGORIES.find(c => c.id === order.customerNoteCategory)?.label || 'ملاحظة العميل'}
                    </span>
                    <span>{order.customerNoteCreatedAt || order.customerNoteUpdatedAt}</span>
                  </div>
                  <p className="text-xs text-stone-800 leading-relaxed">{order.customerNote}</p>
                </div>

                {/* Admin Reply if recorded */}
                {order.adminReply ? (
                  <div className="bg-blue-50/80 p-3.5 rounded-xl border border-blue-200 text-stone-800 space-y-1.5">
                    <div className="flex items-center justify-between text-[11px] text-blue-900 font-bold">
                      <span className="flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5 text-blue-700" />
                        <span>رد إدارة بركة ماركت:</span>
                      </span>
                      <span className="text-[10px] text-blue-700 font-sans font-normal">{order.adminReplyCreatedAt}</span>
                    </div>
                    <p className="text-xs text-blue-950 font-medium leading-relaxed bg-white p-2.5 rounded-lg border border-blue-100">
                      {order.adminReply}
                    </p>
                  </div>
                ) : (
                  <div className="text-[11px] text-amber-800 bg-amber-50/40 p-2.5 rounded-xl flex items-center gap-2">
                    <Clock className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                    <span>ملاحظتك قيد المراجعة من فريق خدمة العملاء وسيتم الرد عليك هنا قريباً.</span>
                  </div>
                )}

                <div className="flex justify-end pt-1">
                  <button
                    onClick={() => handleOpenNoteModal(order)}
                    className="text-[11px] text-amber-900 hover:text-amber-950 font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <FileEdit className="w-3.5 h-3.5" />
                    <span>تعديل الملاحظة أو إضافة توضيح</span>
                  </button>
                </div>
              </div>
            )}

            {/* If no note, subtle button to write a note */}
            {!order.customerNote && (
              <div className="bg-white p-3.5 rounded-2xl border border-stone-200/80 flex items-center justify-between gap-3 shadow-2xs">
                <div className="flex items-center gap-2">
                  <HelpCircle className="w-4 h-4 text-stone-400 shrink-0" />
                  <span className="text-xs text-stone-600">هل واجهت مشكلة أو لديك ملاحظة على هذا الطلب؟</span>
                </div>
                <button
                  onClick={() => handleOpenNoteModal(order)}
                  className="bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 text-xs font-bold px-3 py-1.5 rounded-xl cursor-pointer transition-colors shrink-0 shadow-2xs"
                >
                  كتابة ملاحظة / إبلاغ
                </button>
              </div>
            )}

            {/* Order Timeline History if recorded */}
            {order.timeline && order.timeline.length > 0 && (
              <div className="bg-white p-4 rounded-2xl border border-stone-200/80 space-y-3 shadow-2xs">
                <span className="font-bold text-xs text-stone-900 flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-[#005A36]" />
                  <span>سجل مراحل وتحديثات الطلب (Timeline):</span>
                </span>
                <div className="space-y-2.5 pt-1 border-r-2 border-[#005A36]/30 pr-3.5 mr-1">
                  {order.timeline.map((t, tIdx) => (
                    <div key={tIdx} className="relative text-xs space-y-0.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-[#005A36] absolute -right-[19px] top-1"></span>
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
                    className="text-[11px] font-bold text-[#005A36] hover:text-[#00472a] cursor-pointer"
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

                    <span className="font-black text-[#005A36] font-sans shrink-0 text-xs sm:text-sm">
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
                  <UserIcon className="w-3.5 h-3.5 text-stone-400" />
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
                  <MapPin className="w-3.5 h-3.5 text-[#005A36] mt-0.5" />
                  <span>عنوان التوصيل:</span>
                </span>
                <div className="text-left text-stone-800 font-medium max-w-[65%] space-y-0.5">
                  <p className="font-bold text-stone-900">
                    {order.address} {order.plz && !order.address.includes(order.plz) ? `(${order.plz} ${order.city || 'Greifswald'})` : ''}
                  </p>
                  {order.bellName && (
                    <p className="text-[11px] text-amber-900 font-medium flex items-center gap-1">
                      <Bell className="w-3 h-3 text-amber-600 shrink-0" />
                      <span>الجرس: {order.bellName}</span>
                    </p>
                  )}
                  {(order.floor || order.apartment) && (
                    <p className="text-[10px] text-stone-500">
                      {order.floor && `الطابق: ${order.floor}`} {order.apartment && ` | الشقة: ${order.apartment}`}
                    </p>
                  )}
                </div>
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
                <span className="font-sans text-[#005A36] text-base">{currencySymbol || '€'}{order.total.toFixed(2)}</span>
              </div>
            </div>

            {/* Bottom Action Buttons */}
            <div className="flex items-center gap-2.5 pt-1">
              <button
                onClick={() => handleOpenNoteModal(order)}
                className="flex-1 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 text-xs font-bold py-3.5 rounded-2xl flex items-center justify-center gap-2 cursor-pointer shadow-2xs active:scale-98 transition-all"
              >
                <MessageSquare className="w-4 h-4 text-amber-700" />
                <span>{order.customerNote ? 'مراجعة / تعديل الملاحظة' : 'كتابة ملاحظة على الطلب'}</span>
              </button>

              <button
                onClick={() => reorderOrder(order)}
                className="flex-1 bg-[#005A36] hover:bg-[#00472a] text-white text-xs font-bold py-3.5 rounded-2xl flex items-center justify-center gap-2 cursor-pointer shadow-md active:scale-98 transition-all"
              >
                <RotateCcw className="w-4 h-4 text-amber-300" />
                <span>إعادة الطلب للسلة</span>
              </button>
            </div>

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
            <Package className="w-6 h-6 text-[#005A36]" />
            <span>طلباتي</span>
          </h1>
          <p className="text-xs text-stone-500 font-medium mt-0.5">
            متابعة حالة الطلبات النشطة، مراحل التوصيل، وخدمة ما بعد التسليم
          </p>
        </div>

        <button
          onClick={fetchOrders}
          className="text-xs text-stone-700 hover:text-stone-900 bg-stone-100 hover:bg-stone-200 px-3 py-2 rounded-xl border border-stone-200 flex items-center gap-1.5 cursor-pointer transition-colors shadow-2xs"
          title="تحديث قائمة الطلبات"
        >
          <RotateCcw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-[#005A36]' : ''}`} />
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

      {/* Empty State when zero total orders ever */}
      {!isLoading && !loadError && orders.length === 0 && (
        <div className="py-16 text-center space-y-4 bg-white rounded-3xl p-6 border border-stone-200/80 shadow-2xs my-4">
          <div className="w-20 h-20 rounded-3xl bg-emerald-50 text-[#005A36] flex items-center justify-center mx-auto border border-emerald-100 shadow-2xs">
            <ShoppingBag className="w-10 h-10" />
          </div>
          <div className="space-y-1.5">
            <h3 className="font-black text-base text-stone-900">لم تقم بإجراء أي طلبات بعد</h3>
            <p className="text-xs text-stone-500 max-w-xs mx-auto leading-relaxed">
              عندما تقوم بإتمام طلبك الأول من تشكيلة المنتجات والمؤونة، ستتمكن من تتبع مساره ومراحل توصيله هنا فوراً.
            </p>
          </div>
          <button
            onClick={() => navigateTo('products')}
            className="bg-[#005A36] hover:bg-[#00472a] text-white text-xs font-bold px-6 py-3.5 rounded-2xl shadow-md cursor-pointer transition-all active:scale-95 inline-flex items-center gap-2"
          >
            <span>تصفح المنتجات واطلب الآن</span>
            <ArrowRight className="w-4 h-4 rotate-180" />
          </button>
        </div>
      )}

      {/* 1. Active Orders Section (Always Top Priority) */}
      {!isLoading && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className={`w-2.5 h-2.5 rounded-full ${activeOrders.length > 0 ? 'bg-emerald-600 animate-pulse' : 'bg-stone-300'}`}></span>
              <h2 className="font-black text-base text-stone-900">الطلبات الحالية</h2>
            </div>
            {activeOrders.length > 0 && (
              <span className="text-[11px] font-bold text-[#005A36] bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full">
                {activeOrders.length} طلب قيد التنفيذ
              </span>
            )}
          </div>

          {activeOrders.length > 0 ? (
            <div className="space-y-3">
              {activeOrders.map((order) => renderOrderCard(order, false))}
            </div>
          ) : (
            /* When no active orders exist, show clean friendly box as requested */
            orders.length > 0 && (
              <div className="bg-white rounded-3xl p-6 border border-stone-200/80 shadow-2xs text-center space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-[#005A36] flex items-center justify-center mx-auto border border-emerald-100">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <h3 className="font-bold text-sm text-stone-900">لا توجد طلبات قيد التنفيذ حالياً</h3>
                  <p className="text-xs text-stone-500 max-w-sm mx-auto leading-relaxed">
                    جميع طلباتك السابقة تم تسليمها بنجاح. يمكنك استعراضها أدناه أو تقديم طلب جديد في أي وقت.
                  </p>
                </div>

                <div className="pt-2 flex items-center justify-center gap-2.5 flex-wrap">
                  {pastOrders.length > 0 && (
                    <button
                      onClick={() => setIsPastOrdersOpen(true)}
                      className="bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-bold px-4 py-2.5 rounded-xl border border-stone-200 flex items-center gap-1.5 cursor-pointer transition-colors shadow-2xs"
                    >
                      <History className="w-4 h-4 text-stone-600" />
                      <span>عرض الطلبات التي تم تسليمها ({pastOrders.length})</span>
                    </button>
                  )}
                  <button
                    onClick={() => navigateTo('products')}
                    className="bg-[#005A36] hover:bg-[#00472a] text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-md flex items-center gap-1.5 cursor-pointer transition-all active:scale-95"
                  >
                    <ShoppingBag className="w-4 h-4 text-amber-300" />
                    <span>تسوق الآن</span>
                  </button>
                </div>
              </div>
            )
          )}
        </div>
      )}

      {/* 2. Delivered / Completed Orders Section (Clean & Collapsible, Hidden by default) */}
      {!isLoading && pastOrders.length > 0 && (
        <div className="space-y-3 pt-2">
          <div 
            onClick={() => setIsPastOrdersOpen(!isPastOrdersOpen)}
            className="flex items-center justify-between cursor-pointer p-3.5 bg-stone-100/80 hover:bg-stone-200/70 border border-stone-200/80 rounded-2xl select-none transition-colors shadow-2xs"
          >
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-xl bg-white flex items-center justify-center text-stone-600 shadow-2xs">
                <History className="w-4 h-4" />
              </div>
              <div>
                <h2 className="font-black text-xs sm:text-sm text-stone-800">الطلبات التي تم تسليمها</h2>
                <span className="text-[11px] text-stone-500 font-medium">سجل فواتيرك ومشترياتك السابقة ({pastOrders.length} طلب)</span>
              </div>
            </div>
            
            <div className="flex items-center gap-1.5 text-xs text-stone-600 font-bold bg-white px-3 py-1.5 rounded-xl border border-stone-200 shadow-2xs">
              <span>{isPastOrdersOpen ? 'إخفاء القسم' : 'عرض السجل'}</span>
              {isPastOrdersOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </div>
          </div>

          {isPastOrdersOpen && (
            <div className="space-y-3 animate-in fade-in duration-200">
              {pastOrders.map((order) => renderOrderCard(order, true))}
            </div>
          )}
        </div>
      )}

      {/* Customer Note / Post-Delivery Issue Modal */}
      {activeNoteOrder && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div 
            className="bg-white rounded-3xl max-w-lg w-full p-5 sm:p-6 space-y-4 shadow-2xl border border-stone-200 animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
            dir="rtl"
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-2xl bg-amber-50 text-amber-800 flex items-center justify-center border border-amber-200">
                  <MessageSquare className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-sm text-stone-900">ملاحظة على الطلب #{activeNoteOrder.orderId || activeNoteOrder.id}</h3>
                  <p className="text-[11px] text-stone-500">خدمة ما بعد التسليم ومتابعة الملاحظات مع الإدارة</p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setActiveNoteOrder(null)}
                className="w-8 h-8 rounded-full bg-stone-100 hover:bg-stone-200 text-stone-500 flex items-center justify-center cursor-pointer transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Feedback Alert */}
            {noteFeedback && (
              <div className={`p-3.5 rounded-2xl text-xs font-bold flex items-center gap-2 shadow-2xs ${
                noteFeedback.type === 'success' 
                  ? 'bg-emerald-50 text-emerald-900 border border-emerald-200' 
                  : 'bg-rose-50 text-rose-900 border border-rose-200'
              }`}>
                {noteFeedback.type === 'success' ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertTriangle className="w-4 h-4 shrink-0" />}
                <span>{noteFeedback.message}</span>
              </div>
            )}

            {/* If admin already replied, show the reply context */}
            {activeNoteOrder.adminReply && (
              <div className="bg-blue-50/80 p-3.5 rounded-2xl border border-blue-200 text-xs space-y-1">
                <span className="font-bold text-blue-900 block">آخر رد من إدارة المتجر:</span>
                <p className="text-blue-950 bg-white p-2.5 rounded-xl border border-blue-100 leading-relaxed font-medium">
                  {activeNoteOrder.adminReply}
                </p>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmitNote} className="space-y-3.5">
              
              {/* Category Selector */}
              <div className="space-y-1.5">
                <label className="font-bold text-xs text-stone-800 block">نوع الملاحظة أو المشكلة:</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                  {ISSUE_CATEGORIES.map(cat => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setNoteCategory(cat.id)}
                      className={`text-right p-2.5 rounded-xl border text-xs font-bold flex items-center gap-2 cursor-pointer transition-all ${
                        noteCategory === cat.id
                          ? 'bg-amber-50 border-amber-300 text-amber-950 ring-2 ring-amber-400/20 shadow-2xs'
                          : 'bg-stone-50 hover:bg-stone-100 border-stone-200 text-stone-700'
                      }`}
                    >
                      <span className="text-sm">{cat.icon}</span>
                      <span className="truncate">{cat.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Note Textarea */}
              <div className="space-y-1.5">
                <label className="font-bold text-xs text-stone-800 block">تفاصيل الملاحظة:</label>
                <textarea
                  rows={4}
                  value={noteText}
                  onChange={(e) => setNoteText(e.target.value)}
                  placeholder="اكتب هنا تفاصيل المشكلة (مثال: وصل برطمان المكدوس مكسوراً أثناء النقل، أو الصنف كذا ناقص)..."
                  className="w-full bg-stone-50 border border-stone-200 rounded-2xl p-3.5 text-xs text-stone-900 focus:bg-white focus:border-[#005A36] focus:ring-2 focus:ring-[#005A36]/10 outline-hidden resize-none leading-relaxed transition-all placeholder:text-stone-400"
                  required
                />
              </div>

              {/* Info Text */}
              <div className="bg-stone-50 p-3 rounded-xl border border-stone-200/60 text-[11px] text-stone-500 leading-relaxed">
                💡 سيتم إشعار إدارة المتجر بملاحظتك فوراً، وسيقوم فريق خدمة العملاء بالتواصل معك ومعالجة المشكلة أو التعويض المناسب.
              </div>

              {/* Modal Actions */}
              <div className="flex items-center gap-2 pt-2 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setActiveNoteOrder(null)}
                  className="flex-1 bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold py-3 rounded-2xl text-xs cursor-pointer transition-colors"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingNote || !noteText.trim()}
                  className="flex-2 bg-[#005A36] hover:bg-[#00472a] text-white font-bold py-3 rounded-2xl text-xs flex items-center justify-center gap-2 cursor-pointer shadow-md disabled:opacity-50 transition-all active:scale-98"
                >
                  {isSubmittingNote ? (
                    <RotateCcw className="w-4 h-4 animate-spin text-amber-300" />
                  ) : (
                    <Send className="w-4 h-4 text-amber-300" />
                  )}
                  <span>إرسال الملاحظة للإدارة</span>
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
};
