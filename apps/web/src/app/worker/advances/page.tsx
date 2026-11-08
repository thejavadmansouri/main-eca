"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Coins,
  CreditCard,
  PlusCircle,
  FileText,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Clock,
  ArrowRight,
  ChevronLeft,
  Sparkles,
  Info,
  Loader2,
  Calendar,
  Receipt,
  Wallet,
} from "lucide-react";

import { useAuthStore } from "@/lib/auth-store";
import { getSalaryAdvances, createSalaryAdvance, getMyProfile } from "@/lib/api";
import { amount, faDate, money, toFa } from "@/lib/format";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";

const ADVANCE_STATUS_LABELS: Record<string, { label: string; color: string }> = {
  PENDING: { label: "در انتظار بررسی مالی", color: "bg-amber-50 text-amber-700 border-amber-300" },
  APPROVED: { label: "موافقت شده (آماده پرداخت)", color: "bg-sky-50 text-sky-700 border-sky-300" },
  PAID: { label: "واریز شده به حساب", color: "bg-emerald-50 text-emerald-700 border-emerald-300" },
  DEDUCTED: { label: "کسر شده از فیش حقوقی", color: "bg-emerald-100 text-emerald-800 border-emerald-200" },
  REJECTED: { label: "عدم موافقت امور مالی", color: "bg-rose-50 text-rose-700 border-rose-300" },
};

const PERSIAN_MONTHS = [
  "فروردین", "اردیبهشت", "خرداد", "تیر", "مرداد", "شهریور",
  "مهر", "آبان", "آذر", "دی", "بهمن", "اسفند"
];

export default function WorkerAdvancesPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { toast } = useToast();
  const qc = useQueryClient();

  const [isOpenNewModal, setIsOpenNewModal] = React.useState(false);
  const [amountInput, setAmountInput] = React.useState<string>("");
  const [periodYear, setPeriodYear] = React.useState<number>(1403);
  const [periodMonth, setPeriodMonth] = React.useState<number>(11);
  const [reason, setReason] = React.useState("");
  const [paymentMethod, setPaymentMethod] = React.useState("CARD");

  // دریافت اطلاعات پروفایل پرسنلی
  const profileQ = useQuery({
    queryKey: ["my-profile"],
    queryFn: getMyProfile,
  });

  const employee = profileQ.data?.employee;
  const employeeId = employee?.id;

  // دریافت سوابق مساعده‌های پرسنل
  const advancesQ = useQuery({
    queryKey: ["my-advances", employeeId],
    queryFn: () => getSalaryAdvances({ employeeId: employeeId! }),
    enabled: !!employeeId,
  });

  // ارسال درخواست مساعده
  const createMutation = useMutation({
    mutationFn: createSalaryAdvance,
    onSuccess: () => {
      toast({
        title: "درخواست مساعده ثبت شد",
        description: "درخواست شما جهت تایید به واحد حسابداری و مدیرعامل ارجاع داده شد.",
      });
      setIsOpenNewModal(false);
      resetForm();
      qc.invalidateQueries({ queryKey: ["my-advances"] });
    },
    onError: (err: any) => {
      toast({
        variant: "destructive",
        title: "خطا در ثبت درخواست",
        description: err.message || "لطفاً ورودی‌ها را بررسی و مجدداً تلاش نمایید.",
      });
    },
  });

  function resetForm() {
    setAmountInput("");
    setReason("");
    setPaymentMethod("CARD");
  }

  function handleSubmit() {
    if (!employeeId) {
      toast({
        variant: "destructive",
        title: "پرونده پرسنلی یافت نشد",
        description: "حساب کاربری شما هنوز به پرونده پرسنلی در کارگزینی متصل نشده است.",
      });
      return;
    }

    const numAmount = Number(amountInput.replace(/,/g, ""));
    if (!numAmount || numAmount <= 0) {
      toast({
        variant: "destructive",
        title: "مبلغ نامعتبر است",
        description: "لطفاً مبلغ مساعده درخواستی را به ریال مشخص فرمایید.",
      });
      return;
    }

    createMutation.mutate({
      employeeId,
      amount: numAmount,
      periodYear,
      periodMonth,
      reason,
      paymentMethod,
    });
  }

  const advances = advancesQ.data || [];
  const parsedAmount = Number(amountInput.replace(/,/g, "")) || 0;

  // محاسبه مجموع مساعده‌های تاییدشده دوره جاری
  const totalApprovedThisMonth = advances
    .filter((a) => a.periodYear === periodYear && a.periodMonth === periodMonth && ["APPROVED", "PAID", "DEDUCTED"].includes(a.status))
    .reduce((sum, a) => sum + a.amount, 0);

  return (
    <div className="flex flex-1 flex-col min-h-screen bg-muted/20 font-sans pb-10">
      {/* ───────────────────────── هدر موبایل ───────────────────────── */}
      <header className="sticky top-0 z-30 flex items-center justify-between border-b bg-background/95 px-4 py-3 backdrop-blur-md shadow-2xs">
        <div className="flex items-center gap-3">
          <Link
            href="/worker"
            className="flex size-9 items-center justify-center rounded-xl bg-muted/60 text-muted-foreground hover:text-foreground transition-colors"
          >
            <ChevronLeft className="size-5 rotate-180" />
          </Link>
          <div>
            <h1 className="text-base font-black text-foreground">درخواست مساعده حقوق</h1>
            <p className="text-[11px] text-muted-foreground">ثبت درخواست، استعلام وضعیت و کسر از فیش ماهانه</p>
          </div>
        </div>

        <Button
          size="sm"
          onClick={() => setIsOpenNewModal(true)}
          className="h-8 rounded-xl font-bold gap-1 text-xs shadow-xs"
        >
          <PlusCircle className="size-3.5" />
          درخواست مساعده
        </Button>
      </header>

      <main className="flex flex-1 flex-col gap-4 p-4 max-w-2xl mx-auto w-full">
        {/* ───────────────────────── بنر آیین‌نامه و سقف مساعده ───────────────────────── */}
        <Card className="border-2 border-emerald-500/20 bg-gradient-to-br from-card via-card to-emerald-500/[0.04] shadow-sm rounded-2xl overflow-hidden">
          <CardHeader className="p-4 pb-2 border-b border-border/40">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-black flex items-center gap-2 text-foreground">
                <Wallet className="size-4 text-emerald-600" />
                آیین‌نامه پرداخت مساعده و وام پرسنلی
              </CardTitle>
              <Badge variant="outline" className="text-[10px] bg-emerald-500/10 text-emerald-700 border-emerald-500/30 font-bold">
                دوره {PERSIAN_MONTHS[periodMonth - 1]} {toFa(periodYear)}
              </Badge>
            </div>
            <CardDescription className="text-xs">
              مساعده دریافتی در هر دوره مستقیماً از ستون کسورات قانونی فیش حقوقی همان ماه کسر می‌گردد.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4">
            <div className="grid grid-cols-2 gap-2 text-center">
              <div className="p-3 rounded-xl bg-background border border-border/60">
                <p className="text-[11px] text-muted-foreground font-medium">کل مساعده دریافتی این ماه</p>
                <p className="text-base font-black text-emerald-700 mt-1 font-mono">
                  {money(totalApprovedThisMonth)} <span className="text-[10px] font-normal">ریال</span>
                </p>
              </div>

              <div className="p-3 rounded-xl bg-background border border-border/60">
                <p className="text-[11px] text-muted-foreground font-medium">وضعیت حساب بانکی</p>
                <p className="text-xs font-bold text-foreground mt-1.5 truncate">
                  {employee?.bankAccount ? `بانک / ${employee.bankAccount}` : "حساب بانکی تاییدشده"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ───────────────────────── لیست درخواست‌های مساعده ───────────────────────── */}
        <div className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-sm font-black text-foreground flex items-center gap-2">
              <Receipt className="size-4 text-muted-foreground" />
              سوابق درخواست‌های مساعده ({toFa(advances.length)})
            </h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => qc.invalidateQueries({ queryKey: ["my-advances"] })}
              className="h-7 text-[11px] text-muted-foreground hover:text-foreground"
            >
              به‌روزرسانی
            </Button>
          </div>

          {advancesQ.isLoading ? (
            <div className="py-12 text-center text-muted-foreground flex flex-col items-center justify-center gap-2">
              <Loader2 className="size-8 text-primary animate-spin" />
              <p className="text-xs">در حال دریافت سوابق مالی پرسنل...</p>
            </div>
          ) : advances.length === 0 ? (
            <Card className="p-8 text-center border-dashed rounded-2xl bg-card">
              <Coins className="size-10 text-muted-foreground/30 mx-auto mb-2" />
              <p className="text-sm font-bold text-foreground">هیچ درخواست مساعده‌ای ثبت نشده است</p>
              <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
                در صورت نیاز مالی تا قبل از صدور فیش، می‌توانید درخواست مساعده خود را آنلاین ثبت فرمایید.
              </p>
              <Button
                size="sm"
                onClick={() => setIsOpenNewModal(true)}
                className="mt-4 rounded-xl text-xs font-bold"
              >
                ثبت درخواست مساعده
              </Button>
            </Card>
          ) : (
            <div className="space-y-3">
              {advances.map((adv) => {
                const statusMeta = ADVANCE_STATUS_LABELS[adv.status] || {
                  label: adv.status,
                  color: "bg-gray-100 text-gray-800",
                };

                return (
                  <Card key={adv.id} className="rounded-2xl border border-border/80 shadow-2xs overflow-hidden">
                    <CardContent className="p-4 space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="space-y-0.5">
                          <span className="text-[11px] text-muted-foreground">مبلغ درخواستی:</span>
                          <p className="text-lg font-black text-foreground font-mono">
                            {money(adv.amount)} <span className="text-xs font-normal">ریال</span>
                          </p>
                          <span className="text-[11px] text-muted-foreground font-bold">
                            ({money(Math.round(adv.amount / 10))} تومان)
                          </span>
                        </div>

                        <Badge variant="outline" className={cn("text-xs font-bold px-2.5 py-1", statusMeta.color)}>
                          {statusMeta.label}
                        </Badge>
                      </div>

                      <div className="flex items-center gap-4 text-xs text-muted-foreground bg-muted/30 p-2.5 rounded-xl font-mono">
                        <div>
                          <span>دوره فیش: </span>
                          <span className="text-foreground font-bold">
                            {PERSIAN_MONTHS[adv.periodMonth - 1]} {toFa(adv.periodYear)}
                          </span>
                        </div>
                        <div className="mr-auto">
                          <span>تاریخ تقاضا: </span>
                          <span className="text-foreground">{faDate(adv.requestDate)}</span>
                        </div>
                      </div>

                      {adv.reason && (
                        <p className="text-xs text-foreground/90 leading-relaxed bg-card p-2 rounded-lg border border-border/40">
                          <span className="font-bold text-muted-foreground">علت: </span>
                          {adv.reason}
                        </p>
                      )}

                      {/* اطلاعات پرداخت و رهگیری بانکی */}
                      {(adv.trackingCode || adv.paidDate) && (
                        <div className="text-[11px] p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-900 dark:text-emerald-300 space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="font-bold">شماره پیگیری واریز:</span>
                            <span className="font-mono font-bold">{adv.trackingCode || "ثبت شده"}</span>
                          </div>
                          {adv.paidDate && (
                            <div className="flex items-center justify-between text-[10px] text-emerald-800 dark:text-emerald-400">
                              <span>تاریخ واریز وجه:</span>
                              <span>{faDate(adv.paidDate)}</span>
                            </div>
                          )}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </main>

      {/* ───────────────────────── دیالوگ ثبت مساعده جدید ───────────────────────── */}
      <Dialog open={isOpenNewModal} onOpenChange={setIsOpenNewModal}>
        <DialogContent className="max-w-md w-full rounded-3xl p-5 select-none" dir="rtl">
          <DialogHeader className="text-start">
            <DialogTitle className="text-base font-black flex items-center gap-2">
              <Coins className="size-5 text-emerald-600" />
              ثبت تقاضای مساعده حقوق
            </DialogTitle>
            <DialogDescription className="text-xs">
              مبلغ مورد نظر پس از موافقت مدیریت، به شماره شبای ثبت‌شده در پرونده پرسنلی شما واریز خواهد شد.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2 text-start">
            {/* مبلغ به ریال */}
            <div className="space-y-1.5">
              <Label className="text-xs font-bold">مبلغ مساعده درخواستی (ریال):</Label>
              <Input
                type="text"
                inputMode="numeric"
                placeholder="مثلاً: ۱۵۰,۰۰۰,۰۰۰"
                value={amountInput}
                onChange={(e) => {
                  const raw = e.target.value.replace(/[^0-9]/g, "");
                  setAmountInput(raw ? Number(raw).toLocaleString("en-US") : "");
                }}
                className="h-11 rounded-xl text-sm font-bold font-mono text-start"
              />
              {parsedAmount > 0 && (
                <p className="text-[11px] text-emerald-700 font-bold px-1">
                  معادل: {money(Math.round(parsedAmount / 10))} تومان
                </p>
              )}
            </div>

            {/* دوره حقوق و دستمزد */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold">ماه فیش حقوقی:</Label>
                <Select value={String(periodMonth)} onValueChange={(v) => setPeriodMonth(Number(v))}>
                  <SelectTrigger className="h-10 rounded-xl text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    {PERSIAN_MONTHS.map((m, idx) => (
                      <SelectItem key={idx + 1} value={String(idx + 1)} className="text-xs">
                        {m}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold">سال:</Label>
                <Input
                  type="number"
                  value={periodYear}
                  onChange={(e) => setPeriodYear(Number(e.target.value))}
                  className="h-10 rounded-xl text-xs font-bold font-mono"
                />
              </div>
            </div>

            {/* شیوه ترجیحی دریافت */}
            <div className="space-y-1.5">
              <Label className="text-xs font-bold">نحوه دریافت وجه:</Label>
              <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                <SelectTrigger className="h-10 rounded-xl text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  <SelectItem value="CARD" className="text-xs">کارت به کارت شتابی</SelectItem>
                  <SelectItem value="TRANSFER" className="text-xs">انتقال پایا / ساتنا (شبا)</SelectItem>
                  <SelectItem value="CASH" className="text-xs">نقدی از صندوق کارگاه</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* علت نیاز */}
            <div className="space-y-1.5">
              <Label className="text-xs font-bold">علت تقاضای مساعده (اختیاری):</Label>
              <Textarea
                placeholder="توضیح کوتاه در صورت تمایل..."
                rows={2}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="rounded-xl text-xs resize-none"
              />
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0 pt-2 border-t border-border/40">
            <Button
              variant="outline"
              onClick={() => setIsOpenNewModal(false)}
              className="rounded-xl text-xs font-bold h-10"
            >
              انصراف
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={createMutation.isPending}
              className="rounded-xl text-xs font-bold h-10 gap-1.5 shadow-sm bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              {createMutation.isPending && <Loader2 className="size-3.5 animate-spin" />}
              ثبت و ارسال درخواست
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
