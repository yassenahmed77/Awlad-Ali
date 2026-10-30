"use client";

import { Phone, MapPin, Printer, CheckCircle, Clock, XCircle, ArrowRight } from "lucide-react";
import { formatCurrency, formatOrderDate } from "@/lib/utils";
import { OrderStatusBadge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";

export function OrderCard({ order, onUpdateStatus }) {
  const isPending = order.status === "pending";
  const isPreparing = order.status === "preparing";
  const isReady = order.status === "ready";
  const isCompleted = order.status === "completed";
  const isCancelled = order.status === "cancelled";

  const handlePrint = () => {
    window.print();
  };

  return (
    <div
      className={`bg-white rounded-2xl border p-4 shadow-sm transition-all text-right space-y-3 ${
        isPending
          ? "border-amber-400 ring-2 ring-amber-400/20 shadow-md"
          : isPreparing
          ? "border-sky-300"
          : isReady
          ? "border-emerald-400"
          : "border-surface-border opacity-85"
      }`}
    >
      {/* Top Meta Bar */}
      <div className="flex items-center justify-between pb-2.5 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <OrderStatusBadge status={order.status} />
          <button
            onClick={handlePrint}
            className="text-xs text-text-muted hover:text-text-primary flex items-center gap-1 p-1 rounded-md hover:bg-slate-100 transition-colors"
            title="طباعة الفاتورة"
          >
            <Printer className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">طباعة</span>
          </button>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-text-muted">{formatOrderDate(order.createdAt)}</span>
          <span className="text-sm font-black text-brand-800 bg-brand-50 px-2 py-0.5 rounded-lg border border-brand-200">
            #{order.id}
          </span>
        </div>
      </div>

      {/* Customer Info */}
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
        <div className="space-y-0.5">
          <h4 className="font-bold text-sm text-text-primary">{order.customerName}</h4>
          {order.orderType === "delivery" ? (
            <p className="text-text-secondary flex items-center gap-1 text-[11px]">
              <MapPin className="w-3 h-3 text-brand-700" />
              <span>{order.customerAddress || "شبرا - توصيل"}</span>
            </p>
          ) : (
            <span className="inline-block text-[11px] font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md">
              🏬 استلام من الفرع
            </span>
          )}
        </div>

        <a
          href={`tel:${order.customerPhone}`}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-brand-50 hover:text-brand-700 text-text-primary font-bold text-xs transition-colors border border-slate-200"
        >
          <Phone className="w-3.5 h-3.5 text-brand-700" />
          <span dir="ltr">{order.customerPhone}</span>
        </a>
      </div>

      {/* Notes */}
      {order.notes && (
        <div className="bg-amber-50 border border-amber-200 p-2 rounded-xl text-xs text-amber-900">
          <span className="font-bold ml-1">ملاحظة العميل:</span>
          <span>{order.notes}</span>
        </div>
      )}

      {/* Items List */}
      <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100 space-y-1.5 text-xs divide-y divide-slate-100">
        {order.items.map((item, idx) => (
          <div key={idx} className="flex justify-between items-start pt-1 first:pt-0">
            <span className="font-bold text-brand-800">{formatCurrency(item.itemTotal)}</span>
            <div className="text-right">
              <span className="font-bold text-text-primary">
                {item.quantity}x {item.name}
              </span>
              {item.selectedSize && (
                <span className="text-[11px] text-text-muted mr-1">({item.selectedSize.name})</span>
              )}
              {item.selectedAddons && item.selectedAddons.length > 0 && (
                <p className="text-[10px] text-text-muted">
                  + {item.selectedAddons.map((a) => a.name).join("، ")}
                </p>
              )}
            </div>
          </div>
        ))}

        <div className="flex justify-between items-center pt-2 font-black text-sm text-text-primary">
          <span className="text-brand-700">{formatCurrency(order.totalAmount)}</span>
          <span>الإجمالي النهائي:</span>
        </div>
      </div>

      {/* Action Buttons for Cashier */}
      <div className="pt-1 flex items-center gap-2">
        {isPending && (
          <>
            <Button
              size="sm"
              onClick={() => onUpdateStatus(order.id, "preparing")}
              className="flex-1 font-bold bg-brand-700 hover:bg-brand-800 text-xs"
            >
              <Clock className="w-3.5 h-3.5 ml-1" />
              قبول وبدء التجهيز
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => onUpdateStatus(order.id, "cancelled")}
              className="text-xs text-red-600 border-red-200 hover:bg-red-50"
            >
              <XCircle className="w-3.5 h-3.5" />
            </Button>
          </>
        )}

        {isPreparing && (
          <Button
            size="sm"
            onClick={() => onUpdateStatus(order.id, "ready")}
            className="w-full font-bold bg-emerald-600 hover:bg-emerald-700 text-xs"
          >
            <CheckCircle className="w-3.5 h-3.5 ml-1" />
            جاهز للاستلام 📦
          </Button>
        )}

        {isReady && (
          <Button
            size="sm"
            onClick={() => onUpdateStatus(order.id, "completed")}
            className="w-full font-bold bg-slate-800 hover:bg-slate-900 text-xs"
          >
            <ArrowRight className="w-3.5 h-3.5 ml-1" />
            تم التسليم للعميل ✅
          </Button>
        )}

        {isCompleted && (
          <div className="w-full py-1 text-center text-xs font-bold text-text-muted bg-slate-50 rounded-xl">
            الطلب مكتمل وتم تسليمه
          </div>
        )}

        {isCancelled && (
          <div className="w-full py-1 text-center text-xs font-bold text-red-600 bg-red-50 rounded-xl">
            هذا الطلب تم إلغاؤه
          </div>
        )}
      </div>
    </div>
  );
}

