import { 
  getDocs, 
  getDoc, 
  doc, 
  setDoc, 
  onSnapshot
} from 'firebase/firestore';
import { db } from './firebaseConfig';

export interface LegalDocument {
  id: string; // 'agb' | 'privacy' | 'order_terms' | 'payment_policy' | 'delivery_policy' | 'refund_policy' | 'contact_info'
  key: string;
  titleAr: string;
  titleDe: string;
  version: string;
  updatedAt: string;
  updatedBy?: string;
  sections: {
    heading: string;
    content: string;
    points?: string[];
  }[];
  rawMarkdownOrText?: string;
  isActive: boolean;
}

export interface LegalPoliciesState {
  agb: LegalDocument;
  privacy: LegalDocument;
  order_terms: LegalDocument;
  payment_policy: LegalDocument;
  delivery_policy: LegalDocument;
  refund_policy: LegalDocument;
  contact_info: LegalDocument;
}

export const INITIAL_LEGAL_DOCS: LegalPoliciesState = {
  agb: {
    id: 'agb',
    key: 'agb',
    titleAr: 'الشروط والأحكام العامة (AGB)',
    titleDe: 'Allgemeine Geschäftsbedingungen (AGB)',
    version: '1.0',
    updatedAt: '2026-08-25',
    isActive: true,
    sections: [
      {
        heading: '1. نطاق وسريان الشروط',
        content: 'تسري هذه الشروط والأحكام العامة على جميع الطلبات والعمليات الشرائية المبرمة عبر متجر Barakamarkt24 الإلكتروني بين المتجر والعميل داخل جمهورية ألمانيا الاتحادية.',
        points: [
          'يُعد استخدامك للموقع أو تسجيل حساب جديد موافقة صريحة على الالتزام بهذه الشروط.',
          'يحتفظ متجر Barakamarkt24 بالحق في تحديث هذه الشروط عند الحاجة وسيقوم بإشعار المستخدمين بالإصدارات الجديدة.'
        ]
      },
      {
        heading: '2. إبرام العقد والطلبات',
        content: 'إن عرض المنتجات في المتجر لا يشكل عرضاً ملزماً قانوناً بل دعوة لتقديم طلب الشراء. يتم إبرام عقد البيع بمجرد إرسال تأكيد استلام الطلب ومراجعته وتجهيزه للتسليم.',
        points: [
          'يجب أن تكون جميع بيانات العميل المدخلة (الاسم، العنوان، رقم الهاتف) دقيقة وصحيحة.',
          'الطلبات مخصصة للاستهلاك العائلي والشخصي المعتاد ما لم يتم الاتفاق على غير ذلك.'
        ]
      },
      {
        heading: '3. الأسعار وتوفر المنتجات',
        content: 'جميع الأسعار المعروضة في المتجر تشمل ضريبة القيمة المضافة القانونية المعمول بها في ألمانيا (MwSt). تضاف رسوم التوصيل وفقاً لسياسة التوصيل المعتمدة ومكان السكن.',
        points: [
          'في حال نفاد منتج معين بعد تقديم الطلب، سيتم إخطار العميل فوراً وتعديل الفاتورة أو تقديم بديل مناسب بعد موافقته.'
        ]
      },
      {
        heading: '4. بيانات المشغل والمسؤولية القانونية',
        content: '[يتم استكمال وتدقيق بيانات السجل التجاري والكيان القانوني النهائي ومسؤول المتجر قبل الإطلاق الرسمي].',
        points: [
          'تخضع هذه الشروط للقوانين والتشريعات السارية في ألمانيا.'
        ]
      }
    ]
  },
  privacy: {
    id: 'privacy',
    key: 'privacy',
    titleAr: 'سياسة الخصوصية وحماية البيانات (Datenschutzerklärung)',
    titleDe: 'Datenschutzerklärung',
    version: '1.0',
    updatedAt: '2026-08-25',
    isActive: true,
    sections: [
      {
        heading: '1. الالتزام بحماية البيانات (DSGVO / GDPR)',
        content: 'نحن في Barakamarkt24 نولي خصوصية بياناتك أهمية قصوى ونلتزم باللائحة العامة لحماية البيانات في الاتحاد الأوروبي (DSGVO). نوضح هنا كيفية جمع واستخدام بياناتك الشخصية.',
        points: [
          'لا نقوم ببيع أو مشاركة بياناتك مع أي طرف ثالث لأغراض تسويقية غير مصرح بها.',
          'تُعالج البيانات الشخصية حصراً لتنفيذ الطلبات وتوصيلها وتقديم خدمة العملاء.'
        ]
      },
      {
        heading: '2. البيانات التي يتم جمعها',
        content: 'عند إنشاء حساب أو تقديم طلب، نقوم بجمع البيانات الضرورية لتقديم الخدمة:',
        points: [
          'البيانات الشخصية: الاسم الكامل، البريد الإلكتروني، رقم الهاتف.',
          'بيانات العنوان: الشارع، رقم البناء، الرمز البريدي (PLZ)، والمدينة.',
          'بيانات الطلبات والمشتريات وتاريخ الطلبات السابقة.',
          'المعلومات التقنية: سجلات النظام الضرورية لأمان الحساب عبر خدمات Google Firebase الموثوقة.'
        ]
      },
      {
        heading: '3. البنية التحتية والخدمات السحابية',
        content: 'يستخدم التطبيق البنية التحتية السحابية الآمنة من Google Cloud و Firebase (Firebase Authentication لتسجيل الدخول الآمن، وCloud Firestore لقاعدة البيانات المحمية بقواعد أمان صارمة).',
        points: [
          'يتم تشفير جميع الاتصالات عبر بروتوكولات HTTPS و SSL الآمنة.',
          'السياسة قابلة للتحديث لاحقاً لتشمل أي خدمات تقنية أو بوابات دفع إضافية يتم تفعيلها عند الإطلاق.'
        ]
      },
      {
        heading: '4. حقوقك كصاحب بيانات',
        content: 'يحق لك في أي وقت ممارسة حقوقك القانونية المنصوص عليها في DSGVO:',
        points: [
          'طلب الاطلاع على البيانات المخزنة لديك (Auskunftsrecht).',
          'تصحيح البيانات غير الدقيقة أو تعديلها من شاشة ملفك الشخصي.',
          'طلب حذف الحساب والبيانات الشخصية (Recht auf Löschung) بالتواصل مع خدمة العملاء.'
        ]
      }
    ]
  },
  order_terms: {
    id: 'order_terms',
    key: 'order_terms',
    titleAr: 'شروط الشراء والطلبات',
    titleDe: 'Bestell- und Einkaufsbedingungen',
    version: '1.0',
    updatedAt: '2026-08-25',
    isActive: true,
    sections: [
      {
        heading: '1. تسجيل الحساب وإتمام الطلب',
        content: 'يمكن تصفح المتجر وإضافة المنتجات إلى السلة بحرية. ولكن لإتمام الطلب وحفظ عنوان التوصيل وتتبع حالة التسليم، يلزم تسجيل الدخول أو إنشاء حساب موثق.',
        points: [
          'الموافقة على الشروط والأحكام وسياسة الخصوصية إلزامية عند إنشاء الحساب.',
          'يجب التأكد من صحة رقم الهاتف لتسهيل تواصل مندوب التوصيل عند الوصول.'
        ]
      },
      {
        heading: '2. الحد الأدنى للطلب',
        content: 'يحدد المتجر حداً أدنى للطلب حسب المنطقة الجغرافية [يتم تحديده وتعديله من لوحة الإدارة]. تظهر قيمة الحد الأدنى بوضوح في سلة المشتريات قبل إتمام الطلب.',
        points: [
          'لا يمكن تثبيت الطلب إذا كان إجمالي المنتجات أقل من الحد الأدنى المعلن.'
        ]
      },
      {
        heading: '3. تعديل وإلغاء الطلب بعد الإرسال',
        content: 'يمكن تعديل أو إلغاء الطلب وهو في حالة "قيد المراجعة" (Received / Pending). بعد دخول الطلب مرحلة التحضير والتغليف أو خروجه للتوصيل لا يمكن إلغاؤه إلا بالتنسيق المباشر مع خدمة العملاء.',
        points: [
          'تتوفر إمكانية إضافة ملاحظات واستفسارات عن الطلب بعد استلامه عبر شاشة "طلباتي".'
        ]
      }
    ]
  },
  payment_policy: {
    id: 'payment_policy',
    key: 'payment_policy',
    titleAr: 'سياسة وطرق الدفع',
    titleDe: 'Zahlungsbedingungen',
    version: '1.0',
    updatedAt: '2026-08-25',
    isActive: true,
    sections: [
      {
        heading: '1. خيارات الدفع المتاحة',
        content: 'يوفر Barakamarkt24 خيارات دفع مرنة وآمنة تلائم جميع الزبائن:',
        points: [
          'الدفع نقداً عند الاستلام (Barzahlung bei Lieferung): التسليم للمندوب عند باب المنزل.',
          'التحويل البنكي المباشر (Banküberweisung / SEPA): تحويل المبلغ لحساب المتجر البنكي مع كتابة رقم الطلب في سبب التحويل (Verwendungszweck).',
          'الدفع عبر البطاقات البنكية والإلكترونية (Card / Online Payment) [يتم تدقيق مزودي الخدمة النهائيين قبل الإطلاق].'
        ]
      },
      {
        heading: '2. شفافية الفواتير والأسعار',
        content: 'يحصل العميل على فاتورة إلكترونية مفصلة ومحدثة تتضمن أسعار المنتجات، نسبة الضرائب القانونية، ورسوم التوصيل والخصومات إن وجدت.',
        points: [
          'لا توجد أي رسوم خفية أو إضافية غير موضحة في ملخص الفاتورة النهائي.'
        ]
      }
    ]
  },
  delivery_policy: {
    id: 'delivery_policy',
    key: 'delivery_policy',
    titleAr: 'سياسة التوصيل والشحن',
    titleDe: 'Lieferbedingungen',
    version: '1.0',
    updatedAt: '2026-08-25',
    isActive: true,
    sections: [
      {
        heading: '1. مناطق ونطاق التوصيل',
        content: 'يقدم متجر Barakamarkt24 خدمة التوصيل المباشر في مدينة غرايفسفالد والمدن والبلدات المجاورة عبر أسطول وسائقي المتجر المعتمدين، بالإضافة لإمكانية الشحن للمناطق الأخرى [يتم تحديد الشروط النهائية لكل رمز بريدي قبل الإطلاق].',
        points: [
          'يتم التحقق تلقائياً من نطاق التغطية وإمكانية التوصيل بناءً على الرمز البريدي (PLZ).'
        ]
      },
      {
        heading: '2. رسوم التوصيل والتوصيل المجاني',
        content: 'تُطبق رسوم توصيل رمزية على الطلبات العادية، ويحصل العميل على توصيل مجاني تلقائياً عند تجاوز سلة المشتريات حد التوصيل المجاني المحدد في إعدادات المتجر.',
        points: [
          'يتم توضيح رسوم التوصيل بدقة في السلة قبل تأكيد الطلب.'
        ]
      },
      {
        heading: '3. الحفاظ على سلامة المواد الغذائية والتبريد',
        content: 'نحرص على نقل وتوصيل المنتجات الغذائية والمبردة (الأجبان، الألبان، والمنتجات الطازجة) في ظروف حفظ صحية ملائمة لضمان وصولها بأعلى معايير الجودة والسلامة.',
        points: [
          'يرجى التأكد من التواجد في العنوان المحدد أثناء نافذة التوصيل لاستلام المنتجات الطازجة فوراً.'
        ]
      }
    ]
  },
  refund_policy: {
    id: 'refund_policy',
    key: 'refund_policy',
    titleAr: 'سياسة الإلغاء والاسترجاع وحق الانسحاب',
    titleDe: 'Widerrufsbelehrung & Rückgaberecht',
    version: '1.0',
    updatedAt: '2026-08-25',
    isActive: true,
    sections: [
      {
        heading: '1. حق الانسحاب القانوني (Widerrufsrecht)',
        content: 'يحق للمستهلك في ألمانيا الانسحاب من عقد الشراء وفقاً للقوانين السارية، مع مراعاة الاستثناءات الخاصة بالمواد الغذائية سريعة التلف.',
        points: [
          'السلع غير القابلة للتلف (مثل الأواني، المعلبات غير المفتوحة) يمكن استرجاعها وفقاً للمدة القانونية المحددة بعد استلامها.',
          'السلع الغذائية الطازجة المبردة أو السريعة التلف أو المنتجات المفتوحة بعد الاستلام تُستثنى من حق الانسحاب وفقاً للبند § 312g Abs. 2 Nr. 2 BGB لحماية الصحة والسلامة العامة.'
        ]
      },
      {
        heading: '2. معالجة المنتجات التالفة أو غير المطابقة',
        content: 'في حال وصول أي منتج تالف أو منتهي الصلاحية أو غير مطابق للطلب، نضمن حق الزبون الكامل في استبداله أو استرداد قيمته فوراً.',
        points: [
          'يمكن للعميل فتح ملاحظة أو شكوى مباشرة على الطلب من شاشة "طلباتي".',
          'تقوم إدارة المتجر بمراجعة الطلب والرد خلال ساعات والتعويض المناسب.'
        ]
      }
    ]
  },
  contact_info: {
    id: 'contact_info',
    key: 'contact_info',
    titleAr: 'معلومات التواصل وخدمة العملاء',
    titleDe: 'Kontakt & Kundenservice',
    version: '1.0',
    updatedAt: '2026-08-25',
    isActive: true,
    sections: [
      {
        heading: '1. قنوات الدعم وخدمة العملاء',
        content: 'فريق خدمة عملاء Barakamarkt24 جاهز دائماً لمساعدتكم والإجابة على أي استفسارات تخص المنتجات والطلبات والتوصيل:',
        points: [
          'البريد الإلكتروني للدعم: support@barakamarkt24.de',
          'هاتف وواتساب الدعم السريع: +49 176 12345678',
          'أوقات عمل خدمة العملاء: من الإثنين إلى السبت (09:00 - 20:00)'
        ]
      },
      {
        heading: '2. العنوان والموقع',
        content: '[يتم اعتماد وتأكيد عنوان المستودع والمقر التجاري الرسمي في ألمانيا قبل الإطلاق النهائي].',
        points: [
          'المدينة الرئيسية لخدمة التوصيل المباشر: Greifswald (17489, 17491, 17493) وضواحيها.'
        ]
      }
    ]
  }
};

class LegalService {
  // 1. Fetch all legal documents from Firestore doc 'settings/legal'
  async getAllLegalDocs(): Promise<LegalPoliciesState> {
    try {
      const legalRef = doc(db, 'settings', 'legal');
      const snap = await getDoc(legalRef);
      if (snap.exists()) {
        const data = snap.data();
        return {
          agb: { ...INITIAL_LEGAL_DOCS.agb, ...(data.agb || {}) },
          privacy: { ...INITIAL_LEGAL_DOCS.privacy, ...(data.privacy || {}) },
          order_terms: { ...INITIAL_LEGAL_DOCS.order_terms, ...(data.order_terms || {}) },
          payment_policy: { ...INITIAL_LEGAL_DOCS.payment_policy, ...(data.payment_policy || {}) },
          delivery_policy: { ...INITIAL_LEGAL_DOCS.delivery_policy, ...(data.delivery_policy || {}) },
          refund_policy: { ...INITIAL_LEGAL_DOCS.refund_policy, ...(data.refund_policy || {}) },
          contact_info: { ...INITIAL_LEGAL_DOCS.contact_info, ...(data.contact_info || {}) }
        };
      } else {
        // Bootstrap initial legal state to Firestore
        await setDoc(legalRef, INITIAL_LEGAL_DOCS, { merge: true });
        return { ...INITIAL_LEGAL_DOCS };
      }
    } catch (e) {
      console.warn('Error fetching legal documents from Firestore, using initial drafts:', e);
      return { ...INITIAL_LEGAL_DOCS };
    }
  }

  // 2. Fetch single document
  async getLegalDoc(key: keyof LegalPoliciesState): Promise<LegalDocument> {
    const all = await this.getAllLegalDocs();
    return all[key] || INITIAL_LEGAL_DOCS[key];
  }

  // 3. Save / Update a legal document in Firestore
  async saveLegalDoc(docKey: keyof LegalPoliciesState, updatedDoc: LegalDocument): Promise<boolean> {
    try {
      const legalRef = doc(db, 'settings', 'legal');
      const payload = {
        [docKey]: {
          ...updatedDoc,
          id: docKey,
          key: docKey,
          updatedAt: new Date().toISOString().split('T')[0]
        }
      };
      await setDoc(legalRef, payload, { merge: true });
      return true;
    } catch (e) {
      console.error('Error saving legal document to Firestore:', e);
      return false;
    }
  }

  // 4. Save entire legal policies batch
  async saveAllLegalDocs(policies: LegalPoliciesState): Promise<boolean> {
    try {
      const legalRef = doc(db, 'settings', 'legal');
      await setDoc(legalRef, policies, { merge: true });
      return true;
    } catch (e) {
      console.error('Error saving all legal policies:', e);
      return false;
    }
  }

  // 5. Realtime listener for legal policies
  subscribeToLegalDocs(callback: (policies: LegalPoliciesState) => void): () => void {
    try {
      const legalRef = doc(db, 'settings', 'legal');
      return onSnapshot(legalRef, (snap) => {
        if (snap.exists()) {
          const data = snap.data();
          const merged: LegalPoliciesState = {
            agb: { ...INITIAL_LEGAL_DOCS.agb, ...(data.agb || {}) },
            privacy: { ...INITIAL_LEGAL_DOCS.privacy, ...(data.privacy || {}) },
            order_terms: { ...INITIAL_LEGAL_DOCS.order_terms, ...(data.order_terms || {}) },
            payment_policy: { ...INITIAL_LEGAL_DOCS.payment_policy, ...(data.payment_policy || {}) },
            delivery_policy: { ...INITIAL_LEGAL_DOCS.delivery_policy, ...(data.delivery_policy || {}) },
            refund_policy: { ...INITIAL_LEGAL_DOCS.refund_policy, ...(data.refund_policy || {}) },
            contact_info: { ...INITIAL_LEGAL_DOCS.contact_info, ...(data.contact_info || {}) }
          };
          callback(merged);
        } else {
          callback({ ...INITIAL_LEGAL_DOCS });
        }
      }, (err) => {
        console.warn('Legal docs listener error:', err);
      });
    } catch (e) {
      console.warn('Could not attach snapshot listener to settings/legal:', e);
      return () => {};
    }
  }
}

export const legalService = new LegalService();
