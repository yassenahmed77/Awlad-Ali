"use client";

import Link from "next/link";
import { CheckCircle2, MessageSquare, ExternalLink, ArrowRight, X } from "lucide-react";
import { storeConfig } from "@/config/theme.config";
import { formatCurrency } from "@/lib/utils";

export function OrderSuccessModal({ order, isOpen, onClose }) {
  if (!isOpen || !order) return null;

  const whatsappText = encodeURIComponent(
    `مرحباً أولاد علي، أنا العميل ${order.customerName} بخصوص الطلب رقم #${order.id} بإجمالي ${order.totalAmount} ج.م`
  );

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
            تم تأكيد الطلب بنجاح!
          </span>

          <div className="w-8 h-8" />
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4 text-center">
          {/* Animated Success Circle */}
          <div className="w-16 h-16 rounded-full bg-[#eaf8ee] text-[#096633] mx-auto flex items-center justify-center animate-bounce">
            <CheckCircle2 className="w-10 h-10" />
          </div>

          <div className="space-y-1">
            <span className="text-xs font-bold text-[#9ca3af]">رقم الطلب الخاص بك:</span>
            <h3 className="text-2xl font-black text-[#096633] tracking-widest">
              #{order.id}
            </h3>
            <p className="text-xs text-[#64748b]">
              تم إشعار الكاشير عبر تيليجرام فوراً وسيتم تجهيز طلبك طازة!
            </p>
          </div>

          {/* 3 Info Columns (Matching Image 2) */}
          <div className="grid grid-cols-3 gap-2 p-3 bg-white rounded-2xl border border-[#eaedf1] text-center text-xs">
            <div className="space-y-0.5 border-l border-[#eaedf1]">
              <span className="text-[11px] text-[#9ca3af] block">النوع</span>
              <p className="font-black text-[#096633]">
                {order.orderType === "delivery" ? "دليفري" : "استلام"}
              </p>
            </div>
            <div className="space-y-0.5 border-l border-[#eaedf1]">
              <span className="text-[11px] text-[#9ca3af] block">الفرع</span>
              <p className="font-black text-[#111827]">روض الفرج</p>
            </div>
            <div className="space-y-0.5">
              <span className="text-[11px] text-[#9ca3af] block">الحالة</span>
              <p className="font-black text-amber-600">جاري التجهيز</p>
            </div>
          </div>

          {/* Action Links */}
          <div className="space-y-2 pt-2">
            <a
              href={`https://wa.me/${storeConfig.whatsapp}?text=${whatsappText}`}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full inline-flex items-center justify-center gap-2 h-11 px-4 rounded-xl bg-[#25d366] text-white font-bold text-xs hover:bg-[#20ba59] transition-all shadow-sm"
            >
              <MessageSquare className="w-4 h-4" />
              <span>متابعة الطلب على واتساب المحل</span>
            </a>

            <Link
              href="/admin"
              className="w-full inline-flex items-center justify-center gap-2 h-11 px-4 rounded-xl bg-slate-900 text-white font-bold text-xs hover:bg-slate-800 transition-all shadow-sm"
            >
              <ExternalLink className="w-4 h-4" />
              <span>شاهد وصول الطلب على شاشة الكاشير الآن</span>
            </Link>
          </div>
        </div>

        {/* Sticky Footer (Exact Image 2 Style) */}
        <div className="flex items-center justify-between px-5 py-3.5 border-t border-[#eaedf1] bg-white pb-safe">
          <button
            onClick={onClose}
            className="flex items-center gap-2 bg-[#096633] text-white font-black text-xs px-5 py-3 rounded-xl hover:bg-[#075229] active:scale-95 transition-all shadow-sm"
          >
            <span>العودة للمنيو</span>
            <ArrowRight className="w-3.5 h-3.5 rotate-180" />
          </button>

          <div className="text-right">
            <span className="text-[10px] text-[#9ca3af] block font-medium">المبلغ المطلوب</span>
            <span className="text-base font-black text-[#096633]">
              {formatCurrency(order.totalAmount)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
