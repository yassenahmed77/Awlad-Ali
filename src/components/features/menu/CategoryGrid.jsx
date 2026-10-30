"use client";

import Image from "next/image";
import { ArrowRight } from "lucide-react";

export function CategoryGrid({ onSelectCategory, onViewAllClick }) {
  // Pure LTR 8-category grid
  const categories = [
    {
      id: "pizza",
      mainId: "pizza",
      subId: "all",
      name: "بيتزا",
      image: "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=300&auto=format&fit=crop&q=80",
    },
    {
      id: "pies-meshaltet",
      mainId: "pies-meshaltet",
      subId: "all",
      name: "فطائر",
      image: "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=300&auto=format&fit=crop&q=80",
    },
    {
      id: "crepe",
      mainId: "crepe",
      subId: "all",
      name: "كريب",
      image: "https://images.unsplash.com/photo-1628840042765-356cda07504e?w=300&auto=format&fit=crop&q=80",
    },
    {
      id: "shawarma",
      mainId: "shawarma",
      subId: "all",
      name: "شاورما",
      image: "https://images.unsplash.com/photo-1529006557810-274b9b2fc783?w=300&auto=format&fit=crop&q=80",
    },
    {
      id: "broast",
      mainId: "broast-grills",
      subId: "broast",
      name: "بروستد",
      image: "https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?w=300&auto=format&fit=crop&q=80",
    },
    {
      id: "grills",
      mainId: "broast-grills",
      subId: "grills",
      name: "مشويات",
      image: "https://images.unsplash.com/photo-1544025162-d76694265947?w=300&auto=format&fit=crop&q=80",
    },
    {
      id: "pasta",
      mainId: "pasta",
      subId: "all",
      name: "طواجن",
      image: "https://images.unsplash.com/photo-1551183053-bf91a1d81141?w=300&auto=format&fit=crop&q=80",
    },
    {
      id: "sandwiches",
      mainId: "sandwiches",
      subId: "all",
      name: "سندوتشات",
      image: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=300&auto=format&fit=crop&q=80",
    },
  ];

  return (
    <div className="w-full my-3">
      {/* Header: Left Title, Right View All Arrow Button */}
      <div className="flex items-center justify-between mb-3 px-1">
        <h3 className="text-base font-black text-[#111827]">
          الأقسام <span className="text-xs text-[#6b7280] font-normal">(Categories)</span>
        </h3>

        <button
          onClick={onViewAllClick}
          className="w-7 h-7 flex items-center justify-center rounded-full bg-[#096633] text-white hover:bg-[#075229] active:scale-95 transition-all shadow-sm cursor-pointer"
          aria-label="عرض الكل"
        >
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      {/* 4x2 Grid (Natural LTR) */}
      <div className="grid grid-cols-4 gap-2.5">
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => onSelectCategory(cat.mainId, cat.subId)}
            className="flex flex-col items-center justify-center p-2 rounded-[20px] bg-white border border-[#eaedf1] hover:border-[#096633] hover:shadow-sm transition-all active:scale-95 cursor-pointer group"
          >
            <div className="relative w-14 h-14 rounded-full overflow-hidden border border-slate-100 bg-slate-50 mb-1.5 shadow-inner">
              <Image
                src={cat.image}
                alt={cat.name}
                fill
                sizes="60px"
                className="object-cover group-hover:scale-105 transition-transform"
              />
            </div>
            <span className="text-xs font-bold text-[#111827] text-center">
              {cat.name}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
