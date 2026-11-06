import {
  ensureDatabaseInitialized,
  query,
  queryOne,
  execute,
  batch,
  toPiastres,
  toEgp,
} from "../lib/db.js";
import {
  sanitizeText,
  sanitizeNotes,
  validateGoogleMapsUrl,
  validateSortColumn,
  validateSortOrder,
} from "../lib/sanitizer.js";
import { PRODUCTS } from "../data/menu.data.js";
import { telegramService } from "./telegram.service.js";
import { normalizeEgyptianPhone, generateOrderId } from "../lib/utils.js";

const ALLOWED_ORDER_SORT_COLUMNS = ["created_at", "total_amount_piastres", "status"];

export const ordersService = {
  /**
   * Get paginated orders with strict sorting allowlist and relational items breakdown
   * Returns clean { data: orders, pagination: { total, page, limit, totalPages } }
   */
  async getOrders({
    status = "all",
    page = 1,
    limit = 50,
    sortBy = "created_at",
    sortOrder = "DESC",
  } = {}) {
    await ensureDatabaseInitialized();

    const safePage = Math.max(1, Math.floor(Number(page) || 1));
    const safeLimit = Math.min(100, Math.max(1, Math.floor(Number(limit) || 50)));
    const offset = (safePage - 1) * safeLimit;

    // Strict allowlist validation to eliminate SQL injection on ORDER BY
    const safeSortCol = validateSortColumn(sortBy, ALLOWED_ORDER_SORT_COLUMNS, "created_at");
    const safeSortDir = validateSortOrder(sortOrder, "DESC");

    // 1. Total Count Query
    let countSql = "SELECT COUNT(*) as total FROM orders o";
    const countArgs = [];
    if (status && status !== "all") {
      countSql += " WHERE o.status = ?";
      countArgs.push(status);
    }
    const countRow = await queryOne(countSql, countArgs);
    const totalCount = countRow ? Number(countRow.total) : 0;

    // 2. Paginated Data Query
    let sql = `
      SELECT 
        o.id,
        o.idempotency_key as idempotencyKey,
        o.customer_name as customerName,
        o.customer_phone as customerPhone,
        o.order_type as orderType,
        o.customer_address as customerAddress,
        o.delivery_zone_id as deliveryZoneId,
        o.delivery_zone_name as deliveryZone,
        o.google_maps_url as googleMapsUrl,
        o.notes,
        o.status,
        o.payment_method as paymentMethod,
        o.payment_status as paymentStatus,
        o.subtotal_piastres as subtotalPiastres,
        o.delivery_fee_piastres as deliveryFeePiastres,
        o.total_amount_piastres as totalAmountPiastres,
        o.created_at as createdAt,
        o.updated_at as updatedAt
      FROM orders o
    `;

    const args = [];
    if (status && status !== "all") {
      sql += " WHERE o.status = ?";
      args.push(status);
    }
    sql += ` ORDER BY o.${safeSortCol} ${safeSortDir} LIMIT ? OFFSET ?`;
    args.push(safeLimit, offset);

    const orders = await query(sql, args);
    if (orders.length === 0) {
      const emptyResult = [];
      emptyResult.data = emptyResult;
      emptyResult.pagination = {
        total: totalCount,
        page: safePage,
        limit: safeLimit,
        totalPages: Math.ceil(totalCount / safeLimit) || 1,
      };
      return emptyResult;
    }

    // 3. Fetch relational items for returned orders
    const orderIds = orders.map((o) => o.id);
    const placeholders = orderIds.map(() => "?").join(",");
    const items = await query(
      `SELECT * FROM order_items WHERE order_id IN (${placeholders}) ORDER BY id ASC`,
      orderIds
    );

    const itemsByOrder = {};
    items.forEach((item) => {
      if (!itemsByOrder[item.order_id]) itemsByOrder[item.order_id] = [];
      let parsedAddons = [];
      try {
        parsedAddons = JSON.parse(item.selected_addons_json || "[]");
      } catch (e) {
        parsedAddons = [];
      }

      itemsByOrder[item.order_id].push({
        id: item.product_id,
        name: item.product_name,
        quantity: item.quantity,
        selectedSize: item.selected_size_id
          ? { id: item.selected_size_id, name: item.selected_size_name }
          : null,
        selectedAddons: parsedAddons,
        unitPrice: toEgp(item.unit_price_piastres),
        itemTotal: toEgp(item.item_total_piastres),
      });
    });

    const result = orders.map((o) => ({
      ...o,
      subtotal: toEgp(o.subtotalPiastres),
      deliveryFee: toEgp(o.deliveryFeePiastres),
      totalAmount: toEgp(o.totalAmountPiastres),
      items: itemsByOrder[o.id] || [],
    }));

    // Attach both array methods and top-level data/pagination for 100% compatibility
    result.data = result;
    result.pagination = {
      total: totalCount,
      page: safePage,
      limit: safeLimit,
      totalPages: Math.ceil(totalCount / safeLimit) || 1,
    };

    return result;
  },

  /**
   * Get single order by ID with its relational items breakdown
   */
  async getOrderById(id) {
    if (!id) return null;
    await ensureDatabaseInitialized();

    const cleanId = String(id).replace("#", "").trim();
    const order = await queryOne(
      `SELECT 
        id,
        idempotency_key as idempotencyKey,
        customer_name as customerName,
        customer_phone as customerPhone,
        order_type as orderType,
        customer_address as customerAddress,
        delivery_zone_id as deliveryZoneId,
        delivery_zone_name as deliveryZone,
        google_maps_url as googleMapsUrl,
        notes,
        status,
        payment_method as paymentMethod,
        payment_status as paymentStatus,
        subtotal_piastres as subtotalPiastres,
        delivery_fee_piastres as deliveryFeePiastres,
        total_amount_piastres as totalAmountPiastres,
        created_at as createdAt,
        updated_at as updatedAt
       FROM orders WHERE id = ?`,
      [cleanId]
    );

    if (!order) return null;

    const items = await query(
      "SELECT * FROM order_items WHERE order_id = ? ORDER BY id ASC",
      [cleanId]
    );

    const formattedItems = items.map((item) => {
      let parsedAddons = [];
      try {
        parsedAddons = JSON.parse(item.selected_addons_json || "[]");
      } catch (e) {
        parsedAddons = [];
      }
      return {
        id: item.product_id,
        name: item.product_name,
        quantity: item.quantity,
        selectedSize: item.selected_size_id
          ? { id: item.selected_size_id, name: item.selected_size_name }
          : null,
        selectedAddons: parsedAddons,
        unitPrice: toEgp(item.unit_price_piastres),
        itemTotal: toEgp(item.item_total_piastres),
      };
    });

    return {
      ...order,
      subtotal: toEgp(order.subtotalPiastres),
      deliveryFee: toEgp(order.deliveryFeePiastres),
      totalAmount: toEgp(order.totalAmountPiastres),
      items: formattedItems,
    };
  },

  /**
   * Create a new order with ZERO-TRUST server-side price recalculation,
   * Idempotency protection with concurrency race-condition recovery,
   * Strict quantity & order-type validation, Anti-phishing Maps check, and atomic SQL transaction.
   */
  async createOrder({
    idempotencyKey = null,
    customerName,
    customerPhone,
    orderType,
    customerAddress = "",
    deliveryZone = "",
    googleMapsUrl = "",
    notes = "",
    items,
  }) {
    await ensureDatabaseInitialized();

    // 1. Idempotency Key Sanitization (Empty string must be null so SQLite allows multiple nulls)
    let cleanIdempotencyKey = null;
    if (idempotencyKey && String(idempotencyKey).trim()) {
      cleanIdempotencyKey = sanitizeText(idempotencyKey, 64) || null;
      if (cleanIdempotencyKey) {
        const existing = await queryOne(
          "SELECT id FROM orders WHERE idempotency_key = ?",
          [cleanIdempotencyKey]
        );
        if (existing) {
          return this.getOrderById(existing.id);
        }
      }
    }

    // 2. Customer Name Validation & Sanitization (Max 100 chars, Anti-XSS)
    const cleanName = sanitizeText(customerName, 100);
    if (!cleanName || cleanName.length < 2) {
      throw new Error("يرجى إدخال اسم العميل بشكل صحيح (حرفين على الأقل وبدون أكواد)");
    }

    // 3. Egyptian Mobile Phone Validation & Normalization
    const phoneCheck = normalizeEgyptianPhone(customerPhone);
    if (!phoneCheck.isValid) {
      throw new Error(phoneCheck.error || "يرجى إدخال رقم هاتف مصري صحيح (010, 011, 012, 015)");
    }

    // 4. Order Type Strict Validation (Zero silent fallback)
    if (!["delivery", "pickup"].includes(orderType)) {
      throw new Error("نوع الطلب غير صحيح (يجب أن يكون توصيل 'delivery' أو استلام من الفرع 'pickup')");
    }
    const safeOrderType = orderType;

    // 5. Items List Validation
    if (!Array.isArray(items) || items.length === 0) {
      throw new Error("سلة الطلبات فارغة، يرجى اختيار الأصناف أولاً");
    }

    // 6. Delivery Zone & Address Verification
    let verifiedZoneId = null;
    let verifiedZoneName = "";
    let deliveryFeePiastres = 0;
    let cleanAddress = "";

    if (safeOrderType === "delivery") {
      cleanAddress = sanitizeText(customerAddress, 300);
      if (cleanAddress.length < 5) {
        throw new Error("يرجى إدخال عنوان التوصيل بالتفصيل (الشارع، رقم العمارة، الشقة)");
      }

      const zoneQuery = sanitizeText(deliveryZone, 100);
      if (!zoneQuery) {
        throw new Error("يرجى اختيار منطقة التوصيل من القائمة المتاحة");
      }

      const matchedZone = await queryOne(
        "SELECT * FROM delivery_zones WHERE id = ? OR name = ?",
        [zoneQuery, zoneQuery]
      );

      if (!matchedZone) {
        throw new Error("عفواً، منطقة التوصيل المحددة غير معروفة أو تم حذفها");
      }

      if (matchedZone.is_covered !== 1) {
        throw new Error(`عفواً، منطقة "${matchedZone.name}" معطلة أو خارج نطاق التوصيل حالياً`);
      }

      verifiedZoneId = matchedZone.id;
      verifiedZoneName = matchedZone.name;
      deliveryFeePiastres = Number(matchedZone.fee_piastres);
    } else {
      // Pickup order: strictly zero delivery fee, no delivery zone
      verifiedZoneId = null;
      verifiedZoneName = "";
      deliveryFeePiastres = 0;
      cleanAddress = "";
    }

    // 7. ZERO-TRUST SERVER-SIDE PRICE RECALCULATION (IN PIASTRES)
    // The client's sent unitPrice and itemTotal are completely IGNORED.
    let calculatedSubtotalPiastres = 0;
    const verifiedOrderItems = [];

    for (const clientItem of items) {
      const rawProductId = sanitizeText(clientItem.productId || clientItem.id || "", 100);
      const product = PRODUCTS.find((p) => p.id === rawProductId || p.slug === rawProductId);

      if (!product) {
        throw new Error(`الصنف المطلوب غير معروف: "${clientItem.name || rawProductId}"`);
      }

      if (product.isAvailable === false) {
        throw new Error(`عفواً، الصنف "${product.name}" غير متوفر حالياً في المطبخ`);
      }

      // Strict Quantity Validation: Rejects 0, negative, floating, or excessively large values
      const rawQty = clientItem.quantity;
      const quantity = Number(rawQty);
      if (!Number.isInteger(quantity) || quantity < 1 || quantity > 99) {
        throw new Error(`الكمية غير صحيحة للصنف "${product.name}". يجب أن تكون رقماً صحيحاً بين 1 و 99`);
      }

      // Authoritative base price & Size verification
      let officialBasePriceEgp = Number(product.basePrice || 0);
      let selectedSizeId = null;
      let selectedSizeName = null;

      if (product.sizes && product.sizes.length > 0) {
        const matchedSize = (product.sizes || []).find((s) => {
          if (!clientItem.selectedSize) return false;
          if (typeof clientItem.selectedSize === "string") return s.id === clientItem.selectedSize;
          return s.id === clientItem.selectedSize.id;
        });

        if (!matchedSize) {
          throw new Error(`يرجى تحديد حجم صحيح للصنف "${product.name}"`);
        }

        officialBasePriceEgp = Number(matchedSize.price);
        selectedSizeId = matchedSize.id;
        selectedSizeName = matchedSize.name;
      }

      // Authoritative addons price with Deduplication (Set protection)
      let officialAddonsSumEgp = 0;
      const verifiedAddons = [];
      const seenAddonIds = new Set();

      if (Array.isArray(clientItem.selectedAddons)) {
        for (const clientAddon of clientItem.selectedAddons) {
          if (!clientAddon || !clientAddon.id) continue;
          if (seenAddonIds.has(clientAddon.id)) continue;
          seenAddonIds.add(clientAddon.id);

          const matchedAddon = (product.addons || []).find((a) => a.id === clientAddon.id);
          if (matchedAddon) {
            officialAddonsSumEgp += Number(matchedAddon.price || 0);
            verifiedAddons.push({
              id: matchedAddon.id,
              name: matchedAddon.name,
              price: matchedAddon.price,
            });
          }
        }
      }

      const unitPricePiastres = toPiastres(officialBasePriceEgp + officialAddonsSumEgp);
      const itemTotalPiastres = unitPricePiastres * quantity;
      calculatedSubtotalPiastres += itemTotalPiastres;

      verifiedOrderItems.push({
        productId: product.id,
        productName: product.name,
        name: product.name,
        selectedSizeId,
        selectedSizeName,
        selectedAddonsJson: JSON.stringify(verifiedAddons),
        unitPricePiastres,
        quantity,
        itemTotalPiastres,
        unitPrice: toEgp(unitPricePiastres),
        itemTotal: toEgp(itemTotalPiastres),
        selectedSize: selectedSizeId ? { id: selectedSizeId, name: selectedSizeName } : null,
        selectedAddons: verifiedAddons,
      });
    }

    const totalAmountPiastres = calculatedSubtotalPiastres + deliveryFeePiastres;
    const newOrderId = generateOrderId();
    const cleanNotes = sanitizeNotes(notes, 500);
    // Strict Anti-Phishing Google Maps URL verification
    const cleanGoogleMapsUrl = validateGoogleMapsUrl(googleMapsUrl, 500);

    // 8. ATOMIC SQL TRANSACTION VIA BATCH EXECUTION
    const statements = [
      {
        sql: `INSERT INTO orders (
                id, idempotency_key, customer_name, customer_phone, order_type,
                customer_address, delivery_zone_id, delivery_zone_name, google_maps_url,
                notes, status, payment_method, payment_status, subtotal_piastres,
                delivery_fee_piastres, total_amount_piastres
              ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', 'cash', 'unpaid', ?, ?, ?)`,
        args: [
          newOrderId,
          cleanIdempotencyKey,
          cleanName,
          phoneCheck.normalized,
          safeOrderType,
          cleanAddress,
          verifiedZoneId,
          verifiedZoneName,
          cleanGoogleMapsUrl,
          cleanNotes,
          calculatedSubtotalPiastres,
          deliveryFeePiastres,
          totalAmountPiastres,
        ],
      },
    ];

    verifiedOrderItems.forEach((item) => {
      statements.push({
        sql: `INSERT INTO order_items (
                order_id, product_id, product_name, selected_size_id, selected_size_name,
                selected_addons_json, unit_price_piastres, quantity, item_total_piastres
              ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        args: [
          newOrderId,
          item.productId,
          item.productName,
          item.selectedSizeId,
          item.selectedSizeName,
          item.selectedAddonsJson,
          item.unitPricePiastres,
          item.quantity,
          item.itemTotalPiastres,
        ],
      });
    });

    // Execute atomic transaction with Idempotency Race-Condition Recovery
    try {
      await batch(statements);
    } catch (err) {
      if (
        cleanIdempotencyKey &&
        err.message &&
        (err.message.includes("UNIQUE constraint failed: orders.idempotency_key") ||
          err.code === "SQLITE_CONSTRAINT_UNIQUE")
      ) {
        // Concurrency catch: Duplicate request committed right before us. Return original order gracefully.
        const existing = await queryOne(
          "SELECT id FROM orders WHERE idempotency_key = ?",
          [cleanIdempotencyKey]
        );
        if (existing) {
          return this.getOrderById(existing.id);
        }
      }
      throw err;
    }

    const createdOrder = {
      id: newOrderId,
      idempotencyKey: cleanIdempotencyKey,
      customerName: cleanName,
      customerPhone: phoneCheck.normalized,
      orderType: safeOrderType,
      customerAddress: cleanAddress,
      deliveryZoneId: verifiedZoneId,
      deliveryZone: verifiedZoneName,
      googleMapsUrl: cleanGoogleMapsUrl,
      notes: cleanNotes,
      status: "pending",
      paymentMethod: "cash",
      paymentStatus: "unpaid",
      subtotalPiastres: calculatedSubtotalPiastres,
      deliveryFeePiastres,
      totalAmountPiastres,
      subtotal: toEgp(calculatedSubtotalPiastres),
      deliveryFee: toEgp(deliveryFeePiastres),
      totalAmount: toEgp(totalAmountPiastres),
      createdAt: new Date().toISOString(),
      items: verifiedOrderItems,
    };

    // 9. Disconnected Telegram Notification (Failsafe)
    telegramService.notifyNewOrder(createdOrder).catch((err) => {
      console.error("Non-fatal: Telegram dispatch failed:", err.message);
    });

    return createdOrder;
  },

  /**
   * Update Order Status with Strict State Machine Transitions & Optimistic Locking
   * Prevents race conditions between multiple admins/cashiers updating the same order.
   */
  async updateOrderStatus(orderId, nextStatus) {
    await ensureDatabaseInitialized();
    const cleanId = String(orderId).replace("#", "").trim();

    const currentOrder = await queryOne("SELECT status FROM orders WHERE id = ?", [cleanId]);
    if (!currentOrder) {
      throw new Error(`الطلب #${cleanId} غير موجود`);
    }

    const allowedTransitions = {
      pending: ["preparing", "cancelled"],
      preparing: ["ready", "cancelled"],
      ready: ["completed", "cancelled"],
      completed: [],
      cancelled: [],
    };

    const allowedNext = allowedTransitions[currentOrder.status] || [];
    if (!allowedNext.includes(nextStatus)) {
      throw new Error(
        `انتقال غير مصرح به: لا يمكن تغيير الطلب من "${currentOrder.status}" إلى "${nextStatus}"`
      );
    }

    // Atomic conditional update (Optimistic Locking)
    const res = await execute(
      "UPDATE orders SET status = ?, updated_at = datetime('now') WHERE id = ? AND status = ?",
      [nextStatus, cleanId, currentOrder.status]
    );

    if (res.rowsAffected === 0) {
      // Status was changed concurrently by another cashier!
      const freshOrder = await queryOne("SELECT status FROM orders WHERE id = ?", [cleanId]);
      if (!freshOrder) {
        throw new Error(`الطلب #${cleanId} غير موجود`);
      }
      throw new Error(
        `تعذر تحديث الطلب: تم تغيير حالة الطلب بالفعل بواسطة مستخدم آخر إلى "${freshOrder.status}"`
      );
    }

    return this.getOrderById(cleanId);
  },
};
