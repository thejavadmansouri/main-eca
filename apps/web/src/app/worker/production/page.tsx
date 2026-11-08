"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  ArrowRight,
  Boxes,
  Check,
  CheckCircle2,
  ChevronLeft,
  Factory,
  HardHat,
  Layers,
  Loader2,
  Package,
  Phone,
  Play,
  QrCode,
  RefreshCw,
  ScanLine,
  Scissors,
  Search,
  Sparkles,
  Truck,
  User,
  Wrench,
  X,
  Camera,
  Image as ImageIcon,
  Trash2,
} from "lucide-react";

import {
  advanceOrderStage,
  addStageUpdate,
  getComprehensiveProductionMatrix,
} from "@/lib/api";
import { useAuthStore } from "@/lib/auth-store";
import { faDate, toFa } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { ProductionMatrixRow } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const STAGE_CONFIG: Record<
  string,
  {
    label: string;
    icon: any;
    color: string;
    bg: string;
    next: string | null;
    nextLabel: string;
  }
> = {
  CUTTING: {
    label: "برش پانل",
    icon: Scissors,
    color: "text-amber-500",
    bg: "bg-amber-500/10 border-amber-500/30 text-amber-700",
    next: "EDGE_BANDING",
    nextLabel: "ارسال به لبه‌چسبانی PVC",
  },
  EDGE_BANDING: {
    label: "لبه‌چسبان PVC",
    icon: Layers,
    color: "text-blue-500",
    bg: "bg-blue-500/10 border-blue-500/30 text-blue-700",
    next: "CNC",
    nextLabel: "ارسال به ماشین‌کاری CNC",
  },
  CNC: {
    label: "ماشین‌کاری CNC",
    icon: Wrench,
    color: "text-purple-500",
    bg: "bg-purple-500/10 border-purple-500/30 text-purple-700",
    next: "ASSEMBLY",
    nextLabel: "ارسال به مونتاژ و یراق",
  },
  ASSEMBLY: {
    label: "مونتاژ و یراق",
    icon: Factory,
    color: "text-emerald-500",
    bg: "bg-emerald-500/10 border-emerald-500/30 text-emerald-700",
    next: "FINISHING",
    nextLabel: "ارسال به رنگ و پرداخت",
  },
  FINISHING: {
    label: "رنگ و پولیش",
    icon: Sparkles,
    color: "text-pink-500",
    bg: "bg-pink-500/10 border-pink-500/30 text-pink-700",
    next: "QC_PACKING",
    nextLabel: "ارسال به کنترل کیفی و بسته‌بندی",
  },
  QC_PACKING: {
    label: "کنترل کیفی و بسته‌بندی",
    icon: Package,
    color: "text-indigo-500",
    bg: "bg-indigo-500/10 border-indigo-500/30 text-indigo-700",
    next: "READY_TO_INSTALL",
    nextLabel: "تایید نهایی و آماده‌سازی بارگیری",
  },
  READY_TO_INSTALL: {
    label: "آماده ارسال و نصب",
    icon: Truck,
    color: "text-teal-500",
    bg: "bg-teal-500/10 border-teal-500/30 text-teal-700",
    next: "INSTALLED",
    nextLabel: "تایید نصب نهایی در محل مشتری",
  },
  INSTALLED: {
    label: "تحویل و نصب کامل",
    icon: CheckCircle2,
    color: "text-emerald-600",
    bg: "bg-emerald-600/10 border-emerald-600/30 text-emerald-700",
    next: null,
    nextLabel: "پروژه تکمیل شده",
  },
};

/** پخش صدای تأیید برای اپراتور کارگاه */
function playSuccessBeep() {
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.setValueAtTime(600, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(1000, ctx.currentTime + 0.15);
    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);
    osc.start();
    osc.stop(ctx.currentTime + 0.15);
  } catch {}
}

export default function WorkerProductionPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [selectedStation, setSelectedStation] = React.useState<string>("ALL");
  const [searchQuery, setSearchQuery] = React.useState("");

  // دیالوگ ارتقای مرحله
  const [selectedOrder, setSelectedOrder] = React.useState<ProductionMatrixRow | null>(null);
  const [advanceNotes, setAdvanceNotes] = React.useState("");
  const [advancePhotos, setAdvancePhotos] = React.useState<string[]>([]);
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);

  const {
    data: orders = [],
    isLoading,
    refetch,
    isRefetching,
  } = useQuery<ProductionMatrixRow[]>({
    queryKey: ["production-matrix"],
    queryFn: getComprehensiveProductionMatrix,
    refetchInterval: 12000, // بروزرسانی زنده کارگاه هر ۱۲ ثانیه
  });

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onload = (uploadEvent) => {
        const result = uploadEvent.target?.result as string;
        if (result) {
          setAdvancePhotos((prev) => [...prev, result]);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const advanceMutation = useMutation({
    mutationFn: async ({
      orderId,
      stage,
      notes,
      photos,
    }: {
      orderId: string;
      stage: string;
      notes?: string;
      photos?: string[];
    }) => {
      if (photos && photos.length > 0) {
        return addStageUpdate(orderId, {
          stationCode: stage,
          title: `تایید ایستگاه ${STAGE_CONFIG[stage]?.label || stage}`,
          notes,
          photos,
          operatorName: user?.fullName || user?.username || "اپراتور کارگاه",
          advanceStage: true,
        });
      }
      return advanceOrderStage(orderId, {
        stage,
        operatorName: user?.fullName || user?.username || "اپراتور کارگاه",
        notes,
      });
    },
    onSuccess: (_, vars) => {
      playSuccessBeep();
      queryClient.invalidateQueries({ queryKey: ["production-matrix"] });
      setSelectedOrder(null);
      setAdvanceNotes("");
      setAdvancePhotos([]);
      const targetConfig = STAGE_CONFIG[vars.stage];
      toast({
        title: "مرحله با موفقیت تایید شد",
        description: `سفارش به مرحله «${targetConfig?.label || vars.stage}» ارتقا یافت.`,
      });
    },
    onError: (err: any) => {
      toast({
        title: "خطا در ثبت مرحله",
        description: err?.message || "امکان ارتقای مرحله وجود ندارد.",
        variant: "destructive",
      });
    },
  });

  const filteredOrders = React.useMemo(() => {
    return orders.filter((ord) => {
      const stage = (ord.currentStage || "CUTTING").toUpperCase();
      if (selectedStation !== "ALL" && stage !== selectedStation) return false;
      if (!searchQuery.trim()) return true;

      const q = searchQuery.toLowerCase().trim();
      return (
        ord.code.toLowerCase().includes(q) ||
        (ord.projectTitle && ord.projectTitle.toLowerCase().includes(q)) ||
        (ord.customerName && ord.customerName.toLowerCase().includes(q)) ||
        (ord.endClientName && ord.endClientName.toLowerCase().includes(q)) ||
        (ord.assignedInstaller && ord.assignedInstaller.toLowerCase().includes(q))
      );
    });
  }, [orders, selectedStation, searchQuery]);

  return (
    <div className="flex flex-1 flex-col min-h-screen bg-muted/20 pb-16 font-sans">
      {/* ───────────────────────── هدر ساده موبایل ───────────────────────── */}
      <header className="sticky top-0 z-30 flex items-center justify-between border-b bg-background/95 px-4 py-3 backdrop-blur-md shadow-2xs">
        <div className="flex items-center gap-2.5">
          <Link
            href="/worker"
            className="flex size-9 items-center justify-center rounded-xl bg-muted/80 text-foreground hover:bg-muted active:scale-95 transition-all"
            aria-label="بازگشت"
          >
            <ArrowRight className="size-4" />
          </Link>
          <div>
            <h1 className="text-sm font-black text-foreground flex items-center gap-1.5">
              <Factory className="size-4 text-emerald-600" />
              تایید مراحل تولید کارگاه
            </h1>
            <p className="text-[11px] text-muted-foreground">
              اپراتور: {user?.fullName || user?.username || "پرسنل کارگاه"}
            </p>
          </div>
        </div>

        <Button
          variant="ghost"
          size="icon"
          onClick={() => refetch()}
          disabled={isRefetching}
          className="size-9 rounded-xl hover:bg-muted"
          title="بروزرسانی داده‌ها"
        >
          <RefreshCw className={cn("size-4 text-muted-foreground", isRefetching && "animate-spin text-primary")} />
        </Button>
      </header>

      {/* ───────────────────────── تب‌ها و فیلتر ایستگاه‌های کاری ───────────────────────── */}
      <div className="border-b bg-card px-3 py-2.5 shadow-2xs">
        {/* جستجوی سریع سفارش */}
        <div className="relative mb-2.5">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="جستجو در کد سفارش، پروژه، مشتری یا نصاب..."
            className="h-10 pr-9 pl-8 text-xs font-semibold rounded-xl bg-muted/40 border-border/80"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-1"
            >
              <X className="size-3.5" />
            </button>
          )}
        </div>

        {/* اسلایدر دکمه‌های فیلتر ایستگاه‌های کاری */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1 text-xs">
          <button
            onClick={() => setSelectedStation("ALL")}
            className={cn(
              "shrink-0 px-3 py-1.5 rounded-lg font-bold text-xs transition-all",
              selectedStation === "ALL"
                ? "bg-primary text-primary-foreground shadow-xs"
                : "bg-muted/70 text-muted-foreground hover:bg-muted"
            )}
          >
            همه ({toFa(orders.length)})
          </button>

          {Object.entries(STAGE_CONFIG).map(([key, cfg]) => {
            const count = orders.filter((o) => (o.currentStage || "CUTTING").toUpperCase() === key).length;
            const Icon = cfg.icon;
            const isSelected = selectedStation === key;

            return (
              <button
                key={key}
                onClick={() => setSelectedStation(key)}
                className={cn(
                  "shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold text-xs transition-all border",
                  isSelected
                    ? "bg-foreground text-background border-foreground shadow-xs"
                    : "bg-card text-muted-foreground border-border/60 hover:bg-muted"
                )}
              >
                <Icon className={cn("size-3.5", isSelected ? "text-background" : cfg.color)} />
                <span>{cfg.label}</span>
                {count > 0 && (
                  <span
                    className={cn(
                      "font-mono text-[10px] px-1.5 py-0.2 rounded-full",
                      isSelected ? "bg-background/20 text-background" : "bg-muted text-foreground"
                    )}
                  >
                    {toFa(count)}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* ───────────────────────── لیست سفارش‌های در گردش خط تولید ───────────────────────── */}
      <main className="flex-1 p-3 space-y-3">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <Loader2 className="size-8 text-primary animate-spin" />
            <span className="text-xs text-muted-foreground font-semibold">در حال بارگذاری لیست سفارشات کارگاه...</span>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center gap-3">
            <div className="size-14 rounded-2xl bg-muted/60 flex items-center justify-center text-muted-foreground/50 border border-border">
              <Boxes className="size-7" />
            </div>
            <div>
              <p className="text-sm font-bold text-foreground">سفارشی در این مرحله یافت نشد</p>
              <p className="text-xs text-muted-foreground mt-1">
                برای مشاهده سفارشات سایر ایستگاه‌ها، تب «همه» را انتخاب کنید.
              </p>
            </div>
            {selectedStation !== "ALL" && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedStation("ALL")}
                className="mt-2 text-xs"
              >
                مشاهده همه سفارشات
              </Button>
            )}
          </div>
        ) : (
          filteredOrders.map((ord) => {
            const currentStageKey = (ord.currentStage || "CUTTING").toUpperCase();
            const stageCfg = STAGE_CONFIG[currentStageKey] || STAGE_CONFIG.CUTTING;
            const StageIcon = stageCfg.icon;
            const hasNext = Boolean(stageCfg.next);

            return (
              <Card
                key={ord.id}
                className="overflow-hidden border-border/80 shadow-xs bg-card transition-all hover:border-primary/40"
              >
                {/* نوار رنگی بالای کارت */}
                <div className="flex items-center justify-between border-b border-border/60 bg-muted/30 px-3.5 py-2">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-black text-foreground text-xs">{ord.code}</span>
                    <Badge
                      variant="outline"
                      className={cn(
                        "text-[10px] font-bold px-2 py-0.5",
                        ord.customerType === "B2B"
                          ? "bg-purple-500/10 text-purple-700 border-purple-500/30"
                          : "bg-sky-500/10 text-sky-700 border-sky-500/30"
                      )}
                    >
                      {ord.customerType === "B2B" ? "سفارش B2B (همکار)" : "سفارش B2C (مستقیم)"}
                    </Badge>
                  </div>

                  {Number(ord.priority) >= 2 && (
                    <Badge className="bg-rose-600 text-white text-[10px] font-bold px-2 py-0.5">
                      فوری / اضطراری
                    </Badge>
                  )}
                </div>

                {/* بدنه اطلاعات پروژه و مشتری */}
                <div className="p-3.5 space-y-3">
                  <div>
                    <h3 className="font-bold text-sm text-foreground leading-snug">
                      {ord.projectTitle || "پروژه کابینت و دکوراسیون سفارشی"}
                    </h3>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      سفارش‌دهنده: <span className="font-semibold text-foreground">{ord.customerName}</span>
                      {ord.endClientName && (
                        <span className="text-purple-700 font-semibold mr-1.5">
                          (کارفرمای نهایی: {ord.endClientName})
                        </span>
                      )}
                    </p>
                  </div>

                  {/* نصاب تخصیص داده شده */}
                  <div className="flex items-center justify-between bg-muted/40 p-2 rounded-lg text-xs border border-border/50">
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                      <HardHat className="size-3.5 text-amber-600 shrink-0" />
                      <span>نصاب پروژه:</span>
                      <span className="font-semibold text-foreground">
                        {ord.assignedInstaller || "تعیین‌نشده"}
                      </span>
                    </div>
                    {ord.installerPhone && (
                      <a
                        href={`tel:${ord.installerPhone}`}
                        className="inline-flex items-center gap-1 text-[11px] font-mono font-bold text-primary hover:underline bg-background px-2 py-0.5 rounded border border-border/80"
                      >
                        <Phone className="size-3" />
                        {toFa(ord.installerPhone)}
                      </a>
                    )}
                  </div>

                  {/* وضعیت فعلی مرحله با نشان زنده */}
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5">
                      <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
                      <span className="text-muted-foreground">ایستگاه فعلی:</span>
                      <span className={cn("font-bold px-2 py-0.5 rounded text-xs border", stageCfg.bg)}>
                        <StageIcon className="size-3.5 inline ml-1" />
                        {stageCfg.label}
                      </span>
                    </div>

                    <div className="font-mono text-xs font-bold text-foreground">
                      پیشرفت: {toFa(ord.progressPercent)}٪
                    </div>
                  </div>

                  {/* نوار بصری پیشرفت کل پروژه */}
                  <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-emerald-500 to-primary transition-all duration-500"
                      style={{ width: `${ord.progressPercent}%` }}
                    />
                  </div>

                  {/* دکمه اقدام بزرگ لمسی برای گوشی اپراتور */}
                  {hasNext ? (
                    <Button
                      size="lg"
                      onClick={() => {
                        setSelectedOrder(ord);
                        setAdvanceNotes("");
                      }}
                      className="w-full h-12 text-sm font-bold bg-primary hover:bg-primary/95 text-primary-foreground rounded-xl shadow-xs gap-2 active:scale-[0.98] transition-all"
                    >
                      <Play className="size-4 fill-current ml-1" />
                      تایید این مرحله و {stageCfg.nextLabel}
                    </Button>
                  ) : (
                    <div className="flex items-center justify-center gap-1.5 p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 font-bold text-xs">
                      <CheckCircle2 className="size-4" />
                      این پروژه در تمام ایستگاه‌ها تایید و تحویل شده است.
                    </div>
                  )}
                </div>
              </Card>
            );
          })
        )}
      </main>

      {/* ───────────────────────── دیالوگ تایید و ارتقای مرحله ───────────────────────── */}
      <Dialog open={Boolean(selectedOrder)} onOpenChange={(open) => !open && setSelectedOrder(null)}>
        <DialogContent className="max-w-md p-6 font-sans">
          {selectedOrder && (() => {
            const curKey = (selectedOrder.currentStage || "CUTTING").toUpperCase();
            const curCfg = STAGE_CONFIG[curKey] || STAGE_CONFIG.CUTTING;
            const nextKey = curCfg.next || "COMPLETED";
            const nextCfg = STAGE_CONFIG[nextKey] || STAGE_CONFIG.INSTALLED;
            const NextIcon = nextCfg.icon;

            return (
              <>
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2 text-base">
                    <CheckCircle2 className="size-5 text-emerald-600" />
                    تایید و انتقال به مرحله بعد
                  </DialogTitle>
                  <DialogDescription className="text-xs">
                    سفارش <span className="font-mono font-bold text-foreground">{selectedOrder.code}</span> (
                    {selectedOrder.projectTitle})
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-2 text-xs">
                  {/* فلش انتقال بصری */}
                  <div className="flex items-center justify-between p-3 rounded-xl bg-muted/60 border border-border/80">
                    <div className="flex flex-col items-center gap-1">
                      <span className="text-[11px] text-muted-foreground">ایستگاه فعلی</span>
                      <Badge variant="outline" className="font-bold text-xs">
                        {curCfg.label}
                      </Badge>
                    </div>

                    <ArrowRight className="size-5 text-primary rotate-180" />

                    <div className="flex flex-col items-center gap-1">
                      <span className="text-[11px] text-muted-foreground">ایستگاه بعدی</span>
                      <Badge className="bg-emerald-600 text-white font-bold text-xs gap-1">
                        <NextIcon className="size-3" />
                        {nextCfg.label}
                      </Badge>
                    </div>
                  </div>

                  <div>
                    <label className="font-bold text-foreground block mb-1">
                      توضیحات و گزارش کار اپراتور (اختیاری):
                    </label>
                    <Textarea
                      value={advanceNotes}
                      onChange={(e) => setAdvanceNotes(e.target.value)}
                      placeholder="مثال: قطعات کاملاً برش خورده و بازرسی ابعادی تایید شد..."
                      className="text-xs rounded-xl min-h-[70px]"
                    />
                  </div>

                  {/* ثبت عکس کارگاهی با دوربین گوشی */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="font-bold text-foreground text-[11px]">
                        عکس‌های مرحله کارگاه (دوربین / گالری):
                      </label>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => fileInputRef.current?.click()}
                        className="h-6 text-[10px] gap-1 font-bold text-emerald-700 hover:text-emerald-800"
                      >
                        <Camera className="size-3" />
                        ثبت عکس با گوشی
                      </Button>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        capture="environment"
                        multiple
                        onChange={handlePhotoUpload}
                        className="hidden"
                      />
                    </div>

                    {advancePhotos.length > 0 ? (
                      <div className="grid grid-cols-3 gap-1.5 p-2 bg-muted/40 rounded-xl border border-border/60">
                        {advancePhotos.map((photo, i) => (
                          <div key={i} className="relative aspect-video rounded-lg overflow-hidden border bg-background group">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={photo} alt="Stage preview" className="w-full h-full object-cover" />
                            <button
                              type="button"
                              onClick={() => setAdvancePhotos((p) => p.filter((_, idx) => idx !== i))}
                              className="absolute top-1 right-1 p-0.5 rounded-md bg-black/60 text-white hover:bg-rose-600 transition-colors"
                            >
                              <Trash2 className="size-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div
                        onClick={() => fileInputRef.current?.click()}
                        className="border border-dashed border-border/80 rounded-xl p-2.5 text-center cursor-pointer hover:border-emerald-500/50 hover:bg-emerald-500/[0.02] transition-colors"
                      >
                        <Camera className="size-4 mx-auto text-muted-foreground/60 mb-0.5" />
                        <span className="text-[10px] text-muted-foreground">
                          برای ثبت و الصاق عکس مرحله با دوربین گوشی کلیک کنید
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="text-[11px] text-muted-foreground bg-muted/40 p-2.5 rounded-lg border border-border/50">
                    اپراتور تاییدکننده:{" "}
                    <span className="font-semibold text-foreground">
                      {user?.fullName || user?.username || "پرسنل کارگاه"}
                    </span>
                  </div>
                </div>

                <DialogFooter className="gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSelectedOrder(null);
                      setAdvancePhotos([]);
                    }}
                    className="text-xs"
                  >
                    انصراف
                  </Button>
                  <Button
                    size="sm"
                    disabled={advanceMutation.isPending}
                    onClick={() => {
                      if (!nextKey) return;
                      advanceMutation.mutate({
                        orderId: selectedOrder.id,
                        stage: nextKey,
                        notes: advanceNotes || undefined,
                        photos: advancePhotos.length > 0 ? advancePhotos : undefined,
                      });
                    }}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold gap-1.5"
                  >
                    {advanceMutation.isPending ? "در حال ثبت..." : "تایید مرحله و ارسال"}
                  </Button>
                </DialogFooter>
              </>
            );
          })()}
        </DialogContent>
      </Dialog>
    </div>
  );
}
