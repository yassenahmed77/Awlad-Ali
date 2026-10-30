"use client";

import { Bell, Store, Clock, RefreshCw, Volume2 } from "lucide-react";
import { storeConfig } from "@/config/theme.config";
import { Button } from "@/components/ui/Button";

export function DashboardHeader({ onRefresh, onTestSound, isStoreOpen, onToggleStoreOpen }) {
  return (
    <header className="bg-white border-b border-surface-border px-4 py-3 sticky top-0 z-30 shadow-sm">
      <div className="max-w-6xl mx-auto flex flex-wrap items-center justify-between gap-3">
        {/* Brand & Branch */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-brand-700 text-white flex items-center justify-center font-black text-lg shadow-sm">
            علي
          </div>
          <div>
            <h1 className="text-base font-black text-text-primary flex items-center gap-2">
              <span>لوحة تحكم الكاشير - {storeConfig.name}</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-brand-50 text-brand-700 font-bold border border-brand-200">
                فرع روض الفرج
              </span>
            </h1>
            <p className="text-xs text-text-muted flex items-center gap-1.5 mt-0.5">
              <Clock className="w-3.5 h-3.5 text-brand-700" />
              <span>مواعيد العمل: {storeConfig.openingHours}</span>
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          {/* Sound Alert Test Button */}
          <Button
            size="sm"
            variant="outline"
            onClick={onTestSound}
            className="text-xs font-semibold gap-1.5 border-amber-300 bg-amber-50 text-amber-900 hover:bg-amber-100"
            title="تجربة رنة الكاشير للتأكد من الصوت"
          >
            <Volume2 className="w-3.5 h-3.5 text-amber-700" />
            <span>رنة الكاشير 🔔</span>
          </Button>

          {/* Store Open/Close Toggle */}
          <button
            onClick={onToggleStoreOpen}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border flex items-center gap-1.5 cursor-pointer ${
              isStoreOpen
                ? "bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100"
                : "bg-red-50 text-red-800 border-red-300 hover:bg-red-100"
            }`}
          >
            <span className={`w-2 h-2 rounded-full ${isStoreOpen ? "bg-emerald-600 animate-pulse" : "bg-red-600"}`} />
            <span>{isStoreOpen ? "المحل مفتوح للطلبات" : "المحل مغلق حالياً"}</span>
          </button>

          {/* Refresh Button */}
          <Button size="sm" variant="ghost" onClick={onRefresh} className="h-9 w-9 p-0" title="تحديث الطلبات">
            <RefreshCw className="w-4 h-4 text-text-muted" />
          </Button>
        </div>
      </div>
    </header>
  );
}

