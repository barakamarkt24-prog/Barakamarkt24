import React, { useState, useEffect } from 'react';
import { 
  User, 
  Lock, 
  Mail, 
  Phone, 
  Sparkles, 
  ArrowRight, 
  ShieldCheck, 
  CheckCircle2,
  AlertCircle,
  KeyRound,
  ArrowLeft,
  Eye,
  EyeOff,
  Gift
} from 'lucide-react';
import { useApp } from '../context/AppContext';

export const AuthScreen: React.FC = () => {
  const { login, register, sendPasswordReset, navigateTo, currentUser, showToast } = useApp();

  const [mode, setMode] = useState<'login' | 'register' | 'forgot_password'>('login');
  const [name, setName] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [phone, setPhone] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [referralCodeInput, setReferralCodeInput] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [resetSentSuccess, setResetSentSuccess] = useState<boolean>(false);

  useEffect(() => {
    if (currentUser) {
      navigateTo('profile');
    }
  }, [currentUser]);

  const resetFormState = () => {
    setErrorMessage(null);
    setResetSentSuccess(false);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!email.trim()) {
      setErrorMessage('يرجى إدخال البريد الإلكتروني');
      return;
    }
    if (!password) {
      setErrorMessage('يرجى إدخال كلمة المرور');
      return;
    }

    setIsLoading(true);
    try {
      await login(email.trim(), password);
      navigateTo('profile');
    } catch (err: any) {
      setErrorMessage(err?.message || 'فشل تسجيل الدخول. يرجى التأكد من صحة البيانات.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!name.trim()) {
      setErrorMessage('يرجى إدخال الاسم الكامل');
      return;
    }
    if (!email.trim()) {
      setErrorMessage('يرجى إدخال البريد الإلكتروني');
      return;
    }
    if (!phone.trim()) {
      setErrorMessage('يرجى إدخال رقم الهاتف للتواصل والتوصيل');
      return;
    }
    if (!password || password.length < 6) {
      setErrorMessage('يجب أن تتكون كلمة المرور من 6 خانات على الأقل');
      return;
    }
    if (password !== confirmPassword) {
      setErrorMessage('كلمتا المرور غير متطابقتين');
      return;
    }

    setIsLoading(true);
    try {
      await register(name.trim(), email.trim(), phone.trim(), password, referralCodeInput.trim());
      navigateTo('profile');
    } catch (err: any) {
      setErrorMessage(err?.message || 'فشل إنشاء الحساب. يرجى المحاولة ثانية.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!email.trim()) {
      setErrorMessage('يرجى كتابة البريد الإلكتروني لإرسال رابط الاستعادة');
      return;
    }

    setIsLoading(true);
    try {
      await sendPasswordReset(email.trim());
      setResetSentSuccess(true);
    } catch (err: any) {
      setErrorMessage(err?.message || 'تعذر إرسال رابط الاستعادة. تأكد من صحة البريد الإلكتروني.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-4 space-y-4 max-w-md mx-auto pb-16" dir="rtl">
      
      {/* Header Visual */}
      <div className="text-center space-y-1.5 pt-4">
        <div className="w-14 h-14 bg-emerald-800 text-amber-300 rounded-3xl flex items-center justify-center mx-auto shadow-md font-serif text-2xl font-black">
          ب
        </div>
        <h1 className="text-lg font-black text-stone-900">
          {mode === 'login' && 'تسجيل الدخول'}
          {mode === 'register' && 'إنشاء حساب جديد'}
          {mode === 'forgot_password' && 'استعادة كلمة المرور'}
        </h1>
        <p className="text-xs text-stone-500">
          متجر Barakamarkt24 — أطيب خيرات ومؤونة بلاد الشام في ألمانيا
        </p>
      </div>

      {/* Mode Switcher Tabs (Hidden when in forgot password) */}
      {mode !== 'forgot_password' && (
        <div className="flex bg-stone-100 p-1 rounded-2xl border border-stone-200/80">
          <button
            type="button"
            onClick={() => {
              setMode('login');
              resetFormState();
            }}
            className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              mode === 'login' 
                ? 'bg-white text-stone-900 shadow-xs' 
                : 'text-stone-500 hover:text-stone-800'
            }`}
          >
            تسجيل الدخول
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('register');
              resetFormState();
            }}
            className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              mode === 'register' 
                ? 'bg-white text-stone-900 shadow-xs' 
                : 'text-stone-500 hover:text-stone-800'
            }`}
          >
            حساب جديد
          </button>
        </div>
      )}

      {/* Error Message Box */}
      {errorMessage && (
        <div className="bg-rose-50 border border-rose-200 text-rose-800 p-3 rounded-2xl text-xs flex items-center gap-2.5 animate-in fade-in">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span className="font-semibold">{errorMessage}</span>
        </div>
      )}

      {/* 1. Login Form */}
      {mode === 'login' && (
        <form onSubmit={handleLogin} className="bg-white p-5 rounded-3xl border border-stone-200/80 shadow-2xs space-y-3.5">
          
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-stone-700">البريد الإلكتروني:</label>
            <div className="relative">
              <input
                type="email"
                required
                placeholder="example@domain.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2.5 pl-9 text-xs focus:bg-white focus:border-emerald-700 focus:outline-hidden font-sans text-right"
              />
              <Mail className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
            </div>
          </div>

          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-bold text-stone-700">كلمة المرور:</label>
              <button
                type="button"
                onClick={() => {
                  setMode('forgot_password');
                  resetFormState();
                }}
                className="text-[11px] text-emerald-800 hover:text-emerald-950 font-bold cursor-pointer"
              >
                نسيت كلمة المرور؟
              </button>
            </div>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2.5 pl-9 text-xs focus:bg-white focus:border-emerald-700 focus:outline-hidden"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 cursor-pointer p-1"
                aria-label="إظهار كلمة المرور"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full mt-2 bg-emerald-800 hover:bg-emerald-900 text-white font-bold py-3.5 rounded-2xl text-xs sm:text-sm shadow-md cursor-pointer active:scale-98 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
          >
            <Lock className="w-4 h-4 text-amber-300" />
            <span>{isLoading ? 'جاري تسجيل الدخول...' : 'تسجيل الدخول'}</span>
          </button>

          <div className="text-center pt-2">
            <p className="text-xs text-stone-500">
              ليس لديك حساب بعد؟{' '}
              <button
                type="button"
                onClick={() => {
                  setMode('register');
                  resetFormState();
                }}
                className="font-bold text-emerald-800 hover:underline cursor-pointer"
              >
                أنشئ حسابك الآن
              </button>
            </p>
          </div>

        </form>
      )}

      {/* 2. Register Form */}
      {mode === 'register' && (
        <form onSubmit={handleRegister} className="bg-white p-5 rounded-3xl border border-stone-200/80 shadow-2xs space-y-3.5">
          
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-stone-700">الاسم الكامل:</label>
            <div className="relative">
              <input
                type="text"
                required
                placeholder="مثال: أحمد الشامي"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2.5 pl-9 text-xs focus:bg-white focus:border-emerald-700 focus:outline-hidden"
              />
              <User className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-bold text-stone-700">البريد الإلكتروني:</label>
            <div className="relative">
              <input
                type="email"
                required
                placeholder="example@domain.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2.5 pl-9 text-xs focus:bg-white focus:border-emerald-700 focus:outline-hidden font-sans text-right"
              />
              <Mail className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-bold text-stone-700">رقم الهاتف (للتوصيل والواتساب):</label>
            <div className="relative">
              <input
                type="tel"
                required
                placeholder="+49 152 12345678"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2.5 pl-9 text-xs focus:bg-white focus:border-emerald-700 focus:outline-hidden font-sans text-right"
              />
              <Phone className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-bold text-stone-700">كلمة المرور (6 خانات على الأقل):</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                minLength={6}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2.5 pl-9 text-xs focus:bg-white focus:border-emerald-700 focus:outline-hidden"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 cursor-pointer p-1"
                aria-label="إظهار كلمة المرور"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-bold text-stone-700">تأكيد كلمة المرور:</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                minLength={6}
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2.5 pl-9 text-xs focus:bg-white focus:border-emerald-700 focus:outline-hidden"
              />
              <Lock className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
            </div>
          </div>

          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-bold text-stone-700">كود الدعوة / الإحالة:</label>
              <span className="text-[10px] text-stone-400 font-medium">(اختياري)</span>
            </div>
            <div className="relative">
              <input
                type="text"
                placeholder="مثال: BRK-7X89Q"
                value={referralCodeInput}
                onChange={(e) => setReferralCodeInput(e.target.value.toUpperCase())}
                className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2.5 pl-9 text-xs focus:bg-white focus:border-emerald-700 focus:outline-hidden font-mono text-right tracking-wider uppercase"
              />
              <Gift className="w-4 h-4 text-amber-500 absolute left-3 top-1/2 -translate-y-1/2" />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full mt-2 bg-emerald-800 hover:bg-emerald-900 text-white font-bold py-3.5 rounded-2xl text-xs sm:text-sm shadow-md cursor-pointer active:scale-98 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
          >
            <User className="w-4 h-4 text-amber-300" />
            <span>{isLoading ? 'جاري إنشاء الحساب...' : 'إنشاء حساب جديد'}</span>
          </button>

          <div className="text-center pt-2">
            <p className="text-xs text-stone-500">
              لديك حساب بالفعل؟{' '}
              <button
                type="button"
                onClick={() => {
                  setMode('login');
                  resetFormState();
                }}
                className="font-bold text-emerald-800 hover:underline cursor-pointer"
              >
                تسجيل الدخول
              </button>
            </p>
          </div>

        </form>
      )}

      {/* 3. Password Reset Form */}
      {mode === 'forgot_password' && (
        <div className="bg-white p-5 rounded-3xl border border-stone-200/80 shadow-2xs space-y-4">
          
          <div className="flex items-center gap-2 text-stone-800">
            <KeyRound className="w-5 h-5 text-emerald-800" />
            <h2 className="text-sm font-black">استعادة وتعيين كلمة المرور</h2>
          </div>

          {resetSentSuccess ? (
            <div className="space-y-4 py-2 text-center">
              <div className="w-14 h-14 bg-emerald-100 text-emerald-800 rounded-2xl flex items-center justify-center mx-auto shadow-inner">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-stone-900">تم إرسال رابط الاستعادة!</h3>
                <p className="text-xs text-stone-600 leading-relaxed max-w-xs mx-auto">
                  أرسلنا رابط إعادة تعيين كلمة المرور إلى البريد: <strong className="font-mono text-emerald-900">{email}</strong>.
                  يرجى تفقد بريدك الوارد ومجلد الرسائل غير المرغوب فيها (Spam).
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setMode('login');
                  resetFormState();
                }}
                className="w-full bg-emerald-800 hover:bg-emerald-900 text-white font-bold py-3 rounded-2xl text-xs cursor-pointer shadow-md transition-all"
              >
                العودة إلى تسجيل الدخول
              </button>
            </div>
          ) : (
            <form onSubmit={handleForgotPassword} className="space-y-3.5">
              <p className="text-xs text-stone-500 leading-relaxed">
                أدخل بريدك الإلكتروني المسجل لدينا وسنرسل لك رابطاً مباشراً لتعيين كلمة مرور جديدة لحسابك.
              </p>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-stone-700">البريد الإلكتروني:</label>
                <div className="relative">
                  <input
                    type="email"
                    required
                    placeholder="example@domain.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2.5 pl-9 text-xs focus:bg-white focus:border-emerald-700 focus:outline-hidden font-sans text-right"
                  />
                  <Mail className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-emerald-800 hover:bg-emerald-900 text-white font-bold py-3.5 rounded-2xl text-xs shadow-md cursor-pointer active:scale-98 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <KeyRound className="w-4 h-4 text-amber-300" />
                <span>{isLoading ? 'جاري الإرسال...' : 'إرسال رابط استعادة كلمة المرور'}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setMode('login');
                  resetFormState();
                }}
                className="w-full py-2.5 text-xs text-stone-600 hover:text-stone-900 font-bold text-center cursor-pointer transition-colors"
              >
                إلغاء والعودة لتسجيل الدخول
              </button>
            </form>
          )}

        </div>
      )}

    </div>
  );
};
