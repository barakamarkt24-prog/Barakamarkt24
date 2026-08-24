import React from 'react';
import { 
  Home, 
  LayoutGrid, 
  ShoppingBag, 
  Package, 
  User 
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { BottomNavTab } from '../../types';

export const BottomNav: React.FC = () => {
  const { activeTab, navigateTo, cartCount } = useApp();

  const navItems: { tab: BottomNavTab; label: string; icon: React.ElementType; badge?: number }[] = [
    {
      tab: 'home',
      label: 'الرئيسية',
      icon: Home
    },
    {
      tab: 'categories',
      label: 'الأقسام',
      icon: LayoutGrid
    },
    {
      tab: 'cart',
      label: 'السلة',
      icon: ShoppingBag,
      badge: cartCount
    },
    {
      tab: 'orders',
      label: 'طلباتي',
      icon: Package
    },
    {
      tab: 'profile',
      label: 'حسابي',
      icon: User
    }
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 sm:max-w-md sm:mx-auto bg-white/95 backdrop-blur-md border-t border-stone-200/80 px-2 py-1.5 z-40 shadow-lg">
      <div className="grid grid-cols-5 gap-1 items-center">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.tab;

          return (
            <button
              key={item.tab}
              onClick={() => navigateTo(item.tab)}
              className={`flex flex-col items-center justify-center py-1 px-1 rounded-2xl transition-all cursor-pointer select-none active:scale-95 ${
                isActive 
                  ? 'text-emerald-800 font-black' 
                  : 'text-stone-600 hover:text-stone-900 font-medium'
              }`}
            >
              <div className="relative">
                <Icon className={`w-5 h-5 transition-transform ${isActive ? 'scale-110 stroke-[2.5]' : 'stroke-[1.8]'}`} />
                {Boolean(item.badge && item.badge > 0) && (
                  <span className="absolute -top-1.5 -right-2 bg-emerald-700 text-white text-[10px] font-black min-w-[17px] h-[17px] px-1 rounded-full flex items-center justify-center shadow-xs animate-in zoom-in">
                    {item.badge}
                  </span>
                )}
              </div>
              <span className="text-[10px] mt-1 tracking-tight">
                {item.label}
              </span>
              {isActive && (
                <span className="w-1.5 h-1.5 bg-emerald-800 rounded-full mt-0.5" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};
