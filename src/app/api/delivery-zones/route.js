import { NextResponse } from "next/server.js";
import { deliveryZonesService } from "../../../services/deliveryZones.service.js";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const onlyCovered = searchParams.get("onlyCovered") === "true";
    const area = searchParams.get("area") || "all";

    const [zones, branchConfig] = await Promise.all([
      deliveryZonesService.getZones({ onlyCovered, area }),
      deliveryZonesService.getBranchConfig(),
    ]);

    return NextResponse.json({
      success: true,
      zones,
      branchConfig,
    });
  } catch (err) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();

    // Check if this is a branch config update request
    if (body.action === "updateBranchConfig") {
      const updatedConfig = await deliveryZonesService.updateBranchConfig(body.config);
      return NextResponse.json({ success: true, branchConfig: updatedConfig });
    }

    // Default: Add a new delivery zone
    const newZone = await deliveryZonesService.addZone(body);
    return NextResponse.json({ success: true, zone: newZone }, { status: 201 });
  } catch (err) {
    return NextResponse.json({ success: false, error: err.message }, { status: 400 });
  }
}

export async function PATCH(request) {
  try {
    const body = await request.json();
    const { id, action, updates } = body;

    if (!id) {
      return NextResponse.json({ success: false, error: "معرف المنطقة مطلوب" }, { status: 400 });
    }

    // 1. Quick Toggle Coverage
    if (action === "toggleCoverage") {
      const updatedZone = await deliveryZonesService.toggleZoneCoverage(id);
      return NextResponse.json({ success: true, zone: updatedZone });
    }

    // 2. Full or partial zone edit (fee, time, name, etc.)
    const updatedZone = await deliveryZonesService.updateZone(id, updates || body);
    return NextResponse.json({ success: true, zone: updatedZone });
  } catch (err) {
    return NextResponse.json({ success: false, error: err.message }, { status: 400 });
  }
}

export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ success: false, error: "معرف المنطقة مطلوب للحذف" }, { status: 400 });
    }

    const res = await deliveryZonesService.deleteZone(id);
    return NextResponse.json(res);
  } catch (err) {
    return NextResponse.json({ success: false, error: err.message }, { status: 400 });
  }
}

