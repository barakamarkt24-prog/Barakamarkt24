import { Language, LanguageOption, Product, Category, Subcategory, AnnouncementItem } from '../types';
import { ar, TranslationSchema } from './ar';
import { de } from './de';
import { en } from './en';
import { uk } from './uk';
import { fa } from './fa';

export const LANGUAGES: LanguageOption[] = [
  { code: 'ar', name: 'العربية', dir: 'rtl', flag: '🇸🇾' },
  { code: 'de', name: 'Deutsch', dir: 'ltr', flag: '🇩🇪' },
  { code: 'en', name: 'English', dir: 'ltr', flag: '🇬🇧' },
  { code: 'uk', name: 'Українська', dir: 'ltr', flag: '🇺🇦' },
  { code: 'fa', name: 'فارسی', dir: 'rtl', flag: '🇮🇷' }
];

export const translations: Record<Language, TranslationSchema> = {
  ar,
  de,
  en,
  uk,
  fa
};

export const DEFAULT_LANGUAGE: Language = 'ar';
export const STORAGE_KEY_LANGUAGE = 'barakamarkt24_language';

export function getDirection(lang: Language): 'rtl' | 'ltr' {
  return (lang === 'ar' || lang === 'fa') ? 'rtl' : 'ltr';
}

/**
 * Nested key accessor for translation schema
 * e.g. t('home.welcome')
 */
export function translate(
  lang: Language,
  path: string,
  variables?: Record<string, string | number>
): string {
  const currentDict = translations[lang] || translations[DEFAULT_LANGUAGE];
  const keys = path.split('.');
  let result: any = currentDict;

  for (const k of keys) {
    if (result && typeof result === 'object' && k in result) {
      result = result[k];
    } else {
      // Fallback to Arabic
      let fallbackResult: any = translations[DEFAULT_LANGUAGE];
      for (const fk of keys) {
        if (fallbackResult && typeof fallbackResult === 'object' && fk in fallbackResult) {
          fallbackResult = fallbackResult[fk];
        } else {
          return path;
        }
      }
      result = fallbackResult;
      break;
    }
  }

  if (typeof result !== 'string') {
    return path;
  }

  if (variables) {
    return Object.entries(variables).reduce((str, [key, val]) => {
      return str.replace(new RegExp(`\\{${key}\\}`, 'g'), String(val));
    }, result);
  }

  return result;
}

/**
 * Returns localized name of a Product with fallback to Arabic name
 */
export function getLocalizedProductName(product: Product | null | undefined, lang: Language): string {
  if (!product) return '';

  if (lang === 'de' && product.nameDe?.trim()) return product.nameDe.trim();
  if (lang === 'en' && product.nameEn?.trim()) return product.nameEn.trim();
  if (lang === 'uk' && product.nameUk?.trim()) return product.nameUk.trim();
  if (lang === 'fa' && product.nameFa?.trim()) return product.nameFa.trim();
  if (lang === 'ar' && product.nameAr?.trim()) return product.nameAr.trim();

  // Fallbacks: nameAr -> name -> any other language
  return product.nameAr?.trim() || product.name?.trim() || product.nameEn?.trim() || product.nameDe?.trim() || '';
}

/**
 * Returns localized description of a Product with fallback
 */
export function getLocalizedProductDesc(product: Product | null | undefined, lang: Language): string {
  if (!product) return '';

  if (lang === 'de' && product.descriptionDe?.trim()) return product.descriptionDe.trim();
  if (lang === 'en' && product.descriptionEn?.trim()) return product.descriptionEn.trim();
  if (lang === 'uk' && product.descriptionUk?.trim()) return product.descriptionUk.trim();
  if (lang === 'fa' && product.descriptionFa?.trim()) return product.descriptionFa.trim();
  if (lang === 'ar' && product.descriptionAr?.trim()) return product.descriptionAr.trim();

  return product.descriptionAr?.trim() || product.description?.trim() || product.descriptionEn?.trim() || product.descriptionDe?.trim() || '';
}

export const getLocalizedProductDescription = getLocalizedProductDesc;

/**
 * Returns localized name of a Category with fallback
 */
export function getLocalizedCategoryName(category: Category | null | undefined, lang: Language): string {
  if (!category) return '';

  if (lang === 'de' && category.nameDe?.trim()) return category.nameDe.trim();
  if (lang === 'en' && category.nameEn?.trim()) return category.nameEn.trim();
  if (lang === 'uk' && category.nameUk?.trim()) return category.nameUk.trim();
  if (lang === 'fa' && category.nameFa?.trim()) return category.nameFa.trim();
  if (lang === 'ar' && category.nameAr?.trim()) return category.nameAr.trim();

  return category.nameAr?.trim() || category.name?.trim() || category.nameEn?.trim() || '';
}

/**
 * Returns localized description of a Category with fallback
 */
export function getLocalizedCategoryDescription(category: Category | null | undefined, lang: Language): string {
  if (!category) return '';

  if (lang === 'de' && category.descriptionDe?.trim()) return category.descriptionDe.trim();
  if (lang === 'en' && category.descriptionEn?.trim()) return category.descriptionEn.trim();
  if (lang === 'uk' && category.descriptionUk?.trim()) return category.descriptionUk.trim();
  if (lang === 'fa' && category.descriptionFa?.trim()) return category.descriptionFa.trim();
  if (lang === 'ar' && category.descriptionAr?.trim()) return category.descriptionAr.trim();

  return category.descriptionAr?.trim() || category.description?.trim() || category.descriptionEn?.trim() || category.descriptionDe?.trim() || '';
}

/**
 * Returns localized name of a Subcategory with fallback
 */
export function getLocalizedSubcategoryName(subcategory: Subcategory | null | undefined, lang: Language): string {
  if (!subcategory) return '';

  if (lang === 'de' && subcategory.nameDe?.trim()) return subcategory.nameDe.trim();
  if (lang === 'en' && subcategory.nameEn?.trim()) return subcategory.nameEn.trim();
  if (lang === 'uk' && subcategory.nameUk?.trim()) return subcategory.nameUk.trim();
  if (lang === 'fa' && subcategory.nameFa?.trim()) return subcategory.nameFa.trim();
  if (lang === 'ar' && subcategory.nameAr?.trim()) return subcategory.nameAr.trim();

  return subcategory.nameAr?.trim() || subcategory.name?.trim() || subcategory.nameEn?.trim() || '';
}

/**
 * Returns localized text of an AnnouncementItem with fallback:
 * lang -> ar -> legacy text -> en -> de -> ''
 */
export function getLocalizedAnnouncementText(item: AnnouncementItem | null | undefined, lang: Language): string {
  if (!item) return '';

  if (lang === 'de' && item.textDe?.trim()) return item.textDe.trim();
  if (lang === 'en' && item.textEn?.trim()) return item.textEn.trim();
  if (lang === 'uk' && item.textUk?.trim()) return item.textUk.trim();
  if (lang === 'fa' && item.textFa?.trim()) return item.textFa.trim();
  if (lang === 'ar' && item.textAr?.trim()) return item.textAr.trim();

  // Fallbacks: textAr -> legacy text -> textEn -> textDe -> any non-empty
  return item.textAr?.trim() || item.text?.trim() || item.textEn?.trim() || item.textDe?.trim() || '';
}
