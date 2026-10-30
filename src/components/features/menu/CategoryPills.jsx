"use client";

import React, { useRef, useEffect } from "react";
import { cn } from "@/lib/utils";

const DEFAULT_SUBCATEGORIES = [
  { id: "all", name: "الكل" },
  { id: "pizza-italian", name: "بيتزا إيطالي" },
  { id: "pizza-oriental", name: "بيتزا شرقي" },
  { id: "crepe-chicken", name: "كريب فراخ" },
  { id: "crepe-meat", name: "كريب لحوم" },
  { id: "shawarma-arabi", name: "شاورما عربي" },
  { id: "broast", name: "بروستد مقرمش" },
  { id: "meshaltet", name: "مشلتت فلاحي" },
];

export function CategoryPills({
  categories,
  selectedCategory,
  onSelectCategory,
  selectedSubCategory,
  onSelectSubCategory,
}) {
  const mainRowRef = useRef(null);
  const subRowRef = useRef(null);

  // Find currently selected main category object
  const activeMainCat = categories.find((c) => c.id === selectedCategory);
  
  // Dynamic subcategories based on selection; fallback to default top subcategories for "all"
  const subcategories =
    activeMainCat && activeMainCat.subcategories && activeMainCat.subcategories.length > 0
      ? activeMainCat.subcategories
      : DEFAULT_SUBCATEGORIES;

  // Auto-scroll active pill into view
  useEffect(() => {
    if (!mainRowRef.current) return;
    const activeBtn = mainRowRef.current.querySelector('[data-active="true"]');
    if (activeBtn) {
      activeBtn.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
    }
  }, [selectedCategory]);

  return (
    <div className="w-full space-y-2 py-1 select-none">
      {/* ROW 1: Main Categories (Top Row - Pure LTR) */}
      <div
        ref={mainRowRef}
        className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1 w-full"
      >
        {categories.map((cat) => {
          const isActive = selectedCategory === cat.id;
          return (
            <button
              key={cat.id}
              data-active={isActive}
              onClick={() => {
                onSelectCategory(cat.id);
                if (onSelectSubCategory) onSelectSubCategory("all");
              }}
              className={cn(
                "shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold transition-all border active:scale-95 cursor-pointer shadow-sm",
                isActive
                  ? "bg-[#096633] text-white border-[#096633] shadow-emerald-900/10"
                  : "bg-white text-[#334155] border-[#eaedf1] hover:bg-slate-50"
              )}
            >
              {cat.emoji && <span className="text-xs">{cat.emoji}</span>}
              <span>{cat.name}</span>
            </button>
          );
        })}
      </div>

      {/* ROW 2: Sub-categories (Second Row - Pure LTR, Always Visible) */}
      <div
        ref={subRowRef}
        className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1 px-0.5 w-full animate-fade-in"
      >
        {subcategories.map((sub) => {
          const isSubActive = (selectedSubCategory || "all") === sub.id;
          return (
            <button
              key={sub.id}
              onClick={() => onSelectSubCategory && onSelectSubCategory(sub.id)}
              className={cn(
                "shrink-0 px-3.5 py-1.5 rounded-full text-xs font-bold transition-all border active:scale-95 cursor-pointer",
                isSubActive
                  ? "bg-[#eaf8ee] text-[#096633] border-[#096633] shadow-sm font-black"
                  : "bg-white text-[#64748b] border-[#eaedf1] hover:bg-slate-50 hover:text-[#111827]"
              )}
            >
              {sub.name}
            </button>
          );
        })}
      </div>
    </div>
  );
}
