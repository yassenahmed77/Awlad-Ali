"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Package, Layers } from "lucide-react";
import { useOrders } from "@/hooks/useOrders";
import { PRODUCTS } from "@/data/menu.data";
import { productsService } from "@/services/products.service";

import { DashboardHeader } from "@/components/features/dashboard/DashboardHeader";
import { OrderCard } from "@/components/features/dashboard/OrderCard";
import { ProductManager } from "@/components/features/dashboard/ProductManager";

export default function AdminDashboardPage() {
  const {
    orders,
    rawOrders,
    selectedFilter,
    setSelectedFilter,
    updateStatus,
    refreshOrders,
    playCashierChime,
  } = useOrders();

  const [activeView, setActiveView] = useState("orders");
  const [isStoreOpen, setIsStoreOpen] = useState(true);
  const [allProducts, setAllProducts] = useState(PRODUCTS);

  const pendingCount = rawOrders.filter((o) => o.status === "pending").length;
  const preparingCount = rawOrders.filter((o) => o.status === "preparing").length;
  const readyCount = rawOrders.filter((o) => o.status === "ready").length;

  const handleToggleProductAvailability = async (productId) => {
    const res = await productsService.toggleAvailability(productId);
    if (res.success) {
      setAllProducts((prev) =>
        prev.map((p) => (p.id === productId ? { ...p, isAvailable: !p.isAvailable } : p))
      );
    }
  };

  const filterTabs = [
    { id: "all", label: "كل الطلبات", count: rawOrders.length },
    { id: "pending", label: "جديد 🟡", count: pendingCount, highlight: pendingCount > 0 },
    { id: "preparing", label: "جاري التجهيز ⏳", count: preparingCount },
    { id: "ready", label: "جاهز 📦", count: readyCount },
    { id: "completed", label: "مكتمل ✅", count: rawOrders.filter((o) => o.status === "completed").length },
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-right font-sans">
      {/* Top Header */}
      <DashboardHeader
        onRefresh={refreshOrders}
        onTestSound={playCashierChime}
        isStoreOpen={isStoreOpen}
        onToggleStoreOpen={() => setIsStoreOpen(!isStoreOpen)}
      />

      <main className="max-w-6xl mx-auto px-4 py-5 space-y-5">
        {/* Navigation Switch & Customer View Link */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-xs font-bold text-brand-700 bg-white border border-brand-200 px-3.5 py-2 rounded-xl hover:bg-brand-50 transition-colors shadow-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>العودة لواجهة العميل (الموبايل)</span>
          </Link>

          {/* Sub-tabs: Orders vs Inventory */}
          <div className="flex items-center gap-1 bg-white p-1 rounded-2xl border border-surface-border shadow-sm">
            <button
              onClick={() => setActiveView("orders")}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeView === "orders"
                  ? "bg-brand-700 text-white shadow-sm"
                  : "text-text-secondary hover:text-text-primary"
              }`}
            >
              <Package className="w-4 h-4" />
              <span>إدارة الطلبات</span>
              {pendingCount > 0 && (
                <span className="w-5 h-5 rounded-full bg-amber-400 text-amber-950 font-black text-[11px] flex items-center justify-center">
                  {pendingCount}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveView("inventory")}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeView === "inventory"
                  ? "bg-brand-700 text-white shadow-sm"
                  : "text-text-secondary hover:text-text-primary"
              }`}
            >
              <Layers className="w-4 h-4" />
              <span>الأصناف والتوفر</span>
            </button>
          </div>
        </div>

        {/* VIEW 1: LIVE ORDERS */}
        {activeView === "orders" && (
          <div className="space-y-4">
            {/* Filter Tabs */}
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
              {filterTabs.map((tab) => {
                const isActive = selectedFilter === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setSelectedFilter(tab.id)}
                    className={`shrink-0 flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                      isActive
                        ? "bg-brand-700 text-white border-brand-700 shadow-sm"
                        : "bg-white text-text-secondary border-surface-border hover:bg-slate-100"
                    }`}
                  >
                    <span>{tab.label}</span>
                    <span
                      className={`px-1.5 py-0.5 rounded-md text-[10px] font-black ${
                        isActive
                          ? "bg-white/20 text-white"
                          : tab.highlight
                          ? "bg-amber-100 text-amber-900 animate-pulse"
                          : "bg-slate-100 text-text-muted"
                      }`}
                    >
                      {tab.count}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Orders Grid */}
            {orders.length === 0 ? (
              <div className="bg-white rounded-2xl border border-surface-border p-12 text-center space-y-2 shadow-sm">
                <p className="text-sm font-bold text-text-primary">لا توجد طلبات في هذا القسم حالياً</p>
                <p className="text-xs text-text-muted">
                  أي طلب جديد يدخله العميل سيظهر هنا تلقائياً ويرن صوت الكاشير 🔔
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {orders.map((order) => (
                  <OrderCard
                    key={order.id}
                    order={order}
                    onUpdateStatus={updateStatus}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* VIEW 2: INVENTORY & AVAILABILITY */}
        {activeView === "inventory" && (
          <ProductManager
            products={allProducts}
            onToggleAvailability={handleToggleProductAvailability}
          />
        )}
      </main>
    </div>
  );
}

