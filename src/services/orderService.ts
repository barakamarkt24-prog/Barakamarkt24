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
import { db, collections, auth } from './firebaseConfig';
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
  subscribeToOrders(
    callback: (orders: Order[], newlyAddedOrders: Order[]) => void, 
    userId?: string, 
    onError?: (error: any) => void
  ): Unsubscribe {
    try {
      let q = collections.orders;
      if (userId && userId !== 'all') {
        q = query(collections.orders, where('userId', '==', userId)) as any;
      }

      let isFirstSnapshot = true;
      const seenDocIds = new Set<string>();
      const listenerStartTime = Date.now();

      return onSnapshot(q, (snapshot) => {
        const newlyAddedOrders: Order[] = [];

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

        if (isFirstSnapshot) {
          // Record all existing order doc IDs present during the initial snapshot load
          snapshot.docs.forEach(docSnap => seenDocIds.add(docSnap.id));
          isFirstSnapshot = false;
        } else {
          // Inspect docChanges for new additions that happened after listener was established
          snapshot.docChanges().forEach(change => {
            if (change.type === 'added' && !seenDocIds.has(change.doc.id)) {
              seenDocIds.add(change.doc.id);
              const data = change.doc.data() as any;

              // Ensure the newly added order was created in real-time around/after listener establishment
              const orderTime = data.timestamp ? new Date(data.timestamp).getTime() : Date.now();
              const isRecent = !data.timestamp || (orderTime >= listenerStartTime - 15000);

              if (isRecent) {
                const newOrder: Order = {
                  ...data,
                  id: change.doc.id,
                  orderId: data.orderId || change.doc.id,
                  status: data.status || 'received',
                  cityId: data.cityId || 'greifswald',
                  branchId: data.branchId || 'branch-greifswald-main',
                  plz: data.plz || '',
                  paymentMethod: data.paymentMethod || 'cash_on_delivery',
                  paymentStatus: data.paymentStatus || (data.paymentMethod === 'bank_transfer' ? 'awaiting_transfer' : data.paymentMethod === 'card' ? 'paid' : 'pending'),
                  timeline: Array.isArray(data.timeline) ? data.timeline : []
                };
                newlyAddedOrders.push(newOrder);
              }
            }
          });
        }

        if (!userId || userId === 'all') {
          this.localOrdersCache = firestoreOrders;
        }
        callback(firestoreOrders, newlyAddedOrders);
      }, (err) => {
        console.warn('Realtime orders snapshot error:', err);
        if (onError) {
          onError(err);
        }
      });
    } catch (e) {
      console.warn('Failed to attach realtime order listener:', e);
      if (onError) {
        onError(e);
      }
      return () => {};
    }
  }

  // Create an order in Cloud Firestore (orders and orderItems collections)
  async createOrder(orderData: Omit<Order, 'id' | 'createdAt' | 'status'> & { orderId?: string; status?: OrderStatus }): Promise<Order> {
    const randomNum = Math.floor(100000 + Math.random() * 900000);
    const orderId = orderData.orderId || `ORD-${randomNum}`;
    const now = new Date();
    const formattedDate = `${now.toLocaleDateString('ar-SY', { day: 'numeric', month: 'short', year: 'numeric' })} - ${now.toLocaleTimeString('ar-SY', { hour: '2-digit', minute: '2-digit' })}`;

    // Ensure authentic authenticated UID if user is logged into Firebase Auth
    const currentAuthUid = auth.currentUser?.uid;
    const finalUserId = currentAuthUid ? currentAuthUid : (orderData.userId || 'guest');

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
      userId: finalUserId,
      status: initialStatus,
      paymentMethod,
      paymentStatus,
      timeline: initialTimeline,
      createdAt: formattedDate,
      updatedAt: formattedDate,
      timestamp: now.toISOString()
    };

    // 1. Atomic write for Order and OrderItems
    try {
      const batch = writeBatch(db);

      // Save to orders collection
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

      // Save items to orderItems collection for detailed analytics & queries
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

      // Execute atomic commit
      await batch.commit();
      console.log(`[orderService] Order #${orderId} successfully persisted to Firestore.`);
    } catch (firestoreError: any) {
      console.error('[orderService] CRITICAL: Firestore batch commit failed for order creation:', firestoreError);
      // DO NOT put failed order into local memory cache as successful
      throw new Error(firestoreError?.message || 'فشل حفظ الطلب في قاعدة البيانات السحابية');
    }

    // 2. Add to local memory cache ONLY after real Firestore success
    this.localOrdersCache.unshift(newOrder);

    // 3. Isolated admin notification write (decoupled so notification permission issues never fail the order)
    try {
      const notifId = `notif-order-${orderId}-${Date.now()}`;
      const notifDocRef = doc(collections.notifications, notifId);
      await setDoc(notifDocRef, {
        id: notifId,
        userId: 'admin',
        title: `طلب جديد #${orderId}`,
        message: `طلب جديد من ${newOrder.customerName || 'عميل'} بقيمة €${newOrder.total.toFixed(2)} (${paymentMethod === 'bank_transfer' ? 'تحويل بنكي' : paymentMethod === 'card' ? 'بطاقة' : 'عند الاستلام'})`,
        read: false,
        createdAt: formattedDate,
        type: 'order',
        targetOrderId: orderId,
        orderId: orderId
      });
    } catch (notifErr) {
      // Soft log: admin will still receive real-time updates via onSnapshot on orders collection
      console.warn('[orderService] Admin notification document creation skipped or rejected by rules:', notifErr);
    }

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
        if (b.timestamp && a.timestamp) return b.timestamp.localeCompare(a.timestamp);
        return (b.createdAt || '').localeCompare(a.createdAt || '');
      });

      if (!userId || userId === 'all') {
        this.localOrdersCache = firestoreOrders;
      }
      return firestoreOrders;
    } catch (e) {
      console.warn('Error fetching orders from Firestore, attempting fallback:', e);
      if (userId && userId !== 'all') {
        return this.localOrdersCache.filter(o => o.userId === userId);
      }
      return [...this.localOrdersCache];
    }
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
