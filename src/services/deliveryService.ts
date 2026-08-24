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
import { City, Branch, DeliveryZone } from '../types';

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
    nameAr: 'غرايفسفالد - إيلدينا وفيك ولاديبو',
    nameDe: 'Greifswald Eldena, Wieck & Ladebow',
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
}

export const deliveryService = new DeliveryService();
