"use client";

import * as React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Building2,
  Calendar,
  CheckCircle2,
  FileSpreadsheet,
  FileText,
  Plus,
  Printer,
  RefreshCw,
  Search,
  ShieldCheck,
  UserCheck,
  Users,
  Wallet,
} from "lucide-react";

import {
  calculatePayrollSlip,
  createContract,
  createDepartment,
  createEmployee,
  createPayrollPeriod,
  getDepartments,
  getEmployees,
  getPayrollPeriods,
  getPayrollSlips,
} from "@/lib/api";
import { faDate, money, toFa } from "@/lib/format";
import { cn } from "@/lib/utils";
import type {
  DepartmentRow,
  EmployeeRow,
  PayrollPeriodRow,
  PayrollSlipRow,
} from "@/lib/types";

import { PageHeader } from "@/components/page-header";
import { LoadingState, ErrorState, EmptyState } from "@/components/states";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export default function HrPage() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = React.useState<"employees" | "departments" | "payroll">("employees");
  const [searchTerm, setSearchTerm] = React.useState("");
  const [selectedPeriodId, setSelectedPeriodId] = React.useState<string | null>(null);

  // Queries
  const { data: employees = [], isLoading: isLoadingEmp } = useQuery({
    queryKey: ["employees", searchTerm],
    queryFn: () => getEmployees({ search: searchTerm || undefined }),
  });

  const { data: departments = [], isLoading: isLoadingDep } = useQuery({
    queryKey: ["departments"],
    queryFn: getDepartments,
  });

  const { data: periods = [], isLoading: isLoadingPeriods } = useQuery({
    queryKey: ["payroll-periods"],
    queryFn: getPayrollPeriods,
  });

  // انتخاب اولین دوره به عنوان پیش‌فرض
  React.useEffect(() => {
    if (periods.length > 0 && !selectedPeriodId) {
      setSelectedPeriodId(periods[0].id);
    }
  }, [periods, selectedPeriodId]);

  const { data: slips = [], isLoading: isLoadingSlips } = useQuery({
    queryKey: ["payroll-slips", selectedPeriodId],
    queryFn: () => (selectedPeriodId ? getPayrollSlips(selectedPeriodId) : Promise.resolve([])),
    enabled: !!selectedPeriodId,
  });

  // دیالوگ‌های ثبت
  const [newEmployeeOpen, setNewEmployeeOpen] = React.useState(false);
  const [newDepartmentOpen, setNewDepartmentOpen] = React.useState(false);
  const [newPeriodOpen, setNewPeriodOpen] = React.useState(false);
  const [calcSlipOpen, setCalcSlipOpen] = React.useState(false);
  const [selectedEmployeeForSlip, setSelectedEmployeeForSlip] = React.useState<string>("");

  // فرم‌های ثبت
  const [empForm, setEmpForm] = React.useState({
    personnelCode: "",
    firstName: "",
    lastName: "",
    nationalId: "",
    mobile: "",
    jobTitle: "",
    departmentId: "",
    maritalStatus: "SINGLE",
    childrenCount: 0,
    dailySalary: 3000000,
  });

  const [depForm, setDepForm] = React.useState({
    name: "",
    code: "",
    description: "",
    managerName: "",
  });

  const [periodForm, setPeriodForm] = React.useState({
    year: 1403,
    month: 8,
    title: "حقوق و دستمزد آبان ۱۴۰۳",
  });

  const [slipForm, setSlipForm] = React.useState({
    workingDays: 30,
    overtimeHours: 0,
    delayHours: 0,
    loanDeductions: 0,
    otherDeductions: 0,
  });

  // Mutations
  const createEmpMutation = useMutation({
    mutationFn: async () => {
      const emp = await createEmployee({
        personnelCode: empForm.personnelCode,
        firstName: empForm.firstName,
        lastName: empForm.lastName,
        nationalId: empForm.nationalId,
        mobile: empForm.mobile,
        jobTitle: empForm.jobTitle,
        departmentId: empForm.departmentId || undefined,
        maritalStatus: empForm.maritalStatus,
        childrenCount: Number(empForm.childrenCount),
      });

      // صدور حکم اولیه
      await createContract({
        contractNumber: `CNT-${empForm.personnelCode}`,
        employeeId: emp.id,
        startDate: new Date().toISOString(),
        baseDailySalary: Number(empForm.dailySalary),
        baseMonthlySalary: Number(empForm.dailySalary) * 30,
      });
      return emp;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employees"] });
      setNewEmployeeOpen(false);
    },
  });

  const createDepMutation = useMutation({
    mutationFn: () => createDepartment(depForm),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["departments"] });
      setNewDepartmentOpen(false);
    },
  });

  const createPeriodMutation = useMutation({
    mutationFn: () => createPayrollPeriod(periodForm),
    onSuccess: (newPer) => {
      queryClient.invalidateQueries({ queryKey: ["payroll-periods"] });
      setSelectedPeriodId(newPer.id);
      setNewPeriodOpen(false);
    },
  });

  const calcSlipMutation = useMutation({
    mutationFn: () => {
      if (!selectedPeriodId || !selectedEmployeeForSlip) {
        throw new Error("دوره یا پرسنل انتخاب نشده است");
      }
      return calculatePayrollSlip({
        periodId: selectedPeriodId,
        employeeId: selectedEmployeeForSlip,
        workingDays: Number(slipForm.workingDays),
        overtimeHours: Number(slipForm.overtimeHours),
        delayHours: Number(slipForm.delayHours),
        loanDeductions: Number(slipForm.loanDeductions),
        otherDeductions: Number(slipForm.otherDeductions),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payroll-slips", selectedPeriodId] });
      queryClient.invalidateQueries({ queryKey: ["payroll-periods"] });
      setCalcSlipOpen(false);
    },
  });

  const activePeriod = periods.find((p) => p.id === selectedPeriodId);

  return (
    <div className="flex flex-col gap-6 p-6">
      <PageHeader
        title="منابع انسانی، کارگزینی و حقوق و دستمزد"
        description="مدیریت پرونده پرسنلی، احکام استخدامی و موتور محاسبه فیش حقوقی مطابق قانون کار جمهوری اسلامی ایران"
        actions={
          <div className="flex items-center gap-2">
            {activeTab === "employees" && (
              <Button onClick={() => setNewEmployeeOpen(true)} className="gap-2">
                <Plus className="size-4" />
                استخدام و ثبت پرسنل
              </Button>
            )}
            {activeTab === "departments" && (
              <Button onClick={() => setNewDepartmentOpen(true)} className="gap-2">
                <Plus className="size-4" />
                واحد سازمانی جدید
              </Button>
            )}
            {activeTab === "payroll" && (
              <>
                <Button variant="outline" onClick={() => setNewPeriodOpen(true)} className="gap-2">
                  <Calendar className="size-4" />
                  دوره حقوق جدید
                </Button>
                <Button onClick={() => setCalcSlipOpen(true)} className="gap-2">
                  <Plus className="size-4" />
                  محاسبه فیش پرسنل
                </Button>
              </>
            )}
          </div>
        }
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="flex items-center gap-4 p-4">
          <div className="flex size-12 items-center justify-center rounded-xl bg-blue-500/10 text-blue-600">
            <Users className="size-6" />
          </div>
          <div>
            <div className="text-xs text-muted-foreground">کل پرسنل شاغل</div>
            <div className="text-2xl font-bold">{toFa(employees.length)} <span className="text-xs font-normal">نفر</span></div>
          </div>
        </Card>

        <Card className="flex items-center gap-4 p-4">
          <div className="flex size-12 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-600">
            <Building2 className="size-6" />
          </div>
          <div>
            <div className="text-xs text-muted-foreground">واحدهای سازمانی</div>
            <div className="text-2xl font-bold">{toFa(departments.length)} <span className="text-xs font-normal">دپارتمان</span></div>
          </div>
        </Card>

        <Card className="flex items-center gap-4 p-4">
          <div className="flex size-12 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600">
            <Wallet className="size-6" />
          </div>
          <div>
            <div className="text-xs text-muted-foreground">خالص پرداختی دوره جاری</div>
            <div className="text-2xl font-bold">{activePeriod ? money(activePeriod.totalNetPay) : "—"}</div>
          </div>
        </Card>

        <Card className="flex items-center gap-4 p-4">
          <div className="flex size-12 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600">
            <ShieldCheck className="size-6" />
          </div>
          <div>
            <div className="text-xs text-muted-foreground">حق بیمه تأمین اجتماعی (۷٪ + ۲۳٪)</div>
            <div className="text-2xl font-bold">
              {activePeriod
                ? money(activePeriod.totalWorkerInsurance + activePeriod.totalEmployerInsurance)
                : "—"}
            </div>
          </div>
        </Card>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-border text-sm font-medium">
        <button
          onClick={() => setActiveTab("employees")}
          className={cn(
            "flex items-center gap-2 border-b-2 px-4 py-2.5 transition-colors",
            activeTab === "employees"
              ? "border-primary text-primary font-bold"
              : "border-transparent text-muted-foreground hover:text-foreground",
          )}
        >
          <Users className="size-4" />
          پرسنل و احکام کارگزینی
          <Badge variant="secondary" className="text-xs">{toFa(employees.length)}</Badge>
        </button>

        <button
          onClick={() => setActiveTab("departments")}
          className={cn(
            "flex items-center gap-2 border-b-2 px-4 py-2.5 transition-colors",
            activeTab === "departments"
              ? "border-primary text-primary font-bold"
              : "border-transparent text-muted-foreground hover:text-foreground",
          )}
        >
          <Building2 className="size-4" />
          چارت و ساختار سازمانی
          <Badge variant="secondary" className="text-xs">{toFa(departments.length)}</Badge>
        </button>

        <button
          onClick={() => setActiveTab("payroll")}
          className={cn(
            "flex items-center gap-2 border-b-2 px-4 py-2.5 transition-colors",
            activeTab === "payroll"
              ? "border-primary text-primary font-bold"
              : "border-transparent text-muted-foreground hover:text-foreground",
          )}
        >
          <FileSpreadsheet className="size-4" />
          محاسبه حقوق و فیش حقوقی (قانون کار)
          {activePeriod && (
            <Badge variant="outline" className="text-xs bg-emerald-50 text-emerald-700">
              {activePeriod.title}
            </Badge>
          )}
        </button>
      </div>

      {/* ───────────────────────── TAB 1: پرسنل و کارگزینی ───────────────────────── */}
      {activeTab === "employees" && (
        <Card className="overflow-hidden">
          <div className="flex items-center justify-between border-b p-4">
            <div className="relative w-72">
              <Search className="absolute right-3 top-2.5 size-4 text-muted-foreground" />
              <Input
                placeholder="جست‌وجوی نام، کدملی یا کد پرسنلی..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pr-9 text-xs"
              />
            </div>
            <div className="text-xs text-muted-foreground">
              تعداد پرونده‌های فعال: {toFa(employees.length)}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead className="bg-muted/50 text-muted-foreground">
                <tr>
                  <th className="p-3">کد پرسنلی</th>
                  <th className="p-3">نام و نام خانوادگی</th>
                  <th className="p-3">کد ملی</th>
                  <th className="p-3">شماره تماس</th>
                  <th className="p-3">واحد سازمانی</th>
                  <th className="p-3">سمت شغلی</th>
                  <th className="p-3">وضعیت تأهل و اولاد</th>
                  <th className="p-3">حقوق پایه روزانه</th>
                  <th className="p-3">وضعیت حکم</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {employees.map((emp) => {
                  const contract = emp.contracts?.[0];
                  return (
                    <tr key={emp.id} className="hover:bg-muted/30">
                      <td className="p-3 font-mono font-bold text-primary">{emp.personnelCode}</td>
                      <td className="p-3 font-semibold">{emp.firstName} {emp.lastName}</td>
                      <td className="p-3 font-mono">{toFa(emp.nationalId)}</td>
                      <td className="p-3 font-mono">{toFa(emp.mobile)}</td>
                      <td className="p-3">
                        {emp.department ? (
                          <Badge variant="outline">{emp.department.name}</Badge>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </td>
                      <td className="p-3">{emp.jobTitle}</td>
                      <td className="p-3">
                        {emp.maritalStatus === "MARRIED" ? "متأهل" : "مجرد"}
                        {emp.childrenCount > 0 && ` (${toFa(emp.childrenCount)} فرزند)`}
                      </td>
                      <td className="p-3 font-mono font-bold">
                        {contract ? money(contract.baseDailySalary) : "—"}
                      </td>
                      <td className="p-3">
                        {contract ? (
                          <Badge className="bg-emerald-500/10 text-emerald-600">حکم جاری</Badge>
                        ) : (
                          <Badge variant="outline" className="text-amber-600">بدون حکم</Badge>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* ───────────────────────── TAB 2: دپارتمان‌ها ───────────────────────── */}
      {activeTab === "departments" && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {departments.map((dep) => (
            <Card key={dep.id} className="p-5">
              <div className="flex items-start justify-between">
                <div>
                  <Badge variant="outline" className="font-mono text-xs">{dep.code}</Badge>
                  <h3 className="mt-2 text-base font-bold">{dep.name}</h3>
                </div>
                <div className="rounded-lg bg-primary/10 p-2 text-primary">
                  <Building2 className="size-5" />
                </div>
              </div>
              <p className="mt-2 text-xs text-muted-foreground">
                {dep.description || "بدون شرح فعالیت"}
              </p>
              <div className="mt-4 flex items-center justify-between border-t pt-3 text-xs">
                <span className="text-muted-foreground">مدیر واحد: {dep.managerName || "تعیین‌نشده"}</span>
                <span className="font-bold text-primary">
                  {toFa(dep._count?.employees || 0)} نفر پرسنل
                </span>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* ───────────────────────── TAB 3: حقوق و فیش حقوقی ───────────────────────── */}
      {activeTab === "payroll" && (
        <div className="flex flex-col gap-6">
          {/* انتخاب دوره حقوق */}
          <div className="flex items-center justify-between rounded-xl border bg-card p-4">
            <div className="flex items-center gap-3">
              <Calendar className="size-5 text-primary" />
              <span className="text-sm font-semibold">دوره محاسباتی:</span>
              <select
                className="h-9 rounded-md border bg-background px-3 text-xs font-semibold"
                value={selectedPeriodId || ""}
                onChange={(e) => setSelectedPeriodId(e.target.value)}
              >
                {periods.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.title} ({toFa(p.slipsCount)} فیش صادرشده)
                  </option>
                ))}
              </select>
            </div>
            {activePeriod && (
              <div className="flex items-center gap-4 text-xs">
                <span>جمع ناخالص: <strong>{money(activePeriod.totalGrossPay)}</strong></span>
                <span>بیمه کارفرما (۲۳٪): <strong>{money(activePeriod.totalEmployerInsurance)}</strong></span>
                <span>خالص کل پرداختی: <strong className="text-emerald-600">{money(activePeriod.totalNetPay)}</strong></span>
              </div>
            )}
          </div>

          {/* جدول فیش‌های حقوقی */}
          <Card className="overflow-hidden">
            <div className="border-b p-4 text-xs font-bold text-muted-foreground">
              فیش‌های حقوقی صادرشده برای دوره جاری
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead className="bg-muted/50 text-muted-foreground">
                  <tr>
                    <th className="p-3">کد</th>
                    <th className="p-3">نام کارمند</th>
                    <th className="p-3">کارکرد (روز)</th>
                    <th className="p-3">اضافه‌کار</th>
                    <th className="p-3">حقوق پایه</th>
                    <th className="p-3">بن و مسکن</th>
                    <th className="p-3">حق اولاد و تأهل</th>
                    <th className="p-3">مجموع ناخالص</th>
                    <th className="p-3">بیمه کارگر (۷٪)</th>
                    <th className="p-3">مالیات</th>
                    <th className="p-3">خالص پرداختی</th>
                    <th className="p-3">بیمه کارفرما (۲۳٪)</th>
                    <th className="p-3 text-center">چاپ فیش</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {slips.map((slip) => (
                    <tr key={slip.id} className="hover:bg-muted/30">
                      <td className="p-3 font-mono font-bold">{slip.employee.personnelCode}</td>
                      <td className="p-3 font-semibold">{slip.employee.firstName} {slip.employee.lastName}</td>
                      <td className="p-3 font-mono">{toFa(slip.workingDays)}</td>
                      <td className="p-3 font-mono">{toFa(slip.overtimeHours)} ساعت</td>
                      <td className="p-3 font-mono">{money(slip.baseSalaryEarned)}</td>
                      <td className="p-3 font-mono">{money(slip.housingAllowance + slip.groceryAllowance)}</td>
                      <td className="p-3 font-mono">{money(slip.childAllowance + slip.maritalAllowance)}</td>
                      <td className="p-3 font-mono font-bold">{money(slip.totalGrossSalary)}</td>
                      <td className="p-3 font-mono text-amber-600">{money(slip.workerInsurance)}</td>
                      <td className="p-3 font-mono text-red-600">{money(slip.incomeTax)}</td>
                      <td className="p-3 font-mono font-bold text-emerald-600">{money(slip.netPayable)}</td>
                      <td className="p-3 font-mono text-blue-600">{money(slip.employerInsurance)}</td>
                      <td className="p-3 text-center">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => window.print()}
                          className="h-8 gap-1 text-[11px]"
                        >
                          <Printer className="size-3.5" />
                          فیش رسمی
                        </Button>
                      </td>
                    </tr>
                  ))}
                  {slips.length === 0 && (
                    <tr>
                      <td colSpan={13} className="p-6 text-center text-muted-foreground">
                        هنوز فیش حقوقی برای این دوره محاسبه نشده است. روی دکمه «محاسبه فیش پرسنل» کلیک کنید.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {/* ───────────────────────── DIALOG 1: پرسنل جدید ───────────────────────── */}
      <Dialog open={newEmployeeOpen} onOpenChange={setNewEmployeeOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>استخدام و ثبت پرونده پرسنلی</DialogTitle>
            <DialogDescription>اطلاعات هویتی و حکم اولیه کارمند را وارد نمایید.</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="flex flex-col gap-1">
              <span>کد پرسنلی:</span>
              <Input
                placeholder="مثلاً EMP-1002"
                value={empForm.personnelCode}
                onChange={(e) => setEmpForm({ ...empForm, personnelCode: e.target.value })}
              />
            </div>
            <div className="flex flex-col gap-1">
              <span>کد ملی:</span>
              <Input
                placeholder="۱۰ رقمی"
                value={empForm.nationalId}
                onChange={(e) => setEmpForm({ ...empForm, nationalId: e.target.value })}
              />
            </div>
            <div className="flex flex-col gap-1">
              <span>نام:</span>
              <Input
                value={empForm.firstName}
                onChange={(e) => setEmpForm({ ...empForm, firstName: e.target.value })}
              />
            </div>
            <div className="flex flex-col gap-1">
              <span>نام خانوادگی:</span>
              <Input
                value={empForm.lastName}
                onChange={(e) => setEmpForm({ ...empForm, lastName: e.target.value })}
              />
            </div>
            <div className="flex flex-col gap-1">
              <span>موبایل:</span>
              <Input
                placeholder="۰۹۱۲..."
                value={empForm.mobile}
                onChange={(e) => setEmpForm({ ...empForm, mobile: e.target.value })}
              />
            </div>
            <div className="flex flex-col gap-1">
              <span>عنوان شغلی:</span>
              <Input
                placeholder="اپراتور CNC، حسابدار، ..."
                value={empForm.jobTitle}
                onChange={(e) => setEmpForm({ ...empForm, jobTitle: e.target.value })}
              />
            </div>
            <div className="flex flex-col gap-1">
              <span>واحد سازمانی:</span>
              <select
                className="h-9 rounded-md border bg-background px-2"
                value={empForm.departmentId}
                onChange={(e) => setEmpForm({ ...empForm, departmentId: e.target.value })}
              >
                <option value="">انتخاب واحد...</option>
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <span>وضعیت تأهل:</span>
              <select
                className="h-9 rounded-md border bg-background px-2"
                value={empForm.maritalStatus}
                onChange={(e) => setEmpForm({ ...empForm, maritalStatus: e.target.value })}
              >
                <option value="SINGLE">مجرد</option>
                <option value="MARRIED">متأهل</option>
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <span>تعداد اولاد مشمول:</span>
              <Input
                type="number"
                min="0"
                value={empForm.childrenCount}
                onChange={(e) => setEmpForm({ ...empForm, childrenCount: Number(e.target.value) })}
              />
            </div>
            <div className="flex flex-col gap-1">
              <span>دستمزد پایه روزانه (ریال):</span>
              <Input
                type="number"
                value={empForm.dailySalary}
                onChange={(e) => setEmpForm({ ...empForm, dailySalary: Number(e.target.value) })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              onClick={() => createEmpMutation.mutate()}
              disabled={createEmpMutation.isPending || !empForm.firstName || !empForm.personnelCode}
            >
              ثبت کارمند و صدور حکم
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ───────────────────────── DIALOG 2: دپارتمان جدید ───────────────────────── */}
      <Dialog open={newDepartmentOpen} onOpenChange={setNewDepartmentOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>تعریف واحد سازمانی جدید</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-3 text-xs">
            <div className="flex flex-col gap-1">
              <span>نام واحد:</span>
              <Input
                placeholder="مثلاً واحد طراحی و مهندسی"
                value={depForm.name}
                onChange={(e) => setDepForm({ ...depForm, name: e.target.value })}
              />
            </div>
            <div className="flex flex-col gap-1">
              <span>کد واحد:</span>
              <Input
                placeholder="مثلاً DEP-ENG"
                value={depForm.code}
                onChange={(e) => setDepForm({ ...depForm, code: e.target.value })}
              />
            </div>
            <div className="flex flex-col gap-1">
              <span>مدیر واحد:</span>
              <Input
                value={depForm.managerName}
                onChange={(e) => setDepForm({ ...depForm, managerName: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              onClick={() => createDepMutation.mutate()}
              disabled={createDepMutation.isPending || !depForm.name || !depForm.code}
            >
              ثبت واحد
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ───────────────────────── DIALOG 3: دوره حقوق جدید ───────────────────────── */}
      <Dialog open={newPeriodOpen} onOpenChange={setNewPeriodOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>ایجاد دوره حقوق و دستمزد</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-3 text-xs">
            <div className="flex flex-col gap-1">
              <span>سال:</span>
              <Input
                type="number"
                value={periodForm.year}
                onChange={(e) => setPeriodForm({ ...periodForm, year: Number(e.target.value) })}
              />
            </div>
            <div className="flex flex-col gap-1">
              <span>ماه:</span>
              <select
                className="h-9 rounded-md border bg-background px-2"
                value={periodForm.month}
                onChange={(e) => {
                  const m = Number(e.target.value);
                  const monthNames = ["فروردین","اردیبهشت","خرداد","تیر","مرداد","شهریور","مهر","آبان","آذر","دی","بهمن","اسفند"];
                  setPeriodForm({
                    ...periodForm,
                    month: m,
                    title: `حقوق و دستمزد ${monthNames[m - 1]} ${periodForm.year}`,
                  });
                }}
              >
                {[1,2,3,4,5,6,7,8,9,10,11,12].map((m) => (
                  <option key={m} value={m}>ماه {m}</option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <span>عنوان دوره:</span>
              <Input
                value={periodForm.title}
                onChange={(e) => setPeriodForm({ ...periodForm, title: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              onClick={() => createPeriodMutation.mutate()}
              disabled={createPeriodMutation.isPending}
            >
              ایجاد دوره
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ───────────────────────── DIALOG 4: محاسبه فیش پرسنل ───────────────────────── */}
      <Dialog open={calcSlipOpen} onOpenChange={setCalcSlipOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>محاسبه فیش حقوقی پرسنل</DialogTitle>
            <DialogDescription>کارکرد ماهانه و ساعات اضافه کاری را جهت صدور فیش وارد کنید.</DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-3 text-xs">
            <div className="flex flex-col gap-1">
              <span>انتخاب پرسنل:</span>
              <select
                className="h-9 rounded-md border bg-background px-2 text-xs font-semibold"
                value={selectedEmployeeForSlip}
                onChange={(e) => setSelectedEmployeeForSlip(e.target.value)}
              >
                <option value="">انتخاب پرسنل...</option>
                {employees.map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    {emp.personnelCode} — {emp.firstName} {emp.lastName} ({emp.jobTitle})
                  </option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1">
                <span>روزهای کارکرد (استاندارد ۳۰):</span>
                <Input
                  type="number"
                  value={slipForm.workingDays}
                  onChange={(e) => setSlipForm({ ...slipForm, workingDays: Number(e.target.value) })}
                />
              </div>
              <div className="flex flex-col gap-1">
                <span>ساعات اضافه‌کاری:</span>
                <Input
                  type="number"
                  value={slipForm.overtimeHours}
                  onChange={(e) => setSlipForm({ ...slipForm, overtimeHours: Number(e.target.value) })}
                />
              </div>
              <div className="flex flex-col gap-1">
                <span>وام و مساعده دریافتی (ریال):</span>
                <Input
                  type="number"
                  value={slipForm.loanDeductions}
                  onChange={(e) => setSlipForm({ ...slipForm, loanDeductions: Number(e.target.value) })}
                />
              </div>
              <div className="flex flex-col gap-1">
                <span>سایر کسورات (ریال):</span>
                <Input
                  type="number"
                  value={slipForm.otherDeductions}
                  onChange={(e) => setSlipForm({ ...slipForm, otherDeductions: Number(e.target.value) })}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              onClick={() => calcSlipMutation.mutate()}
              disabled={calcSlipMutation.isPending || !selectedEmployeeForSlip}
            >
              محاسبه و صدور فیش
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
