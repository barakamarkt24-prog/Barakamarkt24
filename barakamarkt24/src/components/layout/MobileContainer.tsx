import React from 'react';
import { useApp } from '../../context/AppContext';
import { AppHeader } from './AppHeader';
import { BottomNav } from './BottomNav';
import { NetworkStatusBanner } from '../common/NetworkStatusBanner';

export const MobileContainer: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentScreen, toast } = useApp();

  return (
    <div className="min-h-screen bg-stone-100 flex justify-center items-start text-stone-900 font-sans antialiased selection:bg-emerald-700 selection:text-white" dir="rtl">
      
      {/* Mobile Device Wrapper (Mobile-First Frame on Desktop, 100% Fullscreen on Mobile) */}
      <div className="w-full sm:max-w-md min-h-screen bg-white shadow-2xl flex flex-col relative overflow-x-hidden border-x border-stone-200/60 pb-20 sm:my-3 sm:rounded-[36px] sm:overflow-hidden sm:min-h-[860px]">
        
        {/* Native Mobile Status Bar Placeholder on Desktop */}
        <div className="hidden sm:flex items-center justify-between px-6 pt-3 pb-1 text-[11px] font-semibold text-stone-600 bg-white border-b border-stone-100 select-none">
          <span>9:41</span>
          <div className="w-20 h-4 bg-stone-900 rounded-full mx-auto -mt-1 opacity-90" />
          <div className="flex items-center gap-1.5 text-xs">
            <span>5G</span>
            <span>100%</span>
          </div>
        </div>

        {/* Network Offline Status Banner */}
        <NetworkStatusBanner />

        {/* Global App Header */}
        <AppHeader />

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto bg-[#FBFBF9]">
          {children}
        </main>

        {/* Toast Notification */}
        {toast && (
          <div className="fixed bottom-22 left-1/2 -translate-x-1/2 z-50 bg-stone-900/95 text-white text-xs font-semibold px-4 py-2.5 rounded-2xl shadow-xl backdrop-blur-xs border border-stone-700 animate-in fade-in slide-in-from-bottom-3 duration-200 max-w-[90%] text-center">
            {toast}
          </div>
        )}

        {/* Global Bottom Navigation (Visible on main customer screens) */}
        {currentScreen !== 'admin' && <BottomNav />}
        
      </div>

    </div>
  );
};
