import React, { useState, useEffect } from 'react';
import { 
  User as UserIcon, 
  MapPin, 
  Phone, 
  Mail, 
  Package, 
  Heart, 
  ShieldCheck, 
  LogOut, 
  ChevronLeft, 
  ChevronRight,
  Settings,
  HelpCircle,
  LogIn,
  Edit3,
  Check,
  X,
  Sparkles,
  ShoppingBag,
  Gift,
  Copy,
  CheckCheck,
  Share2,
  Users,
  Bell,
  BellRing,
  Volume2,
  VolumeX,
  Truck,
  FileText,
  CheckCircle2,
  AlertTriangle,
  Send,
  Globe
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { referralService } from '../services/referralService';
import { fcmService } from '../services/fcmService';
import { LanguageSwitcher } from '../components/common/LanguageSwitcher';

export const ProfileScreen: React.FC = () => {
  const { 
    currentUser, 
    logout, 
    updateProfile,
    navigateTo, 
    wishlist,
    requestPushNotifications,
    showToast,
    dir,
    t,
    language,
    setIsLanguageModalOpen
  } = useApp();

  const isRtl = dir === 'rtl';
  const ChevronIcon = isRtl ? ChevronLeft : ChevronRight;

  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [editName, setEditName] = useState<string>(currentUser?.name || '');
  const [editPhone, setEditPhone] = useState<string>(currentUser?.phone || '');
  const [editCity, setEditCity] = useState<string>(currentUser?.city || 'Greifswald');
  const [editAddress, setEditAddress] = useState<string>(currentUser?.address || '');
  const [isSaving, setIsSaving] = useState<boolean>(false);

  // Referral System States
  const [referralCount, setReferralCount] = useState<number>(0);
  const [copied, setCopied] = useState<boolean>(false);
  const [activeReferralCode, setActiveReferralCode] = useState<string>(currentUser?.referralCode || '');

  // Notification Preferences States
  const [orderNotifsEnabled, setOrderNotifsEnabled] = useState<boolean>(() => {
    return fcmService.getNotificationPreferences().orderUpdates;
  });
  const [offersNotifsEnabled, setOffersNotifsEnabled] = useState<boolean>(() => {
    return fcmService.getNotificationPreferences().offers;
  });
  const [soundAlertsEnabled, setSoundAlertsEnabled] = useState<boolean>(() => {
    return fcmService.getNotificationPreferences().soundEnabled;
  });
  const [browserPermission, setBrowserPermission] = useState<NotificationPermission>(() => {
    return fcmService.getPermissionState();
  });
  const [isSendingTestNotif, setIsSendingTestNotif] = useState<boolean>(false);

  useEffect(() => {
    if (currentUser?.id) {
      // Ensure referral code exists
      if (!currentUser.referralCode) {
        referralService.ensureReferralCode(currentUser).then(code => {
          setActiveReferralCode(code);
        });
      } else {
        setActiveReferralCode(currentUser.referralCode);
      }

      // Fetch referral count
      referralService.getReferralCount(currentUser.id).then(count => {
        setReferralCount(count);
      });
    }
  }, [currentUser?.id, currentUser?.referralCode]);

  const handleCopyCode = async () => {
    const codeToCopy = activeReferralCode || currentUser?.referralCode;
    if (!codeToCopy) return;

    try {
      await navigator.clipboard.writeText(codeToCopy);
      setCopied(true);
      showToast(t('profile.copied'));
      setTimeout(() => setCopied(false), 2500);
    } catch (e) {
      showToast(`${t('profile.referralCode')}: ${codeToCopy}`);
    }
  };

  const handleShareInvite = async () => {
    const codeToShare = activeReferralCode || currentUser?.referralCode;
    if (!codeToShare) return;

    const shareTitle = language === 'ar' ? 'دعوة للانضمام إلى بركة ماركت 24' : 'Barakamarkt24 Invitation';
    const shareText = language === 'ar' 
      ? `تسوّق أطيب خيرات ومؤونة بلاد الشام في ألمانيا عبر متجر بركة ماركت 🛒! استخدم كود الدعوة الخاص بي: ${codeToShare}`
      : `Shop quality Oriental groceries in Germany on Barakamarkt24 🛒! Use my referral code: ${codeToShare}`;
    const shareUrl = window.location.origin;

    if (navigator.share) {
      try {
        await navigator.share({
          title: shareTitle,
          text: shareText,
          url: shareUrl,
        });
      } catch (err: any) {
        if (err?.name !== 'AbortError') {
          handleCopyCode();
        }
      }
    } else {
      handleCopyCode();
    }
  };

  const handleStartEdit = () => {
    if (!currentUser) return;
    setEditName(currentUser.name || '');
    setEditPhone(currentUser.phone || '');
    setEditCity(currentUser.city || 'Greifswald');
    setEditAddress(currentUser.address || '');
    setIsEditing(true);
  };

  const handleToggleOrderNotifs = (enabled: boolean) => {
    setOrderNotifsEnabled(enabled);
    fcmService.saveNotificationPreferences({ orderUpdates: enabled }, currentUser);
    showToast(enabled 
      ? (language === 'ar' ? 'تم تفعيل إشعارات الطلبات والتوصيل 🔔' : 'Bestellbenachrichtigungen aktiviert 🔔')
      : (language === 'ar' ? 'تم إيقاف إشعارات الطلبات مؤقتاً' : 'Bestellbenachrichtigungen deaktiviert')
    );
  };

  const handleToggleOffersNotifs = (enabled: boolean) => {
    setOffersNotifsEnabled(enabled);
    fcmService.saveNotificationPreferences({ offers: enabled }, currentUser);
    showToast(enabled 
      ? (language === 'ar' ? 'تم تفعيل إشعارات العروض والتخفيضات 🏷️' : 'Angebotsbenachrichtigungen aktiviert 🏷️')
      : (language === 'ar' ? 'تم إيقاف إشعارات العروض' : 'Angebotsbenachrichtigungen deaktiviert')
    );
  };

  const handleToggleSoundAlerts = (enabled: boolean) => {
    setSoundAlertsEnabled(enabled);
    fcmService.saveNotificationPreferences({ soundEnabled: enabled }, currentUser);
    showToast(enabled 
      ? (language === 'ar' ? 'تم تفعيل التنبيهات الصوتية 🔊' : 'Töne aktiviert 🔊')
      : (language === 'ar' ? 'تم كتم أصوات التنبيهات 🔇' : 'Töne stummgeschaltet 🔇')
    );
  };

  const handleEnablePushPermissions = async () => {
    const token = await requestPushNotifications();
    const state = fcmService.getPermissionState();
    setBrowserPermission(state);
    if (token) {
      setOrderNotifsEnabled(true);
      fcmService.saveNotificationPreferences({ orderUpdates: true }, currentUser);
    }
  };

  const handleSendTestNotification = async () => {
    setIsSendingTestNotif(true);
    try {
      const userRole = (currentUser?.role as any) || 'customer';
      const success = await fcmService.triggerTestNotification(userRole);
      if (success) {
        showToast(language === 'ar' ? 'تم إرسال إشعار تجريبي بنجاح! تحقق من شاشتك 🔔' : 'Testbenachrichtigung gesendet! 🔔');
      } else {
        showToast(language === 'ar' ? 'يرجى السماح بإذن الإشعارات أولاً' : 'Bitte Benachrichtigungen im Browser erlauben');
      }
    } catch {
      showToast(language === 'ar' ? 'تعذر إرسال الإشعار التجريبي' : 'Fehler beim Senden der Benachrichtigung');
    } finally {
      setIsSendingTestNotif(false);
      setBrowserPermission(fcmService.getPermissionState());
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editName.trim() || !editPhone.trim()) {
      showToast(language === 'ar' ? 'يرجى ملء الاسم ورقم الهاتف' : 'Bitte Name und Telefonnummer ausfüllen');
      return;
    }

    setIsSaving(true);
    try {
      await updateProfile({
        name: editName.trim(),
        phone: editPhone.trim(),
        city: editCity.trim(),
        address: editAddress.trim()
      });
      setIsEditing(false);
    } catch (err: any) {
      showToast(err?.message || (language === 'ar' ? 'حدث خطأ أثناء حفظ التعديلات' : 'Fehler beim Speichern'));
    } finally {
      setIsSaving(false);
    }
  };

  // If user is not logged in
  if (!currentUser) {
    return (
      <div className="p-6 space-y-6 max-w-md mx-auto text-center my-8" dir={dir}>
        <div className="w-20 h-20 bg-emerald-50 text-emerald-800 rounded-3xl flex items-center justify-center mx-auto border border-emerald-200/80 shadow-2xs">
          <UserIcon className="w-10 h-10" />
        </div>

        <div className="space-y-1.5">
          <h2 className="text-xl font-black text-stone-900">{t('profile.guestPromptTitle')}</h2>
          <p className="text-xs text-stone-500 leading-relaxed max-w-xs mx-auto">
            {t('profile.guestPromptDesc')}
          </p>
        </div>

        <div className="space-y-2.5 pt-2">
          <button
            onClick={() => navigateTo('auth')}
            className="w-full bg-emerald-800 hover:bg-emerald-900 text-white font-bold py-3.5 px-4 rounded-2xl text-xs sm:text-sm flex items-center justify-center gap-2 cursor-pointer shadow-md active:scale-98 transition-all"
          >
            <LogIn className="w-4 h-4 text-amber-300" />
            <span>{t('auth.loginBtn')}</span>
          </button>

          <button
            onClick={() => navigateTo('auth')}
            className="w-full bg-white hover:bg-stone-50 border border-stone-300 text-stone-800 font-bold py-3 px-4 rounded-2xl text-xs sm:text-sm flex items-center justify-center gap-2 cursor-pointer shadow-2xs active:scale-98 transition-all"
          >
            <Sparkles className="w-4 h-4 text-amber-600" />
            <span>{t('auth.registerBtn')}</span>
          </button>

          <button
            onClick={() => navigateTo('home')}
            className="w-full bg-stone-100 hover:bg-stone-200 text-stone-600 font-semibold py-2.5 px-4 rounded-2xl text-xs flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
          >
            <ShoppingBag className="w-3.5 h-3.5" />
            <span>{t('cart.continueShopping')}</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4 max-w-lg mx-auto pb-28" dir={dir}>
      
      {/* Profile Card Header */}
      <div className="bg-white p-5 rounded-3xl border border-stone-200/80 shadow-2xs space-y-4">
        
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-14 h-14 rounded-2xl bg-emerald-800 text-amber-300 font-bold text-xl flex items-center justify-center shadow-md shrink-0">
              {currentUser.name ? currentUser.name[0] : 'U'}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="font-black text-base text-stone-900 truncate">
                  {currentUser.name}
                </h1>
                {currentUser.role === 'admin' && (
                  <span className="bg-amber-100 text-amber-800 text-[10px] font-bold px-2 py-0.5 rounded-full border border-amber-200">
                    ⭐ Admin
                  </span>
                )}
                {currentUser.role === 'driver' && (
                  <span className="bg-cyan-100 text-cyan-800 text-[10px] font-bold px-2 py-0.5 rounded-full border border-cyan-200">
                    🚚 Driver
                  </span>
                )}
                {currentUser.role !== 'admin' && currentUser.role !== 'driver' && (
                  <span className="bg-stone-100 text-stone-700 text-[10px] font-bold px-2 py-0.5 rounded-full border border-stone-200">
                    {language === 'ar' ? 'عميل' : language === 'de' ? 'Kunde' : language === 'uk' ? 'Клієнт' : language === 'fa' ? 'مشتری' : 'Customer'}
                  </span>
                )}
              </div>
              <p className="text-xs text-stone-500 font-sans truncate">{currentUser.email}</p>
              <p className="text-[11px] text-stone-600 font-sans pt-0.5">{currentUser.phone || (language === 'ar' ? 'لم يتم تحديد الهاتف' : 'Keine Telefonnummer')}</p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {!isEditing && (
              <button
                onClick={handleStartEdit}
                className="bg-stone-50 hover:bg-stone-100 border border-stone-200 text-stone-700 text-xs font-bold px-2.5 py-2 rounded-xl flex items-center gap-1 cursor-pointer shadow-2xs transition-colors"
                title={t('profile.editProfile')}
              >
                <Edit3 className="w-3.5 h-3.5 text-emerald-800" />
                <span className="hidden sm:inline">{t('profile.editProfile')}</span>
              </button>
            )}

            <button
              onClick={logout}
              className="bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 text-xs font-bold px-2.5 py-2 rounded-xl flex items-center gap-1 cursor-pointer shadow-2xs transition-colors"
              title={t('auth.logout')}
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="text-[11px]">{t('auth.logout')}</span>
            </button>
          </div>
        </div>

        {/* Edit Form Modal/Collapse */}
        {isEditing ? (
          <form onSubmit={handleSaveProfile} className="pt-3 border-t border-stone-100 space-y-3 animate-in fade-in">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-emerald-900 flex items-center gap-1">
                <Edit3 className="w-3.5 h-3.5" />
                <span>{t('profile.editProfile')}:</span>
              </span>
              <button
                type="button"
                onClick={handleCancelEdit}
                className="text-stone-400 hover:text-stone-600 p-1 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Name */}
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-stone-700">{t('checkout.fullName')}:</label>
              <input
                type="text"
                required
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                placeholder="Ahmad"
                className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-xs focus:bg-white focus:border-emerald-700 focus:outline-hidden"
              />
            </div>

            {/* Phone */}
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-stone-700">{t('checkout.phone')}:</label>
              <input
                type="tel"
                required
                value={editPhone}
                onChange={(e) => setEditPhone(e.target.value)}
                placeholder="+49 152 12345678"
                className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-xs focus:bg-white focus:border-emerald-700 focus:outline-hidden font-sans"
              />
            </div>

            {/* City & Address */}
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-stone-700">{t('checkout.city')}:</label>
                <input
                  type="text"
                  value={editCity}
                  onChange={(e) => setEditCity(e.target.value)}
                  placeholder="Greifswald"
                  className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-xs focus:bg-white focus:border-emerald-700 focus:outline-hidden"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-stone-700">{t('checkout.address')}:</label>
                <input
                  type="text"
                  value={editAddress}
                  onChange={(e) => setEditAddress(e.target.value)}
                  placeholder="Marktplatz 12"
                  className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-xs focus:bg-white focus:border-emerald-700 focus:outline-hidden"
                />
              </div>
            </div>

            <div className="flex gap-2 pt-1">
              <button
                type="submit"
                disabled={isSaving}
                className="flex-1 bg-emerald-800 hover:bg-emerald-900 text-white font-bold py-2.5 rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-xs cursor-pointer active:scale-98 transition-all disabled:opacity-50"
              >
                <Check className="w-4 h-4 text-amber-300" />
                <span>{isSaving ? t('common.loading') : t('profile.saveChanges')}</span>
              </button>
              <button
                type="button"
                onClick={handleCancelEdit}
                className="px-4 bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold py-2.5 rounded-xl text-xs cursor-pointer transition-colors"
              >
                {t('common.cancel')}
              </button>
            </div>
          </form>
        ) : (
          /* Address display */
          <div className="pt-3 border-t border-stone-100 flex items-start gap-2 text-xs text-stone-600">
            <MapPin className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-stone-800">{t('checkout.shippingAddress')}: </span>
              <span>
                {currentUser.address ? `${currentUser.city || 'Greifswald'} - ${currentUser.address}` : `${currentUser.city || 'Greifswald'}`}
              </span>
            </div>
          </div>
        )}

      </div>

      {/* Referral Program Card */}
      <div className="bg-gradient-to-br from-emerald-900 via-emerald-800 to-stone-900 text-white rounded-3xl p-5 shadow-sm border border-emerald-700/50 space-y-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-400/20 border border-amber-300/30 text-amber-300 flex items-center justify-center shrink-0">
              <Gift className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-black text-sm text-amber-300">{t('profile.referralCode')}</h2>
              <p className="text-[11px] text-emerald-100/80">{t('profile.shareApp')}</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 bg-black/20 backdrop-blur-xs px-2.5 py-1 rounded-full border border-white/10 text-[11px]">
            <Users className="w-3.5 h-3.5 text-amber-300" />
            <span className="text-stone-300">
              {language === 'ar' ? 'الإحالات:' : language === 'de' ? 'Empfehlungen:' : language === 'uk' ? 'Запрошення:' : language === 'fa' ? 'معرفی‌ها:' : 'Referrals:'}
            </span>
            <span className="font-bold text-amber-300 font-sans">{referralCount}</span>
          </div>
        </div>

        {/* Code Container */}
        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3 border border-white/15 flex items-center justify-between gap-2">
          <div className="space-y-0.5">
            <span className="text-[10px] text-emerald-200 block font-medium">{t('profile.referralCode')}:</span>
            <span className="font-mono text-base font-black tracking-widest text-amber-300 uppercase">
              {activeReferralCode || t('common.loading')}
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={handleCopyCode}
              className="bg-amber-400 hover:bg-amber-300 text-stone-950 font-bold px-3 py-2 rounded-xl text-xs flex items-center gap-1.5 cursor-pointer shadow-xs transition-colors active:scale-95"
            >
              {copied ? (
                <>
                  <CheckCheck className="w-3.5 h-3.5 text-emerald-950" />
                  <span>{t('profile.copied')}</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>{t('profile.copyReferral')}</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handleShareInvite}
              className="bg-white/15 hover:bg-white/25 text-white font-bold p-2 rounded-xl text-xs flex items-center justify-center cursor-pointer border border-white/20 transition-colors active:scale-95"
              title={t('profile.shareApp')}
              aria-label={t('profile.shareApp')}
            >
              <Share2 className="w-4 h-4 text-emerald-100" />
            </button>
          </div>
        </div>
      </div>

      {/* Navigation Quick Links */}
      <div className="bg-white rounded-3xl border border-stone-200/80 overflow-hidden shadow-2xs divide-y divide-stone-100 text-xs">
        
        {/* Admin Dashboard Entry for role === 'admin' */}
        {currentUser.role === 'admin' && (
          <button
            onClick={() => navigateTo('admin')}
            className="w-full p-4 flex items-center justify-between bg-amber-500/10 hover:bg-amber-500/20 transition-colors cursor-pointer text-stone-900 border-b border-amber-200"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-2xl bg-amber-600 text-white flex items-center justify-center shadow-xs">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div className={isRtl ? 'text-right' : 'text-left'}>
                <div className="flex items-center gap-1.5">
                  <span className="font-black text-amber-950">{t('profile.adminAccess')}</span>
                  <span className="bg-amber-600 text-white text-[9px] font-bold px-1.5 py-0.2 rounded-md">Admin</span>
                </div>
                <span className="text-[10px] text-stone-500 block">
                  {language === 'ar' ? 'إدارة المنتجات، الطلبات، العروض، المستخدمين والمزيد' : 'Produkte, Bestellungen, Angebote verwalten'}
                </span>
              </div>
            </div>
            <ChevronIcon className="w-4 h-4 text-amber-700" />
          </button>
        )}

        {/* Driver Dashboard Entry for role === 'driver' */}
        {currentUser.role === 'driver' && (
          <button
            onClick={() => navigateTo('driver')}
            className="w-full p-4 flex items-center justify-between bg-cyan-500/10 hover:bg-cyan-500/20 transition-colors cursor-pointer text-stone-900 border-b border-cyan-200"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-2xl bg-cyan-800 text-white flex items-center justify-center shadow-xs">
                <Truck className="w-5 h-5" />
              </div>
              <div className={isRtl ? 'text-right' : 'text-left'}>
                <div className="flex items-center gap-1.5">
                  <span className="font-black text-cyan-950">{t('profile.driverAccess')}</span>
                  <span className="bg-cyan-800 text-white text-[9px] font-bold px-1.5 py-0.2 rounded-md">Driver</span>
                </div>
                <span className="text-[10px] text-stone-500 block">
                  {language === 'ar' ? 'عرض الطلبات المعينة لك وتحديث مراحل التوصيل' : 'Zugewiesene Lieferungen anzeigen und aktualisieren'}
                </span>
              </div>
            </div>
            <ChevronIcon className="w-4 h-4 text-cyan-700" />
          </button>
        )}

        <button
          onClick={() => navigateTo('orders')}
          className="w-full p-4 flex items-center justify-between hover:bg-stone-50 transition-colors cursor-pointer text-stone-800"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-2xl bg-emerald-50 text-emerald-800 flex items-center justify-center">
              <Package className="w-4 h-4" />
            </div>
            <span className="font-bold">{t('nav.orders')}</span>
          </div>
          <ChevronIcon className="w-4 h-4 text-stone-400" />
        </button>

        <button
          onClick={() => navigateTo('wishlist')}
          className="w-full p-4 flex items-center justify-between hover:bg-stone-50 transition-colors cursor-pointer text-stone-800"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center">
              <Heart className="w-4 h-4" />
            </div>
            <div className="flex items-center gap-2">
              <span className="font-bold">{t('nav.wishlist')}</span>
              {wishlist.length > 0 && (
                <span className="bg-rose-100 text-rose-700 text-[10px] font-bold px-2 py-0.5 rounded-full font-sans">
                  {wishlist.length}
                </span>
              )}
            </div>
          </div>
          <ChevronIcon className="w-4 h-4 text-stone-400" />
        </button>

        <button
          onClick={() => navigateTo('cart')}
          className="w-full p-4 flex items-center justify-between hover:bg-stone-50 transition-colors cursor-pointer text-stone-800"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-2xl bg-amber-50 text-amber-800 flex items-center justify-center">
              <ShoppingBag className="w-4 h-4" />
            </div>
            <span className="font-bold">{t('nav.cart')}</span>
          </div>
          <ChevronIcon className="w-4 h-4 text-stone-400" />
        </button>

        {/* Dedicated Push Notifications & Alert Control Center */}
        <div className="p-4 bg-stone-50/70 space-y-3.5 border-y border-stone-200/70 text-stone-800">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center">
                <BellRing className="w-4 h-4" />
              </div>
              <div>
                <span className="font-bold text-xs block text-stone-900">{t('profile.notificationsSetting')}</span>
                <span className="text-[10px] text-stone-500">
                  {language === 'ar' ? 'تحكم كامل في إشعارات الطلبات والعروض على هذا الجهاز' : 'Benachrichtigungen auf diesem Gerät verwalten'}
                </span>
              </div>
            </div>
            
            {browserPermission === 'granted' ? (
              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                <CheckCircle2 className="w-3 h-3" />
                {language === 'ar' ? 'مفعل بالجهاز' : 'Aktiviert'}
              </span>
            ) : browserPermission === 'denied' ? (
              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-md border border-rose-200">
                <AlertTriangle className="w-3 h-3" />
                {language === 'ar' ? 'محظور بالمتصفح' : 'Blockiert'}
              </span>
            ) : (
              <button
                onClick={handleEnablePushPermissions}
                className="text-[10px] font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 px-2.5 py-1 rounded-lg border border-blue-200 transition-colors cursor-pointer"
              >
                {language === 'ar' ? 'تفعيل الإذن الآن' : 'Aktivieren'}
              </button>
            )}
          </div>

          <div className="space-y-2.5 pt-1">
            {/* Toggle 1: Order Notifications */}
            <div className="flex items-center justify-between bg-white p-3 rounded-xl border border-stone-200/80 shadow-2xs">
              <div className="flex items-center gap-2.5">
                <Truck className="w-4 h-4 text-emerald-700" />
                <div>
                  <span className="text-xs font-bold block text-stone-800">
                    {language === 'ar' ? 'إشعارات الطلبات والتوصيل' : language === 'de' ? 'Bestell- & Lieferstatus' : language === 'uk' ? 'Сповіщення про замовлення' : language === 'fa' ? 'اعلان‌های سفارش' : 'Order & Delivery'}
                  </span>
                  <span className="text-[10px] text-stone-400">
                    {language === 'ar' ? 'تنبيه فوري عند قبول الطلب، انطلاق السائق، والتسليم' : 'Statusänderungen bei Bestellungen & Lieferung'}
                  </span>
                </div>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={orderNotifsEnabled}
                onClick={() => handleToggleOrderNotifs(!orderNotifsEnabled)}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
                  orderNotifsEnabled ? 'bg-emerald-700' : 'bg-stone-300'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                    orderNotifsEnabled ? (isRtl ? '-translate-x-5' : 'translate-x-5') : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* Toggle 2: Promo & Discount Notifications */}
            <div className="flex items-center justify-between bg-white p-3 rounded-xl border border-stone-200/80 shadow-2xs">
              <div className="flex items-center gap-2.5">
                <Gift className="w-4 h-4 text-amber-700" />
                <div>
                  <span className="text-xs font-bold block text-stone-800">
                    {language === 'ar' ? 'العروض والخصومات الخاصة' : language === 'de' ? 'Angebote & Rabatte' : language === 'uk' ? 'Пропозиції та знижки' : language === 'fa' ? 'پیشنهادات و تخفیف‌ها' : 'Offers & Discounts'}
                  </span>
                  <span className="text-[10px] text-stone-400">
                    {language === 'ar' ? 'كوبونات الخصم، عروض نهاية الأسبوع والمنتجات المخفضة' : 'Rabatt-Aktionen und Sonderangebote'}
                  </span>
                </div>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={offersNotifsEnabled}
                onClick={() => handleToggleOffersNotifs(!offersNotifsEnabled)}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
                  offersNotifsEnabled ? 'bg-emerald-700' : 'bg-stone-300'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                    offersNotifsEnabled ? (isRtl ? '-translate-x-5' : 'translate-x-5') : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* Toggle 3: Sound Alerts */}
            <div className="flex items-center justify-between bg-white p-3 rounded-xl border border-stone-200/80 shadow-2xs">
              <div className="flex items-center gap-2.5">
                {soundAlertsEnabled ? (
                  <Volume2 className="w-4 h-4 text-blue-700" />
                ) : (
                  <VolumeX className="w-4 h-4 text-stone-400" />
                )}
                <div>
                  <span className="text-xs font-bold block text-stone-800">
                    {language === 'ar' ? 'التنبيهات الصوتية للتطبيق' : language === 'de' ? 'Tontöne' : language === 'uk' ? 'Звукові сигнали' : language === 'fa' ? 'هشدارهای صوتی' : 'Sound Alerts'}
                  </span>
                  <span className="text-[10px] text-stone-400">
                    {language === 'ar' ? 'تشغيل نغمات صوتية واضحة ومميزة عند وصول الإشعار' : 'Töne bei Benachrichtigungen abspielen'}
                  </span>
                </div>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={soundAlertsEnabled}
                onClick={() => handleToggleSoundAlerts(!soundAlertsEnabled)}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
                  soundAlertsEnabled ? 'bg-blue-700' : 'bg-stone-300'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                    soundAlertsEnabled ? (isRtl ? '-translate-x-5' : 'translate-x-5') : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Test Notification Action */}
          <div className="pt-1 flex items-center justify-between gap-2">
            <span className="text-[10px] text-stone-500">
              {language === 'ar' ? 'للتأكد من عمل الإشعارات على جهازك:' : 'Benachrichtigung testen:'}
            </span>
            <button
              onClick={handleSendTestNotification}
              disabled={isSendingTestNotif}
              className="px-3 py-1.5 bg-stone-200 hover:bg-stone-300 text-stone-800 font-bold rounded-lg text-[10px] flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50 shadow-2xs"
            >
              <Send className="w-3 h-3 text-stone-600" />
              <span>{isSendingTestNotif ? t('common.loading') : (language === 'ar' ? 'إرسال إشعار تجريبي 🔔' : 'Testbenachrichtigung 🔔')}</span>
            </button>
          </div>
        </div>

        {/* Language Selection Setting Block */}
        <div className="p-4 bg-emerald-50/40 space-y-3 border-y border-stone-200/70 text-stone-800">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center shadow-2xs">
                <Globe className="w-4 h-4" />
              </div>
              <div>
                <span className="font-bold text-xs block text-stone-900">{t('common.language')}</span>
                <span className="text-[10px] text-stone-500">Sprache wählen / Choose Language / اختر اللغة</span>
              </div>
            </div>
            <button
              onClick={() => setIsLanguageModalOpen(true)}
              className="text-[11px] font-bold text-emerald-800 bg-white hover:bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200 shadow-2xs transition-all cursor-pointer"
            >
              {t('common.change')}
            </button>
          </div>
          <LanguageSwitcher variant="bar" />
        </div>

        {/* Legal Policies & Terms Link */}
        <button
          onClick={() => navigateTo('legal')}
          className="w-full p-4 flex items-center justify-between hover:bg-stone-50 transition-colors cursor-pointer text-stone-800"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-2xl bg-emerald-50 text-emerald-800 flex items-center justify-center">
              <FileText className="w-4 h-4" />
            </div>
            <div className={isRtl ? 'text-right' : 'text-left'}>
              <span className="font-bold block">{t('profile.legalPages')} (AGB & DSGVO)</span>
              <span className="text-[10px] text-stone-400">Impressum, Datenschutz, AGB & Widerrufsbelehrung</span>
            </div>
          </div>
          <ChevronIcon className="w-4 h-4 text-stone-400" />
        </button>

      </div>

      {/* Logout Action */}
      <div className="pt-2">
        <button
          onClick={logout}
          className="w-full bg-white hover:bg-rose-50 border border-stone-200 text-rose-600 hover:text-rose-700 font-bold py-3.5 px-4 rounded-2xl text-xs flex items-center justify-center gap-2 cursor-pointer shadow-2xs transition-colors"
        >
          <LogOut className="w-4 h-4" />
          <span>{t('profile.logoutBtn')}</span>
        </button>
      </div>

    </div>
  );
};

