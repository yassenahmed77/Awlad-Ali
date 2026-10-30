"use client";

import { useEffect } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

export function BottomSheet({
  isOpen,
  onClose,
  title,
  leftAction,
  children,
  footer,
  className,
}) {
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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      {/* Soft Blurred Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-[2px] transition-opacity animate-fade-in"
        onClick={onClose}
      />

      {/* Sheet Container (Exact Image 2 Style) */}
      <div
        className={cn(
          "relative z-10 w-full max-w-md bg-white rounded-t-[32px] sm:rounded-3xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden animate-slide-up",
          className
        )}
      >
        {/* Grab Handle */}
        <div className="w-full flex justify-center pt-2.5 pb-1">
          <div className="w-12 h-1 bg-slate-300 rounded-full" />
        </div>

        {/* Header Bar */}
        <div className="flex items-center justify-between px-5 py-2.5">
          {/* Close Button on Right (RTL) */}
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-[#f1f5f9] text-[#64748b] hover:text-[#0f172a] hover:bg-slate-200 active:scale-95 transition-all"
            aria-label="إغلاق"
          >
            <X className="w-4 h-4 stroke-[2.5]" />
          </button>

          {/* Centered Title */}
          {title && (
            <h3 className="text-sm font-bold text-[#1e293b] text-center">
              {title}
            </h3>
          )}

          {/* Left Action (e.g. Favorite Heart or empty spacer) */}
          {leftAction ? (
            leftAction
          ) : (
            <div className="w-8 h-8" />
          )}
        </div>

        {/* Scrollable Content Body */}
        <div className="flex-1 overflow-y-auto px-5 py-2 text-right">
          {children}
        </div>

        {/* Sticky Footer if provided */}
        {footer && (
          <div className="px-5 py-3.5 border-t border-[#eaedf1] bg-white pb-safe">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
