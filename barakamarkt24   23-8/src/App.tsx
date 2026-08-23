import React from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { MobileContainer } from './components/layout/MobileContainer';

// All 10 requested screens
import { HomeScreen } from './screens/HomeScreen';
import { CategoriesScreen } from './screens/CategoriesScreen';
import { ProductsScreen } from './screens/ProductsScreen';
import { ProductDetailScreen } from './screens/ProductDetailScreen';
import { CartScreen } from './screens/CartScreen';
import { AuthScreen } from './screens/AuthScreen';
import { ProfileScreen } from './screens/ProfileScreen';
import { OrdersScreen } from './screens/OrdersScreen';
import { WishlistScreen } from './screens/WishlistScreen';
import { AdminDashboardScreen } from './screens/AdminDashboardScreen';

const ScreenRouter: React.FC = () => {
  const { currentScreen, isLoadingProducts, isLoadingAuth } = useApp();

  if (isLoadingProducts || isLoadingAuth) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-3 p-6 text-center">
        <div className="w-10 h-10 border-3 border-emerald-800 border-t-transparent rounded-full animate-spin" />
        <span className="text-xs font-bold text-stone-600">جاري تجهيز متجر Barakamarkt24...</span>
      </div>
    );
  }

  switch (currentScreen) {
    case 'home':
      return <HomeScreen />;
    case 'categories':
      return <CategoriesScreen />;
    case 'products':
      return <ProductsScreen />;
    case 'product-detail':
      return <ProductDetailScreen />;
    case 'cart':
      return <CartScreen />;
    case 'auth':
      return <AuthScreen />;
    case 'profile':
      return <ProfileScreen />;
    case 'orders':
      return <OrdersScreen />;
    case 'wishlist':
      return <WishlistScreen />;
    case 'admin':
      return <AdminDashboardScreen />;
    default:
      return <HomeScreen />;
  }
};

export default function App() {
  return (
    <AppProvider>
      <MobileContainer>
        <ScreenRouter />
      </MobileContainer>
    </AppProvider>
  );
}
