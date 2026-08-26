import React, { useState, useMemo } from 'react';
import { 
  DollarSign, 
  Calendar, 
  CalendarDays, 
  CalendarRange, 
  Layers, 
  Trash2, 
  AlertTriangle, 
  RotateCcw, 
  ShoppingBag, 
  CheckCircle2, 
  Clock, 
  User, 
  Phone, 
  MapPin, 
  CreditCard, 
  ChevronDown, 
  ChevronUp, 
  Receipt,
  FileSpreadsheet,
  XCircle,
  Eye,
  EyeOff
} from 'lucide-react';
import { Order } from '../../types';

export type SalesPeriodFilter = 'none' | 'today' | 'month' | 'year' | 'all';

interface AdminSalesManagerProps {
  orders: Order[];
  currencySymbol: string;
  onRefresh: () => void;
  onDeleteSale: (orderId: string) => Promise<void>;
  onDeleteAllSales: () => Promise<void>;
  showToast: (msg: string) => void;
}

// Helper to safely parse order date
export const getOrderDate = (order: Order): Date => {
  const dateStr = order.deliveredAt || order.timestamp || order.createdAt;
  if (!dateStr) return new Date(0);
  const parsed = new Date(dateStr);
  return isNaN(parsed.getTime()) ? new Date(0) : parsed;
};

// Date comparison helpers
export const isSameDay = (d1: Date, d2: Date): boolean => {
  return (
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate()
  );
};

export const isSameMonth = (d1: Date, d2: Date): boolean => {
  return (
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth()
  );
};

export const isSameYear = (d1: Date, d2: Date): boolean => {
  return d1.getFullYear() === d2.getFullYear();
};

export const isOrderToday = (order: Order): boolean => {
  const d = getOrderDate(order);
  return isSameDay(d, new Date());
};

export const isOrderThisMonth = (order: Order): boolean => {
  const d = getOrderDate(order);
  return isSameMonth(d, new Date());
};

export const isOrderThisYear = (order: Order): boolean => {
  const d = getOrderDate(order);
  return isSameYear(d, new Date());
};

export const AdminSalesManager: React.FC<AdminSalesManagerProps> = ({
  orders,
  currencySymbol = '€',
  onRefresh,
  onDeleteSale,
  onDeleteAllSales,
  showToast
}) => {
  // Period filter state - default is 'none' so that old records are not rendered by default
  const [selectedPeriod, setSelectedPeriod] = useState<SalesPeriodFilter>('none');
  
  // Expanded sales order items
  const [expandedSaleIds, setExpandedSaleIds] = useState<Set<string>>(new Set());
  
  // Single delete state & Modal
  const [deletingSaleId, setDeletingSaleId] = useState<string | null>(null);
  const [saleToDelete, setSaleToDelete] = useState<Order | null>(null);
  
  // Bulk delete state & Modal
  const [isBulkDeleteModalOpen, setIsBulkDeleteModalOpen] = useState<boolean>(false);
  const [isDeletingBulk, setIsDeletingBulk] = useState<boolean>(false);

  // 1. Strictly filter only completed / delivered sales (ignore cancelled, preparing, on the way, etc.)
  const deliveredSales = useMemo(() => {
    return orders.filter(ord => ord.status === 'delivered');
  }, [orders]);

  // Current timestamp references
  const now = new Date();

  // 2. Compute Summary Metrics (Today, Month, Year, All)
  const salesMetrics = useMemo(() => {
    let todayCount = 0;
    let todayTotal = 0;

    let monthCount = 0;
    let monthTotal = 0;

    let yearCount = 0;
    let yearTotal = 0;

    let allCount = 0;
    let allTotal = 0;

    deliveredSales.forEach(order => {
      const orderDate = getOrderDate(order);
      const val = order.total || 0;

      allCount += 1;
      allTotal += val;

      if (isSameYear(orderDate, now)) {
        yearCount += 1;
        yearTotal += val;

        if (isSameMonth(orderDate, now)) {
          monthCount += 1;
          monthTotal += val;

          if (isSameDay(orderDate, now)) {
            todayCount += 1;
            todayTotal += val;
          }
        }
      }
    });

    return {
      today: { count: todayCount, total: todayTotal },
      month: { count: monthCount, total: monthTotal },
      year: { count: yearCount, total: yearTotal },
      all: { count: allCount, total: allTotal }
    };
  }, [deliveredSales]);

  // 3. Filter displayed list based on active period
  const displayedSales = useMemo(() => {
    if (selectedPeriod === 'none') {
      return [];
    }

    return deliveredSales.filter(order => {
      const orderDate = getOrderDate(order);
      if (selectedPeriod === 'today') {
        return isSameDay(orderDate, now);
      }
      if (selectedPeriod === 'month') {
        return isSameMonth(orderDate, now);
      }
      if (selectedPeriod === 'year') {
        return isSameYear(orderDate, now);
      }
      if (selectedPeriod === 'all') {
        return true;
      }
      return false;
    }).sort((a, b) => {
      const dateA = getOrderDate(a).getTime();
      const dateB = getOrderDate(b).getTime();
      return dateB - dateA; // Most recent first
    });
  }, [deliveredSales, selectedPeriod]);

  // Toggle order items details
  const toggleSaleExpand = (id: string) => {
    setExpandedSaleIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  // Trigger single sale delete confirmation
  const handleRequestDeleteSingle = (order: Order) => {
    setSaleToDelete(order);
  };

  // Confirm single sale deletion
  const handleConfirmDeleteSingle = async () => {
    if (!saleToDelete) return;
    const targetId = saleToDelete.id;
    setDeletingSaleId(targetId);
    try {
      await onDeleteSale(targetId);
      setSaleToDelete(null);
    } finally {
      setDeletingSaleId(null);
    }
  };

  // Confirm bulk sales deletion
  const handleConfirmBulkDelete = async () => {
    setIsDeletingBulk(true);
    try {
      await onDeleteAllSales();
      setIsBulkDeleteModalOpen(false);
      setSelectedPeriod('none');
    } finally {
      setIsDeletingBulk(false);
    }
  };

  const getPeriodTitle = () => {
    switch (selectedPeriod) {
      case 'today':
        return 'مبيعات اليوم';
      case 'month':
        return 'مبيعات الشهر الحالي';
      case 'year':
        return 'مبيعات السنة الحالية';
      case 'all':
        return 'سجل كل المبيعات المكتملة';
      default:
        return '';
    }
  };

  return (
    <div className="space-y-5" dir="rtl">
      
      {/* 1. Header & Quick Controls */}
      <div className="bg-white p-4 sm:p-5 rounded-3xl border border-stone-200/80 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3.5">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
              <DollarSign className="w-5 h-5 text-emerald-700" />
            </div>
            <h3 className="font-extrabold text-base text-stone-900">المبيعات</h3>
            <span className="bg-emerald-50 text-emerald-800 text-[11px] font-bold px-2.5 py-0.5 rounded-full border border-emerald-200">
              الطلبات المسلمة والمكتملة فقط ({deliveredSales.length})
            </span>
          </div>
          <p className="text-xs text-stone-500 font-medium leading-relaxed">
            متابعة إيرادات المتجر الدقيقة محسوبة حصرياً من الطلبات المسلمة فعلياً (delivered) مع عزل الطلبات قيد التحضير والملغاة.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap self-end sm:self-center">
          {/* Refresh Button */}
          <button
            type="button"
            onClick={onRefresh}
            title="تحديث البيانات"
            className="text-xs font-bold text-stone-700 bg-stone-100 hover:bg-stone-200 px-3 py-2 rounded-xl flex items-center gap-1.5 cursor-pointer transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">تحديث</span>
          </button>

          {/* Reset / Delete All Sales Button */}
          {deliveredSales.length > 0 && (
            <button
              type="button"
              onClick={() => setIsBulkDeleteModalOpen(true)}
              className="text-xs font-black text-rose-700 hover:text-rose-900 bg-rose-50 hover:bg-rose-100 border border-rose-200 px-3.5 py-2 rounded-xl flex items-center gap-1.5 cursor-pointer transition-colors shadow-2xs"
              title="تصفير وحذف سجل المبيعات للمرحلة التجريبية"
            >
              <Trash2 className="w-3.5 h-3.5 text-rose-600" />
              <span>حذف سجل المبيعات</span>
            </button>
          )}
        </div>
      </div>

      {/* 2. Three Primary Summary Cards (Always Visible by Default, Clean & Lightweight) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        
        {/* Card 1: Today's Sales */}
        <div 
          onClick={() => setSelectedPeriod(selectedPeriod === 'today' ? 'none' : 'today')}
          className={`p-4.5 rounded-3xl border transition-all cursor-pointer shadow-2xs space-y-2 ${
            selectedPeriod === 'today'
              ? 'bg-emerald-50/80 border-emerald-400 ring-2 ring-emerald-500/20'
              : 'bg-white border-stone-200/80 hover:border-emerald-300 hover:bg-emerald-50/20'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-stone-600 flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-emerald-700" />
              <span>مبيعات اليوم</span>
            </span>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
              selectedPeriod === 'today' ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-stone-100 text-stone-600 border-stone-200'
            }`}>
              {selectedPeriod === 'today' ? 'معروض الآن ✓' : 'عرض التفاصيل'}
            </span>
          </div>

          <div className="flex items-baseline justify-between pt-1">
            <div className="font-black text-2xl text-emerald-800 font-sans">
              {currencySymbol}{salesMetrics.today.total.toFixed(2)}
            </div>
            <div className="text-xs text-stone-500 font-medium">
              <strong className="text-stone-900 font-sans">{salesMetrics.today.count}</strong> طلب مكتمل
            </div>
          </div>
        </div>

        {/* Card 2: Month's Sales */}
        <div 
          onClick={() => setSelectedPeriod(selectedPeriod === 'month' ? 'none' : 'month')}
          className={`p-4.5 rounded-3xl border transition-all cursor-pointer shadow-2xs space-y-2 ${
            selectedPeriod === 'month'
              ? 'bg-blue-50/80 border-blue-400 ring-2 ring-blue-500/20'
              : 'bg-white border-stone-200/80 hover:border-blue-300 hover:bg-blue-50/20'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-stone-600 flex items-center gap-1.5">
              <CalendarDays className="w-4 h-4 text-blue-700" />
              <span>مبيعات الشهر</span>
            </span>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
              selectedPeriod === 'month' ? 'bg-blue-600 text-white border-blue-600' : 'bg-stone-100 text-stone-600 border-stone-200'
            }`}>
              {selectedPeriod === 'month' ? 'معروض الآن ✓' : 'عرض التفاصيل'}
            </span>
          </div>

          <div className="flex items-baseline justify-between pt-1">
            <div className="font-black text-2xl text-blue-900 font-sans">
              {currencySymbol}{salesMetrics.month.total.toFixed(2)}
            </div>
            <div className="text-xs text-stone-500 font-medium">
              <strong className="text-stone-900 font-sans">{salesMetrics.month.count}</strong> طلب مكتمل
            </div>
          </div>
        </div>

        {/* Card 3: Year's Sales */}
        <div 
          onClick={() => setSelectedPeriod(selectedPeriod === 'year' ? 'none' : 'year')}
          className={`p-4.5 rounded-3xl border transition-all cursor-pointer shadow-2xs space-y-2 ${
            selectedPeriod === 'year'
              ? 'bg-amber-50/80 border-amber-400 ring-2 ring-amber-500/20'
              : 'bg-white border-stone-200/80 hover:border-amber-300 hover:bg-amber-50/20'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-stone-600 flex items-center gap-1.5">
              <CalendarRange className="w-4 h-4 text-amber-700" />
              <span>مبيعات السنة</span>
            </span>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
              selectedPeriod === 'year' ? 'bg-amber-600 text-white border-amber-600' : 'bg-stone-100 text-stone-600 border-stone-200'
            }`}>
              {selectedPeriod === 'year' ? 'معروض الآن ✓' : 'عرض التفاصيل'}
            </span>
          </div>

          <div className="flex items-baseline justify-between pt-1">
            <div className="font-black text-2xl text-amber-900 font-sans">
              {currencySymbol}{salesMetrics.year.total.toFixed(2)}
            </div>
            <div className="text-xs text-stone-500 font-medium">
              <strong className="text-stone-900 font-sans">{salesMetrics.year.count}</strong> طلب مكتمل
            </div>
          </div>
        </div>

      </div>

      {/* 3. Filter Selection Bar (4 Distinct Buttons) */}
      <div className="bg-white p-3 rounded-2xl border border-stone-200/80 shadow-2xs flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-xs font-bold text-stone-500 ml-1">تحديد الفترة:</span>
          
          <button
            type="button"
            onClick={() => setSelectedPeriod('today')}
            className={`text-xs font-bold px-3.5 py-1.5 rounded-xl cursor-pointer transition-all flex items-center gap-1.5 border ${
              selectedPeriod === 'today'
                ? 'bg-emerald-800 text-white border-emerald-800 shadow-2xs'
                : 'bg-stone-50 text-stone-700 border-stone-200 hover:bg-stone-100'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>مبيعات اليوم ({salesMetrics.today.count})</span>
          </button>

          <button
            type="button"
            onClick={() => setSelectedPeriod('month')}
            className={`text-xs font-bold px-3.5 py-1.5 rounded-xl cursor-pointer transition-all flex items-center gap-1.5 border ${
              selectedPeriod === 'month'
                ? 'bg-blue-800 text-white border-blue-800 shadow-2xs'
                : 'bg-stone-50 text-stone-700 border-stone-200 hover:bg-stone-100'
            }`}
          >
            <CalendarDays className="w-3.5 h-3.5" />
            <span>مبيعات الشهر ({salesMetrics.month.count})</span>
          </button>

          <button
            type="button"
            onClick={() => setSelectedPeriod('year')}
            className={`text-xs font-bold px-3.5 py-1.5 rounded-xl cursor-pointer transition-all flex items-center gap-1.5 border ${
              selectedPeriod === 'year'
                ? 'bg-amber-800 text-white border-amber-800 shadow-2xs'
                : 'bg-stone-50 text-stone-700 border-stone-200 hover:bg-stone-100'
            }`}
          >
            <CalendarRange className="w-3.5 h-3.5" />
            <span>مبيعات السنة ({salesMetrics.year.count})</span>
          </button>

          <button
            type="button"
            onClick={() => setSelectedPeriod('all')}
            className={`text-xs font-bold px-3.5 py-1.5 rounded-xl cursor-pointer transition-all flex items-center gap-1.5 border ${
              selectedPeriod === 'all'
                ? 'bg-purple-800 text-white border-purple-800 shadow-2xs'
                : 'bg-stone-50 text-stone-700 border-stone-200 hover:bg-stone-100'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>كل المبيعات ({salesMetrics.all.count})</span>
          </button>
        </div>

        {selectedPeriod !== 'none' && (
          <button
            type="button"
            onClick={() => setSelectedPeriod('none')}
            className="text-xs font-bold text-stone-500 hover:text-stone-800 px-2.5 py-1 rounded-lg cursor-pointer transition-colors flex items-center gap-1"
            title="إخفاء قائمة المبيعات التفصيلية"
          >
            <EyeOff className="w-3.5 h-3.5" />
            <span>إخفاء القائمة</span>
          </button>
        )}
      </div>

      {/* 4. Display Selected Sales List (Only when a period is explicitly chosen) */}
      {selectedPeriod !== 'none' && (
        <div className="space-y-3 pt-1">
          
          {/* Section Header with count and total for selected period */}
          <div className="flex items-center justify-between flex-wrap gap-2 px-1">
            <div className="flex items-center gap-2">
              <h4 className="font-black text-sm text-stone-900">{getPeriodTitle()}</h4>
              <span className="bg-stone-100 text-stone-700 text-xs font-bold px-2 py-0.5 rounded-md font-sans">
                {displayedSales.length} طلب مكتمل
              </span>
            </div>

            <div className="text-xs font-bold text-stone-600">
              إجمالي القيمة: <strong className="text-emerald-800 font-sans text-sm font-black">{currencySymbol}{displayedSales.reduce((acc, curr) => acc + (curr.total || 0), 0).toFixed(2)}</strong>
            </div>
          </div>

          {/* Empty State for the chosen period */}
          {displayedSales.length === 0 ? (
            <div className="bg-white p-8 rounded-3xl border border-dashed border-stone-300 text-center space-y-2.5 shadow-2xs">
              <div className="w-12 h-12 rounded-2xl bg-stone-100 text-stone-400 flex items-center justify-center mx-auto">
                <Receipt className="w-6 h-6" />
              </div>
              <h5 className="text-xs font-black text-stone-800">لا توجد مبيعات مكتملة في هذه الفترة</h5>
              <p className="text-[11px] text-stone-500 max-w-sm mx-auto">
                لم يتم تسجيل أي طلبات مسلّمة (delivered) خلال {getPeriodTitle().toLowerCase()}. عند تسليم الطلبات للعملاء ستظهر تلقائياً هنا.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {displayedSales.map((sale) => {
                const isExpanded = expandedSaleIds.has(sale.id);
                const orderDate = getOrderDate(sale);
                const isDeletingThis = deletingSaleId === sale.id;

                return (
                  <div 
                    key={sale.id}
                    className="bg-white rounded-3xl border border-stone-200/90 shadow-2xs p-4 sm:p-5 space-y-3 transition-all hover:border-stone-300"
                  >
                    {/* Top Row: Order ID, Date, Amount, and Actions */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-2.5 border-b border-stone-100">
                      <div className="flex items-center gap-2.5 flex-wrap">
                        <span className="font-mono font-black text-xs text-stone-900 bg-stone-100 px-2.5 py-1 rounded-xl border border-stone-200">
                          #{sale.orderId || sale.id.slice(0, 8)}
                        </span>

                        <span className="bg-emerald-50 text-emerald-900 text-[11px] font-bold px-2.5 py-0.5 rounded-lg border border-emerald-200 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3 text-emerald-700" />
                          <span>مسلّم ومكتمل</span>
                        </span>

                        <span className="text-[11px] text-stone-500 font-medium flex items-center gap-1 font-sans">
                          <Clock className="w-3 h-3 text-stone-400" />
                          <span>{orderDate.toLocaleDateString('ar-EG', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                        </span>
                      </div>

                      <div className="flex items-center gap-2.5 self-end sm:self-center">
                        <span className="font-black text-base text-emerald-800 font-sans">
                          {currencySymbol}{sale.total.toFixed(2)}
                        </span>

                        {/* Single Sale Delete Button */}
                        <button
                          type="button"
                          disabled={isDeletingThis}
                          onClick={() => handleRequestDeleteSingle(sale)}
                          title="حذف سجل المبيعات هذا نهائياً"
                          className="text-[11px] font-bold text-rose-700 hover:text-rose-900 bg-rose-50 hover:bg-rose-100 border border-rose-200 px-2.5 py-1.2 rounded-xl cursor-pointer transition-colors flex items-center gap-1 shadow-2xs disabled:opacity-50"
                        >
                          <Trash2 className="w-3 h-3 text-rose-600" />
                          <span>حذف السجل</span>
                        </button>
                      </div>
                    </div>

                    {/* Middle Row: Customer Info & Payment Details */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-stone-600">
                      <div className="flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                        <span className="font-bold text-stone-900">{sale.customerName || sale.customerInfo?.fullName || 'عميل'}</span>
                        <span className="text-stone-400 font-sans">({sale.phone || sale.customerInfo?.phone || 'بدون هاتف'})</span>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <CreditCard className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                        <span>
                          {sale.paymentMethod === 'card' ? 'بطاقة بنكية' : sale.paymentMethod === 'paypal' ? 'PayPal' : sale.paymentMethod === 'bank_transfer' ? 'تحويل بنكي' : 'دفع عند الاستلام'}
                        </span>
                        <span className="text-[10px] text-stone-400">({sale.paymentStatus === 'paid' ? 'مدفوع' : 'مكتمل'})</span>
                      </div>

                      <div className="flex items-center gap-1.5 sm:col-span-2 text-[11px] text-stone-500">
                        <MapPin className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                        <span className="truncate">{sale.address || `${sale.street || ''} ${sale.houseNumber || ''}, ${sale.plz || ''} ${sale.city || ''}`}</span>
                      </div>
                    </div>

                    {/* Expand / Collapse Products Details */}
                    {sale.items && sale.items.length > 0 && (
                      <div className="pt-1">
                        <button
                          type="button"
                          onClick={() => toggleSaleExpand(sale.id)}
                          className="text-[11px] font-bold text-emerald-800 hover:text-emerald-950 flex items-center gap-1 cursor-pointer"
                        >
                          {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                          <span>{isExpanded ? 'إخفاء أصناف الطلب' : `عرض الأصناف (${sale.items.length} منتج)`}</span>
                        </button>

                        {isExpanded && (
                          <div className="mt-2 bg-stone-50 p-3 rounded-2xl border border-stone-200/70 space-y-1.5">
                            {sale.items.map((item, idx) => (
                              <div key={idx} className="flex items-center justify-between text-xs text-stone-700">
                                <span>{item.product?.nameAr || item.product?.name || 'منتج'} × {item.quantity}</span>
                                <span className="font-bold font-sans text-stone-900">
                                  {currencySymbol}{((item.product?.price || 0) * item.quantity).toFixed(2)}
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ======================================================== */}
      {/* 5. CONFIRMATION MODAL: SINGLE SALE RECORD DELETION       */}
      {/* ======================================================== */}
      {saleToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/60 backdrop-blur-xs animate-fade-in">
          <div 
            className="bg-white rounded-3xl border border-stone-200 p-5 sm:p-6 max-w-md w-full shadow-2xl space-y-4 text-right"
            dir="rtl"
          >
            <div className="flex items-center gap-3 text-rose-700">
              <div className="w-10 h-10 rounded-2xl bg-rose-100 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5 text-rose-700" />
              </div>
              <div>
                <h4 className="text-base font-black text-stone-900">تأكيد حذف سجل المبيعات</h4>
                <p className="text-xs text-stone-500 font-medium">طلب #{saleToDelete.orderId || saleToDelete.id.slice(0, 8)}</p>
              </div>
            </div>

            <div className="bg-rose-50 border border-rose-200 p-3.5 rounded-2xl space-y-1.5 text-xs text-rose-950">
              <p className="font-black text-sm">
                هل أنت متأكد من حذف سجل هذه المبيعات؟ هذا الإجراء نهائي ولا يمكن التراجع عنه.
              </p>
              <div className="pt-1 text-[11px] text-rose-800 space-y-0.5">
                <div>العميل: <strong>{saleToDelete.customerName || 'عميل'}</strong></div>
                <div>قيمة الطلب: <strong className="font-sans">{currencySymbol}{saleToDelete.total.toFixed(2)}</strong></div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                disabled={deletingSaleId !== null}
                onClick={() => setSaleToDelete(null)}
                className="text-xs font-bold px-4 py-2.5 rounded-xl border border-stone-300 text-stone-700 hover:bg-stone-100 cursor-pointer transition-colors"
              >
                إلغاء
              </button>

              <button
                type="button"
                disabled={deletingSaleId !== null}
                onClick={handleConfirmDeleteSingle}
                className="text-xs font-black px-4.5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white cursor-pointer transition-colors flex items-center gap-2 shadow-xs disabled:opacity-50"
              >
                {deletingSaleId !== null ? (
                  <>
                    <RotateCcw className="w-3.5 h-3.5 animate-spin" />
                    <span>جاري الحذف...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>تأكيد حذف هذا السجل</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 6. CONFIRMATION MODAL: BULK DELETE ALL SALES RECORDS     */}
      {/* ======================================================== */}
      {isBulkDeleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/60 backdrop-blur-xs animate-fade-in">
          <div 
            className="bg-white rounded-3xl border border-stone-200 p-5 sm:p-6 max-w-md w-full shadow-2xl space-y-4 text-right"
            dir="rtl"
          >
            <div className="flex items-center gap-3 text-rose-700">
              <div className="w-10 h-10 rounded-2xl bg-rose-100 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5 text-rose-700" />
              </div>
              <div>
                <h4 className="text-base font-black text-stone-900">تصفير وحذف سجل المبيعات بالكامل</h4>
                <p className="text-xs text-stone-500 font-medium">مخصص للمرحلة التجريبية للمتجر</p>
              </div>
            </div>

            <div className="bg-amber-50 border border-amber-200 p-3.5 rounded-2xl space-y-2 text-xs text-amber-950 font-medium">
              <p className="font-bold text-amber-900">
                سيتم حذف كافة سجلات المبيعات المكتملة وتصفير إحصائيات المبيعات في المتجر:
              </p>
              <div className="grid grid-cols-2 gap-2 bg-white/80 p-2.5 rounded-xl border border-amber-200 text-stone-800">
                <div>
                  <span className="text-[10px] text-stone-500 block">عدد السجلات للحذف:</span>
                  <strong className="text-sm font-black text-rose-700 font-sans">{deliveredSales.length}</strong> سجل
                </div>
                <div>
                  <span className="text-[10px] text-stone-500 block">إجمالي القيمة للحذف:</span>
                  <strong className="text-sm font-black text-rose-700 font-sans">{currencySymbol}{salesMetrics.all.total.toFixed(2)}</strong>
                </div>
              </div>
              <p className="text-[11px] text-amber-800 leading-relaxed font-bold">
                ⚠️ تحذير: هذا الإجراء نهائي ولا يمكن التراجع عنه. لن يؤثر هذا الإجراء على المستخدمين، المنتجات، الأقسام، أو إعدادات المتجر، والطلبات النشطة غير المكتملة ستبقى بأمان.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                disabled={isDeletingBulk}
                onClick={() => setIsBulkDeleteModalOpen(false)}
                className="text-xs font-bold px-4 py-2.5 rounded-xl border border-stone-300 text-stone-700 hover:bg-stone-100 cursor-pointer transition-colors"
              >
                إلغاء
              </button>

              <button
                type="button"
                disabled={isDeletingBulk}
                onClick={handleConfirmBulkDelete}
                className="text-xs font-black px-4.5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white cursor-pointer transition-colors flex items-center gap-2 shadow-xs disabled:opacity-50"
              >
                {isDeletingBulk ? (
                  <>
                    <RotateCcw className="w-3.5 h-3.5 animate-spin" />
                    <span>جاري التصفير والحذف...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>تأكيد حذف سجل المبيعات</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
