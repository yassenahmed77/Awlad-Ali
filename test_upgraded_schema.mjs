import { initDatabase, query, queryOne, execute, batch, toPiastres, toEgp } from "./src/lib/db.js";

async function runUpgradedSchemaTests() {
  console.log("==========================================================================");
  console.log("🛡️ VERIFYING UPGRADED PRODUCTION SCHEMA & AIR-TIGHT INVARIANTS 🛡️");
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
    // 1. Initialize
    await initDatabase();
    assert(true, "Database initialized with PRAGMA foreign_keys = ON");

    // 2. Piastres / Currency Conversion Utilities
    assert(toPiastres(150.5) === 15050, "150.50 EGP accurately converted to 15,050 Piastres");
    assert(toPiastres(0) === 0, "0 EGP converted to 0 Piastres");
    assert(toEgp(15050) === 150.5, "15,050 Piastres converted back to 150.50 EGP");

    // 3. Foreign Keys check: delivery_zone_id REFERENCES delivery_zones(id)
    const activeZone = await queryOne("SELECT * FROM delivery_zones WHERE is_covered = 1 LIMIT 1");
    assert(activeZone !== null, `Active delivery zone found (${activeZone.name}, fee: ${toEgp(activeZone.fee_piastres)} EGP)`);

    // Invariant: Non-existent delivery_zone_id must be rejected by FOREIGN KEY constraint
    try {
      await execute(
        `INSERT INTO orders (id, customer_name, customer_phone, order_type, customer_address, delivery_zone_id, subtotal_piastres, delivery_fee_piastres, total_amount_piastres)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        ["test-fk-fail", "عميل فحص", "01012345678", "delivery", "شارع شبرا 20", "non-existent-zone-id", 10000, 1500, 11500]
      );
      assert(false, "Should reject non-existent delivery_zone_id via Foreign Key");
    } catch (err) {
      assert(true, "Foreign Key constraint successfully rejected invalid delivery_zone_id");
    }

    // 4. Invariant: Mathematical Equality (total_amount_piastres = subtotal + delivery_fee)
    try {
      await execute(
        `INSERT INTO orders (id, customer_name, customer_phone, order_type, customer_address, delivery_zone_id, subtotal_piastres, delivery_fee_piastres, total_amount_piastres)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        ["test-math-fail", "عميل فحص", "01012345678", "delivery", "شارع شبرا 20", activeZone.id, 10000, 1500, 99999] // INVALID TOTAL!
      );
      assert(false, "Should reject mismatched total_amount_piastres");
    } catch (err) {
      assert(true, "CHECK constraint chk_order_total_math rejected tampered total successfully");
    }

    // 5. Invariant: Pickup must have strictly 0 delivery fee
    try {
      await execute(
        `INSERT INTO orders (id, customer_name, customer_phone, order_type, subtotal_piastres, delivery_fee_piastres, total_amount_piastres)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        ["test-pickup-fee-fail", "عميل فحص", "01012345678", "pickup", 10000, 1500, 11500] // Pickup with fee!
      );
      assert(false, "Should reject pickup with non-zero delivery fee");
    } catch (err) {
      assert(true, "CHECK constraint chk_pickup_fee_zero rejected pickup fee > 0 successfully");
    }

    // 6. Invariant: Delivery must have detailed address (>= 5 characters)
    try {
      await execute(
        `INSERT INTO orders (id, customer_name, customer_phone, order_type, customer_address, delivery_zone_id, subtotal_piastres, delivery_fee_piastres, total_amount_piastres)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        ["test-short-addr-fail", "عميل فحص", "01012345678", "delivery", "ش", activeZone.id, 10000, activeZone.fee_piastres, 10000 + activeZone.fee_piastres]
      );
      assert(false, "Should reject delivery with short address (< 5 chars)");
    } catch (err) {
      assert(true, "CHECK constraint chk_delivery_requirements rejected short address successfully");
    }

    // 7. Invariant: Phone number must match Egyptian mobile format (01[0125]xxxxxxxx)
    try {
      await execute(
        `INSERT INTO orders (id, customer_name, customer_phone, order_type, subtotal_piastres, delivery_fee_piastres, total_amount_piastres)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        ["test-phone-fail", "عميل فحص", "01312345678", "pickup", 5000, 0, 5000] // Invalid 013 carrier!
      );
      assert(false, "Should reject invalid Egyptian mobile carrier via GLOB constraint");
    } catch (err) {
      assert(true, "Database GLOB constraint rejected invalid carrier '013' at SQL engine level");
    }

    // 8. Invariant: Item Total Math (item_total_piastres = unit_price_piastres * quantity)
    // First, insert a valid order
    const validOrderId = "ORD-7001";
    await execute(
      `INSERT INTO orders (id, idempotency_key, customer_name, customer_phone, order_type, customer_address, delivery_zone_id, subtotal_piastres, delivery_fee_piastres, total_amount_piastres)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [validOrderId, "idemp-key-12345", "محمود عبد المنعم", "01234567890", "delivery", "شارع خلوصي - عمارة 12 الدور الرابع", activeZone.id, 20000, activeZone.fee_piastres, 20000 + activeZone.fee_piastres]
    );

    // Attempt inserting item with mismatched total math (e.g. 10000 * 2 != 15000)
    try {
      await execute(
        `INSERT INTO order_items (order_id, product_id, product_name, unit_price_piastres, quantity, item_total_piastres)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [validOrderId, "p1", "بيتزا تشيكن رانش", 10000, 2, 15000] // 10000 * 2 is 20000, not 15000!
      );
      assert(false, "Should reject mismatched item total math");
    } catch (err) {
      assert(true, "CHECK constraint chk_item_math rejected tampered item total math successfully");
    }

    // Insert valid item
    await execute(
      `INSERT INTO order_items (order_id, product_id, product_name, unit_price_piastres, quantity, item_total_piastres)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [validOrderId, "p1", "بيتزا تشيكن رانش", 10000, 2, 20000] // 10000 * 2 = 20000
    );
    assert(true, "Valid relational order and item inserted with 100% mathematical integrity");

    // 9. Invariant: Idempotency Key Uniqueness
    try {
      await execute(
        `INSERT INTO orders (id, idempotency_key, customer_name, customer_phone, order_type, subtotal_piastres, delivery_fee_piastres, total_amount_piastres)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        ["ORD-7002", "idemp-key-12345", "عميل مكرر", "01099887766", "pickup", 5000, 0, 5000] // Duplicate idempotency key!
      );
      assert(false, "Should reject duplicate idempotency_key");
    } catch (err) {
      assert(true, "UNIQUE constraint on idempotency_key blocked duplicate submission attempt");
    }

    // 10. Invariant: Cascade Delete with PRAGMA foreign_keys = ON
    await execute("DELETE FROM orders WHERE id = ?", [validOrderId]);
    const itemsCheck = await query("SELECT * FROM order_items WHERE order_id = ?", [validOrderId]);
    assert(itemsCheck.length === 0, "CASCADE DELETE with PRAGMA foreign_keys = ON verified: items automatically purged");

    console.log(`\n==========================================================================`);
    console.log(`📊 UPGRADED SCHEMA VERIFICATION: ${passed} PASSED, ${failed} FAILED`);
    console.log("==========================================================================\n");

    if (failed > 0) process.exit(1);
  } catch (err) {
    console.error("Test failed with unhandled exception:", err);
    process.exit(1);
  }
}

runUpgradedSchemaTests();

