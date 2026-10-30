"use client";

import React, { useState, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { Search, User, ArrowLeft, Bike, MapPin, Phone, Clock } from "lucide-react";
import { storeConfig } from "@/config/theme.config";
import { MAIN_CATEGORIES, PRODUCTS } from "@/data/menu.data";
import { useCart } from "@/context/CartContext";

import { HeroBanner } from "@/components/features/menu/HeroBanner";
import { CategoryGrid } from "@/components/features/menu/CategoryGrid";
import { CategoryPills } from "@/components/features/menu/CategoryPills";
import { ProductCardHorizontal } from "@/components/features/menu/ProductCardHorizontal";
import { ProductDetailModal } from "@/components/features/menu/ProductDetailModal";
import { BottomNav } from "@/components/features/cart/BottomNav";
import { CartDrawer } from "@/components/features/cart/CartDrawer";
import { CheckoutModal } from "@/components/features/checkout/CheckoutModal";
import { OrderSuccessModal } from "@/components/features/checkout/OrderSuccessModal";

export default function HomePage() {
  const [activeTab, setActiveTab] = useState("home");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedSubCategory, setSelectedSubCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedProduct, setSelectedProduct] = useState(null);

  // Modals
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [confirmedOrder, setConfirmedOrder] = useState(null);
  const [isSuccessOpen, setIsSuccessOpen] = useState(false);

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

    // Search Query
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q) ||
          p.categoryName.toLowerCase().includes(q)
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
    setIsSuccessOpen(true);
  };

  const handleInstallApp = () => {
    alert("لتثبيت التطبيق على هاتفك:\n1. اضغط على خيارات المتصفح (⋮ أو زر المشاركة)\n2. اختر 'إضافة إلى الشاشة الرئيسية (Add to Home screen)'\nوسيعمل معك كتطبيق أصلي سريع دائماً!");
  };

  return (
    <main className="min-h-screen pb-28 bg-[#fbfbfb]">
      {/* Mobile Shell Max-Width */}
      <div className="max-w-md mx-auto px-4 pt-safe">
        {/* Top Header (English LTR: Download App on Left, Brand Center, Avatar on Right) */}
        <header className="flex items-center justify-between py-2.5">
          {/* Download App Button */}
          <button
            onClick={handleInstallApp}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#096633] text-white text-xs font-bold hover:bg-[#075229] active:scale-95 transition-all shadow-sm cursor-pointer"
          >
            <span className="text-sm">📲</span>
            <span>حمل التطبيق</span>
          </button>

          {/* Center: Brand Identity */}
          <div className="text-center">
            <h1 className="text-2xl font-black text-[#096633] tracking-tight leading-tight">
              أولاد علي
            </h1>
            <span className="text-xs font-bold text-[#b45309] block -mt-0.5">
              فطائر وبيتزا أولاد علي
            </span>
          </div>

          {/* Right: Avatar Profile Icon */}
          <Link
            href="/admin"
            className="w-10 h-10 rounded-full bg-[#ede9fe] text-[#4f46e5] flex items-center justify-center hover:bg-[#ddd6fe] transition-colors"
            title="لوحة الإدارة والكاشير"
          >
            <User className="w-5 h-5 fill-[#4f46e5]" />
          </Link>
        </header>

        {/* Search Bar (English LTR: Search Icon on Left, Input in Center, Search Button on Right) */}
        <div className="relative my-2.5">
          <div className="flex items-center bg-white border border-[#e2e8f0] rounded-2xl h-12 px-3 shadow-sm">
            <Search className="w-4 h-4 text-[#0284c7] shrink-0 mr-2" />

            <input
              type="text"
              placeholder={activeTab === "menu" ? "ابحث فى أصناف أولاد علي..." : "ابحث عن أكلتك المفضلة (بيتزا، كريب، شاورما...)"}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 bg-transparent text-xs sm:text-sm text-[#111827] placeholder:text-[#9ca3af] focus:outline-none font-sans"
            />

            <button
              onClick={() => {}}
              className="ml-2 px-3.5 py-1 rounded-xl bg-[#eaf8ee] text-[#096633] text-xs font-bold hover:bg-[#d0f0db] transition-colors cursor-pointer"
            >
              بحث
            </button>
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

            {/* Section: الأكثر طلباً (Top Rated ⭐) */}
            <div className="space-y-3 pt-1">
              <div className="flex items-center justify-between px-1">
                <h3 className="text-base font-black text-[#111827] flex items-center gap-1.5">
                  <span>الأكثر طلباً</span>
                  <span className="text-xs font-bold text-[#111827]">( Top Rated ⭐ )</span>
                </h3>
                <span className="text-xs font-semibold text-[#9ca3af]">
                  مميز اليوم
                </span>
              </div>

              <div className="space-y-3">
                {topRatedProducts.slice(0, 4).map((product) => (
                  <ProductCardHorizontal
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
            {/* Top Bar for Menu (Flipped to match user's explicit request: Left = Back Button, Right = Item Count) */}
            <div className="flex items-center justify-between px-1">
              <button
                onClick={() => {
                  setSearchQuery("");
                  setActiveTab("home");
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white border border-[#e2e8f0] text-xs font-bold text-[#1e293b] hover:bg-slate-50 transition-colors shadow-sm cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>الرئيسية</span>
              </button>

              <span className="text-xs text-[#64748b] font-bold">
                {filteredProducts.length} صنف متاح
              </span>
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
                    className="px-4 py-2 rounded-xl bg-[#096633] text-white text-xs font-bold cursor-pointer"
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

        {/* TAB 3: MY ORDERS */}
        {activeTab === "orders" && (
          <div className="py-6 space-y-4 text-center animate-fade-in">
            <div className="w-16 h-16 rounded-full bg-[#fdf2f8] text-[#db2777] mx-auto flex items-center justify-center">
              <Bike className="w-8 h-8" />
            </div>
            <h3 className="text-base font-black text-[#111827]">طلباتي ومتابعة التوصيل</h3>
            {confirmedOrder ? (
              <div className="bg-white p-4 rounded-2xl border border-[#eaedf1] space-y-2 shadow-sm text-right">
                <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                  <span className="text-sm font-black text-[#096633]">#{confirmedOrder.id}</span>
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 font-bold">
                    جاري التجهيز ⏳
                  </span>
                </div>
                <p className="text-xs text-[#4b5563]">
                  الطلب باسم: <b>{confirmedOrder.customerName}</b> بإجمالي <b>{confirmedOrder.totalAmount} ج.م</b>
                </p>
                <button
                  onClick={() => setIsSuccessOpen(true)}
                  className="w-full mt-2 py-2.5 rounded-xl bg-[#096633] text-white text-xs font-bold hover:bg-[#075229] cursor-pointer"
                >
                  عرض تفاصيل الطلب والفاتورة
                </button>
              </div>
            ) : (
              <div className="text-xs text-[#94a3b8] space-y-3">
                <p>لا توجد طلبات جارية حالياً.</p>
                <button
                  onClick={() => setActiveTab("menu")}
                  className="px-5 py-2.5 rounded-xl bg-[#096633] text-white text-xs font-bold hover:bg-[#075229] cursor-pointer"
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
                <div className="w-12 h-12 rounded-2xl bg-[#096633] text-white flex items-center justify-center font-black text-xl">
                  علي
                </div>
                <div>
                  <h3 className="text-base font-black text-[#111827]">{storeConfig.name}</h3>
                  <p className="text-xs text-[#b45309] font-bold">{storeConfig.tagline}</p>
                </div>
              </div>

              <div className="space-y-3 text-xs pt-2 border-t border-slate-100">
                <div className="flex items-start gap-2.5">
                  <MapPin className="w-4 h-4 text-[#db2777] shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-[#111827] block">العنوان:</span>
                    <span className="text-[#4b5563]">{storeConfig.address} - بجوار محطة مترو روض الفرج</span>
                    <span className="text-[11px] text-[#096633] font-bold block mt-0.5">يوجد صالة مكيفة للعائلات 👨‍👩‍👧‍👦</span>
                  </div>
                </div>

                <div className="flex items-start gap-2.5">
                  <Phone className="w-4 h-4 text-[#096633] shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-[#111827] block">أرقام التوصيل السريع (الدليفري):</span>
                    <div className="space-y-0.5 mt-1 font-bold">
                      <a href="tel:01094467175" className="text-[#096633] block" dir="ltr">010 94 46 71 75</a>
                      <a href="tel:01274536655" className="text-[#096633] block" dir="ltr">012 74 53 66 55</a>
                      <a href="tel:0224309130" className="text-[#096633] block" dir="ltr">022 430 91 30</a>
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

      {/* Bottom Navigation Bar (English LTR: Home -> Menu -> Center Cart -> Orders -> Branch) */}
      <BottomNav
        activeTab={activeTab}
        onTabChange={(tabId) => {
          setActiveTab(tabId);
          window.scrollTo({ top: 0, behavior: "smooth" });
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
    </main>
  );
}
