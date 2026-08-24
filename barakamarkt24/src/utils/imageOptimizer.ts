export const FALLBACK_PRODUCT_IMAGE = 'https://images.unsplash.com/photo-1552767059-ce182ead6c1b?auto=format&fit=crop&w=600&q=80';
export const FALLBACK_CATEGORY_IMAGE = 'https://images.unsplash.com/photo-1552767059-ce182ead6c1b?auto=format&fit=crop&w=600&q=80';

export function getOptimizedImageUrl(url?: string, width: number = 400): string {
  if (!url) return FALLBACK_PRODUCT_IMAGE;
  if (url.includes('unsplash.com')) {
    const base = url.split('?')[0];
    return `${base}?auto=format&fit=crop&w=${width}&q=80`;
  }
  return url;
}
