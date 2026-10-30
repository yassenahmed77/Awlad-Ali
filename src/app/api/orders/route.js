import { NextResponse } from "next/server";
import { ordersService } from "@/services/orders.service";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") || "all";
    const orders = await ordersService.getOrders({ status });
    return NextResponse.json({ success: true, orders });
  } catch (err) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const newOrder = await ordersService.createOrder(body);
    return NextResponse.json({ success: true, order: newOrder }, { status: 201 });
  } catch (err) {
    console.error("Order API Error:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 400 });
  }
}

