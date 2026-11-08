"use client";

import * as React from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, User, UserPlus } from "lucide-react";
import { createContract, createEmployee, updateEmployee } from "@/lib/api";
import type { DepartmentRow, EmployeeRow } from "@/lib/types";
import { money } from "@/lib/format";
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

interface EmployeeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  departments: DepartmentRow[];
  editEmployee?: EmployeeRow | null;
}

export function EmployeeDialog({
  open,
  onOpenChange,
  departments,
  editEmployee,
}: EmployeeDialogProps) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [form, setForm] = React.useState({
    personnelCode: "",
    firstName: "",
    lastName: "",
    nationalId: "",
    birthCertificate: "",
    fatherName: "",
    birthDate: "",
    mobile: "",
    emergencyPhone: "",
    bloodType: "",
    gender: "MALE",
    militaryStatus: "COMPLETED",
    address: "",
    insuranceNumber: "",
    bankAccount: "",
    iban: "",
    maritalStatus: "SINGLE",
    childrenCount: 0,
    jobTitle: "",
    departmentId: "",
    initialDailySalary: 3000000,
    notes: "",
  });

  React.useEffect(() => {
    if (editEmployee) {
      setForm({
        personnelCode: editEmployee.personnelCode,
        firstName: editEmployee.firstName,
        lastName: editEmployee.lastName,
        nationalId: editEmployee.nationalId,
        birthCertificate: editEmployee.birthCertificate || "",
        fatherName: editEmployee.fatherName || "",
        birthDate: editEmployee.birthDate || "",
        mobile: editEmployee.mobile,
        emergencyPhone: editEmployee.emergencyPhone || "",
        bloodType: editEmployee.bloodType || "",
        gender: editEmployee.gender || "MALE",
        militaryStatus: editEmployee.militaryStatus || "COMPLETED",
        address: editEmployee.address || "",
        insuranceNumber: editEmployee.insuranceNumber || "",
        bankAccount: editEmployee.bankAccount || "",
        iban: editEmployee.iban || "",
        maritalStatus: editEmployee.maritalStatus || "SINGLE",
        childrenCount: editEmployee.childrenCount || 0,
        jobTitle: editEmployee.jobTitle,
        departmentId: editEmployee.departmentId || "",
        initialDailySalary: 3000000,
        notes: editEmployee.notes || "",
      });
    } else {
      const rand = Math.floor(1000 + Math.random() * 9000);
      setForm({
        personnelCode: `EMP-${rand}`,
        firstName: "",
        lastName: "",
        nationalId: "",
        birthCertificate: "",
        fatherName: "",
        birthDate: "",
        mobile: "",
        emergencyPhone: "",
        bloodType: "A+",
        gender: "MALE",
        militaryStatus: "COMPLETED",
        address: "",
        insuranceNumber: "",
        bankAccount: "",
        iban: "IR",
        maritalStatus: "SINGLE",
        childrenCount: 0,
        jobTitle: "کارشناس تولید و کارگاه",
        departmentId: departments[0]?.id || "",
        initialDailySalary: 3000000,
        notes: "",
      });
    }
  }, [editEmployee, departments, open]);

  const mutation = useMutation({
    mutationFn: async () => {
      if (editEmployee) {
        return updateEmployee(editEmployee.id, {
          firstName: form.firstName,
          lastName: form.lastName,
          nationalId: form.nationalId,
          birthCertificate: form.birthCertificate,
          fatherName: form.fatherName,
          birthDate: form.birthDate,
          mobile: form.mobile,
          emergencyPhone: form.emergencyPhone,
          bloodType: form.bloodType,
          gender: form.gender as any,
          militaryStatus: form.militaryStatus,
          address: form.address,
          insuranceNumber: form.insuranceNumber,
          bankAccount: form.bankAccount,
          iban: form.iban,
          maritalStatus: form.maritalStatus as any,
          childrenCount: Number(form.childrenCount),
          jobTitle: form.jobTitle,
          departmentId: form.departmentId || null,
          notes: form.notes,
        });
      }

      // ایجاد پرسنل جدید
      const emp = await createEmployee({
        personnelCode: form.personnelCode,
        firstName: form.firstName,
        lastName: form.lastName,
        nationalId: form.nationalId,
        birthCertificate: form.birthCertificate,
        fatherName: form.fatherName,
        birthDate: form.birthDate,
        mobile: form.mobile,
        emergencyPhone: form.emergencyPhone,
        bloodType: form.bloodType,
        gender: form.gender,
        militaryStatus: form.militaryStatus,
        address: form.address,
        insuranceNumber: form.insuranceNumber,
        bankAccount: form.bankAccount,
        iban: form.iban,
        maritalStatus: form.maritalStatus,
        childrenCount: Number(form.childrenCount),
        jobTitle: form.jobTitle,
        departmentId: form.departmentId || undefined,
        notes: form.notes,
      });

      // صدور خودکار حکم استخدام اولیه (INITIAL)
      await createContract({
        contractNumber: `DEC-${form.personnelCode}`,
        employeeId: emp.id,
        contractType: "FIXED_TERM",
        decreeType: "INITIAL",
        decreeTitle: `حکم استخدام اولیه ${form.firstName} ${form.lastName}`,
        startDate: new Date().toISOString().split("T")[0],
        baseDailySalary: Number(form.initialDailySalary),
        baseMonthlySalary: Number(form.initialDailySalary) * 30,
        housingAllowance: 9000000,
        groceryAllowance: 14000000,
        childAllowancePerChild: 7166184,
        maritalAllowance: 5000000,
        seniorityAllowance: 0,
        responsibilityAllowance: 0,
        specialAllowance: 0,
        notes: "حکم استخدام اولیه مندرج در پرونده پرسنلی",
      });

      return emp;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employees"] });
      queryClient.invalidateQueries({ queryKey: ["contracts"] });
      queryClient.invalidateQueries({ queryKey: ["hr-stats"] });
      toast({
        title: editEmployee ? "پرونده پرسنلی به‌روزرسانی شد" : "مستخدم جدید با موفقیت ثبت شد",
        description: editEmployee
          ? "تغییرات مشخصات کارمند در سیستم ذخیره گردید."
          : "پرونده پرسنلی و حکم اولیه کارگزینی صادر گردید.",
      });
      onOpenChange(false);
    },
    onError: (err: any) => {
      toast({
        title: "خطا در ثبت پرونده",
        description: err?.message || "خطایی رخ داد.",
        variant: "destructive",
      });
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[92vh] overflow-y-auto p-6 font-sans">
        <DialogHeader className="border-b pb-3">
          <DialogTitle className="flex items-center gap-2 text-base font-bold">
            <UserPlus className="size-5 text-primary" />
            {editEmployee ? "ویرایش مشخصات پرونده پرسنلی" : "استخدام و تشکیل پرونده پرسنلی جدید"}
          </DialogTitle>
          <DialogDescription className="text-xs">
            ثبت مشخصات هویتی، تماس، بیمه تأمین اجتماعی، اطلاعات بانکی و سازمانی
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4 text-xs mt-2">
          {/* مشخصات هویتی */}
          <div className="p-3.5 bg-muted/40 rounded-xl border border-border/60">
            <span className="font-bold text-foreground block mb-2.5">۱. اطلاعات شناسنامه‌ای و هویتی</span>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="font-bold text-foreground block mb-1">کد پرسنلی *</label>
                <Input
                  value={form.personnelCode}
                  onChange={(e) => setForm({ ...form, personnelCode: e.target.value })}
                  placeholder="EMP-1001"
                  className="h-8.5 text-xs font-mono font-bold"
                  disabled={!!editEmployee}
                />
              </div>

              <div>
                <label className="font-bold text-foreground block mb-1">نام *</label>
                <Input
                  value={form.firstName}
                  onChange={(e) => setForm({ ...form, firstName: e.target.value })}
                  className="h-8.5 text-xs font-semibold"
                />
              </div>

              <div>
                <label className="font-bold text-foreground block mb-1">نام خانوادگی *</label>
                <Input
                  value={form.lastName}
                  onChange={(e) => setForm({ ...form, lastName: e.target.value })}
                  className="h-8.5 text-xs font-semibold"
                />
              </div>

              <div>
                <label className="font-bold text-foreground block mb-1">کد ملی (۱۰ رقم) *</label>
                <Input
                  value={form.nationalId}
                  onChange={(e) => setForm({ ...form, nationalId: e.target.value })}
                  placeholder="0012345678"
                  className="h-8.5 text-xs font-mono font-bold"
                />
              </div>

              <div>
                <label className="font-semibold text-muted-foreground block mb-1">شماره شناسنامه</label>
                <Input
                  value={form.birthCertificate}
                  onChange={(e) => setForm({ ...form, birthCertificate: e.target.value })}
                  className="h-8.5 text-xs font-mono"
                />
              </div>

              <div>
                <label className="font-semibold text-muted-foreground block mb-1">نام پدر</label>
                <Input
                  value={form.fatherName}
                  onChange={(e) => setForm({ ...form, fatherName: e.target.value })}
                  className="h-8.5 text-xs"
                />
              </div>

              <div>
                <label className="font-semibold text-muted-foreground block mb-1">تاریخ تولد</label>
                <Input
                  value={form.birthDate}
                  onChange={(e) => setForm({ ...form, birthDate: e.target.value })}
                  placeholder="۱۳۷۰/۰۵/۱۴"
                  className="h-8.5 text-xs font-mono"
                />
              </div>

              <div>
                <label className="font-semibold text-muted-foreground block mb-1">جنسیت</label>
                <select
                  className="h-8.5 w-full rounded-lg border border-input bg-card px-2.5 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-primary"
                  value={form.gender}
                  onChange={(e) => setForm({ ...form, gender: e.target.value })}
                >
                  <option value="MALE">مرد</option>
                  <option value="FEMALE">زن</option>
                </select>
              </div>

              <div>
                <label className="font-semibold text-muted-foreground block mb-1">وضعیت نظام وظیفه</label>
                <select
                  className="h-8.5 w-full rounded-lg border border-input bg-card px-2.5 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-primary"
                  value={form.militaryStatus}
                  onChange={(e) => setForm({ ...form, militaryStatus: e.target.value })}
                >
                  <option value="COMPLETED">دارای کارت پایان خدمت</option>
                  <option value="EXEMPT">معافیت دائم پزشکی / کفالت</option>
                  <option value="ONGOING">معافیت تحصیلی / در حال خدمت</option>
                  <option value="NOT_APPLICABLE">مشمول نیست (بانوان)</option>
                </select>
              </div>
            </div>
          </div>

          {/* تماس و سکونت */}
          <div className="p-3.5 bg-card rounded-xl border border-border/80">
            <span className="font-bold text-foreground block mb-2.5">۲. اطلاعات تماس و نشانی</span>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="font-bold text-foreground block mb-1">شماره موبایل اصلی *</label>
                <Input
                  value={form.mobile}
                  onChange={(e) => setForm({ ...form, mobile: e.target.value })}
                  placeholder="09121234567"
                  className="h-8.5 text-xs font-mono font-bold"
                />
              </div>

              <div>
                <label className="font-semibold text-muted-foreground block mb-1">تلفن تماس اضطراری</label>
                <Input
                  value={form.emergencyPhone}
                  onChange={(e) => setForm({ ...form, emergencyPhone: e.target.value })}
                  placeholder="0218888..."
                  className="h-8.5 text-xs font-mono"
                />
              </div>

              <div>
                <label className="font-semibold text-muted-foreground block mb-1">گروه خونی</label>
                <select
                  className="h-8.5 w-full rounded-lg border border-input bg-card px-2.5 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-primary"
                  value={form.bloodType}
                  onChange={(e) => setForm({ ...form, bloodType: e.target.value })}
                >
                  <option value="A+">A مثبت (+)</option>
                  <option value="A-">A منفی (-)</option>
                  <option value="B+">B مثبت (+)</option>
                  <option value="B-">B منفی (-)</option>
                  <option value="O+">O مثبت (+)</option>
                  <option value="O-">O منفی (-)</option>
                  <option value="AB+">AB مثبت (+)</option>
                  <option value="AB-">AB منفی (-)</option>
                </select>
              </div>

              <div className="sm:col-span-3">
                <label className="font-semibold text-muted-foreground block mb-1">نشانی دقیق محل سکونت</label>
                <Input
                  value={form.address}
                  onChange={(e) => setForm({ ...form, address: e.target.value })}
                  placeholder="استان، شهر، خیابان..."
                  className="h-8.5 text-xs"
                />
              </div>
            </div>
          </div>

          {/* بیمه و اطلاعات بانکی */}
          <div className="p-3.5 bg-muted/40 rounded-xl border border-border/60">
            <span className="font-bold text-foreground block mb-2.5">۳. بیمه تأمین اجتماعی و مشخصات بانکی</span>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="font-semibold text-muted-foreground block mb-1">شماره بیمه تأمین اجتماعی</label>
                <Input
                  value={form.insuranceNumber}
                  onChange={(e) => setForm({ ...form, insuranceNumber: e.target.value })}
                  placeholder="۱۰ رقمی بیمه..."
                  className="h-8.5 text-xs font-mono"
                />
              </div>

              <div>
                <label className="font-semibold text-muted-foreground block mb-1">شماره حساب / کارت بانکی</label>
                <Input
                  value={form.bankAccount}
                  onChange={(e) => setForm({ ...form, bankAccount: e.target.value })}
                  placeholder="شماره حساب واریز حقوق"
                  className="h-8.5 text-xs font-mono"
                />
              </div>

              <div>
                <label className="font-semibold text-muted-foreground block mb-1">شماره شبا (IBAN)</label>
                <Input
                  value={form.iban}
                  onChange={(e) => setForm({ ...form, iban: e.target.value })}
                  placeholder="IR..."
                  className="h-8.5 text-xs font-mono font-bold"
                />
              </div>
            </div>
          </div>

          {/* سازمانی و حقوق اولیه */}
          <div className="p-3.5 bg-card rounded-xl border border-border/80">
            <span className="font-bold text-foreground block mb-2.5">۴. موقعیت شغلی و سازمانی</span>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="font-bold text-foreground block mb-1">عنوان سمت سازمانی *</label>
                <Input
                  value={form.jobTitle}
                  onChange={(e) => setForm({ ...form, jobTitle: e.target.value })}
                  placeholder="اپراتور CNC، حسابدار، نصاب..."
                  className="h-8.5 text-xs font-bold"
                />
              </div>

              <div>
                <label className="font-semibold text-muted-foreground block mb-1">واحد سازمانی</label>
                <select
                  className="h-8.5 w-full rounded-lg border border-input bg-card px-2.5 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-primary"
                  value={form.departmentId}
                  onChange={(e) => setForm({ ...form, departmentId: e.target.value })}
                >
                  <option value="">ستاد مرکزی / بدون واحد</option>
                  {departments.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name} ({d.code})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-semibold text-muted-foreground block mb-1">وضعیت تأهل</label>
                <select
                  className="h-8.5 w-full rounded-lg border border-input bg-card px-2.5 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-primary"
                  value={form.maritalStatus}
                  onChange={(e) => setForm({ ...form, maritalStatus: e.target.value })}
                >
                  <option value="SINGLE">مجرد</option>
                  <option value="MARRIED">متأهل</option>
                </select>
              </div>

              <div>
                <label className="font-semibold text-muted-foreground block mb-1">تعداد اولاد مشمول حق اولاد</label>
                <Input
                  type="number"
                  min="0"
                  value={form.childrenCount}
                  onChange={(e) => setForm({ ...form, childrenCount: Number(e.target.value) || 0 })}
                  className="h-8.5 text-xs font-mono font-bold"
                />
              </div>

              {!editEmployee && (
                <div className="sm:col-span-2">
                  <label className="font-bold text-primary block mb-1">دستمزد پایه روزانه حکم اولیه (ریال) *</label>
                  <Input
                    type="number"
                    value={form.initialDailySalary}
                    onChange={(e) =>
                      setForm({ ...form, initialDailySalary: Number(e.target.value) || 0 })
                    }
                    className="h-8.5 text-xs font-mono font-bold"
                  />
                  <span className="text-[10px] text-muted-foreground mt-0.5 block font-mono">
                    معادل {money(form.initialDailySalary * 30)} ریال ماهانه (پایه ۳۰ روزه)
                  </span>
                </div>
              )}
            </div>
          </div>

          <div>
            <label className="font-semibold text-muted-foreground block mb-1">ملاحظات و سوابق پرونده کارگزینی</label>
            <Textarea
              rows={2}
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              placeholder="توضیحات تکمیلی، معرف، مدارک تحویل‌گرفته..."
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
            disabled={mutation.isPending || !form.firstName || !form.lastName || !form.nationalId || !form.mobile}
            className="gap-1.5 bg-primary hover:bg-primary/90 text-primary-foreground font-bold rounded-lg px-5 shadow-xs"
          >
            <CheckCircle2 className="size-3.5" />
            {mutation.isPending ? "در حال ثبت..." : editEmployee ? "ذخیره ویرایش پرونده" : "تأیید استخدام و صدور حکم اولیه"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
