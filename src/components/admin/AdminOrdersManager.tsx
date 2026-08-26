import React, { useState, useMemo } from 'react';
import { 
  ShoppingBag, 
  Clock, 
  CheckCircle2, 
  Package, 
  Truck, 
  CheckCheck, 
  AlertCircle, 
  X, 
  Search, 
  RotateCcw, 
  ChevronDown, 
  ChevronUp, 
  Copy, 
  User as UserIcon, 
  Phone, 
  MapPin, 
  CreditCard, 
  FileText, 
  MessageSquare, 
  Send, 
  CheckCircle, 
  Edit3, 
  Activity, 
  Filter, 
  Calendar, 
  AlertTriangle,
  Sparkles,
  Volume2,
  VolumeX,
  ExternalLink,
  MessageCircle,
  HelpCircle,
  Check,
  Trash2,
  ShieldAlert,
  ShieldCheck
} from 'lucide-react';
import { Order, OrderStatus, User, CustomerNoteStatus, CustomerNoteMessage } from '../../types';

// Helper to reliably check if an order has a customer complaint/note
export const hasOrderComplaint = (o: Order): boolean => {
  return Boolean(
    (o.customerNote && o.customerNote.trim().length > 0) ||
    (Array.isArray(o.customerNoteMessages) && o.customerNoteMessages.length > 0) ||
    (o.customerNoteCategory && o.customerNoteCategory.trim().length > 0) ||
    (o.customerNoteStatus && o.customerNoteStatus !== 'none')
  );
};

// Helper to determine normalized complaint status
export const getOrderNoteStatus = (o: Order): 'needs_action' | 'replied' | 'resolved' => {
  const s = o.customerNoteStatus;
  if (s === 'resolved') return 'resolved';
  if (s === 'replied') return 'replied';
  return 'needs_action';
};

interface AdminOrdersManagerProps {
  orders: Order[];
  usersList: User[];
  currencySymbol: string;
  onRefresh: () => Promise<void>;
  onUpdateStatus: (orderId: string, newStatus: OrderStatus, customNote?: string) => Promise<void>;
  onAssignDriver: (orderId: string, driverId: string) => Promise<void>;
  onSendReply: (orderId: string, replyText: string, status?: 'replied' | 'resolved') => Promise<void>;
  onUpdateNoteStatus: (orderId: string, status: CustomerNoteStatus) => Promise<void>;
  onDeleteOrder?: (orderId: string) => Promise<void>;
  onDeleteOldOrders?: () => Promise<void>;
  onDeleteComplaint?: (orderId: string) => Promise<void>;
  onDeleteAllComplaints?: () => Promise<void>;
  showToast: (msg: string) => void;
  soundAlertsEnabled?: boolean;
  onToggleSound?: () => void;
}

export const AdminOrdersManager: React.FC<AdminOrdersManagerProps> = ({
  orders,
  usersList,
  currencySymbol = '€',
  onRefresh,
  onUpdateStatus,
  onAssignDriver,
  onSendReply,
  onUpdateNoteStatus,
  onDeleteOrder,
  onDeleteOldOrders,
  onDeleteComplaint,
  onDeleteAllComplaints,
  showToast,
  soundAlertsEnabled = true,
  onToggleSound
}) => {
  // Filters & Search - Default is 'received' (New Orders)
  const [activeTabFilter, setActiveTabFilter] = useState<string>('received');
  const [notesSubFilter, setNotesSubFilter] = useState<'needs_action' | 'replied' | 'resolved' | 'all'>('needs_action');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [dateFilter, setDateFilter] = useState<'all' | 'today' | 'week' | 'month'>('all');
  const [paymentFilter, setPaymentFilter] = useState<'all' | 'paid' | 'awaiting' | 'cod'>('all');
  const [isPastOrdersExpanded, setIsPastOrdersExpanded] = useState<boolean>(false);

  // Expanded Sections State
  const [expandedTimelineOrderIds, setExpandedTimelineOrderIds] = useState<Set<string>>(new Set());
  const [expandedItemsOrderIds, setExpandedItemsOrderIds] = useState<Set<string>>(new Set());

  // Interactive Note Reply State per order
  const [replyingOrderId, setReplyingOrderId] = useState<string | null>(null);
  const [replyInputText, setReplyInputText] = useState<string>('');
  const [isSubmittingReply, setIsSubmittingReply] = useState<boolean>(false);

  // Status Updating Indicator
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  // Status Configuration Definitions
  const STATUS_CONFIG: Record<OrderStatus, {
    label: string;
    shortLabel: string;
    badgeCls: string;
    accentBorder: string;
    icon: React.ComponentType<{ className?: string }>;
    nextStep?: {
      status: OrderStatus;
      label: string;
      note: string;
      cls: string;
    };
  }> = {
    received: {
      label: 'طلب جديد (تم الاستلام)',
      shortLabel: 'جديد / استلام',
      badgeCls: 'bg-amber-100 text-amber-950 border-amber-300 font-black animate-pulse',
      accentBorder: 'border-amber-300 bg-amber-50/20 ring-2 ring-amber-400/30',
      icon: Clock,
      nextStep: {
        status: 'confirmed',
        label: 'تأكيد واعتماد الطلب ✓',
        note: 'تم تأكيد واعتماد الطلب من قبل الإدارة',
        cls: 'bg-indigo-700 hover:bg-indigo-800 text-white'
      }
    },
    pending: {
      label: 'طلب جديد (قيد المراجعة)',
      shortLabel: 'قيد الانتظار',
      badgeCls: 'bg-amber-100 text-amber-950 border-amber-300 font-black animate-pulse',
      accentBorder: 'border-amber-300 bg-amber-50/20 ring-2 ring-amber-400/30',
      icon: Clock,
      nextStep: {
        status: 'confirmed',
        label: 'تأكيد واعتماد الطلب ✓',
        note: 'تم تأكيد واعتماد الطلب من قبل الإدارة',
        cls: 'bg-indigo-700 hover:bg-indigo-800 text-white'
      }
    },
    confirmed: {
      label: 'تم التأكيد والموافقة',
      shortLabel: 'مؤكد',
      badgeCls: 'bg-indigo-50 text-indigo-950 border-indigo-200',
      accentBorder: 'border-indigo-200',
      icon: CheckCircle2,
      nextStep: {
        status: 'preparing',
        label: 'بدء تجهيز وتغليف المنتجات 📦',
        note: 'تم بدء تجهيز وتغليف الطلب في المستودع',
        cls: 'bg-purple-700 hover:bg-purple-800 text-white'
      }
    },
    preparing: {
      label: 'قيد التحضير والتجهيز',
      shortLabel: 'قيد التحضير',
      badgeCls: 'bg-purple-50 text-purple-950 border-purple-200',
      accentBorder: 'border-purple-200',
      icon: Package,
      nextStep: {
        status: 'ready_for_pickup',
        label: 'جاهز لاستلام السائق 🛵',
        note: 'تم الانتهاء من تجهيز وتغليف الطلب وهو جاهز للتسليم للسائق',
        cls: 'bg-amber-700 hover:bg-amber-800 text-white'
      }
    },
    ready_for_pickup: {
      label: 'جاهز لاستلام السائق',
      shortLabel: 'جاهز للسائق',
      badgeCls: 'bg-amber-100 text-amber-950 border-amber-300',
      accentBorder: 'border-amber-300',
      icon: Truck,
      nextStep: {
        status: 'on_the_way',
        label: 'انطلاق للتوصيل مع السائق 🚚',
        note: 'تم تسليم الشحنة لمندوب التوصيل وهي الآن في الطريق للعميل',
        cls: 'bg-cyan-700 hover:bg-cyan-800 text-white'
      }
    },
    on_the_way: {
      label: 'في الطريق إلى العميل',
      shortLabel: 'في الطريق',
      badgeCls: 'bg-cyan-50 text-cyan-950 border-cyan-200',
      accentBorder: 'border-cyan-200',
      icon: Truck,
      nextStep: {
        status: 'delivered',
        label: 'تأكيد التسليم للعميل 🎉',
        note: 'تم تسليم الطلب للعميل واستلام القيمة بنجاح',
        cls: 'bg-emerald-700 hover:bg-emerald-800 text-white'
      }
    },
    out_for_delivery: {
      label: 'خرج للتوصيل مع السائق',
      shortLabel: 'في الطريق',
      badgeCls: 'bg-cyan-50 text-cyan-950 border-cyan-200',
      accentBorder: 'border-cyan-200',
      icon: Truck,
      nextStep: {
        status: 'delivered',
        label: 'تأكيد التسليم للعميل 🎉',
        note: 'تم تسليم الطلب للعميل واستلام القيمة بنجاح',
        cls: 'bg-emerald-700 hover:bg-emerald-800 text-white'
      }
    },
    delivered: {
      label: 'تم التسليم بنجاح',
      shortLabel: 'تم التسليم',
      badgeCls: 'bg-emerald-50 text-emerald-950 border-emerald-200',
      accentBorder: 'border-emerald-200',
      icon: CheckCheck
    },
    delivery_failed: {
      label: 'تعذر تسليم الطلب',
      shortLabel: 'تعذر التسليم',
      badgeCls: 'bg-rose-100 text-rose-950 border-rose-300',
      accentBorder: 'border-rose-300',
      icon: AlertCircle
    },
    cancelled: {
      label: 'تم إلغاء الطلب',
      shortLabel: 'ملغي',
      badgeCls: 'bg-stone-100 text-stone-700 border-stone-200',
      accentBorder: 'border-stone-200',
      icon: X
    }
  };

  const availableDrivers = useMemo(() => {
    return usersList.filter(u => u.role === 'driver');
  }, [usersList]);

  // Status Metrics Calculation
  const counts = useMemo(() => {
    const received = orders.filter(o => o.status === 'received' || o.status === 'pending').length;
    const confirmed = orders.filter(o => o.status === 'confirmed').length;
    const preparing = orders.filter(o => o.status === 'preparing').length;
    const ready = orders.filter(o => o.status === 'ready_for_pickup').length;
    const onWay = orders.filter(o => o.status === 'on_the_way' || o.status === 'out_for_delivery').length;
    const delivered = orders.filter(o => o.status === 'delivered').length;
    const cancelled = orders.filter(o => o.status === 'cancelled' || o.status === 'delivery_failed').length;
    
    // Accurate Notes & Complaints Breakdown
    const notesAll = orders.filter(hasOrderComplaint).length;
    const notesNeedsAction = orders.filter(o => hasOrderComplaint(o) && getOrderNoteStatus(o) === 'needs_action').length;
    const notesReplied = orders.filter(o => hasOrderComplaint(o) && getOrderNoteStatus(o) === 'replied').length;
    const notesResolved = orders.filter(o => hasOrderComplaint(o) && getOrderNoteStatus(o) === 'resolved').length;

    return {
      all: orders.length,
      received,
      confirmed,
      preparing,
      ready,
      onWay,
      delivered,
      cancelled,
      withNotes: notesAll,
      unresolvedNotes: notesNeedsAction,
      notesNeedsAction,
      notesReplied,
      notesResolved,
      notesAll
    };
  }, [orders]);

  // Filtering Logic
  const filteredOrders = useMemo(() => {
    return orders.filter(ord => {
      // 1. Status Filter Tab
      if (activeTabFilter === 'received' && ord.status !== 'received' && ord.status !== 'pending') return false;
      if (activeTabFilter === 'confirmed' && ord.status !== 'confirmed') return false;
      if (activeTabFilter === 'preparing' && ord.status !== 'preparing') return false;
      if (activeTabFilter === 'ready_for_pickup' && ord.status !== 'ready_for_pickup') return false;
      if (activeTabFilter === 'on_the_way' && ord.status !== 'on_the_way' && ord.status !== 'out_for_delivery') return false;
      if (activeTabFilter === 'delivered' && ord.status !== 'delivered') return false;
      if (activeTabFilter === 'cancelled' && ord.status !== 'cancelled' && ord.status !== 'delivery_failed') return false;
      
      // Complaints and Notes Sub-Filtering
      if (activeTabFilter === 'notes') {
        if (!hasOrderComplaint(ord)) return false;
        const noteStatus = getOrderNoteStatus(ord);
        
        if (notesSubFilter === 'needs_action') {
          // Open or awaiting admin response
          if (noteStatus !== 'needs_action') return false;
        } else if (notesSubFilter === 'replied') {
          if (noteStatus !== 'replied') return false;
        } else if (notesSubFilter === 'resolved') {
          if (noteStatus !== 'resolved') return false;
        }
        // 'all' includes all orders where hasOrderComplaint(ord) is true
      }

      // 2. Date Range Filter
      if (dateFilter !== 'all') {
        const ordDate = ord.timestamp ? new Date(ord.timestamp) : null;
        if (ordDate && !isNaN(ordDate.getTime())) {
          const now = new Date();
          const diffMs = now.getTime() - ordDate.getTime();
          const diffDays = diffMs / (1000 * 60 * 60 * 24);

          if (dateFilter === 'today' && diffDays > 1) return false;
          if (dateFilter === 'week' && diffDays > 7) return false;
          if (dateFilter === 'month' && diffDays > 30) return false;
        }
      }

      // 3. Payment Filter
      if (paymentFilter === 'paid' && ord.paymentStatus !== 'paid') return false;
      if (paymentFilter === 'awaiting' && ord.paymentStatus !== 'awaiting_transfer') return false;
      if (paymentFilter === 'cod' && ord.paymentMethod !== 'cash_on_delivery' && ord.paymentMethod !== 'cod') return false;

      // 4. Live Text Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const idMatch = (ord.orderId || ord.id || '').toLowerCase().includes(q);
        const nameMatch = (ord.customerName || (ord as any).shippingAddress?.fullName || '').toLowerCase().includes(q);
        const phoneMatch = (ord.phone || (ord as any).shippingAddress?.phone || '').includes(q);
        const streetMatch = (ord.street || ord.address || (ord as any).shippingAddress?.street || '').toLowerCase().includes(q);
        const plzMatch = (ord.plz || (ord as any).shippingAddress?.plz || '').includes(q);
        const cityMatch = (ord.city || (ord as any).shippingAddress?.city || '').toLowerCase().includes(q);
        const noteMatch = (ord.customerNote || ord.notes || '').toLowerCase().includes(q);
        
        if (!idMatch && !nameMatch && !phoneMatch && !streetMatch && !plzMatch && !cityMatch && !noteMatch) {
          return false;
        }
      }

      return true;
    });
  }, [orders, activeTabFilter, dateFilter, paymentFilter, searchQuery]);

  // Groupings for structured overview when on 'all' tab
  const newOrdersGroup = useMemo(() => {
    return filteredOrders.filter(o => o.status === 'received' || o.status === 'pending');
  }, [filteredOrders]);

  const inProgressGroup = useMemo(() => {
    return filteredOrders.filter(o => o.status === 'confirmed' || o.status === 'preparing' || o.status === 'ready_for_pickup' || o.status === 'on_the_way' || o.status === 'out_for_delivery');
  }, [filteredOrders]);

  const closedGroup = useMemo(() => {
    return filteredOrders.filter(o => o.status === 'delivered' || o.status === 'cancelled' || o.status === 'delivery_failed');
  }, [filteredOrders]);

  // Helper Functions
  const copyOrderId = (orderId: string) => {
    try {
      navigator.clipboard.writeText(orderId);
      showToast(`تم نسخ رقم الطلب #${orderId}`);
    } catch {
      showToast(`رقم الطلب: #${orderId}`);
    }
  };

  const toggleTimeline = (id: string) => {
    setExpandedTimelineOrderIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleItems = (id: string) => {
    setExpandedItemsOrderIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    try {
      await onRefresh();
      showToast('تم تحديث قائمة الطلبات بنجاح');
    } catch {
      showToast('تعذر تحديث الطلبات');
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleStatusChange = async (orderId: string, newStatus: OrderStatus, note?: string) => {
    setUpdatingOrderId(orderId);
    try {
      await onUpdateStatus(orderId, newStatus, note);
    } finally {
      setUpdatingOrderId(null);
    }
  };

  const handleOpenReply = (ord: Order) => {
    setReplyingOrderId(ord.id);
    setReplyInputText(ord.adminReply || '');
  };

  const handleSendReplyMessage = async (orderId: string, status: 'replied' | 'resolved' = 'replied') => {
    if (!replyInputText.trim()) {
      showToast('يرجى كتابة نص الرد للعميل');
      return;
    }
    setIsSubmittingReply(true);
    try {
      await onSendReply(orderId, replyInputText.trim(), status);
      setReplyingOrderId(null);
      setReplyInputText('');
    } finally {
      setIsSubmittingReply(false);
    }
  };

  // Deletion States
  const [isDeletingComplaintId, setIsDeletingComplaintId] = useState<string | null>(null);
  const [isDeletingOrderId, setIsDeletingOrderId] = useState<string | null>(null);
  const [isDeletingAllComplaints, setIsDeletingAllComplaints] = useState<boolean>(false);
  const [isDeletingOldOrders, setIsDeletingOldOrders] = useState<boolean>(false);

  // Confirmation Modal State
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    warningNote?: string;
    confirmText: string;
    isBusy?: boolean;
    onConfirm: () => Promise<void>;
  }>({
    isOpen: false,
    title: '',
    message: '',
    confirmText: 'نعم، تأكيد الحذف',
    isBusy: false,
    onConfirm: async () => {}
  });

  const handleConfirmDeleteComplaint = (ord: Order) => {
    setConfirmModal({
      isOpen: true,
      title: 'تأكيد حذف الشكوى',
      message: 'هل أنت متأكد من حذف هذه الشكوى؟ لا يمكن التراجع عن هذا الإجراء.',
      warningNote: `رقم الطلب: #${ord.orderId || ord.id} • العميل: ${ord.customerName || 'عميل'}`,
      confirmText: 'حذف الشكوى نهائياً',
      onConfirm: async () => {
        if (onDeleteComplaint) {
          setIsDeletingComplaintId(ord.id);
          try {
            await onDeleteComplaint(ord.id);
          } finally {
            setIsDeletingComplaintId(null);
            setConfirmModal(prev => ({ ...prev, isOpen: false }));
          }
        }
      }
    });
  };

  const handleConfirmDeleteAllComplaints = () => {
    setConfirmModal({
      isOpen: true,
      title: 'تأكيد تفريغ وحذف سجل الشكاوى بالكامل',
      message: 'هل أنت متأكد من حذف سجل الشكاوى بالكامل؟ لا يمكن التراجع عن هذا الإجراء.',
      warningNote: `سيتم مسح وتفريغ سجل ${counts.notesAll} شكوى وملاحظة من النظام مع الإبقاء على تفاصيل الطلبات والمنتجات.`,
      confirmText: 'نعم، تفريغ سجل الشكاوى',
      onConfirm: async () => {
        if (onDeleteAllComplaints) {
          setIsDeletingAllComplaints(true);
          try {
            await onDeleteAllComplaints();
          } finally {
            setIsDeletingAllComplaints(false);
            setConfirmModal(prev => ({ ...prev, isOpen: false }));
          }
        }
      }
    });
  };

  const handleConfirmDeleteOrder = (ord: Order) => {
    const isProtected = ['received', 'pending', 'confirmed', 'preparing', 'ready_for_pickup', 'on_the_way', 'out_for_delivery'].includes(ord.status);
    if (isProtected) {
      showToast('⚠️ لا يمكن حذف الطلبات النشطة لحماية سير العمليات في المتجر');
      return;
    }

    setConfirmModal({
      isOpen: true,
      title: 'تأكيد حذف الطلب نهائياً',
      message: `هل أنت متأكد من حذف هذا الطلب #${ord.orderId || ord.id} نهائياً؟ لا يمكن التراجع عن هذا الإجراء.`,
      warningNote: `العميل: ${ord.customerName || 'عميل'} • الحالة: ${STATUS_CONFIG[ord.status]?.label || ord.status}`,
      confirmText: 'نعم، حذف الطلب نهائياً',
      onConfirm: async () => {
        if (onDeleteOrder) {
          setIsDeletingOrderId(ord.id);
          try {
            await onDeleteOrder(ord.id);
          } finally {
            setIsDeletingOrderId(null);
            setConfirmModal(prev => ({ ...prev, isOpen: false }));
          }
        }
      }
    });
  };

  const handleConfirmDeleteOldOrders = () => {
    const oldOrdersCount = counts.delivered + counts.cancelled;
    if (oldOrdersCount === 0) {
      showToast('لا توجد طلبات قديمة (مسلمة أو ملغاة) لحذفها');
      return;
    }

    setConfirmModal({
      isOpen: true,
      title: 'تأكيد حذف الطلبات القديمة',
      message: 'هل أنت متأكد من حذف جميع الطلبات القديمة (المسلمة والملغاة فقط)؟ لا يمكن التراجع عن هذا الإجراء.',
      warningNote: `سيتم حذف ${oldOrdersCount} طلب قديم (مسلم أو ملغي) مع الاحتفاظ التام بجميع الطلبات النشطة لحمايتها.`,
      confirmText: `حذف ${oldOrdersCount} طلب قديم`,
      onConfirm: async () => {
        if (onDeleteOldOrders) {
          setIsDeletingOldOrders(true);
          try {
            await onDeleteOldOrders();
          } finally {
            setIsDeletingOldOrders(false);
            setConfirmModal(prev => ({ ...prev, isOpen: false }));
          }
        }
      }
    });
  };

  // Preset quick responses for admin
  const QUICK_REPLIES = [
    { label: '📦 سنرسل البديل فوراً', text: 'أهلاً بك، نعتذر منك بشدة عن هذا الخطأ! سنقوم بإرسال المنتج البديل مع المندوب فوراً.' },
    { label: '🚚 تم التنسيق مع المندوب', text: 'تم مراجعة الطلب والتنسيق مع المندوب لحل المشكلة وتسليم ما يلزم بأسرع وقت.' },
    { label: '💳 إضافة رصيد تعويضي', text: 'تمت معالجة المشكلة وإضافة رصيد تعويضي بقيمة الصنف إلى محفظتك في المتجر. نعتذر عن أي إزعاج!' },
    { label: '✓ تم حل الملاحظة', text: 'تم فحص الملاحظة واعتماد التعديل بنجاح. شكراً لتواصلك مع بركة ماركت 24.' }
  ];

  // Helper to render Customer Note Category label and badge
  const renderCategoryInfo = (category?: string) => {
    switch (category) {
      case 'broken_item':
        return { label: '💔 منتج مكسور أو تالف', cls: 'bg-rose-100 text-rose-900 border-rose-300' };
      case 'missing_item':
        return { label: '📦 صنف ناقص من السلة', cls: 'bg-amber-100 text-amber-950 border-amber-300' };
      case 'wrong_item':
        return { label: '🔄 صنف غير مطابق للطلب', cls: 'bg-purple-100 text-purple-950 border-purple-300' };
      case 'driver_issue':
        return { label: '🛵 مشكلة مع السائق / المندوب', cls: 'bg-orange-100 text-orange-950 border-orange-300' };
      case 'delay':
      case 'delivery_issue':
        return { label: '⏳ تأخير في موعد التوصيل', cls: 'bg-blue-100 text-blue-950 border-blue-300' };
      case 'order_issue':
        return { label: '⚠️ مشكلة عامة في الطلب', cls: 'bg-rose-100 text-rose-950 border-rose-300' };
      default:
        return { label: '💬 ملاحظة أو استفسار عميل', cls: 'bg-stone-100 text-stone-800 border-stone-200' };
    }
  };

  // Render a Single Comprehensive Order Card
  const renderOrderCard = (ord: Order, isHighlightNew: boolean = false) => {
    const cfg = STATUS_CONFIG[ord.status] || {
      label: ord.status,
      shortLabel: ord.status,
      badgeCls: 'bg-stone-100 text-stone-700 border-stone-200',
      accentBorder: 'border-stone-200',
      icon: Clock
    };
    const StatusIcon = cfg.icon;
    const isTimelineOpen = expandedTimelineOrderIds.has(ord.id);
    const areItemsOpen = expandedItemsOrderIds.has(ord.id);
    const isUpdating = updatingOrderId === ord.id;

    const customerName = ord.customerName || (ord as any).shippingAddress?.fullName || 'عميل المتجر';
    const customerPhone = ord.phone || (ord as any).shippingAddress?.phone || '';
    const streetName = ord.street || ord.address || (ord as any).shippingAddress?.street || '';
    const houseNumber = ord.houseNumber || (ord as any).shippingAddress?.houseNumber || '';
    const bellName = ord.bellName || (ord as any).shippingAddress?.bellName || '';
    const floor = ord.floor || (ord as any).shippingAddress?.floor || '';
    const apartment = ord.apartment || (ord as any).shippingAddress?.apartment || '';
    const plz = ord.plz || (ord as any).shippingAddress?.plz || '17489';
    const city = ord.city || (ord as any).shippingAddress?.city || 'غرايفسفالد';

    const totalQuantity = ord.items.reduce((acc, it) => acc + (it.quantity || 1), 0);
    const displayedItems = areItemsOpen ? ord.items : ord.items.slice(0, 3);
    const hasMoreItems = ord.items.length > 3;

    // Messages history for Chat Thread
    const noteMessages: CustomerNoteMessage[] = Array.isArray(ord.customerNoteMessages) && ord.customerNoteMessages.length > 0
      ? ord.customerNoteMessages
      : ord.customerNote 
        ? [
            {
              id: 'initial-cust',
              sender: 'customer',
              senderName: customerName,
              text: ord.customerNote,
              createdAt: ord.customerNoteCreatedAt || ord.customerNoteUpdatedAt || ord.createdAt
            },
            ...(ord.adminReply ? [{
              id: 'initial-admin',
              sender: 'admin' as const,
              senderName: 'إدارة بركة ماركت 24',
              text: ord.adminReply,
              createdAt: ord.adminReplyCreatedAt || 'سابقاً'
            }] : [])
          ]
        : [];

    const categoryInfo = renderCategoryInfo(ord.customerNoteCategory);
    const hasComplaint = hasOrderComplaint(ord);
    const complaintStatus = getOrderNoteStatus(ord);
    const isProtectedOrder = ['received', 'pending', 'confirmed', 'preparing', 'ready_for_pickup', 'on_the_way', 'out_for_delivery'].includes(ord.status);

    return (
      <div 
        key={ord.id}
        id={`order-card-${ord.id}`}
        className={`bg-white rounded-3xl border transition-all duration-200 shadow-2xs space-y-4 p-4 sm:p-5.5 ${
          isHighlightNew 
            ? 'border-amber-300 ring-2 ring-amber-400/25 bg-linear-to-b from-amber-50/30 to-white' 
            : hasComplaint && complaintStatus !== 'resolved'
            ? 'border-amber-300/80 bg-linear-to-b from-amber-50/15 to-white'
            : 'border-stone-200/80 hover:border-stone-300'
        }`}
      >
        {/* ======================================================== */}
        {/* 1. Header: Order ID, Status Badge, Time, Amount & Actions */}
        {/* ======================================================== */}
        <div className="flex items-center justify-between border-b border-stone-100 pb-3 flex-wrap gap-2.5">
          <div className="flex items-center gap-2 flex-wrap">
            {/* Copyable Order ID */}
            <button
              type="button"
              onClick={() => copyOrderId(ord.orderId || ord.id)}
              title="انقر لنسخ رقم الطلب"
              className="font-mono text-xs font-black text-stone-900 bg-stone-100 hover:bg-stone-200 px-3 py-1.5 rounded-xl border border-stone-200/80 flex items-center gap-1.5 cursor-pointer transition-colors shadow-2xs"
            >
              <span>#{ord.orderId || ord.id}</span>
              <Copy className="w-3 h-3 text-stone-400" />
            </button>

            {/* Status Badge */}
            <span className={`text-xs font-bold px-3 py-1 rounded-full border inline-flex items-center gap-1.5 shadow-2xs ${cfg.badgeCls}`}>
              <StatusIcon className="w-3.5 h-3.5 shrink-0" />
              <span>{cfg.label}</span>
            </span>

            {/* Customer Note Pill Indicator */}
            {hasComplaint && (
              <span className={`text-[11px] font-bold px-2.5 py-1 rounded-lg border flex items-center gap-1.5 shadow-2xs ${
                complaintStatus === 'resolved'
                  ? 'bg-emerald-50 text-emerald-900 border-emerald-200'
                  : complaintStatus === 'replied'
                  ? 'bg-blue-50 text-blue-900 border-blue-200'
                  : 'bg-amber-100 text-amber-950 border-amber-300 animate-pulse'
              }`}>
                <MessageSquare className="w-3.5 h-3.5 text-amber-700" />
                <span>
                  {complaintStatus === 'resolved' 
                    ? 'شكوى محلولة ✓' 
                    : complaintStatus === 'replied' 
                    ? 'تم رد الإدارة 💬' 
                    : 'ملاحظة عميل مفتوحة ⚠️'}
                </span>
              </span>
            )}

            {/* New Order Urgency Tag */}
            {isHighlightNew && (
              <span className="bg-amber-500 text-stone-950 text-[10px] font-black px-2.5 py-1 rounded-md uppercase tracking-wider animate-bounce">
                ⚡ بانتظار التأكيد
              </span>
            )}
          </div>

          <div className="flex items-center gap-3">
            <span className="text-[11px] text-stone-400 font-sans">{ord.createdAt}</span>
            <div className="bg-emerald-50 border border-emerald-200/80 px-3.5 py-1.5 rounded-2xl text-emerald-800 font-black text-base font-sans shadow-2xs">
              {currencySymbol}{ord.total.toFixed(2)}
            </div>
          </div>
        </div>

        {/* ======================================================== */}
        {/* 2. Customer & Address & Payment Overview                  */}
        {/* ======================================================== */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 text-xs text-stone-700">
          {/* Customer Profile & Delivery Address Box */}
          <div className="bg-stone-50/90 p-3.5 rounded-2xl border border-stone-200/70 space-y-2.5">
            <div className="flex items-center justify-between font-bold text-stone-900 border-b border-stone-200/60 pb-2 flex-wrap gap-2">
              <span className="flex items-center gap-1.5 text-xs font-black">
                <UserIcon className="w-4 h-4 text-emerald-700 shrink-0" />
                <span>{customerName}</span>
              </span>

              {customerPhone ? (
                <a 
                  href={`tel:${customerPhone}`}
                  className="font-sans text-emerald-800 hover:text-emerald-900 bg-emerald-100/80 hover:bg-emerald-200 px-2.5 py-1 rounded-xl flex items-center gap-1.5 transition-colors font-bold text-[11px]"
                  title="اتصال مباشر بالعميل"
                >
                  <Phone className="w-3.5 h-3.5 text-emerald-700" />
                  <span>{customerPhone}</span>
                </a>
              ) : (
                <span className="text-[11px] text-stone-400">لا يوجد رقم هاتف</span>
              )}
            </div>

            {/* Address Details with Street, House, Bell, Floor */}
            <div className="space-y-1 text-stone-600 text-xs leading-relaxed">
              <div className="flex items-start gap-1.5">
                <MapPin className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold text-stone-900 text-xs">
                    {streetName || 'العنوان الرئيسي'} {houseNumber && <span className="font-mono text-emerald-800 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">رقم {houseNumber}</span>}
                  </div>
                  
                  {/* Klingel / Bell Name & Floor / Apartment */}
                  {(bellName || floor || apartment) && (
                    <div className="flex items-center gap-2 flex-wrap text-[11px] text-stone-700 mt-1 bg-white p-1.5 rounded-lg border border-stone-200/60">
                      {bellName && (
                        <span>
                          <strong className="text-stone-900">الجرس (Klingel):</strong> {bellName}
                        </span>
                      )}
                      {floor && (
                        <span>
                          <strong className="text-stone-900">الطابق:</strong> {floor}
                        </span>
                      )}
                      {apartment && (
                        <span>
                          <strong className="text-stone-900">الشقة:</strong> {apartment}
                        </span>
                      )}
                    </div>
                  )}

                  <div className="flex items-center gap-2 mt-1">
                    <span className="bg-stone-200 text-stone-800 px-2 py-0.5 rounded font-mono font-bold text-[10px]">
                      PLZ: {plz}
                    </span>
                    <span className="text-stone-800 font-bold text-xs">{city}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Payment & Financial Breakdown Box */}
          <div className="bg-stone-50/90 p-3.5 rounded-2xl border border-stone-200/70 flex flex-col justify-between space-y-2.5">
            <div className="flex items-center justify-between border-b border-stone-200/60 pb-2 flex-wrap gap-2 text-xs">
              <div className="flex items-center gap-1.5">
                <CreditCard className="w-4 h-4 text-stone-600" />
                <span className="text-stone-500">طريقة الدفع:</span>
                <span className="font-extrabold text-stone-900">
                  {ord.paymentMethod === 'bank_transfer'
                    ? 'تحويل بنكي (Bank Transfer)'
                    : ord.paymentMethod === 'card'
                    ? 'بطاقة دفع إلكتروني (Card)'
                    : ord.paymentMethod === 'paypal'
                    ? 'باي بال (PayPal)'
                    : 'نقداً عند الاستلام (COD)'}
                </span>
              </div>

              <span className={`font-bold px-2.5 py-1 rounded-xl border text-[10px] ${
                ord.paymentStatus === 'paid'
                  ? 'bg-emerald-100 text-emerald-950 border-emerald-300'
                  : ord.paymentStatus === 'awaiting_transfer'
                  ? 'bg-amber-100 text-amber-950 border-amber-300 animate-pulse'
                  : 'bg-stone-200 text-stone-800 border-stone-300'
              }`}>
                {ord.paymentStatus === 'paid'
                  ? 'تم الدفع بنجاح ✓'
                  : ord.paymentStatus === 'awaiting_transfer'
                  ? 'بانتظار وصول التحويل ⏳'
                  : 'دفع عند الاستلام'}
              </span>
            </div>

            {/* Financial Grid */}
            <div className="grid grid-cols-3 gap-1.5 text-center text-[10px]">
              <div className="bg-white p-2 rounded-xl border border-stone-200/70 shadow-2xs">
                <span className="text-stone-400 block font-medium">المنتجات</span>
                <span className="font-bold font-sans text-stone-900 text-xs">{currencySymbol}{(ord.subtotal || 0).toFixed(2)}</span>
              </div>
              <div className="bg-white p-2 rounded-xl border border-stone-200/70 shadow-2xs">
                <span className="text-stone-400 block font-medium">رسوم التوصيل</span>
                <span className="font-bold font-sans text-stone-900 text-xs">
                  {ord.deliveryFee ? `${currencySymbol}${ord.deliveryFee.toFixed(2)}` : 'مجاني'}
                </span>
              </div>
              <div className="bg-white p-2 rounded-xl border border-stone-200/70 shadow-2xs">
                <span className="text-stone-400 block font-medium">الخصم</span>
                <span className="font-bold font-sans text-rose-700 text-xs">
                  {ord.discount ? `-${currencySymbol}${ord.discount.toFixed(2)}` : '0.00'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* General Customer Notes at Checkout */}
        {ord.notes && (
          <div className="bg-amber-50/70 text-amber-950 p-3 rounded-2xl border border-amber-200/70 flex items-start gap-2 text-xs">
            <FileText className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
            <div>
              <strong className="font-bold">ملاحظة العميل أثناء الطلب: </strong>
              <span className="text-stone-800">{ord.notes}</span>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* 3. Customer Note & Complaint Chat Hub (PROMINENT SECTION) */}
        {/* ======================================================== */}
        {hasComplaint && (
          <div className="bg-linear-to-b from-amber-50/90 to-amber-100/30 p-4 sm:p-5 rounded-3xl border-2 border-amber-300 text-xs space-y-3.5 shadow-xs">
            {/* Header of the Note Hub */}
            <div className="flex items-center justify-between flex-wrap gap-2 border-b border-amber-200 pb-2.5">
              <div className="flex items-center gap-2 flex-wrap">
                <div className="w-8 h-8 rounded-xl bg-amber-500 text-stone-950 flex items-center justify-center font-bold shrink-0 shadow-2xs">
                  <MessageSquare className="w-4 h-4" />
                </div>
                <div>
                  <h5 className="font-black text-amber-950 text-xs sm:text-sm">
                    ملاحظة / شكوى العميل بخصوص هذا الطلب
                  </h5>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border inline-block mt-0.5 ${categoryInfo.cls}`}>
                    {categoryInfo.label}
                  </span>
                </div>
              </div>

              {/* Status Indicator & Change Dropdown & Delete Complaint Button */}
              <div className="flex items-center gap-2 flex-wrap">
                <span className={`text-xs font-black px-3 py-1 rounded-xl border shadow-2xs ${
                  complaintStatus === 'resolved'
                    ? 'bg-emerald-100 text-emerald-950 border-emerald-300'
                    : complaintStatus === 'replied'
                    ? 'bg-blue-100 text-blue-950 border-blue-300'
                    : 'bg-amber-200 text-amber-950 border-amber-400 animate-pulse'
                }`}>
                  {complaintStatus === 'resolved' ? 'تم الحل ✓' : complaintStatus === 'replied' ? 'تم الرد 💬' : 'مفتوحة بحاجة متابعة ⚠️'}
                </span>

                <select
                  value={ord.customerNoteStatus || 'open'}
                  onChange={(e) => onUpdateNoteStatus(ord.id, e.target.value as CustomerNoteStatus)}
                  className="bg-white border border-amber-300 rounded-xl px-2.5 py-1 text-[11px] font-bold text-stone-800 cursor-pointer shadow-2xs outline-hidden focus:border-amber-500"
                  title="تغيير حالة الشكوى مباشرة"
                >
                  <option value="open">⚠️ مفتوحة (قيد المتابعة)</option>
                  <option value="replied">💬 تم الرد للعميل</option>
                  <option value="resolved">✓ تم الحل والإغلاق</option>
                </select>

                <button
                  type="button"
                  onClick={() => handleConfirmDeleteComplaint(ord)}
                  disabled={isDeletingComplaintId === ord.id}
                  title="حذف سجل هذه الشكوى نهائياً"
                  className="text-[11px] font-bold text-rose-700 hover:text-rose-900 bg-rose-50 hover:bg-rose-100 border border-rose-200 px-2.5 py-1 rounded-xl cursor-pointer transition-colors flex items-center gap-1 shadow-2xs disabled:opacity-50"
                >
                  <Trash2 className="w-3 h-3 text-rose-600" />
                  <span>حذف الشكوى</span>
                </button>
              </div>
            </div>

            {/* Chat Thread Messages Display */}
            <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1">
              {noteMessages.map((msg, mIdx) => {
                const isCustomer = msg.sender === 'customer';
                return (
                  <div 
                    key={msg.id || mIdx}
                    className={`flex flex-col ${isCustomer ? 'items-start' : 'items-end'}`}
                  >
                    <div className="flex items-center gap-1.5 mb-1 px-1 text-[10px] text-stone-500">
                      <span className="font-bold text-stone-700">
                        {isCustomer ? `العميل (${msg.senderName || customerName})` : 'إدارة بركة ماركت 24'}
                      </span>
                      <span>•</span>
                      <span className="font-sans">{msg.createdAt}</span>
                    </div>

                    <div className={`p-3 rounded-2xl max-w-xl text-xs leading-relaxed font-medium shadow-2xs ${
                      isCustomer 
                        ? 'bg-white text-stone-900 border border-amber-200 rounded-tr-xs' 
                        : 'bg-blue-600 text-white rounded-tl-xs'
                    }`}>
                      {msg.text}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Reply Input Area */}
            {replyingOrderId === ord.id ? (
              <div className="space-y-2.5 pt-2 border-t border-amber-200">
                <label className="text-xs font-extrabold text-stone-900 block">
                  كتابة رد رسمي من الإدارة للعميل (سيتم إرسال إشعار فوري للعميل):
                </label>
                
                <textarea
                  rows={3}
                  value={replyInputText}
                  onChange={(e) => setReplyInputText(e.target.value)}
                  placeholder="اكتب ردك الواضح للعميل هنا (مثال: نعتذر جداً منك، تم التواصل وإرسال المنتج البديل فوراً)..."
                  className="w-full bg-white border border-stone-300 rounded-2xl p-3 text-xs text-stone-900 focus:border-emerald-700 outline-hidden resize-none shadow-inner"
                />

                {/* Quick Preset Replies */}
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-stone-500 block">ردود سريعة جاهزة بنقرة واحدة:</span>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {QUICK_REPLIES.map((qr, qIdx) => (
                      <button
                        key={qIdx}
                        type="button"
                        onClick={() => setReplyInputText(qr.text)}
                        className="text-[10px] font-bold bg-white hover:bg-stone-100 text-stone-700 border border-stone-200 px-2.5 py-1 rounded-xl cursor-pointer transition-colors shadow-2xs"
                      >
                        {qr.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Submit / Action Buttons */}
                <div className="flex items-center justify-end gap-2 pt-1 flex-wrap">
                  <button
                    type="button"
                    onClick={() => {
                      setReplyingOrderId(null);
                      setReplyInputText('');
                    }}
                    className="text-xs font-bold text-stone-600 hover:text-stone-800 bg-white border border-stone-200 px-3.5 py-2 rounded-xl cursor-pointer"
                  >
                    إلغاء
                  </button>

                  <button
                    type="button"
                    disabled={isSubmittingReply || !replyInputText.trim()}
                    onClick={() => handleSendReplyMessage(ord.id, 'replied')}
                    className="text-xs font-bold text-white bg-blue-700 hover:bg-blue-800 px-4 py-2 rounded-xl cursor-pointer flex items-center gap-1.5 shadow-2xs disabled:opacity-50 transition-colors"
                  >
                    {isSubmittingReply && <RotateCcw className="w-3.5 h-3.5 animate-spin" />}
                    <Send className="w-3.5 h-3.5" />
                    <span>إرسال الرد فقط 💬</span>
                  </button>

                  <button
                    type="button"
                    disabled={isSubmittingReply || !replyInputText.trim()}
                    onClick={() => handleSendReplyMessage(ord.id, 'resolved')}
                    className="text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 px-4 py-2 rounded-xl cursor-pointer flex items-center gap-1.5 shadow-2xs disabled:opacity-50 transition-colors"
                  >
                    <CheckCircle className="w-3.5 h-3.5" />
                    <span>إرسال الرد وتمييز المشكلة كمحلولة ✓</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between pt-2 border-t border-amber-200 flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => handleOpenReply(ord)}
                  className="text-xs font-black bg-white hover:bg-amber-100/80 text-amber-950 border border-amber-300 px-4 py-2 rounded-xl cursor-pointer flex items-center gap-2 shadow-2xs transition-colors"
                >
                  <Send className="w-3.5 h-3.5 text-amber-700" />
                  <span>{ord.adminReply ? 'كتابة رد إضافي أو تعديل' : 'فتح نافذة الرد على العميل'}</span>
                </button>

                {ord.customerNoteStatus !== 'resolved' && (
                  <button
                    type="button"
                    onClick={() => onUpdateNoteStatus(ord.id, 'resolved')}
                    className="text-xs font-bold bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-300 px-3.5 py-2 rounded-xl cursor-pointer flex items-center gap-1.5 transition-colors shadow-2xs"
                  >
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                    <span>تمييز المشكلة كمحلولة مباشرة ✓</span>
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {/* ======================================================== */}
        {/* 4. Driver Assignment Box                                  */}
        {/* ======================================================== */}
        <div className="bg-stone-50 p-3 rounded-2xl border border-stone-200/80 flex items-center justify-between flex-wrap gap-2 text-xs">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0">
              <Truck className="w-4 h-4" />
            </div>
            <div>
              <span className="font-extrabold text-stone-900 block">
                {ord.driverId 
                  ? `السائق المعيّن: ${ord.driverName || 'سائق معتمد'}` 
                  : 'لم يتم تعيين سائق بعد'}
              </span>
              {ord.driverPhone && (
                <span className="text-[10px] text-stone-500 font-sans">هاتف: {ord.driverPhone}</span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <select
              defaultValue={ord.driverId || ''}
              onChange={(e) => {
                if (e.target.value) {
                  onAssignDriver(ord.id, e.target.value);
                }
              }}
              className="bg-white border border-stone-200 text-stone-900 text-xs font-bold rounded-xl px-3 py-1.5 outline-hidden focus:border-emerald-700 cursor-pointer shadow-2xs"
            >
              <option value="">-- تعيين / تغيير السائق --</option>
              {availableDrivers.length > 0 ? (
                availableDrivers.map(drv => (
                  <option key={drv.id} value={drv.id}>
                    {drv.name} ({drv.phone || 'سائق'})
                  </option>
                ))
              ) : (
                <option value="driver_greifswald_01">سائق غرايفسفالد المعتمد</option>
              )}
            </select>
          </div>
        </div>

        {/* ======================================================== */}
        {/* 5. Products List & Items Breakdown                        */}
        {/* ======================================================== */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs font-bold text-stone-700 px-1">
            <span className="flex items-center gap-1.5">
              <Package className="w-3.5 h-3.5 text-stone-500" />
              <span>محتويات الطلب: {ord.items.length} أصناف ({totalQuantity} قطع إجمالية)</span>
            </span>

            {hasMoreItems && (
              <button
                type="button"
                onClick={() => toggleItems(ord.id)}
                className="text-emerald-800 hover:text-emerald-900 font-bold text-[11px] cursor-pointer flex items-center gap-1"
              >
                <span>{areItemsOpen ? 'عرض أقل' : `عرض كل الأصناف (${ord.items.length})`}</span>
                {areItemsOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {displayedItems.map((it, idx) => (
              <div 
                key={idx} 
                className="flex items-center justify-between gap-2.5 text-xs text-stone-800 bg-stone-50/80 p-2.5 rounded-2xl border border-stone-100"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  {it.product.image ? (
                    <img 
                      src={it.product.image} 
                      alt={it.product.nameAr || it.product.name} 
                      className="w-10 h-10 rounded-xl object-cover bg-white border border-stone-200/60 shrink-0" 
                      onError={(e) => {
                        (e.target as HTMLElement).style.display = 'none';
                      }}
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-xl bg-stone-200/80 flex items-center justify-center shrink-0">
                      <Package className="w-5 h-5 text-stone-400" />
                    </div>
                  )}
                  <div className="min-w-0 truncate">
                    <p className="font-bold text-stone-900 truncate">{it.product.nameAr || it.product.name}</p>
                    <span className="text-[11px] text-stone-500 font-sans">
                      {it.quantity} × {currencySymbol}{it.product.price.toFixed(2)}
                    </span>
                  </div>
                </div>
                <span className="font-mono text-stone-900 font-black text-xs shrink-0">
                  {currencySymbol}{(it.product.price * it.quantity).toFixed(2)}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* ======================================================== */}
        {/* 6. Order Timeline History (Expandable)                    */}
        {/* ======================================================== */}
        <div className="border-t border-stone-100 pt-2">
          <button
            type="button"
            onClick={() => toggleTimeline(ord.id)}
            className="w-full flex items-center justify-between text-xs font-bold text-stone-600 hover:text-stone-900 bg-stone-50/60 hover:bg-stone-100 p-2.5 rounded-2xl transition-colors cursor-pointer"
          >
            <span className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-stone-500" />
              <span>سجل مسار ومراحل الطلب بالتوقيت (Timeline)</span>
            </span>
            <span className="flex items-center gap-1 text-[11px] text-stone-500">
              <span>{ord.timeline && ord.timeline.length > 0 ? `${ord.timeline.length} مراحل مسجلة` : 'عرض'}</span>
              {isTimelineOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </span>
          </button>

          {isTimelineOpen && (
            <div className="mt-2.5 bg-stone-50/90 p-4 rounded-2xl border border-stone-200/70 space-y-2">
              {ord.timeline && ord.timeline.length > 0 ? (
                <div className="relative pl-2 pr-4 space-y-3 before:absolute before:right-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-stone-200">
                  {ord.timeline.map((step, sIdx) => (
                    <div key={sIdx} className="relative flex items-start gap-2.5">
                      <div className="w-2.5 h-2.5 rounded-full bg-emerald-600 ring-4 ring-white shrink-0 mt-1 absolute -right-2.25"></div>
                      <div className="mr-3 text-xs">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-stone-900">{step.labelAr || step.status}</span>
                          <span className="text-[10px] text-stone-400 font-sans">{step.timestamp}</span>
                        </div>
                        {step.note && (
                          <p className="text-[11px] text-stone-600 mt-1 bg-white p-2 rounded-xl border border-stone-200/60">
                            {step.note}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-stone-500 text-center py-2">لا توجد سجلات تاريخية سابقة لهذا الطلب</p>
              )}
            </div>
          )}
        </div>

        {/* ======================================================== */}
        {/* 7. Action Controls Bar (Next Step Button + Manual Override) */}
        {/* ======================================================== */}
        <div className="bg-stone-50 p-3.5 rounded-2xl border border-stone-200/80 space-y-3">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <span className="text-xs font-bold text-stone-900 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-800" />
              <span>إجراءات معالجة الطلب في النظام:</span>
            </span>

            <div className="flex items-center gap-2 flex-wrap">
              {/* Primary Progressive Next Step Action Button */}
              {cfg.nextStep && (
                <button
                  type="button"
                  disabled={isUpdating}
                  onClick={() => handleStatusChange(ord.id, cfg.nextStep!.status, cfg.nextStep!.note)}
                  className={`text-xs font-black px-4.5 py-2.5 rounded-xl cursor-pointer shadow-xs transition-all flex items-center gap-2 disabled:opacity-50 ${cfg.nextStep.cls}`}
                >
                  {isUpdating && <RotateCcw className="w-3.5 h-3.5 animate-spin" />}
                  <span>{cfg.nextStep.label}</span>
                </button>
              )}

              {/* Quick Cancel Button for Active Orders */}
              {ord.status !== 'delivered' && ord.status !== 'cancelled' && (
                <button
                  type="button"
                  disabled={isUpdating}
                  onClick={() => {
                    if (window.confirm(`هل أنت متأكد من إلغاء الطلب #${ord.orderId || ord.id}؟`)) {
                      handleStatusChange(ord.id, 'cancelled', 'تم إلغاء الطلب من قبل الإدارة');
                    }
                  }}
                  className="text-xs font-bold px-3.5 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl cursor-pointer transition-all flex items-center gap-1 disabled:opacity-50"
                >
                  <X className="w-3.5 h-3.5" />
                  <span>إلغاء الطلب</span>
                </button>
              )}
            </div>
          </div>

          {/* Manual Direct Status Override */}
          <div className="pt-2 border-t border-stone-200/60 flex items-center justify-between flex-wrap gap-2 text-xs">
            <label className="text-stone-600 font-medium flex items-center gap-1">
              <Edit3 className="w-3.5 h-3.5 text-stone-500" />
              <span>تغيير يدوي مباشر للحالة:</span>
            </label>
            <select
              disabled={isUpdating}
              value={ord.status}
              onChange={(e) => handleStatusChange(ord.id, e.target.value as OrderStatus)}
              className="bg-white border border-stone-200 rounded-xl px-3 py-1.5 text-xs font-bold text-stone-900 focus:border-emerald-700 outline-hidden cursor-pointer shadow-2xs disabled:opacity-50"
            >
              <option value="received">⏳ تم الاستلام (received)</option>
              <option value="pending">⏳ قيد الانتظار (pending)</option>
              <option value="confirmed">✓ تم التأكيد (confirmed)</option>
              <option value="preparing">📦 قيد التحضير (preparing)</option>
              <option value="ready_for_pickup">🛵 جاهز لاستلام السائق (ready_for_pickup)</option>
              <option value="on_the_way">🚚 في الطريق (on_the_way)</option>
              <option value="delivered">🎉 تم التسليم (delivered)</option>
              <option value="delivery_failed">⚠️ تعذر التسليم (delivery_failed)</option>
              <option value="cancelled">✖ ملغي (cancelled)</option>
            </select>
          </div>

          {/* Deletion / Protection Control Row */}
          <div className="pt-2 border-t border-stone-200/60 flex items-center justify-between flex-wrap gap-2 text-xs">
            {isProtectedOrder ? (
              <div className="flex items-center gap-1.5 text-stone-500 text-[11px] font-medium">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>طلب نشط قيد المعالجة (محمي من الحذف التلقائي أو اليدوي لسلامة العمليات)</span>
              </div>
            ) : (
              <div className="flex items-center justify-between w-full flex-wrap gap-2">
                <span className="text-[11px] text-stone-500">
                  {ord.status === 'delivered' ? 'طلب مكتمل ومسلّم' : 'طلب غير نشط'} (يمكن أرشفته أو حذفه من قبل Admin)
                </span>
                <button
                  type="button"
                  disabled={isDeletingOrderId === ord.id}
                  onClick={() => handleConfirmDeleteOrder(ord)}
                  title="حذف هذا الطلب نهائياً من قاعدة البيانات"
                  className="text-xs font-bold text-rose-700 hover:text-rose-900 bg-rose-50 hover:bg-rose-100 border border-rose-200 px-3 py-1.5 rounded-xl cursor-pointer transition-colors flex items-center gap-1.5 shadow-2xs disabled:opacity-50"
                >
                  <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                  <span>حذف هذا الطلب نهائياً</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-5" dir="rtl">
      {/* ======================================================== */}
      {/* 1. TOP HEADER & INSTANT METRICS BAR                      */}
      {/* ======================================================== */}
      <div className="bg-white p-4 sm:p-6 rounded-3xl border border-stone-200/80 shadow-2xs flex items-center justify-between flex-wrap gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-emerald-800 text-white flex items-center justify-center shadow-xs">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-black text-lg text-stone-900 flex items-center gap-2">
                <span>مركز إدارة ومعالجة الطلبات</span>
                <span className="bg-stone-100 text-stone-700 text-xs px-2.5 py-0.5 rounded-full font-mono">
                  {orders.length} طلب
                </span>
              </h3>
              <p className="text-xs text-stone-500 mt-0.5">
                معالجة فورية للطلبات، متابعة السائقين، والرد السريع على ملاحظات وشكاوى العملاء
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {onToggleSound && (
            <button
              type="button"
              onClick={onToggleSound}
              className={`p-2.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors shadow-2xs ${
                soundAlertsEnabled 
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100' 
                  : 'bg-stone-100 text-stone-500 border-stone-200 hover:bg-stone-200'
              }`}
              title={soundAlertsEnabled ? 'تنبيهات الصوت مفعلة للطلبات الجديدة' : 'تنبيهات الصوت معطلة'}
            >
              {soundAlertsEnabled ? <Volume2 className="w-4 h-4 text-emerald-700" /> : <VolumeX className="w-4 h-4 text-stone-400" />}
              <span className="hidden sm:inline">{soundAlertsEnabled ? 'صوت التنبيه: مفعّل' : 'صوت التنبيه: مكتوم'}</span>
            </button>
          )}

          <button
            type="button"
            onClick={handleManualRefresh}
            disabled={isRefreshing}
            className="text-xs font-bold text-stone-700 bg-stone-100 hover:bg-stone-200 px-4 py-2.5 rounded-xl flex items-center gap-2 cursor-pointer transition-colors shadow-2xs disabled:opacity-50"
          >
            <RotateCcw className={`w-3.5 h-3.5 text-stone-600 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>تحديث القائمة</span>
          </button>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 2. KPI STATUS CARDS (NEW ORDERS ALWAYS AT TOP)          */}
      {/* ======================================================== */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
        {/* 1. NEW ORDERS BUTTON - HIGH PRIORITY FIRST */}
        <button
          type="button"
          onClick={() => setActiveTabFilter('received')}
          className={`p-3.5 rounded-2xl border text-center transition-all cursor-pointer relative overflow-hidden ${
            activeTabFilter === 'received'
              ? 'bg-amber-500 text-stone-950 border-amber-500 shadow-xs font-black ring-2 ring-amber-400'
              : counts.received > 0
              ? 'bg-amber-50 text-amber-950 border-amber-300 hover:border-amber-400 ring-1 ring-amber-300'
              : 'bg-white text-stone-800 border-stone-200/80 hover:border-stone-400'
          }`}
        >
          {counts.received > 0 && (
            <span className="absolute top-1.5 left-1.5 w-2.5 h-2.5 rounded-full bg-amber-500 animate-ping"></span>
          )}
          <span className="text-[11px] block font-bold">⚡ طلبات جديدة</span>
          <span className="font-mono text-xl font-black">{counts.received}</span>
        </button>

        {/* 2. CUSTOMER COMPLAINTS / NOTES BUTTON */}
        <button
          type="button"
          onClick={() => {
            setActiveTabFilter('notes');
            setNotesSubFilter('needs_action');
          }}
          className={`p-3.5 rounded-2xl border text-center transition-all cursor-pointer relative ${
            activeTabFilter === 'notes'
              ? 'bg-amber-700 text-white border-amber-700 shadow-xs font-black'
              : counts.notesNeedsAction > 0
              ? 'bg-amber-50 text-amber-950 border-amber-300 ring-1 ring-amber-300'
              : 'bg-white text-stone-800 border-stone-200/80 hover:border-stone-400'
          }`}
        >
          {counts.notesNeedsAction > 0 && (
            <span className="absolute top-1.5 left-1.5 w-2.5 h-2.5 rounded-full bg-amber-500 animate-ping"></span>
          )}
          <span className="text-[11px] block font-bold">💬 شكاوى وملاحظات</span>
          <span className="font-mono text-xl font-black">
            {counts.notesNeedsAction > 0 ? `${counts.notesNeedsAction} تحتاج إجراء` : counts.notesAll}
          </span>
        </button>

        {/* 3. IN PREPARATION BUTTON */}
        <button
          type="button"
          onClick={() => setActiveTabFilter('preparing')}
          className={`p-3.5 rounded-2xl border text-center transition-all cursor-pointer ${
            activeTabFilter === 'preparing'
              ? 'bg-purple-700 text-white border-purple-700 shadow-xs font-black'
              : 'bg-white text-stone-800 border-stone-200/80 hover:border-stone-400'
          }`}
        >
          <span className="text-[11px] block font-medium opacity-80">📦 قيد التحضير</span>
          <span className="font-mono text-xl font-black">{counts.preparing}</span>
        </button>

        {/* 4. READY FOR PICKUP BUTTON */}
        <button
          type="button"
          onClick={() => setActiveTabFilter('ready_for_pickup')}
          className={`p-3.5 rounded-2xl border text-center transition-all cursor-pointer ${
            activeTabFilter === 'ready_for_pickup'
              ? 'bg-amber-800 text-white border-amber-800 shadow-xs font-black'
              : 'bg-white text-stone-800 border-stone-200/80 hover:border-stone-400'
          }`}
        >
          <span className="text-[11px] block font-medium opacity-80">🛵 جاهز للسائق</span>
          <span className="font-mono text-xl font-black">{counts.ready}</span>
        </button>

        {/* 5. ON THE WAY BUTTON */}
        <button
          type="button"
          onClick={() => setActiveTabFilter('on_the_way')}
          className={`p-3.5 rounded-2xl border text-center transition-all cursor-pointer ${
            activeTabFilter === 'on_the_way'
              ? 'bg-cyan-700 text-white border-cyan-700 shadow-xs font-black'
              : 'bg-white text-stone-800 border-stone-200/80 hover:border-stone-400'
          }`}
        >
          <span className="text-[11px] block font-medium opacity-80">🚚 في الطريق</span>
          <span className="font-mono text-xl font-black">{counts.onWay}</span>
        </button>

        {/* 6. ALL ORDERS BUTTON */}
        <button
          type="button"
          onClick={() => setActiveTabFilter('all')}
          className={`p-3.5 rounded-2xl border text-center transition-all cursor-pointer ${
            activeTabFilter === 'all'
              ? 'bg-stone-900 text-white border-stone-900 shadow-xs font-black'
              : 'bg-white text-stone-800 border-stone-200/80 hover:border-stone-400'
          }`}
        >
          <span className="text-[11px] block font-medium opacity-80">📋 كل الطلبات</span>
          <span className="font-mono text-xl font-black">{counts.all}</span>
        </button>
      </div>

      {/* ======================================================== */}
      {/* 3. SEARCH & ADVANCED FILTER BAR                          */}
      {/* ======================================================== */}
      <div className="bg-white p-3.5 sm:p-5 rounded-3xl border border-stone-200/80 shadow-2xs space-y-3.5">
        {/* Live Search Input */}
        <div className="relative">
          <Search className="w-4 h-4 text-stone-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="ابحث برقم الطلب #ORD-XXXX، اسم العميل، رقم الهاتف، الشارع، أو الرمز البريدي PLZ..."
            className="w-full bg-stone-50 border border-stone-200 rounded-2xl pr-10 pl-10 py-3 text-xs text-stone-900 placeholder:text-stone-400 focus:bg-white focus:border-emerald-700 outline-hidden font-medium shadow-2xs"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 p-1 cursor-pointer"
              title="مسح البحث"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Tab Pills & Quick Date / Payment Filters */}
        <div className="flex items-center justify-between flex-wrap gap-2.5">
          {/* Status Tabs Pills */}
          <div className="flex bg-stone-100 p-1 rounded-2xl border border-stone-200/80 text-xs font-bold overflow-x-auto no-scrollbar gap-1 max-w-full">
            {[
              { id: 'all', label: `الكل (${counts.all})` },
              { id: 'received', label: `⚡ جديد (${counts.received})` },
              { id: 'notes', label: `💬 شكاوى وملاحظات (${counts.notesNeedsAction > 0 ? `${counts.notesNeedsAction} تحتاج إجراء` : counts.notesAll})` },
              { id: 'confirmed', label: `مؤكد (${counts.confirmed})` },
              { id: 'preparing', label: `تحضير (${counts.preparing})` },
              { id: 'ready_for_pickup', label: `جاهز للسائق (${counts.ready})` },
              { id: 'on_the_way', label: `في الطريق (${counts.onWay})` },
              { id: 'delivered', label: `تم التسليم (${counts.delivered})` },
              { id: 'cancelled', label: `ملغي (${counts.cancelled})` }
            ].map((tab) => {
              const isActive = activeTabFilter === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    setActiveTabFilter(tab.id);
                    if (tab.id === 'notes') setNotesSubFilter('needs_action');
                  }}
                  className={`py-1.5 px-3 rounded-xl whitespace-nowrap transition-all cursor-pointer text-xs ${
                    isActive 
                      ? 'bg-white text-stone-950 shadow-xs font-black' 
                      : 'text-stone-600 hover:text-stone-900'
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* Date Range Selector */}
          <div className="flex items-center gap-1 text-xs">
            <span className="text-stone-400 text-[11px] font-medium hidden sm:inline">التاريخ:</span>
            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value as any)}
              className="bg-stone-50 border border-stone-200 rounded-xl px-2.5 py-1.5 text-xs font-bold text-stone-800 outline-hidden cursor-pointer"
            >
              <option value="all">كل الأوقات</option>
              <option value="today">طلبات اليوم</option>
              <option value="week">آخر 7 أيام</option>
              <option value="month">آخر شهر</option>
            </select>
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 4. ORDERS FEED & MONITORING DASHBOARD VIEW              */}
      {/* ======================================================== */}
      {searchQuery.trim() ? (
        /* Search Results View */
        filteredOrders.length === 0 ? (
          <div className="py-16 text-center bg-white rounded-3xl border border-stone-200/80 p-6 space-y-3 shadow-2xs">
            <div className="w-14 h-14 rounded-3xl bg-stone-100 text-stone-400 flex items-center justify-center mx-auto">
              <Search className="w-7 h-7" />
            </div>
            <h4 className="text-sm font-bold text-stone-800">لا توجد نتائج بحث مطابقة</h4>
            <p className="text-xs text-stone-500 max-w-sm mx-auto">
              لم يتم العثور على أي طلب يطابق "{searchQuery}". جرب البحث برقم آخر أو مسح حقل البحث.
            </p>
            <button
              onClick={() => setSearchQuery('')}
              className="text-xs font-bold text-emerald-800 hover:underline pt-1 cursor-pointer"
            >
              مسح البحث والعودة
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center justify-between px-2 text-xs font-bold text-stone-600">
              <span>نتائج البحث عن "{searchQuery}" ({filteredOrders.length} طلب)</span>
              <button
                onClick={() => setSearchQuery('')}
                className="text-emerald-800 hover:underline text-xs"
              >
                مسح البحث
              </button>
            </div>
            {filteredOrders.map(ord => renderOrderCard(ord, ord.status === 'received' || ord.status === 'pending'))}
          </div>
        )
      ) : activeTabFilter === 'received' ? (
        /* ---------------------------------------------------- */
        /* DEFAULT TAB: "طلبات جديدة" (NEW ORDERS / MONITORING)   */
        /* ---------------------------------------------------- */
        counts.received > 0 ? (
          /* Subcase A: There ARE new orders -> Show full details with top priority */
          <div className="space-y-4">
            <div className="flex items-center justify-between bg-amber-500/15 border-2 border-amber-300 p-4 rounded-2xl text-amber-950 shadow-2xs">
              <div className="flex items-center gap-3">
                <span className="w-3.5 h-3.5 rounded-full bg-amber-500 animate-ping"></span>
                <div>
                  <h4 className="font-black text-sm sm:text-base">
                    ⚡ طلبات جديدة واردة بانتظار التأكيد والبدء ({newOrdersGroup.length})
                  </h4>
                  <p className="text-xs text-amber-900 font-medium mt-0.5">
                    أولوية عاجلة: يرجى مراجعة تفاصيل الطلبات وتأكيدها لبدء التجهيز والتغليف
                  </p>
                </div>
              </div>
              <span className="text-xs font-black bg-amber-300 text-amber-950 px-3.5 py-1.5 rounded-full shadow-2xs shrink-0">
                أولوية قصوى
              </span>
            </div>

            <div className="space-y-3">
              {newOrdersGroup.map(ord => renderOrderCard(ord, true))}
            </div>

            {/* Quick overview of ongoing active stages */}
            <div className="bg-stone-50 p-4 rounded-3xl border border-stone-200/80 space-y-3 mt-6">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-stone-800 flex items-center gap-1.5">
                  <Activity className="w-4 h-4 text-emerald-800" />
                  <span>ملخص باقي المراحل النشطة في النظام:</span>
                </span>
                <span className="text-[11px] text-stone-500">اضغط على أي مرحلة للانتقال إليها</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs">
                <button
                  type="button"
                  onClick={() => setActiveTabFilter('confirmed')}
                  className="p-2.5 bg-white hover:bg-indigo-50 border border-stone-200 hover:border-indigo-300 rounded-xl cursor-pointer transition-colors"
                >
                  <span className="text-stone-500 block text-[10px] font-bold">قيد التأكيد</span>
                  <span className="text-sm font-black text-indigo-900 font-mono">{counts.confirmed}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTabFilter('preparing')}
                  className="p-2.5 bg-white hover:bg-purple-50 border border-stone-200 hover:border-purple-300 rounded-xl cursor-pointer transition-colors"
                >
                  <span className="text-stone-500 block text-[10px] font-bold">قيد التحضير</span>
                  <span className="text-sm font-black text-purple-900 font-mono">{counts.preparing}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTabFilter('ready_for_pickup')}
                  className="p-2.5 bg-white hover:bg-amber-50 border border-stone-200 hover:border-amber-300 rounded-xl cursor-pointer transition-colors"
                >
                  <span className="text-stone-500 block text-[10px] font-bold">جاهزة للتوصيل</span>
                  <span className="text-sm font-black text-amber-900 font-mono">{counts.ready}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTabFilter('on_the_way')}
                  className="p-2.5 bg-white hover:bg-cyan-50 border border-stone-200 hover:border-cyan-300 rounded-xl cursor-pointer transition-colors"
                >
                  <span className="text-stone-500 block text-[10px] font-bold">في الطريق</span>
                  <span className="text-sm font-black text-cyan-900 font-mono">{counts.onWay}</span>
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* Subcase B: There are NO new orders -> Clean Interactive Monitoring Control Board */
          <div className="space-y-5">
            {/* Status Message Banner */}
            <div className="bg-emerald-50/80 border border-emerald-200/80 p-5 rounded-3xl flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-2xl bg-emerald-700 text-white flex items-center justify-center shrink-0 shadow-2xs">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-black text-sm sm:text-base text-emerald-950">
                    لا توجد طلبات جديدة حالياً
                  </h4>
                  <p className="text-xs text-emerald-850 font-medium mt-0.5">
                    جميع الطلبات الواردة تم استلامها واعتمادها بنجاح، وتتابع مراحلها التشغيلية.
                  </p>
                </div>
              </div>
              <span className="text-xs font-bold bg-white text-emerald-900 border border-emerald-300 px-3.5 py-1.5 rounded-xl shadow-2xs">
                حالة النظام: نشط ومستقر ✓
              </span>
            </div>

            {/* Monitoring Summary: Realtime Live Counts for Active Stages */}
            <div className="bg-white p-5 sm:p-6 rounded-3xl border border-stone-200/80 shadow-2xs space-y-4">
              <div className="flex items-center justify-between border-b border-stone-100 pb-3 flex-wrap gap-2">
                <div>
                  <h4 className="font-black text-sm sm:text-base text-stone-900 flex items-center gap-2">
                    <Activity className="w-4 h-4 text-emerald-800" />
                    <span>طلبات تحتاج متابعة وإنجاز:</span>
                  </h4>
                  <p className="text-xs text-stone-500 mt-0.5">
                    اضغط على أي مرحلة أدناه لفتح تفاصيل طلباتها والبدء بمعالجتها وتحديث حالتها
                  </p>
                </div>
                <div className="text-xs font-bold bg-stone-100 text-stone-700 px-3 py-1.5 rounded-xl">
                  إجمالي الطلبات النشطة: <span className="font-mono font-black text-stone-950">{counts.confirmed + counts.preparing + counts.ready + counts.onWay}</span>
                </div>
              </div>

              {/* Interactive Stage Monitoring Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {/* 1. Confirmed / Approval */}
                <button
                  type="button"
                  onClick={() => setActiveTabFilter('confirmed')}
                  className="p-4 rounded-2xl border text-right transition-all cursor-pointer bg-indigo-50/60 hover:bg-indigo-100/70 border-indigo-200 group flex items-center justify-between"
                >
                  <div className="space-y-1">
                    <span className="text-xs font-black text-indigo-950 block">قيد التأكيد</span>
                    <span className="text-[11px] text-indigo-700 block">بانتظار البدء بالتجهيز</span>
                  </div>
                  <div className="text-left">
                    <span className="font-mono text-2xl font-black text-indigo-950 block">{counts.confirmed}</span>
                    <span className="text-[10px] text-indigo-600 font-bold group-hover:underline">عرض ➔</span>
                  </div>
                </button>

                {/* 2. In Preparation / Warehouse Packaging */}
                <button
                  type="button"
                  onClick={() => setActiveTabFilter('preparing')}
                  className="p-4 rounded-2xl border text-right transition-all cursor-pointer bg-purple-50/60 hover:bg-purple-100/70 border-purple-200 group flex items-center justify-between"
                >
                  <div className="space-y-1">
                    <span className="text-xs font-black text-purple-950 block">قيد التحضير</span>
                    <span className="text-[11px] text-purple-700 block">تجهيز وتغليف في المستودع</span>
                  </div>
                  <div className="text-left">
                    <span className="font-mono text-2xl font-black text-purple-950 block">{counts.preparing}</span>
                    <span className="text-[10px] text-purple-600 font-bold group-hover:underline">عرض ➔</span>
                  </div>
                </button>

                {/* 3. Ready for Delivery Driver */}
                <button
                  type="button"
                  onClick={() => setActiveTabFilter('ready_for_pickup')}
                  className="p-4 rounded-2xl border text-right transition-all cursor-pointer bg-amber-50/60 hover:bg-amber-100/70 border-amber-300 group flex items-center justify-between"
                >
                  <div className="space-y-1">
                    <span className="text-xs font-black text-amber-950 block">جاهزة للتوصيل</span>
                    <span className="text-[11px] text-amber-800 block">بانتظار استلام السائق</span>
                  </div>
                  <div className="text-left">
                    <span className="font-mono text-2xl font-black text-amber-950 block">{counts.ready}</span>
                    <span className="text-[10px] text-amber-800 font-bold group-hover:underline">عرض ➔</span>
                  </div>
                </button>

                {/* 4. On The Way with Driver */}
                <button
                  type="button"
                  onClick={() => setActiveTabFilter('on_the_way')}
                  className="p-4 rounded-2xl border text-right transition-all cursor-pointer bg-cyan-50/60 hover:bg-cyan-100/70 border-cyan-200 group flex items-center justify-between"
                >
                  <div className="space-y-1">
                    <span className="text-xs font-black text-cyan-950 block">في الطريق</span>
                    <span className="text-[11px] text-cyan-700 block">مع السائق لموقع العميل</span>
                  </div>
                  <div className="text-left">
                    <span className="font-mono text-2xl font-black text-cyan-950 block">{counts.onWay}</span>
                    <span className="text-[10px] text-cyan-700 font-bold group-hover:underline">عرض ➔</span>
                  </div>
                </button>
              </div>

              {/* Open Customer Complaints & Notes Indicator (If any) */}
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setActiveTabFilter('notes');
                    setNotesSubFilter('needs_action');
                  }}
                  className={`w-full p-4 rounded-2xl border text-right transition-all cursor-pointer flex items-center justify-between ${
                    counts.notesNeedsAction > 0
                      ? 'bg-amber-100/80 hover:bg-amber-200/80 border-amber-400 text-amber-950 shadow-2xs'
                      : 'bg-stone-50 hover:bg-stone-100 border-stone-200/80 text-stone-700'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                      counts.notesNeedsAction > 0 ? 'bg-amber-500 text-stone-950 font-bold' : 'bg-stone-200 text-stone-600'
                    }`}>
                      <MessageSquare className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-xs font-black block">
                        ملاحظات وشكاوى العملاء
                      </span>
                      <span className="text-[11px] opacity-80 block">
                        {counts.notesNeedsAction > 0 
                          ? `⚠️ توجد ${counts.notesNeedsAction} شكوى / ملاحظة تحتاج إلى إجراء من الإدارة` 
                          : 'لا توجد شكاوى أو ملاحظات تحتاج إلى إجراء حالياً'}
                      </span>
                    </div>
                  </div>

                  <div className="text-left">
                    <span className="font-mono text-xl font-black block">
                      {counts.notesNeedsAction > 0 ? counts.notesNeedsAction : counts.notesAll}
                    </span>
                    <span className="text-[10px] font-bold underline">
                      {counts.notesNeedsAction > 0 ? 'متابعة الشكاوى الآن ➔' : 'فتح مركز الشكاوى ➔'}
                    </span>
                  </div>
                </button>
              </div>

              {/* Discrete Historical Archive / Completed Section */}
              <div className="pt-3 border-t border-stone-100 flex items-center justify-between flex-wrap gap-2 text-xs">
                <span className="text-stone-500 font-medium text-[11px]">
                  أرشيف وسجلات الطلبات السابقة:
                </span>
                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    type="button"
                    onClick={() => setActiveTabFilter('delivered')}
                    className="text-stone-700 bg-stone-100 hover:bg-stone-200 px-3 py-1.5 rounded-xl font-bold cursor-pointer transition-colors"
                  >
                    🎉 تم التسليم ({counts.delivered})
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTabFilter('cancelled')}
                    className="text-stone-700 bg-stone-100 hover:bg-stone-200 px-3 py-1.5 rounded-xl font-bold cursor-pointer transition-colors"
                  >
                    ✖ ملغاة ({counts.cancelled})
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTabFilter('all')}
                    className="text-stone-800 bg-stone-100 hover:bg-stone-200 px-3 py-1.5 rounded-xl font-bold cursor-pointer transition-colors"
                  >
                    📋 كل الطلبات ({counts.all})
                  </button>
                </div>
              </div>
            </div>
          </div>
        )
      ) : activeTabFilter === 'notes' ? (
        /* ---------------------------------------------------- */
        /* DEDICATED COMPLAINTS & NOTES MANAGEMENT CENTER       */
        /* ---------------------------------------------------- */
        <div className="space-y-4">
          {/* Header of Complaints Center */}
          <div className="bg-white p-4 rounded-3xl border border-stone-200/80 shadow-2xs flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-amber-500 text-stone-950 flex items-center justify-center font-bold shrink-0">
                <MessageSquare className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-black text-stone-900">
                  مركز معالجة شكاوى وملاحظات العملاء
                </h3>
                <span className="text-[11px] text-stone-500 font-medium">
                  متابعة استفسارات ومشاكل الطلبات والرد المباشر مع الحفاظ على سجل المحادثة
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {counts.notesAll > 0 && (
                <button
                  type="button"
                  onClick={handleConfirmDeleteAllComplaints}
                  disabled={isDeletingAllComplaints}
                  className="text-xs font-bold text-rose-700 hover:text-rose-900 bg-rose-50 hover:bg-rose-100 border border-rose-200 px-3.5 py-1.5 rounded-xl cursor-pointer transition-colors flex items-center gap-1.5 shadow-2xs disabled:opacity-50"
                  title="حذف وتفريغ جميع بيانات الشكاوى المسجلة في النظام"
                >
                  <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                  <span>تفريغ وحذف سجل الشكاوى بالكامل</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => setActiveTabFilter('received')}
                className="text-xs font-bold text-emerald-800 hover:text-emerald-950 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-3.5 py-1.5 rounded-xl cursor-pointer transition-colors flex items-center gap-1.5"
              >
                <span>➔ العودة للوحة المراقبة والطلبات الجديدة</span>
              </button>
            </div>
          </div>

          {/* 4-Card Summary Bar for Complaints */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {/* Card 1: Needs Action (Default) */}
            <button
              type="button"
              onClick={() => setNotesSubFilter('needs_action')}
              className={`p-3.5 rounded-2xl border text-right transition-all cursor-pointer ${
                notesSubFilter === 'needs_action'
                  ? 'bg-amber-500 text-stone-950 border-amber-500 shadow-xs font-black ring-2 ring-amber-400'
                  : counts.notesNeedsAction > 0
                  ? 'bg-amber-50 text-amber-950 border-amber-300 hover:border-amber-400'
                  : 'bg-white text-stone-800 border-stone-200/80 hover:border-stone-400'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-[11px] font-bold">⚡ تحتاج إلى إجراء</span>
                {counts.notesNeedsAction > 0 && (
                  <span className="w-2 h-2 rounded-full bg-amber-600 animate-ping"></span>
                )}
              </div>
              <span className="font-mono text-2xl font-black block">{counts.notesNeedsAction}</span>
              <span className="text-[10px] opacity-80 block">شكاوى وملاحظات مفتوحة</span>
            </button>

            {/* Card 2: Replied */}
            <button
              type="button"
              onClick={() => setNotesSubFilter('replied')}
              className={`p-3.5 rounded-2xl border text-right transition-all cursor-pointer ${
                notesSubFilter === 'replied'
                  ? 'bg-blue-600 text-white border-blue-600 shadow-xs font-black ring-2 ring-blue-400'
                  : 'bg-white text-stone-800 border-stone-200/80 hover:border-stone-400'
              }`}
            >
              <span className="text-[11px] font-bold block mb-1">💬 تم الرد عليها</span>
              <span className="font-mono text-2xl font-black block">{counts.notesReplied}</span>
              <span className="text-[10px] opacity-80 block">بانتظار رد وتأكيد العميل</span>
            </button>

            {/* Card 3: Resolved */}
            <button
              type="button"
              onClick={() => setNotesSubFilter('resolved')}
              className={`p-3.5 rounded-2xl border text-right transition-all cursor-pointer ${
                notesSubFilter === 'resolved'
                  ? 'bg-emerald-700 text-white border-emerald-700 shadow-xs font-black ring-2 ring-emerald-400'
                  : 'bg-white text-stone-800 border-stone-200/80 hover:border-stone-400'
              }`}
            >
              <span className="text-[11px] font-bold block mb-1">✓ تم حلها</span>
              <span className="font-mono text-2xl font-black block">{counts.notesResolved}</span>
              <span className="text-[10px] opacity-80 block">مشاكل تمت معالجتها بنجاح</span>
            </button>

            {/* Card 4: All Complaints History */}
            <button
              type="button"
              onClick={() => setNotesSubFilter('all')}
              className={`p-3.5 rounded-2xl border text-right transition-all cursor-pointer ${
                notesSubFilter === 'all'
                  ? 'bg-stone-900 text-white border-stone-900 shadow-xs font-black ring-2 ring-stone-500'
                  : 'bg-white text-stone-800 border-stone-200/80 hover:border-stone-400'
              }`}
            >
              <span className="text-[11px] font-bold block mb-1">📋 سجل الشكاوى</span>
              <span className="font-mono text-2xl font-black block">{counts.notesAll}</span>
              <span className="text-[10px] opacity-80 block">إجمالي سجل الملاحظات</span>
            </button>
          </div>

          {/* Sub-Filter Tabs Bar */}
          <div className="bg-white p-2 rounded-2xl border border-stone-200/80 shadow-2xs flex items-center justify-between flex-wrap gap-2 text-xs font-bold">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-stone-400 text-[11px] font-medium px-2">عرض السجل:</span>
              <button
                type="button"
                onClick={() => setNotesSubFilter('needs_action')}
                className={`px-3 py-1.5 rounded-xl cursor-pointer transition-all ${
                  notesSubFilter === 'needs_action'
                    ? 'bg-amber-500 text-stone-950 font-black shadow-2xs'
                    : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
                }`}
              >
                ⚡ تحتاج إلى إجراء ({counts.notesNeedsAction})
              </button>

              <button
                type="button"
                onClick={() => setNotesSubFilter('replied')}
                className={`px-3 py-1.5 rounded-xl cursor-pointer transition-all ${
                  notesSubFilter === 'replied'
                    ? 'bg-blue-600 text-white font-black shadow-2xs'
                    : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
                }`}
              >
                💬 تم الرد عليها ({counts.notesReplied})
              </button>

              <button
                type="button"
                onClick={() => setNotesSubFilter('resolved')}
                className={`px-3 py-1.5 rounded-xl cursor-pointer transition-all ${
                  notesSubFilter === 'resolved'
                    ? 'bg-emerald-700 text-white font-black shadow-2xs'
                    : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
                }`}
              >
                ✓ تم حلها ({counts.notesResolved})
              </button>

              <button
                type="button"
                onClick={() => setNotesSubFilter('all')}
                className={`px-3 py-1.5 rounded-xl cursor-pointer transition-all ${
                  notesSubFilter === 'all'
                    ? 'bg-stone-900 text-white font-black shadow-2xs'
                    : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
                }`}
              >
                📋 كل الشكاوى ({counts.notesAll})
              </button>
            </div>

            <span className="text-[11px] text-stone-500 font-mono px-2">
              {filteredOrders.length} شكوى معروضة
            </span>
          </div>

          {/* Complaints List or Empty States */}
          {filteredOrders.length === 0 ? (
            <div className="py-12 text-center bg-white rounded-3xl border border-stone-200/80 p-6 space-y-4 shadow-2xs">
              {notesSubFilter === 'needs_action' ? (
                <>
                  <div className="w-14 h-14 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center mx-auto shadow-2xs">
                    <CheckCircle2 className="w-7 h-7" />
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-base font-black text-stone-900">
                      لا توجد شكاوى أو ملاحظات تحتاج إلى إجراء حالياً
                    </h4>
                    <p className="text-xs text-stone-500 max-w-md mx-auto leading-relaxed">
                      جميع ملاحظات وشكاوى العملاء تمت متابعتها والرد عليها أو إغلاقها بنجاح. يمكنك مراجعة الشكاوى السابقة من خلال سجل الشكاوى أدناه.
                    </p>
                  </div>
                  <div className="flex items-center justify-center gap-2 flex-wrap pt-2">
                    {counts.notesReplied > 0 && (
                      <button
                        type="button"
                        onClick={() => setNotesSubFilter('replied')}
                        className="text-xs font-bold text-blue-800 bg-blue-50 hover:bg-blue-100 border border-blue-200 px-3.5 py-1.5 rounded-xl cursor-pointer transition-colors"
                      >
                        💬 عرض الشكاوى التي تم الرد عليها ({counts.notesReplied})
                      </button>
                    )}
                    {counts.notesResolved > 0 && (
                      <button
                        type="button"
                        onClick={() => setNotesSubFilter('resolved')}
                        className="text-xs font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-3.5 py-1.5 rounded-xl cursor-pointer transition-colors"
                      >
                        ✓ عرض الشكاوى التي تم حلها ({counts.notesResolved})
                      </button>
                    )}
                    {counts.notesAll > 0 && (
                      <button
                        type="button"
                        onClick={() => setNotesSubFilter('all')}
                        className="text-xs font-bold text-stone-800 bg-stone-100 hover:bg-stone-200 px-3.5 py-1.5 rounded-xl cursor-pointer transition-colors"
                      >
                        📋 فتح سجل الشكاوى الكامل ({counts.notesAll})
                      </button>
                    )}
                  </div>
                </>
              ) : notesSubFilter === 'replied' ? (
                <>
                  <div className="w-12 h-12 rounded-2xl bg-blue-100 text-blue-800 flex items-center justify-center mx-auto">
                    <MessageSquare className="w-6 h-6" />
                  </div>
                  <h4 className="text-sm font-bold text-stone-800">لا توجد شكاوى تم الرد عليها بانتظار العميل حالياً</h4>
                  <p className="text-xs text-stone-500 max-w-sm mx-auto">
                    لا توجد شكاوى في حالة "تم الرد عليها".
                  </p>
                  <button
                    type="button"
                    onClick={() => setNotesSubFilter('needs_action')}
                    className="text-xs font-bold text-amber-800 hover:underline pt-1 cursor-pointer"
                  >
                    العودة للشكاوى التي تحتاج إجراء
                  </button>
                </>
              ) : notesSubFilter === 'resolved' ? (
                <>
                  <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center mx-auto">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <h4 className="text-sm font-bold text-stone-800">لا توجد شكاوى محلولة مسجلة بعد</h4>
                  <p className="text-xs text-stone-500 max-w-sm mx-auto">
                    عند تحديد أي شكوى كـ "تم الحل والإغلاق"، ستظهر هنا في هذا السجل.
                  </p>
                  <button
                    type="button"
                    onClick={() => setNotesSubFilter('needs_action')}
                    className="text-xs font-bold text-amber-800 hover:underline pt-1 cursor-pointer"
                  >
                    العودة للشكاوى التي تحتاج إجراء
                  </button>
                </>
              ) : (
                <>
                  <div className="w-12 h-12 rounded-2xl bg-stone-100 text-stone-400 flex items-center justify-center mx-auto">
                    <MessageSquare className="w-6 h-6" />
                  </div>
                  <h4 className="text-sm font-bold text-stone-800">لا توجد أي شكاوى أو ملاحظات في النظام حتى الآن</h4>
                  <p className="text-xs text-stone-500 max-w-sm mx-auto">
                    عندما يقوم أي عميل بإرسال ملاحظة أو إبلاغ عن مشكلة على طلبه، ستظهر هنا فوراً.
                  </p>
                </>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {filteredOrders.map(ord => renderOrderCard(ord, ord.customerNoteStatus === 'open' || !ord.customerNoteStatus))}
            </div>
          )}
        </div>
      ) : (
        /* ---------------------------------------------------- */
        /* SPECIFIC STAGE VIEW (e.g. 'confirmed', 'preparing')  */
        /* ---------------------------------------------------- */
        <div className="space-y-4">
          {/* Header of the Selected Stage with Back to Monitoring button */}
          <div className="bg-white p-4 rounded-2xl border border-stone-200/80 shadow-2xs flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-2.5">
              <span className="text-xs font-black text-stone-900">
                {activeTabFilter === 'confirmed' && '✓ طلبات قيد التأكيد والاعتماد'}
                {activeTabFilter === 'preparing' && '📦 طلبات قيد التحضير والتغليف في المستودع'}
                {activeTabFilter === 'ready_for_pickup' && '🛵 طلبات جاهزة لاستلام السائق'}
                {activeTabFilter === 'on_the_way' && '🚚 شحنات في الطريق مع السائق للتوصيل'}
                {activeTabFilter === 'delivered' && '🎉 طلبات تم تسليمها بنجاح للعملاء'}
                {activeTabFilter === 'cancelled' && '✖ طلبات ملغاة أو تعذر تسليمها'}
                {activeTabFilter === 'all' && '📋 جميع الطلبات المسجلة في النظام'}
              </span>
              <span className="bg-stone-100 text-stone-700 text-xs px-2.5 py-0.5 rounded-full font-mono font-bold">
                {filteredOrders.length} طلب
              </span>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {(activeTabFilter === 'delivered' || activeTabFilter === 'cancelled' || activeTabFilter === 'all') && (counts.delivered + counts.cancelled) > 0 && (
                <button
                  type="button"
                  onClick={handleConfirmDeleteOldOrders}
                  disabled={isDeletingOldOrders}
                  className="text-xs font-bold text-rose-700 hover:text-rose-900 bg-rose-50 hover:bg-rose-100 border border-rose-200 px-3.5 py-1.5 rounded-xl cursor-pointer transition-colors flex items-center gap-1.5 shadow-2xs disabled:opacity-50"
                  title="حذف جميع الطلبات القديمة المكتملة أو الملغاة مع الاحتفاظ التام بالطلبات النشطة"
                >
                  <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                  <span>حذف الطلبات القديمة ({counts.delivered + counts.cancelled})</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => setActiveTabFilter('received')}
                className="text-xs font-bold text-emerald-800 hover:text-emerald-950 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-3.5 py-1.5 rounded-xl cursor-pointer transition-colors flex items-center gap-1.5"
              >
                <span>➔ العودة للوحة المراقبة والطلبات الجديدة</span>
              </button>
            </div>
          </div>

          {/* Orders List or Empty State for this filter */}
          {filteredOrders.length === 0 ? (
            <div className="py-12 text-center bg-white rounded-3xl border border-stone-200/80 p-6 space-y-3 shadow-2xs">
              <div className="w-12 h-12 rounded-2xl bg-stone-100 text-stone-400 flex items-center justify-center mx-auto">
                <ShoppingBag className="w-6 h-6" />
              </div>
              <h4 className="text-sm font-bold text-stone-800">لا توجد طلبات في هذه المرحلة حالياً</h4>
              <p className="text-xs text-stone-500 max-w-sm mx-auto">
                لا توجد طلبات مسجلة تحت هذا التصنيف في الوقت الحالي.
              </p>
              <button
                type="button"
                onClick={() => setActiveTabFilter('received')}
                className="text-xs font-bold text-emerald-800 hover:underline pt-1 cursor-pointer"
              >
                العودة للوحة المراقبة
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredOrders.map(ord => renderOrderCard(ord, ord.status === 'received' || ord.status === 'pending'))}
            </div>
          )}
        </div>
      )}

      {/* ======================================================== */}
      {/* 8. CONFIRMATION DIALOG MODAL (STRICT ADMIN PROTECTION)  */}
      {/* ======================================================== */}
      {confirmModal.isOpen && (
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
                <h4 className="text-base font-black text-stone-900">{confirmModal.title}</h4>
                <p className="text-xs text-stone-500 font-medium">إجراء إداري دائم لا يمكن التراجع عنه</p>
              </div>
            </div>

            <p className="text-xs sm:text-sm text-stone-700 leading-relaxed font-medium">
              {confirmModal.message}
            </p>

            {confirmModal.warningNote && (
              <div className="bg-amber-50 border border-amber-200 p-3 rounded-2xl text-xs text-amber-900 font-medium">
                {confirmModal.warningNote}
              </div>
            )}

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                disabled={confirmModal.isBusy}
                onClick={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
                className="text-xs font-bold px-4 py-2.5 rounded-xl border border-stone-300 text-stone-700 hover:bg-stone-100 cursor-pointer transition-colors"
              >
                إلغاء
              </button>

              <button
                type="button"
                disabled={confirmModal.isBusy}
                onClick={async () => {
                  setConfirmModal(prev => ({ ...prev, isBusy: true }));
                  try {
                    await confirmModal.onConfirm();
                  } finally {
                    setConfirmModal(prev => ({ ...prev, isBusy: false, isOpen: false }));
                  }
                }}
                className="text-xs font-black px-4.5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white cursor-pointer transition-colors flex items-center gap-2 shadow-xs disabled:opacity-50"
              >
                {confirmModal.isBusy ? (
                  <>
                    <RotateCcw className="w-3.5 h-3.5 animate-spin" />
                    <span>جاري التنفيذ...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>{confirmModal.confirmText}</span>
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

