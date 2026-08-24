import React, { useState, useEffect } from 'react';
import { WifiOff, RefreshCw } from 'lucide-react';

export const NetworkStatusBanner: React.FC = () => {
  const [isOnline, setIsOnline] = useState<boolean>(() => {
    return typeof navigator !== 'undefined' ? navigator.onLine : true;
  });

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (isOnline) return null;

  return (
    <div className="bg-amber-600 text-stone-950 px-4 py-2 text-xs font-medium flex items-center justify-between shadow-sm animate-in slide-in-from-top-2 duration-200">
      <div className="flex items-center gap-2">
        <WifiOff className="w-4 h-4 text-stone-950 shrink-0" />
        <span>أنت في وضع عدم الاتصال — يتم عرض البيانات المخزنة محلياً.</span>
      </div>
      <button
        onClick={() => window.location.reload()}
        className="px-2 py-0.5 bg-stone-950 text-white rounded-lg text-[10px] font-bold flex items-center gap-1 cursor-pointer"
      >
        <RefreshCw className="w-3 h-3" />
        <span>إعادة المحاولة</span>
      </button>
    </div>
  );
};
