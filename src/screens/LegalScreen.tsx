import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  ShieldCheck, 
  ArrowRight, 
  ShoppingBag, 
  CreditCard, 
  Truck, 
  RotateCcw, 
  PhoneCall, 
  CheckCircle2, 
  Info,
  Calendar,
  Layers,
  Sparkles,
  ExternalLink,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { legalService, LegalPoliciesState, LegalDocument } from '../services/legalService';

interface LegalScreenProps {
  initialTab?: keyof LegalPoliciesState;
  onBack?: () => void;
}

export const LegalScreen: React.FC<LegalScreenProps> = ({ initialTab = 'agb', onBack }) => {
  const { navigateTo, goBack } = useApp();
  const [policies, setPolicies] = useState<LegalPoliciesState | null>(null);
  const [activeTab, setActiveTab] = useState<keyof LegalPoliciesState>(initialTab);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [expandedSections, setExpandedSections] = useState<Record<number, boolean>>({});

  useEffect(() => {
    let unsubscribe: (() => void) | undefined;
    
    async function loadData() {
      setIsLoading(true);
      const docs = await legalService.getAllLegalDocs();
      setPolicies(docs);
      setIsLoading(false);

      // Subscribe to real-time updates if admin changes anything
      unsubscribe = legalService.subscribeToLegalDocs((updated) => {
        setPolicies(updated);
      });
    }

    loadData();

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  const navTabs: { key: keyof LegalPoliciesState; labelAr: string; labelDe: string; icon: any }[] = [
    { key: 'agb', labelAr: 'الشروط والأحكام (AGB)', labelDe: 'AGB', icon: FileText },
    { key: 'privacy', labelAr: 'سياسة الخصوصية (DSGVO)', labelDe: 'Datenschutz', icon: ShieldCheck },
    { key: 'order_terms', labelAr: 'شروط الشراء والطلبات', labelDe: 'Bestellbedingungen', icon: ShoppingBag },
    { key: 'payment_policy', labelAr: 'سياسة الدفع', labelDe: 'Zahlung', icon: CreditCard },
    { key: 'delivery_policy', labelAr: 'سياسة التوصيل', labelDe: 'Lieferung', icon: Truck },
    { key: 'refund_policy', labelAr: 'الإلغاء والاسترجاع', labelDe: 'Widerruf', icon: RotateCcw },
    { key: 'contact_info', labelAr: 'بيانات التواصل والخدمة', labelDe: 'Kontakt', icon: PhoneCall },
  ];

  const currentDoc: LegalDocument | undefined = policies ? policies[activeTab] : undefined;

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      goBack();
    }
  };

  const toggleSection = (idx: number) => {
    setExpandedSections(prev => ({
      ...prev,
      [idx]: prev[idx] === false ? true : false // default open
    }));
  };

  return (
    <div className="min-h-screen bg-stone-100 text-stone-900 pb-20 pt-4 px-3 sm:px-6 max-w-5xl mx-auto" dir="rtl">
      {/* Header Bar */}
      <div className="bg-white rounded-3xl p-4 sm:p-6 shadow-xs border border-stone-200/80 mb-4 sm:mb-6">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <button
              onClick={handleBack}
              className="w-10 h-10 rounded-2xl bg-stone-100 hover:bg-stone-200 flex items-center justify-center text-stone-700 cursor-pointer transition-colors"
              title="رجوع"
            >
              <ArrowRight className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-lg sm:text-xl font-black text-stone-900 flex items-center gap-2">
                <ShieldCheck className="w-6 h-6 text-emerald-800" />
                <span>السياسات والشروط القانونية</span>
              </h1>
              <p className="text-xs text-stone-500 mt-0.5">
                متجر بركة ماركت 24 - الشفافية والامتثال للأنظمة الألمانية والأوروبية
              </p>
            </div>
          </div>

          <button
            onClick={() => navigateTo('home')}
            className="hidden sm:flex items-center gap-1.5 text-xs font-bold text-emerald-800 hover:text-emerald-900 bg-emerald-50 px-3.5 py-2 rounded-xl transition-colors cursor-pointer"
          >
            <span>العودة للرئيسية</span>
          </button>
        </div>

        {/* Operational Draft Notice Badge */}
        <div className="mt-4 p-3 bg-amber-50/90 border border-amber-200/80 rounded-2xl flex items-start gap-2.5 text-xs text-amber-900">
          <Info className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
          <div className="leading-relaxed">
            <strong>تنويه قانوني وإداري:</strong> هذه النصوص تمثل المسودة التشغيلية المنظمة لخدمات متجر Barakamarkt24، وتخضع للمراجعة والتحديث المستمر عبر لوحة الإدارة لمواكبة تطورات الخدمة والتراخيص النظامية في ألمانيا.
          </div>
        </div>
      </div>

      {/* Main Layout: Tabs on Side (or top on mobile) + Content */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6">
        {/* Navigation Sidebar / Pills */}
        <div className="lg:col-span-4 space-y-2">
          <div className="bg-white rounded-3xl p-3 sm:p-4 shadow-xs border border-stone-200/80 sticky top-4">
            <div className="font-extrabold text-xs text-stone-500 uppercase tracking-wider mb-2.5 px-2">
              قائمة الوثائق والسياسات
            </div>

            <div className="space-y-1.5">
              {navTabs.map((tab) => {
                const Icon = tab.icon;
                const isSelected = activeTab === tab.key;
                return (
                  <button
                    key={tab.key}
                    onClick={() => {
                      setActiveTab(tab.key);
                      setExpandedSections({});
                    }}
                    className={`w-full flex items-center justify-between p-3 rounded-2xl text-right font-bold text-xs transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-emerald-800 text-white shadow-sm'
                        : 'bg-stone-50/70 hover:bg-stone-100 text-stone-700 border border-stone-200/60'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <div className={`p-1.5 rounded-xl ${isSelected ? 'bg-white/20 text-white' : 'bg-stone-200/70 text-stone-600'}`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="truncate text-right">
                        <div className="truncate font-bold">{tab.labelAr}</div>
                        <div className={`text-[10px] font-sans truncate ${isSelected ? 'text-emerald-100' : 'text-stone-400'}`}>
                          {tab.labelDe}
                        </div>
                      </div>
                    </div>

                    {policies && policies[tab.key] && (
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-mono font-bold ${
                        isSelected ? 'bg-white/20 text-white' : 'bg-stone-200/80 text-stone-600'
                      }`}>
                        v{policies[tab.key].version}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Document Content View */}
        <div className="lg:col-span-8">
          <div className="bg-white rounded-3xl p-5 sm:p-8 shadow-xs border border-stone-200/80 space-y-6 min-h-[500px]">
            {isLoading || !currentDoc ? (
              <div className="py-20 flex flex-col items-center justify-center text-center space-y-3">
                <div className="w-8 h-8 border-3 border-emerald-800 border-t-transparent rounded-full animate-spin"></div>
                <p className="text-xs text-stone-500 font-bold">جاري تحميل السياسة من خوادم المتجر...</p>
              </div>
            ) : (
              <>
                {/* Policy Title and Metadata Card */}
                <div className="border-b border-stone-200 pb-5 space-y-2">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-800 font-bold text-xs rounded-full border border-emerald-200/80">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      وثيقة سارية ومعتمدة
                    </span>

                    <div className="flex items-center gap-3 text-xs text-stone-500 font-sans">
                      <span className="flex items-center gap-1">
                        <Layers className="w-3.5 h-3.5 text-stone-400" />
                        <strong>الإصدار:</strong> v{currentDoc.version}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-stone-400" />
                        <strong>آخر تحديث:</strong> {currentDoc.updatedAt}
                      </span>
                    </div>
                  </div>

                  <h2 className="text-xl sm:text-2xl font-black text-stone-900 pt-1">
                    {currentDoc.titleAr}
                  </h2>
                  <div className="text-xs font-sans text-stone-500" dir="ltr">
                    {currentDoc.titleDe}
                  </div>
                </div>

                {/* Sections List */}
                <div className="space-y-4">
                  {currentDoc.sections && currentDoc.sections.length > 0 ? (
                    currentDoc.sections.map((sec, idx) => {
                      const isCollapsed = expandedSections[idx] === false;
                      return (
                        <div 
                          key={idx}
                          className="bg-stone-50/70 border border-stone-200/80 rounded-2xl p-4 sm:p-5 transition-all space-y-3"
                        >
                          <div 
                            onClick={() => toggleSection(idx)}
                            className="flex items-center justify-between cursor-pointer group select-none"
                          >
                            <h3 className="font-extrabold text-sm sm:text-base text-stone-900 flex items-center gap-2">
                              <span className="w-2 h-2 rounded-full bg-emerald-700"></span>
                              <span>{sec.heading}</span>
                            </h3>
                            <button className="text-stone-400 group-hover:text-stone-700 p-1">
                              {isCollapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
                            </button>
                          </div>

                          {!isCollapsed && (
                            <div className="space-y-3 text-xs sm:text-sm text-stone-700 leading-relaxed pt-1">
                              <p className="whitespace-pre-line">{sec.content}</p>

                              {sec.points && sec.points.length > 0 && (
                                <ul className="space-y-2 pt-1 pr-2">
                                  {sec.points.map((pt, pIdx) => (
                                    <li key={pIdx} className="flex items-start gap-2.5">
                                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-600 shrink-0 mt-2" />
                                      <span className="text-stone-700 text-xs sm:text-sm leading-relaxed">{pt}</span>
                                    </li>
                                  ))}
                                </ul>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })
                  ) : (
                    <div className="p-6 bg-stone-50 rounded-2xl text-center text-xs text-stone-500">
                      لا توجد بنود مدخلة لهذه الوثيقة حالياً.
                    </div>
                  )}

                  {/* Raw Text if present */}
                  {currentDoc.rawMarkdownOrText && (
                    <div className="p-4 bg-stone-50 rounded-2xl border border-stone-200 text-xs sm:text-sm leading-relaxed whitespace-pre-wrap text-stone-700 font-sans">
                      {currentDoc.rawMarkdownOrText}
                    </div>
                  )}
                </div>

                {/* Bottom Assistance Notice */}
                <div className="border-t border-stone-200 pt-5 mt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-stone-500">
                  <p>
                    لديك استفسار حول هذه الشروط أو حقوقك كعميل؟ فريقنا يسعد بمساعدتك دائماً.
                  </p>
                  <button
                    onClick={() => setActiveTab('contact_info')}
                    className="inline-flex items-center gap-1.5 font-bold text-emerald-800 hover:text-emerald-950 bg-emerald-50 px-3 py-1.5 rounded-xl cursor-pointer"
                  >
                    <PhoneCall className="w-3.5 h-3.5" />
                    <span>تواصل معنا</span>
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
