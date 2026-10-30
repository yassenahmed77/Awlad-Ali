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
      className="flex items-center justify-between p-3.5 bg-white rounded-[20px] border border-[#eaedf1] shadow-[0_2px_8px_rgba(0,0,0,0.02)] hover:border-[#096633] transition-all cursor-pointer active:scale-[0.99] gap-3.5"
    >
      {/* Product Image on Left (Natural LTR) */}
      <div className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-2xl overflow-hidden shrink-0 bg-slate-50 border border-slate-100">
        <Image
          src={product.image}
          alt={product.name}
          fill
          sizes="120px"
          className="object-cover"
        />
      </div>

      {/* Details on Right (Natural LTR) */}
      <div className="flex-1 flex flex-col justify-between self-stretch min-w-0">
        <div className="space-y-1">
          <span className="inline-block px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-[#eaf8ee] text-[#096633]">
            {product.categoryName}
          </span>
          <h4 className="text-sm sm:text-base font-black text-[#111827] line-clamp-1">
            {product.name}
          </h4>
          <p className="text-[11px] sm:text-xs text-[#64748b] line-clamp-2 leading-relaxed">
            {product.description}
          </p>
        </div>

        {/* Price and Plus Button Row */}
        <div className="flex items-center justify-between mt-3 pt-2 border-t border-slate-50">
          <div className="flex items-baseline gap-1">
            <span className="text-[11px] text-[#9ca3af] font-medium">يبدأ من:</span>
            <span className="text-sm font-black text-[#096633]">
              {formatCurrency(minPrice)}
            </span>
          </div>

          <button
            onClick={(e) => {
              e.stopPropagation();
              onSelect(product);
            }}
            className="w-8 h-8 rounded-lg bg-[#096633] text-white flex items-center justify-center hover:bg-[#075229] active:scale-90 transition-all shadow-sm"
            aria-label={`إضافة ${product.name}`}
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
          </button>
        </div>
      </div>
    </div>
  );
}
