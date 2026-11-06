import { initDatabase, query, queryOne, execute, batch } from "./src/lib/db.js";

async function runPart1Tests() {
  console.log("==========================================================================");
  console.log("🧪 TESTING PART 1: DATABASE ENGINE, SCHEMAS & RELATIONAL INTEGRITY 🧪");
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
    // 1. Initialize Database & Seed
    const initRes = await initDatabase();
    assert(initRes.success === true, "Database initialized and migrated successfully");

    // Calling it a second time must be idempotent
    const initRes2 = await initDatabase();
    assert(initRes2.success === true, "Database initialization is idempotent (safe to call repeatedly)");

    // 2. Delivery Zones Seed Verification
    const zones = await query("SELECT * FROM delivery_zones ORDER BY fee_piastres ASC");
    assert(Array.isArray(zones) && zones.length >= 8, `Delivery zones seeded successfully (${zones.length} zones found)`);
    assert(zones[0].id && zones[0].name && typeof zones[0].fee_piastres === "number", "Row returned as clean plain JS object with correct types");

    // 3. SQL Injection Resistance Test (Parameterized Query)
    const maliciousInput = "' OR '1'='1";
    const injectionResult = await query("SELECT * FROM delivery_zones WHERE name = ?", [maliciousInput]);
    assert(injectionResult.length === 0, "SQL Injection attempt safely blocked via parameterized arguments");

    // 4. CHECK Constraint: Negative delivery fee rejection
    try {
      await execute("INSERT INTO delivery_zones (id, name, area, fee_piastres, estimated_minutes) VALUES (?, ?, ?, ?, ?)", [
        "zone-invalid",
        "منطقة غير صالحة",
        "شبرا",
        -5000, // NEGATIVE!
        "30 دقيقة",
      ]);
      assert(false, "Should reject negative delivery fee");
    } catch (err) {
      assert(true, "CHECK constraint rejected negative delivery fee correctly");
    }

    // 5. Orders & Order Items Relational Insertion
    const targetZone = zones[0];
    const testOrderId = "9901";
    await execute(
      `INSERT INTO orders (id, customer_name, customer_phone, order_type, customer_address, delivery_zone_id, delivery_zone_name, subtotal_piastres, delivery_fee_piastres, total_amount_piastres)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [testOrderId, "أحمد المحمدي", "01012345678", "delivery", "شارع شبرا 15", targetZone.id, targetZone.name, 25000, 1500, 26500]
    );

    const insertedOrder = await queryOne("SELECT * FROM orders WHERE id = ?", [testOrderId]);
    assert(insertedOrder !== null && insertedOrder.id === testOrderId, "Order inserted and retrieved by ID");
    assert(insertedOrder.total_amount_piastres === 26500, "Order financial totals matched (26,500 Piastres = 265 ج.م)");

    // Insert associated order item
    await execute(
      `INSERT INTO order_items (order_id, product_id, product_name, selected_size_name, unit_price_piastres, quantity, item_total_piastres)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [testOrderId, "pizza-1", "بيتزا سجق", "وسط", 12500, 2, 25000]
    );

    const items = await query("SELECT * FROM order_items WHERE order_id = ?", [testOrderId]);
    assert(items.length === 1 && items[0].product_name === "بيتزا سجق", "Order item linked to order correctly");

    // 6. FOREIGN KEY CASCADE DELETE Test
    await execute("DELETE FROM orders WHERE id = ?", [testOrderId]);
    const itemsAfterDelete = await query("SELECT * FROM order_items WHERE order_id = ?", [testOrderId]);
    assert(itemsAfterDelete.length === 0, "CASCADE DELETE verified: Deleting order automatically cleaned up its order items");

    // 7. CHECK Constraint: Short customer name rejection (< 2 characters)
    try {
      await execute(
        `INSERT INTO orders (id, customer_name, customer_phone, order_type, subtotal_piastres, delivery_fee_piastres, total_amount_piastres)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        ["9902", " ", "01012345678", "pickup", 10000, 0, 10000]
      );
      assert(false, "Should reject empty customer name");
    } catch (err) {
      assert(true, "CHECK constraint rejected empty customer name correctly");
    }

    // 8. CHECK Constraint: Invalid order status rejection
    try {
      await execute(
        `INSERT INTO orders (id, customer_name, customer_phone, order_type, status, subtotal_piastres, delivery_fee_piastres, total_amount_piastres)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        ["9903", "محمود", "01012345678", "pickup", "hacked_status", 10000, 0, 10000]
      );
      assert(false, "Should reject invalid status");
    } catch (err) {
      assert(true, "CHECK constraint rejected invalid status correctly");
    }

    // 9. Atomic Batch Transaction & Rollback Test
    try {
      await batch([
        {
          sql: "INSERT INTO delivery_zones (id, name, area, fee_piastres, estimated_minutes) VALUES (?, ?, ?, ?, ?)",
          args: ["batch-zone-1", "منطقة باتش 1", "شبرا", 2000, "30 دقيقة"],
        },
        {
          sql: "INSERT INTO delivery_zones (id, name, area, fee_piastres, estimated_minutes) VALUES (?, ?, ?, ?, ?)",
          args: ["batch-zone-2", "منطقة باتش 2", "شبرا", -999, "30 دقيقة"], // INVALID: will fail!
        },
      ]);
      assert(false, "Batch should fail because second statement violates CHECK constraint");
    } catch (err) {
      // Verify rollback: first insert must NOT be present
      const firstCheck = await queryOne("SELECT * FROM delivery_zones WHERE id = ?", ["batch-zone-1"]);
      assert(firstCheck === null, "Transaction ATOMIC ROLLBACK verified: First statement rolled back when second failed");
    }

    console.log(`\n==========================================================================`);
    console.log(`📊 PART 1 TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
    console.log(`==========================================================================\n`);

    if (failed > 0) process.exit(1);
  } catch (err) {
    console.error("Test execution threw error:", err);
    process.exit(1);
  }
}

runPart1Tests();

