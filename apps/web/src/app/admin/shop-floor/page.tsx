"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  AlertCircle,
  Barcode,
  CalendarDays,
  Camera,
  CheckCircle2,
  Clock,
  ExternalLink,
  Factory,
  HardHat,
  Image as ImageIcon,
  Layers,
  LayoutGrid,
  Maximize2,
  Minimize2,
  Package,
  QrCode,
  Radio,
  RefreshCw,
  ScanLine,
  Scissors,
  ShieldCheck,
  Smartphone,
  User,
  Volume2,
  VolumeX,
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
import { MobileBarcodeCameraDialog } from "@/components/wood/mobile-barcode-camera-dialog";
import { StagePhotoUploadDialog } from "@/components/wood/stage-photo-upload-dialog";

const STATIONS = [
  { code: "SAW", name: "اره برش پانل (Saw)", icon: Scissors, color: "text-amber-500", bg: "bg-amber-500/10 border-amber-500/30", ring: "ring-amber-500/20" },
  { code: "EDGE", name: "لبه‌چسبان PVC (Edge)", icon: Layers, color: "text-blue-500", bg: "bg-blue-500/10 border-blue-500/30", ring: "ring-blue-500/20" },
  { code: "CNC", name: "ماشین‌کاری CNC و سوراخ‌کاری", icon: Wrench, color: "text-purple-500", bg: "bg-purple-500/10 border-purple-500/30", ring: "ring-purple-500/20" },
  { code: "ASSM", name: "مونتاژ و یراق‌آلات (Assembly)", icon: Factory, color: "text-emerald-500", bg: "bg-emerald-500/10 border-emerald-500/30", ring: "ring-emerald-500/20" },
  { code: "PACK", name: "بسته‌بندی و کنترل کیفیت (Pack)", icon: Package, color: "text-indigo-500", bg: "bg-indigo-500/10 border-indigo-500/30", ring: "ring-indigo-500/20" },
];

/** سنتز صوتی بومی Web Audio API برای بازخورد شنوایی اپراتور کارگاه */
function playScanSound(isSuccess: boolean) {
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    if (isSuccess) {
      // صدای زنگ شفاف موفقیت
      osc.type = "sine";
      osc.frequency.setValueAtTime(880, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(1320, ctx.currentTime + 0.12);
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);
      osc.start();
      osc.stop(ctx.currentTime + 0.15);
    } else {
      // بوق هشدار خطا
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(240, ctx.currentTime);
      osc.frequency.linearRampToValueAtTime(160, ctx.currentTime + 0.22);
      gain.gain.setValueAtTime(0.25, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.22);
      osc.start();
      osc.stop(ctx.currentTime + 0.22);
    }
  } catch {
    // در صورت عدم اجازه مرورگر
  }
}

export default function ShopFloorScanPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [stationCode, setStationCode] = React.useState("SAW");
  const [operatorName, setOperatorName] = React.useState("اپراتور خط ۱");
  const [barcodeInput, setBarcodeInput] = React.useState("");
  const [soundEnabled, setSoundEnabled] = React.useState(true);
  const [isFullscreen, setIsFullscreen] = React.useState(false);

  // وضعیت‌های دیالوگ موبایلی کارگران
  const [isCameraOpen, setIsCameraOpen] = React.useState(false);
  const [isPhotoOpen, setIsPhotoOpen] = React.useState(false);

  const [lastResult, setLastResult] = React.useState<{
    success: boolean;
    title: string;
    message: string;
    partName?: string;
    dimensions?: string;
    orderCode?: string;
  } | null>(null);

  const barcodeInputRef = React.useRef<HTMLInputElement>(null);

  // نگه داشتن همیشگی فوکوس روی اینپوت بارکد برای بارکدخوان صنعتی
  React.useEffect(() => {
    barcodeInputRef.current?.focus();
  }, [stationCode]);

  // بررسی وضعیت تمام‌صفحه
  React.useEffect(() => {
    const handleFsChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", handleFsChange);
    return () => document.removeEventListener("fullscreenchange", handleFsChange);
  }, []);

  const toggleFullScreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };

  // دریافت آخرین لاگ‌های اسکن کارگاه
  const { data: scanLogs = [], isLoading, refetch } = useQuery({
    queryKey: ["shop-floor-scans"],
    queryFn: () => getRecentScanLogs(30),
    refetchInterval: 4000,
  });

  // میوتیشن پردازش اسکن بارکد
  const scanMutation = useMutation({
    mutationFn: (body: { barcode: string; stationCode: string; operatorName: string }) =>
      processShopFloorScan(body),
    onSuccess: (data) => {
      if (soundEnabled) playScanSound(true);
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
      if (soundEnabled) playScanSound(false);
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
  const successfulScans = scanLogs.filter((l) => l.isSuccess).length;

  return (
    <div className="flex flex-col gap-5 p-5 sm:p-6 transition-all select-none">
      <PageHeader
        title="کنسول اسکن بارکد کارگاهی (Shop-Floor Monitor)"
        description="مانیتورینگ لمسی و آنی ایستگاه‌های خط تولید اره، لبه‌چسبان PVC، سی‌ان‌سی و مونتاژ (الگوبرداری از مانیتور اسکن FlexERP)"
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSoundEnabled(!soundEnabled)}
              className="gap-1.5 text-xs h-8"
              title={soundEnabled ? "غیرفعال‌سازی صدای بیپ" : "فعال‌سازی صدای بیپ"}
            >
              {soundEnabled ? (
                <>
                  <Volume2 className="size-3.5 text-emerald-600" />
                  صدای تأیید فعال
                </>
              ) : (
                <>
                  <VolumeX className="size-3.5 text-muted-foreground" />
                  صدا غیرفعال
                </>
              )}
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={toggleFullScreen}
              className="gap-1.5 text-xs h-8"
              title="تمام‌صفحه برای تبلت و کیوسک کارگاهی"
            >
              {isFullscreen ? (
                <>
                  <Minimize2 className="size-3.5" />
                  خروج از تمام‌صفحه
                </>
              ) : (
                <>
                  <Maximize2 className="size-3.5" />
                  حالت کیوسک (تمام‌صفحه)
                </>
              )}
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push("/worker/leaves")}
              className="gap-1.5 text-xs h-8 font-bold border-emerald-500/30 text-emerald-700 hover:bg-emerald-500/10 dark:text-emerald-400 cursor-pointer"
              title="ثبت تقاضای مرخصی روزانه/ساعتی و کاردکس"
            >
              <CalendarDays className="size-3.5 text-emerald-600" />
              <span>تقاضای مرخصی پرسنل</span>
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => refetch()}
              className="gap-1.5 text-xs h-8"
            >
              <RefreshCw className={cn("size-3.5", isLoading && "animate-spin")} />
              تازه‌سازی
            </Button>
          </div>
        }
      />

      {/* ۱. انتخاب ایستگاه کاری با کلیدهای بزرگ مخصوص لمسی / کیوسک */}
      <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-3 lg:grid-cols-5">
        {STATIONS.map((st) => {
          const Icon = st.icon;
          const isSelected = stationCode === st.code;
          return (
            <button
              key={st.code}
              type="button"
              onClick={() => {
                if (typeof navigator !== "undefined" && navigator.vibrate) {
                  navigator.vibrate(40);
                }
                setStationCode(st.code);
                barcodeInputRef.current?.focus();
              }}
              className={cn(
                "relative flex flex-col items-center justify-center gap-2.5 p-4 rounded-2xl border-2 transition-all duration-200 text-center cursor-pointer select-none",
                isSelected
                  ? `${st.bg} border-primary shadow-md scale-[1.02] ring-2 ring-primary/20 bg-card`
                  : "bg-card border-border/80 hover:border-primary/40 hover:-translate-y-0.5 text-muted-foreground shadow-2xs"
              )}
            >
              {isSelected && (
                <div className="absolute top-2.5 left-2.5 flex items-center justify-center">
                  <span className="size-2 rounded-full bg-primary animate-ping" />
                  <span className="absolute size-2 rounded-full bg-primary" />
                </div>
              )}
              <div className={cn("p-2.5 rounded-xl transition-all shadow-2xs", isSelected ? `${st.color} bg-background ring-1 ring-border/50` : "bg-muted/70 text-muted-foreground")}>
                <Icon className="size-6" />
              </div>
              <div>
                <div className={cn("text-xs font-black", isSelected ? "text-foreground" : "text-muted-foreground")}>{st.name}</div>
                <div className="font-mono text-[10px] text-muted-foreground/80 mt-0.5 font-bold">کد: [{st.code}]</div>
              </div>
            </button>
          );
        })}
      </div>

      {/* ۲. پنل اصلی اسکنر کارگاهی */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
        {/* ستون راست: فیلد ورودی بارکدخوان و نمایش نتیجه آنی */}
        <div className="lg:col-span-7 flex flex-col gap-4">
          <Card className="p-6 border-2 border-primary/25 bg-gradient-to-br from-card via-card to-primary/5 shadow-md">
            <div className="flex items-center justify-between border-b border-border/80 pb-3.5">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-primary/10 text-primary shadow-2xs">
                  <ScanLine className="size-5" />
                </div>
                <div>
                  <span className="font-black text-sm text-foreground">کنسول شلیک بارکدخوان صنعتی</span>
                  <div className="text-[11px] text-muted-foreground">بارکدخوان دستی لیزری، بلوتوثی یا پورت USB</div>
                </div>
              </div>
              <div className="flex items-center gap-1.5 bg-muted/60 px-2.5 py-1 rounded-xl border border-border/60">
                <User className="size-3.5 text-muted-foreground" />
                <input
                  type="text"
                  value={operatorName}
                  onChange={(e) => setOperatorName(e.target.value)}
                  placeholder="نام اپراتور..."
                  className="h-6 w-28 text-xs bg-transparent text-foreground focus:outline-none font-bold"
                />
              </div>
            </div>

            <form onSubmit={handleBarcodeSubmit} className="mt-4 flex flex-col gap-3.5">
              <div className="relative group">
                <Input
                  ref={barcodeInputRef}
                  value={barcodeInput}
                  onChange={(e) => setBarcodeInput(e.target.value)}
                  placeholder="بارکد قطعه یا سفارش را شلیک کنید (مثلاً CUT-00001)..."
                  className="h-16 text-lg font-mono font-black tracking-widest text-center border-2 border-primary/50 focus:border-primary focus:ring-4 focus:ring-primary/20 bg-background rounded-xl shadow-inner transition-all"
                  autoFocus
                />
              </div>

              {/* ابزارهای مخصوص کار با گوشی موبایل و تبلت برای کارگران کارگاه */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsCameraOpen(true)}
                  className="h-11 gap-2 rounded-xl border-2 border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 font-black text-xs hover:bg-emerald-500/20 shadow-xs cursor-pointer"
                >
                  <Camera className="size-4.5" />
                  <span>📸 اسکن بارکد با دوربین گوشی</span>
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsPhotoOpen(true)}
                  className="h-11 gap-2 rounded-xl border-2 border-blue-500/40 bg-blue-500/10 text-blue-700 dark:text-blue-400 font-black text-xs hover:bg-blue-500/20 shadow-xs cursor-pointer"
                >
                  <ImageIcon className="size-4.5" />
                  <span>📷 عکاسی از قطعه / ثبت پیشرفت</span>
                </Button>
              </div>

              <div className="flex items-center justify-between gap-2 pt-1">
                <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
                  <span className="inline-block size-2.5 rounded-full bg-emerald-500 animate-pulse shadow-xs" />
                  ایستگاه فعال: <strong className="text-foreground font-black px-2 py-0.5 rounded bg-muted/80">{currentStation.name}</strong>
                </div>
                <Button
                  type="submit"
                  size="sm"
                  disabled={!barcodeInput.trim() || scanMutation.isPending}
                  className="gap-2 px-6 h-9.5 text-xs font-bold rounded-xl shadow-xs"
                >
                  {scanMutation.isPending ? "در حال ثبت..." : "تأیید اسکن دستی"}
                </Button>
              </div>
            </form>

            {/* کلیدهای شبیه‌ساز سریع بارکد برای تست بدون دستگاه فیزیکی */}
            <div className="mt-5 pt-4 border-t border-border">
              <div className="text-[11px] font-semibold text-muted-foreground mb-2 flex items-center justify-between">
                <span>شبیه‌ساز بارکدخوان (تست سریع کلیکی):</span>
                <span className="text-[10px] text-muted-foreground">کلیک جهت ثبت مستقیم در ایستگاه {currentStation.code}</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {[
                  { code: "CUT-00001", label: "بدنه راست" },
                  { code: "CUT-00002", label: "بدنه چپ" },
                  { code: "CUT-00003", label: "کف یونیت" },
                  { code: "CUT-00004", label: "درب هایگلاس" },
                  { code: "GLS-00001", label: "شیشه دودی" },
                  { code: "PRF-00001", label: "پروفیل J" },
                  { code: "MO-1404-0001", label: "سفارش کل" },
                ].map((item) => (
                  <Button
                    key={item.code}
                    variant="outline"
                    size="sm"
                    className="font-mono text-xs h-7 gap-1.5 hover:border-primary/50"
                    onClick={() => {
                      setBarcodeInput(item.code);
                      scanMutation.mutate({
                        barcode: item.code,
                        stationCode,
                        operatorName: operatorName.trim() || "اپراتور کارگاه",
                      });
                    }}
                  >
                    <span className="font-sans text-[10px] text-muted-foreground">{item.label}:</span>
                    <strong className="text-primary">{item.code}</strong>
                  </Button>
                ))}
              </div>
            </div>
          </Card>

          {/* فیدبک بصری فوری نتیجه اسکن */}
          {lastResult && (
            <div
              className={cn(
                "p-4.5 rounded-2xl border-2 transition-all duration-300 animate-in fade-in-50 shadow-sm",
                lastResult.success
                  ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-950 dark:text-emerald-100"
                  : "bg-red-500/10 border-red-500/30 text-red-950 dark:text-red-100"
              )}
            >
              <div className="flex items-start gap-3.5">
                {lastResult.success ? (
                  <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-600 shrink-0">
                    <CheckCircle2 className="size-6" />
                  </div>
                ) : (
                  <div className="p-2 rounded-xl bg-red-500/20 text-red-600 shrink-0">
                    <AlertCircle className="size-6" />
                  </div>
                )}
                <div className="flex flex-col gap-1 w-full">
                  <div className="font-black text-sm">{lastResult.title}</div>
                  <div className="text-xs leading-relaxed">{lastResult.message}</div>
                  {lastResult.partName && (
                    <div className="mt-2.5 flex flex-wrap items-center gap-3 pt-2.5 border-t border-emerald-500/20 text-xs">
                      <span className="px-2 py-0.5 rounded-md bg-emerald-500/15 font-bold">قطعه: {lastResult.partName}</span>
                      {lastResult.dimensions && <span className="font-mono px-2 py-0.5 rounded-md bg-muted">ابعاد: {lastResult.dimensions}</span>}
                      {lastResult.orderCode && <span className="font-mono px-2 py-0.5 rounded-md bg-muted">سفارش: {lastResult.orderCode}</span>}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ستون چپ: فید زنده لاگ‌های اسکن کارگاه */}
        <div className="lg:col-span-5">
          <div className="kardo-card p-0 overflow-hidden border border-border/80 shadow-xs h-full flex flex-col">
            <div className="flex items-center justify-between border-b border-border/80 bg-muted/50 p-3.5">
              <div className="flex items-center gap-2">
                <Clock className="size-4 text-primary" />
                <span className="text-xs font-black text-foreground">فید لحظه‌ای اسکن‌های خط کارخانه (Real-Time Feed)</span>
              </div>
              <Badge variant="outline" className="text-[10px] font-mono font-bold bg-background">
                {toFa(scanLogs.length)} رویداد
              </Badge>
            </div>

            <div className="overflow-y-auto max-h-[500px] divide-y divide-border/60 scroll-thin">
              {scanLogs.length === 0 ? (
                <div className="py-14 text-center text-xs text-muted-foreground flex flex-col items-center justify-center gap-2">
                  <ScanLine className="size-8 text-muted-foreground/40 stroke-1" />
                  <span>هنوز اسکن جدیدی در خط ثبت نشده است.</span>
                </div>
              ) : (
                scanLogs.map((log) => (
                  <div key={log.id} className="p-3 text-xs flex flex-col gap-1.5 hover:bg-muted/40 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-black text-primary bg-primary/10 px-2 py-0.5 rounded text-[11px] border border-primary/20">
                          {log.barcode}
                        </span>
                        <Badge variant="secondary" className="text-[10px] font-mono font-bold">
                          {log.stationCode}
                        </Badge>
                      </div>
                      <span className="font-mono text-[10px] text-muted-foreground">
                        {faDate(log.scannedAt)}
                      </span>
                    </div>
                    <div className="text-foreground text-[11px] font-medium leading-relaxed">
                      {log.action}
                    </div>
                    <div className="flex items-center justify-between text-[10px] text-muted-foreground pt-1 border-t border-border/30">
                      <span>اپراتور: <strong className="text-foreground font-semibold">{log.operatorName}</strong></span>
                      {log.productionOrder?.code && (
                        <span>سفارش: <strong className="font-mono text-foreground font-bold">{log.productionOrder.code}</strong></span>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* دیالوگ اسکن با دوربین گوشی */}
      <MobileBarcodeCameraDialog
        open={isCameraOpen}
        onOpenChange={setIsCameraOpen}
        stationName={currentStation.name}
        onScan={(scannedCode) => {
          setBarcodeInput(scannedCode);
          scanMutation.mutate({
            barcode: scannedCode,
            stationCode,
            operatorName: operatorName.trim() || "اپراتور کارگاه",
          });
        }}
      />

      {/* دیالوگ عکاسی و ثبت کنترل کیفی مرحله کارگاهی */}
      <StagePhotoUploadDialog
        open={isPhotoOpen}
        onOpenChange={setIsPhotoOpen}
        stationName={currentStation.name}
        orderCode={lastResult?.orderCode}
      />
    </div>
  );
}
