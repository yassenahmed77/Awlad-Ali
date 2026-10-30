"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { ordersService } from "@/services/orders.service";
import { useSoundAlert } from "./useSoundAlert";

export function useOrders() {
  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedFilter, setSelectedFilter] = useState("all");
  const { playCashierChime } = useSoundAlert();
  const previousPendingCountRef = useRef(0);

  // Fetch orders from service
  const fetchOrders = useCallback(async () => {
    try {
      const data = await ordersService.getOrders();
      setOrders(data);

      const pendingOrders = data.filter((o) => o.status === "pending");
      // If new pending order arrived, sound the chime!
      if (pendingOrders.length > previousPendingCountRef.current && previousPendingCountRef.current !== 0) {
        playCashierChime();
      }
      previousPendingCountRef.current = pendingOrders.length;
    } catch (e) {
      console.error("Failed to fetch orders:", e);
    } finally {
      setIsLoading(false);
    }
  }, [playCashierChime]);

  // Initial fetch and 5-second polling interval (instant without reloading)
  useEffect(() => {
    fetchOrders();
    const interval = setInterval(fetchOrders, 5000);
    return () => clearInterval(interval);
  }, [fetchOrders]);

  // Update order status with instant optimistic UI update
  const updateStatus = useCallback(async (orderId, newStatus) => {
    setOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o))
    );
    try {
      await ordersService.updateOrderStatus(orderId, newStatus);
    } catch (e) {
      console.error("Failed to update status on server:", e);
      // Revert if error
      fetchOrders();
    }
  }, [fetchOrders]);

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

