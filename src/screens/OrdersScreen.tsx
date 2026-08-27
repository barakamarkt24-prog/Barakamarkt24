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
import { getLocalizedProductName } from '../locales';

export const ORDER_STATUS_CONFIG: Record<OrderStatus, { 
  labelKey: string; 
  bg: string; 
  text: string; 
  border: string; 
  badgeBg: string;
  step: number; 
  descKey: string;
}> = {
  received: {
    labelKey: 'orders.statuses.received',
    bg: 'bg-amber-50',
    text: 'text-amber-800',
    border: 'border-amber-200',
    badgeBg: 'bg-amber-500',
    step: 1,
    descKey: 'orders.statuses.received'
  },
  pending: {
    labelKey: 'orders.statuses.pending',
    bg: 'bg-amber-50',
    text: 'text-amber-800',
    border: 'border-amber-200',
    badgeBg: 'bg-amber-500',
    step: 1,
    descKey: 'orders.statuses.pending'
  },
  confirmed: {
    labelKey: 'orders.statuses.confirmed',
    bg: 'bg-blue-50',
    text: 'text-blue-800',
    border: 'border-blue-200',
    badgeBg: 'bg-blue-500',
    step: 2,
    descKey: 'orders.statuses.confirmed'
  },
  preparing: {
    labelKey: 'orders.statuses.preparing',
    bg: 'bg-purple-50',
    text: 'text-purple-800',
    border: 'border-purple-200',
    badgeBg: 'bg-purple-500',
    step: 3,
    descKey: 'orders.statuses.preparing'
  },
  ready_for_pickup: {
    labelKey: 'orders.statuses.ready_for_pickup',
    bg: 'bg-indigo-50',
    text: 'text-indigo-800',
    border: 'border-indigo-200',
    badgeBg: 'bg-indigo-500',
    step: 3,
    descKey: 'orders.statuses.ready_for_pickup'
  },
  on_the_way: {
    labelKey: 'orders.statuses.on_the_way',
    bg: 'bg-cyan-50',
    text: 'text-cyan-800',
    border: 'border-cyan-200',
    badgeBg: 'bg-cyan-500',
    step: 4,
    descKey: 'orders.statuses.on_the_way'
  },
  out_for_delivery: {
    labelKey: 'orders.statuses.on_the_way',
    bg: 'bg-cyan-50',
    text: 'text-cyan-800',
    border: 'border-cyan-200',
    badgeBg: 'bg-cyan-500',
    step: 4,
    descKey: 'orders.statuses.on_the_way'
  },
  delivered: {
    labelKey: 'orders.statuses.delivered',
    bg: 'bg-emerald-50',
    text: 'text-emerald-800',
    border: 'border-emerald-200',
    badgeBg: 'bg-emerald-600',
    step: 5,
    descKey: 'orders.statuses.delivered'
  },
  delivery_failed: {
    labelKey: 'orders.statuses.delivery_failed',
    bg: 'bg-rose-50',
    text: 'text-rose-800',
    border: 'border-rose-200',
    badgeBg: 'bg-rose-500',
    step: 0,
    descKey: 'orders.statuses.delivery_failed'
  },
  cancelled: {
    labelKey: 'orders.statuses.cancelled',
    bg: 'bg-stone-100',
    text: 'text-stone-700',
    border: 'border-stone-200',
    badgeBg: 'bg-stone-400',
    step: 0,
    descKey: 'orders.statuses.cancelled'
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
  { id: 'received', stepNumber: 1, key: 'orders.statuses.received' },
  { id: 'confirmed', stepNumber: 2, key: 'orders.statuses.confirmed' },
  { id: 'preparing', stepNumber: 3, key: 'orders.statuses.preparing' },
  { id: 'on_the_way', stepNumber: 4, key: 'orders.statuses.on_the_way' },
  { id: 'delivered', stepNumber: 5, key: 'orders.statuses.delivered' }
];

const ISSUE_CATEGORIES = [
  { id: 'broken_item', labelAr: 'المنتج وصل مكسوراً أو تالفاً', labelEn: 'Damaged or broken item', labelDe: 'Beschädigtes Produkt', icon: '💔' },
  { id: 'missing_item', labelAr: 'يوجد منتج ناقص في الطلب', labelEn: 'Missing item from order', labelDe: 'Fehlendes Produkt', icon: '📦' },
  { id: 'wrong_item', labelAr: 'المنتج المستلم غير صحيح أو مختلف', labelEn: 'Wrong or different item received', labelDe: 'Falscher Artikel geliefert', icon: '🔄' },
  { id: 'delay', labelAr: 'تأخير في موعد التوصيل', labelEn: 'Delivery delay', labelDe: 'Lieferverzögerung', icon: '⏳' },
  { id: 'general', labelAr: 'ملاحظة عامة / استفسار عن الطلب', labelEn: 'General inquiry / note', labelDe: 'Allgemeine Anfrage', icon: '💬' }
];

export const OrdersScreen: React.FC = () => {
  const { navigateTo, currentUser, isAuthReady, isLoadingAuth, currencySymbol, reorderOrder, language, dir, t } = useApp();
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
    const label = t(config.labelKey) || status;
    return (
      <span className={`${config.bg} ${config.text} ${config.border} text-[11px] font-bold px-2.5 py-1 rounded-full border inline-flex items-center gap-1.5 shadow-2xs`}>
        <span className={`w-1.5 h-1.5 rounded-full ${config.badgeBg}`}></span>
        <span>{label}</span>
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
          <span>{language === 'ar' ? 'تمت معالجة الملاحظة ✓' : language === 'de' ? 'Bearbeitet ✓' : 'Resolved ✓'}</span>
        </span>
      );
    }

    if (order.customerNoteStatus === 'replied') {
      return (
        <span className="bg-blue-50 text-blue-800 border border-blue-200 text-[10px] font-extrabold px-2.5 py-1 rounded-full inline-flex items-center gap-1 shadow-2xs animate-pulse">
          <MessageSquare className="w-3 h-3 text-blue-600" />
          <span>{language === 'ar' ? 'تم الرد من الإدارة 💬' : language === 'de' ? 'Antwort erhalten 💬' : 'Admin Replied 💬'}</span>
        </span>
      );
    }

    // 'open'
    return (
      <span className="bg-amber-50 text-amber-900 border border-amber-200 text-[10px] font-extrabold px-2.5 py-1 rounded-full inline-flex items-center gap-1 shadow-2xs">
        <Clock className="w-3 h-3 text-amber-600" />
        <span>{language === 'ar' ? 'ملاحظة قيد المراجعة ⏳' : language === 'de' ? 'In Prüfung ⏳' : 'In Review ⏳'}</span>
      </span>
    );
  };

  // Payment Method & Status Formatter
  const getPaymentDetails = (method?: string, status?: string) => {
    let methodText = t('checkout.cashOnDelivery') || 'Barzahlung';
    let icon = <Banknote className="w-3.5 h-3.5 text-stone-500" />;

    if (method === 'bank_transfer') {
      methodText = t('checkout.bankTransfer') || 'Überweisung';
      icon = <Building2 className="w-3.5 h-3.5 text-blue-600" />;
    } else if (method === 'card' || method === 'stripe') {
      methodText = t('checkout.stripe') || 'Kartenzahlung';
      icon = <CreditCard className="w-3.5 h-3.5 text-purple-600" />;
    } else if (method === 'paypal') {
      methodText = t('checkout.paypal') || 'PayPal';
      icon = <CreditCard className="w-3.5 h-3.5 text-blue-600" />;
    }

    let statusBadge = (
      <span className="text-[10px] font-semibold text-stone-600 bg-stone-100 px-2 py-0.5 rounded-md border border-stone-200">
        {language === 'ar' ? 'قيد الدفع' : 'Offen'}
      </span>
    );

    if (status === 'paid') {
      statusBadge = (
        <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
          {language === 'ar' ? 'مدفوع ✓' : 'Bezahlt ✓'}
        </span>
      );
    } else if (status === 'awaiting_transfer') {
      statusBadge = (
        <span className="text-[10px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200">
          {language === 'ar' ? 'بانتظار التحويل' : 'Warte auf Überweisung'}
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
        const localeCode = language === 'ar' ? 'ar-SY' : language === 'de' ? 'de-DE' : language === 'uk' ? 'uk-UA' : language === 'fa' ? 'fa-IR' : 'en-US';
        return d.toLocaleDateString(localeCode, {
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
      <div className="p-4 space-y-4 pb-24 max-w-3xl mx-auto" dir={dir}>
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
      <div className="p-6 space-y-6 max-w-md mx-auto text-center my-10" dir={dir}>
        <div className="w-20 h-20 bg-emerald-50 text-[#005A36] rounded-3xl flex items-center justify-center mx-auto border border-emerald-100 shadow-sm">
          <Package className="w-10 h-10" />
        </div>

        <div className="space-y-2">
          <h2 className="text-xl font-black text-stone-900">{t('orders.title')}</h2>
          <p className="text-xs text-stone-500 leading-relaxed max-w-xs mx-auto">
            {t('auth.loginSubtitle')}
          </p>
        </div>

        <button
          onClick={() => navigateTo('auth')}
          className="w-full bg-[#005A36] hover:bg-[#00472a] text-white font-bold py-3.5 px-4 rounded-2xl text-xs sm:text-sm flex items-center justify-center gap-2 cursor-pointer shadow-md active:scale-98 transition-all"
        >
          <LogIn className="w-4 h-4 text-amber-300" />
          <span>{t('auth.loginBtn')} / {t('auth.registerBtn')}</span>
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
                  {language === 'ar' ? 'اليوم' : language === 'de' ? 'Heute' : 'Today'}
                </span>
              )}
            </div>

            <div className="flex items-center gap-2.5 text-[11px] text-stone-500 flex-wrap">
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-stone-400" />
                <span>{formatOrderTime(order)}</span>
              </span>
              <span>•</span>
              <span className="font-medium text-stone-700">{totalItemsCount} {t('orders.itemsCount')}</span>
              <span>•</span>
              <span className="flex items-center gap-1">
                {paymentInfo.icon}
                <span>{paymentInfo.methodText}</span>
              </span>
            </div>
          </div>

          {/* Left/Bottom: Price & Actions */}
          <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-stone-100">
            <div className={dir === 'rtl' ? 'text-right sm:text-left' : 'text-left sm:text-right'}>
              <div className="flex items-center gap-1.5 sm:justify-end">
                <span className="font-black text-base text-[#005A36] font-sans">
                  {currencySymbol || '€'}{order.total.toFixed(2)}
                </span>
              </div>
              <div className="flex items-center gap-1 text-[10px] text-stone-400">
                <span>{t('orders.orderStatus')}:</span>
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
              >
                <MessageSquare className="w-3.5 h-3.5 text-amber-700" />
                <span className="text-[11px]">{order.customerNote ? (language === 'ar' ? 'ملاحظة الطلب' : 'Notiz') : (language === 'ar' ? 'ملاحظة على الطلب' : 'Notiz hinzufügen')}</span>
              </button>

              {/* Reorder Button */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  reorderOrder(order);
                }}
                className="bg-stone-100 hover:bg-emerald-50 hover:text-[#005A36] text-stone-700 text-xs font-bold px-3 py-2 rounded-xl border border-stone-200 hover:border-emerald-300 flex items-center gap-1.5 cursor-pointer active:scale-95 transition-all shadow-2xs"
              >
                <RotateCcw className="w-3.5 h-3.5 text-[#005A36]" />
                <span className="text-[11px]">{t('orders.reorder')}</span>
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
                const stepLabel = t(step.key) || step.id;

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
                    <span className={`text-[10px] leading-tight truncate max-w-full ${
                      isCurrent 
                        ? 'text-[#005A36] font-black' 
                        : isReached 
                          ? 'text-stone-800' 
                          : 'text-stone-400'
                    }`}>
                      {stepLabel}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="px-4 py-2.5 bg-stone-50 border-t border-stone-100 text-xs text-stone-600 font-semibold flex items-center gap-2">
            <XCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{t(currentConfig.descKey) || order.status}</span>
          </div>
        )}

        {/* Expanded Details Section */}
        {isExpanded && (
          <div className="p-4 sm:p-5 pt-3 border-t border-stone-100 bg-stone-50/50 space-y-4 text-xs">
            
            {/* Status Description Banner */}
            <div className="bg-white p-3.5 rounded-2xl border border-stone-200/80 text-xs text-stone-700 flex items-start gap-2.5 shadow-2xs">
              <Sparkles className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-stone-900 block mb-0.5">{t('orders.orderDetails')}:</span>
                <p className="text-stone-600 leading-relaxed">{t(currentConfig.descKey) || order.status}</p>
              </div>
            </div>

            {/* Customer Note & Admin Reply Block (If exists) */}
            {order.customerNote && (
              <div className="bg-white p-4 rounded-2xl border border-amber-200/80 space-y-3 shadow-2xs">
                <div className="flex items-center justify-between border-b border-stone-100 pb-2">
                  <span className="font-bold text-xs text-stone-900 flex items-center gap-1.5">
                    <MessageSquare className="w-4 h-4 text-amber-600" />
                    <span>{language === 'ar' ? 'ملاحظتك المسجلة على هذا الطلب:' : 'Ihre Kundennotiz:'}</span>
                  </span>
                  {renderNoteStatusBadge(order)}
                </div>

                <div className="bg-amber-50/60 p-3 rounded-xl border border-amber-100 text-stone-800 space-y-1">
                  <div className="flex items-center justify-between text-[10px] text-stone-500">
                    <span className="font-bold text-amber-900">
                      {(() => {
                        const cat = ISSUE_CATEGORIES.find(c => c.id === order.customerNoteCategory);
                        return language === 'ar' ? (cat?.labelAr || 'ملاحظة العميل') : (cat?.labelDe || cat?.labelEn || 'Notiz');
                      })()}
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
                        <span>{language === 'ar' ? 'رد إدارة بركة ماركت:' : 'Antwort vom Kundenservice:'}</span>
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
                    <span>{language === 'ar' ? 'ملاحظتك قيد المراجعة وسيتم الرد عليك قريباً.' : 'Ihre Nachricht wird geprüft.'}</span>
                  </div>
                )}

                <div className="flex justify-end pt-1">
                  <button
                    onClick={() => handleOpenNoteModal(order)}
                    className="text-[11px] text-amber-900 hover:text-amber-950 font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <FileEdit className="w-3.5 h-3.5" />
                    <span>{language === 'ar' ? 'تعديل الملاحظة' : 'Notiz bearbeiten'}</span>
                  </button>
                </div>
              </div>
            )}

            {/* Products List Breakdown */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-black text-xs text-stone-900">
                  {t('orders.orderItems')} ({totalItemsCount}):
                </span>
                {hasMoreItems && (
                  <button 
                    onClick={(e) => toggleItemsExpand(order.id, e)}
                    className="text-[11px] font-bold text-[#005A36] hover:text-[#00472a] cursor-pointer"
                  >
                    {isShowAllItems ? (language === 'ar' ? 'عرض أقل' : 'Weniger anzeigen') : `${language === 'ar' ? 'عرض جميع المنتجات' : 'Alle anzeigen'} (${order.items.length})`}
                  </button>
                )}
              </div>

              <div className="space-y-2">
                {displayedItems.map((item, idx) => {
                  const localizedTitle = getLocalizedProductName(item.product, language);
                  return (
                    <div 
                      key={idx} 
                      className="flex justify-between items-center bg-white p-3 rounded-2xl border border-stone-200/70 text-xs gap-3 shadow-2xs"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <img 
                          src={item.product.image || 'https://images.unsplash.com/photo-1552767059-ce182ead6c1b?auto=format&fit=crop&w=150&q=80'} 
                          alt={localizedTitle}
                          className="w-11 h-11 rounded-xl object-cover border border-stone-100 shrink-0 bg-stone-50" 
                          referrerPolicy="no-referrer"
                        />
                        <div className="min-w-0">
                          <span className="font-bold text-stone-900 block truncate">
                            {localizedTitle}
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
                  );
                })}
              </div>
            </div>

            {/* Delivery & Customer Info Card */}
            <div className="bg-white p-4 rounded-2xl border border-stone-200/80 space-y-2.5 text-xs text-stone-600 shadow-2xs">
              <div className="flex items-center justify-between border-b border-stone-100 pb-2">
                <span className="font-bold text-stone-900 flex items-center gap-1.5">
                  <UserIcon className="w-3.5 h-3.5 text-stone-400" />
                  <span>{t('checkout.fullName')}:</span>
                </span>
                <span className="font-bold text-stone-800">{order.customerName || 'Customer'}</span>
              </div>

              <div className="flex items-center justify-between border-b border-stone-100 pb-2">
                <span className="font-bold text-stone-900 flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-stone-400" />
                  <span>{t('checkout.phone')}:</span>
                </span>
                <span className="font-sans font-bold text-stone-800 text-left">{order.phone}</span>
              </div>

              <div className="flex items-start justify-between border-b border-stone-100 pb-2">
                <span className="font-bold text-stone-900 flex items-center gap-1.5 shrink-0">
                  <MapPin className="w-3.5 h-3.5 text-[#005A36] mt-0.5" />
                  <span>{t('checkout.deliveryAddress')}:</span>
                </span>
                <div className="text-left text-stone-800 font-medium max-w-[65%] space-y-0.5">
                  <p className="font-bold text-stone-900">
                    {order.address} {order.plz && !order.address.includes(order.plz) ? `(${order.plz} ${order.city || 'Greifswald'})` : ''}
                  </p>
                  {order.bellName && (
                    <p className="text-[11px] text-amber-900 font-medium flex items-center gap-1">
                      <Bell className="w-3 h-3 text-amber-600 shrink-0" />
                      <span>{t('checkout.bellName')}: {order.bellName}</span>
                    </p>
                  )}
                  {(order.floor || order.apartment) && (
                    <p className="text-[10px] text-stone-500">
                      {order.floor && `${t('checkout.floor')}: ${order.floor}`} {order.apartment && ` | ${t('checkout.apartment')}: ${order.apartment}`}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="font-bold text-stone-900 flex items-center gap-1.5">
                  <Receipt className="w-3.5 h-3.5 text-stone-400" />
                  <span>{t('orders.paymentMethod')}:</span>
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
                  <span className="font-bold text-stone-700">{t('checkout.deliveryNotes')}: </span>
                  <span>{order.notes}</span>
                </div>
              )}
            </div>

            {/* Financial Summary */}
            <div className="bg-white p-4 rounded-2xl border border-stone-200/80 text-xs space-y-2 shadow-2xs">
              <div className="flex justify-between text-stone-600">
                <span>{t('cart.subtotal')}:</span>
                <span className="font-sans font-bold text-stone-900">{currencySymbol || '€'}{order.subtotal.toFixed(2)}</span>
              </div>
              
              <div className="flex justify-between text-stone-600">
                <span>{t('cart.deliveryFee')}:</span>
                <span className="font-sans font-bold">
                  {order.deliveryFee === 0 ? (
                    <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md font-bold text-[10px]">{t('cart.freeDelivery')}</span>
                  ) : (
                    `${currencySymbol || '€'}${order.deliveryFee?.toFixed(2)}`
                  )}
                </span>
              </div>

              {order.discount && order.discount > 0 ? (
                <div className="flex justify-between text-emerald-700 font-bold">
                  <span>{t('cart.discount')}:</span>
                  <span className="font-sans">-{currencySymbol || '€'}{order.discount.toFixed(2)}</span>
                </div>
              ) : null}

              <div className="pt-2.5 border-t border-stone-100 flex justify-between font-black text-stone-900 text-sm">
                <span>{t('cart.total')}:</span>
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
                <span>{order.customerNote ? (language === 'ar' ? 'مراجعة / تعديل الملاحظة' : 'Notiz prüfen') : (language === 'ar' ? 'كتابة ملاحظة على الطلب' : 'Notiz hinzufügen')}</span>
              </button>

              <button
                onClick={() => reorderOrder(order)}
                className="flex-1 bg-[#005A36] hover:bg-[#00472a] text-white text-xs font-bold py-3.5 rounded-2xl flex items-center justify-center gap-2 cursor-pointer shadow-md active:scale-98 transition-all"
              >
                <RotateCcw className="w-4 h-4 text-amber-300" />
                <span>{t('orders.reorder')}</span>
              </button>
            </div>

          </div>
        )}
      </div>
    );
  };

  return (
    <div className="p-4 sm:p-6 space-y-6 pb-24 max-w-3xl mx-auto" dir={dir}>
      
      {/* Header Info */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-black text-xl text-stone-900 flex items-center gap-2">
            <Package className="w-6 h-6 text-[#005A36]" />
            <span>{t('orders.title')}</span>
          </h1>
          <p className="text-xs text-stone-500 font-medium mt-0.5">
            {t('orders.subtitle')}
          </p>
        </div>

        <button
          onClick={fetchOrders}
          className="text-xs text-stone-700 hover:text-stone-900 bg-stone-100 hover:bg-stone-200 px-3 py-2 rounded-xl border border-stone-200 flex items-center gap-1.5 cursor-pointer transition-colors shadow-2xs"
          title="Refresh"
        >
          <RotateCcw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-[#005A36]' : ''}`} />
          <span className="font-bold">{t('common.refresh') || 'Refresh'}</span>
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
            {t('common.retry') || 'Retry'}
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
            <h3 className="font-black text-base text-stone-900">{t('orders.noOrdersTitle')}</h3>
            <p className="text-xs text-stone-500 max-w-xs mx-auto leading-relaxed">
              {t('orders.noOrdersDesc')}
            </p>
          </div>
          <button
            onClick={() => navigateTo('products')}
            className="bg-[#005A36] hover:bg-[#00472a] text-white text-xs font-bold px-6 py-3.5 rounded-2xl shadow-md cursor-pointer transition-all active:scale-95 inline-flex items-center gap-2"
          >
            <span>{t('cart.startShopping')}</span>
            <ArrowRight className={`w-4 h-4 ${dir === 'rtl' ? 'rotate-180' : ''}`} />
          </button>
        </div>
      )}

      {/* 1. Active Orders Section (Always Top Priority) */}
      {!isLoading && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className={`w-2.5 h-2.5 rounded-full ${activeOrders.length > 0 ? 'bg-emerald-600 animate-pulse' : 'bg-stone-300'}`}></span>
              <h2 className="font-black text-base text-stone-900">{language === 'ar' ? 'الطلبات الحالية' : language === 'de' ? 'Aktuelle Bestellungen' : 'Active Orders'}</h2>
            </div>
            {activeOrders.length > 0 && (
              <span className="text-[11px] font-bold text-[#005A36] bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full">
                {activeOrders.length} {language === 'ar' ? 'طلب قيد التنفيذ' : 'in Bearbeitung'}
              </span>
            )}
          </div>

          {activeOrders.length > 0 ? (
            <div className="space-y-3">
              {activeOrders.map((order) => renderOrderCard(order, false))}
            </div>
          ) : (
            /* When no active orders exist */
            orders.length > 0 && (
              <div className="bg-white rounded-3xl p-6 border border-stone-200/80 shadow-2xs text-center space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-[#005A36] flex items-center justify-center mx-auto border border-emerald-100">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <h3 className="font-bold text-sm text-stone-900">{language === 'ar' ? 'لا توجد طلبات قيد التنفيذ حالياً' : 'Keine aktiven Bestellungen'}</h3>
                  <p className="text-xs text-stone-500 max-w-sm mx-auto leading-relaxed">
                    {language === 'ar' ? 'جميع طلباتك السابقة تم تسليمها بنجاح. يمكنك استعراضها أدناه أو تقديم طلب جديد في أي وقت.' : 'Alle Ihre vorherigen Bestellungen wurden abgeschlossen.'}
                  </p>
                </div>

                <div className="pt-2 flex items-center justify-center gap-2.5 flex-wrap">
                  {pastOrders.length > 0 && (
                    <button
                      onClick={() => setIsPastOrdersOpen(true)}
                      className="bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-bold px-4 py-2.5 rounded-xl border border-stone-200 flex items-center gap-1.5 cursor-pointer transition-colors shadow-2xs"
                    >
                      <History className="w-4 h-4 text-stone-600" />
                      <span>{language === 'ar' ? `عرض الطلبات التي تم تسليمها (${pastOrders.length})` : `Abgeschlossene Bestellungen (${pastOrders.length})`}</span>
                    </button>
                  )}
                  <button
                    onClick={() => navigateTo('products')}
                    className="bg-[#005A36] hover:bg-[#00472a] text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-md flex items-center gap-1.5 cursor-pointer transition-all active:scale-95"
                  >
                    <ShoppingBag className="w-4 h-4 text-amber-300" />
                    <span>{t('cart.startShopping')}</span>
                  </button>
                </div>
              </div>
            )
          )}
        </div>
      )}

      {/* 2. Delivered / Completed Orders Section */}
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
                <h2 className="font-black text-xs sm:text-sm text-stone-800">{language === 'ar' ? 'الطلبات التي تم تسليمها' : 'Abgeschlossene Bestellungen'}</h2>
                <span className="text-[11px] text-stone-500 font-medium">({pastOrders.length})</span>
              </div>
            </div>
            
            <div className="flex items-center gap-1.5 text-xs text-stone-600 font-bold bg-white px-3 py-1.5 rounded-xl border border-stone-200 shadow-2xs">
              <span>{isPastOrdersOpen ? (language === 'ar' ? 'إخفاء' : 'Ausblenden') : (language === 'ar' ? 'عرض السجل' : 'Anzeigen')}</span>
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
            dir={dir}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-2xl bg-amber-50 text-amber-800 flex items-center justify-center border border-amber-200">
                  <MessageSquare className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-sm text-stone-900">
                    {language === 'ar' ? `ملاحظة على الطلب #${activeNoteOrder.orderId || activeNoteOrder.id}` : `Bestellnotiz #${activeNoteOrder.orderId || activeNoteOrder.id}`}
                  </h3>
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
                <span className="font-bold text-blue-900 block">{language === 'ar' ? 'آخر رد من إدارة المتجر:' : 'Antwort vom Kundenservice:'}</span>
                <p className="text-blue-950 bg-white p-2.5 rounded-xl border border-blue-100 leading-relaxed font-medium">
                  {activeNoteOrder.adminReply}
                </p>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmitNote} className="space-y-3.5">
              
              {/* Category Selector */}
              <div className="space-y-1.5">
                <label className="font-bold text-xs text-stone-800 block">{language === 'ar' ? 'نوع الملاحظة أو المشكلة:' : 'Grund / Kategorie:'}</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                  {ISSUE_CATEGORIES.map(cat => {
                    const catLabel = language === 'ar' ? cat.labelAr : language === 'de' ? cat.labelDe : cat.labelEn;
                    return (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => setNoteCategory(cat.id)}
                        className={`text-start p-2.5 rounded-xl border text-xs font-bold flex items-center gap-2 cursor-pointer transition-all ${
                          noteCategory === cat.id
                            ? 'bg-amber-50 border-amber-300 text-amber-950 ring-2 ring-amber-400/20 shadow-2xs'
                            : 'bg-stone-50 hover:bg-stone-100 border-stone-200 text-stone-700'
                        }`}
                      >
                        <span className="text-sm">{cat.icon}</span>
                        <span className="truncate">{catLabel}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Note Textarea */}
              <div className="space-y-1.5">
                <label className="font-bold text-xs text-stone-800 block">{language === 'ar' ? 'تفاصيل الملاحظة:' : 'Beschreibung:'}</label>
                <textarea
                  rows={4}
                  value={noteText}
                  onChange={(e) => setNoteText(e.target.value)}
                  placeholder={language === 'ar' ? 'اكتب هنا تفاصيل المشكلة أو استفسارك...' : 'Beschreiben Sie Ihr Anliegen hier...'}
                  className="w-full bg-stone-50 border border-stone-200 rounded-2xl p-3.5 text-xs text-stone-900 focus:bg-white focus:border-[#005A36] focus:ring-2 focus:ring-[#005A36]/10 outline-hidden resize-none leading-relaxed transition-all placeholder:text-stone-400"
                  required
                />
              </div>

              {/* Modal Actions */}
              <div className="flex items-center gap-2 pt-2 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setActiveNoteOrder(null)}
                  className="flex-1 bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold py-3 rounded-2xl text-xs cursor-pointer transition-colors"
                >
                  {t('common.cancel')}
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
                  <span>{t('common.save')}</span>
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
};
