"use client";

import * as React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Award,
  BadgeCheck,
  Building2,
  Calendar,
  CheckCircle2,
  ChevronRight,
  FileCheck2,
  FileSpreadsheet,
  FileText,
  Filter,
  HardHat,
  Layers,
  Pencil,
  Plus,
  Printer,
  Receipt,
  RefreshCw,
  Search,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Trash2,
  TrendingUp,
  UserCheck,
  UserMinus,
  UserPlus,
  Users,
  Wallet,
} from "lucide-react";

import {
  calculatePayrollSlip,
  batchCalculatePayrollSlips,
  createDepartment,
  updateDepartment,
  createPayrollPeriod,
  getDepartments,
  getEmployees,
  getContracts,
  getPayrollPeriods,
  getPayrollSlips,
  getHrStats,
  deleteEmployee,
  deleteContract,
} from "@/lib/api";
import { faDate, money, toFa } from "@/lib/format";
import { cn } from "@/lib/utils";
import type {
  DepartmentRow,
  EmployeeContractRow,
  EmployeeRow,
  PayrollPeriodRow,
  PayrollSlipRow,
} from "@/lib/types";

import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import { EmployeeDialog } from "./employee-dialog";
import { DecreeDialog } from "./decree-dialog";
import { DecreePrintDialog } from "./decree-print-dialog";
import { PayslipPrintDialog } from "./payslip-print-dialog";

const DECREE_TYPE_LABELS: Record<string, string> = {
  INITIAL: "استخدام اولیه",
  ANNUAL_INCREASE: "افزایش سالانه",
  PROMOTION: "ارتقای رتبه",
  TITLE_CHANGE: "تغییر سمت",
  TRANSFER: "انتقال واحد",
  RENEWAL: "تمدید قرارداد",
  TERMINATION: "خاتمه خدمت",
};

export default function HrPage() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [activeTab, setActiveTab] = React.useState<"employees" | "decrees" | "departments" | "payroll">("employees");
  const [searchTerm, setSearchTerm] = React.useState("");
  const [departmentFilter, setDepartmentFilter] = React.useState<string>("ALL");
  const [decreeTypeFilter, setDecreeTypeFilter] = React.useState<string>("ALL");
  const [selectedPeriodId, setSelectedPeriodId] = React.useState<string | null>(null);

  // دیالوگ‌های پرسنل
  const [isNewEmployeeOpen, setIsNewEmployeeOpen] = React.useState(false);
  const [editingEmployee, setEditingEmployee] = React.useState<EmployeeRow | null>(null);

  // دیالوگ‌های حکم کارگزینی
  const [isNewDecreeOpen, setIsNewDecreeOpen] = React.useState(false);
  const [preselectedEmployeeId, setPreselectedEmployeeId] = React.useState<string | null>(null);
  const [editingDecree, setEditingDecree] = React.useState<EmployeeContractRow | null>(null);
  const [printDecree, setPrintDecree] = React.useState<EmployeeContractRow | null>(null);

  // دیالوگ‌های فیش حقوقی
  const [printSlip, setPrintSlip] = React.useState<PayrollSlipRow | null>(null);
  const [isCalcSlipOpen, setIsCalcSlipOpen] = React.useState(false);
  const [selectedEmployeeForSlip, setSelectedEmployeeForSlip] = React.useState<string>("");
  const [isBatchCalcOpen, setIsBatchCalcOpen] = React.useState(false);

  // دیالوگ‌های دپارتمان و دوره
  const [isNewDepartmentOpen, setIsNewDepartmentOpen] = React.useState(false);
  const [editingDepartment, setEditingDepartment] = React.useState<DepartmentRow | null>(null);
  const [isNewPeriodOpen, setIsNewPeriodOpen] = React.useState(false);

  // فرم‌های جانبی
  const [depForm, setDepForm] = React.useState({
    name: "",
    code: "",
    description: "",
    managerName: "",
  });

  const [periodForm, setPeriodForm] = React.useState({
    year: 1404,
    month: 1,
    title: "حقوق و دستمزد فروردین ۱۴۰۴",
  });

  const [slipForm, setSlipForm] = React.useState({
    workingDays: 30,
    overtimeHours: 0,
    delayHours: 0,
    leaveDays: 0,
    absenceDays: 0,
    loanDeductions: 0,
    otherDeductions: 0,
  });

  // کوئری‌ها
  const { data: stats, refetch: refetchStats } = useQuery({
    queryKey: ["hr-stats"],
    queryFn: getHrStats,
    refetchInterval: 8000,
  });

  const { data: employees = [], isLoading: isLoadingEmp, refetch: refetchEmployees } = useQuery({
    queryKey: ["employees", searchTerm, departmentFilter],
    queryFn: () =>
      getEmployees({
        search: searchTerm || undefined,
        departmentId: departmentFilter !== "ALL" ? departmentFilter : undefined,
      }),
  });

  const { data: contracts = [], isLoading: isLoadingContracts, refetch: refetchContracts } = useQuery({
    queryKey: ["contracts"],
    queryFn: () => getContracts(),
    refetchInterval: 8000,
  });

  const { data: departments = [], refetch: refetchDepartments } = useQuery({
    queryKey: ["departments"],
    queryFn: getDepartments,
  });

  const { data: periods = [], refetch: refetchPeriods } = useQuery({
    queryKey: ["payroll-periods"],
    queryFn: getPayrollPeriods,
  });

  React.useEffect(() => {
    if (periods.length > 0 && !selectedPeriodId) {
      setSelectedPeriodId(periods[0].id);
    }
  }, [periods, selectedPeriodId]);

  const { data: slips = [], refetch: refetchSlips } = useQuery({
    queryKey: ["payroll-slips", selectedPeriodId],
    queryFn: () => (selectedPeriodId ? getPayrollSlips(selectedPeriodId) : Promise.resolve([])),
    enabled: !!selectedPeriodId,
  });

  const activePeriod = periods.find((p) => p.id === selectedPeriodId);

  // میوتیشن‌ها
  const deleteEmpMutation = useMutation({
    mutationFn: (id: string) => deleteEmployee(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employees"] });
      queryClient.invalidateQueries({ queryKey: ["hr-stats"] });
      toast({ title: "وضعیت پرسنل به‌روز شد", description: "پرونده پرسنلی غیرفعال/خاتمه خدمت گردید." });
    },
  });

  const deleteContractMutation = useMutation({
    mutationFn: (id: string) => deleteContract(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contracts"] });
      queryClient.invalidateQueries({ queryKey: ["employees"] });
      queryClient.invalidateQueries({ queryKey: ["hr-stats"] });
      toast({ title: "حکم کارگزینی حذف شد" });
    },
  });

  const createDepMutation = useMutation({
    mutationFn: () => {
      if (editingDepartment) {
        return updateDepartment(editingDepartment.id, depForm);
      }
      return createDepartment(depForm);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["departments"] });
      queryClient.invalidateQueries({ queryKey: ["hr-stats"] });
      setIsNewDepartmentOpen(false);
      setEditingDepartment(null);
      setDepForm({ name: "", code: "", description: "", managerName: "" });
      toast({ title: "واحد سازمانی ثبت/ویرایش شد" });
    },
  });

  const createPeriodMutation = useMutation({
    mutationFn: () => createPayrollPeriod(periodForm),
    onSuccess: (newPer) => {
      queryClient.invalidateQueries({ queryKey: ["payroll-periods"] });
      setSelectedPeriodId(newPer.id);
      setIsNewPeriodOpen(false);
      toast({ title: "دوره حقوق جدید ایجاد شد" });
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
        leaveDays: Number(slipForm.leaveDays),
        absenceDays: Number(slipForm.absenceDays),
        loanDeductions: Number(slipForm.loanDeductions),
        otherDeductions: Number(slipForm.otherDeductions),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payroll-slips", selectedPeriodId] });
      queryClient.invalidateQueries({ queryKey: ["payroll-periods"] });
      setIsCalcSlipOpen(false);
      toast({ title: "فیش حقوقی با موفقیت صادر شد" });
    },
  });

  const batchCalcMutation = useMutation({
    mutationFn: () => {
      if (!selectedPeriodId) throw new Error("دوره‌ای انتخاب نشده است");
      return batchCalculatePayrollSlips({
        periodId: selectedPeriodId,
        defaultWorkingDays: 30,
      });
    },
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ["payroll-slips", selectedPeriodId] });
      queryClient.invalidateQueries({ queryKey: ["payroll-periods"] });
      setIsBatchCalcOpen(false);
      toast({ title: "محاسبه دسته‌جمعی تکمیل شد", description: res.message });
    },
  });

  // فیلتر احکام کارگزینی
  const filteredContracts = contracts.filter((c) => {
    if (decreeTypeFilter !== "ALL" && c.decreeType !== decreeTypeFilter) return false;
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      const empName = `${c.employee?.firstName || ""} ${c.employee?.lastName || ""}`.toLowerCase();
      const code = (c.contractNumber || "").toLowerCase();
      const title = (c.decreeTitle || "").toLowerCase();
      return empName.includes(q) || code.includes(q) || title.includes(q);
    }
    return true;
  });

  return (
    <div className="flex flex-col gap-5 p-5 sm:p-6 transition-all select-none">
      <PageHeader
        title="مدیریت منابع انسانی، پرونده پرسنلی و احکام کارگزینی"
        description="سامانه هوشمند صدور احکام استخدامی، احکام افزایش سالانه شورای عالی کار، پرونده الکترونیک و موتور محاسبه فیش حقوقی"
        icon={Users}
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                refetchStats();
                refetchEmployees();
                refetchContracts();
                refetchDepartments();
                refetchPeriods();
                refetchSlips();
              }}
              className="gap-1.5 text-xs h-8"
            >
              <RefreshCw className="size-3.5" />
              به‌روزرسانی
            </Button>

            {activeTab === "employees" && (
              <Button
                size="sm"
                onClick={() => {
                  setEditingEmployee(null);
                  setIsNewEmployeeOpen(true);
                }}
                className="gap-1.5 text-xs h-8 bg-primary hover:bg-primary/90 text-primary-foreground font-bold shadow-xs"
              >
                <UserPlus className="size-3.5" />
                استخدام و ثبت پرسنل جدید
              </Button>
            )}

            {activeTab === "decrees" && (
              <Button
                size="sm"
                onClick={() => {
                  setEditingDecree(null);
                  setPreselectedEmployeeId(null);
                  setIsNewDecreeOpen(true);
                }}
                className="gap-1.5 text-xs h-8 bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-xs"
              >
                <FileCheck2 className="size-3.5" />
                صدور حکم کارگزینی جدید
              </Button>
            )}

            {activeTab === "departments" && (
              <Button
                size="sm"
                onClick={() => {
                  setEditingDepartment(null);
                  setDepForm({ name: "", code: "", description: "", managerName: "" });
                  setIsNewDepartmentOpen(true);
                }}
                className="gap-1.5 text-xs h-8 bg-primary hover:bg-primary/90 text-primary-foreground font-bold shadow-xs"
              >
                <Plus className="size-3.5" />
                واحد سازمانی جدید
              </Button>
            )}

            {activeTab === "payroll" && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsNewPeriodOpen(true)}
                  className="gap-1.5 text-xs h-8"
                >
                  <Calendar className="size-3.5" />
                  دوره حقوق جدید
                </Button>

                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setIsBatchCalcOpen(true)}
                  className="gap-1.5 text-xs h-8 border-emerald-500/40 text-emerald-700 hover:bg-emerald-500/10 font-bold"
                >
                  <Sparkles className="size-3.5 text-amber-500" />
                  محاسبه دسته‌جمعی پرسنل
                </Button>

                <Button
                  size="sm"
                  onClick={() => setIsCalcSlipOpen(true)}
                  className="gap-1.5 text-xs h-8 bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
                >
                  <Plus className="size-3.5" />
                  محاسبه فیش تکی
                </Button>
              </>
            )}
          </div>
        }
      />

      {/* ۱. کارت‌های شاخص عملکرد (KPI Cards) با هاور مدرن و ریتم بصری دقیق */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* کل پرسنل شاغل */}
        <div className="kardo-card-interactive flex flex-col justify-between p-4.5 bg-gradient-to-br from-card via-card to-blue-500/5 border-border/80">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-muted-foreground">پرسنل شاغل و فعال</span>
            <div className="rounded-xl bg-blue-500/10 p-2.5 text-blue-600 ring-1 ring-blue-500/20 shadow-xs">
              <Users className="size-4.5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black tracking-tight text-foreground">
              {toFa(stats?.totalActiveEmployees ?? employees.length)}{" "}
              <span className="text-xs font-normal text-muted-foreground">نفر مستخدم</span>
            </div>
            <div className="mt-1.5 flex items-center justify-between text-[11px] text-muted-foreground pt-1.5 border-t border-border/40">
              <span>بیمه‌شدگان تأمین اجتماعی:</span>
              <span className="font-bold text-emerald-600 px-1.5 py-0.5 rounded bg-emerald-500/10">
                {toFa(stats?.insuredCount ?? 0)} نفر
              </span>
            </div>
          </div>
        </div>

        {/* احکام فعال کارگزینی */}
        <div className="kardo-card-interactive flex flex-col justify-between p-4.5 bg-gradient-to-br from-card via-card to-emerald-500/5 border-border/80">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-muted-foreground">احکام کارگزینی جاری</span>
            <div className="rounded-xl bg-emerald-500/10 p-2.5 text-emerald-600 ring-1 ring-emerald-500/20 shadow-xs">
              <FileCheck2 className="size-4.5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-emerald-600 tracking-tight">
              {toFa(stats?.totalActiveContracts ?? contracts.filter((c) => c.isActive).length)}{" "}
              <span className="text-xs font-normal text-muted-foreground">حکم معتبر</span>
            </div>
            <div className="mt-1.5 flex items-center justify-between text-[11px] text-muted-foreground pt-1.5 border-t border-border/40">
              <span>میانگین حقوق مندرج در حکم:</span>
              <strong className="font-mono text-foreground font-bold">
                {stats?.averageSalary ? money(stats.averageSalary) : "—"}
              </strong>
            </div>
          </div>
        </div>

        {/* کل بار مالی ماهانه حقوق */}
        <div className="kardo-card-interactive flex flex-col justify-between p-4.5 bg-gradient-to-br from-card via-card to-amber-500/5 border-border/80">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-muted-foreground">بار مالی ناخالص احکام ماهانه</span>
            <div className="rounded-xl bg-amber-500/10 p-2.5 text-amber-600 ring-1 ring-amber-500/20 shadow-xs">
              <Wallet className="size-4.5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-amber-600 dark:text-amber-400 tracking-tight font-mono">
              {stats?.totalMonthlyPayrollCost ? money(stats.totalMonthlyPayrollCost) : "—"}
            </div>
            <div className="mt-1.5 flex items-center justify-between text-[11px] text-muted-foreground pt-1.5 border-t border-border/40">
              <span>شامل:</span>
              <span>مزد پایه + بن + مسکن + سنوات + تخصص</span>
            </div>
          </div>
        </div>

        {/* خالص پرداختی دوره جاری */}
        <div className="kardo-card-interactive flex flex-col justify-between p-4.5 bg-gradient-to-br from-card via-card to-indigo-500/5 border-border/80">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-muted-foreground">خالص پرداختی دوره جاری</span>
            <div className="rounded-xl bg-indigo-500/10 p-2.5 text-indigo-600 ring-1 ring-indigo-500/20 shadow-xs">
              <Receipt className="size-4.5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-indigo-600 tracking-tight font-mono">
              {activePeriod ? money(activePeriod.totalNetPay) : "—"}
            </div>
            <div className="mt-1.5 flex items-center justify-between text-[11px] text-muted-foreground pt-1.5 border-t border-border/40">
              <span>دوره محاسباتی:</span>
              <strong className="text-foreground truncate max-w-[160px]">
                {activePeriod?.title || "انتخاب نشده"}
              </strong>
            </div>
          </div>
        </div>
      </div>

      {/* ۲. تب‌بار کپسولی مدرن (Modern Segmented Pill Bar) */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/70 pb-3">
        <div className="flex items-center gap-1.5 rounded-2xl bg-muted/60 p-1.5 border border-border/60 shadow-2xs">
          <button
            onClick={() => setActiveTab("employees")}
            className={cn(
              "kardo-pill-tab",
              activeTab === "employees"
                ? "bg-card text-foreground shadow-xs border-border"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            <Users className="size-3.5 text-blue-600" />
            پرونده جامع پرسنل
            <Badge variant="secondary" className="text-[10px] h-4.5 px-1.5 font-mono">
              {toFa(employees.length)}
            </Badge>
          </button>

          <button
            onClick={() => setActiveTab("decrees")}
            className={cn(
              "kardo-pill-tab",
              activeTab === "decrees"
                ? "bg-card text-foreground shadow-xs border-border"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            <FileCheck2 className="size-3.5 text-emerald-600" />
            احکام کارگزینی و قراردادها
            <Badge variant="secondary" className="text-[10px] h-4.5 px-1.5 font-mono">
              {toFa(contracts.length)}
            </Badge>
          </button>

          <button
            onClick={() => setActiveTab("departments")}
            className={cn(
              "kardo-pill-tab",
              activeTab === "departments"
                ? "bg-card text-foreground shadow-xs border-border"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            <Building2 className="size-3.5 text-indigo-600" />
            چارت و ساختار سازمانی
            <Badge variant="secondary" className="text-[10px] h-4.5 px-1.5 font-mono">
              {toFa(departments.length)}
            </Badge>
          </button>

          <button
            onClick={() => setActiveTab("payroll")}
            className={cn(
              "kardo-pill-tab",
              activeTab === "payroll"
                ? "bg-card text-foreground shadow-xs border-border"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            <FileSpreadsheet className="size-3.5 text-amber-600" />
            حقوق، دستمزد و فیش‌ها (قانون کار)
            {activePeriod && (
              <Badge variant="outline" className="text-[10px] h-4.5 px-1.5 bg-emerald-500/10 text-emerald-700 border-emerald-500/30">
                {activePeriod.month}/۱۴۰۴
              </Badge>
            )}
          </button>
        </div>

        {/* فیلترها و سرچ در هدر تب */}
        <div className="flex items-center gap-2">
          {(activeTab === "employees" || activeTab === "decrees") && (
            <div className="relative">
              <Search className="size-3.5 absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground/60" />
              <Input
                placeholder="جستجو در نام، کدملی، شماره حکم..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="h-8 w-56 pe-8 text-xs bg-background rounded-lg border-border/80"
              />
            </div>
          )}

          {activeTab === "employees" && (
            <select
              className="h-8 rounded-lg border border-input bg-card px-2.5 text-xs font-semibold text-foreground focus:outline-none focus:ring-1 focus:ring-primary shadow-2xs"
              value={departmentFilter}
              onChange={(e) => setDepartmentFilter(e.target.value)}
            >
              <option value="ALL">همه دپارتمان‌ها</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          )}

          {activeTab === "decrees" && (
            <select
              className="h-8 rounded-lg border border-input bg-card px-2.5 text-xs font-semibold text-foreground focus:outline-none focus:ring-1 focus:ring-primary shadow-2xs"
              value={decreeTypeFilter}
              onChange={(e) => setDecreeTypeFilter(e.target.value)}
            >
              <option value="ALL">همه انواع احکام</option>
              {Object.entries(DECREE_TYPE_LABELS).map(([k, v]) => (
                <option key={k} value={k}>
                  {v}
                </option>
              ))}
            </select>
          )}
        </div>
      </div>

      {/* ───────────────────────── TAB 1: پرونده جامع پرسنل ───────────────────────── */}
      {activeTab === "employees" && (
        <Card className="overflow-hidden border-border/80 shadow-xs">
          <div className="flex items-center justify-between border-b border-border/80 bg-muted/40 p-3.5">
            <div className="flex items-center gap-2">
              <Users className="size-4 text-primary" />
              <span className="text-xs font-bold text-foreground">فهرست پرونده‌های پرسنلی و اطلاعات استخدامی</span>
            </div>
            <div className="text-xs text-muted-foreground font-mono">
              تعداد پرونده‌های منطبق: {toFa(employees.length)} نفر
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead className="bg-muted/75 text-muted-foreground font-bold border-b border-border/80 select-none">
                <tr>
                  <th className="py-3 px-3.5">کد پرسنلی</th>
                  <th className="py-3 px-3.5">نام و نام خانوادگی</th>
                  <th className="py-3 px-3">کد ملی و شناسنامه</th>
                  <th className="py-3 px-3">شماره تماس و اضطراری</th>
                  <th className="py-3 px-3">واحد سازمانی و سمت</th>
                  <th className="py-3 px-3">شماره بیمه و شبا</th>
                  <th className="py-3 px-3 text-center">وضعیت تأهل و اولاد</th>
                  <th className="py-3 px-3 text-center">آخرین حکم کارگزینی</th>
                  <th className="py-3 px-3 text-center">عملیات پرونده</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50 font-medium">
                {employees.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-14 text-center text-muted-foreground">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <Users className="size-8 text-muted-foreground/40 stroke-1" />
                        <p className="text-xs">پرسنلی متناسب با فیلتر انتخابی یافت نشد.</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  employees.map((emp) => {
                    const activeContract = emp.contracts?.[0];
                    return (
                      <tr key={emp.id} className="hover:bg-primary/[0.03] transition-colors group">
                        <td className="py-3 px-3.5">
                          <span className="font-mono font-black text-primary text-xs bg-primary/10 px-2 py-0.5 rounded-md border border-primary/20">
                            {emp.personnelCode}
                          </span>
                        </td>

                        <td className="py-3 px-3.5">
                          <div className="flex flex-col gap-0.5">
                            <span className="font-bold text-foreground text-xs group-hover:text-primary transition-colors">
                              {emp.firstName} {emp.lastName}
                            </span>
                            <span className="text-[10px] text-muted-foreground">
                              {emp.gender === "FEMALE" ? "خانم" : "آقا"} | {emp.bloodType || "—"}
                            </span>
                          </div>
                        </td>

                        <td className="py-3 px-3 font-mono">
                          <div className="flex flex-col gap-0.5 text-xs">
                            <span className="font-bold text-foreground">{toFa(emp.nationalId)}</span>
                            {emp.birthCertificate && (
                              <span className="text-[10px] text-muted-foreground">
                                ش.ش: {toFa(emp.birthCertificate)}
                              </span>
                            )}
                          </div>
                        </td>

                        <td className="py-3 px-3 font-mono">
                          <div className="flex flex-col gap-0.5 text-xs">
                            <span className="font-bold text-foreground">{toFa(emp.mobile)}</span>
                            {emp.emergencyPhone && (
                              <span className="text-[10px] text-muted-foreground">
                                اضطراری: {toFa(emp.emergencyPhone)}
                              </span>
                            )}
                          </div>
                        </td>

                        <td className="py-3 px-3">
                          <div className="flex flex-col gap-1">
                            <span className="font-bold text-foreground text-xs">{emp.jobTitle}</span>
                            {emp.department ? (
                              <Badge variant="outline" className="text-[10px] h-4.5 px-2 bg-muted/60 w-fit">
                                {emp.department.name}
                              </Badge>
                            ) : (
                              <span className="text-[10px] text-muted-foreground">ستاد مرکزی</span>
                            )}
                          </div>
                        </td>

                        <td className="py-3 px-3 font-mono">
                          <div className="flex flex-col gap-0.5 text-xs">
                            {emp.insuranceNumber ? (
                              <span className="text-emerald-700 bg-emerald-500/10 px-1.5 py-0.5 rounded text-[10px] font-bold w-fit border border-emerald-500/20">
                                بیمه: {toFa(emp.insuranceNumber)}
                              </span>
                            ) : (
                              <span className="text-muted-foreground text-[10px]">فاقد بیمه</span>
                            )}
                            {emp.iban && (
                              <span className="text-[10px] text-muted-foreground truncate max-w-[140px]" title={emp.iban}>
                                {emp.iban}
                              </span>
                            )}
                          </div>
                        </td>

                        <td className="py-3 px-3 text-center">
                          <span className="text-xs font-semibold">
                            {emp.maritalStatus === "MARRIED" ? "متأهل" : "مجرد"}
                          </span>
                          {emp.childrenCount > 0 && (
                            <div className="text-[10px] text-muted-foreground font-mono">
                              {toFa(emp.childrenCount)} فرزند مشمول
                            </div>
                          )}
                        </td>

                        <td className="py-3 px-3 text-center">
                          {activeContract ? (
                            <div className="flex flex-col items-center gap-1">
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/30">
                                <span className="size-1.5 rounded-full bg-emerald-600 animate-pulse" />
                                {activeContract.decreeType ? DECREE_TYPE_LABELS[activeContract.decreeType] || "حکم جاری" : "حکم جاری"}
                              </span>
                              <span className="font-mono text-[10px] font-bold text-foreground">
                                {money(activeContract.baseDailySalary * 30)} ریال
                              </span>
                            </div>
                          ) : (
                            <Badge variant="outline" className="text-[10px] text-amber-600 border-amber-500/30">
                              فاقد حکم فعال
                            </Badge>
                          )}
                        </td>

                        <td className="py-3 px-3 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setEditingEmployee(emp);
                                setIsNewEmployeeOpen(true);
                              }}
                              className="h-7 text-[11px] px-2.5 gap-1 rounded-lg border-border hover:border-primary/50 shadow-2xs font-semibold"
                              title="ویرایش اطلاعات هویتی و پرونده"
                            >
                              <Pencil className="size-3" />
                              ویرایش
                            </Button>

                            <Button
                              size="sm"
                              onClick={() => {
                                setPreselectedEmployeeId(emp.id);
                                setEditingDecree(null);
                                setIsNewDecreeOpen(true);
                              }}
                              className="h-7 text-[11px] px-2.5 bg-emerald-600 hover:bg-emerald-700 text-white gap-1 rounded-lg shadow-2xs font-semibold"
                              title="صدور حکم کارگزینی جدید برای این پرسنل"
                            >
                              <FileCheck2 className="size-3" />
                              صدور حکم
                            </Button>

                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => {
                                if (confirm(`آیا از خاتمه خدمت پرسنل ${emp.firstName} ${emp.lastName} اطمینان دارید؟`)) {
                                  deleteEmpMutation.mutate(emp.id);
                                }
                              }}
                              className="size-7 text-muted-foreground hover:text-rose-600 rounded-lg hover:bg-rose-500/10"
                              title="خاتمه خدمت / تسویه حساب پرسنل"
                            >
                              <UserMinus className="size-3.5" />
                            </Button>
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
      )}

      {/* ───────────────────────── TAB 2: احکام کارگزینی و قراردادها ───────────────────────── */}
      {activeTab === "decrees" && (
        <Card className="overflow-hidden border-border/80 shadow-xs">
          <div className="flex items-center justify-between border-b border-border/80 bg-muted/40 p-3.5">
            <div className="flex items-center gap-2">
              <FileCheck2 className="size-4 text-emerald-600" />
              <span className="text-xs font-bold text-foreground">احکام کارگزینی رسمی مندرج در سوابق پرسنلی</span>
            </div>
            <div className="text-xs text-muted-foreground font-mono">
              تعداد احکام ثبت‌شده: {toFa(filteredContracts.length)} حکم
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead className="bg-muted/75 text-muted-foreground font-bold border-b border-border/80 select-none">
                <tr>
                  <th className="py-3 px-3.5">شماره حکم</th>
                  <th className="py-3 px-3.5">نوع و عنوان حکم</th>
                  <th className="py-3 px-3.5">مستخدم و کد پرسنلی</th>
                  <th className="py-3 px-3 text-center">تاریخ اجرا و صدور</th>
                  <th className="py-3 px-3 text-left">مزد پایه ماهانه</th>
                  <th className="py-3 px-3 text-left">مزایای مصوب (مسکن+بن)</th>
                  <th className="py-3 px-3 text-left">اولاد و تأهل</th>
                  <th className="py-3 px-3 text-left">ناخالص کل ماهانه</th>
                  <th className="py-3 px-3 text-center">وضعیت حکم</th>
                  <th className="py-3 px-3 text-center">عملیات و چاپ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50 font-medium">
                {filteredContracts.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="py-14 text-center text-muted-foreground">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <FileCheck2 className="size-8 text-muted-foreground/40 stroke-1" />
                        <p className="text-xs">هیچ حکم کارگزینی متناسب با این فیلتر ثبت نشده است.</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredContracts.map((cnt) => {
                    const emp = cnt.employee;
                    const childTotal =
                      emp && emp.childrenCount > 0 ? cnt.childAllowancePerChild * emp.childrenCount : 0;
                    const maritalTotal = emp?.maritalStatus === "MARRIED" ? cnt.maritalAllowance : 0;
                    const grossTotal =
                      cnt.baseMonthlySalary +
                      cnt.housingAllowance +
                      cnt.groceryAllowance +
                      childTotal +
                      maritalTotal +
                      (cnt.seniorityAllowance || 0) +
                      (cnt.responsibilityAllowance || 0) +
                      cnt.specialAllowance;

                    return (
                      <tr key={cnt.id} className="hover:bg-primary/[0.03] transition-colors group">
                        <td className="py-3 px-3.5">
                          <span className="font-mono font-bold text-emerald-700 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20 text-xs">
                            {cnt.contractNumber}
                          </span>
                        </td>

                        <td className="py-3 px-3.5">
                          <div className="flex flex-col gap-0.5">
                            <span className="font-bold text-foreground text-xs group-hover:text-primary transition-colors">
                              {cnt.decreeTitle || DECREE_TYPE_LABELS[cnt.decreeType || "INITIAL"] || "حکم کارگزینی"}
                            </span>
                            <Badge variant="outline" className="text-[9px] h-4 px-1.5 bg-muted/60 w-fit">
                              {DECREE_TYPE_LABELS[cnt.decreeType || "INITIAL"] || "استخدام"}
                            </Badge>
                          </div>
                        </td>

                        <td className="py-3 px-3.5">
                          <div className="flex flex-col gap-0.5">
                            <span className="font-bold text-foreground text-xs">
                              {emp ? `${emp.firstName} ${emp.lastName}` : "—"}
                            </span>
                            <span className="font-mono text-[10px] text-muted-foreground">
                              {emp?.personnelCode} | {emp?.jobTitle}
                            </span>
                          </div>
                        </td>

                        <td className="py-3 px-3 text-center font-mono">
                          <div className="flex flex-col gap-0.5 text-xs">
                            <span className="font-bold text-foreground">{faDate(cnt.startDate)}</span>
                            {cnt.endDate && (
                              <span className="text-[10px] text-muted-foreground">تا {faDate(cnt.endDate)}</span>
                            )}
                          </div>
                        </td>

                        <td className="py-3 px-3 text-left font-mono font-bold text-foreground">
                          {money(cnt.baseMonthlySalary)}
                        </td>

                        <td className="py-3 px-3 text-left font-mono text-muted-foreground">
                          {money(cnt.housingAllowance + cnt.groceryAllowance)}
                        </td>

                        <td className="py-3 px-3 text-left font-mono text-muted-foreground">
                          {money(childTotal + maritalTotal)}
                        </td>

                        <td className="py-3 px-3 text-left font-mono font-black text-emerald-700 dark:text-emerald-300 text-xs">
                          {money(grossTotal)}
                        </td>

                        <td className="py-3 px-3 text-center">
                          {cnt.isActive ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-700 border border-emerald-500/30">
                              <span className="size-1.5 rounded-full bg-emerald-600 animate-pulse" />
                              حکم جاری فعال
                            </span>
                          ) : (
                            <Badge variant="outline" className="text-[10px] text-muted-foreground">
                              منقضی / قبلی
                            </Badge>
                          )}
                        </td>

                        <td className="py-3 px-3 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <Button
                              size="sm"
                              onClick={() => setPrintDecree(cnt)}
                              className="h-7 text-[11px] px-2.5 bg-primary hover:bg-primary/90 text-primary-foreground gap-1 rounded-lg shadow-2xs font-bold"
                              title="چاپ برگ رسمی حکم کارگزینی A4"
                            >
                              <Printer className="size-3" />
                              برگ حکم (A4)
                            </Button>

                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setEditingDecree(cnt);
                                setIsNewDecreeOpen(true);
                              }}
                              className="h-7 text-[11px] px-2 gap-1 rounded-lg border-border hover:border-primary/50 shadow-2xs"
                              title="ویرایش حکم"
                            >
                              <Pencil className="size-3" />
                            </Button>

                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => {
                                if (confirm(`آیا از حذف حکم ${cnt.contractNumber} اطمینان دارید؟`)) {
                                  deleteContractMutation.mutate(cnt.id);
                                }
                              }}
                              className="size-7 text-muted-foreground hover:text-rose-600 rounded-lg hover:bg-rose-500/10"
                              title="حذف حکم"
                            >
                              <Trash2 className="size-3.5" />
                            </Button>
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
      )}

      {/* ───────────────────────── TAB 3: چارت و واحدهای سازمانی ───────────────────────── */}
      {activeTab === "departments" && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {departments.map((dep) => (
            <div key={dep.id} className="kardo-card-interactive p-5 flex flex-col justify-between">
              <div>
                <div className="flex items-start justify-between">
                  <Badge variant="outline" className="font-mono text-xs border-primary/30 text-primary font-bold">
                    {dep.code}
                  </Badge>
                  <div className="rounded-xl bg-primary/10 p-2 text-primary shadow-2xs">
                    <Building2 className="size-5" />
                  </div>
                </div>
                <h3 className="mt-2.5 text-base font-black text-foreground">{dep.name}</h3>
                <p className="mt-1.5 text-xs text-muted-foreground leading-relaxed line-clamp-2">
                  {dep.description || "بدون شرح وظایف تعریف‌شده"}
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-border/60 flex items-center justify-between text-xs">
                <span className="text-muted-foreground">مدیر واحد: <strong className="text-foreground">{dep.managerName || "تعیین‌نشده"}</strong></span>
                <span className="font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full font-mono">
                  {toFa(dep._count?.employees || 0)} نفر مستخدم
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ───────────────────────── TAB 4: حقوق، دستمزد و فیش‌ها ───────────────────────── */}
      {activeTab === "payroll" && (
        <div className="flex flex-col gap-5">
          {/* انتخابگر دوره محاسباتی با اطلاعات تجمیعی */}
          <div className="flex flex-wrap items-center justify-between rounded-2xl border border-border/80 bg-card p-4 shadow-2xs gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-amber-500/10 text-amber-600 shadow-2xs">
                <Calendar className="size-5" />
              </div>
              <div>
                <span className="text-xs font-bold text-muted-foreground block">دوره حقوق و دستمزد محاسباتی:</span>
                <select
                  className="mt-1 h-8.5 rounded-lg border border-input bg-background px-3 text-xs font-bold text-foreground focus:outline-none focus:ring-1 focus:ring-primary shadow-2xs"
                  value={selectedPeriodId || ""}
                  onChange={(e) => setSelectedPeriodId(e.target.value)}
                >
                  {periods.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.title} ({toFa(p.slipsCount)} فیش حقوقی)
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {activePeriod && (
              <div className="flex flex-wrap items-center gap-4 text-xs font-mono">
                <div className="p-2 rounded-lg bg-muted/60 border border-border/60">
                  <span className="text-[10px] text-muted-foreground font-sans block">جمع ناخالص کل:</span>
                  <strong className="text-foreground text-xs">{money(activePeriod.totalGrossPay)}</strong>
                </div>
                <div className="p-2 rounded-lg bg-muted/60 border border-border/60">
                  <span className="text-[10px] text-muted-foreground font-sans block">بیمه کارفرما (۲۳٪):</span>
                  <strong className="text-blue-600 text-xs">{money(activePeriod.totalEmployerInsurance)}</strong>
                </div>
                <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/30">
                  <span className="text-[10px] text-emerald-800 dark:text-emerald-300 font-sans block font-bold">خالص کل پرداختی:</span>
                  <strong className="text-emerald-700 dark:text-emerald-300 text-sm font-black">{money(activePeriod.totalNetPay)}</strong>
                </div>
              </div>
            )}
          </div>

          {/* جدول فیش‌های حقوقی */}
          <Card className="overflow-hidden border-border/80 shadow-xs">
            <div className="flex items-center justify-between border-b border-border/80 bg-muted/40 p-3.5">
              <div className="flex items-center gap-2">
                <Receipt className="size-4 text-primary" />
                <span className="text-xs font-bold text-foreground">فیش‌های حقوقی صادرشده برای دوره جاری</span>
              </div>
              <div className="text-xs text-muted-foreground font-mono">
                تعداد فیش‌های محاسبه‌شده: {toFa(slips.length)} فیش
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead className="bg-muted/75 text-muted-foreground font-bold border-b border-border/80 select-none">
                  <tr>
                    <th className="py-3 px-3.5">کد</th>
                    <th className="py-3 px-3.5">نام کارمند</th>
                    <th className="py-3 px-3 text-center">کارکرد (روز)</th>
                    <th className="py-3 px-3 text-center">اضافه‌کار</th>
                    <th className="py-3 px-3 text-left">حقوق پایه کارکرد</th>
                    <th className="py-3 px-3 text-left">بن و مسکن</th>
                    <th className="py-3 px-3 text-left">اولاد و تأهل</th>
                    <th className="py-3 px-3 text-left font-black">مجموع ناخالص</th>
                    <th className="py-3 px-3 text-left text-rose-600">بیمه ۷٪</th>
                    <th className="py-3 px-3 text-left text-rose-600">مالیات</th>
                    <th className="py-3 px-3 text-left text-emerald-600 font-black">خالص پرداختی</th>
                    <th className="py-3 px-3 text-left text-blue-600">بیمه کارفرما ۲۳٪</th>
                    <th className="py-3 px-3 text-center">عملیات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50 font-medium">
                  {slips.length === 0 ? (
                    <tr>
                      <td colSpan={13} className="py-14 text-center text-muted-foreground">
                        <div className="flex flex-col items-center justify-center gap-2">
                          <Receipt className="size-8 text-muted-foreground/40 stroke-1" />
                          <p className="text-xs">هنوز فیش حقوقی برای این دوره صادر نشده است. روی «محاسبه دسته‌جمعی پرسنل» کلیک کنید.</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    slips.map((slip) => (
                      <tr key={slip.id} className="hover:bg-primary/[0.03] transition-colors group">
                        <td className="py-3 px-3.5 font-mono font-bold text-primary">
                          {slip.employee.personnelCode}
                        </td>
                        <td className="py-3 px-3.5 font-bold text-foreground">
                          {slip.employee.firstName} {slip.employee.lastName}
                        </td>
                        <td className="py-3 px-3 text-center font-mono">
                          {toFa(slip.workingDays)}
                        </td>
                        <td className="py-3 px-3 text-center font-mono">
                          {toFa(slip.overtimeHours)} ساعت
                        </td>
                        <td className="py-3 px-3 text-left font-mono">
                          {money(slip.baseSalaryEarned)}
                        </td>
                        <td className="py-3 px-3 text-left font-mono text-muted-foreground">
                          {money(slip.housingAllowance + slip.groceryAllowance)}
                        </td>
                        <td className="py-3 px-3 text-left font-mono text-muted-foreground">
                          {money(slip.childAllowance + slip.maritalAllowance)}
                        </td>
                        <td className="py-3 px-3 text-left font-mono font-bold text-foreground">
                          {money(slip.totalGrossSalary)}
                        </td>
                        <td className="py-3 px-3 text-left font-mono text-rose-600 font-bold">
                          {money(slip.workerInsurance)}
                        </td>
                        <td className="py-3 px-3 text-left font-mono text-rose-600">
                          {money(slip.incomeTax)}
                        </td>
                        <td className="py-3 px-3 text-left font-mono font-black text-emerald-700 dark:text-emerald-300 text-xs">
                          {money(slip.netPayable)}
                        </td>
                        <td className="py-3 px-3 text-left font-mono text-blue-600">
                          {money(slip.employerInsurance)}
                        </td>
                        <td className="py-3 px-3 text-center">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setPrintSlip(slip)}
                            className="h-7 text-[11px] px-2.5 gap-1 rounded-lg border-border hover:border-primary/50 shadow-2xs font-semibold"
                            title="چاپ فیش حقوقی رسمی پرسنل"
                          >
                            <Printer className="size-3" />
                            چاپ فیش
                          </Button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {/* ───────────────────────── DIALOGS ───────────────────────── */}

      {/* ۱. مودال ثبت/ویرایش پرسنل */}
      <EmployeeDialog
        open={isNewEmployeeOpen}
        onOpenChange={setIsNewEmployeeOpen}
        departments={departments}
        editEmployee={editingEmployee}
      />

      {/* ۲. مودال ثبت/ویرایش حکم کارگزینی */}
      <DecreeDialog
        open={isNewDecreeOpen}
        onOpenChange={setIsNewDecreeOpen}
        employees={employees}
        preselectedEmployeeId={preselectedEmployeeId}
        editDecree={editingDecree}
      />

      {/* ۳. مودال چاپ رسمی حکم کارگزینی A4 */}
      <DecreePrintDialog
        decree={printDecree}
        open={!!printDecree}
        onOpenChange={(op) => !op && setPrintDecree(null)}
      />

      {/* ۴. مودال چاپ فیش حقوقی رسمی */}
      <PayslipPrintDialog
        slip={printSlip}
        open={!!printSlip}
        onOpenChange={(op) => !op && setPrintSlip(null)}
      />

      {/* ۵. مودال محاسبه دسته‌جمعی پرسنل در دوره جاری */}
      <Dialog open={isBatchCalcOpen} onOpenChange={setIsBatchCalcOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="size-5 text-amber-500" />
              محاسبه خودکار و دسته‌جمعی حقوق کلیه پرسنل
            </DialogTitle>
            <DialogDescription className="text-xs">
              سامانه برای کلیه پرسنل فعال دارای حکم کارگزینی در دوره «{activePeriod?.title}»، فیش حقوقی قانون کار را با کارکرد ۳۰ روز محاسبه خواهد کرد.
            </DialogDescription>
          </DialogHeader>
          <div className="p-3 bg-muted/40 rounded-xl border border-border/60 text-xs leading-relaxed">
            <span className="font-bold text-foreground block mb-1">شامل محاسبات:</span>
            <ul className="list-disc list-inside text-muted-foreground flex flex-col gap-1">
              <li>دستمزد پایه، حق مسکن، بن خواربار و حق تاهل</li>
              <li>حق اولاد به تفکیک تعداد فرزندان هر پرسنل</li>
              <li>کسر ۷٪ حق بیمه تأمین اجتماعی سهم کارمند</li>
              <li>محاسبه ۲۳٪ سهم بیمه کارفرما و مالیات ماده ۸۴</li>
            </ul>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" size="sm" onClick={() => setIsBatchCalcOpen(false)}>
              انصراف
            </Button>
            <Button
              size="sm"
              onClick={() => batchCalcMutation.mutate()}
              disabled={batchCalcMutation.isPending}
              className="gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
            >
              <CheckCircle2 className="size-3.5" />
              {batchCalcMutation.isPending ? "در حال محاسبه..." : "تأیید و صدور فیش‌های دوره"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ۶. مودال ایجاد دوره جدید */}
      <Dialog open={isNewPeriodOpen} onOpenChange={setIsNewPeriodOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>ایجاد دوره حقوق و دستمزد</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-3 text-xs">
            <div>
              <label className="font-semibold block mb-1">سال:</label>
              <Input
                type="number"
                value={periodForm.year}
                onChange={(e) => setPeriodForm({ ...periodForm, year: Number(e.target.value) || 1404 })}
                className="h-8.5 font-mono"
              />
            </div>
            <div>
              <label className="font-semibold block mb-1">ماه:</label>
              <select
                className="h-8.5 w-full rounded-lg border border-input bg-card px-2.5 text-xs font-semibold"
                value={periodForm.month}
                onChange={(e) => {
                  const m = Number(e.target.value);
                  const monthNames = [
                    "فروردین", "اردیبهشت", "خرداد", "تیر", "مرداد", "شهریور",
                    "مهر", "آبان", "آذر", "دی", "بهمن", "اسفند",
                  ];
                  setPeriodForm({
                    ...periodForm,
                    month: m,
                    title: `حقوق و دستمزد ${monthNames[m - 1]} ${periodForm.year}`,
                  });
                }}
              >
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((m) => (
                  <option key={m} value={m}>
                    ماه {m}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="font-semibold block mb-1">عنوان دوره:</label>
              <Input
                value={periodForm.title}
                onChange={(e) => setPeriodForm({ ...periodForm, title: e.target.value })}
                className="h-8.5 font-bold"
              />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" size="sm" onClick={() => setIsNewPeriodOpen(false)}>
              انصراف
            </Button>
            <Button
              size="sm"
              onClick={() => createPeriodMutation.mutate()}
              disabled={createPeriodMutation.isPending}
              className="bg-primary text-primary-foreground font-bold"
            >
              ایجاد دوره
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ۷. مودال ایجاد واحد سازمانی */}
      <Dialog open={isNewDepartmentOpen} onOpenChange={setIsNewDepartmentOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>تعریف واحد سازمانی جدید</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-3 text-xs">
            <div>
              <label className="font-semibold block mb-1">نام واحد سازمانی *</label>
              <Input
                placeholder="مثلاً واحد مونتاژ و نجاری"
                value={depForm.name}
                onChange={(e) => setDepForm({ ...depForm, name: e.target.value })}
                className="h-8.5"
              />
            </div>
            <div>
              <label className="font-semibold block mb-1">کد واحد سازمانی *</label>
              <Input
                placeholder="DEP-WOOD"
                value={depForm.code}
                onChange={(e) => setDepForm({ ...depForm, code: e.target.value })}
                className="h-8.5 font-mono"
              />
            </div>
            <div>
              <label className="font-semibold block mb-1">مدیر یا سرپرست واحد</label>
              <Input
                placeholder="نام مدیر..."
                value={depForm.managerName}
                onChange={(e) => setDepForm({ ...depForm, managerName: e.target.value })}
                className="h-8.5"
              />
            </div>
            <div>
              <label className="font-semibold block mb-1">شرح وظایف</label>
              <Input
                placeholder="توضیحات اختیاری..."
                value={depForm.description}
                onChange={(e) => setDepForm({ ...depForm, description: e.target.value })}
                className="h-8.5"
              />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" size="sm" onClick={() => setIsNewDepartmentOpen(false)}>
              انصراف
            </Button>
            <Button
              size="sm"
              onClick={() => createDepMutation.mutate()}
              disabled={createDepMutation.isPending || !depForm.name || !depForm.code}
              className="bg-primary text-primary-foreground font-bold"
            >
              ثبت واحد
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ۸. مودال محاسبه فیش تکی */}
      <Dialog open={isCalcSlipOpen} onOpenChange={setIsCalcSlipOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>محاسبه فیش حقوقی پرسنل</DialogTitle>
            <DialogDescription className="text-xs">
              کارکرد ماهانه و ساعات اضافه کاری را جهت صدور فیش وارد کنید.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-3 text-xs">
            <div>
              <label className="font-bold block mb-1">انتخاب پرسنل *</label>
              <select
                className="h-8.5 w-full rounded-lg border border-input bg-card px-2.5 text-xs font-semibold"
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
              <div>
                <label className="font-semibold block mb-1">روزهای کارکرد (استاندارد ۳۰):</label>
                <Input
                  type="number"
                  value={slipForm.workingDays}
                  onChange={(e) => setSlipForm({ ...slipForm, workingDays: Number(e.target.value) || 0 })}
                  className="h-8.5 font-mono"
                />
              </div>
              <div>
                <label className="font-semibold block mb-1">ساعات اضافه‌کاری:</label>
                <Input
                  type="number"
                  value={slipForm.overtimeHours}
                  onChange={(e) => setSlipForm({ ...slipForm, overtimeHours: Number(e.target.value) || 0 })}
                  className="h-8.5 font-mono"
                />
              </div>
              <div>
                <label className="font-semibold block mb-1">کسر وام و مساعده (ریال):</label>
                <Input
                  type="number"
                  value={slipForm.loanDeductions}
                  onChange={(e) => setSlipForm({ ...slipForm, loanDeductions: Number(e.target.value) || 0 })}
                  className="h-8.5 font-mono"
                />
              </div>
              <div>
                <label className="font-semibold block mb-1">سایر کسورات (ریال):</label>
                <Input
                  type="number"
                  value={slipForm.otherDeductions}
                  onChange={(e) => setSlipForm({ ...slipForm, otherDeductions: Number(e.target.value) || 0 })}
                  className="h-8.5 font-mono"
                />
              </div>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" size="sm" onClick={() => setIsCalcSlipOpen(false)}>
              انصراف
            </Button>
            <Button
              size="sm"
              onClick={() => calcSlipMutation.mutate()}
              disabled={calcSlipMutation.isPending || !selectedEmployeeForSlip}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
            >
              محاسبه و صدور فیش
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
