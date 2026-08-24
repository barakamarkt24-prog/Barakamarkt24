import React, { useState, useEffect, useRef } from 'react';
import { 
  Truck, 
  MapPin, 
  Phone, 
  Navigation, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  Package, 
  DollarSign, 
  CreditCard, 
  Volume2, 
  VolumeX, 
  BellRing, 
  RotateCcw, 
  Check, 
  X, 
  ChevronDown, 
  ChevronUp, 
  ExternalLink,
  ShieldAlert,
  Calendar,
  UserCheck,
  Building,
  ArrowRight,
  Info
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Order, OrderStatus } from '../types';
import { orderService, ORDER_STATUS_LABELS } from '../services/orderService';

export const DriverDashboardScreen: React.FC = () => {
  const { currentUser, navigateTo, showToast, currencySymbol } = useApp();
  
  const [driverOrders, setDriverOrders] = useState<Order[]>([]);
  const [activeTab, setActiveTab] = useState<'active' | 'completed'>('active');
  const [isOnline, setIsOnline] = useState<boolean>(true);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(() => {
    try {
      return localStorage.getItem('baraka_driver_sound') === 'true';
    } catch {
      return true;
    }
  });

  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);
  const [failedOrderModal, setFailedOrderModal] = useState<Order | null>(null);
  const [failReason, setFailReason] = useState<string>('لم يتم الرد على الهاتف');
  const [failCustomNote, setFailCustomNote] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState<string | null>(null);
  const [newOrderAlert, setNewOrderAlert] = useState<Order | null>(null);

  const prevOrdersCountRef = useRef<number>(0);
  const isInitialMountRef = useRef<boolean>(true);
  const audioContextRef = useRef<AudioContext | null>(null);

  // Play audio chime for new assigned orders
  const playDriverAlertSound = () => {
    if (!soundEnabled) return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      if (!audioContextRef.current) {
        audioContextRef.current = new AudioCtx();
      }
      const ctx = audioContextRef.current;
      if (ctx.state === 'suspended') {
        ctx.resume();
      }

      // Two-tone friendly chime (E5 -> G5)
      const now = ctx.currentTime;
      
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(659.25, now); // E5
      gain1.gain.setValueAtTime(0.3, now);
      gain1.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start(now);
      osc1.stop(now + 0.3);

      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(783.99, now + 0.18); // G5
      gain2.gain.setValueAtTime(0.4, now + 0.18);
      gain2.gain.exponentialRampToValueAtTime(0.01, now + 0.6);
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start(now + 0.18);
      osc2.stop(now + 0.6);
    } catch (e) {
      console.warn('Driver alert audio playback error:', e);
    }
  };

  const handleToggleSound = () => {
    const next = !soundEnabled;
    setSoundEnabled(next);
    try {
      localStorage.setItem('baraka_driver_sound', next ? 'true' : 'false');
    } catch {}
    if (next) {
      playDriverAlertSound();
      showToast('تم تفعيل التنبيهات الصوتية للطلبات المعينة');
    } else {
      showToast('تم كتم التنبيهات الصوتية');
    }
  };

  // Real-time subscription to orders assigned to this driver
  useEffect(() => {
    const driverId = currentUser?.id || 'driver_greifswald_01';
    
    const unsubscribe = orderService.subscribeToDriverOrders(driverId, (orders) => {
      setDriverOrders(orders);

      if (!isInitialMountRef.current) {
        const activeNow = orders.filter(o => o.status !== 'delivered' && o.status !== 'cancelled' && o.status !== 'delivery_failed');
        if (activeNow.length > prevOrdersCountRef.current) {
          const newest = activeNow[0];
          if (newest) {
            setNewOrderAlert(newest);
            playDriverAlertSound();
            showToast(`🚚 طلب توصيل جديد تم تعيينه لك #${newest.orderId || newest.id}`);
          }
        }
        prevOrdersCountRef.current = activeNow.length;
      } else {
        const activeInit = orders.filter(o => o.status !== 'delivered' && o.status !== 'cancelled' && o.status !== 'delivery_failed');
        prevOrdersCountRef.current = activeInit.length;
        isInitialMountRef.current = false;
      }
    });

    return () => {
      unsubscribe();
    };
  }, [currentUser?.id, soundEnabled]);

  // Split into active and completed
  const activeOrders = driverOrders.filter(
    o => o.status === 'ready_for_pickup' || 
         o.status === 'on_the_way' || 
         o.status === 'out_for_delivery' ||
         o.status === 'preparing' ||
         o.status === 'confirmed' ||
         o.status === 'received'
  );

  const completedOrders = driverOrders.filter(
    o => o.status === 'delivered' || o.status === 'delivery_failed'
  );

  // Status transitions by Driver
  const handleStartDelivery = async (order: Order) => {
    setIsProcessing(order.id);
    try {
      const success = await orderService.updateDriverOrderStatus(
        order.id, 
        'on_the_way', 
        'انطلق السائق في الطريق لتسليم الطلب للعميل'
      );
      if (success) {
        showToast(`🚚 تم بدء توصيل الطلب #${order.orderId || order.id}`);
      } else {
        showToast('تعذر تحديث حالة الطلب');
      }
    } catch (e: any) {
      showToast(e.message || 'حدث خطأ أثناء التحديث');
    } finally {
      setIsProcessing(null);
    }
  };

  const handleCompleteDelivery = async (order: Order) => {
    const isCod = order.paymentMethod === 'cash_on_delivery' || order.paymentMethod === 'cod';
    const amountStr = `${currencySymbol || '€'}${order.total.toFixed(2)}`;
    
    const confirmMsg = isCod
      ? `هل تؤكد تسليم الطلب للعميل واستلام المبلغ المطلوب (${amountStr}) نقداً؟`
      : `هل تؤكد تسليم الطلب للعميل بنجاح؟`;

    if (!window.confirm(confirmMsg)) return;

    setIsProcessing(order.id);
    try {
      const success = await orderService.updateDriverOrderStatus(
        order.id, 
        'delivered', 
        isCod ? `تم تسليم الطلب للعميل واستلام مبلغ ${amountStr} نقداً` : 'تم تسليم الطلب للعميل بنجاح'
      );
      if (success) {
        showToast(`🎉 تم تأكيد تسليم الطلب #${order.orderId || order.id} بنجاح!`);
      } else {
        showToast('تعذر تأكيد التسليم');
      }
    } catch (e: any) {
      showToast(e.message || 'حدث خطأ أثناء التحديث');
    } finally {
      setIsProcessing(null);
    }
  };

  const handleFailDeliverySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!failedOrderModal) return;

    const fullNote = `${failReason}${failCustomNote.trim() ? ` - ${failCustomNote.trim()}` : ''}`;
    setIsProcessing(failedOrderModal.id);

    try {
      const success = await orderService.updateDriverOrderStatus(
        failedOrderModal.id,
        'delivery_failed',
        `تعذر التسليم: ${fullNote}`
      );
      if (success) {
        showToast(`تم تسجيل تعذر تسليم الطلب #${failedOrderModal.orderId || failedOrderModal.id}`);
        setFailedOrderModal(null);
        setFailCustomNote('');
      } else {
        showToast('تعذر تحديث الحالة');
      }
    } catch (e: any) {
      showToast(e.message || 'حدث خطأ');
    } finally {
      setIsProcessing(null);
    }
  };

  const openNavigationApp = (address: string, plz?: string, city?: string) => {
    const destination = `${address}, ${plz || '17489'} ${city || 'Greifswald'}, Germany`;
    const encoded = encodeURIComponent(destination);
    window.open(`https://www.google.com/maps/search/?api=1&query=${encoded}`, '_blank');
  };

  if (!currentUser) {
    return (
      <div className="p-6 space-y-6 max-w-md mx-auto text-center my-8" dir="rtl">
        <div className="w-20 h-20 bg-stone-100 text-cyan-800 rounded-3xl flex items-center justify-center mx-auto border border-stone-200 shadow-2xs">
          <Truck className="w-10 h-10" />
        </div>

        <div className="space-y-1.5">
          <h2 className="text-lg font-black text-stone-900">بوابة سائقي بركة ماركت</h2>
          <p className="text-xs text-stone-500 leading-relaxed max-w-xs mx-auto">
            سجّل الدخول بحساب السائق الخاص بك لاستعراض وتحديث مهام التوصيل المعينة لك فورياً.
          </p>
        </div>

        <button
          onClick={() => navigateTo('auth')}
          className="w-full bg-cyan-800 hover:bg-cyan-900 text-white font-bold py-3.5 px-4 rounded-2xl text-xs sm:text-sm flex items-center justify-center gap-2 cursor-pointer shadow-md active:scale-98 transition-all"
        >
          <span>تسجيل الدخول للحساب</span>
        </button>

        <button
          onClick={() => navigateTo('home')}
          className="w-full bg-stone-100 text-stone-700 font-bold py-2.5 rounded-2xl text-xs cursor-pointer hover:bg-stone-200 transition-colors"
        >
          العودة للمتجر
        </button>
      </div>
    );
  }

  if (currentUser.role !== 'driver' && currentUser.role !== 'admin') {
    return (
      <div className="p-6 space-y-6 max-w-md mx-auto text-center my-8" dir="rtl">
        <div className="w-20 h-20 bg-amber-50 text-amber-700 rounded-3xl flex items-center justify-center mx-auto border border-amber-200 shadow-2xs">
          <ShieldAlert className="w-10 h-10" />
        </div>

        <div className="space-y-1.5">
          <h2 className="text-lg font-black text-stone-900">صلاحية خاصة بالسائقين</h2>
          <p className="text-xs text-stone-500 leading-relaxed max-w-xs mx-auto">
            حسابك الحالي مسجل كـ ({currentUser.role === 'customer' ? 'عميل' : currentUser.role}). لا تملك صلاحية الوصول إلى لوحة السائق ما لم يتم تعيينك من قبل إدارة المتجر.
          </p>
        </div>

        <button
          onClick={() => navigateTo('home')}
          className="w-full bg-emerald-800 hover:bg-emerald-900 text-white font-bold py-3.5 px-4 rounded-2xl text-xs sm:text-sm flex items-center justify-center gap-2 cursor-pointer shadow-md active:scale-98 transition-all"
        >
          <span>تصفح منتجات المتجر</span>
        </button>

        <button
          onClick={() => navigateTo('profile')}
          className="w-full bg-stone-100 text-stone-700 font-bold py-2.5 rounded-2xl text-xs cursor-pointer hover:bg-stone-200 transition-colors"
        >
          الذهاب لملفي الشخصي
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-100 text-stone-900 pb-28" dir="rtl">
      
      {/* Header Banner */}
      <div className="bg-stone-900 text-white p-4 sticky top-0 z-30 shadow-md border-b border-stone-800">
        <div className="max-w-3xl mx-auto flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-600/30 text-emerald-400 flex items-center justify-center border border-emerald-500/40">
              <Truck className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-extrabold text-sm text-white">لوحة تحكم السائق</h1>
                <span className="bg-emerald-500/20 text-emerald-300 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-500/30">
                  غرايفسفالد
                </span>
              </div>
              <p className="text-xs text-stone-400">
                {currentUser?.name || 'سائق التوصيل المعتمد'} ({currentUser?.phone || '+49 176 9988 7766'})
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Toggle Sound Alerts */}
            <button
              onClick={handleToggleSound}
              className={`p-2 rounded-xl text-xs font-bold flex items-center gap-1 cursor-pointer transition-all border ${
                soundEnabled 
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/40' 
                  : 'bg-stone-800 text-stone-400 border-stone-700'
              }`}
              title={soundEnabled ? 'التنبيهات الصوتية مفعّلة' : 'كتم التنبيهات'}
            >
              {soundEnabled ? <Volume2 className="w-4 h-4 text-amber-400" /> : <VolumeX className="w-4 h-4" />}
            </button>

            {/* Online Status Toggle */}
            <button
              onClick={() => setIsOnline(!isOnline)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all border ${
                isOnline 
                  ? 'bg-emerald-600/20 text-emerald-300 border-emerald-500/40' 
                  : 'bg-rose-900/30 text-rose-300 border-rose-700/40'
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${isOnline ? 'bg-emerald-400 animate-ping' : 'bg-rose-400'}`}></span>
              <span>{isOnline ? 'متاح للتوصيل' : 'استراحة'}</span>
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto p-3 sm:p-4 space-y-4">
        
        {/* Real-time Order Popup Notification */}
        {newOrderAlert && (
          <div className="bg-amber-500 border border-amber-600 rounded-3xl p-4 text-stone-950 shadow-lg flex items-center justify-between gap-3 animate-bounce-short">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-stone-950 text-amber-400 flex items-center justify-center font-bold">
                <BellRing className="w-6 h-6 animate-pulse" />
              </div>
              <div>
                <span className="font-black text-sm block">وصلك طلب توصيل جديد الآن! #{newOrderAlert.orderId || newOrderAlert.id}</span>
                <span className="text-xs font-bold text-stone-900">
                  العميل: {newOrderAlert.customerName || 'عميل'} • {newOrderAlert.address} (PLZ {newOrderAlert.plz || '17489'})
                </span>
              </div>
            </div>
            <button
              onClick={() => setNewOrderAlert(null)}
              className="bg-stone-950 hover:bg-stone-800 text-white font-bold text-xs px-3 py-2 rounded-xl cursor-pointer"
            >
              استلام والاطلاع
            </button>
          </div>
        )}

        {/* Tab Navigation */}
        <div className="grid grid-cols-2 gap-2 bg-stone-200/80 p-1.5 rounded-2xl">
          <button
            onClick={() => setActiveTab('active')}
            className={`py-2.5 px-4 rounded-xl font-black text-xs transition-all flex items-center justify-center gap-2 cursor-pointer ${
              activeTab === 'active' 
                ? 'bg-white text-emerald-900 shadow-sm' 
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <Truck className="w-4 h-4" />
            <span>الطلبات النشطة للتوصيل</span>
            {activeOrders.length > 0 && (
              <span className="bg-emerald-700 text-white text-[11px] font-bold px-2 py-0.5 rounded-full font-mono">
                {activeOrders.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('completed')}
            className={`py-2.5 px-4 rounded-xl font-black text-xs transition-all flex items-center justify-center gap-2 cursor-pointer ${
              activeTab === 'completed' 
                ? 'bg-white text-stone-900 shadow-sm' 
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>الطلبات المكتملة</span>
            {completedOrders.length > 0 && (
              <span className="bg-stone-300 text-stone-800 text-[11px] font-bold px-2 py-0.5 rounded-full font-mono">
                {completedOrders.length}
              </span>
            )}
          </button>
        </div>

        {/* ======================================================== */}
        {/* TAB 1: ACTIVE ORDERS                                     */}
        {/* ======================================================== */}
        {activeTab === 'active' && (
          <div className="space-y-3.5">
            {activeOrders.length === 0 ? (
              <div className="bg-white rounded-3xl p-8 text-center border border-stone-200 shadow-2xs space-y-3">
                <div className="w-16 h-16 bg-emerald-50 text-emerald-700 rounded-full flex items-center justify-center mx-auto">
                  <Check className="w-8 h-8" />
                </div>
                <h3 className="font-extrabold text-base text-stone-800">لا توجد طلبات نشطة معينة لك حالياً</h3>
                <p className="text-xs text-stone-500 max-w-sm mx-auto leading-relaxed">
                  أنت في وضع الجاهزية. عند قيام الإدارة بتعيين طلب جديد لك في غرايفسفالد، سيصلك تنبيه فوري هنا مباشرة.
                </p>
              </div>
            ) : (
              activeOrders.map((ord) => {
                const isCod = ord.paymentMethod === 'cash_on_delivery' || ord.paymentMethod === 'cod';
                const isExpanded = expandedOrderId === ord.id;
                const phoneClean = ord.phone ? ord.phone.replace(/[^0-9+]/g, '') : '';

                return (
                  <div 
                    key={ord.id}
                    className="bg-white rounded-3xl border border-stone-200/90 shadow-sm overflow-hidden transition-all"
                  >
                    {/* Header with Order Status Badge */}
                    <div className="p-4 border-b border-stone-100 flex items-center justify-between flex-wrap gap-2 bg-stone-50/60">
                      <div className="flex items-center gap-2">
                        <span className="font-black text-sm text-stone-900 font-mono">
                          #{ord.orderId || ord.id}
                        </span>
                        <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${
                          ord.status === 'on_the_way' || ord.status === 'out_for_delivery'
                            ? 'bg-cyan-100 text-cyan-900 border-cyan-300 animate-pulse'
                            : ord.status === 'ready_for_pickup'
                            ? 'bg-amber-100 text-amber-900 border-amber-300'
                            : 'bg-purple-100 text-purple-900 border-purple-300'
                        }`}>
                          {ORDER_STATUS_LABELS[ord.status] || ord.status}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 text-xs text-stone-500 font-sans">
                        <Clock className="w-3.5 h-3.5" />
                        <span>{ord.createdAt}</span>
                      </div>
                    </div>

                    {/* Customer & Location Details */}
                    <div className="p-4 space-y-3.5">
                      
                      {/* Customer info & Call button */}
                      <div className="flex items-center justify-between bg-stone-50 p-3 rounded-2xl border border-stone-200/70">
                        <div>
                          <span className="text-[11px] text-stone-500 block font-medium">العميل المستلم:</span>
                          <span className="font-bold text-sm text-stone-900">{ord.customerName || 'عميل بركة ماركت'}</span>
                          {ord.phone && (
                            <span className="text-xs text-stone-600 block font-sans mt-0.5" dir="ltr">{ord.phone}</span>
                          )}
                        </div>

                        {ord.phone && (
                          <a
                            href={`tel:${phoneClean}`}
                            className="bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold px-3.5 py-2 rounded-xl flex items-center gap-1.5 shadow-xs transition-colors"
                          >
                            <Phone className="w-4 h-4" />
                            <span>اتصال بالعميل</span>
                          </a>
                        )}
                      </div>

                      {/* Full Address with GPS / Google Maps Link */}
                      <div className="bg-stone-50 p-3.5 rounded-2xl border border-stone-200/70 space-y-2">
                        <div className="flex items-start justify-between gap-2">
                          <div className="space-y-1">
                            <span className="text-[11px] text-stone-500 font-medium flex items-center gap-1">
                              <MapPin className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                              <span>عنوان التوصيل (غرايفسفالد):</span>
                            </span>
                            <p className="font-bold text-xs text-stone-900 leading-relaxed">
                              {ord.address || 'العنوان غير محدد'}
                            </p>
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="bg-emerald-100 text-emerald-900 font-mono font-bold text-[10px] px-2 py-0.5 rounded-md border border-emerald-300">
                                PLZ: {ord.plz || '17489'}
                              </span>
                              <span className="bg-stone-200 text-stone-800 font-bold text-[10px] px-2 py-0.5 rounded-md">
                                {ord.city || 'Greifswald'}
                              </span>
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => openNavigationApp(ord.address, ord.plz, ord.city)}
                            className="bg-blue-700 hover:bg-blue-800 text-white text-xs font-bold px-3 py-2 rounded-xl flex items-center gap-1.5 shadow-xs shrink-0 cursor-pointer"
                          >
                            <Navigation className="w-3.5 h-3.5" />
                            <span>فتح الخريطة (GPS)</span>
                          </button>
                        </div>

                        {ord.notes && (
                          <div className="pt-2 border-t border-stone-200/60 text-xs text-amber-900 bg-amber-50/80 p-2 rounded-xl flex items-start gap-1.5">
                            <Info className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                            <span><strong>ملاحظات العميل:</strong> {ord.notes}</span>
                          </div>
                        )}
                      </div>

                      {/* Payment & Cash Collection Box */}
                      <div className={`p-3.5 rounded-2xl border ${
                        isCod 
                          ? 'bg-amber-50/90 border-amber-300 text-amber-950' 
                          : 'bg-emerald-50/80 border-emerald-300 text-emerald-950'
                      }`}>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            {isCod ? (
                              <DollarSign className="w-5 h-5 text-amber-700" />
                            ) : (
                              <CreditCard className="w-5 h-5 text-emerald-700" />
                            )}
                            <div>
                              <span className="text-[11px] font-bold block">
                                {isCod ? 'طريقة الدفع: الدفع عند الاستلام (COD)' : 'طريقة الدفع: مدفوع مسبقاً (بطاقة/تحويل)'}
                              </span>
                              <span className="text-xs font-extrabold">
                                {isCod ? 'المبلغ المطلوب تحصيله نقداً:' : 'حالة الحساب مع العميل:'}
                              </span>
                            </div>
                          </div>

                          <div className="text-left">
                            <span className={`text-base font-black font-sans ${isCod ? 'text-amber-800' : 'text-emerald-800'}`}>
                              {currencySymbol || '€'}{ord.total.toFixed(2)}
                            </span>
                            <span className="block text-[10px] font-bold">
                              {isCod ? 'يُرجى تحصيل المبلغ' : '✓ خالص ومسدد'}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Items Accordion Toggle */}
                      <div>
                        <button
                          type="button"
                          onClick={() => setExpandedOrderId(isExpanded ? null : ord.id)}
                          className="w-full flex items-center justify-between text-xs font-bold text-stone-600 hover:text-stone-900 p-2 rounded-xl hover:bg-stone-50 cursor-pointer"
                        >
                          <span className="flex items-center gap-1.5">
                            <Package className="w-4 h-4 text-stone-500" />
                            <span>محتويات الطلب ({ord.items.length} أصناف)</span>
                          </span>
                          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </button>

                        {isExpanded && (
                          <div className="mt-2 space-y-1.5 bg-stone-50 p-2.5 rounded-2xl border border-stone-200">
                            {ord.items.map((item, idx) => (
                              <div key={idx} className="flex justify-between items-center text-xs text-stone-700 bg-white p-2 rounded-xl border border-stone-100">
                                <span className="font-bold">{item.quantity}x {item.product.nameAr || item.product.name}</span>
                                <span className="font-mono text-stone-600 font-bold">{currencySymbol || '€'}{(item.product.price * item.quantity).toFixed(2)}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* ACTION BUTTONS */}
                      <div className="pt-2 border-t border-stone-100 flex flex-col sm:flex-row gap-2">
                        {/* Step 1: Start Delivery */}
                        {(ord.status === 'ready_for_pickup' || ord.status === 'preparing' || ord.status === 'confirmed' || ord.status === 'received') && (
                          <button
                            type="button"
                            disabled={isProcessing === ord.id}
                            onClick={() => handleStartDelivery(ord)}
                            className="flex-1 bg-cyan-700 hover:bg-cyan-800 active:scale-98 text-white font-black text-xs py-3 px-4 rounded-2xl flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer disabled:opacity-50"
                          >
                            <Truck className="w-4 h-4" />
                            <span>بدء التوصيل والانطلاق للعميل 🚚</span>
                          </button>
                        )}

                        {/* Step 2: Complete Delivery */}
                        {(ord.status === 'on_the_way' || ord.status === 'out_for_delivery') && (
                          <button
                            type="button"
                            disabled={isProcessing === ord.id}
                            onClick={() => handleCompleteDelivery(ord)}
                            className="flex-1 bg-emerald-700 hover:bg-emerald-800 active:scale-98 text-white font-black text-xs py-3 px-4 rounded-2xl flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer disabled:opacity-50"
                          >
                            <CheckCircle2 className="w-4 h-4" />
                            <span>تم تسليم الطلب للعميل بنجاح ✓</span>
                          </button>
                        )}

                        {/* Failure / Issue Option */}
                        <button
                          type="button"
                          onClick={() => setFailedOrderModal(ord)}
                          className="bg-stone-100 hover:bg-rose-50 text-stone-700 hover:text-rose-700 border border-stone-200 hover:border-rose-200 text-xs font-bold py-2.5 px-3.5 rounded-2xl flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                        >
                          <AlertCircle className="w-3.5 h-3.5" />
                          <span>تعذر التسليم</span>
                        </button>
                      </div>

                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 2: COMPLETED ORDERS                                  */}
        {/* ======================================================== */}
        {activeTab === 'completed' && (
          <div className="space-y-3">
            {completedOrders.length === 0 ? (
              <div className="bg-white rounded-3xl p-8 text-center border border-stone-200 shadow-2xs space-y-2">
                <Clock className="w-8 h-8 text-stone-400 mx-auto" />
                <h3 className="font-bold text-sm text-stone-700">لا توجد طلبات مكتملة بعد</h3>
                <p className="text-xs text-stone-500">الطلبات التي تقوم بتسليمها ستظهر في هذا السجل اليومي.</p>
              </div>
            ) : (
              completedOrders.map((ord) => (
                <div 
                  key={ord.id}
                  className="bg-white p-3.5 rounded-2xl border border-stone-200 shadow-2xs flex items-center justify-between gap-3"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-xs text-stone-900 font-mono">#{ord.orderId || ord.id}</span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${
                        ord.status === 'delivered' 
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-200' 
                          : 'bg-rose-50 text-rose-800 border-rose-200'
                      }`}>
                        {ORDER_STATUS_LABELS[ord.status] || ord.status}
                      </span>
                    </div>
                    <p className="text-xs text-stone-600">{ord.customerName} • {ord.address}</p>
                    <span className="text-[11px] text-stone-400 font-sans block">{ord.updatedAt || ord.createdAt}</span>
                  </div>

                  <div className="text-left font-black text-sm text-emerald-800 font-sans">
                    {currencySymbol || '€'}{ord.total.toFixed(2)}
                  </div>
                </div>
              ))
            )}
          </div>
        )}

      </div>

      {/* ======================================================== */}
      {/* MODAL: DELIVERY FAILED REASON                            */}
      {/* ======================================================== */}
      {failedOrderModal && (
        <div className="fixed inset-0 bg-stone-950/70 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white w-full max-w-md rounded-3xl p-5 shadow-2xl border border-stone-200 space-y-4" dir="rtl">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <div className="flex items-center gap-2 text-rose-700">
                <AlertCircle className="w-5 h-5" />
                <h3 className="font-extrabold text-sm text-stone-900">تسجيل سبب تعذر تسليم الطلب</h3>
              </div>
              <button 
                onClick={() => setFailedOrderModal(null)}
                className="text-stone-400 hover:text-stone-700 p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleFailDeliverySubmit} className="space-y-3.5">
              <div>
                <label className="text-xs font-bold text-stone-800 block mb-1.5">السبب الرئيسي:</label>
                <select
                  value={failReason}
                  onChange={(e) => setFailReason(e.target.value)}
                  className="w-full bg-stone-50 border border-stone-200 rounded-xl p-2.5 text-xs font-bold text-stone-900 outline-hidden focus:border-rose-600 cursor-pointer"
                >
                  <option value="لم يتم الرد على الهاتف">لم يتم الرد على الهاتف بعد عدة محاولات</option>
                  <option value="العنوان غير صحيح أو غير موجود">العنوان غير صحيح أو تعذر الوصول إليه</option>
                  <option value="العميل غير متواجد في المنزل">العميل غير متواجد في المنزل</option>
                  <option value="رفض العميل استلام الطلب">رفض العميل استلام الطلب</option>
                  <option value="مشكلة في تحصيل المبلغ النقدي">مشكلة في تحصيل المبلغ النقدي</option>
                  <option value="أخرى">أسباب أخرى</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-stone-800 block mb-1.5">تفاصيل أو ملاحظات إضافية:</label>
                <textarea
                  value={failCustomNote}
                  onChange={(e) => setFailCustomNote(e.target.value)}
                  placeholder="اكتب أي ملاحظة لتوضيح الموقف للإدارة..."
                  rows={3}
                  className="w-full bg-stone-50 border border-stone-200 rounded-xl p-2.5 text-xs text-stone-900 outline-hidden focus:border-rose-600"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setFailedOrderModal(null)}
                  className="px-4 py-2 text-xs font-bold text-stone-600 hover:bg-stone-100 rounded-xl cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={isProcessing === failedOrderModal.id}
                  className="px-4 py-2 text-xs font-black bg-rose-700 hover:bg-rose-800 text-white rounded-xl cursor-pointer shadow-xs"
                >
                  تأكيد تسجيل تعذر التسليم
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
