import React, { useState, useEffect } from 'react';
import { 
  Bell, 
  Package, 
  Truck, 
  Sparkles, 
  X, 
  ChevronLeft,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { AppNotification } from '../../types';

interface InAppNotificationBannerProps {
  notification: AppNotification | null;
  onDismiss: () => void;
  onOpen?: (notification: AppNotification) => void;
}

export const InAppNotificationBanner: React.FC<InAppNotificationBannerProps> = ({
  notification,
  onDismiss,
  onOpen
}) => {
  const { navigateTo, currentUser } = useApp();
  const [isVisible, setIsVisible] = useState<boolean>(false);

  useEffect(() => {
    if (notification) {
      setIsVisible(true);
      const timer = setTimeout(() => {
        setIsVisible(false);
        setTimeout(onDismiss, 300);
      }, 7000);

      return () => clearTimeout(timer);
    } else {
      setIsVisible(false);
    }
  }, [notification]);

  if (!notification) return null;

  const handleClick = () => {
    if (onOpen) {
      onOpen(notification);
    } else if (notification.targetOrderId || notification.orderId) {
      if (currentUser?.role === 'admin') {
        navigateTo('admin');
      } else if (currentUser?.role === 'driver') {
        navigateTo('driver');
      } else {
        navigateTo('orders');
      }
    }
    setIsVisible(false);
    setTimeout(onDismiss, 300);
  };

  const getIcon = () => {
    switch (notification.type) {
      case 'order':
        return <Package className="w-5 h-5 text-emerald-600" />;
      case 'promo':
        return <Sparkles className="w-5 h-5 text-amber-500" />;
      default:
        return <Bell className="w-5 h-5 text-blue-600" />;
    }
  };

  const getBgBorder = () => {
    switch (notification.type) {
      case 'order':
        return 'bg-white border-emerald-300 shadow-lg ring-1 ring-emerald-500/20';
      case 'promo':
        return 'bg-white border-amber-300 shadow-lg ring-1 ring-amber-500/20';
      default:
        return 'bg-white border-blue-300 shadow-lg ring-1 ring-blue-500/20';
    }
  };

  return (
    <aside 
      role="status"
      aria-live="polite"
      aria-label="تنبيه جديد"
      className={`fixed top-4 left-4 right-4 sm:left-auto sm:right-4 sm:w-96 z-50 transition-all duration-300 transform ${
        isVisible ? 'translate-y-0 opacity-100 scale-100' : '-translate-y-6 opacity-0 scale-95 pointer-events-none'
      }`}
      dir="rtl"
    >
      <div className={`rounded-2xl p-3.5 border ${getBgBorder()} flex items-start gap-3 backdrop-blur-md`}>
        <div className="w-9 h-9 rounded-xl bg-stone-50 border border-stone-200 flex items-center justify-center shrink-0 shadow-2xs">
          {getIcon()}
        </div>

        <div className="flex-1 min-w-0 cursor-pointer" onClick={handleClick}>
          <div className="flex items-center justify-between gap-1">
            <h4 className="text-xs font-black text-stone-900 line-clamp-1">
              {notification.title}
            </h4>
            <span className="text-[9px] text-stone-400 font-sans">الآن</span>
          </div>

          <p className="text-[11px] text-stone-600 line-clamp-2 mt-0.5 leading-snug">
            {notification.message}
          </p>

          <div className="flex items-center gap-1 mt-1.5 text-[10px] font-bold text-emerald-800 hover:text-emerald-950">
            <span>عرض التفاصيل</span>
            <ChevronLeft className="w-3 h-3" />
          </div>
        </div>

        <button
          onClick={(e) => {
            e.stopPropagation();
            setIsVisible(false);
            setTimeout(onDismiss, 300);
          }}
          className="text-stone-400 hover:text-stone-700 p-1 rounded-lg hover:bg-stone-100 transition-colors cursor-pointer"
          aria-label="إغلاق الإشعار"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </aside>
  );
};
