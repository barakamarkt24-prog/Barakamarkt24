import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  ShieldCheck, 
  Save, 
  RotateCcw, 
  Plus, 
  Trash2, 
  Layers, 
  Calendar, 
  CheckCircle2, 
  ShoppingBag, 
  CreditCard, 
  Truck, 
  PhoneCall, 
  ExternalLink,
  Eye,
  AlertCircle,
  HelpCircle,
  Sparkles
} from 'lucide-react';
import { 
  legalService, 
  LegalPoliciesState, 
  LegalDocument, 
  INITIAL_LEGAL_DOCS 
} from '../../services/legalService';

interface AdminLegalManagementProps {
  showToast: (msg: string) => void;
  navigateTo?: (screen: any) => void;
}

export const AdminLegalManagement: React.FC<AdminLegalManagementProps> = ({ showToast, navigateTo }) => {
  const [policies, setPolicies] = useState<LegalPoliciesState>(INITIAL_LEGAL_DOCS);
  const [selectedDocKey, setSelectedDocKey] = useState<keyof LegalPoliciesState>('agb');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [showPreview, setShowPreview] = useState<boolean>(false);

  // Active document in editing state
  const activeDoc = policies[selectedDocKey] || INITIAL_LEGAL_DOCS[selectedDocKey];

  useEffect(() => {
    async function loadPolicies() {
      setIsLoading(true);
      try {
        const fetched = await legalService.getAllLegalDocs();
        setPolicies(fetched);
      } catch (e) {
        console.error('Failed to load legal policies:', e);
        showToast('تعذر تحميل السياسات من Firestore');
      } finally {
        setIsLoading(false);
      }
    }
    loadPolicies();
  }, []);

  const docTabs: { key: keyof LegalPoliciesState; label: string; subLabel: string; icon: any }[] = [
    { key: 'agb', label: 'الشروط والأحكام (AGB)', subLabel: 'Allgemeine Geschäftsbedingungen', icon: FileText },
    { key: 'privacy', label: 'سياسة الخصوصية (DSGVO)', subLabel: 'Datenschutzerklärung', icon: ShieldCheck },
    { key: 'order_terms', label: 'شروط الشراء والطلبات', subLabel: 'Bestellbedingungen', icon: ShoppingBag },
    { key: 'payment_policy', label: 'سياسة وطرق الدفع', subLabel: 'Zahlungsbedingungen', icon: CreditCard },
    { key: 'delivery_policy', label: 'سياسة التوصيل والشحن', subLabel: 'Lieferbedingungen', icon: Truck },
    { key: 'refund_policy', label: 'الإلغاء والاسترجاع', subLabel: 'Widerrufsbelehrung', icon: RotateCcw },
    { key: 'contact_info', label: 'معلومات التواصل والخدمة', subLabel: 'Kontakt & Impressum Info', icon: PhoneCall },
  ];

  // Update specific field of the active document
  const handleUpdateActiveDocField = (field: keyof LegalDocument, value: any) => {
    setPolicies(prev => ({
      ...prev,
      [selectedDocKey]: {
        ...prev[selectedDocKey],
        [field]: value
      }
    }));
  };

  // Section Handlers
  const handleAddSection = () => {
    const currentSections = activeDoc.sections || [];
    const newSection = {
      heading: `${currentSections.length + 1}. بند جديد`,
      content: 'اكتب تفاصيل وشرح هذا البند هنا...',
      points: ['نقطة توضيحية أولى']
    };
    handleUpdateActiveDocField('sections', [...currentSections, newSection]);
  };

  const handleUpdateSection = (index: number, field: 'heading' | 'content', value: string) => {
    const currentSections = [...(activeDoc.sections || [])];
    if (currentSections[index]) {
      currentSections[index] = {
        ...currentSections[index],
        [field]: value
      };
      handleUpdateActiveDocField('sections', currentSections);
    }
  };

  const handleDeleteSection = (index: number) => {
    if (window.confirm('هل أنت متأكد من حذف هذا البند من الوثيقة؟')) {
      const currentSections = (activeDoc.sections || []).filter((_, i) => i !== index);
      handleUpdateActiveDocField('sections', currentSections);
    }
  };

  // Points within section
  const handleAddPoint = (secIndex: number) => {
    const currentSections = [...(activeDoc.sections || [])];
    if (currentSections[secIndex]) {
      const points = currentSections[secIndex].points || [];
      currentSections[secIndex].points = [...points, 'نقطة جديدة'];
      handleUpdateActiveDocField('sections', currentSections);
    }
  };

  const handleUpdatePoint = (secIndex: number, pointIndex: number, value: string) => {
    const currentSections = [...(activeDoc.sections || [])];
    if (currentSections[secIndex] && currentSections[secIndex].points) {
      const points = [...currentSections[secIndex].points!];
      points[pointIndex] = value;
      currentSections[secIndex].points = points;
      handleUpdateActiveDocField('sections', currentSections);
    }
  };

  const handleDeletePoint = (secIndex: number, pointIndex: number) => {
    const currentSections = [...(activeDoc.sections || [])];
    if (currentSections[secIndex] && currentSections[secIndex].points) {
      currentSections[secIndex].points = currentSections[secIndex].points!.filter((_, i) => i !== pointIndex);
      handleUpdateActiveDocField('sections', currentSections);
    }
  };

  // Save changes to Firestore
  const handleSaveActiveDocument = async () => {
    setIsSaving(true);
    try {
      const docToSave = {
        ...activeDoc,
        updatedAt: new Date().toISOString().split('T')[0]
      };
      const ok = await legalService.saveLegalDoc(selectedDocKey, docToSave);
      if (ok) {
        showToast(`تم حفظ ونشر وثيقة "${docToSave.titleAr}" بنجاح في Firestore (الإصدار v${docToSave.version}) 🎉`);
        setPolicies(prev => ({
          ...prev,
          [selectedDocKey]: docToSave
        }));
      } else {
        showToast('حدث خطأ أثناء حفظ الوثيقة في Firestore');
      }
    } catch (e: any) {
      showToast(e.message || 'فشل حفظ الوثيقة');
    } finally {
      setIsSaving(false);
    }
  };

  // Save all documents at once
  const handleSaveAllDocuments = async () => {
    setIsSaving(true);
    try {
      const ok = await legalService.saveAllLegalDocs(policies);
      if (ok) {
        showToast('تم حفظ ونشر جميع السياسات السبعة في Firestore بنجاح! 🎉');
      } else {
        showToast('حدث خطأ أثناء حفظ السياسات');
      }
    } catch (e: any) {
      showToast(e.message || 'فشل الحفظ');
    } finally {
      setIsSaving(false);
    }
  };

  // Reset current document to initial draft template
  const handleResetToDefaultTemplate = () => {
    if (window.confirm(`هل أنت متأكد من استعادة المسودة الافتراضية لوثيقة "${activeDoc.titleAr}"؟ سيتم استبدال التعديلات الحالية بالمسودة الأولية.`)) {
      const defaultDoc = INITIAL_LEGAL_DOCS[selectedDocKey];
      handleUpdateActiveDocField('sections', defaultDoc.sections);
      handleUpdateActiveDocField('titleAr', defaultDoc.titleAr);
      handleUpdateActiveDocField('titleDe', defaultDoc.titleDe);
      handleUpdateActiveDocField('version', defaultDoc.version);
      showToast('تمت استعادة المسودة الافتراضية بنجاح. لا تنس الضغط على زر الحفظ لنشرها.');
    }
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-3xl p-12 border border-stone-200 text-center space-y-3">
        <div className="w-8 h-8 border-3 border-emerald-800 border-t-transparent rounded-full animate-spin mx-auto"></div>
        <p className="text-xs text-stone-500 font-bold">جاري تحميل السياسات والشروط من Firestore...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4" dir="rtl">
      {/* Top Action & Info Card */}
      <div className="bg-white rounded-3xl p-4 sm:p-6 border border-stone-200/80 shadow-2xs space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-800 flex items-center justify-center border border-emerald-200">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black text-stone-900">
                  إدارة الشروط والسياسات القانونية (CMS)
                </h2>
                <span className="bg-emerald-100 text-emerald-900 text-[10px] font-bold px-2 py-0.5 rounded-full">
                  قابلة للتعديل بدون كود
                </span>
              </div>
              <p className="text-xs text-stone-500">
                تعديل نصوص الشروط والأحكام، سياسات الخصوصية، التوصيل، الإرجاع، وتحديث أرقام الإصدارات مباشرة
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowPreview(!showPreview)}
              className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer border transition-colors ${
                showPreview 
                  ? 'bg-stone-900 text-white border-stone-900' 
                  : 'bg-stone-100 text-stone-700 hover:bg-stone-200 border-stone-300'
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              <span>{showPreview ? 'العودة للمحرر' : 'معاينة العرض'}</span>
            </button>

            {navigateTo && (
              <button
                type="button"
                onClick={() => navigateTo('legal')}
                className="bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors"
                title="فتح شاشة السياسات كما يراها العميل"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">شاشة العميل</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleSaveActiveDocument}
              disabled={isSaving}
              className="bg-emerald-800 hover:bg-emerald-900 text-white font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-1.5 shadow-sm cursor-pointer transition-all disabled:opacity-50"
            >
              <Save className="w-4 h-4 text-amber-300" />
              <span>{isSaving ? 'جاري الحفظ...' : 'حفظ ونشر الوثيقة'}</span>
            </button>
          </div>
        </div>

        {/* Operational draft hint banner */}
        <div className="bg-amber-50/90 border border-amber-200 rounded-2xl p-3 text-xs text-amber-900 flex items-start gap-2.5">
          <AlertCircle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
          <div className="leading-relaxed">
            <strong>نظام التعديل المباشر:</strong> التعديلات التي تقوم بها هنا تُحفظ في مستند <code>settings/legal</code> في Firestore وتنعكس فورياً لدى الزبائن وفي شاشة التسجيل دون الحاجة لإعادة نشر الكود.
          </div>
        </div>
      </div>

      {/* Main Container: Document Selector Tabs + Document Editor */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Document Selection List */}
        <div className="lg:col-span-4 space-y-2">
          <div className="bg-white rounded-3xl p-3 border border-stone-200/80 shadow-2xs space-y-1.5">
            <div className="font-extrabold text-[11px] text-stone-400 uppercase tracking-wider px-2 py-1">
              اختر الوثيقة للتعديل
            </div>

            {docTabs.map((tab) => {
              const Icon = tab.icon;
              const isSelected = selectedDocKey === tab.key;
              const docItem = policies[tab.key];
              return (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setSelectedDocKey(tab.key)}
                  className={`w-full text-right p-3 rounded-2xl transition-all cursor-pointer flex items-center justify-between gap-2 ${
                    isSelected 
                      ? 'bg-emerald-800 text-white shadow-sm' 
                      : 'bg-stone-50 hover:bg-stone-100 text-stone-800 border border-stone-200/70'
                  }`}
                >
                  <div className="flex items-center gap-2.5 truncate">
                    <div className={`p-2 rounded-xl shrink-0 ${isSelected ? 'bg-white/20 text-white' : 'bg-stone-200 text-stone-700'}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="truncate">
                      <div className="font-bold text-xs truncate">{tab.label}</div>
                      <div className={`text-[10px] truncate font-sans ${isSelected ? 'text-emerald-100' : 'text-stone-400'}`}>
                        {tab.subLabel}
                      </div>
                    </div>
                  </div>

                  <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-bold shrink-0 ${
                    isSelected ? 'bg-white/20 text-white' : 'bg-stone-200 text-stone-600'
                  }`}>
                    v{docItem?.version || '1.0'}
                  </span>
                </button>
              );
            })}

            <div className="pt-2">
              <button
                type="button"
                onClick={handleSaveAllDocuments}
                disabled={isSaving}
                className="w-full bg-stone-900 hover:bg-stone-800 text-white font-bold p-2.5 rounded-xl text-xs flex items-center justify-center gap-2 cursor-pointer transition-colors shadow-2xs"
              >
                <Save className="w-3.5 h-3.5 text-amber-400" />
                <span>حفظ جميع السياسات دفعة واحدة</span>
              </button>
            </div>
          </div>
        </div>

        {/* Document Editor Area */}
        <div className="lg:col-span-8 space-y-4">
          {showPreview ? (
            /* Live Preview Mode */
            <div className="bg-white rounded-3xl p-6 border border-stone-200 space-y-6">
              <div className="border-b border-stone-200 pb-4 flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-black text-stone-900">{activeDoc.titleAr}</h3>
                  <p className="text-xs text-stone-500 font-sans">{activeDoc.titleDe}</p>
                </div>
                <div className="text-xs text-stone-500 font-sans text-left">
                  <div><strong>Version:</strong> v{activeDoc.version}</div>
                  <div><strong>Updated:</strong> {activeDoc.updatedAt}</div>
                </div>
              </div>

              <div className="space-y-4">
                {activeDoc.sections?.map((sec, idx) => (
                  <div key={idx} className="bg-stone-50 p-4 rounded-2xl border border-stone-200 space-y-2">
                    <h4 className="font-bold text-sm text-stone-900">{sec.heading}</h4>
                    <p className="text-xs text-stone-700 whitespace-pre-line leading-relaxed">{sec.content}</p>
                    {sec.points && sec.points.length > 0 && (
                      <ul className="list-disc list-inside text-xs text-stone-600 space-y-1 pt-1">
                        {sec.points.map((pt, pIdx) => (
                          <li key={pIdx}>{pt}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ) : (
            /* Active Editor Form */
            <div className="bg-white rounded-3xl p-5 sm:p-6 border border-stone-200/80 shadow-2xs space-y-5">
              {/* Metadata Form Header: Titles, Version, Date */}
              <div className="border-b border-stone-200 pb-5 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h3 className="font-black text-sm text-stone-900 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-700"></span>
                    <span>بيانات وإصدار الوثيقة: {activeDoc.titleAr}</span>
                  </h3>

                  <button
                    type="button"
                    onClick={handleResetToDefaultTemplate}
                    className="text-[11px] font-bold text-rose-600 hover:text-rose-800 bg-rose-50 px-2.5 py-1 rounded-lg border border-rose-200 cursor-pointer flex items-center gap-1"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>استعادة المسودة الافتراضية</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-stone-600 mb-1">
                      عنوان الوثيقة (بالعربية)
                    </label>
                    <input
                      type="text"
                      value={activeDoc.titleAr}
                      onChange={(e) => handleUpdateActiveDocField('titleAr', e.target.value)}
                      className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3 py-2 text-xs font-bold text-stone-900 focus:bg-white focus:outline-emerald-800"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-stone-600 mb-1">
                      العنوان بالألمانية (Titel auf Deutsch)
                    </label>
                    <input
                      type="text"
                      value={activeDoc.titleDe}
                      onChange={(e) => handleUpdateActiveDocField('titleDe', e.target.value)}
                      className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3 py-2 text-xs text-stone-900 font-sans focus:bg-white focus:outline-emerald-800"
                      dir="ltr"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-stone-600 mb-1 flex items-center justify-between">
                      <span>رقم الإصدار (Version)</span>
                      <span className="text-[10px] text-stone-400 font-normal">مثال: 1.0 أو 1.1</span>
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={activeDoc.version}
                        onChange={(e) => handleUpdateActiveDocField('version', e.target.value)}
                        className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3 py-2 text-xs font-mono font-bold text-stone-900 focus:bg-white focus:outline-emerald-800"
                        placeholder="1.0"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const current = parseFloat(activeDoc.version) || 1.0;
                          const nextVer = (current + 0.1).toFixed(1);
                          handleUpdateActiveDocField('version', nextVer);
                          showToast(`تمت ترقية الإصدار إلى v${nextVer}`);
                        }}
                        className="px-2.5 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 text-[10px] font-bold rounded-xl whitespace-nowrap cursor-pointer"
                        title="زيادة الإصدار بمقدار 0.1"
                      >
                        +0.1
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-stone-600 mb-1">
                      تاريخ آخر تحديث (Datum der Aktualisierung)
                    </label>
                    <input
                      type="date"
                      value={activeDoc.updatedAt || new Date().toISOString().split('T')[0]}
                      onChange={(e) => handleUpdateActiveDocField('updatedAt', e.target.value)}
                      className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3 py-2 text-xs font-sans text-stone-900 focus:bg-white focus:outline-emerald-800"
                    />
                  </div>
                </div>
              </div>

              {/* Sections Editor */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-extrabold text-xs text-stone-800 flex items-center gap-1.5">
                    <Layers className="w-4 h-4 text-emerald-800" />
                    <span>بنود وفقرات الوثيقة ({activeDoc.sections?.length || 0})</span>
                  </h4>

                  <button
                    type="button"
                    onClick={handleAddSection}
                    className="bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>إضافة بند جديد</span>
                  </button>
                </div>

                <div className="space-y-4">
                  {activeDoc.sections?.map((sec, secIdx) => (
                    <div 
                      key={secIdx}
                      className="bg-stone-50/80 border border-stone-200/90 rounded-2xl p-4 space-y-3 relative group"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="w-6 h-6 rounded-lg bg-emerald-800 text-white text-xs font-bold flex items-center justify-center shrink-0">
                          {secIdx + 1}
                        </span>

                        <input
                          type="text"
                          value={sec.heading}
                          onChange={(e) => handleUpdateSection(secIdx, 'heading', e.target.value)}
                          placeholder="عنوان البند (مثال: 1. نطاق وسريان الشروط)"
                          className="flex-1 bg-white border border-stone-300 rounded-xl px-3 py-1.5 text-xs font-bold text-stone-900 focus:outline-emerald-800"
                        />

                        <button
                          type="button"
                          onClick={() => handleDeleteSection(secIdx)}
                          className="p-1.5 text-stone-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg cursor-pointer transition-colors"
                          title="حذف هذا البند"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-stone-500 mb-1">
                          نص وشرح البند:
                        </label>
                        <textarea
                          rows={3}
                          value={sec.content}
                          onChange={(e) => handleUpdateSection(secIdx, 'content', e.target.value)}
                          placeholder="اكتب تفاصيل هذا البند بشكل واضح..."
                          className="w-full bg-white border border-stone-300 rounded-xl p-3 text-xs text-stone-800 leading-relaxed focus:outline-emerald-800 resize-y"
                        />
                      </div>

                      {/* Points Editor for this Section */}
                      <div className="pt-2 border-t border-stone-200/70 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-bold text-stone-500">
                            نقاط تفصيلية فرعية (Bullet Points):
                          </span>
                          <button
                            type="button"
                            onClick={() => handleAddPoint(secIdx)}
                            className="text-[10px] font-bold text-emerald-800 hover:underline flex items-center gap-1 cursor-pointer"
                          >
                            <Plus className="w-3 h-3" />
                            <span>إضافة نقطة</span>
                          </button>
                        </div>

                        {sec.points && sec.points.map((pt, ptIdx) => (
                          <div key={ptIdx} className="flex items-center gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-600 shrink-0" />
                            <input
                              type="text"
                              value={pt}
                              onChange={(e) => handleUpdatePoint(secIdx, ptIdx, e.target.value)}
                              className="flex-1 bg-white border border-stone-200 rounded-lg px-2.5 py-1 text-xs text-stone-800 focus:outline-emerald-800"
                              placeholder="اكتب النقطة الفرعية..."
                            />
                            <button
                              type="button"
                              onClick={() => handleDeletePoint(secIdx, ptIdx)}
                              className="p-1 text-stone-400 hover:text-rose-600 cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Bottom Save Action */}
              <div className="border-t border-stone-200 pt-4 flex items-center justify-between">
                <div className="text-[11px] text-stone-500 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                  <span>تأكد من الضغط على "حفظ ونشر" لتحديث الوثيقة في قاعدة البيانات.</span>
                </div>

                <button
                  type="button"
                  onClick={handleSaveActiveDocument}
                  disabled={isSaving}
                  className="bg-emerald-800 hover:bg-emerald-900 text-white font-bold px-5 py-2.5 rounded-xl text-xs flex items-center gap-2 shadow-md cursor-pointer transition-all disabled:opacity-50"
                >
                  <Save className="w-4 h-4 text-amber-300" />
                  <span>{isSaving ? 'جاري الحفظ والتحديث...' : `حفظ ونشر ${activeDoc.titleAr}`}</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
