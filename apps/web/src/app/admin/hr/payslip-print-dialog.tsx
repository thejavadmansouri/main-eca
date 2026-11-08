"use client";

import * as React from "react";
import { Printer, Receipt, Building2, CheckCircle2 } from "lucide-react";
import type { PayrollSlipRow } from "@/lib/types";
import { money, toFa, faDate } from "@/lib/format";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface PayslipPrintDialogProps {
  slip: PayrollSlipRow | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function PayslipPrintDialog({ slip, open, onOpenChange }: PayslipPrintDialogProps) {
  if (!slip) return null;

  const emp = slip.employee;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[92vh] overflow-y-auto p-6 font-sans">
        <DialogHeader className="flex flex-row items-center justify-between border-b pb-3 no-print">
          <DialogTitle className="flex items-center gap-2 text-base">
            <Receipt className="size-5 text-primary" />
            فیش حقوق و دستمزد رسمی پرسنل
          </DialogTitle>
          <Button
            size="sm"
            onClick={() => window.print()}
            className="gap-1.5 bg-primary text-primary-foreground h-8 text-xs font-bold"
          >
            <Printer className="size-3.5" />
            چاپ فیش حقوقی
          </Button>
        </DialogHeader>

        {/* برگه فیش حقوقی رسمی */}
        <div className="border border-border rounded-xl p-6 bg-card text-foreground flex flex-col gap-4 text-xs print:border-black print:p-0 print:m-0">
          {/* هدر فیش */}
          <div className="flex items-center justify-between border-b-2 border-border pb-3">
            <div>
              <div className="text-lg font-black text-primary">شرکت کاردو سیستم (Warehouse OS)</div>
              <div className="text-[11px] text-muted-foreground font-semibold mt-0.5">فیش حقوق و دستمزد ماهانه کارگاهی و اداری</div>
            </div>
            <div className="text-left font-mono">
              <div className="text-sm font-bold text-foreground">کد پرسنلی: {emp.personnelCode}</div>
              <div className="text-[11px] text-muted-foreground mt-0.5">تاریخ صدور: {faDate(slip.createdAt)}</div>
            </div>
          </div>

          {/* اطلاعات فردی */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 bg-muted/40 p-3 rounded-lg border border-border/60">
            <div>
              <span className="text-muted-foreground">نام کارمند: </span>
              <strong className="text-foreground">{emp.firstName} {emp.lastName}</strong>
            </div>
            <div>
              <span className="text-muted-foreground">کد ملی: </span>
              <strong className="font-mono">{toFa(emp.nationalId)}</strong>
            </div>
            <div>
              <span className="text-muted-foreground">واحد سازمانی: </span>
              <span>{emp.department?.name || "عمومی"}</span>
            </div>
            <div>
              <span className="text-muted-foreground">سمت شغلی: </span>
              <span className="font-bold">{emp.jobTitle}</span>
            </div>
            <div>
              <span className="text-muted-foreground">روزهای کارکرد: </span>
              <strong className="font-mono">{toFa(slip.workingDays)} روز</strong>
            </div>
            <div>
              <span className="text-muted-foreground">ساعات اضافه‌کار: </span>
              <strong className="font-mono">{toFa(slip.overtimeHours)} ساعت</strong>
            </div>
            <div>
              <span className="text-muted-foreground">شماره بیمه: </span>
              <span className="font-mono">{emp.insuranceNumber ? toFa(emp.insuranceNumber) : "—"}</span>
            </div>
            <div>
              <span className="text-muted-foreground">شماره شبا: </span>
              <span className="font-mono text-[10px]">{emp.iban || "—"}</span>
            </div>
          </div>

          {/* دو ستون: پرداخت‌ها و کسورات */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* ستون راست: ناخالص پرداخت‌ها و مزایا */}
            <div className="rounded-lg border border-border overflow-hidden">
              <div className="bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 font-bold px-3 py-1.5 border-b border-border">
                پرداخت‌ها و مزایا (ریال)
              </div>
              <div className="divide-y divide-border/60 text-xs p-1 font-mono">
                <div className="flex justify-between py-1.5 px-2">
                  <span className="font-sans">دستمزد پایه کارکرد:</span>
                  <strong>{money(slip.baseSalaryEarned)}</strong>
                </div>
                <div className="flex justify-between py-1.5 px-2">
                  <span className="font-sans">کمک‌هزینه مسکن:</span>
                  <span>{money(slip.housingAllowance)}</span>
                </div>
                <div className="flex justify-between py-1.5 px-2">
                  <span className="font-sans">بن خواربار و اقلام مصرفی:</span>
                  <span>{money(slip.groceryAllowance)}</span>
                </div>
                <div className="flex justify-between py-1.5 px-2">
                  <span className="font-sans">حق اولاد و عائله‌مندی:</span>
                  <span>{money(slip.childAllowance + slip.maritalAllowance)}</span>
                </div>
                <div className="flex justify-between py-1.5 px-2">
                  <span className="font-sans">اضافه‌کاری:</span>
                  <span>{money(slip.overtimePay)}</span>
                </div>
                {slip.bonusAndPerks > 0 && (
                  <div className="flex justify-between py-1.5 px-2">
                    <span className="font-sans">پاداش، سنوات و مزایای ویژه:</span>
                    <span>{money(slip.bonusAndPerks)}</span>
                  </div>
                )}
                <div className="flex justify-between py-2 px-2 bg-emerald-500/5 font-black text-emerald-700 dark:text-emerald-300 border-t border-emerald-500/20">
                  <span className="font-sans">جمع کل ناخالص:</span>
                  <span>{money(slip.totalGrossSalary)}</span>
                </div>
              </div>
            </div>

            {/* ستون چپ: کسورات قانونی و سایر */}
            <div className="rounded-lg border border-border overflow-hidden">
              <div className="bg-rose-500/10 text-rose-800 dark:text-rose-300 font-bold px-3 py-1.5 border-b border-border">
                کسورات قانونی و داخلی (ریال)
              </div>
              <div className="divide-y divide-border/60 text-xs p-1 font-mono">
                <div className="flex justify-between py-1.5 px-2">
                  <span className="font-sans">بیمه تأمین اجتماعی سهم کارمند (۷٪):</span>
                  <span className="text-rose-600 font-bold">{money(slip.workerInsurance)}</span>
                </div>
                <div className="flex justify-between py-1.5 px-2">
                  <span className="font-sans">مالیات بر درآمد حقوق (ماده ۸۴):</span>
                  <span className="text-rose-600 font-bold">{money(slip.incomeTax)}</span>
                </div>
                {slip.loanDeductions > 0 && (
                  <div className="flex justify-between py-1.5 px-2">
                    <span className="font-sans">کسر وام و مساعده:</span>
                    <span>{money(slip.loanDeductions)}</span>
                  </div>
                )}
                {slip.otherDeductions > 0 && (
                  <div className="flex justify-between py-1.5 px-2">
                    <span className="font-sans">سایر کسورات و جریمه تأخیر:</span>
                    <span>{money(slip.otherDeductions)}</span>
                  </div>
                )}
                <div className="flex justify-between py-2 px-2 bg-rose-500/5 font-black text-rose-700 dark:text-rose-300 border-t border-rose-500/20">
                  <span className="font-sans">جمع کل کسورات:</span>
                  <span>{money(slip.totalDeductions)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* باکس خالص پرداختی برجسته */}
          <div className="p-3.5 rounded-xl bg-gradient-to-r from-emerald-500/15 via-teal-500/15 to-emerald-500/15 border-2 border-emerald-500/30 flex items-center justify-between">
            <div>
              <span className="font-bold text-xs text-foreground block">مبلغ خالص قابل پرداخت به حساب بانکی کارمند:</span>
              <span className="text-[10px] text-muted-foreground">واریز از طریق سامانه پایا / ساتنا</span>
            </div>
            <div className="text-xl font-black font-mono text-emerald-700 dark:text-emerald-300">
              {money(slip.netPayable)} ریال
            </div>
          </div>

          {/* هزینه کارفرما */}
          <div className="p-2.5 rounded-lg bg-blue-500/5 border border-blue-500/20 text-xs flex items-center justify-between font-mono">
            <span className="font-sans text-muted-foreground text-[11px]">
              حق بیمه سهم کارفرما (۲۳٪ معادل ۲۰٪ عادی + ۳٪ بیمه بیکاری):
            </span>
            <strong className="text-blue-700 dark:text-blue-300">{money(slip.employerInsurance)} ریال</strong>
          </div>

          {/* امضاها */}
          <div className="grid grid-cols-2 gap-8 pt-4 border-t border-border text-center text-xs">
            <div className="flex flex-col items-center justify-between min-h-[60px]">
              <span className="font-semibold text-foreground">امضا و تایید امور مالی و حسابداری</span>
              <div className="text-[10px] text-muted-foreground">امور مالی کاردو</div>
            </div>
            <div className="flex flex-col items-center justify-between min-h-[60px]">
              <span className="font-semibold text-foreground">امضا و رسید دریافت وجه کارمند</span>
              <div className="text-[10px] text-muted-foreground">رویت و تایید شد</div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
