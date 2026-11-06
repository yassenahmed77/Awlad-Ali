"use client";

import Image from "next/image";
import Link from "next/link";
import { Plus, Minus, Trash2, ArrowRight, ShoppingBag, X, Clock, Store } from "lucide-react";
import { useCart } from "@/hooks/useCart";
import { formatCurrency } from "@/lib/utils";

export function CartDrawer({ isOpen, onClose, onProceedToCheckout, onEditItem }) {
  const { items, subtotal, updateQuantity, clearCart } = useCart();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      {/* Blurred Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-[2px] transition-opacity animate-fade-in"
        onClick={onClose}
      />

      {/* Modal Container (Exact Image 2 Style) */}
      <div className="relative z-10 w-full max-w-md bg-white rounded-t-[32px] sm:rounded-3xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden animate-slide-up text-right">
        {/* Grab bar */}
        <div className="w-full flex justify-center pt-3 pb-1">
          <div className="w-12 h-1 bg-slate-300 rounded-full" />
        </div>

        {/* Top Header */}
        <div className="flex items-center justify-between px-5 py-2.5">
          {/* Close Button on Right in RTL */}
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-[#f1f5f9] text-[#64748b] hover:text-[#0f172a] hover:bg-slate-200 active:scale-95 transition-all"
            aria-label="إغلاق"
          >
            <X className="w-4 h-4 stroke-[2.5]" />
          </button>

          {/* Centered Title */}
          <span className="text-sm font-bold text-[#1e293b]">
            سلة الطلبات ({items.length})
          </span>

          {/* Trash Clear Button on Left in RTL */}
          {items.length > 0 ? (
            <button
              onClick={clearCart}
              className="w-8 h-8 flex items-center justify-center rounded-full bg-[#fef2f2] text-[#ef4444] hover:bg-[#fee2e2] transition-colors"
              title="إفراغ السلة"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          ) : (
            <div className="w-8 h-8" />
          )}
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto px-5 py-3 space-y-4">
          {items.length === 0 ? (
            <div className="py-12 flex flex-col items-center justify-center text-center space-y-3">
              <div className="w-16 h-16 rounded-full bg-[#eaf8ee] text-[#0b6638] flex items-center justify-center">
                <ShoppingBag className="w-8 h-8" />
              </div>
              <h4 className="text-base font-black text-[#111827]">سلتك لسه فاضية!</h4>
              <p className="text-xs text-[#64748b] max-w-xs">
                اختار أكلتك المفضلة من المنيو وابدأ طلبك دلوقتي وسيبه علينا
              </p>
              <button
                onClick={onClose}
                className="mt-2 px-5 py-2.5 rounded-full bg-[#0b6638] text-white text-xs font-bold hover:bg-[#08502c] transition-all"
              >
                تصفح المنيو
              </button>
            </div>
          ) : (
            <>
              {/* Info Bar (Matching 3 info columns in Image 2) */}
              <div className="grid grid-cols-2 gap-2 p-3 bg-white rounded-2xl border border-[#eaedf1] text-center text-xs">
                <div className="space-y-0.5 border-l border-[#eaedf1]">
                  <span className="text-[11px] text-[#9ca3af] block">وقت التحضير المتوقع</span>
                  <p className="font-black text-[#111827]">15-25 دقيقة</p>
                </div>
                <div className="space-y-0.5">
                  <span className="text-[11px] text-[#9ca3af] block">الفرع المسئول</span>
                  <p className="font-black text-[#0b6638]">روض الفرج، شبرا</p>
                </div>
              </div>

              {/* Items List */}
              <div className="space-y-3">
                {items.map((item) => (
                  <div
                    key={item.cartKey}
                    className="p-3 bg-white rounded-2xl border border-[#eaedf1] shadow-[0_2px_8px_rgba(0,0,0,0.02)] flex items-center justify-between gap-3 hover:border-emerald-200 transition-all"
                  >
                    {/* Quantity Stepper Pill (Exact Image 2 Style) */}
                    <div className="flex items-center gap-2 bg-[#f8fafc] border border-[#eaedf1] px-2.5 py-1 rounded-full shrink-0">
                      <button
                        onClick={() => updateQuantity(item.cartKey, item.quantity + 1)}
                        className="w-5 h-5 flex items-center justify-center rounded-full bg-[#0b6638] text-white active:scale-95 cursor-pointer shadow-xs"
                        aria-label="زيادة الكمية"
                      >
                        <Plus className="w-3 h-3 stroke-[2.5]" />
                      </button>
                      <span className="text-xs font-black w-3 text-center text-[#111827]">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => updateQuantity(item.cartKey, item.quantity - 1)}
                        className="w-5 h-5 flex items-center justify-center rounded-full bg-white text-[#64748b] border border-slate-200 active:scale-95 cursor-pointer"
                        aria-label="تقليل الكمية"
                      >
                        <Minus className="w-3 h-3 stroke-[2.5]" />
                      </button>
                    </div>

                    {/* Clickable Card Body: Clicking here opens the product modal to customize or add addons */}
                    <div
                      onClick={() => onEditItem && onEditItem(item)}
                      className="flex-1 flex items-center justify-between gap-3 cursor-pointer group select-none"
                      title="اضغط لتعديل الحجم أو إضافة صوصات وجبن"
                    >
                      {/* Item Details */}
                      <div className="flex-1 min-w-0 text-right">
                        <h5 className="text-xs sm:text-sm font-black text-[#111827] line-clamp-1 group-hover:text-[#0b6638] transition-colors">
                          {item.name}
                        </h5>
                        <div className="flex flex-wrap items-center justify-end gap-1 mt-0.5">
                          {item.selectedSize && (
                            <span className="text-[10px] font-bold text-[#0b6638] bg-[#eaf8ee] px-2 py-0.5 rounded-md">
                              {item.selectedSize.name}
                            </span>
                          )}
                          <span className="text-xs font-black text-[#0b6638]">
                            {formatCurrency(item.itemTotal)}
                          </span>
                        </div>
                        {item.selectedAddons && item.selectedAddons.length > 0 && (
                          <p className="text-[10px] text-[#9ca3af] line-clamp-1 mt-0.5 font-medium text-right">
                            + {item.selectedAddons.map((a) => a.name).join("، ")}
                          </p>
                        )}
                      </div>

                      {/* Image Thumbnail */}
                      {item.image && (
                        <div className="relative w-14 h-14 rounded-xl overflow-hidden shrink-0 bg-slate-100 border border-slate-100 group-hover:scale-105 transition-transform shadow-xs">
                          <Image src={item.image} alt={item.name} fill className="object-cover" />
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Sticky Footer (Exact Image 2 Style) */}
        {items.length > 0 && (
          <div className="flex items-center justify-between px-5 py-3.5 border-t border-[#eaedf1] bg-white pb-safe">
            {/* Proceed Button on Left */}
            <Link
              href="/checkout"
              onClick={onClose}
              className="flex items-center gap-2 bg-[#0b6638] text-white font-black text-xs px-5 py-3 rounded-xl hover:bg-[#08502c] active:scale-95 transition-all shadow-sm"
            >
              <span>متابعة الطلب والتوصيل</span>
              <ArrowRight className="w-3.5 h-3.5 rotate-180" />
            </Link>

            {/* Total Price on Right */}
            <div className="text-right">
              <span className="text-[10px] text-[#9ca3af] block font-medium">المجموع المطلوب</span>
              <span className="text-base font-black text-[#0b6638]">
                {formatCurrency(subtotal)}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
