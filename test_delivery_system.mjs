import { deliveryZonesService } from "./src/services/deliveryZones.service.js";
import { ordersService } from "./src/services/orders.service.js";

async function runTests() {
  console.log("🚀 Starting Delivery Logic & Geofencing System Tests...\n");

  let passed = 0;
  let failed = 0;

  function assert(condition, testName) {
    if (condition) {
      console.log(`✅ [PASS] ${testName}`);
      passed++;
    } else {
      console.error(`❌ [FAIL] ${testName}`);
      failed++;
    }
  }

  try {
    // 1. Initial zones check
    const initialZones = await deliveryZonesService.getZones();
    assert(initialZones.length >= 9, `Initial zones loaded (${initialZones.length} zones found)`);

    // 2. Branch config check
    const branchConfig = await deliveryZonesService.getBranchConfig();
    assert(branchConfig.latitude === 30.0768, "Branch latitude is correct (30.0768)");
    assert(branchConfig.longitude === 31.2458, "Branch longitude is correct (31.2458)");
    assert(branchConfig.maxDeliveryRadiusKm === 8.5, "Branch max delivery radius is 8.5 km");

    // 3. Toggle Zone Coverage (Disable rod-el-farag)
    const toggledZone = await deliveryZonesService.toggleZoneCoverage("rod-el-farag");
    assert(toggledZone.isCovered === false, "Zone 'rod-el-farag' disabled successfully");

    // Toggle back
    const reToggled = await deliveryZonesService.toggleZoneCoverage("rod-el-farag");
    assert(reToggled.isCovered === true, "Zone 'rod-el-farag' re-enabled successfully");

    // 4. Update Zone Price and Time
    const updatedZone = await deliveryZonesService.updateZone("rod-el-farag", {
      fee: 25,
      estimatedMinutes: "15 - 25 دقيقة",
    });
    assert(updatedZone.fee === 25, "Zone fee updated to 25 EGP");
    assert(updatedZone.estimatedMinutes === "15 - 25 دقيقة", "Zone time updated to '15 - 25 دقيقة'");

    // 5. Add New Zone
    const newZone = await deliveryZonesService.addZone({
      name: "شارع مصر والسودان",
      area: "حدائق القبة",
      fee: 30,
      estimatedMinutes: "35 - 45 دقيقة",
      isCovered: true,
    });
    assert(newZone.id.startsWith("zone-"), "New zone created with unique ID");
    assert(newZone.name === "شارع مصر والسودان", "New zone name matches");

    // Verify it appears in getZones
    const updatedZonesList = await deliveryZonesService.getZones();
    assert(updatedZonesList.some((z) => z.id === newZone.id), "New zone is retrieved in full list");

    // 6. Delete Zone
    const delRes = await deliveryZonesService.deleteZone(newZone.id);
    assert(delRes.success === true, "New zone deleted successfully");
    const afterDelList = await deliveryZonesService.getZones();
    assert(!afterDelList.some((z) => z.id === newZone.id), "Deleted zone no longer appears in list");

    // 7. Branch radius update
    await deliveryZonesService.updateBranchConfig({ maxDeliveryRadiusKm: 10 });
    const updatedBranch = await deliveryZonesService.getBranchConfig();
    assert(updatedBranch.maxDeliveryRadiusKm === 10, "Branch radius updated to 10 km");

    // 8. GPS Distance & Google Maps URL generation (Driver helper)
    const distNear = await deliveryZonesService.calculateDistanceFromBranch(30.082, 31.242);
    assert(distNear > 0 && distNear < 3.0, `Calculated distance to nearby point is realistic (${distNear} km)`);

    const gmapsUrl = deliveryZonesService.generateGoogleMapsUrl(30.082, 31.242);
    assert(gmapsUrl.includes("30.082,31.242"), "Google Maps driver navigation link generated");

    // 9. Distance to Far location (Alexandria ~180 km)
    const distFar = await deliveryZonesService.calculateDistanceFromBranch(31.2001, 29.9187);
    assert(distFar > 150 && distFar < 220, `Calculated distance to Alexandria is accurate (${distFar} km)`);

    // 10. Orders Service with real menu product and zone
    const targetZone = await deliveryZonesService.getZoneById("rod-el-farag");
    const order = await ordersService.createOrder({
      customerName: "عميل تجربة",
      customerPhone: "01099887766",
      orderType: "delivery",
      customerAddress: "شارع شبرا - عمارة 15 - الدور الثالث",
      deliveryZone: targetZone.name,
      googleMapsUrl: gmapsUrl,
      notes: "بدون شطة",
      items: [
        {
          id: "pasta-meat-oven",
          quantity: 2,
        },
      ],
    });

    assert(order.id && order.id.length > 0, `Order created with ID #${order.id}`);
    assert(order.deliveryFee === targetZone.fee, `Delivery fee matched zone fee (${order.deliveryFee} EGP)`);
    assert(order.totalAmount === (120 * 2) + targetZone.fee, `Total amount correct: (120*2) + ${targetZone.fee} = ${order.totalAmount} EGP`);
    assert(order.deliveryZone === targetZone.name, "Delivery zone snapshot preserved");
    assert(order.googleMapsUrl === gmapsUrl, "Google Maps URL preserved in order");

    console.log(`\n==========================================`);
    console.log(`🎉 TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
    console.log(`==========================================\n`);

    if (failed > 0) process.exit(1);
  } catch (err) {
    console.error("Test execution threw exception:", err);
    process.exit(1);
  }
}

runTests();

