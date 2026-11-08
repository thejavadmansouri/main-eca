"use client";

import * as React from "react";
import { Printer, X, FileCheck2, Building2, Stamp, Calendar, User, Award } from "lucide-react";
import type { EmployeeContractRow } from "@/lib/types";
import { money, toFa, faDate } from "@/lib/format";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface DecreePrintDialogProps {
  decree: EmployeeContractRow | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const DECREE_TYPE_LABELS: Record<string, string> = {
  INITIAL: "حکم استخدام اولیه",
  ANNUAL_INCREASE: "حکم برقراری افزایش سالانه شورای عالی کار",
  PROMOTION: "حکم ارتقای رتبه و ترفیع شغلی",
  TITLE_CHANGE: "حکم تغییر شغل و سمت سازمانی",
  TRANSFER: "حکم انتقال واحد سازمانی",
  RENEWAL: "حکم تمدید قرارداد کار",
  TERMINATION: "حکم خاتمه خدمت و قطع همکاری",
};

export function DecreePrintDialog({ decree, open, onOpenChange }: DecreePrintDialogProps) {
  if (!decree) return null;

  const emp = decree.employee;
  const totalGross =
    decree.baseMonthlySalary +
    decree.housingAllowance +
    decree.groceryAllowance +
    decree.maritalAllowance +
    (decree.seniorityAllowance || 0) +
    (decree.responsibilityAllowance || 0) +
    decree.specialAllowance +
    (emp && emp.childrenCount > 0 ? decree.childAllowancePerChild * emp.childrenCount : 0);

  const decreeTypeLabel =
    (decree.decreeType && DECREE_TYPE_LABELS[decree.decreeType]) || "حکم کارگزینی";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[92vh] overflow-y-auto p-6 font-sans">
        <DialogHeader className="flex flex-row items-center justify-between border-b pb-3 no-print">
          <DialogTitle className="flex items-center gap-2 text-base">
            <FileCheck2 className="size-5 text-primary" />
            پیش‌نمایش برگ رسمی حکم کارگزینی پرسنل
          </DialogTitle>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              onClick={() => window.print()}
              className="gap-1.5 bg-primary text-primary-foreground h-8 text-xs font-bold"
            >
              <Printer className="size-3.5" />
              چاپ برگ حکم (A4)
            </Button>
          </div>
        </DialogHeader>

        {/* برگ رسمی حکم کارگزینی — فرمت استاندارد A4 پرینت */}
        <div className="border-2 border-zinc-800 dark:border-zinc-300 rounded-xl p-8 bg-card text-foreground flex flex-col gap-5 print:border-black print:p-0 print:m-0 print:shadow-none">
          {/* هدر رسمی شرکت */}
          <div className="flex items-start justify-between border-b-2 border-zinc-800 dark:border-zinc-300 pb-4">
            <div className="flex flex-col gap-1">
              <div className="text-xl font-black text-primary tracking-tight">شرکت کاردو سیستم (Warehouse OS)</div>
              <div className="text-xs text-muted-foreground font-semibold">سامانه جامع مدیریت منابع انسانی، کارگزینی و حقوق و دستمزد</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-black tracking-wide border-b-2 border-primary pb-1 px-4">
                {decree.decreeTitle || decreeTypeLabel}
              </div>
              <span className="text-[10px] text-muted-foreground mt-1 block font-mono">
                نوع حکم: {decreeTypeLabel}
              </span>
            </div>
            <div className="flex flex-col items-end gap-1 text-xs font-mono">
              <div className="flex items-center gap-1.5">
                <span className="font-sans text-muted-foreground">شماره حکم:</span>
                <strong className="text-primary font-bold">{decree.contractNumber}</strong>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="font-sans text-muted-foreground">تاریخ صدور:</span>
                <span>{decree.issueDate ? faDate(decree.issueDate) : faDate(decree.createdAt)}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="font-sans text-muted-foreground">تاریخ اجرا:</span>
                <strong className="text-foreground">{faDate(decree.startDate)}</strong>
              </div>
            </div>
          </div>

          {/* جدول ۱: مشخصات فردی و سازمانی کارمند */}
          <div className="rounded-lg border border-border overflow-hidden">
            <div className="bg-muted/70 px-3 py-1.5 text-xs font-bold text-muted-foreground border-b border-border">
              ۱. مشخصات فردی، هویتی و شغلی مستخدم
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-x-4 gap-y-2 p-3 text-xs leading-relaxed">
              <div>
                <span className="text-muted-foreground">نام و نام خانوادگی: </span>
                <strong className="font-bold text-foreground">
                  {emp ? `${emp.firstName} ${emp.lastName}` : "—"}
                </strong>
              </div>
              <div>
                <span className="text-muted-foreground">کد پرسنلی: </span>
                <strong className="font-mono font-bold text-primary">{emp?.personnelCode || "—"}</strong>
              </div>
              <div>
                <span className="text-muted-foreground">کد ملی: </span>
                <strong className="font-mono">{emp?.nationalId ? toFa(emp.nationalId) : "—"}</strong>
              </div>
              <div>
                <span className="text-muted-foreground">نام پدر: </span>
                <span>{emp?.fatherName || "—"}</span>
              </div>
              <div>
                <span className="text-muted-foreground">شماره شناسنامه: </span>
                <span className="font-mono">{emp?.birthCertificate ? toFa(emp.birthCertificate) : "—"}</span>
              </div>
              <div>
                <span className="text-muted-foreground">تاریخ تولد: </span>
                <span className="font-mono">{emp?.birthDate ? toFa(emp.birthDate) : "—"}</span>
              </div>
              <div>
                <span className="text-muted-foreground">شماره بیمه: </span>
                <strong className="font-mono">{emp?.insuranceNumber ? toFa(emp.insuranceNumber) : "فاقد بیمه"}</strong>
              </div>
              <div>
                <span className="text-muted-foreground">مدرک تحصیلی: </span>
                <span className="font-semibold">{decree.educationDegree || "دیپلم"}</span>
              </div>
              <div>
                <span className="text-muted-foreground">واحد سازمانی: </span>
                <strong className="text-foreground">{emp?.department?.name || "ستاد مرکزی"}</strong>
              </div>
              <div>
                <span className="text-muted-foreground">عنوان سمت سازمانی: </span>
                <strong className="text-primary font-bold">{emp?.jobTitle || "—"}</strong>
              </div>
              <div>
                <span className="text-muted-foreground">وضعیت تأهل: </span>
                <span>{emp?.maritalStatus === "MARRIED" ? "متأهل" : "مجرد"}</span>
              </div>
              <div>
                <span className="text-muted-foreground">تعداد اولاد مشمول: </span>
                <strong className="font-mono">{toFa(emp?.childrenCount || 0)} نفر</strong>
              </div>
            </div>
          </div>

          {/* جدول ۲: اقلام دستمزد و مزایای قانونی ماهانه */}
          <div className="rounded-lg border border-border overflow-hidden">
            <div className="bg-muted/70 px-3 py-1.5 text-xs font-bold text-muted-foreground border-b border-border flex items-center justify-between">
              <span>۲. جدول مبانی حقوق و مزایای مستمر مندرج در حکم (ماهانه ۳۰ روزه)</span>
              <span className="text-[11px] font-normal text-muted-foreground">ارقام به ریال</span>
            </div>
            <table className="w-full text-right text-xs">
              <thead className="bg-muted/40 text-muted-foreground border-b border-border">
                <tr>
                  <th className="py-2 px-3">ردیف</th>
                  <th className="py-2 px-3">شرح قلم حقوقی / مزایا</th>
                  <th className="py-2 px-3">مبنای قانونی / ضوابط شورای عالی کار</th>
                  <th className="py-2 px-3 text-left">مبلغ ماهانه (ریال)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                <tr>
                  <td className="py-2 px-3 font-mono">۱</td>
                  <td className="py-2 px-3 font-bold">دستمزد پایه ماهانه (۳۰ روزه)</td>
                  <td className="py-2 px-3 text-muted-foreground">
                    مزد روزانه {money(decree.baseDailySalary)} ریال × ۳۰
                  </td>
                  <td className="py-2 px-3 text-left font-mono font-bold text-foreground">
                    {money(decree.baseMonthlySalary)}
                  </td>
                </tr>
                <tr>
                  <td className="py-2 px-3 font-mono">۲</td>
                  <td className="py-2 px-3 font-bold">کمک هزینه مسکن (حق مسکن)</td>
                  <td className="py-2 px-3 text-muted-foreground">مصوب هیئت وزیران و شورای عالی کار</td>
                  <td className="py-2 px-3 text-left font-mono font-bold text-foreground">
                    {money(decree.housingAllowance)}
                  </td>
                </tr>
                <tr>
                  <td className="py-2 px-3 font-mono">۳</td>
                  <td className="py-2 px-3 font-bold">کمک هزینه اقلام مصرفی خانوار (بن خواربار)</td>
                  <td className="py-2 px-3 text-muted-foreground">مصوب سالانه شورای عالی کار</td>
                  <td className="py-2 px-3 text-left font-mono font-bold text-foreground">
                    {money(decree.groceryAllowance)}
                  </td>
                </tr>
                <tr>
                  <td className="py-2 px-3 font-mono">۴</td>
                  <td className="py-2 px-3 font-bold">حق اولاد (کمک‌هزینه عائله‌مندی فرزندان)</td>
                  <td className="py-2 px-3 text-muted-foreground">
                    {emp?.childrenCount ? `${toFa(emp.childrenCount)} فرزند مشمول ماده ۸۶ تامین اجتماعی` : "فاقد فرزند مشمول"}
                  </td>
                  <td className="py-2 px-3 text-left font-mono font-bold text-foreground">
                    {emp && emp.childrenCount > 0
                      ? money(decree.childAllowancePerChild * emp.childrenCount)
                      : "۰"}
                  </td>
                </tr>
                <tr>
                  <td className="py-2 px-3 font-mono">۵</td>
                  <td className="py-2 px-3 font-bold">حق عائله‌مندی (تأهل)</td>
                  <td className="py-2 px-3 text-muted-foreground">
                    {emp?.maritalStatus === "MARRIED" ? "شامل حق تاهل قانون کار" : "فاقد شمول"}
                  </td>
                  <td className="py-2 px-3 text-left font-mono font-bold text-foreground">
                    {emp?.maritalStatus === "MARRIED" ? money(decree.maritalAllowance) : "۰"}
                  </td>
                </tr>
                <tr>
                  <td className="py-2 px-3 font-mono">۶</td>
                  <td className="py-2 px-3 font-bold">پایه سنوات تجمیعی</td>
                  <td className="py-2 px-3 text-muted-foreground">بر اساس سابقه کار مفید در کارگاه</td>
                  <td className="py-2 px-3 text-left font-mono font-bold text-foreground">
                    {money(decree.seniorityAllowance || 0)}
                  </td>
                </tr>
                <tr>
                  <td className="py-2 px-3 font-mono">۷</td>
                  <td className="py-2 px-3 font-bold">حق مسئولیت و مدیریت</td>
                  <td className="py-2 px-3 text-muted-foreground">متناسب با پست سازمانی و شرح وظایف</td>
                  <td className="py-2 px-3 text-left font-mono font-bold text-foreground">
                    {money(decree.responsibilityAllowance || 0)}
                  </td>
                </tr>
                <tr>
                  <td className="py-2 px-3 font-mono">۸</td>
                  <td className="py-2 px-3 font-bold">فوق‌العاده شغل و تخصص</td>
                  <td className="py-2 px-3 text-muted-foreground">مهارت‌های فنی، کارگاهی و تخصصی</td>
                  <td className="py-2 px-3 text-left font-mono font-bold text-foreground">
                    {money(decree.specialAllowance || 0)}
                  </td>
                </tr>
                <tr className="bg-primary/5 font-black text-sm border-t-2 border-primary/30">
                  <td colSpan={3} className="py-3 px-3 text-primary font-bold">
                    مجموع ناخالص مستمر حقوق و مزایای ماهانه مندرج در حکم:
                  </td>
                  <td className="py-3 px-3 text-left font-mono text-primary text-base">
                    {money(totalGross)} ریال
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* تبصره‌ها و شرایط حقوقی حکم */}
          <div className="p-3 rounded-lg border border-border bg-muted/30 text-xs leading-relaxed flex flex-col gap-1.5">
            <span className="font-bold text-foreground">شرایط و مفاد حکم کارگزینی:</span>
            <p className="text-muted-foreground text-[11px]">
              {decree.notes ||
                "مستخدم متعهد می‌گردد کلیه ضوابط، مقررات انضباطی، ساعات کاری و آیین‌نامه‌های اجرایی و ایمنی کارگاه را به طور کامل رعایت نماید. هرگونه تغییر در حقوق و مزایا صرفاً بر اساس بخشنامه‌های رسمی وزارت تعاون، کار و رفاه اجتماعی و مصوبات داخلی هیئت مدیره شرکت قابل اعمال خواهد بود."}
            </p>
          </div>

          {/* امضاها */}
          <div className="grid grid-cols-3 gap-4 pt-6 border-t-2 border-zinc-800 dark:border-zinc-300 text-center text-xs">
            <div className="flex flex-col items-center justify-between min-h-[90px]">
              <span className="font-bold text-foreground">مدیر منابع انسانی و کارگزینی</span>
              <div className="text-[10px] text-muted-foreground">مهر و امضا</div>
            </div>
            <div className="flex flex-col items-center justify-between min-h-[90px]">
              <span className="font-bold text-foreground">مدیرعامل / ریاست هیئت مدیره</span>
              <div className="text-[10px] text-muted-foreground">مهر و امضا</div>
            </div>
            <div className="flex flex-col items-center justify-between min-h-[90px]">
              <span className="font-bold text-foreground">امضا و اثر انگشت مستخدم</span>
              <div className="text-[10px] text-muted-foreground">رویت و مورد تأیید است</div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
