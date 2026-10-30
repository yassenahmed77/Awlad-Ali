"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from "react";
import { storeConfig } from "@/config/theme.config";

const CartContext = createContext(null);
const CART_STORAGE_KEY = "awlad_ali_cart_v1";

export function CartProvider({ children }) {
  const [items, setItems] = useState([]);
  const [isHydrated, setIsHydrated] = useState(false);
  const [isBouncing, setIsBouncing] = useState(false);

  // Load cart from localStorage safely on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(CART_STORAGE_KEY);
      if (stored) {
        setItems(JSON.parse(stored));
      }
    } catch (e) {
      console.error("Failed to load cart from storage:", e);
    } finally {
      setIsHydrated(true);
    }
  }, []);

  // Save cart to localStorage
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

  // Unique item key based on product id, size, and selected addons
  const getCartItemKey = useCallback((productId, selectedSize, selectedAddons = []) => {
    const sizePart = selectedSize?.id || "default";
    const addonsPart = selectedAddons
      .map((a) => a.id)
      .sort()
      .join("-");
    return `${productId}__${sizePart}__${addonsPart}`;
  }, []);

  // Add item to cart
  const addItem = useCallback(
    ({ product, selectedSize, selectedAddons = [], quantity = 1 }) => {
      triggerBounce();
      setItems((prev) => {
        const cartKey = getCartItemKey(product.id, selectedSize, selectedAddons);
        const existingIndex = prev.findIndex((item) => item.cartKey === cartKey);

        const basePrice = Number(selectedSize?.price || product.basePrice || 0);
        const addonsPrice = selectedAddons.reduce((sum, a) => sum + Number(a.price || 0), 0);
        const unitPrice = basePrice + addonsPrice;

        if (existingIndex >= 0) {
          const updated = [...prev];
          const newQty = updated[existingIndex].quantity + quantity;
          updated[existingIndex] = {
            ...updated[existingIndex],
            quantity: newQty,
            itemTotal: newQty * unitPrice,
          };
          return updated;
        }

        const newItem = {
          cartKey,
          productId: product.id,
          name: product.name,
          categoryName: product.categoryName,
          image: product.image,
          selectedSize: selectedSize || null,
          selectedAddons: selectedAddons || [],
          unitPrice,
          quantity,
          itemTotal: quantity * unitPrice,
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

  // Update item quantity
  const updateQuantity = useCallback((cartKey, newQuantity) => {
    setItems((prev) => {
      if (newQuantity <= 0) {
        return prev.filter((item) => item.cartKey !== cartKey);
      }
      return prev.map((item) => {
        if (item.cartKey === cartKey) {
          return {
            ...item,
            quantity: newQuantity,
            itemTotal: newQuantity * item.unitPrice,
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

  // Computed totals
  const { totalItemsCount, subtotal } = useMemo(() => {
    return items.reduce(
      (acc, item) => ({
        totalItemsCount: acc.totalItemsCount + item.quantity,
        subtotal: acc.subtotal + item.itemTotal,
      }),
      { totalItemsCount: 0, subtotal: 0 }
    );
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

