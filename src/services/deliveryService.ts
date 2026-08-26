import { 
  getDocs, 
  getDoc, 
  doc, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where,
  onSnapshot,
  Unsubscribe
} from 'firebase/firestore';
import { db, collections } from './firebaseConfig';
import { City, Branch, DeliveryZone, CityArea, DeliveryStreet } from '../types';

// Default initial city
export const DEFAULT_CITY: City = {
  id: 'greifswald',
  nameAr: 'غرايفسفالد',
  nameDe: 'Greifswald',
  nameEn: 'Greifswald',
  isActive: true,
  createdAt: '2026-08-01'
};

// Default initial branch
export const DEFAULT_BRANCH: Branch = {
  id: 'branch-greifswald-main',
  cityId: 'greifswald',
  nameAr: 'فرع غرايفسفالد الرئيسي',
  nameDe: 'Hauptfiliale Greifswald',
  nameEn: 'Greifswald Main Branch',
  address: 'Lange Reihe 24, 17489 Greifswald',
  phone: '+49 176 12345678',
  isActive: true,
  isDefault: true,
  createdAt: '2026-08-01'
};

// Standard initial PLZ delivery zones for Greifswald and surrounding area
export const DEFAULT_DELIVERY_ZONES: DeliveryZone[] = [
  {
    id: 'zone-17489',
    cityId: 'greifswald',
    branchId: 'branch-greifswald-main',
    plz: '17489',
    nameAr: 'غرايفسفالد - المركز والميناء والبلدة القديمة',
    nameDe: 'Greifswald Innenstadt / Hafen / Fleischervorstadt',
    isActive: true,
    estimatedTime: '30 - 45 دقيقة',
    createdAt: '2026-08-01'
  },
  {
    id: 'zone-17491',
    cityId: 'greifswald',
    branchId: 'branch-greifswald-main',
    plz: '17491',
    nameAr: 'غرايفسفالد - شونفالده الأولى والثانية',
    nameDe: 'Greifswald Schönwalde I & II',
    isActive: true,
    estimatedTime: '30 - 50 دقيقة',
    createdAt: '2026-08-01'
  },
  {
    id: 'zone-17493',
    cityId: 'greifswald',
    branchId: 'branch-greifswald-main',
    plz: '17493',
    nameAr: 'غرايفسفالد - إيلدينا وفيك ولاديبو وريمس',
    nameDe: 'Greifswald Eldena, Wieck, Ladebow & Riems',
    isActive: true,
    estimatedTime: '35 - 55 دقيقة',
    createdAt: '2026-08-01'
  },
  {
    id: 'zone-17498',
    cityId: 'greifswald',
    branchId: 'branch-greifswald-main',
    plz: '17498',
    nameAr: 'غرايفسفالد ومحيطها - نوينكيرشن وفاكيرو وفايتنهاغن',
    nameDe: 'Greifswald Umland (Neuenkirchen, Wackerow, Weitenhagen)',
    isActive: true,
    estimatedTime: '40 - 60 دقيقة',
    createdAt: '2026-08-01'
  },
  {
    id: 'zone-17495',
    cityId: 'greifswald',
    branchId: 'branch-greifswald-main',
    plz: '17495',
    nameAr: 'محيط غرايفسفالد - كارلسبورغ وتسوسو ورانتسين',
    nameDe: 'Greifswald Umland Süd (Karlsburg, Züssow, Ranzin)',
    isActive: true,
    estimatedTime: '45 - 65 دقيقة',
    createdAt: '2026-08-01'
  }
];

// Supported City Areas / Districts in Greifswald & Vicinity
export const DEFAULT_CITY_AREAS: CityArea[] = [
  {
    id: 'schonwalde',
    cityId: 'greifswald',
    nameAr: 'شونفالده (Schönwalde I & II)',
    nameDe: 'Schönwalde I & II',
    plz: '17491',
    isActive: true,
    sortOrder: 1
  },
  {
    id: 'wieck',
    cityId: 'greifswald',
    nameAr: 'فيك والميناء (Wieck)',
    nameDe: 'Wieck',
    plz: '17493',
    isActive: true,
    sortOrder: 2
  },
  {
    id: 'riems',
    cityId: 'greifswald',
    nameAr: 'جزيرة ريمس (Insel Riems)',
    nameDe: 'Insel Riems',
    plz: '17493',
    isActive: true,
    sortOrder: 3
  },
  {
    id: 'innenstadt',
    cityId: 'greifswald',
    nameAr: 'المركز والبلدة القديمة (Innenstadt / Zentrum)',
    nameDe: 'Innenstadt / Fleischervorstadt',
    plz: '17489',
    isActive: true,
    sortOrder: 4
  },
  {
    id: 'eldena-ladebow',
    cityId: 'greifswald',
    nameAr: 'إيلدينا ولاديبو (Eldena & Ladebow)',
    nameDe: 'Eldena & Ladebow',
    plz: '17493',
    isActive: true,
    sortOrder: 5
  },
  {
    id: 'neuenkirchen',
    cityId: 'greifswald',
    nameAr: 'نوينكيرشن (Neuenkirchen)',
    nameDe: 'Neuenkirchen b. Greifswald',
    plz: '17498',
    isActive: true,
    sortOrder: 6
  },
  {
    id: 'wackerow',
    cityId: 'greifswald',
    nameAr: 'فاكيرو (Wackerow)',
    nameDe: 'Wackerow',
    plz: '17498',
    isActive: true,
    sortOrder: 7
  },
  {
    id: 'weitenhagen',
    cityId: 'greifswald',
    nameAr: 'فايتنهاغن (Weitenhagen)',
    nameDe: 'Weitenhagen',
    plz: '17498',
    isActive: true,
    sortOrder: 8
  },
  {
    id: 'karlsburg-zussow',
    cityId: 'greifswald',
    nameAr: 'كارلسبورغ وتسوسو (Karlsburg & Züssow)',
    nameDe: 'Karlsburg, Züssow & Ranzin',
    plz: '17495',
    isActive: true,
    sortOrder: 9
  }
];

// Verified Real Streets for each Supported City Area in Greifswald & Vicinity
export const DEFAULT_DELIVERY_STREETS: DeliveryStreet[] = [
  // 1. Schönwalde (17491)
  { name: 'Makarenkostraße', cityAreaId: 'schonwalde', plz: '17491', cityId: 'greifswald', zoneNameAr: 'شونفالده الثانية' },
  { name: 'Hans-Beimler-Straße', cityAreaId: 'schonwalde', plz: '17491', cityId: 'greifswald', zoneNameAr: 'شونفالده الأولى' },
  { name: 'Karl-Liebknecht-Ring', cityAreaId: 'schonwalde', plz: '17491', cityId: 'greifswald', zoneNameAr: 'شونفالده الأولى' },
  { name: 'Ernst-Thälmann-Ring', cityAreaId: 'schonwalde', plz: '17491', cityId: 'greifswald', zoneNameAr: 'شونفالده الأولى' },
  { name: 'Anklamer Straße', cityAreaId: 'schonwalde', plz: '17491', cityId: 'greifswald', zoneNameAr: 'الجنوب وشونفالده' },
  { name: 'Tolstoistraße', cityAreaId: 'schonwalde', plz: '17491', cityId: 'greifswald', zoneNameAr: 'شونفالده الثانية' },
  { name: 'Pappelallee', cityAreaId: 'schonwalde', plz: '17491', cityId: 'greifswald', zoneNameAr: 'الجنوب وشونفالده' },
  { name: 'Dubnaring', cityAreaId: 'schonwalde', plz: '17491', cityId: 'greifswald', zoneNameAr: 'شونفالده الثانية' },
  { name: 'Schönwalder Landstraße', cityAreaId: 'schonwalde', plz: '17491', cityId: 'greifswald', zoneNameAr: 'شونفالده' },
  { name: 'Koitenhäger Landstraße', cityAreaId: 'schonwalde', plz: '17491', cityId: 'greifswald', zoneNameAr: 'الجنوب الشرقي' },
  { name: 'Paul-Suhr-Straße', cityAreaId: 'schonwalde', plz: '17491', cityId: 'greifswald', zoneNameAr: 'شونفالده' },
  { name: 'Heinrich-Hertz-Straße', cityAreaId: 'schonwalde', plz: '17491', cityId: 'greifswald', zoneNameAr: 'المنطقة العلمية' },
  { name: 'Einsteinstraße', cityAreaId: 'schonwalde', plz: '17491', cityId: 'greifswald', zoneNameAr: 'شونفالده الأولى' },
  { name: 'Erich-Weinert-Straße', cityAreaId: 'schonwalde', plz: '17491', cityId: 'greifswald', zoneNameAr: 'شونفالده الأولى' },
  { name: 'Otto-Grotewohl-Straße', cityAreaId: 'schonwalde', plz: '17491', cityId: 'greifswald', zoneNameAr: 'شونفالده الثانية' },
  { name: 'Max-Planck-Straße', cityAreaId: 'schonwalde', plz: '17491', cityId: 'greifswald', zoneNameAr: 'المنطقة التكنولوجية' },
  { name: 'Johannes-Stelling-Straße', cityAreaId: 'schonwalde', plz: '17491', cityId: 'greifswald', zoneNameAr: 'شونفالده' },

  // 2. Wieck (17493)
  { name: 'Dorfstraße', cityAreaId: 'wieck', plz: '17493', cityId: 'greifswald', zoneNameAr: 'فيك والميناء' },
  { name: 'Yachtweg', cityAreaId: 'wieck', plz: '17493', cityId: 'greifswald', zoneNameAr: 'فيك' },
  { name: 'Am Ryck', cityAreaId: 'wieck', plz: '17493', cityId: 'greifswald', zoneNameAr: 'فيك ونهر ريك' },
  { name: 'Boddenweg', cityAreaId: 'wieck', plz: '17493', cityId: 'greifswald', zoneNameAr: 'فيك وإيلدينا' },
  { name: 'Ladebower Chaussee', cityAreaId: 'wieck', plz: '17493', cityId: 'greifswald', zoneNameAr: 'فيك ولاديبو' },
  { name: 'Rosenstraße', cityAreaId: 'wieck', plz: '17493', cityId: 'greifswald', zoneNameAr: 'فيك' },
  { name: 'Strandweg', cityAreaId: 'wieck', plz: '17493', cityId: 'greifswald', zoneNameAr: 'شاطئ فيك' },
  { name: 'Kirchstraße', cityAreaId: 'wieck', plz: '17493', cityId: 'greifswald', zoneNameAr: 'كنيسة فيك' },
  { name: 'Fischerstraße', cityAreaId: 'wieck', plz: '17493', cityId: 'greifswald', zoneNameAr: 'قرية الصيادين فيك' },
  { name: 'Wilhelm-Holtz-Straße', cityAreaId: 'wieck', plz: '17493', cityId: 'greifswald', zoneNameAr: 'فيك' },

  // 3. Insel Riems (17493)
  { name: 'An der Wiek', cityAreaId: 'riems', plz: '17493', cityId: 'greifswald', zoneNameAr: 'جزيرة ريمس' },
  { name: 'Boddenblick', cityAreaId: 'riems', plz: '17493', cityId: 'greifswald', zoneNameAr: 'جزيرة ريمس' },
  { name: 'Hauptstraße', cityAreaId: 'riems', plz: '17493', cityId: 'greifswald', zoneNameAr: 'جزيرة ريمس' },
  { name: 'Riemser Weg', cityAreaId: 'riems', plz: '17493', cityId: 'greifswald', zoneNameAr: 'طريق ريمس' },
  { name: 'Am Hafen Riems', cityAreaId: 'riems', plz: '17493', cityId: 'greifswald', zoneNameAr: 'ميناء ريمس' },
  { name: 'Sundpromenade', cityAreaId: 'riems', plz: '17493', cityId: 'greifswald', zoneNameAr: 'كورنيش ريمس' },
  { name: 'Zum Hafen', cityAreaId: 'riems', plz: '17493', cityId: 'greifswald', zoneNameAr: 'مرفأ ريمس' },

  // 4. Innenstadt & Fleischervorstadt (17489)
  { name: 'Lange Straße', cityAreaId: 'innenstadt', plz: '17489', cityId: 'greifswald', zoneNameAr: 'البلدة القديمة والمركز' },
  { name: 'Lange Reihe', cityAreaId: 'innenstadt', plz: '17489', cityId: 'greifswald', zoneNameAr: 'الميناء والبلدة القديمة' },
  { name: 'Domstraße', cityAreaId: 'innenstadt', plz: '17489', cityId: 'greifswald', zoneNameAr: 'مركز المدينة' },
  { name: 'Fleischmacherstraße', cityAreaId: 'innenstadt', plz: '17489', cityId: 'greifswald', zoneNameAr: 'مركز المدينة' },
  { name: 'Knopfstraße', cityAreaId: 'innenstadt', plz: '17489', cityId: 'greifswald', zoneNameAr: 'البلدة القديمة' },
  { name: 'Steinbeckerstraße', cityAreaId: 'innenstadt', plz: '17489', cityId: 'greifswald', zoneNameAr: 'البلدة القديمة' },
  { name: 'Schuhhagen', cityAreaId: 'innenstadt', plz: '17489', cityId: 'greifswald', zoneNameAr: 'وسط البلد' },
  { name: 'Baderstraße', cityAreaId: 'innenstadt', plz: '17489', cityId: 'greifswald', zoneNameAr: 'وسط البلد' },
  { name: 'Fischstraße', cityAreaId: 'innenstadt', plz: '17489', cityId: 'greifswald', zoneNameAr: 'البلدة القديمة' },
  { name: 'Bachstraße', cityAreaId: 'innenstadt', plz: '17489', cityId: 'greifswald', zoneNameAr: 'فلايشر فورشتات' },
  { name: 'Rakower Straße', cityAreaId: 'innenstadt', plz: '17489', cityId: 'greifswald', zoneNameAr: 'فلايشر فورشتات' },
  { name: 'Marienstraße', cityAreaId: 'innenstadt', plz: '17489', cityId: 'greifswald', zoneNameAr: 'مركز المدينة' },
  { name: 'Am Hafen', cityAreaId: 'innenstadt', plz: '17489', cityId: 'greifswald', zoneNameAr: 'الميناء' },
  { name: 'Stralsunder Straße', cityAreaId: 'innenstadt', plz: '17489', cityId: 'greifswald', zoneNameAr: 'شمال غرايفسفالد' },
  { name: 'Friedrich-Loeffler-Straße', cityAreaId: 'innenstadt', plz: '17489', cityId: 'greifswald', zoneNameAr: 'المركز والجامعة' },
  { name: 'Grimmer Straße', cityAreaId: 'innenstadt', plz: '17489', cityId: 'greifswald', zoneNameAr: 'غرب غرايفسفالد' },
  { name: 'Brandteichstraße', cityAreaId: 'innenstadt', plz: '17489', cityId: 'greifswald', zoneNameAr: 'المنطقة الصناعية' },
  { name: 'Fleischerstraße', cityAreaId: 'innenstadt', plz: '17489', cityId: 'greifswald', zoneNameAr: 'فلايشر فورشتات' },
  { name: 'Brinkstraße', cityAreaId: 'innenstadt', plz: '17489', cityId: 'greifswald', zoneNameAr: 'فلايشر فورشتات' },
  { name: 'Gützkower Straße', cityAreaId: 'innenstadt', plz: '17489', cityId: 'greifswald', zoneNameAr: 'الجنوب الغربي' },
  { name: 'Mühlenstraße', cityAreaId: 'innenstadt', plz: '17489', cityId: 'greifswald', zoneNameAr: 'البلدة القديمة' },
  { name: 'Brüggstraße', cityAreaId: 'innenstadt', plz: '17489', cityId: 'greifswald', zoneNameAr: 'البلدة القديمة' },
  { name: 'Roßmühlenstraße', cityAreaId: 'innenstadt', plz: '17489', cityId: 'greifswald', zoneNameAr: 'المركز' },
  { name: 'Wollweberstraße', cityAreaId: 'innenstadt', plz: '17489', cityId: 'greifswald', zoneNameAr: 'البلدة القديمة' },
  { name: 'Loefflerstraße', cityAreaId: 'innenstadt', plz: '17489', cityId: 'greifswald', zoneNameAr: 'المركز' },
  { name: 'Hansering', cityAreaId: 'innenstadt', plz: '17489', cityId: 'greifswald', zoneNameAr: 'حزام المركز والميناء' },
  { name: 'Rotgerberstraße', cityAreaId: 'innenstadt', plz: '17489', cityId: 'greifswald', zoneNameAr: 'البلدة القديمة' },
  { name: 'Martin-Luther-Straße', cityAreaId: 'innenstadt', plz: '17489', cityId: 'greifswald', zoneNameAr: 'المركز' },
  { name: 'Kapaunenstraße', cityAreaId: 'innenstadt', plz: '17489', cityId: 'greifswald', zoneNameAr: 'البلدة القديمة' },
  { name: 'Kuhstraße', cityAreaId: 'innenstadt', plz: '17489', cityId: 'greifswald', zoneNameAr: 'البلدة القديمة' },

  // 5. Eldena & Ladebow (17493)
  { name: 'Wolgaster Straße', cityAreaId: 'eldena-ladebow', plz: '17493', cityId: 'greifswald', zoneNameAr: 'إيلدينا' },
  { name: 'Hainstraße', cityAreaId: 'eldena-ladebow', plz: '17493', cityId: 'greifswald', zoneNameAr: 'إيلدينا' },
  { name: 'Max-Reimann-Straße', cityAreaId: 'eldena-ladebow', plz: '17493', cityId: 'greifswald', zoneNameAr: 'لاديبو' },
  { name: 'Am Mühlenberg', cityAreaId: 'eldena-ladebow', plz: '17493', cityId: 'greifswald', zoneNameAr: 'إيلدينا' },
  { name: 'Boddenweg', cityAreaId: 'eldena-ladebow', plz: '17493', cityId: 'greifswald', zoneNameAr: 'إيلدينا وفيك' },
  { name: 'Klosterbruch', cityAreaId: 'eldena-ladebow', plz: '17493', cityId: 'greifswald', zoneNameAr: 'إيلدينا ودير إيلدينا' },
  { name: 'Vorm Ausbau', cityAreaId: 'eldena-ladebow', plz: '17493', cityId: 'greifswald', zoneNameAr: 'إيلدينا' },
  { name: 'Am Elisenhain', cityAreaId: 'eldena-ladebow', plz: '17493', cityId: 'greifswald', zoneNameAr: 'إيلدينا' },
  { name: 'Hafenstraße Ladebow', cityAreaId: 'eldena-ladebow', plz: '17493', cityId: 'greifswald', zoneNameAr: 'ميناء لاديبو' },
  { name: 'Mönchgutweg', cityAreaId: 'eldena-ladebow', plz: '17493', cityId: 'greifswald', zoneNameAr: 'إيلدينا' },

  // 6. Neuenkirchen (17498)
  { name: 'Marktplatz', cityAreaId: 'neuenkirchen', plz: '17498', cityId: 'greifswald', zoneNameAr: 'نوينكيرشن' },
  { name: 'Chausseestraße', cityAreaId: 'neuenkirchen', plz: '17498', cityId: 'greifswald', zoneNameAr: 'نوينكيرشن' },
  { name: 'Theodor-Körner-Straße', cityAreaId: 'neuenkirchen', plz: '17498', cityId: 'greifswald', zoneNameAr: 'نوينكيرشن' },
  { name: 'Wampener Straße', cityAreaId: 'neuenkirchen', plz: '17498', cityId: 'greifswald', zoneNameAr: 'طريق فامبن' },
  { name: 'Kiesweg', cityAreaId: 'neuenkirchen', plz: '17498', cityId: 'greifswald', zoneNameAr: 'نوينكيرشن' },
  { name: 'Lindenstraße', cityAreaId: 'neuenkirchen', plz: '17498', cityId: 'greifswald', zoneNameAr: 'نوينكيرشن' },
  { name: 'Gewerbegebiet', cityAreaId: 'neuenkirchen', plz: '17498', cityId: 'greifswald', zoneNameAr: 'المنطقة التجارية نوينكيرشن' },
  { name: 'Am Sportplatz', cityAreaId: 'neuenkirchen', plz: '17498', cityId: 'greifswald', zoneNameAr: 'الملعب نوينكيرشن' },
  { name: 'Dorfstraße', cityAreaId: 'neuenkirchen', plz: '17498', cityId: 'greifswald', zoneNameAr: 'قرية نوينكيرشن' },

  // 7. Wackerow (17498)
  { name: 'Wackerower Weg', cityAreaId: 'wackerow', plz: '17498', cityId: 'greifswald', zoneNameAr: 'طريق فاكيرو' },
  { name: 'Dorfstraße', cityAreaId: 'wackerow', plz: '17498', cityId: 'greifswald', zoneNameAr: 'قرية فاكيرو' },
  { name: 'Steffenshagener Weg', cityAreaId: 'wackerow', plz: '17498', cityId: 'greifswald', zoneNameAr: 'طريق شتيفنسهاغن' },
  { name: 'Dreizehnhausen', cityAreaId: 'wackerow', plz: '17498', cityId: 'greifswald', zoneNameAr: 'درايتسينهاوزن' },
  { name: 'Lindenallee', cityAreaId: 'wackerow', plz: '17498', cityId: 'greifswald', zoneNameAr: 'فاكيرو' },
  { name: 'Jarmshagener Weg', cityAreaId: 'wackerow', plz: '17498', cityId: 'greifswald', zoneNameAr: 'طريق يارمسهاغن' },

  // 8. Weitenhagen (17498)
  { name: 'Lindenstraße', cityAreaId: 'weitenhagen', plz: '17498', cityId: 'greifswald', zoneNameAr: 'شارع الليندن فايتنهاغن' },
  { name: 'Hauptstraße', cityAreaId: 'weitenhagen', plz: '17498', cityId: 'greifswald', zoneNameAr: 'الشارع الرئيسي فايتنهاغن' },
  { name: 'Am Waldrand', cityAreaId: 'weitenhagen', plz: '17498', cityId: 'greifswald', zoneNameAr: 'حافة الغابة فايتنهاغن' },
  { name: 'Forstweg', cityAreaId: 'weitenhagen', plz: '17498', cityId: 'greifswald', zoneNameAr: 'طريق الغابة' },
  { name: 'Dorfstraße', cityAreaId: 'weitenhagen', plz: '17498', cityId: 'greifswald', zoneNameAr: 'قرية فايتنهاغن' },
  { name: 'Potthäger Weg', cityAreaId: 'weitenhagen', plz: '17498', cityId: 'greifswald', zoneNameAr: 'طريق بوثاغن' },
  { name: 'Helmshäger Weg', cityAreaId: 'weitenhagen', plz: '17498', cityId: 'greifswald', zoneNameAr: 'طريق هيلمسهاغن' },

  // 9. Karlsburg & Züssow (17495)
  { name: 'Bahnhofstraße', cityAreaId: 'karlsburg-zussow', plz: '17495', cityId: 'greifswald', zoneNameAr: 'شارع المحطة تسوسو' },
  { name: 'Hauptstraße', cityAreaId: 'karlsburg-zussow', plz: '17495', cityId: 'greifswald', zoneNameAr: 'الشارع الرئيسي كارلسبورغ' },
  { name: 'Schulstraße', cityAreaId: 'karlsburg-zussow', plz: '17495', cityId: 'greifswald', zoneNameAr: 'شارع المدرسة' },
  { name: 'Lindenallee', cityAreaId: 'karlsburg-zussow', plz: '17495', cityId: 'greifswald', zoneNameAr: 'شارع الأشجار كارلسبورغ' },
  { name: 'Gutshof', cityAreaId: 'karlsburg-zussow', plz: '17495', cityId: 'greifswald', zoneNameAr: 'قصر كارلسبورغ' },
  { name: 'Zarnekower Straße', cityAreaId: 'karlsburg-zussow', plz: '17495', cityId: 'greifswald', zoneNameAr: 'طريق تسارنكوف' },
  { name: 'Ranziner Straße', cityAreaId: 'karlsburg-zussow', plz: '17495', cityId: 'greifswald', zoneNameAr: 'طريق رانتسين' }
];


export interface PlzValidationResult {
  isValid: boolean;
  zone?: DeliveryZone;
  branch?: Branch;
  city?: City;
  messageAr: string;
  messageDe: string;
}

export const OUT_OF_SERVICE_MESSAGE = {
  titleAr: 'التوصيل متاح حاليًا في Greifswald',
  textAr: 'شكرًا لاهتمامك بـ Barakamarkt24. نخدم الآن مدينة Greifswald فقط حتى نضمن سرعة التوصيل وجودة الطلب. إذا كنت خارج المدينة، يمكنك تصفح المنتجات، وسنعمل على التوسع لفروع ومناطق أقرب إليك في المستقبل.',
  buttonAr: 'تعديل الرمز البريدي',
  titleDe: 'Lieferung derzeit nur in Greifswald',
  textDe: 'Vielen Dank für Ihr Interesse an Barakamarkt24. Aktuell liefern wir nur in Greifswald – so können wir schnelle Lieferung und gute Qualität sicherstellen. Wenn Sie außerhalb wohnen, können Sie die Produkte trotzdem ansehen. Eine Erweiterung in weitere Gebiete ist für die Zukunft geplant.',
  buttonDe: 'PLZ ändern'
};

class DeliveryService {
  private localZonesCache: DeliveryZone[] = [];
  private localBranchCache: Branch = DEFAULT_BRANCH;
  private localCityCache: City = DEFAULT_CITY;

  // Normalize German postal code (5 digits, trimmed)
  cleanPlz(rawPlz: string): string {
    if (!rawPlz) return '';
    return rawPlz.trim().replace(/\s+/g, '');
  }

  // ==========================================
  // 1. Cities (Firestore 'cities')
  // ==========================================
  async getCities(): Promise<City[]> {
    try {
      const snap = await getDocs(collections.cities);
      if (!snap.empty) {
        return snap.docs.map(d => ({
          ...d.data(),
          id: d.id
        } as City));
      } else {
        // Bootstrap Greifswald city
        const cityRef = doc(collections.cities, DEFAULT_CITY.id);
        await setDoc(cityRef, DEFAULT_CITY, { merge: true });
        return [DEFAULT_CITY];
      }
    } catch (e) {
      console.warn('Error fetching cities from Firestore, using default:', e);
      return [DEFAULT_CITY];
    }
  }

  // ==========================================
  // 2. Branches (Firestore 'branches')
  // ==========================================
  async getBranches(cityId: string = 'greifswald'): Promise<Branch[]> {
    try {
      const snap = await getDocs(collections.branches);
      if (!snap.empty) {
        const branches = snap.docs.map(d => ({
          ...d.data(),
          id: d.id
        } as Branch));
        if (cityId) {
          const filtered = branches.filter(b => b.cityId === cityId);
          if (filtered.length > 0) return filtered;
        }
        return branches;
      } else {
        // Bootstrap main Greifswald branch
        const branchRef = doc(collections.branches, DEFAULT_BRANCH.id);
        await setDoc(branchRef, DEFAULT_BRANCH, { merge: true });
        return [DEFAULT_BRANCH];
      }
    } catch (e) {
      console.warn('Error fetching branches from Firestore, using default:', e);
      return [DEFAULT_BRANCH];
    }
  }

  async getDefaultBranch(): Promise<Branch> {
    const branches = await this.getBranches('greifswald');
    const defaultBranch = branches.find(b => b.isDefault && b.isActive) || branches[0] || DEFAULT_BRANCH;
    this.localBranchCache = defaultBranch;
    return defaultBranch;
  }

  // ==========================================
  // 3. Delivery Zones (Firestore 'deliveryZones')
  // ==========================================
  async getDeliveryZones(cityId: string = 'greifswald'): Promise<DeliveryZone[]> {
    try {
      const snap = await getDocs(collections.deliveryZones);
      if (!snap.empty) {
        const zones = snap.docs.map(d => ({
          ...d.data(),
          id: d.id
        } as DeliveryZone));
        
        const filtered = cityId ? zones.filter(z => z.cityId === cityId) : zones;
        this.localZonesCache = filtered.length > 0 ? filtered : zones;
        return this.localZonesCache;
      } else {
        // Bootstrap initial delivery zones
        for (const zone of DEFAULT_DELIVERY_ZONES) {
          const zoneRef = doc(collections.deliveryZones, zone.id);
          await setDoc(zoneRef, zone, { merge: true });
        }
        this.localZonesCache = DEFAULT_DELIVERY_ZONES;
        return DEFAULT_DELIVERY_ZONES;
      }
    } catch (e) {
      console.warn('Error fetching delivery zones from Firestore, using defaults:', e);
      this.localZonesCache = DEFAULT_DELIVERY_ZONES;
      return DEFAULT_DELIVERY_ZONES;
    }
  }

  // Real-time listener for delivery zones
  subscribeToDeliveryZones(callback: (zones: DeliveryZone[]) => void): Unsubscribe {
    try {
      return onSnapshot(collections.deliveryZones, (snapshot) => {
        if (!snapshot.empty) {
          const zones = snapshot.docs.map(d => ({
            ...d.data(),
            id: d.id
          } as DeliveryZone));
          this.localZonesCache = zones;
          callback(zones);
        } else {
          // If empty in Firestore, trigger bootstrap then callback
          this.getDeliveryZones().then(zones => callback(zones));
        }
      }, (err) => {
        console.warn('Realtime delivery zones listener error:', err);
        callback(DEFAULT_DELIVERY_ZONES);
      });
    } catch (e) {
      console.warn('Failed to attach delivery zones listener:', e);
      return () => {};
    }
  }

  // ==========================================
  // 4. Validate Postal Code (PLZ Validation)
  // ==========================================
  async validatePlz(rawPlz: string): Promise<PlzValidationResult> {
    const plz = this.cleanPlz(rawPlz);
    if (!plz) {
      return {
        isValid: false,
        messageAr: 'يرجى إدخال الرمز البريدي (PLZ)',
        messageDe: 'Bitte geben Sie eine Postleitzahl (PLZ) ein'
      };
    }

    let zones = this.localZonesCache;
    if (!zones || zones.length === 0) {
      zones = await this.getDeliveryZones();
    }

    // Match exact PLZ with an active zone
    const matchedZone = zones.find(z => z.plz === plz && z.isActive !== false);

    if (matchedZone) {
      const branch = await this.getDefaultBranch();
      const city = DEFAULT_CITY;
      return {
        isValid: true,
        zone: matchedZone,
        branch,
        city,
        messageAr: `الرمز البريدي ${plz} مشمول في منطقة التوصيل (${matchedZone.nameAr || matchedZone.nameDe || 'غرايفسفالد'})`,
        messageDe: `PLZ ${plz} befindet sich im Liefergebiet (${matchedZone.nameDe || 'Greifswald'})`
      };
    }

    // Outside active delivery zones
    return {
      isValid: false,
      messageAr: OUT_OF_SERVICE_MESSAGE.textAr,
      messageDe: OUT_OF_SERVICE_MESSAGE.textDe
    };
  }

  // ==========================================
  // 5. Admin Management Methods
  // ==========================================
  async addDeliveryZone(data: Omit<DeliveryZone, 'id' | 'createdAt'>): Promise<DeliveryZone | null> {
    try {
      const cleanPlz = this.cleanPlz(data.plz);
      const zoneId = `zone-${cleanPlz || Date.now()}`;
      const docRef = doc(collections.deliveryZones, zoneId);
      
      const newZone: DeliveryZone = {
        ...data,
        id: zoneId,
        plz: cleanPlz,
        cityId: data.cityId || 'greifswald',
        branchId: data.branchId || 'branch-greifswald-main',
        isActive: data.isActive !== false,
        createdAt: new Date().toISOString()
      };

      await setDoc(docRef, newZone, { merge: true });
      return newZone;
    } catch (e) {
      console.error('Error adding delivery zone:', e);
      return null;
    }
  }

  async updateDeliveryZone(zoneId: string, updates: Partial<DeliveryZone>): Promise<boolean> {
    try {
      const docRef = doc(collections.deliveryZones, zoneId);
      const payload: Record<string, any> = {
        ...updates,
        updatedAt: new Date().toISOString()
      };
      if (updates.plz) {
        payload.plz = this.cleanPlz(updates.plz);
      }
      await updateDoc(docRef, payload);
      return true;
    } catch (e) {
      console.error('Error updating delivery zone:', e);
      return false;
    }
  }

  async toggleDeliveryZoneActive(zoneId: string, currentActive: boolean): Promise<boolean> {
    try {
      const docRef = doc(collections.deliveryZones, zoneId);
      await updateDoc(docRef, { 
        isActive: !currentActive,
        updatedAt: new Date().toISOString()
      });
      return true;
    } catch (e) {
      console.error('Error toggling delivery zone status:', e);
      return false;
    }
  }

  async deleteDeliveryZone(zoneId: string): Promise<boolean> {
    try {
      const docRef = doc(collections.deliveryZones, zoneId);
      await deleteDoc(docRef);
      return true;
    } catch (e) {
      console.error('Error deleting delivery zone:', e);
      return false;
    }
  }

  async updateBranch(branchId: string, updates: Partial<Branch>): Promise<boolean> {
    try {
      const docRef = doc(collections.branches, branchId);
      await updateDoc(docRef, {
        ...updates,
        updatedAt: new Date().toISOString()
      });
      return true;
    } catch (e) {
      console.error('Error updating branch:', e);
      return false;
    }
  }

  // ==========================================
  // 6. City Areas & Street Autocomplete Logic
  // ==========================================
  getCityAreas(): CityArea[] {
    return DEFAULT_CITY_AREAS.filter(a => a.isActive);
  }

  getAreaById(cityAreaId: string): CityArea | undefined {
    return DEFAULT_CITY_AREAS.find(a => a.id === cityAreaId);
  }

  getAreaByPlz(plz: string): CityArea | undefined {
    const clean = this.cleanPlz(plz);
    return DEFAULT_CITY_AREAS.find(a => a.plz === clean);
  }

  getStreetsForArea(cityAreaId: string, queryText?: string): DeliveryStreet[] {
    if (!cityAreaId) return [];
    
    // Filter strictly by the selected city area ID
    const areaStreets = DEFAULT_DELIVERY_STREETS.filter(s => s.cityAreaId === cityAreaId);
    
    if (!queryText || !queryText.trim()) {
      return areaStreets;
    }

    const cleanQuery = queryText.trim().toLowerCase();
    return areaStreets.filter(s => 
      s.name.toLowerCase().includes(cleanQuery) ||
      (s.zoneNameAr && s.zoneNameAr.toLowerCase().includes(cleanQuery))
    );
  }

  isStreetValidForArea(streetName: string, cityAreaId: string): boolean {
    if (!streetName || !cityAreaId) return false;
    const cleanStreet = streetName.trim().toLowerCase();
    const areaStreets = DEFAULT_DELIVERY_STREETS.filter(s => s.cityAreaId === cityAreaId);
    return areaStreets.some(s => s.name.toLowerCase() === cleanStreet);
  }
}

export const deliveryService = new DeliveryService();
