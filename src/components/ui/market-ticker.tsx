"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";

export interface TickerItem {
  id: string;
  badge: string;
  text: string;
  link?: string | null;
  trend?: "up" | "down" | "hot" | "info";
}

const DEFAULT_ITEMS: TickerItem[] = [
  {
    id: "default-1",
    badge: "انبار مرکزی کرمان",
    text: "سفارش‌های ثبت‌شده تا ساعت ۱۴:۰۰ امروز با باربری‌های پیام شمس، پیشتاز و ناوگان کاردو ارسال می‌شوند.",
    trend: "info",
  },
  {
    id: "default-2",
    badge: "آفر ویژه همکار",
    text: "توزیع فیلترجات سرکان و لنت‌های ترمز پراید و پژو با قیمت مصوب قدیم و تخفیف نقدی آغاز شد.",
    trend: "hot",
    link: "/catalog?category=سیستم ترمز",
  },
  {
    id: "default-3",
    badge: "تثبیت قیمت‌ها",
    text: "نرخ دیسک و صفحه کلاچ والئو و دایکو در انبار تثبیت شد؛ ثبت پیش‌فاکتور با تضمین قیمت ۲۴ ساعته.",
    trend: "down",
    link: "/catalog?partBrand=والئو",
  },
  {
    id: "default-4",
    badge: "توزیع استان کرمان",
    text: "ارسال روزانه و پس‌کرایه به فروشگاه‌های لوازم یدکی رفسنجان، سیرجان، جیرفت، بم، زرند و کهنوج.",
    trend: "info",
  },
];

export function MarketTicker() {
  const [closed, setClosed] = useState(false);
  const [paused, setPaused] = useState(false);
  const [items, setItems] = useState<TickerItem[]>(DEFAULT_ITEMS);

  useEffect(() => {
    fetch("/api/announcements?target=ALL")
      .then((res) => res.json())
      .then((data) => {
        if (data.ok && Array.isArray(data.items) && data.items.length > 0) {
          const mapped: TickerItem[] = data.items.map((it: any) => {
            let trend: "up" | "down" | "hot" | "info" = "info";
            if (it.level === "URGENT") trend = "hot";
            else if (it.level === "WARNING") trend = "up";
            else if (it.level === "SUCCESS") trend = "down";

            return {
              id: it.id,
              badge: it.title,
              text: it.message,
              link: it.link,
              trend,
            };
          });
          setItems(mapped);
        }
      })
      .catch(() => {});
  }, []);

  if (closed || items.length === 0) return null;

  return (
    <div
      className="w-full bg-slate-950 text-slate-100 border-b border-slate-800/90 text-xs py-2 px-3 sm:px-6 relative overflow-hidden select-text"
      title="برای خواندن یا کپی کردن متن، ماوس را روی نوار نگه دارید"
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
        {/* نشانگر نبض زنده تابلوی اعلامات بورس قطعات */}
        <div className="flex items-center gap-2 shrink-0 z-10 bg-slate-950/95 pl-3 select-none">
          <span className="relative flex size-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
            <span className="relative inline-flex rounded-full size-2 bg-amber-500" />
          </span>
          <span className="font-black text-[11px] tracking-tight text-amber-400 whitespace-nowrap flex items-center gap-1">
            <span>نبض بازار کاردو</span>
            <span className="text-[10px] text-slate-500 font-normal">|</span>
          </span>
        </div>

        {/* نوار متحرک پیوسته اخبار بازار — با قابلیت توقف در هاور و انتخاب/کپی متن */}
        <div
          className="flex-1 overflow-hidden relative cursor-default"
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
        >
          <div
            className={`flex items-center gap-8 whitespace-nowrap select-text ${
              paused ? "animate-none" : "animate-marquee"
            }`}
            style={{
              animation: paused ? "none" : "marquee 35s linear infinite",
            }}
          >
            {/* ردیف اصلی */}
            {items.map((it) => (
              <TickerBadge key={it.id} item={it} />
            ))}
            {/* تکرار برای پیوستگی بی‌انتها */}
            {items.map((it) => (
              <TickerBadge key={`dup-${it.id}`} item={it} />
            ))}
          </div>
        </div>

        {/* دکمه بستن */}
        <button
          onClick={() => setClosed(true)}
          className="text-slate-500 hover:text-slate-300 transition-colors shrink-0 z-10 pr-1 text-xs select-none"
          title="بستن نوار اعلان"
        >
          ✕
        </button>
      </div>
    </div>
  );
}

function TickerBadge({ item }: { item: TickerItem }) {
  const content = (
    <div className="inline-flex items-center gap-2 group hover:text-amber-300 transition-colors select-text cursor-text">
      <span
        className={`text-[10px] font-black px-2 py-0.5 rounded-md select-none shrink-0 ${
          item.trend === "hot"
            ? "bg-rose-500/20 text-rose-300 border border-rose-500/40"
            : item.trend === "down"
            ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
            : item.trend === "up"
            ? "bg-amber-500/20 text-amber-300 border border-amber-500/40"
            : "bg-blue-500/20 text-blue-300 border border-blue-500/40"
        }`}
      >
        {item.badge}
      </span>
      <span className="text-slate-200 text-[11px] selection:bg-amber-500 selection:text-slate-950 font-medium">
        {item.text}
      </span>
    </div>
  );

  if (item.link) {
    return (
      <Link href={item.link} className="hover:underline">
        {content}
      </Link>
    );
  }

  return content;
}
