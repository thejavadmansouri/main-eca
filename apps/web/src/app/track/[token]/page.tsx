"use client";

import * as React from "react";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import {
  Scissors,
  Layers,
  Wrench,
  Sparkles,
  PackageCheck,
  Truck,
  CheckCircle2,
  Clock,
  Calendar,
  UserCheck,
  Phone,
  MapPin,
  ShieldCheck,
  RefreshCw,
  Building,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getPublicTracking } from "@/lib/api";
import { faDate, toFa } from "@/lib/format";

const STAGES = [
  { key: "CUTTING", label: "ایستگاه برش", icon: Scissors, desc: "برش دقیق ورق‌های MDF بر اساس نقشه بهینه‌ساز" },
  { key: "EDGE_BANDING", label: "نوار لبه PVC", icon: Layers, desc: "نوارکاری لبه‌های قطعات با چسب ضدآب حرارتی" },
  { key: "CNC", label: "ماشین‌کاری CNC", icon: Wrench, desc: "سوراخ‌کاری، حکاکی و جای یراق‌آلات پیشرفته" },
  { key: "ASSEMBLY", label: "مونتاژ و یراق", icon: Layers, desc: "سرهم‌بندی اسکلت، نصب ریل‌ها و اتصالات" },
  { key: "FINISHING", label: "رنگ و پرداخت", icon: Sparkles, desc: "سنباده، آستر، رنگ‌پاشی و تثبیت پولیش" },
  { key: "QC_PACKING", label: "کنترل کیفی و بسته‌بندی", icon: PackageCheck, desc: "بازرسی نهایی ابعاد و بسته‌بندی حباب‌دار صنعتی" },
  { key: "READY_TO_INSTALL", label: "اعزام و حمل بار", icon: Truck, desc: "بارگیری در خودرو مخصوص و حرکت به سمت پروژه" },
  { key: "INSTALLED", label: "نصب و تحویل نهایی", icon: CheckCircle2, desc: "نصب کامل در محل کارفرما و اخذ تاییدیه رضایت" },
];

export default function PublicProjectTrackingPage() {
  const params = useParams();
  const token = params.token as string;

  const { data: order, isLoading, error, refetch, isFetching } = useQuery({
    queryKey: ["public-tracking", token],
    queryFn: () => getPublicTracking(token),
    enabled: Boolean(token),
    refetchInterval: 30000, // هر ۳۰ ثانیه خودکار تازه‌سازی می‌شود
  });

  if (isLoading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 p-4 text-center dark:bg-slate-950">
        <div className="flex h-12 w-12 animate-spin items-center justify-center rounded-full border-4 border-primary border-t-transparent" />
        <p className="mt-4 text-sm font-medium text-muted-foreground">در حال بارگذاری اطلاعات پیشرفت پروژه...</p>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 p-4 text-center dark:bg-slate-950">
        <div className="mx-auto max-w-md rounded-2xl border bg-card p-8 shadow-sm">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-rose-500/10 text-rose-600">
            <Clock className="h-7 w-7" />
          </div>
          <h2 className="text-lg font-bold text-foreground">لینک رهگیری نامعتبر یا منقضی شده است</h2>
          <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
            کد رهگیری ارائه‌شده در سیستم یافت نشد. لطفاً جهت دریافت لینک صحیح با واحد پیگیری سفارشات تماس بگیرید.
          </p>
          <Button className="mt-6 w-full text-xs" onClick={() => window.location.reload()}>
            تلاش مجدد
          </Button>
        </div>
      </div>
    );
  }

  const currentStageIndex = STAGES.findIndex((s) => s.key === order.currentStage);
  const activeIndex = currentStageIndex === -1 ? 0 : currentStageIndex;
  const progressPercent = Math.min(100, Math.max(0, order.progressPercent || 0));

  return (
    <div className="min-h-screen bg-slate-50/70 pb-12 pt-6 text-foreground antialiased dark:bg-slate-950">
      <div className="mx-auto max-w-3xl px-4 sm:px-6">
        {/* هدر برندینگ کاردو */}
        <header className="mb-6 flex items-center justify-between border-b pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 font-black text-white shadow-md">
              <Building className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-base font-extrabold tracking-tight sm:text-lg">
                سامانه هوشمند رهگیری پروژه کاردو
              </h1>
              <p className="text-xs text-muted-foreground">رهگیری شفاف روند ساخت، تولید و نصب در محل</p>
            </div>
          </div>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => refetch()}
            disabled={isFetching}
            className="gap-1.5 text-xs text-muted-foreground hover:text-foreground"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isFetching ? "animate-spin" : ""}`} />
            <span className="hidden sm:inline">بروزرسانی وضعیت</span>
          </Button>
        </header>

        {/* کارت اصلی اطلاعات پروژه */}
        <Card className="overflow-hidden border bg-card shadow-sm">
          <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 p-6 text-white">
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs opacity-90">
              <span className="rounded-md bg-white/20 px-2.5 py-1 font-mono font-bold tracking-wider">
                {order.code}
              </span>
              <span className="flex items-center gap-1">
                <ShieldCheck className="h-4 w-4" />
                تضمین کیفیت و اصالت متریال
              </span>
            </div>

            <h2 className="mt-3 text-xl font-black sm:text-2xl">
              {order.projectTitle || "پروژه صنایع چوب و دکوراسیون"}
            </h2>

            <div className="mt-2 flex flex-wrap items-center gap-4 text-xs opacity-90">
              <span>کارفرما: <strong className="font-bold">{order.customerName}</strong></span>
              {order.estimatedCompletionDate && (
                <span className="flex items-center gap-1 font-medium">
                  <Calendar className="h-3.5 w-3.5" />
                  تاریخ تخمینی تحویل: {faDate(order.estimatedCompletionDate)}
                </span>
              )}
            </div>
          </div>

          {/* نوار بزرگ پیشرفت فیزیکی */}
          <div className="p-6">
            <div className="mb-2 flex items-center justify-between text-sm">
              <span className="font-semibold text-foreground">میزان تکمیل پروژه:</span>
              <span className="text-2xl font-black text-primary">{toFa(progressPercent)}٪</span>
            </div>

            <div className="h-4 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
              <div
                className="h-full rounded-full bg-gradient-to-r from-blue-500 via-indigo-500 to-emerald-500 transition-all duration-700 ease-out"
                style={{ width: `${progressPercent}%` }}
              />
            </div>

            <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
              <span>آغاز مراحل ساخت</span>
              <span className="font-medium text-emerald-600 dark:text-emerald-400">
                {progressPercent === 100 ? "پروژه تکمیل و تحویل گردید" : "در حال اجرای سفارش در کارخانه"}
              </span>
              <span>تحویل نهایی ۱۰۰٪</span>
            </div>
          </div>
        </Card>

        {/* خط سیر مراحل کارگاهی (Stepper) */}
        <div className="mt-6 space-y-3">
          <h3 className="text-sm font-bold text-foreground">مراحل فرایند تولید و اجرا:</h3>

          <div className="grid gap-2.5">
            {STAGES.map((st, index) => {
              const Icon = st.icon;
              const isDone = index < activeIndex || order.currentStage === "INSTALLED";
              const isCurrent = index === activeIndex && order.currentStage !== "INSTALLED";

              return (
                <div
                  key={st.key}
                  className={`flex items-center gap-3.5 rounded-xl border p-3.5 transition-all ${
                    isCurrent
                      ? "border-primary bg-primary/5 shadow-sm ring-1 ring-primary"
                      : isDone
                      ? "border-emerald-200 bg-emerald-500/5 dark:border-emerald-950"
                      : "border-border/60 bg-card/60 opacity-60"
                  }`}
                >
                  <div
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl font-bold ${
                      isDone
                        ? "bg-emerald-500 text-white shadow-sm"
                        : isCurrent
                        ? "animate-pulse bg-primary text-white shadow"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {isDone ? <CheckCircle2 className="h-5 w-5" /> : <Icon className="h-5 w-5" />}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between">
                      <h4
                        className={`text-sm font-bold ${
                          isCurrent
                            ? "text-primary"
                            : isDone
                            ? "text-emerald-700 dark:text-emerald-400"
                            : "text-foreground"
                        }`}
                      >
                        {st.label}
                      </h4>
                      {isCurrent && (
                        <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-semibold text-primary">
                          مرحله جاری
                        </span>
                      )}
                      {isDone && (
                        <span className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
                          تکمیل شده
                        </span>
                      )}
                    </div>
                    <p className="mt-0.5 text-xs text-muted-foreground leading-relaxed">
                      {st.desc}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* کارت تیم اعزامی و نصاب */}
        {(order.assignedInstaller || order.installationOrders?.length > 0) && (
          <Card className="mt-6 border p-5 shadow-sm">
            <h3 className="mb-3 flex items-center gap-2 text-sm font-bold">
              <UserCheck className="h-4 w-4 text-emerald-600" />
              تیم اعزامی و نصاب پروژه
            </h3>

            <div className="space-y-3 text-xs">
              {order.assignedInstaller && (
                <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-muted/40 p-3">
                  <div className="space-y-0.5">
                    <p className="font-semibold text-foreground">سرپرست تیم نصب: {order.assignedInstaller}</p>
                    <p className="text-muted-foreground">مسئول اندازه‌گیری نهایی، مونتاژ و تنظیمات دقیق در محل</p>
                  </div>
                  {order.installerPhone && (
                    <a
                      href={`tel:${order.installerPhone}`}
                      className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 font-medium text-white shadow hover:bg-emerald-700"
                    >
                      <Phone className="h-3.5 w-3.5" />
                      تماس: {order.installerPhone}
                    </a>
                  )}
                </div>
              )}

              {order.installationOrders?.map((inst: any, idx: number) => (
                <div key={idx} className="flex flex-wrap items-center justify-between gap-2 border-t pt-2 text-muted-foreground">
                  <span>حواله اعزام: <strong className="font-mono text-foreground">{inst.orderNumber}</strong></span>
                  <span>تاریخ مقرر: {faDate(inst.scheduledDate)}</span>
                  {inst.driverName && <span>راننده: {inst.driverName}</span>}
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* فوتر اطلاعات و پشتیبانی */}
        <footer className="mt-8 text-center text-xs text-muted-foreground">
          <p>سامانه رهگیری آنلاین صنایع چوب و دکوراسیون کاردو ERP</p>
          <p className="mt-1">اطلاعات این صفحه به‌صورت لحظه‌ای با خطوط تولید کارخانه هماهنگ می‌شود.</p>
        </footer>
      </div>
    </div>
  );
}
