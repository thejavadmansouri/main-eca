"use client";

import * as React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  AlertCircle,
  AlertTriangle,
  Banknote,
  Calendar,
  Check,
  CheckCircle2,
  ChevronRight,
  Clock,
  CreditCard,
  FileCheck2,
  FileSpreadsheet,
  FileText,
  Flame,
  HardHat,
  Layers,
  Percent,
  Plus,
  Printer,
  Receipt,
  RefreshCw,
  Scale,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Truck,
  User,
  Wallet,
  Wrench,
  X,
} from "lucide-react";

import {
  getProjectContract,
  createOrUpdateProjectContract,
  recordProjectPayment,
} from "@/lib/api";
import type { ProjectContractRow, ProjectMilestoneRow, ProjectPaymentRow } from "@/lib/types";
import { faDate, money, toFa } from "@/lib/format";
import { cn } from "@/lib/utils";
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

interface ProjectContractModalProps {
  orderId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ProjectContractModal({
  orderId,
  open,
  onOpenChange,
}: ProjectContractModalProps) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [activeTab, setActiveTab] = React.useState<"milestones" | "payments" | "print">("milestones");
  const [isAddPaymentOpen, setIsAddPaymentOpen] = React.useState(false);

  // فرم ایجاد/ویرایش قرارداد
  const [totalAmount, setTotalAmount] = React.useState<number>(85000000);
  const [discount, setDiscount] = React.useState<number>(0);
  const [warrantyMonths, setWarrantyMonths] = React.useState<number>(18);
  const [terms, setTerms] = React.useState<string>(
    "قرارداد ساخت، مونتاژ و نصب کابینت و دکوراسیون چوبی. کلیه یراق‌آلات و نوارهای PVC دارای گارانتی تعویض و خدمات پس از فروش می‌باشند.",
  );

  // فرم ثبت پرداخت جدید
  const [paymentAmount, setPaymentAmount] = React.useState<number>(25000000);
  const [paymentMethod, setPaymentMethod] = React.useState<string>("TRANSFER");
  const [paymentMilestoneId, setPaymentMilestoneId] = React.useState<string>("");
  const [trackingCode, setTrackingCode] = React.useState<string>("");
  const [chequeNumber, setChequeNumber] = React.useState<string>("");
  const [chequeDueDate, setChequeDueDate] = React.useState<string>(
    new Date(Date.now() + 30 * 86400000).toISOString().split("T")[0],
  );
  const [chequeBank, setChequeBank] = React.useState<string>("بانک ملی");
  const [paymentNotes, setPaymentNotes] = React.useState<string>("");

  const { data: contract, isLoading, refetch } = useQuery({
    queryKey: ["project-contract", orderId],
    queryFn: () => (orderId ? getProjectContract(orderId) : null),
    enabled: !!orderId && open,
  });

  React.useEffect(() => {
    if (contract) {
      setTotalAmount(contract.totalAmount);
      setDiscount(contract.discount);
      setWarrantyMonths(contract.warrantyMonths || 12);
      if (contract.terms) setTerms(contract.terms);
    }
  }, [contract]);

  const saveContractMutation = useMutation({
    mutationFn: createOrUpdateProjectContract,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["project-contract", orderId] });
      queryClient.invalidateQueries({ queryKey: ["production-matrix"] });
      toast({ title: "قرارداد با موفقیت ذخیره شد", description: "برنامه اقساط ۳ مرحله‌ای متصل به کارگاه ایجاد گردید." });
    },
    onError: (err: any) => {
      toast({ title: "خطا در ثبت قرارداد", description: err.message, variant: "destructive" });
    },
  });

  const recordPaymentMutation = useMutation({
    mutationFn: recordProjectPayment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["project-contract", orderId] });
      queryClient.invalidateQueries({ queryKey: ["production-matrix"] });
      setIsAddPaymentOpen(false);
      setTrackingCode("");
      setChequeNumber("");
      setPaymentNotes("");
      toast({ title: "پرداخت ثبت شد", description: "وضعیت تسویه قسط به‌روزرسانی شد." });
    },
    onError: (err: any) => {
      toast({ title: "خطا در ثبت پرداخت", description: err.message, variant: "destructive" });
    },
  });

  const paidPct = contract && contract.totalAmount > 0
    ? Math.min(100, Math.round((contract.paidAmount / (contract.totalAmount - contract.discount)) * 100))
    : 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between border-b pb-2">
            <div className="flex items-center gap-2">
              <FileCheck2 className="size-5 text-emerald-600" />
              <div>
                <DialogTitle className="text-sm font-bold">
                  قرارداد مالی و تسویه مرحله‌ای پروژه (Milestone Billing)
                </DialogTitle>
                <DialogDescription className="text-xs mt-0.5">
                  ارتباط مستقیم پیشرفت فیزیکی کارگاه چوب با دریافت اقساط مشتری (B2B/B2C)
                </DialogDescription>
              </div>
            </div>

            {contract && (
              <div className="text-left font-mono">
                <span className="text-[10px] text-muted-foreground block">شماره قرارداد</span>
                <span className="font-bold text-xs text-primary">{contract.contractNumber}</span>
              </div>
            )}
          </div>
        </DialogHeader>

        {isLoading ? (
          <div className="py-12 text-center text-xs text-muted-foreground">
            در حال دریافت اطلاعات قرارداد و مالی...
          </div>
        ) : !contract ? (
          /* حالت تعریف قرارداد اولیه */
          <div className="flex flex-col gap-4 py-3 text-xs">
            <div className="p-3 rounded-xl border border-dashed bg-muted/30 flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-primary/10 text-primary">
                <Scale className="size-6" />
              </div>
              <div>
                <div className="font-bold text-sm text-foreground">قرارداد مالی هنوز برای این سفارش ثبت نشده است</div>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  با ثبت مبلغ کل، سیستم به صورت هوشمند برنامه اقساط ۳ مرحله‌ای استاندارد کاردو را ایجاد خواهد کرد.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-bold text-foreground">مبلغ کل قرارداد (ریال) *</label>
                <Input
                  type="number"
                  value={totalAmount}
                  onChange={(e) => setTotalAmount(Number(e.target.value) || 0)}
                  className="mt-1 h-8 text-xs font-mono font-bold"
                />
                <span className="text-[10px] text-muted-foreground mt-0.5 block font-mono">
                  {money(totalAmount)}
                </span>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-muted-foreground">تخفیف ویژه قرارداد (ریال)</label>
                <Input
                  type="number"
                  value={discount}
                  onChange={(e) => setDiscount(Number(e.target.value) || 0)}
                  className="mt-1 h-8 text-xs font-mono"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-muted-foreground">مدت گارانتی و خدمات پس از فروش (ماه)</label>
                <Input
                  type="number"
                  value={warrantyMonths}
                  onChange={(e) => setWarrantyMonths(Number(e.target.value) || 12)}
                  className="mt-1 h-8 text-xs font-mono"
                />
              </div>

              <div className="flex flex-col justify-end">
                <span className="text-[11px] text-muted-foreground">مبلغ نهایی قابل پرداخت:</span>
                <strong className="text-base text-emerald-600 font-mono mt-1">
                  {money(Math.max(0, totalAmount - discount))}
                </strong>
              </div>
            </div>

            {/* پیش‌نمایش اقساط ۳ مرحله‌ای استاندارد */}
            <div className="rounded-xl border bg-muted/40 p-3">
              <span className="font-bold text-xs text-foreground flex items-center gap-1.5 mb-2">
                <Sparkles className="size-3.5 text-amber-600" />
                برنامه اقساط ۳ مرحله‌ای هوشمند کاردو:
              </span>
              <div className="grid grid-cols-3 gap-2 text-center text-xs">
                <div className="p-2 rounded-lg bg-background border">
                  <div className="text-[10px] text-muted-foreground">قسط ۱ (۳۰٪) — پیش‌پرداخت</div>
                  <strong className="text-primary font-mono block mt-1">
                    {money(Math.round((totalAmount - discount) * 0.3))}
                  </strong>
                  <span className="text-[9px] text-muted-foreground mt-0.5 block">شرط: شروع برش‌کاری اره</span>
                </div>

                <div className="p-2 rounded-lg bg-background border">
                  <div className="text-[10px] text-muted-foreground">قسط ۲ (۴۰٪) — مونتاژ کارگاه</div>
                  <strong className="text-primary font-mono block mt-1">
                    {money(Math.round((totalAmount - discount) * 0.4))}
                  </strong>
                  <span className="text-[9px] text-muted-foreground mt-0.5 block">شرط: اتمام CNC و مونتاژ</span>
                </div>

                <div className="p-2 rounded-lg bg-background border">
                  <div className="text-[10px] text-muted-foreground">قسط ۳ (۳۰٪) — تسویه نهایی</div>
                  <strong className="text-primary font-mono block mt-1">
                    {money(Math.round((totalAmount - discount) * 0.3))}
                  </strong>
                  <span className="text-[9px] text-muted-foreground mt-0.5 block">شرط: تحویل کلید و نصب</span>
                </div>
              </div>
            </div>

            <div>
              <label className="text-[11px] font-semibold text-muted-foreground">شرایط و تعهدات قرارداد</label>
              <Textarea
                rows={2}
                value={terms}
                onChange={(e) => setTerms(e.target.value)}
                className="mt-1 text-xs resize-none"
              />
            </div>

            <Button
              onClick={() => {
                if (orderId) {
                  saveContractMutation.mutate({
                    productionOrderId: orderId,
                    totalAmount,
                    discount,
                    warrantyMonths,
                    terms,
                  });
                }
              }}
              disabled={saveContractMutation.isPending || totalAmount <= 0}
              className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5"
            >
              <CheckCircle2 className="size-3.5" />
              {saveContractMutation.isPending ? "در حال ثبت..." : "تأیید و ایجاد قرارداد رسمی پروژه"}
            </Button>
          </div>
        ) : (
          /* حالت نمایش قرارداد موجود و مدیریت اقساط */
          <div className="flex flex-col gap-4 py-2 text-xs">
            {/* هشدار توقف خط در صورت عدم تسویه مرحله جاری */}
            {contract.hasStageBlock && (
              <div className="p-3 rounded-xl border border-rose-500/50 bg-rose-500/10 text-rose-900 dark:text-rose-200 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <ShieldAlert className="size-5 text-rose-600 shrink-0 animate-pulse" />
                  <div>
                    <strong className="text-xs font-bold">هشدار مالی کارگاه: مرحله متوقف است</strong>
                    <div className="text-[11px] mt-0.5 opacity-90">{contract.blockReason}</div>
                  </div>
                </div>
                <Button
                  size="sm"
                  onClick={() => setIsAddPaymentOpen(true)}
                  className="bg-rose-600 hover:bg-rose-700 text-white h-7 text-[10px] shrink-0"
                >
                  ثبت وصول قسط
                </Button>
              </div>
            )}

            {/* خلاصه مالی و پیشرفت تسویه */}
            <div className="grid grid-cols-4 gap-2 text-center">
              <div className="p-2.5 rounded-lg border bg-muted/30">
                <span className="text-[10px] text-muted-foreground">مبلغ کل قرارداد:</span>
                <div className="text-sm font-bold font-mono text-foreground mt-0.5">{money(contract.totalAmount)}</div>
              </div>
              <div className="p-2.5 rounded-lg border bg-emerald-500/5 border-emerald-500/20">
                <span className="text-[10px] text-emerald-700">مجموع پرداختی:</span>
                <div className="text-sm font-bold font-mono text-emerald-700 mt-0.5">{money(contract.paidAmount)}</div>
              </div>
              <div className="p-2.5 rounded-lg border bg-amber-500/5 border-amber-500/20">
                <span className="text-[10px] text-amber-700">مانده تسویه‌نشده:</span>
                <div className="text-sm font-bold font-mono text-amber-700 mt-0.5">{money(contract.remainingAmount || 0)}</div>
              </div>
              <div className="p-2.5 rounded-lg border bg-primary/5 border-primary/20 flex flex-col justify-between">
                <span className="text-[10px] text-muted-foreground">درصد تسویه:</span>
                <div className="text-sm font-bold font-mono text-primary">{toFa(paidPct)}٪</div>
              </div>
            </div>

            {/* تب‌های داخلی دیالوگ */}
            <div className="flex items-center justify-between border-b pb-2">
              <div className="flex items-center gap-1.5 text-xs font-bold">
                <button
                  type="button"
                  onClick={() => setActiveTab("milestones")}
                  className={cn(
                    "px-3 py-1 rounded-md transition-all",
                    activeTab === "milestones"
                      ? "bg-primary text-primary-foreground shadow-xs"
                      : "text-muted-foreground hover:bg-muted/50",
                  )}
                >
                  اقساط و مراحل کارگاه
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("payments")}
                  className={cn(
                    "px-3 py-1 rounded-md transition-all",
                    activeTab === "payments"
                      ? "bg-primary text-primary-foreground shadow-xs"
                      : "text-muted-foreground hover:bg-muted/50",
                  )}
                >
                  تاریخچه واریزی‌ها و چک‌ها ({toFa(contract.payments?.length || 0)})
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("print")}
                  className={cn(
                    "px-3 py-1 rounded-md transition-all",
                    activeTab === "print"
                      ? "bg-primary text-primary-foreground shadow-xs"
                      : "text-muted-foreground hover:bg-muted/50",
                  )}
                >
                  نسخه چاپی رسمی قرارداد
                </button>
              </div>

              <Button
                size="sm"
                onClick={() => setIsAddPaymentOpen(true)}
                className="h-7 text-xs bg-emerald-600 hover:bg-emerald-700 text-white gap-1"
              >
                <Plus className="size-3" />
                ثبت پرداخت / چک
              </Button>
            </div>

            {/* تب ۱: اقساط متصل به خط تولید */}
            {activeTab === "milestones" && (
              <div className="flex flex-col gap-2.5">
                {contract.milestones?.map((ms) => {
                  const isPaid = ms.status === "PAID";
                  const msPct = Math.round(ms.percentage);
                  return (
                    <Card
                      key={ms.id}
                      className={cn(
                        "p-3 border flex flex-col gap-2 transition-all",
                        isPaid ? "border-emerald-500/30 bg-emerald-500/5" : "border-border bg-card",
                      )}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className={cn(
                            "size-6 rounded-full flex items-center justify-center font-bold text-xs font-mono",
                            isPaid ? "bg-emerald-600 text-white" : "bg-muted text-muted-foreground",
                          )}>
                            {toFa(ms.stepNumber)}
                          </span>
                          <div>
                            <span className="font-bold text-xs text-foreground">{ms.title}</span>
                            <span className="text-[10px] text-muted-foreground block font-mono mt-0.5">
                              سهم: {toFa(msPct)}٪ | مبلغ: {money(ms.amount)}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          {isPaid ? (
                            <Badge className="bg-emerald-600 text-white text-[10px] gap-1">
                              <Check className="size-3" />
                              تسویه شد
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="border-amber-500/40 text-amber-700 bg-amber-500/10 text-[10px]">
                              مانده: {money(Math.max(0, ms.amount - ms.paidAmount))}
                            </Badge>
                          )}
                        </div>
                      </div>

                      {ms.notes && (
                        <div className="text-[10px] text-muted-foreground bg-muted/30 p-1.5 rounded">
                          {ms.notes}
                        </div>
                      )}
                    </Card>
                  );
                })}
              </div>
            )}

            {/* تب ۲: تاریخچه واریزی‌ها و چک‌های صیادی */}
            {activeTab === "payments" && (
              <div className="rounded-lg border overflow-hidden">
                <table className="w-full text-right text-xs">
                  <thead className="bg-muted/60 text-muted-foreground font-semibold border-b">
                    <tr>
                      <th className="p-2">تاریخ</th>
                      <th className="p-2">روش پرداخت</th>
                      <th className="p-2">مبلغ پرداختی</th>
                      <th className="p-2">شماره پیگیری / صیاد</th>
                      <th className="p-2">سررسید چک</th>
                      <th className="p-2">تأییدکننده</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y font-medium">
                    {contract.payments?.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="p-8 text-center text-muted-foreground">
                          هنوز هیچ پرداختی برای این قرارداد ثبت نشده است.
                        </td>
                      </tr>
                    ) : (
                      contract.payments?.map((p) => (
                        <tr key={p.id} className="hover:bg-muted/30">
                          <td className="p-2 font-mono">{faDate(p.paidAt)}</td>
                          <td className="p-2">
                            <Badge variant="outline" className="text-[10px]">
                              {p.method === "CHEQUE" ? "چک صیادی" : p.method === "CARD_READER" ? "کارتخوان" : p.method === "TRANSFER" ? "کارت‌به‌کارت/پایا" : "نقدی"}
                            </Badge>
                          </td>
                          <td className="p-2 font-mono font-bold text-emerald-700">{money(p.amount)}</td>
                          <td className="p-2 font-mono text-[11px]">{p.trackingCode || p.chequeNumber || "—"}</td>
                          <td className="p-2 font-mono">{p.chequeDueDate ? faDate(p.chequeDueDate) : "—"}</td>
                          <td className="p-2 text-muted-foreground">{p.verifiedBy || "—"}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {/* تب ۳: برگه رسمی چاپی قرارداد */}
            {activeTab === "print" && (
              <div className="p-4 border rounded-xl bg-card flex flex-col gap-3 font-sans text-xs">
                <div className="flex items-center justify-between border-b pb-2">
                  <div>
                    <h3 className="font-bold text-base text-primary">کاردو ERP — برگه رسمی قرارداد سفارش ساخت</h3>
                    <div className="text-[10px] text-muted-foreground">سیستم یکپارچه مدیریت تولید و مالی صنایع چوب</div>
                  </div>
                  <div className="text-left font-mono">
                    <div>شماره: {contract.contractNumber}</div>
                    <div className="text-muted-foreground">{toFa(new Date().toLocaleDateString("fa-IR"))}</div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-[11px] bg-muted/20 p-2.5 rounded-lg border">
                  <div>
                    <span className="text-muted-foreground">سفارش‌دهنده: </span>
                    <strong>{contract.productionOrder?.customerName || "—"}</strong>
                  </div>
                  <div>
                    <span className="text-muted-foreground">کارفرمای نهایی / ذینفع: </span>
                    <strong>{contract.productionOrder?.endClientName || "مشتری مستقیم"}</strong>
                  </div>
                  <div>
                    <span className="text-muted-foreground">عنوان پروژه: </span>
                    <strong>{contract.productionOrder?.projectTitle || "پروژه دکوراسیون"}</strong>
                  </div>
                  <div>
                    <span className="text-muted-foreground">گارانتی تعویض: </span>
                    <strong className="font-mono">{toFa(contract.warrantyMonths)} ماه</strong>
                  </div>
                </div>

                <div className="border-t pt-2">
                  <span className="font-bold text-xs block mb-1">جدول اقساط و شرایط تسویه مرحله‌ای:</span>
                  <div className="space-y-1 text-[11px]">
                    {contract.milestones?.map((m) => (
                      <div key={m.id} className="flex justify-between border-b border-dashed py-1">
                        <span>{m.title} ({toFa(Math.round(m.percentage))}٪):</span>
                        <strong className="font-mono">{money(m.amount)}</strong>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-8 pt-8 text-center text-xs">
                  <div>
                    <span className="font-bold">امضای کارفرما / خریدار:</span>
                    <div className="h-16 mt-2 border-b border-dashed"></div>
                  </div>
                  <div>
                    <span className="font-bold">امضا و مهر کارخانه کاردو:</span>
                    <div className="h-16 mt-2 border-b border-dashed"></div>
                  </div>
                </div>

                <Button size="sm" onClick={() => window.print()} className="mt-3 gap-1.5">
                  <Printer className="size-3.5" />
                  ارسال به چاپگر
                </Button>
              </div>
            )}
          </div>
        )}

        <DialogFooter className="gap-2">
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>
            بستن
          </Button>
        </DialogFooter>
      </DialogContent>

      {/* مودال فرعی ثبت پرداخت / وصول چک */}
      <Dialog open={isAddPaymentOpen} onOpenChange={setIsAddPaymentOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Banknote className="size-5 text-emerald-600" />
              ثبت واریز / وصول چک صیادی قسط
            </DialogTitle>
            <DialogDescription>
              ثبت دریافت وجه نقد، فیش بانکی، کارتخوان یا چک صیادی مشتری
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-3 py-2 text-xs">
            <div>
              <label className="text-[11px] font-semibold text-muted-foreground">تخصیص به قسط مشخص</label>
              <select
                value={paymentMilestoneId}
                onChange={(e) => setPaymentMilestoneId(e.target.value)}
                className="mt-1 h-8 w-full rounded-md border border-input bg-background px-2 text-xs font-semibold"
              >
                <option value="">تخصیص خودکار به اولین قسط باز</option>
                {contract?.milestones?.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.title} (مانده: {money(Math.max(0, m.amount - m.paidAmount))})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-[11px] font-semibold text-muted-foreground">مبلغ واریزی (ریال) *</label>
              <Input
                type="number"
                value={paymentAmount}
                onChange={(e) => setPaymentAmount(Number(e.target.value) || 0)}
                className="mt-1 h-8 text-xs font-mono font-bold"
              />
              <span className="text-[10px] text-muted-foreground font-mono mt-0.5 block">{money(paymentAmount)}</span>
            </div>

            <div>
              <label className="text-[11px] font-semibold text-muted-foreground">روش پرداخت</label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="mt-1 h-8 w-full rounded-md border border-input bg-background px-2 text-xs font-semibold"
              >
                <option value="TRANSFER">کارت‌به‌کارت / حواله پایا و ساتنا</option>
                <option value="CARD_READER">دستگاه کارتخوان (POS)</option>
                <option value="CHEQUE">چک صیادی بنفش</option>
                <option value="CASH">وجه نقد</option>
              </select>
            </div>

            {paymentMethod === "CHEQUE" ? (
              <div className="space-y-2 p-2.5 rounded-lg border bg-amber-500/5 border-amber-500/20">
                <div>
                  <label className="text-[11px] font-semibold text-amber-800 dark:text-amber-200">شناسه ۱۶ رقمی چک صیاد *</label>
                  <Input
                    placeholder="مثلاً 7894561230123456"
                    value={chequeNumber}
                    onChange={(e) => setChequeNumber(e.target.value)}
                    className="mt-1 h-8 text-xs font-mono"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] text-muted-foreground">تاریخ سررسید چک</label>
                    <Input
                      type="date"
                      value={chequeDueDate}
                      onChange={(e) => setChequeDueDate(e.target.value)}
                      className="mt-1 h-8 text-xs font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-muted-foreground">نام بانک صادرکننده</label>
                    <Input
                      value={chequeBank}
                      onChange={(e) => setChequeBank(e.target.value)}
                      className="mt-1 h-8 text-xs"
                    />
                  </div>
                </div>
              </div>
            ) : (
              <div>
                <label className="text-[11px] font-semibold text-muted-foreground">شماره پیگیری فیش یا تراکنش</label>
                <Input
                  placeholder="مثلاً 985612"
                  value={trackingCode}
                  onChange={(e) => setTrackingCode(e.target.value)}
                  className="mt-1 h-8 text-xs font-mono"
                />
              </div>
            )}

            <div>
              <label className="text-[11px] font-semibold text-muted-foreground">توضیحات مالی</label>
              <Input
                placeholder="واریز توسط کارفرما جهت قسط دوم..."
                value={paymentNotes}
                onChange={(e) => setPaymentNotes(e.target.value)}
                className="mt-1 h-8 text-xs"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setIsAddPaymentOpen(false)}>
              انصراف
            </Button>
            <Button
              size="sm"
              disabled={paymentAmount <= 0 || recordPaymentMutation.isPending || !contract}
              onClick={() => {
                if (contract) {
                  recordPaymentMutation.mutate({
                    contractId: contract.id,
                    milestoneId: paymentMilestoneId || undefined,
                    amount: paymentAmount,
                    method: paymentMethod,
                    trackingCode,
                    chequeNumber: paymentMethod === "CHEQUE" ? chequeNumber : undefined,
                    chequeDueDate: paymentMethod === "CHEQUE" ? chequeDueDate : undefined,
                    chequeBank: paymentMethod === "CHEQUE" ? chequeBank : undefined,
                    notes: paymentNotes,
                  });
                }
              }}
              className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5"
            >
              <CheckCircle2 className="size-3.5" />
              {recordPaymentMutation.isPending ? "در حال ثبت..." : "تأیید و ثبت در سوابق"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Dialog>
  );
}
