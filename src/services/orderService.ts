import { 
  getDocs, 
  getDoc, 
  doc, 
  setDoc, 
  updateDoc, 
  deleteDoc,
  query, 
  where,
  orderBy,
  writeBatch,
  onSnapshot,
  Unsubscribe
} from 'firebase/firestore';
import { db, collections, auth } from './firebaseConfig';
import { CartItem, Order, OrderItem, OrderStatus, OrderTimelineItem, CustomerNoteStatus } from '../types';

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

// Helper to deeply remove undefined values and ensure Firestore safe serialization
function cleanForFirestore<T>(input: T): T {
  if (input === null || input === undefined) {
    return input;
  }
  if (Array.isArray(input)) {
    return input.map(item => cleanForFirestore(item)) as unknown as T;
  }
  if (typeof input === 'object') {
    const cleaned: Record<string, any> = {};
    for (const [key, value] of Object.entries(input)) {
      if (value !== undefined) {
        cleaned[key] = cleanForFirestore(value);
      }
    }
    return cleaned as T;
  }
  return input;
}

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
    if (!orderData.items || orderData.items.length === 0) {
      throw new Error('سلة المشتريات فارغة، لا يمكن إنشاء الطلب');
    }

    const randomNum = Math.floor(100000 + Math.random() * 900000);
    const orderId = orderData.orderId || `ORD-${randomNum}`;
    const now = new Date();
    const formattedDate = `${now.toLocaleDateString('ar-SY', { day: 'numeric', month: 'short', year: 'numeric' })} - ${now.toLocaleTimeString('ar-SY', { hour: '2-digit', minute: '2-digit' })}`;

    // Ensure authentic authenticated UID from Firebase Auth (Order creation is strictly protected)
    const currentAuthUid = auth.currentUser?.uid;
    if (!currentAuthUid) {
      throw new Error('يجب تسجيل الدخول أولاً بحساب مسجل لتأكيد وحفظ الطلب');
    }
    const finalUserId = currentAuthUid;

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

    const initialStatus: OrderStatus = orderData.status || 'received';
    const initialTimeline: OrderTimelineItem[] = [
      {
        status: initialStatus,
        labelAr: ORDER_STATUS_LABELS[initialStatus] || 'تم استلام الطلب',
        timestamp: formattedDate,
        note: 'تم تسجيل طلبك بنجاح في متجر Barakamarkt24'
      }
    ];

    // Sanitize and structure items to prevent ANY undefined properties from failing Firestore writes
    const sanitizedItems: CartItem[] = orderData.items.map(item => {
      const p = item.product || ({} as any);
      const productPrice = typeof p.price === 'number' ? p.price : parseFloat(p.price || '0') || 0;
      const itemQty = typeof item.quantity === 'number' && item.quantity > 0 ? item.quantity : 1;
      const mainImage = p.image || (Array.isArray(p.images) && p.images.length > 0 ? p.images[0] : '') || '';

      return {
        quantity: itemQty,
        product: {
          id: p.id || '',
          productId: p.id || '',
          nameAr: p.nameAr || p.name || 'منتج',
          name: p.name || p.nameAr || 'منتج',
          nameEn: p.nameEn || '',
          nameDe: p.nameDe || '',
          price: productPrice,
          oldPrice: p.oldPrice ? Number(p.oldPrice) : 0,
          originalPrice: p.originalPrice ? Number(p.originalPrice) : 0,
          discount: p.discount ? Number(p.discount) : 0,
          categoryId: p.categoryId || 'dairy-cheese',
          subcategoryId: p.subcategoryId || '',
          image: mainImage,
          images: Array.isArray(p.images) && p.images.length > 0 ? p.images : (mainImage ? [mainImage] : []),
          stock: p.stock !== undefined ? Number(p.stock) : 20,
          stockCount: p.stockCount !== undefined ? Number(p.stockCount) : 20,
          unit: p.unit || 'قطعة',
          weight: p.weight || '',
          isAvailable: p.isAvailable !== false,
          inStock: p.inStock !== false,
          origin: p.origin || 'سوري',
          brand: p.brand || 'بركة ماركت',
          rating: typeof p.rating === 'number' ? p.rating : 5,
          reviewsCount: typeof p.reviewsCount === 'number' ? p.reviewsCount : 1,
          descriptionAr: p.descriptionAr || p.description || '',
          descriptionEn: p.descriptionEn || '',
          descriptionDe: p.descriptionDe || ''
        }
      };
    });

    const subtotal = typeof orderData.subtotal === 'number' ? orderData.subtotal : parseFloat(orderData.subtotal as any || '0') || 0;
    const deliveryFee = typeof orderData.deliveryFee === 'number' ? orderData.deliveryFee : parseFloat(orderData.deliveryFee as any || '0') || 0;
    const discount = typeof orderData.discount === 'number' ? orderData.discount : parseFloat(orderData.discount as any || '0') || 0;
    const total = typeof orderData.total === 'number' ? orderData.total : (subtotal + deliveryFee - discount);

    const newOrder: Order = {
      ...orderData,
      id: orderId,
      orderId: orderId,
      userId: finalUserId,
      customerName: (orderData.customerName || '').trim(),
      phone: (orderData.phone || '').trim(),
      address: (orderData.address || '').trim(),
      street: (orderData.street || '').trim(),
      houseNumber: (orderData.houseNumber || '').trim(),
      bellName: (orderData.bellName || '').trim(),
      floor: (orderData.floor || '').trim(),
      apartment: (orderData.apartment || '').trim(),
      cityAreaId: (orderData.cityAreaId || '').trim(),
      city: (orderData.city || 'غرايفسفالد').trim(),
      cityId: orderData.cityId || 'greifswald',
      branchId: orderData.branchId || 'branch-greifswald-main',
      plz: (orderData.plz || '').trim(),
      items: sanitizedItems,
      subtotal,
      deliveryFee,
      discount,
      total,
      status: initialStatus,
      paymentMethod,
      paymentStatus,
      timeline: initialTimeline,
      createdAt: formattedDate,
      updatedAt: formattedDate,
      timestamp: now.toISOString(),
      notes: (orderData.notes || '').trim()
    };

    // 1. Atomic write for Order and OrderItems
    try {
      const batch = writeBatch(db);

      // Save to orders collection with pure sanitized object
      const orderDocRef = doc(collections.orders, orderId);
      const orderPayload = cleanForFirestore({
        id: newOrder.id,
        orderId: newOrder.orderId,
        userId: newOrder.userId,
        customerName: newOrder.customerName || '',
        phone: newOrder.phone || '',
        address: newOrder.address || '',
        street: newOrder.street || '',
        houseNumber: newOrder.houseNumber || '',
        bellName: newOrder.bellName || '',
        floor: newOrder.floor || '',
        apartment: newOrder.apartment || '',
        cityAreaId: newOrder.cityAreaId || '',
        city: newOrder.city || 'غرايفسفالد',
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

      batch.set(orderDocRef, orderPayload);

      // Save items to orderItems collection for detailed analytics & queries
      for (const item of newOrder.items) {
        const itemId = `${orderId}_${item.product.id || Math.random().toString(36).substring(2, 7)}`;
        const itemDocRef = doc(collections.orderItems, itemId);
        const itemPrice = Number(item.product.price) || 0;
        const itemQty = Number(item.quantity) || 1;
        const itemTotal = Number((itemPrice * itemQty).toFixed(2));

        const orderItemRecord: Record<string, any> = cleanForFirestore({
          id: itemId,
          orderId: orderId,
          userId: finalUserId,
          productId: item.product.id || '',
          productNameAr: item.product.nameAr || item.product.name || 'منتج',
          price: itemPrice,
          quantity: itemQty,
          image: item.product.image || '',
          total: itemTotal
        });

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

    // 3. Isolated admin & customer notification write and Server-Side FCM Push Trigger
    try {
      const adminNotifId = `notif-order-${orderId}-${Date.now()}`;
      const adminNotifDocRef = doc(collections.notifications, adminNotifId);
      const adminNotifTitle = `طلب جديد #${orderId}`;
      const adminNotifMessage = `طلب جديد من ${newOrder.customerName || 'عميل'} بقيمة €${newOrder.total.toFixed(2)} (${paymentMethod === 'bank_transfer' ? 'تحويل بنكي' : paymentMethod === 'card' ? 'بطاقة' : 'عند الاستلام'})`;

      await setDoc(adminNotifDocRef, {
        id: adminNotifId,
        userId: 'admin',
        title: adminNotifTitle,
        message: adminNotifMessage,
        read: false,
        createdAt: formattedDate,
        type: 'order',
        targetOrderId: orderId,
        orderId: orderId
      });

      // Trigger Server-Side Real Push Notification for Admin Devices
      try {
        const pushPayload = {
          role: 'admin',
          orderId: orderId,
          title: `طلب جديد #${orderId}`,
          body: `طلب جديد من ${newOrder.customerName || 'عميل'} بقيمة €${newOrder.total?.toFixed(2) || '0.00'}`,
          type: 'order',
          screen: 'admin',
          url: '/?screen=admin'
        };

        await fetch('/api/send-notification', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(pushPayload),
          keepalive: true
        });

        console.log(`[orderService] OneSignal Push sent successfully for Admin - Order #${orderId}`);
      } catch (pushErr) {
        console.warn('[orderService] Push notification failed (non-blocking):', pushErr);
      }

      if (newOrder.userId && newOrder.userId !== 'guest') {
        const custNotifId = `notif-cust-${orderId}-${Date.now()}`;
        const custNotifDocRef = doc(collections.notifications, custNotifId);
        const custNotifTitle = `تم استلام طلبك #${orderId} بنجاح 🎉`;
        const custNotifMessage = `شكراً لتسوقك من بركة ماركت 24! طلبك بقيمة €${newOrder.total.toFixed(2)} قيد المراجعة والتجهيز.`;

        await setDoc(custNotifDocRef, {
          id: custNotifId,
          userId: newOrder.userId,
          title: custNotifTitle,
          message: custNotifMessage,
          read: false,
          createdAt: formattedDate,
          type: 'order',
          targetOrderId: orderId,
          orderId: orderId
        });

        // Trigger Server-Side Real Push Notification for Customer Device
        try {
          fetch('/api/send-notification', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              userId: newOrder.userId,
              orderId: orderId,
              title: custNotifTitle,
              body: custNotifMessage,
              type: 'order',
              url: `/?screen=orders&orderId=${orderId}`
            })
          }).catch(() => {});
        } catch {
          // Non-blocking
        }
      }
    } catch (notifErr) {
      console.warn('[orderService] Notification document creation notice:', notifErr);
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

      // Dispatch Customer Push Notification for status update
      try {
        const orderData = orderDoc.exists() ? orderDoc.data() as any : null;
        const targetUserId = orderData?.userId;
        if (targetUserId && targetUserId !== 'guest') {
          const statusMessages: Record<OrderStatus, { title: string; message: string }> = {
            confirmed: {
              title: `تم تأكيد طلبك #${id} ✅`,
              message: 'تم تأكيد طلبك بنجاح وسيبدأ تجهيزه في المتجر قريباً.'
            },
            preparing: {
              title: `طلبك قيد التجهيز والتغليف 📦 #${id}`,
              message: 'يقوم فريق بركة ماركت 24 بتجهيز وتغليف مشترياتك بعناية.'
            },
            ready_for_pickup: {
              title: `طلبك جاهز للشحن والتوصيل 🛍️ #${id}`,
              message: 'تم الانتهاء من تجهيز طلبك وهو بانتظار استلام المندوب.'
            },
            out_for_delivery: {
              title: `طلبك في الطريق مع المندوب 🚚 #${id}`,
              message: 'المندوب في الطريق إلى عنوانك الآن لتسليم الطلب.'
            },
            on_the_way: {
              title: `طلبك في الطريق إليك 🛵 #${id}`,
              message: 'مندوب التوصيل انطلق بطلبك وسيكون عندك في أقرب وقت.'
            },
            delivered: {
              title: `تم تسليم طلبك بنجاح 🌟 #${id}`,
              message: 'شكراً لثقتك ببركة ماركت 24! نتمنى لك تجربة تسوق سعيدة.'
            },
            delivery_failed: {
              title: `تعذر تسليم الطلب #${id} ⚠️`,
              message: note ? `تعذر تسليم طلبك. السبب: ${note}` : 'تعذر تسليم الطلب، سيتواصل معك المندوب أو فريق خدمة العملاء.'
            },
            cancelled: {
              title: `تم إلغاء الطلب #${id} ✕`,
              message: note ? `تم إلغاء طلبك. السبب: ${note}` : 'تم إلغاء هذا الطلب. يرجى التواصل معنا للاستفسار.'
            },
            received: {
              title: `تم استلام طلبك #${id}`,
              message: 'طلبك قيد المراجعة في المتجر.'
            },
            pending: {
              title: `طلبك قيد الانتظار #${id}`,
              message: 'طلبك قيد المعالجة.'
            }
          };

          const notifInfo = statusMessages[status] || {
            title: `تحديث حالة طلبك #${id}`,
            message: `أصبحت حالة الطلب: ${ORDER_STATUS_LABELS[status] || status}`
          };

          const notifId = `notif-status-${id}-${status}-${Date.now()}`;
          const notifDocRef = doc(collections.notifications, notifId);
          await setDoc(notifDocRef, {
            id: notifId,
            userId: targetUserId,
            title: notifInfo.title,
            message: notifInfo.message,
            read: false,
            createdAt: formattedDate,
            type: 'order',
            targetOrderId: id,
            orderId: id
          });

          // Dispatch real push notification to customer device
          try {
            fetch('/api/send-notification', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                userId: targetUserId,
                orderId: id,
                title: notifInfo.title,
                body: notifInfo.message,
                type: 'order',
                url: `/?screen=orders&orderId=${id}`
              })
            }).catch(() => {});
          } catch {
            // Non-blocking
          }
        }
      } catch (notifErr) {
        console.warn('Could not dispatch status notification to customer:', notifErr);
      }
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
        const driverNotifTitle = `طلب توصيل جديد #${orderId} 🚚`;
        const driverNotifMsg = `تم تعيين الطلب #${orderId} لك للتوصيل في غرايفسفالد. يرجى مراجعة تفاصيل الطلب والانطلاق.`;

        await setDoc(notifDocRef, {
          id: notifId,
          userId: driverId,
          title: driverNotifTitle,
          message: driverNotifMsg,
          read: false,
          createdAt: formattedDate,
          type: 'order'
        });

        // Trigger real push to driver
        try {
          const driverPushPayload = {
            userId: driverId,
            role: 'driver',
            orderId: orderId,
            title: `طلب توصيل جديد #${orderId}`,
            body: `تم تعيين الطلب #${orderId} لك. اضغط لفتح التفاصيل.`,
            type: 'order',
            screen: 'driver',
            url: '/?screen=driver'
          };

          await fetch('/api/send-notification', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(driverPushPayload),
            keepalive: true
          });

          console.log(`[orderService] OneSignal Push sent successfully for Driver ${driverId} - Order #${orderId}`);
        } catch (driverPushErr) {
          console.warn('[orderService] Driver push failed (non-blocking):', driverPushErr);
        }
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

      // Dispatch notifications to customer and admin
      try {
        const orderData = orderDoc.exists() ? orderDoc.data() as any : null;
        const targetUserId = orderData?.userId;
        const driverName = orderData?.driverName || 'المندوب';

        if (targetUserId && targetUserId !== 'guest') {
          let custTitle = '';
          let custMsg = '';

          if (status === 'on_the_way') {
            custTitle = `المندوب في الطريق إليك 🚚 #${orderId}`;
            custMsg = `السائق ${driverName} في الطريق الآن إلى عنوانك لتسليم طلبك.`;
          } else if (status === 'delivered') {
            custTitle = `تم تسليم طلبك بنجاح 🌟 #${orderId}`;
            custMsg = 'تم تسليم مشترياتك بالكامل. شكراً لتسوقك من بركة ماركت 24!';
          } else if (status === 'delivery_failed') {
            custTitle = `تعذر تسليم طلبك #${orderId}`;
            custMsg = note ? `ملاحظة السائق: ${note}` : 'تعذر تسليم الطلب، سيتواصل معك فريق خدمة العملاء.';
          }

          if (custTitle) {
            const notifId = `notif-driver-upd-${orderId}-${status}-${Date.now()}`;
            const notifDocRef = doc(collections.notifications, notifId);
            await setDoc(notifDocRef, {
              id: notifId,
              userId: targetUserId,
              title: custTitle,
              message: custMsg,
              read: false,
              createdAt: formattedDate,
              type: 'order',
              targetOrderId: orderId,
              orderId: orderId
            });

            // Dispatch push notification to customer
            try {
              fetch('/api/send-notification', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  userId: targetUserId,
                  orderId: orderId,
                  title: custTitle,
                  body: custMsg,
                  type: 'order',
                  url: `/?screen=orders&orderId=${orderId}`
                })
              }).catch(() => {});
            } catch {}
          }
        }

        // Notify Admin on completed delivery or delivery failure
        if (status === 'delivered' || status === 'delivery_failed') {
          const adminNotifId = `notif-admin-del-${orderId}-${status}-${Date.now()}`;
          const adminNotifDocRef = doc(collections.notifications, adminNotifId);
          const adminTitle = status === 'delivered' ? `تم تسليم الطلب #${orderId} ✅` : `⚠️ تعذر تسليم الطلب #${orderId}`;
          const adminBody = status === 'delivered' 
            ? `قام السائق ${driverName} بتسليم الطلب #${orderId} بنجاح.` 
            : `تعذر تسليم الطلب #${orderId} بواسطة ${driverName}. ملاحظة: ${note || 'لا توجد ملاحظة'}`;

          await setDoc(adminNotifDocRef, {
            id: adminNotifId,
            userId: 'admin',
            title: adminTitle,
            message: adminBody,
            read: false,
            createdAt: formattedDate,
            type: 'order',
            targetOrderId: orderId,
            orderId: orderId
          });

          // Dispatch push notification to admin
          try {
            fetch('/api/send-notification', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                role: 'admin',
                orderId: orderId,
                title: adminTitle,
                body: adminBody,
                type: 'order',
                url: '/?screen=admin'
              })
            }).catch(() => {});
          } catch {}
        }
      } catch (notifErr) {
        console.warn('Could not dispatch driver status update notification:', notifErr);
      }

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

  // Submit / update customer note or issue on an order (Customer feature)
  async submitCustomerNote(orderId: string, note: string, category: string = 'general'): Promise<boolean> {
    const trimmedNote = (note || '').trim();
    if (!trimmedNote) {
      throw new Error('يرجى كتابة نص الملاحظة أو تفاصيل المشكلة');
    }

    const now = new Date();
    const formattedDate = `${now.toLocaleDateString('ar-SY', { day: 'numeric', month: 'short', year: 'numeric' })} - ${now.toLocaleTimeString('ar-SY', { hour: '2-digit', minute: '2-digit' })}`;

    try {
      const docRef = doc(collections.orders, orderId);
      const orderDoc = await getDoc(docRef);
      const isExistingNote = orderDoc.exists() && !!(orderDoc.data() as any).customerNote;
      const orderData = orderDoc.exists() ? orderDoc.data() as any : null;
      const customerName = orderData?.customerName || 'العميل';

      const existingMessages = Array.isArray(orderData?.customerNoteMessages) ? [...orderData.customerNoteMessages] : [];
      const newMsg = {
        id: `msg-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        sender: 'customer' as const,
        senderName: customerName,
        text: trimmedNote,
        createdAt: formattedDate,
        timestamp: now.toISOString()
      };
      existingMessages.push(newMsg);

      const updates: any = {
        customerNote: trimmedNote,
        customerNoteCategory: category,
        customerNoteStatus: 'open',
        customerNoteUpdatedAt: formattedDate,
        customerNoteMessages: existingMessages,
        updatedAt: formattedDate
      };

      if (!isExistingNote) {
        updates.customerNoteCreatedAt = formattedDate;
      }

      await updateDoc(docRef, updates);

      // Send In-App notification to Admin about the customer note / issue
      try {
        const displayOrderId = orderData?.orderId || orderId;

        const notifId = `notif-admin-note-${orderId}-${Date.now()}`;
        const notifDocRef = doc(collections.notifications, notifId);
        await setDoc(notifDocRef, {
          id: notifId,
          userId: 'admin',
          title: `📝 ملاحظة / مشكلة جديدة على الطلب #${displayOrderId}`,
          message: `أرسل ${customerName} ملاحظة بخصوص الطلب #${displayOrderId}: "${trimmedNote.slice(0, 90)}${trimmedNote.length > 90 ? '...' : ''}"`,
          read: false,
          createdAt: formattedDate,
          type: 'order',
          targetOrderId: orderId,
          orderId: orderId
        });
      } catch (notifErr) {
        console.warn('Could not dispatch admin notification for customer note:', notifErr);
      }

      // Update local cache if present
      const order = this.localOrdersCache.find(o => o.id === orderId || o.orderId === orderId);
      if (order) {
        order.customerNote = trimmedNote;
        order.customerNoteCategory = category;
        order.customerNoteStatus = 'open';
        order.customerNoteUpdatedAt = formattedDate;
        order.customerNoteMessages = existingMessages;
        if (!isExistingNote) {
          order.customerNoteCreatedAt = formattedDate;
        }
      }

      return true;
    } catch (e: any) {
      console.error('Error submitting customer note:', e);
      throw new Error(e?.message || 'تعذر إرسال الملاحظة على الطلب، يرجى المحاولة ثانية');
    }
  }

  // Admin reply to customer note (Admin feature)
  async replyToCustomerNote(orderId: string, replyText: string, newStatus: 'replied' | 'resolved' = 'replied'): Promise<boolean> {
    const trimmedReply = (replyText || '').trim();
    if (!trimmedReply) {
      throw new Error('يرجى كتابة نص الرد للعميل');
    }

    const now = new Date();
    const formattedDate = `${now.toLocaleDateString('ar-SY', { day: 'numeric', month: 'short', year: 'numeric' })} - ${now.toLocaleTimeString('ar-SY', { hour: '2-digit', minute: '2-digit' })}`;

    try {
      const docRef = doc(collections.orders, orderId);
      const orderDoc = await getDoc(docRef);
      const orderData = orderDoc.exists() ? orderDoc.data() as any : null;

      const existingMessages = Array.isArray(orderData?.customerNoteMessages) ? [...orderData.customerNoteMessages] : [];
      
      // If messages thread was empty but order had an existing customerNote, seed it first
      if (existingMessages.length === 0 && orderData?.customerNote) {
        existingMessages.push({
          id: `msg-cust-initial-${orderId}`,
          sender: 'customer' as const,
          senderName: orderData.customerName || 'العميل',
          text: orderData.customerNote,
          createdAt: orderData.customerNoteCreatedAt || orderData.customerNoteUpdatedAt || formattedDate,
          timestamp: orderData.timestamp || now.toISOString()
        });
      }

      // Append new admin reply message
      existingMessages.push({
        id: `msg-admin-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        sender: 'admin' as const,
        senderName: 'إدارة بركة ماركت 24',
        text: trimmedReply,
        createdAt: formattedDate,
        timestamp: now.toISOString()
      });

      const updates: any = {
        adminReply: trimmedReply,
        adminReplyCreatedAt: formattedDate,
        customerNoteStatus: newStatus,
        customerNoteUpdatedAt: formattedDate,
        customerNoteMessages: existingMessages,
        updatedAt: formattedDate
      };

      await updateDoc(docRef, updates);

      // Send In-App notification to Customer about the admin reply
      try {
        const targetUserId = orderData?.userId;
        const displayOrderId = orderData?.orderId || orderId;

        if (targetUserId && targetUserId !== 'guest') {
          const notifId = `notif-cust-reply-${orderId}-${Date.now()}`;
          const notifDocRef = doc(collections.notifications, notifId);
          await setDoc(notifDocRef, {
            id: notifId,
            userId: targetUserId,
            title: `💬 رد جديد من إدارة بركة ماركت على طلبك #${displayOrderId}`,
            message: `رد الإدارة: "${trimmedReply.slice(0, 100)}${trimmedReply.length > 100 ? '...' : ''}"`,
            read: false,
            createdAt: formattedDate,
            type: 'order',
            targetOrderId: orderId,
            orderId: orderId
          });
        }
      } catch (notifErr) {
        console.warn('Could not dispatch customer notification for admin reply:', notifErr);
      }

      // Update local cache
      const order = this.localOrdersCache.find(o => o.id === orderId || o.orderId === orderId);
      if (order) {
        order.adminReply = trimmedReply;
        order.adminReplyCreatedAt = formattedDate;
        order.customerNoteStatus = newStatus;
        order.customerNoteUpdatedAt = formattedDate;
        order.customerNoteMessages = existingMessages;
      }

      return true;
    } catch (e: any) {
      console.error('Error replying to customer note:', e);
      throw new Error(e?.message || 'تعذر تسجيل رد الإدارة، يرجى المحاولة ثانية');
    }
  }

  // Update customer note status directly (Admin feature: e.g. resolve)
  async updateCustomerNoteStatus(orderId: string, status: CustomerNoteStatus): Promise<boolean> {
    const now = new Date();
    const formattedDate = `${now.toLocaleDateString('ar-SY', { day: 'numeric', month: 'short', year: 'numeric' })} - ${now.toLocaleTimeString('ar-SY', { hour: '2-digit', minute: '2-digit' })}`;

    try {
      const docRef = doc(collections.orders, orderId);
      await updateDoc(docRef, {
        customerNoteStatus: status,
        customerNoteUpdatedAt: formattedDate,
        updatedAt: formattedDate
      });

      const order = this.localOrdersCache.find(o => o.id === orderId || o.orderId === orderId);
      if (order) {
        order.customerNoteStatus = status;
        order.customerNoteUpdatedAt = formattedDate;
      }
      return true;
    } catch (e: any) {
      console.error('Error updating customer note status:', e);
      return false;
    }
  }

  // Delete a specific customer complaint / note from an order (Admin only)
  async deleteCustomerComplaint(orderId: string): Promise<boolean> {
    const now = new Date();
    const formattedDate = `${now.toLocaleDateString('ar-SY', { day: 'numeric', month: 'short', year: 'numeric' })} - ${now.toLocaleTimeString('ar-SY', { hour: '2-digit', minute: '2-digit' })}`;

    try {
      const docRef = doc(collections.orders, orderId);
      await updateDoc(docRef, {
        customerNote: '',
        customerNoteCategory: null,
        customerNoteStatus: null,
        customerNoteCreatedAt: null,
        customerNoteUpdatedAt: null,
        customerNoteMessages: [],
        adminReply: '',
        adminReplyCreatedAt: null,
        updatedAt: formattedDate
      });

      const order = this.localOrdersCache.find(o => o.id === orderId || o.orderId === orderId);
      if (order) {
        order.customerNote = '';
        delete order.customerNoteCategory;
        delete order.customerNoteStatus;
        delete order.customerNoteCreatedAt;
        delete order.customerNoteUpdatedAt;
        order.customerNoteMessages = [];
        order.adminReply = '';
        delete order.adminReplyCreatedAt;
        order.updatedAt = formattedDate;
      }

      return true;
    } catch (e: any) {
      console.error('Error deleting complaint:', e);
      throw new Error(e?.message || 'تعذر حذف الشكوى، يرجى المحاولة ثانية');
    }
  }

  // Delete all complaints / notes history across orders (Admin only)
  async deleteAllComplaints(targetOrderIds?: string[]): Promise<{ count: number }> {
    const now = new Date();
    const formattedDate = `${now.toLocaleDateString('ar-SY', { day: 'numeric', month: 'short', year: 'numeric' })} - ${now.toLocaleTimeString('ar-SY', { hour: '2-digit', minute: '2-digit' })}`;

    try {
      let ordersWithComplaints: Order[] = [];

      if (targetOrderIds && targetOrderIds.length > 0) {
        ordersWithComplaints = this.localOrdersCache.filter(o => 
          (targetOrderIds.includes(o.id) || (o.orderId && targetOrderIds.includes(o.orderId))) &&
          (Boolean(o.customerNote && o.customerNote.trim()) || (Array.isArray(o.customerNoteMessages) && o.customerNoteMessages.length > 0))
        );
      } else {
        ordersWithComplaints = this.localOrdersCache.filter(o => 
          Boolean(o.customerNote && o.customerNote.trim()) || (Array.isArray(o.customerNoteMessages) && o.customerNoteMessages.length > 0)
        );
      }

      if (ordersWithComplaints.length === 0) {
        try {
          const q = collections.orders;
          const snap = await getDocs(q);
          ordersWithComplaints = snap.docs
            .map(d => ({ ...d.data(), id: d.id } as Order))
            .filter(o => Boolean(o.customerNote && o.customerNote.trim()) || (Array.isArray(o.customerNoteMessages) && o.customerNoteMessages.length > 0));
        } catch (fetchErr) {
          console.warn('Could not fetch complaints for deletion:', fetchErr);
        }
      }

      if (ordersWithComplaints.length === 0) {
        return { count: 0 };
      }

      let clearedCount = 0;
      const chunkSize = 200;
      for (let i = 0; i < ordersWithComplaints.length; i += chunkSize) {
        const chunk = ordersWithComplaints.slice(i, i + chunkSize);
        const batch = writeBatch(db);

        for (const ord of chunk) {
          const docRef = doc(collections.orders, ord.id);
          batch.update(docRef, {
            customerNote: '',
            customerNoteCategory: null,
            customerNoteStatus: null,
            customerNoteCreatedAt: null,
            customerNoteUpdatedAt: null,
            customerNoteMessages: [],
            adminReply: '',
            adminReplyCreatedAt: null,
            updatedAt: formattedDate
          });
        }

        await batch.commit();
        clearedCount += chunk.length;
      }

      for (const ord of ordersWithComplaints) {
        const local = this.localOrdersCache.find(o => o.id === ord.id || o.orderId === ord.id);
        if (local) {
          local.customerNote = '';
          delete local.customerNoteCategory;
          delete local.customerNoteStatus;
          delete local.customerNoteCreatedAt;
          delete local.customerNoteUpdatedAt;
          local.customerNoteMessages = [];
          local.adminReply = '';
          delete local.adminReplyCreatedAt;
          local.updatedAt = formattedDate;
        }
      }

      return { count: clearedCount };
    } catch (e: any) {
      console.error('Error clearing complaints history:', e);
      throw new Error(e?.message || 'تعذر حذف سجل الشكاوى');
    }
  }

  // Delete single completed or cancelled order (Admin only)
  async deleteOrder(orderId: string): Promise<boolean> {
    try {
      const docRef = doc(collections.orders, orderId);
      const snap = await getDoc(docRef);
      if (!snap.exists()) {
        throw new Error('لم يتم العثور على الطلب المطلوب حذفه');
      }

      const orderData = snap.data() as any;
      const status: OrderStatus = orderData.status;
      const protectedStatuses: OrderStatus[] = [
        'received', 
        'pending', 
        'confirmed', 
        'preparing', 
        'ready_for_pickup', 
        'on_the_way', 
        'out_for_delivery'
      ];

      if (protectedStatuses.includes(status)) {
        throw new Error('لا يمكن حذف الطلبات النشطة لحماية سير العمل والتوصيل. يمكن فقط حذف الطلبات المسلمة أو الملغاة.');
      }

      const batch = writeBatch(db);

      // 1. Delete order doc
      batch.delete(docRef);

      // 2. Delete all related orderItems docs to prevent orphaned data
      try {
        const itemsQuery = query(collections.orderItems, where('orderId', '==', orderId));
        const itemsSnap = await getDocs(itemsQuery);
        itemsSnap.forEach(itemDoc => {
          batch.delete(itemDoc.ref);
        });
      } catch (itemErr) {
        console.warn('Could not query orderItems for deletion:', itemErr);
      }

      await batch.commit();

      // Remove from local cache
      this.localOrdersCache = this.localOrdersCache.filter(o => o.id !== orderId && o.orderId !== orderId);
      return true;
    } catch (e: any) {
      console.error('Error deleting order:', e);
      throw new Error(e?.message || 'تعذر حذف الطلب، يرجى المحاولة ثانية');
    }
  }

  // Delete all old / completed orders in batch (Admin only - delivered / cancelled / delivery_failed only)
  async deleteOldOrders(targetOrderIds?: string[]): Promise<{ count: number }> {
    try {
      let ordersToDelete: Order[] = [];

      if (targetOrderIds && targetOrderIds.length > 0) {
        ordersToDelete = this.localOrdersCache.filter(o => 
          targetOrderIds.includes(o.id) || (o.orderId && targetOrderIds.includes(o.orderId))
        );
      } else {
        ordersToDelete = this.localOrdersCache.filter(o => 
          o.status === 'delivered' || o.status === 'cancelled' || o.status === 'delivery_failed'
        );
      }

      // If local cache had 0, try fetching from Firestore
      if (ordersToDelete.length === 0) {
        try {
          const q = collections.orders;
          const snap = await getDocs(q);
          ordersToDelete = snap.docs
            .map(d => ({ ...d.data(), id: d.id } as Order))
            .filter(o => o.status === 'delivered' || o.status === 'cancelled' || o.status === 'delivery_failed');
        } catch (fetchErr) {
          console.warn('Could not fetch old orders for deletion:', fetchErr);
        }
      }

      // Filter strictly only deletable statuses
      const validDeletable = ordersToDelete.filter(o => 
        o.status === 'delivered' || o.status === 'cancelled' || o.status === 'delivery_failed'
      );

      if (validDeletable.length === 0) {
        return { count: 0 };
      }

      // Process in chunks of 200 to stay well under Firestore batch limit
      let deletedCount = 0;
      const chunkSize = 200;
      for (let i = 0; i < validDeletable.length; i += chunkSize) {
        const chunk = validDeletable.slice(i, i + chunkSize);
        const batch = writeBatch(db);

        for (const ord of chunk) {
          const docRef = doc(collections.orders, ord.id);
          batch.delete(docRef);

          // Delete order items
          try {
            const itemsQuery = query(collections.orderItems, where('orderId', '==', ord.id));
            const itemsSnap = await getDocs(itemsQuery);
            itemsSnap.forEach(itemDoc => {
              batch.delete(itemDoc.ref);
            });
          } catch (err) {
            console.warn('Could not query orderItems for batch deletion:', err);
          }
        }

        await batch.commit();
        deletedCount += chunk.length;
      }

      const deletedIds = new Set(validDeletable.map(o => o.id));
      this.localOrdersCache = this.localOrdersCache.filter(o => !deletedIds.has(o.id));

      return { count: deletedCount };
    } catch (e: any) {
      console.error('Error deleting old orders batch:', e);
      throw new Error(e?.message || 'تعذر حذف سجل الطلبات القديمة');
    }
  }

  // Delete all completed sales (delivered orders only) in batch (Admin only for trial reset)
  async deleteAllSales(): Promise<{ count: number; totalAmount: number }> {
    try {
      let salesToDelete: Order[] = this.localOrdersCache.filter(o => o.status === 'delivered');

      if (salesToDelete.length === 0) {
        try {
          const q = query(collections.orders, where('status', '==', 'delivered'));
          const snap = await getDocs(q);
          salesToDelete = snap.docs.map(d => ({ ...d.data(), id: d.id } as Order));
        } catch (fetchErr) {
          console.warn('Could not fetch delivered orders for sales deletion:', fetchErr);
        }
      }

      // Strictly ensure only delivered orders are processed
      const validSales = salesToDelete.filter(o => o.status === 'delivered');

      if (validSales.length === 0) {
        return { count: 0, totalAmount: 0 };
      }

      const totalAmount = validSales.reduce((sum, ord) => sum + (ord.total || 0), 0);

      // Process in chunks of 200
      let deletedCount = 0;
      const chunkSize = 200;
      for (let i = 0; i < validSales.length; i += chunkSize) {
        const chunk = validSales.slice(i, i + chunkSize);
        const batch = writeBatch(db);

        for (const ord of chunk) {
          const docRef = doc(collections.orders, ord.id);
          batch.delete(docRef);

          try {
            const itemsQuery = query(collections.orderItems, where('orderId', '==', ord.id));
            const itemsSnap = await getDocs(itemsQuery);
            itemsSnap.forEach(itemDoc => {
              batch.delete(itemDoc.ref);
            });
          } catch (err) {
            console.warn('Could not query orderItems for sales batch deletion:', err);
          }
        }

        await batch.commit();
        deletedCount += chunk.length;
      }

      const deletedIds = new Set(validSales.map(o => o.id));
      this.localOrdersCache = this.localOrdersCache.filter(o => !deletedIds.has(o.id));

      return { count: deletedCount, totalAmount };
    } catch (e: any) {
      console.error('Error deleting all sales records:', e);
      throw new Error(e?.message || 'تعذر حذف سجل المبيعات');
    }
  }
}

export const orderService = new OrderService();
