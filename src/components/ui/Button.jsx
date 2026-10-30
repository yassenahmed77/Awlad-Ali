"use client";

import { forwardRef } from "react";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

export const Button = forwardRef(
  (
    {
      children,
      className,
      variant = "primary",
      size = "md",
      isLoading = false,
      disabled = false,
      type = "button",
      icon: Icon,
      ...props
    },
    ref
  ) => {
    const variants = {
      primary: "bg-brand-700 text-white hover:bg-brand-800 active:bg-brand-900 shadow-sm shadow-brand-700/20",
      secondary: "bg-accent-500 text-white hover:bg-accent-600 active:bg-accent-700 shadow-sm shadow-accent-500/20",
      accent: "bg-amber-500 text-amber-950 font-bold hover:bg-amber-400 active:bg-amber-600",
      outline: "border border-surface-border text-text-primary hover:bg-surface-muted active:bg-slate-100",
      ghost: "text-text-secondary hover:bg-surface-muted active:bg-slate-100",
      danger: "bg-red-600 text-white hover:bg-red-700 active:bg-red-800",
      subtle: "bg-brand-100 text-brand-800 hover:bg-brand-200 active:bg-brand-300",
    };

    const sizes = {
      sm: "h-9 px-3 text-xs rounded-xl gap-1.5",
      md: "h-11 px-4 text-sm font-medium rounded-2xl gap-2",
      lg: "h-13 px-6 text-base font-semibold rounded-2xl gap-2.5",
      icon: "h-10 w-10 p-0 rounded-xl justify-center",
    };

    return (
      <button
        ref={ref}
        type={type}
        disabled={disabled || isLoading}
        className={cn(
          "inline-flex items-center justify-center transition-all duration-150 select-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none active:scale-[0.98]",
          variants[variant] || variants.primary,
          sizes[size] || sizes.md,
          className
        )}
        {...props}
      >
        {isLoading ? (
          <Loader2 className="w-4 h-4 animate-spin text-current" />
        ) : Icon ? (
          <Icon className="w-4 h-4 shrink-0" />
        ) : null}
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";

