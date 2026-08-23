export type Screen = 
  | 'home'
  | 'categories'
  | 'products'
  | 'product-detail'
  | 'cart'
  | 'auth'
  | 'profile'
  | 'orders'
  | 'wishlist'
  | 'admin';

export type BottomNavTab = 'home' | 'categories' | 'cart' | 'orders' | 'profile';

export type CategoryId =
  | 'dairy-cheese'
  | 'olives-pickles'
  | 'rice-grains'
  | 'oils-sauces'
  | 'spices-seasonings'
  | 'canned-preserved'
  | 'coffee-tea-drinks'
  | 'bread-pastries'
  | 'sweets-biscuits'
  | 'honey-jams-oriental'
  | 'cleaning-soaps'
  | 'personal-care'
  | 'baby-infant'
  | 'home-kitchen';

export interface Category {
  id: string;
  categoryId?: string; // alias/normalized
  name?: string; // name
  nameAr: string;
  nameEn?: string;
  nameDe?: string;
  description?: string;
  descriptionAr?: string;
  descriptionEn?: string;
  image: string;
  icon?: string;
  isActive?: boolean;
  sortOrder?: number;
  createdAt?: string;
  updatedAt?: string;
  itemCount?: number;
  featured?: boolean;
}

export interface Subcategory {
  id: string;
  subcategoryId?: string; // alias/normalized
  categoryId: string;
  name?: string;
  nameAr: string;
  nameEn?: string;
  nameDe?: string;
  image?: string;
  isActive?: boolean;
  sortOrder?: number;
  createdAt?: string;
  updatedAt?: string;
  order?: number;
}

export interface NutritionFact {
  calories: number;
  protein: string;
  fat: string;
  carbs: string;
}

export interface Review {
  id: string;
  author: string;
  rating: number;
  comment: string;
  date: string;
  city?: string;
  verified: boolean;
}

export interface Product {
  id: string;
  productId?: string;
  name?: string;
  nameAr: string;
  nameEn?: string;
  nameDe?: string;
  description?: string;
  descriptionAr: string;
  descriptionEn?: string;
  descriptionDe?: string;
  price: number;
  oldPrice?: number;
  originalPrice?: number;
  discount?: number;
  categoryId: CategoryId | string;
  subcategoryId?: string;
  subCategory?: string;
  images?: string[];
  image: string;
  stock?: number;
  stockCount: number;
  unit: string;
  weight?: string;
  isAvailable?: boolean;
  inStock: boolean;
  isFeatured?: boolean;
  isBestseller?: boolean;
  isHalal?: boolean;
  isOrganic?: boolean;
  isColdShipping?: boolean;
  origin: string; // e.g. "حلب", "دمشق", "حماة", "عفرين", "درعا"
  brand: string;
  rating: number;
  reviewsCount: number;
  badge?: string;
  createdAt?: string;
  updatedAt?: string;
  ingredientsAr?: string;
  storageAr?: string;
  nutrition?: NutritionFact;
  reviews?: Review[];
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: 'customer' | 'admin';
  address?: string;
  city?: string;
  postalCode?: string;
  avatar?: string;
  referralCode?: string;
  referredBy?: string;
  createdAt?: string;
}

export type PaymentMethod = 'cash_on_delivery' | 'cod' | 'card' | 'paypal' | 'klarna' | 'bank_transfer' | 'apple_pay';

export type PaymentStatus = 'pending' | 'paid' | 'awaiting_transfer' | 'failed' | 'refunded';

export interface CustomerOrderInfo {
  fullName: string;
  phone: string;
  email: string;
  country: string;
  city: string;
  street: string;
  postalCode: string;
  notes?: string;
}

export type OrderStatus = 
  | 'pending'
  | 'confirmed'
  | 'preparing'
  | 'out_for_delivery'
  | 'delivered'
  | 'cancelled';

export interface Order {
  id: string;
  orderId?: string;
  userId?: string;
  customerName?: string;
  phone: string;
  address: string;
  city?: string;
  items: CartItem[];
  subtotal: number;
  deliveryFee?: number;
  shippingFee?: number;
  discount: number;
  total: number;
  status: OrderStatus;
  createdAt: string;
  updatedAt?: string;
  timestamp?: string;
  notes?: string;
  customerInfo?: CustomerOrderInfo;
  paymentMethod?: PaymentMethod | string;
  paymentStatus?: PaymentStatus | string;
  deliveryDateEstimated?: string;
  coldShippingIncluded?: boolean;
}

export interface OrderItem {
  id: string;
  orderId: string;
  productId: string;
  productNameAr: string;
  price: number;
  quantity: number;
  image?: string;
  total: number;
}

export interface Address {
  id: string;
  userId: string;
  titleAr: string;
  fullName: string;
  phone: string;
  country: string;
  city: string;
  street: string;
  postalCode: string;
  isDefault: boolean;
}

export interface Favorite {
  id: string;
  userId: string;
  productId: string;
  createdAt: string;
}

export interface Coupon {
  id: string;
  code: string;
  discountPercent?: number;
  discountAmount?: number;
  minSpend: number;
  validUntil: string;
  isActive: boolean;
  descriptionAr: string;
}

export interface Offer {
  id: string;
  titleAr: string;
  subtitleAr: string;
  image: string;
  discountTag: string;
  active: boolean;
  linkCategoryId?: string;
  linkProductId?: string;
}

export interface AppNotification {
  id: string;
  userId: string;
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
  type: 'order' | 'promo' | 'system';
}

export interface Referral {
  id: string;
  referrerUserId: string;
  referredUserId?: string;
  code: string;
  bonusApplied: boolean;
  status: 'pending' | 'completed';
  createdAt: string;
}

export type SortOption = 'featured' | 'price-asc' | 'price-desc' | 'rating' | 'newest';

export type Currency = 'EUR' | 'USD' | 'AED' | 'SAR';

export interface CurrencyConfig {
  code: Currency;
  symbol: string;
  rate: number;
  nameAr: string;
  nameEn: string;
}

export type Language = 'ar' | 'en' | 'de';

export interface SyrianRecipeKit {
  id: string;
  titleAr: string;
  titleEn: string;
  titleDe: string;
  descriptionAr: string;
  serves: number;
  cookTime: string;
  image: string;
  cityOrigin: string;
  productIds: string[];
}
