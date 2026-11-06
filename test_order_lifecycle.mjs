import { ordersService } from "./src/services/orders.service.js";
import { deliveryZonesService } from "./src/services/deliveryZones.service.js";
import { query } from "./src/lib/db.js";

async function runLifecycleAudit() {
  console.log("==========================================================================");
  console.log("🔄 COMPLETE ORDER LIFECYCLE & ZERO-TRUST RECALCULATION AUDIT 🔄");
  console.log("==========================================================================\n");

  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`  ✅ [PASS] ${message}`);
      passed++;
    } else {
      console.error(`  ❌ [FAIL] ${message}`);
      failed++;
    }
  }

  try {
    // 1. Fetch available zones from database
    const zones = await deliveryZonesService.getZones({ onlyCovered: true });
    assert(zones.length > 0, `Database seeded with active zones (${zones.length} active zones found)`);
    const targetZone = zones[0];

    // 2. TEST: Zero-Trust Server Recalculation (Customer sends tampered unitPrice 0, server MUST recalculate)
    // Product: pizza-oriental-sojouk (base: 130 EGP, size large: 295 EGP, addon extra-sojouk: 40 EGP)
    const idempotencyKey = "client-txn-" + Date.now();
    const order = await ordersService.createOrder({
      idempotencyKey,
      customerName: "عميل تجربة كاملة",
      customerPhone: "01012345678",
      orderType: "delivery",
      customerAddress: "شارع شبرا - أمام محطة المترو - عمارة 15 الدور الرابع",
      deliveryZone: targetZone.name,
      notes: "زيادة طحينة",
      items: [
        {
          productId: "pizza-oriental-sojouk",
          quantity: 2,
          selectedSize: { id: "large" },
          selectedAddons: [{ id: "extra-sojouk" }],
          // Tampered values sent by malicious client:
          unitPrice: 0,
          itemTotal: 0,
        },
      ],
    });

    assert(order.id && order.id.length === 4, `Order created with 4-digit ID #${order.id}`);
    
    // Official calculation:
    // Base large: 295 EGP, Addon extra-sojouk: 40 EGP -> Unit price = 335 EGP = 33,500 Piastres
    // Qty 2 -> Item total = 670 EGP = 67,000 Piastres
    // Delivery fee = targetZone.fee (e.g. 15 EGP = 1,500 Piastres)
    // Total = 685 EGP = 68,500 Piastres
    assert(order.items[0].unitPrice === 335, `Server recalculated unit price to 335 EGP (295 size + 40 addon), ignoring client's 0`);
    assert(order.items[0].itemTotal === 670, `Server recalculated item total to 670 EGP (335 * 2)`);
    assert(order.subtotal === 670, `Subtotal matched 670 EGP (${order.subtotalPiastres} Piastres)`);
    assert(order.deliveryFee === targetZone.fee, `Delivery fee matched zone fee (${targetZone.fee} EGP)`);
    assert(order.totalAmount === 670 + targetZone.fee, `Total amount mathematically locked: ${order.totalAmount} EGP`);
    assert(order.deliveryZoneId === targetZone.id, "deliveryZoneId stored as relational Foreign Key");
    assert(order.deliveryZone === targetZone.name, "deliveryZone name captured as historical snapshot");

    // 3. TEST: Relational order_items database check
    const dbItems = await query("SELECT * FROM order_items WHERE order_id = ?", [order.id]);
    assert(dbItems.length === 1, "Relational order_items table has exactly 1 row");
    assert(dbItems[0].product_id === "pizza-oriental-sojouk", "order_items product_id matches");
    assert(dbItems[0].quantity === 2, "order_items quantity matches 2");
    assert(dbItems[0].unit_price_piastres === 33500, "order_items unit_price_piastres is 33,500");
    assert(dbItems[0].item_total_piastres === 67000, "order_items item_total_piastres is 67,000");

    // 4. TEST: Idempotency Protection (Resubmitting with same key returns existing order)
    const duplicateOrder = await ordersService.createOrder({
      idempotencyKey,
      customerName: "عميل تجربة كاملة",
      customerPhone: "01012345678",
      orderType: "delivery",
      customerAddress: "شارع شبرا 15",
      deliveryZone: targetZone.name,
      items: [{ productId: "pizza-oriental-sojouk", quantity: 2 }],
    });
    assert(duplicateOrder.id === order.id, "Idempotency verified: Duplicate submission returned original order without creating duplicate rows");

    // 5. TEST: Foreign Key RESTRICT Protection
    // Attempting to delete a zone that has orders referencing it MUST be blocked!
    try {
      await deliveryZonesService.deleteZone(targetZone.id);
      assert(false, "Should not allow deleting a delivery zone tied to historical orders");
    } catch (err) {
      assert(true, `FOREIGN KEY RESTRICT verified: "${err.message}"`);
    }

    // 6. TEST: Admin Order Status State Machine
    const updatedPreparing = await ordersService.updateOrderStatus(order.id, "preparing");
    assert(updatedPreparing.status === "preparing", "Admin transitioned order to 'preparing'");

    const updatedReady = await ordersService.updateOrderStatus(order.id, "ready");
    assert(updatedReady.status === "ready", "Admin transitioned order to 'ready'");

    const updatedCompleted = await ordersService.updateOrderStatus(order.id, "completed");
    assert(updatedCompleted.status === "completed", "Admin transitioned order to 'completed'");

    // Illegal backwards transition: completed -> pending must be rejected!
    try {
      await ordersService.updateOrderStatus(order.id, "pending");
      assert(false, "Should reject transition from terminal state 'completed' back to 'pending'");
    } catch (err) {
      assert(true, "State Machine cleanly rejected illegal transition from completed to pending");
    }

    console.log(`\n==========================================================================`);
    console.log(`📊 LIFECYCLE AUDIT COMPLETE: ${passed} PASSED, ${failed} FAILED`);
    console.log("==========================================================================\n");

    if (failed > 0) process.exit(1);
  } catch (err) {
    console.error("Lifecycle audit failed:", err);
    process.exit(1);
  }
}

runLifecycleAudit();

