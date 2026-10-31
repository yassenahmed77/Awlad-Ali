"use client";

import { useState } from "react";
import { Store, Bike, ArrowRight, X, AlertCircle } from "lucide-react";
import { useCart } from "@/hooks/useCart";
import { storeConfig } from "@/config/theme.config";
import { formatCurrency, normalizeEgyptianPhone, saveCustomerOrderLocally } from "@/lib/utils";

export function CheckoutModal({ isOpen, onClose, onOrderPlaced }) {
  const { items, subtotal, clearCart } = useCart();
  const [orderType, setOrderType] = useState("pickup");
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerAddress, setCustomerAddress] = useState("");
  const [notes, setNotes] = useState("");
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const deliveryFee = orderType === "delivery" ? storeConfig.deliveryFee : 0;
  const finalTotal = Math.round((subtotal + deliveryFee) * 100) / 100;

  if (!isOpen) return null;

  const validate = () => {
    const newErrors = {};

    // 1. Name validation
    const cleanName = customerName.trim();
    if (!cleanName || cleanName.length < 2) {
      newErrors.customerName = "يرجى كتابة اسمك (حرفين على الأقل)";
    }

    // 2. Phone validation (robust normalization)
    const phoneResult = normalizeEgyptianPhone(customerPhone);
    if (!phoneResult.isValid) {
      newErrors.customerPhone = phoneResult.error;
    }

    // 3. Delivery address validation
    if (orderType === "delivery") {
      const cleanAddress = customerAddress.trim();
      if (!cleanAddress || cleanAddress.length < 5) {
        newErrors.customerAddress = "يرجى كتابة عنوان التوصيل بالتفصيل (الشارع والعمارة)";
      }
    }

    // 4. Cart empty check
    if (!items || items.length === 0) {
      newErrors.cart = "سلة الطلبات فارغة، يرجى اختيار وجبتك أولاً";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerError("");

    if (isSubmitting) return;
    if (!validate()) return;

    setIsSubmitting(true);
    const phoneResult = normalizeEgyptianPhone(customerPhone);

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 12000); // 12s timeout

      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify({
          customerName: customerName.trim(),
          customerPhone: phoneResult.normalized,
          orderType,
          customerAddress: orderType === "delivery" ? customerAddress.trim() : "",
          notes: notes.trim(),
          items,
        }),
      });

      clearTimeout(timeoutId);
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "حدث خطأ أثناء إرسال الطلب، يرجى المحاولة ثانية");
      }

      // Persist order in customer's local order history
      saveCustomerOrderLocally(data.order);

      // Clear the cart
      clearCart();

      // Close checkout and trigger success modal
      onClose();
      onOrderPlaced(data.order);
    } catch (err) {
      if (err.name === "AbortError") {
        setServerError("استغرق إرسال الطلب وقتاً أطول من المتوقع، يرجى التحقق من اتصال الإنترنت والمحاولة ثانية");
      } else {
        setServerError(err.message || "فشل إرسال الطلب، تأكد من اتصال الإنترنت وحاول مجدداً");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/55 backdrop-blur-[2px] transition-opacity animate-fade-in"
        onClick={onClose}
      />

      {/* Modal Container */}
      <div className="relative z-10 w-full max-w-md bg-white rounded-t-[32px] sm:rounded-3xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden animate-slide-up text-right">
        {/* Grab bar */}
        <div className="w-full flex justify-center pt-3 pb-1">
          <div className="w-12 h-1 bg-slate-300 rounded-full" />
        </div>

        {/* Top Header */}
        <div className="flex items-center justify-between px-5 py-2.5 border-b border-slate-100">
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-[#f1f5f9] text-[#64748b] hover:text-[#0f172a] hover:bg-slate-200 active:scale-95 transition-all cursor-pointer"
            aria-label="إغلاق"
          >
            <X className="w-4 h-4 stroke-[2.5]" />
          </button>

          <span className="text-sm font-bold text-[#1e293b]">
            تأكيد الطلب والتوصيل
          </span>

          <div className="w-8 h-8" />
        </div>

        {/* Server Error Alert Banner */}
        {serverError && (
          <div className="mx-5 mt-3 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2 animate-shake">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
            <p className="font-semibold leading-relaxed">{serverError}</p>
          </div>
        )}

        {/* Scrollable Form Body */}
        <form id="checkout-form" onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-5 py-3 space-y-4">
          {/* Order Type Selector */}
          <div className="space-y-1.5">
            <h4 className="text-xs font-black text-[#111827]">اختر طريقة الاستلام:</h4>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setOrderType("pickup")}
                className={`flex items-center justify-between px-3.5 py-3 rounded-xl border transition-all text-xs font-bold cursor-pointer ${
                  orderType === "pickup"
                    ? "bg-[#eaf8ee] border-[#0b6638] text-[#0b6638] shadow-sm"
                    : "bg-white border-[#eaedf1] text-[#334155] hover:bg-slate-50"
                }`}
              >
                <Store className="w-4 h-4 text-[#0b6638]" />
                <span>استلام من الفرع</span>
              </button>

              <button
                type="button"
                onClick={() => setOrderType("delivery")}
                className={`flex items-center justify-between px-3.5 py-3 rounded-xl border transition-all text-xs font-bold cursor-pointer ${
                  orderType === "delivery"
                    ? "bg-[#eaf8ee] border-[#0b6638] text-[#0b6638] shadow-sm"
                    : "bg-white border-[#eaedf1] text-[#334155] hover:bg-slate-50"
                }`}
              >
                <Bike className="w-4 h-4 text-[#0b6638]" />
                <span>توصيل لشبرا (+{storeConfig.deliveryFee} ج.م)</span>
              </button>
            </div>
          </div>

          {/* Customer Name */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-[#111827] block">الاسم:</label>
            <input
              type="text"
              placeholder="مثال: أحمد إبراهيم"
              value={customerName}
              onChange={(e) => {
                setCustomerName(e.target.value);
                if (errors.customerName) setErrors((prev) => ({ ...prev, customerName: "" }));
              }}
              className="w-full h-11 px-3.5 bg-white border border-[#eaedf1] rounded-xl text-xs text-[#111827] placeholder:text-[#9ca3af] focus:outline-none focus:border-[#0b6638] focus:ring-1 focus:ring-[#0b6638]"
            />
            {errors.customerName && <p className="text-[11px] text-red-600 font-bold">{errors.customerName}</p>}
          </div>

          {/* Customer Phone */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-[#111827] block">رقم الموبايل (للتأكيد والتوصيل):</label>
            <input
              type="tel"
              dir="ltr"
              placeholder="010XXXXXXXX"
              value={customerPhone}
              onChange={(e) => {
                setCustomerPhone(e.target.value);
                if (errors.customerPhone) setErrors((prev) => ({ ...prev, customerPhone: "" }));
              }}
              className="w-full h-11 px-3.5 bg-white border border-[#eaedf1] rounded-xl text-xs text-[#111827] placeholder:text-[#9ca3af] focus:outline-none focus:border-[#0b6638] focus:ring-1 focus:ring-[#0b6638] text-right font-sans"
            />
            {errors.customerPhone && <p className="text-[11px] text-red-600 font-bold">{errors.customerPhone}</p>}
          </div>

          {/* Delivery Address */}
          {orderType === "delivery" && (
            <div className="space-y-1 animate-fade-in">
              <label className="text-xs font-bold text-[#111827] block">عنوان التوصيل في شبرا بالتفصيل:</label>
              <input
                type="text"
                placeholder="اسم الشارع، رقم العمارة، الدور، الشقة، علامة مميزة"
                value={customerAddress}
                onChange={(e) => {
                  setCustomerAddress(e.target.value);
                  if (errors.customerAddress) setErrors((prev) => ({ ...prev, customerAddress: "" }));
                }}
                className="w-full h-11 px-3.5 bg-white border border-[#eaedf1] rounded-xl text-xs text-[#111827] placeholder:text-[#9ca3af] focus:outline-none focus:border-[#0b6638] focus:ring-1 focus:ring-[#0b6638]"
              />
              {errors.customerAddress && <p className="text-[11px] text-red-600 font-bold">{errors.customerAddress}</p>}
            </div>
          )}

          {/* Notes */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-[#111827] block">ملاحظات للكاشير والمطبخ (اختياري):</label>
            <textarea
              rows={2}
              placeholder="مثال: زيادة تومية ومخلل، رن الجرس..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full p-3 bg-white border border-[#eaedf1] rounded-xl text-xs text-[#111827] placeholder:text-[#9ca3af] focus:outline-none focus:border-[#0b6638] focus:ring-1 focus:ring-[#0b6638]"
            />
          </div>

          {/* Breakdown Box */}
          <div className="p-3 bg-[#f8fafc] rounded-2xl border border-[#eaedf1] space-y-1.5 text-xs">
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
            <div className="flex justify-between pt-1 border-t border-slate-200 font-black text-[#0b6638]">
              <span>{formatCurrency(finalTotal)}</span>
              <span>الإجمالي الكلي:</span>
            </div>
          </div>
        </form>

        {/* Sticky Footer */}
        <div className="flex items-center justify-between px-5 py-3.5 border-t border-[#eaedf1] bg-white pb-safe">
          {/* Submit Button on Left */}
          <button
            type="submit"
            form="checkout-form"
            disabled={isSubmitting}
            className="flex items-center gap-2 bg-[#0b6638] text-white font-black text-xs px-5 py-3 rounded-xl hover:bg-[#08502c] active:scale-95 disabled:opacity-50 transition-all shadow-sm cursor-pointer"
          >
            <span>{isSubmitting ? "جاري تسجيل الطلب..." : "تأكيد الطلب الآن"}</span>
            <ArrowRight className="w-3.5 h-3.5 rotate-180" />
          </button>

          {/* Total Price on Right */}
          <div className="text-right">
            <span className="text-[10px] text-[#9ca3af] block font-medium">المبلغ المطلوب</span>
            <span className="text-base font-black text-[#0b6638]">
              {formatCurrency(finalTotal)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
