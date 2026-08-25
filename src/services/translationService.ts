export interface ProductTranslationResult {
  nameDe: string;
  nameEn: string;
  descriptionDe: string;
  descriptionEn: string;
}

/**
 * Sends a single API request to translate the Arabic product name and description
 * into German and English.
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
    descriptionDe: data.descriptionDe || '',
    descriptionEn: data.descriptionEn || '',
  };
}
