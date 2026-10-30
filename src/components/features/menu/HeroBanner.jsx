"use client";

import { Flame } from "lucide-react";

export function HeroBanner({ onOrderNowClick }) {
  return (
    <div className="relative w-full rounded-[24px] bg-[#096633] text-white p-5 shadow-sm overflow-hidden my-3">
      <div className="flex items-center justify-between gap-3">
        {/* Left CTA Button */}
        <button
          onClick={onOrderNowClick}
          className="shrink-0 bg-white text-[#096633] font-bold text-xs sm:text-sm px-4 py-2 rounded-full shadow-sm hover:bg-slate-50 active:scale-95 transition-all"
        >
          اطلب الآن
        </button>

        {/* Right Text */}
        <div className="text-right space-y-1">
          <h2 className="text-lg sm:text-xl font-black text-white flex items-center justify-end gap-1.5">
            <span>أجدع أكل في شبرا</span>
            <span className="text-base">🔥</span>
          </h2>
          <p className="text-[11px] sm:text-xs text-emerald-100 font-medium">
            توصيل ساخن وسريع لجميع مناطق شبرا
          </p>
        </div>
      </div>
    </div>
  );
}
