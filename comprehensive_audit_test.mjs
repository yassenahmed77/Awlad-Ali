import { deliveryZonesService } from "./src/services/deliveryZones.service.js";
import { ordersService } from "./src/services/orders.service.js";
import { normalizeEgyptianPhone, formatCurrency, normalizeArabic, convertArabicDigits } from "./src/lib/utils.js";

async function runComprehensiveAudit() {
  console.log("================================================================");
  console.log("🛡️ RUNNING COMPREHENSIVE CODEBASE AUDIT & BLIND SPOT TESTS 🛡️");
  console.log("================================================================\n");

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

  // -------------------------------------------------------------------------
  // SECTION 1: Phone Normalization & Egyptian Carrier Edge Cases
  // -------------------------------------------------------------------------
  console.log("▶ 1. Egyptian Phone Validation & Normalization Edge Cases:");
  {
    // Valid cases
    assert(normalizeEgyptianPhone("01012345678").isValid === true, "Standard 010 (Vodafone) valid");
    assert(normalizeEgyptianPhone("01112345678").isValid === true, "Standard 011 (Etisalat) valid");
    assert(normalizeEgyptianPhone("01212345678").isValid === true, "Standard 012 (Orange) valid");
    assert(normalizeEgyptianPhone("01512345678").isValid === true, "Standard 015 (WE) valid");
    assert(normalizeEgyptianPhone("+201012345678").normalized === "01012345678", "+20 prefix stripped and normalized");
    assert(normalizeEgyptianPhone("00201112345678").normalized === "01112345678", "0020 prefix stripped and normalized");
    assert(normalizeEgyptianPhone("201212345678").normalized === "01212345678", "20 prefix stripped and normalized");
    assert(normalizeEgyptianPhone("1012345678").normalized === "01012345678", "Missing leading zero auto-prepended");
    assert(normalizeEgyptianPhone(" 010-1234-5678 ").normalized === "01012345678", "Dashes and whitespace stripped");
    assert(normalizeEgyptianPhone("٠١٠١٢٣٤٥٦٧٨").normalized === "01012345678", "Eastern Arabic numerals converted to digits");

    // Invalid cases
    assert(normalizeEgyptianPhone("01312345678").isValid === false, "013 carrier prefix rejected");
    assert(normalizeEgyptianPhone("0101234567").isValid === false, "10 digits rejected (too short)");
    assert(normalizeEgyptianPhone("010123456789").isValid === false, "12 digits rejected (too long)");
    assert(normalizeEgyptianPhone("").isValid === false, "Empty string rejected");
    assert(normalizeEgyptianPhone(null).isValid === false, "Null input safely handled");
    assert(normalizeEgyptianPhone(undefined).isValid === false, "Undefined input safely handled");
  }

  // -------------------------------------------------------------------------
  // SECTION 2: Currency & Arabic String Utilities
  // -------------------------------------------------------------------------
  console.log("\n▶ 2. Currency Formatting & Arabic Normalization Edge Cases:");
  {
    assert(formatCurrency(150) === "150 ج.م", "Standard number formatted correctly");
    assert(formatCurrency(0) === "0 ج.م", "Zero currency formatted correctly");
    assert(formatCurrency(-50) === "0 ج.م", "Negative currency clamped to 0");
    assert(formatCurrency(null) === "0 ج.م", "Null currency safely defaults to 0");
    assert(formatCurrency("abc") === "0 ج.م", "NaN currency safely defaults to 0");

    assert(normalizeArabic("بيتزا شاورمة بالفراخ") === normalizeArabic("بيتزا شاورما بالفراخ"), "Taa marboota variation normalized");
    assert(normalizeArabic("أولاد علي") === normalizeArabic("اولاد علي"), "Alef hamza variation normalized");
  }

  // -------------------------------------------------------------------------
  // SECTION 3: Delivery Zones Service Logic, Security & CRUD
  // -------------------------------------------------------------------------
  console.log("\n▶ 3. Delivery Zones Service CRUD & Integrity Edge Cases:");
  {
    // A. Initial zones
    const zones = await deliveryZonesService.getZones();
    assert(Array.isArray(zones) && zones.length >= 8, `Initial delivery zones loaded (${zones.length} zones)`);

    // B. Rejection of invalid zone creation
    try {
      await deliveryZonesService.addZone({ name: "", fee: 15 });
      assert(false, "Should not allow empty zone name");
    } catch (e) {
      assert(true, "Rejected empty zone name correctly");
    }

    try {
      await deliveryZonesService.addZone({ name: "منطقة تجربة", fee: -20 });
      assert(false, "Should not allow negative delivery fee");
    } catch (e) {
      assert(true, "Rejected negative delivery fee correctly");
    }

    // C. Rejection of updating non-existent zone
    try {
      await deliveryZonesService.updateZone("non-existent-id-999", { fee: 50 });
      assert(false, "Should not update non-existent zone");
    } catch (e) {
      assert(true, "Rejected update on non-existent zone ID");
    }

    // D. Rejection of deleting non-existent zone
    try {
      await deliveryZonesService.deleteZone("non-existent-id-999");
      assert(false, "Should not delete non-existent zone");
    } catch (e) {
      assert(true, "Rejected delete on non-existent zone ID");
    }

    // E. Successful creation, modification, toggle, and deletion lifecycle
    const createdZone = await deliveryZonesService.addZone({
      name: "شارع خلوصي الجديد",
      area: "شبرا",
      fee: 18,
      estimatedMinutes: "20 - 30 دقيقة",
      isCovered: true,
    });
    assert(createdZone.id && createdZone.name === "شارع خلوصي الجديد", "New zone created successfully");

    const toggled = await deliveryZonesService.toggleZoneCoverage(createdZone.id);
    assert(toggled.isCovered === false, "Zone coverage toggled to disabled");

    const reToggled = await deliveryZonesService.toggleZoneCoverage(createdZone.id);
    assert(reToggled.isCovered === true, "Zone coverage re-toggled to active");

    const updated = await deliveryZonesService.updateZone(createdZone.id, {
      fee: 22,
      estimatedMinutes: "30 - 40 دقيقة",
    });
    assert(updated.fee === 22 && updated.estimatedMinutes === "30 - 40 دقيقة", "Zone fee and time updated");

    const delRes = await deliveryZonesService.deleteZone(createdZone.id);
    assert(delRes.success === true, "Zone deleted cleanly");

    const checkList = await deliveryZonesService.getZones();
    assert(!checkList.some((z) => z.id === createdZone.id), "Deleted zone no longer appears in zones list");
  }

  // -------------------------------------------------------------------------
  // SECTION 4: Server-Side Orders Security & Anti-Tampering Blind Spots
  // -------------------------------------------------------------------------
  console.log("\n▶ 4. Server-Side Orders Verification & Anti-Tampering:");
  {
    // A. Rejection of Empty Customer Name
    try {
      await ordersService.createOrder({
        customerName: "  ",
        customerPhone: "01012345678",
        orderType: "delivery",
        customerAddress: "شارع شبرا الرئيسي",
        items: [{ id: "p1", name: "بيتزا", quantity: 1, basePrice: 100 }],
      });
      assert(false, "Should not allow empty customer name");
    } catch (e) {
      assert(true, "Empty customer name rejected correctly");
    }

    // B. Rejection of Invalid Phone Number in Order
    try {
      await ordersService.createOrder({
        customerName: "محمد علي",
        customerPhone: "01999999999",
        orderType: "delivery",
        customerAddress: "شارع شبرا الرئيسي",
        items: [{ id: "p1", name: "بيتزا", quantity: 1, basePrice: 100 }],
      });
      assert(false, "Should not allow invalid Egyptian phone");
    } catch (e) {
      assert(true, "Invalid Egyptian phone number rejected correctly");
    }

    // C. Rejection of Empty Items List
    try {
      await ordersService.createOrder({
        customerName: "محمد علي",
        customerPhone: "01012345678",
        orderType: "delivery",
        customerAddress: "شارع شبرا الرئيسي",
        items: [],
      });
      assert(false, "Should not allow empty items array");
    } catch (e) {
      assert(true, "Empty items array rejected correctly");
    }

    // D. Rejection of Short / Missing Delivery Address
    try {
      await ordersService.createOrder({
        customerName: "محمد علي",
        customerPhone: "01012345678",
        orderType: "delivery",
        customerAddress: "ش",
        items: [{ id: "p1", name: "بيتزا", quantity: 1, basePrice: 100 }],
      });
      assert(false, "Should not allow short address for delivery");
    } catch (e) {
      assert(true, "Short address for delivery rejected correctly");
    }

    // E. CRITICAL: Rejection of Order to an INACTIVE / DISABLED Zone
    // Ensure we have a disabled zone to test
    const disabledZone = await deliveryZonesService.addZone({
      name: "منطقة معطلة للتجربة",
      area: "شبرا",
      fee: 20,
      isCovered: false, // Disabled!
    });

    try {
      await ordersService.createOrder({
        customerName: "أحمد مجدي",
        customerPhone: "01122334455",
        orderType: "delivery",
        customerAddress: "شارع روض الفرج - عمارة 10",
        deliveryZone: disabledZone.id,
        items: [{ id: "p1", name: "بيتزا", quantity: 1, basePrice: 100 }],
      });
      assert(false, "Should not allow delivery to a disabled zone");
    } catch (e) {
      assert(true, `Order to disabled zone correctly blocked: "${e.message}"`);
    }

    // Clean up test zone
    await deliveryZonesService.deleteZone(disabledZone.id);

    // F. CRITICAL: Anti-Tampering Check (Client sends customDeliveryFee: 0, server MUST enforce zone fee)
    const validZone = (await deliveryZonesService.getZones()).find((z) => z.isCovered && z.fee > 0);
    assert(validZone !== undefined, "Found valid active zone for pricing test");

    const orderWithTamperedFee = await ordersService.createOrder({
      customerName: "عميل فني",
      customerPhone: "01011223344",
      orderType: "delivery",
      customerAddress: "شارع شبرا مصر - عمارة 4",
      deliveryZone: validZone.id,
      customDeliveryFee: 0, // Tampered attempt! Zone actually costs e.g. 15 or 20
      items: [{ id: "pasta-meat-oven", quantity: 1, basePrice: 120 }],
    });

    assert(
      orderWithTamperedFee.deliveryFee === validZone.fee,
      `Anti-tampering enforced: Server used verified zone fee (${validZone.fee} ج.م) instead of 0`
    );
    assert(
      orderWithTamperedFee.totalAmount === 120 + validZone.fee,
      `Order total matches subtotal + verified zone fee (${120 + validZone.fee} ج.م)`
    );

    // G. Pickup Order delivery fee must strictly be 0
    const pickupOrder = await ordersService.createOrder({
      customerName: "عميل استلام",
      customerPhone: "01099887766",
      orderType: "pickup",
      items: [{ id: "pie-custard-sugar", selectedSize: { id: "small" }, quantity: 1, basePrice: 90 }],
    });
    assert(pickupOrder.deliveryFee === 0, "Pickup order has strictly 0 delivery fee");
    assert(pickupOrder.totalAmount === 90, "Pickup order total equals food subtotal");
  }

  // -------------------------------------------------------------------------
  // SECTION 5: Orders Dashboard Status Workflow & Filtration
  // -------------------------------------------------------------------------
  console.log("\n▶ 5. Admin Dashboard Orders Workflow & Filtering:");
  {
    const allOrders = await ordersService.getOrders();
    assert(Array.isArray(allOrders) && allOrders.length > 0, "Admin can retrieve all orders list");

    const testOrder = allOrders[0];
    const originalStatus = testOrder.status;

    // Update status to preparing
    const updated = await ordersService.updateOrderStatus(testOrder.id, "preparing");
    assert(updated.status === "preparing", "Order status updated to 'preparing'");

    // Update status to ready
    const updatedReady = await ordersService.updateOrderStatus(testOrder.id, "ready");
    assert(updatedReady.status === "ready", "Order status updated to 'ready'");

    // Rejection of invalid status
    try {
      await ordersService.updateOrderStatus(testOrder.id, "invalid_status_xyz");
      assert(false, "Should reject invalid status");
    } catch (e) {
      assert(true, "Rejected invalid order status correctly");
    }

    // Filter by status
    const readyOrders = await ordersService.getOrders({ status: "ready" });
    assert(readyOrders.every((o) => o.status === "ready"), "Status filter returns only matching orders");
  }

  // -------------------------------------------------------------------------
  // SUMMARY
  // -------------------------------------------------------------------------
  console.log("\n================================================================");
  console.log(`📊 AUDIT COMPLETE: ${passed} PASSED, ${failed} FAILED`);
  console.log("================================================================");

  if (failed > 0) {
    process.exit(1);
  }
}

runComprehensiveAudit().catch((err) => {
  console.error("Audit threw unhandled exception:", err);
  process.exit(1);
});

