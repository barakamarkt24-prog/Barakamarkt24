export interface ProductTranslationResult {
  nameDe: string;
  nameEn: string;
  nameUk: string;
  nameFa: string;
  descriptionDe: string;
  descriptionEn: string;
  descriptionUk: string;
  descriptionFa: string;
}

export interface AnnouncementTranslationResult {
  textDe: string;
  textEn: string;
  textUk: string;
  textFa: string;
}

/**
 * Sends a single API request to translate the Arabic product name and description
 * into German, English, Ukrainian, and Persian.
 */
export async function translateProductContent(
  nameAr: string,
  descriptionAr?: string
): Promise<ProductTranslationResult> {
  if (!nameAr || !nameAr.trim()) {
    throw new Error('يرجى إدخال اسم المنتج بالعربية أولاً');
  }

  const response = await fetch('/api/translate-product', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      nameAr: nameAr.trim(),
      descriptionAr: descriptionAr ? descriptionAr.trim() : '',
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || 'تعذر الحصول على الترجمة التلقائية');
  }

  const data = await response.json();
  return {
    nameDe: data.nameDe || '',
    nameEn: data.nameEn || '',
    nameUk: data.nameUk || '',
    nameFa: data.nameFa || '',
    descriptionDe: data.descriptionDe || '',
    descriptionEn: data.descriptionEn || '',
    descriptionUk: data.descriptionUk || '',
    descriptionFa: data.descriptionFa || '',
  };
}

/**
 * Sends a single API request to translate the Arabic announcement text
 * into German, English, Ukrainian, and Persian.
 */
export async function translateAnnouncementContent(
  textAr: string
): Promise<AnnouncementTranslationResult> {
  if (!textAr || !textAr.trim()) {
    throw new Error('يرجى إدخال نص الإعلان بالعربية أولاً');
  }

  const response = await fetch('/api/translate-announcement', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      textAr: textAr.trim(),
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || 'تعذر الحصول على الترجمة التلقائية للإعلان');
  }

  const data = await response.json();
  return {
    textDe: data.textDe || '',
    textEn: data.textEn || '',
    textUk: data.textUk || '',
    textFa: data.textFa || '',
  };
}


