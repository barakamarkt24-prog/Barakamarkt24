import { Product, Category, Subcategory } from '../types';

/**
 * Normalizes Arabic text by:
 * - Removing diacritics / Tashkeel (فتحة، ضمة، كسرة، تنوين، شدة، سكون)
 * - Removing Tatweel / Kashida (ـ)
 * - Normalizing Alef forms (أ، إ، آ، ٱ -> ا)
 * - Normalizing Taa Marbouta / Haa (ة -> ه)
 * - Normalizing Yaa / Alef Maksura (ى -> ي)
 * - Normalizing Hamza forms (ؤ، ئ -> ء)
 * - Normalizing Arabic-Indic digits (٠-٩ -> 0-9)
 */
export function normalizeArabic(text: string): string {
  if (!text) return '';
  return text
    // Remove diacritics / Tashkeel
    .replace(/[\u064B-\u065F\u0670]/g, '')
    // Remove Tatweel / Kashida
    .replace(/\u0640/g, '')
    // Normalize Alefs
    .replace(/[أإآٱ]/g, 'ا')
    // Normalize Taa Marbouta & Haa to 'ه' for uniform matching (جبنة == جبنه)
    .replace(/ة/g, 'ه')
    // Normalize Alef Maksura to Yaa (شورى == شوري)
    .replace(/ى/g, 'ي')
    // Normalize Hamzas
    .replace(/[ؤئ]/g, 'ء')
    // Normalize Arabic numerals
    .replace(/[٠-٩]/g, (d) => '٠١٢٣٤٥٦٧٨٩'.indexOf(d).toString());
}

/**
 * Normalizes Latin text (German / English):
 * - Lowercase
 * - Normalize Unicode accents/diacritics (ä->a, ö->o, ü->u, é->e, etc.)
 * - Expand German ß to ss
 */
export function normalizeLatin(text: string): string {
  if (!text) return '';
  let normalized = text.toLowerCase();
  // Replace German Eszett
  normalized = normalized.replace(/ß/g, 'ss');
  // Normalize umlauts/accents (e.g. ä -> a, ö -> o, ü -> u, é -> e)
  normalized = normalized.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  return normalized;
}

/**
 * Universal text normalization for search comparison:
 * Combines Arabic and Latin normalization and cleans punctuation.
 */
export function normalizeSearchText(text: string): string {
  if (!text) return '';
  let res = normalizeArabic(text);
  res = normalizeLatin(res);
  // Replace punctuation, symbols, brackets, slashes with spaces
  res = res.replace(/[.,/#!$%^&*;:{}=\-_`~()?"'«»[\]\\]/g, ' ');
  // Collapse whitespace
  res = res.replace(/\s+/g, ' ').trim();
  return res;
}

/**
 * Calculates Levenshtein edit distance between two strings.
 */
export function levenshteinDistance(a: string, b: string): number {
  if (a === b) return 0;
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;

  const matrix: number[][] = [];

  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          matrix[i][j - 1] + 1,     // insertion
          matrix[i - 1][j] + 1      // deletion
        );
      }
    }
  }

  return matrix[b.length][a.length];
}

/**
 * Calculates similarity ratio between two tokens [0..1].
 */
export function tokenSimilarity(token1: string, token2: string): number {
  if (token1 === token2) return 1;
  const maxLen = Math.max(token1.length, token2.length);
  if (maxLen === 0) return 1;
  const distance = levenshteinDistance(token1, token2);
  return 1 - distance / maxLen;
}

export interface SearchResult {
  product: Product;
  score: number;
  matchedFields: string[];
  isFuzzyMatch?: boolean;
}

export interface SearchOptions {
  categories?: Category[];
  subcategories?: Subcategory[];
  includeUnavailable?: boolean;
  minScore?: number;
  limit?: number;
}

/**
 * High-performance, intelligent multi-language search engine:
 * Supports Arabic, German, and English with:
 * 1. Exact & prefix matching
 * 2. Multi-word tokenization and partial token matching
 * 3. Arabic normalization (Tashkeel, Alef, Taa Marbouta, Yaa)
 * 4. German umlauts & Latin accent normalization
 * 5. Typo tolerance / Fuzzy matching via Levenshtein distance
 * 6. Relevance ranking (highest score first)
 */
export function searchProducts(
  products: Product[],
  query: string,
  options: SearchOptions = {}
): SearchResult[] {
  const rawQuery = query ? query.trim() : '';
  if (!rawQuery) return [];

  const {
    categories = [],
    subcategories = [],
    includeUnavailable = false,
    minScore = 15,
    limit = 50
  } = options;

  const normalizedQuery = normalizeSearchText(rawQuery);
  if (!normalizedQuery) return [];

  const queryTokens = normalizedQuery.split(' ').filter(t => t.length > 0);

  // Map category IDs to normalized names for fast lookup
  const categoryMap = new Map<string, { ar: string; en: string; de: string }>();
  for (const cat of categories) {
    categoryMap.set(cat.id, {
      ar: normalizeSearchText(cat.nameAr || cat.name || ''),
      en: normalizeSearchText(cat.nameEn || ''),
      de: normalizeSearchText(cat.nameDe || '')
    });
  }

  // Map subcategory IDs to normalized names
  const subcategoryMap = new Map<string, { ar: string; en: string; de: string }>();
  for (const sub of subcategories) {
    subcategoryMap.set(sub.id, {
      ar: normalizeSearchText(sub.nameAr || sub.name || ''),
      en: normalizeSearchText(sub.nameEn || ''),
      de: normalizeSearchText(sub.nameDe || '')
    });
  }

  const results: SearchResult[] = [];

  for (const product of products) {
    // Check product availability
    const rawStock = product.stock !== undefined && product.stock !== null 
      ? product.stock 
      : (product.stockCount !== undefined && product.stockCount !== null ? product.stockCount : 100);

    const isAvailable = product.isAvailable !== false && product.inStock !== false && rawStock > 0;
    if (!includeUnavailable && !isAvailable) {
      continue;
    }

    // Normalized searchable fields
    const nameArNorm = normalizeSearchText(product.nameAr || product.name || '');
    const nameEnNorm = normalizeSearchText(product.nameEn || '');
    const nameDeNorm = normalizeSearchText(product.nameDe || '');
    const descArNorm = normalizeSearchText(product.descriptionAr || product.description || '');
    const descEnNorm = normalizeSearchText(product.descriptionEn || '');
    const descDeNorm = normalizeSearchText(product.descriptionDe || '');
    const brandNorm = normalizeSearchText(product.brand || '');
    const originNorm = normalizeSearchText(product.origin || '');
    const ingredientsNorm = normalizeSearchText(product.ingredientsAr || '');

    // Category / Subcategory text
    const catInfo = categoryMap.get(product.categoryId as string);
    const subcatInfo = product.subcategoryId ? subcategoryMap.get(product.subcategoryId) : undefined;
    const catArNorm = catInfo?.ar || '';
    const catEnNorm = catInfo?.en || '';
    const catDeNorm = catInfo?.de || '';
    const subcatArNorm = subcatInfo?.ar || normalizeSearchText(product.subCategory || '');

    const titleFields = [nameArNorm, nameDeNorm, nameEnNorm].filter(Boolean);
    const descFields = [descArNorm, descDeNorm, descEnNorm, ingredientsNorm].filter(Boolean);
    const metaFields = [brandNorm, originNorm, catArNorm, catEnNorm, catDeNorm, subcatArNorm].filter(Boolean);

    let score = 0;
    const matchedFields: string[] = [];
    let isFuzzy = false;

    // -------------------------------------------------------------
    // Tier 1: Exact Match on Full Product Title (Any Language)
    // -------------------------------------------------------------
    for (const title of titleFields) {
      if (title === normalizedQuery) {
        score += 1000;
        matchedFields.push('title_exact');
        break;
      }
      if (title.startsWith(normalizedQuery)) {
        score += 500;
        matchedFields.push('title_prefix');
        break;
      }
      if (title.includes(normalizedQuery)) {
        score += 300;
        matchedFields.push('title_substring');
        break;
      }
    }

    // -------------------------------------------------------------
    // Tier 2: Multi-Token Matching (for multi-word search e.g. "جبنة حلوم")
    // -------------------------------------------------------------
    const allTitleTokens = titleFields.flatMap(t => t.split(' ')).filter(Boolean);
    const allDescTokens = descFields.flatMap(d => d.split(' ')).filter(Boolean);
    const allMetaTokens = metaFields.flatMap(m => m.split(' ')).filter(Boolean);

    let matchedTokenCount = 0;
    let titleTokenHits = 0;

    for (const qToken of queryTokens) {
      if (qToken.length === 0) continue;

      let tokenHit = false;

      // 1. Check title tokens
      for (const tToken of allTitleTokens) {
        if (tToken === qToken) {
          score += 120;
          titleTokenHits++;
          tokenHit = true;
          break;
        } else if (tToken.startsWith(qToken) || tToken.endsWith(qToken)) {
          score += 80;
          titleTokenHits++;
          tokenHit = true;
          break;
        } else if (tToken.includes(qToken)) {
          score += 50;
          titleTokenHits++;
          tokenHit = true;
          break;
        }
      }

      // 2. Check metadata (brand, category, origin)
      if (!tokenHit) {
        for (const mToken of allMetaTokens) {
          if (mToken === qToken || mToken.includes(qToken)) {
            score += 45;
            matchedFields.push('metadata');
            tokenHit = true;
            break;
          }
        }
      }

      // 3. Check description
      if (!tokenHit) {
        for (const dToken of allDescTokens) {
          if (dToken === qToken || dToken.includes(qToken)) {
            score += 30;
            matchedFields.push('description');
            tokenHit = true;
            break;
          }
        }
      }

      // 4. Fuzzy / Typo tolerance check for this token
      if (!tokenHit && qToken.length >= 3) {
        let bestSimilarity = 0;

        // Check against title words
        for (const tToken of allTitleTokens) {
          if (tToken.length >= 3) {
            const maxAllowedDist = qToken.length <= 4 ? 1 : 2;
            const dist = levenshteinDistance(qToken, tToken);
            if (dist <= maxAllowedDist) {
              const sim = tokenSimilarity(qToken, tToken);
              if (sim > bestSimilarity) {
                bestSimilarity = sim;
              }
            }
          }
        }

        // Check against brand/category
        if (bestSimilarity === 0) {
          for (const mToken of allMetaTokens) {
            if (mToken.length >= 3) {
              const maxAllowedDist = qToken.length <= 4 ? 1 : 2;
              const dist = levenshteinDistance(qToken, mToken);
              if (dist <= maxAllowedDist) {
                const sim = tokenSimilarity(qToken, mToken);
                if (sim > bestSimilarity) {
                  bestSimilarity = sim * 0.8;
                }
              }
            }
          }
        }

        if (bestSimilarity >= 0.65) {
          score += Math.round(bestSimilarity * 40);
          matchedFields.push('fuzzy');
          isFuzzy = true;
          tokenHit = true;
        }
      }

      if (tokenHit) {
        matchedTokenCount++;
      }
    }

    // Multi-token bonus if all query words matched
    if (queryTokens.length > 1 && matchedTokenCount === queryTokens.length) {
      score += 150;
      if (titleTokenHits === queryTokens.length) {
        score += 100;
      }
    }

    // -------------------------------------------------------------
    // Tier 3: Quality & Merchandising Boosts
    // -------------------------------------------------------------
    if (score > 0) {
      if (product.isFeatured) score += 8;
      if (product.isBestseller) score += 6;
      if (product.discount && product.discount > 0) score += 4;
      if (product.rating && product.rating >= 4.5) score += 3;
    }

    if (score >= minScore) {
      results.push({
        product,
        score,
        matchedFields: Array.from(new Set(matchedFields)),
        isFuzzyMatch: isFuzzy && score < 100
      });
    }
  }

  // Sort strictly by score descending
  results.sort((a, b) => b.score - a.score);

  return results.slice(0, limit);
}

/**
 * Returns popular quick search suggestion keywords in Arabic & English
 */
export const POPULAR_SEARCH_SUGGESTIONS = [
  { label: 'جبنة بلدية', query: 'جبنة' },
  { label: 'زيت زيتون بكر', query: 'زيت زيتون' },
  { label: 'مكدوس بلدي', query: 'مكدوس' },
  { label: 'زعتر حلبي', query: 'زعتر' },
  { label: 'فريكة شامية', query: 'فريكة' },
  { label: 'حلاوة وطحينة', query: 'حلاوة' },
  { label: 'Schafskäse', query: 'schaf' },
  { label: 'Olivenöl', query: 'oliven' }
];
