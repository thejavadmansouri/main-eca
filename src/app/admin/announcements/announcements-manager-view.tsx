"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export interface AnnouncementItem {
  id: string;
  title: string;
  message: string;
  level: "INFO" | "SUCCESS" | "WARNING" | "URGENT";
  target: "ALL" | "CUSTOMER" | "ADMIN";
  link: string | null;
  isActive: boolean;
  createdAt: string;
}

const BADGE_PRESETS = [
  "انبار مرکزی کرمان",
  "آفر ویژه همکار",
  "نوسان بازار و قیمت‌ها",
  "توزیع شهرستان‌ها",
  "اطلاعیه مهم لجستیک",
  "تخفیف تیراژ کارخانجات",
  "تثبیت قیمت قطعات",
  "باربری پیام شمس / پیشتاز",
];

export function AnnouncementsManagerView({ initialItems }: { initialItems: AnnouncementItem[] }) {
  const router = useRouter();
  const [items, setItems] = useState<AnnouncementItem[]>(initialItems);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // فرم ایجاد اطلاعیه جدید
  const [badge, setBadge] = useState("انبار مرکزی کرمان");
  const [customBadge, setCustomBadge] = useState("");
  const [message, setMessage] = useState("");
  const [level, setLevel] = useState<"INFO" | "SUCCESS" | "WARNING" | "URGENT">("INFO");
  const [target, setTarget] = useState<"ALL" | "CUSTOMER" | "ADMIN">("ALL");
  const [link, setLink] = useState("");
  const [isActive, setIsActive] = useState(true);

  // مودال ویرایش
  const [editingItem, setEditingItem] = useState<AnnouncementItem | null>(null);

  const effectiveBadge = badge === "custom" ? customBadge : badge;

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!effectiveBadge.trim() || !message.trim()) {
      setError("لطفاً عنوان برچسب و متن پیام را وارد کنید.");
      return;
    }

    setBusy(true);
    setError(null);
    setSuccess(null);

    try {
      const res = await fetch("/api/admin/announcements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: effectiveBadge.trim(),
          message: message.trim(),
          level,
          target,
          link: link.trim() || null,
          isActive,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.ok) {
        throw new Error(data.message || data.error || "خطا در ثبت اطلاعیه");
      }

      setItems([data.item, ...items]);
      setMessage("");
      setLink("");
      setSuccess("اطلاعیه جدید با موفقیت ثبت شد و در نوار بالای سایت فعال گردید.");
      setTimeout(() => setSuccess(null), 4000);
      router.refresh();
    } catch (err: any) {
      setError(err.message || "خطا در برقراری ارتباط");
    } finally {
      setBusy(false);
    }
  };

  const handleToggle = async (item: AnnouncementItem) => {
    try {
      const res = await fetch(`/api/admin/announcements/${item.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !item.isActive }),
      });
      const data = await res.json();
      if (res.ok && data.ok) {
        setItems(items.map((it) => (it.id === item.id ? { ...it, isActive: !it.isActive } : it)));
        router.refresh();
      }
    } catch {
      alert("خطا در تغییر وضعیت اطلاعیه");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("آیا از حذف این اطلاعیه مطمئن هستید؟")) return;
    try {
      const res = await fetch(`/api/admin/announcements/${id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (res.ok && data.ok) {
        setItems(items.filter((it) => it.id !== id));
        router.refresh();
      }
    } catch {
      alert("خطا در حذف اطلاعیه");
    }
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;

    setBusy(true);
    try {
      const res = await fetch(`/api/admin/announcements/${editingItem.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: editingItem.title.trim(),
          message: editingItem.message.trim(),
          level: editingItem.level,
          target: editingItem.target,
          link: editingItem.link?.trim() || null,
          isActive: editingItem.isActive,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.message || "خطا در ذخیره تغییرات");

      setItems(items.map((it) => (it.id === editingItem.id ? data.item : it)));
      setEditingItem(null);
      setSuccess("اطلاعیه با موفقیت به‌روزرسانی شد.");
      setTimeout(() => setSuccess(null), 3000);
      router.refresh();
    } catch (err: any) {
      alert(err.message || "خطا در ویرایش");
    } finally {
      setBusy(false);
    }
  };

  const activeCount = items.filter((it) => it.isActive).length;

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-16">
      {/* هدر صفحه */}
      <div className="flex items-center justify-between gap-4 flex-wrap border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <span>📢 مدیریت اطلاعیه‌ها و نوار بالای صفحه (Ticker)</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            تنظیم متن‌های نوار متحرک بالای سایت، پیام‌های فوری، اطلاعیه‌های انبارداری کرمان و آفرها
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-bold px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200">
            {activeCount} پیام فعال در نوار زنده
          </span>
        </div>
      </div>

      {/* پیش‌نمایش زنده نوار اعلان */}
      <div className="rounded-2xl border border-slate-300/80 bg-slate-950 p-4 shadow-sm space-y-2">
        <div className="flex items-center justify-between text-xs text-slate-400 pb-1 border-b border-slate-800">
          <span className="font-bold flex items-center gap-1.5 text-amber-400">
            <span>👁️ پیش‌نمایش زنده در نمای کاربر:</span>
          </span>
          <span className="text-[11px] text-slate-500">متن‌ها قابل انتخاب و هایلایت هستند</span>
        </div>

        <div className="w-full bg-slate-950 text-slate-100 text-xs py-2 px-2 overflow-x-auto select-text">
          <div className="flex items-center gap-6 whitespace-nowrap">
            <span className="font-black text-[11px] text-amber-400 flex items-center gap-1 shrink-0">
              <span className="size-2 rounded-full bg-amber-400 animate-ping inline-block mr-1" />
              <span>نبض بازار کاردو |</span>
            </span>

            {items.filter((it) => it.isActive).length > 0 ? (
              items
                .filter((it) => it.isActive)
                .map((it) => (
                  <div key={it.id} className="inline-flex items-center gap-2 select-text cursor-text">
                    <span
                      className={`text-[10px] font-black px-1.5 py-0.5 rounded-md select-none shrink-0 ${
                        it.level === "URGENT"
                          ? "bg-rose-500/20 text-rose-300 border border-rose-500/40"
                          : it.level === "WARNING"
                          ? "bg-amber-500/20 text-amber-300 border border-amber-500/40"
                          : it.level === "SUCCESS"
                          ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                          : "bg-blue-500/20 text-blue-300 border border-blue-500/40"
                      }`}
                    >
                      {it.title}
                    </span>
                    <span className="text-slate-200 text-xs selection:bg-amber-500 selection:text-slate-950">
                      {it.message}
                    </span>
                  </div>
                ))
            ) : (
              <span className="text-slate-500 text-xs">در حال حاضر هیچ پیامی فعال نیست.</span>
            )}
          </div>
        </div>
      </div>

      {/* پیام‌های وضعیت */}
      {error && (
        <div className="rounded-xl bg-rose-50 border border-rose-200 p-3 text-xs text-rose-700 font-bold">
          {error}
        </div>
      )}
      {success && (
        <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-3 text-xs text-emerald-800 font-bold">
          {success}
        </div>
      )}

      {/* فرم ایجاد اطلاعیه جدید */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs space-y-4">
        <h2 className="text-sm font-black text-slate-800 flex items-center gap-2">
          <span>➕ افزودن اطلاعیه / خبر جدید به نوار بالا</span>
        </h2>

        <form onSubmit={handleCreate} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* انتخاب برچسب آماده یا دستی */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                برچسب / موضوع اطلاعیه:
              </label>
              <select
                value={badge}
                onChange={(e) => setBadge(e.target.value)}
                className="w-full h-10 px-3 rounded-xl border border-slate-300 text-xs font-bold text-slate-800 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/30"
              >
                {BADGE_PRESETS.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
                <option value="custom">✏️ عنوان دلخواه...</option>
              </select>

              {badge === "custom" && (
                <input
                  type="text"
                  placeholder="عنوان برچسب اختصاصی را بنویسید..."
                  value={customBadge}
                  onChange={(e) => setCustomBadge(e.target.value)}
                  className="mt-2 w-full h-10 px-3 rounded-xl border border-blue-400 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                />
              )}
            </div>

            {/* رنگ و سطح اهمیت */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                سطح و رنگ نمایش در نوار:
              </label>
              <select
                value={level}
                onChange={(e) => setLevel(e.target.value as any)}
                className="w-full h-10 px-3 rounded-xl border border-slate-300 text-xs font-bold text-slate-800 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/30"
              >
                <option value="INFO">🔵 اطلاع‌رسانی و وضعیت انبار (آبی)</option>
                <option value="SUCCESS">🟢 تخفیف، آفر ویژه و تسویه (سبز)</option>
                <option value="WARNING">🟡 نوسان بازار و نرخ قیمت‌ها (نارنجی / زرد)</option>
                <option value="URGENT">🔴 اطلاعیه فوری و مهم باربری (قرمز)</option>
              </select>
            </div>
          </div>

          {/* متن کامل اطلاعیه */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              متن کامل پیام (قابل انتخاب و کپی توسط مشتری):
            </label>
            <textarea
              rows={2}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="مثال: سفارش‌های قطعات پژو و پراید تا ساعت ۱۴ امروز با باربری پیام شمس ارسال می‌شوند..."
              className="w-full p-3 rounded-xl border border-slate-300 text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 leading-relaxed"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
            {/* لینک اختیاری */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                لینک کلیک (اختیاری):
              </label>
              <input
                type="text"
                value={link}
                onChange={(e) => setLink(e.target.value)}
                placeholder="/catalog?category=ترمز"
                dir="ltr"
                className="w-full h-10 px-3 rounded-xl border border-slate-300 text-xs font-mono text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/30 text-left"
              />
            </div>

            {/* مخاطب */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                مخاطبان پیام:
              </label>
              <select
                value={target}
                onChange={(e) => setTarget(e.target.value as any)}
                className="w-full h-10 px-3 rounded-xl border border-slate-300 text-xs font-bold text-slate-800 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/30"
              >
                <option value="ALL">همه (صفحه اصلی، کاتالوگ و مشتریان)</option>
                <option value="CUSTOMER">فقط همکاران و خریداران لاگین شده</option>
                <option value="ADMIN">فقط مدیران سیستم</option>
              </select>
            </div>

            {/* وضعیت و دکمه ثبت */}
            <div className="flex items-center gap-3 pt-5">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="size-4 text-blue-600 rounded focus:ring-0"
                />
                <span className="text-xs font-bold text-slate-700">هم‌اکنون فعال باشد</span>
              </label>

              <button
                type="submit"
                disabled={busy}
                className="mr-auto h-10 px-5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-md transition-all active:scale-95 disabled:opacity-50"
              >
                {busy ? "در حال ثبت..." : "ثبت اطلاعیه"}
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* لیست اطلاعیه‌های موجود */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs space-y-3">
        <h2 className="text-sm font-black text-slate-800 pb-2 border-b border-slate-100 flex items-center justify-between">
          <span>📋 لیست پیام‌ها و اطلاعیه‌های ثبت‌شده</span>
          <span className="text-xs font-normal text-slate-500">
            برای ویرایش یا تغییر وضعیت هر پیام از دکمه‌های روبرو استفاده کنید
          </span>
        </h2>

        <div className="divide-y divide-slate-100">
          {items.map((item) => (
            <div
              key={item.id}
              className={`py-3.5 flex flex-col md:flex-row md:items-center justify-between gap-3 transition-colors ${
                !item.isActive ? "opacity-60 bg-slate-50/50" : ""
              }`}
            >
              <div className="space-y-1.5 flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span
                    className={`text-[10px] font-black px-2 py-0.5 rounded-md ${
                      item.level === "URGENT"
                        ? "bg-rose-100 text-rose-800 border border-rose-200"
                        : item.level === "WARNING"
                        ? "bg-amber-100 text-amber-800 border border-amber-200"
                        : item.level === "SUCCESS"
                        ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                        : "bg-blue-100 text-blue-800 border border-blue-200"
                    }`}
                  >
                    {item.title}
                  </span>

                  <span className="text-[10px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                    مخاطب: {item.target === "ALL" ? "عمومی" : item.target === "CUSTOMER" ? "خریداران" : "مدیران"}
                  </span>

                  {item.isActive ? (
                    <span className="text-[10px] font-black text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                      ● فعال در نوار
                    </span>
                  ) : (
                    <span className="text-[10px] font-bold text-slate-500 bg-slate-200 px-2 py-0.5 rounded">
                      خاموش
                    </span>
                  )}

                  {item.link && (
                    <span className="text-[10px] text-blue-600 font-mono" dir="ltr">
                      {item.link}
                    </span>
                  )}
                </div>

                {/* متن پیام — کاملاً قابل انتخاب با موس */}
                <p className="text-xs text-slate-800 leading-relaxed font-medium select-text selection:bg-amber-400 selection:text-slate-950">
                  {item.message}
                </p>
              </div>

              {/* اکشن‌ها */}
              <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
                <button
                  type="button"
                  onClick={() => handleToggle(item)}
                  className={`text-xs px-3 py-1.5 rounded-lg font-bold border transition ${
                    item.isActive
                      ? "border-amber-300 bg-amber-50 text-amber-800 hover:bg-amber-100"
                      : "border-emerald-300 bg-emerald-50 text-emerald-800 hover:bg-emerald-100"
                  }`}
                >
                  {item.isActive ? "غیرفعال کن" : "فعال کن"}
                </button>

                <button
                  type="button"
                  onClick={() => setEditingItem(item)}
                  className="text-xs px-3 py-1.5 rounded-lg font-bold border border-slate-300 bg-white hover:bg-slate-50 text-slate-700"
                >
                  ویرایش
                </button>

                <button
                  type="button"
                  onClick={() => handleDelete(item.id)}
                  className="text-xs px-2.5 py-1.5 rounded-lg font-bold text-rose-600 hover:bg-rose-50 transition"
                  title="حذف"
                >
                  🗑️
                </button>
              </div>
            </div>
          ))}

          {items.length === 0 && (
            <div className="py-8 text-center text-xs text-slate-400">
              هنوز اطلاعیه‌ای ثبت نشده است. از فرم بالا اولین اطلاعیه را اضافه کنید.
            </div>
          )}
        </div>
      </div>

      {/* مودال ویرایش اطلاعیه */}
      {editingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-3xl p-6 max-w-lg w-full shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-black text-sm text-slate-900">✏️ ویرایش اطلاعیه</h3>
              <button
                type="button"
                onClick={() => setEditingItem(null)}
                className="text-slate-400 hover:text-slate-700 text-lg"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  عنوان / برچسب:
                </label>
                <input
                  type="text"
                  value={editingItem.title}
                  onChange={(e) => setEditingItem({ ...editingItem, title: e.target.value })}
                  className="w-full h-10 px-3 rounded-xl border border-slate-300 text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  رنگ و سطح اهمیت:
                </label>
                <select
                  value={editingItem.level}
                  onChange={(e) => setEditingItem({ ...editingItem, level: e.target.value as any })}
                  className="w-full h-10 px-3 rounded-xl border border-slate-300 text-xs font-bold text-slate-900 focus:outline-none"
                >
                  <option value="INFO">🔵 اطلاع‌رسانی (آبی)</option>
                  <option value="SUCCESS">🟢 تخفیف و آفر (سبز)</option>
                  <option value="WARNING">🟡 نوسان بازار (نارنجی)</option>
                  <option value="URGENT">🔴 فوری و مهم (قرمز)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  متن پیام:
                </label>
                <textarea
                  rows={3}
                  value={editingItem.message}
                  onChange={(e) => setEditingItem({ ...editingItem, message: e.target.value })}
                  className="w-full p-3 rounded-xl border border-slate-300 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/30 leading-relaxed"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  لینک کلیک:
                </label>
                <input
                  type="text"
                  value={editingItem.link || ""}
                  onChange={(e) => setEditingItem({ ...editingItem, link: e.target.value })}
                  dir="ltr"
                  className="w-full h-10 px-3 rounded-xl border border-slate-300 text-xs font-mono text-slate-900 text-left"
                />
              </div>

              <div className="flex items-center justify-between pt-2">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={editingItem.isActive}
                    onChange={(e) => setEditingItem({ ...editingItem, isActive: e.target.checked })}
                    className="size-4 text-blue-600 rounded"
                  />
                  <span className="text-xs font-bold text-slate-700">فعال در نوار</span>
                </label>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setEditingItem(null)}
                    className="h-10 px-4 rounded-xl border border-slate-300 text-xs font-bold text-slate-700 hover:bg-slate-100"
                  >
                    انصراف
                  </button>
                  <button
                    type="submit"
                    disabled={busy}
                    className="h-10 px-5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-black shadow-md transition active:scale-95"
                  >
                    {busy ? "در حال ذخیره..." : "ذخیره تغییرات"}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
