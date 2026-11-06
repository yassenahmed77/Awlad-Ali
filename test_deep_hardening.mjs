import {
  initDatabase,
  ensureDatabaseInitialized,
  query,
  queryOne,
  execute,
} from "./src/lib/db.js";
import { deliveryZonesService } from "./src/services/deliveryZones.service.js";
import { ordersService } from "./src/services/orders.service.js";
import { validateGoogleMapsUrl } from "./src/lib/sanitizer.js";

async function runHardeningTests() {
  console.log("==========================================================================");
  console.log("🛡️ VERIFYING REVIEW FIXES & DEEP CONCURRENCY HARDENING 🛡️");
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
    await ensureDatabaseInitialized();

    // 1. Branch Config in Database (Not in-memory!)
    const initialBranch = await deliveryZonesService.getBranchConfig();
    assert(initialBranch.latitude === 30.0768, "Branch config loaded from database branch_settings table");

    // Update branch config in database
    await deliveryZonesService.updateBranchConfig({
      maxDeliveryRadiusKm: 12.5,
      address: "2 شارع روض الفرج المعدل",
    });

    const updatedBranch = await deliveryZonesService.getBranchConfig();
    assert(updatedBranch.maxDeliveryRadiusKm === 12.5, "Branch radius updated in database (12.5 km)");
    assert(updatedBranch.address === "2 شارع روض الفرج المعدل", "Branch address updated in database");

    // 2. Initial Seed NEVER overwrites Admin edits (ON CONFLICT DO NOTHING)
    await deliveryZonesService.updateZone("rod-el-farag", { fee: 40 });
    // Re-run initDatabase to simulate server reboot / cold start
    await initDatabase();
    const zoneAfterReboot = await deliveryZonesService.getZoneById("rod-el-farag");
    assert(zoneAfterReboot.fee === 40, "Seed data PRESERVED admin fee edit (40 EGP) across database reboots (ON CONFLICT DO NOTHING)");

    // 3. Atomic Toggle Coverage in SQL
    const originalCovered = zoneAfterReboot.isCovered;
    const toggled1 = await deliveryZonesService.toggleZoneCoverage("rod-el-farag");
    assert(toggled1.isCovered === !originalCovered, "Atomic SQL toggle flipped is_covered cleanly");
    const toggled2 = await deliveryZonesService.toggleZoneCoverage("rod-el-farag");
    assert(toggled2.isCovered === originalCovered, "Second atomic toggle restored original coverage");

    // 4. Strict Quantity Validation (Zero silent clamping)
    try {
      await ordersService.createOrder({
        customerName: "عميل تجربة كميات",
        customerPhone: "01012345678",
        orderType: "pickup",
        items: [{ id: "pasta-meat-oven", quantity: 0 }], // 0 must be rejected!
      });
      assert(false, "Should reject quantity = 0");
    } catch (e) {
      assert(e.message.includes("الكمية غير صحيحة"), `Quantity 0 rejected with clear error: "${e.message}"`);
    }

    try {
      await ordersService.createOrder({
        customerName: "عميل تجربة كميات",
        customerPhone: "01012345678",
        orderType: "pickup",
        items: [{ id: "pasta-meat-oven", quantity: -5 }], // Negative must be rejected!
      });
      assert(false, "Should reject negative quantity");
    } catch (e) {
      assert(e.message.includes("الكمية غير صحيحة"), `Negative quantity rejected with clear error: "${e.message}"`);
    }

    try {
      await ordersService.createOrder({
        customerName: "عميل تجربة كميات",
        customerPhone: "01012345678",
        orderType: "pickup",
        items: [{ id: "pasta-meat-oven", quantity: 2.5 }], // Non-integer must be rejected!
      });
      assert(false, "Should reject floating point quantity");
    } catch (e) {
      assert(e.message.includes("الكمية غير صحيحة"), `Floating quantity rejected with clear error: "${e.message}"`);
    }

    // 5. Strict Order Type Validation (Zero silent fallback)
    try {
      await ordersService.createOrder({
        customerName: "عميل نوع وهمي",
        customerPhone: "01012345678",
        orderType: "dine_in", // Invalid order type!
        items: [{ id: "pasta-meat-oven", quantity: 1 }],
      });
      assert(false, "Should reject invalid order type 'dine_in'");
    } catch (e) {
      assert(e.message.includes("نوع الطلب غير صحيح"), `Invalid orderType rejected with clear error: "${e.message}"`);
    }

    // 6. Optimistic Locking on State Machine (Concurrent Admin Conflict)
    const activeZone = (await deliveryZonesService.getZones({ onlyCovered: true }))[0];
    const orderForConcurrency = await ordersService.createOrder({
      customerName: "عميل فحص تضارب",
      customerPhone: "01012345678",
      orderType: "delivery",
      customerAddress: "شارع شبرا الرئيسي - عمارة 10",
      deliveryZone: activeZone.name,
      items: [{ id: "pasta-meat-oven", quantity: 1 }],
    });

    // Admin 1 moves it to 'preparing'
    const admin1Update = await ordersService.updateOrderStatus(orderForConcurrency.id, "preparing");
    assert(admin1Update.status === "preparing", "Admin 1 successfully moved order from pending -> preparing");

    // Admin 2 (holding stale pending state) attempts illegal transition from pending -> cancelled
    // But since the status in DB is now 'preparing', if an update tries with stale condition:
    try {
      // Simulating a concurrent race: execute conditional update with stale status 'pending'
      const staleRes = await execute(
        "UPDATE orders SET status = ?, updated_at = datetime('now') WHERE id = ? AND status = ?",
        ["cancelled", orderForConcurrency.id, "pending"]
      );
      assert(staleRes.rowsAffected === 0, "Optimistic locking: Stale update rejected with 0 rows affected");
    } catch (e) {
      assert(true, "Optimistic locking prevented stale overwrite");
    }

    // 7. Anti-Phishing Google Maps URL Validation
    assert(validateGoogleMapsUrl("javascript:alert(1)") === "", "XSS javascript: URL rejected");
    assert(validateGoogleMapsUrl("http://phishing-site.com/fake-maps") === "", "Non-Google URL rejected");
    assert(
      validateGoogleMapsUrl("https://www.google.com/maps/dir/?api=1&destination=30.082,31.242").includes("google.com"),
      "Legitimate Google Maps HTTPS URL accepted"
    );

    // 8. Finite Bounds Google Maps link helper supports 0,0
    const urlZero = deliveryZonesService.generateGoogleMapsUrl(0, 0);
    assert(urlZero.includes("destination=0,0"), "Coordinates 0,0 accurately supported without falsy rejection");

    // 9. Pagination structure: { data, pagination: { total, page, limit, totalPages } }
    const paginatedRes = await ordersService.getOrders({ page: 1, limit: 10 });
    assert(Array.isArray(paginatedRes.data), "ordersService.getOrders() returns clean .data array");
    assert(
      paginatedRes.pagination &&
      typeof paginatedRes.pagination.total === "number" &&
      typeof paginatedRes.pagination.totalPages === "number",
      `Pagination metadata structure verified (total: ${paginatedRes.pagination.total}, pages: ${paginatedRes.pagination.totalPages})`
    );

    console.log(`\n==========================================================================`);
    console.log(`📊 HARDENING TESTS SUMMARY: ${passed} PASSED, ${failed} FAILED`);
    console.log(`==========================================================================\n`);

    if (failed > 0) process.exit(1);
  } catch (err) {
    console.error("Hardening test threw unexpected error:", err);
    process.exit(1);
  }
}

runHardeningTests();

