"use client";

import * as React from "react";
import Link from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import {
  Route,
  Search,
  PackageCheck,
  Scissors,
  Truck,
  CheckCircle2,
  Clock,
  ArrowRight,
  ExternalLink,
  Share2,
  Calendar,
  UserCheck,
  Percent,
  TrendingUp,
  AlertCircle,
  Eye,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getWoodOrders, getInstallationOrders } from "@/lib/api";
import { faDate, toFa } from "@/lib/format";

const STAGE_CONFIG: Record<string, { label: string; color: string; step: number }> = {
  CUTTING: { label: "ایستگاه برش", color: "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-200", step: 1 },
  EDGE_BANDING: { label: "لبه‌چسبان PVC", color: "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-200", step: 2 },
  CNC: { label: "ماشین‌کاری CNC", color: "bg-purple-500/10 text-purple-700 dark:text-purple-400 border-purple-200", step: 3 },
  ASSEMBLY: { label: "مونتاژ و یراق", color: "bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 border-indigo-200", step: 4 },
  FINISHING: { label: "رنگ و پرداخت", color: "bg-pink-500/10 text-pink-700 dark:text-pink-400 border-pink-200", step: 5 },
  QC_PACKING: { label: "کنترل کیفی و بسته‌بندی", color: "bg-teal-500/10 text-teal-700 dark:text-teal-400 border-teal-200", step: 6 },
  READY_TO_INSTALL: { label: "آماده اعزام و نصب", color: "bg-cyan-500/10 text-cyan-700 dark:text-cyan-400 border-cyan-200", step: 7 },
  INSTALLED: { label: "تحویل و نصب نهایی", color: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-200", step: 8 },
};

export default function OrderTrackingJourneyPage() {
  const [search, setSearch] = React.useState("");
  const [activeFilter, setActiveFilter] = React.useState<"ALL" | "IN_PROGRESS" | "READY" | "COMPLETED">("ALL");

  const { data: woodOrders = [], isLoading: isLoadingWood } = useQuery({
    queryKey: ["all-wood-orders"],
    queryFn: () => getWoodOrders(),
  });

  const { data: installations = [], isLoading: isLoadingInst } = useQuery({
    queryKey: ["all-installations"],
    queryFn: () => getInstallationOrders(),
  });

  const filteredOrders = React.useMemo(() => {
    let result = woodOrders;
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      result = result.filter(
        (o) =>
          o.code.toLowerCase().includes(q) ||
          (o.customerName && o.customerName.toLowerCase().includes(q)) ||
          (o.projectTitle && o.projectTitle.toLowerCase().includes(q))
      );
    }

    if (activeFilter === "IN_PROGRESS") {
      result = result.filter((o) => o.currentStage !== "INSTALLED" && o.currentStage !== "READY_TO_INSTALL");
    } else if (activeFilter === "READY") {
      result = result.filter((o) => o.currentStage === "READY_TO_INSTALL");
    } else if (activeFilter === "COMPLETED") {
      result = result.filter((o) => o.currentStage === "INSTALLED" || o.status === "COMPLETED");
    }

    return result;
  }, [woodOrders, search, activeFilter]);

  // آمار کلیدی
  const totalCount = woodOrders.length;
  const inProgressCount = woodOrders.filter((o) => o.currentStage !== "INSTALLED").length;
  const readyCount = woodOrders.filter((o) => o.currentStage === "READY_TO_INSTALL").length;
  const completedCount = woodOrders.filter((o) => o.currentStage === "INSTALLED").length;

  return (
    <div className="space-y-5 p-4 md:p-6">
      {/* سربرگ صفحه */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b pb-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight md:text-2xl flex items-center gap-2">
            <Route className="h-6 w-6 text-primary" />
            مرکز پیگیری سفارشات و سیر تحویل پروژه
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            ردیابی چندمرحله‌ای سفارش از سفارش‌گذاری تا تولید کارگاهی، بارگیری ناوگان و نصب نهایی در محل کارفرما
          </p>
        </div>
      </div>

      {/* کارت‌های KPI */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="flex items-center gap-3 p-4">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-500/10 text-blue-600">
            <Scissors className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground font-medium">سفارشات در خط ساخت</p>
            <p className="text-xl font-black text-foreground">{toFa(inProgressCount)}</p>
          </div>
        </Card>

        <Card className="flex items-center gap-3 p-4">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-cyan-500/10 text-cyan-600">
            <Truck className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground font-medium">آماده بارگیری و اعزام</p>
            <p className="text-xl font-black text-foreground">{toFa(readyCount)}</p>
          </div>
        </Card>

        <Card className="flex items-center gap-3 p-4">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600">
            <CheckCircle2 className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground font-medium">نصب و تحویل شده</p>
            <p className="text-xl font-black text-foreground">{toFa(completedCount)}</p>
          </div>
        </Card>

        <Card className="flex items-center gap-3 p-4">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-purple-500/10 text-purple-600">
            <Percent className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground font-medium">کل سفارشات سیستمی</p>
            <p className="text-xl font-black text-foreground">{toFa(totalCount)}</p>
          </div>
        </Card>
      </div>

      {/* فیلترها و جستجو */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-1 rounded-lg border bg-muted/30 p-1">
          {(
            [
              ["ALL", "همه سفارشات"],
              ["IN_PROGRESS", "در حال ساخت"],
              ["READY", "آماده اعزام"],
              ["COMPLETED", "تحویل‌شده"],
            ] as const
          ).map(([key, label]) => (
            <button
              key={key}
              type="button"
              onClick={() => setActiveFilter(key)}
              className={`rounded-md px-3 py-1.5 text-xs font-semibold transition-colors ${
                activeFilter === key
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="relative w-full max-w-xs">
          <Search className="absolute right-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="جستجوی کد پروژه، نام کارفرما..."
            className="pr-9 text-xs"
          />
        </div>
      </div>

      {/* لیست سفارشات و نوار پیشرفت سفری */}
      {isLoadingWood ? (
        <div className="flex h-48 items-center justify-center text-sm text-muted-foreground">
          در حال بارگذاری جریان سفارشات...
        </div>
      ) : filteredOrders.length === 0 ? (
        <Card className="flex flex-col items-center justify-center p-12 text-center text-muted-foreground">
          <Route className="mb-3 h-12 w-12 opacity-30" />
          <p className="text-sm font-semibold">سفارشی با این مشخصات یافت نشد.</p>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredOrders.map((order) => {
            const stageMeta = STAGE_CONFIG[order.currentStage] || {
              label: order.currentStage,
              color: "bg-muted text-muted-foreground",
              step: 1,
            };
            const percent = Math.min(100, Math.max(0, order.progressPercent || 0));

            return (
              <Card key={order.id} className="p-4 shadow-sm transition hover:shadow-md">
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-xs font-bold text-primary">{order.code}</span>
                      <h3 className="font-bold text-foreground text-sm">
                        {order.projectTitle || "سفارش تولید"}
                      </h3>
                      <span className={`rounded-md border px-2 py-0.5 text-xs font-semibold ${stageMeta.color}`}>
                        {stageMeta.label}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                      <span>کارفرما: <strong className="text-foreground">{order.customerName || "ثبت نشده"}</strong></span>
                      {order.assignedInstaller && (
                        <span className="flex items-center gap-1">
                          <UserCheck className="h-3.5 w-3.5 text-emerald-600" />
                          نصاب: {order.assignedInstaller}
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3.5 w-3.5" />
                        {faDate(order.createdAt)}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {order.trackingToken && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => window.open(`/track/${order.trackingToken}`, "_blank")}
                        className="gap-1.5 text-xs"
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                        صفحه رهگیری عمومی
                      </Button>
                    )}
                  </div>
                </div>

                {/* پیشرفت چندمرحله‌ای بصری */}
                <div className="mt-3.5 rounded-lg bg-muted/40 p-3">
                  <div className="mb-2 flex items-center justify-between text-xs">
                    <span className="font-medium">پیشرفت کلی پروژه:</span>
                    <span className="font-mono font-bold text-primary">{toFa(percent)}٪</span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-blue-500 via-indigo-500 to-emerald-500 transition-all duration-500"
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
