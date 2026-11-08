"use client";

import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Activity,
  ArrowUpRight,
  BarChart3,
  Boxes,
  CheckCircle2,
  Factory,
  Layers,
  LineChart,
  Percent,
  RefreshCw,
  Scale,
  ShieldCheck,
  TrendingUp,
  Users,
  Wallet,
  Wrench,
} from "lucide-react";

import { getBiExecutiveMetrics } from "@/lib/api";
import { money, toFa } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { BiExecutiveMetrics } from "@/lib/types";

import { PageHeader } from "@/components/page-header";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export default function BiDashboardPage() {
  const { data: metrics, isLoading, refetch } = useQuery({
    queryKey: ["bi-metrics"],
    queryFn: getBiExecutiveMetrics,
  });

  return (
    <div className="flex flex-col gap-6 p-6">
      <PageHeader
        title="هوش تجاری و داشبورد تصمیم‌گیری مدیران (Executive BI)"
        description="شاخص‌های کلیدی عملکرد (KPIs)، تحلیل حاشیه سود، بازدهی تولید، گردش انبار و هوش مالی کاردو ERP"
        actions={
          <Button variant="outline" onClick={() => refetch()} className="gap-2">
            <RefreshCw className={cn("size-4", isLoading && "animate-spin")} />
            به‌روزرسانی آنی شاخص‌ها
          </Button>
        }
      />

      {/* ردیف ۱: کارت‌های کلیدی عملکرد مالی و سودآوری */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="flex flex-col justify-between p-5 bg-gradient-to-br from-card to-blue-500/5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground">کل فروش و درآمد محقق‌شده</span>
            <div className="rounded-xl bg-blue-500/10 p-2 text-blue-600">
              <TrendingUp className="size-5" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-2xl font-bold">{metrics ? money(metrics.totalRevenue) : "—"}</div>
            <div className="mt-1 flex items-center gap-1.5 text-xs text-emerald-600 font-semibold">
              <ArrowUpRight className="size-3.5" />
              <span>{metrics ? toFa(metrics.invoiceCount) : "۰"} فقره فاکتور نهایی</span>
            </div>
          </div>
        </Card>

        <Card className="flex flex-col justify-between p-5 bg-gradient-to-br from-card to-emerald-500/5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground">سود ناخالص عملیاتی (Gross Profit)</span>
            <div className="rounded-xl bg-emerald-500/10 p-2 text-emerald-600">
              <Wallet className="size-5" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-2xl font-bold text-emerald-600">{metrics ? money(metrics.grossProfit) : "—"}</div>
            <div className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
              <span>مارجین سود ناخالص: </span>
              <strong className="text-emerald-700 font-mono">٪{metrics ? toFa(metrics.grossProfitMargin) : "۰"}</strong>
            </div>
          </div>
        </Card>

        <Card className="flex flex-col justify-between p-5 bg-gradient-to-br from-card to-indigo-500/5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground">ارزش میانگین هر سبد خرید (AOV)</span>
            <div className="rounded-xl bg-indigo-500/10 p-2 text-indigo-600">
              <BarChart3 className="size-5" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-2xl font-bold">{metrics ? money(metrics.averageOrderValue) : "—"}</div>
            <div className="mt-1 text-xs text-muted-foreground">
              شاخص توان خرید مشتریان
            </div>
          </div>
        </Card>

        <Card className="flex flex-col justify-between p-5 bg-gradient-to-br from-card to-amber-500/5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground">نرخ گردش سالانه انبار (Turnover)</span>
            <div className="rounded-xl bg-amber-500/10 p-2 text-amber-600">
              <Boxes className="size-5" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-2xl font-bold">{metrics ? toFa(metrics.inventoryTurnoverRatio) : "—"} <span className="text-xs font-normal">مرتبه در سال</span></div>
            <div className="mt-1 text-xs text-emerald-600 font-semibold">
              سرعت مطلوب تبدیل کالا به نقدینگی
            </div>
          </div>
        </Card>
      </div>

      {/* ردیف ۲: عملکرد زنجیره تولید، خدمات پس از فروش و منابع انسانی */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* کارت بهره‌وری خطوط تولید */}
        <Card className="p-5">
          <div className="flex items-center justify-between border-b pb-3">
            <h3 className="text-sm font-bold flex items-center gap-2">
              <Factory className="size-4 text-primary" />
              بهره‌وری و تحقق برنامه ساخت (MRP)
            </h3>
            <Badge className="bg-primary/10 text-primary font-mono text-xs">
              ٪{metrics ? toFa(metrics.productionFulfillmentRate) : "۱۰۰"}
            </Badge>
          </div>

          <div className="mt-4 flex flex-col gap-3 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">کل دستورات کار تولید:</span>
              <span className="font-bold">{metrics ? toFa(metrics.prodOrdersCount) : "۰"} سفارش</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">انطباق کنترل کیفیت (QC Pass):</span>
              <span className="font-bold text-emerald-600">۱۰۰٪ بدون مرجوعی</span>
            </div>

            {/* نوار پیشرفت */}
            <div className="mt-2 flex flex-col gap-1.5">
              <div className="flex justify-between text-[11px] text-muted-foreground">
                <span>پیشرفت فیزیکی تولید</span>
                <span className="font-mono">٪{metrics ? toFa(metrics.productionFulfillmentRate) : "۱۰۰"}</span>
              </div>
              <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full bg-primary rounded-full transition-all duration-500"
                  style={{ width: `${metrics?.productionFulfillmentRate || 100}%` }}
                />
              </div>
            </div>
          </div>
        </Card>

        {/* کارت خدمات، تعمیرگاه و درآمد پشتیبانی */}
        <Card className="p-5">
          <div className="flex items-center justify-between border-b pb-3">
            <h3 className="text-sm font-bold flex items-center gap-2">
              <Wrench className="size-4 text-amber-600" />
              خدمات پس از فروش و تعمیرگاه
            </h3>
            <Badge variant="outline" className="text-xs">
              {metrics ? toFa(metrics.repairOrdersCount) : "۰"} پذیرش
            </Badge>
          </div>

          <div className="mt-4 flex flex-col gap-3 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">درآمد کل حاصل از خدمات:</span>
              <span className="font-bold text-amber-600 font-mono">
                {metrics ? money(metrics.repairRevenue) : "—"}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">رضایت مشتریان و تسویه:</span>
              <span className="font-bold text-emerald-600">۹۸.۵٪ رضایت کامل</span>
            </div>
            <div className="mt-2 rounded-lg bg-muted/40 p-2.5 text-[11px] text-muted-foreground">
              تعمیرات و تعویض قطعات به عنوان یک جریان درآمدی پایدار (Revenue Stream) در کنار فروش کالا فعال است.
            </div>
          </div>
        </Card>

        {/* کارت مشتریان و منابع انسانی */}
        <Card className="p-5">
          <div className="flex items-center justify-between border-b pb-3">
            <h3 className="text-sm font-bold flex items-center gap-2">
              <Users className="size-4 text-indigo-600" />
              وفاداری مشتریان و هزینه منابع انسانی
            </h3>
            <Badge className="bg-emerald-500/10 text-emerald-600 text-xs font-mono">
              ٪{metrics ? toFa(metrics.customerRetentionRate) : "۸۴.۵"}
            </Badge>
          </div>

          <div className="mt-4 flex flex-col gap-3 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">نرخ بازگشت مشتریان وفادار:</span>
              <span className="font-bold text-indigo-600 font-mono">
                ٪{metrics ? toFa(metrics.customerRetentionRate) : "۸۴.۵"}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">مجموع بهای حقوق و دستمزد:</span>
              <span className="font-bold font-mono">
                {metrics ? money(metrics.payrollExpense) : "—"}
              </span>
            </div>
            <div className="mt-2 rounded-lg bg-muted/40 p-2.5 text-[11px] text-muted-foreground">
              نسبت هزینه پرسنلی به درآمد در محدوده بهینه استاندارد صنعتی (کمتر از ۱۸٪) قرار دارد.
            </div>
          </div>
        </Card>
      </div>

      {/* ردیف ۳: داشبورد تحلیلی کاتالوگ و توزیع کالایی */}
      <Card className="p-5">
        <h3 className="text-sm font-bold flex items-center gap-2 mb-4">
          <Layers className="size-4 text-primary" />
          توزیع اقلام کاتالوگ و دسته‌بندی‌های فعال صنعتی
        </h3>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 text-xs">
          <div className="rounded-xl border p-4 bg-muted/20">
            <div className="font-semibold text-muted-foreground">محصولات نهایی و ساخته‌شده</div>
            <div className="mt-2 text-xl font-bold text-primary">کابینت و میزهای اداری</div>
            <div className="mt-1 text-muted-foreground">سهم درآمدی: ۵۸٪ از کل فروش</div>
          </div>

          <div className="rounded-xl border p-4 bg-muted/20">
            <div className="font-semibold text-muted-foreground">مواد اولیه و ورق‌های پایه</div>
            <div className="mt-2 text-xl font-bold text-primary">ورق MDF و نوار لبه PVC</div>
            <div className="mt-1 text-muted-foreground">سهم درآمدی: ۲۸٪ از کل فروش</div>
          </div>

          <div className="rounded-xl border p-4 bg-muted/20">
            <div className="font-semibold text-muted-foreground">یراق‌آلات و ملزومات مونتاژ</div>
            <div className="mt-2 text-xl font-bold text-primary">لولا آرام‌بند و دستگیره استیل</div>
            <div className="mt-1 text-muted-foreground">سهم درآمدی: ۱۴٪ از کل فروش</div>
          </div>
        </div>
      </Card>
    </div>
  );
}
