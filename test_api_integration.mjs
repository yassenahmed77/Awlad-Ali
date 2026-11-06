import { GET as getZonesRoute, POST as postZonesRoute, PATCH as patchZonesRoute, DELETE as deleteZonesRoute } from "./src/app/api/delivery-zones/route.js";
import { GET as getOrdersRoute, POST as postOrdersRoute, PATCH as patchOrdersRoute } from "./src/app/api/orders/route.js";

async function testApiRoutesDirectly() {
  console.log("==========================================================================");
  console.log("⚡ TESTING NEXT.JS API ROUTE HANDLERS DIRECTLY (CLEAN ARCHITECTURE) ⚡");
  console.log("==========================================================================\n");

  let passed = 0;
  let failed = 0;

  function assert(cond, msg) {
    if (cond) {
      console.log(`  ✅ [PASS] ${msg}`);
      passed++;
    } else {
      console.error(`  ❌ [FAIL] ${msg}`);
      failed++;
    }
  }

  // 1. GET /api/delivery-zones
  const reqZones = new Request("http://localhost:3000/api/delivery-zones?onlyCovered=false");
  const resZones = await getZonesRoute(reqZones);
  const dataZones = await resZones.json();
  assert(resZones.status === 200, "GET /api/delivery-zones returns 200 OK");
  assert(dataZones.success === true && Array.isArray(dataZones.zones), "GET /api/delivery-zones returns zones array");

  // 2. POST /api/delivery-zones (Add zone)
  const reqAddZone = new Request("http://localhost:3000/api/delivery-zones", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: "شارع جزيرة بدران",
      area: "شبرا",
      fee: 15,
      estimatedMinutes: "20 - 30 دقيقة",
      isCovered: true,
    }),
  });
  const resAddZone = await postZonesRoute(reqAddZone);
  const dataAddZone = await resAddZone.json();
  assert(resAddZone.status === 201, "POST /api/delivery-zones returns 201 Created");
  assert(dataAddZone.zone && dataAddZone.zone.name === "شارع جزيرة بدران", "Created zone name matches");

  // 3. PATCH /api/delivery-zones (Toggle coverage)
  const reqToggle = new Request("http://localhost:3000/api/delivery-zones", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id: dataAddZone.zone.id, action: "toggleCoverage" }),
  });
  const resToggle = await patchZonesRoute(reqToggle);
  const dataToggle = await resToggle.json();
  assert(resToggle.status === 200, "PATCH toggle returns 200 OK");
  assert(dataToggle.zone.isCovered === false, "Coverage toggled to false");

  // 4. DELETE /api/delivery-zones
  const reqDel = new Request(`http://localhost:3000/api/delivery-zones?id=${dataAddZone.zone.id}`, {
    method: "DELETE",
  });
  const resDel = await deleteZonesRoute(reqDel);
  const dataDel = await resDel.json();
  assert(resDel.status === 200, "DELETE /api/delivery-zones returns 200 OK");
  assert(dataDel.deletedId === dataAddZone.zone.id, "Deleted zone ID matches");

  // 5. POST /api/orders (Valid delivery order)
  const reqOrder = new Request("http://localhost:3000/api/orders", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      customerName: "عميل راوت هاندلر",
      customerPhone: "01055443322",
      orderType: "delivery",
      customerAddress: "شارع شبرا الرئيسي - عمارة 8",
      deliveryZone: "روض الفرج والشوارع المجاورة",
      items: [{ id: "pizza-chicken-ranch", name: "بيتزا تشيكن رانش", selectedSize: { id: "small" }, quantity: 1 }],
    }),
  });
  const resOrder = await postOrdersRoute(reqOrder);
  const dataOrder = await resOrder.json();
  assert(resOrder.status === 201, "POST /api/orders returns 201 Created");
  assert(dataOrder.order && dataOrder.order.id, `Order created successfully #${dataOrder.order?.id}`);

  // 6. POST /api/orders (Invalid: fake zone should return 400 Bad Request)
  const reqBadOrder = new Request("http://localhost:3000/api/orders", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      customerName: "عميل راوت هاندلر",
      customerPhone: "01055443322",
      orderType: "delivery",
      customerAddress: "شارع شبرا الرئيسي - عمارة 8",
      deliveryZone: "fake-zone-xyz",
      items: [{ id: "pizza-chicken-ranch", name: "بيتزا تشيكن رانش", selectedSize: { id: "small" }, quantity: 1 }],
    }),
  });
  const resBadOrder = await postOrdersRoute(reqBadOrder);
  const dataBadOrder = await resBadOrder.json();
  assert(resBadOrder.status === 400, "POST /api/orders with fake zone returns 400 Bad Request");
  assert(dataBadOrder.success === false, "Bad order correctly rejected");

  // 7. GET /api/orders (Paginated)
  const reqGetOrders = new Request("http://localhost:3000/api/orders?page=1&limit=10");
  const resGetOrders = await getOrdersRoute(reqGetOrders);
  const dataGetOrders = await resGetOrders.json();
  assert(resGetOrders.status === 200, "GET /api/orders returns 200 OK");
  assert(Array.isArray(dataGetOrders.orders), "GET /api/orders returns array of orders");
  assert(dataGetOrders.pagination && dataGetOrders.pagination.total >= 1, `Pagination metadata attached correctly (total: ${dataGetOrders.pagination.total})`);

  // 8. GET /api/orders?id=... (Single)
  const reqSingle = new Request(`http://localhost:3000/api/orders?id=${dataOrder.order.id}`);
  const resSingle = await getOrdersRoute(reqSingle);
  const dataSingle = await resSingle.json();
  assert(resSingle.status === 200, "GET /api/orders?id=... returns 200 OK");
  assert(dataSingle.order.id === dataOrder.order.id, "Fetched single order matches ID");

  console.log(`\n==========================================================================`);
  console.log(`⚡ API ROUTE TEST COMPLETE: ${passed} PASSED, ${failed} FAILED`);
  console.log(`==========================================================================\n`);

  if (failed > 0) process.exit(1);
}

testApiRoutesDirectly().catch((err) => {
  console.error("API test error:", err);
  process.exit(1);
});

