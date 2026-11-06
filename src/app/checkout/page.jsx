"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  ArrowRight,
  ArrowLeft,
  MapPin,
  Navigation,
  CheckCircle2,
  AlertCircle,
  User,
  FileText,
  ShoppingBag,
  ExternalLink,
  MessageSquare,
  ChevronDown,
} from "lucide-react";

import { useCart } from "@/context/CartContext";
import { storeConfig } from "@/config/theme.config";
import { DELIVERY_ZONES } from "@/config/deliveryZones.config";
import {
  formatCurrency,
  normalizeEgyptianPhone,
  saveCustomerOrderLocally,
} from "@/lib/utils";

export default function CheckoutPage() {
  const { items, subtotal, isHydrated, clearCart } = useCart();

  // Form State
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [streetAddress, setStreetAddress] = useState("");
  const [buildingDetails, setBuildingDetails] = useState("");
  const [landmark, setLandmark] = useState("");
  const [notes, setNotes] = useState("");

  // Delivery Zone State
  const [zones, setZones] = useState(DELIVERY_ZONES);
  const [selectedZoneId, setSelectedZoneId] = useState("rod-el-farag");
  const [gpsLocation, setGpsLocation] = useState(null);
  const [isLocating, setIsLocating] = useState(false);
  const [locationFeedback, setLocationFeedback] = useState(null);

  // Hydrate zones dynamically from Manager API
  useEffect(() => {
    let isMounted = true;
    fetch("/api/delivery-zones")
      .then((res) => res.json())
      .then((data) => {
        if (isMounted && data.success && Array.isArray(data.zones) && data.zones.length > 0) {
          setZones(data.zones);

          // Blind spot fix: If current selected zone was deleted, select first available active zone
          setSelectedZoneId((prevId) => {
            const exists = data.zones.some((z) => z.id === prevId);
            if (exists) return prevId;
            const firstActive = data.zones.find((z) => z.isCovered) || data.zones[0];
            return firstActive ? firstActive.id : prevId;
          });
        }
      })
      .catch((err) => {
        console.warn("Using default delivery zones fallback", err);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  // Status & Validation
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [placedOrder, setPlacedOrder] = useState(null);

  // Find currently selected zone object
  const currentZone =
    zones.find((z) => z.id === selectedZoneId) || zones[0] || DELIVERY_ZONES[0];

  // Delivery fee & availability are strictly determined by the selected zone from the list
  const deliveryFee = currentZone && currentZone.isCovered ? currentZone.fee : 0;
  const finalTotal = Math.round((subtotal + deliveryFee) * 100) / 100;

  // Single Source of Truth for delivery: The List! If zone is not covered, no delivery happens.
  const isOutOfZone = !currentZone || !currentZone.isCovered;

  // Geolocation Handler: Used ONLY as a direct Google Maps link for delivery navigation
  const handleDetectGpsLocation = () => {
    if (typeof window === "undefined" || !navigator.geolocation) {
      setLocationFeedback({
        type: "error",
        message: "متصفحك لا يدعم تحديد الموقع بالـ GPS، يمكنك الاعتماد على العنوان المكتوب.",
      });
      return;
    }

    setIsLocating(true);
    setLocationFeedback(null);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setIsLocating(false);
        const { latitude, longitude } = pos.coords;
        const mapsUrl = `https://maps.google.com/?q=${latitude},${longitude}`;

        setGpsLocation({
          lat: latitude,
          lng: longitude,
          googleMapsUrl: mapsUrl,
        });

        setLocationFeedback({
          type: "success",
          message: "تم تحديد موقعك وسيتم إرفاق رابط الخريطة مع الطلب 📍",
          mapsUrl,
        });
      },
      (err) => {
        setIsLocating(false);
        console.warn("GPS error:", err);
        setLocationFeedback({
          type: "warning",
          message:
            "تعذر تحديد الموقع تلقائياً (يرجى السماح بالـ GPS أو الاعتماد على العنوان المكتوب).",
        });
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
    );
  };
      (err) => {
        setIsLocating(false);
        console.warn("GPS error:", err);
        setLocationFeedback({
          type: "warning",
          message:
            "تعذر الوصول للموقع التلقائي (يرجى تفعيل صلاحية الـ GPS أو اختيار منطقتك يدوياً من القائمة).",
        });
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
    );
  };

  // Form Validation
  const validate = () => {
    const newErrors = {};

    // 1. Name validation
    const cleanName = customerName.trim();
    if (!cleanName || cleanName.length < 2) {
      newErrors.customerName = "يرجى كتابة اسمك بالكامل (حرفين على الأقل)";
    }

    // 2. Phone validation
    const phoneCheck = normalizeEgyptianPhone(customerPhone);
    if (!phoneCheck.isValid) {
      newErrors.customerPhone = phoneCheck.error;
    }

    // 3. Zone check
    if (isOutOfZone) {
      newErrors.zone = "عفواً، منطقتك خارج نطاق التوصيل السريع حالياً.";
    }

    // 4. Street Address validation
    const cleanStreet = streetAddress.trim();
    if (!cleanStreet || cleanStreet.length < 3) {
      newErrors.streetAddress = "يرجى كتابة اسم الشارع بشكل واضح";
    }

    // 5. Building & Apartment Details
    const cleanBuilding = buildingDetails.trim();
    if (!cleanBuilding || cleanBuilding.length < 2) {
      newErrors.buildingDetails = "يرجى كتابة رقم العمارة والدور والشقة";
    }

    // 6. Cart Empty Check
    if (!items || items.length === 0) {
      newErrors.cart = "سلة طلباتك فارغة!";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Submit Order Handler
  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerError("");

    if (isSubmitting) return;
    if (!validate()) return;

    setIsSubmitting(true);
    const phoneCheck = normalizeEgyptianPhone(customerPhone);

    // Compose comprehensive address text for printed bill
    const fullAddress = [
      `المنطقة: ${currentZone.name}`,
      `الشارع: ${streetAddress.trim()}`,
      `العمارة/الشقة: ${buildingDetails.trim()}`,
      landmark.trim() ? `علامة مميزة: ${landmark.trim()}` : null,
    ]
      .filter(Boolean)
      .join(" - ");

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 12000);

      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify({
          customerName: customerName.trim(),
          customerPhone: phoneCheck.normalized,
          orderType: "delivery",
          customerAddress: fullAddress,
          deliveryZone: currentZone.name,
          googleMapsUrl: gpsLocation?.googleMapsUrl || "",
          distanceKm: gpsLocation?.distanceKm || null,
          customDeliveryFee: deliveryFee,
          notes: notes.trim(),
          items,
        }),
      });

      clearTimeout(timeoutId);
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "حدث خطأ أثناء تسجيل الطلب");
      }

      // Persist locally for customer live order tracker
      saveCustomerOrderLocally(data.order);
      clearCart();
      setPlacedOrder(data.order);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      if (err.name === "AbortError") {
        setServerError("استغرق إرسال الطلب وقتاً أطول من المتوقع، تأكد من اتصال الإنترنت وحاول مجدداً.");
      } else {
        setServerError(err.message || "فشل إرسال الطلب، يرجى المحاولة ثانية.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // -------------------------------------------------------------
  // VIEW: Placed Order Success Screen
  // -------------------------------------------------------------
  if (placedOrder) {
    const whatsappText = encodeURIComponent(
      `مرحباً مطعم أولاد علي، أنا العميل ${placedOrder.customerName} بخصوص طلبي رقم #${placedOrder.id} بقيمة ${placedOrder.totalAmount} ج.م`
    );

    return (
      <main className="min-h-screen bg-[#fbfbfb] py-6 px-4 font-sans text-right" dir="rtl">
        <div className="max-w-md mx-auto bg-white rounded-3xl p-6 border border-[#eaedf1] shadow-xl text-center space-y-4 animate-slide-up">
          <div className="w-16 h-16 rounded-full bg-[#eaf8ee] text-[#0b6638] mx-auto flex items-center justify-center animate-bounce">
            <CheckCircle2 className="w-10 h-10" />
          </div>

          <div className="space-y-1">
            <span className="text-xs font-bold text-[#9ca3af]">تم تأكيد وإرسال طلبك بنجاح!</span>
            <h2 className="text-2xl font-black text-[#0b6638] tracking-widest">#{placedOrder.id}</h2>
            <p className="text-xs text-[#64748b] leading-relaxed">
              طلبك وصل للكاشير في المطبخ، والطيار هيتحرك بيه سخن وطازة لحد باب بيتك!
            </p>
          </div>

          {/* Quick Summary Pill */}
          <div className="bg-[#f8fafc] p-3 rounded-2xl border border-slate-100 space-y-1.5 text-xs text-right">
            <div className="flex justify-between font-bold text-[#111827]">
              <span>{placedOrder.customerName}</span>
              <span className="text-slate-400">اسم العميل:</span>
            </div>
            <div className="flex justify-between text-[#111827]">
              <span dir="ltr" className="font-bold">{placedOrder.customerPhone}</span>
              <span className="text-slate-400">رقم الهاتف:</span>
            </div>
            <div className="flex justify-between text-[#111827]">
              <span className="font-bold text-[#0b6638]">{placedOrder.deliveryZone || "شبرا"}</span>
              <span className="text-slate-400">منطقة التوصيل:</span>
            </div>
            <div className="flex justify-between pt-1 border-t border-slate-200 font-black text-sm text-[#0b6638]">
              <span>{formatCurrency(placedOrder.totalAmount)}</span>
              <span>المطلوب كاش للطيار:</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-2 pt-2">
            <a
              href={`https://wa.me/${storeConfig.whatsapp}?text=${whatsappText}`}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full inline-flex items-center justify-center gap-2 h-11 px-4 rounded-xl bg-[#25d366] text-white font-bold text-xs hover:bg-[#20ba59] transition-all shadow-sm cursor-pointer"
            >
              <MessageSquare className="w-4 h-4" />
              <span>متابعة الطلب على واتساب المحل</span>
            </a>

            <Link
              href="/"
              className="w-full inline-flex items-center justify-center gap-2 h-11 px-4 rounded-xl bg-[#0b6638] text-white font-bold text-xs hover:bg-[#08502c] transition-all shadow-sm"
            >
              <span>العودة ومتابعة حالة الطلب في "طلباتي"</span>
              <ArrowLeft className="w-4 h-4 rotate-180" />
            </Link>
          </div>
        </div>
      </main>
    );
  }

  // -------------------------------------------------------------
  // VIEW: Empty Cart Guard
  // -------------------------------------------------------------
  if (isHydrated && (!items || items.length === 0)) {
    return (
      <main className="min-h-screen bg-[#fbfbfb] py-12 px-4 font-sans text-right" dir="rtl">
        <div className="max-w-md mx-auto bg-white rounded-3xl p-8 border border-[#eaedf1] shadow-sm text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-[#eaf8ee] text-[#0b6638] mx-auto flex items-center justify-center">
            <ShoppingBag className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-black text-[#111827]">سلة طلباتك فارغة!</h3>
          <p className="text-xs text-[#64748b] leading-relaxed">
            اختار أكلتك المفضلة من المنيو (فطائر، بيتزا، شاورما، بروستد) وارجع هنا لتأكيد التوصيل.
          </p>
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-full bg-[#0b6638] text-white text-xs font-bold hover:bg-[#08502c] transition-all shadow-sm"
          >
            <span>تصفح المنيو الآن</span>
            <ArrowLeft className="w-3.5 h-3.5 rotate-180" />
          </Link>
        </div>
      </main>
    );
  }

  // -------------------------------------------------------------
  // MAIN VIEW: Dedicated Checkout Page
  // -------------------------------------------------------------
  return (
    <main className="min-h-screen pb-32 bg-[#f8fafc] text-right font-sans" dir="rtl">
      {/* Top Sticky Header */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-[#eaedf1] shadow-xs">
        <div className="max-w-md mx-auto px-4 h-14 flex items-center justify-between">
          <Link
            href="/"
            className="flex items-center gap-1.5 text-xs font-bold text-[#64748b] hover:text-[#0b6638] bg-slate-100 hover:bg-emerald-50 px-3 py-1.5 rounded-full transition-colors"
          >
            <ArrowRight className="w-3.5 h-3.5" />
            <span>المنيو</span>
          </Link>

          <h1 className="text-sm font-black text-[#111827]">تأكيد الطلب والتوصيل</h1>

          <div className="w-9 h-9 relative rounded-full overflow-hidden border border-emerald-100">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo.svg" alt="أولاد علي" className="w-full h-full object-contain p-1" />
          </div>
        </div>
      </header>

      {/* Main Container */}
      <div className="max-w-md mx-auto px-4 py-4 space-y-4">
        {/* Error Notification */}
        {serverError && (
          <div className="p-3.5 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2.5 animate-shake">
            <AlertCircle className="w-5 h-5 shrink-0 text-red-600" />
            <p className="font-bold leading-relaxed">{serverError}</p>
          </div>
        )}

        {/* 1. ORDER SUMMARY CARD (At the very top per user request) */}
        <section className="bg-white rounded-3xl p-4 border border-[#eaedf1] shadow-sm space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <Link
              href="/"
              className="text-[11px] font-bold text-[#0b6638] hover:underline"
            >
              + إضافة صنف آخر
            </Link>
            <div className="flex items-center gap-1.5">
              <ShoppingBag className="w-4 h-4 text-[#0b6638]" />
              <h2 className="text-xs font-black text-[#111827]">
                ملخص أصناف الطلب ({items.length})
              </h2>
            </div>
          </div>

          <div className="space-y-2.5 divide-y divide-slate-100">
            {items.map((item) => (
              <div key={item.cartKey} className="pt-2 first:pt-0 flex items-center justify-between gap-3">
                <span className="font-black text-xs text-[#0b6638] shrink-0">
                  {formatCurrency(item.itemTotal)}
                </span>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-end gap-1.5">
                    <span className="text-[11px] font-bold text-slate-500">×{item.quantity}</span>
                    <h3 className="text-xs font-bold text-[#111827] line-clamp-1">{item.name}</h3>
                  </div>

                  <div className="flex flex-wrap items-center justify-end gap-1 mt-0.5">
                    {item.selectedSize && (
                      <span className="text-[10px] font-bold text-[#0b6638] bg-[#eaf8ee] px-2 py-0.5 rounded-md">
                        {item.selectedSize.name}
                      </span>
                    )}
                    {item.selectedAddons && item.selectedAddons.length > 0 && (
                      <span className="text-[10px] text-[#9ca3af] line-clamp-1">
                        + {item.selectedAddons.map((a) => a.name).join("، ")}
                      </span>
                    )}
                  </div>
                </div>

                {item.image && (
                  <div className="relative w-11 h-11 rounded-xl overflow-hidden shrink-0 bg-slate-100 border border-slate-100">
                    <Image src={item.image} alt={item.name} fill className="object-cover" />
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="pt-2 border-t border-slate-100 flex justify-between items-center text-xs">
            <span className="font-black text-[#111827]">{formatCurrency(subtotal)}</span>
            <span className="font-bold text-[#64748b]">مجموع الوجبات:</span>
          </div>
        </section>

        {/* 2. DELIVERY LOCATION & GEOFENCING ZONE CHECK */}
        <section className="bg-white rounded-3xl p-4 border border-[#eaedf1] shadow-sm space-y-3.5">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <span className="text-[10px] font-bold text-[#0b6638] bg-[#eaf8ee] px-2 py-0.5 rounded-full">
              توصيل سريع 🛵
            </span>
            <div className="flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-[#0b6638]" />
              <h2 className="text-xs font-black text-[#111827]">منطقة وموقع التوصيل</h2>
            </div>
          </div>

          {/* GPS 1-Click Button */}
          <div className="space-y-1.5">
            <button
              type="button"
              onClick={handleDetectGpsLocation}
              disabled={isLocating}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-2xl bg-gradient-to-r from-[#0b6638] to-[#107b46] text-white text-xs font-black shadow-sm shadow-emerald-950/15 hover:opacity-95 active:scale-98 transition-all cursor-pointer"
            >
              <Navigation className={`w-4 h-4 ${isLocating ? "animate-spin" : ""}`} />
              <span>{isLocating ? "جاري تحديد موقعك بالـ GPS..." : "📍 تحديد موقعي الحالي تلقائياً (GPS للطيار)"}</span>
            </button>
            <p className="text-[10px] text-slate-400 text-center">
              اختياري: لتزويد الطيار برابط خرائط جوجل للوصول أسرع بدون ما يرن عليك
            </p>
          </div>

          {/* GPS Feedback Alert */}
          {locationFeedback && (
            <div
              className={`p-3 rounded-2xl text-xs font-bold flex items-start gap-2 animate-fade-in ${
                locationFeedback.type === "success"
                  ? "bg-emerald-50 border border-emerald-200 text-emerald-800"
                  : locationFeedback.type === "error"
                  ? "bg-red-50 border border-red-200 text-red-700"
                  : "bg-amber-50 border border-amber-200 text-amber-800"
              }`}
            >
              {locationFeedback.type === "success" ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              )}
              <div className="flex-1 space-y-1">
                <p>{locationFeedback.message}</p>
                {locationFeedback.mapsUrl && (
                  <a
                    href={locationFeedback.mapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-[11px] text-emerald-700 underline"
                  >
                    <span>معاينة موقعك على خرائط Google</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>
            </div>
          )}

          {/* Area / Zone Dropdown Selector */}
          <div className="space-y-1 pt-1">
            <label className="text-xs font-bold text-[#111827] block">
              اختر منطقتك (لتحديد وقت وتكلفة التوصيل):
            </label>
            <div className="relative">
              <select
                value={selectedZoneId}
                onChange={(e) => {
                  setSelectedZoneId(e.target.value);
                  if (errors.zone) setErrors((prev) => ({ ...prev, zone: "" }));
                }}
                className="w-full h-11 px-3.5 bg-slate-50 border border-[#eaedf1] rounded-2xl text-xs font-bold text-[#111827] focus:outline-none focus:border-[#0b6638] focus:bg-white appearance-none cursor-pointer"
              >
                {zones.map((zone) => (
                  <option key={zone.id} value={zone.id}>
                    {zone.name} {zone.isCovered ? `(توصيل ${zone.fee} ج.م • ${zone.estimatedMinutes})` : "❌ غير مغطاة حالياً"}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>

            {/* Out of Zone Warning */}
            {isOutOfZone && (
              <div className="p-3 mt-2 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs space-y-2">
                <p className="font-bold">
                  عفواً، هذه المنطقة تقع خارج نطاق التوصيل السريع المباشر لمطعم أولاد علي.
                </p>
                <a
                  href={`https://wa.me/${storeConfig.whatsapp}?text=${encodeURIComponent(
                    "مرحباً أولاد علي، هل متاح توصيل خاص لمنطقتي؟"
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-600 text-white font-bold text-[11px]"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>تواصل عبر واتساب لطلب استثنائي</span>
                </a>
              </div>
            )}
            {errors.zone && <p className="text-[11px] text-red-600 font-bold">{errors.zone}</p>}
          </div>
        </section>

        {/* 3. DETAILED STREET ADDRESS DETAILS */}
        <section className="bg-white rounded-3xl p-4 border border-[#eaedf1] shadow-sm space-y-3">
          <div className="flex items-center gap-1.5 pb-2 border-b border-slate-100">
            <FileText className="w-4 h-4 text-[#0b6638]" />
            <h2 className="text-xs font-black text-[#111827]">تفاصيل العنوان للطيار والريست</h2>
          </div>

          {/* Street Name */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-[#111827] block">
              اسم الشارع <span className="text-red-500">*</span>:
            </label>
            <input
              type="text"
              placeholder="مثال: شارع الترعة البولاقية، متفرع من خلوصي"
              value={streetAddress}
              onChange={(e) => {
                setStreetAddress(e.target.value);
                if (errors.streetAddress) setErrors((prev) => ({ ...prev, streetAddress: "" }));
              }}
              className="w-full h-11 px-3.5 bg-white border border-[#eaedf1] rounded-2xl text-xs text-[#111827] placeholder:text-[#9ca3af] focus:outline-none focus:border-[#0b6638] focus:ring-1 focus:ring-[#0b6638]"
            />
            {errors.streetAddress && <p className="text-[11px] text-red-600 font-bold">{errors.streetAddress}</p>}
          </div>

          {/* Building, Floor, Apartment */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-[#111827] block">
              رقم العمارة والدور والشقة <span className="text-red-500">*</span>:
            </label>
            <input
              type="text"
              placeholder="مثال: عمارة 14 - الدور الثالث - شقة 6"
              value={buildingDetails}
              onChange={(e) => {
                setBuildingDetails(e.target.value);
                if (errors.buildingDetails) setErrors((prev) => ({ ...prev, buildingDetails: "" }));
              }}
              className="w-full h-11 px-3.5 bg-white border border-[#eaedf1] rounded-2xl text-xs text-[#111827] placeholder:text-[#9ca3af] focus:outline-none focus:border-[#0b6638] focus:ring-1 focus:ring-[#0b6638]"
            />
            {errors.buildingDetails && <p className="text-[11px] text-red-600 font-bold">{errors.buildingDetails}</p>}
          </div>

          {/* Landmark */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-[#111827] block">علامة مميزة (اختياري):</label>
            <input
              type="text"
              placeholder="مثال: أمام صيدلية العزبي، بجوار مسجد السلام"
              value={landmark}
              onChange={(e) => setLandmark(e.target.value)}
              className="w-full h-11 px-3.5 bg-white border border-[#eaedf1] rounded-2xl text-xs text-[#111827] placeholder:text-[#9ca3af] focus:outline-none focus:border-[#0b6638] focus:ring-1 focus:ring-[#0b6638]"
            />
          </div>
        </section>

        {/* 4. CUSTOMER CONTACT DETAILS */}
        <section className="bg-white rounded-3xl p-4 border border-[#eaedf1] shadow-sm space-y-3">
          <div className="flex items-center gap-1.5 pb-2 border-b border-slate-100">
            <User className="w-4 h-4 text-[#0b6638]" />
            <h2 className="text-xs font-black text-[#111827]">بيانات العميل للتواصل</h2>
          </div>

          {/* Customer Name */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-[#111827] block">
              الاسم بالكامل <span className="text-red-500">*</span>:
            </label>
            <input
              type="text"
              placeholder="اكتب اسمك الكريم"
              value={customerName}
              onChange={(e) => {
                setCustomerName(e.target.value);
                if (errors.customerName) setErrors((prev) => ({ ...prev, customerName: "" }));
              }}
              className="w-full h-11 px-3.5 bg-white border border-[#eaedf1] rounded-2xl text-xs text-[#111827] placeholder:text-[#9ca3af] focus:outline-none focus:border-[#0b6638] focus:ring-1 focus:ring-[#0b6638]"
            />
            {errors.customerName && <p className="text-[11px] text-red-600 font-bold">{errors.customerName}</p>}
          </div>

          {/* Customer Phone */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-[#111827] block">
              رقم الموبايل (للاتصال بك عند الوصول) <span className="text-red-500">*</span>:
            </label>
            <input
              type="tel"
              dir="ltr"
              placeholder="010XXXXXXXX"
              value={customerPhone}
              onChange={(e) => {
                setCustomerPhone(e.target.value);
                if (errors.customerPhone) setErrors((prev) => ({ ...prev, customerPhone: "" }));
              }}
              className="w-full h-11 px-3.5 bg-white border border-[#eaedf1] rounded-2xl text-xs text-[#111827] placeholder:text-[#9ca3af] focus:outline-none focus:border-[#0b6638] focus:ring-1 focus:ring-[#0b6638] text-right font-sans"
            />
            {errors.customerPhone && <p className="text-[11px] text-red-600 font-bold">{errors.customerPhone}</p>}
          </div>

          {/* Notes */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-[#111827] block">ملاحظات للكاشير والطيار (اختياري):</label>
            <textarea
              rows={2}
              placeholder="مثال: زيادة تومية ومخلل، رن الجرس ومتخبطش..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full p-3 bg-white border border-[#eaedf1] rounded-2xl text-xs text-[#111827] placeholder:text-[#9ca3af] focus:outline-none focus:border-[#0b6638] focus:ring-1 focus:ring-[#0b6638]"
            />
          </div>
        </section>

        {/* 5. BILL SUMMARY BREAKDOWN */}
        <section className="bg-white rounded-3xl p-4 border border-[#eaedf1] shadow-sm space-y-2 text-xs">
          <h2 className="text-xs font-black text-[#111827] pb-1 border-b border-slate-100">فاتورة الحساب</h2>

          <div className="flex justify-between text-[#64748b]">
            <span className="font-bold text-[#111827]">{formatCurrency(subtotal)}</span>
            <span>مجموع الوجبات والأصناف:</span>
          </div>

          <div className="flex justify-between text-[#64748b]">
            <span className="font-bold text-[#0b6638]">
              {isOutOfZone ? "غير متاح" : formatCurrency(deliveryFee)}
            </span>
            <span>خدمة التوصيل السريع ({currentZone.name}):</span>
          </div>

          <div className="flex justify-between pt-2 border-t border-slate-200 font-black text-sm text-[#0b6638]">
            <span>{isOutOfZone ? "خارج النطاق" : formatCurrency(finalTotal)}</span>
            <span>الإجمالي الكلي المطلوب:</span>
          </div>

          <div className="pt-2 text-[11px] text-slate-500 flex items-center justify-between">
            <span className="font-bold text-[#111827]">💵 كاش عند استلام الطلب من الطيار</span>
            <span>طريقة الدفع:</span>
          </div>
        </section>
      </div>

      {/* STICKY BOTTOM ACTION BAR */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-[#eaedf1] shadow-lg pb-safe">
        <div className="max-w-md mx-auto px-4 py-3 flex items-center justify-between gap-3">
          {/* Submit Button */}
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting || isOutOfZone}
            className="flex-1 flex items-center justify-center gap-2 bg-[#0b6638] text-white font-black text-xs h-12 rounded-2xl hover:bg-[#08502c] active:scale-98 disabled:opacity-50 transition-all shadow-md shadow-emerald-950/15 cursor-pointer"
          >
            <span>{isSubmitting ? "جاري تسجيل طلبك وإشعاره..." : "تأكيد وإرسال الطلب (🛵 دليفري)"}</span>
            <ArrowLeft className="w-4 h-4 rotate-180" />
          </button>

          {/* Total Display */}
          <div className="text-right shrink-0">
            <span className="text-[10px] text-[#9ca3af] block font-medium">المطلوب كاش</span>
            <span className="text-base font-black text-[#0b6638]">
              {formatCurrency(finalTotal)}
            </span>
          </div>
        </div>
      </div>
    </main>
  );
}

