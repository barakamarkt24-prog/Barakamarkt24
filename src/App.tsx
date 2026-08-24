import React from 'react';
import { 
  Home, 
  Grid, 
  ShoppingBag, 
  Clock, 
  User as UserIcon, 
  Heart, 
  ShieldCheck, 
  Truck,
  LogIn
} from 'lucide-react';
import { useApp } from './context/AppContext';
import { HomeScreen } from './screens/HomeScreen';
import { CartScreen } from './screens/CartScreen';
import { ProductDetailScreen } from './screens/ProductDetailScreen';
import { WishlistScreen } from './screens/WishlistScreen';
import { OrdersScreen } from './screens/OrdersScreen';
import { AdminDashboardScreen } from './screens/AdminDashboardScreen';
import { CategoriesScreen } from './screens/CategoriesScreen';
import { ProductsScreen } from './screens/ProductsScreen';
import { AuthScreen } from './screens/AuthScreen';
import { ProfileScreen } from './screens/ProfileScreen';
import { DriverDashboardScreen } from './screens/DriverDashboardScreen';

export const App: React.FC = () => {
  const { 
    currentScreen, 
    activeTab, 
    navigateTo, 
    cartCount, 
    wishlist, 
    currentUser, 
    toast 
  } = useApp();

  const renderScreen = () => {
    switch (currentScreen) {
      case 'home':
        return <HomeScreen />;
      case 'categories':
        return <CategoriesScreen />;
      case 'products':
        return <ProductsScreen />;
      case 'cart':
        return <CartScreen />;
      case 'product-detail':
      case 'product_detail' as any:
        return <ProductDetailScreen />;
      case 'wishlist':
        return <WishlistScreen />;
      case 'orders':
        return <OrdersScreen />;
      case 'admin':
        return <AdminDashboardScreen />;
      case 'driver':
        return <DriverDashboardScreen />;
      case 'auth':
        return <AuthScreen />;
      case 'profile':
        return <ProfileScreen />;
      default:
        return <HomeScreen />;
    }
  };

  return (
    <div className="min-h-screen bg-[#FDFBF7] text-[#2D1B10] flex flex-col font-sans selection:bg-emerald-800 selection:text-white" dir="rtl">
      
      {/* Toast Notification */}
      {toast && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-stone-900/95 backdrop-blur-md text-white text-xs font-bold px-5 py-3 rounded-2xl shadow-xl border border-stone-800 flex items-center gap-2 animate-bounce">
          <span>{toast}</span>
        </div>
      )}

      {/* Main Container */}
      <main className="flex-1 pb-20">
        {renderScreen()}
      </main>

      {/* Bottom Navigation Bar */}
      {currentScreen !== 'admin' && (
        <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-stone-200/80 px-4 py-2 flex items-center justify-around max-w-lg mx-auto sm:rounded-t-3xl shadow-lg">
          
          <button
            onClick={() => navigateTo('home')}
            className={`flex flex-col items-center gap-1 cursor-pointer transition-colors ${
              activeTab === 'home' || currentScreen === 'home' ? 'text-emerald-800 font-bold' : 'text-stone-400 hover:text-stone-600'
            }`}
          >
            <Home className="w-5 h-5" />
            <span className="text-[10px]">الرئيسية</span>
          </button>

          <button
            onClick={() => navigateTo('categories')}
            className={`flex flex-col items-center gap-1 cursor-pointer transition-colors ${
              activeTab === 'categories' || currentScreen === 'categories' ? 'text-emerald-800 font-bold' : 'text-stone-400 hover:text-stone-600'
            }`}
          >
            <Grid className="w-5 h-5" />
            <span className="text-[10px]">الأقسام</span>
          </button>

          {/* Floating Cart Button */}
          <button
            onClick={() => navigateTo('cart')}
            className={`flex flex-col items-center gap-1 cursor-pointer relative transition-colors ${
              activeTab === 'cart' || currentScreen === 'cart' ? 'text-emerald-800 font-bold' : 'text-stone-400 hover:text-stone-600'
            }`}
          >
            <div className="relative">
              <ShoppingBag className="w-5 h-5" />
              {cartCount > 0 && (
                <span className="absolute -top-1.5 -right-2 bg-emerald-800 text-amber-300 text-[10px] font-black w-4 h-4 rounded-full flex items-center justify-center shadow-xs">
                  {cartCount}
                </span>
              )}
            </div>
            <span className="text-[10px]">السلة</span>
          </button>

          <button
            onClick={() => navigateTo('wishlist')}
            className={`flex flex-col items-center gap-1 cursor-pointer relative transition-colors ${
              currentScreen === 'wishlist' ? 'text-rose-600 font-bold' : 'text-stone-400 hover:text-stone-600'
            }`}
          >
            <div className="relative">
              <Heart className="w-5 h-5" />
              {wishlist.length > 0 && (
                <span className="absolute -top-1.5 -right-2 bg-rose-500 text-white text-[10px] font-black w-4 h-4 rounded-full flex items-center justify-center shadow-xs">
                  {wishlist.length}
                </span>
              )}
            </div>
            <span className="text-[10px]">المفضلة</span>
          </button>

          <button
            onClick={() => navigateTo('orders')}
            className={`flex flex-col items-center gap-1 cursor-pointer transition-colors ${
              activeTab === 'orders' || currentScreen === 'orders' ? 'text-emerald-800 font-bold' : 'text-stone-400 hover:text-stone-600'
            }`}
          >
            <Clock className="w-5 h-5" />
            <span className="text-[10px]">طلباتي</span>
          </button>

          {currentUser?.role === 'driver' ? (
            <button
              onClick={() => navigateTo('driver')}
              className={`flex flex-col items-center gap-1 cursor-pointer transition-colors ${
                currentScreen === 'driver' ? 'text-cyan-800 font-bold' : 'text-stone-400 hover:text-cyan-700'
              }`}
            >
              <Truck className="w-5 h-5" />
              <span className="text-[10px]">السائق</span>
            </button>
          ) : currentUser ? (
            <button
              onClick={() => navigateTo('profile')}
              className={`flex flex-col items-center gap-1 cursor-pointer transition-colors ${
                activeTab === 'profile' || currentScreen === 'profile' ? 'text-emerald-800 font-bold' : 'text-stone-400 hover:text-stone-600'
              }`}
            >
              <UserIcon className="w-5 h-5" />
              <span className="text-[10px]">حسابي</span>
            </button>
          ) : (
            <button
              onClick={() => navigateTo('auth')}
              className={`flex flex-col items-center gap-1 cursor-pointer transition-colors ${
                activeTab === 'profile' || currentScreen === 'auth' || currentScreen === 'profile' ? 'text-emerald-800 font-bold' : 'text-stone-400 hover:text-stone-600'
              }`}
            >
              <LogIn className="w-5 h-5" />
              <span className="text-[10px]">دخول</span>
            </button>
          )}

        </nav>
      )}

    </div>
  );
};

export default App;
