"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useSoundAlert } from "./useSoundAlert";

export function useOrders() {
  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedFilter, setSelectedFilter] = useState("all");
  const { playCashierChime } = useSoundAlert();
  const previousPendingCountRef = useRef(0);

  // Fetch orders from Next.js server API
  const fetchOrders = useCallback(async () => {
    try {
      const res = await fetch("/api/orders", { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.orders)) {
          setOrders(data.orders);

          const pendingOrders = data.orders.filter((o) => o.status === "pending");
          // If a new pending order arrived, trigger the cashier chime!
          if (
            pendingOrders.length > previousPendingCountRef.current &&
            previousPendingCountRef.current !== 0
          ) {
            playCashierChime();
          }
          previousPendingCountRef.current = pendingOrders.length;
        }
      }
    } catch (e) {
      console.error("Failed to fetch orders from server API:", e);
    } finally {
      setIsLoading(false);
    }
  }, [playCashierChime]);

  // Initial fetch and 5-second polling interval (real-time live cashier sync)
  useEffect(() => {
    fetchOrders();
    const interval = setInterval(fetchOrders, 5000);
    return () => clearInterval(interval);
  }, [fetchOrders]);

  // Update order status with instant optimistic UI update + server PATCH
  const updateStatus = useCallback(
    async (orderId, newStatus) => {
      // 1. Optimistic local update
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o))
      );

      // 2. Server PATCH request
      try {
        const res = await fetch("/api/orders", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ orderId, status: newStatus }),
        });

        if (!res.ok) {
          throw new Error("Server rejected status update");
        }
      } catch (e) {
        console.error("Failed to update status on server:", e);
        // Revert to server state on error
        fetchOrders();
      }
    },
    [fetchOrders]
  );

  // Filtered orders list
  const filteredOrders = orders.filter((o) => {
    if (selectedFilter === "all") return true;
    return o.status === selectedFilter;
  });

  return {
    orders: filteredOrders,
    rawOrders: orders,
    isLoading,
    selectedFilter,
    setSelectedFilter,
    updateStatus,
    refreshOrders: fetchOrders,
    playCashierChime,
  };
}

