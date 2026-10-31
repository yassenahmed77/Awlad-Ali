import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { storeConfig } from "../config/theme.config.js";

/**
 * Merge Tailwind class names safely without style collisions
 */
export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

/**
 * Format currency with Egyptian Pound symbol (English digits: 145 ج.م)
 * Handles null, undefined, NaN, and string inputs gracefully
 */
export function formatCurrency(amount) {
  if (amount === undefined || amount === null || isNaN(amount)) {
    return `0 ${storeConfig.currency}`;
  }
  const cleanNumber = Math.max(0, Math.round(Number(amount) * 100) / 100);
  const formatted = cleanNumber.toLocaleString("en-US");
  return `${formatted} ${storeConfig.currency}`;
}

/**
 * Normalize Arabic text for robust, typo-tolerant search and comparison
 * Removes diacritics (tashkeel), unifies alef, taa marboota, and yaa
 */
export function normalizeArabic(text) {
  if (!text || typeof text !== "string") return "";

  return text
    // Remove Arabic diacritics (tashkeel / tatweel)
    .replace(/[\u064B-\u065F\u0640]/g, "")
    // Normalize alef variants [أ إ آ] -> ا
    .replace(/[أإآ]/g, "ا")
    // Normalize final taa marboota and haa at end of word to alef (e.g. شاورمة -> شاورما, جبنة -> جبنا)
    .replace(/[ةه](?=$|\s)/g, "ا")
    // Normalize any remaining taa marboota to haa
    .replace(/ة/g, "ه")
    // Normalize alif maqsoora / yaa [ى] -> ي
    .replace(/ى/g, "ي")
    // Normalize hamza variants [ؤ ئ] -> و / ي
    .replace(/ؤ/g, "و")
    .replace(/ئ/g, "ي")
    // Trim and lower case
    .trim()
    .toLowerCase();
}

/**
 * Convert Eastern Arabic numerals (٠١٢٣٤٥٦٧٨٩) to standard Western digits (0123456789)
 */
export function convertArabicDigits(input) {
  if (!input || typeof input !== "string") return "";
  const arabicDigits = "٠١٢٣٤٥٦٧٨٩";
  return input.replace(/[٠-٩]/g, (char) => arabicDigits.indexOf(char).toString());
}

/**
 * Normalize and validate an Egyptian phone number
 * Handles:
 * - Eastern Arabic numerals (٠١٠١٢٣٤٥٦٧٨)
 * - Country code prefixes (+20, 0020, 20)
 * - Hyphens, spaces, parentheses
 * Returns { isValid, normalized, error }
 */
export function normalizeEgyptianPhone(rawPhone) {
  if (!rawPhone || typeof rawPhone !== "string") {
    return { isValid: false, normalized: "", error: "يرجى إدخال رقم الهاتف" };
  }

  // 1. Convert Arabic numerals
  let phone = convertArabicDigits(rawPhone);

  // 2. Strip non-digits
  phone = phone.replace(/\D/g, "");

  // 3. Handle country code prefixes
  if (phone.startsWith("0020")) {
    phone = phone.substring(4); // Remove 0020
  } else if (phone.startsWith("20") && phone.length === 12) {
    phone = phone.substring(2); // Remove 20
  }

  // 4. If user omitted leading 0 (e.g. 1012345678)
  if (phone.length === 10 && (phone.startsWith("10") || phone.startsWith("11") || phone.startsWith("12") || phone.startsWith("15"))) {
    phone = "0" + phone;
  }

  // 5. Strict Egyptian mobile regex (010, 011, 012, 015 followed by 8 digits = 11 digits total)
  const egyptRegex = /^01[0125]\d{8}$/;
  const isValid = egyptRegex.test(phone);

  return {
    isValid,
    normalized: isValid ? phone : rawPhone.trim(),
    error: isValid ? "" : "رقم هاتف مصري غير صحيح (مثال: 01012345678 أو 012...)",
  };
}

/**
 * Generate a clean short order reference code
 */
export function generateOrderId() {
  return Math.floor(1000 + Math.random() * 9000).toString();
}

/**
 * Format order timestamp with Arabic locale
 */
export function formatOrderDate(dateString) {
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "";
    return new Intl.DateTimeFormat("ar-EG", {
      hour: "numeric",
      minute: "numeric",
      hour12: true,
    }).format(date);
  } catch (e) {
    return "";
  }
}

/**
 * Customer Orders Storage Key
 */
export const CUSTOMER_ORDERS_STORAGE_KEY = "awlad_ali_customer_orders_v1";

/**
 * Save a newly placed order to the customer's localStorage history
 * Keeps the most recent 10 orders
 */
export function saveCustomerOrderLocally(order) {
  if (typeof window === "undefined" || !order) return;
  try {
    const existing = getCustomerOrdersLocally();
    const filtered = existing.filter((o) => o.id !== order.id);
    const updated = [order, ...filtered].slice(0, 10);
    localStorage.setItem(CUSTOMER_ORDERS_STORAGE_KEY, JSON.stringify(updated));
  } catch (e) {
    console.error("Failed to save order to customer storage:", e);
  }
}

/**
 * Retrieve customer's order history from localStorage
 */
export function getCustomerOrdersLocally() {
  if (typeof window === "undefined") return [];
  try {
    const stored = localStorage.getItem(CUSTOMER_ORDERS_STORAGE_KEY);
    if (!stored) return [];
    const parsed = JSON.parse(stored);
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    return [];
  }
}

/**
 * Update a specific customer order status in local storage
 */
export function updateCustomerOrderLocally(orderId, updatedFields) {
  if (typeof window === "undefined" || !orderId) return;
  try {
    const orders = getCustomerOrdersLocally();
    const updated = orders.map((o) => (o.id === orderId ? { ...o, ...updatedFields } : o));
    localStorage.setItem(CUSTOMER_ORDERS_STORAGE_KEY, JSON.stringify(updated));
  } catch (e) {
    console.error("Failed to update order locally:", e);
  }
}
