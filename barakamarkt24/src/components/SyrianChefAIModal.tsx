import React, { useState } from 'react';
import { 
  X, 
  ChefHat, 
  Send, 
  Sparkles, 
  ShoppingBag, 
  MessageSquare, 
  Lightbulb, 
  Check,
  Bot,
  Zap
} from 'lucide-react';
import { Currency, Language, Product } from '../types';
import { formatPrice } from '../utils/helpers';

interface SyrianChefAIModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
  currency: Currency;
  language: Language;
  onAddToCart: (product: Product, quantity?: number) => void;
}

interface Message {
  sender: 'chef' | 'user';
  text: string;
  suggestedProducts?: Product[];
}

export const SyrianChefAIModal: React.FC<SyrianChefAIModalProps> = ({
  isOpen,
  onClose,
  products,
  currency,
  language,
  onAddToCart
}) => {
  if (!isOpen) return null;

  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    {
      sender: 'chef',
      text: 'يا مية أهلاً وسهلاً بكم في بركة ماركت غرايفسفالد! 👨‍🍳 أنا "شيف بركة" مستشارك للمطبخ والمؤونة السورية البلدية في مدينة غرايفسفالد. اسألني عن أي وصفة سورية أو طبخة شامية وبجمعلك مقاديرها فوراً للتوصيل خلال ساعتين حتى باب بيتك!'
    }
  ]);

  const QUICK_QUESTIONS = [
    'كيف بحضر أطيب فريكة حلبية مفروكة؟',
    'شو المكونات الأساسية لمؤونة الفطور الشامي؟',
    'شو سر قرمشة مخلل اللفت ومربى القرع؟',
    'طريقة عمل حلاوة الجبن الشامية بالمنزل؟'
  ];

  const handleSend = (userText: string) => {
    if (!userText.trim()) return;

    const userMsg: Message = { sender: 'user', text: userText };
    setMessages(prev => [...prev, userMsg]);
    setInput('');

    // Generate smart authentic response
    setTimeout(() => {
      let replyText = '';
      let suggested: Product[] = [];

      const query = userText.toLowerCase();

      if (query.includes('فريكة') || query.includes('freekeh')) {
        replyText = 'أهلاً بك! سر الفريكة الحلبية المفروكة هو غسلها سريعاً بدون نقع طويل للحفاظ على طعم الحطب والتدخين، ثم فركها بالسمنة الحموية البلدية والسبع بهارات قبل سكب مرقة اللحم الساخنة. إليك المكونات الأصلية المتوفرة بغرايفسفالد:';
        suggested = products.filter(p => ['prod-grain-01', 'prod-cheese-03', 'prod-spice-03'].includes(p.id));
      } else if (query.includes('مكدوس') || query.includes('فطور') || query.includes('جبنة')) {
        replyText = 'الفطور الشامي لا يكتمل بدون المكدوس البيتي بالجوز البلدي، وجبنة الشلل الحموية بحبة البركة، مع غمسة زعتر حلبي اكسترا بزيت زيتون عفرين عصرة أولى. هي جهزتلك المكونات الطازجة للتوصيل خلال ساعتين:';
        suggested = products.filter(p => ['prod-pickle-01', 'prod-cheese-01', 'prod-spice-01', 'prod-oil-01'].includes(p.id));
      } else if (query.includes('حلاوة الجبن') || query.includes('حلويات') || query.includes('بقلاوة')) {
        replyText = 'لحلاوة الجبن الأصلية، تحتاج لسميد فرخة ناعم مع جبنة عكاوي محلاة وماء زهر طبيعي، وقشطة بلدية مع فستق حلبي أخضر نخب أول. تفضل المكونات المتوفرة بمتجرنا:';
        suggested = products.filter(p => ['prod-cheese-01', 'prod-care-01', 'prod-jam-04', 'prod-sweet-01'].includes(p.id));
      } else if (query.includes('متة') || query.includes('شاي') || query.includes('قهوة')) {
        replyText = 'أحلى قعدة متة وجمعة حبايب بغرايفسفالد! بنصحك بمتة بيبوري خضراء مع يقطينة أصلية وبومبيلا، وفنجان بن الحموي بالهال مع برازق شامية مقرمشة بالسمن البلدي.';
        suggested = products.filter(p => ['prod-drink-02', 'prod-kitchen-03', 'prod-drink-01', 'prod-sweet-01'].includes(p.id));
      } else {
        replyText = `تكرم عينك! لتحضير هذه الوجبة على الأصول السورية، اخترنا لك أجود المكونات والبهارات الأصلية المتوفرة للتوصيل السريع في غرايفسفالد:`;
        suggested = products.slice(0, 3);
      }

      setMessages(prev => [
        ...prev,
        {
          sender: 'chef',
          text: replyText,
          suggestedProducts: suggested
        }
      ]);
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div 
        className="bg-[#FDFBF7] rounded-3xl max-w-2xl w-full h-[85vh] shadow-2xl border border-[#D5E5D7] flex flex-col justify-between overflow-hidden animate-in fade-in zoom-in-95 duration-200 relative text-[#1B3022]"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* Header */}
        <div className="p-4 bg-[#3D6E4B] text-white flex items-center justify-between shadow-md">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#24422D] text-amber-300 flex items-center justify-center font-black shadow-md border border-[#4D7E5B]">
              <ChefHat className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="font-extrabold text-base sm:text-lg">شيف بركة الذكي 👨‍🍳</h3>
                <span className="bg-white/20 text-white text-[10px] font-bold px-2 py-0.5 rounded-full border border-white/20">
                  AI سوري بغرايفسفالد
                </span>
              </div>
              <p className="text-xs text-[#D5E5D7]">
                مستشارك لوصفات المطبخ السوري واختيار مقادير المؤونة
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-[#D5E5D7] hover:text-white hover:bg-white/10 rounded-xl transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Chat Messages Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-[#FDFBF7]">
          
          {/* Quick Suggestions Chips */}
          <div className="space-y-1.5">
            <span className="text-[11px] font-bold text-[#527059] flex items-center gap-1">
              <Lightbulb className="w-3.5 h-3.5 text-amber-500" />
              <span>جرب أن تسأل الشيف:</span>
            </span>
            <div className="flex flex-wrap gap-1.5">
              {QUICK_QUESTIONS.map((q, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSend(q)}
                  className="bg-white hover:bg-[#EBF3EC] text-[#1B3022] hover:text-[#3D6E4B] text-xs px-2.5 py-1 rounded-xl border border-[#D5E5D7] transition-colors shadow-2xs cursor-pointer font-medium"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>

          {/* Messages */}
          {messages.map((msg, index) => (
            <div 
              key={index}
              className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
            >
              <div className={`max-w-[85%] rounded-2xl p-3.5 text-xs sm:text-sm leading-relaxed shadow-xs ${
                msg.sender === 'user'
                  ? 'bg-[#3D6E4B] text-white rounded-br-none'
                  : 'bg-white text-[#1B3022] border border-[#D5E5D7] rounded-bl-none'
              }`}>
                <p>{msg.text}</p>

                {/* Suggested Products Inside Chef Message */}
                {msg.suggestedProducts && msg.suggestedProducts.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-[#EDF4EE] space-y-2">
                    <span className="text-[11px] font-bold text-[#3D6E4B] block flex items-center gap-1">
                      <Zap className="w-3 h-3 text-amber-500" />
                      <span>المكونات المطلوبة من متجر بركة (توصيل ساعتين):</span>
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {msg.suggestedProducts.map((p) => (
                        <div key={p.id} className="bg-[#F9FAF9] rounded-xl p-2 border border-[#D5E5D7] flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2 min-w-0">
                            <img src={p.image} alt={p.nameAr} className="w-8 h-8 rounded-lg object-cover border border-[#D5E5D7]" />
                            <div className="min-w-0">
                              <p className="font-bold text-[11px] text-[#1B3022] truncate">{p.nameAr}</p>
                              <p className="text-[10px] text-[#3D6E4B] font-semibold font-sans">{formatPrice(p.price, currency)}</p>
                            </div>
                          </div>
                          <button
                            onClick={() => onAddToCart(p, 1)}
                            className="bg-[#3D6E4B] hover:bg-[#315A3D] text-white p-1.5 rounded-lg text-xs font-bold shrink-0 cursor-pointer shadow-xs"
                            title="إضافة للسلة"
                          >
                            <ShoppingBag className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}

        </div>

        {/* Input Footer */}
        <div className="p-3 bg-white border-t border-[#D5E5D7]">
          <form 
            onSubmit={(e) => {
              e.preventDefault();
              handleSend(input);
            }}
            className="flex gap-2"
          >
            <input
              type="text"
              placeholder="اكتب سؤالك أو اسم الطبخة الشامية هنا..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              className="flex-1 bg-[#F9FAF9] text-xs sm:text-sm px-4 py-2.5 rounded-xl border border-[#D5E5D7] focus:border-[#3D6E4B] focus:bg-white outline-hidden text-[#1B3022]"
            />
            <button
              type="submit"
              disabled={!input.trim()}
              className="bg-[#3D6E4B] hover:bg-[#315A3D] text-white px-4 py-2.5 rounded-xl font-bold transition-all disabled:opacity-40 cursor-pointer flex items-center justify-center shadow-md"
            >
              <Send className="w-4 h-4 text-amber-300" />
            </button>
          </form>
        </div>

      </div>
    </div>
  );
};
