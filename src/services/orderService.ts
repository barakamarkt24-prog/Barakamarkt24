import { 
  getDocs, 
  getDoc, 
  doc, 
  setDoc, 
  updateDoc, 
  query, 
  where,
  orderBy,
  writeBatch,
  onSnapshot,
  Unsubscribe
} from 'firebase/firestore';
import { db, collections } from './firebaseConfig';
import { CartItem, Order, OrderItem, OrderStatus, OrderTimelineItem } from '../types';

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  received: 'تم استلام الطلب',
  pending: 'قيد الانتظار',
  confirmed: 'تم تأكيد الطلب',
  preparing: 'قيد التجهيز والتغليف',
  ready_for_pickup: 'جاهز لاستلام السائق',
  on_the_way: 'الطلب في الطريق مع المندوب',
  out_for_delivery: 'الطلب في الطريق مع المندوب',
  delivered: 'تم تسليم الطلب للعميل',
  delivery_failed: 'تعذر تسليم الطلب',
  cancelled: 'تم إلغاء الطلب'
};

class OrderService {
  private localOrdersCache: Order[] = [];

  // Subscribe to real-time changes in orders (for Admin or Customer live updates)
  subscribeToOrders(callback: (orders: Order[]) => void, userId?: string): Unsubscribe {
    try {
      let q = collections.orders;
      if (userId && userId !== 'all') {
        q = query(collections.orders, where('userId', '==', userId)) as any;
      }

      return onSnapshot(q, (snapshot) => {
        const firestoreOrders = snapshot.docs.map(d => {
          const data = d.data() as any;
          return {
            ...data,
            id: d.id,
            orderId: data.orderId || d.id,
            status: data.status || 'received',
            cityId: data.cityId || 'greifswald',
            branchId: data.branchId || 'branch-greifswald-main',
            plz: data.plz || '',
            paymentMethod: data.paymentMethod || 'cash_on_delivery',
            paymentStatus: data.paymentStatus || (data.paymentMethod === 'bank_transfer' ? 'awaiting_transfer' : data.paymentMethod === 'card' ? 'paid' : 'pending'),
            timeline: Array.isArray(data.timeline) ? data.timeline : []
          } as Order;
        });

        // Sort descending by timestamp or createdAt
        firestoreOrders.sort((a, b) => {
          if (b.timestamp && a.timestamp) {
            return b.timestamp.localeCompare(a.timestamp);
          }
          return (b.createdAt || '').localeCompare(a.createdAt || '');
        });

        if (!userId || userId === 'all') {
          this.localOrdersCache = firestoreOrders;
        }
        callback(firestoreOrders);
      }, (err) => {
        console.warn('Realtime orders snapshot error:', err);
      });
    } catch (e) {
      console.warn('Failed to attach realtime order listener:', e);
      return () => {};
    }
  }

  // Create an order in Cloud Firestore (orders, orderItems, and notifications collections)
  async createOrder(orderData: Omit<Order, 'id' | 'createdAt' | 'status'> & { orderId?: string; status?: OrderStatus }): Promise<Order> {
    const randomNum = Math.floor(100000 + Math.random() * 900000);
    const orderId = orderData.orderId || `ORD-${randomNum}`;
    const now = new Date();
    const formattedDate = `${now.toLocaleDateString('ar-SY', { day: 'numeric', month: 'short', year: 'numeric' })} - ${now.toLocaleTimeString('ar-SY', { hour: '2-digit', minute: '2-digit' })}`;

    // Support payment method accurately (cash_on_delivery, bank_transfer, card, etc.)
    const paymentMethod = orderData.paymentMethod || 'cash_on_delivery';

    // Support payment status accurately depending on payment method
    let paymentStatus = orderData.paymentStatus;
    if (!paymentStatus) {
      if (paymentMethod === 'bank_transfer') {
        paymentStatus = 'awaiting_transfer';
      } else if (paymentMethod === 'card') {
        paymentStatus = 'paid';
      } else {
        paymentStatus = 'pending';
      }
    }

    const initialStatus = orderData.status || 'received';
    const initialTimeline: OrderTimelineItem[] = [
      {
        status: initialStatus,
        labelAr: ORDER_STATUS_LABELS[initialStatus] || 'تم استلام الطلب',
        timestamp: formattedDate,
        note: 'تم تسجيل طلبك بنجاح في متجر Barakamarkt24'
      }
    ];

    const newOrder: Order = {
      ...orderData,
      id: orderId,
      orderId: orderId,
      userId: orderData.userId || 'guest',
      status: initialStatus,
      paymentMethod,
      paymentStatus,
      timeline: initialTimeline,
      createdAt: formattedDate,
      updatedAt: formattedDate,
      timestamp: now.toISOString()
    };

    try {
      const batch = writeBatch(db);

      // 1. Save to orders collection
      const orderDocRef = doc(collections.orders, orderId);
      batch.set(orderDocRef, {
        id: newOrder.id,
        orderId: newOrder.orderId,
        userId: newOrder.userId,
        customerName: newOrder.customerName || '',
        phone: newOrder.phone || '',
        address: newOrder.address || '',
        city: newOrder.city || '',
        cityId: newOrder.cityId || 'greifswald',
        branchId: newOrder.branchId || 'branch-greifswald-main',
        plz: newOrder.plz || '',
        subtotal: newOrder.subtotal,
        deliveryFee: newOrder.deliveryFee || 0,
        discount: newOrder.discount || 0,
        total: newOrder.total,
        status: newOrder.status,
        timeline: newOrder.timeline,
        paymentMethod: newOrder.paymentMethod,
        paymentStatus: newOrder.paymentStatus,
        createdAt: newOrder.createdAt,
        updatedAt: newOrder.updatedAt,
        timestamp: newOrder.timestamp,
        notes: newOrder.notes || '',
        items: newOrder.items
      });

      // 2. Save items to orderItems collection for detailed analytics
      for (const item of newOrder.items) {
        const itemId = `${orderId}_${item.product.id}`;
        const itemDocRef = doc(collections.orderItems, itemId);
        const orderItemRecord: OrderItem = {
          id: itemId,
          orderId: orderId,
          productId: item.product.id,
          productNameAr: item.product.nameAr,
          price: item.product.price,
          quantity: item.quantity,
          image: item.product.image,
          total: item.product.price * item.quantity
        };
        batch.set(itemDocRef, orderItemRecord);
      }

      // 3. Save notification for Admin in Firestore notifications collection
      const notifId = `notif-order-${orderId}`;
      const notifDocRef = doc(collections.notifications, notifId);
      batch.set(notifDocRef, {
        id: notifId,
        userId: 'admin',
        title: `طلب جديد #${orderId}`,
        message: `طلب جديد من ${newOrder.customerName || 'عميل'} بقيمة €${newOrder.total.toFixed(2)} (${paymentMethod === 'bank_transfer' ? 'تحويل بنكي' : paymentMethod === 'card' ? 'بطاقة' : 'عند الاستلام'})`,
        read: false,
        createdAt: formattedDate,
        type: 'order'
      });

      await batch.commit();
    } catch (e) {
      console.warn('Firestore order creation failed, keeping locally:', e);
    }

    this.localOrdersCache.unshift(newOrder);
    return newOrder;
  }

  // Get orders from Firestore
  async getOrders(userId?: string): Promise<Order[]> {
    try {
      let q = collections.orders;
      if (userId && userId !== 'all') {
        q = query(collections.orders, where('userId', '==', userId)) as any;
      }
      
      const snapshot = await getDocs(q);
      if (!snapshot.empty) {
        const firestoreOrders = snapshot.docs.map(d => {
          const data = d.data() as any;
          return {
            ...data,
            id: d.id,
            orderId: data.orderId || d.id,
            status: data.status || 'received',
            cityId: data.cityId || 'greifswald',
            branchId: data.branchId || 'branch-greifswald-main',
            plz: data.plz || '',
            paymentMethod: data.paymentMethod || 'cash_on_delivery',
            paymentStatus: data.paymentStatus || (data.paymentMethod === 'bank_transfer' ? 'awaiting_transfer' : data.paymentMethod === 'card' ? 'paid' : 'pending'),
            timeline: Array.isArray(data.timeline) ? data.timeline : []
          } as Order;
        });

        // Sort descending by timestamp or id
        firestoreOrders.sort((a, b) => {
          if (b.timestamp && a.timestamp) return b.timestamp.localeCompare(a.timestamp);
          return (b.createdAt || '').localeCompare(a.createdAt || '');
        });

        if (!userId || userId === 'all') {
          this.localOrdersCache = firestoreOrders;
        }
        return firestoreOrders;
      }
    } catch (e) {
      console.warn('Error fetching orders from Firestore:', e);
    }

    if (userId && userId !== 'all') {
      return this.localOrdersCache.filter(o => o.userId === userId);
    }
    return [...this.localOrdersCache];
  }

  // Get single order with order items
  async getOrderById(id: string): Promise<Order | null> {
    try {
      const docRef = doc(collections.orders, id);
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        const data = snap.data() as any;
        return { 
          ...data, 
          id: snap.id, 
          orderId: data.orderId || snap.id,
          status: data.status || 'received',
          cityId: data.cityId || 'greifswald',
          branchId: data.branchId || 'branch-greifswald-main',
          plz: data.plz || '',
          paymentMethod: data.paymentMethod || 'cash_on_delivery',
          paymentStatus: data.paymentStatus || (data.paymentMethod === 'bank_transfer' ? 'awaiting_transfer' : data.paymentMethod === 'card' ? 'paid' : 'pending'),
          timeline: Array.isArray(data.timeline) ? data.timeline : []
        } as Order;
      }
    } catch (e) {
      console.warn('Error fetching single order:', e);
    }

    const local = this.localOrdersCache.find(o => o.id === id || o.orderId === id);
    return local ? { ...local } : null;
  }

  // Update order status in Firestore (Admin feature)
  async updateOrderStatus(id: string, status: OrderStatus, note?: string): Promise<boolean> {
    const now = new Date();
    const formattedDate = `${now.toLocaleDateString('ar-SY', { day: 'numeric', month: 'short', year: 'numeric' })} - ${now.toLocaleTimeString('ar-SY', { hour: '2-digit', minute: '2-digit' })}`;

    const timelineEntry: OrderTimelineItem = {
      status,
      labelAr: ORDER_STATUS_LABELS[status] || status,
      timestamp: formattedDate,
      note: note || ''
    };

    try {
      const docRef = doc(collections.orders, id);
      const orderDoc = await getDoc(docRef);
      let existingTimeline: OrderTimelineItem[] = [];
      if (orderDoc.exists()) {
        const data = orderDoc.data() as any;
        existingTimeline = Array.isArray(data.timeline) ? data.timeline : [];
      }

      const updatedTimeline = [...existingTimeline, timelineEntry];

      await updateDoc(docRef, { 
        status,
        updatedAt: formattedDate,
        timeline: updatedTimeline
      });
    } catch (e) {
      console.warn('Error updating order status in Firestore:', e);
    }

    const order = this.localOrdersCache.find(o => o.id === id || o.orderId === id);
    if (order) {
      order.status = status;
      order.updatedAt = formattedDate;
      order.timeline = [...(order.timeline || []), timelineEntry];
      return true;
    }
    return true;
  }

  // Assign a driver to an order (Admin feature)
  async assignDriver(orderId: string, driverId: string, driverName?: string, driverPhone?: string): Promise<boolean> {
    const now = new Date();
    const formattedDate = `${now.toLocaleDateString('ar-SY', { day: 'numeric', month: 'short', year: 'numeric' })} - ${now.toLocaleTimeString('ar-SY', { hour: '2-digit', minute: '2-digit' })}`;

    const timelineEntry: OrderTimelineItem = {
      status: 'ready_for_pickup',
      labelAr: 'تم تعيين سائق للتوصيل',
      timestamp: formattedDate,
      note: `تم تعيين السائق ${driverName || 'المعتمد'} لتوصيل هذا الطلب`
    };

    try {
      const docRef = doc(collections.orders, orderId);
      const orderDoc = await getDoc(docRef);
      let existingTimeline: OrderTimelineItem[] = [];
      let currentStatus: OrderStatus = 'ready_for_pickup';
      
      if (orderDoc.exists()) {
        const data = orderDoc.data() as any;
        existingTimeline = Array.isArray(data.timeline) ? data.timeline : [];
        // If order was already on the way or ready, preserve or advance status
        if (data.status === 'received' || data.status === 'pending' || data.status === 'confirmed' || data.status === 'preparing') {
          currentStatus = 'ready_for_pickup';
        } else {
          currentStatus = data.status || 'ready_for_pickup';
        }
      }

      const updatedTimeline = [...existingTimeline, timelineEntry];

      await updateDoc(docRef, {
        driverId,
        driverName: driverName || '',
        driverPhone: driverPhone || '',
        assignedAt: formattedDate,
        status: currentStatus,
        updatedAt: formattedDate,
        timeline: updatedTimeline
      });

      // Send a notification to the driver
      try {
        const notifId = `notif-driver-${orderId}-${Date.now()}`;
        const notifDocRef = doc(collections.notifications, notifId);
        await setDoc(notifDocRef, {
          id: notifId,
          userId: driverId,
          title: `طلب توصيل جديد #${orderId}`,
          message: `تم تعيين الطلب #${orderId} لك للتوصيل في غرايفسفالد. يرجى مراجعة تفاصيل الطلب والانطلاق.`,
          read: false,
          createdAt: formattedDate,
          type: 'order'
        });
      } catch (notifErr) {
        console.warn('Could not create driver notification:', notifErr);
      }

      const order = this.localOrdersCache.find(o => o.id === orderId || o.orderId === orderId);
      if (order) {
        order.driverId = driverId;
        order.driverName = driverName;
        order.driverPhone = driverPhone;
        order.assignedAt = formattedDate;
        order.status = currentStatus;
        order.updatedAt = formattedDate;
        order.timeline = [...(order.timeline || []), timelineEntry];
      }

      return true;
    } catch (e) {
      console.warn('Error assigning driver in Firestore:', e);
      return false;
    }
  }

  // Subscribe to driver-specific orders
  subscribeToDriverOrders(driverId: string, callback: (orders: Order[]) => void): Unsubscribe {
    try {
      const q = query(collections.orders, where('driverId', '==', driverId)) as any;
      return onSnapshot(q, (snapshot) => {
        const firestoreOrders = snapshot.docs.map(d => {
          const data = d.data() as any;
          return {
            ...data,
            id: d.id,
            orderId: data.orderId || d.id,
            status: data.status || 'received',
            cityId: data.cityId || 'greifswald',
            branchId: data.branchId || 'branch-greifswald-main',
            plz: data.plz || '',
            paymentMethod: data.paymentMethod || 'cash_on_delivery',
            paymentStatus: data.paymentStatus || (data.paymentMethod === 'bank_transfer' ? 'awaiting_transfer' : data.paymentMethod === 'card' ? 'paid' : 'pending'),
            timeline: Array.isArray(data.timeline) ? data.timeline : []
          } as Order;
        });

        // Sort descending by timestamp or id
        firestoreOrders.sort((a, b) => {
          if (b.timestamp && a.timestamp) return b.timestamp.localeCompare(a.timestamp);
          return (b.createdAt || '').localeCompare(a.createdAt || '');
        });

        callback(firestoreOrders);
      }, (err) => {
        console.warn('Realtime driver orders listener error:', err);
      });
    } catch (e) {
      console.warn('Failed to attach driver orders realtime listener:', e);
      return () => {};
    }
  }

  // Update order status by Driver (on_the_way, delivered, delivery_failed)
  async updateDriverOrderStatus(orderId: string, status: 'on_the_way' | 'delivered' | 'delivery_failed', note?: string): Promise<boolean> {
    const now = new Date();
    const formattedDate = `${now.toLocaleDateString('ar-SY', { day: 'numeric', month: 'short', year: 'numeric' })} - ${now.toLocaleTimeString('ar-SY', { hour: '2-digit', minute: '2-digit' })}`;

    const statusNote = note || (
      status === 'on_the_way' ? 'السائق في الطريق لتسليم الطلب' :
      status === 'delivered' ? 'تم تسليم الطلب للعميل واستلام القيمة' :
      'تعذر تسليم الطلب'
    );

    const timelineEntry: OrderTimelineItem = {
      status,
      labelAr: ORDER_STATUS_LABELS[status] || status,
      timestamp: formattedDate,
      note: statusNote
    };

    try {
      const docRef = doc(collections.orders, orderId);
      const orderDoc = await getDoc(docRef);
      let existingTimeline: OrderTimelineItem[] = [];
      if (orderDoc.exists()) {
        const data = orderDoc.data() as any;
        existingTimeline = Array.isArray(data.timeline) ? data.timeline : [];
      }

      const updatedTimeline = [...existingTimeline, timelineEntry];
      const updates: any = {
        status,
        updatedAt: formattedDate,
        timeline: updatedTimeline
      };

      if (status === 'delivered') {
        updates.deliveredAt = formattedDate;
      }
      if (status === 'delivery_failed' && note) {
        updates.deliveryNotes = note;
      }

      await updateDoc(docRef, updates);

      const order = this.localOrdersCache.find(o => o.id === orderId || o.orderId === orderId);
      if (order) {
        order.status = status;
        order.updatedAt = formattedDate;
        if (status === 'delivered') order.deliveredAt = formattedDate;
        if (status === 'delivery_failed') order.deliveryNotes = note;
        order.timeline = [...(order.timeline || []), timelineEntry];
      }

      return true;
    } catch (e) {
      console.warn('Error updating driver order status:', e);
      return false;
    }
  }
}

export const orderService = new OrderService();
