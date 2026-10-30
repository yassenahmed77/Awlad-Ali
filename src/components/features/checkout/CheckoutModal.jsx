"use client";

import { useState } from "react";
import { Store, Bike, ArrowRight, X } from "lucide-react";
import { useCart } from "@/hooks/useCart";
import { storeConfig } from "@/config/theme.config";
import { formatCurrency } from "@/lib/utils";

export function CheckoutModal({ isOpen, onClose, onOrderPlaced }) {
  const { items, subtotal, clearCart } = useCart();
  const [orderType, setOrderType] = useState("pickup");
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerAddress, setCustomerAddress] = useState("");
  const [notes, setNotes] = useState("");
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const deliveryFee = orderType === "delivery" ? storeConfig.deliveryFee : 0;
  const finalTotal = subtotal + deliveryFee;

  if (!isOpen) return null;

  const validate = () => {
    const newErrors = {};
    if (!customerName.trim()) {
      newErrors.customerName = "يرجى كتابة اسمك";
    }

    const cleanedPhone = customerPhone.trim().replace(/\s+/g, "");
    const egyptPhoneRegex = /^01[0125][0-9]{8}$/;
    if (!cleanedPhone) {
      newErrors.customerPhone = "يرجى كتابة رقم التليفون";
    } else if (!egyptPhoneRegex.test(cleanedPhone)) {
      newErrors.customerPhone = "رقم موبايل مصري غير صحيح (مثال: 01012345678)";
    }

    if (orderType === "delivery" && !customerAddress.trim()) {
      newErrors.customerAddress = "يرجى كتابة عنوان التوصيل بالتفصيل في شبرا";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerName,
          customerPhone,
          orderType,
          customerAddress,
          notes,
          items,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "حدث خطأ أثناء إرسال الطلب");
      }

      clearCart();
      onClose();
      onOrderPlaced(data.order);
    } catch (err) {
      alert(err.message || "حدث خطأ أثناء إرسال الطلب، يرجى المحاولة مرة أخرى");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      {/* Backdrop */}
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
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-[#f1f5f9] text-[#64748b] hover:text-[#0f172a] hover:bg-slate-200 active:scale-95 transition-all"
            aria-label="إغلاق"
          >
            <X className="w-4 h-4 stroke-[2.5]" />
          </button>

          <span className="text-sm font-bold text-[#1e293b]">
            تأكيد الطلب والتوصيل
          </span>

          <div className="w-8 h-8" />
        </div>

        {/* Scrollable Form Body */}
        <form id="checkout-form" onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-5 py-3 space-y-4">
          {/* Order Type Selector (Matching Size Selector from Image 2) */}
          <div className="space-y-1.5">
            <h4 className="text-xs font-black text-[#111827]">اختر طريقة الاستلام:</h4>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setOrderType("pickup")}
                className={`flex items-center justify-between px-3.5 py-3 rounded-xl border transition-all text-xs font-bold ${
                  orderType === "pickup"
                    ? "bg-[#eaf8ee] border-[#096633] text-[#096633]"
                    : "bg-white border-[#eaedf1] text-[#334155] hover:bg-slate-50"
                }`}
              >
                <Store className="w-4 h-4 text-[#096633]" />
                <span>استلام من الفرع</span>
              </button>

              <button
                type="button"
                onClick={() => setOrderType("delivery")}
                className={`flex items-center justify-between px-3.5 py-3 rounded-xl border transition-all text-xs font-bold ${
                  orderType === "delivery"
                    ? "bg-[#eaf8ee] border-[#096633] text-[#096633]"
                    : "bg-white border-[#eaedf1] text-[#334155] hover:bg-slate-50"
                }`}
              >
                <Bike className="w-4 h-4 text-[#096633]" />
                <span>توصيل لشبرا (+15)</span>
              </button>
            </div>
          </div>

          {/* Customer Name */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-[#111827] block">الاسم الكريم:</label>
            <input
              type="text"
              placeholder="مثال: أحمد علي"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              className="w-full h-11 px-3.5 bg-white border border-[#eaedf1] rounded-xl text-xs text-[#111827] placeholder:text-[#9ca3af] focus:outline-none focus:border-[#096633] focus:ring-1 focus:ring-[#096633]"
            />
            {errors.customerName && <p className="text-[11px] text-red-600 font-bold">{errors.customerName}</p>}
          </div>

          {/* Customer Phone */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-[#111827] block">رقم الموبايل (للتأكيد):</label>
            <input
              type="tel"
              dir="ltr"
              placeholder="010XXXXXXXX"
              value={customerPhone}
              onChange={(e) => setCustomerPhone(e.target.value)}
              className="w-full h-11 px-3.5 bg-white border border-[#eaedf1] rounded-xl text-xs text-[#111827] placeholder:text-[#9ca3af] focus:outline-none focus:border-[#096633] focus:ring-1 focus:ring-[#096633] text-right"
            />
            {errors.customerPhone && <p className="text-[11px] text-red-600 font-bold">{errors.customerPhone}</p>}
          </div>

          {/* Delivery Address */}
          {orderType === "delivery" && (
            <div className="space-y-1">
              <label className="text-xs font-bold text-[#111827] block">عنوان التوصيل في شبرا:</label>
              <input
                type="text"
                placeholder="الشارع، رقم العمارة، الدور، علامة مميزة"
                value={customerAddress}
                onChange={(e) => setCustomerAddress(e.target.value)}
                className="w-full h-11 px-3.5 bg-white border border-[#eaedf1] rounded-xl text-xs text-[#111827] placeholder:text-[#9ca3af] focus:outline-none focus:border-[#096633] focus:ring-1 focus:ring-[#096633]"
              />
              {errors.customerAddress && <p className="text-[11px] text-red-600 font-bold">{errors.customerAddress}</p>}
            </div>
          )}

          {/* Notes */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-[#111827] block">ملاحظات للكاشير (اختياري):</label>
            <textarea
              rows={2}
              placeholder="مثال: زيادة تومية ومخلل..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full p-3 bg-white border border-[#eaedf1] rounded-xl text-xs text-[#111827] placeholder:text-[#9ca3af] focus:outline-none focus:border-[#096633] focus:ring-1 focus:ring-[#096633]"
            />
          </div>

          {/* Breakdown Box (Matching Image 2 info card style) */}
          <div className="p-3 bg-white rounded-2xl border border-[#eaedf1] space-y-1.5 text-xs">
            <div className="flex justify-between text-[#64748b]">
              <span className="font-bold text-[#111827]">{formatCurrency(subtotal)}</span>
              <span>مجموع الطلبات:</span>
            </div>
            {orderType === "delivery" && (
              <div className="flex justify-between text-[#64748b]">
                <span className="font-bold text-[#111827]">{formatCurrency(deliveryFee)}</span>
                <span>خدمة التوصيل لشبرا:</span>
              </div>
            )}
          </div>
        </form>

        {/* Sticky Footer (Exact Image 2 Style) */}
        <div className="flex items-center justify-between px-5 py-3.5 border-t border-[#eaedf1] bg-white pb-safe">
          {/* Submit Button on Left */}
          <button
            type="submit"
            form="checkout-form"
            disabled={isSubmitting}
            className="flex items-center gap-2 bg-[#096633] text-white font-black text-xs px-5 py-3 rounded-xl hover:bg-[#075229] active:scale-95 disabled:opacity-50 transition-all shadow-sm cursor-pointer"
          >
            <span>{isSubmitting ? "جاري الإرسال..." : "تأكيد الطلب"}</span>
            <ArrowRight className="w-3.5 h-3.5 rotate-180" />
          </button>

          {/* Total Price on Right */}
          <div className="text-right">
            <span className="text-[10px] text-[#9ca3af] block font-medium">الإجمالي المطلوب</span>
            <span className="text-base font-black text-[#096633]">
              {formatCurrency(finalTotal)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
