import { telegramService } from "./telegram.service";
import { storeConfig } from "@/config/theme.config";

// In-memory runtime order store (synchronized across client/server during runtime)
let runtimeOrders = [
  {
    id: "7821",
    customerName: "أحمد إبراهيم",
    customerPhone: "01012345678",
    orderType: "pickup",
    customerAddress: "",
    notes: "ياريت زيادة تومية ومخلل",
    status: "pending", // pending | preparing | ready | completed | cancelled
    items: [
      {
        id: "pizza-chicken-ranch",
        name: "بيتزا تشيكن رانش",
        quantity: 1,
        selectedSize: { id: "medium", name: "وسط", price: 200 },
        selectedAddons: [{ id: "extra-mozzarella", name: "إضافة جبنة موتزاريلا", price: 35 }],
        itemTotal: 235,
      },
      {
        id: "pepsi-can",
        name: "كانز بيبسي مثلج 330 مل",
        quantity: 2,
        selectedSize: { id: "can", name: "كانز 330 مل", price: 20 },
        selectedAddons: [],
        itemTotal: 40,
      },
    ],
    subtotal: 275,
    deliveryFee: 0,
    totalAmount: 275,
    createdAt: new Date(Date.now() - 1000 * 60 * 12).toISOString(), // 12 mins ago
  },
  {
    id: "7820",
    customerName: "محمود حسن",
    customerPhone: "01234567890",
    orderType: "delivery",
    customerAddress: "شارع خلوصي - أمام مدرسة التوفيقية - الدور الرابع",
    notes: "رن جرس الباب",
    status: "preparing",
    items: [
      {
        id: "broast-half-meal",
        name: "نصف فرخة بروستد (5 قطع)",
        quantity: 1,
        selectedSize: { id: "half-5", name: "نصف (5 قطع)", price: 240 },
        selectedAddons: [{ id: "extra-tomia", name: "علبة تومية إضافية", price: 15 }],
        itemTotal: 255,
      },
    ],
    subtotal: 255,
    deliveryFee: storeConfig.deliveryFee,
    totalAmount: 255 + storeConfig.deliveryFee,
    createdAt: new Date(Date.now() - 1000 * 60 * 35).toISOString(), // 35 mins ago
  },
];

export const ordersService = {
  /**
   * Get all orders with optional status filter
   */
  async getOrders({ status } = {}) {
    let list = [...runtimeOrders];
    if (status && status !== "all") {
      list = list.filter((o) => o.status === status);
    }
    // Return newest first
    return list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  },

  /**
   * Get single order by ID
   */
  async getOrderById(id) {
    return runtimeOrders.find((o) => o.id === id) || null;
  },

  /**
   * Create a new order with server-side mathematical validation
   */
  async createOrder({ customerName, customerPhone, orderType, customerAddress, notes, items }) {
    if (!customerName || !customerName.trim()) {
      throw new Error("يرجى إدخال اسم العميل");
    }
    if (!customerPhone || !customerPhone.trim()) {
      throw new Error("يرجى إدخال رقم هاتف العميل");
    }
    if (!items || items.length === 0) {
      throw new Error("سلة الطلبات فارغة");
    }

    // Calculate subtotal accurately
    const verifiedItems = items.map((item) => {
      const basePrice = Number(item.selectedSize?.price || item.basePrice || 0);
      const addonsPrice = (item.selectedAddons || []).reduce((acc, a) => acc + Number(a.price || 0), 0);
      const singleUnitPrice = basePrice + addonsPrice;
      const quantity = Math.max(1, Number(item.quantity) || 1);
      const itemTotal = singleUnitPrice * quantity;

      return {
        ...item,
        unitPrice: singleUnitPrice,
        quantity,
        itemTotal,
      };
    });

    const subtotal = verifiedItems.reduce((acc, item) => acc + item.itemTotal, 0);
    const deliveryFee = orderType === "delivery" ? storeConfig.deliveryFee : 0;
    const totalAmount = subtotal + deliveryFee;

    const newOrder = {
      id: Math.floor(1000 + Math.random() * 9000).toString(), // 4-digit code e.g. 7822
      customerName: customerName.trim(),
      customerPhone: customerPhone.trim(),
      orderType: orderType || "pickup",
      customerAddress: orderType === "delivery" ? (customerAddress || "").trim() : "",
      notes: (notes || "").trim(),
      status: "pending",
      items: verifiedItems,
      subtotal,
      deliveryFee,
      totalAmount,
      createdAt: new Date().toISOString(),
    };

    runtimeOrders.unshift(newOrder);

    // Trigger Telegram notification in background
    telegramService.notifyNewOrder(newOrder).catch((err) => {
      console.error("Failed to dispatch telegram notification:", err);
    });

    return newOrder;
  },

  /**
   * Update order status
   * Allowed statuses: 'pending' | 'preparing' | 'ready' | 'completed' | 'cancelled'
   */
  async updateOrderStatus(orderId, newStatus) {
    const order = runtimeOrders.find((o) => o.id === orderId);
    if (!order) {
      throw new Error("الطلب غير موجود");
    }
    order.status = newStatus;
    order.updatedAt = new Date().toISOString();
    return order;
  },
};

