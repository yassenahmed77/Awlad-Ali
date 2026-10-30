"use client";

import { useState } from "react";
import Image from "next/image";
import { Search, CheckCircle, AlertCircle } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

export function ProductManager({ products, onToggleAvailability }) {
  const [search, setSearch] = useState("");

  const filtered = products.filter(
    (p) =>
      p.name.includes(search) ||
      p.categoryName.includes(search)
  );

  return (
    <div className="bg-white rounded-2xl border border-surface-border p-4 shadow-sm space-y-4 text-right">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="text-base font-bold text-text-primary">
          إدارة توفر الأصناف (متاح / خلصان)
        </h3>

        {/* Quick search */}
        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 text-text-muted absolute right-3 top-3.5" />
          <input
            type="text"
            placeholder="ابحث عن صنف..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-10 pr-9 pl-3 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-700"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 max-h-[600px] overflow-y-auto">
        {filtered.map((product) => (
          <div
            key={product.id}
            className={`p-3 rounded-2xl border transition-all flex items-center justify-between gap-3 ${
              product.isAvailable
                ? "bg-white border-surface-border"
                : "bg-red-50/40 border-red-200"
            }`}
          >
            {/* Toggle Button */}
            <button
              onClick={() => onToggleAvailability(product.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                product.isAvailable
                  ? "bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100"
                  : "bg-red-100 text-red-800 border-red-300 hover:bg-red-200"
              }`}
            >
              {product.isAvailable ? (
                <span className="flex items-center gap-1">
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                  متاح للطلب
                </span>
              ) : (
                <span className="flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5 text-red-600" />
                  غير متوفر (خلصان)
                </span>
              )}
            </button>

            {/* Info & Thumbnail */}
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="text-right">
                <h5 className="text-xs font-bold text-text-primary line-clamp-1">{product.name}</h5>
                <span className="text-[11px] text-brand-700 font-bold block">
                  {formatCurrency(product.basePrice)}
                </span>
              </div>
              <div className="relative w-11 h-11 rounded-xl overflow-hidden shrink-0 bg-slate-100 border border-slate-200">
                <Image src={product.image} alt={product.name} fill className="object-cover" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

