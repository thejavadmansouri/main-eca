"use client";

import * as React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Coins,
  CreditCard,
  CheckCircle2,
  XCircle,
  Clock,
  Search,
  Filter,
  PlusCircle,
  Sparkles,
  User,
  Building2,
  Calendar,
  Loader2,
  Check,
  X,
  RefreshCw,
  Wallet,
  Receipt,
  FileCheck,
} from "lucide-react";

import { getSalaryAdvances, createSalaryAdvance, updateSalaryAdvanceStatus } from "@/lib/api";
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
  PENDING: { label: "در انتظار بررسی", badge: "bg-amber-100 text-amber-800 border-amber-200" },
  APPROVED: { label: "تایید شده (آماده پرداخت)", badge: "bg-sky-100 text-sky-800 border-sky-200" },
  PAID: { label: "پرداخت شده", badge: "bg-emerald-100 text-emerald-800 border-emerald-200" },
  DEDUCTED: { label: "کسر از فیش حقوقی", badge: "bg-purple-100 text-purple-800 border-purple-200" },
  REJECTED: { label: "رد شده", badge: "bg-rose-100 text-rose-800 border-rose-200" },
};

const PERSIAN_MONTHS = [
  "فروردین", "اردیبهشت", "خرداد", "تیر", "مرداد", "شهریور",
  "مهر", "آبان", "آذر", "دی", "بهمن", "اسفند"
];

export function AdvancesTab({ employees }: { employees: EmployeeRow[] }) {
  const qc = useQueryClient();
  const { toast } = useToast();

  const [selectedEmpFilter, setSelectedEmpFilter] = React.useState<string>("ALL");
  const [statusFilter, setStatusFilter] = React.useState<string>("ALL");
  const [selectedYear, setSelectedYear] = React.useState<number>(1403);
  const [selectedMonth, setSelectedMonth] = React.useState<string>("ALL");
  const [searchQuery, setSearchQuery] = React.useState("");

  // ثبت مساعده جدید
  const [isNewModalOpen, setIsNewModalOpen] = React.useState(false);
  const [manualEmpId, setManualEmpId] = React.useState("");
  const [manualAmount, setManualAmount] = React.useState("");
  const [manualYear, setManualYear] = React.useState<number>(1403);
  const [manualMonth, setManualMonth] = React.useState<number>(11);
  const [manualMethod, setManualMethod] = React.useState("CARD");
  const [manualReason, setManualReason] = React.useState("");
  const [manualTrackingCode, setManualTrackingCode] = React.useState("");

  // ثبت واریز وجه یا تایید/رد
  const [targetAdvance, setTargetAdvance] = React.useState<SalaryAdvanceRow | null>(null);
  const [payDateInput, setPayDateInput] = React.useState(new Date().toISOString().slice(0, 10));

  const advancesQ = useQuery({
    queryKey: ["admin-advances", selectedEmpFilter, statusFilter, selectedYear, selectedMonth],
    queryFn: () =>
      getSalaryAdvances({
        employeeId: selectedEmpFilter !== "ALL" ? selectedEmpFilter : undefined,
        status: statusFilter !== "ALL" ? statusFilter : undefined,
        periodYear: selectedYear,
        periodMonth: selectedMonth !== "ALL" ? Number(selectedMonth) : undefined,
      }),
  });

  const updateStatusMut = useMutation({
    mutationFn: ({ id, status, paidDate }: { id: string; status: string; paidDate?: string }) =>
      updateSalaryAdvanceStatus(id, { status, paidDate }),
    onSuccess: (_, vars) => {
      toast({
        title: "وضعیت مساعده به‌روز شد",
        description: `وضعیت به ${ADVANCE_STATUS_META[vars.status]?.label || vars.status} تغییر یافت.`,
      });
      setTargetAdvance(null);
      qc.invalidateQueries({ queryKey: ["admin-advances"] });
    },
    onError: (err: any) => {
      toast({
        variant: "destructive",
        title: "خطا در تغییر وضعیت",
        description: err.message || "عملیات با خطا مواجه شد.",
      });
    },
  });

  const createMut = useMutation({
    mutationFn: createSalaryAdvance,
    onSuccess: () => {
      toast({
        title: "مساعده ثبت شد",
        description: "مساعده در سوابق مالی پرسنل درج گردید و در محاسبه فیش حقوقی کسر خواهد شد.",
      });
      setIsNewModalOpen(false);
      resetManualForm();
      qc.invalidateQueries({ queryKey: ["admin-advances"] });
    },
    onError: (err: any) => {
      toast({
        variant: "destructive",
        title: "خطا در ثبت مساعده",
        description: err.message || "لطفاً اطلاعات را بازبینی فرمایید.",
      });
    },
  });

  function resetManualForm() {
    setManualEmpId("");
    setManualAmount("");
    setManualReason("");
    setManualTrackingCode("");
    setManualMethod("CARD");
  }

  function handleManualSubmit() {
    if (!manualEmpId) {
      toast({ variant: "destructive", title: "انتخاب پرسنل الزامی است" });
      return;
    }
    const numAmount = Number(manualAmount.replace(/,/g, ""));
    if (!numAmount || numAmount <= 0) {
      toast({ variant: "destructive", title: "مبلغ مساعده نامعتبر است" });
      return;
    }

    createMut.mutate({
      employeeId: manualEmpId,
      amount: numAmount,
      periodYear: manualYear,
      periodMonth: manualMonth,
      reason: manualReason,
      paymentMethod: manualMethod,
      trackingCode: manualTrackingCode || undefined,
    });
  }

  const allAdvances = advancesQ.data || [];
  const filteredAdvances = allAdvances.filter((a) => {
    if (!searchQuery) return true;
    const name = `${a.employee?.firstName || ""} ${a.employee?.lastName || ""}`.toLowerCase();
    const code = (a.employee?.personnelCode || "").toLowerCase();
    const reason = (a.reason || "").toLowerCase();
    const tracking = (a.trackingCode || "").toLowerCase();
    const q = searchQuery.toLowerCase();
    return name.includes(q) || code.includes(q) || reason.includes(q) || tracking.includes(q);
  });

  const pendingAdvances = allAdvances.filter((a) => a.status === "PENDING");
  const pendingAmount = pendingAdvances.reduce((s, a) => s + a.amount, 0);

  const paidAdvances = allAdvances.filter((a) => ["PAID", "DEDUCTED"].includes(a.status));
  const paidAmount = paidAdvances.reduce((s, a) => s + a.amount, 0);

  const parsedManualAmount = Number(manualAmount.replace(/,/g, "")) || 0;

  return (
    <div className="space-y-6">
      {/* ───────────────────────── کارت‌های آماری مساعده ───────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
        <Card className="border-amber-200/80 bg-amber-500/[0.04]">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs text-amber-800 font-bold">مساعده‌های در انتظار بررسی</p>
              <p className="text-lg font-black text-amber-700 font-mono">
                {money(pendingAmount)} <span className="text-[10px]">ریال</span>
              </p>
              <p className="text-[10px] text-amber-600 font-bold">({toFa(pendingAdvances.length)} فقره درخواست)</p>
            </div>
            <div className="size-11 rounded-2xl bg-amber-500/10 text-amber-700 flex items-center justify-center">
              <Clock className="size-6" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-emerald-200/80 bg-emerald-500/[0.04]">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs text-emerald-800 font-bold">پرداخت و کسر از فیش</p>
              <p className="text-lg font-black text-emerald-700 font-mono">
                {money(paidAmount)} <span className="text-[10px]">ریال</span>
              </p>
              <p className="text-[10px] text-emerald-600 font-bold">({toFa(paidAdvances.length)} فقره)</p>
            </div>
            <div className="size-11 rounded-2xl bg-emerald-500/10 text-emerald-700 flex items-center justify-center">
              <CheckCircle2 className="size-6" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-blue-200/80 bg-blue-500/[0.04]">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs text-blue-800 font-bold">کسر خودکار از حقوق</p>
              <p className="text-xs text-muted-foreground leading-relaxed mt-1">
                تمام مساعده‌های وضعیت تاییدشده خودکار در ستون کسورات وام فیش حقوقی لحاظ می‌شوند.
              </p>
            </div>
            <div className="size-11 rounded-2xl bg-blue-500/10 text-blue-700 flex items-center justify-center">
              <Receipt className="size-6" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-purple-200/80 bg-purple-500/[0.04]">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs text-purple-800 font-bold">کل مساعده‌های ثبت‌شده</p>
              <p className="text-2xl font-black text-purple-700">{toFa(allAdvances.length)}</p>
            </div>
            <div className="size-11 rounded-2xl bg-purple-500/10 text-purple-700 flex items-center justify-center">
              <Coins className="size-6" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ───────────────────────── فیلترها و عملیات ───────────────────────── */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-card p-3 rounded-2xl border border-border/80 shadow-2xs">
        <div className="flex flex-wrap items-center gap-2 flex-1">
          {/* فیلتر کارمند */}
          <Select value={selectedEmpFilter} onValueChange={setSelectedEmpFilter}>
            <SelectTrigger className="w-[180px] h-9 text-xs rounded-xl">
              <SelectValue placeholder="همه پرسنل" />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              <SelectItem value="ALL" className="text-xs">همه پرسنل</SelectItem>
              {employees.map((e) => (
                <SelectItem key={e.id} value={e.id} className="text-xs">
                  {e.firstName} {e.lastName} ({e.personnelCode})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* فیلتر ماه */}
          <Select value={selectedMonth} onValueChange={setSelectedMonth}>
            <SelectTrigger className="w-[120px] h-9 text-xs rounded-xl">
              <SelectValue placeholder="همه ماه‌ها" />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              <SelectItem value="ALL" className="text-xs">همه ماه‌ها</SelectItem>
              {PERSIAN_MONTHS.map((m, idx) => (
                <SelectItem key={idx + 1} value={String(idx + 1)} className="text-xs">
                  {m}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* فیلتر وضعیت */}
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[150px] h-9 text-xs rounded-xl">
              <SelectValue placeholder="همه وضعیت‌ها" />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              <SelectItem value="ALL" className="text-xs">همه وضعیت‌ها</SelectItem>
              <SelectItem value="PENDING" className="text-xs">منتظر بررسی</SelectItem>
              <SelectItem value="APPROVED" className="text-xs">تایید شده</SelectItem>
              <SelectItem value="PAID" className="text-xs">پرداخت شده</SelectItem>
              <SelectItem value="DEDUCTED" className="text-xs">کسر از فیش</SelectItem>
              <SelectItem value="REJECTED" className="text-xs">رد شده</SelectItem>
            </SelectContent>
          </Select>

          {/* جستجو */}
          <div className="relative min-w-[200px] flex-1">
            <Search className="size-4 text-muted-foreground absolute right-3 top-1/2 -translate-y-1/2" />
            <Input
              placeholder="جستجو در نام، علت یا شماره پیگیری..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-9 pr-9 pl-3 text-xs rounded-xl"
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => qc.invalidateQueries({ queryKey: ["admin-advances"] })}
            className="h-9 rounded-xl text-xs gap-1.5"
          >
            <RefreshCw className="size-3.5" />
            به‌روزرسانی
          </Button>

          <Button
            size="sm"
            onClick={() => setIsNewModalOpen(true)}
            className="h-9 rounded-xl text-xs font-bold gap-1.5 shadow-sm bg-emerald-600 hover:bg-emerald-700 text-white"
          >
            <PlusCircle className="size-4" />
            ثبت مساعده جدید
          </Button>
        </div>
      </div>

      {/* ───────────────────────── جدول مساعده‌ها ───────────────────────── */}
      <Card className="rounded-2xl border-border/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-start">
            <thead className="bg-muted/50 border-b border-border/80 text-muted-foreground font-bold">
              <tr>
                <th className="p-3 text-start">پرسنل</th>
                <th className="p-3 text-start">مبلغ مساعده</th>
                <th className="p-3 text-start">دوره فیش حقوق</th>
                <th className="p-3 text-start">علت و توضیحات</th>
                <th className="p-3 text-center">شیوه پرداخت</th>
                <th className="p-3 text-center">وضعیت</th>
                <th className="p-3 text-start">رهگیری واریز</th>
                <th className="p-3 text-center">عملیات مدیریت</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {advancesQ.isLoading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-muted-foreground">
                    <Loader2 className="size-6 animate-spin mx-auto mb-2 text-primary" />
                    در حال بارگذاری لیست مساعده‌ها...
                  </td>
                </tr>
              ) : filteredAdvances.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-muted-foreground">
                    هیچ موردی با فیلترهای جاری یافت نشد.
                  </td>
                </tr>
              ) : (
                filteredAdvances.map((adv) => {
                  const meta = ADVANCE_STATUS_META[adv.status] || { label: adv.status, badge: "bg-gray-100 text-gray-800" };

                  return (
                    <tr key={adv.id} className="hover:bg-muted/30 transition-colors">
                      {/* پرسنل */}
                      <td className="p-3">
                        <div className="font-bold text-foreground">
                          {adv.employee?.firstName} {adv.employee?.lastName}
                        </div>
                        <div className="text-[10px] text-muted-foreground font-mono flex items-center gap-1.5 mt-0.5">
                          <span>کد: {adv.employee?.personnelCode}</span>
                          <span>•</span>
                          <span>{adv.employee?.jobTitle}</span>
                        </div>
                      </td>

                      {/* مبلغ */}
                      <td className="p-3 font-mono">
                        <div className="font-black text-foreground text-sm">
                          {money(adv.amount)} <span className="text-[10px] font-normal">ریال</span>
                        </div>
                        <div className="text-[10px] text-emerald-700 font-bold">
                          {money(Math.round(adv.amount / 10))} تومان
                        </div>
                      </td>

                      {/* دوره */}
                      <td className="p-3">
                        <div className="font-bold text-foreground">
                          {PERSIAN_MONTHS[adv.periodMonth - 1]} {toFa(adv.periodYear)}
                        </div>
                        <div className="text-[10px] text-muted-foreground font-mono mt-0.5">
                          ثبت: {faDate(adv.requestDate)}
                        </div>
                      </td>

                      {/* علت */}
                      <td className="p-3 max-w-[180px]">
                        <p className="truncate text-muted-foreground" title={adv.reason || ""}>
                          {adv.reason || "—"}
                        </p>
                      </td>

                      {/* شیوه پرداخت */}
                      <td className="p-3 text-center">
                        <Badge variant="outline" className="text-[10px]">
                          {adv.paymentMethod === "CARD" ? "کارت به کارت" :
                           adv.paymentMethod === "TRANSFER" ? "پایا / شبا" :
                           adv.paymentMethod === "CASH" ? "نقدی" : adv.paymentMethod}
                        </Badge>
                      </td>

                      {/* وضعیت */}
                      <td className="p-3 text-center">
                        <Badge variant="outline" className={cn("text-[10px] font-bold px-2 py-0.5", meta.badge)}>
                          {meta.label}
                        </Badge>
                      </td>

                      {/* رهگیری واریز */}
                      <td className="p-3">
                        {adv.trackingCode ? (
                          <div className="font-mono text-[11px] font-bold text-emerald-800">
                            پیگیری: {adv.trackingCode}
                            {adv.paidDate && (
                              <div className="text-[10px] text-muted-foreground font-normal">
                                واریز: {faDate(adv.paidDate)}
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="text-muted-foreground/40 text-[10px]">در انتظار واریز</span>
                        )}
                      </td>

                      {/* عملیات */}
                      <td className="p-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          {adv.status === "PENDING" && (
                            <>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => updateStatusMut.mutate({ id: adv.id, status: "APPROVED" })}
                                className="h-7 px-2 text-[11px] font-bold text-sky-700 border-sky-300 hover:bg-sky-50 gap-1"
                              >
                                <Check className="size-3" />
                                تایید
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => updateStatusMut.mutate({ id: adv.id, status: "REJECTED" })}
                                className="h-7 px-2 text-[11px] font-bold text-rose-700 border-rose-300 hover:bg-rose-50 gap-1"
                              >
                                <X className="size-3" />
                                رد
                              </Button>
                            </>
                          )}

                          {adv.status === "APPROVED" && (
                            <Button
                              size="sm"
                              onClick={() => {
                                setTargetAdvance(adv);
                                setPayDateInput(new Date().toISOString().slice(0, 10));
                              }}
                              className="h-7 px-2.5 text-[11px] font-bold bg-emerald-600 hover:bg-emerald-700 text-white gap-1"
                            >
                              <CheckCircle2 className="size-3" />
                              ثبت واریز
                            </Button>
                          )}

                          {["PAID", "DEDUCTED"].includes(adv.status) && (
                            <Badge className="bg-emerald-100 text-emerald-800 border-emerald-300 text-[10px] gap-1">
                              <Check className="size-2.5" />
                              نهایی شده
                            </Badge>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* ───────────────────────── دیالوگ ثبت مساعده جدید برای پرسنل ───────────────────────── */}
      <Dialog open={isNewModalOpen} onOpenChange={setIsNewModalOpen}>
        <DialogContent className="max-w-md w-full rounded-3xl p-5" dir="rtl">
          <DialogHeader className="text-start">
            <DialogTitle className="text-base font-black flex items-center gap-2">
              <Coins className="size-5 text-emerald-600" />
              ثبت مساعده حقوق برای پرسنل
            </DialogTitle>
            <DialogDescription className="text-xs">
              مبلغ این مساعده در محاسبه فیش حقوقی دوره انتخابی به عنوان کسورات وام منظور می‌گردد.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2 text-start">
            {/* انتخاب پرسنل */}
            <div className="space-y-1.5">
              <Label className="text-xs font-bold">انتخاب پرسنل:</Label>
              <Select value={manualEmpId} onValueChange={setManualEmpId}>
                <SelectTrigger className="h-10 rounded-xl text-xs">
                  <SelectValue placeholder="انتخاب کارمند..." />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  {employees.map((e) => (
                    <SelectItem key={e.id} value={e.id} className="text-xs">
                      {e.firstName} {e.lastName} ({e.jobTitle} - کد: {e.personnelCode})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* مبلغ */}
            <div className="space-y-1.5">
              <Label className="text-xs font-bold">مبلغ مساعده (ریال):</Label>
              <Input
                type="text"
                inputMode="numeric"
                placeholder="مثلاً: ۲۰۰,۰۰۰,۰۰۰"
                value={manualAmount}
                onChange={(e) => {
                  const raw = e.target.value.replace(/[^0-9]/g, "");
                  setManualAmount(raw ? Number(raw).toLocaleString("en-US") : "");
                }}
                className="h-10 rounded-xl text-xs font-bold font-mono text-start"
              />
              {parsedManualAmount > 0 && (
                <p className="text-[11px] text-emerald-700 font-bold px-1">
                  معادل: {money(Math.round(parsedManualAmount / 10))} تومان
                </p>
              )}
            </div>

            {/* دوره فیش حقوقی */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold">ماه فیش حقوقی:</Label>
                <Select value={String(manualMonth)} onValueChange={(v) => setManualMonth(Number(v))}>
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
                  value={manualYear}
                  onChange={(e) => setManualYear(Number(e.target.value))}
                  className="h-10 rounded-xl text-xs font-bold font-mono"
                />
              </div>
            </div>

            {/* روش پرداخت و پیگیری */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold">روش پرداخت:</Label>
                <Select value={manualMethod} onValueChange={setManualMethod}>
                  <SelectTrigger className="h-10 rounded-xl text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    <SelectItem value="CARD" className="text-xs">کارت به کارت</SelectItem>
                    <SelectItem value="TRANSFER" className="text-xs">شبا / ساتنا</SelectItem>
                    <SelectItem value="CASH" className="text-xs">نقدی صندوق</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold">شماره پیگیری واریز:</Label>
                <Input
                  type="text"
                  placeholder="کد ارجاع بانکی..."
                  value={manualTrackingCode}
                  onChange={(e) => setManualTrackingCode(e.target.value)}
                  className="h-10 rounded-xl text-xs font-mono"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold">علت و توضیحات:</Label>
              <Textarea
                placeholder="توضیحات مساعده..."
                rows={2}
                value={manualReason}
                onChange={(e) => setManualReason(e.target.value)}
                className="rounded-xl text-xs resize-none"
              />
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0 pt-2 border-t border-border/40">
            <Button
              variant="outline"
              onClick={() => setIsNewModalOpen(false)}
              className="rounded-xl text-xs font-bold h-10"
            >
              انصراف
            </Button>
            <Button
              onClick={handleManualSubmit}
              disabled={createMut.isPending}
              className="rounded-xl text-xs font-bold h-10 gap-1.5 shadow-sm bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              {createMut.isPending && <Loader2 className="size-3.5 animate-spin" />}
              ثبت و صدور مساعده
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ───────────────────────── دیالوگ ثبت واریز مساعده ───────────────────────── */}
      <Dialog open={!!targetAdvance} onOpenChange={(open) => !open && setTargetAdvance(null)}>
        <DialogContent className="max-w-md w-full rounded-3xl p-5" dir="rtl">
          <DialogHeader className="text-start">
            <DialogTitle className="text-base font-black flex items-center gap-2">
              <CheckCircle2 className="size-5 text-emerald-600" />
              تایید واریز وجه مساعده به پرسنل
            </DialogTitle>
            <DialogDescription className="text-xs">
              مبلغ {targetAdvance ? money(targetAdvance.amount) : "۰"} ریال به حساب {targetAdvance?.employee?.firstName} {targetAdvance?.employee?.lastName}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2 text-start">
            <div className="space-y-1.5">
              <Label className="text-xs font-bold">تاریخ واریز وجه:</Label>
              <Input
                type="date"
                value={payDateInput}
                onChange={(e) => setPayDateInput(e.target.value)}
                className="h-10 rounded-xl text-xs font-mono"
              />
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0 pt-2 border-t border-border/40">
            <Button
              variant="outline"
              onClick={() => setTargetAdvance(null)}
              className="rounded-xl text-xs font-bold h-10"
            >
              انصراف
            </Button>
            <Button
              onClick={() => {
                if (targetAdvance) {
                  updateStatusMut.mutate({
                    id: targetAdvance.id,
                    status: "PAID",
                    paidDate: new Date(payDateInput).toISOString(),
                  });
                }
              }}
              disabled={updateStatusMut.isPending}
              className="rounded-xl text-xs font-bold h-10 gap-1.5 shadow-sm bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              {updateStatusMut.isPending && <Loader2 className="size-3.5 animate-spin" />}
              تایید واریز وجه
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
