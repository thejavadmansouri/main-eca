"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import {
  Boxes,
  ClipboardList,
  Files,
  HandCoins,
  PackagePlus,
  Package,
  Settings,
  ShoppingCart,
  Users,
  BarChart3,
  TrendingUp,
  Receipt,
  Wallet,
  ShieldAlert,
  ArrowUpRight,
  Search,
  Sparkles,
  type LucideIcon,
} from "lucide-react";

import { useAuthStore } from "@/lib/auth-store";
import { toFa, money, faDate, ROLE_LABELS } from "@/lib/format";
import type { Role } from "@/lib/types";
import { getPeriodicSales, getPeriodicProfit, getChequesReport } from "@/lib/api";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface Tile {
  title: string;
  hint: string;
  href: string;
  icon: LucideIcon;
  badge?: string;
  roles: Role[];
}

const TILES: Tile[] = [
  {
    title: "صندوق فروش (POS)",
    hint: "صدور سریع فاکتور با بارکدخوان",
    href: "/admin/pos",
    icon: ShoppingCart,
    badge: "F2",
    roles: ["ADMIN", "MANAGER", "SALES"],
  },
  {
    title: "فاکتور خرید و ورود کالا",
    hint: "ثبت فاکتورهای خرید از تأمین‌کننده",
    href: "/admin/purchases",
    icon: PackagePlus,
    roles: ["ADMIN", "MANAGER"],
  },
  {
    title: "دریافت وجه و تسویه",
    hint: "ثبت دریافتی، نقد، پوز و تسویه",
    href: "/admin/receipts",
    icon: HandCoins,
    roles: ["ADMIN", "MANAGER"],
  },
  {
    title: "مشتریان و حساب‌ها",
    hint: "سوابق، بدهی و اعتبارات مشتریان",
    href: "/admin/customers",
    icon: Users,
    roles: ["ADMIN", "MANAGER", "SALES"],
  },
  {
    title: "دفتر اسناد و فاکتورها",
    hint: "فروش، پیش‌فاکتور، مرجوعی و حواله",
    href: "/admin/documents",
    icon: Files,
    roles: ["ADMIN", "MANAGER", "SALES"],
  },
  {
    title: "گزارشات سود و زیان",
    hint: "تحلیل مالی، حاشیه سود و نمودارها",
    href: "/admin/reports",
    icon: BarChart3,
    roles: ["ADMIN", "MANAGER"],
  },
  {
    title: "کاتالوگ و کاردکس کالا",
    hint: "کالاها، بارکدها و سوابق قیمتی",
    href: "/admin/products",
    icon: Package,
    roles: ["ADMIN", "MANAGER", "STAFF"],
  },
  {
    title: "موجودی و قفسه‌بندی (WMS)",
    hint: "مکان‌یابی فیزیکی در راهرو و قفسه",
    href: "/admin/inventory",
    icon: Boxes,
    roles: ["ADMIN", "MANAGER", "STAFF"],
  },
  {
    title: "تنظیمات و کاربران",
    hint: "مدیریت دسترسی‌ها و پشتیبان‌گیری",
    href: "/admin/settings",
    icon: Settings,
    roles: ["ADMIN"],
  },
];

export default function AdminHome() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const role = user?.role;
  const isManager = role === "ADMIN" || role === "MANAGER";

  const tiles = React.useMemo(
    () => (role ? TILES.filter((t) => t.roles.includes(role)) : []),
    [role],
  );

  const [activeTile, setActiveTile] = React.useState(0);

  const range = React.useMemo(() => {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const end = new Date();
    end.setHours(23, 59, 59, 999);
    return {
      startDate: start.toISOString(),
      endDate: end.toISOString(),
    };
  }, []);

  // دریافت اعداد واقعی بیزینس از سرور (بدون هیچ رقم ساختگی)
  const salesQuery = useQuery({
    queryKey: ["dashboard-sales", range],
    queryFn: () => getPeriodicSales(range),
    enabled: isManager,
  });

  const profitQuery = useQuery({
    queryKey: ["dashboard-profit", range],
    queryFn: () => getPeriodicProfit(range),
    enabled: isManager,
  });

  const chequesQuery = useQuery({
    queryKey: ["dashboard-cheques"],
    queryFn: () => getChequesReport({ status: "0", limit: 5 }), // چک‌های در جریان وصول
    enabled: isManager,
  });

  // پشتیبانی کامل از کلیدهای عددی ۱ تا ۹ برای سرعت کاربران
  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      // اگر داخل اینپوت هستیم کلیدها عمل نکنند
      if (
        document.activeElement?.tagName === "INPUT" ||
        document.activeElement?.tagName === "TEXTAREA"
      ) {
        return;
      }

      const n = Number(e.key);
      if (n >= 1 && n <= 9 && tiles[n - 1]) {
        e.preventDefault();
        router.push(tiles[n - 1].href);
        return;
      }
    };

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [tiles, router]);

  const salesData = salesQuery.data?.summary;
  const profitData = profitQuery.data?.summary;
  const chequesData = chequesQuery.data;

  return (
    <div className="flex min-h-[calc(100vh-4.5rem)] flex-col gap-4 font-sans" dir="rtl">
      {/* نوار بالایی خوش‌آمدگویی و مشخصات سازمانی */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border/80 bg-surface px-4 py-3 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary font-bold">
            <Sparkles className="size-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-bold text-foreground">
                خوش آمدید، {user?.fullName || "کاربر گرامی"}
              </h1>
              <span className="rounded-md bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
                {role ? ROLE_LABELS[role] : ""}
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              پلتفرم سازمانی کاردو ERP • برای دسترسی فوق‌سریع کلیدهای عددی ۱ تا ۹ را بفشارید.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              const event = new KeyboardEvent("keydown", {
                key: "k",
                ctrlKey: true,
                bubbles: true,
              });
              document.dispatchEvent(event);
            }}
            className="h-8 gap-1.5 text-xs text-muted-foreground hover:text-foreground"
          >
            <Search className="size-3.5" />
            <span>فرمان‌های هوشمند</span>
            <kbd className="rounded border bg-muted px-1 text-[10px]">Ctrl+K</kbd>
          </Button>

          <Button
            size="sm"
            onClick={() => router.push("/admin/pos")}
            className="h-8 gap-1.5 text-xs bg-primary text-primary-foreground font-semibold shadow-xs"
          >
            <ShoppingCart className="size-3.5" />
            <span>صندوق فروش (F2)</span>
          </Button>
        </div>
      </div>

      {/* نوارهای شاخص‌های عملکرد واقعی (KPI Cards) — فقط برای مدیران و حسابداران */}
      {isManager && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* کارت فروش خالص */}
          <div className="rounded-lg border border-border/80 bg-surface p-3.5 shadow-xs transition-shadow hover:shadow-sm">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-xs font-medium">فروش خالص امروز / دوره</span>
              <div className="flex size-7 items-center justify-center rounded-md bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-400">
                <Receipt className="size-4" />
              </div>
            </div>
            <div className="mt-2 flex items-baseline justify-between">
              <span className="text-lg font-bold text-foreground">
                {salesData ? money(salesData.netAmount) : "—"}
              </span>
              <span className="text-xs text-muted-foreground font-normal">تومان</span>
            </div>
            <div className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
              <span>تعداد فاکتورها:</span>
              <span className="font-semibold text-foreground">
                {salesData ? toFa(salesData.invoiceCount) : "۰"}
              </span>
            </div>
          </div>

          {/* کارت سود ناخالص عملیاتی */}
          <div className="rounded-lg border border-border/80 bg-surface p-3.5 shadow-xs transition-shadow hover:shadow-sm">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-xs font-medium">سود عملیاتی ناخالص</span>
              <div className="flex size-7 items-center justify-center rounded-md bg-emerald-50 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400">
                <TrendingUp className="size-4" />
              </div>
            </div>
            <div className="mt-2 flex items-baseline justify-between">
              <span className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
                {profitData ? money(profitData.totalProfit) : "—"}
              </span>
              <span className="text-xs text-muted-foreground font-normal">تومان</span>
            </div>
            <div className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
              <span>حاشیه سود:</span>
              <span className="font-semibold text-foreground">
                {profitData ? `${toFa(profitData.profitMarginPercent.toFixed(1))}٪` : "—"}
              </span>
            </div>
          </div>

          {/* کارت چک‌های صیادی نزد صندوق */}
          <div className="rounded-lg border border-border/80 bg-surface p-3.5 shadow-xs transition-shadow hover:shadow-sm">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-xs font-medium">چک‌های در جریان وصول</span>
              <div className="flex size-7 items-center justify-center rounded-md bg-amber-50 text-amber-600 dark:bg-amber-950 dark:text-amber-400">
                <Wallet className="size-4" />
              </div>
            </div>
            <div className="mt-2 flex items-baseline justify-between">
              <span className="text-lg font-bold text-foreground">
                {chequesData ? money(chequesData.summary.totalAmount) : "—"}
              </span>
              <span className="text-xs text-muted-foreground font-normal">تومان</span>
            </div>
            <div className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
              <span>تعداد برگه چک:</span>
              <span className="font-semibold text-foreground">
                {chequesData ? toFa(chequesData.summary.totalCount) : "۰"}
              </span>
            </div>
          </div>

          {/* کارت مرجوعی‌ها و کنترل ریسک */}
          <div className="rounded-lg border border-border/80 bg-surface p-3.5 shadow-xs transition-shadow hover:shadow-sm">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-xs font-medium">مرجوعی‌های دوره</span>
              <div className="flex size-7 items-center justify-center rounded-md bg-rose-50 text-rose-600 dark:bg-rose-950 dark:text-rose-400">
                <ShieldAlert className="size-4" />
              </div>
            </div>
            <div className="mt-2 flex items-baseline justify-between">
              <span className="text-lg font-bold text-foreground">
                {salesData ? money(salesData.returnsAmount) : "—"}
              </span>
              <span className="text-xs text-muted-foreground font-normal">تومان</span>
            </div>
            <div className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
              <span>تعداد اسناد برگشتی:</span>
              <span className="font-semibold text-foreground">
                {salesData ? toFa(salesData.returnCount) : "۰"}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* تخته دسترسی فوق‌سریع به ماژول‌های اصلی (Enterprise Fast Launchpad) */}
      <div className="space-y-2">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            تخته دسترسی سریع به ماژول‌ها (کلیدهای عددی کیبورد ۱ تا ۹)
          </h2>
          <span className="text-[11px] text-muted-foreground">جهت باز کردن هر ماژول کلیک کنید</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
          {tiles.map((t, i) => (
            <button
              key={t.href}
              type="button"
              onClick={() => router.push(t.href)}
              className="group relative flex items-center justify-between rounded-lg border border-border/80 bg-surface p-3 text-start transition-all hover:border-primary/50 hover:bg-muted/40 hover:shadow-xs focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <div className="flex items-center gap-3">
                <div className="flex size-9 items-center justify-center rounded-md bg-muted text-foreground transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                  <t.icon className="size-4.5" />
                </div>
                <div>
                  <div className="text-xs font-bold text-foreground group-hover:text-primary transition-colors">
                    {t.title}
                  </div>
                  <div className="text-[11px] text-muted-foreground line-clamp-1">
                    {t.hint}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                {t.badge && (
                  <span className="rounded bg-primary/10 px-1.5 py-0.5 text-[10px] font-bold text-primary">
                    {t.badge}
                  </span>
                )}
                {i < 9 && (
                  <kbd className="flex size-5 items-center justify-center rounded border border-border bg-background text-[11px] font-bold tabular-nums text-muted-foreground group-hover:border-primary/40 group-hover:text-foreground">
                    {toFa(i + 1)}
                  </kbd>
                )}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* جدول فاکتورهای اخیر فروش (Live Document Stream) — فقط برای مدیران */}
      {isManager && salesQuery.data?.invoices?.data && (
        <div className="rounded-lg border border-border/80 bg-surface p-4 shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Receipt className="size-4 text-primary" />
              <h3 className="text-xs font-bold text-foreground">
                آخرین فاکتورهای فروش ثبت‌شده
              </h3>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push("/admin/documents")}
              className="h-7 text-xs text-primary hover:text-primary"
            >
              <span>مشاهده همه اسناد</span>
              <ArrowUpRight className="size-3.5 mr-1" />
            </Button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border/80 text-muted-foreground text-right">
                  <th className="pb-2 font-semibold">شماره فاکتور</th>
                  <th className="pb-2 font-semibold">مشتری</th>
                  <th className="pb-2 font-semibold">ثبت‌کننده</th>
                  <th className="pb-2 font-semibold text-end">مبلغ کل (تومان)</th>
                  <th className="pb-2 font-semibold text-end">زمان</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {salesQuery.data.invoices.data.slice(0, 5).map((inv) => (
                  <tr
                    key={inv.id}
                    onClick={() => router.push("/admin/documents")}
                    className="cursor-pointer hover:bg-muted/40 transition-colors"
                  >
                    <td className="py-2.5 font-bold text-foreground">
                      #{toFa(inv.number)}
                    </td>
                    <td className="py-2.5 text-foreground">
                      {inv.customerName || "مشتری متفرقه / نقدی"}
                    </td>
                    <td className="py-2.5 text-muted-foreground">
                      {inv.sellerName || "—"}
                    </td>
                    <td className="py-2.5 font-bold text-end tabular-nums text-foreground">
                      {money(inv.amount)}
                    </td>
                    <td className="py-2.5 text-end text-muted-foreground tabular-nums">
                      {faDate(inv.createdAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
