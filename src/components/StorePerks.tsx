import React from 'react';
import { Snowflake, ShieldCheck, Zap, Headphones, MapPin } from 'lucide-react';
import { Language } from '../types';
import { DICTIONARY } from '../utils/helpers';

interface StorePerksProps {
  language: Language;
}

export const StorePerks: React.FC<StorePerksProps> = ({ language }) => {
  const t = DICTIONARY[language];

  return (
    <div className="max-w-7xl mx-auto px-4 my-8">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        
        {/* Perk 1: 2-Hour Delivery in Greifswald */}
        <div className="bg-white p-4.5 rounded-2xl border border-[#D5E5D7] shadow-xs hover:shadow-md transition-shadow flex items-start gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-[#E2EFE4] text-[#245233] flex items-center justify-center shrink-0 border border-[#C5DEC8]">
            <Zap className="w-5 h-5 text-[#3D6E4B]" />
          </div>
          <div>
            <h3 className="font-extrabold text-sm text-[#1B3022] mb-0.5 flex items-center gap-1.5">
              <span>{t.guarantees.fastShipping}</span>
            </h3>
            <p className="text-xs text-[#527059] leading-relaxed">
              {t.guarantees.fastShippingSub}
            </p>
          </div>
        </div>

        {/* Perk 2: Cold Chain */}
        <div className="bg-white p-4.5 rounded-2xl border border-[#D5E5D7] shadow-xs hover:shadow-md transition-shadow flex items-start gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-cyan-50 text-cyan-700 flex items-center justify-center shrink-0 border border-cyan-100">
            <Snowflake className="w-5 h-5 text-cyan-600" />
          </div>
          <div>
            <h3 className="font-extrabold text-sm text-[#1B3022] mb-0.5">
              {t.guarantees.coldDelivery}
            </h3>
            <p className="text-xs text-[#527059] leading-relaxed">
              {t.guarantees.coldDeliverySub}
            </p>
          </div>
        </div>

        {/* Perk 3: Authentic Syrian Cities */}
        <div className="bg-white p-4.5 rounded-2xl border border-[#D5E5D7] shadow-xs hover:shadow-md transition-shadow flex items-start gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-[#E8F4EA] text-[#2E553A] flex items-center justify-center shrink-0 border border-[#B8DCBF]">
            <ShieldCheck className="w-5 h-5 text-[#3D6E4B]" />
          </div>
          <div>
            <h3 className="font-extrabold text-sm text-[#1B3022] mb-0.5">
              {t.guarantees.authentic}
            </h3>
            <p className="text-xs text-[#527059] leading-relaxed">
              {t.guarantees.authenticSub}
            </p>
          </div>
        </div>

        {/* Perk 4: Local WhatsApp & Coordination */}
        <div className="bg-white p-4.5 rounded-2xl border border-[#D5E5D7] shadow-xs hover:shadow-md transition-shadow flex items-start gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center shrink-0 border border-amber-200">
            <Headphones className="w-5 h-5 text-amber-600" />
          </div>
          <div>
            <h3 className="font-extrabold text-sm text-[#1B3022] mb-0.5">
              {t.guarantees.support}
            </h3>
            <p className="text-xs text-[#527059] leading-relaxed">
              {t.guarantees.supportSub}
            </p>
          </div>
        </div>

      </div>
    </div>
  );
};
