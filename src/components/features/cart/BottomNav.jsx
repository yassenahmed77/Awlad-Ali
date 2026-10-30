"use client";

import React from "react";
import { Home, ClipboardList, ShoppingBag, Bike, MapPin } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { cn } from "@/lib/utils";

export function BottomNav({ activeTab, onTabChange, onCartClick }) {
  const { totalItemsCount, isBouncing } = useCart();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-[#eaedf1] pb-safe shadow-[0_-2px_15px_rgba(0,0,0,0.04)]">
      <div className="max-w-md mx-auto px-4 h-16 flex items-center justify-between relative">
        {/* 1. الرئيسية (Left) */}
        <button
          onClick={() => onTabChange("home")}
          className={cn(
            "flex flex-col items-center justify-center gap-1 w-14 py-1 text-[11px] font-bold transition-all cursor-pointer",
            activeTab === "home" ? "text-[#096633]" : "text-[#94a3b8] hover:text-[#64748b]"
          )}
        >
          <Home className={cn("w-5 h-5", activeTab === "home" ? "text-[#096633]" : "text-[#94a3b8]")} />
          <span>الرئيسية</span>
        </button>

        {/* 2. المنيو */}
        <button
          onClick={() => onTabChange("menu")}
          className={cn(
            "flex flex-col items-center justify-center gap-1 w-14 py-1 text-[11px] font-bold transition-all cursor-pointer",
            activeTab === "menu" ? "text-[#d97706]" : "text-[#94a3b8] hover:text-[#64748b]"
          )}
        >
          <ClipboardList className="w-5 h-5 text-[#d97706]" />
          <span>المنيو</span>
        </button>

        {/* 3. Center: Green Floating Cart Button */}
        <div className="relative -top-4 flex flex-col items-center">
          <button
            onClick={onCartClick}
            className={cn(
              "w-13 h-13 rounded-full bg-[#096633] text-white flex items-center justify-center shadow-lg shadow-[#096633]/30 border-4 border-white hover:bg-[#075229] active:scale-95 transition-all relative cursor-pointer",
              isBouncing && "animate-cart-bounce"
            )}
            aria-label="سلة الطلبات"
          >
            <ShoppingBag className="w-5 h-5" />
            {totalItemsCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-amber-500 text-amber-950 font-black text-[10px] w-5 h-5 rounded-full flex items-center justify-center border-2 border-white shadow-sm">
                {totalItemsCount}
              </span>
            )}
          </button>
        </div>

        {/* 4. طلباتي */}
        <button
          onClick={() => onTabChange("orders")}
          className={cn(
            "flex flex-col items-center justify-center gap-1 w-14 py-1 text-[11px] font-bold transition-all cursor-pointer",
            activeTab === "orders" ? "text-[#db2777]" : "text-[#94a3b8] hover:text-[#64748b]"
          )}
        >
          <Bike className="w-5 h-5 text-[#db2777]" />
          <span>طلباتي</span>
        </button>

        {/* 5. الفرع (Right) */}
        <button
          onClick={() => onTabChange("branch")}
          className={cn(
            "flex flex-col items-center justify-center gap-1 w-14 py-1 text-[11px] font-bold transition-all cursor-pointer",
            activeTab === "branch" ? "text-[#db2777]" : "text-[#94a3b8] hover:text-[#64748b]"
          )}
        >
          <MapPin className="w-5 h-5 text-[#db2777]" />
          <span>الفرع</span>
        </button>
      </div>
    </nav>
  );
}
