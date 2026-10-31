import { NextResponse } from "next/server";
import { ordersService } from "@/services/orders.service";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    // 1. Fetch single order by ID (Used by customer live order tracking)
    if (id) {
      const order = await ordersService.getOrderById(id);
      if (!order) {
        return NextResponse.json({ success: false, error: "الطلب غير موجود" }, { status: 404 });
      }
      return NextResponse.json({ success: true, order });
    }

    // 2. Fetch all orders (Used by cashier / admin dashboard)
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
    return NextResponse.json({ success: false, error: err.message || "فشل تسجيل الطلب" }, { status: 400 });
  }
}

export async function PATCH(request) {
  try {
    const body = await request.json();
    const { orderId, status } = body;
    if (!orderId || !status) {
      return NextResponse.json({ success: false, error: "رقم الطلب والحالة مطلوبان" }, { status: 400 });
    }

    const updatedOrder = await ordersService.updateOrderStatus(orderId, status);
    return NextResponse.json({ success: true, order: updatedOrder });
  } catch (err) {
    return NextResponse.json({ success: false, error: err.message }, { status: 400 });
  }
}
