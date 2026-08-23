import { Subcategory } from '../types';

export const INITIAL_SUBCATEGORIES: Subcategory[] = [
  // أجبان وألبان
  { id: 'sub-cheese-white', subcategoryId: 'sub-cheese-white', categoryId: 'dairy-cheese', name: 'أجبان بيضاء ومشللة', nameAr: 'أجبان بيضاء ومشللة', nameEn: 'White & String Cheese', image: 'https://images.unsplash.com/photo-1552767059-ce182ead6c1b?auto=format&fit=crop&w=400&q=80', isActive: true, sortOrder: 1 },
  { id: 'sub-cheese-grill', subcategoryId: 'sub-cheese-grill', categoryId: 'dairy-cheese', name: 'أجبان للشوي والقلي', nameAr: 'أجبان للشوي والقلي', nameEn: 'Grilling Cheese & Halloumi', image: 'https://images.unsplash.com/photo-1628088062854-d1870b4553da?auto=format&fit=crop&w=400&q=80', isActive: true, sortOrder: 2 },
  { id: 'sub-cheese-ghee', subcategoryId: 'sub-cheese-ghee', categoryId: 'dairy-cheese', name: 'سمن بلدي وزبدة وقشطة', nameAr: 'سمن بلدي وزبدة وقشطة', nameEn: 'Ghee, Butter & Clotted Cream', image: 'https://images.unsplash.com/photo-1589985270826-4b7bb135bc9d?auto=format&fit=crop&w=400&q=80', isActive: true, sortOrder: 3 },
  { id: 'sub-cheese-labneh', subcategoryId: 'sub-cheese-labneh', categoryId: 'dairy-cheese', name: 'لبنة مدعبلة وكشك', nameAr: 'لبنة مدعبلة وكشك', nameEn: 'Rolled Labneh & Kishk', image: 'https://images.unsplash.com/photo-1486297678162-eb2a19b0a32d?auto=format&fit=crop&w=400&q=80', isActive: true, sortOrder: 4 },

  // زيتون ومخللات
  { id: 'sub-olive-makdous', subcategoryId: 'sub-olive-makdous', categoryId: 'olives-pickles', name: 'مكدوس شامي بالجوز', nameAr: 'مكدوس شامي بالجوز', nameEn: 'Syrian Makdous', image: 'https://images.unsplash.com/photo-1541256942802-7b2996a84f97?auto=format&fit=crop&w=400&q=80', isActive: true, sortOrder: 1 },
  { id: 'sub-olive-green-black', subcategoryId: 'sub-olive-green-black', categoryId: 'olives-pickles', name: 'زيتون أخضر وعطون حلبي', nameAr: 'زيتون أخضر وعطون حلبي', nameEn: 'Green & Black Aleppo Olives', image: 'https://images.unsplash.com/photo-1541256942802-7b2996a84f97?auto=format&fit=crop&w=400&q=80', isActive: true, sortOrder: 2 },
  { id: 'sub-olive-pickles', subcategoryId: 'sub-olive-pickles', categoryId: 'olives-pickles', name: 'مخللات بلدية مقرمشة', nameAr: 'مخللات بلدية مقرمشة', nameEn: 'Traditional Crunchy Pickles', image: 'https://images.unsplash.com/photo-1563729784474-d77dbb933a9e?auto=format&fit=crop&w=400&q=80', isActive: true, sortOrder: 3 },

  // الرز والحبوب
  { id: 'sub-grain-freekeh', subcategoryId: 'sub-grain-freekeh', categoryId: 'rice-grains', name: 'فريكة حلبية وبرغل عمقي', nameAr: 'فريكة حلبية وبرغل عمقي', nameEn: 'Aleppo Freekeh & Bulgur', image: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=400&q=80', isActive: true, sortOrder: 1 },
  { id: 'sub-grain-lentils', subcategoryId: 'sub-grain-lentils', categoryId: 'rice-grains', name: 'عدس وحمص وفول جاف', nameAr: 'عدس وحمص وفول جاف', nameEn: 'Lentils, Chickpeas & Beans', image: 'https://images.unsplash.com/photo-1515543237350-b3eea1ec8082?auto=format&fit=crop&w=400&q=80', isActive: true, sortOrder: 2 },
  { id: 'sub-grain-rice', subcategoryId: 'sub-grain-rice', categoryId: 'rice-grains', name: 'أرز بسمتي ومصري وإيطالي', nameAr: 'أرز بسمتي ومصري وإيطالي', nameEn: 'Basmati & Egyptian Rice', image: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=400&q=80', isActive: true, sortOrder: 3 },

  // الزيوت والصلصات
  { id: 'sub-oil-olive', subcategoryId: 'sub-oil-olive', categoryId: 'oils-sauces', name: 'زيت زيتون بكر عفريني وإدلبي', nameAr: 'زيت زيتون بكر عفريني وإدلبي', nameEn: 'Virgin Olive Oil', image: 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?auto=format&fit=crop&w=400&q=80', isActive: true, sortOrder: 1 },
  { id: 'sub-oil-molasses', subcategoryId: 'sub-oil-molasses', categoryId: 'oils-sauces', name: 'دبس رمان وفليفلة وطحينة', nameAr: 'دبس رمان وفليفلة وطحينة', nameEn: 'Pomegranate Molasses & Tahini', image: 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?auto=format&fit=crop&w=400&q=80', isActive: true, sortOrder: 2 },

  // البهارات والتوابل
  { id: 'sub-spice-zaatar', subcategoryId: 'sub-spice-zaatar', categoryId: 'spices-seasonings', name: 'زعتر حلبي ملكي ودقة', nameAr: 'زعتر حلبي ملكي ودقة', nameEn: 'Aleppo Royal Zaatar & Dukkah', image: 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?auto=format&fit=crop&w=400&q=80', isActive: true, sortOrder: 1 },
  { id: 'sub-spice-blends', subcategoryId: 'sub-spice-blends', categoryId: 'spices-seasonings', name: 'بهارات شامية مشكلة وسماق', nameAr: 'بهارات شامية مشكلة وسماق', nameEn: '7 Spices & Sumac', image: 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?auto=format&fit=crop&w=400&q=80', isActive: true, sortOrder: 2 },

  // القهوة والشاي والمشروبات
  { id: 'sub-drink-coffee', subcategoryId: 'sub-drink-coffee', categoryId: 'coffee-tea-drinks', name: 'بن وهال قهوة شامية', nameAr: 'بن وهال قهوة شامية', nameEn: 'Syrian Cardamom Coffee', image: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=400&q=80', isActive: true, sortOrder: 1 },
  { id: 'sub-drink-mate', subcategoryId: 'sub-drink-mate', categoryId: 'coffee-tea-drinks', name: 'متة أرجنتينية وسورية وإكسسواراتها', nameAr: 'متة أرجنتينية وسورية وإكسسواراتها', nameEn: 'Yerba Mate & Gourds', image: 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?auto=format&fit=crop&w=400&q=80', isActive: true, sortOrder: 2 },
  { id: 'sub-drink-syrups', subcategoryId: 'sub-drink-syrups', categoryId: 'coffee-tea-drinks', name: 'شراب تمر هندي وتوت وجلاب', nameAr: 'شراب تمر هندي وتوت وجلاب', nameEn: 'Tamarind & Jallab Syrups', image: 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&w=400&q=80', isActive: true, sortOrder: 3 },

  // الحلويات والمربيات
  { id: 'sub-sweet-baklava', subcategoryId: 'sub-sweet-baklava', categoryId: 'sweets-biscuits', name: 'بقلاوة وبرازق ومعمول', nameAr: 'بقلاوة وبرازق ومعمول', nameEn: 'Baklava, Barazek & Maamoul', image: 'https://images.unsplash.com/photo-1579372786545-d24232daf58c?auto=format&fit=crop&w=400&q=80', isActive: true, sortOrder: 1 },
  { id: 'sub-sweet-raha', subcategoryId: 'sub-sweet-raha', categoryId: 'sweets-biscuits', name: 'راحة الحلقوم وغزل البنات', nameAr: 'راحة الحلقوم وغزل البنات', nameEn: 'Turkish Delight & Halva', image: 'https://images.unsplash.com/photo-1582293041079-7814c2f12063?auto=format&fit=crop&w=400&q=80', isActive: true, sortOrder: 2 },
  { id: 'sub-sweet-jams', subcategoryId: 'sub-sweet-jams', categoryId: 'honey-jams-oriental', name: 'مربى القرع والباذنجان وعسل سدر', nameAr: 'مربى القرع والباذنجان وعسل سدر', nameEn: 'Syrian Jams & Natural Honey', image: 'https://images.unsplash.com/photo-1587314168485-3236d6710814?auto=format&fit=crop&w=400&q=80', isActive: true, sortOrder: 1 },

  // صابون ومستلزمات
  { id: 'sub-soap-laurel', subcategoryId: 'sub-soap-laurel', categoryId: 'cleaning-soaps', name: 'صابون غار حلبي طبيعي', nameAr: 'صابون غار حلبي طبيعي', nameEn: 'Aleppo Laurel Soap', image: 'https://images.unsplash.com/photo-1600857544200-b2f666a9a2ec?auto=format&fit=crop&w=400&q=80', isActive: true, sortOrder: 1 },
  { id: 'sub-kitchen-copper', subcategoryId: 'sub-kitchen-copper', categoryId: 'home-kitchen', name: 'ركوات نحاس وقوالب معمول وفخار', nameAr: 'ركوات نحاس وقوالب معمول وفخار', nameEn: 'Copper Cezve & Kitchenware', image: 'https://images.unsplash.com/photo-1584990347449-a29288e404b8?auto=format&fit=crop&w=400&q=80', isActive: true, sortOrder: 1 }
];
