import React, { useState, useMemo, useEffect, useRef } from 'react';
import { 
  ShoppingBag, 
  Trash2, 
  Plus, 
  Minus, 
  ArrowLeft, 
  Sparkles, 
  Truck, 
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  MapPin,
  Phone,
  User,
  CreditCard,
  Banknote,
  FileText,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  ArrowRight,
  Info,
  Check,
  X,
  Building2,
  Navigation,
  Globe,
  Home,
  Edit3,
  Search,
  Loader2
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { orderService } from '../services/orderService';
import { deliveryService } from '../services/deliveryService';
import { authService } from '../services/authService';
import { CartItem, DeliveryZone } from '../types';
import { OptimizedImage } from '../components/common/OptimizedImage';

// Verified real delivery streets and zones in Greifswald
const GREIFSWALD_STREETS = [
  // 17489 - Innenstadt / Hafen / Fleischervorstadt
  { name: 'Lange Straße', plz: '17489', zoneNameAr: 'البلدة القديمة والمركز' },
  { name: 'Lange Reihe', plz: '17489', zoneNameAr: 'الميناء والبلدة القديمة' },
  { name: 'Domstraße', plz: '17489', zoneNameAr: 'مركز المدينة' },
  { name: 'Fleischmacherstraße', plz: '17489', zoneNameAr: 'مركز المدينة' },
  { name: 'Knopfstraße', plz: '17489', zoneNameAr: 'البلدة القديمة' },
  { name: 'Steinbeckerstraße', plz: '17489', zoneNameAr: 'البلدة القديمة' },
  { name: 'Schuhhagen', plz: '17489', zoneNameAr: 'وسط البلد' },
  { name: 'Baderstraße', plz: '17489', zoneNameAr: 'وسط البلد' },
  { name: 'Fischstraße', plz: '17489', zoneNameAr: 'البلدة القديمة' },
  { name: 'Bachstraße', plz: '17489', zoneNameAr: 'فلايشر فورشتات' },
  { name: 'Rakower Straße', plz: '17489', zoneNameAr: 'فلايشر فورشتات' },
  { name: 'Marienstraße', plz: '17489', zoneNameAr: 'مركز المدينة' },
  { name: 'Am Hafen', plz: '17489', zoneNameAr: 'الميناء' },
  { name: 'Stralsunder Straße', plz: '17489', zoneNameAr: 'شمال غرايفسفالد' },
  { name: 'Friedrich-Loeffler-Straße', plz: '17489', zoneNameAr: 'المركز والجامعة' },
  { name: 'Grimmer Straße', plz: '17489', zoneNameAr: 'غرب غرايفسفالد' },
  { name: 'Brandteichstraße', plz: '17489', zoneNameAr: 'المنطقة الصناعية' },

  // 17491 - Schönwalde I & II / Südstadt
  { name: 'Makarenkostraße', plz: '17491', zoneNameAr: 'شونفالده الثانية' },
  { name: 'Hans-Beimler-Straße', plz: '17491', zoneNameAr: 'شونفالده الأولى' },
  { name: 'Karl-Liebknecht-Ring', plz: '17491', zoneNameAr: 'شونفالده الأولى' },
  { name: 'Ernst-Thälmann-Ring', plz: '17491', zoneNameAr: 'شونفالده الأولى' },
  { name: 'Anklamer Straße', plz: '17491', zoneNameAr: 'الجنوب وشونفالده' },
  { name: 'Tolstoistraße', plz: '17491', zoneNameAr: 'شونفالده الثانية' },
  { name: 'Pappelallee', plz: '17491', zoneNameAr: 'الجنوب' },
  { name: 'Dubnaring', plz: '17491', zoneNameAr: 'شونفالده الثانية' },
  { name: 'Schönwalder Landstraße', plz: '17491', zoneNameAr: 'شونفالده' },
  { name: 'Koitenhäger Landstraße', plz: '17491', zoneNameAr: 'الجنوب الشرقي' },

  // 17493 - Eldena, Wieck & Ladebow
  { name: 'Wolgaster Straße', plz: '17493', zoneNameAr: 'إيلدينا' },
  { name: 'Hainstraße', plz: '17493', zoneNameAr: 'إيلدينا' },
  { name: 'Boddenweg', plz: '17493', zoneNameAr: 'إيلدينا وفيك' },
  { name: 'Dorfstraße', plz: '17493', zoneNameAr: 'فيك والميناء' },
  { name: 'Yachtweg', plz: '17493', zoneNameAr: 'فيك' },
  { name: 'Max-Reimann-Straße', plz: '17493', zoneNameAr: 'لاديبو' },

  // 17498 - Neuenkirchen / Wackerow / Weitenhagen
  { name: 'Marktplatz', plz: '17498', zoneNameAr: 'نوينكيرشن' },
  { name: 'Chausseestraße', plz: '17498', zoneNameAr: 'نوينكيرشن' },
  { name: 'Lindenstraße', plz: '17498', zoneNameAr: 'فايتنهاغن' },
  { name: 'Wackerower Weg', plz: '17498', zoneNameAr: 'فاكيرو' },

  // 17495 - Karlsburg / Züssow / Ranzin
  { name: 'Bahnhofstraße', plz: '17495', zoneNameAr: 'تسوسو' },
  { name: 'Hauptstraße', plz: '17495', zoneNameAr: 'كارلسبورغ' }
];

export const CartScreen: React.FC = () => {
  const { 
    cart, 
    updateQuantity, 
    removeFromCart, 
    clearCart, 
    cartTotal, 
    cartCount, 
    navigateTo, 
    currentUser,
    showToast,
    storeSettings,
    currencySymbol
  } = useApp();

  const [isCheckingOut, setIsCheckingOut] = useState<boolean>(false);
  const [showCheckoutForm, setShowCheckoutForm] = useState<boolean>(false);
  const [orderSuccess, setOrderSuccess] = useState<string | null>(null);
  const [orderSuccessData, setOrderSuccessData] = useState<{ plz: string; address: string; city: string; notes?: string } | null>(null);

  // Synchronous lock ref to prevent rapid double-clicks from submitting duplicate orders
  const isSubmittingRef = useRef<boolean>(false);

  // Dynamic store settings from Firestore
  const isStoreOpen = storeSettings.isOpen !== false;
  const baseDeliveryFeeRate = storeSettings.deliveryFee !== undefined ? storeSettings.deliveryFee : 2.50;
  const freeThreshold = storeSettings.freeDeliveryThreshold !== undefined ? storeSettings.freeDeliveryThreshold : 50.00;
  const baseMinOrderAmount = storeSettings.minOrderAmount !== undefined ? storeSettings.minOrderAmount : 15.00;

  // Active Payment Methods from Firestore
  const enabledPaymentMethods = useMemo(() => {
    const methods: { id: 'cash_on_delivery' | 'card' | 'bank_transfer'; label: string; icon: any }[] = [];
    if (storeSettings.paymentMethods?.cash_on_delivery !== false) {
      methods.push({ id: 'cash_on_delivery', label: 'عند الاستلام', icon: Banknote });
    }
    if (storeSettings.paymentMethods?.card !== false) {
      methods.push({ id: 'card', label: 'بطاقة بنكية', icon: CreditCard });
    }
    if (storeSettings.paymentMethods?.bank_transfer !== false) {
      methods.push({ id: 'bank_transfer', label: 'تحويل بنكي', icon: FileText });
    }
    return methods;
  }, [storeSettings.paymentMethods]);

  // Customer order checkout fields
  const [customerName, setCustomerName] = useState<string>(currentUser?.name || '');
  const [customerPhone, setCustomerPhone] = useState<string>(currentUser?.phone || '');
  
  // Structured Address Fields
  const [customerStreet, setCustomerStreet] = useState<string>(() => {
    return currentUser?.street || currentUser?.address || '';
  });
  const [customerHouseNumber, setCustomerHouseNumber] = useState<string>(() => {
    return currentUser?.houseNumber || '';
  });
  const [customerCity, setCustomerCity] = useState<string>(() => {
    return currentUser?.city || 'غرايفسفالد (Greifswald)';
  });
  const [customerPlz, setCustomerPlz] = useState<string>(() => {
    return currentUser?.plz || currentUser?.postalCode || '17489';
  });
  const [customerDeliveryNotes, setCustomerDeliveryNotes] = useState<string>(() => {
    return currentUser?.deliveryNotes || '';
  });
  const [customerOrderNotes, setCustomerOrderNotes] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<'cash_on_delivery' | 'card' | 'bank_transfer'>('cash_on_delivery');

  // Logged-in user saved address mode toggle
  const hasSavedProfileAddress = useMemo(() => {
    return Boolean(currentUser && (currentUser.street || currentUser.address) && (currentUser.plz || currentUser.postalCode));
  }, [currentUser]);

  const [useSavedAddress, setUseSavedAddress] = useState<boolean>(Boolean(hasSavedProfileAddress));

  // Address Suggestions state
  const [showStreetDropdown, setShowStreetDropdown] = useState<boolean>(false);
  const [streetSearchQuery, setStreetSearchQuery] = useState<string>('');
  const streetInputRef = useRef<HTMLInputElement | null>(null);
  const houseNumberInputRef = useRef<HTMLInputElement | null>(null);
  const plzInputRef = useRef<HTMLInputElement | null>(null);

  // Sync state when currentUser is loaded
  useEffect(() => {
    if (currentUser) {
      if (!customerName) setCustomerName(currentUser.name || '');
      if (!customerPhone) setCustomerPhone(currentUser.phone || '');
      if (!customerStreet) setCustomerStreet(currentUser.street || currentUser.address || '');
      if (!customerHouseNumber) setCustomerHouseNumber(currentUser.houseNumber || '');
      if (!customerPlz) setCustomerPlz(currentUser.plz || currentUser.postalCode || '17489');
      if (!customerCity) setCustomerCity(currentUser.city || 'غرايفسفالد (Greifswald)');
      if (!customerDeliveryNotes) setCustomerDeliveryNotes(currentUser.deliveryNotes || '');
    }
  }, [currentUser]);

  // Delivery Validation State
  const [plzValidation, setPlzValidation] = useState<{
    isValid: boolean;
    zone?: DeliveryZone;
    reason?: string;
    localizedMessage?: { ar: string; de: string };
  } | null>(null);
  const [isValidatingPlz, setIsValidatingPlz] = useState<boolean>(false);
  const [showOutOfServiceModal, setShowOutOfServiceModal] = useState<boolean>(false);

  // Filtered street suggestions in Greifswald
  const filteredStreetSuggestions = useMemo(() => {
    const query = (streetSearchQuery || customerStreet || '').trim().toLowerCase();
    if (!query || query.length < 2) {
      return GREIFSWALD_STREETS.slice(0, 6);
    }
    return GREIFSWALD_STREETS.filter(s => 
      s.name.toLowerCase().includes(query) ||
      s.zoneNameAr.includes(query) ||
      s.plz.includes(query)
    ).slice(0, 8);
  }, [streetSearchQuery, customerStreet]);

  // Validate PLZ with deliveryService whenever customerPlz changes
  useEffect(() => {
    let isMounted = true;
    const validate = async () => {
      const clean = customerPlz.trim();
      if (!clean) {
        setPlzValidation(null);
        return;
      }

      setIsValidatingPlz(true);
      try {
        const result = await deliveryService.validatePlz(clean);
        if (isMounted) {
          setPlzValidation(result);
        }
      } catch (err) {
        console.warn('PLZ validation error:', err);
      } finally {
        if (isMounted) {
          setIsValidatingPlz(false);
        }
      }
    };

    const timer = setTimeout(validate, 150);
    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [customerPlz]);

  // Ensure selected payment method is active
  useEffect(() => {
    if (enabledPaymentMethods.length > 0) {
      const isCurrentActive = enabledPaymentMethods.some(m => m.id === paymentMethod);
      if (!isCurrentActive) {
        setPaymentMethod(enabledPaymentMethods[0].id);
      }
    }
  }, [enabledPaymentMethods, paymentMethod]);

  // Dynamic overrides from validated zone
  const deliveryFeeRate = (plzValidation?.isValid && plzValidation.zone?.deliveryFee !== undefined)
    ? plzValidation.zone.deliveryFee
    : baseDeliveryFeeRate;

  const minOrderAmount = (plzValidation?.isValid && plzValidation.zone?.minOrderAmount !== undefined)
    ? plzValidation.zone.minOrderAmount
    : baseMinOrderAmount;

  // Delivery calculations
  const deliveryFee = cartTotal >= freeThreshold || cartTotal === 0 ? 0 : deliveryFeeRate;
  const finalTotal = cartTotal + deliveryFee;
  const isBelowMinOrder = cartTotal < minOrderAmount;

  // Helper to determine max available stock per item
  const getItemStock = (item: CartItem): number => {
    if (item.product.stock !== undefined && item.product.stock !== null) return item.product.stock;
    if (item.product.stockCount !== undefined && item.product.stockCount !== null) return item.product.stockCount;
    return 999;
  };

  // Select street suggestion handler
  const handleSelectStreetSuggestion = (street: { name: string; plz: string; zoneNameAr: string }) => {
    setCustomerStreet(street.name);
    setStreetSearchQuery(street.name);
    setCustomerPlz(street.plz);
    setShowStreetDropdown(false);
    // Focus house number next
    setTimeout(() => {
      houseNumberInputRef.current?.focus();
    }, 50);
  };

  // Create Order Form Submission
  const handleCreateOrder = async (e: React.FormEvent) => {
    e.preventDefault();

    // Prevent duplicate simultaneous submissions
    if (isSubmittingRef.current || isCheckingOut) {
      return;
    }

    if (cart.length === 0) {
      showToast('سلة المشتريات فارغة');
      return;
    }

    if (!isStoreOpen) {
      showToast('المتجر مغلق حاليًا لاستقبال الطلبات الجديدة / Derzeit geschlossen');
      return;
    }

    // 1. Mandatory Location & Service Area Validation
    const cleanPlz = deliveryService.cleanPlz(customerPlz);
    if (!cleanPlz || cleanPlz.length < 4) {
      showToast('يرجى إدخال رمز بريدي (PLZ) صحيح في غرايفسفالد (Greifswald)');
      return;
    }

    const validation = await deliveryService.validatePlz(cleanPlz);
    if (!validation.isValid) {
      setShowOutOfServiceModal(true);
      return;
    }

    if (isBelowMinOrder) {
      showToast(`الحد الأدنى للطلب هو ${currencySymbol || '€'}${minOrderAmount.toFixed(2)}`);
      return;
    }

    const trimmedName = customerName.trim();
    const trimmedPhone = customerPhone.trim();
    const trimmedStreet = customerStreet.trim();
    const trimmedHouseNumber = customerHouseNumber.trim();

    if (!trimmedName) {
      showToast('يرجى إدخال اسم المستلم');
      return;
    }

    if (!trimmedPhone) {
      showToast('يرجى إدخال رقم الهاتف للتواصل والتوصيل');
      return;
    }

    if (!trimmedStreet) {
      showToast('يرجى إدخال اسم الشارع');
      return;
    }

    if (!trimmedHouseNumber) {
      showToast('يرجى إدخال رقم البناء أو المنزل');
      return;
    }

    if (enabledPaymentMethods.length === 0) {
      showToast('لا توجد طرق دفع متاحة حالياً، يرجى التواصل مع الإدارة');
      return;
    }

    // Format complete clean address
    const fullStreetAddress = `${trimmedStreet} ${trimmedHouseNumber}`.trim();
    const fullFormattedAddress = [
      fullStreetAddress,
      customerDeliveryNotes.trim() ? `(${customerDeliveryNotes.trim()})` : '',
      cleanPlz,
      customerCity.trim() || 'غرايفسفالد'
    ].filter(Boolean).join(', ');

    // Lock synchronous submission
    isSubmittingRef.current = true;
    setIsCheckingOut(true);

    try {
      let initialPaymentStatus: 'pending' | 'paid' | 'awaiting_transfer' = 'pending';
      if (paymentMethod === 'bank_transfer') {
        initialPaymentStatus = 'awaiting_transfer';
      } else if (paymentMethod === 'card') {
        initialPaymentStatus = 'paid';
      }

      // Combine extra notes cleanly
      const combinedNotes = [
        customerOrderNotes.trim(),
        customerDeliveryNotes.trim() ? `[تفاصيل العنوان/الشقة: ${customerDeliveryNotes.trim()}]` : ''
      ].filter(Boolean).join(' | ');

      const order = await orderService.createOrder({
        userId: currentUser?.id || 'guest',
        customerName: trimmedName,
        phone: trimmedPhone,
        address: fullFormattedAddress,
        city: customerCity.trim() || 'غرايفسفالد',
        cityId: validation.zone?.cityId || 'greifswald',
        branchId: validation.zone?.branchId || 'branch-greifswald-main',
        plz: cleanPlz,
        items: [...cart],
        subtotal: cartTotal,
        deliveryFee,
        discount: 0,
        total: finalTotal,
        paymentMethod: paymentMethod,
        paymentStatus: initialPaymentStatus,
        notes: combinedNotes
      });

      if (!order || !order.id) {
        throw new Error('لم يتم استلام تأكيد حفظ الطلب من الخادم السحابي');
      }

      // If user is authenticated, silently persist their address to their profile for future checkouts
      if (currentUser?.id) {
        try {
          await authService.updateProfile({
            name: trimmedName,
            phone: trimmedPhone,
            address: fullFormattedAddress,
            street: trimmedStreet,
            houseNumber: trimmedHouseNumber,
            plz: cleanPlz,
            postalCode: cleanPlz,
            city: customerCity.trim() || 'غرايفسفالد',
            deliveryNotes: customerDeliveryNotes.trim()
          });
        } catch (profileSaveErr) {
          console.warn('Could not update user profile with latest address:', profileSaveErr);
        }
      }

      // Successful order confirmed by Firestore
      setOrderSuccess(order.id);
      setOrderSuccessData({
        plz: cleanPlz,
        address: fullFormattedAddress,
        city: customerCity.trim() || 'غرايفسفالد',
        notes: combinedNotes
      });

      // Clear the cart ONLY upon verified creation success
      clearCart();
      showToast(`تم تأكيد طلبك بنجاح رقم #${order.id}`);
    } catch (e: any) {
      console.error('[CartScreen] Error submitting order:', e);
      const errorMessage = e?.message || 'حدث خطأ أثناء إرسال الطلب، يرجى المحاولة ثانية';
      showToast(errorMessage);
      // NOTE: We deliberately do NOT clear the cart or reset user input if submission failed
    } finally {
      isSubmittingRef.current = false;
      setIsCheckingOut(false);
    }
  };

  // 1. Order Success Screen
  if (orderSuccess) {
    return (
      <div className="p-6 text-center space-y-5 my-8 max-w-lg mx-auto" dir="rtl">
        <div className="w-20 h-20 rounded-3xl bg-emerald-100 text-emerald-800 flex items-center justify-center mx-auto shadow-inner">
          <CheckCircle2 className="w-12 h-12" />
        </div>

        <div className="space-y-1.5">
          <h2 className="text-xl font-black text-stone-900">تم تأكيد طلبك بنجاح!</h2>
          <p className="text-xs text-stone-500">
            رقم الطلب الخاص بك: <span className="font-bold text-stone-900 font-mono text-sm bg-stone-100 px-2 py-0.5 rounded-md">#{orderSuccess}</span>
          </p>
        </div>

        <div className="bg-white p-4.5 rounded-3xl border border-stone-200/80 text-right text-xs space-y-2.5 shadow-2xs">
          <div className="flex justify-between text-stone-600">
            <span>حالة الطلب:</span>
            <span className="font-bold text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-lg border border-emerald-200">
              قيد المراجعة والتجهيز
            </span>
          </div>

          <div className="flex justify-between text-stone-600">
            <span>المدينة والفرع:</span>
            <span className="font-bold text-stone-800">
              غرايفسفالد ({orderSuccessData?.plz || customerPlz}) - فرع غرايفسفالد الرئيسي
            </span>
          </div>

          <div className="flex justify-between text-stone-600">
            <span>عنوان التوصيل المعتمد:</span>
            <span className="font-bold text-stone-800">{orderSuccessData?.address || `${customerStreet} ${customerHouseNumber}`}</span>
          </div>

          <div className="flex justify-between text-stone-600">
            <span>طريقة الدفع:</span>
            <span className="font-bold text-stone-800">
              {paymentMethod === 'cash_on_delivery' 
                ? 'الدفع نقداً عند الاستلام' 
                : paymentMethod === 'card' 
                ? 'بطاقة بنكية' 
                : 'تحويل بنكي'}
            </span>
          </div>

          <div className="flex justify-between text-stone-600 pt-2 border-t border-stone-100">
            <span>المجموع النهائي:</span>
            <span className="font-black text-emerald-800 text-sm font-sans">{currencySymbol || '€'}{finalTotal.toFixed(2)}</span>
          </div>
        </div>

        <div className="flex flex-col gap-2.5 pt-2">
          <button
            onClick={() => {
              setOrderSuccess(null);
              navigateTo('orders');
            }}
            className="w-full bg-emerald-800 hover:bg-emerald-900 text-white font-bold py-3.5 rounded-2xl text-xs sm:text-sm cursor-pointer shadow-md active:scale-98 transition-all"
          >
            الانتقال لصفحة طلباتي
          </button>
          <button
            onClick={() => {
              setOrderSuccess(null);
              navigateTo('home');
            }}
            className="w-full bg-stone-100 hover:bg-stone-200 text-stone-800 font-bold py-3.5 rounded-2xl text-xs sm:text-sm cursor-pointer active:scale-98 transition-all"
          >
            متابعة التسوق في المتجر
          </button>
        </div>
      </div>
    );
  }

  // 2. Empty Cart Screen
  if (cart.length === 0) {
    return (
      <div className="p-8 text-center space-y-4 my-12 max-w-md mx-auto" dir="rtl">
        <div className="w-20 h-20 bg-stone-100 text-stone-400 rounded-3xl flex items-center justify-center mx-auto border border-stone-200/60 shadow-2xs">
          <ShoppingBag className="w-10 h-10" />
        </div>
        <div className="space-y-1.5">
          <h2 className="text-lg font-black text-stone-900">سلة المشتريات فارغة</h2>
          <p className="text-xs text-stone-500 max-w-xs mx-auto leading-relaxed">
            لم تقم بإضافة أي منتجات إلى سلتك بعد. تصفح تشكيلة المؤونة والخيرات السورية وأضف ما تحتاجه!
          </p>
        </div>
        <button
          onClick={() => navigateTo('products')}
          className="bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-bold px-6 py-3.5 rounded-2xl shadow-md cursor-pointer active:scale-95 transition-all inline-flex items-center gap-2"
        >
          <span>تصفح المنتجات الآن</span>
          <ChevronLeft className="w-4 h-4" />
        </button>
      </div>
    );
  }

  // 3. Active Cart Screen
  return (
    <div className="p-4 space-y-4 pb-32 max-w-3xl mx-auto" dir="rtl">
      
      {/* Top Header with City Badge */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-black text-lg text-stone-900">سلة المشتريات</h1>
            <span className="bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10px] font-bold px-2 py-0.5 rounded-lg flex items-center gap-1">
              <MapPin className="w-3 h-3 text-emerald-700" />
              <span>خدمة توصيل غرايفسفالد</span>
            </span>
          </div>
          <p className="text-xs text-stone-500 font-medium">{cartCount} أصناف محددة في طلبك</p>
        </div>

        <button
          onClick={clearCart}
          className="text-xs text-rose-600 hover:text-rose-700 font-bold flex items-center gap-1 cursor-pointer bg-rose-50 px-3 py-1.5 rounded-xl border border-rose-200/60 hover:bg-rose-100 transition-colors"
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span>تفريغ السلة</span>
        </button>
      </div>

      {/* Cart Items List */}
      <div className="space-y-3">
        {cart.map((item) => {
          const maxStock = getItemStock(item);
          const isAtMaxStock = item.quantity >= maxStock;

          return (
            <div 
              key={item.product.id}
              className="bg-white p-3.5 rounded-3xl border border-stone-200/80 shadow-2xs flex items-center justify-between gap-3 transition-all hover:border-stone-300"
            >
              {/* Product Image */}
              <div 
                onClick={() => navigateTo('product-detail', { productId: item.product.id })}
                className="w-18 h-18 rounded-2xl overflow-hidden bg-stone-100 border border-stone-200 shrink-0 cursor-pointer"
              >
                <OptimizedImage 
                  src={item.product.image} 
                  alt={item.product.nameAr || item.product.name}
                  className="w-full h-full object-cover" 
                  targetWidth={140}
                  quality={75}
                />
              </div>

              {/* Product Info */}
              <div className="flex-1 min-w-0 space-y-1">
                <h3 
                  onClick={() => navigateTo('product-detail', { productId: item.product.id })}
                  className="font-bold text-xs sm:text-sm text-stone-900 line-clamp-1 cursor-pointer hover:text-emerald-800 transition-colors"
                >
                  {item.product.nameAr || item.product.name}
                </h3>
                
                <div className="flex items-center gap-2 text-[10px] text-stone-500">
                  <span>{item.product.unit || 'قطعة'}</span>
                  {item.product.weight && <span>• {item.product.weight}</span>}
                  {item.product.brand && <span>• {item.product.brand}</span>}
                </div>

                {/* Stock limit warning if reached */}
                {isAtMaxStock && (
                  <div className="flex items-center gap-1 text-[10px] text-amber-700 font-bold">
                    <AlertTriangle className="w-3 h-3" />
                    <span>الحد الأقصى المتاح بالمخزن ({maxStock})</span>
                  </div>
                )}

                {/* Price Display */}
                <div className="text-xs font-black text-emerald-800 font-sans pt-0.5">
                  {currencySymbol || '€'}{(item.product.price * item.quantity).toFixed(2)}
                  <span className="text-[10px] text-stone-400 font-normal mr-1.5">
                    ({currencySymbol || '€'}{item.product.price.toFixed(2)} للقطعة)
                  </span>
                </div>
              </div>

              {/* Stepper & Delete */}
              <div className="flex flex-col items-end gap-2 shrink-0">
                <button
                  onClick={() => removeFromCart(item.product.id)}
                  className="text-stone-400 hover:text-rose-600 p-1.5 rounded-lg hover:bg-rose-50 cursor-pointer transition-colors"
                  title="حذف الصنف من السلة"
                  aria-label="حذف"
                >
                  <Trash2 className="w-4 h-4" />
                </button>

                {/* Quantity Controls */}
                <div className="flex items-center gap-1.5 bg-stone-50 p-1 rounded-xl border border-stone-200">
                  <button
                    onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                    className="w-7 h-7 rounded-lg bg-white text-stone-700 flex items-center justify-center text-xs font-bold cursor-pointer hover:bg-stone-100 shadow-2xs transition-colors"
                    aria-label="تقليل الكمية"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  
                  <span className="w-6 text-center font-black text-xs font-sans text-stone-900">
                    {item.quantity}
                  </span>
                  
                  <button
                    onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                    disabled={isAtMaxStock}
                    className="w-7 h-7 rounded-lg bg-white text-stone-700 flex items-center justify-center text-xs font-bold cursor-pointer hover:bg-stone-100 shadow-2xs transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                    aria-label="زيادة الكمية"
                    title={isAtMaxStock ? `الحد الأقصى للمخزون هو ${maxStock}` : 'زيادة'}
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Store Closed Alert if isOpen is false */}
      {!isStoreOpen && (
        <div className="bg-rose-50 border border-rose-200 p-4 rounded-3xl text-rose-900 shadow-2xs space-y-1">
          <div className="flex items-center gap-2 font-bold text-xs">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-600 animate-ping" />
            <span>المتجر مغلق حاليًا لاستقبال الطلبات الجديدة</span>
          </div>
          <p className="text-[11px] text-rose-700">
            {storeSettings.closedMessageAr || 'المتجر مغلق حاليًا لاستقبال الطلبات الجديدة. يمكنك تصفح المنتجات وسنعاود الفتح قريبًا!'}
          </p>
          {storeSettings.closedMessageDe && (
            <p className="text-[10px] text-rose-600 font-sans italic border-t border-rose-100 pt-1 mt-1">
              {storeSettings.closedMessageDe}
            </p>
          )}
        </div>
      )}

      {/* Free Delivery Banner Progress */}
      <div className="bg-emerald-50 border border-emerald-200/80 p-3.5 rounded-3xl flex items-center gap-3 text-xs text-emerald-900 shadow-2xs">
        <div className="w-8 h-8 rounded-xl bg-emerald-800 text-amber-300 flex items-center justify-center shrink-0 shadow-2xs">
          <Truck className="w-4 h-4" />
        </div>
        <div className="flex-1">
          {cartTotal >= freeThreshold ? (
            <span className="font-bold block text-emerald-900">
              🎉 تهانينا! لقد حصلت على توصيل مجاني لطلبك.
            </span>
          ) : (
            <div className="space-y-1">
              <span>
                أضف منتجات بقيمة <strong className="font-sans font-bold text-emerald-800">{currencySymbol || '€'}{(freeThreshold - cartTotal).toFixed(2)}</strong> إضافية للحصول على توصيل مجاني!
              </span>
              <div className="w-full bg-emerald-200/70 h-1.5 rounded-full overflow-hidden">
                <div 
                  className="bg-emerald-700 h-full rounded-full transition-all duration-300"
                  style={{ width: `${Math.min(100, (cartTotal / freeThreshold) * 100)}%` }}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Minimum Order Amount Warning */}
      {isBelowMinOrder && (
        <div className="bg-amber-50 border border-amber-200/80 p-3 rounded-2xl flex items-center gap-2 text-xs text-amber-900">
          <span className="font-bold">⚠️ الحد الأدنى للطلب:</span>
          <span>
            يجب أن يصل مجموع السلة إلى <strong className="font-sans font-bold text-amber-950">{currencySymbol || '€'}{minOrderAmount.toFixed(2)}</strong> لإتمام الطلب (متبقي {currencySymbol || '€'}{(minOrderAmount - cartTotal).toFixed(2)}).
          </span>
        </div>
      )}

      {/* Order Calculations Summary */}
      <div className="bg-white p-4 rounded-3xl border border-stone-200/80 shadow-2xs space-y-2.5 text-xs">
        <h4 className="font-black text-xs text-stone-900 border-b border-stone-100 pb-2 flex items-center justify-between">
          <span>ملخص الفاتورة والحساب</span>
          <span className="text-[11px] text-stone-400 font-normal">{cartCount} قطع</span>
        </h4>
        
        <div className="flex justify-between text-stone-600">
          <span>المجموع الفرعي:</span>
          <span className="font-sans font-bold text-stone-900">{currencySymbol || '€'}{cartTotal.toFixed(2)}</span>
        </div>
        
        <div className="flex justify-between text-stone-600">
          <span>رسوم الشحن والتوصيل:</span>
          <span className="font-sans font-bold">
            {deliveryFee === 0 ? (
              <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md font-bold">مجاني</span>
            ) : (
              <span>{currencySymbol || '€'}{deliveryFee.toFixed(2)}</span>
            )}
          </span>
        </div>

        <div className="pt-2 border-t border-stone-100 flex justify-between text-sm font-black text-stone-900">
          <span>المجموع الكلي النهائي:</span>
          <span className="text-emerald-800 font-sans text-base">{currencySymbol || '€'}{finalTotal.toFixed(2)}</span>
        </div>
      </div>

      {/* Checkout Form Section (متابعة وتأكيد الطلب) */}
      {showCheckoutForm ? (
        <form onSubmit={handleCreateOrder} className="bg-white p-4.5 rounded-3xl border border-emerald-300 shadow-sm space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-200">
          <div className="flex items-center justify-between border-b border-stone-100 pb-2.5">
            <h3 className="font-black text-sm text-stone-900 flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-emerald-800" />
              <span>بيانات التوصيل ومتابعة الطلب (Greifswald)</span>
            </h3>
            <button
              type="button"
              onClick={() => setShowCheckoutForm(false)}
              className="text-stone-400 hover:text-stone-700 text-xs font-bold cursor-pointer"
            >
              إلغاء
            </button>
          </div>

          {/* Recipient Personal Details (Name & Phone) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-stone-700 flex items-center gap-1">
                <User className="w-3.5 h-3.5 text-stone-400" />
                <span>اسم المستلم الكامل: *</span>
              </label>
              <input
                type="text"
                required
                placeholder="مثال: أحمد الصالح"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-xs focus:bg-white focus:border-emerald-700 focus:outline-hidden font-bold"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-bold text-stone-700 flex items-center gap-1">
                <Phone className="w-3.5 h-3.5 text-stone-400" />
                <span>رقم الهاتف / الواتساب للتوصيل: *</span>
              </label>
              <input
                type="tel"
                required
                placeholder="مثال: +49 157 12345678"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-xs focus:bg-white focus:border-emerald-700 focus:outline-hidden font-sans font-bold"
              />
            </div>
          </div>

          {/* Section: عنوان التوصيل (Delivery Address) */}
          <div className="bg-stone-50/70 p-3.5 rounded-2xl border border-stone-200/80 space-y-3.5">
            
            {/* Header with Service Note */}
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-stone-900 flex items-center gap-1.5">
                <Navigation className="w-3.5 h-3.5 text-emerald-800" />
                <span>عنوان التوصيل (Lieferadresse)</span>
              </span>
              <span className="text-[10px] bg-emerald-50 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded-md font-bold">
                منطقة الخدمة: Greifswald
              </span>
            </div>

            {/* Saved Address Box for Logged In User */}
            {hasSavedProfileAddress && (
              <div className="bg-white p-3 rounded-xl border border-emerald-200 shadow-2xs space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-emerald-900 flex items-center gap-1">
                    <Home className="w-3.5 h-3.5 text-emerald-700" />
                    <span>العنوان المحفوظ في حسابك:</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => setUseSavedAddress(!useSavedAddress)}
                    className="text-[10px] text-emerald-800 hover:text-emerald-950 font-bold underline cursor-pointer flex items-center gap-0.5"
                  >
                    <Edit3 className="w-3 h-3" />
                    <span>{useSavedAddress ? 'تعديل أو إدخال عنوان مختلف' : 'استخدام العنوان المحفوظ'}</span>
                  </button>
                </div>

                {useSavedAddress && (
                  <div className="bg-stone-50 p-2.5 rounded-lg border border-stone-200 text-xs text-stone-800 space-y-0.5">
                    <div className="font-bold flex items-center gap-1">
                      <span>{customerStreet} {customerHouseNumber}</span>
                      <span className="text-stone-400 font-normal">, {customerPlz} {customerCity}</span>
                    </div>
                    {customerDeliveryNotes && (
                      <div className="text-[10px] text-stone-500">
                        ملاحظات التوصيل: {customerDeliveryNotes}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Structured Address Form (Always shown if guest or if user toggles custom address) */}
            {(!hasSavedProfileAddress || !useSavedAddress) && (
              <div className="space-y-3 pt-1 animate-in fade-in duration-150">
                
                {/* 1. Quick Delivery Zone Selector Chips */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-stone-500 block">
                    اختر منطقتك في غرايفسفالد للملء السريع للرمز البريدي:
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {[
                      { plz: '17489', label: '17489 - المركز والبلدة القديمة' },
                      { plz: '17491', label: '17491 - شونفالده Schönwalde' },
                      { plz: '17493', label: '17493 - إيلدينا وفيك Eldena/Wieck' },
                      { plz: '17498', label: '17498 - نوينكيرشن والمحيط' },
                      { plz: '17495', label: '17495 - تسوسو وكارلسبورغ' }
                    ].map((zone) => {
                      const isSelected = customerPlz === zone.plz;
                      return (
                        <button
                          key={zone.plz}
                          type="button"
                          onClick={() => {
                            setCustomerPlz(zone.plz);
                          }}
                          className={`text-[10px] px-2.5 py-1 rounded-lg border font-bold transition-all cursor-pointer ${
                            isSelected
                              ? 'bg-emerald-800 text-white border-emerald-800 shadow-2xs'
                              : 'bg-white text-stone-700 border-stone-200 hover:bg-stone-100'
                          }`}
                        >
                          {zone.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 2. Street Input with Live Auto-Suggestions Dropdown */}
                <div className="relative space-y-1">
                  <label className="text-[11px] font-bold text-stone-700 flex items-center justify-between">
                    <span>الشارع (Straße): *</span>
                    <span className="text-[10px] text-stone-400 font-normal">اكتب اسم الشارع لاقتراحات فورية</span>
                  </label>
                  
                  <div className="relative">
                    <input
                      ref={streetInputRef}
                      type="text"
                      required
                      placeholder="مثال: Lange Straße أو Makarenkostraße"
                      value={customerStreet}
                      onFocus={() => setShowStreetDropdown(true)}
                      onChange={(e) => {
                        setCustomerStreet(e.target.value);
                        setStreetSearchQuery(e.target.value);
                        setShowStreetDropdown(true);
                      }}
                      className="w-full bg-white border border-stone-200 rounded-xl px-3 py-2 text-xs focus:border-emerald-700 focus:outline-hidden font-bold"
                    />
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 pointer-events-none">
                      <Search className="w-3.5 h-3.5" />
                    </div>
                  </div>

                  {/* Auto-suggestions Dropdown */}
                  {showStreetDropdown && filteredStreetSuggestions.length > 0 && (
                    <div className="absolute z-30 right-0 left-0 mt-1 bg-white border border-stone-200 rounded-2xl shadow-xl overflow-hidden max-h-48 overflow-y-auto">
                      <div className="p-1.5 bg-stone-50 border-b border-stone-100 text-[10px] text-stone-500 font-bold flex justify-between items-center">
                        <span>شوارع ومناطق معتمدة في Greifswald:</span>
                        <button
                          type="button"
                          onClick={() => setShowStreetDropdown(false)}
                          className="text-stone-400 hover:text-stone-700 cursor-pointer"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                      {filteredStreetSuggestions.map((st, idx) => (
                        <div
                          key={idx}
                          onClick={() => handleSelectStreetSuggestion(st)}
                          className="px-3 py-2 text-xs hover:bg-emerald-50 cursor-pointer border-b border-stone-50 last:border-0 flex items-center justify-between transition-colors"
                        >
                          <div>
                            <span className="font-bold text-stone-900 block">{st.name}</span>
                            <span className="text-[10px] text-stone-500">{st.zoneNameAr}</span>
                          </div>
                          <span className="font-mono text-[10px] bg-stone-100 text-stone-700 px-1.5 py-0.5 rounded-md font-bold">
                            PLZ {st.plz}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* 3. House Number and Postal Code (PLZ) Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {/* House Number */}
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-stone-700">رقم البناء / المنزل (Hausnummer): *</label>
                    <input
                      ref={houseNumberInputRef}
                      type="text"
                      required
                      placeholder="مثال: 12 أو 4A"
                      value={customerHouseNumber}
                      onChange={(e) => setCustomerHouseNumber(e.target.value)}
                      className="w-full bg-white border border-stone-200 rounded-xl px-3 py-2 text-xs focus:border-emerald-700 focus:outline-hidden font-bold"
                    />
                  </div>

                  {/* Postal Code PLZ Input with Live Validation */}
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-stone-700 flex items-center justify-between">
                      <span>الرمز البريدي (PLZ): *</span>
                      <span className="text-[10px] text-stone-400 font-mono">17489, 17491...</span>
                    </label>

                    <div className="relative">
                      <input
                        ref={plzInputRef}
                        type="text"
                        required
                        maxLength={5}
                        placeholder="17489"
                        value={customerPlz}
                        onChange={(e) => setCustomerPlz(e.target.value.replace(/\D/g, ''))}
                        className={`w-full bg-white border rounded-xl px-3 py-2 text-xs font-mono font-black focus:outline-hidden transition-colors ${
                          plzValidation?.isValid
                            ? 'border-emerald-500 bg-emerald-50/30'
                            : plzValidation && !plzValidation.isValid
                            ? 'border-rose-400 bg-rose-50/30'
                            : 'border-stone-200 focus:border-emerald-700'
                        }`}
                      />

                      <div className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center gap-1 pointer-events-none">
                        {isValidatingPlz ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin text-stone-400" />
                        ) : plzValidation?.isValid ? (
                          <span className="w-4 h-4 rounded-full bg-emerald-600 text-white flex items-center justify-center">
                            <Check className="w-2.5 h-2.5 stroke-[3]" />
                          </span>
                        ) : plzValidation && !plzValidation.isValid ? (
                          <span className="w-4 h-4 rounded-full bg-rose-600 text-white flex items-center justify-center">
                            <X className="w-2.5 h-2.5 stroke-[3]" />
                          </span>
                        ) : null}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Validation Status Indicator */}
                {plzValidation?.isValid ? (
                  <div className="flex items-center gap-1.5 text-[11px] text-emerald-800 font-bold bg-emerald-50/60 p-2 rounded-xl border border-emerald-200">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>
                      ✓ {plzValidation.zone?.nameAr || `منطقة ${customerPlz}`} (مشمول في خدمة التوصيل المعتمدة)
                    </span>
                  </div>
                ) : plzValidation && !plzValidation.isValid ? (
                  <div className="flex items-center justify-between gap-1 text-[11px] text-rose-700 font-bold bg-rose-50/60 p-2 rounded-xl border border-rose-200">
                    <span className="flex items-center gap-1">
                      <AlertTriangle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                      <span>خارج منطقة التوصيل المعتمدة (Greifswald فقط)</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => setShowOutOfServiceModal(true)}
                      className="text-[10px] text-rose-800 underline cursor-pointer hover:text-rose-950 font-bold"
                    >
                      عرض التفاصيل
                    </button>
                  </div>
                ) : null}

                {/* City and Additional Floor/Apartment Details */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-stone-700">المدينة (Stadt):</label>
                    <input
                      type="text"
                      required
                      placeholder="غرايفسفالد (Greifswald)"
                      value={customerCity}
                      onChange={(e) => setCustomerCity(e.target.value)}
                      className="w-full bg-white border border-stone-200 rounded-xl px-3 py-2 text-xs focus:border-emerald-700 focus:outline-hidden font-bold text-stone-800"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-stone-700">تفاصيل إضافية للعنوان (الطابق / الشقة):</label>
                    <input
                      type="text"
                      placeholder="مثال: الطابق الثاني، شقة 14، جرس باسم الصالح"
                      value={customerDeliveryNotes}
                      onChange={(e) => setCustomerDeliveryNotes(e.target.value)}
                      className="w-full bg-white border border-stone-200 rounded-xl px-3 py-2 text-xs focus:border-emerald-700 focus:outline-hidden font-medium"
                    />
                  </div>
                </div>

              </div>
            )}
          </div>

          {/* Payment Method Selector (Dynamic from Store Settings) */}
          <div className="space-y-1.5 pt-1">
            <label className="text-[11px] font-bold text-stone-700 block">طريقة الدفع المفضلة: *</label>
            {enabledPaymentMethods.length === 0 ? (
              <p className="text-rose-600 text-xs font-bold">لا توجد طرق دفع مفعلة حالياً</p>
            ) : (
              <div className={`grid gap-2 ${
                enabledPaymentMethods.length === 1 
                  ? 'grid-cols-1' 
                  : enabledPaymentMethods.length === 2 
                  ? 'grid-cols-2' 
                  : 'grid-cols-3'
              }`}>
                {enabledPaymentMethods.map((method) => {
                  const Icon = method.icon;
                  const isSelected = paymentMethod === method.id;
                  return (
                    <button
                      key={method.id}
                      type="button"
                      onClick={() => setPaymentMethod(method.id)}
                      className={`p-2.5 rounded-2xl border text-center flex flex-col items-center gap-1 transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-emerald-800 text-white border-emerald-800 shadow-xs'
                          : 'bg-stone-50 text-stone-700 border-stone-200 hover:bg-stone-100'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      <span className="text-[10px] font-bold">{method.label}</span>
                    </button>
                  );
                })}
              </div>
            )}

            {/* Bank Transfer Notes if selected */}
            {paymentMethod === 'bank_transfer' && storeSettings.bankDetails?.iban && (
              <div className="bg-stone-50 border border-stone-200 p-2.5 rounded-xl text-[11px] text-stone-700 space-y-1 font-sans mt-2">
                <div className="font-bold text-stone-900 flex items-center justify-between">
                  <span>{storeSettings.bankDetails.bankName || 'Sparkasse'}</span>
                  <span>{storeSettings.bankDetails.accountHolder}</span>
                </div>
                <div className="font-mono text-emerald-800 font-bold">
                  IBAN: {storeSettings.bankDetails.iban}
                </div>
                {storeSettings.bankDetails.noteAr && (
                  <div className="text-[10px] text-stone-500 font-sans">
                    {storeSettings.bankDetails.noteAr}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Special Order Notes */}
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-stone-700">ملاحظات إضافية للطلب (اختياري):</label>
            <textarea
              rows={2}
              placeholder="مثال: يرجى الاتصال قبل الوصول بـ 15 دقيقة..."
              value={customerOrderNotes}
              onChange={(e) => setCustomerOrderNotes(e.target.value)}
              className="w-full bg-stone-50 border border-stone-200 rounded-xl p-2.5 text-xs focus:bg-white focus:border-emerald-700 focus:outline-hidden resize-none"
            />
          </div>

          {/* Submit Order Button */}
          <button
            type="submit"
            disabled={isCheckingOut || !isStoreOpen || isBelowMinOrder}
            className="w-full bg-emerald-800 hover:bg-emerald-900 text-white font-black py-3.5 px-4 rounded-2xl shadow-lg flex items-center justify-center gap-2 text-xs sm:text-sm cursor-pointer active:scale-98 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isCheckingOut ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-amber-300" />
                <span>جاري تأكيد وحفظ الطلب بأمان في السحابة...</span>
              </>
            ) : (
              <>
                <ShoppingBag className="w-4 h-4 text-amber-300" />
                <span>
                  {!isStoreOpen 
                    ? 'المتجر مغلق حاليًا' 
                    : isBelowMinOrder 
                    ? `الحد الأدنى للطلب ${currencySymbol || '€'}${minOrderAmount.toFixed(2)}` 
                    : `تأكيد وإتمام الطلب الآن • ${currencySymbol || '€'}${finalTotal.toFixed(2)}`}
                </span>
              </>
            )}
          </button>
        </form>
      ) : (
        /* Proceed to Checkout Trigger Button */
        <button
          onClick={() => {
            if (!isStoreOpen) {
              showToast('المتجر مغلق حاليًا لاستقبال الطلبات الجديدة / Derzeit geschlossen');
              return;
            }
            if (isBelowMinOrder) {
              showToast(`الحد الأدنى للطلب هو ${currencySymbol || '€'}${minOrderAmount.toFixed(2)}`);
              return;
            }
            setShowCheckoutForm(true);
          }}
          disabled={!isStoreOpen || isBelowMinOrder}
          className="w-full bg-emerald-800 hover:bg-emerald-900 text-white font-black py-4 px-4 rounded-2xl shadow-lg flex items-center justify-between text-xs sm:text-sm cursor-pointer active:scale-98 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <div className="flex items-center gap-2">
            <ShoppingBag className="w-4 h-4 text-amber-300" />
            <span>
              {!isStoreOpen 
                ? 'المتجر مغلق حاليًا' 
                : isBelowMinOrder 
                ? `الحد الأدنى للطلب ${currencySymbol || '€'}${minOrderAmount.toFixed(2)}` 
                : 'متابعة الطلب وتأكيد العنوان'}
            </span>
          </div>
          <div className="flex items-center gap-1 font-sans">
            <span>{currencySymbol || '€'}{finalTotal.toFixed(2)}</span>
            <ChevronLeft className="w-4 h-4" />
          </div>
        </button>
      )}

      {/* Out of Service Area Modal (Arabic & German) */}
      {showOutOfServiceModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4" dir="rtl">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 space-y-4 shadow-2xl border border-stone-200 animate-in fade-in zoom-in-95 duration-200">
            
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-700 flex items-center justify-center border border-amber-200/70">
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm text-stone-900">
                    التوصيل متاح حاليًا في Greifswald
                  </h3>
                  <p className="text-[11px] text-stone-500 font-sans">
                    Lieferung derzeit nur in Greifswald
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setShowOutOfServiceModal(false)}
                className="text-stone-400 hover:text-stone-700 cursor-pointer p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Arabic Message */}
            <div className="bg-stone-50 p-3.5 rounded-2xl border border-stone-200/80 space-y-1.5 text-xs text-stone-800 leading-relaxed">
              <div className="font-bold text-stone-900 flex items-center gap-1.5">
                <Info className="w-4 h-4 text-emerald-800" />
                <span>رسالة التوصيل والمناطق المتاحة:</span>
              </div>
              <p>
                شكرًا لاهتمامك بـ <strong>Barakamarkt24</strong>. نخدم الآن مدينة <strong>Greifswald</strong> فقط حتى نضمن سرعة التوصيل وجودة الطلب. إذا كنت خارج المدينة، يمكنك تصفح المنتجات، وسنعمل على التوسع لفروع ومناطق أقرب إليك في المستقبل.
              </p>
            </div>

            {/* German Message */}
            <div className="bg-stone-50 p-3.5 rounded-2xl border border-stone-200/80 space-y-1.5 text-xs text-stone-700 leading-relaxed font-sans" dir="ltr">
              <div className="font-bold text-stone-900 flex items-center gap-1.5">
                <Globe className="w-4 h-4 text-emerald-800" />
                <span>Liefergebiet Information:</span>
              </div>
              <p>
                Vielen Dank für Ihr Interesse an <strong>Barakamarkt24</strong>. Aktuell liefern wir nur in <strong>Greifswald</strong> – so können wir schnelle Lieferung und gute Qualität sicherstellen. Wenn Sie außerhalb wohnen, können Sie die Produkte trotzdem ansehen. Eine Erweiterung in weitere Gebiete ist für die Zukunft geplant.
              </p>
            </div>

            {/* Modal Buttons */}
            <div className="flex flex-col sm:flex-row gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  setShowOutOfServiceModal(false);
                  setShowCheckoutForm(true);
                  setTimeout(() => {
                    plzInputRef.current?.focus();
                    plzInputRef.current?.select();
                  }, 100);
                }}
                className="flex-1 bg-emerald-800 hover:bg-emerald-900 text-white font-bold py-3 px-4 rounded-xl cursor-pointer text-xs flex items-center justify-center gap-1.5 shadow-sm transition-all"
              >
                <span>تعديل الرمز البريدي / PLZ ändern</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setShowOutOfServiceModal(false);
                  navigateTo('products');
                }}
                className="px-4 py-3 bg-stone-100 hover:bg-stone-200 text-stone-800 font-bold rounded-xl cursor-pointer text-xs"
              >
                تصفح المنتجات
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
