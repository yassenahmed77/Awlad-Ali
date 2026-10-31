"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from "react";

const CartContext = createContext(null);
const CART_STORAGE_KEY = "awlad_ali_cart_v1";

export function CartProvider({ children }) {
  const [items, setItems] = useState([]);
  const [isHydrated, setIsHydrated] = useState(false);
  const [isBouncing, setIsBouncing] = useState(false);

  // 1. Load cart safely from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(CART_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          // Validate and sanitize each loaded item
          const sanitized = parsed.filter(
            (item) => item && typeof item === "object" && item.cartKey && Number(item.quantity) > 0
          );
          setItems(sanitized);
        } else {
          setItems([]);
        }
      }
    } catch (e) {
      console.error("Failed to load cart from storage:", e);
      setItems([]);
    } finally {
      setIsHydrated(true);
    }
  }, []);

  // 2. Multi-tab synchronization: keep cart in sync if updated in another tab
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === CART_STORAGE_KEY) {
        try {
          if (e.newValue) {
            const parsed = JSON.parse(e.newValue);
            if (Array.isArray(parsed)) setItems(parsed);
          } else {
            setItems([]);
          }
        } catch (err) {
          console.error("Failed to sync storage event:", err);
        }
      }
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  // 3. Save cart to localStorage whenever items change
  useEffect(() => {
    if (!isHydrated) return;
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
    } catch (e) {
      console.error("Failed to save cart to storage:", e);
    }
  }, [items, isHydrated]);

  // Micro-interaction bounce on bottom cart icon
  const triggerBounce = useCallback(() => {
    setIsBouncing(true);
    setTimeout(() => setIsBouncing(false), 450);
  }, []);

  // Unique item key based on product id, size, and sorted selected addons
  const getCartItemKey = useCallback((productId, selectedSize, selectedAddons = []) => {
    const safeProductId = String(productId || "item");
    const sizePart = selectedSize?.id ? String(selectedSize.id) : "default";
    const addonsPart = (selectedAddons || [])
      .filter((a) => a && a.id)
      .map((a) => String(a.id))
      .sort()
      .join("-");
    return `${safeProductId}__${sizePart}__${addonsPart}`;
  }, []);

  // Add item to cart with defensive price and quantity bounds
  const addItem = useCallback(
    ({ product, selectedSize, selectedAddons = [], quantity = 1 }) => {
      if (!product || typeof product !== "object") return;

      // Prevent adding unavailable products
      if (product.isAvailable === false) {
        alert("عذراً، هذا الصنف غير متوفر حالياً في المطبخ");
        return;
      }

      const safeQuantity = Math.min(99, Math.max(1, Math.floor(Number(quantity) || 1)));
      const basePrice = Math.max(0, Number(selectedSize?.price ?? product.basePrice ?? 0));
      const addonsPrice = (selectedAddons || []).reduce(
        (sum, a) => sum + Math.max(0, Number(a?.price || 0)),
        0
      );
      const unitPrice = Math.round((basePrice + addonsPrice) * 100) / 100;

      triggerBounce();

      setItems((prev) => {
        const cartKey = getCartItemKey(product.id, selectedSize, selectedAddons);
        const existingIndex = prev.findIndex((item) => item.cartKey === cartKey);

        if (existingIndex >= 0) {
          const updated = [...prev];
          const newQty = Math.min(99, updated[existingIndex].quantity + safeQuantity);
          updated[existingIndex] = {
            ...updated[existingIndex],
            quantity: newQty,
            unitPrice,
            itemTotal: Math.round(newQty * unitPrice * 100) / 100,
          };
          return updated;
        }

        const newItem = {
          cartKey,
          productId: product.id,
          name: product.name,
          categoryName: product.categoryName || "",
          image: product.image || "/logo.svg",
          selectedSize: selectedSize || null,
          selectedAddons: selectedAddons || [],
          unitPrice,
          quantity: safeQuantity,
          itemTotal: Math.round(safeQuantity * unitPrice * 100) / 100,
        };

        return [...prev, newItem];
      });
    },
    [getCartItemKey, triggerBounce]
  );

  // Remove single item
  const removeItem = useCallback((cartKey) => {
    setItems((prev) => prev.filter((item) => item.cartKey !== cartKey));
  }, []);

  // Update item quantity safely
  const updateQuantity = useCallback((cartKey, newQuantity) => {
    const safeQty = Math.floor(Number(newQuantity) || 0);

    setItems((prev) => {
      if (safeQty <= 0) {
        return prev.filter((item) => item.cartKey !== cartKey);
      }
      const cappedQty = Math.min(99, safeQty);
      return prev.map((item) => {
        if (item.cartKey === cartKey) {
          return {
            ...item,
            quantity: cappedQty,
            itemTotal: Math.round(cappedQty * item.unitPrice * 100) / 100,
          };
        }
        return item;
      });
    });
  }, []);

  // Clear entire cart
  const clearCart = useCallback(() => {
    setItems([]);
    try {
      localStorage.removeItem(CART_STORAGE_KEY);
    } catch (e) {}
  }, []);

  // Computed totals with floating point rounding safety
  const { totalItemsCount, subtotal } = useMemo(() => {
    const result = items.reduce(
      (acc, item) => ({
        totalItemsCount: acc.totalItemsCount + (Number(item.quantity) || 0),
        subtotal: acc.subtotal + (Number(item.itemTotal) || 0),
      }),
      { totalItemsCount: 0, subtotal: 0 }
    );

    return {
      totalItemsCount: result.totalItemsCount,
      subtotal: Math.round(result.subtotal * 100) / 100,
    };
  }, [items]);

  const value = {
    items,
    totalItemsCount,
    subtotal,
    isHydrated,
    isBouncing,
    addItem,
    removeItem,
    updateQuantity,
    clearCart,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}
