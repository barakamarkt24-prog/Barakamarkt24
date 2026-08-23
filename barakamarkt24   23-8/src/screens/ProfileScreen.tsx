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
  Bell
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { referralService } from '../services/referralService';

export const ProfileScreen: React.FC = () => {
  const { 
    currentUser, 
    logout, 
    updateProfile,
    navigateTo, 
    wishlist,
    requestPushNotifications,
    showToast 
  } = useApp();

  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [editName, setEditName] = useState<string>(currentUser?.name || '');
  const [editPhone, setEditPhone] = useState<string>(currentUser?.phone || '');
  const [editCity, setEditCity] = useState<string>(currentUser?.city || 'غرايفسفالد');
  const [editAddress, setEditAddress] = useState<string>(currentUser?.address || '');
  const [isSaving, setIsSaving] = useState<boolean>(false);

  // Referral System States
  const [referralCount, setReferralCount] = useState<number>(0);
  const [copied, setCopied] = useState<boolean>(false);
  const [activeReferralCode, setActiveReferralCode] = useState<string>(currentUser?.referralCode || '');

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
      showToast('تم نسخ كود الدعوة بنجاح!');
      setTimeout(() => setCopied(false), 2500);
    } catch (e) {
      showToast(`كود الدعوة الخاص بك هو: ${codeToCopy}`);
    }
  };

  const handleShareInvite = async () => {
    const codeToShare = activeReferralCode || currentUser?.referralCode;
    if (!codeToShare) return;

    const shareTitle = 'دعوة للانضمام إلى بركة ماركت 24';
    const shareText = `تسوّق أطيب خيرات ومؤونة بلاد الشام في ألمانيا عبر متجر بركة ماركت 🛒! استخدم كود الدعوة الخاص بي: ${codeToShare}`;
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
    setEditCity(currentUser.city || 'غرايفسفالد');
    setEditAddress(currentUser.address || '');
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editName.trim() || !editPhone.trim()) {
      showToast('يرجى ملء الاسم ورقم الهاتف');
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
      showToast(err?.message || 'حدث خطأ أثناء حفظ التعديلات');
    } finally {
      setIsSaving(false);
    }
  };

  // If user is not logged in
  if (!currentUser) {
    return (
      <div className="p-6 space-y-6 max-w-md mx-auto text-center my-8" dir="rtl">
        <div className="w-20 h-20 bg-stone-100 text-stone-400 rounded-3xl flex items-center justify-center mx-auto border border-stone-200 shadow-2xs">
          <UserIcon className="w-10 h-10" />
        </div>

        <div className="space-y-1.5">
          <h2 className="text-lg font-black text-stone-900">حسابك في بركة ماركت</h2>
          <p className="text-xs text-stone-500 leading-relaxed max-w-xs mx-auto">
            سجّل الدخول لتتمكن من متابعة طلباتك، حفظ عناوين التوصيل، وإدارة قائمة المفضلة بسهولة.
          </p>
        </div>

        <button
          onClick={() => navigateTo('auth')}
          className="w-full bg-emerald-800 hover:bg-emerald-900 text-white font-bold py-3.5 px-4 rounded-2xl text-xs sm:text-sm flex items-center justify-center gap-2 cursor-pointer shadow-md active:scale-98 transition-all"
        >
          <LogIn className="w-4 h-4 text-amber-300" />
          <span>تسجيل الدخول / إنشاء حساب جديد</span>
        </button>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4 max-w-lg mx-auto pb-16" dir="rtl">
      
      {/* Profile Card Header */}
      <div className="bg-white p-5 rounded-3xl border border-stone-200/80 shadow-2xs space-y-4">
        
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-14 h-14 rounded-2xl bg-emerald-800 text-amber-300 font-bold text-xl flex items-center justify-center shadow-md">
              {currentUser.name ? currentUser.name[0] : 'ع'}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h1 className="font-black text-base text-stone-900 line-clamp-1">
                  {currentUser.name}
                </h1>
                <span className="bg-stone-100 text-stone-700 text-[10px] font-bold px-2 py-0.5 rounded-full border border-stone-200">
                  عميل
                </span>
              </div>
              <p className="text-xs text-stone-500 font-sans">{currentUser.email}</p>
              <p className="text-[11px] text-stone-600 font-sans pt-0.5">{currentUser.phone || 'لم يتم تحديد الهاتف'}</p>
            </div>
          </div>

          {!isEditing && (
            <button
              onClick={handleStartEdit}
              className="bg-stone-50 hover:bg-stone-100 border border-stone-200 text-stone-700 text-xs font-bold px-3 py-2 rounded-xl flex items-center gap-1.5 cursor-pointer shadow-2xs transition-colors"
            >
              <Edit3 className="w-3.5 h-3.5 text-emerald-800" />
              <span>تعديل</span>
            </button>
          )}
        </div>

        {/* Edit Form Modal/Collapse */}
        {isEditing ? (
          <form onSubmit={handleSaveProfile} className="pt-3 border-t border-stone-100 space-y-3 animate-in fade-in">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-emerald-900 flex items-center gap-1">
                <Edit3 className="w-3.5 h-3.5" />
                <span>تعديل البيانات الشخصية:</span>
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
              <label className="text-[11px] font-bold text-stone-700">الاسم الكامل:</label>
              <input
                type="text"
                required
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                placeholder="أحمد الشامي"
                className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-xs focus:bg-white focus:border-emerald-700 focus:outline-hidden"
              />
            </div>

            {/* Phone */}
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-stone-700">رقم الهاتف:</label>
              <input
                type="tel"
                required
                value={editPhone}
                onChange={(e) => setEditPhone(e.target.value)}
                placeholder="+49 152 12345678"
                className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-xs focus:bg-white focus:border-emerald-700 focus:outline-hidden font-sans text-right"
              />
            </div>

            {/* City & Address */}
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-stone-700">المدينة:</label>
                <input
                  type="text"
                  value={editCity}
                  onChange={(e) => setEditCity(e.target.value)}
                  placeholder="غرايفسفالد"
                  className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-xs focus:bg-white focus:border-emerald-700 focus:outline-hidden"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-stone-700">الشارع والعنوان:</label>
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
                <span>{isSaving ? 'جاري الحفظ...' : 'حفظ التعديلات'}</span>
              </button>
              <button
                type="button"
                onClick={handleCancelEdit}
                className="px-4 bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold py-2.5 rounded-xl text-xs cursor-pointer transition-colors"
              >
                إلغاء
              </button>
            </div>
          </form>
        ) : (
          /* Address display */
          <div className="pt-3 border-t border-stone-100 flex items-start gap-2 text-xs text-stone-600">
            <MapPin className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-stone-800">عنوان التوصيل: </span>
              <span>
                {currentUser.address ? `${currentUser.city} - ${currentUser.address}` : `${currentUser.city || 'غرايفسفالد'} (لم يتم تحديد الشارع)`}
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
              <h2 className="font-black text-sm text-amber-300">برنامج دعوة الأصدقاء</h2>
              <p className="text-[11px] text-emerald-100/80">شارك كود الدعوة الخاص بك مع معارفك وأصدقائك</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 bg-black/20 backdrop-blur-xs px-2.5 py-1 rounded-full border border-white/10 text-[11px]">
            <Users className="w-3.5 h-3.5 text-amber-300" />
            <span className="text-stone-300">الإحالات:</span>
            <span className="font-bold text-amber-300 font-sans">{referralCount}</span>
          </div>
        </div>

        {/* Code Container */}
        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3 border border-white/15 flex items-center justify-between gap-2">
          <div className="space-y-0.5">
            <span className="text-[10px] text-emerald-200 block font-medium">كود الدعوة الخاص بك:</span>
            <span className="font-mono text-base font-black tracking-widest text-amber-300 uppercase">
              {activeReferralCode || 'جاري التحميل...'}
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
                  <span>تم النسخ</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>نسخ الكود</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handleShareInvite}
              className="bg-white/15 hover:bg-white/25 text-white font-bold p-2 rounded-xl text-xs flex items-center justify-center cursor-pointer border border-white/20 transition-colors active:scale-95"
              title="مشاركة الدعوة"
              aria-label="مشاركة الدعوة"
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
              <div className="text-right">
                <div className="flex items-center gap-1.5">
                  <span className="font-black text-amber-950">لوحة تحكم المدير</span>
                  <span className="bg-amber-600 text-white text-[9px] font-bold px-1.5 py-0.2 rounded-md">Admin</span>
                </div>
                <span className="text-[10px] text-stone-500 block">إدارة المنتجات، الطلبات، العروض، المستخدمين والمزيد</span>
              </div>
            </div>
            <ChevronLeft className="w-4 h-4 text-amber-700" />
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
            <span className="font-bold">طلباتي السابقة والحالية</span>
          </div>
          <ChevronLeft className="w-4 h-4 text-stone-400" />
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
              <span className="font-bold">قائمة المفضلة</span>
              {wishlist.length > 0 && (
                <span className="bg-rose-100 text-rose-700 text-[10px] font-bold px-2 py-0.5 rounded-full font-sans">
                  {wishlist.length}
                </span>
              )}
            </div>
          </div>
          <ChevronLeft className="w-4 h-4 text-stone-400" />
        </button>

        <button
          onClick={() => navigateTo('cart')}
          className="w-full p-4 flex items-center justify-between hover:bg-stone-50 transition-colors cursor-pointer text-stone-800"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-2xl bg-amber-50 text-amber-800 flex items-center justify-center">
              <ShoppingBag className="w-4 h-4" />
            </div>
            <span className="font-bold">سلة المشتريات</span>
          </div>
          <ChevronLeft className="w-4 h-4 text-stone-400" />
        </button>

        <button
          onClick={async () => {
            await requestPushNotifications();
          }}
          className="w-full p-4 flex items-center justify-between hover:bg-stone-50 transition-colors cursor-pointer text-stone-800"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-2xl bg-blue-50 text-blue-700 flex items-center justify-center">
              <Bell className="w-4 h-4" />
            </div>
            <div className="text-right">
              <span className="font-bold block">إشعارات وتنبيهات العروض</span>
              <span className="text-[10px] text-stone-400">تفعيل التنبيهات الفورية على جهازك</span>
            </div>
          </div>
          <ChevronLeft className="w-4 h-4 text-stone-400" />
        </button>

      </div>

      {/* Logout Action */}
      <div className="pt-2">
        <button
          onClick={logout}
          className="w-full bg-white hover:bg-rose-50 border border-stone-200 text-rose-600 hover:text-rose-700 font-bold py-3.5 px-4 rounded-2xl text-xs flex items-center justify-center gap-2 cursor-pointer shadow-2xs transition-colors"
        >
          <LogOut className="w-4 h-4" />
          <span>تسجيل الخروج من الحساب</span>
        </button>
      </div>

    </div>
  );
};
