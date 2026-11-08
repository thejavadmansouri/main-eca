"use client";

import * as React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  AlertCircle,
  Barcode,
  CheckCircle2,
  Clock,
  ExternalLink,
  Factory,
  HardHat,
  Layers,
  LayoutGrid,
  Maximize2,
  Package,
  QrCode,
  RefreshCw,
  ScanLine,
  Scissors,
  ShieldCheck,
  User,
  Volume2,
  Wrench,
} from "lucide-react";

import { getRecentScanLogs, processShopFloorScan } from "@/lib/api";
import { faDate, money, toFa } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { ProductionScanLogRow } from "@/lib/types";

import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

const STATIONS = [
  { code: "SAW", name: "اره برش پانل (Saw)", icon: Scissors, color: "text-amber-500", bg: "bg-amber-500/10 border-amber-500/20" },
  { code: "EDGE", name: "لبه‌چسبان PVC (Edge)", icon: Layers, color: "text-blue-500", bg: "bg-blue-500/10 border-blue-500/20" },
  { code: "CNC", name: "ماشین‌کاری CNC و سوراخ‌کاری", icon: Wrench, color: "text-purple-500", bg: "bg-purple-500/10 border-purple-500/20" },
  { code: "ASSM", name: "مونتاژ و یراق‌آلات (Assembly)", icon: Factory, color: "text-emerald-500", bg: "bg-emerald-500/10 border-emerald-500/20" },
  { code: "PACK", name: "بسته‌بندی و کنترل کیفیت (Pack)", icon: Package, color: "text-indigo-500", bg: "bg-indigo-500/10 border-indigo-500/20" },
];

export default function ShopFloorScanPage() {
  const queryClient = useQueryClient();
  const [stationCode, setStationCode] = React.useState("SAW");
  const [operatorName, setOperatorName] = React.useState("اپراتور خط ۱");
  const [barcodeInput, setBarcodeInput] = React.useState("");
  const [lastResult, setLastResult] = React.useState<{
    success: boolean;
    title: string;
    message: string;
    partName?: string;
    dimensions?: string;
    orderCode?: string;
  } | null>(null);

  const barcodeInputRef = React.useRef<HTMLInputElement>(null);

  // نگه داشتن فوکوس روی اینپوت بارکد برای بارکدخوان صنعتی
  React.useEffect(() => {
    barcodeInputRef.current?.focus();
  }, [stationCode]);

  // دریافت آخرین لاگ‌های اسکن کارگاه
  const { data: scanLogs = [], isLoading, refetch } = useQuery({
    queryKey: ["shop-floor-scans"],
    queryFn: () => getRecentScanLogs(25),
    refetchInterval: 5000, // رفرش خودکار هر ۵ ثانیه
  });

  // میوتیشن پردازش اسکن بارکد
  const scanMutation = useMutation({
    mutationFn: (body: { barcode: string; stationCode: string; operatorName: string }) =>
      processShopFloorScan(body),
    onSuccess: (data) => {
      setLastResult({
        success: true,
        title: "اسکن موفقیت‌آمیز قطعه",
        message: data.message,
        partName: data.part?.partName,
        dimensions: data.part ? `${data.part.lengthMm} × ${data.part.widthMm} mm` : undefined,
        orderCode: data.orderCode || data.order?.code,
      });
      setBarcodeInput("");
      queryClient.invalidateQueries({ queryKey: ["shop-floor-scans"] });
      queryClient.invalidateQueries({ queryKey: ["production-matrix"] });
      queryClient.invalidateQueries({ queryKey: ["cutting-list"] });
      barcodeInputRef.current?.focus();
    },
    onError: (err: any) => {
      setLastResult({
        success: false,
        title: "خطا در اسکن بارکد",
        message: err.message || "بارکد در سیستم یافت نشد یا معتبر نیست.",
      });
      setBarcodeInput("");
      queryClient.invalidateQueries({ queryKey: ["shop-floor-scans"] });
      barcodeInputRef.current?.focus();
    },
  });

  const handleBarcodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!barcodeInput.trim()) return;
    scanMutation.mutate({
      barcode: barcodeInput.trim(),
      stationCode,
      operatorName: operatorName.trim() || "اپراتور کارگاه",
    });
  };

  const currentStation = STATIONS.find((s) => s.code === stationCode) || STATIONS[0];

  return (
    <div className="flex flex-col gap-6 p-6">
      <PageHeader
        title="کنسول اسکن بارکد کارگاهی (Shop-Floor Monitor)"
        description="مانیتورینگ لمسی و آنی ایستگاه‌های خط تولید اره، لبه‌چسبان PVC، سی‌ان‌سی و مونتاژ (الگوبرداری از مانیتور اسکن FlexERP)"
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetch()}
              className="gap-1.5 text-xs h-8"
            >
              <RefreshCw className={cn("size-3.5", isLoading && "animate-spin")} />
              تازه‌سازی لاگ‌ها
            </Button>
          </div>
        }
      />

      {/* ۱. انتخاب ایستگاه کاری با کلیدهای بزرگ مخصوص لمسی / کیوسک */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {STATIONS.map((st) => {
          const Icon = st.icon;
          const isSelected = stationCode === st.code;
          return (
            <button
              key={st.code}
              type="button"
              onClick={() => {
                setStationCode(st.code);
                barcodeInputRef.current?.focus();
              }}
              className={cn(
                "flex flex-col items-center justify-center gap-2 p-4 rounded-xl border-2 transition-all text-center",
                isSelected
                  ? `${st.bg} border-primary shadow-md scale-[1.02]`
                  : "bg-card border-border hover:border-muted-foreground/30 text-muted-foreground"
              )}
            >
              <div className={cn("p-2.5 rounded-lg", isSelected ? st.color : "text-muted-foreground")}>
                <Icon className="size-6" />
              </div>
              <div>
                <div className={cn("text-xs font-black", isSelected ? "text-foreground" : "")}>{st.name}</div>
                <div className="font-mono text-[10px] text-muted-foreground mt-0.5">[{st.code}]</div>
              </div>
            </button>
          );
        })}
      </div>

      {/* ۲. پنل اصلی اسکنر کارگاهی */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* ستون چپ: فیلد ورودی بارکدخوان و نمایش نتیجه آنی */}
        <div className="lg:col-span-7 flex flex-col gap-4">
          <Card className="p-6 border-2 border-primary/30 shadow-md">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2">
                <ScanLine className="size-5 text-primary" />
                <span className="font-bold text-sm">ورودی دستگاه بارکدخوان (فارسی / انگلیسی)</span>
              </div>
              <div className="flex items-center gap-2">
                <User className="size-3.5 text-muted-foreground" />
                <input
                  type="text"
                  value={operatorName}
                  onChange={(e) => setOperatorName(e.target.value)}
                  placeholder="نام اپراتور..."
                  className="h-7 w-28 text-xs px-2 border rounded bg-background text-foreground"
                />
              </div>
            </div>

            <form onSubmit={handleBarcodeSubmit} className="mt-4 flex flex-col gap-3">
              <div className="relative">
                <Input
                  ref={barcodeInputRef}
                  value={barcodeInput}
                  onChange={(e) => setBarcodeInput(e.target.value)}
                  placeholder="بارکد قطعه یا سفارش را اسکن کنید (مثلاً CUT-00001)..."
                  className="h-14 text-base font-mono font-bold tracking-wider text-center border-2 border-primary focus:ring-4 focus:ring-primary/20"
                  autoFocus
                />
              </div>

              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <span className="inline-block size-2 rounded-full bg-emerald-500 animate-pulse" />
                  ایستگاه فعال: <strong className="text-foreground">{currentStation.name}</strong>
                </div>
                <Button
                  type="submit"
                  size="sm"
                  disabled={!barcodeInput.trim() || scanMutation.isPending}
                  className="gap-2 px-6"
                >
                  {scanMutation.isPending ? "در حال ثبت..." : "تأیید اسکن"}
                </Button>
              </div>
            </form>

            {/* کلیدهای شبیه‌ساز سریع بارکد برای تست بدون دستگاه فیزیکی */}
            <div className="mt-5 pt-4 border-t border-border">
              <div className="text-[11px] font-semibold text-muted-foreground mb-2">تست سریع بارکدها (شبیه‌ساز کارگاهی):</div>
              <div className="flex flex-wrap gap-2">
                {["CUT-00001", "CUT-00002", "CUT-00003", "PRF-00001", "GLS-00001", "MO-1404-0001"].map((code) => (
                  <Button
                    key={code}
                    variant="outline"
                    size="sm"
                    className="font-mono text-xs h-7"
                    onClick={() => {
                      setBarcodeInput(code);
                      scanMutation.mutate({
                        barcode: code,
                        stationCode,
                        operatorName: operatorName.trim() || "اپراتور کارگاه",
                      });
                    }}
                  >
                    {code}
                  </Button>
                ))}
              </div>
            </div>
          </Card>

          {/* فیدبک بصری فوری نتیجه اسکن */}
          {lastResult && (
            <Card
              className={cn(
                "p-5 border-2 transition-all",
                lastResult.success
                  ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-950 dark:text-emerald-100"
                  : "bg-red-500/10 border-red-500/30 text-red-950 dark:text-red-100"
              )}
            >
              <div className="flex items-start gap-3">
                {lastResult.success ? (
                  <CheckCircle2 className="size-6 text-emerald-600 shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="size-6 text-red-600 shrink-0 mt-0.5" />
                )}
                <div className="flex flex-col gap-1 w-full">
                  <div className="font-black text-sm">{lastResult.title}</div>
                  <div className="text-xs">{lastResult.message}</div>
                  {lastResult.partName && (
                    <div className="mt-2 flex flex-wrap gap-3 pt-2 border-t border-emerald-500/20 text-xs">
                      <div>قطعه: <strong>{lastResult.partName}</strong></div>
                      {lastResult.dimensions && <div>ابعاد: <strong className="font-mono">{lastResult.dimensions}</strong></div>}
                      {lastResult.orderCode && <div>سفارش: <strong className="font-mono">{lastResult.orderCode}</strong></div>}
                    </div>
                  )}
                </div>
              </div>
            </Card>
          )}
        </div>

        {/* ستون راست: جدول لاگ‌های آنی اسکن کارگاه */}
        <div className="lg:col-span-5">
          <Card className="p-0 overflow-hidden border border-border h-full flex flex-col">
            <div className="flex items-center justify-between border-b border-border bg-muted/40 p-3">
              <div className="flex items-center gap-2">
                <Clock className="size-4 text-primary" />
                <span className="text-xs font-bold">لاگ لحظه‌ای اسکن‌های خط تولید (Real-Time Feed)</span>
              </div>
              <Badge variant="outline" className="text-[10px]">
                {toFa(scanLogs.length)} اسکن اخیر
              </Badge>
            </div>

            <div className="overflow-y-auto max-h-[480px] divide-y divide-border">
              {scanLogs.length === 0 ? (
                <div className="py-12 text-center text-xs text-muted-foreground">
                  هنوز اسکن جدیدی در خط ثبت نشده است.
                </div>
              ) : (
                scanLogs.map((log) => (
                  <div key={log.id} className="p-3 text-xs flex flex-col gap-1 hover:bg-muted/30 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded text-[11px]">
                          {log.barcode}
                        </span>
                        <Badge variant="secondary" className="text-[10px]">
                          {log.stationCode}
                        </Badge>
                      </div>
                      <span className="font-mono text-[10px] text-muted-foreground">
                        {faDate(log.scannedAt)}
                      </span>
                    </div>
                    <div className="text-muted-foreground text-[11px] mt-0.5">
                      {log.action}
                    </div>
                    <div className="flex items-center justify-between text-[10px] text-muted-foreground pt-1">
                      <span>اپراتور: {log.operatorName}</span>
                      {log.productionOrder?.code && (
                        <span>سفارش: <strong className="font-mono text-foreground">{log.productionOrder.code}</strong></span>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
