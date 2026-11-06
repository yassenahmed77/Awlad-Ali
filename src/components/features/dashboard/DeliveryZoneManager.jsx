"use client";

import React, { useState, useEffect } from "react";
import {
  MapPin,
  Plus,
  Trash2,
  Edit2,
  CheckCircle2,
  XCircle,
  Search,
  Clock,
  Coins,
  RefreshCw,
  X,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";

export function DeliveryZoneManager() {
  const [zones, setZones] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedArea, setSelectedArea] = useState("all");
  const [actionFeedback, setActionFeedback] = useState(null);

  // Modal State for Add / Edit
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingZone, setEditingZone] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    area: "شبرا",
    fee: 15,
    estimatedMinutes: "25 - 35 دقيقة",
    isCovered: true,
  });

  // Fetch zones on load
  const loadDeliveryData = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/delivery-zones");
      const data = await res.json();
      if (data.success) {
        setZones(data.zones || []);
      }
    } catch (err) {
      console.error("Failed to load delivery zones:", err);
      showFeedback("error", "فشل تحميل مناطق التوصيل");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadDeliveryData();
  }, []);

  const showFeedback = (type, message) => {
    setActionFeedback({ type, message });
    setTimeout(() => setActionFeedback(null), 4000);
  };

  // Toggle Zone Availability
  const handleToggleZone = async (zoneId) => {
    try {
      const res = await fetch("/api/delivery-zones", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: zoneId, action: "toggleCoverage" }),
      });
      const data = await res.json();
      if (data.success) {
        setZones((prev) =>
          prev.map((z) => (z.id === zoneId ? { ...z, isCovered: !z.isCovered } : z))
        );
        showFeedback(
          "success",
          data.zone.isCovered ? "تم تفعيل المنطقة للتوصيل ✅" : "تم تعطيل التوصيل للمنطقة مؤقتاً 🚫"
        );
      }
    } catch (err) {
      showFeedback("error", "فشل تحديث حالة المنطقة");
    }
  };

  // Open Modal for Add
  const handleOpenAddModal = () => {
    setEditingZone(null);
    setFormData({
      name: "",
      area: "شبرا",
      fee: 15,
      estimatedMinutes: "25 - 35 دقيقة",
      isCovered: true,
    });
    setIsModalOpen(true);
  };

  // Open Modal for Edit
  const handleOpenEditModal = (zone) => {
    setEditingZone(zone);
    setFormData({
      name: zone.name,
      area: zone.area,
      fee: zone.fee,
      estimatedMinutes: zone.estimatedMinutes,
      isCovered: zone.isCovered,
    });
    setIsModalOpen(true);
  };

  // Submit Modal (Add or Edit)
  const handleSaveModal = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      showFeedback("error", "اسم المنطقة مطلوب");
      return;
    }

    try {
      if (editingZone) {
        // Edit existing
        const res = await fetch("/api/delivery-zones", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: editingZone.id,
            updates: formData,
          }),
        });
        const data = await res.json();
        if (data.success) {
          setZones((prev) =>
            prev.map((z) => (z.id === editingZone.id ? data.zone : z))
          );
          setIsModalOpen(false);
          showFeedback("success", "تم تحديث بيانات المنطقة بنجاح ✅");
        } else {
          showFeedback("error", data.error || "فشل التعديل");
        }
      } else {
        // Add new
        const res = await fetch("/api/delivery-zones", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        });
        const data = await res.json();
        if (data.success) {
          setZones((prev) => [data.zone, ...prev]);
          setIsModalOpen(false);
          showFeedback("success", "تمت إضافة المنطقة الجديدة بنجاح ✅");
        } else {
          showFeedback("error", data.error || "فشل الإضافة");
        }
      }
    } catch (err) {
      showFeedback("error", "حدث خطأ أثناء الحفظ");
    }
  };

  // Delete Zone
  const handleDeleteZone = async (zoneId, zoneName) => {
    if (!window.confirm(`هل أنت متأكد من حذف منطقة "${zoneName}"؟`)) {
      return;
    }

    try {
      const res = await fetch(`/api/delivery-zones?id=${zoneId}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (data.success) {
        setZones((prev) => prev.filter((z) => z.id !== zoneId));
        showFeedback("success", "تم حذف المنطقة بنجاح 🗑️");
      } else {
        showFeedback("error", data.error || "فشل حذف المنطقة");
      }
    } catch (err) {
      showFeedback("error", "تعذر حذف المنطقة");
    }
  };


  // Filter list
  const areasList = Array.from(new Set(zones.map((z) => z.area).filter(Boolean)));
  const filteredZones = zones.filter((z) => {
    const matchSearch =
      z.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      z.area.toLowerCase().includes(searchQuery.toLowerCase());
    const matchArea = selectedArea === "all" || z.area === selectedArea;
    return matchSearch && matchArea;
  });

  const activeCount = zones.filter((z) => z.isCovered).length;
  const disabledCount = zones.length - activeCount;

  return (
    <div className="space-y-6">
      {/* Toast Alert Feedback */}
      {actionFeedback && (
        <div
          className={`p-3.5 rounded-xl text-xs font-bold flex items-center justify-between shadow-md transition-all ${
            actionFeedback.type === "success"
              ? "bg-emerald-500 text-white"
              : "bg-red-500 text-white"
          }`}
        >
          <span>{actionFeedback.message}</span>
          <button onClick={() => setActionFeedback(null)} className="p-1">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Top Banner: Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-white rounded-2xl p-4 border border-surface-border shadow-sm">
          <p className="text-[11px] font-bold text-text-secondary">إجمالي مناطق التوصيل</p>
          <p className="text-2xl font-black text-brand-900 mt-1">{zones.length}</p>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-surface-border shadow-sm">
          <p className="text-[11px] font-bold text-emerald-700">مناطق متاحة للتوصيل الآن</p>
          <p className="text-2xl font-black text-emerald-600 mt-1">{activeCount}</p>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-surface-border shadow-sm">
          <p className="text-[11px] font-bold text-red-600">مناطق معطلة مؤقتاً</p>
          <p className="text-2xl font-black text-red-500 mt-1">{disabledCount}</p>
        </div>
      </div>

      {/* Action Bar: Search, Filters & Add Button */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-surface-border shadow-sm">
        <div className="flex flex-wrap items-center gap-2.5 flex-1 min-w-[280px]">
          {/* Search */}
          <div className="relative flex-1 min-w-[180px]">
            <Search className="w-4 h-4 text-text-muted absolute right-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="ابحث عن منطقة أو شارع..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pr-9 pl-3 py-2 text-xs rounded-xl border border-surface-border bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500 font-medium"
            />
          </div>

          {/* Area Filter */}
          <select
            value={selectedArea}
            onChange={(e) => setSelectedArea(e.target.value)}
            className="py-2 px-3 text-xs rounded-xl border border-surface-border bg-slate-50 font-bold text-text-primary focus:outline-none cursor-pointer"
          >
            <option value="all">كل النطاقات ({zones.length})</option>
            {areasList.map((area) => (
              <option key={area} value={area}>
                {area} ({zones.filter((z) => z.area === area).length})
              </option>
            ))}
          </select>
        </div>

        {/* Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={loadDeliveryData}
            title="تحديث البيانات"
            className="p-2 rounded-xl border border-surface-border hover:bg-slate-50 text-text-secondary transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
          </button>

          <button
            onClick={handleOpenAddModal}
            className="flex items-center gap-1.5 px-4 py-2 bg-brand-700 text-white rounded-xl text-xs font-bold hover:bg-brand-800 transition-all shadow-sm cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>إضافة منطقة جديدة</span>
          </button>
        </div>
      </div>

      {/* Zones Table / Cards List */}
      {isLoading ? (
        <div className="bg-white rounded-2xl border border-surface-border p-12 text-center text-xs text-text-muted">
          جاري تحميل مناطق التوصيل... ⏳
        </div>
      ) : filteredZones.length === 0 ? (
        <div className="bg-white rounded-2xl border border-surface-border p-12 text-center space-y-2">
          <p className="text-sm font-bold text-text-primary">لم يتم العثور على مناطق مطابقة للبحث</p>
          <p className="text-xs text-text-muted">تأكد من كتابة الاسم بشكل صحيح أو أضف منطقة جديدة.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {filteredZones.map((zone) => {
            const isCovered = zone.isCovered;
            return (
              <div
                key={zone.id}
                className={`bg-white rounded-2xl border p-4 transition-all shadow-sm relative flex flex-col justify-between ${
                  isCovered
                    ? "border-surface-border hover:border-brand-300"
                    : "border-red-200 bg-red-50/20 opacity-80"
                }`}
              >
                {/* Header: Area badge + toggle */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[10px] font-black px-2 py-0.5 rounded-md bg-slate-100 text-text-secondary">
                      {zone.area || "عام"}
                    </span>

                    {/* Toggle Switch */}
                    <button
                      onClick={() => handleToggleZone(zone.id)}
                      className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-black transition-all cursor-pointer ${
                        isCovered
                          ? "bg-emerald-100 text-emerald-800 hover:bg-emerald-200"
                          : "bg-red-100 text-red-800 hover:bg-red-200"
                      }`}
                    >
                      {isCovered ? (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>متاحة</span>
                        </>
                      ) : (
                        <>
                          <XCircle className="w-3.5 h-3.5" />
                          <span>معطلة</span>
                        </>
                      )}
                    </button>
                  </div>

                  {/* Zone Name */}
                  <div className="flex items-start gap-1.5">
                    <MapPin
                      className={`w-4 h-4 shrink-0 mt-0.5 ${
                        isCovered ? "text-brand-700" : "text-red-400"
                      }`}
                    />
                    <h3 className="text-sm font-bold text-text-primary leading-tight">
                      {zone.name}
                    </h3>
                  </div>
                </div>

                {/* Pricing & Timing Badges */}
                <div className="mt-4 pt-3 border-t border-slate-100 grid grid-cols-2 gap-2 text-xs">
                  <div className="flex items-center gap-1.5 text-text-secondary">
                    <Coins className="w-3.5 h-3.5 text-brand-600" />
                    <span>التوصيل:</span>
                    <strong className="text-brand-900 font-black">
                      {formatCurrency(zone.fee)}
                    </strong>
                  </div>

                  <div className="flex items-center gap-1.5 text-text-secondary">
                    <Clock className="w-3.5 h-3.5 text-amber-600" />
                    <span className="truncate">{zone.estimatedMinutes || "30 دقيقة"}</span>
                  </div>
                </div>

                {/* Actions: Edit & Delete */}
                <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-end gap-1.5">
                  <button
                    onClick={() => handleOpenEditModal(zone)}
                    className="flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold text-brand-700 hover:bg-brand-50 rounded-lg transition-colors cursor-pointer"
                  >
                    <Edit2 className="w-3 h-3" />
                    <span>تعديل</span>
                  </button>

                  <button
                    onClick={() => handleDeleteZone(zone.id, zone.name)}
                    className="flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-3 h-3" />
                    <span>حذف</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal: Add / Edit Zone */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-md p-6 space-y-4 shadow-xl border border-surface-border text-right animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-black text-brand-900">
                {editingZone ? "تعديل منطقة التوصيل" : "إضافة منطقة توصيل جديدة"}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg text-text-muted hover:bg-slate-100 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveModal} className="space-y-4">
              {/* Zone Name */}
              <div>
                <label className="block text-xs font-bold text-text-primary mb-1">
                  اسم المنطقة أو الشارع *
                </label>
                <input
                  type="text"
                  required
                  placeholder="مثال: دوران شبرا، خلوصي وأحمد بدوي"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-surface-border bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500 font-medium"
                />
              </div>

              {/* Area Group */}
              <div>
                <label className="block text-xs font-bold text-text-primary mb-1">
                  النطاق / الحي الكبير *
                </label>
                <input
                  type="text"
                  required
                  placeholder="مثال: شبرا / شمال القاهرة / وسط البلد"
                  value={formData.area}
                  onChange={(e) => setFormData({ ...formData, area: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-surface-border bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500 font-medium"
                />
              </div>

              {/* Fee & Time */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-text-primary mb-1">
                    سعر التوصيل (ج.م) *
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    required
                    value={formData.fee}
                    onChange={(e) => setFormData({ ...formData, fee: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-surface-border bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500 font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-text-primary mb-1">
                    الوقت المتوقع للتوصيل *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="مثال: 25 - 35 دقيقة"
                    value={formData.estimatedMinutes}
                    onChange={(e) =>
                      setFormData({ ...formData, estimatedMinutes: e.target.value })
                    }
                    className="w-full px-3 py-2 text-xs rounded-xl border border-surface-border bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500 font-medium"
                  />
                </div>
              </div>

              {/* Coverage Toggle */}
              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="isCoveredCheck"
                  checked={formData.isCovered}
                  onChange={(e) =>
                    setFormData({ ...formData, isCovered: e.target.checked })
                  }
                  className="w-4 h-4 rounded text-brand-700 focus:ring-brand-500 cursor-pointer"
                />
                <label
                  htmlFor="isCoveredCheck"
                  className="text-xs font-bold text-text-primary cursor-pointer"
                >
                  المنطقة مفعلة ومتاحة للتوصيل الفوري الآن
                </label>
              </div>

              {/* Buttons */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-text-secondary hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                >
                  إلغاء
                </button>

                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold bg-brand-700 text-white rounded-xl hover:bg-brand-800 transition-all shadow-sm cursor-pointer"
                >
                  {editingZone ? "حفظ التعديلات" : "إضافة المنطقة"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

