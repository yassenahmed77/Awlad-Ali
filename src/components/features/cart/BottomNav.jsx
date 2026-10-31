"use client";

import React, { useState, useEffect, useRef } from "react";
import { Home, ShoppingCart, User } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { cn } from "@/lib/utils";

// Custom Menu & Orders icons matching reference app exactly
function MenuNavIcon(props) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <rect x="3.5" y="3.5" width="17" height="17" rx="5" />
      <line x1="7.5" y1="8" x2="16.5" y2="8" strokeWidth="2.2" />
      <line x1="7.5" y1="12" x2="14" y2="12" strokeWidth="2.2" />
      <line x1="7.5" y1="16" x2="11" y2="16" strokeWidth="2.2" />
    </svg>
  );
}

function OrdersNavIcon(props) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <rect x="3.5" y="3.5" width="17" height="17" rx="5" />
      <line x1="8" y1="16" x2="8" y2="10.5" strokeWidth="2.2" />
      <line x1="12" y1="16" x2="12" y2="7.5" strokeWidth="2.2" />
      <line x1="16" y1="16" x2="16" y2="12.5" strokeWidth="2.2" />
    </svg>
  );
}

const TABS = [
  { id: "home", label: "الرئيسية", icon: Home },
  { id: "menu", label: "المنيو", icon: MenuNavIcon },
  { id: "cart", label: "السلة", icon: ShoppingCart, isCart: true },
  { id: "orders", label: "طلباتي", icon: OrdersNavIcon },
  { id: "branch", label: "الفرع", icon: User },
];

export function BottomNav({ activeTab, onTabChange, onCartClick }) {
  const { totalItemsCount, isBouncing } = useCart();
  const containerRef = useRef(null);
  const [navWidth, setNavWidth] = useState(400);

  // Active tab index (0 to 4)
  const activeIndex = Math.max(
    0,
    TABS.findIndex((t) => t.id === activeTab)
  );

  // Measure container width responsively
  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        setNavWidth(containerRef.current.offsetWidth || 400);
      }
    };
    updateSize();
    window.addEventListener("resize", updateSize);
    return () => window.removeEventListener("resize", updateSize);
  }, []);

  // Center position of active tab
  const targetX = ((activeIndex + 0.5) / TABS.length) * navWidth;

  // Smooth sliding animation
  const [currentX, setCurrentX] = useState(targetX);

  useEffect(() => {
    let animationFrame;
    const startX = currentX;
    const diff = targetX - startX;
    if (Math.abs(diff) < 0.5) {
      setCurrentX(targetX);
      return;
    }

    const duration = 250; // ms
    const startTime = performance.now();

    const step = (now) => {
      const elapsed = now - startTime;
      const progress = Math.min(1, elapsed / duration);
      const ease = 1 - Math.pow(1 - progress, 3); // Cubic ease out
      setCurrentX(startX + diff * ease);

      if (progress < 1) {
        animationFrame = requestAnimationFrame(step);
      } else {
        setCurrentX(targetX);
      }
    };

    animationFrame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(animationFrame);
  }, [targetX]);

  // Perfectly circular cradle notch (uniform ~5.2px gap around 48px circle button, matching user reference image exactly)
  const notchRadius = 38;
  const clampedX = Math.max(notchRadius + 10, Math.min(navWidth - notchRadius - 10, currentX));

  const lipLeft = Math.max(0, clampedX - notchRadius);
  const lipRight = Math.min(navWidth, clampedX + notchRadius);

  // Pure circular arc cradle SVG path hugging the elevated circle
  const svgPathD = `
    M 0 0 
    L ${lipLeft} 0 
    C ${clampedX - 33} 0, ${clampedX - 30} 3.5, ${clampedX - 29.2} 10 
    C ${clampedX - 28} 21, ${clampedX - 16} 37.5, ${clampedX} 37.5 
    C ${clampedX + 16} 37.5, ${clampedX + 28} 21, ${clampedX + 29.2} 10 
    C ${clampedX + 30} 3.5, ${clampedX + 33} 0, ${lipRight} 0 
    L ${navWidth} 0 
    L ${navWidth} 85 
    L 0 85 
    Z
  `;

  const ActiveIcon = TABS[activeIndex]?.icon || Home;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 pointer-events-none">
      <div
        ref={containerRef}
        className="max-w-md mx-auto relative h-[68px] pointer-events-auto"
      >
        {/* 1. Clean White Navbar Background with Circular Cradle Notch */}
        <svg
          className="absolute inset-0 w-full h-full pointer-events-none"
          viewBox={`0 0 ${navWidth} 85`}
          preserveAspectRatio="none"
          style={{
            filter: "drop-shadow(0px -3px 8px rgba(0, 0, 0, 0.05))",
          }}
        >
          <path
            d={svgPathD}
            fill="#ffffff"
            stroke="#eaedf1"
            strokeWidth="0.8"
          />
        </svg>

        {/* 2. Elevated Floating Green Circle Button with visible open circular gap */}
        <div
          className="absolute top-0 flex items-center justify-center pointer-events-none z-20"
          style={{
            left: `${clampedX}px`,
            transform: "translate(-50%, -22px)",
          }}
        >
          <button
            onClick={() => {
              const activeItem = TABS[activeIndex];
              if (activeItem.isCart) {
                onCartClick();
              }
            }}
            className={cn(
              "relative w-12 h-12 rounded-full bg-[#2ea863] text-white flex items-center justify-center shadow-lg shadow-[#2ea863]/30 pointer-events-auto active:scale-95 transition-transform duration-150 cursor-pointer select-none",
              isBouncing && "animate-cart-bounce"
            )}
            aria-label={TABS[activeIndex]?.label}
          >
            <ActiveIcon
              className={cn(
                "w-6 h-6 text-white stroke-[2.2]",
                TABS[activeIndex]?.isCart && "fill-white stroke-[1.5]"
              )}
            />
            {TABS[activeIndex]?.isCart && totalItemsCount > 0 && (
              <div className="absolute -top-1.5 -right-1.5 z-30 flex items-center justify-center pointer-events-none">
                <span
                  key={`active-badge-${totalItemsCount}`}
                  className="relative min-w-[20px] h-[20px] px-1 rounded-full bg-gradient-to-tr from-[#08502c] via-[#0b6638] to-[#16a34a] text-white font-black text-[11px] flex items-center justify-center border-2 border-white shadow-sm animate-badge-pop"
                >
                  {totalItemsCount}
                </span>
              </div>
            )}
          </button>
        </div>

        {/* 3. Five Tab Slots: All 5 icons are standard, clean, visible black icons with comfortable inner padding */}
        <div className="relative z-10 w-full h-full flex items-center justify-between px-3 pt-1 pb-4">
          {TABS.map((tab, idx) => {
            const isActive = idx === activeIndex;
            const Icon = tab.icon;

            return (
              <button
                key={tab.id}
                onClick={() => {
                  if (tab.isCart) {
                    onCartClick();
                  }
                  onTabChange(tab.id);
                }}
                className="flex-1 flex flex-col items-center justify-center h-full active:scale-90 transition-transform duration-100 cursor-pointer select-none relative"
                aria-label={tab.label}
              >
                {/* Standard black icon when inactive */}
                <div
                  className={cn(
                    "relative flex items-center justify-center transition-all duration-150",
                    isActive
                      ? "opacity-0 scale-75 pointer-events-none"
                      : "opacity-100 scale-100 text-[#111827]"
                  )}
                >
                  <Icon className="w-6 h-6 text-[#111827] stroke-[1.8]" />
                  {tab.isCart && totalItemsCount > 0 && !isActive && (
                    <div className="absolute -top-2 -right-2.5 z-20 flex items-center justify-center pointer-events-none">
                      <span
                        key={`inactive-badge-${totalItemsCount}`}
                        className="relative min-w-[19px] h-[19px] px-1 rounded-full bg-gradient-to-tr from-[#08502c] via-[#0b6638] to-[#16a34a] text-white font-black text-[10px] flex items-center justify-center border-2 border-white shadow-sm animate-badge-pop animate-badge-pulse"
                      >
                        {totalItemsCount}
                      </span>
                    </div>
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {/* 4. iOS Home Indicator Bar at Bottom (Elegantly spaced with comfortable inner margin) */}
        <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2 w-28 h-1 bg-[#cbd5e1] rounded-full pointer-events-none z-10" />
      </div>
    </nav>
  );
}
