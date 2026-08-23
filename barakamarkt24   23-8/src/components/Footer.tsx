import React from 'react';
import { 
  Phone, 
  Mail, 
  MapPin, 
  MessageCircle, 
  Heart, 
  ShieldCheck, 
  Truck, 
  Snowflake, 
  Clock, 
  Sparkles,
  Zap
} from 'lucide-react';
import { CategoryId, Language } from '../types';
import { CATEGORIES } from '../data/categories';

interface FooterProps {
  language: Language;
  onSelectCategory: (catId: CategoryId) => void;
}

export const Footer: React.FC<FooterProps> = ({
  language,
  onSelectCategory
}) => {
  return (
    <footer className="bg-[#1B3022] text-[#D5E5D7] pt-12 pb-8 border-t border-[#2D4D36] text-xs">
      <div className="max-w-7xl mx-auto px-4">
        
        {/* Top Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 pb-10 border-b border-[#2D4D36]">
          
          {/* Col 1: Brand Info */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 bg-[#2D4D36] rounded-xl flex items-center justify-center text-amber-300 text-xl font-bold font-serif shadow-md border border-[#3D6E4B]">
                ب
              </div>
              <div className="flex flex-col">
                <span className="font-black text-xl text-white tracking-tight">
                  Baraka<span className="text-[#8FB397]">markt</span> <span className="text-xs bg-[#2D4D36] text-[#D5E5D7] px-2 py-0.5 rounded-full">Greifswald</span>
                </span>
                <span className="text-[11px] text-[#A5C4AC]">بقالية المنتجات والمؤونة السورية في غرايفسفالد</span>
              </div>
            </div>

            <p className="text-[#C2D9C6] leading-relaxed max-w-sm text-xs">
              متجر بركة ماركت هو مشروع محلي مخصص لأهلنا في مدينة غرايفسفالد (Greifswald) والمناطق المجاورة. نوفر لكم أجود البضائع والمؤونة السورية الأصلية من زيتون وزيوت وأجبان وبهارات مع خدمة التوصيل السريع خلال ساعتين عمل حتى باب بيتك.
            </p>

            <div className="flex flex-wrap gap-2 text-[#EBF3EC]">
              <div className="bg-[#24422D] px-3 py-1.5 rounded-xl border border-[#345B3E] flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-amber-300" />
                <span>توصيل خلال ساعتين بغرايفسفالد</span>
              </div>
              <div className="bg-[#24422D] px-3 py-1.5 rounded-xl border border-[#345B3E] flex items-center gap-1.5">
                <Snowflake className="w-3.5 h-3.5 text-cyan-300" />
                <span>تغليف وحفظ مبرد للأجبان</span>
              </div>
            </div>
          </div>

          {/* Col 2: Categories (Part 1) */}
          <div className="space-y-3">
            <h4 className="font-black text-white text-sm">أقسام المؤونة السورية</h4>
            <ul className="space-y-2">
              {CATEGORIES.slice(0, 8).map((cat) => (
                <li key={cat.id}>
                  <button
                    onClick={() => {
                      onSelectCategory(cat.id);
                      window.scrollTo({ top: 400, behavior: 'smooth' });
                    }}
                    className="text-[#C2D9C6] hover:text-amber-300 transition-colors text-right cursor-pointer"
                  >
                    {cat.nameAr}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Col 3: Categories (Part 2) */}
          <div className="space-y-3">
            <h4 className="font-black text-white text-sm">باقي الأقسام والمنزل</h4>
            <ul className="space-y-2">
              {CATEGORIES.slice(8).map((cat) => (
                <li key={cat.id}>
                  <button
                    onClick={() => {
                      onSelectCategory(cat.id);
                      window.scrollTo({ top: 400, behavior: 'smooth' });
                    }}
                    className="text-[#C2D9C6] hover:text-amber-300 transition-colors text-right cursor-pointer"
                  >
                    {cat.nameAr}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Col 4: Contact & WhatsApp */}
          <div className="space-y-3">
            <h4 className="font-black text-white text-sm">خدمة الطلبات بغرايفسفالد</h4>
            
            <div className="space-y-2.5 text-[#C2D9C6]">
              <a 
                href="https://wa.me/4915000000000" 
                target="_blank" 
                rel="noreferrer"
                className="flex items-center gap-2 bg-[#24422D] hover:bg-[#2D4F37] text-white p-2.5 rounded-xl border border-[#345B3E] transition-colors"
              >
                <MessageCircle className="w-4 h-4 text-emerald-300 shrink-0" />
                <div>
                  <span className="font-bold block text-white text-xs">واتساب الطلب والتوصيل السريع</span>
                  <span className="text-[11px] text-amber-300 font-mono">+49 150 0000000</span>
                </div>
              </a>

              <div className="flex items-center gap-2 pt-1">
                <Clock className="w-4 h-4 text-amber-300 shrink-0" />
                <span>توصيل الطلبات يومياً خلال ساعتين</span>
              </div>

              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-amber-300 shrink-0" />
                <span>Greifswald, 17489 / 17491 / 17493</span>
              </div>
            </div>
          </div>

        </div>

        {/* Bottom Bar */}
        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-[#A5C4AC] text-[11px]">
          <div className="flex items-center gap-1">
            <span>جميع الحقوق محفوظة لمتجر</span>
            <strong className="text-white">بركة ماركت غرايفسفالد | Barakamarkt Greifswald</strong>
            <span>© {new Date().getFullYear()}</span>
          </div>

          {/* Payment Badges */}
          <div className="flex items-center gap-2 flex-wrap justify-center">
            <span className="bg-[#24422D] px-2 py-1 rounded text-[#EBF3EC] border border-[#345B3E]">الدفع عند الاستلام نقداً في غرايفسفالد</span>
            <span className="bg-[#24422D] px-2 py-1 rounded text-[#EBF3EC] border border-[#345B3E]">EC-Karte مع المندوب</span>
            <span className="bg-[#24422D] px-2 py-1 rounded text-[#EBF3EC] border border-[#345B3E]">PayPal</span>
          </div>
        </div>

      </div>
    </footer>
  );
};
