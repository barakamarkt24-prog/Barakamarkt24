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
  | 'driver'
  | 'admin'
  | 'legal';

export type BottomNavTab = 'home' | 'categories' | 'cart' | 'orders' | 'profile' | 'driver';

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

export type Language = 'ar' | 'de' | 'en' | 'uk' | 'fa';

export interface LanguageOption {
  code: Language;
  name: string; // Native name
  dir: 'rtl' | 'ltr';
  flag: string;
}

export interface Category {
  id: string;
  categoryId?: string; // alias/normalized
  name?: string; // name
  nameAr: string;
  nameEn?: string;
  nameDe?: string;
  nameUk?: string;
  nameFa?: string;
  description?: string;
  descriptionAr?: string;
  descriptionEn?: string;
  descriptionDe?: string;
  descriptionUk?: string;
  descriptionFa?: string;
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
  nameUk?: string;
  nameFa?: string;
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
  nameUk?: string;
  nameFa?: string;
  description?: string;
  descriptionAr: string;
  descriptionEn?: string;
  descriptionDe?: string;
  descriptionUk?: string;
  descriptionFa?: string;
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
  role: 'customer' | 'admin' | 'driver';
  address?: string;
  street?: string;
  houseNumber?: string;
  bellName?: string;
  floor?: string;
  apartment?: string;
  cityAreaId?: string;
  city?: string;
  plz?: string;
  postalCode?: string;
  deliveryNotes?: string;
  avatar?: string;
  referralCode?: string;
  referredBy?: string;
  createdAt?: string;
  isActive?: boolean;
  vehicleInfo?: string;

  // Legal Policies Acceptance
  termsAccepted?: boolean;
  privacyAccepted?: boolean;
  termsVersion?: string;
  privacyVersion?: string;
  acceptedAt?: string;
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
  | 'received'
  | 'pending'
  | 'confirmed'
  | 'preparing'
  | 'ready_for_pickup'
  | 'on_the_way'
  | 'out_for_delivery'
  | 'delivered'
  | 'delivery_failed'
  | 'cancelled';

export interface OrderTimelineItem {
  status: OrderStatus;
  labelAr: string;
  timestamp: string;
  note?: string;
}

export type CustomerNoteStatus = 'none' | 'open' | 'replied' | 'resolved';

export interface CustomerNoteMessage {
  id: string;
  sender: 'customer' | 'admin' | 'driver';
  senderName: string;
  text: string;
  createdAt: string;
  timestamp?: string;
}

export interface Order {
  id: string;
  orderId?: string;
  userId?: string;
  customerName?: string;
  phone: string;
  address: string;
  street?: string;
  houseNumber?: string;
  bellName?: string;
  floor?: string;
  apartment?: string;
  cityAreaId?: string;
  city?: string;
  cityId?: string;
  branchId?: string;
  plz?: string;
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
  timeline?: OrderTimelineItem[];
  customerInfo?: CustomerOrderInfo;
  paymentMethod?: PaymentMethod | string;
  paymentStatus?: PaymentStatus | string;
  deliveryDateEstimated?: string;
  coldShippingIncluded?: boolean;
  driverId?: string;
  driverName?: string;
  driverPhone?: string;
  assignedAt?: string;
  deliveredAt?: string;
  deliveryNotes?: string;

  // Post-delivery note / Issue reporting fields
  customerNote?: string;
  customerNoteCategory?: string;
  customerNoteCreatedAt?: string;
  customerNoteUpdatedAt?: string;
  customerNoteStatus?: CustomerNoteStatus;
  adminReply?: string;
  adminReplyCreatedAt?: string;
  customerNoteMessages?: CustomerNoteMessage[];
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

export type AnnouncementIconType = 'sparkles' | 'truck' | 'shield' | 'tag' | 'flame' | 'bell' | 'gift' | 'percent';

export interface AnnouncementItem {
  id: string;
  text: string;
  textAr?: string;
  textDe?: string;
  textEn?: string;
  textUk?: string;
  textFa?: string;
  isActive: boolean;
  order: number;
  icon?: AnnouncementIconType | string;
  isHighlight?: boolean;
  createdAt?: string;
  updatedAt?: string;
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
  targetOrderId?: string;
  orderId?: string;
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

export interface City {
  id: string;
  nameAr: string;
  nameDe: string;
  nameEn?: string;
  isActive: boolean;
  createdAt?: string;
}

export interface Branch {
  id: string;
  cityId: string;
  nameAr: string;
  nameDe: string;
  nameEn?: string;
  address?: string;
  phone?: string;
  isActive: boolean;
  isDefault: boolean;
  createdAt?: string;
}

export interface DeliveryZone {
  id: string;
  cityId: string;
  branchId: string;
  plz: string;
  nameAr?: string;
  nameDe?: string;
  isActive: boolean;
  deliveryFee?: number;
  minOrderAmount?: number;
  estimatedTime?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CityArea {
  id: string;
  cityId: string;
  nameAr: string;
  nameDe: string;
  plz: string;
  isActive: boolean;
  sortOrder?: number;
}

export interface DeliveryStreet {
  id?: string;
  name: string;
  cityAreaId: string;
  plz: string;
  cityId?: string;
  zoneNameAr?: string;
  zoneNameDe?: string;
}

