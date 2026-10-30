import { cn } from "@/lib/utils";

export function Badge({ children, variant = "default", className }) {
  const variants = {
    default: "bg-surface-muted text-text-secondary border-surface-border",
    brand: "bg-brand-100 text-brand-800 border-brand-200",
    topRated: "bg-amber-100 text-amber-900 border-amber-200",
    success: "bg-emerald-100 text-emerald-800 border-emerald-200",
    warning: "bg-amber-100 text-amber-800 border-amber-200",
    danger: "bg-red-100 text-red-800 border-red-200",
    info: "bg-sky-100 text-sky-800 border-sky-200",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium border transition-colors",
        variants[variant] || variants.default,
        className
      )}
    >
      {children}
    </span>
  );
}

export function OrderStatusBadge({ status }) {
  const configs = {
    pending: { label: "طلب جديد 🟡", variant: "warning" },
    preparing: { label: "جاري التجهيز ⏳", variant: "info" },
    ready: { label: "جاهز للاستلام 📦", variant: "success" },
    completed: { label: "تم التسليم ✅", variant: "default" },
    cancelled: { label: "ملغي ❌", variant: "danger" },
  };

  const config = configs[status] || { label: status, variant: "default" };

  return <Badge variant={config.variant}>{config.label}</Badge>;
}

