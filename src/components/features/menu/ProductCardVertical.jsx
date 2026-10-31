"use client";

import React from "react";
import Image from "next/image";
import { Plus } from "lucide-react";

export function ProductCardVertical({ product, onSelect }) {
  const minPrice =
    product.sizes && product.sizes.length > 0
      ? Math.min(...product.sizes.map((s) => s.price))
      : product.basePrice;

  return (
    <div
      onClick={() => onSelect(product)}
      className="w-[155px] sm:w-[165px] shrink-0 snap-start bg-white rounded-2xl border border-[#eaedf1] p-2 shadow-sm hover:shadow-md transition-all flex flex-col justify-between cursor-pointer active:scale-[0.98] select-none"
    >
      {/* 1. Top Image with Optional Badge */}
      <div className="relative w-full h-28 rounded-xl overflow-hidden bg-slate-50 border border-slate-100 shadow-xs mb-1.5">
        <Image
          src={product.image}
          alt={product.name}
          fill
          sizes="165px"
          className="object-cover"
        />
        {/* Subtle white rating badge like the screenshot */}
        <span className="absolute top-1.5 right-1.5 px-1.5 py-0.5 rounded-md bg-white/95 backdrop-blur-xs text-[10px] font-black text-[#111827] shadow-xs">
          ⭐ 4.9
        </span>
      </div>

      {/* 2. Middle Text (Title & Short Description) */}
      <div className="text-right px-0.5">
        <h4 className="text-xs sm:text-[13px] font-black text-[#111827] truncate leading-tight">
          {product.name}
        </h4>
        <p className="text-[10px] text-[#94a3b8] truncate mt-0.5 font-medium">
          {product.description}
        </p>
      </div>

      {/* 3. Bottom Row: Plus Button on Left, Price on Right (Exact Screenshot Match) */}
      <div className="flex items-center justify-between mt-2 pt-1 px-0.5">
        {/* Left: Green Rounded-Square Plus Button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onSelect(product);
          }}
          className="w-7 h-7 rounded-lg bg-[#0b6638] text-white flex items-center justify-center hover:bg-[#08502c] active:scale-90 transition-all shadow-xs cursor-pointer"
          aria-label={`إضافة ${product.name}`}
        >
          <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
        </button>

        {/* Right: Price in Bold Green */}
        <span className="text-xs sm:text-sm font-black text-[#0b6638] text-right" dir="rtl">
          {minPrice} ج.م
        </span>
      </div>
    </div>
  );
}
