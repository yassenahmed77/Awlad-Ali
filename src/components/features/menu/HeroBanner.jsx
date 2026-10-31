"use client";

export function HeroBanner({ onOrderNowClick }) {
  return (
    <div className="relative w-full rounded-[22px] bg-gradient-to-b from-[#0b6638] to-[#044c26] text-white px-4 py-3.5 sm:px-5 sm:py-4 shadow-sm overflow-hidden my-2.5">
      <div className="flex items-center justify-between gap-3">
        {/* Left CTA Button (Small White Pill) */}
        <button
          onClick={onOrderNowClick}
          className="shrink-0 bg-white text-[#0b6638] font-black text-[11px] sm:text-xs px-3.5 py-1.5 rounded-full shadow-sm hover:bg-slate-50 active:scale-95 transition-all cursor-pointer"
        >
          اطلب الآن
        </button>

        {/* Right Text (Flush Right, Bold & Starts From Right) */}
        <div className="text-right space-y-0.5" dir="rtl">
          <h2 className="text-base sm:text-lg font-black text-white leading-tight">
            أصل الفطير والبيتزا في مصر 🔥
          </h2>
          <p className="text-[11px] sm:text-xs text-[#a7f3d0] font-bold leading-tight">
            أسرع دليفري في شبرا
          </p>
        </div>
      </div>
    </div>
  );
}
