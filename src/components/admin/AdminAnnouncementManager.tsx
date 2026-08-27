import React, { useState } from 'react';
import { 
  Sparkles, 
  Truck, 
  Tag, 
  Flame, 
  ShieldCheck, 
  Bell, 
  Gift, 
  Percent,
  Plus, 
  Trash2, 
  Edit3, 
  ArrowUp, 
  ArrowDown, 
  Check, 
  X, 
  Eye, 
  EyeOff, 
  RotateCcw,
  Megaphone,
  Layers,
  Globe,
  Loader2,
  Languages
} from 'lucide-react';
import { AnnouncementItem, AnnouncementIconType, Language } from '../../types';
import { adminService, DEFAULT_ANNOUNCEMENTS } from '../../services/adminService';
import { translateAnnouncementContent } from '../../services/translationService';
import { getLocalizedAnnouncementText } from '../../locales';

interface AdminAnnouncementManagerProps {
  announcements: AnnouncementItem[];
  onReload: () => Promise<void>;
  showToast: (msg: string) => void;
}

const AVAILABLE_ICONS: { type: AnnouncementIconType; label: string; icon: any }[] = [
  { type: 'sparkles', label: 'مميز (Sparkles)', icon: Sparkles },
  { type: 'truck', label: 'توصيل وشحن (Truck)', icon: Truck },
  { type: 'shield', label: 'جودة وضمان (Shield)', icon: ShieldCheck },
  { type: 'tag', label: 'عروض وتخفيضات (Tag)', icon: Tag },
  { type: 'flame', label: 'عروض حارقة (Flame)', icon: Flame },
  { type: 'bell', label: 'تنبيه مهم (Bell)', icon: Bell },
  { type: 'gift', label: 'هدايا ومكافآت (Gift)', icon: Gift },
  { type: 'percent', label: 'نسبة خصم (Percent)', icon: Percent },
];

const PREVIEW_LANGS: { code: Language; label: string; flag: string; dir: 'rtl' | 'ltr' }[] = [
  { code: 'ar', label: 'العربية', flag: '🇸🇾', dir: 'rtl' },
  { code: 'de', label: 'Deutsch', flag: '🇩🇪', dir: 'ltr' },
  { code: 'en', label: 'English', flag: '🇬🇧', dir: 'ltr' },
  { code: 'uk', label: 'Українська', flag: '🇺🇦', dir: 'ltr' },
  { code: 'fa', label: 'فارسی', flag: '🇮🇷', dir: 'rtl' },
];

const getIconComponent = (iconType?: string) => {
  const found = AVAILABLE_ICONS.find(i => i.type === iconType);
  return found ? found.icon : Sparkles;
};

export const AdminAnnouncementManager: React.FC<AdminAnnouncementManagerProps> = ({
  announcements,
  onReload,
  showToast
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<AnnouncementItem | null>(null);
  
  // Multilingual Form state
  const [formTextAr, setFormTextAr] = useState('');
  const [formTextDe, setFormTextDe] = useState('');
  const [formTextEn, setFormTextEn] = useState('');
  const [formTextUk, setFormTextUk] = useState('');
  const [formTextFa, setFormTextFa] = useState('');
  
  const [formIcon, setFormIcon] = useState<AnnouncementIconType>('sparkles');
  const [formIsActive, setFormIsActive] = useState(true);
  const [formIsHighlight, setFormIsHighlight] = useState(false);
  const [formOrder, setFormOrder] = useState<number>(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isTranslating, setIsTranslating] = useState(false);

  // Admin live preview language toggle
  const [previewLang, setPreviewLang] = useState<Language>('ar');

  // Sorted list based on order
  const sortedList = [...announcements].sort((a, b) => (a.order || 0) - (b.order || 0));
  const activeCount = sortedList.filter(a => a.isActive !== false).length;

  const handleOpenAdd = () => {
    setEditingItem(null);
    setFormTextAr('');
    setFormTextDe('');
    setFormTextEn('');
    setFormTextUk('');
    setFormTextFa('');
    setFormIcon('sparkles');
    setFormIsActive(true);
    setFormIsHighlight(false);
    setFormOrder(sortedList.length + 1);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item: AnnouncementItem) => {
    setEditingItem(item);
    setFormTextAr(item.textAr || item.text || '');
    setFormTextDe(item.textDe || '');
    setFormTextEn(item.textEn || '');
    setFormTextUk(item.textUk || '');
    setFormTextFa(item.textFa || '');
    setFormIcon((item.icon as AnnouncementIconType) || 'sparkles');
    setFormIsActive(item.isActive !== false);
    setFormIsHighlight(Boolean(item.isHighlight));
    setFormOrder(item.order || 1);
    setIsModalOpen(true);
  };

  const handleAutoTranslate = async () => {
    const textToTranslate = formTextAr.trim();
    if (!textToTranslate) {
      showToast('⚠️ يرجى كتابة نص الإعلان بالعربية أولاً ليتم ترجمته تلقائياً');
      return;
    }

    setIsTranslating(true);
    try {
      const result = await translateAnnouncementContent(textToTranslate);
      if (result) {
        setFormTextDe(result.textDe || '');
        setFormTextEn(result.textEn || '');
        setFormTextUk(result.textUk || '');
        setFormTextFa(result.textFa || '');
        showToast('✨ تم توليد ترجمات الإعلان بـ 5 لغات بواسطة الذكاء الاصطناعي بنجاح!');
      }
    } catch (err: any) {
      console.error('Auto-translate error:', err);
      showToast(`❌ ${err?.message || 'تعذر توليد الترجمة التلقائية'}`);
    } finally {
      setIsTranslating(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanAr = formTextAr.trim();
    if (!cleanAr) {
      showToast('⚠️ يرجى كتابة نص الإعلان باللغة العربية أولاً');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload: Omit<AnnouncementItem, 'id'> = {
        text: cleanAr, // Legacy compatibility
        textAr: cleanAr,
        textDe: formTextDe.trim() || undefined,
        textEn: formTextEn.trim() || undefined,
        textUk: formTextUk.trim() || undefined,
        textFa: formTextFa.trim() || undefined,
        icon: formIcon,
        isActive: formIsActive,
        isHighlight: formIsHighlight,
        order: Number(formOrder) || (editingItem ? editingItem.order : sortedList.length + 1)
      };

      if (editingItem) {
        // Update
        const success = await adminService.updateAnnouncement(editingItem.id, payload);
        if (success) {
          showToast('✅ تم تعديل الإعلان وحفظ الترجمات في Firestore بنجاح');
          setIsModalOpen(false);
          await onReload();
        } else {
          showToast('❌ تعذر تعديل الإعلان، تحقق من الاتصال');
        }
      } else {
        // Add new
        const success = await adminService.addAnnouncement(payload);
        if (success) {
          showToast('✅ تم إضافة الإعلان متعدد اللغات في Firestore بنجاح');
          setIsModalOpen(false);
          await onReload();
        } else {
          showToast('❌ تعذر إضافة الإعلان، تحقق من الاتصال');
        }
      }
    } catch (err) {
      console.error(err);
      showToast('❌ حدث خطأ أثناء الحفظ');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (item: AnnouncementItem) => {
    const textPreview = item.textAr || item.text;
    if (window.confirm(`هل أنت متأكد من حذف الإعلان التالي نهائياً؟\n\n"${textPreview}"`)) {
      const success = await adminService.deleteAnnouncement(item.id);
      if (success) {
        showToast('🗑️ تم حذف الإعلان من Firestore');
        await onReload();
      } else {
        showToast('❌ تعذر حذف الإعلان');
      }
    }
  };

  const handleToggleActive = async (item: AnnouncementItem) => {
    const nextState = !item.isActive;
    const success = await adminService.toggleAnnouncementActive(item.id, nextState);
    if (success) {
      showToast(nextState ? '👁️ تم تفعيل الإعلان في المتجر' : '🔒 تم تعطيل الإعلان وإخفاؤه');
      await onReload();
    } else {
      showToast('❌ تعذر تحديث حالة الإعلان');
    }
  };

  const handleToggleHighlight = async (item: AnnouncementItem) => {
    const nextState = !item.isHighlight;
    const success = await adminService.updateAnnouncement(item.id, { isHighlight: nextState });
    if (success) {
      showToast(nextState ? '⭐ تم تمييز الإعلان بلون ذهبي' : 'تم إلغاء التمييز');
      await onReload();
    }
  };

  const handleMove = async (currentIndex: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    if (targetIndex < 0 || targetIndex >= sortedList.length) return;

    const currentList = [...sortedList];
    const itemToMove = currentList[currentIndex];
    currentList.splice(currentIndex, 1);
    currentList.splice(targetIndex, 0, itemToMove);

    // Reindex order numbers
    const success = await adminService.reorderAnnouncements(currentList);
    if (success) {
      showToast('↕️ تم تغيير ترتيب الإعلانات');
      await onReload();
    } else {
      showToast('❌ تعذر تغيير الترتيب');
    }
  };

  const handleResetDefaults = async () => {
    if (window.confirm('هل تريد استعادة الإعلانات الترويجية الافتراضية متعددة اللغات لمتجر بركة ماركت 24؟\n\nسيتم استبدال القائمة الحالية بالنصوص الافتراضية المترجمة.')) {
      const success = await adminService.saveAnnouncements(DEFAULT_ANNOUNCEMENTS);
      if (success) {
        showToast('🔄 تم استعادة الإعلانات الافتراضية بجميع اللغات');
        await onReload();
      } else {
        showToast('❌ تعذر الاستعادة');
      }
    }
  };

  return (
    <div className="space-y-4" dir="rtl">
      
      {/* Top Header Card */}
      <div className="bg-white p-4 sm:p-5 rounded-3xl border border-stone-200/80 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-700 flex items-center justify-center border border-amber-200 shadow-2xs">
              <Megaphone className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-black text-base text-stone-900">إدارة شريط الإعلانات المتحرك (متعدد اللغات)</h2>
                <span className="bg-emerald-100 text-emerald-900 text-[10px] font-black px-2 py-0.5 rounded-full border border-emerald-200">
                  {activeCount} مفعّل من أصل {sortedList.length}
                </span>
              </div>
              <p className="text-xs text-stone-500 font-medium">
                تحكم كامل في نصوص التنبيهات والعروض الترويجية مع دعم 5 لغات وترجمة ذكية فورية بالذكاء الاصطناعي (Gemini)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleResetDefaults}
              title="استعادة الإعلانات الافتراضية"
              className="bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-bold px-3 py-2 rounded-xl transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>افتراضي</span>
            </button>

            <button
              onClick={handleOpenAdd}
              className="bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-bold px-4 py-2 rounded-xl shadow-xs transition-all cursor-pointer flex items-center gap-1.5 active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>إضافة إعلان جديد</span>
            </button>
          </div>
        </div>

        {/* Live Preview Box with Language Switcher */}
        <div className="bg-stone-900 text-white p-3.5 rounded-2xl border border-stone-800 space-y-2.5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[11px] text-stone-400 font-bold border-b border-stone-800 pb-2">
            <span className="flex items-center gap-1.5 text-amber-300">
              <Sparkles className="w-3.5 h-3.5" />
              <span>معاينة شريط الإعلانات كما يراه العميل:</span>
            </span>

            {/* Language preview selector chips */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[10px] text-stone-400 flex items-center gap-1">
                <Globe className="w-3 h-3 text-emerald-400" />
                <span>معاينة بلغة:</span>
              </span>
              {PREVIEW_LANGS.map(langOpt => (
                <button
                  key={langOpt.code}
                  onClick={() => setPreviewLang(langOpt.code)}
                  className={`px-2 py-0.5 rounded-lg text-[10px] font-bold flex items-center gap-1 transition-all cursor-pointer ${
                    previewLang === langOpt.code
                      ? 'bg-emerald-700 text-white shadow-xs border border-emerald-500'
                      : 'bg-stone-800 text-stone-400 hover:bg-stone-700 hover:text-stone-200'
                  }`}
                >
                  <span>{langOpt.flag}</span>
                  <span>{langOpt.label}</span>
                </button>
              ))}
            </div>
          </div>

          {activeCount === 0 ? (
            <div className="text-center py-2 text-xs text-stone-400 italic">
              ⚠️ لا توجد إعلانات نشطة حالياً. شريط الإعلانات سيستخدم النصوص الافتراضية.
            </div>
          ) : (
            <div 
              className="overflow-hidden bg-emerald-950/60 border border-emerald-800/40 rounded-xl p-2 select-none"
              dir={PREVIEW_LANGS.find(l => l.code === previewLang)?.dir || 'rtl'}
            >
              <div className="flex items-center gap-4 overflow-x-auto no-scrollbar py-1">
                {sortedList
                  .filter(a => a.isActive !== false)
                  .map((item, idx) => {
                    const Icon = getIconComponent(item.icon);
                    const displayedText = getLocalizedAnnouncementText(item, previewLang);
                    return (
                      <div key={item.id} className="flex items-center gap-2 shrink-0 bg-stone-900/80 px-3 py-1.5 rounded-lg border border-emerald-500/20">
                        <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${
                          item.isHighlight ? 'bg-amber-400 text-stone-950 font-bold' : 'bg-emerald-800 text-emerald-200'
                        }`}>
                          <Icon className="w-3 h-3" />
                        </div>
                        <span className={`text-xs ${item.isHighlight ? 'text-amber-300 font-bold' : 'text-emerald-100'}`}>
                          {displayedText || '(لا يوجد نص لهذه اللغة)'}
                        </span>
                        {idx < activeCount - 1 && <span className="text-stone-600 mr-2">•</span>}
                      </div>
                    );
                  })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Announcements List / Table */}
      <div className="bg-white rounded-3xl border border-stone-200/80 shadow-2xs overflow-hidden">
        <div className="p-4 border-b border-stone-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-emerald-800" />
            <h3 className="font-bold text-sm text-stone-900">قائمة الإعلانات المسجلة ({sortedList.length})</h3>
          </div>
          <div className="text-xs text-stone-500">
            يمكنك رفع/خفض أي إعلان بالأسهم للتحكم بالترتيب في شريط الإعلانات
          </div>
        </div>

        {sortedList.length === 0 ? (
          <div className="p-8 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-stone-100 text-stone-400 mx-auto flex items-center justify-center">
              <Megaphone className="w-6 h-6" />
            </div>
            <div className="font-bold text-sm text-stone-700">لا يوجد أي إعلان مسجل حالياً</div>
            <p className="text-xs text-stone-500 max-w-sm mx-auto">
              أضف أول إعلان ليظهر مباشرة في شريط الإعلانات المتحرك أعلى تطبيق ومتجر بركة ماركت 24.
            </p>
            <button
              onClick={handleOpenAdd}
              className="bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-bold px-4 py-2 rounded-xl inline-flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>إضافة إعلان الآن</span>
            </button>
          </div>
        ) : (
          <div className="divide-y divide-stone-100">
            {sortedList.map((item, index) => {
              const Icon = getIconComponent(item.icon);
              const isActive = item.isActive !== false;
              const isHighlight = Boolean(item.isHighlight);

              // Available translation flags
              const hasAr = Boolean(item.textAr?.trim() || item.text?.trim());
              const hasDe = Boolean(item.textDe?.trim());
              const hasEn = Boolean(item.textEn?.trim());
              const hasUk = Boolean(item.textUk?.trim());
              const hasFa = Boolean(item.textFa?.trim());

              return (
                <div 
                  key={item.id}
                  className={`p-3.5 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors ${
                    !isActive ? 'bg-stone-50/70 opacity-75' : 'hover:bg-stone-50/50'
                  }`}
                >
                  {/* Left (RTL right): Order, Icon, Text & Badges */}
                  <div className="flex items-start sm:items-center gap-3 flex-1">
                    
                    {/* Order Controls (Up/Down) & Number */}
                    <div className="flex sm:flex-col items-center gap-1 bg-stone-100 p-1 rounded-xl shrink-0">
                      <button
                        onClick={() => handleMove(index, 'up')}
                        disabled={index === 0}
                        title="رفع الترتيب للأعلى"
                        className="p-1 text-stone-600 hover:text-emerald-800 disabled:opacity-30 disabled:hover:text-stone-600 cursor-pointer disabled:cursor-default"
                      >
                        <ArrowUp className="w-3.5 h-3.5" />
                      </button>
                      <span className="font-mono font-black text-xs text-stone-700 px-1">
                        #{index + 1}
                      </span>
                      <button
                        onClick={() => handleMove(index, 'down')}
                        disabled={index === sortedList.length - 1}
                        title="خفض الترتيب للأسفل"
                        className="p-1 text-stone-600 hover:text-emerald-800 disabled:opacity-30 disabled:hover:text-stone-600 cursor-pointer disabled:cursor-default"
                      >
                        <ArrowDown className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Icon Badge */}
                    <div className={`w-9 h-9 rounded-2xl flex items-center justify-center shrink-0 border ${
                      isHighlight 
                        ? 'bg-amber-100 text-amber-900 border-amber-300 ring-2 ring-amber-400/20' 
                        : isActive 
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-200' 
                          : 'bg-stone-200 text-stone-500 border-stone-300'
                    }`}>
                      <Icon className="w-4 h-4" />
                    </div>

                    {/* Text & Metadata */}
                    <div className="space-y-1.5 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`text-xs font-bold leading-relaxed ${
                          !isActive ? 'text-stone-500 line-through' : 'text-stone-900'
                        }`}>
                          {item.textAr || item.text}
                        </span>
                      </div>

                      {/* Language badges */}
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-[10px] text-stone-400 font-semibold">اللغات المتوفرة:</span>
                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${hasAr ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' : 'bg-stone-100 text-stone-400'}`}>
                          🇸🇾 AR
                        </span>
                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${hasDe ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' : 'bg-stone-100 text-stone-400'}`}>
                          🇩🇪 DE
                        </span>
                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${hasEn ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' : 'bg-stone-100 text-stone-400'}`}>
                          🇬🇧 EN
                        </span>
                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${hasUk ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' : 'bg-stone-100 text-stone-400'}`}>
                          🇺🇦 UK
                        </span>
                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${hasFa ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' : 'bg-stone-100 text-stone-400'}`}>
                          🇮🇷 FA
                        </span>
                      </div>

                      <div className="flex items-center gap-2 flex-wrap text-[10px]">
                        {/* Status Badge */}
                        <button
                          onClick={() => handleToggleActive(item)}
                          className={`px-2 py-0.5 rounded-full font-bold flex items-center gap-1 cursor-pointer transition-colors ${
                            isActive 
                              ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200' 
                              : 'bg-stone-200 text-stone-600 hover:bg-stone-300'
                          }`}
                          title="انقر لتغيير حالة التفعيل"
                        >
                          {isActive ? <Eye className="w-3 h-3 text-emerald-700" /> : <EyeOff className="w-3 h-3 text-stone-500" />}
                          <span>{isActive ? 'مفعّل في المتجر' : 'معطّل ومخفي'}</span>
                        </button>

                        {/* Highlight Badge */}
                        <button
                          onClick={() => handleToggleHighlight(item)}
                          className={`px-2 py-0.5 rounded-full font-bold flex items-center gap-1 cursor-pointer transition-colors ${
                            isHighlight 
                              ? 'bg-amber-100 text-amber-900 border border-amber-300 hover:bg-amber-200' 
                              : 'bg-stone-100 text-stone-500 hover:bg-stone-200'
                          }`}
                          title="تمييز الإعلان بلون ذهبي في الشريط"
                        >
                          <Sparkles className={`w-3 h-3 ${isHighlight ? 'text-amber-600' : 'text-stone-400'}`} />
                          <span>{isHighlight ? 'تمييز ذهبي ⭐' : 'عادي'}</span>
                        </button>

                        {/* Icon Label */}
                        <span className="text-stone-400 font-medium">
                          الأيقونة: {AVAILABLE_ICONS.find(i => i.type === item.icon)?.label || item.icon || 'مميز'}
                        </span>
                      </div>
                    </div>

                  </div>

                  {/* Actions buttons */}
                  <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                    <button
                      onClick={() => handleOpenEdit(item)}
                      className="p-2 rounded-xl bg-stone-100 hover:bg-emerald-50 text-stone-700 hover:text-emerald-900 border border-stone-200 transition-colors cursor-pointer flex items-center gap-1 text-xs font-bold"
                      title="تعديل الإعلان والترجمات"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>تعديل</span>
                    </button>

                    <button
                      onClick={() => handleDelete(item)}
                      className="p-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 transition-colors cursor-pointer flex items-center gap-1 text-xs font-bold"
                      title="حذف الإعلان"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>حذف</span>
                    </button>
                  </div>

                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ========================================================= */}
      {/* MODAL: Add / Edit Multilingual Announcement               */}
      {/* ========================================================= */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-xl w-full p-5 space-y-4 shadow-2xl animate-in zoom-in-95 max-h-[90vh] overflow-y-auto" dir="rtl">
            <div className="flex justify-between items-center border-b border-stone-100 pb-3">
              <div className="flex items-center gap-2 text-stone-900">
                <Megaphone className="w-5 h-5 text-emerald-800" />
                <h3 className="font-extrabold text-sm text-stone-900">
                  {editingItem ? 'تعديل الإعلان وترجماته' : 'إضافة إعلان جديد متعدد اللغات'}
                </h3>
              </div>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="text-stone-400 hover:text-stone-600 p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4 text-xs">
              
              {/* Arabic Primary Input + AI Auto-Translate Trigger */}
              <div className="space-y-2 bg-emerald-50/50 p-3.5 rounded-2xl border border-emerald-200">
                <div className="flex items-center justify-between">
                  <label className="font-extrabold text-emerald-950 flex items-center gap-1.5">
                    <span>🇸🇾</span>
                    <span>نص الإعلان باللغة العربية (الأساسي) *</span>
                  </label>
                  <span className="text-[10px] text-emerald-700 font-mono font-bold">{formTextAr.length} حرف</span>
                </div>
                <textarea
                  rows={2}
                  required
                  placeholder="مثال: شحن سريع مجاني لجميع الطلبات فوق 50 يورو داخل غرايفسفالد 🚚"
                  value={formTextAr}
                  onChange={(e) => setFormTextAr(e.target.value)}
                  className="w-full bg-white border border-emerald-300 rounded-xl p-2.5 font-medium text-xs leading-relaxed focus:border-emerald-700 outline-hidden focus:ring-2 focus:ring-emerald-600/20 transition-all"
                />
                
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-1">
                  <p className="text-[10px] text-emerald-800">
                    💡 اكتب النص هنا ثم اضغط على زر الترجمة الذكية لترجمته فوراً إلى باقي اللغات.
                  </p>

                  <button
                    type="button"
                    onClick={handleAutoTranslate}
                    disabled={isTranslating || !formTextAr.trim()}
                    className="bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white font-bold px-3.5 py-1.5 rounded-xl shadow-xs transition-all cursor-pointer flex items-center justify-center gap-1.5 text-xs active:scale-95 shrink-0"
                    title="ترجمة تلقائية وفورية بجميع اللغات عبر الذكاء الاصطناعي"
                  >
                    {isTranslating ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>جاري الترجمة الذكية...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                        <span>ترجمة ذكية بـ 5 لغات (AI)</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Other 4 Languages Grid */}
              <div className="space-y-2.5">
                <div className="flex items-center gap-1.5 text-stone-700 font-bold text-xs">
                  <Languages className="w-4 h-4 text-emerald-800" />
                  <span>الترجمات للغات الأخرى (ألمانية، إنجليزية، أوكرانية، فارسية):</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  
                  {/* German */}
                  <div className="space-y-1 bg-stone-50 p-2.5 rounded-xl border border-stone-200">
                    <label className="font-bold text-stone-700 flex items-center justify-between text-[11px]">
                      <span className="flex items-center gap-1">🇩🇪 Deutsch (الألمانية)</span>
                      <span className="text-[9px] text-stone-400 font-mono">LTR</span>
                    </label>
                    <input
                      type="text"
                      dir="ltr"
                      placeholder="z.B. Schnelle Lieferung in Greifswald 🚚"
                      value={formTextDe}
                      onChange={(e) => setFormTextDe(e.target.value)}
                      className="w-full bg-white border border-stone-200 rounded-lg p-2 text-xs focus:border-emerald-700 outline-hidden"
                    />
                  </div>

                  {/* English */}
                  <div className="space-y-1 bg-stone-50 p-2.5 rounded-xl border border-stone-200">
                    <label className="font-bold text-stone-700 flex items-center justify-between text-[11px]">
                      <span className="flex items-center gap-1">🇬🇧 English (الإنجليزية)</span>
                      <span className="text-[9px] text-stone-400 font-mono">LTR</span>
                    </label>
                    <input
                      type="text"
                      dir="ltr"
                      placeholder="e.g. Fast free delivery over 50€ 🚚"
                      value={formTextEn}
                      onChange={(e) => setFormTextEn(e.target.value)}
                      className="w-full bg-white border border-stone-200 rounded-lg p-2 text-xs focus:border-emerald-700 outline-hidden"
                    />
                  </div>

                  {/* Ukrainian */}
                  <div className="space-y-1 bg-stone-50 p-2.5 rounded-xl border border-stone-200">
                    <label className="font-bold text-stone-700 flex items-center justify-between text-[11px]">
                      <span className="flex items-center gap-1">🇺🇦 Українська (الأوكرانية)</span>
                      <span className="text-[9px] text-stone-400 font-mono">LTR</span>
                    </label>
                    <input
                      type="text"
                      dir="ltr"
                      placeholder="наприклад, Швидка доставка у Грайфсвальді 🚚"
                      value={formTextUk}
                      onChange={(e) => setFormTextUk(e.target.value)}
                      className="w-full bg-white border border-stone-200 rounded-lg p-2 text-xs focus:border-emerald-700 outline-hidden"
                    />
                  </div>

                  {/* Persian / Farsi */}
                  <div className="space-y-1 bg-stone-50 p-2.5 rounded-xl border border-stone-200">
                    <label className="font-bold text-stone-700 flex items-center justify-between text-[11px]">
                      <span className="flex items-center gap-1">🇮🇷 فارسی (الفارسية)</span>
                      <span className="text-[9px] text-stone-400 font-mono">RTL</span>
                    </label>
                    <input
                      type="text"
                      dir="rtl"
                      placeholder="مثال: ارسال سریع و رایگان به گرایفسوالد 🚚"
                      value={formTextFa}
                      onChange={(e) => setFormTextFa(e.target.value)}
                      className="w-full bg-white border border-stone-200 rounded-lg p-2 text-xs focus:border-emerald-700 outline-hidden"
                    />
                  </div>

                </div>
              </div>

              {/* Icon Selector */}
              <div className="space-y-1.5 pt-1">
                <label className="font-bold text-stone-700">اختر الأيقونة المرافقة للإعلان:</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {AVAILABLE_ICONS.map((opt) => {
                    const Icon = opt.icon;
                    const isSelected = formIcon === opt.type;
                    return (
                      <button
                        type="button"
                        key={opt.type}
                        onClick={() => setFormIcon(opt.type)}
                        className={`p-2 rounded-xl border text-right flex items-center gap-2 cursor-pointer transition-all ${
                          isSelected 
                            ? 'bg-emerald-50 border-emerald-500 text-emerald-950 ring-2 ring-emerald-500/20 font-bold' 
                            : 'bg-stone-50 border-stone-200 text-stone-600 hover:bg-stone-100'
                        }`}
                      >
                        <div className={`w-6 h-6 rounded-lg flex items-center justify-center ${
                          isSelected ? 'bg-emerald-700 text-white' : 'bg-stone-200 text-stone-600'
                        }`}>
                          <Icon className="w-3.5 h-3.5" />
                        </div>
                        <span className="text-[11px] truncate">{opt.type}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Order & Settings Options */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <div className="space-y-1">
                  <label className="font-bold text-stone-700">رقم الترتيب في الشريط (Sort Order)</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={formOrder}
                    onChange={(e) => setFormOrder(parseInt(e.target.value) || 1)}
                    className="w-full bg-stone-50 border border-stone-200 rounded-xl p-2.5 font-mono font-bold focus:border-emerald-700 outline-hidden"
                  />
                  <p className="text-[10px] text-stone-400">الأرقام الأصغر تظهر أولاً</p>
                </div>

                <div className="space-y-2 flex flex-col justify-end">
                  {/* Active Toggle */}
                  <label className="flex items-center gap-2 bg-stone-50 p-2.5 rounded-xl border border-stone-200 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formIsActive}
                      onChange={(e) => setFormIsActive(e.target.checked)}
                      className="w-4 h-4 accent-emerald-800 rounded-sm cursor-pointer"
                    />
                    <span className="font-bold text-stone-800 text-xs">تفعيل الإعلان (نشط للعملاء)</span>
                  </label>
                </div>
              </div>

              {/* Highlight Option */}
              <div className="pt-1">
                <label className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${
                  formIsHighlight 
                    ? 'bg-amber-50 border-amber-300 text-amber-950' 
                    : 'bg-stone-50 border-stone-200 text-stone-700'
                }`}>
                  <div className="flex items-center gap-2">
                    <Sparkles className={`w-4 h-4 ${formIsHighlight ? 'text-amber-600' : 'text-stone-400'}`} />
                    <div>
                      <div className="font-bold text-xs">تمييز الإعلان بلون ذهبي متوهج ⭐</div>
                      <div className="text-[10px] text-stone-500">يجعل هذا الإعلان يبرز بلون ذهبي جذاب أثناء الحركة</div>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={formIsHighlight}
                    onChange={(e) => setFormIsHighlight(e.target.checked)}
                    className="w-4 h-4 accent-amber-600 rounded-sm cursor-pointer"
                  />
                </label>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 pt-3 border-t border-stone-100">
                <button
                  type="submit"
                  disabled={isSubmitting || isTranslating}
                  className="flex-1 bg-emerald-800 hover:bg-emerald-900 text-white font-bold py-2.5 rounded-xl cursor-pointer shadow-xs transition-all disabled:opacity-50 flex items-center justify-center gap-1.5"
                >
                  {isSubmitting ? (
                    <span>جاري الحفظ في Firestore...</span>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      <span>{editingItem ? 'حفظ التعديلات' : 'إضافة ونشر الإعلان'}</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold rounded-xl cursor-pointer"
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

