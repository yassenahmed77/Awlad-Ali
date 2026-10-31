"use client";

import React, { useState, useMemo, useEffect, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { Search, User, ArrowLeft, ArrowRight, Bike, MapPin, Phone, Clock, CheckCircle2, RotateCcw, Utensils, MessageSquare } from "lucide-react";
import { storeConfig } from "@/config/theme.config";
import { MAIN_CATEGORIES, PRODUCTS } from "@/data/menu.data";
import { useCart } from "@/context/CartContext";
import {
  normalizeArabic,
  getCustomerOrdersLocally,
  updateCustomerOrderLocally,
  formatCurrency,
  formatOrderDate,
} from "@/lib/utils";

import { HeroBanner } from "@/components/features/menu/HeroBanner";
import { CategoryGrid } from "@/components/features/menu/CategoryGrid";
import { CategoryPills } from "@/components/features/menu/CategoryPills";
import { ProductCardHorizontal } from "@/components/features/menu/ProductCardHorizontal";
import { ProductCardVertical } from "@/components/features/menu/ProductCardVertical";
import { ProductDetailModal } from "@/components/features/menu/ProductDetailModal";
import { BottomNav } from "@/components/features/cart/BottomNav";
import { CartDrawer } from "@/components/features/cart/CartDrawer";
import { CheckoutModal } from "@/components/features/checkout/CheckoutModal";
import { OrderSuccessModal } from "@/components/features/checkout/OrderSuccessModal";
import { InstallAppModal } from "@/components/features/menu/InstallAppModal";
import { usePwaInstall } from "@/hooks/usePwaInstall";

export default function HomePage() {
  const [activeTab, setActiveTab] = useState("home");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedSubCategory, setSelectedSubCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedProduct, setSelectedProduct] = useState(null);

  // Modals & Customer Order State
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [confirmedOrder, setConfirmedOrder] = useState(null);
  const [isSuccessOpen, setIsSuccessOpen] = useState(false);
  const [customerOrders, setCustomerOrders] = useState([]);

  // Load customer orders from localStorage safely on mount
  useEffect(() => {
    const stored = getCustomerOrdersLocally();
    setCustomerOrders(stored);
    if (stored.length > 0 && !confirmedOrder) {
      setConfirmedOrder(stored[0]);
    }
  }, []);

  // Poll active order status from server in real-time
  useEffect(() => {
    const activeOrders = customerOrders.filter(
      (o) => o.status !== "completed" && o.status !== "cancelled"
    );
    if (activeOrders.length === 0) return;

    const interval = setInterval(async () => {
      try {
        const latestActive = activeOrders[0];
        const res = await fetch(`/api/orders?id=${latestActive.id}`);
        if (res.ok) {
          const data = await res.json();
          if (data.success && data.order && data.order.status !== latestActive.status) {
            updateCustomerOrderLocally(latestActive.id, { status: data.order.status });
            const refreshed = getCustomerOrdersLocally();
            setCustomerOrders(refreshed);
            if (confirmedOrder && confirmedOrder.id === latestActive.id) {
              setConfirmedOrder(data.order);
            }
          }
        }
      } catch (e) {
        // silent fail on network drop
      }
    }, 6000);

    return () => clearInterval(interval);
  }, [customerOrders, confirmedOrder]);

  // High-converting PWA Install state
  const {
    isInstalled: isAppInstalled,
    isModalOpen: isInstallOpen,
    isIOS,
    canPromptDirectly,
    triggerInstall,
    closeModal: closeInstallModal,
  } = usePwaInstall();

  const { addItem } = useCart();

  // Two-tier filtered products
  const filteredProducts = useMemo(() => {
    let list = [...PRODUCTS];

    // Tier 1: Main Category Filter
    if (selectedCategory && selectedCategory !== "all") {
      list = list.filter((p) => p.mainCategoryId === selectedCategory);
    }

    // Tier 2: Subcategory Filter
    if (selectedSubCategory && selectedSubCategory !== "all") {
      list = list.filter((p) => p.subCategoryId === selectedSubCategory);
    }

    // Search Query (Typo-Tolerant Arabic Normalization)
    if (searchQuery.trim()) {
      const q = normalizeArabic(searchQuery);
      list = list.filter(
        (p) =>
          normalizeArabic(p.name).includes(q) ||
          normalizeArabic(p.description || "").includes(q) ||
          normalizeArabic(p.categoryName || "").includes(q)
      );
    }

    return list;
  }, [selectedCategory, selectedSubCategory, searchQuery]);

  const topRatedProducts = useMemo(() => {
    return PRODUCTS.filter((p) => p.isTopRated || p.isFeatured);
  }, []);

  const handleProductSelect = (product) => {
    setSelectedProduct(product);
    setIsDetailOpen(true);
  };

  const handleAddToCart = (itemConfig) => {
    addItem(itemConfig);
  };

  const handleOrderPlaced = (newOrder) => {
    setConfirmedOrder(newOrder);
    setCustomerOrders(getCustomerOrdersLocally());
    setIsSuccessOpen(true);
  };

  const handleReorder = (order) => {
    if (!order || !order.items) return;
    order.items.forEach((item) => {
      const addonsSum = (item.selectedAddons || []).reduce((sum, a) => sum + (Number(a?.price) || 0), 0);
      const computedBasePrice = item.selectedSize?.price ?? Math.max(0, (Number(item.unitPrice) || 0) - addonsSum);

      addItem({
        product: {
          id: item.id || item.productId,
          name: item.name,
          categoryName: item.categoryName,
          basePrice: computedBasePrice,
        },
        selectedSize: item.selectedSize,
        selectedAddons: item.selectedAddons,
        quantity: item.quantity,
      });
    });
    setIsCartOpen(true);
  };

  return (
    <main className="min-h-screen pb-28 bg-[#fbfbfb]">
      {/* Mobile Shell Max-Width */}
      <div className="max-w-md mx-auto px-4 pt-safe">
        {/* Top Header: Logo Dead-Center in Screen, Small Sleek Animated Download Badge on Left, Avatar on Right */}
        <header className="relative flex items-center justify-between py-2 min-h-[52px]">
          {/* Left: Download App Button (Completely hidden if app is already installed) */}
          <div className="z-10 flex items-center min-w-[70px]">
            {!isAppInstalled && (
              <button
                onClick={triggerInstall}
                className="relative group inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-gradient-to-r from-[#0b6638] via-[#0f7d43] to-[#044c26] text-white text-[11px] font-black shadow-sm shadow-emerald-950/20 active:scale-95 transition-all duration-150 cursor-pointer overflow-hidden border border-emerald-400/25 select-none"
                aria-label="حمل التطبيق"
              >
                {/* Shimmer light sweep */}
                <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/25 to-transparent -translate-x-full animate-shimmer pointer-events-none" />

                {/* Text */}
                <span className="font-black text-[11px] text-white tracking-tight">حمل التطبيق</span>

                {/* Smartphone icon with subtle wiggle */}
                <span className="text-xs inline-block animate-wiggle select-none">📲</span>

                {/* Pulsing live beacon dot */}
                <span className="relative flex h-1.5 w-1.5 shrink-0 ml-0.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-300 opacity-80" />
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-400 shadow-[0_0_6px_#34d399]" />
                </span>
              </button>
            )}
          </div>

          {/* Center: Brand Logo - Mathematically centered in the screen */}
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center justify-center pointer-events-none">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/logo.svg"
              alt="أولاد علي - فطائر وبيتزا"
              className="h-8 sm:h-9 w-auto object-contain select-none pointer-events-auto"
            />
          </div>

          {/* Right: Avatar Profile Icon */}
          <div className="z-10 flex items-center">
            <Link
              href="/admin"
              className="w-9 h-9 rounded-full bg-[#ede9fe] text-[#4f46e5] flex items-center justify-center hover:bg-[#ddd6fe] transition-colors"
              title="لوحة الإدارة والكاشير"
            >
              <User className="w-4 h-4 fill-[#4f46e5]" />
            </Link>
          </div>
        </header>

        {/* Search Bar (Exact Carbon Copy Match with Reference: Left = بحث button, Center = Input, Right = Blue Search Icon) */}
        <div className="relative my-2.5">
          <div className="flex items-center bg-white border border-[#e2e8f0] rounded-2xl h-11 px-3 shadow-sm">
            <button
              onClick={() => {}}
              className="px-3.5 py-1.5 rounded-xl bg-[#eaf8ee] text-[#0b6638] text-xs font-bold hover:bg-[#d0f0db] transition-colors cursor-pointer shrink-0"
            >
              بحث
            </button>

            <input
              type="text"
              placeholder={activeTab === "menu" ? "ابحث فى أصناف أولاد علي..." : "...ابحث عن أكلتك المفضلة (بيتزا، كريب، شاورما)"}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 bg-transparent text-xs sm:text-sm text-[#111827] placeholder:text-[#9ca3af] focus:outline-none font-sans text-right px-2"
            />

            <Search className="w-4 h-4 text-[#0284c7] shrink-0 ml-1" />
          </div>
        </div>

        {/* TAB 1: HOME VIEW */}
        {activeTab === "home" && !searchQuery.trim() && (
          <div className="space-y-4 animate-fade-in">
            {/* Hero Promo Banner */}
            <HeroBanner onOrderNowClick={() => setActiveTab("menu")} />

            {/* Categories Grid (8 Cards) */}
            <CategoryGrid
              onSelectCategory={(mainId, subId) => {
                setSelectedCategory(mainId);
                setSelectedSubCategory(subId || "all");
                setActiveTab("menu");
              }}
              onViewAllClick={() => setActiveTab("menu")}
            />

            {/* Section: الأكثر طلباً (Top Rated ⭐) Swiper */}
            <div className="space-y-3 pt-1">
              <div className="flex items-center justify-between px-1">
                <span className="text-xs font-semibold text-[#94a3b8]">
                  مميز اليوم
                </span>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs text-[#94a3b8] font-semibold">( Top Rated ⭐ )</span>
                  <span className="text-base font-black text-[#111827]">الأكثر طلباً</span>
                </div>
              </div>

              {/* Horizontal Swiper Carousel (Vertical Cards - Exact Screenshot Match) */}
              <div
                className="flex gap-2.5 overflow-x-auto no-scrollbar scroll-smooth snap-x snap-mandatory pb-3 -mx-4 px-4"
                dir="rtl"
              >
                {topRatedProducts.map((product) => (
                  <ProductCardVertical
                    key={product.id}
                    product={product}
                    onSelect={handleProductSelect}
                  />
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: MENU VIEW (With Two-Tier Category & Subcategory Filter!) */}
        {(activeTab === "menu" || searchQuery.trim()) && (
          <div className="space-y-3 animate-fade-in pt-1">
            {/* Top Bar for Menu (Flipped per user request: Left = Item Count, Right = Back Button) */}
            <div className="flex items-center justify-between px-1">
              <span className="text-xs text-[#64748b] font-bold">
                {filteredProducts.length} صنف متاح
              </span>

              <button
                onClick={() => {
                  setSearchQuery("");
                  setActiveTab("home");
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white border border-[#e2e8f0] text-xs font-bold text-[#1e293b] hover:bg-slate-50 transition-colors shadow-sm cursor-pointer"
              >
                <span>الرئيسية</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Two-Tier Filter Pills (Main Category + Subcategory Row Matching Image) */}
            <CategoryPills
              categories={MAIN_CATEGORIES}
              selectedCategory={selectedCategory}
              onSelectCategory={(catId) => {
                setSelectedCategory(catId);
                setSelectedSubCategory("all");
              }}
              selectedSubCategory={selectedSubCategory}
              onSelectSubCategory={setSelectedSubCategory}
            />

            {/* Product Cards List */}
            <div className="space-y-3 pt-2">
              {filteredProducts.length === 0 ? (
                <div className="py-12 text-center text-[#64748b] space-y-2">
                  <p className="text-sm font-bold">لم نجد أصناف مطابقة لهذا القسم</p>
                  <button
                    onClick={() => {
                      setSearchQuery("");
                      setSelectedCategory("all");
                      setSelectedSubCategory("all");
                    }}
                    className="px-4 py-2 rounded-xl bg-[#0b6638] text-white text-xs font-bold cursor-pointer"
                  >
                    عرض كل الأصناف
                  </button>
                </div>
              ) : (
                filteredProducts.map((product) => (
                  <ProductCardHorizontal
                    key={product.id}
                    product={product}
                    onSelect={handleProductSelect}
                  />
                ))
              )}
            </div>
          </div>
        )}

        {/* TAB 3: MY ORDERS & LIVE TRACKING */}
        {activeTab === "orders" && (
          <div className="py-4 space-y-4 animate-fade-in text-right" dir="rtl">
            <div className="flex items-center justify-between px-1">
              <span className="text-xs font-bold text-[#64748b]">
                {customerOrders.length > 0 ? `${customerOrders.length} طلب سابق` : "سجل الطلبات"}
              </span>
              <h3 className="text-base font-black text-[#111827]">متابعة طلباتي</h3>
            </div>

            {customerOrders.length > 0 ? (
              <div className="space-y-3">
                {customerOrders.map((order) => {
                  const statusConfig = {
                    pending: { label: "تم استلام طلبك", step: 1, color: "bg-amber-100 text-amber-800 border-amber-200" },
                    preparing: { label: "في المطبخ والفرن", step: 2, color: "bg-blue-100 text-blue-800 border-blue-200" },
                    ready: { label: "جاهز للتسليم / مع الطيار", step: 3, color: "bg-purple-100 text-purple-800 border-purple-200" },
                    completed: { label: "تم التسليم بنجاح", step: 4, color: "bg-emerald-100 text-emerald-800 border-emerald-200" },
                    cancelled: { label: "ملغي", step: 0, color: "bg-red-100 text-red-800 border-red-200" },
                  }[order.status || "pending"];

                  return (
                    <div
                      key={order.id}
                      className="bg-white p-4 rounded-2xl border border-[#eaedf1] shadow-sm space-y-3"
                    >
                      {/* Order Header */}
                      <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-black text-[#0b6638]">#{order.id}</span>
                          <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${statusConfig.color}`}>
                            {statusConfig.label}
                          </span>
                        </div>
                        <span className="text-[11px] text-[#9ca3af] font-semibold" dir="ltr">
                          {formatOrderDate(order.createdAt)}
                        </span>
                      </div>

                      {/* Live Step Progress Indicator */}
                      {order.status !== "cancelled" && (
                        <div className="py-2">
                          <div className="grid grid-cols-4 gap-1 text-center text-[10px] font-bold mb-1.5">
                            <span className={statusConfig.step >= 1 ? "text-[#0b6638]" : "text-slate-400"}>استلام</span>
                            <span className={statusConfig.step >= 2 ? "text-[#0b6638]" : "text-slate-400"}>تحضير</span>
                            <span className={statusConfig.step >= 3 ? "text-[#0b6638]" : "text-slate-400"}>جاهز</span>
                            <span className={statusConfig.step >= 4 ? "text-[#0b6638]" : "text-slate-400"}>تم</span>
                          </div>
                          <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden flex">
                            <div
                              className="h-full bg-gradient-to-r from-[#0b6638] to-[#2ea863] transition-all duration-500 rounded-full"
                              style={{ width: `${(statusConfig.step / 4) * 100}%` }}
                            />
                          </div>
                        </div>
                      )}

                      {/* Items Preview */}
                      <div className="space-y-1 text-xs text-[#475569] bg-[#f8fafc] p-2.5 rounded-xl border border-slate-100">
                        {order.items?.map((item, idx) => (
                          <div key={idx} className="flex justify-between items-center text-[11px]">
                            <span>
                              {item.name} {item.selectedSize ? `(${item.selectedSize.name})` : ""} × {item.quantity}
                            </span>
                            <span className="font-bold text-[#111827]">{formatCurrency(item.itemTotal)}</span>
                          </div>
                        ))}
                        <div className="flex justify-between items-center pt-1 mt-1 border-t border-slate-200 text-xs font-black text-[#0b6638]">
                          <span>الإجمالي ({order.orderType === "delivery" ? "دليفري" : "استلام"}):</span>
                          <span>{formatCurrency(order.totalAmount)}</span>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex items-center gap-2 pt-1">
                        <button
                          onClick={() => {
                            setConfirmedOrder(order);
                            setIsSuccessOpen(true);
                          }}
                          className="flex-1 py-2 px-3 rounded-xl bg-slate-100 text-[#111827] text-xs font-bold hover:bg-slate-200 transition-colors cursor-pointer text-center"
                        >
                          تفاصيل الفاتورة
                        </button>
                        <button
                          onClick={() => handleReorder(order)}
                          className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-[#0b6638] text-white text-xs font-bold hover:bg-[#08502c] transition-colors cursor-pointer"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          <span>إعادة الطلب</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="bg-white p-8 rounded-2xl border border-[#eaedf1] text-center space-y-3">
                <div className="w-16 h-16 rounded-full bg-[#fdf2f8] text-[#db2777] mx-auto flex items-center justify-center">
                  <Bike className="w-8 h-8" />
                </div>
                <h4 className="text-base font-black text-[#111827]">لا توجد طلبات جارية حالياً</h4>
                <p className="text-xs text-[#94a3b8] max-w-xs mx-auto">
                  أي أوردر هتطلبه من المنيو هيظهرلك هنا لايف خطوة بخطوة لحد ما يوصلك!
                </p>
                <button
                  onClick={() => setActiveTab("menu")}
                  className="px-6 py-2.5 rounded-full bg-[#0b6638] text-white text-xs font-bold hover:bg-[#08502c] transition-all cursor-pointer shadow-sm"
                >
                  اطلب الآن من المنيو
                </button>
              </div>
            )}
          </div>
        )}

        {/* TAB 4: BRANCH INFO */}
        {activeTab === "branch" && (
          <div className="py-4 space-y-4 animate-fade-in">
            <div className="bg-white p-5 rounded-2xl border border-[#eaedf1] space-y-4 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-[#0b6638] text-white flex items-center justify-center font-black text-xl">
                  علي
                </div>
                <div>
                  <h3 className="text-base font-black text-[#111827]">{storeConfig.name}</h3>
                  <p className="text-xs text-[#d97706] font-bold">{storeConfig.tagline}</p>
                </div>
              </div>

              <div className="space-y-3 text-xs pt-2 border-t border-slate-100">
                <div className="flex items-start gap-2.5">
                  <MapPin className="w-4 h-4 text-[#db2777] shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-[#111827] block">العنوان:</span>
                    <span className="text-[#4b5563]">{storeConfig.address} - بجوار محطة مترو روض الفرج</span>
                    <span className="text-[11px] text-[#0b6638] font-bold block mt-0.5">يوجد صالة مكيفة للعائلات 👨‍👩‍👧‍👦</span>
                  </div>
                </div>

                <div className="flex items-start gap-2.5">
                  <Phone className="w-4 h-4 text-[#0b6638] shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-[#111827] block">أرقام التوصيل السريع (الدليفري):</span>
                    <div className="space-y-0.5 mt-1 font-bold">
                      <a href="tel:01094467175" className="text-[#0b6638] block" dir="ltr">010 94 46 71 75</a>
                      <a href="tel:01274536655" className="text-[#0b6638] block" dir="ltr">012 74 53 66 55</a>
                      <a href="tel:0224309130" className="text-[#0b6638] block" dir="ltr">022 430 91 30</a>
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-2.5">
                  <Clock className="w-4 h-4 text-[#d97706] shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-[#111827] block">مواعيد العمل:</span>
                    <span className="text-[#4b5563]">{storeConfig.openingHours} يومياً</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Navigation Bar (Elevated Active Tab with Curved Notch Cutout) */}
      <BottomNav
        activeTab={isCartOpen ? "cart" : activeTab}
        onTabChange={(tabId) => {
          if (tabId === "cart") {
            setIsCartOpen(true);
          } else {
            setActiveTab(tabId);
            window.scrollTo({ top: 0, behavior: "smooth" });
          }
        }}
        onCartClick={() => setIsCartOpen(true)}
      />

      {/* Product Detail Modal */}
      <ProductDetailModal
        product={selectedProduct}
        isOpen={isDetailOpen}
        onClose={() => {
          setIsDetailOpen(false);
          setSelectedProduct(null);
        }}
        onAddToCart={handleAddToCart}
      />

      {/* Cart Drawer */}
      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        onProceedToCheckout={() => setIsCheckoutOpen(true)}
      />

      {/* Checkout Modal */}
      <CheckoutModal
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
        onOrderPlaced={handleOrderPlaced}
      />

      {/* Order Success Modal */}
      <OrderSuccessModal
        order={confirmedOrder}
        isOpen={isSuccessOpen}
        onClose={() => setIsSuccessOpen(false)}
      />

      {/* Install App Modal (Shows on every visit if not installed, never if installed) */}
      <InstallAppModal
        isOpen={isInstallOpen && !isAppInstalled}
        onClose={closeInstallModal}
        onInstall={triggerInstall}
        isIOS={isIOS}
        canPromptDirectly={canPromptDirectly}
      />
    </main>
  );
}
