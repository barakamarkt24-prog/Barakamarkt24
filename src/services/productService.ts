import { 
  getDocs, 
  getDoc, 
  doc, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  writeBatch,
  query,
  where,
  orderBy,
  onSnapshot
} from 'firebase/firestore';
import { 
  ref, 
  uploadBytes, 
  getDownloadURL 
} from 'firebase/storage';
import { 
  db, 
  storage, 
  collections, 
  auth,
  handleFirestoreError, 
  OperationType 
} from './firebaseConfig';
import { Category, Product, Subcategory } from '../types';
import { CATEGORIES } from '../data/categories';
import { INITIAL_SUBCATEGORIES } from '../data/subcategories';

// Helper to prevent Firestore calls from hanging indefinitely
const fetchWithTimeout = async <T>(promise: Promise<T>, timeoutMs = 3500): Promise<T> => {
  let timer: any;
  const timeoutPromise = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error('Firestore operation timeout')), timeoutMs);
  });
  try {
    return await Promise.race([promise, timeoutPromise]);
  } finally {
    clearTimeout(timer);
  }
};

// Helper to strip undefined values so Firestore setDoc/updateDoc never rejects
export function cleanFirestorePayload<T = any>(obj: any): T {
  if (obj === null || obj === undefined) return obj;
  if (Array.isArray(obj)) {
    return obj.map(item => cleanFirestorePayload(item)) as any;
  }
  if (typeof obj === 'object' && !(obj instanceof Date)) {
    const cleaned: Record<string, any> = {};
    for (const [key, value] of Object.entries(obj)) {
      if (value !== undefined) {
        cleaned[key] = cleanFirestorePayload(value);
      }
    }
    return cleaned as T;
  }
  return obj;
}

type ListenerCallback = () => void;

const CACHE_KEYS = {
  PRODUCTS: 'bm_cache_products',
  CATEGORIES: 'bm_cache_categories',
  SUBCATEGORIES: 'bm_cache_subcategories',
  TIMESTAMP: 'bm_cache_timestamp'
};

const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes cache validity

class ProductService {
  private productsCache: Product[] = [];
  private categoriesCache: Category[] = [];
  private subcategoriesCache: Subcategory[] = [];
  private initialized: boolean = false;
  private initializingPromise: Promise<void> | null = null;
  private listeners: Set<ListenerCallback> = new Set();
  private unsubscribers: (() => void)[] = [];
  private lastSyncTime: number = 0;

  constructor() {
    // 1. Try loading cached real data from localStorage for instant startup
    this.loadFromLocalStorage();

    // 2. Fallback only for initial category structure if empty
    if (this.categoriesCache.length === 0) {
      this.categoriesCache = CATEGORIES.map(c => this.normalizeCategory(c));
    }
    if (this.subcategoriesCache.length === 0) {
      this.subcategoriesCache = INITIAL_SUBCATEGORIES.map(s => this.normalizeSubcategory(s));
    }

    this.init();
  }

  private loadFromLocalStorage(): void {
    if (typeof window === 'undefined') return;
    try {
      const storedProds = localStorage.getItem(CACHE_KEYS.PRODUCTS);
      const storedCats = localStorage.getItem(CACHE_KEYS.CATEGORIES);
      const storedSubs = localStorage.getItem(CACHE_KEYS.SUBCATEGORIES);
      const storedTime = localStorage.getItem(CACHE_KEYS.TIMESTAMP);

      if (storedProds) {
        const parsed = JSON.parse(storedProds);
        if (Array.isArray(parsed) && parsed.length > 0) {
          this.productsCache = parsed.map(p => this.normalizeProduct(p));
        }
      }
      if (storedCats) {
        const parsed = JSON.parse(storedCats);
        if (Array.isArray(parsed) && parsed.length > 0) {
          this.categoriesCache = parsed.map(c => this.normalizeCategory(c));
        }
      }
      if (storedSubs) {
        const parsed = JSON.parse(storedSubs);
        if (Array.isArray(parsed) && parsed.length > 0) {
          this.subcategoriesCache = parsed.map(s => this.normalizeSubcategory(s));
        }
      }
      if (storedTime) {
        this.lastSyncTime = parseInt(storedTime, 10) || 0;
      }
    } catch (e) {
      console.warn('Could not load local storage cache for products:', e);
    }
  }

  private saveToLocalStorage(): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(CACHE_KEYS.PRODUCTS, JSON.stringify(this.productsCache));
      localStorage.setItem(CACHE_KEYS.CATEGORIES, JSON.stringify(this.categoriesCache));
      localStorage.setItem(CACHE_KEYS.SUBCATEGORIES, JSON.stringify(this.subcategoriesCache));
      localStorage.setItem(CACHE_KEYS.TIMESTAMP, Date.now().toString());
      this.lastSyncTime = Date.now();
    } catch (e) {
      console.warn('Could not save product cache to localStorage:', e);
    }
  }

  // Subscribe to live data changes across the app
  public subscribe(callback: ListenerCallback): () => void {
    this.listeners.add(callback);
    return () => {
      this.listeners.delete(callback);
    };
  }

  private notifyListeners(): void {
    this.saveToLocalStorage();
    this.listeners.forEach(cb => {
      try {
        cb();
      } catch (err) {
        console.error('Error in ProductService listener callback:', err);
      }
    });
  }

  public normalizeCategory(data: any): Category {
    const id = data.id || data.categoryId || `cat-${Date.now()}`;
    return {
      ...data,
      id,
      categoryId: data.categoryId || id,
      name: data.name || data.nameAr || '',
      nameAr: data.nameAr || data.name || '',
      nameEn: data.nameEn || '',
      nameDe: data.nameDe || '',
      description: data.description || data.descriptionAr || '',
      descriptionAr: data.descriptionAr || data.description || '',
      image: data.image || 'https://images.unsplash.com/photo-1552767059-ce182ead6c1b?auto=format&fit=crop&w=600&q=80',
      isActive: data.isActive !== undefined ? Boolean(data.isActive) : true,
      sortOrder: data.sortOrder !== undefined ? Number(data.sortOrder) : 0,
      createdAt: data.createdAt || new Date().toISOString(),
      updatedAt: data.updatedAt || new Date().toISOString()
    };
  }

  public normalizeSubcategory(data: any): Subcategory {
    const id = data.id || data.subcategoryId || `sub-${Date.now()}`;
    return {
      ...data,
      id,
      subcategoryId: data.subcategoryId || id,
      categoryId: data.categoryId || '',
      name: data.name || data.nameAr || '',
      nameAr: data.nameAr || data.name || '',
      nameEn: data.nameEn || '',
      image: data.image || '',
      isActive: data.isActive !== undefined ? Boolean(data.isActive) : true,
      sortOrder: data.sortOrder !== undefined ? Number(data.sortOrder) : 0,
      createdAt: data.createdAt || new Date().toISOString(),
      updatedAt: data.updatedAt || new Date().toISOString()
    };
  }

  public normalizeProduct(data: any): Product {
    const id = data.id || data.productId || `prod-${Date.now()}`;
    const name = data.name || data.nameAr || '';
    const nameAr = data.nameAr || data.name || '';
    const description = data.description || data.descriptionAr || '';
    const descriptionAr = data.descriptionAr || data.description || '';
    const price = typeof data.price === 'number' ? data.price : parseFloat(data.price || '0');
    const oldPrice = data.oldPrice !== undefined && data.oldPrice !== null && data.oldPrice !== '' 
      ? Number(data.oldPrice) 
      : (data.originalPrice ? Number(data.originalPrice) : undefined);
    
    // Compute discount %
    let discount = data.discount !== undefined ? Number(data.discount) : undefined;
    if (discount === undefined && oldPrice && oldPrice > price) {
      discount = Math.round(((oldPrice - price) / oldPrice) * 100);
    }

    const stock = data.stock !== undefined ? Number(data.stock) : (data.stockCount !== undefined ? Number(data.stockCount) : 25);
    const isAvailable = data.isAvailable !== undefined ? Boolean(data.isAvailable) : (data.inStock !== false);
    const isFeatured = Boolean(data.isFeatured || data.featured);
    const unit = data.unit || 'قطعة';

    // Handle images array & primary image
    let images: string[] = [];
    if (Array.isArray(data.images) && data.images.length > 0) {
      images = data.images.filter(Boolean);
    } else if (data.image) {
      images = [data.image];
    } else {
      images = ['https://images.unsplash.com/photo-1552767059-ce182ead6c1b?auto=format&fit=crop&w=600&q=80'];
    }
    const primaryImage = images[0] || 'https://images.unsplash.com/photo-1552767059-ce182ead6c1b?auto=format&fit=crop&w=600&q=80';

    return {
      ...data,
      id,
      productId: id,
      name,
      nameAr,
      nameEn: data.nameEn || '',
      nameDe: data.nameDe || '',
      description,
      descriptionAr,
      descriptionEn: data.descriptionEn || '',
      descriptionDe: data.descriptionDe || '',
      price,
      oldPrice,
      originalPrice: oldPrice,
      discount,
      categoryId: data.categoryId || 'dairy-cheese',
      subcategoryId: data.subcategoryId || data.subCategory || undefined,
      subCategory: data.subCategory || data.subcategoryId || undefined,
      images,
      image: primaryImage,
      stock,
      stockCount: stock,
      unit,
      weight: data.weight || '500g',
      isAvailable,
      inStock: isAvailable && stock > 0,
      isFeatured,
      isBestseller: Boolean(data.isBestseller),
      isHalal: data.isHalal !== undefined ? Boolean(data.isHalal) : true,
      isOrganic: Boolean(data.isOrganic),
      isColdShipping: Boolean(data.isColdShipping),
      origin: data.origin || 'حلب',
      brand: data.brand || 'بركة ماركت',
      rating: typeof data.rating === 'number' ? data.rating : 4.9,
      reviewsCount: typeof data.reviewsCount === 'number' ? data.reviewsCount : 12,
      badge: data.badge || (isFeatured ? 'مميز' : undefined),
      createdAt: data.createdAt || new Date().toISOString(),
      updatedAt: data.updatedAt || new Date().toISOString(),
      ingredientsAr: data.ingredientsAr || '',
      storageAr: data.storageAr || ''
    };
  }

  public async init(): Promise<void> {
    if (this.initialized) return;
    if (this.initializingPromise) return this.initializingPromise;

    this.initializingPromise = (async () => {
      try {
        await this.syncFromFirestore();
        this.setupRealtimeListeners();
      } catch (err) {
        console.warn('Initial Firestore sync used fallback cache:', err);
      } finally {
        this.initialized = true;
      }
    })();

    return this.initializingPromise;
  }

  // Setup Real-time Firestore Listeners for Instant Live Updates
  private setupRealtimeListeners(): void {
    try {
      // 1. Products live listener (syncs creations, updates, and deletions immediately)
      const unsubProducts = onSnapshot(collections.products, (snapshot) => {
        this.productsCache = snapshot.docs.map(d => this.normalizeProduct({ ...d.data(), id: d.id }));
        this.notifyListeners();
      }, (err) => {
        console.warn('Live products listener error:', err.message);
      });
      this.unsubscribers.push(unsubProducts);

      // 2. Categories live listener
      const unsubCategories = onSnapshot(collections.categories, (snapshot) => {
        if (!snapshot.empty) {
          this.categoriesCache = snapshot.docs.map(d => this.normalizeCategory({ ...d.data(), id: d.id }));
          this.notifyListeners();
        }
      }, (err) => {
        console.warn('Live categories listener notice:', err.message);
      });
      this.unsubscribers.push(unsubCategories);

      // 3. Subcategories live listener
      const unsubSubcategories = onSnapshot(collections.subcategories, (snapshot) => {
        if (!snapshot.empty) {
          this.subcategoriesCache = snapshot.docs.map(d => this.normalizeSubcategory({ ...d.data(), id: d.id }));
          this.notifyListeners();
        }
      }, (err) => {
        console.warn('Live subcategories listener notice:', err.message);
      });
      this.unsubscribers.push(unsubSubcategories);

    } catch (e) {
      console.warn('Could not attach Firestore onSnapshot listeners:', e);
    }
  }

  // Pull latest data from Cloud Firestore (guarded by TTL and online status)
  public async syncFromFirestore(force: boolean = false): Promise<void> {
    const isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;
    if (!isOnline && !force) {
      return; // Offline mode: keep local cache
    }

    const now = Date.now();
    if (!force && this.lastSyncTime > 0 && (now - this.lastSyncTime) < CACHE_TTL_MS && this.productsCache.length > 0) {
      // Cache is fresh
      return;
    }

    try {
      // 1. Fetch categories
      try {
        const catSnapshot = await fetchWithTimeout(getDocs(collections.categories), 3000);
        if (catSnapshot && !catSnapshot.empty) {
          this.categoriesCache = catSnapshot.docs.map(d => this.normalizeCategory({ ...d.data(), id: d.id }));
        }
      } catch (err) {
        console.warn('Categories fetch notice:', err);
      }

      // 2. Fetch subcategories
      try {
        const subSnapshot = await fetchWithTimeout(getDocs(collections.subcategories), 2500);
        if (subSnapshot && !subSnapshot.empty) {
          this.subcategoriesCache = subSnapshot.docs.map(d => this.normalizeSubcategory({ ...d.data(), id: d.id }));
        }
      } catch (err) {
        // keep cache
      }

      // 3. Fetch products from Firestore
      try {
        const prodSnapshot = await fetchWithTimeout(getDocs(collections.products), 3000);
        if (prodSnapshot) {
          this.productsCache = prodSnapshot.docs.map(d => this.normalizeProduct({ ...d.data(), id: d.id }));
        }
      } catch (err) {
        console.warn('Products fetch notice:', err);
      }

      this.lastSyncTime = Date.now();
      this.notifyListeners();
    } catch (error) {
      console.warn('Cloud Firestore sync notice:', error);
    }
  }

  public async forceRefresh(): Promise<void> {
    await this.syncFromFirestore(true);
  }

  // Seed default categories into Firestore
  public async seedCategoriesToFirestore(): Promise<void> {
    const batch = writeBatch(db);
    for (const cat of CATEGORIES) {
      const docRef = doc(collections.categories, cat.id);
      batch.set(docRef, this.normalizeCategory(cat));
    }
    await batch.commit();
    this.categoriesCache = CATEGORIES.map(c => this.normalizeCategory(c));
    this.notifyListeners();
  }

  // Seed default subcategories into Firestore
  public async seedSubcategoriesToFirestore(): Promise<void> {
    const batch = writeBatch(db);
    for (const sub of INITIAL_SUBCATEGORIES) {
      const docRef = doc(collections.subcategories, sub.id);
      batch.set(docRef, this.normalizeSubcategory(sub));
    }
    await batch.commit();
    this.subcategoriesCache = INITIAL_SUBCATEGORIES.map(s => this.normalizeSubcategory(s));
    this.notifyListeners();
  }

  // Sync or reload products strictly from Firestore
  public async seedProductsToFirestore(): Promise<void> {
    await this.syncFromFirestore(true);
  }

  // ==========================================
  // --- Category Operations (Dynamic CRUD) ---
  // ==========================================

  async getCategories(includeInactive: boolean = false): Promise<Category[]> {
    await this.init();

    let result = [...this.categoriesCache];
    if (!includeInactive) {
      result = result.filter(c => c.isActive !== false);
    }

    // Sort by sortOrder then name
    result.sort((a, b) => {
      const orderA = a.sortOrder !== undefined ? a.sortOrder : 999;
      const orderB = b.sortOrder !== undefined ? b.sortOrder : 999;
      if (orderA !== orderB) return orderA - orderB;
      return (a.nameAr || a.name || '').localeCompare(b.nameAr || b.name || '', 'ar');
    });

    return result;
  }

  async getCategoryById(id: string): Promise<Category | null> {
    await this.init();
    try {
      const docRef = doc(collections.categories, id);
      const docSnap = await fetchWithTimeout(getDoc(docRef), 2000);
      if (docSnap && docSnap.exists()) {
        return this.normalizeCategory({ ...docSnap.data(), id: docSnap.id });
      }
    } catch (e) {
      // Fallback
    }
    const local = this.categoriesCache.find(c => c.id === id || c.categoryId === id);
    return local ? { ...local } : null;
  }

  async addCategory(newCategory: {
    name: string;
    nameAr?: string;
    nameEn?: string;
    description?: string;
    descriptionAr?: string;
    image: string;
    isActive?: boolean;
    sortOrder?: number;
  }): Promise<Category> {
    const id = `cat-${Date.now()}`;
    const now = new Date().toISOString();
    const category: Category = this.normalizeCategory({
      ...newCategory,
      id,
      categoryId: id,
      name: newCategory.name,
      nameAr: newCategory.nameAr || newCategory.name,
      createdAt: now,
      updatedAt: now
    });

    const firestoreData = cleanFirestorePayload(category);

    try {
      const docRef = doc(collections.categories, id);
      await setDoc(docRef, firestoreData);
    } catch (e) {
      handleFirestoreError(e, OperationType.CREATE, `categories/${id}`);
      throw new Error(`فشل حفظ القسم في قاعدة البيانات: ${(e as any)?.message || 'خطأ غير معروف'}`);
    }

    this.categoriesCache.push(category);
    this.notifyListeners();
    return category;
  }

  async updateCategory(id: string, updates: Partial<Category>): Promise<Category | null> {
    const now = new Date().toISOString();
    const cleanUpdates: any = {
      ...updates,
      updatedAt: now
    };

    if (cleanUpdates.name && !cleanUpdates.nameAr) cleanUpdates.nameAr = cleanUpdates.name;
    if (cleanUpdates.nameAr && !cleanUpdates.name) cleanUpdates.name = cleanUpdates.nameAr;
    if (cleanUpdates.description && !cleanUpdates.descriptionAr) cleanUpdates.descriptionAr = cleanUpdates.description;
    if (cleanUpdates.descriptionAr && !cleanUpdates.description) cleanUpdates.description = cleanUpdates.descriptionAr;
    if (cleanUpdates.sortOrder !== undefined) cleanUpdates.sortOrder = Number(cleanUpdates.sortOrder);

    const firestoreData = cleanFirestorePayload(cleanUpdates);

    try {
      const docRef = doc(collections.categories, id);
      await setDoc(docRef, firestoreData, { merge: true });
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, `categories/${id}`);
      throw new Error(`فشل تحديث القسم في قاعدة البيانات: ${(e as any)?.message || 'خطأ غير معروف'}`);
    }

    const index = this.categoriesCache.findIndex(c => c.id === id || c.categoryId === id);
    if (index !== -1) {
      this.categoriesCache[index] = this.normalizeCategory({
        ...this.categoriesCache[index],
        ...cleanUpdates
      });
      this.notifyListeners();
      return { ...this.categoriesCache[index] };
    }
    return null;
  }

  async deleteCategory(id: string): Promise<boolean> {
    try {
      const docRef = doc(collections.categories, id);
      await deleteDoc(docRef);
    } catch (e) {
      handleFirestoreError(e, OperationType.DELETE, `categories/${id}`);
      throw new Error(`فشل حذف القسم: ${(e as any)?.message || 'خطأ غير معروف'}`);
    }

    this.categoriesCache = this.categoriesCache.filter(c => c.id !== id && c.categoryId !== id);
    this.subcategoriesCache = this.subcategoriesCache.filter(s => s.categoryId !== id);
    this.notifyListeners();
    return true;
  }

  async toggleCategoryActive(id: string): Promise<boolean> {
    const cat = this.categoriesCache.find(c => c.id === id || c.categoryId === id);
    if (!cat) return false;

    const newActive = !cat.isActive;
    return !!(await this.updateCategory(id, { isActive: newActive }));
  }

  async updateCategorySortOrder(id: string, newSortOrder: number): Promise<boolean> {
    return !!(await this.updateCategory(id, { sortOrder: newSortOrder }));
  }

  // =============================================
  // --- Subcategory Operations (Dynamic CRUD) ---
  // =============================================

  async getSubcategories(categoryId?: string, includeInactive: boolean = false): Promise<Subcategory[]> {
    await this.init();

    let result = [...this.subcategoriesCache];
    if (categoryId && categoryId !== 'all') {
      result = result.filter(s => s.categoryId === categoryId);
    }

    if (!includeInactive) {
      result = result.filter(s => s.isActive !== false);
    }

    // Sort by sortOrder then name
    result.sort((a, b) => {
      const orderA = a.sortOrder !== undefined ? a.sortOrder : (a.order || 999);
      const orderB = b.sortOrder !== undefined ? b.sortOrder : (b.order || 999);
      if (orderA !== orderB) return orderA - orderB;
      return (a.nameAr || a.name || '').localeCompare(b.nameAr || b.name || '', 'ar');
    });

    return result;
  }

  async addSubcategory(newSub: {
    categoryId: string;
    name: string;
    nameAr?: string;
    nameEn?: string;
    image?: string;
    isActive?: boolean;
    sortOrder?: number;
  }): Promise<Subcategory> {
    if (!newSub.categoryId || !newSub.categoryId.trim()) {
      throw new Error('القسم الرئيسي مطلوب لإنشاء قسم فرعي');
    }
    if (!newSub.name || !newSub.name.trim()) {
      throw new Error('اسم القسم الفرعي مطلوب');
    }

    const id = `sub-${Date.now()}`;
    const now = new Date().toISOString();
    const subcategory: Subcategory = this.normalizeSubcategory({
      ...newSub,
      id,
      subcategoryId: id,
      name: newSub.name.trim(),
      nameAr: (newSub.nameAr || newSub.name).trim(),
      createdAt: now,
      updatedAt: now
    });

    const firestoreData = cleanFirestorePayload(subcategory);

    try {
      const docRef = doc(collections.subcategories, id);
      await setDoc(docRef, firestoreData);
    } catch (e) {
      handleFirestoreError(e, OperationType.CREATE, `subcategories/${id}`);
      throw new Error(`فشل إضافة القسم الفرعي في Firebase: ${(e as any)?.message || 'خطأ غير معروف'}`);
    }

    this.subcategoriesCache.push(subcategory);
    this.notifyListeners();
    return subcategory;
  }

  async updateSubcategory(id: string, updates: Partial<Subcategory>): Promise<Subcategory | null> {
    const now = new Date().toISOString();
    const cleanUpdates: any = {
      ...updates,
      updatedAt: now
    };

    if (cleanUpdates.name && !cleanUpdates.nameAr) cleanUpdates.nameAr = cleanUpdates.name;
    if (cleanUpdates.nameAr && !cleanUpdates.name) cleanUpdates.name = cleanUpdates.nameAr;

    const firestoreData = cleanFirestorePayload(cleanUpdates);

    try {
      const docRef = doc(collections.subcategories, id);
      await setDoc(docRef, firestoreData, { merge: true });
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, `subcategories/${id}`);
      throw new Error(`فشل تحديث القسم الفرعي في Firebase: ${(e as any)?.message || 'خطأ غير معروف'}`);
    }

    const index = this.subcategoriesCache.findIndex(s => s.id === id || s.subcategoryId === id);
    if (index !== -1) {
      this.subcategoriesCache[index] = this.normalizeSubcategory({
        ...this.subcategoriesCache[index],
        ...cleanUpdates
      });
      this.notifyListeners();
      return { ...this.subcategoriesCache[index] };
    }
    return null;
  }

  async deleteSubcategory(id: string): Promise<boolean> {
    try {
      const docRef = doc(collections.subcategories, id);
      await deleteDoc(docRef);
    } catch (e) {
      handleFirestoreError(e, OperationType.DELETE, `subcategories/${id}`);
      throw new Error(`فشل حذف القسم الفرعي: ${(e as any)?.message || 'خطأ غير معروف'}`);
    }

    this.subcategoriesCache = this.subcategoriesCache.filter(s => s.id !== id && s.subcategoryId !== id);
    this.notifyListeners();
    return true;
  }

  async toggleSubcategoryActive(id: string): Promise<boolean> {
    const sub = this.subcategoriesCache.find(s => s.id === id || s.subcategoryId === id);
    if (!sub) return false;

    const newActive = !sub.isActive;
    return !!(await this.updateSubcategory(id, { isActive: newActive }));
  }

  async updateSubcategorySortOrder(id: string, newSortOrder: number): Promise<boolean> {
    return !!(await this.updateSubcategory(id, { sortOrder: newSortOrder }));
  }

  // ==========================================
  // --- Product Operations (Cloud Firestore) -
  // ==========================================

  async getProducts(filter?: {
    categoryId?: string;
    subCategory?: string;
    subcategoryId?: string;
    searchQuery?: string;
    origin?: string;
    isFeatured?: boolean;
    isBestseller?: boolean;
    inStockOnly?: boolean;
    includeHidden?: boolean;
  }): Promise<Product[]> {
    await this.init();

    let result = [...this.productsCache];

    // Filter hidden products for regular user browsing unless explicitly includeHidden = true
    if (!filter?.includeHidden) {
      result = result.filter(p => p.isAvailable !== false);
    }

    if (filter?.categoryId && filter.categoryId !== 'all') {
      result = result.filter(p => p.categoryId === filter.categoryId);
    }

    if (filter?.subcategoryId && filter.subcategoryId !== 'all') {
      const targetSub = filter.subcategoryId.toLowerCase().trim();
      result = result.filter(p => {
        if (p.subcategoryId && p.subcategoryId.toLowerCase() === targetSub) return true;
        if (p.subCategory && p.subCategory.toLowerCase().includes(targetSub)) return true;
        return false;
      });
    } else if (filter?.subCategory && filter.subCategory !== 'all') {
      const subName = filter.subCategory.toLowerCase().trim();
      result = result.filter(p => {
        if (!p.subCategory && !p.subcategoryId) return false;
        const pSub = (p.subCategory || p.subcategoryId || '').toLowerCase();
        return pSub.includes(subName) || subName.includes(pSub);
      });
    }

    if (filter?.searchQuery && filter.searchQuery.trim()) {
      const q = filter.searchQuery.toLowerCase().trim();
      result = result.filter(p => 
        (p.name && p.name.toLowerCase().includes(q)) ||
        (p.nameAr && p.nameAr.toLowerCase().includes(q)) ||
        (p.description && p.description.toLowerCase().includes(q)) ||
        (p.descriptionAr && p.descriptionAr.toLowerCase().includes(q)) ||
        (p.brand && p.brand.toLowerCase().includes(q)) ||
        (p.origin && p.origin.toLowerCase().includes(q)) ||
        (p.nameEn && p.nameEn.toLowerCase().includes(q))
      );
    }

    if (filter?.origin && filter.origin !== 'all') {
      result = result.filter(p => p.origin.includes(filter.origin!));
    }

    if (filter?.isFeatured) {
      result = result.filter(p => p.isFeatured);
    }

    if (filter?.isBestseller) {
      result = result.filter(p => p.isBestseller);
    }

    if (filter?.inStockOnly) {
      result = result.filter(p => p.inStock);
    }

    return result;
  }

  async getProductById(id: string): Promise<Product | null> {
    await this.init();
    try {
      const docRef = doc(collections.products, id);
      const docSnap = await fetchWithTimeout(getDoc(docRef), 2000);
      if (docSnap && docSnap.exists()) {
        const prod = this.normalizeProduct({ ...docSnap.data(), id: docSnap.id });
        const idx = this.productsCache.findIndex(p => p.id === id);
        if (idx !== -1) this.productsCache[idx] = prod;
        return prod;
      }
    } catch (e) {
      // Return cached
    }
    const prod = this.productsCache.find(p => p.id === id || p.productId === id);
    return prod ? { ...prod } : null;
  }

  // --- Admin Catalog Management (Direct Cloud Firestore Writes) ---

  async addProduct(newProduct: Partial<Product> & {
    name: string;
    price: number;
    categoryId: string;
  }): Promise<Product> {
    if (!newProduct.categoryId || !newProduct.categoryId.trim()) {
      throw new Error('القسم الرئيسي إلزامي لإضافة المنتج');
    }
    if (!newProduct.name || !newProduct.name.trim()) {
      throw new Error('اسم المنتج إلزامي');
    }
    const numericPrice = Number(newProduct.price);
    if (isNaN(numericPrice) || numericPrice < 0) {
      throw new Error('سعر المنتج غير صالح');
    }

    const id = newProduct.id || `prod-${Date.now()}`;
    const now = new Date().toISOString();

    const product: Product = this.normalizeProduct({
      ...newProduct,
      id,
      productId: id,
      name: newProduct.name.trim(),
      nameAr: (newProduct.nameAr || newProduct.name).trim(),
      description: (newProduct.description || newProduct.descriptionAr || '').trim(),
      descriptionAr: (newProduct.descriptionAr || newProduct.description || '').trim(),
      price: numericPrice,
      oldPrice: newProduct.oldPrice !== undefined && newProduct.oldPrice !== null && !isNaN(Number(newProduct.oldPrice)) ? Number(newProduct.oldPrice) : undefined,
      originalPrice: newProduct.oldPrice !== undefined && newProduct.oldPrice !== null && !isNaN(Number(newProduct.oldPrice)) ? Number(newProduct.oldPrice) : undefined,
      discount: newProduct.discount !== undefined && newProduct.discount !== null && !isNaN(Number(newProduct.discount)) ? Number(newProduct.discount) : undefined,
      categoryId: newProduct.categoryId.trim(),
      subcategoryId: newProduct.subcategoryId?.trim() || newProduct.subCategory?.trim() || undefined,
      subCategory: newProduct.subCategory?.trim() || newProduct.subcategoryId?.trim() || undefined,
      images: newProduct.images && newProduct.images.length > 0 ? newProduct.images : (newProduct.image ? [newProduct.image] : []),
      image: newProduct.image || (newProduct.images && newProduct.images[0]) || 'https://images.unsplash.com/photo-1552767059-ce182ead6c1b?auto=format&fit=crop&w=600&q=80',
      stock: newProduct.stock !== undefined ? Number(newProduct.stock) : 25,
      stockCount: newProduct.stock !== undefined ? Number(newProduct.stock) : 25,
      unit: newProduct.unit?.trim() || 'قطعة',
      isAvailable: newProduct.isAvailable !== undefined ? Boolean(newProduct.isAvailable) : true,
      isFeatured: Boolean(newProduct.isFeatured),
      createdAt: now,
      updatedAt: now
    });

    const firestoreData = cleanFirestorePayload(product);

    try {
      const docRef = doc(collections.products, id);
      await setDoc(docRef, firestoreData);
    } catch (e) {
      handleFirestoreError(e, OperationType.CREATE, `products/${id}`);
      throw new Error(`فشل إضافة المنتج في قاعدة البيانات: ${(e as any)?.message || 'خطأ غير معروف'}`);
    }

    const existingIndex = this.productsCache.findIndex(p => p.id === id || p.productId === id);
    if (existingIndex !== -1) {
      this.productsCache[existingIndex] = product;
    } else {
      this.productsCache.unshift(product);
    }
    this.notifyListeners();
    return product;
  }

  async updateProduct(id: string, updates: Partial<Product>): Promise<Product | null> {
    const now = new Date().toISOString();
    const cleanUpdates: any = {
      ...updates,
      updatedAt: now
    };

    if (cleanUpdates.name && !cleanUpdates.nameAr) cleanUpdates.nameAr = cleanUpdates.name;
    if (cleanUpdates.nameAr && !cleanUpdates.name) cleanUpdates.name = cleanUpdates.nameAr;
    if (cleanUpdates.description && !cleanUpdates.descriptionAr) cleanUpdates.descriptionAr = cleanUpdates.description;
    if (cleanUpdates.descriptionAr && !cleanUpdates.description) cleanUpdates.description = cleanUpdates.descriptionAr;
    if (cleanUpdates.price !== undefined) cleanUpdates.price = Number(cleanUpdates.price);
    if (cleanUpdates.oldPrice !== undefined) {
      cleanUpdates.oldPrice = (cleanUpdates.oldPrice !== null && cleanUpdates.oldPrice !== '' && !isNaN(Number(cleanUpdates.oldPrice))) ? Number(cleanUpdates.oldPrice) : undefined;
      cleanUpdates.originalPrice = cleanUpdates.oldPrice;
    }
    if (cleanUpdates.stock !== undefined) {
      cleanUpdates.stock = Number(cleanUpdates.stock);
      cleanUpdates.stockCount = Number(cleanUpdates.stock);
    }
    if (cleanUpdates.images && cleanUpdates.images.length > 0 && !cleanUpdates.image) {
      cleanUpdates.image = cleanUpdates.images[0];
    }

    const firestoreData = cleanFirestorePayload(cleanUpdates);

    try {
      const docRef = doc(collections.products, id);
      await setDoc(docRef, firestoreData, { merge: true });
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, `products/${id}`);
      throw new Error(`فشل تحديث المنتج في قاعدة البيانات: ${(e as any)?.message || 'خطأ غير معروف'}`);
    }

    const index = this.productsCache.findIndex(p => p.id === id || p.productId === id);
    if (index !== -1) {
      this.productsCache[index] = this.normalizeProduct({
        ...this.productsCache[index],
        ...cleanUpdates
      });
      this.notifyListeners();
      return { ...this.productsCache[index] };
    }
    return null;
  }

  async deleteProduct(id: string): Promise<boolean> {
    try {
      const docRef = doc(collections.products, id);
      await deleteDoc(docRef);
    } catch (e) {
      handleFirestoreError(e, OperationType.DELETE, `products/${id}`);
    }

    this.productsCache = this.productsCache.filter(p => p.id !== id && p.productId !== id);
    this.notifyListeners();
    return true;
  }

  // Toggle Visibility / Availability (Hide or Show from user)
  async toggleProductAvailability(id: string): Promise<boolean> {
    const prod = this.productsCache.find(p => p.id === id || p.productId === id);
    if (!prod) return false;

    const newAvailable = !(prod.isAvailable !== false);
    return !!(await this.updateProduct(id, { 
      isAvailable: newAvailable,
      inStock: newAvailable && (prod.stock || prod.stockCount) > 0
    }));
  }

  // Toggle Featured status
  async toggleProductFeatured(id: string): Promise<boolean> {
    const prod = this.productsCache.find(p => p.id === id || p.productId === id);
    if (!prod) return false;

    const newFeatured = !prod.isFeatured;
    return !!(await this.updateProduct(id, { 
      isFeatured: newFeatured,
      badge: newFeatured ? 'مميز' : undefined
    }));
  }

  // Toggle Stock availability (In Stock / Out of Stock)
  async toggleProductStock(id: string): Promise<boolean> {
    const prod = this.productsCache.find(p => p.id === id || p.productId === id);
    if (!prod) return false;

    const newStockState = !prod.inStock;
    return !!(await this.updateProduct(id, { 
      inStock: newStockState,
      isAvailable: newStockState,
      stock: newStockState ? Math.max(prod.stock || 10, 10) : 0,
      stockCount: newStockState ? Math.max(prod.stock || 10, 10) : 0
    }));
  }

  // Quick update price, old price & discount
  async updateProductPrice(id: string, price: number, oldPrice?: number, discount?: number): Promise<Product | null> {
    let computedDiscount = discount;
    if (computedDiscount === undefined && oldPrice && oldPrice > price) {
      computedDiscount = Math.round(((oldPrice - price) / oldPrice) * 100);
    }
    return await this.updateProduct(id, {
      price,
      oldPrice,
      originalPrice: oldPrice,
      discount: computedDiscount
    });
  }

  // Quick update stock & unit
  async updateProductStock(id: string, stock: number, unit?: string): Promise<Product | null> {
    return await this.updateProduct(id, {
      stock,
      stockCount: stock,
      inStock: stock > 0,
      unit: unit || undefined
    });
  }

  // Upload single image to Firebase Storage
  async uploadImage(file: File, folder: string = 'products'): Promise<string> {
    try {
      const filename = `${folder}/${Date.now()}_${file.name.replace(/\s+/g, '_')}`;
      const storageRef = ref(storage, filename);
      const snapshot = await uploadBytes(storageRef, file);
      const downloadUrl = await getDownloadURL(snapshot.ref);
      return downloadUrl;
    } catch (e) {
      console.error('Firebase Storage upload failed:', e);
      throw e;
    }
  }

  // Upload multiple images to Firebase Storage
  async uploadMultipleImages(files: FileList | File[], folder: string = 'products'): Promise<string[]> {
    const urls: string[] = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const url = await this.uploadImage(file, folder);
      urls.push(url);
    }
    return urls;
  }

  async resetToDefaults(): Promise<void> {
    await this.seedCategoriesToFirestore();
    await this.seedSubcategoriesToFirestore();
    await this.seedProductsToFirestore();
  }
}

export const productService = new ProductService();
