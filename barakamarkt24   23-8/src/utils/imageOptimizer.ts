/**
 * Image Optimization & Compression Utilities for BarakaMarkt24
 */

export const FALLBACK_PRODUCT_IMAGE = 'https://images.unsplash.com/photo-1552767059-ce182ead6c1b?auto=format&fit=crop&w=500&q=75';
export const FALLBACK_CATEGORY_IMAGE = 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=400&q=75';
export const FALLBACK_BANNER_IMAGE = 'https://images.unsplash.com/photo-1506617564039-2f3b650b7010?auto=format&fit=crop&w=800&q=75';

interface OptimizeImageOptions {
  width?: number;
  height?: number;
  quality?: number;
  format?: 'webp' | 'auto';
  fit?: 'crop' | 'cover' | 'fill';
}

/**
 * Optimizes image URLs by injecting responsive size, format and compression parameters
 * Especially optimized for Unsplash and Cloud CDN stored assets.
 */
export function getOptimizedImageUrl(
  url?: string | null, 
  options: OptimizeImageOptions = { width: 400, quality: 75 }
): string {
  if (!url || !url.trim()) {
    return FALLBACK_PRODUCT_IMAGE;
  }

  const cleanUrl = url.trim();

  // If it's a data URI or blob, return as is
  if (cleanUrl.startsWith('data:') || cleanUrl.startsWith('blob:')) {
    return cleanUrl;
  }

  // Optimize Unsplash images with specific compression and sizing
  if (cleanUrl.includes('images.unsplash.com')) {
    try {
      const urlObj = new URL(cleanUrl);
      if (options.width) urlObj.searchParams.set('w', options.width.toString());
      if (options.height) urlObj.searchParams.set('h', options.height.toString());
      urlObj.searchParams.set('q', (options.quality || 75).toString());
      urlObj.searchParams.set('auto', options.format || 'format');
      urlObj.searchParams.set('fit', options.fit || 'crop');
      return urlObj.toString();
    } catch {
      return cleanUrl;
    }
  }

  return cleanUrl;
}
