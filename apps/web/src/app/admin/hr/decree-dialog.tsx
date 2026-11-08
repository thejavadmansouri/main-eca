"use client";

import * as React from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Award,
  CheckCircle2,
  FileCheck2,
  Sparkles,
  TrendingUp,
} from "lucide-react";
import { createContract, updateContract } from "@/lib/api";
import type { EmployeeContractRow, EmployeeRow } from "@/lib/types";
import { money, toFa } from "@/lib/format";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
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

interface DecreeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  employees: EmployeeRow[];
  preselectedEmployeeId?: string | null;
  editDecree?: EmployeeContractRow | null;
}

const DECREE_TYPES = [
  { value: "INITIAL", label: "استخدام اولیه" },
  { value: "ANNUAL_INCREASE", label: "افزایش سالانه شورای عالی کار" },
  { value: "PROMOTION", label: "ارتقای رتبه و ترفیع شغلی" },
  { value: "TITLE_CHANGE", label: "تغییر شغل و سمت سازمانی" },
  { value: "TRANSFER", label: "انتقال بین‌واحدی" },
  { value: "RENEWAL", label: "تمدید قرارداد کار" },
  { value: "TERMINATION", label: "خاتمه خدمت و قطع همکاری" },
];

export function DecreeDialog({
  open,
  onOpenChange,
  employees,
  preselectedEmployeeId,
  editDecree,
}: DecreeDialogProps) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [employeeId, setEmployeeId] = React.useState<string>("");
  const [contractNumber, setContractNumber] = React.useState<string>("");
  const [decreeType, setDecreeType] = React.useState<string>("ANNUAL_INCREASE");
  const [decreeTitle, setDecreeTitle] = React.useState<string>("");
  const [contractType, setContractType] = React.useState<string>("FIXED_TERM");
  const [startDate, setStartDate] = React.useState<string>(
    new Date().toISOString().split("T")[0],
  );
  const [endDate, setEndDate] = React.useState<string>(
    new Date(Date.now() + 365 * 86400000).toISOString().split("T")[0],
  );
  const [baseDailySalary, setBaseDailySalary] = React.useState<number>(3000000);
  const [housingAllowance, setHousingAllowance] = React.useState<number>(9000000);
  const [groceryAllowance, setGroceryAllowance] = React.useState<number>(14000000);
  const [childAllowancePerChild, setChildAllowancePerChild] = React.useState<number>(7166184);
  const [maritalAllowance, setMaritalAllowance] = React.useState<number>(5000000);
  const [seniorityAllowance, setSeniorityAllowance] = React.useState<number>(0);
  const [responsibilityAllowance, setResponsibilityAllowance] = React.useState<number>(0);
  const [specialAllowance, setSpecialAllowance] = React.useState<number>(0);
  const [educationDegree, setEducationDegree] = React.useState<string>("کارشناسی");
  const [notes, setNotes] = React.useState<string>("");

  React.useEffect(() => {
    if (editDecree) {
      setEmployeeId(editDecree.employeeId);
      setContractNumber(editDecree.contractNumber);
      setDecreeType(editDecree.decreeType || "ANNUAL_INCREASE");
      setDecreeTitle(editDecree.decreeTitle || "");
      setContractType(editDecree.contractType || "FIXED_TERM");
      setStartDate(editDecree.startDate ? editDecree.startDate.split("T")[0] : "");
      setEndDate(editDecree.endDate ? editDecree.endDate.split("T")[0] : "");
      setBaseDailySalary(editDecree.baseDailySalary);
      setHousingAllowance(editDecree.housingAllowance);
      setGroceryAllowance(editDecree.groceryAllowance);
      setChildAllowancePerChild(editDecree.childAllowancePerChild);
      setMaritalAllowance(editDecree.maritalAllowance);
      setSeniorityAllowance(editDecree.seniorityAllowance || 0);
      setResponsibilityAllowance(editDecree.responsibilityAllowance || 0);
      setSpecialAllowance(editDecree.specialAllowance || 0);
      setEducationDegree(editDecree.educationDegree || "کارشناسی");
      setNotes(editDecree.notes || "");
    } else {
      const selectedId = preselectedEmployeeId || (employees[0]?.id ?? "");
      setEmployeeId(selectedId);
      const rand = Math.floor(1000 + Math.random() * 9000);
      setContractNumber(`DEC-1404-${rand}`);
      setDecreeTitle("حکم کارگزینی برقراری حقوق و دستمزد سالانه ۱۴۰۴");
      setNotes(
        "این حکم بر اساس آخرین مصوبات شورای عالی کار و آیین‌نامه‌های استخدامی شرکت صادر شده است.",
      );
    }
  }, [editDecree, preselectedEmployeeId, employees, open]);

  const selectedEmployee = employees.find((e) => e.id === employeeId);

  // محاسبه خودکار ماهانه ۳۰ روزه
  const baseMonthly = Math.round(baseDailySalary * 30);
  const childTotal =
    selectedEmployee && selectedEmployee.childrenCount > 0
      ? childAllowancePerChild * selectedEmployee.childrenCount
      : 0;
  const maritalTotal =
    selectedEmployee?.maritalStatus === "MARRIED" ? maritalAllowance : 0;

  const totalMonthlyGross =
    baseMonthly +
    housingAllowance +
    groceryAllowance +
    childTotal +
    maritalTotal +
    seniorityAllowance +
    responsibilityAllowance +
    specialAllowance;

  // اعمال پیش‌فرض مصوبه شورای عالی کار ۱۴۰۴
  const applyLaborLawPreset = () => {
    setBaseDailySalary(3250000); // ۳.۲۵ میلیون ریال روزانه
    setHousingAllowance(9000000); // ۹ میلیون ریال
    setGroceryAllowance(14000000); // ۱۴ میلیون ریال
    setChildAllowancePerChild(7166184);
    setMaritalAllowance(5000000);
    setSeniorityAllowance(2100000);
    toast({
      title: "پیش‌فرض شورای عالی کار اعمال شد",
      description: "مقادیر مصوب دستمزد، حق مسکن، بن خواربار و حق اولاد بارگذاری شدند.",
    });
  };

  const mutation = useMutation({
    mutationFn: async () => {
      if (editDecree) {
        return updateContract(editDecree.id, {
          contractType,
          decreeType,
          decreeTitle,
          startDate,
          endDate: endDate || undefined,
          baseDailySalary: Number(baseDailySalary),
          baseMonthlySalary: baseMonthly,
          housingAllowance: Number(housingAllowance),
          groceryAllowance: Number(groceryAllowance),
          childAllowancePerChild: Number(childAllowancePerChild),
          maritalAllowance: Number(maritalAllowance),
          seniorityAllowance: Number(seniorityAllowance),
          responsibilityAllowance: Number(responsibilityAllowance),
          specialAllowance: Number(specialAllowance),
          educationDegree,
          notes,
        });
      }

      return createContract({
        contractNumber,
        employeeId,
        contractType,
        decreeType,
        decreeTitle,
        startDate,
        endDate: endDate || undefined,
        baseDailySalary: Number(baseDailySalary),
        baseMonthlySalary: baseMonthly,
        housingAllowance: Number(housingAllowance),
        groceryAllowance: Number(groceryAllowance),
        childAllowancePerChild: Number(childAllowancePerChild),
        maritalAllowance: Number(maritalAllowance),
        seniorityAllowance: Number(seniorityAllowance),
        responsibilityAllowance: Number(responsibilityAllowance),
        specialAllowance: Number(specialAllowance),
        educationDegree,
        notes,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contracts"] });
      queryClient.invalidateQueries({ queryKey: ["employees"] });
      queryClient.invalidateQueries({ queryKey: ["hr-stats"] });
      toast({
        title: editDecree ? "حکم کارگزینی به‌روزرسانی شد" : "حکم جدید با موفقیت صادر شد",
        description: "حکم در سوابق پرسنلی و سیستم حقوق و دستمزد ثبت گردید.",
      });
      onOpenChange(false);
    },
    onError: (err: any) => {
      toast({
        title: "خطا در ثبت حکم",
        description: err?.message || "خطایی رخ داد.",
        variant: "destructive",
      });
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[92vh] overflow-y-auto p-6 font-sans">
        <DialogHeader className="border-b pb-3">
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2 text-base font-bold">
              <FileCheck2 className="size-5 text-primary" />
              {editDecree ? "ویرایش حکم کارگزینی" : "صدور حکم کارگزینی جدید مستخدم"}
            </DialogTitle>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={applyLaborLawPreset}
              className="gap-1.5 text-xs h-7.5 border-primary/40 text-primary hover:bg-primary/10 rounded-lg"
            >
              <Sparkles className="size-3 text-amber-500" />
              بارگذاری ارقام استاندارد قانون کار
            </Button>
          </div>
          <DialogDescription className="text-xs">
            تعیین مبانی دستمزد پایه روزانه، مزایای رفاهی و انگیزی و عنوان سمت سازمانی
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4 text-xs mt-2">
          {/* بخش ۱: پرسنل و مشخصات عمومی حکم */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 bg-muted/40 rounded-xl border border-border/60">
            <div>
              <label className="font-bold text-foreground block mb-1">پرسنل مستخدم *</label>
              <select
                className="h-8.5 w-full rounded-lg border border-input bg-card px-2.5 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-primary"
                value={employeeId}
                onChange={(e) => setEmployeeId(e.target.value)}
                disabled={!!editDecree}
              >
                {employees.map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    {emp.personnelCode} — {emp.firstName} {emp.lastName} ({emp.jobTitle})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="font-bold text-foreground block mb-1">شماره رسمی حکم *</label>
              <Input
                value={contractNumber}
                onChange={(e) => setContractNumber(e.target.value)}
                placeholder="مثلاً DEC-1404-001"
                className="h-8.5 text-xs font-mono font-bold"
                disabled={!!editDecree}
              />
            </div>

            <div>
              <label className="font-semibold text-muted-foreground block mb-1">نوع حکم کارگزینی</label>
              <select
                className="h-8.5 w-full rounded-lg border border-input bg-card px-2.5 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-primary"
                value={decreeType}
                onChange={(e) => setDecreeType(e.target.value)}
              >
                {DECREE_TYPES.map((dt) => (
                  <option key={dt.value} value={dt.value}>
                    {dt.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="font-semibold text-muted-foreground block mb-1">نوع قرارداد استخدامی</label>
              <select
                className="h-8.5 w-full rounded-lg border border-input bg-card px-2.5 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-primary"
                value={contractType}
                onChange={(e) => setContractType(e.target.value)}
              >
                <option value="FIXED_TERM">قرارداد کار معین / مدت موقت (Fixed Term)</option>
                <option value="PERMANENT">استخدام رسمی / دائم (Permanent)</option>
                <option value="PROBATION">دوره آزمایشی (Probation)</option>
                <option value="CONTRACTOR">پیمانکاری / پروژه‌ای (Contractor)</option>
              </select>
            </div>

            <div className="sm:col-span-2">
              <label className="font-semibold text-muted-foreground block mb-1">عنوان حکم</label>
              <Input
                value={decreeTitle}
                onChange={(e) => setDecreeTitle(e.target.value)}
                placeholder="مثلاً: حکم افزایش سالانه حقوق و ارتقای رتبه شغلی ۱۴۰۴"
                className="h-8.5 text-xs font-semibold"
              />
            </div>

            <div>
              <label className="font-semibold text-muted-foreground block mb-1">تاریخ شروع و اجرا *</label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="h-8.5 text-xs font-mono"
              />
            </div>

            <div>
              <label className="font-semibold text-muted-foreground block mb-1">تاریخ پایان قرارداد (اختیاری)</label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="h-8.5 text-xs font-mono"
              />
            </div>
          </div>

          {/* بخش ۲: مبانی حقوق و مزایای ریالی مندرج در حکم */}
          <div className="p-3.5 bg-card rounded-xl border border-border/80 flex flex-col gap-3 shadow-2xs">
            <div className="flex items-center justify-between border-b pb-2">
              <span className="font-bold text-xs text-foreground flex items-center gap-1.5">
                <TrendingUp className="size-4 text-emerald-600" />
                جدول اقلام حقوقی و مزایای قانونی (ریال)
              </span>
              <span className="text-[11px] font-mono text-muted-foreground">
                حقوق پایه ۳۰ روزه: <strong className="text-foreground">{money(baseMonthly)}</strong>
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="font-bold text-foreground block mb-1">دستمزد پایه روزانه (ریال) *</label>
                <Input
                  type="number"
                  value={baseDailySalary}
                  onChange={(e) => setBaseDailySalary(Number(e.target.value) || 0)}
                  className="h-8.5 text-xs font-mono font-bold"
                />
                <span className="text-[10px] text-muted-foreground mt-0.5 block font-mono">
                  معادل {money(baseDailySalary)} ریال در روز
                </span>
              </div>

              <div>
                <label className="font-semibold text-muted-foreground block mb-1">کمک‌هزینه مسکن (حق مسکن)</label>
                <Input
                  type="number"
                  value={housingAllowance}
                  onChange={(e) => setHousingAllowance(Number(e.target.value) || 0)}
                  className="h-8.5 text-xs font-mono"
                />
              </div>

              <div>
                <label className="font-semibold text-muted-foreground block mb-1">بن خواربار و اقلام مصرفی</label>
                <Input
                  type="number"
                  value={groceryAllowance}
                  onChange={(e) => setGroceryAllowance(Number(e.target.value) || 0)}
                  className="h-8.5 text-xs font-mono"
                />
              </div>

              <div>
                <label className="font-semibold text-muted-foreground block mb-1">حق عائله‌مندی (تأهل)</label>
                <Input
                  type="number"
                  value={maritalAllowance}
                  onChange={(e) => setMaritalAllowance(Number(e.target.value) || 0)}
                  className="h-8.5 text-xs font-mono"
                />
              </div>

              <div>
                <label className="font-semibold text-muted-foreground block mb-1">پایه سنوات تجمیعی</label>
                <Input
                  type="number"
                  value={seniorityAllowance}
                  onChange={(e) => setSeniorityAllowance(Number(e.target.value) || 0)}
                  className="h-8.5 text-xs font-mono"
                />
              </div>

              <div>
                <label className="font-semibold text-muted-foreground block mb-1">حق مسئولیت / سرپرستی</label>
                <Input
                  type="number"
                  value={responsibilityAllowance}
                  onChange={(e) => setResponsibilityAllowance(Number(e.target.value) || 0)}
                  className="h-8.5 text-xs font-mono"
                />
              </div>

              <div>
                <label className="font-semibold text-muted-foreground block mb-1">فوق‌العاده شغل و تخصص</label>
                <Input
                  type="number"
                  value={specialAllowance}
                  onChange={(e) => setSpecialAllowance(Number(e.target.value) || 0)}
                  className="h-8.5 text-xs font-mono"
                />
              </div>

              <div>
                <label className="font-semibold text-muted-foreground block mb-1">مدرک تحصیلی مندرج در حکم</label>
                <Input
                  value={educationDegree}
                  onChange={(e) => setEducationDegree(e.target.value)}
                  placeholder="مثلاً لیسانس مهندسی صنایع"
                  className="h-8.5 text-xs"
                />
              </div>
            </div>

            {/* جمع ناخالص کل */}
            <div className="mt-2 p-3 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-between">
              <div>
                <span className="font-bold text-xs text-foreground block">جمع کل ناخالص مستمر ماهانه حکم:</span>
                <span className="text-[10px] text-muted-foreground">شامل مزد پایه + بن + مسکن + تأهل + سنوات + مسئولیت</span>
              </div>
              <div className="text-lg font-black font-mono text-primary">
                {money(totalMonthlyGross)} ریال
              </div>
            </div>
          </div>

          {/* تبصره‌ها */}
          <div>
            <label className="font-semibold text-muted-foreground block mb-1">شرایط، مفاد و توضیحات انضباطی حکم</label>
            <Textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="توضیحات و تعهدات..."
              className="text-xs resize-none rounded-lg"
            />
          </div>
        </div>

        <DialogFooter className="mt-4 gap-2">
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)} className="rounded-lg">
            انصراف
          </Button>
          <Button
            size="sm"
            onClick={() => mutation.mutate()}
            disabled={mutation.isPending || !employeeId || !contractNumber || baseDailySalary <= 0}
            className="gap-1.5 bg-primary hover:bg-primary/90 text-primary-foreground font-bold rounded-lg px-5 shadow-xs"
          >
            <CheckCircle2 className="size-3.5" />
            {mutation.isPending ? "در حال ثبت..." : editDecree ? "ذخیره تغییرات حکم" : "صدور رسمی حکم کارگزینی"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
