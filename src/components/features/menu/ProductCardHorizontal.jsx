"use client";

import React from "react";
import Image from "next/image";
import { Plus } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

export function ProductCardHorizontal({ product, onSelect }) {
  const minPrice =
    product.sizes && product.sizes.length > 0
      ? Math.min(...product.sizes.map((s) => s.price))
      : product.basePrice;

  return (
    <div
      onClick={() => onSelect(product)}
      className="flex items-center justify-between p-3 bg-white rounded-2xl border border-[#eaedf1] shadow-sm hover:shadow-md transition-all cursor-pointer active:scale-[0.99] gap-3"
    >
      {/* 1. Left Side Column: Badge at Top, Rounded Square Plus Button at Bottom (Exact Image 3 Match) */}
      <div className="flex flex-col justify-between self-stretch shrink-0 items-start">
        {/* Top Left Badge (Small & Compact) */}
        <span className="inline-block px-2 py-0.5 rounded-md text-[10px] sm:text-[11px] font-bold bg-[#eaf8ee] text-[#0b6638] leading-tight">
          {product.categoryName}
        </span>

        {/* Bottom Left: Rounded-XL Green Plus Button (Exact Image 3 Match: Rounded Square) */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onSelect(product);
          }}
          className="w-8 h-8 rounded-xl bg-[#0b6638] text-white flex items-center justify-center hover:bg-[#08502c] active:scale-75 active:bg-[#08502c] transition-all duration-100 shadow-sm cursor-pointer mt-auto"
          aria-label={`إضافة ${product.name}`}
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
        </button>
      </div>

      {/* 2. Middle Column: Title & Description & Price at Bottom */}
      <div className="flex-1 flex flex-col justify-between self-stretch text-right min-w-0 py-0.5">
        <div>
          <h4 className="text-[15px] sm:text-base font-black text-[#0f172a] leading-snug tracking-tight">
            {product.name}
          </h4>
          <p className="text-[11px] sm:text-xs text-[#6b7280] leading-relaxed mt-0.5 font-normal line-clamp-2">
            {product.description}
          </p>
        </div>

        {/* Price at Bottom: Matching Image 3 (Grey "يبدأ من:", Bold Green Price, Grey "ج.م") */}
        <div className="flex items-baseline justify-start gap-1 mt-2 text-right" dir="rtl">
          <span className="text-xs text-[#64748b] font-medium">يبدأ من:</span>
          <span className="text-base sm:text-lg font-black text-[#0b6638]">
            {minPrice}
          </span>
          <span className="text-xs font-semibold text-[#64748b]">
            ج.م
          </span>
        </div>
      </div>

      {/* 3. Far Right: Food Image with Rounded Corners */}
      <div className="relative w-24 h-24 rounded-2xl overflow-hidden shrink-0 bg-slate-50 border border-slate-100 shadow-sm">
        <Image
          src={product.image}
          alt={product.name}
          fill
          sizes="96px"
          className="object-cover"
        />
      </div>
    </div>
  );
}
