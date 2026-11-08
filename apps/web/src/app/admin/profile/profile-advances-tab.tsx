"use client";

import * as React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Coins,
  CreditCard,
  PlusCircle,
  Receipt,
  Wallet,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Clock,
  Loader2,
} from "lucide-react";

import { getSalaryAdvances, createSalaryAdvance } from "@/lib/api";
import { EmployeeRow, SalaryAdvanceRow } from "@/lib/types";
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

const ADVANCE_STATUS_META: Record<string, { label: string; badge: string }> = {
  PENDING: { label: "در انتظار بررسی مالی", badge: "bg-amber-100 text-amber-800 border-amber-200" },
  APPROVED: { label: "تایید شده (آماده واریز)", badge: "bg-sky-100 text-sky-800 border-sky-200" },
  PAID: { label: "واریز شده به حساب", badge: "bg-emerald-100 text-emerald-800 border-emerald-200" },
  DEDUCTED: { label: "کسر از فیش حقوقی", badge: "bg-purple-100 text-purple-800 border-purple-200" },
  REJECTED: { label: "عدم موافقت امور مالی", badge: "bg-rose-100 text-rose-800 border-rose-200" },
};

const PERSIAN_MONTHS = [
  "فروردین", "اردیبهشت", "خرداد", "تیر", "مرداد", "شهریور",
  "مهر", "آبان", "آذر", "دی", "بهمن", "اسفند"
];

export function ProfileAdvancesTab({ employee }: { employee?: EmployeeRow | null }) {
  const { toast } = useToast();
  const qc = useQueryClient();

  const [isOpenModal, setIsOpenModal] = React.useState(false);
  const [amountInput, setAmountInput] = React.useState("");
  const [periodYear, setPeriodYear] = React.useState<number>(1403);
  const [periodMonth, setPeriodMonth] = React.useState<number>(11);
  const [reason, setReason] = React.useState("");
  const [paymentMethod, setPaymentMethod] = React.useState("CARD");

  const employeeId = employee?.id;

  const advancesQ = useQuery({
    queryKey: ["profile-advances", employeeId],
    queryFn: () => getSalaryAdvances({ employeeId: employeeId! }),
    enabled: !!employeeId,
  });

  const createMutation = useMutation({
    mutationFn: createSalaryAdvance,
    onSuccess: () => {
      toast({
        title: "درخواست مساعده ثبت شد",
        description: "تقاضای شما جهت تایید به واحد مالی ارجاع گردید.",
      });
      setIsOpenModal(false);
      resetForm();
      qc.invalidateQueries({ queryKey: ["profile-advances"] });
    },
    onError: (err: any) => {
      toast({
        variant: "destructive",
        title: "خطا در ثبت مساعده",
        description: err.message || "لطفاً ورودی‌ها را بررسی نمایید.",
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
        description: "حساب کاربری شما به پرونده پرسنلی متصل نیست.",
      });
      return;
    }

    const num = Number(amountInput.replace(/,/g, ""));
    if (!num || num <= 0) {
      toast({ variant: "destructive", title: "مبلغ نامعتبر است" });
      return;
    }

    createMutation.mutate({
      employeeId,
      amount: num,
      periodYear,
      periodMonth,
      reason,
      paymentMethod,
    });
  }

  const advances = advancesQ.data || employee?.salaryAdvances || [];
  const parsedAmount = Number(amountInput.replace(/,/g, "")) || 0;

  return (
    <div className="space-y-4">
      {/* ───────────────────────── کارت سقف و آیین‌نامه مساعده ───────────────────────── */}
      <Card className="border-2 border-emerald-500/20 bg-gradient-to-br from-card via-card to-emerald-500/[0.04] shadow-xs">
        <CardHeader className="p-4 pb-2 border-b border-border/40 flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <Wallet className="size-4 text-emerald-600" />
              مساعده و وام پرسنلی
            </CardTitle>
            <CardDescription className="text-xs">
              مساعده دریافتی به عنوان کسورات قانونی در فیش حقوقی همان دوره کسر خواهد شد
            </CardDescription>
          </div>
          <Button
            size="sm"
            onClick={() => setIsOpenModal(true)}
            className="gap-1.5 text-xs font-bold rounded-xl shadow-xs bg-emerald-600 hover:bg-emerald-700 text-white"
          >
            <PlusCircle className="size-3.5" />
            درخواست مساعده
          </Button>
        </CardHeader>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-center">
            <div className="p-3 rounded-xl bg-background border border-border/60">
              <p className="text-[11px] text-muted-foreground font-medium">سقف مجاز ماهانه</p>
              <p className="text-sm font-black text-foreground mt-1">
                تا ۵۰٪ دستمزد پایه ماهانه
              </p>
            </div>
            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-800">
              <p className="text-[11px] font-medium">تعداد کل درخواست‌ها</p>
              <p className="text-lg font-black mt-1">{toFa(advances.length)}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ───────────────────────── سوابق مساعده‌ها ───────────────────────── */}
      <Card className="border-border/80 shadow-xs">
        <CardHeader className="p-4 border-b border-border/80">
          <CardTitle className="text-sm font-bold flex items-center gap-2">
            <Coins className="size-4 text-primary" />
            سوابق درخواست‌های مساعده من
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4">
          {advances.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground flex flex-col items-center justify-center gap-2">
              <Coins className="size-8 text-muted-foreground/30" />
              <p className="text-xs">تاکنون درخواست مساعده‌ای ثبت نکرده‌اید.</p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {advances.map((adv: any) => {
                const meta = ADVANCE_STATUS_META[adv.status] || { label: adv.status, badge: "bg-gray-100 text-gray-800" };

                return (
                  <div
                    key={adv.id}
                    className="p-3.5 rounded-xl border border-border/80 bg-card flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-2xs"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-black text-foreground font-mono">
                          {money(adv.amount)} ریال
                        </span>
                        <span className="text-[11px] text-muted-foreground font-bold">
                          ({money(Math.round(adv.amount / 10))} تومان)
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground font-mono">
                        دوره فیش: {PERSIAN_MONTHS[adv.periodMonth - 1] || adv.periodMonth} {toFa(adv.periodYear)}
                        {adv.reason ? ` — علت: ${adv.reason}` : ""}
                      </p>
                      {adv.trackingCode && (
                        <p className="text-[11px] text-emerald-700 bg-emerald-500/10 p-1.5 rounded-lg border border-emerald-500/20 font-mono">
                          شماره پیگیری واریز: {adv.trackingCode}
                        </p>
                      )}
                    </div>

                    <Badge variant="outline" className={cn("text-xs font-bold", meta.badge)}>
                      {meta.label}
                    </Badge>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* ───────────────────────── دیالوگ ثبت مساعده جدید ───────────────────────── */}
      <Dialog open={isOpenModal} onOpenChange={setIsOpenModal}>
        <DialogContent className="max-w-md w-full rounded-3xl p-5" dir="rtl">
          <DialogHeader className="text-start">
            <DialogTitle className="text-base font-black flex items-center gap-2">
              <Coins className="size-5 text-emerald-600" />
              ثبت تقاضای مساعده حقوق
            </DialogTitle>
            <DialogDescription className="text-xs">
              مبلغ مورد نظر پس از موافقت، به حساب بانکی شما واریز و در فیش ماهانه کسر می‌گردد.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2 text-start">
            <div className="space-y-1.5">
              <Label className="text-xs font-bold">مبلغ مساعده (ریال):</Label>
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

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold">ماه فیش:</Label>
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

            <div className="space-y-1.5">
              <Label className="text-xs font-bold">روش دریافت وجه:</Label>
              <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                <SelectTrigger className="h-10 rounded-xl text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  <SelectItem value="CARD" className="text-xs">کارت به کارت</SelectItem>
                  <SelectItem value="TRANSFER" className="text-xs">شبا / پایا</SelectItem>
                  <SelectItem value="CASH" className="text-xs">نقدی صندوق</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold">علت تقاضای مساعده (اختیاری):</Label>
              <Textarea
                placeholder="توضیح در صورت تمایل..."
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
              onClick={() => setIsOpenModal(false)}
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
              ارسال تقاضای مساعده
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
