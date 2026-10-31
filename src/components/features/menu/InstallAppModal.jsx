"use client";

import React from "react";
import { X, Download, Flame, CheckCircle2, Share, PlusSquare } from "lucide-react";

export function InstallAppModal({
  isOpen,
  onClose,
  onInstall,
  isIOS = false,
  canPromptDirectly = false,
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center animate-fade-in">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/65 backdrop-blur-[3px] transition-opacity"
        onClick={onClose}
      />

      {/* Sheet Modal */}
      <div className="relative z-10 w-full max-w-md bg-white rounded-t-[32px] sm:rounded-3xl p-5 shadow-2xl overflow-hidden animate-slide-up text-right">
        {/* Grab bar */}
        <div className="w-full flex justify-center pb-2">
          <div className="w-12 h-1 bg-slate-300 rounded-full" />
        </div>

        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 left-4 w-8 h-8 rounded-full bg-slate-100 text-slate-500 hover:text-slate-800 flex items-center justify-center cursor-pointer transition-colors"
          aria-label="إغلاق"
        >
          <X className="w-4 h-4" />
        </button>

        {/* App Profile Header */}
        <div className="flex items-center gap-3.5 pt-1 pb-3 border-b border-slate-100" dir="rtl">
          <div className="relative w-16 h-16 rounded-2xl overflow-hidden bg-[#eaf8ee] border-2 border-emerald-100 shadow-md shrink-0 flex items-center justify-center p-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo.svg" alt="أولاد علي" className="w-full h-full object-contain" />
          </div>

          <div>
            <div className="flex items-center gap-1.5">
              <h3 className="text-base font-black text-[#111827]">تطبيق أولاد علي الرسمي</h3>
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            </div>
            <p className="text-xs text-[#0b6638] font-bold">فطائر وبيتزا وشاورما شبرا</p>
            <div className="flex items-center gap-1 mt-0.5 text-[11px] text-[#64748b]">
              <span className="text-amber-500 font-black">⭐ 4.9</span>
              <span>• مجاني بالكامل • تثبيت فوري بدون متجر</span>
            </div>
          </div>
        </div>

        {/* Direct Action or iOS Step-by-Step Guide */}
        {isIOS && !canPromptDirectly ? (
          <div className="py-4 space-y-3" dir="rtl">
            <p className="text-xs font-black text-[#111827]">
              لتثبيت التطبيق على جهاز الـ iPhone في ثانيتين:
            </p>

            <div className="space-y-2">
              <div className="flex items-center gap-3 p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
                  <Share className="w-4 h-4" />
                </div>
                <div className="text-xs">
                  <span className="font-bold text-[#111827]">1. اضغط على زر المشاركة</span>
                  <span className="text-[#64748b] mr-1">(Share بالأسفل في Safari)</span>
                </div>
              </div>

              <div className="flex items-center gap-3 p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                <div className="w-8 h-8 rounded-lg bg-emerald-100 text-[#0b6638] flex items-center justify-center shrink-0">
                  <PlusSquare className="w-4 h-4" />
                </div>
                <div className="text-xs">
                  <span className="font-bold text-[#111827]">2. اختر &quot;إضافة إلى الشاشة الرئيسية&quot;</span>
                  <span className="text-[#64748b] mr-1">(Add to Home Screen)</span>
                </div>
              </div>

              <div className="flex items-center gap-3 p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
                <div className="text-xs">
                  <span className="font-bold text-[#111827]">3. اضغط &quot;إضافة (Add)&quot;</span>
                  <span className="text-[#64748b] mr-1">وسيظهر بأيقونة المطعم الرسمية</span>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="py-4 space-y-3.5" dir="rtl">
            {/* Perks */}
            <div className="space-y-2.5">
              <div className="flex items-center gap-3 p-2.5 rounded-2xl bg-[#fff7ed] border border-orange-100">
                <div className="w-9 h-9 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center shrink-0">
                  <Flame className="w-5 h-5 fill-orange-500 text-orange-600 animate-pulse" />
                </div>
                <div className="text-xs">
                  <p className="font-black text-[#111827]">سرعة فائقة ويفتح بضغطة واحدة</p>
                  <p className="text-[#64748b] text-[11px]">بدون الحاجة لفتح المتصفح أو كتابة روابط كل مرة</p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-2.5 rounded-2xl bg-[#f8fafc] border border-slate-100">
                <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
                <div className="text-xs">
                  <p className="font-black text-[#111827]">تتبع حالة طلبك لحظة بلحظة</p>
                  <p className="text-[#64748b] text-[11px]">إشعارات فورية من بداية تجهيز الطلب حتى التوصيل</p>
                </div>
              </div>
            </div>

            {/* Direct 1-Click Install Button */}
            <button
              onClick={onInstall}
              className="w-full h-12 rounded-2xl bg-gradient-to-r from-[#0b6638] via-[#0f7d43] to-[#044c26] text-white font-black text-sm flex items-center justify-center gap-2 shadow-lg shadow-[#0b6638]/30 hover:shadow-[#0b6638]/45 active:scale-95 transition-all cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>تثبيت التطبيق الآن بضغطة واحدة</span>
            </button>
          </div>
        )}

        <p className="text-[10px] text-center text-[#94a3b8] mt-1" dir="rtl">
          يعمل على جميع أجهزة Android و iPhone بدون الحاجة لـ Google Play أو App Store 🚀
        </p>
      </div>
    </div>
  );
}
