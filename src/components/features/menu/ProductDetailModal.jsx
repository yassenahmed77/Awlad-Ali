"use client";

import React, { useState, useEffect, useMemo } from "react";
import Image from "next/image";
import { X, Heart, Plus, Minus, ArrowLeft } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

export function ProductDetailModal({ product, isOpen, onClose, onAddToCart }) {
  const [selectedSize, setSelectedSize] = useState(null);
  const [selectedAddons, setSelectedAddons] = useState([]);
  const [quantity, setQuantity] = useState(1);
  const [isFavorite, setIsFavorite] = useState(false);

  useEffect(() => {
    if (product) {
      if (product.sizes && product.sizes.length > 0) {
        setSelectedSize(product.sizes[0]);
      } else {
        setSelectedSize(null);
      }
      setSelectedAddons([]);
      setQuantity(1);
    }
  }, [product]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  const itemTotal = useMemo(() => {
    if (!product) return 0;
    const base = selectedSize ? Number(selectedSize.price) : Number(product.basePrice || 0);
    const addonsTotal = selectedAddons.reduce((sum, a) => sum + Number(a.price || 0), 0);
    return (base + addonsTotal) * quantity;
  }, [product, selectedSize, selectedAddons, quantity]);

  if (!isOpen || !product) return null;

  const toggleAddon = (addon) => {
    setSelectedAddons((prev) => {
      const exists = prev.find((a) => a.id === addon.id);
      if (exists) {
        return prev.filter((a) => a.id !== addon.id);
      }
      return [...prev, addon];
    });
  };

  const handleConfirm = () => {
    onAddToCart({
      product,
      selectedSize,
      selectedAddons,
      quantity,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-[2px] transition-opacity"
        onClick={onClose}
      />

      {/* Sheet Container (Exact Image Match) */}
      <div className="relative z-10 w-full max-w-md bg-white rounded-t-[32px] sm:rounded-3xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden animate-slide-up">
        {/* Grab bar */}
        <div className="w-full flex justify-center pt-3 pb-1">
          <div className="w-12 h-1 bg-slate-300 rounded-full" />
        </div>

        {/* Top Header Bar */}
        <div className="flex items-center justify-between px-5 py-2">
          {/* Top Left: Heart Favorite Button */}
          <button
            onClick={() => setIsFavorite(!isFavorite)}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-[#fef2f2] text-[#ef4444] border border-[#fee2e2] transition-colors cursor-pointer"
            aria-label="المفضلة"
          >
            <Heart className={`w-4 h-4 ${isFavorite ? "fill-[#ef4444]" : "fill-none"}`} />
          </button>

          {/* Center: Category Title */}
          <span className="text-sm font-bold text-[#64748b]">
            {product.categoryName}
          </span>

          {/* Top Right: Close Button */}
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-[#f1f5f9] text-[#64748b] hover:text-[#0f172a] transition-colors cursor-pointer"
            aria-label="إغلاق"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto px-5 py-2 space-y-4 text-right">
          {/* Circular Image with Shadow */}
          <div className="flex justify-center my-1">
            <div className="relative w-36 h-36 rounded-full overflow-hidden border-4 border-white shadow-lg bg-slate-100">
              <Image
                src={product.image}
                alt={product.name}
                fill
                sizes="150px"
                className="object-cover"
              />
            </div>
          </div>

          {/* Title and Stepper Pill Row */}
          <div className="flex items-center justify-between gap-3 pt-1">
            {/* Left: Stepper Pill */}
            <div className="flex items-center gap-2 bg-[#f8fafc] border border-[#eaedf1] px-2.5 py-1 rounded-full">
              <button
                onClick={() => setQuantity((q) => Math.min(99, q + 1))}
                className="w-6 h-6 flex items-center justify-center rounded-full bg-[#0b6638] text-white active:scale-95 cursor-pointer shadow-sm"
                aria-label="زيادة"
              >
                <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
              </button>
              <span className="text-sm font-black w-4 text-center text-[#111827]">{quantity}</span>
              <button
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                className="w-6 h-6 flex items-center justify-center rounded-full bg-white text-[#64748b] border border-slate-200 active:scale-95 cursor-pointer"
                aria-label="تقليل"
              >
                <Minus className="w-3.5 h-3.5 stroke-[2.5]" />
              </button>
            </div>

            {/* Right: Title */}
            <h3 className="text-xl font-black text-[#111827]">
              {product.name}
            </h3>
          </div>

          {/* 3 Info Columns (Exact Image Match: Left = الفرع, Center = القسم, Right = التحضير) */}
          <div className="grid grid-cols-3 gap-2 p-3 bg-white rounded-2xl border border-[#eaedf1] text-center text-xs">
            <div className="space-y-0.5 border-r border-[#eaedf1]">
              <span className="text-[11px] text-[#9ca3af] block">الفرع</span>
              <p className="font-bold text-[#111827]">{product.branch || "روض الفرج"}</p>
            </div>
            <div className="space-y-0.5">
              <span className="text-[11px] text-[#9ca3af] block">القسم</span>
              <p className="font-bold text-[#111827]">{product.categoryName}</p>
            </div>
            <div className="space-y-0.5 border-l border-[#eaedf1]">
              <span className="text-[11px] text-[#9ca3af] block">التحضير</span>
              <p className="font-bold text-[#111827]">{product.prepTime || "15-20 دقيقة"}</p>
            </div>
          </div>

          {/* Description */}
          <p className="text-xs text-[#64748b] leading-relaxed text-right">
            {product.description}
          </p>

          {/* Sizes 2x2 Grid (Exact Image Match in RTL: Right = صغير/كبير, Left = وسط/عائلي) */}
          {product.sizes && product.sizes.length > 0 && (
            <div className="space-y-2 pt-1">
              <h4 className="text-xs font-black text-[#111827]">اختر الحجم المطلوب:</h4>
              <div className="grid grid-cols-2 gap-2.5" dir="rtl">
                {product.sizes.map((size) => {
                  const isSelected = selectedSize?.id === size.id;
                  return (
                    <button
                      key={size.id}
                      onClick={() => setSelectedSize(size)}
                      className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl border transition-all text-xs cursor-pointer ${
                        isSelected
                          ? "bg-[#eaf8ee] border-[#0b6638] text-[#0b6638] font-bold"
                          : "bg-white border-[#eaedf1] text-[#111827] hover:bg-slate-50 font-bold"
                      }`}
                    >
                      <span>{size.name}</span>
                      <span className="text-[#0b6638] font-black">{formatCurrency(size.price)}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Add-ons & Sauces */}
          {product.addons && product.addons.length > 0 && (
            <div className="space-y-2 pt-1">
              <h4 className="text-xs font-black text-[#111827]">إضافات وصوصات:</h4>
              <div className="space-y-1.5" dir="rtl">
                {product.addons.map((addon) => {
                  const isChecked = selectedAddons.some((a) => a.id === addon.id);
                  return (
                    <label
                      key={addon.id}
                      onClick={() => toggleAddon(addon)}
                      className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl border transition-all cursor-pointer text-xs ${
                        isChecked
                          ? "bg-[#eaf8ee] border-[#0b6638] text-[#0b6638] font-bold"
                          : "bg-white border-[#eaedf1] text-[#475569] hover:bg-slate-50"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => {}}
                          className="w-4 h-4 rounded text-[#0b6638] focus:ring-[#0b6638] accent-[#0b6638]"
                        />
                        <span>{addon.name}</span>
                      </div>
                      <span className="font-bold text-[#0b6638]">+{formatCurrency(addon.price)}</span>
                    </label>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Sticky Footer (Left = Add to Cart + Stepper, Right = Total Price) */}
        <div className="flex items-center justify-between px-5 py-3 border-t border-[#eaedf1] bg-white pb-safe">
          {/* Add to Cart Button & Quantity Stepper */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleConfirm}
              disabled={product.isAvailable === false}
              className="flex items-center gap-2 bg-[#0b6638] text-white font-black text-xs px-5 py-2.5 rounded-full hover:bg-[#08502c] active:scale-95 disabled:opacity-50 transition-all shadow-sm cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>{product.isAvailable === false ? "غير متوفر" : "أضف للسلة"}</span>
            </button>

            {/* Quantity Stepper Pill */}
            {product.isAvailable !== false && (
              <div className="flex items-center gap-2 bg-[#f8fafc] border border-[#eaedf1] px-2 py-1 rounded-full">
                <button
                  type="button"
                  onClick={() => setQuantity((q) => Math.min(99, q + 1))}
                  className="w-5 h-5 flex items-center justify-center rounded-full bg-white text-[#0b6638] shadow-sm hover:bg-emerald-50 active:scale-90 font-bold cursor-pointer"
                  aria-label="زيادة"
                >
                  <Plus className="w-3 h-3 stroke-[2.5]" />
                </button>
                <span className="font-black text-xs text-[#111827] min-w-[14px] text-center">
                  {quantity}
                </span>
                <button
                  type="button"
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  className="w-5 h-5 flex items-center justify-center rounded-full bg-white text-slate-600 shadow-sm hover:bg-slate-100 active:scale-90 font-bold cursor-pointer"
                  aria-label="نقصان"
                >
                  <Minus className="w-3 h-3 stroke-[2.5]" />
                </button>
              </div>
            )}
          </div>

          {/* Total Price on Right */}
          <div className="text-right">
            <span className="text-[10px] text-[#9ca3af] block font-medium">السعر الإجمالي</span>
            <span className="text-base font-black text-[#0b6638]">
              {formatCurrency(itemTotal)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
