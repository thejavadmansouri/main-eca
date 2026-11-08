"use client";

/**
 * کارتابل جامع وظایف و کنترل جریان کار (Warehouse OS Inbox & Task Management Hub)
 *
 * نقطه مرکزی مدیریت و پایش تمام جریانات عملیاتی منتظر تصمیم و اجرا:
 * ۱. وظایف کاری کارگران (Work Tasks: برداشت کالا PICK و چیدن در قفسه PUTAWAY با اولویت فوری/عادی)
 * ۲. بازبینی عملیات‌های معلق انبارداری (تایید کسری یا مازاد ثبتی پرسنل)
 * ۳. گیت بازرسی و بارنامه‌های ورودی انبار (Inbound Goods Receipt Notes - GRN)
 * ۴. درخواست‌های ایجاد کالای جدید از طرف فروشندگان یا انبارداران
 * ۵. صف چاپ لیبل‌های بارکد قفسه و کالا
 */

import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Boxes,
  CheckCircle2,
  ClipboardCheck,
  Clock,
  Flame,
  HardHat,
  Inbox,
  Layers,
  Package,
  PackageCheck,
  Plus,
  Printer,
  RefreshCw,
  ShieldAlert,
  ShieldCheck,
  Tag,
  Truck,
  Users,
} from "lucide-react";

import {
  getPendingOperations,
  getProductRequests,
  getPendingLabels,
  getWorkTasks,
  getInboundReceipts,
} from "@/lib/api";
import { toFa } from "@/lib/format";
import { cn } from "@/lib/utils";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { ReviewPanel } from "../review/page";
import { ProductRequestsPanel } from "../product-requests/page";
import { LabelsPanel } from "../labels/page";
import { WorkTasksPanel } from "./work-tasks-panel";
import { InboundPanel } from "./inbound-panel";

/** شمارنده‌های زنده کارتابل */
function useInboxCounts() {
  const tasks = useQuery({
    queryKey: ["work-tasks-count"],
    queryFn: () => getWorkTasks(),
    refetchInterval: 5000,
  });

  const ops = useQuery({
    queryKey: ["pending-operations"],
    queryFn: () => getPendingOperations(),
    refetchInterval: 5000,
  });

  const requests = useQuery({
    queryKey: ["product-requests", "PENDING"],
    queryFn: () => getProductRequests("PENDING"),
    refetchInterval: 5000,
  });

  const labels = useQuery({
    queryKey: ["pending-labels-count"],
    queryFn: () => getPendingLabels({ limit: 300 }),
    refetchInterval: 5000,
  });

  const inbound = useQuery({
    queryKey: ["inbound-receipts-count"],
    queryFn: () => getInboundReceipts(),
    refetchInterval: 5000,
  });

  const allTasks = tasks.data ?? [];
  const activeTasks = allTasks.filter(
    (t) => t.status === "PENDING" || t.status === "IN_PROGRESS",
  );
  const urgentTasks = activeTasks.filter((t) => t.priority === "URGENT");

  const inboundPending = (inbound.data ?? []).filter(
    (r) => r.status === "PENDING_VERIFICATION",
  ).length;

  return {
    tasksActive: activeTasks.length,
    tasksUrgent: urgentTasks.length,
    tasksTotal: allTasks.length,
    ops: ops.data?.length ?? 0,
    requests: requests.data?.length ?? 0,
    labels: labels.data?.meta?.total ?? labels.data?.data?.length ?? 0,
    inboundPending,
    isLoading: tasks.isLoading || ops.isLoading || requests.isLoading,
  };
}

/** عددِ کنارِ عنوانِ تب */
function TabCount({
  n,
  variant = "destructive",
  urgent = false,
}: {
  n: number;
  variant?: "destructive" | "secondary" | "outline";
  urgent?: boolean;
}) {
  if (!n) return null;
  return (
    <Badge
      variant={variant}
      className={cn(
        "mr-1.5 tabular-nums text-[10px] h-4.5 px-1.5",
        urgent && "bg-rose-600 text-white animate-pulse",
      )}
    >
      {toFa(n)}
    </Badge>
  );
}

export default function InboxPage() {
  const counts = useInboxCounts();
  const [activeTab, setActiveTab] = React.useState<string>("tasks");

  return (
    <div className="flex flex-col gap-5 p-4 sm:p-6 transition-all select-none">
      <PageHeader
        title="کارتابل جامع وظایف و کنترل جریان کار"
        description="نقطه عطف مدیریت وظایف پرسنل، بازبینی عملیات انبارداری، گیت محموله‌های ورودی، درخواست‌های کالا و چاپ بارکدها"
        icon={ClipboardCheck}
        actions={
          <div className="flex items-center gap-2">
            {counts.tasksUrgent > 0 && (
              <Badge variant="destructive" className="gap-1 text-xs py-1 px-2.5 animate-pulse">
                <Flame className="size-3.5" />
                {toFa(counts.tasksUrgent)} وظیفه اضطراری در صف
              </Badge>
            )}
          </div>
        }
      />

      {/* ۱. کارت‌های شاخص عملکرد (KPI Stats Cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
        {/* وظایف فعال کارگران */}
        <div
          onClick={() => setActiveTab("tasks")}
          className={cn(
            "kardo-card-interactive p-4 flex flex-col justify-between cursor-pointer select-none rounded-2xl",
            activeTab === "tasks"
              ? "border-primary bg-gradient-to-br from-card via-card to-primary/10 ring-2 ring-primary/20 shadow-sm"
              : "bg-card border-border/80 hover:border-primary/40",
          )}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-muted-foreground">وظایف فعال انبار</span>
            <div className="p-2 rounded-xl bg-primary/10 text-primary shadow-2xs">
              <PackageCheck className="size-4.5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <div className="text-2xl font-black tracking-tight text-foreground">{toFa(counts.tasksActive)}</div>
            {counts.tasksUrgent > 0 && (
              <span className="text-[11px] font-bold text-rose-600 flex items-center gap-1 bg-rose-500/10 px-2 py-0.5 rounded-full border border-rose-500/20">
                <Flame className="size-3 text-rose-600 animate-pulse" />
                {toFa(counts.tasksUrgent)} فوری
              </span>
            )}
          </div>
          <p className="mt-1.5 text-[10px] text-muted-foreground pt-1 border-t border-border/40">برداشت از قفسه و چیدن کالا</p>
        </div>

        {/* عملیات نیازمند بازبینی مدیر */}
        <div
          onClick={() => setActiveTab("operations")}
          className={cn(
            "kardo-card-interactive p-4 flex flex-col justify-between cursor-pointer select-none rounded-2xl",
            activeTab === "operations"
              ? "border-amber-500 bg-gradient-to-br from-card via-card to-amber-500/10 ring-2 ring-amber-500/20 shadow-sm"
              : "bg-card border-border/80 hover:border-amber-500/40",
          )}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-muted-foreground">بازبینی عملیات</span>
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-600 shadow-2xs">
              <ShieldAlert className="size-4.5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-amber-600 dark:text-amber-400 tracking-tight">
              {toFa(counts.ops)}
            </div>
          </div>
          <p className="mt-1.5 text-[10px] text-muted-foreground pt-1 border-t border-border/40">تأیید کسری یا مازاد ثبتی کارگر</p>
        </div>

        {/* گیت بارنامه‌های ورودی */}
        <div
          onClick={() => setActiveTab("inbound")}
          className={cn(
            "kardo-card-interactive p-4 flex flex-col justify-between cursor-pointer select-none rounded-2xl",
            activeTab === "inbound"
              ? "border-teal-500 bg-gradient-to-br from-card via-card to-teal-500/10 ring-2 ring-teal-500/20 shadow-sm"
              : "bg-card border-border/80 hover:border-teal-500/40",
          )}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-muted-foreground">گیت ورود بار (GRN)</span>
            <div className="p-2 rounded-xl bg-teal-500/10 text-teal-600 shadow-2xs">
              <Truck className="size-4.5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-teal-600 dark:text-teal-400 tracking-tight">
              {toFa(counts.inboundPending)}
            </div>
          </div>
          <p className="mt-1.5 text-[10px] text-muted-foreground pt-1 border-t border-border/40">محموله‌های منتظر تأیید و تخلیه</p>
        </div>

        {/* درخواست‌های کالا */}
        <div
          onClick={() => setActiveTab("requests")}
          className={cn(
            "kardo-card-interactive p-4 flex flex-col justify-between cursor-pointer select-none rounded-2xl",
            activeTab === "requests"
              ? "border-blue-500 bg-gradient-to-br from-card via-card to-blue-500/10 ring-2 ring-blue-500/20 shadow-sm"
              : "bg-card border-border/80 hover:border-blue-500/40",
          )}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-muted-foreground">درخواست کالا</span>
            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-600 shadow-2xs">
              <Boxes className="size-4.5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-blue-600 dark:text-blue-400 tracking-tight">
              {toFa(counts.requests)}
            </div>
          </div>
          <p className="mt-1.5 text-[10px] text-muted-foreground pt-1 border-t border-border/40">کالاهای ناموجود در کاتالوگ</p>
        </div>

        {/* صف چاپ لیبل‌ها */}
        <div
          onClick={() => setActiveTab("labels")}
          className={cn(
            "kardo-card-interactive p-4 flex flex-col justify-between cursor-pointer select-none rounded-2xl",
            activeTab === "labels"
              ? "border-indigo-500 bg-gradient-to-br from-card via-card to-indigo-500/10 ring-2 ring-indigo-500/20 shadow-sm"
              : "bg-card border-border/80 hover:border-indigo-500/40",
          )}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-muted-foreground">چاپ لیبل و بارکد</span>
            <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-600 shadow-2xs">
              <Tag className="size-4.5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-indigo-600 dark:text-indigo-400 tracking-tight">
              {toFa(counts.labels)}
            </div>
          </div>
          <p className="mt-1.5 text-[10px] text-muted-foreground pt-1 border-t border-border/40">لیبل‌های قفسه و کالا در صف چاپ</p>
        </div>
      </div>

      {/* ۲. تب‌های ناوبری کارتابل وظایف */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="h-11 p-1.5 bg-muted/70 backdrop-blur-xs border border-border/70 rounded-2xl flex flex-wrap gap-1.5 shadow-2xs">
          <TabsTrigger value="tasks" className="gap-2 text-xs font-bold rounded-xl data-[state=active]:shadow-xs transition-all">
            <PackageCheck className="size-3.5 text-primary" />
            وظایف عملیاتی انبار
            <TabCount n={counts.tasksActive} urgent={counts.tasksUrgent > 0} />
          </TabsTrigger>

          <TabsTrigger value="operations" className="gap-2 text-xs font-bold rounded-xl data-[state=active]:shadow-xs transition-all">
            <ShieldAlert className="size-3.5 text-amber-600" />
            بازبینی عملیات کارگر
            <TabCount n={counts.ops} />
          </TabsTrigger>

          <TabsTrigger value="inbound" className="gap-2 text-xs font-bold rounded-xl data-[state=active]:shadow-xs transition-all">
            <Truck className="size-3.5 text-teal-600" />
            گیت ورود و بازرسی بار (GRN)
            <TabCount n={counts.inboundPending} />
          </TabsTrigger>

          <TabsTrigger value="requests" className="gap-2 text-xs font-bold rounded-xl data-[state=active]:shadow-xs transition-all">
            <Boxes className="size-3.5 text-blue-600" />
            درخواست کالا
            <TabCount n={counts.requests} />
          </TabsTrigger>

          <TabsTrigger value="labels" className="gap-2 text-xs font-bold rounded-xl data-[state=active]:shadow-xs transition-all">
            <Printer className="size-3.5 text-indigo-600" />
            چاپ لیبل‌ها
            <TabCount n={counts.labels} />
          </TabsTrigger>
        </TabsList>

        {/* محتوای تب ۱: وظایف عملیاتی انبار */}
        <TabsContent value="tasks" className="mt-4">
          <WorkTasksPanel embedded />
        </TabsContent>

        {/* محتوای تب ۲: بازبینی عملیات */}
        <TabsContent value="operations" className="mt-4">
          <ReviewPanel embedded />
        </TabsContent>

        {/* محتوای تب ۳: گیت ورود بار */}
        <TabsContent value="inbound" className="mt-4">
          <InboundPanel embedded />
        </TabsContent>

        {/* محتوای تب ۴: درخواست کالا */}
        <TabsContent value="requests" className="mt-4">
          <ProductRequestsPanel embedded />
        </TabsContent>

        {/* محتوای تب ۵: لیبل‌ها */}
        <TabsContent value="labels" className="mt-4">
          <LabelsPanel embedded />
        </TabsContent>
      </Tabs>
    </div>
  );
}
