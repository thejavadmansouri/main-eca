"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  ArrowRight,
  Boxes,
  CheckCircle2,
  ChevronLeft,
  ClipboardList,
  Factory,
  HardHat,
  Loader2,
  LogOut,
  Package,
  QrCode,
  Radio,
  RefreshCw,
  ScanLine,
  ShieldCheck,
  Sparkles,
  Truck,
  User,
  Wrench,
} from "lucide-react";

import { useAuthStore } from "@/lib/auth-store";
import { startVoiceSession } from "@/lib/api";
import { ApiException } from "@/lib/api-error-messages";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { useWorkerSession } from "./_context/worker-session";

export default function WorkerHomePage() {
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const { toast } = useToast();
  const { sessionId, setSessionId } = useWorkerSession();
  const [starting, setStarting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  async function handleStartShift() {
    setError(null);
    setStarting(true);
    try {
      const s = await startVoiceSession({});
      setSessionId(s.id);
      toast({
        title: "شیفت کاری فعال شد",
        description: "جلسه کاری شما با موفقیت ثبت گردید.",
      });
    } catch (e) {
      const msg = e instanceof ApiException ? e.message : "خطا در ثبت شیفت";
      setError(msg);
      toast({ variant: "destructive", title: "خطا", description: msg });
    } finally {
      setStarting(false);
    }
  }

  function handleLogout() {
    logout();
    router.replace("/login");
  }

  const shortId = sessionId ? sessionId.slice(0, 8) : null;

  return (
    <div className="flex flex-1 flex-col min-h-screen bg-muted/20 font-sans pb-8">
      {/* ───────────────────────── هدر مشخصات اپراتور ───────────────────────── */}
      <header className="sticky top-0 z-30 flex items-center justify-between border-b bg-background/95 px-4 py-3 backdrop-blur-md shadow-2xs">
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-2xl bg-primary/10 border border-primary/20 text-primary font-black text-sm">
            {user?.fullName?.charAt(0) || user?.username?.charAt(0) || "ک"}
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-black text-foreground">
              {user?.fullName ?? user?.username ?? "اپراتور انبار و کارگاه"}
            </p>
            <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
              <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>پنل موبایل پرسنل کاردو</span>
            </div>
          </div>
        </div>

        <Button
          variant="ghost"
          size="icon"
          className="size-10 rounded-2xl text-muted-foreground hover:text-rose-600 hover:bg-rose-500/10 transition-colors"
          onClick={handleLogout}
          aria-label="خروج از حساب"
          title="خروج از حساب"
        >
          <LogOut className="size-5" />
        </Button>
      </header>

      {/* ───────────────────────── بدنه اصلی و کاشی‌های لمسی ───────────────────────── */}
      <main className="flex flex-1 flex-col gap-4 p-4">
        {error ? (
          <Alert variant="destructive" className="rounded-2xl">
            <AlertCircle className="size-4" />
            <AlertTitle>خطا</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : null}

        {/* بنر وضعیت شیفت */}
        <div className="flex items-center justify-between bg-card p-3 rounded-2xl border border-border/80 shadow-2xs">
          <div className="flex items-center gap-2 text-xs">
            <Radio className="size-4 text-emerald-600 animate-pulse" />
            <span className="text-muted-foreground">وضعیت اپراتور:</span>
            <span className="font-bold text-foreground">
              {sessionId ? "شیفت کاری فعال" : "آماده به کار"}
            </span>
          </div>

          {sessionId ? (
            <Badge variant="outline" className="font-mono text-[10px] bg-muted/60">
              {shortId}
            </Badge>
          ) : (
            <Button
              variant="outline"
              size="sm"
              onClick={handleStartShift}
              disabled={starting}
              className="h-7 text-[11px] font-bold rounded-lg gap-1 border-primary/30 text-primary hover:bg-primary/10"
            >
              {starting ? <Loader2 className="size-3 animate-spin" /> : <RefreshCw className="size-3" />}
              ثبت شروع شیفت
            </Button>
          )}
        </div>

        <div className="space-y-1">
          <h2 className="text-xs font-bold text-muted-foreground px-1">
            عملیات اجرایی کارگاه و انبار:
          </h2>
        </div>

        {/* کاشی ۱: تایید مراحل تولید و ایستگاه‌های کارگاه (کابینت / دکوراسیون) */}
        <Link
          href="/worker/production"
          className="group relative overflow-hidden rounded-2xl border-2 border-emerald-500/30 bg-gradient-to-br from-card via-card to-emerald-500/[0.04] p-4 shadow-xs transition-all active:scale-[0.98] hover:border-emerald-500/60 hover:shadow-md"
        >
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-3.5">
              <div className="flex size-13 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-700 border border-emerald-500/30 shrink-0 group-hover:bg-emerald-500 group-hover:text-white transition-all shadow-xs">
                <Factory className="size-7" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-black text-foreground">
                    تایید مراحل تولید و کارگاه
                  </h3>
                  <Badge className="bg-emerald-600 text-white text-[10px] font-bold">
                    ایستگاه‌ها
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  تایید مرحله‌به‌مرحله برش، لبه‌چسبانی، CNC، مونتاژ، رنگ، بسته‌بندی و نصاب‌ها
                </p>
              </div>
            </div>
            <ChevronLeft className="size-5 text-muted-foreground/60 group-hover:text-emerald-600 group-hover:-translate-x-1 transition-all shrink-0 mt-1" />
          </div>
        </Link>

        {/* کاشی ۲: تاییدیه ورود بار و کنترل کیفی انبار */}
        <Link
          href="/worker/inbound"
          className="group relative overflow-hidden rounded-2xl border-2 border-sky-500/30 bg-gradient-to-br from-card via-card to-sky-500/[0.04] p-4 shadow-xs transition-all active:scale-[0.98] hover:border-sky-500/60 hover:shadow-md"
        >
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-3.5">
              <div className="flex size-13 items-center justify-center rounded-2xl bg-sky-500/10 text-sky-700 border border-sky-500/30 shrink-0 group-hover:bg-sky-600 group-hover:text-white transition-all shadow-xs">
                <Truck className="size-7" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-black text-foreground">
                    تاییدیه و ترخیص ورود بار
                  </h3>
                  <Badge className="bg-sky-600 text-white text-[10px] font-bold">
                    کنترل کیفی
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  بررسی بارنامه کامیون، بازرسی سلامت اقلام و تایید تخلیه به انبار
                </p>
              </div>
            </div>
            <ChevronLeft className="size-5 text-muted-foreground/60 group-hover:text-sky-600 group-hover:-translate-x-1 transition-all shrink-0 mt-1" />
          </div>
        </Link>

        {/* کاشی ۳: کارتابل اعزام و نصاب‌ها */}
        <Link
          href="/worker/installations"
          className="group relative overflow-hidden rounded-2xl border-2 border-amber-500/30 bg-gradient-to-br from-card via-card to-amber-500/[0.04] p-4 shadow-xs transition-all active:scale-[0.98] hover:border-amber-500/60 hover:shadow-md"
        >
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-3.5">
              <div className="flex size-13 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-700 border border-amber-500/30 shrink-0 group-hover:bg-amber-600 group-hover:text-white transition-all shadow-xs">
                <HardHat className="size-7" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-black text-foreground">
                    کارتابل اعزام و نصاب‌ها
                  </h3>
                  <Badge className="bg-amber-600 text-white text-[10px] font-bold">
                    در محل مشتری
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  آدرس و تماس مشتری، مسیریابی، شروع نصب و ثبت چک‌لیست و رضایت‌نامه
                </p>
              </div>
            </div>
            <ChevronLeft className="size-5 text-muted-foreground/60 group-hover:text-amber-600 group-hover:-translate-x-1 transition-all shrink-0 mt-1" />
          </div>
        </Link>

        {/* کاشی ۳: ثبت ورود بارکدی کالا */}
        <Link
          href="/worker/scan"
          className="group relative overflow-hidden rounded-2xl border border-border/80 bg-card p-4 shadow-xs transition-all active:scale-[0.98] hover:border-primary/40 hover:shadow-sm"
        >
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-3.5">
              <div className="flex size-13 items-center justify-center rounded-2xl bg-primary/10 text-primary border border-primary/20 shrink-0 group-hover:bg-primary group-hover:text-primary-foreground transition-all shadow-2xs">
                <Package className="size-7" />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-foreground">
                  ثبت ورود بارکدی کالا (قفسه‌گذاری)
                </h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  اسکن بارکد اقلام و تخصیص مستقیم به موقعیت‌های قفسه‌بندی
                </p>
              </div>
            </div>
            <ChevronLeft className="size-5 text-muted-foreground/50 group-hover:text-primary group-hover:-translate-x-1 transition-all shrink-0 mt-1" />
          </div>
        </Link>

        {/* کاشی ۴: انبارگردانی و شمارش */}
        <Link
          href="/worker/count"
          className="group relative overflow-hidden rounded-2xl border border-border/80 bg-card p-4 shadow-xs transition-all active:scale-[0.98] hover:border-amber-500/40 hover:shadow-sm"
        >
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-3.5">
              <div className="flex size-13 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-700 border border-amber-500/20 shrink-0 group-hover:bg-amber-500 group-hover:text-white transition-all shadow-2xs">
                <ClipboardList className="size-7" />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-foreground">
                  شمارش و انبارگردانی دوره‌ای
                </h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  شمارش فیزیکی موجودی قفسه‌ها و ثبت آنلاین مغایرت‌ها
                </p>
              </div>
            </div>
            <ChevronLeft className="size-5 text-muted-foreground/50 group-hover:text-amber-600 group-hover:-translate-x-1 transition-all shrink-0 mt-1" />
          </div>
        </Link>

        {/* فوتر ناوبری سریع به پنل مدیریت در صورت ادمین بودن */}
        {user && ["ADMIN", "MANAGER"].includes(user.role) && (
          <div className="mt-auto pt-4 text-center">
            <Link
              href="/admin"
              className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground font-semibold bg-muted/50 px-3 py-1.5 rounded-xl border border-border/60 transition-colors"
            >
              <span>رفتن به داشبورد مدیریتی (دسکتاپ)</span>
              <ArrowRight className="size-3.5 rotate-180" />
            </Link>
          </div>
        )}
      </main>
    </div>
  );
}
