import { telegramService } from "./telegram.service.js";
import { storeConfig } from "../config/theme.config.js";
import { normalizeEgyptianPhone, generateOrderId } from "../lib/utils.js";

// In-memory runtime order store (synchronized across requests during server runtime)
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
        unitPrice: 235,
        itemTotal: 235,
      },
      {
        id: "pepsi-can",
        name: "كانز بيبسي مثلج 330 مل",
        quantity: 2,
        selectedSize: { id: "can", name: "كانز 330 مل", price: 20 },
        selectedAddons: [],
        unitPrice: 20,
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
        unitPrice: 255,
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
    return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },

  /**
   * Get single order by ID
   */
  async getOrderById(id) {
    if (!id) return null;
    const cleanId = String(id).replace("#", "").trim();
    return runtimeOrders.find((o) => String(o.id) === cleanId) || null;
  },

  /**
   * Create a new order with deep mathematical and validation verification
   */
  async createOrder({ customerName, customerPhone, orderType, customerAddress, notes, items }) {
    // 1. Validate customer name
    const cleanName = (customerName || "").trim();
    if (!cleanName || cleanName.length < 2) {
      throw new Error("يرجى إدخال اسم العميل بشكل صحيح (حرفين على الأقل)");
    }

    // 2. Validate and normalize Egyptian phone number
    const phoneCheck = normalizeEgyptianPhone(customerPhone);
    if (!phoneCheck.isValid) {
      throw new Error(phoneCheck.error || "يرجى إدخال رقم هاتف مصري صحيح");
    }

    // 3. Validate items list
    if (!Array.isArray(items) || items.length === 0) {
      throw new Error("سلة الطلبات فارغة، يرجى اختيار الأصناف أولاً");
    }

    // 4. Validate order type and delivery address
    const safeOrderType = orderType === "delivery" ? "delivery" : "pickup";
    const cleanAddress = (customerAddress || "").trim();
    if (safeOrderType === "delivery" && cleanAddress.length < 5) {
      throw new Error("يرجى إدخال عنوان التوصيل بالتفصيل (الشارع، رقم العمارة، العلامة المميزة)");
    }

    // 5. Server-side mathematical validation of each item
    const verifiedItems = items.map((item) => {
      const basePrice = Math.max(0, Number(item.selectedSize?.price ?? item.basePrice ?? 0));
      const addonsPrice = (item.selectedAddons || []).reduce(
        (sum, a) => sum + Math.max(0, Number(a?.price || 0)),
        0
      );
      const unitPrice = Math.round((basePrice + addonsPrice) * 100) / 100;
      const quantity = Math.min(99, Math.max(1, Math.floor(Number(item.quantity) || 1)));
      const itemTotal = Math.round(unitPrice * quantity * 100) / 100;

      return {
        id: String(item.productId || item.id || "item"),
        name: String(item.name || "صنف بدون اسم"),
        categoryName: String(item.categoryName || ""),
        quantity,
        selectedSize: item.selectedSize || null,
        selectedAddons: item.selectedAddons || [],
        unitPrice,
        itemTotal,
      };
    });

    const subtotal = Math.round(
      verifiedItems.reduce((acc, item) => acc + item.itemTotal, 0) * 100
    ) / 100;

    const deliveryFee = safeOrderType === "delivery" ? storeConfig.deliveryFee : 0;
    const totalAmount = Math.round((subtotal + deliveryFee) * 100) / 100;

    const newOrder = {
      id: generateOrderId(),
      customerName: cleanName,
      customerPhone: phoneCheck.normalized,
      orderType: safeOrderType,
      customerAddress: safeOrderType === "delivery" ? cleanAddress : "",
      notes: (notes || "").trim(),
      status: "pending",
      items: verifiedItems,
      subtotal,
      deliveryFee,
      totalAmount,
      createdAt: new Date().toISOString(),
    };

    runtimeOrders.unshift(newOrder);

    // Trigger Telegram notification in background without blocking response
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
    const cleanId = String(orderId).replace("#", "").trim();
    const order = runtimeOrders.find((o) => String(o.id) === cleanId);
    if (!order) {
      throw new Error("الطلب غير موجود");
    }

    const validStatuses = ["pending", "preparing", "ready", "completed", "cancelled"];
    if (!validStatuses.includes(newStatus)) {
      throw new Error("حالة الطلب غير صالحة");
    }

    order.status = newStatus;
    order.updatedAt = new Date().toISOString();
    return order;
  },
};
