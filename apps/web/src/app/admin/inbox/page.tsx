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
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        {/* وظایف فعال کارگران */}
        <Card
          onClick={() => setActiveTab("tasks")}
          className={cn(
            "p-3.5 flex flex-col justify-between cursor-pointer transition-all duration-200 border",
            activeTab === "tasks"
              ? "border-primary bg-primary/5 ring-1 ring-primary/40 shadow-sm"
              : "hover:border-primary/40 hover:shadow-2xs",
          )}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground">وظایف فعال انبار</span>
            <div className="p-1.5 rounded-lg bg-primary/10 text-primary">
              <PackageCheck className="size-4" />
            </div>
          </div>
          <div className="mt-2.5 flex items-baseline justify-between">
            <div className="text-2xl font-black tracking-tight">{toFa(counts.tasksActive)}</div>
            {counts.tasksUrgent > 0 && (
              <span className="text-[11px] font-bold text-rose-600 flex items-center gap-0.5">
                <Flame className="size-3" />
                {toFa(counts.tasksUrgent)} فوری
              </span>
            )}
          </div>
          <p className="mt-1 text-[10px] text-muted-foreground">برداشت از قفسه و چیدن کالا</p>
        </Card>

        {/* عملیات نیازمند بازبینی مدیر */}
        <Card
          onClick={() => setActiveTab("operations")}
          className={cn(
            "p-3.5 flex flex-col justify-between cursor-pointer transition-all duration-200 border",
            activeTab === "operations"
              ? "border-amber-500 bg-amber-500/5 ring-1 ring-amber-500/40 shadow-sm"
              : "hover:border-amber-500/40 hover:shadow-2xs",
          )}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground">بازبینی عملیات</span>
            <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-600">
              <ShieldAlert className="size-4" />
            </div>
          </div>
          <div className="mt-2.5">
            <div className="text-2xl font-black text-amber-700 dark:text-amber-300 tracking-tight">
              {toFa(counts.ops)}
            </div>
          </div>
          <p className="mt-1 text-[10px] text-muted-foreground">تأیید کسری یا مازاد ثبتی کارگر</p>
        </Card>

        {/* گیت بارنامه‌های ورودی */}
        <Card
          onClick={() => setActiveTab("inbound")}
          className={cn(
            "p-3.5 flex flex-col justify-between cursor-pointer transition-all duration-200 border",
            activeTab === "inbound"
              ? "border-teal-500 bg-teal-500/5 ring-1 ring-teal-500/40 shadow-sm"
              : "hover:border-teal-500/40 hover:shadow-2xs",
          )}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground">گیت ورود بار (GRN)</span>
            <div className="p-1.5 rounded-lg bg-teal-500/10 text-teal-600">
              <Truck className="size-4" />
            </div>
          </div>
          <div className="mt-2.5">
            <div className="text-2xl font-black text-teal-700 dark:text-teal-300 tracking-tight">
              {toFa(counts.inboundPending)}
            </div>
          </div>
          <p className="mt-1 text-[10px] text-muted-foreground">محموله‌های منتظر تأیید و تخلیه</p>
        </Card>

        {/* درخواست‌های کالا */}
        <Card
          onClick={() => setActiveTab("requests")}
          className={cn(
            "p-3.5 flex flex-col justify-between cursor-pointer transition-all duration-200 border",
            activeTab === "requests"
              ? "border-blue-500 bg-blue-500/5 ring-1 ring-blue-500/40 shadow-sm"
              : "hover:border-blue-500/40 hover:shadow-2xs",
          )}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground">درخواست افزودن کالا</span>
            <div className="p-1.5 rounded-lg bg-blue-500/10 text-blue-600">
              <Boxes className="size-4" />
            </div>
          </div>
          <div className="mt-2.5">
            <div className="text-2xl font-black text-blue-700 dark:text-blue-300 tracking-tight">
              {toFa(counts.requests)}
            </div>
          </div>
          <p className="mt-1 text-[10px] text-muted-foreground">کالاهای ناموجود در کاتالوگ</p>
        </Card>

        {/* صف چاپ لیبل‌ها */}
        <Card
          onClick={() => setActiveTab("labels")}
          className={cn(
            "p-3.5 flex flex-col justify-between cursor-pointer transition-all duration-200 border",
            activeTab === "labels"
              ? "border-indigo-500 bg-indigo-500/5 ring-1 ring-indigo-500/40 shadow-sm"
              : "hover:border-indigo-500/40 hover:shadow-2xs",
          )}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground">چاپ لیبل و بارکد</span>
            <div className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-600">
              <Tag className="size-4" />
            </div>
          </div>
          <div className="mt-2.5">
            <div className="text-2xl font-black text-indigo-700 dark:text-indigo-300 tracking-tight">
              {toFa(counts.labels)}
            </div>
          </div>
          <p className="mt-1 text-[10px] text-muted-foreground">لیبل‌های قفسه و کالا در صف چاپ</p>
        </Card>
      </div>

      {/* ۲. تب‌های ناوبری کارتابل وظایف */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="h-10 p-1 bg-muted/70 border border-border/60 rounded-lg flex flex-wrap gap-1">
          <TabsTrigger value="tasks" className="gap-1.5 text-xs font-bold data-[state=active]:shadow-xs">
            <PackageCheck className="size-3.5 text-primary" />
            وظایف عملیاتی انبار
            <TabCount n={counts.tasksActive} urgent={counts.tasksUrgent > 0} />
          </TabsTrigger>

          <TabsTrigger value="operations" className="gap-1.5 text-xs font-bold data-[state=active]:shadow-xs">
            <ShieldAlert className="size-3.5 text-amber-600" />
            بازبینی عملیات کارگر
            <TabCount n={counts.ops} />
          </TabsTrigger>

          <TabsTrigger value="inbound" className="gap-1.5 text-xs font-bold data-[state=active]:shadow-xs">
            <Truck className="size-3.5 text-teal-600" />
            گیت ورود و بازرسی بار (GRN)
            <TabCount n={counts.inboundPending} />
          </TabsTrigger>

          <TabsTrigger value="requests" className="gap-1.5 text-xs font-bold data-[state=active]:shadow-xs">
            <Boxes className="size-3.5 text-blue-600" />
            درخواست کالا
            <TabCount n={counts.requests} />
          </TabsTrigger>

          <TabsTrigger value="labels" className="gap-1.5 text-xs font-bold data-[state=active]:shadow-xs">
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
