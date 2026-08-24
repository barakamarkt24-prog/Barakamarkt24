import React, { useState, useEffect } from 'react';
import { 
  MapPin, 
  Plus, 
  Edit3, 
  Trash2, 
  Check, 
  X, 
  Building2, 
  Navigation, 
  Truck, 
  ShieldCheck, 
  AlertCircle, 
  Sparkles,
  ToggleLeft,
  ToggleRight,
  Clock,
  DollarSign
} from 'lucide-react';
import { City, Branch, DeliveryZone } from '../../types';
import { deliveryService, DEFAULT_CITY, DEFAULT_BRANCH } from '../../services/deliveryService';
import { useApp } from '../../context/AppContext';

export const AdminDeliveryManagement: React.FC = () => {
  const { showToast, currencySymbol, storeSettings } = useApp();

  const [cities, setCities] = useState<City[]>([DEFAULT_CITY]);
  const [branches, setBranches] = useState<Branch[]>([DEFAULT_BRANCH]);
  const [zones, setZones] = useState<DeliveryZone[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Modal State for Add/Edit Delivery Zone
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingZone, setEditingZone] = useState<DeliveryZone | null>(null);

  // Form Fields
  const [formPlz, setFormPlz] = useState<string>('');
  const [formNameAr, setFormNameAr] = useState<string>('');
  const [formNameDe, setFormNameDe] = useState<string>('');
  const [formBranchId, setFormBranchId] = useState<string>(DEFAULT_BRANCH.id);
  const [formCityId, setFormCityId] = useState<string>(DEFAULT_CITY.id);
  const [formDeliveryFee, setFormDeliveryFee] = useState<string>('');
  const [formMinOrderAmount, setFormMinOrderAmount] = useState<string>('');
  const [formEstimatedTime, setFormEstimatedTime] = useState<string>('30 - 45 دقيقة');
  const [formIsActive, setFormIsActive] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);

  // Initial load & real-time subscription
  useEffect(() => {
    let unsubscribe: () => void = () => {};

    const loadInitialData = async () => {
      setIsLoading(true);
      try {
        const [loadedCities, loadedBranches] = await Promise.all([
          deliveryService.getCities(),
          deliveryService.getBranches()
        ]);
        setCities(loadedCities);
        setBranches(loadedBranches);

        // Realtime subscription to delivery zones
        unsubscribe = deliveryService.subscribeToDeliveryZones((updatedZones) => {
          setZones(updatedZones);
          setIsLoading(false);
        });
      } catch (err) {
        console.error('Error loading delivery management data:', err);
        setIsLoading(false);
      }
    };

    loadInitialData();

    return () => {
      unsubscribe();
    };
  }, []);

  const handleOpenAddModal = () => {
    setEditingZone(null);
    setFormPlz('');
    setFormNameAr('');
    setFormNameDe('');
    setFormBranchId(branches[0]?.id || DEFAULT_BRANCH.id);
    setFormCityId(cities[0]?.id || DEFAULT_CITY.id);
    setFormDeliveryFee('');
    setFormMinOrderAmount('');
    setFormEstimatedTime('30 - 45 دقيقة');
    setFormIsActive(true);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (zone: DeliveryZone) => {
    setEditingZone(zone);
    setFormPlz(zone.plz);
    setFormNameAr(zone.nameAr || '');
    setFormNameDe(zone.nameDe || '');
    setFormBranchId(zone.branchId || DEFAULT_BRANCH.id);
    setFormCityId(zone.cityId || DEFAULT_CITY.id);
    setFormDeliveryFee(zone.deliveryFee !== undefined ? zone.deliveryFee.toString() : '');
    setFormMinOrderAmount(zone.minOrderAmount !== undefined ? zone.minOrderAmount.toString() : '');
    setFormEstimatedTime(zone.estimatedTime || '30 - 45 دقيقة');
    setFormIsActive(zone.isActive !== false);
    setIsModalOpen(true);
  };

  const handleSaveZone = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanPlz = deliveryService.cleanPlz(formPlz);

    if (!cleanPlz || cleanPlz.length < 4) {
      showToast('يرجى إدخال رمز بريدي (PLZ) صحيح');
      return;
    }

    if (!formNameAr.trim() && !formNameDe.trim()) {
      showToast('يرجى كتابة اسم المنطقة بالعربية أو الألمانية');
      return;
    }

    setIsSaving(true);
    try {
      const payload = {
        cityId: formCityId || DEFAULT_CITY.id,
        branchId: formBranchId || DEFAULT_BRANCH.id,
        plz: cleanPlz,
        nameAr: formNameAr.trim() || `منطقة ${cleanPlz}`,
        nameDe: formNameDe.trim() || `Bezirk ${cleanPlz}`,
        isActive: formIsActive,
        deliveryFee: formDeliveryFee.trim() ? parseFloat(formDeliveryFee) : undefined,
        minOrderAmount: formMinOrderAmount.trim() ? parseFloat(formMinOrderAmount) : undefined,
        estimatedTime: formEstimatedTime.trim() || '30 - 45 دقيقة'
      };

      if (editingZone) {
        await deliveryService.updateDeliveryZone(editingZone.id, payload);
        showToast(`تم تحديث منطقة التوصيل ${cleanPlz} بنجاح`);
      } else {
        await deliveryService.addDeliveryZone(payload);
        showToast(`تمت إضافة منطقة التوصيل ${cleanPlz} بنجاح`);
      }

      setIsModalOpen(false);
    } catch (err) {
      console.error(err);
      showToast('حدث خطأ أثناء حفظ منطقة التوصيل');
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleActive = async (zone: DeliveryZone) => {
    try {
      await deliveryService.toggleDeliveryZoneActive(zone.id, zone.isActive !== false);
      showToast(zone.isActive ? `تم تعطيل منطقة التوصيل ${zone.plz}` : `تم تفعيل منطقة التوصيل ${zone.plz}`);
    } catch (err) {
      console.error(err);
      showToast('فشل تغيير حالة التفعيل');
    }
  };

  const handleDeleteZone = async (zone: DeliveryZone) => {
    if (!window.confirm(`هل أنت متأكد من رغبتك بحذف الرمز البريدي ${zone.plz} من مناطق التوصيل؟`)) {
      return;
    }
    try {
      await deliveryService.deleteDeliveryZone(zone.id);
      showToast(`تم حذف الرمز البريدي ${zone.plz} بنجاح`);
    } catch (err) {
      console.error(err);
      showToast('فشل حذف منطقة التوصيل');
    }
  };

  const activeZonesCount = zones.filter(z => z.isActive !== false).length;
  const currentCity = cities[0] || DEFAULT_CITY;
  const currentBranch = branches[0] || DEFAULT_BRANCH;

  return (
    <div className="space-y-6" dir="rtl">
      
      {/* 1. Location & Branch Architecture Header Card */}
      <div className="bg-gradient-to-l from-emerald-950 via-stone-900 to-stone-900 text-white p-5 rounded-3xl border border-stone-800 shadow-md">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-emerald-800 text-amber-300 flex items-center justify-center font-bold">
                <MapPin className="w-4 h-4" />
              </div>
              <h2 className="font-black text-base text-white">إدارة المدن والفروع ومناطق التوصيل (Greifswald)</h2>
            </div>
            <p className="text-xs text-stone-400">
              النظام الحالي مخصص لمدينة <strong className="text-white">Greifswald (غرايفسفالد)</strong> عبر فرع المتجر الرئيسي.
            </p>
          </div>

          <button
            onClick={handleOpenAddModal}
            className="bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-black px-4 py-2.5 rounded-2xl flex items-center gap-2 cursor-pointer shadow-md transition-all active:scale-95 shrink-0 self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>إضافة رمز بريدي (PLZ) جديد</span>
          </button>
        </div>
      </div>

      {/* 2. City & Branch Overview Bento Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        
        {/* Active City Card */}
        <div className="bg-white p-4.5 rounded-3xl border border-stone-200/80 shadow-2xs space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-2xl bg-emerald-50 text-emerald-800 flex items-center justify-center border border-emerald-100">
                <Building2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-extrabold text-xs text-stone-900">المدينة المعتمدة حالياً</h3>
                <span className="text-[10px] text-stone-400">Operating City</span>
              </div>
            </div>
            <span className="bg-emerald-50 text-emerald-800 text-[10px] font-bold px-2.5 py-1 rounded-full border border-emerald-200/60 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse"></span>
              مدينة نشطة
            </span>
          </div>

          <div className="bg-stone-50 p-3 rounded-2xl border border-stone-200/60 text-xs space-y-1.5">
            <div className="flex justify-between items-center text-stone-700">
              <span>اسم المدينة:</span>
              <strong className="text-stone-900 font-bold">{currentCity.nameAr} ({currentCity.nameDe})</strong>
            </div>
            <div className="flex justify-between items-center text-stone-700">
              <span>معرّف المدينة في النظام:</span>
              <span className="font-mono text-[11px] text-emerald-800 font-bold bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100">{currentCity.id}</span>
            </div>
            <div className="flex justify-between items-center text-stone-700">
              <span>المناطق البريدية المغطاة:</span>
              <span className="font-bold text-stone-900">{activeZonesCount} رموز بريدية نشطة</span>
            </div>
          </div>
        </div>

        {/* Default Fulfillment Branch Card */}
        <div className="bg-white p-4.5 rounded-3xl border border-stone-200/80 shadow-2xs space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-2xl bg-amber-50 text-amber-800 flex items-center justify-center border border-amber-100">
                <Truck className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-extrabold text-xs text-stone-900">الفرع المسؤول عن التجهيز والتوصيل</h3>
                <span className="text-[10px] text-stone-400">Fulfillment Branch</span>
              </div>
            </div>
            <span className="bg-amber-50 text-amber-800 text-[10px] font-bold px-2.5 py-1 rounded-full border border-amber-200/60 flex items-center gap-1">
              الفرع الافتراضي الرئيسي
            </span>
          </div>

          <div className="bg-stone-50 p-3 rounded-2xl border border-stone-200/60 text-xs space-y-1.5">
            <div className="flex justify-between items-center text-stone-700">
              <span>اسم الفرع:</span>
              <strong className="text-stone-900 font-bold">{currentBranch.nameAr}</strong>
            </div>
            <div className="flex justify-between items-center text-stone-700">
              <span>العنوان:</span>
              <span className="text-stone-800 font-medium">{currentBranch.address || 'Greifswald, Deutschland'}</span>
            </div>
            <div className="flex justify-between items-center text-stone-700">
              <span>هاتف الفرع:</span>
              <span className="font-mono text-[11px] text-stone-900 font-bold" dir="ltr">{currentBranch.phone || '+49 176 12345678'}</span>
            </div>
          </div>
        </div>

      </div>

      {/* 3. Delivery Zones & Postal Codes List */}
      <div className="bg-white p-5 rounded-3xl border border-stone-200/80 shadow-2xs space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2 border-b border-stone-100 pb-3">
          <div>
            <h3 className="font-extrabold text-sm text-stone-900 flex items-center gap-1.5">
              <Navigation className="w-4 h-4 text-emerald-800" />
              <span>الرموز البريدية ومناطق التوصيل المسموحة (PLZ Delivery Zones)</span>
            </h3>
            <p className="text-[11px] text-stone-500">
              الزبائن في هذه الرموز البريدية فقط يمكنهم إتمام الطلب والدفع، بينما يُتاح للآخرين تصفح المنتجات.
            </p>
          </div>
          
          <div className="flex items-center gap-2">
            <span className="text-xs bg-stone-100 text-stone-700 font-bold px-3 py-1.5 rounded-xl border border-stone-200 font-sans">
              {activeZonesCount} من {zones.length} مفعلة
            </span>
          </div>
        </div>

        {/* Zones Table / List */}
        {isLoading ? (
          <div className="p-8 text-center text-xs text-stone-400">جاري تحميل مناطق التوصيل من Firebase...</div>
        ) : zones.length === 0 ? (
          <div className="p-8 text-center text-xs text-stone-500 space-y-2">
            <AlertCircle className="w-8 h-8 text-stone-400 mx-auto" />
            <p>لا توجد مناطق توصيل مسجلة حالياً.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {zones.map((zone) => {
              const isActive = zone.isActive !== false;
              const fee = zone.deliveryFee !== undefined ? zone.deliveryFee : storeSettings.deliveryFee;
              const minSpend = zone.minOrderAmount !== undefined ? zone.minOrderAmount : storeSettings.minOrderAmount;

              return (
                <div 
                  key={zone.id}
                  className={`p-4 rounded-2xl border transition-all ${
                    isActive 
                      ? 'bg-white border-stone-200 hover:border-emerald-300 shadow-2xs' 
                      : 'bg-stone-50 border-dashed border-stone-300 opacity-60'
                  }`}
                >
                  {/* Top Bar: PLZ Badge & Status */}
                  <div className="flex items-center justify-between gap-2 pb-2 border-b border-stone-100">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm font-black bg-emerald-900 text-white px-2.5 py-0.5 rounded-lg shadow-2xs">
                        {zone.plz}
                      </span>
                      <span className="text-[10px] text-stone-500 font-medium">PLZ</span>
                    </div>

                    <button
                      onClick={() => handleToggleActive(zone)}
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1 cursor-pointer transition-colors ${
                        isActive 
                          ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' 
                          : 'bg-rose-50 text-rose-700 border border-rose-200'
                      }`}
                      title={isActive ? 'انقر للتعطيل' : 'انقر للتفعيل'}
                    >
                      {isActive ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
                      <span>{isActive ? 'نشطة' : 'معطلة'}</span>
                    </button>
                  </div>

                  {/* Zone Names */}
                  <div className="space-y-1 py-2.5">
                    <h4 className="font-extrabold text-xs text-stone-900 line-clamp-1" title={zone.nameAr}>
                      {zone.nameAr || `منطقة ${zone.plz}`}
                    </h4>
                    {zone.nameDe && (
                      <p className="text-[11px] text-stone-500 font-sans line-clamp-1" title={zone.nameDe}>
                        {zone.nameDe}
                      </p>
                    )}
                  </div>

                  {/* Zone Rates & Timing Details */}
                  <div className="bg-stone-50 p-2 rounded-xl text-[10px] text-stone-600 space-y-1 mb-3">
                    <div className="flex justify-between items-center">
                      <span className="flex items-center gap-1">
                        <Truck className="w-3 h-3 text-stone-400" />
                        <span>رسوم التوصيل:</span>
                      </span>
                      <strong className="font-sans font-bold text-stone-900">
                        {zone.deliveryFee !== undefined ? `${currencySymbol || '€'}${zone.deliveryFee.toFixed(2)} (مخصص)` : `${currencySymbol || '€'}${fee.toFixed(2)} (عام)`}
                      </strong>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="flex items-center gap-1">
                        <DollarSign className="w-3 h-3 text-stone-400" />
                        <span>الحد الأدنى للطلب:</span>
                      </span>
                      <strong className="font-sans font-bold text-stone-900">
                        {zone.minOrderAmount !== undefined ? `${currencySymbol || '€'}${zone.minOrderAmount.toFixed(2)} (مخصص)` : `${currencySymbol || '€'}${minSpend.toFixed(2)} (عام)`}
                      </strong>
                    </div>

                    {zone.estimatedTime && (
                      <div className="flex justify-between items-center">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3 text-stone-400" />
                          <span>الوقت المقدر:</span>
                        </span>
                        <span className="text-stone-800 font-bold">{zone.estimatedTime}</span>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-end gap-1.5 pt-1 border-t border-stone-100">
                    <button
                      onClick={() => handleOpenEditModal(zone)}
                      className="px-2.5 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl text-[11px] font-bold flex items-center gap-1 cursor-pointer transition-colors"
                    >
                      <Edit3 className="w-3 h-3" />
                      <span>تعديل</span>
                    </button>
                    <button
                      onClick={() => handleDeleteZone(zone)}
                      className="p-1.5 text-stone-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl cursor-pointer transition-colors"
                      title="حذف المنطقة"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 4. MODAL: Add / Edit Delivery Zone */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4" dir="rtl">
          <div className="bg-white rounded-3xl max-w-lg w-full p-5 space-y-4 shadow-2xl border border-stone-200">
            
            <div className="flex justify-between items-center border-b border-stone-100 pb-2.5">
              <h3 className="font-extrabold text-sm text-stone-900 flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-emerald-800" />
                <span>{editingZone ? `تعديل منطقة التوصيل (${formPlz})` : 'إضافة رمز بريدي / منطقة توصيل جديدة'}</span>
              </h3>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="text-stone-400 hover:text-stone-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveZone} className="space-y-3.5 text-xs">
              
              {/* Postal Code PLZ */}
              <div className="space-y-1">
                <label className="font-bold text-stone-700 flex items-center gap-1">
                  <span>الرمز البريدي (PLZ) *</span>
                  <span className="text-[10px] text-stone-400 font-normal">(5 أرقام في ألمانيا)</span>
                </label>
                <input
                  type="text"
                  required
                  maxLength={5}
                  placeholder="مثال: 17489"
                  value={formPlz}
                  onChange={(e) => setFormPlz(e.target.value.replace(/\D/g, ''))}
                  className="w-full bg-stone-50 border border-stone-200 rounded-xl p-2.5 font-mono text-sm font-black focus:border-emerald-700 focus:bg-white outline-hidden"
                />
              </div>

              {/* Area Name in Arabic */}
              <div className="space-y-1">
                <label className="font-bold text-stone-700">اسم المنطقة بالعربية *</label>
                <input
                  type="text"
                  required
                  placeholder="مثال: غرايفسفالد - البلدة القديمة والميناء"
                  value={formNameAr}
                  onChange={(e) => setFormNameAr(e.target.value)}
                  className="w-full bg-stone-50 border border-stone-200 rounded-xl p-2.5 font-bold focus:border-emerald-700 focus:bg-white outline-hidden"
                />
              </div>

              {/* Area Name in German */}
              <div className="space-y-1">
                <label className="font-bold text-stone-700">الاسم بالألمانية (Deutscher Name)</label>
                <input
                  type="text"
                  placeholder="z.B. Greifswald Innenstadt & Hafen"
                  value={formNameDe}
                  onChange={(e) => setFormNameDe(e.target.value)}
                  className="w-full bg-stone-50 border border-stone-200 rounded-xl p-2.5 font-sans focus:border-emerald-700 focus:bg-white outline-hidden"
                />
              </div>

              {/* Branch Link */}
              <div className="space-y-1">
                <label className="font-bold text-stone-700">الفرع المسؤول عن التوصيل</label>
                <select
                  value={formBranchId}
                  onChange={(e) => setFormBranchId(e.target.value)}
                  className="w-full bg-stone-50 border border-stone-200 rounded-xl p-2.5 font-bold focus:border-emerald-700 outline-hidden cursor-pointer"
                >
                  {branches.map(b => (
                    <option key={b.id} value={b.id}>
                      {b.nameAr} ({b.nameDe})
                    </option>
                  ))}
                </select>
              </div>

              {/* Custom Delivery Fee & Minimum Order */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-stone-700">
                    <span>رسوم التوصيل (€)</span>
                    <span className="text-[9px] text-stone-400 block">اتركه فارغاً لاعتماد الإعداد العام (€{storeSettings.deliveryFee.toFixed(2)})</span>
                  </label>
                  <input
                    type="number"
                    step="0.10"
                    min="0"
                    placeholder={`الافتراضي: ${storeSettings.deliveryFee.toFixed(2)}`}
                    value={formDeliveryFee}
                    onChange={(e) => setFormDeliveryFee(e.target.value)}
                    className="w-full bg-stone-50 border border-stone-200 rounded-xl p-2.5 font-sans font-bold focus:border-emerald-700 outline-hidden"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-stone-700">
                    <span>الحد الأدنى للطلب (€)</span>
                    <span className="text-[9px] text-stone-400 block">اتركه فارغاً لاعتماد الإعداد العام (€{storeSettings.minOrderAmount.toFixed(2)})</span>
                  </label>
                  <input
                    type="number"
                    step="1"
                    min="0"
                    placeholder={`الافتراضي: ${storeSettings.minOrderAmount.toFixed(2)}`}
                    value={formMinOrderAmount}
                    onChange={(e) => setFormMinOrderAmount(e.target.value)}
                    className="w-full bg-stone-50 border border-stone-200 rounded-xl p-2.5 font-sans font-bold focus:border-emerald-700 outline-hidden"
                  />
                </div>
              </div>

              {/* Estimated Delivery Time & Active Status */}
              <div className="grid grid-cols-2 gap-3 items-end">
                <div className="space-y-1">
                  <label className="font-bold text-stone-700">مدة التوصيل التقريبية</label>
                  <input
                    type="text"
                    placeholder="30 - 45 دقيقة"
                    value={formEstimatedTime}
                    onChange={(e) => setFormEstimatedTime(e.target.value)}
                    className="w-full bg-stone-50 border border-stone-200 rounded-xl p-2.5 font-bold focus:border-emerald-700 outline-hidden"
                  />
                </div>

                <div className="flex items-center gap-2 bg-stone-50 p-2.5 rounded-xl border border-stone-200">
                  <input
                    type="checkbox"
                    id="zoneActiveToggle"
                    checked={formIsActive}
                    onChange={(e) => setFormIsActive(e.target.checked)}
                    className="w-4 h-4 text-emerald-800 accent-emerald-800 rounded-sm cursor-pointer"
                  />
                  <label htmlFor="zoneActiveToggle" className="font-bold text-stone-700 cursor-pointer">
                    منطقة مفعلة للطلب
                  </label>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 pt-3 border-t border-stone-100">
                <button
                  type="submit"
                  disabled={isSaving}
                  className="flex-1 bg-emerald-800 hover:bg-emerald-900 text-white font-bold py-2.5 rounded-xl cursor-pointer shadow-md transition-colors disabled:opacity-50"
                >
                  {isSaving ? 'جاري الحفظ...' : editingZone ? 'حفظ تعديلات المنطقة' : 'إضافة المنطقة إلى Firebase'}
                </button>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold rounded-xl cursor-pointer"
                >
                  إلغاء
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
};
