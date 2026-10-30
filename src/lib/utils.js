import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { storeConfig } from "@/config/theme.config";

/**
 * Merge Tailwind class names safely without style collisions
 */
export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

/**
 * Format currency with Egyptian Pound symbol
 */
export function formatCurrency(amount) {
  if (amount === undefined || amount === null || isNaN(amount)) return `0 ${storeConfig.currency}`;
  return `${Number(amount).toLocaleString("ar-EG")} ${storeConfig.currency}`;
}

/**
 * Generate a clean short order reference code
 */
export function generateOrderId() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let result = "";
  for (let i = 0; i < 4; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `#${result}`;
}

/**
 * Format order timestamp
 */
export function formatOrderDate(dateString) {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat("ar-EG", {
    hour: "numeric",
    minute: "numeric",
    hour12: true,
  }).format(date);
}

