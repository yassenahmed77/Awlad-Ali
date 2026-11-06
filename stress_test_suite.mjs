import { deliveryZonesService } from "./src/services/deliveryZones.service.js";
import { ordersService } from "./src/services/orders.service.js";
import { normalizeEgyptianPhone, formatCurrency, normalizeArabic, convertArabicDigits, generateOrderId } from "./src/lib/utils.js";
import { calculateDistanceKm } from "./src/config/deliveryZones.config.js";

async function runMasterTestSuite() {
  console.log("==========================================================================");
  console.log("🚀 COMPREHENSIVE END-TO-END STRESS & BLIND SPOT MASTER TEST SUITE 🚀");
  console.log("==========================================================================\n");

  let totalTests = 0;
  let passedTests = 0;
  let failedTests = 0;

  function expect(condition, message) {
    totalTests++;
    if (condition) {
      console.log(`  ✅ [PASS ${totalTests}] ${message}`);
      passedTests++;
    } else {
      console.error(`  ❌ [FAIL ${totalTests}] ${message}`);
      failedTests++;
    }
  }

  // =========================================================================
  // MODULE 1: MATHEMATICAL & CART INVARIANTS
  // =========================================================================
  console.log("▶ MODULE 1: Mathematical Invariants & Cart Pricing Bounds");
  {
    // Test float arithmetic rounding
    const basePrice = 129.99;
    const addon1 = 15.5;
    const addon2 = 12.25;
    const qty = 3;
    const unitPrice = Math.round((basePrice + addon1 + addon2) * 100) / 100;
    const itemTotal = Math.round(unitPrice * qty * 100) / 100;
    expect(unitPrice === 157.74, `Unit price rounds to 2 decimals cleanly (157.74 vs ${unitPrice})`);
    expect(itemTotal === 473.22, `Item total precision preserved (473.22 vs ${itemTotal})`);

    // Currency formatting bounds
    expect(formatCurrency(0) === "0 ج.م", "Format zero currency");
    expect(formatCurrency(999999.5) === "999,999.5 ج.م", "Format large currency with thousand commas");
    expect(formatCurrency(-100) === "0 ج.م", "Negative currency safely bounded to 0");
    expect(formatCurrency(NaN) === "0 ج.م", "NaN currency safely defaults to 0");
    expect(formatCurrency(null) === "0 ج.م", "Null currency safely defaults to 0");
    expect(formatCurrency(undefined) === "0 ج.م", "Undefined currency safely defaults to 0");

    // Arabic text normalization for fuzzy matching
    expect(normalizeArabic("شاورما") === normalizeArabic("شاورمة"), "Normalize taa marboota / haa");
    expect(normalizeArabic("إيطالي") === normalizeArabic("ايطالي"), "Normalize alef with hamza below");
    expect(normalizeArabic("أولاد") === normalizeArabic("اولاد"), "Normalize alef with hamza above");
    expect(normalizeArabic("فطائر") === normalizeArabic("فطاير"), "Normalize hamza on yaa / nabra");
  }

  // =========================================================================
  // MODULE 2: PHONE VALIDATION EXHAUSTIVE MATRIX
  // =========================================================================
  console.log("\n▶ MODULE 2: Egyptian Phone Exhaustive Validation Matrix");
  {
    const validTestCases = [
      { input: "01012345678", expected: "01012345678", desc: "Vodafone 010 standard" },
      { input: "01187654321", expected: "01187654321", desc: "Etisalat 011 standard" },
      { input: "01255443322", expected: "01255443322", desc: "Orange 012 standard" },
      { input: "01599887766", expected: "01599887766", desc: "WE 015 standard" },
      { input: "+201012345678", expected: "01012345678", desc: "+20 international prefix" },
      { input: "00201187654321", expected: "01187654321", desc: "0020 international prefix" },
      { input: "201255443322", expected: "01255443322", desc: "20 country code without plus" },
      { input: "1012345678", expected: "01012345678", desc: "Missing leading 0" },
      { input: " 010 1234 5678 ", expected: "01012345678", desc: "Spaces throughout number" },
      { input: "010-1234-5678", expected: "01012345678", desc: "Hyphens in number" },
      { input: "(010) 12345678", expected: "01012345678", desc: "Parentheses in number" },
      { input: "٠١٠١٢٣٤٥٦٧٨", expected: "01012345678", desc: "Eastern Arabic numerals (Hindi digits)" },
    ];

    for (const tc of validTestCases) {
      const res = normalizeEgyptianPhone(tc.input);
      expect(res.isValid === true && res.normalized === tc.expected, `Valid: ${tc.desc}`);
    }

    const invalidTestCases = [
      { input: "01312345678", desc: "013 invalid Egyptian prefix" },
      { input: "01412345678", desc: "014 invalid Egyptian prefix" },
      { input: "0101234567", desc: "10 digits (too short)" },
      { input: "010123456789", desc: "12 digits (too long)" },
      { input: "abcdefghijk", desc: "Letters string" },
      { input: "0101234567a", desc: "11 chars containing letter" },
      { input: "+14155552671", desc: "US phone number (+1)" },
      { input: "+966501234567", desc: "Saudi phone number (+966)" },
      { input: "", desc: "Empty string" },
      { input: null, desc: "Null" },
      { input: undefined, desc: "Undefined" },
    ];

    for (const tc of invalidTestCases) {
      const res = normalizeEgyptianPhone(tc.input);
      expect(res.isValid === false, `Invalid correctly rejected: ${tc.desc}`);
    }
  }

  // =========================================================================
  // MODULE 3: DELIVERY ZONES MANAGER & CRUD LIFE-CYCLE
  // =========================================================================
  console.log("\n▶ MODULE 3: Delivery Zones Manager Lifecycle & API Logic");
  {
    const initialZones = await deliveryZonesService.getZones();
    expect(initialZones.length >= 8, `Initial zones list contains ${initialZones.length} zones`);

    // Verify each zone has valid structure
    for (const z of initialZones) {
      expect(
        z.id && z.name && typeof z.fee === "number" && z.fee >= 0 && typeof z.isCovered === "boolean",
        `Zone structure valid: "${z.name}" (${z.fee} ج.م)`
      );
    }

    // Add new custom zone
    const created = await deliveryZonesService.addZone({
      name: "شارع مصر والسودان الرئيسي",
      area: "حدائق القبة",
      fee: 25,
      estimatedMinutes: "35 - 45 دقيقة",
      isCovered: true,
    });
    expect(created.id.startsWith("zone-"), "New zone assigned unique generated ID");
    expect(created.fee === 25, "New zone fee set to 25 ج.م");

    // Retrieve and verify presence
    const listAfterAdd = await deliveryZonesService.getZones();
    expect(listAfterAdd.some((z) => z.id === created.id), "New zone retrievable in zones list");

    // Toggle coverage off
    const toggledOff = await deliveryZonesService.toggleZoneCoverage(created.id);
    expect(toggledOff.isCovered === false, "Zone coverage successfully toggled to OFF");

    // Verify covered filter excludes it
    const coveredOnly = await deliveryZonesService.getZones({ onlyCovered: true });
    expect(!coveredOnly.some((z) => z.id === created.id), "onlyCovered=true correctly excludes disabled zone");

    // Toggle coverage on
    const toggledOn = await deliveryZonesService.toggleZoneCoverage(created.id);
    expect(toggledOn.isCovered === true, "Zone coverage successfully toggled to ON");

    // Partial update (fee and minutes)
    const updated = await deliveryZonesService.updateZone(created.id, {
      fee: 30,
      estimatedMinutes: "40 - 50 دقيقة",
    });
    expect(updated.fee === 30, "Zone fee updated to 30 ج.م");
    expect(updated.estimatedMinutes === "40 - 50 دقيقة", "Zone minutes updated");

    // Delete zone
    const delRes = await deliveryZonesService.deleteZone(created.id);
    expect(delRes.success === true, "Zone deleted cleanly");

    // Verify absence
    const listAfterDel = await deliveryZonesService.getZones();
    expect(!listAfterDel.some((z) => z.id === created.id), "Deleted zone permanently removed from list");
  }

  // =========================================================================
  // MODULE 4: END-TO-END ORDERS ANTI-TAMPERING & VALIDATION
  // =========================================================================
  console.log("\n▶ MODULE 4: Orders Security, Anti-Tampering & Strict In-Zone Verification");
  {
    // Fetch a verified covered zone
    const activeZones = await deliveryZonesService.getZones({ onlyCovered: true });
    expect(activeZones.length > 0, "Active delivery zones available for testing");
    const testZone = activeZones[0];

    // TEST 1: Valid Delivery Order with correct zone
    const order1 = await ordersService.createOrder({
      customerName: "عميل تجربة نظامي",
      customerPhone: "01012345678",
      orderType: "delivery",
      customerAddress: "شارع شبرا - أمام محطة المترو - عمارة 12 الدور الخامس",
      deliveryZone: testZone.name,
      notes: "رن الجرس",
      items: [
        {
          id: "pizza-oriental-sojouk",
          name: "بيتزا سجق شرقى أولاد علي",
          quantity: 2,
          selectedSize: { id: "large", name: "كبير" },
          selectedAddons: [{ id: "extra-sojouk", name: "إضافة سجق بلدي" }],
        },
      ],
    });

    expect(order1.id && order1.id.length === 4, `Order ID generated with 4 digits (#${order1.id})`);
    expect(order1.subtotal === 670, `Subtotal correct: (295 + 40) * 2 = 670 ج.م (actual: ${order1.subtotal})`);
    expect(order1.deliveryFee === testZone.fee, `Delivery fee strictly matches zone fee (${testZone.fee} ج.م)`);
    expect(order1.totalAmount === 670 + testZone.fee, `Total amount correct: 670 + ${testZone.fee} = ${order1.totalAmount}`);

    // TEST 2: ANTI-TAMPERING: Client sends customDeliveryFee: 0 for delivery
    const tamperedOrder = await ordersService.createOrder({
      customerName: "عميل محتال",
      customerPhone: "01122334455",
      orderType: "delivery",
      customerAddress: "شارع خلوصي - عمارة 3",
      deliveryZone: testZone.id,
      customDeliveryFee: 0, // Tampered attempt!
      items: [{ id: "pasta-meat-oven", quantity: 1, basePrice: 5 }], // Tampered basePrice 5 should be ignored
    });

    expect(
      tamperedOrder.deliveryFee === testZone.fee,
      `Anti-Tampering: Server forced verified zone fee (${testZone.fee} ج.م) instead of tampered 0 ج.م`
    );
    expect(tamperedOrder.totalAmount === 120 + testZone.fee, "Total amount includes enforced fee and real base price (120)");

    // TEST 3: REJECTION of Fake / Non-Existent Zone
    try {
      await ordersService.createOrder({
        customerName: "عميل زون وهمي",
        customerPhone: "01234567890",
        orderType: "delivery",
        customerAddress: "شارع غير موجود",
        deliveryZone: "fake_non_existent_zone_999",
        items: [{ id: "pasta-meat-oven", quantity: 1 }],
      });
      expect(false, "Should reject fake zone for delivery");
    } catch (e) {
      expect(true, `Fake zone rejected correctly: "${e.message}"`);
    }

    // TEST 4: REJECTION of Disabled / Inactive Zone
    // Create a temporary disabled zone
    const tempDisabled = await deliveryZonesService.addZone({
      name: "منطقة مؤقتة معطلة",
      area: "شبرا",
      fee: 25,
      isCovered: false, // Disabled!
    });

    try {
      await ordersService.createOrder({
        customerName: "عميل منطقة معطلة",
        customerPhone: "01511223344",
        orderType: "delivery",
        customerAddress: "شارع روض الفرج - عمارة 9",
        deliveryZone: tempDisabled.id,
        items: [{ id: "pasta-meat-oven", quantity: 1 }],
      });
      expect(false, "Should reject delivery to disabled zone");
    } catch (e) {
      expect(true, `Disabled zone delivery blocked correctly: "${e.message}"`);
    }

    // Clean up temporary disabled zone
    await deliveryZonesService.deleteZone(tempDisabled.id);

    // TEST 5: Pickup Order must always have 0 delivery fee
    const pickupOrder = await ordersService.createOrder({
      customerName: "عميل تيك أواي",
      customerPhone: "01099887766",
      orderType: "pickup",
      items: [{ id: "appetizer-mozzarella-sticks", quantity: 2 }],
    });

    expect(pickupOrder.orderType === "pickup", "Order type is pickup");
    expect(pickupOrder.deliveryFee === 0, "Pickup order delivery fee is strictly 0");
    expect(pickupOrder.totalAmount === 130, "Pickup total equals subtotal (130 ج.م)");
  }

  // =========================================================================
  // MODULE 5: GPS HELPER & DISTANCE CALCULATION
  // =========================================================================
  console.log("\n▶ MODULE 5: GPS Link Helper & Haversine Distance Check");
  {
    // Branch coords: 30.0768, 31.2458
    // Near location (Shubra metro ~1.4 km)
    const dist1 = calculateDistanceKm(30.0768, 31.2458, 30.082, 31.242);
    expect(dist1 > 0 && dist1 < 3.0, `Calculated distance to nearby point is realistic (${dist1} km)`);

    // Far location (Alexandria ~180 km)
    const distFar = calculateDistanceKm(30.0768, 31.2458, 31.2001, 29.9187);
    expect(distFar > 150 && distFar < 220, `Calculated distance to Alexandria is accurate (${distFar} km)`);

    // Zero distance (exact branch coords)
    const distZero = calculateDistanceKm(30.0768, 31.2458, 30.0768, 31.2458);
    expect(distZero === 0, "Distance to self is 0 km");
  }

  // =========================================================================
  // MODULE 6: ADMIN DASHBOARD ORDERS RETRIEVAL & STATUS MUTATION
  // =========================================================================
  console.log("\n▶ MODULE 6: Cashier Dashboard Status Transitions & ID Lookup");
  {
    // Retrieve list
    const orders = await ordersService.getOrders();
    expect(orders.length > 0, `Admin successfully retrieves orders list (${orders.length} orders found)`);

    // Retrieve order by ID with and without "#"
    const firstOrder = orders[0];
    const cleanId = firstOrder.id;
    const byCleanId = await ordersService.getOrderById(cleanId);
    expect(byCleanId !== null && byCleanId.id === cleanId, "Get order by numeric ID works");

    const byHashId = await ordersService.getOrderById(`#${cleanId}`);
    expect(byHashId !== null && byHashId.id === cleanId, "Get order by #ID works (hashtag stripped)");

    // Status transition lifecycle
    const updated1 = await ordersService.updateOrderStatus(cleanId, "preparing");
    expect(updated1.status === "preparing", "Status changed to 'preparing'");

    const updated2 = await ordersService.updateOrderStatus(cleanId, "ready");
    expect(updated2.status === "ready", "Status changed to 'ready'");

    const updated3 = await ordersService.updateOrderStatus(cleanId, "completed");
    expect(updated3.status === "completed", "Status changed to 'completed'");

    // Invalid status rejection
    try {
      await ordersService.updateOrderStatus(cleanId, "bogus_status");
      expect(false, "Should reject invalid status transition");
    } catch (e) {
      expect(true, "Invalid status transition rejected cleanly");
    }
  }

  // =========================================================================
  // SUMMARY REPORT
  // =========================================================================
  console.log("\n==========================================================================");
  console.log(`📊 MASTER TEST SUITE COMPLETE: ${passedTests}/${totalTests} PASSED, ${failedTests} FAILED`);
  console.log("==========================================================================\n");

  if (failedTests > 0) {
    process.exit(1);
  }
}

runMasterTestSuite().catch((err) => {
  console.error("Test execution threw error:", err);
  process.exit(1);
});

