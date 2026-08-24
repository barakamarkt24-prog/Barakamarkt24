import { SyrianRecipeKit } from '../types';

export const RECIPE_KITS: SyrianRecipeKit[] = [
  {
    id: 'recipe-freekeh',
    titleAr: 'سلة طبخة الفريكة الحلبية المفروكة بالسمن البلدي',
    titleEn: 'Aleppo Smoked Freekeh Feast Kit',
    titleDe: 'Aleppo Freekeh Festmahl-Set',
    descriptionAr: 'كل ما يلزمك لتحضير أطيب فريكة حلبية مدخنة بالسمنة الحموية والسبع بهارات مع المكسرات الشهية.',
    serves: 5,
    cookTime: '45 دقيقة',
    image: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=600&q=80',
    cityOrigin: 'حلب الشهباء',
    productIds: ['prod-grain-01', 'prod-cheese-03', 'prod-spice-03']
  },
  {
    id: 'recipe-makdous',
    titleAr: 'سلة تجهيز مؤونة الفطور الشامي (مكدوس وجبنة وزعتر)',
    titleEn: 'Damascus Royal Breakfast Pantry Kit',
    titleDe: 'Damaszener Königs-Frühstücks-Set',
    descriptionAr: 'الفطور السوري الملكي الكامل: مكدوس بالجوز، جبنة شلل بحبة البركة، زعتر حلبي اكسترا، وزيت زيتون عفرين.',
    serves: 4,
    cookTime: 'جاهز للتقديم',
    image: 'https://images.unsplash.com/photo-1541256942802-7b2996a84f97?auto=format&fit=crop&w=600&q=80',
    cityOrigin: 'دمشق وحماة',
    productIds: ['prod-pickle-01', 'prod-cheese-01', 'prod-spice-01', 'prod-oil-01']
  },
  {
    id: 'recipe-mate',
    titleAr: 'سلة جمعة المتة والقهوة الشامية الأصيلة',
    titleEn: 'Syrian Social Mate & Cardamom Coffee Kit',
    titleDe: 'Syrisches Mate- & Kaffee-Geselligkeits-Set',
    descriptionAr: 'جلسة المتة السورية الكاملة: يقطينة وبومبيلا، متة بيبوري، بن الحموي بالهال مع برازق شامية بالسمن.',
    serves: 6,
    cookTime: '10 دقائق',
    image: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=600&q=80',
    cityOrigin: 'الساحل ودمشق',
    productIds: ['prod-drink-02', 'prod-kitchen-03', 'prod-drink-01', 'prod-sweet-01']
  }
];
