import React, { useState, useEffect, useRef } from 'react';
import { 
  ShieldCheck, 
  Package, 
  ShoppingBag, 
  TrendingUp, 
  Plus, 
  Trash2, 
  Edit3, 
  Check, 
  X, 
  Grid, 
  Layers, 
  RotateCcw,
  Eye,
  EyeOff,
  Star,
  CheckCircle2,
  Clock,
  AlertCircle,
  Upload,
  Database,
  Cloud,
  Lock,
  ArrowUp,
  ArrowDown,
  ChevronDown,
  ChevronUp,
  FolderTree,
  Search,
  Filter,
  Tag,
  Percent,
  Image as ImageIcon,
  Boxes,
  Sparkles,
  ExternalLink,
  Users,
  Gift,
  Ticket,
  Share2,
  Bell,
  BellRing,
  Volume2,
  VolumeX,
  CheckCheck,
  Settings,
  Send,
  Save,
  CheckCircle,
  UserCheck,
  DollarSign
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Product, Order, OrderStatus, Category, Subcategory, User, Coupon, Offer, AppNotification, Referral } from '../types';
import { productService } from '../services/productService';
import { orderService } from '../services/orderService';
import { adminService, AppSettings } from '../services/adminService';

const COMMON_UNITS = ['قطعة', 'كغ', '500غ', '250غ', '100غ', 'علبة', 'برطمان', 'عبوة', 'لتر', 'كيس', 'باقة'];

export type AdminTab = 
  | 'dashboard' 
  | 'products' 
  | 'categories' 
  | 'orders' 
  | 'users' 
  | 'offers' 
  | 'coupons' 
  | 'referrals' 
  | 'notifications' 
  | 'settings';

export const AdminDashboardScreen: React.FC = () => {
  const { 
    products, 
    categories, 
    subcategories, 
    reloadProducts, 
    reloadCategories,
    reloadSettings,
    storeSettings,
    showToast, 
    navigateTo, 
    currentUser,
    currencySymbol 
  } = useApp();

  // Tab State
  const [activeTab, setActiveTab] = useState<AdminTab>('dashboard');

  // Orders State
  const [orders, setOrders] = useState<Order[]>([]);
  const [orderStatusFilter, setOrderStatusFilter] = useState<string>('all');

  // Users State
  const [usersList, setUsersList] = useState<User[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState<boolean>(false);
  const [userSearch, setUserSearch] = useState<string>('');

  // Coupons State
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [isCouponModalOpen, setIsCouponModalOpen] = useState<boolean>(false);
  const [couponCode, setCouponCode] = useState<string>('');
  const [couponDiscount, setCouponDiscount] = useState<string>('10');
  const [couponMinSpend, setCouponMinSpend] = useState<string>('20');
  const [couponValidUntil, setCouponValidUntil] = useState<string>('2026-12-31');
  const [couponDesc, setCouponDesc] = useState<string>('');

  // Offers State
  const [offers, setOffers] = useState<Offer[]>([]);
  const [isOfferModalOpen, setIsOfferModalOpen] = useState<boolean>(false);
  const [offerTitle, setOfferTitle] = useState<string>('');
  const [offerSubtitle, setOfferSubtitle] = useState<string>('');
  const [offerImage, setOfferImage] = useState<string>('https://images.unsplash.com/photo-1541544741938-0af808871cc0?auto=format&fit=crop&w=1200&q=80');
  const [offerTag, setOfferTag] = useState<string>('عرض خاص');

  // Referrals State
  const [referrals, setReferrals] = useState<Referral[]>([]);

  // Notifications State
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [notifTitle, setNotifTitle] = useState<string>('');
  const [notifMessage, setNotifMessage] = useState<string>('');
  const [notifType, setNotifType] = useState<'promo' | 'system' | 'order'>('promo');
  const [isSendingNotif, setIsSendingNotif] = useState<boolean>(false);
  const [soundAlertsEnabled, setSoundAlertsEnabled] = useState<boolean>(() => {
    try {
      return localStorage.getItem('baraka_admin_sound_alerts') === 'true';
    } catch {
      return false;
    }
  });
  const [newOrderAlert, setNewOrderAlert] = useState<Order | null>(null);
  const isInitialLoadRef = useRef<boolean>(true);
  const prevOrderCountRef = useRef<number>(0);
  const audioContextRef = useRef<AudioContext | null>(null);

  // Play audio chime when a new order arrives
  const playNewOrderSound = () => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      
      const ctx = audioContextRef.current || new AudioCtx();
      audioContextRef.current = ctx;
      
      if (ctx.state === 'suspended') {
        ctx.resume();
      }

      // Pleasant 3-note chime: C5 (523Hz) -> E5 (659Hz) -> G5 (784Hz) -> C6 (1046Hz)
      const notes = [523.25, 659.25, 783.99, 1046.50];
      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.14);
        
        gain.gain.setValueAtTime(0, ctx.currentTime + idx * 0.14);
        gain.gain.linearRampToValueAtTime(0.25, ctx.currentTime + idx * 0.14 + 0.03);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + idx * 0.14 + 0.4);
        
        osc.connect(gain);
        gain.connect(ctx.destination);
        
        osc.start(ctx.currentTime + idx * 0.14);
        osc.stop(ctx.currentTime + idx * 0.14 + 0.45);
      });
    } catch (e) {
      console.warn('Audio alert could not be played:', e);
    }
  };

  // Toggle Sound Notifications
  const handleToggleSoundAlerts = () => {
    const nextState = !soundAlertsEnabled;
    setSoundAlertsEnabled(nextState);
    try {
      localStorage.setItem('baraka_admin_sound_alerts', nextState ? 'true' : 'false');
    } catch (e) {
      console.warn(e);
    }
    if (nextState) {
      playNewOrderSound();
      showToast('🔊 تم تفعيل التنبيهات الصوتية للطلبات الجديدة بنجاح!');
    } else {
      showToast('🔇 تم كتم التنبيهات الصوتية للطلبات');
    }
  };

  // Settings State
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [isSavingSettings, setIsSavingSettings] = useState<boolean>(false);

  // Category Modal State
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState<boolean>(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [catName, setCatName] = useState('');
  const [catNameEn, setCatNameEn] = useState('');
  const [catNameDe, setCatNameDe] = useState('');
  const [catDescription, setCatDescription] = useState('');
  const [catImage, setCatImage] = useState('https://images.unsplash.com/photo-1552767059-ce182ead6c1b?auto=format&fit=crop&w=600&q=80');
  const [catSortOrder, setCatSortOrder] = useState('1');
  const [catIsActive, setCatIsActive] = useState(true);

  // Subcategory Modal State
  const [isSubcategoryModalOpen, setIsSubcategoryModalOpen] = useState<boolean>(false);
  const [editingSubcategory, setEditingSubcategory] = useState<Subcategory | null>(null);
  const [subCategoryId, setSubCategoryId] = useState('');
  const [subName, setSubName] = useState('');
  const [subNameEn, setSubNameEn] = useState('');
  const [subImage, setSubImage] = useState('');
  const [subSortOrder, setSubSortOrder] = useState('1');
  const [subIsActive, setSubIsActive] = useState(true);
  const [selectedCatFilter, setSelectedCatFilter] = useState<string>('all');

  // Product Filter & Search State
  const [prodSearch, setProdSearch] = useState('');
  const [prodCatFilter, setProdCatFilter] = useState('all');
  const [prodSubFilter, setProdSubFilter] = useState('all');
  const [prodStatusFilter, setProdStatusFilter] = useState<'all' | 'available' | 'hidden' | 'out_of_stock' | 'featured' | 'discount'>('all');

  // Product Modal State
  const [isProductModalOpen, setIsProductModalOpen] = useState<boolean>(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  
  // Product Form Fields
  const [prodName, setProdName] = useState('');
  const [prodNameEn, setProdNameEn] = useState('');
  const [prodNameDe, setProdNameDe] = useState('');
  const [prodDesc, setProdDesc] = useState('');
  const [prodPrice, setProdPrice] = useState('');
  const [prodOldPrice, setProdOldPrice] = useState('');
  const [prodDiscount, setProdDiscount] = useState('');
  const [prodCategory, setProdCategory] = useState('');
  const [prodSubCategory, setProdSubCategory] = useState('');
  const [prodStock, setProdStock] = useState('25');
  const [prodUnit, setProdUnit] = useState('قطعة');
  const [prodWeight, setProdWeight] = useState('500g');
  const [prodOrigin, setProdOrigin] = useState('حلب');
  const [prodBrand, setProdBrand] = useState('بركة ماركت');
  const [prodImages, setProdImages] = useState<string[]>([]);
  const [newImageUrl, setNewImageUrl] = useState('');
  const [prodIsAvailable, setProdIsAvailable] = useState(true);
  const [prodIsFeatured, setProdIsFeatured] = useState(false);
  const [prodIsBestseller, setProdIsBestseller] = useState(false);
  const [prodBadge, setProdBadge] = useState('');
  const [prodIngredients, setProdIngredients] = useState('');
  const [prodStorage, setProdStorage] = useState('');
  const [isUploadingImage, setIsUploadingImage] = useState<boolean>(false);

  // Quick Price Edit Inline State
  const [quickEditId, setQuickEditId] = useState<string | null>(null);
  const [quickPrice, setQuickPrice] = useState<string>('');
  const [quickStock, setQuickStock] = useState<string>('');

  // Initial Fetching
  const fetchAllData = async () => {
    try {
      const [ords, usrs, cpns, ofrs, notifs, refs, sttngs] = await Promise.all([
        orderService.getOrders('all'),
        adminService.getAllUsers(),
        adminService.getAllCoupons(),
        adminService.getAllOffers(),
        adminService.getAllNotifications(),
        adminService.getAllReferrals(),
        adminService.getSettings()
      ]);
      setOrders(ords);
      setUsersList(usrs);
      setCoupons(cpns);
      setOffers(ofrs);
      setNotifications(notifs);
      setReferrals(refs);
      setSettings(sttngs);
    } catch (e) {
      console.warn('Error loading admin data:', e);
    }
  };

  useEffect(() => {
    fetchAllData();

    // Attach real-time subscription for incoming orders
    const unsubscribe = orderService.subscribeToOrders((realtimeOrders) => {
      setOrders(realtimeOrders);

      if (isInitialLoadRef.current) {
        isInitialLoadRef.current = false;
        prevOrderCountRef.current = realtimeOrders.length;
        return;
      }

      // Check if a new order arrived
      if (realtimeOrders.length > prevOrderCountRef.current) {
        const latestOrder = realtimeOrders[0];
        if (latestOrder) {
          setNewOrderAlert(latestOrder);

          // Play sound if user enabled sound notifications
          if (soundAlertsEnabled) {
            playNewOrderSound();
          }

          // Show immediate Toast
          showToast(`🔔 طلب جديد #${latestOrder.orderId || latestOrder.id} بقيمة €${latestOrder.total.toFixed(2)} وصل الآن!`);

          // Refresh notifications list to include new order notification
          adminService.getAllNotifications().then(updated => {
            setNotifications(updated);
          }).catch(() => {});
        }
      }

      prevOrderCountRef.current = realtimeOrders.length;
    });

    return () => {
      unsubscribe();
    };
  }, [soundAlertsEnabled]);

  // Check Admin Authorization strictly
  if (currentUser?.role !== 'admin') {
    return (
      <div className="p-6 text-center space-y-4 my-12 max-w-md mx-auto" dir="rtl">
        <div className="w-16 h-16 bg-rose-50 text-rose-600 rounded-3xl flex items-center justify-center mx-auto border border-rose-200">
          <Lock className="w-8 h-8" />
        </div>
        <h2 className="text-base font-black text-stone-900">منطقة مقيدة - خاصة بإدارة المتجر فقط</h2>
        <p className="text-xs text-stone-500 max-w-xs mx-auto leading-relaxed">
          هذه الصفحة مخصصة لمدير النظام (role: admin). لا تملك الصلاحية للوصول إلى لوحة التحكم.
        </p>
        <button
          onClick={() => navigateTo('home')}
          className="bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-xs px-5 py-2.5 rounded-xl cursor-pointer shadow-sm transition-all"
        >
          العودة للمتجر
        </button>
      </div>
    );
  }

  // ===================================
  // --- Orders Handlers ---
  // ===================================
  const handleUpdateOrderStatus = async (orderId: string, newStatus: OrderStatus) => {
    const success = await orderService.updateOrderStatus(orderId, newStatus);
    if (success) {
      setOrders(prev => prev.map(o => (o.id === orderId || o.orderId === orderId) ? { ...o, status: newStatus } : o));
      const statusNames: Record<OrderStatus, string> = {
        pending: 'قيد الانتظار',
        confirmed: 'تم التأكيد',
        preparing: 'قيد التجهيز',
        out_for_delivery: 'جاري التوصيل',
        delivered: 'تم التوصيل',
        cancelled: 'ملغي'
      };
      showToast(`تم تغيير حالة الطلب #${orderId} إلى "${statusNames[newStatus] || newStatus}" بنجاح في Firestore`);
    } else {
      showToast('حدث خطأ أثناء تحديث حالة الطلب');
    }
  };

  // ===================================
  // --- Users Handlers ---
  // ===================================
  const handleToggleUserRole = async (user: User) => {
    const newRole = user.role === 'admin' ? 'customer' : 'admin';
    if (window.confirm(`هل أنت متأكد من تغيير صلاحية "${user.name || user.email}" إلى ${newRole === 'admin' ? 'مدير (admin)' : 'عميل (customer)'}؟`)) {
      const ok = await adminService.updateUserRole(user.id, newRole);
      if (ok) {
        setUsersList(prev => prev.map(u => u.id === user.id ? { ...u, role: newRole } : u));
        showToast(`تم تحديث دور المستخدم إلى ${newRole} في Firestore`);
      }
    }
  };

  const handleDeleteUser = async (user: User) => {
    if (window.confirm(`هل أنت متأكد من حذف سجل المستخدم "${user.name || user.email}" من Firestore؟`)) {
      const ok = await adminService.deleteUserRecord(user.id);
      if (ok) {
        setUsersList(prev => prev.filter(u => u.id !== user.id));
        showToast('تم حذف سجل المستخدم بنجاح');
      }
    }
  };

  // ===================================
  // --- Coupons Handlers ---
  // ===================================
  const handleSaveCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!couponCode.trim()) {
      showToast('يرجى إدخال كود الكوبون');
      return;
    }
    const newCoupon: Coupon = {
      id: couponCode.trim().toUpperCase(),
      code: couponCode.trim().toUpperCase(),
      discountPercent: parseFloat(couponDiscount) || 10,
      minSpend: parseFloat(couponMinSpend) || 0,
      validUntil: couponValidUntil,
      isActive: true,
      descriptionAr: couponDesc.trim() || `خصم ${couponDiscount}% على الطلبات`
    };
    const ok = await adminService.saveCoupon(newCoupon);
    if (ok) {
      setCoupons(prev => [newCoupon, ...prev.filter(c => c.id !== newCoupon.id)]);
      setIsCouponModalOpen(false);
      setCouponCode('');
      setCouponDesc('');
      showToast(`تم حفظ وتفعيل الكوبون "${newCoupon.code}" في Firestore`);
    }
  };

  const handleDeleteCoupon = async (couponId: string) => {
    if (window.confirm(`هل تريد حذف الكوبون ${couponId}؟`)) {
      const ok = await adminService.deleteCoupon(couponId);
      if (ok) {
        setCoupons(prev => prev.filter(c => c.id !== couponId));
        showToast('تم حذف الكوبون من Firestore');
      }
    }
  };

  const handleToggleCoupon = async (c: Coupon) => {
    const ok = await adminService.toggleCouponActive(c.id, c.isActive);
    if (ok) {
      setCoupons(prev => prev.map(item => item.id === c.id ? { ...item, isActive: !item.isActive } : item));
      showToast(`تم ${c.isActive ? 'تعطيل' : 'تفعيل'} الكوبون`);
    }
  };

  // ===================================
  // --- Offers Handlers ---
  // ===================================
  const handleSaveOffer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!offerTitle.trim()) {
      showToast('يرجى كتابة عنوان العرض');
      return;
    }
    const newOffer: Offer = {
      id: `offer-${Date.now()}`,
      titleAr: offerTitle.trim(),
      subtitleAr: offerSubtitle.trim() || 'عروض وتخفيضات حصرية من بركة ماركت',
      image: offerImage.trim(),
      discountTag: offerTag.trim() || 'عرض حصري',
      active: true
    };
    const ok = await adminService.saveOffer(newOffer);
    if (ok) {
      setOffers(prev => [newOffer, ...prev]);
      setIsOfferModalOpen(false);
      setOfferTitle('');
      setOfferSubtitle('');
      showToast('تمت إضافة العرض الترويجي في Firestore');
    }
  };

  const handleDeleteOffer = async (offerId: string) => {
    if (window.confirm('هل تريد حذف هذا العرض الترويجي؟')) {
      const ok = await adminService.deleteOffer(offerId);
      if (ok) {
        setOffers(prev => prev.filter(o => o.id !== offerId));
        showToast('تم حذف العرض');
      }
    }
  };

  const handleToggleOffer = async (o: Offer) => {
    const ok = await adminService.toggleOfferActive(o.id, o.active);
    if (ok) {
      setOffers(prev => prev.map(item => item.id === o.id ? { ...item, active: !item.active } : item));
      showToast(`تم ${o.active ? 'إخفاء' : 'إظهار'} العرض`);
    }
  };

  // ===================================
  // --- Notifications Handlers ---
  // ===================================
  const handleSendNotification = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!notifTitle.trim() || !notifMessage.trim()) {
      showToast('يرجى إدخال عنوان ونص الإشعار');
      return;
    }
    setIsSendingNotif(true);
    const ok = await adminService.sendBroadcastNotification(notifTitle.trim(), notifMessage.trim(), notifType);
    setIsSendingNotif(false);
    if (ok) {
      setNotifTitle('');
      setNotifMessage('');
      const updated = await adminService.getAllNotifications();
      setNotifications(updated);
      showToast('تم إرسال ونشر الإشعار العام لجميع المستخدمين في Firestore');
    }
  };

  const handleDeleteNotification = async (notifId: string) => {
    const ok = await adminService.deleteNotification(notifId);
    if (ok) {
      setNotifications(prev => prev.filter(n => n.id !== notifId));
      showToast('تم حذف الإشعار');
    }
  };

  // ===================================
  // --- Settings Handlers ---
  // ===================================
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settings) return;
    setIsSavingSettings(true);
    const ok = await adminService.saveSettings(settings);
    setIsSavingSettings(false);
    if (ok) {
      await reloadSettings();
      showToast('تم حفظ وتحديث إعدادات المتجر في Firebase بنجاح');
    } else {
      showToast('حدث خطأ أثناء حفظ الإعدادات في Firebase');
    }
  };

  // ===================================
  // --- Product Handlers ---
  // ===================================
  const handleOpenAddProduct = () => {
    setEditingProduct(null);
    setProdName('');
    setProdNameEn('');
    setProdNameDe('');
    setProdDesc('');
    setProdPrice('');
    setProdOldPrice('');
    setProdDiscount('');
    setProdCategory(categories[0]?.id || 'dairy-cheese');
    const firstCatSubs = subcategories.filter(s => s.categoryId === (categories[0]?.id || 'dairy-cheese'));
    setProdSubCategory(firstCatSubs[0]?.id || firstCatSubs[0]?.nameAr || '');
    setProdStock('25');
    setProdUnit('قطعة');
    setProdWeight('500g');
    setProdOrigin('حلب');
    setProdBrand('بركة ماركت');
    setProdImages(['https://images.unsplash.com/photo-1552767059-ce182ead6c1b?auto=format&fit=crop&w=600&q=80']);
    setNewImageUrl('');
    setProdIsAvailable(true);
    setProdIsFeatured(false);
    setProdIsBestseller(false);
    setProdBadge('');
    setProdIngredients('');
    setProdStorage('');
    setIsProductModalOpen(true);
  };

  const handleOpenEditProduct = (p: Product) => {
    setEditingProduct(p);
    setProdName(p.nameAr || p.name || '');
    setProdNameEn(p.nameEn || '');
    setProdNameDe(p.nameDe || '');
    setProdDesc(p.descriptionAr || p.description || '');
    setProdPrice(p.price.toString());
    setProdOldPrice(p.oldPrice ? p.oldPrice.toString() : (p.originalPrice ? p.originalPrice.toString() : ''));
    setProdDiscount(p.discount ? p.discount.toString() : '');
    setProdCategory(p.categoryId || categories[0]?.id || 'dairy-cheese');
    setProdSubCategory(p.subcategoryId || p.subCategory || '');
    setProdStock((p.stock || p.stockCount || 0).toString());
    setProdUnit(p.unit || 'قطعة');
    setProdWeight(p.weight || '500g');
    setProdOrigin(p.origin || 'حلب');
    setProdBrand(p.brand || 'بركة ماركت');
    
    const imagesList = p.images && p.images.length > 0 ? p.images : (p.image ? [p.image] : ['https://images.unsplash.com/photo-1552767059-ce182ead6c1b?auto=format&fit=crop&w=600&q=80']);
    setProdImages(imagesList);
    setNewImageUrl('');
    setProdIsAvailable(p.isAvailable !== false);
    setProdIsFeatured(Boolean(p.isFeatured));
    setProdIsBestseller(Boolean(p.isBestseller));
    setProdBadge(p.badge || '');
    setProdIngredients(p.ingredientsAr || '');
    setProdStorage(p.storageAr || '');
    setIsProductModalOpen(true);
  };

  const handlePriceChange = (newPrice: string, newOldPrice?: string) => {
    setProdPrice(newPrice);
    const p = parseFloat(newPrice);
    const op = parseFloat(newOldPrice !== undefined ? newOldPrice : prodOldPrice);
    if (!isNaN(p) && !isNaN(op) && op > p) {
      const disc = Math.round(((op - p) / op) * 100);
      setProdDiscount(disc.toString());
    }
  };

  const handleOldPriceChange = (newOldPrice: string) => {
    setProdOldPrice(newOldPrice);
    const p = parseFloat(prodPrice);
    const op = parseFloat(newOldPrice);
    if (!isNaN(p) && !isNaN(op) && op > p) {
      const disc = Math.round(((op - p) / op) * 100);
      setProdDiscount(disc.toString());
    } else if (isNaN(op) || op <= p) {
      setProdDiscount('');
    }
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prodName.trim() || !prodPrice.trim()) {
      showToast('يرجى إدخال اسم المنتج والسعر');
      return;
    }

    const price = parseFloat(prodPrice) || 0;
    const oldPrice = prodOldPrice.trim() ? parseFloat(prodOldPrice) : undefined;
    const discount = prodDiscount.trim() ? parseFloat(prodDiscount) : (oldPrice && oldPrice > price ? Math.round(((oldPrice - price) / oldPrice) * 100) : undefined);
    const stock = parseInt(prodStock) || 0;

    const cleanedImages = prodImages.filter(img => img.trim().length > 0);
    if (cleanedImages.length === 0) {
      cleanedImages.push('https://images.unsplash.com/photo-1552767059-ce182ead6c1b?auto=format&fit=crop&w=600&q=80');
    }

    const productPayload: any = {
      name: prodName.trim(),
      nameAr: prodName.trim(),
      nameEn: prodNameEn.trim() || undefined,
      nameDe: prodNameDe.trim() || undefined,
      description: prodDesc.trim() || 'منتج بلدي سوري فاخر من خيرات الطبيعة',
      descriptionAr: prodDesc.trim() || 'منتج بلدي سوري فاخر من خيرات الطبيعة',
      price,
      oldPrice,
      originalPrice: oldPrice,
      discount,
      categoryId: prodCategory,
      subcategoryId: prodSubCategory.trim() || undefined,
      subCategory: prodSubCategory.trim() || undefined,
      images: cleanedImages,
      image: cleanedImages[0],
      stock,
      stockCount: stock,
      unit: prodUnit.trim() || 'قطعة',
      weight: prodWeight.trim() || '500g',
      origin: prodOrigin.trim() || 'حلب',
      brand: prodBrand.trim() || 'بركة ماركت',
      isAvailable: prodIsAvailable,
      inStock: prodIsAvailable && stock > 0,
      isFeatured: prodIsFeatured,
      isBestseller: prodIsBestseller,
      badge: prodBadge.trim() || (prodIsFeatured ? 'مميز' : undefined),
      ingredientsAr: prodIngredients.trim() || undefined,
      storageAr: prodStorage.trim() || undefined,
      rating: editingProduct?.rating || 5.0,
      reviewsCount: editingProduct?.reviewsCount || 12
    };

    if (editingProduct) {
      await productService.updateProduct(editingProduct.id, productPayload);
      showToast(`تم تحديث بيانات "${prodName}" بنجاح في Firestore`);
    } else {
      await productService.addProduct(productPayload);
      showToast(`تمت إضافة ونشر المنتج "${prodName}" في Firestore`);
    }

    await reloadProducts();
    setIsProductModalOpen(false);
  };

  const handleToggleProductAvailability = async (id: string, currentAvailable: boolean) => {
    await productService.toggleProductAvailability(id);
    await reloadProducts();
    showToast(currentAvailable ? 'تم إخفاء المنتج من التطبيق' : 'تم إظهار المنتج للعملاء في التطبيق');
  };

  const handleToggleProductFeatured = async (id: string, currentFeatured: boolean) => {
    await productService.toggleProductFeatured(id);
    await reloadProducts();
    showToast(currentFeatured ? 'تمت إزالة تمييز المنتج' : 'تم تحديد المنتج كمنتج مميز');
  };

  const handleDeleteProduct = async (p: Product) => {
    if (window.confirm(`هل أنت متأكد من حذف منتج "${p.nameAr || p.name}" نهائياً من Firestore؟`)) {
      await productService.deleteProduct(p.id);
      await reloadProducts();
      showToast('تم حذف المنتج بنجاح من قاعدة البيانات');
    }
  };

  const handleSaveQuickPrice = async (p: Product) => {
    const newP = parseFloat(quickPrice);
    if (isNaN(newP) || newP < 0) {
      showToast('يرجى إدخال سعر صحيح');
      return;
    }
    const newS = quickStock !== '' ? parseInt(quickStock) : p.stock || p.stockCount || 0;
    await productService.updateProduct(p.id, {
      price: newP,
      stock: newS,
      stockCount: newS,
      inStock: (p.isAvailable !== false) && newS > 0
    });
    await reloadProducts();
    setQuickEditId(null);
    showToast(`تم تعديل سعر "${p.nameAr || p.name}" إلى €${newP.toFixed(2)} فوراً`);
  };

  const handleImageFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, target: 'product' | 'category' | 'subcategory') => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploadingImage(true);
    try {
      if (target === 'product') {
        const uploadedUrls = await productService.uploadMultipleImages(files, 'products');
        setProdImages(prev => [...prev, ...uploadedUrls]);
        showToast(`تم رفع ${uploadedUrls.length} صورة إلى Firebase Storage`);
      } else if (target === 'category') {
        const downloadUrl = await productService.uploadImage(files[0], 'categories');
        setCatImage(downloadUrl);
        showToast('تم رفع صورة القسم إلى Firebase Storage');
      } else {
        const downloadUrl = await productService.uploadImage(files[0], 'subcategories');
        setSubImage(downloadUrl);
        showToast('تم رفع صورة القسم الفرعي إلى Firebase Storage');
      }
    } catch (err) {
      showToast('حدث خطأ أثناء رفع الصورة، يمكنك كتابة رابط الصورة يدوياً');
    } finally {
      setIsUploadingImage(false);
    }
  };

  const handleAddImageUrl = () => {
    if (!newImageUrl.trim()) return;
    setProdImages(prev => [...prev, newImageUrl.trim()]);
    setNewImageUrl('');
  };

  const handleRemoveImage = (index: number) => {
    setProdImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleSetPrimaryImage = (index: number) => {
    setProdImages(prev => {
      const selected = prev[index];
      const rest = prev.filter((_, i) => i !== index);
      return [selected, ...rest];
    });
  };

  // ===================================
  // --- Category Handlers ---
  // ===================================
  const handleOpenAddCategory = () => {
    setEditingCategory(null);
    setCatName('');
    setCatNameEn('');
    setCatNameDe('');
    setCatDescription('');
    setCatImage('https://images.unsplash.com/photo-1552767059-ce182ead6c1b?auto=format&fit=crop&w=600&q=80');
    setCatSortOrder((categories.length + 1).toString());
    setCatIsActive(true);
    setIsCategoryModalOpen(true);
  };

  const handleOpenEditCategory = (cat: Category) => {
    setEditingCategory(cat);
    setCatName(cat.nameAr || cat.name || '');
    setCatNameEn(cat.nameEn || '');
    setCatNameDe(cat.nameDe || '');
    setCatDescription(cat.descriptionAr || cat.description || '');
    setCatImage(cat.image);
    setCatSortOrder(cat.sortOrder !== undefined ? cat.sortOrder.toString() : '1');
    setCatIsActive(cat.isActive !== false);
    setIsCategoryModalOpen(true);
  };

  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!catName.trim()) {
      showToast('يرجى إدخال اسم القسم');
      return;
    }

    const payload = {
      name: catName.trim(),
      nameAr: catName.trim(),
      nameEn: catNameEn.trim() || undefined,
      nameDe: catNameDe.trim() || undefined,
      description: catDescription.trim(),
      descriptionAr: catDescription.trim(),
      image: catImage.trim(),
      sortOrder: parseInt(catSortOrder) || 1,
      isActive: catIsActive
    };

    if (editingCategory) {
      await productService.updateCategory(editingCategory.id, payload);
      showToast(`تم تحديث القسم "${catName}" في Firebase`);
    } else {
      await productService.addCategory(payload);
      showToast(`تمت إضافة القسم "${catName}" بنجاح في Firebase`);
    }

    await reloadCategories();
    setIsCategoryModalOpen(false);
  };

  const handleToggleCategoryActive = async (id: string) => {
    await productService.toggleCategoryActive(id);
    await reloadCategories();
    showToast('تم تغيير حالة تفعيل القسم');
  };

  const handleMoveCategoryOrder = async (cat: Category, direction: 'up' | 'down') => {
    const sortedCats = [...categories].sort((a, b) => (a.sortOrder ?? 999) - (b.sortOrder ?? 999));
    const currentIndex = sortedCats.findIndex(c => c.id === cat.id);
    if (currentIndex === -1) return;

    const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    if (targetIndex < 0 || targetIndex >= sortedCats.length) return;

    const targetCat = sortedCats[targetIndex];
    const currentOrder = cat.sortOrder ?? (currentIndex + 1);
    const targetOrder = targetCat.sortOrder ?? (targetIndex + 1);

    // Swap orders
    const newCurrentOrder = targetOrder === currentOrder ? (direction === 'up' ? currentOrder - 1 : currentOrder + 1) : targetOrder;
    const newTargetOrder = currentOrder;

    await productService.updateCategory(cat.id, { sortOrder: newCurrentOrder });
    await productService.updateCategory(targetCat.id, { sortOrder: newTargetOrder });
    await reloadCategories();
    showToast(`تم تغيير ترتيب قسم "${cat.nameAr || cat.name}"`);
  };

  const handleDeleteCategory = async (cat: Category) => {
    // 3. Product Safety Check: Check if any products are associated with this category
    const associatedProducts = products.filter(p => p.categoryId === cat.id || (cat.categoryId && p.categoryId === cat.categoryId));
    if (associatedProducts.length > 0) {
      alert(`⚠️ لا يمكن حذف قسم "${cat.nameAr || cat.name}" لوجود (${associatedProducts.length}) منتجات مرتبطة به حالياً.\n\nلحماية المنتجات من الضياع، يُرجى نقل المنتجات أولاً إلى قسم آخر أو تعطيل هذا القسم بدلاً من حذفه.`);
      return;
    }

    if (window.confirm(`هل أنت متأكد من حذف قسم "${cat.nameAr || cat.name}" نهائياً من Firebase؟`)) {
      await productService.deleteCategory(cat.id);
      await reloadCategories();
      await reloadProducts();
      showToast('تم حذف القسم بنجاح من قاعدة البيانات');
    }
  };

  // Filter products for display in Admin table
  const filteredProducts = products.filter(p => {
    if (prodSearch.trim()) {
      const q = prodSearch.toLowerCase().trim();
      const matchName = (p.nameAr && p.nameAr.toLowerCase().includes(q)) || (p.name && p.name.toLowerCase().includes(q));
      const matchDesc = (p.descriptionAr && p.descriptionAr.toLowerCase().includes(q)) || (p.description && p.description.toLowerCase().includes(q));
      if (!matchName && !matchDesc) return false;
    }
    if (prodCatFilter !== 'all' && p.categoryId !== prodCatFilter) return false;
    if (prodStatusFilter === 'available' && p.isAvailable === false) return false;
    if (prodStatusFilter === 'hidden' && p.isAvailable !== false) return false;
    if (prodStatusFilter === 'out_of_stock' && ((p.stock || p.stockCount || 0) > 0 && p.inStock)) return false;
    if (prodStatusFilter === 'featured' && !p.isFeatured) return false;
    return true;
  });

  // Calculate Metrics
  const totalSales = orders.reduce((sum, ord) => sum + (ord.status !== 'cancelled' ? ord.total : 0), 0);
  const pendingOrdersCount = orders.filter(o => o.status === 'pending').length;
  const unreadNotifsCount = notifications.filter(n => !n.read).length;
  const availableProdsCount = products.filter(p => p.isAvailable !== false).length;
  const hiddenProdsCount = products.filter(p => p.isAvailable === false).length;

  const ADMIN_NAV_TABS: { id: AdminTab; label: string; icon: any; count?: number; highlight?: boolean }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: TrendingUp },
    { id: 'products', label: 'المنتجات', icon: Package, count: products.length },
    { id: 'categories', label: 'الأقسام', icon: Grid, count: categories.length },
    { id: 'orders', label: 'الطلبات', icon: ShoppingBag, count: orders.length, highlight: pendingOrdersCount > 0 },
    { id: 'users', label: 'المستخدمون', icon: Users, count: usersList.length },
    { id: 'offers', label: 'العروض', icon: Gift, count: offers.length },
    { id: 'coupons', label: 'الكوبونات', icon: Ticket, count: coupons.length },
    { id: 'referrals', label: 'الإحالات', icon: Share2, count: referrals.length },
    { id: 'notifications', label: 'الإشعارات', icon: Bell, count: unreadNotifsCount > 0 ? unreadNotifsCount : notifications.length, highlight: unreadNotifsCount > 0 },
    { id: 'settings', label: 'الإعدادات', icon: Settings }
  ];

  return (
    <div className="p-3 sm:p-4 space-y-4 pb-24 max-w-6xl mx-auto" dir="rtl">
      
      {/* Top Banner */}
      <div className="bg-stone-900 text-white p-4 rounded-3xl border border-stone-800 shadow-md space-y-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-600/20 text-amber-400 flex items-center justify-center border border-amber-500/30">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-black text-base text-white">لوحة تحكم المدير الشاملة</h1>
                <span className="bg-emerald-500/20 text-emerald-300 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-500/30 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  Firebase متصل
                </span>
              </div>
              <p className="text-xs text-stone-400 font-medium">إدارة كاملة لقاعدة بيانات Firestore والمتجر الإلكتروني</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Enable/Disable Sound Notifications Button */}
            <button
              onClick={handleToggleSoundAlerts}
              title={soundAlertsEnabled ? 'التنبيهات الصوتية مفعلة (انقر للكتم)' : 'تفعيل التنبيهات الصوتية للطلبات الجديدة'}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-xs border ${
                soundAlertsEnabled 
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 hover:bg-amber-500/30' 
                  : 'bg-stone-800 text-stone-300 border-stone-700 hover:bg-stone-700 hover:text-white'
              }`}
            >
              {soundAlertsEnabled ? (
                <>
                  <Volume2 className="w-4 h-4 text-amber-400 animate-pulse" />
                  <span className="hidden sm:inline">التنبيهات مفعّلة</span>
                </>
              ) : (
                <>
                  <VolumeX className="w-4 h-4 text-stone-400" />
                  <span>تفعيل التنبيهات</span>
                </>
              )}
            </button>

            <button
              onClick={fetchAllData}
              title="تحديث البيانات"
              className="bg-stone-800 hover:bg-stone-700 p-2 rounded-xl text-stone-300 cursor-pointer transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
            <button
              onClick={() => navigateTo('home')}
              className="bg-emerald-800 hover:bg-emerald-700 text-xs font-bold px-3 py-2 rounded-xl text-white cursor-pointer flex items-center gap-1.5 shadow-sm"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>معاينة المتجر</span>
            </button>
          </div>
        </div>

        {/* Real-time Order Popup Banner when a new order arrives */}
        {newOrderAlert && (
          <div className="bg-amber-500/20 border border-amber-500/50 rounded-2xl p-3.5 flex items-center justify-between gap-3 text-white animate-bounce-short">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-amber-500 text-stone-950 flex items-center justify-center font-bold">
                <BellRing className="w-5 h-5 animate-pulse" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-black text-sm text-amber-300">طلب جديد وصل الآن! #{newOrderAlert.orderId || newOrderAlert.id}</span>
                  <span className="bg-amber-400 text-stone-950 text-[10px] font-black px-2 py-0.2 rounded-full">جديد</span>
                </div>
                <p className="text-xs text-stone-300">
                  من <strong className="text-white">{newOrderAlert.customerName || 'عميل'}</strong> - الإجمالي: <strong className="text-amber-300">€{newOrderAlert.total.toFixed(2)}</strong> ({newOrderAlert.paymentMethod === 'bank_transfer' ? 'تحويل بنكي' : newOrderAlert.paymentMethod === 'card' ? 'بطاقة بنكية' : 'دفع عند الاستلام'})
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  setActiveTab('orders');
                  setOrderStatusFilter('pending');
                  setNewOrderAlert(null);
                }}
                className="bg-amber-500 hover:bg-amber-400 text-stone-950 text-xs font-black px-3 py-1.5 rounded-xl cursor-pointer shadow-xs transition-colors"
              >
                عرض الطلب
              </button>
              <button
                onClick={() => setNewOrderAlert(null)}
                className="text-stone-400 hover:text-white p-1 cursor-pointer"
                title="إغلاق"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Navigation Tabs Bar */}
        <div className="flex bg-stone-800/90 p-1 rounded-2xl gap-1 text-xs font-bold overflow-x-auto no-scrollbar">
          {ADMIN_NAV_TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-2 px-3 rounded-xl whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
                  isActive ? 'bg-white text-stone-950 shadow-sm' : 'text-stone-300 hover:text-white hover:bg-stone-700/50'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-emerald-800' : 'text-stone-400'}`} />
                <span>{tab.label}</span>
                {tab.count !== undefined && (
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold ${
                    tab.highlight 
                      ? 'bg-amber-500 text-stone-950 animate-pulse' 
                      : isActive 
                        ? 'bg-emerald-100 text-emerald-900' 
                        : 'bg-stone-700 text-stone-300'
                  }`}>
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* ========================================================= */}
      {/* 1. DASHBOARD TAB                                          */}
      {/* ========================================================= */}
      {activeTab === 'dashboard' && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-white p-4 rounded-3xl border border-stone-200/80 shadow-2xs space-y-1">
              <span className="text-[11px] font-bold text-stone-500 flex items-center gap-1">
                <DollarSign className="w-3.5 h-3.5 text-emerald-700" />
                <span>إجمالي المبيعات</span>
              </span>
              <div className="font-black text-xl text-emerald-800 font-sans">{currencySymbol || '€'}{totalSales.toFixed(2)}</div>
            </div>

            <div className="bg-white p-4 rounded-3xl border border-stone-200/80 shadow-2xs space-y-1">
              <span className="text-[11px] font-bold text-stone-500 flex items-center gap-1">
                <ShoppingBag className="w-3.5 h-3.5 text-blue-600" />
                <span>طلبات قيد الانتظار</span>
              </span>
              <div className="font-black text-xl text-amber-600 font-sans">{pendingOrdersCount}</div>
            </div>

            <div className="bg-white p-4 rounded-3xl border border-stone-200/80 shadow-2xs space-y-1">
              <span className="text-[11px] font-bold text-stone-500 flex items-center gap-1">
                <Package className="w-3.5 h-3.5 text-purple-600" />
                <span>المنتجات النشطة</span>
              </span>
              <div className="font-black text-xl text-stone-900 font-sans">{availableProdsCount}</div>
            </div>

            <div className="bg-white p-4 rounded-3xl border border-stone-200/80 shadow-2xs space-y-1">
              <span className="text-[11px] font-bold text-stone-500 flex items-center gap-1">
                <Users className="w-3.5 h-3.5 text-cyan-600" />
                <span>المستخدمون المسجلون</span>
              </span>
              <div className="font-black text-xl text-stone-900 font-sans">{usersList.length}</div>
            </div>
          </div>

          {/* Quick Actions Grid */}
          <div className="bg-white p-4 rounded-3xl border border-stone-200/80 shadow-2xs space-y-3">
            <h3 className="font-extrabold text-sm text-stone-900">اختصارات سريعة للمدير</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              <button
                onClick={() => { setActiveTab('products'); handleOpenAddProduct(); }}
                className="bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-200 p-3 rounded-2xl text-xs font-bold flex flex-col items-center gap-1.5 cursor-pointer transition-colors"
              >
                <Plus className="w-5 h-5 text-emerald-800" />
                <span>إضافة منتج جديد</span>
              </button>
              <button
                onClick={() => setActiveTab('orders')}
                className="bg-blue-50 hover:bg-blue-100 text-blue-900 border border-blue-200 p-3 rounded-2xl text-xs font-bold flex flex-col items-center gap-1.5 cursor-pointer transition-colors"
              >
                <ShoppingBag className="w-5 h-5 text-blue-700" />
                <span>معالجة الطلبات</span>
              </button>
              <button
                onClick={() => { setActiveTab('coupons'); setIsCouponModalOpen(true); }}
                className="bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 p-3 rounded-2xl text-xs font-bold flex flex-col items-center gap-1.5 cursor-pointer transition-colors"
              >
                <Ticket className="w-5 h-5 text-amber-700" />
                <span>إنشاء كوبون خصم</span>
              </button>
              <button
                onClick={() => setActiveTab('notifications')}
                className="bg-purple-50 hover:bg-purple-100 text-purple-900 border border-purple-200 p-3 rounded-2xl text-xs font-bold flex flex-col items-center gap-1.5 cursor-pointer transition-colors"
              >
                <Bell className="w-5 h-5 text-purple-700" />
                <span>إرسال إشعار عام</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 2. PRODUCTS MANAGEMENT TAB (Full CRUD, Toggle, Price/Stock)*/}
      {/* ========================================================= */}
      {activeTab === 'products' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-3xl border border-stone-200/80 shadow-2xs">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-sm text-stone-900">إدارة وتعديل المنتجات (Cloud Firestore)</h3>
                <span className="bg-emerald-50 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-md border border-emerald-200">
                  {products.length} صنف
                </span>
              </div>
              <p className="text-xs text-stone-500 mt-0.5">
                تعديل الأسعار، المخزون، الصور، إظهار/إخفاء المنتجات، وحذفها فورياً
              </p>
            </div>
            
            <button
              onClick={handleOpenAddProduct}
              className="bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-bold px-4 py-2.5 rounded-2xl flex items-center justify-center gap-1.5 cursor-pointer shadow-xs transition-colors shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>إضافة منتج جديد</span>
            </button>
          </div>

          {/* Search & Filter Bar */}
          <div className="bg-white p-3 rounded-2xl border border-stone-200/80 shadow-2xs flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-stone-400 absolute right-3 top-2.5" />
              <input
                type="text"
                placeholder="بحث عن منتج بالاسم، الوصف، المدينة..."
                value={prodSearch}
                onChange={(e) => setProdSearch(e.target.value)}
                className="w-full bg-stone-50 border border-stone-200 rounded-xl pr-9 pl-3 py-2 text-xs focus:bg-white focus:border-emerald-700 outline-hidden font-medium"
              />
            </div>

            <select
              value={prodCatFilter}
              onChange={(e) => setProdCatFilter(e.target.value)}
              className="bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-xs font-bold text-stone-800 focus:bg-white focus:border-emerald-700 outline-hidden cursor-pointer"
            >
              <option value="all">جميع الأقسام</option>
              {categories.map(c => (
                <option key={c.id} value={c.id}>{c.nameAr || c.name}</option>
              ))}
            </select>

            <select
              value={prodStatusFilter}
              onChange={(e) => setProdStatusFilter(e.target.value as any)}
              className="bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-xs font-bold text-stone-800 focus:bg-white focus:border-emerald-700 outline-hidden cursor-pointer"
            >
              <option value="all">كل الحالات</option>
              <option value="available">الظاهر للعملاء</option>
              <option value="hidden">المخفي</option>
              <option value="out_of_stock">نفذ المخزون</option>
              <option value="featured">المميز</option>
            </select>
          </div>

          {/* Products List Table / Cards */}
          <div className="space-y-2.5">
            {filteredProducts.map((p) => {
              const isEditingQuick = quickEditId === p.id;
              const isHidden = p.isAvailable === false;
              const isOutOfStock = (p.stock || p.stockCount || 0) <= 0;

              return (
                <div 
                  key={p.id}
                  className={`bg-white p-3 rounded-2xl border transition-all shadow-2xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${
                    isHidden ? 'opacity-70 bg-stone-50/80 border-stone-300' : 'border-stone-200/80 hover:border-stone-300'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <img 
                      src={p.image || (p.images && p.images[0]) || 'https://images.unsplash.com/photo-1552767059-ce182ead6c1b?auto=format&fit=crop&w=120&q=80'} 
                      alt={p.nameAr} 
                      className="w-12 h-12 rounded-xl object-cover border border-stone-100 shrink-0" 
                    />
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-extrabold text-xs text-stone-900 block truncate">
                          {p.nameAr || p.name}
                        </span>
                        {isHidden && (
                          <span className="bg-rose-100 text-rose-800 text-[9px] font-bold px-1.5 py-0.2 rounded-md">
                            مخفي
                          </span>
                        )}
                        {p.isFeatured && (
                          <span className="bg-amber-100 text-amber-800 text-[9px] font-bold px-1.5 py-0.2 rounded-md flex items-center gap-0.5">
                            <Star className="w-2.5 h-2.5 fill-amber-600 text-amber-600" />
                            مميز
                          </span>
                        )}
                        {isOutOfStock && (
                          <span className="bg-stone-200 text-stone-700 text-[9px] font-bold px-1.5 py-0.2 rounded-md">
                            نفذ المخزون
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2 text-[10px] text-stone-500 font-medium">
                        <span className="font-mono text-emerald-800 font-bold">€{p.price.toFixed(2)}</span>
                        <span>•</span>
                        <span>المخزون: {p.stock || p.stockCount || 0} {p.unit || 'قطعة'}</span>
                        <span>•</span>
                        <span>{p.origin || 'سوري'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Inline Quick Price/Stock edit or Action Buttons */}
                  {isEditingQuick ? (
                    <div className="flex items-center gap-1.5 bg-stone-100 p-1.5 rounded-xl border border-stone-200 shrink-0">
                      <div className="space-y-0.5 text-[9px]">
                        <span className="text-stone-500 font-bold block">السعر (€)</span>
                        <input
                          type="number"
                          step="0.01"
                          value={quickPrice}
                          onChange={(e) => setQuickPrice(e.target.value)}
                          className="w-16 bg-white border border-stone-300 rounded-lg px-1.5 py-1 text-xs font-bold font-sans"
                        />
                      </div>
                      <div className="space-y-0.5 text-[9px]">
                        <span className="text-stone-500 font-bold block">المخزون</span>
                        <input
                          type="number"
                          value={quickStock}
                          onChange={(e) => setQuickStock(e.target.value)}
                          className="w-14 bg-white border border-stone-300 rounded-lg px-1.5 py-1 text-xs font-bold font-sans"
                        />
                      </div>
                      <button
                        onClick={() => handleSaveQuickPrice(p)}
                        className="bg-emerald-800 text-white p-1.5 rounded-lg hover:bg-emerald-900 cursor-pointer mt-3"
                        title="حفظ التعديل السريع"
                      >
                        <Check className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => setQuickEditId(null)}
                        className="bg-stone-300 text-stone-700 p-1.5 rounded-lg hover:bg-stone-400 cursor-pointer mt-3"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1 shrink-0 self-end sm:self-center">
                      <button
                        onClick={() => {
                          setQuickEditId(p.id);
                          setQuickPrice(p.price.toString());
                          setQuickStock((p.stock || p.stockCount || 0).toString());
                        }}
                        className="text-[11px] font-bold bg-stone-100 hover:bg-stone-200 text-stone-700 px-2.5 py-1.5 rounded-xl border border-stone-200 flex items-center gap-1 cursor-pointer transition-colors"
                        title="تعديل السعر والمخزون السريع"
                      >
                        <DollarSign className="w-3.5 h-3.5 text-emerald-800" />
                        <span>سعر/مخزون</span>
                      </button>

                      <button
                        onClick={() => handleToggleProductAvailability(p.id, p.isAvailable !== false)}
                        className={`p-1.5 rounded-xl border cursor-pointer transition-colors ${
                          p.isAvailable !== false ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 'bg-rose-50 text-rose-700 border-rose-200'
                        }`}
                        title={p.isAvailable !== false ? 'إخفاء المنتج' : 'إظهار المنتج'}
                      >
                        {p.isAvailable !== false ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                      </button>

                      <button
                        onClick={() => handleOpenEditProduct(p)}
                        className="p-1.5 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl border border-stone-200 cursor-pointer transition-colors"
                        title="تعديل كامل المنتج والصور"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => handleDeleteProduct(p)}
                        className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-xl border border-rose-200 cursor-pointer transition-colors"
                        title="حذف المنتج من Firestore"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 3. CATEGORIES MANAGEMENT TAB                              */}
      {/* ========================================================= */}
      {activeTab === 'categories' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between bg-white p-4 rounded-3xl border border-stone-200/80 shadow-2xs">
            <div>
              <h3 className="font-extrabold text-sm text-stone-900">إدارة الأقسام الرئيسية ({categories.length})</h3>
              <p className="text-xs text-stone-500">إضافة وتعديل وحذف أقسام المتجر في Firestore</p>
            </div>
            <button
              onClick={handleOpenAddCategory}
              className="bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-bold px-4 py-2.5 rounded-2xl flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span>إضافة قسم رئيسي</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {[...categories]
              .sort((a, b) => (a.sortOrder ?? 999) - (b.sortOrder ?? 999))
              .map((cat, idx) => {
                const prodCount = products.filter(p => p.categoryId === cat.id || (cat.categoryId && p.categoryId === cat.categoryId)).length;
                return (
                  <div 
                    key={cat.id}
                    className={`bg-white p-3.5 rounded-2xl border transition-all space-y-2.5 ${
                      cat.isActive !== false ? 'border-stone-200/80 shadow-2xs' : 'border-stone-200 bg-stone-50/70 opacity-85'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <img src={cat.image} alt={cat.nameAr} className="w-13 h-13 rounded-xl object-cover border border-stone-100 shrink-0" />
                      <div className="min-w-0 flex-1 space-y-0.5">
                        <div className="flex items-center justify-between gap-1">
                          <span className="font-bold text-xs text-stone-900 block truncate">{cat.nameAr || cat.name}</span>
                          <span className="text-[10px] bg-stone-100 text-stone-600 font-mono px-1.5 py-0.5 rounded-md shrink-0">
                            #{cat.sortOrder ?? idx + 1}
                          </span>
                        </div>
                        <span className="text-[10px] text-stone-400 font-sans block truncate">
                          {cat.nameDe ? `${cat.nameDe} • ` : ''}{cat.nameEn || cat.id}
                        </span>
                        <span className="inline-block text-[10px] font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.2 rounded-md">
                          {prodCount} منتج مرتبط
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-stone-100 text-xs">
                      {/* Active / Inactive Status Toggle */}
                      <button
                        onClick={() => handleToggleCategoryActive(cat.id)}
                        className={`text-[10px] font-bold px-2.5 py-1 rounded-lg border cursor-pointer transition-colors ${
                          cat.isActive !== false 
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100' 
                            : 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100'
                        }`}
                        title="تبديل حالة التفعيل (القسم المعطل لا يظهر للعميل)"
                      >
                        {cat.isActive !== false ? '✓ نشط للعملاء' : '✕ معطل (مخفي)'}
                      </button>

                      {/* Sort Up / Down and Actions */}
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleMoveCategoryOrder(cat, 'up')}
                          disabled={idx === 0}
                          className="p-1 text-stone-600 hover:bg-stone-100 disabled:opacity-30 disabled:cursor-not-allowed rounded-lg cursor-pointer"
                          title="تحريك لأعلى"
                        >
                          ▲
                        </button>
                        <button
                          onClick={() => handleMoveCategoryOrder(cat, 'down')}
                          disabled={idx === categories.length - 1}
                          className="p-1 text-stone-600 hover:bg-stone-100 disabled:opacity-30 disabled:cursor-not-allowed rounded-lg cursor-pointer"
                          title="تحريك لأسفل"
                        >
                          ▼
                        </button>
                        <button
                          onClick={() => handleOpenEditCategory(cat)}
                          className="p-1 text-stone-600 hover:bg-stone-100 rounded-lg cursor-pointer"
                          title="تعديل بيانات القسم"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteCategory(cat)}
                          className="p-1 text-rose-600 hover:bg-rose-50 rounded-lg cursor-pointer"
                          title="حذف القسم"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 4. ORDERS MANAGEMENT TAB (View & Change Status)           */}
      {/* ========================================================= */}
      {activeTab === 'orders' && (
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-3xl border border-stone-200/80 shadow-2xs flex items-center justify-between flex-wrap gap-2">
            <div>
              <h3 className="font-extrabold text-sm text-stone-900">سجل وإدارة طلبات العملاء ({orders.length})</h3>
              <p className="text-xs text-stone-500">تحديث وتغيير حالة الطلبات مباشرة في Cloud Firestore</p>
            </div>
            <button
              onClick={fetchAllData}
              className="text-xs font-bold text-stone-700 bg-stone-100 hover:bg-stone-200 px-3 py-1.5 rounded-xl flex items-center gap-1 cursor-pointer transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>تحديث القائمة</span>
            </button>
          </div>

          {/* Status Filter Bar */}
          <div className="flex bg-stone-100 p-1 rounded-2xl border border-stone-200/80 text-xs font-bold overflow-x-auto no-scrollbar gap-1">
            {[
              { id: 'all', label: `الكل (${orders.length})` },
              { id: 'pending', label: `قيد الانتظار (${orders.filter(o => o.status === 'pending').length})` },
              { id: 'confirmed', label: `مؤكد (${orders.filter(o => o.status === 'confirmed').length})` },
              { id: 'preparing', label: `قيد التجهيز (${orders.filter(o => o.status === 'preparing').length})` },
              { id: 'out_for_delivery', label: `جاري التوصيل (${orders.filter(o => o.status === 'out_for_delivery').length})` },
              { id: 'delivered', label: `تم التوصيل (${orders.filter(o => o.status === 'delivered').length})` },
              { id: 'cancelled', label: `ملغي (${orders.filter(o => o.status === 'cancelled').length})` }
            ].map((f) => (
              <button
                key={f.id}
                onClick={() => setOrderStatusFilter(f.id)}
                className={`py-1.5 px-3 rounded-xl whitespace-nowrap transition-all cursor-pointer ${
                  orderStatusFilter === f.id ? 'bg-white text-stone-900 shadow-xs' : 'text-stone-500 hover:text-stone-800'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* Orders List */}
          {orders.filter(o => orderStatusFilter === 'all' || o.status === orderStatusFilter).length === 0 ? (
            <div className="py-12 text-center bg-white rounded-3xl border border-stone-200/80 p-6 space-y-2">
              <ShoppingBag className="w-10 h-10 text-stone-300 mx-auto" />
              <p className="text-xs font-bold text-stone-600">لا توجد طلبات مسجلة تحت هذا الفلتر</p>
            </div>
          ) : (
            <div className="space-y-3">
              {orders
                .filter(o => orderStatusFilter === 'all' || o.status === orderStatusFilter)
                .map((ord) => {
                  return (
                    <div 
                      key={ord.id}
                      className="bg-white p-4 rounded-3xl border border-stone-200/80 shadow-2xs space-y-3"
                    >
                      <div className="flex items-center justify-between border-b border-stone-100 pb-2.5 flex-wrap gap-2">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-black text-stone-900 bg-stone-100 px-2 py-0.5 rounded-lg border border-stone-200">
                            #{ord.orderId || ord.id}
                          </span>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full border bg-amber-50 text-amber-900 border-amber-200">
                            {ord.status}
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="text-[11px] text-stone-400 font-sans">{ord.createdAt}</span>
                          <span className="font-black text-sm text-emerald-800 font-sans">
                            {currencySymbol || '€'}{ord.total.toFixed(2)}
                          </span>
                        </div>
                      </div>

                      {/* Customer Info & Payment Details */}
                      <div className="text-xs text-stone-600 bg-stone-50/70 p-3 rounded-2xl border border-stone-100 space-y-2">
                        <div className="flex justify-between font-bold text-stone-900">
                          <span>العميل: {ord.customerName || (ord as any).shippingAddress?.fullName || 'عميل المتجر'}</span>
                          <span className="font-sans text-stone-700">{ord.phone || (ord as any).shippingAddress?.phone}</span>
                        </div>
                        <p className="text-stone-500 text-[11px]">
                          العنوان: {ord.address || (ord as any).shippingAddress?.street} {ord.city || (ord as any).shippingAddress?.city}
                        </p>
                        <div className="flex items-center justify-between pt-1.5 border-t border-stone-200/60 flex-wrap gap-2 text-[11px]">
                          <div className="flex items-center gap-1.5">
                            <span className="text-stone-500">طريقة الدفع:</span>
                            <span className="font-bold text-stone-800 bg-stone-100 px-2 py-0.5 rounded-md border border-stone-200">
                              {ord.paymentMethod === 'bank_transfer'
                                ? 'تحويل بنكي (Bank Transfer)'
                                : ord.paymentMethod === 'card'
                                ? 'بطاقة بنكية (Card)'
                                : 'الدفع عند الاستلام (COD)'}
                            </span>
                          </div>
                          {ord.paymentStatus && (
                            <div className="flex items-center gap-1">
                              <span className="text-stone-500">حالة الدفع:</span>
                              <span className={`font-bold px-2 py-0.5 rounded-md border ${
                                ord.paymentStatus === 'paid'
                                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                  : ord.paymentStatus === 'awaiting_transfer'
                                  ? 'bg-amber-50 text-amber-800 border-amber-200'
                                  : 'bg-stone-100 text-stone-700 border-stone-200'
                              }`}>
                                {ord.paymentStatus === 'paid'
                                  ? 'تم الدفع'
                                  : ord.paymentStatus === 'awaiting_transfer'
                                  ? 'بانتظار التحويل'
                                  : 'قيد الانتظار'}
                              </span>
                            </div>
                          )}
                        </div>
                        {ord.notes && (
                          <div className="pt-1 border-t border-stone-200/60 text-[11px] text-stone-600">
                            <span className="font-bold text-stone-700">ملاحظات: </span>
                            <span>{ord.notes}</span>
                          </div>
                        )}
                      </div>

                      {/* Items */}
                      <div className="space-y-1">
                        {ord.items.map((it, idx) => (
                          <div key={idx} className="flex justify-between items-center text-xs text-stone-700 bg-white p-1.5 px-2.5 rounded-xl border border-stone-100">
                            <span className="font-medium">{it.quantity}x {it.product.nameAr || it.product.name}</span>
                            <span className="font-mono text-stone-600 font-bold">{currencySymbol || '€'}{(it.product.price * it.quantity).toFixed(2)}</span>
                          </div>
                        ))}
                      </div>

                      {/* Change Status Dropdown */}
                      <div className="pt-2 border-t border-stone-100 flex items-center justify-between flex-wrap gap-2">
                        <label className="text-xs font-bold text-stone-800 flex items-center gap-1.5">
                          <Edit3 className="w-3.5 h-3.5 text-emerald-800" />
                          <span>تغيير حالة الطلب في Firestore:</span>
                        </label>
                        <select
                          value={ord.status}
                          onChange={(e) => handleUpdateOrderStatus(ord.id, e.target.value as OrderStatus)}
                          className="bg-stone-50 border border-stone-200 rounded-xl px-3 py-1.5 text-xs font-bold text-stone-900 focus:bg-white focus:border-emerald-700 outline-hidden cursor-pointer"
                        >
                          <option value="pending">⏳ قيد الانتظار (pending)</option>
                          <option value="confirmed">✓ تم التأكيد (confirmed)</option>
                          <option value="preparing">📦 قيد التجهيز (preparing)</option>
                          <option value="out_for_delivery">🚚 جاري التوصيل (out_for_delivery)</option>
                          <option value="delivered">🎉 تم التوصيل (delivered)</option>
                          <option value="cancelled">✖ ملغي (cancelled)</option>
                        </select>
                      </div>
                    </div>
                  );
                })}
            </div>
          )}
        </div>
      )}

      {/* ========================================================= */}
      {/* 5. USERS MANAGEMENT TAB                                    */}
      {/* ========================================================= */}
      {activeTab === 'users' && (
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-3xl border border-stone-200/80 shadow-2xs flex items-center justify-between flex-wrap gap-2">
            <div>
              <h3 className="font-extrabold text-sm text-stone-900">سجل وحسابات المستخدمين ({usersList.length})</h3>
              <p className="text-xs text-stone-500">استعراض بيانات المستخدمين وصلاحيات الأدوار في Firestore</p>
            </div>
            <button
              onClick={fetchAllData}
              className="text-xs font-bold text-stone-700 bg-stone-100 hover:bg-stone-200 px-3 py-1.5 rounded-xl flex items-center gap-1 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>تحديث</span>
            </button>
          </div>

          <div className="space-y-2.5">
            {usersList.map((user) => (
              <div 
                key={user.id}
                className="bg-white p-3.5 rounded-2xl border border-stone-200/80 shadow-2xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-stone-100 text-stone-700 font-bold flex items-center justify-center border border-stone-200">
                    {user.name ? user.name.charAt(0) : 'U'}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-xs text-stone-900">{user.name || 'مستخدم بدون اسم'}</span>
                      <span className={`text-[10px] font-bold px-2 py-0.2 rounded-full border ${
                        user.role === 'admin' ? 'bg-amber-100 text-amber-900 border-amber-300' : 'bg-stone-100 text-stone-600 border-stone-200'
                      }`}>
                        {user.role === 'admin' ? 'مدير (Admin)' : 'عميل (Customer)'}
                      </span>
                    </div>
                    <span className="text-[11px] text-stone-500 font-sans block">{user.email} {user.phone ? `• ${user.phone}` : ''}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-center">
                  <button
                    onClick={() => handleToggleUserRole(user)}
                    className="text-xs font-bold bg-stone-100 hover:bg-stone-200 text-stone-800 px-3 py-1.5 rounded-xl border border-stone-200 cursor-pointer"
                  >
                    تغيير الصلاحية
                  </button>
                  <button
                    onClick={() => handleDeleteUser(user)}
                    className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-xl border border-rose-200 cursor-pointer"
                    title="حذف المستخدم"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 6. OFFERS MANAGEMENT TAB                                   */}
      {/* ========================================================= */}
      {activeTab === 'offers' && (
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-3xl border border-stone-200/80 shadow-2xs flex items-center justify-between">
            <div>
              <h3 className="font-extrabold text-sm text-stone-900">إدارة العروض الترويجية والبانرات ({offers.length})</h3>
              <p className="text-xs text-stone-500">إضافة بانرات العروض في الصفحة الرئيسية</p>
            </div>
            <button
              onClick={() => setIsOfferModalOpen(true)}
              className="bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-bold px-4 py-2 rounded-2xl flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span>إضافة عرض</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {offers.map((offer) => (
              <div key={offer.id} className="bg-white rounded-3xl border border-stone-200/80 shadow-2xs overflow-hidden">
                <img src={offer.image} alt={offer.titleAr} className="w-full h-32 object-cover" />
                <div className="p-3.5 space-y-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="font-black text-xs text-stone-900 block">{offer.titleAr}</span>
                      <p className="text-[11px] text-stone-500">{offer.subtitleAr}</p>
                    </div>
                    <span className="bg-amber-100 text-amber-900 text-[10px] font-bold px-2 py-0.5 rounded-full">
                      {offer.discountTag}
                    </span>
                  </div>

                  <div className="flex justify-between items-center pt-2 border-t border-stone-100 text-xs">
                    <button
                      onClick={() => handleToggleOffer(offer)}
                      className={`text-[10px] font-bold px-2.5 py-1 rounded-lg border ${
                        offer.active ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 'bg-rose-50 text-rose-700 border-rose-200'
                      }`}
                    >
                      {offer.active ? 'مفعل وظاهر' : 'مخفي'}
                    </button>
                    <button
                      onClick={() => handleDeleteOffer(offer.id)}
                      className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 7. COUPONS MANAGEMENT TAB                                  */}
      {/* ========================================================= */}
      {activeTab === 'coupons' && (
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-3xl border border-stone-200/80 shadow-2xs flex items-center justify-between">
            <div>
              <h3 className="font-extrabold text-sm text-stone-900">إدارة كوبونات وقسائم الخصم ({coupons.length})</h3>
              <p className="text-xs text-stone-500">إنشاء وتفعيل أكواد الخصم للعملاء في Firestore</p>
            </div>
            <button
              onClick={() => setIsCouponModalOpen(true)}
              className="bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-bold px-4 py-2 rounded-2xl flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span>إضافة كود خصم</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {coupons.map((c) => (
              <div key={c.id} className="bg-white p-4 rounded-3xl border border-stone-200/80 shadow-2xs space-y-2.5">
                <div className="flex justify-between items-center">
                  <span className="font-mono font-black text-sm bg-stone-100 text-stone-900 px-2.5 py-1 rounded-xl border border-stone-200">
                    {c.code}
                  </span>
                  <span className="bg-rose-50 text-rose-800 text-xs font-black px-2 py-0.5 rounded-full border border-rose-200 font-sans">
                    {c.discountPercent}% خصم
                  </span>
                </div>

                <p className="text-xs text-stone-600">{c.descriptionAr}</p>
                <div className="text-[10px] text-stone-400 font-medium">
                  الحد الأدنى للطلب: {currencySymbol || '€'}{c.minSpend} • صالح حتى: {c.validUntil}
                </div>

                <div className="flex justify-between items-center pt-2 border-t border-stone-100 text-xs">
                  <button
                    onClick={() => handleToggleCoupon(c)}
                    className={`text-[10px] font-bold px-2 py-1 rounded-lg border ${
                      c.isActive ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 'bg-rose-50 text-rose-700 border-rose-200'
                    }`}
                  >
                    {c.isActive ? 'نشط ومفعل' : 'معطل'}
                  </button>
                  <button
                    onClick={() => handleDeleteCoupon(c.id)}
                    className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 8. REFERRALS MANAGEMENT TAB                                */}
      {/* ========================================================= */}
      {activeTab === 'referrals' && (
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-3xl border border-stone-200/80 shadow-2xs">
            <h3 className="font-extrabold text-sm text-stone-900">سجل الإحالات والمكافآت ({referrals.length})</h3>
            <p className="text-xs text-stone-500">متابعة برامج دعوة الأصدقاء ونقاط المكافآت</p>
          </div>

          <div className="space-y-2.5">
            {referrals.map((ref) => (
              <div key={ref.id} className="bg-white p-3.5 rounded-2xl border border-stone-200/80 shadow-2xs flex justify-between items-center">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-xs text-stone-900">{ref.code}</span>
                    <span className={`text-[10px] font-bold px-2 py-0.2 rounded-full border ${
                      ref.status === 'completed' ? 'bg-emerald-100 text-emerald-900 border-emerald-300' : 'bg-amber-100 text-amber-900 border-amber-300'
                    }`}>
                      {ref.status === 'completed' ? 'مكتملة ومكافأة' : 'قيد الانتظار'}
                    </span>
                  </div>
                  <span className="text-[11px] text-stone-500 block">المُحيل: {ref.referrerUserId} • التاريخ: {ref.createdAt}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 9. NOTIFICATIONS MANAGEMENT TAB                            */}
      {/* ========================================================= */}
      {activeTab === 'notifications' && (
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-3xl border border-stone-200/80 shadow-2xs">
            <h3 className="font-extrabold text-sm text-stone-900">إرسال إشعار عام للعملاء (Broadcast)</h3>
            <p className="text-xs text-stone-500 mb-3">يصل الإشعار لجميع مستخدمي التطبيق ويحفظ في Firestore</p>

            <form onSubmit={handleSendNotification} className="space-y-3 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                <div className="sm:col-span-2 space-y-1">
                  <label className="font-bold text-stone-700">عنوان الإشعار *</label>
                  <input
                    type="text"
                    required
                    placeholder="مثال: وصول شحنة مكدوس وزعتر حلبي طازجة!"
                    value={notifTitle}
                    onChange={(e) => setNotifTitle(e.target.value)}
                    className="w-full bg-stone-50 border border-stone-200 rounded-xl p-2.5 focus:bg-white focus:border-emerald-700 outline-hidden font-bold"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-stone-700">نوع الإشعار</label>
                  <select
                    value={notifType}
                    onChange={(e) => setNotifType(e.target.value as any)}
                    className="w-full bg-stone-50 border border-stone-200 rounded-xl p-2.5 font-bold"
                  >
                    <option value="promo">عرض ترويجي (promo)</option>
                    <option value="system">نظام عام (system)</option>
                    <option value="order">شحنة وطلبات (order)</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-stone-700">نص الرسالة *</label>
                <textarea
                  rows={2}
                  required
                  placeholder="اكتب نص الإشعار هنا..."
                  value={notifMessage}
                  onChange={(e) => setNotifMessage(e.target.value)}
                  className="w-full bg-stone-50 border border-stone-200 rounded-xl p-2.5 focus:bg-white focus:border-emerald-700 outline-hidden font-medium"
                ></textarea>
              </div>

              <button
                type="submit"
                disabled={isSendingNotif}
                className="bg-emerald-800 hover:bg-emerald-900 text-white font-bold px-5 py-2.5 rounded-xl cursor-pointer flex items-center gap-1.5 shadow-xs"
              >
                <Send className="w-4 h-4" />
                <span>{isSendingNotif ? 'جاري الإرسال...' : 'إرسال الإشعار الآن'}</span>
              </button>
            </form>
          </div>

          {/* Previous Notifications */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-xs text-stone-800">
                سجل الإشعارات والتنبيهات ({notifications.length})
                {unreadNotifsCount > 0 && (
                  <span className="mr-2 bg-amber-100 text-amber-900 text-[10px] font-bold px-2 py-0.5 rounded-full border border-amber-200">
                    {unreadNotifsCount} غير مقروء
                  </span>
                )}
              </h4>
              {unreadNotifsCount > 0 && (
                <button
                  onClick={async () => {
                    await adminService.markAllNotificationsAsRead();
                    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
                    showToast('تم تحديد جميع الإشعارات كمقروءة');
                  }}
                  className="text-xs text-emerald-800 hover:text-emerald-900 font-bold flex items-center gap-1 cursor-pointer"
                >
                  <CheckCheck className="w-3.5 h-3.5" />
                  <span>تحديد الكل كمقروء</span>
                </button>
              )}
            </div>

            {notifications.length === 0 ? (
              <div className="p-8 text-center bg-stone-50 rounded-2xl border border-dashed border-stone-200 text-stone-400 text-xs">
                لا توجد إشعارات حالياً
              </div>
            ) : (
              notifications.map((n) => (
                <div 
                  key={n.id} 
                  className={`p-3.5 rounded-2xl border shadow-2xs flex justify-between items-start gap-3 text-xs transition-all ${
                    !n.read 
                      ? 'bg-amber-50/60 border-amber-200/90' 
                      : 'bg-white border-stone-200/80'
                  }`}
                >
                  <div className="flex items-start gap-2.5 flex-1">
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                      n.type === 'order' 
                        ? 'bg-emerald-100 text-emerald-800' 
                        : n.type === 'promo' 
                          ? 'bg-purple-100 text-purple-800' 
                          : 'bg-blue-100 text-blue-800'
                    }`}>
                      {n.type === 'order' ? <ShoppingBag className="w-4 h-4" /> : <Bell className="w-4 h-4" />}
                    </div>
                    <div className="space-y-0.5 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-stone-900">{n.title}</span>
                        {!n.read && (
                          <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                        )}
                      </div>
                      <p className="text-stone-600 text-[11px] leading-relaxed">{n.message}</p>
                      <div className="flex items-center gap-3 pt-1 text-[10px] text-stone-400 font-sans">
                        <span>{n.createdAt}</span>
                        {n.targetOrderId && (
                          <button
                            onClick={() => {
                              setActiveTab('orders');
                              setOrderStatusFilter('all');
                              if (!n.read) {
                                adminService.markNotificationAsRead(n.id);
                                setNotifications(prev => prev.map(item => item.id === n.id ? { ...item, read: true } : item));
                              }
                            }}
                            className="text-emerald-800 hover:underline font-bold font-sans cursor-pointer flex items-center gap-0.5"
                          >
                            <span>عرض الطلب #{n.targetOrderId}</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    {!n.read && (
                      <button
                        onClick={async () => {
                          await adminService.markNotificationAsRead(n.id);
                          setNotifications(prev => prev.map(item => item.id === n.id ? { ...item, read: true } : item));
                        }}
                        title="تحديد كمقروء"
                        className="p-1.5 text-stone-500 hover:text-emerald-800 hover:bg-emerald-50 rounded-lg cursor-pointer transition-colors"
                      >
                        <Check className="w-3.5 h-3.5" />
                      </button>
                    )}
                    <button
                      onClick={() => handleDeleteNotification(n.id)}
                      title="حذف الإشعار"
                      className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg cursor-pointer transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 10. SETTINGS MANAGEMENT TAB                                */}
      {/* ========================================================= */}
      {activeTab === 'settings' && settings && (
        <div className="bg-white p-4 sm:p-6 rounded-3xl border border-stone-200/80 shadow-2xs space-y-6">
          <div className="flex items-center justify-between border-b border-stone-100 pb-3">
            <div>
              <h3 className="font-extrabold text-sm sm:text-base text-stone-900 flex items-center gap-2">
                <Settings className="w-5 h-5 text-emerald-800" />
                <span>إعدادات وتكوين متجر بركة ماركت 24</span>
              </h3>
              <p className="text-xs text-stone-500">حالة فتح المتجر، رسوم التوصيل، الحد الأدنى للطلب، وطرق الدفع المقبولة في Firebase</p>
            </div>
            <span className="bg-emerald-50 text-emerald-800 text-[11px] font-bold px-2.5 py-1 rounded-xl border border-emerald-200">
              Firestore Doc: settings/store
            </span>
          </div>

          <form onSubmit={handleSaveSettings} className="space-y-6 text-xs">
            {/* Section 1: Store Open / Close Status */}
            <div className="bg-stone-50/80 p-4 rounded-2xl border border-stone-200/80 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-stone-900 text-xs flex items-center gap-1.5">
                    <span className={`w-2.5 h-2.5 rounded-full ${settings.isOpen !== false ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                    <span>حالة المتجر واستقبال الطلبات (Store Status)</span>
                  </h4>
                  <p className="text-[11px] text-stone-500 mt-0.5">
                    عند إغلاق المتجر، يمكن للزبائن تصفح المنتجات ولكن يتم تعطيل إتمام الطلبات مع عرض رسالة الإغلاق.
                  </p>
                </div>

                {/* Toggle Button */}
                <button
                  type="button"
                  onClick={() => setSettings({ ...settings, isOpen: settings.isOpen === false ? true : false })}
                  className={`px-4 py-2 rounded-xl font-black text-xs cursor-pointer flex items-center gap-2 transition-all shadow-xs ${
                    settings.isOpen !== false
                      ? 'bg-emerald-800 text-white hover:bg-emerald-900'
                      : 'bg-rose-600 text-white hover:bg-rose-700'
                  }`}
                >
                  {settings.isOpen !== false ? (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>المتجر مفتوح الآن (Open)</span>
                    </>
                  ) : (
                    <>
                      <AlertCircle className="w-4 h-4" />
                      <span>المتجر مغلق (Closed)</span>
                    </>
                  )}
                </button>
              </div>

              {/* Closed Store Custom Messages */}
              {settings.isOpen === false && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-stone-200 animate-in fade-in duration-200">
                  <div className="space-y-1">
                    <label className="font-bold text-stone-700">رسالة الإغلاق للعميل (بالعربية)</label>
                    <textarea
                      rows={2}
                      value={settings.closedMessageAr || ''}
                      onChange={(e) => setSettings({ ...settings, closedMessageAr: e.target.value })}
                      placeholder="المتجر مغلق حاليًا لاستقبال الطلبات الجديدة..."
                      className="w-full bg-white border border-stone-200 rounded-xl p-2.5 text-xs focus:bg-white focus:border-emerald-700 focus:outline-hidden resize-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-bold text-stone-700">رسالة الإغلاق (بالألمانية / German)</label>
                    <textarea
                      rows={2}
                      value={settings.closedMessageDe || ''}
                      onChange={(e) => setSettings({ ...settings, closedMessageDe: e.target.value })}
                      placeholder="Derzeit geschlossen. Sie können Produkte durchsuchen..."
                      className="w-full bg-white border border-stone-200 rounded-xl p-2.5 text-xs focus:bg-white focus:border-emerald-700 focus:outline-hidden resize-none"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Section 2: Delivery & Orders Thresholds */}
            <div className="bg-stone-50/80 p-4 rounded-2xl border border-stone-200/80 space-y-3">
              <h4 className="font-bold text-stone-900 text-xs flex items-center gap-1.5">
                <DollarSign className="w-4 h-4 text-emerald-800" />
                <span>إعدادات التوصيل والحدود المالية للطلبات (Delivery & Orders)</span>
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-stone-700">رسوم التوصيل الافتراضية (€)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={settings.deliveryFee !== undefined ? settings.deliveryFee : 2.50}
                    onChange={(e) => setSettings({ ...settings, deliveryFee: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-white border border-stone-200 rounded-xl p-2.5 font-sans font-bold"
                  />
                  <p className="text-[10px] text-stone-400">تضاف تلقائياً للسلة عند عدم بلوغ حد الشحن المجاني</p>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-stone-700">حد التوصيل المجاني (€)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={settings.freeDeliveryThreshold !== undefined ? settings.freeDeliveryThreshold : 50.00}
                    onChange={(e) => setSettings({ ...settings, freeDeliveryThreshold: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-white border border-stone-200 rounded-xl p-2.5 font-sans font-bold text-emerald-800"
                  />
                  <p className="text-[10px] text-stone-400">الطلبات فوق هذا المبلغ تحصل على توصيل مجاني</p>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-stone-700">الحد الأدنى لقيمة الطلب (€)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={settings.minOrderAmount !== undefined ? settings.minOrderAmount : 15.00}
                    onChange={(e) => setSettings({ ...settings, minOrderAmount: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-white border border-stone-200 rounded-xl p-2.5 font-sans font-bold text-amber-900"
                  />
                  <p className="text-[10px] text-stone-400">لا يمكن للزبون إتمام الطلب بمجموع سلة أقل من هذا</p>
                </div>
              </div>
            </div>

            {/* Section 3: Payment Methods Configuration */}
            <div className="bg-stone-50/80 p-4 rounded-2xl border border-stone-200/80 space-y-3">
              <h4 className="font-bold text-stone-900 text-xs flex items-center gap-1.5">
                <Ticket className="w-4 h-4 text-emerald-800" />
                <span>طرق الدفع المتاحة في السلة (Payment Methods)</span>
              </h4>
              <p className="text-[11px] text-stone-500">
                حدد طرق الدفع التي تظهر للزبائن عند إتمام الشراء في التطبيق.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                {/* Cash on Delivery */}
                <div 
                  onClick={() => setSettings({
                    ...settings,
                    paymentMethods: {
                      ...settings.paymentMethods,
                      cash_on_delivery: settings.paymentMethods?.cash_on_delivery === false ? true : false
                    }
                  })}
                  className={`p-3.5 rounded-2xl border cursor-pointer transition-all flex items-center justify-between ${
                    settings.paymentMethods?.cash_on_delivery !== false
                      ? 'bg-emerald-50/70 border-emerald-300 text-emerald-950 shadow-2xs'
                      : 'bg-white border-stone-200 text-stone-400'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <span className="text-base">💵</span>
                    <div>
                      <div className="font-bold text-xs">الدفع عند الاستلام</div>
                      <div className="text-[10px] text-stone-500">Cash on Delivery</div>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.paymentMethods?.cash_on_delivery !== false}
                    onChange={() => {}}
                    className="w-4 h-4 accent-emerald-800 rounded-sm cursor-pointer"
                  />
                </div>

                {/* Bank Transfer */}
                <div 
                  onClick={() => setSettings({
                    ...settings,
                    paymentMethods: {
                      ...settings.paymentMethods,
                      bank_transfer: settings.paymentMethods?.bank_transfer === false ? true : false
                    }
                  })}
                  className={`p-3.5 rounded-2xl border cursor-pointer transition-all flex items-center justify-between ${
                    settings.paymentMethods?.bank_transfer !== false
                      ? 'bg-emerald-50/70 border-emerald-300 text-emerald-950 shadow-2xs'
                      : 'bg-white border-stone-200 text-stone-400'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <span className="text-base">🏦</span>
                    <div>
                      <div className="font-bold text-xs">التحويل البنكي المباشر</div>
                      <div className="text-[10px] text-stone-500">Bank Transfer (Überweisung)</div>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.paymentMethods?.bank_transfer !== false}
                    onChange={() => {}}
                    className="w-4 h-4 accent-emerald-800 rounded-sm cursor-pointer"
                  />
                </div>

                {/* Card Payment */}
                <div 
                  onClick={() => setSettings({
                    ...settings,
                    paymentMethods: {
                      ...settings.paymentMethods,
                      card: settings.paymentMethods?.card === false ? true : false
                    }
                  })}
                  className={`p-3.5 rounded-2xl border cursor-pointer transition-all flex items-center justify-between ${
                    settings.paymentMethods?.card !== false
                      ? 'bg-emerald-50/70 border-emerald-300 text-emerald-950 shadow-2xs'
                      : 'bg-white border-stone-200 text-stone-400'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <span className="text-base">💳</span>
                    <div>
                      <div className="font-bold text-xs">الدفع الإلكتروني بالبطاقة</div>
                      <div className="text-[10px] text-stone-500">Credit / Debit Card</div>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.paymentMethods?.card !== false}
                    onChange={() => {}}
                    className="w-4 h-4 accent-emerald-800 rounded-sm cursor-pointer"
                  />
                </div>
              </div>

              {/* Bank Transfer Details Settings */}
              {settings.paymentMethods?.bank_transfer !== false && (
                <div className="mt-3 p-3 bg-white rounded-xl border border-stone-200 space-y-2">
                  <div className="font-bold text-stone-800 text-[11px]">بيانات الحساب البنكي لتحويل الزبائن:</div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <div>
                      <label className="text-[10px] text-stone-500 font-bold">اسم البنك</label>
                      <input
                        type="text"
                        value={settings.bankDetails?.bankName || ''}
                        onChange={(e) => setSettings({
                          ...settings,
                          bankDetails: { ...(settings.bankDetails || { bankName: '', accountHolder: '', iban: '' }), bankName: e.target.value }
                        })}
                        placeholder="Sparkasse"
                        className="w-full bg-stone-50 border border-stone-200 rounded-lg p-1.5 text-xs font-sans"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-stone-500 font-bold">اسم صاحب الحساب</label>
                      <input
                        type="text"
                        value={settings.bankDetails?.accountHolder || ''}
                        onChange={(e) => setSettings({
                          ...settings,
                          bankDetails: { ...(settings.bankDetails || { bankName: '', accountHolder: '', iban: '' }), accountHolder: e.target.value }
                        })}
                        placeholder="Baraka Markt 24 GmbH"
                        className="w-full bg-stone-50 border border-stone-200 rounded-lg p-1.5 text-xs font-sans"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-stone-500 font-bold">رقم الآيبان (IBAN)</label>
                      <input
                        type="text"
                        value={settings.bankDetails?.iban || ''}
                        onChange={(e) => setSettings({
                          ...settings,
                          bankDetails: { ...(settings.bankDetails || { bankName: '', accountHolder: '', iban: '' }), iban: e.target.value }
                        })}
                        placeholder="DE89 ..."
                        className="w-full bg-stone-50 border border-stone-200 rounded-lg p-1.5 text-xs font-mono"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Section 4: General Store Info */}
            <div className="bg-stone-50/80 p-4 rounded-2xl border border-stone-200/80 space-y-3">
              <h4 className="font-bold text-stone-900 text-xs flex items-center gap-1.5">
                <Users className="w-4 h-4 text-emerald-800" />
                <span>معلومات المتجر العامة وشريط الإعلان</span>
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-stone-700">اسم المتجر بالعربية</label>
                  <input
                    type="text"
                    value={settings.storeNameAr}
                    onChange={(e) => setSettings({ ...settings, storeNameAr: e.target.value })}
                    className="w-full bg-white border border-stone-200 rounded-xl p-2.5 font-bold"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-stone-700">رقم هاتف المتجر / خدمة العملاء</label>
                  <input
                    type="text"
                    value={settings.contactPhone}
                    onChange={(e) => setSettings({ ...settings, contactPhone: e.target.value })}
                    className="w-full bg-white border border-stone-200 rounded-xl p-2.5 font-sans"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-stone-700">شريط الإعلان أعلى التطبيق (Announcement Banner)</label>
                <input
                  type="text"
                  value={settings.announcementText}
                  onChange={(e) => setSettings({ ...settings, announcementText: e.target.value })}
                  className="w-full bg-white border border-stone-200 rounded-xl p-2.5 font-medium"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSavingSettings}
              className="bg-emerald-800 hover:bg-emerald-900 text-white font-bold px-7 py-3 rounded-2xl cursor-pointer flex items-center gap-2 shadow-sm transition-all text-xs sm:text-sm active:scale-98 disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{isSavingSettings ? 'جاري الحفظ في Firestore...' : 'حفظ ونشر الإعدادات في Firebase'}</span>
            </button>
          </form>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: Full Product Add / Edit                             */}
      {/* ========================================================= */}
      {isProductModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-5 space-y-4 shadow-2xl animate-scaleUp max-h-[92vh] overflow-y-auto">
            
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <h3 className="font-extrabold text-sm text-stone-900 flex items-center gap-2">
                <Package className="w-4 h-4 text-emerald-800" />
                <span>{editingProduct ? `تعديل الصنف: ${editingProduct.nameAr || editingProduct.name}` : 'إضافة صنف جديد إلى Firestore'}</span>
              </h3>
              <button 
                onClick={() => setIsProductModalOpen(false)}
                className="p-1 rounded-lg text-stone-400 hover:text-stone-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="space-y-4 text-xs">
              <div className="space-y-3 bg-stone-50/70 p-3.5 rounded-2xl border border-stone-100">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <label className="font-bold text-stone-700">اسم المنتج بالعربية (إجباري) *</label>
                    <input
                      type="text"
                      required
                      placeholder="مثال: جبنة حلوم بلدية مشللة فاخرة"
                      value={prodName}
                      onChange={(e) => setProdName(e.target.value)}
                      className="w-full bg-white border border-stone-200 rounded-xl p-2.5 focus:border-emerald-700 outline-hidden font-bold"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-stone-700">الاسم بالألمانية (اختياري)</label>
                    <input
                      type="text"
                      placeholder="z.B. Premium Halloumi Käse"
                      value={prodNameDe}
                      onChange={(e) => setProdNameDe(e.target.value)}
                      className="w-full bg-white border border-stone-200 rounded-xl p-2.5 focus:border-emerald-700 outline-hidden font-sans"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-stone-700">الاسم بالإنجليزية (اختياري)</label>
                    <input
                      type="text"
                      placeholder="e.g. Premium Halloumi Cheese"
                      value={prodNameEn}
                      onChange={(e) => setProdNameEn(e.target.value)}
                      className="w-full bg-white border border-stone-200 rounded-xl p-2.5 focus:border-emerald-700 outline-hidden font-sans"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="font-bold text-stone-700">القسم الرئيسي (Category) *</label>
                    <select
                      value={prodCategory}
                      onChange={(e) => {
                        setProdCategory(e.target.value);
                        const catSubs = subcategories.filter(s => s.categoryId === e.target.value);
                        setProdSubCategory(catSubs[0]?.id || catSubs[0]?.nameAr || '');
                      }}
                      className="w-full bg-white border border-stone-200 rounded-xl p-2.5 focus:border-emerald-700 outline-hidden font-bold text-stone-800"
                    >
                      {categories.map((cat) => (
                        <option key={cat.id} value={cat.id}>
                          {cat.nameAr || cat.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-stone-700">القسم الفرعي (Subcategory)</label>
                    <select
                      value={prodSubCategory}
                      onChange={(e) => setProdSubCategory(e.target.value)}
                      className="w-full bg-white border border-stone-200 rounded-xl p-2.5 focus:border-emerald-700 outline-hidden font-bold text-stone-800"
                    >
                      <option value="">بدون قسم فرعي (عرض مباشر)</option>
                      {subcategories
                        .filter(s => s.categoryId === prodCategory)
                        .map((sub) => (
                          <option key={sub.id} value={sub.id}>
                            {sub.nameAr || sub.name}
                          </option>
                        ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Pricing & Stock */}
              <div className="space-y-3 bg-stone-50/70 p-3.5 rounded-2xl border border-stone-100">
                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <label className="font-bold text-stone-700">السعر النهائي للبيع (€) *</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      required
                      value={prodPrice}
                      onChange={(e) => handlePriceChange(e.target.value)}
                      className="w-full bg-white border border-stone-200 rounded-xl p-2.5 font-sans font-extrabold text-emerald-800 text-sm"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-stone-700">السعر القديم قبل الخصم (€)</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={prodOldPrice}
                      onChange={(e) => handleOldPriceChange(e.target.value)}
                      className="w-full bg-white border border-stone-200 rounded-xl p-2.5 font-sans text-stone-600"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-stone-700">كمية المخزون *</label>
                    <input
                      type="number"
                      min="0"
                      value={prodStock}
                      onChange={(e) => setProdStock(e.target.value)}
                      className="w-full bg-white border border-stone-200 rounded-xl p-2.5 font-sans font-bold"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="space-y-1">
                    <label className="font-bold text-stone-700">الوحدة</label>
                    <select
                      value={prodUnit}
                      onChange={(e) => setProdUnit(e.target.value)}
                      className="w-full bg-white border border-stone-200 rounded-xl p-2.5 font-bold"
                    >
                      {COMMON_UNITS.map(u => (
                        <option key={u} value={u}>{u}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-stone-700">الوزن</label>
                    <input
                      type="text"
                      value={prodWeight}
                      onChange={(e) => setProdWeight(e.target.value)}
                      className="w-full bg-white border border-stone-200 rounded-xl p-2.5"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-stone-700">ظهور المنتج</label>
                    <select
                      value={prodIsAvailable ? 'show' : 'hide'}
                      onChange={(e) => setProdIsAvailable(e.target.value === 'show')}
                      className={`w-full border rounded-xl p-2.5 font-bold ${
                        prodIsAvailable ? 'bg-emerald-50 text-emerald-800' : 'bg-rose-50 text-rose-800'
                      }`}
                    >
                      <option value="show">ظاهر للعملاء (متاح)</option>
                      <option value="hide">مخفي (معطل مؤقتاً)</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-stone-700">المصدر</label>
                    <input
                      type="text"
                      value={prodOrigin}
                      onChange={(e) => setProdOrigin(e.target.value)}
                      className="w-full bg-white border border-stone-200 rounded-xl p-2.5"
                    />
                  </div>
                </div>
              </div>

              {/* Product Images Gallery */}
              <div className="space-y-3 bg-stone-50/70 p-3.5 rounded-2xl border border-stone-100">
                <div className="flex items-center justify-between">
                  <h4 className="font-extrabold text-[11px] text-stone-800 flex items-center gap-1.5">
                    <ImageIcon className="w-3.5 h-3.5 text-emerald-800" />
                    <span>صور المنتج (روابط أو رفع مباشر عبر Firebase Storage)</span>
                  </h4>
                  <span className="text-[10px] text-stone-500 font-bold">{prodImages.length} صور مضافة</span>
                </div>

                <div className="flex flex-col sm:flex-row gap-2">
                  <div className="flex-1 flex gap-2">
                    <input
                      type="url"
                      placeholder="أدخل رابط صورة (https://...)"
                      value={newImageUrl}
                      onChange={(e) => setNewImageUrl(e.target.value)}
                      className="w-full bg-white border border-stone-200 rounded-xl p-2.5 text-[11px] font-sans"
                    />
                    <button
                      type="button"
                      onClick={handleAddImageUrl}
                      disabled={!newImageUrl.trim()}
                      className="bg-stone-800 text-white font-bold px-3 py-2 rounded-xl shrink-0 cursor-pointer"
                    >
                      إضافة
                    </button>
                  </div>

                  <label className="bg-emerald-800 hover:bg-emerald-900 text-white font-bold px-4 py-2 rounded-xl flex items-center justify-center gap-1.5 cursor-pointer shrink-0 shadow-xs">
                    <Upload className="w-3.5 h-3.5" />
                    <span>{isUploadingImage ? 'جاري الرفع...' : 'رفع صور من الجهاز'}</span>
                    <input 
                      type="file" 
                      accept="image/*" 
                      multiple
                      onChange={(e) => handleImageFileUpload(e, 'product')} 
                      className="hidden" 
                      disabled={isUploadingImage}
                    />
                  </label>
                </div>

                {prodImages.length > 0 && (
                  <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 pt-2 border-t border-stone-200/60">
                    {prodImages.map((imgUrl, index) => (
                      <div 
                        key={index}
                        className={`relative group rounded-xl overflow-hidden border bg-white aspect-square flex items-center justify-center ${
                          index === 0 ? 'border-emerald-600 ring-2 ring-emerald-500/30' : 'border-stone-200'
                        }`}
                      >
                        <img src={imgUrl} alt={`Product ${index}`} className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1">
                          {index !== 0 && (
                            <button
                              type="button"
                              onClick={() => handleSetPrimaryImage(index)}
                              className="p-1 bg-white/80 rounded-md text-[9px] font-bold text-stone-900"
                              title="جعلها الصورة الرئيسية"
                            >
                              ★
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => handleRemoveImage(index)}
                            className="p-1 bg-rose-600 text-white rounded-md text-[9px]"
                            title="حذف الصورة"
                          >
                            ✕
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2 pt-2 border-t border-stone-100">
                <button
                  type="submit"
                  className="flex-1 bg-emerald-800 hover:bg-emerald-900 text-white font-bold py-2.5 rounded-xl cursor-pointer shadow-xs"
                >
                  {editingProduct ? 'حفظ التعديلات في Firestore' : 'إضافة ونشر المنتج في Firestore'}
                </button>
                <button
                  type="button"
                  onClick={() => setIsProductModalOpen(false)}
                  className="px-4 py-2.5 bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold rounded-xl cursor-pointer"
                >
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: Category Add / Edit                                 */}
      {/* ========================================================= */}
      {isCategoryModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-5 space-y-4 shadow-2xl">
            <div className="flex justify-between items-center border-b border-stone-100 pb-2.5">
              <h3 className="font-extrabold text-sm text-stone-900">
                {editingCategory ? 'تعديل القسم الرئيسي' : 'إضافة قسم رئيسي جديد'}
              </h3>
              <button onClick={() => setIsCategoryModalOpen(false)}>
                <X className="w-5 h-5 text-stone-400" />
              </button>
            </div>

            <form onSubmit={handleSaveCategory} className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-stone-700">اسم القسم بالعربية (إجباري) *</label>
                <input
                  type="text"
                  required
                  placeholder="مثال: الأجبان والألبان البلدية"
                  value={catName}
                  onChange={(e) => setCatName(e.target.value)}
                  className="w-full bg-stone-50 border border-stone-200 rounded-xl p-2.5 font-bold focus:border-emerald-700 outline-hidden"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-stone-700">الاسم بالألمانية (اختياري)</label>
                  <input
                    type="text"
                    placeholder="z.B. Milch & Käseprodukte"
                    value={catNameDe}
                    onChange={(e) => setCatNameDe(e.target.value)}
                    className="w-full bg-stone-50 border border-stone-200 rounded-xl p-2.5 font-sans focus:border-emerald-700 outline-hidden"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-stone-700">الاسم بالإنجليزية (اختياري)</label>
                  <input
                    type="text"
                    placeholder="e.g. Dairy & Cheese"
                    value={catNameEn}
                    onChange={(e) => setCatNameEn(e.target.value)}
                    className="w-full bg-stone-50 border border-stone-200 rounded-xl p-2.5 font-sans focus:border-emerald-700 outline-hidden"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-stone-700">رقم الترتيب (Sort Order)</label>
                  <input
                    type="number"
                    min="1"
                    value={catSortOrder}
                    onChange={(e) => setCatSortOrder(e.target.value)}
                    className="w-full bg-stone-50 border border-stone-200 rounded-xl p-2.5 font-mono font-bold focus:border-emerald-700 outline-hidden"
                  />
                </div>

                <div className="space-y-1 flex flex-col justify-end">
                  <label className="flex items-center gap-2 cursor-pointer bg-stone-50 p-2.5 rounded-xl border border-stone-200">
                    <input
                      type="checkbox"
                      checked={catIsActive}
                      onChange={(e) => setCatIsActive(e.target.checked)}
                      className="w-4 h-4 text-emerald-700 accent-emerald-700 rounded-sm cursor-pointer"
                    />
                    <span className="font-bold text-stone-700 text-[11px]">تفعيل القسم للعملاء (نشط)</span>
                  </label>
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-stone-700">صورة القسم (رابط أو رفع من جهازك)</label>
                <div className="flex gap-2">
                  <input
                    type="url"
                    value={catImage}
                    onChange={(e) => setCatImage(e.target.value)}
                    className="w-full bg-stone-50 border border-stone-200 rounded-xl p-2.5 font-sans text-[11px] focus:border-emerald-700 outline-hidden"
                  />
                  <label className="bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold px-3 py-2 rounded-xl flex items-center gap-1 cursor-pointer shrink-0">
                    <Upload className="w-3.5 h-3.5" />
                    <span>{isUploadingImage ? 'جاري...' : 'رفع'}</span>
                    <input 
                      type="file" 
                      accept="image/*" 
                      onChange={(e) => handleImageFileUpload(e, 'category')} 
                      className="hidden" 
                      disabled={isUploadingImage}
                    />
                  </label>
                </div>
                {catImage && (
                  <div className="mt-1 flex items-center gap-2">
                    <img src={catImage} alt="Preview" className="w-10 h-10 rounded-lg object-cover border border-stone-200" />
                    <span className="text-[10px] text-stone-500">معاينة صورة القسم</span>
                  </div>
                )}
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  className="flex-1 bg-emerald-800 hover:bg-emerald-900 text-white font-bold py-2.5 rounded-xl cursor-pointer shadow-xs"
                >
                  {editingCategory ? 'حفظ تعديلات القسم' : 'إضافة القسم إلى Firestore'}
                </button>
                <button
                  type="button"
                  onClick={() => setIsCategoryModalOpen(false)}
                  className="px-4 py-2.5 bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold rounded-xl cursor-pointer"
                >
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: Coupon Add                                          */}
      {/* ========================================================= */}
      {isCouponModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-5 space-y-4 shadow-2xl">
            <div className="flex justify-between items-center border-b border-stone-100 pb-2.5">
              <h3 className="font-extrabold text-sm text-stone-900">إنشاء كود خصم جديد</h3>
              <button onClick={() => setIsCouponModalOpen(false)}>
                <X className="w-5 h-5 text-stone-400" />
              </button>
            </div>

            <form onSubmit={handleSaveCoupon} className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-stone-700">كود الخصم (مثال: BARAKA20) *</label>
                <input
                  type="text"
                  required
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                  className="w-full bg-stone-50 border border-stone-200 rounded-xl p-2.5 font-mono font-bold uppercase"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-stone-700">نسبة الخصم (%)</label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={couponDiscount}
                    onChange={(e) => setCouponDiscount(e.target.value)}
                    className="w-full bg-stone-50 border border-stone-200 rounded-xl p-2.5 font-bold"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-stone-700">الحد الأدنى للطلب (€)</label>
                  <input
                    type="number"
                    value={couponMinSpend}
                    onChange={(e) => setCouponMinSpend(e.target.value)}
                    className="w-full bg-stone-50 border border-stone-200 rounded-xl p-2.5 font-bold"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-stone-700">وصف الكوبون</label>
                <input
                  type="text"
                  placeholder="خصم 10% على مؤونة رمضان..."
                  value={couponDesc}
                  onChange={(e) => setCouponDesc(e.target.value)}
                  className="w-full bg-stone-50 border border-stone-200 rounded-xl p-2.5"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  className="flex-1 bg-emerald-800 text-white font-bold py-2.5 rounded-xl cursor-pointer"
                >
                  حفظ وتفعيل الكوبون
                </button>
                <button
                  type="button"
                  onClick={() => setIsCouponModalOpen(false)}
                  className="px-4 py-2.5 bg-stone-100 text-stone-700 font-bold rounded-xl"
                >
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: Offer Add                                           */}
      {/* ========================================================= */}
      {isOfferModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-5 space-y-4 shadow-2xl">
            <div className="flex justify-between items-center border-b border-stone-100 pb-2.5">
              <h3 className="font-extrabold text-sm text-stone-900">إضافة عرض ترويجي وبانر</h3>
              <button onClick={() => setIsOfferModalOpen(false)}>
                <X className="w-5 h-5 text-stone-400" />
              </button>
            </div>

            <form onSubmit={handleSaveOffer} className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-stone-700">عنوان العرض الرئيسي *</label>
                <input
                  type="text"
                  required
                  placeholder="مؤونة رمضان المبارك"
                  value={offerTitle}
                  onChange={(e) => setOfferTitle(e.target.value)}
                  className="w-full bg-stone-50 border border-stone-200 rounded-xl p-2.5 font-bold"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-stone-700">النص الفرعي</label>
                <input
                  type="text"
                  placeholder="خصم حتى 30% على الأجبان والزيوت"
                  value={offerSubtitle}
                  onChange={(e) => setOfferSubtitle(e.target.value)}
                  className="w-full bg-stone-50 border border-stone-200 rounded-xl p-2.5"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-stone-700">شارة الخصم</label>
                  <input
                    type="text"
                    placeholder="30% خصم"
                    value={offerTag}
                    onChange={(e) => setOfferTag(e.target.value)}
                    className="w-full bg-stone-50 border border-stone-200 rounded-xl p-2.5 font-bold"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-stone-700">رابط صورة البانر</label>
                  <input
                    type="url"
                    value={offerImage}
                    onChange={(e) => setOfferImage(e.target.value)}
                    className="w-full bg-stone-50 border border-stone-200 rounded-xl p-2.5 font-sans text-[11px]"
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  className="flex-1 bg-emerald-800 text-white font-bold py-2.5 rounded-xl cursor-pointer"
                >
                  حفظ ونشر العرض
                </button>
                <button
                  type="button"
                  onClick={() => setIsOfferModalOpen(false)}
                  className="px-4 py-2.5 bg-stone-100 text-stone-700 font-bold rounded-xl"
                >
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
