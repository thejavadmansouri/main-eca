"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  AlertCircle,
  ArrowRight,
  Boxes,
  Calendar,
  Check,
  CheckCircle2,
  Clock,
  Copy,
  ExternalLink,
  Factory,
  HardHat,
  Loader2,
  MapPin,
  Navigation,
  Package,
  Phone,
  Plus,
  RefreshCw,
  Search,
  ShieldCheck,
  Sparkles,
  Truck,
  User,
  Wrench,
  X,
} from "lucide-react";

import {
  createInstallationOrder,
  getInstallationOrders,
  updateInstallationStatus,
} from "@/lib/api";
import { useAuthStore } from "@/lib/auth-store";
import { faDate, toFa } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { InstallationOrderRow } from "@/lib/types";
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

const STATUS_CONFIG: Record<
  string,
  {
    label: string;
    icon: any;
    color: string;
    bg: string;
  }
> = {
  SCHEDULED: {
    label: "برنامه‌ریزی شده",
    icon: Calendar,
    color: "text-amber-500",
    bg: "bg-amber-500/10 border-amber-500/30 text-amber-700",
  },
  LOADED: {
    label: "بارگیری در انبار",
    icon: Package,
    color: "text-blue-500",
    bg: "bg-blue-500/10 border-blue-500/30 text-blue-700",
  },
  IN_TRANSIT: {
    label: "در مسیر محل مشتری",
    icon: Truck,
    color: "text-purple-500",
    bg: "bg-purple-500/10 border-purple-500/30 text-purple-700",
  },
  INSTALLING: {
    label: "در حال نصب در محل",
    icon: Wrench,
    color: "text-sky-500",
    bg: "bg-sky-500/10 border-sky-500/30 text-sky-700",
  },
  COMPLETED: {
    label: "نصب و تحویل قطعی",
    icon: CheckCircle2,
    color: "text-emerald-600",
    bg: "bg-emerald-600/10 border-emerald-600/30 text-emerald-700",
  },
};

/** صدای تأیید عملیات برای نصاب */
function playBeep() {
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.setValueAtTime(520, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.15);
    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);
    osc.start();
    osc.stop(ctx.currentTime + 0.15);
  } catch {}
}

export default function WorkerInstallationsPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = React.useState<string>("ACTIVE");
  const [searchQuery, setSearchQuery] = React.useState("");
  const [copiedId, setCopiedId] = React.useState<string | null>(null);

  // دیالوگ تکمیل نصب و تحویل
  const [selectedInst, setSelectedInst] = React.useState<InstallationOrderRow | null>(null);
  const [checkLevel, setCheckLevel] = React.useState(true);
  const [checkHinges, setCheckHinges] = React.useState(true);
  const [checkClean, setCheckClean] = React.useState(true);
  const [checkClientSigned, setCheckClientSigned] = React.useState(true);
  const [completionNotes, setCompletionNotes] = React.useState("");

  // دیالوگ ثبت ماموریت جدید
  const [isNewModalOpen, setIsNewModalOpen] = React.useState(false);
  const [newCustomerName, setNewCustomerName] = React.useState("");
  const [newPhone, setNewPhone] = React.useState("");
  const [newAddress, setNewAddress] = React.useState("");
  const [newDriver, setNewDriver] = React.useState("");
  const [newDate, setNewDate] = React.useState("");

  const {
    data: installations = [],
    isLoading,
    refetch,
    isRefetching,
  } = useQuery<InstallationOrderRow[]>({
    queryKey: ["installations"],
    queryFn: getInstallationOrders,
    refetchInterval: 15000,
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({
      id,
      status,
      completionNotes,
      customerSignature,
    }: {
      id: string;
      status: string;
      completionNotes?: string;
      customerSignature?: boolean;
    }) =>
      updateInstallationStatus(id, {
        status,
        completionNotes,
        customerSignature,
      }),
    onSuccess: (_, vars) => {
      playBeep();
      queryClient.invalidateQueries({ queryKey: ["installations"] });
      queryClient.invalidateQueries({ queryKey: ["production-matrix"] });
      setSelectedInst(null);
      setCompletionNotes("");
      const st = STATUS_CONFIG[vars.status];
      toast({
        title: "وضعیت ماموریت نصب به‌روز شد",
        description: `وضعیت به «${st?.label || vars.status}» تغییر یافت.`,
      });
    },
    onError: (err: any) => {
      toast({
        title: "خطا در بروزرسانی وضعیت نصب",
        description: err?.message || "مشکلی در ذخیره رخ داد.",
        variant: "destructive",
      });
    },
  });

  const createMutation = useMutation({
    mutationFn: createInstallationOrder,
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ["installations"] });
      setIsNewModalOpen(false);
      setNewCustomerName("");
      setNewPhone("");
      setNewAddress("");
      setNewDriver("");
      toast({
        title: "ماموریت نصب با موفقیت ثبت شد",
        description: `شماره حکم اعزام: ${res.orderNumber}`,
      });
    },
    onError: (err: any) => {
      toast({
        title: "خطا در ثبت ماموریت نصب",
        description: err?.message || "مشکلی رخ داده است.",
        variant: "destructive",
      });
    },
  });

  const handleCopyAddress = (id: string, address: string) => {
    navigator.clipboard.writeText(address);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
    toast({ title: "آدرس پروژه در حافظه کپی شد" });
  };

  const filteredInstallations = React.useMemo(() => {
    return installations.filter((inst) => {
      if (activeTab === "ACTIVE" && inst.status === "COMPLETED") return false;
      if (activeTab === "COMPLETED" && inst.status !== "COMPLETED") return false;
      if (activeTab !== "ALL" && activeTab !== "ACTIVE" && activeTab !== "COMPLETED" && inst.status !== activeTab) {
        return false;
      }

      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase().trim();
      return (
        inst.orderNumber.toLowerCase().includes(q) ||
        inst.customerName.toLowerCase().includes(q) ||
        inst.contactPhone.toLowerCase().includes(q) ||
        inst.projectAddress.toLowerCase().includes(q) ||
        (inst.installerLead && inst.installerLead.toLowerCase().includes(q)) ||
        (inst.productionOrder?.code && inst.productionOrder.code.toLowerCase().includes(q))
      );
    });
  }, [installations, activeTab, searchQuery]);

  const activeCount = installations.filter((i) => i.status !== "COMPLETED").length;
  const completedCount = installations.filter((i) => i.status === "COMPLETED").length;

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
              <HardHat className="size-4 text-amber-600" />
              کارتابل اعزام و نصاب‌ها
            </h1>
            <p className="text-[11px] text-muted-foreground">
              سرپرست تیم: {user?.fullName || user?.username || "نصاب کاردو"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <Button
            size="sm"
            onClick={() => setIsNewModalOpen(true)}
            className="h-8 text-xs gap-1 bg-amber-600 hover:bg-amber-700 text-white rounded-xl shadow-xs font-bold"
          >
            <Plus className="size-3.5" />
            ماموریت جدید
          </Button>

          <Button
            variant="ghost"
            size="icon"
            onClick={() => refetch()}
            disabled={isRefetching}
            className="size-8 rounded-xl hover:bg-muted"
            title="بروزرسانی"
          >
            <RefreshCw className={cn("size-3.5 text-muted-foreground", isRefetching && "animate-spin text-primary")} />
          </Button>
        </div>
      </header>

      {/* ───────────────────────── جستجو و فیلترها ───────────────────────── */}
      <div className="border-b bg-card px-3 py-2.5 shadow-2xs space-y-2.5">
        <div className="relative">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="جستجو در مشتری، تلفن، آدرس، کد سفارش ساخت..."
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

        {/* دکمه‌های فیلتر وضعیت */}
        <div className="flex items-center gap-1.5 text-xs">
          <button
            onClick={() => setActiveTab("ACTIVE")}
            className={cn(
              "flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl font-bold text-xs transition-all border",
              activeTab === "ACTIVE"
                ? "bg-amber-600 text-white border-amber-700 shadow-xs"
                : "bg-muted/60 text-muted-foreground border-border/60 hover:bg-muted"
            )}
          >
            <Clock className="size-3.5" />
            <span>در حال انجام</span>
            {activeCount > 0 && (
              <span className="font-mono text-[10px] bg-black/20 text-white px-1.5 py-0.2 rounded-full">
                {toFa(activeCount)}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab("COMPLETED")}
            className={cn(
              "flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl font-bold text-xs transition-all border",
              activeTab === "COMPLETED"
                ? "bg-emerald-600 text-white border-emerald-700 shadow-xs"
                : "bg-muted/60 text-muted-foreground border-border/60 hover:bg-muted"
            )}
          >
            <CheckCircle2 className="size-3.5" />
            <span>تحویل شده</span>
            {completedCount > 0 && (
              <span className="font-mono text-[10px] bg-black/20 text-white px-1.5 py-0.2 rounded-full">
                {toFa(completedCount)}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab("ALL")}
            className={cn(
              "px-3 py-2 rounded-xl font-bold text-xs transition-all border",
              activeTab === "ALL"
                ? "bg-foreground text-background border-foreground shadow-xs"
                : "bg-muted/60 text-muted-foreground border-border/60 hover:bg-muted"
            )}
          >
            همه ({toFa(installations.length)})
          </button>
        </div>
      </div>

      {/* ───────────────────────── لیست کارت‌های نصب ───────────────────────── */}
      <main className="flex-1 p-3 space-y-3">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <Loader2 className="size-8 text-primary animate-spin" />
            <span className="text-xs text-muted-foreground font-semibold">در حال بارگذاری ماموریت‌های نصب...</span>
          </div>
        ) : filteredInstallations.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center gap-3">
            <div className="size-14 rounded-2xl bg-muted/60 flex items-center justify-center text-muted-foreground/50 border border-border">
              <HardHat className="size-7" />
            </div>
            <div>
              <p className="text-sm font-bold text-foreground">ماموریت نصبی در این وضعیت یافت نشد</p>
              <p className="text-xs text-muted-foreground mt-1">
                برای ثبت ماموریت جدید روی دکمه بالا کلیک کنید.
              </p>
            </div>
          </div>
        ) : (
          filteredInstallations.map((inst) => {
            const st = STATUS_CONFIG[inst.status] || STATUS_CONFIG.SCHEDULED;
            const StatusIcon = st.icon;

            return (
              <Card
                key={inst.id}
                className="overflow-hidden border-border/80 shadow-xs bg-card transition-all hover:border-amber-500/40"
              >
                {/* هدر کارت نصب */}
                <div className="flex items-center justify-between border-b border-border/60 bg-muted/30 px-3.5 py-2">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-black text-foreground text-xs">{inst.orderNumber}</span>
                    <Badge variant="outline" className={cn("text-[10px] font-bold px-2 py-0.5 border", st.bg)}>
                      <StatusIcon className="size-3 inline ml-1" />
                      {st.label}
                    </Badge>
                  </div>

                  <span className="font-mono text-[11px] text-muted-foreground">
                    اعزام: {faDate(inst.scheduledDate)}
                  </span>
                </div>

                {/* مشخصات مشتری و پروژه */}
                <div className="p-3.5 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="font-bold text-sm text-foreground flex items-center gap-1.5">
                        <User className="size-4 text-primary shrink-0" />
                        {inst.customerName}
                      </h3>
                      {inst.productionOrder && (
                        <p className="text-xs text-muted-foreground mt-0.5">
                          سفارش ساخت متصل:{" "}
                          <span className="font-mono font-bold text-foreground">
                            {inst.productionOrder.code}
                          </span>
                        </p>
                      )}
                    </div>

                    {/* دکمه تماس مستقیم با مشتری */}
                    <a
                      href={`tel:${inst.contactPhone}`}
                      className="inline-flex items-center gap-1.5 text-xs font-mono font-bold bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-xl shadow-xs active:scale-95 transition-all"
                    >
                      <Phone className="size-3.5" />
                      {toFa(inst.contactPhone)}
                    </a>
                  </div>

                  {/* آدرس محل پروژه و دکمه مسیریابی */}
                  <div className="bg-muted/40 p-2.5 rounded-xl border border-border/50 text-xs space-y-1.5">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-start gap-1.5 text-muted-foreground leading-relaxed">
                        <MapPin className="size-4 text-rose-500 shrink-0 mt-0.5" />
                        <span className="text-foreground font-medium select-all">{inst.projectAddress}</span>
                      </div>
                      <button
                        onClick={() => handleCopyAddress(inst.id, inst.projectAddress)}
                        className="p-1 rounded bg-background border border-border text-muted-foreground hover:text-foreground shrink-0"
                        title="کپی آدرس جهت مسیریاب"
                      >
                        {copiedId === inst.id ? (
                          <Check className="size-3.5 text-emerald-600" />
                        ) : (
                          <Copy className="size-3.5" />
                        )}
                      </button>
                    </div>

                    {inst.driverName && (
                      <div className="text-[11px] text-muted-foreground pt-1 border-t border-border/40 flex items-center gap-1.5">
                        <Truck className="size-3.5 text-sky-600 shrink-0" />
                        <span>راننده حمل بار: <strong className="text-foreground">{inst.driverName}</strong></span>
                      </div>
                    )}
                  </div>

                  {/* یادداشت اتمام و تایید مشتری */}
                  {inst.completionNotes && (
                    <div className="text-xs bg-emerald-500/10 border border-emerald-500/20 p-2.5 rounded-xl text-emerald-800 space-y-1">
                      <span className="font-bold flex items-center gap-1">
                        <CheckCircle2 className="size-3.5" />
                        گزارش تحویل در محل:
                      </span>
                      <p className="leading-relaxed">{inst.completionNotes}</p>
                    </div>
                  )}

                  {/* دکمه‌های اقدام گردش کار نصاب بر اساس وضعیت فعلی */}
                  <div className="pt-1">
                    {inst.status === "SCHEDULED" && (
                      <Button
                        size="lg"
                        onClick={() =>
                          updateStatusMutation.mutate({
                            id: inst.id,
                            status: "IN_TRANSIT",
                          })
                        }
                        disabled={updateStatusMutation.isPending}
                        className="w-full h-11 text-xs font-bold bg-purple-600 hover:bg-purple-700 text-white rounded-xl shadow-xs gap-2"
                      >
                        <Truck className="size-4" />
                        بارگیری شد و حرکت به سوی آدرس مشتری
                      </Button>
                    )}

                    {inst.status === "IN_TRANSIT" && (
                      <Button
                        size="lg"
                        onClick={() =>
                          updateStatusMutation.mutate({
                            id: inst.id,
                            status: "INSTALLING",
                          })
                        }
                        disabled={updateStatusMutation.isPending}
                        className="w-full h-11 text-xs font-bold bg-sky-600 hover:bg-sky-700 text-white rounded-xl shadow-xs gap-2"
                      >
                        <Wrench className="size-4" />
                        رسیدیم — اعلام شروع نصب در محل پروژه
                      </Button>
                    )}

                    {inst.status === "INSTALLING" && (
                      <Button
                        size="lg"
                        onClick={() => {
                          setSelectedInst(inst);
                          setCheckLevel(true);
                          setCheckHinges(true);
                          setCheckClean(true);
                          setCheckClientSigned(true);
                          setCompletionNotes("");
                        }}
                        className="w-full h-11 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-xs gap-2"
                      >
                        <CheckCircle2 className="size-4" />
                        تکمیل نصب و دریافت رضایت‌نامه مشتری
                      </Button>
                    )}

                    {inst.status === "COMPLETED" && (
                      <div className="flex items-center justify-center gap-1.5 p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 font-bold text-xs">
                        <CheckCircle2 className="size-4" />
                        این پروژه با موفقیت نصب، تست و تحویل کارفرما گردید.
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            );
          })
        )}
      </main>

      {/* ───────────────────────── دیالوگ چک‌لیست تحویل قطعی به مشتری ───────────────────────── */}
      <Dialog open={Boolean(selectedInst)} onOpenChange={(open) => !open && setSelectedInst(null)}>
        <DialogContent className="max-w-md p-6 font-sans">
          {selectedInst && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2 text-base">
                  <CheckCircle2 className="size-5 text-emerald-600" />
                  چک‌لیست تحویل و اتمام پروژه در محل
                </DialogTitle>
                <DialogDescription className="text-xs">
                  ماموریت <span className="font-mono font-bold text-foreground">{selectedInst.orderNumber}</span> (مشتری:{" "}
                  {selectedInst.customerName})
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-3.5 py-2 text-xs">
                <div className="space-y-2 bg-muted/40 p-3 rounded-xl border border-border/80">
                  <span className="font-bold text-foreground block mb-1">
                    چک‌لیست کنترل نهایی نصب کابینت / دکوراسیون:
                  </span>

                  <label className="flex items-center gap-2 cursor-pointer py-1">
                    <input
                      type="checkbox"
                      checked={checkLevel}
                      onChange={(e) => setCheckLevel(e.target.checked)}
                      className="size-4 rounded text-primary focus:ring-primary"
                    />
                    <span className="font-medium text-foreground">تراز دقیق یونیت‌های زمینی و دیواری و اتصال محکم</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer py-1">
                    <input
                      type="checkbox"
                      checked={checkHinges}
                      onChange={(e) => setCheckHinges(e.target.checked)}
                      className="size-4 rounded text-primary focus:ring-primary"
                    />
                    <span className="font-medium text-foreground">رگلاژ کامل درب‌ها، جک‌ها، لولاها و ریل‌های کشو</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer py-1">
                    <input
                      type="checkbox"
                      checked={checkClean}
                      onChange={(e) => setCheckClean(e.target.checked)}
                      className="size-4 rounded text-primary focus:ring-primary"
                    />
                    <span className="font-medium text-foreground">نظافت کامل خاک اره و براده‌ها از محیط و داخل یونیت‌ها</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer py-1">
                    <input
                      type="checkbox"
                      checked={checkClientSigned}
                      onChange={(e) => setCheckClientSigned(e.target.checked)}
                      className="size-4 rounded text-primary focus:ring-primary"
                    />
                    <span className="font-bold text-emerald-700">امضای برگه تحویل قطعی و رضایت کامل مشتری در محل</span>
                  </label>
                </div>

                <div>
                  <label className="font-bold text-foreground block mb-1">
                    گزارش و توضیحات نصاب (اختیاری):
                  </label>
                  <Textarea
                    value={completionNotes}
                    onChange={(e) => setCompletionNotes(e.target.value)}
                    placeholder="مثال: کار بدون هیچ‌گونه ایرادی نصب شد و کلید تحویل کارفرما گردید..."
                    className="text-xs rounded-xl min-h-[80px]"
                  />
                </div>
              </div>

              <DialogFooter className="gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedInst(null)}
                  className="text-xs"
                >
                  انصراف
                </Button>
                <Button
                  size="sm"
                  disabled={updateStatusMutation.isPending || !checkClientSigned}
                  onClick={() => {
                    updateStatusMutation.mutate({
                      id: selectedInst.id,
                      status: "COMPLETED",
                      completionNotes: completionNotes || "نصب کامل و تحویل بدون نقص به کارفرما در محل پروژه",
                      customerSignature: true,
                    });
                  }}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold gap-1.5"
                >
                  {updateStatusMutation.isPending ? "در حال ثبت..." : "تایید تحویل نهایی و بستن پرونده"}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* ───────────────────────── دیالوگ ثبت ماموریت جدید ───────────────────────── */}
      <Dialog open={isNewModalOpen} onOpenChange={setIsNewModalOpen}>
        <DialogContent className="max-w-md p-6 font-sans">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base">
              <HardHat className="size-5 text-amber-600" />
              ثبت ماموریت نصب و اعزام جدید
            </DialogTitle>
            <DialogDescription className="text-xs">
              مشخصات مشتری و آدرس پروژه را جهت اعزام تیم نصب وارد کنید.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2 text-xs">
            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="font-bold text-foreground block mb-1">نام مشتری یا کارفرما:</label>
                <Input
                  value={newCustomerName}
                  onChange={(e) => setNewCustomerName(e.target.value)}
                  placeholder="آقای سهرابی"
                  className="h-9 text-xs rounded-lg"
                />
              </div>

              <div>
                <label className="font-bold text-foreground block mb-1">تلفن تماس:</label>
                <Input
                  value={newPhone}
                  onChange={(e) => setNewPhone(e.target.value)}
                  placeholder="09121112233"
                  className="h-9 text-xs rounded-lg font-mono"
                />
              </div>
            </div>

            <div>
              <label className="font-bold text-foreground block mb-1">آدرس دقیق محل پروژه:</label>
              <Textarea
                value={newAddress}
                onChange={(e) => setNewAddress(e.target.value)}
                placeholder="تهران، ولنجک، خیابان چهاردهم، پلاک ۲۰، واحد ۵"
                className="text-xs rounded-lg min-h-[60px]"
              />
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="font-medium text-foreground block mb-1">راننده / وانت بارگیری:</label>
                <Input
                  value={newDriver}
                  onChange={(e) => setNewDriver(e.target.value)}
                  placeholder="آقای احمدی (وانت)"
                  className="h-9 text-xs rounded-lg"
                />
              </div>

              <div>
                <label className="font-medium text-foreground block mb-1">تاریخ اعزام:</label>
                <Input
                  type="date"
                  value={newDate}
                  onChange={(e) => setNewDate(e.target.value)}
                  className="h-9 text-xs rounded-lg font-mono"
                />
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsNewModalOpen(false)}
              className="text-xs"
            >
              انصراف
            </Button>
            <Button
              size="sm"
              disabled={createMutation.isPending || !newCustomerName.trim() || !newPhone.trim() || !newAddress.trim()}
              onClick={() => {
                createMutation.mutate({
                  customerName: newCustomerName.trim(),
                  contactPhone: newPhone.trim(),
                  projectAddress: newAddress.trim(),
                  driverName: newDriver.trim() || undefined,
                  installerLead: user?.fullName || user?.username || "نصاب کاردو",
                  scheduledDate: newDate ? new Date(newDate).toISOString() : new Date().toISOString(),
                });
              }}
              className="bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold gap-1.5"
            >
              {createMutation.isPending ? "در حال ثبت..." : "ثبت و صدور حکم اعزام"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
