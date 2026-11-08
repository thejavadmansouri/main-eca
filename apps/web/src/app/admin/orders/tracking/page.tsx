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
  Camera,
  MessageSquare,
  Coins,
  Send,
  Phone,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { getWoodOrders, getInstallationOrders } from "@/lib/api";
import { faDate, money, toFa } from "@/lib/format";
import { ProjectJourneyDetailDialog } from "./_components/project-journey-detail-dialog";
import { SendToCustomerDialog } from "./_components/send-to-customer-dialog";

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
  const [selectedOrderId, setSelectedOrderId] = React.useState<string | null>(null);
  const [sendOrder, setSendOrder] = React.useState<any | null>(null);

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
            const photoCount = order.stageUpdates?.reduce((sum: number, u: any) => sum + (u.photos?.length || 0), 0) || 0;
            const notesCount = order.stageUpdates?.length || 0;

            return (
              <Card
                key={order.id}
                onClick={() => setSelectedOrderId(order.id)}
                className="group p-4 shadow-2xs transition-all hover:shadow-md hover:border-primary/50 cursor-pointer rounded-2xl border-border/80"
              >
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div className="space-y-1.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-xs font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-lg border border-primary/20">
                        {order.code}
                      </span>
                      <h3 className="font-black text-foreground text-sm group-hover:text-primary transition-colors">
                        {order.projectTitle || "سفارش تولید"}
                      </h3>
                      <Badge variant="outline" className={`text-xs font-bold ${stageMeta.color}`}>
                        {stageMeta.label}
                      </Badge>

                      {photoCount > 0 && (
                        <Badge variant="outline" className="text-[11px] font-bold bg-emerald-50 text-emerald-700 border-emerald-300 gap-1">
                          <Camera className="size-3" />
                          {toFa(photoCount)} عکس
                        </Badge>
                      )}

                      {notesCount > 0 && (
                        <Badge variant="outline" className="text-[11px] font-bold bg-blue-50 text-blue-700 border-blue-300 gap-1">
                          <MessageSquare className="size-3" />
                          {toFa(notesCount)} نوت کارگر
                        </Badge>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                      <span>کارفرما: <strong className="text-foreground">{order.customerName || "ثبت نشده"}</strong></span>
                      {order.customerPhone && (
                        <span className="font-mono text-muted-foreground">({order.customerPhone})</span>
                      )}
                      {order.assignedInstaller && (
                        <span className="flex items-center gap-1 font-semibold text-emerald-700">
                          <UserCheck className="size-3.5" />
                          نصاب: {order.assignedInstaller}
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <Calendar className="size-3.5" />
                        ثبت: {faDate(order.createdAt)}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end md:self-center shrink-0">
                    <Button
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedOrderId(order.id);
                      }}
                      className="gap-1.5 text-xs font-bold rounded-xl shadow-xs h-8"
                    >
                      <Eye className="size-3.5" />
                      مشاهده پرونده و عکس‌ها
                    </Button>

                    <Button
                      size="sm"
                      variant="outline"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSendOrder(order);
                      }}
                      className="gap-1.5 text-xs font-bold rounded-xl h-8 border-primary/30 text-primary hover:bg-primary/10"
                    >
                      <Share2 className="size-3.5" />
                      ارسال به مشتری
                    </Button>

                    {order.trackingToken && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={(e) => {
                          e.stopPropagation();
                          window.open(`/track/${order.trackingToken}`, "_blank");
                        }}
                        className="gap-1 text-xs h-8 text-muted-foreground hover:text-foreground"
                        title="مشاهده صفحه رهگیری زنده"
                      >
                        <ExternalLink className="size-3.5" />
                      </Button>
                    )}
                  </div>
                </div>

                {/* پیشرفت چندمرحله‌ای بصری */}
                <div className="mt-3.5 rounded-xl bg-muted/40 p-3 border border-border/50">
                  <div className="mb-2 flex items-center justify-between text-xs">
                    <span className="font-semibold text-foreground">پیشرفت فیزیکی کارگاه:</span>
                    <span className="font-mono font-black text-primary text-sm">{toFa(percent)}٪</span>
                  </div>
                  <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
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

      {/* مودال جامع سیر پرونده و یادداشت‌های کارگران */}
      <ProjectJourneyDetailDialog
        open={Boolean(selectedOrderId)}
        onOpenChange={(op) => !op && setSelectedOrderId(null)}
        orderId={selectedOrderId}
        onOpenSendToCustomer={(ord) => setSendOrder(ord)}
      />

      {/* مودال ارسال پیامک و لینک رهگیری به کارفرما */}
      <SendToCustomerDialog
        open={Boolean(sendOrder)}
        onOpenChange={(op) => !op && setSendOrder(null)}
        order={sendOrder}
      />
    </div>
  );
}
