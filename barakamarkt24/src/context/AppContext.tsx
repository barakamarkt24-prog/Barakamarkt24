import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { 
  CartItem, 
  Category, 
  Subcategory,
  Product, 
  Screen, 
  BottomNavTab, 
  User,
  Order 
} from '../types';
import { productService } from '../services/productService';
import { authService } from '../services/authService';
import { favoriteService } from '../services/favoriteService';
import { fcmService } from '../services/fcmService';
import { adminService, AppSettings, DEFAULT_SETTINGS } from '../services/adminService';

interface AppContextType {
  // Navigation
  currentScreen: Screen;
  activeTab: BottomNavTab;
  navigateTo: (screen: Screen, params?: { productId?: string; categoryId?: string; subcategoryId?: string }) => void;
  goBack: () => void;
  navigationHistory: Screen[];

  // Selected state for details
  selectedProductId: string | null;
  selectedCategoryId: string | null;
  selectedSubcategoryId: string | null;
  setSelectedCategoryId: (id: string | null) => void;
  setSelectedSubcategoryId: (id: string | null) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;

  // Products, Categories, Subcategories
  products: Product[];
  categories: Category[];
  subcategories: Subcategory[];
  isLoadingProducts: boolean;
  reloadProducts: () => Promise<void>;
  reloadCategories: () => Promise<void>;

  // Store Settings (Firebase Synchronized)
  storeSettings: AppSettings;
  reloadSettings: () => Promise<void>;
  currencySymbol: string;

  // Cart
  cart: CartItem[];
  addToCart: (product: Product, quantity?: number) => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  reorderOrder: (order: Order) => void;
  cartCount: number;
  cartTotal: number;

  // Wishlist & Favorites (Firebase Persisted)
  wishlist: Product[];
  toggleWishlist: (product: Product) => Promise<void> | void;
  addToFavorites: (product: Product) => Promise<void>;
  removeFromFavorites: (productId: string) => Promise<void>;
  isInWishlist: (productId: string) => boolean;

  // Notifications / FCM
  requestPushNotifications: () => Promise<string | null>;

  // Auth & User
  currentUser: User | null;
  isLoadingAuth: boolean;
  isAuthReady: boolean;
  login: (email: string, password: string) => Promise<User>;
  register: (name: string, email: string, phone: string, password: string, referralCode?: string) => Promise<User>;
  sendPasswordReset: (email: string) => Promise<void>;
  updateProfile: (updates: { name?: string; phone?: string; address?: string; city?: string }) => Promise<User>;
  logout: () => Promise<void>;

  // Toast
  toast: string | null;
  showToast: (message: string) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const STORAGE_KEY_CART = 'baraka_cart_v1';
const STORAGE_KEY_WISHLIST = 'baraka_wishlist_v1';

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Navigation
  const [currentScreen, setCurrentScreen] = useState<Screen>('home');
  const [activeTab, setActiveTab] = useState<BottomNavTab>('home');
  const [navigationHistory, setNavigationHistory] = useState<Screen[]>(['home']);

  // Filters & selection
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [selectedSubcategoryId, setSelectedSubcategoryId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Data
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [subcategories, setSubcategories] = useState<Subcategory[]>([]);
  const [storeSettings, setStoreSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [isLoadingProducts, setIsLoadingProducts] = useState<boolean>(true);
  const [isLoadingAuth, setIsLoadingAuth] = useState<boolean>(true);
  const [isAuthReady, setIsAuthReady] = useState<boolean>(false);

  // Cart & Wishlist
  const [cart, setCart] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_CART);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [wishlist, setWishlist] = useState<Product[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_WISHLIST);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // User
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  // Toast
  const [toast, setToast] = useState<string | null>(null);

  // Initialize data and real-time subscription
  const reloadSettings = async () => {
    try {
      const s = await adminService.getSettings();
      setStoreSettings(s);
    } catch (e) {
      console.warn('Error reloading settings:', e);
    }
  };

  const loadAllData = async () => {
    setIsLoadingProducts(true);
    setIsLoadingAuth(true);

    // 1. Wait for Firebase auth session restore to finish
    const user = await authService.waitForAuthReady();
    setCurrentUser(user);
    setIsLoadingAuth(false);
    setIsAuthReady(true);

    // 2. Fetch products, categories, and store settings
    const [prods, cats, subs, settings] = await Promise.all([
      productService.getProducts({ includeHidden: user?.role === 'admin' }),
      productService.getCategories(user?.role === 'admin'),
      productService.getSubcategories(undefined, user?.role === 'admin'),
      adminService.getSettings()
    ]);
    setProducts(prods);
    setCategories(cats);
    setSubcategories(subs);
    if (settings) {
      setStoreSettings(settings);
    }
    setIsLoadingProducts(false);
  };

  const currentScreenRef = useRef<Screen>(currentScreen);
  const currentUserRef = useRef<User | null>(currentUser);

  useEffect(() => {
    currentScreenRef.current = currentScreen;
  }, [currentScreen]);

  useEffect(() => {
    loadAllData();

    // Subscribe to auth state changes from Firebase
    const unsubAuth = authService.onUserChanged((user) => {
      const prevUser = currentUserRef.current;
      currentUserRef.current = user;
      setCurrentUser(user);
      setIsLoadingAuth(false);
      setIsAuthReady(true);

      // Handle real-time role changes when an admin modifies user role
      if (prevUser && user && prevUser.id === user.id) {
        if (prevUser.role === 'driver' && user.role !== 'driver') {
          if (currentScreenRef.current === 'driver') {
            navigateTo('home');
            showToast('تم تحديث دور حسابك إلى عميل');
          }
        } else if (prevUser.role !== 'driver' && user.role === 'driver') {
          if (currentScreenRef.current === 'auth' || currentScreenRef.current === 'profile') {
            navigateTo('driver');
            showToast('تم ترقية حسابك إلى سائق توصيل 🚚');
          }
        }
      }
    });

    // Subscribe to real-time changes from Firestore for products & categories
    const unsubscribeProds = productService.subscribe(async () => {
      const activeUser = authService.getCurrentUser();
      const [prods, cats, subs] = await Promise.all([
        productService.getProducts({ includeHidden: activeUser?.role === 'admin' }),
        productService.getCategories(activeUser?.role === 'admin'),
        productService.getSubcategories(undefined, activeUser?.role === 'admin')
      ]);
      setProducts(prods);
      setCategories(cats);
      setSubcategories(subs);
    });

    // Subscribe to real-time store settings updates from Firestore
    const unsubscribeSettings = adminService.subscribeToSettings((liveSettings) => {
      setStoreSettings(liveSettings);
    });

    return () => {
      unsubAuth();
      unsubscribeProds();
      unsubscribeSettings();
    };
  }, []);

  // Sync Wishlist with Firebase for Authenticated Users
  useEffect(() => {
    if (currentUser?.id && products.length > 0) {
      favoriteService.getUserFavoriteProductIds(currentUser.id).then((remoteProductIds) => {
        if (remoteProductIds && remoteProductIds.length > 0) {
          const idSet = new Set(remoteProductIds);
          // Only show existing, active products from Firebase
          const activeFavorites = products.filter(p => 
            (idSet.has(p.id) || idSet.has(p.productId || '')) && p.isAvailable !== false
          );
          setWishlist(activeFavorites);
        } else {
          setWishlist([]);
        }
      }).catch(err => {
        console.warn('Error fetching favorites for user:', err);
      });
    } else if (!currentUser?.id) {
      setWishlist([]);
      try {
        localStorage.removeItem(STORAGE_KEY_WISHLIST);
      } catch (e) {
        console.error(e);
      }
    }
  }, [currentUser?.id, products]);

  // Save Cart
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_CART, JSON.stringify(cart));
    } catch (e) {
      console.error(e);
    }
  }, [cart]);

  // Synchronize cart item prices and details when products list updates
  useEffect(() => {
    if (products.length > 0 && cart.length > 0) {
      setCart(prevCart => {
        let changed = false;
        const updatedCart = prevCart.map(item => {
          const fresh = products.find(p => p.id === item.product.id || p.productId === item.product.id);
          if (fresh && (
            fresh.price !== item.product.price ||
            fresh.nameAr !== item.product.nameAr ||
            fresh.name !== item.product.name ||
            fresh.image !== item.product.image ||
            fresh.isAvailable !== item.product.isAvailable
          )) {
            changed = true;
            return {
              ...item,
              product: fresh
            };
          }
          return item;
        });
        return changed ? updatedCart : prevCart;
      });
    }
  }, [products]);

  // Save Wishlist
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_WISHLIST, JSON.stringify(wishlist));
    } catch (e) {
      console.error(e);
    }
  }, [wishlist]);

  const reloadProducts = async () => {
    setIsLoadingProducts(true);
    const [prods, cats, subs] = await Promise.all([
      productService.getProducts(),
      productService.getCategories(currentUser?.role === 'admin'),
      productService.getSubcategories(undefined, currentUser?.role === 'admin')
    ]);
    setProducts(prods);
    setCategories(cats);
    setSubcategories(subs);
    setIsLoadingProducts(false);
  };

  const reloadCategories = async () => {
    const [cats, subs] = await Promise.all([
      productService.getCategories(currentUser?.role === 'admin'),
      productService.getSubcategories(undefined, currentUser?.role === 'admin')
    ]);
    setCategories(cats);
    setSubcategories(subs);
  };

  const showToast = (message: string) => {
    setToast(message);
    setTimeout(() => {
      setToast(null);
    }, 2400);
  };

  const navigateTo = (screen: Screen, params?: { productId?: string; categoryId?: string; subcategoryId?: string }) => {
    if (params?.productId) {
      setSelectedProductId(params.productId);
    }
    if (params?.categoryId !== undefined) {
      setSelectedCategoryId(params.categoryId);
    }
    if (params?.subcategoryId !== undefined) {
      setSelectedSubcategoryId(params.subcategoryId);
    }

    // Sync active bottom tab if the screen matches a bottom tab
    if (['home', 'categories', 'cart', 'orders', 'profile'].includes(screen)) {
      setActiveTab(screen as BottomNavTab);
    }

    setNavigationHistory(prev => [...prev, screen]);
    setCurrentScreen(screen);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const goBack = () => {
    if (navigationHistory.length > 1) {
      const newHistory = [...navigationHistory];
      newHistory.pop(); // remove current
      const prevScreen = newHistory[newHistory.length - 1];
      setNavigationHistory(newHistory);
      setCurrentScreen(prevScreen);
      if (['home', 'categories', 'cart', 'orders', 'profile'].includes(prevScreen)) {
        setActiveTab(prevScreen as BottomNavTab);
      }
    } else {
      setCurrentScreen('home');
      setActiveTab('home');
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Cart operations
  const getProductStock = (product: Product) => {
    if (product.stock !== undefined && product.stock !== null) return product.stock;
    if (product.stockCount !== undefined && product.stockCount !== null) return product.stockCount;
    return 999;
  };

  const addToCart = (product: Product, quantity = 1) => {
    const maxStock = getProductStock(product);
    if (maxStock <= 0 || product.isAvailable === false || product.inStock === false) {
      showToast(`عذراً، المنتج "${product.nameAr || product.name}" غير متوفر في المخزن حالياً`);
      return;
    }

    setCart(prev => {
      const existingIndex = prev.findIndex(item => item.product.id === product.id);
      if (existingIndex > -1) {
        const currentQty = prev[existingIndex].quantity;
        const newQty = Math.min(maxStock, currentQty + quantity);
        if (currentQty >= maxStock) {
          showToast(`لقد بلغت الحد الأقصى للمخزون المتوفر (${maxStock} ${product.unit || 'قطع'})`);
          return prev;
        }
        const updated = [...prev];
        updated[existingIndex].quantity = newQty;
        showToast(`تم تحديث كمية "${product.nameAr || product.name}" إلى ${newQty}`);
        return updated;
      }
      const initialQty = Math.min(maxStock, quantity);
      showToast(`تمت إضافة "${product.nameAr || product.name}" إلى السلة`);
      return [...prev, { product, quantity: initialQty }];
    });
  };

  const removeFromCart = (productId: string) => {
    setCart(prev => prev.filter(item => item.product.id !== productId));
    showToast('تم حذف المنتج من السلة');
  };

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }
    setCart(prev => prev.map(item => {
      if (item.product.id === productId) {
        const maxStock = getProductStock(item.product);
        if (quantity > maxStock) {
          showToast(`الحد الأقصى للمخزون المتوفر هو ${maxStock} ${item.product.unit || 'قطع'}`);
          return { ...item, quantity: maxStock };
        }
        return { ...item, quantity };
      }
      return item;
    }));
  };

  const clearCart = () => {
    setCart([]);
  };

  const cartCount = cart.reduce((total, item) => total + item.quantity, 0);
  const cartTotal = cart.reduce((total, item) => total + (item.product.price * item.quantity), 0);

  // Reorder previous order items with fresh Firestore product data
  const reorderOrder = (order: Order) => {
    if (!order || !order.items || order.items.length === 0) {
      showToast('لا توجد منتجات في هذا الطلب لإعادة طلبها');
      return;
    }

    let addedCount = 0;
    const skippedNames: string[] = [];

    setCart(prevCart => {
      let updatedCart = [...prevCart];

      for (const item of order.items) {
        const pId = item.product?.id || item.product?.productId || (item as any).productId;
        // Fetch current live product data from Firestore
        const freshProduct = products.find(p => p.id === pId || p.productId === pId);

        const rawStock = freshProduct
          ? (freshProduct.stock !== undefined && freshProduct.stock !== null
              ? freshProduct.stock
              : (freshProduct.stockCount !== undefined && freshProduct.stockCount !== null ? freshProduct.stockCount : 100))
          : 0;

        const isAvailable = freshProduct && freshProduct.isAvailable !== false && freshProduct.inStock !== false && rawStock > 0;

        if (!freshProduct || !isAvailable) {
          const name = item.product?.nameAr || item.product?.name || (item as any).productNameAr || 'منتج غير متاح';
          if (!skippedNames.includes(name)) {
            skippedNames.push(name);
          }
          continue;
        }

        const qtyToAdd = Math.min(rawStock, Math.max(1, item.quantity));
        const existingIdx = updatedCart.findIndex(ci => ci.product.id === freshProduct.id);

        if (existingIdx > -1) {
          const currentQty = updatedCart[existingIdx].quantity;
          const newQty = Math.min(rawStock, currentQty + qtyToAdd);
          updatedCart[existingIdx] = {
            ...updatedCart[existingIdx],
            product: freshProduct, // Current price and stock from Firestore
            quantity: newQty
          };
        } else {
          updatedCart.push({
            product: freshProduct, // Current price and stock from Firestore
            quantity: qtyToAdd
          });
        }
        addedCount++;
      }

      return updatedCart;
    });

    if (addedCount > 0 && skippedNames.length === 0) {
      showToast(`تمت إضافة جميع منتجات الطلب (${addedCount}) إلى السلة بالأسعار الحالية`);
      navigateTo('cart');
    } else if (addedCount > 0 && skippedNames.length > 0) {
      showToast(`تمت إضافة ${addedCount} منتجات للسلة، وتم تخطي (${skippedNames.slice(0, 2).join('، ')}) لعدم توفرها`);
      navigateTo('cart');
    } else {
      showToast(`تعذر إعادة الطلب: الأصناف المطلوبة (${skippedNames.slice(0, 2).join('، ')}) غير متوفرة حالياً`);
    }
  };

  // Wishlist & Favorites Firebase Operations
  const addToFavorites = async (product: Product) => {
    if (!currentUser?.id) {
      showToast('يرجى تسجيل الدخول لحفظ المنتجات في المفضلة');
      navigateTo('auth');
      return;
    }

    setWishlist(prev => {
      if (prev.some(p => p.id === product.id)) return prev;
      return [...prev, product];
    });

    try {
      await favoriteService.addFavorite(currentUser.id, product.id);
    } catch (err) {
      console.warn('Failed to save favorite in Firebase:', err);
    }
    showToast('تمت الإضافة إلى المفضلة');
  };

  const removeFromFavorites = async (productId: string) => {
    setWishlist(prev => prev.filter(p => p.id !== productId));

    if (currentUser?.id) {
      try {
        await favoriteService.removeFavorite(currentUser.id, productId);
      } catch (err) {
        console.warn('Failed to remove favorite in Firebase:', err);
      }
    }
    showToast('تمت الإزالة من المفضلة');
  };

  const toggleWishlist = async (product: Product) => {
    if (!currentUser?.id) {
      showToast('يرجى تسجيل الدخول لحفظ المنتجات في المفضلة');
      navigateTo('auth');
      return;
    }

    const exists = wishlist.some(p => p.id === product.id);
    if (exists) {
      await removeFromFavorites(product.id);
    } else {
      await addToFavorites(product);
    }
  };

  const isInWishlist = (productId: string) => {
    return wishlist.some(p => p.id === productId);
  };

  // Push Notifications (FCM Readiness)
  const requestPushNotifications = async () => {
    const token = await fcmService.requestPermissionAndGetToken(undefined, currentUser?.id);
    if (token) {
      showToast('تم تفعيل الإشعارات بنجاح');
    }
    return token;
  };

  // Auth operations
  const login = async (email: string, password: string) => {
    const user = await authService.login(email, password);
    setCurrentUser(user);
    showToast(`مرحباً بك، ${user.name}`);
    await reloadCategories();
    return user;
  };

  const register = async (name: string, email: string, phone: string, password: string, referralCode?: string) => {
    const user = await authService.register(name, email, phone, password, referralCode);
    setCurrentUser(user);
    showToast(`تم إنشاء حسابك بنجاح`);
    await reloadCategories();
    return user;
  };

  const sendPasswordReset = async (email: string) => {
    await authService.sendPasswordReset(email);
    showToast('تم إرسال رابط استعادة كلمة المرور لبريدك الإلكتروني');
  };

  const updateProfile = async (updates: { name?: string; phone?: string; address?: string; city?: string }) => {
    const updated = await authService.updateProfile(updates);
    setCurrentUser(updated);
    showToast('تم تحديث بياناتك بنجاح');
    return updated;
  };

  const logout = async () => {
    await authService.logout();
    setCurrentUser(null);
    if (currentScreen === 'admin' || currentScreen === 'driver') {
      navigateTo('home');
    }
    showToast('تم تسجيل الخروج بنجاح');
    await reloadCategories();
    await reloadProducts();
  };

  return (
    <AppContext.Provider
      value={{
        currentScreen,
        activeTab,
        navigateTo,
        goBack,
        navigationHistory,
        selectedProductId,
        selectedCategoryId,
        selectedSubcategoryId,
        setSelectedCategoryId,
        setSelectedSubcategoryId,
        searchQuery,
        setSearchQuery,
        products,
        categories,
        subcategories,
        isLoadingProducts,
        isLoadingAuth,
        isAuthReady,
        reloadProducts,
        reloadCategories,
        storeSettings,
        reloadSettings,
        currencySymbol: storeSettings.currency || '€',
        cart,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        reorderOrder,
        cartCount,
        cartTotal,
        wishlist,
        toggleWishlist,
        addToFavorites,
        removeFromFavorites,
        isInWishlist,
        requestPushNotifications,
        currentUser,
        login,
        register,
        sendPasswordReset,
        updateProfile,
        logout,
        toast,
        showToast
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
