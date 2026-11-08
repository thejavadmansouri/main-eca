"use client";

import * as React from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  ArrowRight,
  Award,
  Building2,
  Calendar,
  Check,
  CheckCircle2,
  Clock,
  Copy,
  CreditCard,
  Download,
  Edit,
  ExternalLink,
  FileCheck2,
  FileText,
  HeartPulse,
  KeyRound,
  Layers,
  MapPin,
  Pencil,
  Phone,
  Printer,
  Receipt,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  User,
  UserCheck,
  Users,
  Wallet,
  XCircle,
} from "lucide-react";
import {
  getEmployeeById,
  getDepartments,
  getPayrollPeriods,
  calculatePayrollSlip,
  deleteContract,
  createUser,
} from "@/lib/api";
import type {
  EmployeeRow,
  EmployeeContractRow,
  PayrollSlipRow,
  PayrollPeriodRow,
} from "@/lib/types";
import { money, toFa, faDate, ROLE_LABELS } from "@/lib/format";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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

import { EmployeeDialog } from "../../employee-dialog";
import { DecreeDialog } from "../../decree-dialog";
import { DecreePrintDialog } from "../../decree-print-dialog";
import { PayslipPrintDialog } from "../../payslip-print-dialog";

const DECREE_TYPE_LABELS: Record<string, string> = {
  INITIAL: "استخدام اولیه",
  ANNUAL_INCREASE: "افزایش سالانه شورای عالی کار",
  PROMOTION: "ارتقای رتبه و ترفیع شغلی",
  TITLE_CHANGE: "تغییر شغل و سمت سازمانی",
  TRANSFER: "انتقال بین‌واحدی",
  RENEWAL: "تمدید قرارداد کار",
  TERMINATION: "خاتمه خدمت و قطع همکاری",
};

const TASK_STATUS_LABELS: Record<string, { label: string; color: string }> = {
  PENDING: { label: "در انتظار شروع", color: "bg-amber-500/10 text-amber-700 border-amber-500/30" },
  IN_PROGRESS: { label: "در حال انجام", color: "bg-sky-500/10 text-sky-700 border-sky-500/30" },
  COMPLETED: { label: "تکمیل شده", color: "bg-emerald-500/10 text-emerald-700 border-emerald-500/30" },
  CANCELLED: { label: "لغو شده", color: "bg-rose-500/10 text-rose-700 border-rose-500/30" },
};

function formatServiceDuration(hireDateStr: string, termDateStr?: string | null): string {
  try {
    const start = new Date(hireDateStr);
    const end = termDateStr ? new Date(termDateStr) : new Date();
    if (isNaN(start.getTime())) return "—";

    let diffMonths = (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth());
    if (diffMonths < 0) diffMonths = 0;

    const years = Math.floor(diffMonths / 12);
    const months = diffMonths % 12;

    if (years === 0 && months === 0) return "کمتر از یک ماه";
    if (years === 0) return `${toFa(months)} ماه`;
    if (months === 0) return `${toFa(years)} سال تمام`;
    return `${toFa(years)} سال و ${toFa(months)} ماه`;
  } catch {
    return "—";
  }
}

export default function EmployeeProfilePage() {
  const params = useParams();
  const router = useRouter();
  const id = String(params?.id || "");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = React.useState<"overview" | "decrees" | "payroll" | "tasks">("overview");
  const [copiedIban, setCopiedIban] = React.useState(false);
  const [copiedCode, setCopiedCode] = React.useState(false);

  // Modals state
  const [isEditEmployeeOpen, setIsEditEmployeeOpen] = React.useState(false);
  const [isNewDecreeOpen, setIsNewDecreeOpen] = React.useState(false);
  const [editingDecree, setEditingDecree] = React.useState<EmployeeContractRow | null>(null);
  const [selectedPrintDecree, setSelectedPrintDecree] = React.useState<EmployeeContractRow | null>(null);
  const [selectedPrintSlip, setSelectedPrintSlip] = React.useState<PayrollSlipRow | null>(null);
  const [isCalculateModalOpen, setIsCalculateModalOpen] = React.useState(false);

  // New slip calculation state
  const [calcPeriodId, setCalcPeriodId] = React.useState("");
  const [calcWorkingDays, setCalcWorkingDays] = React.useState(30);
  const [calcOvertimeHours, setCalcOvertimeHours] = React.useState(0);
  const [calcDelayHours, setCalcDelayHours] = React.useState(0);
  const [calcLeaveDays, setCalcLeaveDays] = React.useState(0);
  const [calcAbsenceDays, setCalcAbsenceDays] = React.useState(0);
  const [calcLoanDeductions, setCalcLoanDeductions] = React.useState(0);
  const [calcOtherDeductions, setCalcOtherDeductions] = React.useState(0);

  // Fetch employee details
  const {
    data: employee,
    isLoading,
    isError,
    refetch,
  } = useQuery<EmployeeRow>({
    queryKey: ["employee", id],
    queryFn: () => getEmployeeById(id),
    enabled: Boolean(id),
  });

  // Fetch auxiliary data
  const { data: departments = [] } = useQuery({
    queryKey: ["departments"],
    queryFn: getDepartments,
  });

  const { data: periods = [] } = useQuery<PayrollPeriodRow[]>({
    queryKey: ["payroll-periods"],
    queryFn: getPayrollPeriods,
  });

  // Set default period when loaded
  React.useEffect(() => {
    if (periods.length > 0 && !calcPeriodId) {
      const activePeriod = periods.find((p) => p.status !== "FINALIZED" && p.status !== "PAID") || periods[0];
      setCalcPeriodId(activePeriod.id);
    }
  }, [periods, calcPeriodId]);

  // Slip calculation mutation
  const calculateMutation = useMutation({
    mutationFn: calculatePayrollSlip,
    onSuccess: (slip) => {
      queryClient.invalidateQueries({ queryKey: ["employee", id] });
      queryClient.invalidateQueries({ queryKey: ["payroll-slips"] });
      queryClient.invalidateQueries({ queryKey: ["hr-stats"] });
      setIsCalculateModalOpen(false);
      toast({
        title: "فیش حقوقی با موفقیت محاسبه و ثبت شد",
        description: `خالص پرداختی: ${money(slip.netPayable)} ریال`,
      });
      // Offer immediate print
      setSelectedPrintSlip({ ...slip, employee: employee as EmployeeRow });
    },
    onError: (err: any) => {
      toast({
        title: "خطا در محاسبه فیش حقوقی",
        description: err?.message || "مشکلی در ذخیره فیش حقوق رخ داده است.",
        variant: "destructive",
      });
    },
  });

  // Delete/Terminate Contract mutation
  const deleteDecreeMutation = useMutation({
    mutationFn: deleteContract,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employee", id] });
      queryClient.invalidateQueries({ queryKey: ["contracts"] });
      queryClient.invalidateQueries({ queryKey: ["hr-stats"] });
      toast({ title: "حکم کارگزینی حذف شد" });
    },
  });

  // State ساخت حساب کاربری سامانه برای این پرسنل
  const [isCreateUserOpen, setIsCreateUserOpen] = React.useState(false);
  const [userForm, setUserForm] = React.useState({
    username: "",
    password: "",
    role: "STAFF" as any,
  });

  React.useEffect(() => {
    if (employee) {
      setUserForm({
        username: `${employee.personnelCode}`,
        password: "",
        role: "STAFF",
      });
    }
  }, [employee]);

  const createUserMut = useMutation({
    mutationFn: () =>
      createUser({
        fullName: `${employee?.firstName} ${employee?.lastName}`,
        username: userForm.username.trim(),
        password: userForm.password.trim(),
        role: userForm.role,
        employeeId: employee?.id,
        isActive: true,
      }),
    onSuccess: () => {
      toast({ title: "حساب کاربری سامانه با موفقیت ایجاد و متصل شد" });
      queryClient.invalidateQueries({ queryKey: ["employee", id] });
      queryClient.invalidateQueries({ queryKey: ["users"] });
      setIsCreateUserOpen(false);
    },
    onError: (err: any) => {
      toast({
        title: "خطا در ایجاد حساب کاربری",
        description: err?.message || "مشکلی در ساخت حساب رخ داد.",
        variant: "destructive",
      });
    },
  });

  const handleCopyIban = () => {
    if (!employee?.iban) return;
    navigator.clipboard.writeText(employee.iban);
    setCopiedIban(true);
    setTimeout(() => setCopiedIban(false), 2000);
    toast({ title: "شماره شبا در حافظه کپی شد" });
  };

  const handleCopyCode = () => {
    if (!employee?.personnelCode) return;
    navigator.clipboard.writeText(employee.personnelCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
    toast({ title: "کد پرسنلی کپی شد" });
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-3">
        <div className="size-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
        <span className="text-xs text-muted-foreground font-medium">در حال بارگذاری اطلاعات پرونده پرسنلی...</span>
      </div>
    );
  }

  if (isError || !employee) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
        <ShieldAlert className="size-12 text-rose-500" />
        <h2 className="text-lg font-bold">پرونده پرسنلی مورد نظر یافت نشد</h2>
        <p className="text-xs text-muted-foreground">ممکن است پرسنل حذف شده باشد یا شناسه نامعتبر باشد.</p>
        <Link href="/admin/hr">
          <Button variant="outline" size="sm" className="gap-2">
            <ArrowRight className="size-4" />
            بازگشت به فهرست پرسنل
          </Button>
        </Link>
      </div>
    );
  }

  const contracts = employee.contracts || [];
  const activeContract = contracts.find((c) => c.isActive) || contracts[0];
  const payrollSlips = employee.payrollSlips || [];

  // Active Contract calculations
  const activeMonthlySalary = activeContract ? activeContract.baseDailySalary * 30 : 0;
  const activeHousing = activeContract?.housingAllowance || 0;
  const activeGrocery = activeContract?.groceryAllowance || 0;
  const activeMarital = activeContract?.maritalAllowance || 0;
  const activeSeniority = activeContract?.seniorityAllowance || 0;
  const activeResponsibility = activeContract?.responsibilityAllowance || 0;
  const activeSpecial = activeContract?.specialAllowance || 0;
  const activeChild =
    activeContract && employee.childrenCount > 0
      ? activeContract.childAllowancePerChild * employee.childrenCount
      : 0;
  const activeGrossTotal =
    activeMonthlySalary +
    activeHousing +
    activeGrocery +
    activeMarital +
    activeSeniority +
    activeResponsibility +
    activeSpecial +
    activeChild;

  // Last payslip
  const latestSlip = payrollSlips[0];

  return (
    <div className="space-y-6 pb-12 font-sans">
      {/* ───────────────────────── هدر ناوبری و دکمه بازگشت ───────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/60 pb-3 no-print">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Link
            href="/admin/hr"
            className="inline-flex items-center gap-1.5 font-bold text-foreground hover:text-primary transition-colors bg-muted/60 hover:bg-muted px-2.5 py-1 rounded-lg border border-border/60"
          >
            <ArrowRight className="size-3.5" />
            <span>بازگشت به فهرست پرسنل</span>
          </Link>
          <span className="text-muted-foreground/40">/</span>
          <span>پروفایل جامع پرسنل</span>
          <span className="text-muted-foreground/40">/</span>
          <span className="font-bold text-foreground font-mono">
            {employee.firstName} {employee.lastName}
          </span>
        </div>

        {/* دکمه‌های اقدام سریع در هدر */}
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.print()}
            className="h-8 text-xs gap-1.5 font-semibold shadow-2xs"
          >
            <Printer className="size-3.5" />
            چاپ پرونده
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsEditEmployeeOpen(true)}
            className="h-8 text-xs gap-1.5 font-semibold shadow-2xs border-primary/30 text-primary hover:bg-primary/10"
          >
            <Pencil className="size-3.5" />
            ویرایش مشخصات
          </Button>

          {!employee.user && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => setIsCreateUserOpen(true)}
              className="h-8 text-xs gap-1.5 border-indigo-500 text-indigo-700 hover:bg-indigo-50 font-bold shadow-2xs"
            >
              <KeyRound className="size-3.5" />
              ساخت حساب کاربری سیستم
            </Button>
          )}

          <Button
            size="sm"
            onClick={() => {
              setEditingDecree(null);
              setIsNewDecreeOpen(true);
            }}
            className="h-8 text-xs gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold shadow-xs"
          >
            <FileCheck2 className="size-3.5" />
            صدور حکم کارگزینی
          </Button>

          <Button
            size="sm"
            onClick={() => setIsCalculateModalOpen(true)}
            className="h-8 text-xs gap-1.5 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold shadow-xs"
          >
            <Receipt className="size-3.5" />
            محاسبه فیش جدید
          </Button>
        </div>
      </div>

      {/* ───────────────────────── بنر هویت و شناسه پرسنل (Hero Profile Banner) ───────────────────────── */}
      <div className="relative overflow-hidden rounded-2xl border border-border/80 bg-gradient-to-br from-card via-card to-primary/[0.04] p-6 shadow-sm">
        <div className="absolute top-0 right-0 h-1.5 w-full bg-gradient-to-r from-primary via-emerald-500 to-sky-500" />

        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-start sm:items-center gap-4">
            {/* تصویر/آواتار پرسنل */}
            <div className="relative size-20 sm:size-24 rounded-2xl bg-gradient-to-br from-primary/20 via-primary/10 to-muted flex items-center justify-center border-2 border-primary/30 shadow-md flex-shrink-0">
              <span className="text-2xl sm:text-3xl font-black text-primary tracking-wider">
                {employee.firstName.charAt(0)}
                {employee.lastName.charAt(0)}
              </span>
              <span
                className={cn(
                  "absolute -bottom-1 -right-1 size-5 rounded-full border-2 border-card flex items-center justify-center",
                  employee.isActive ? "bg-emerald-500" : "bg-rose-500"
                )}
                title={employee.isActive ? "مشغول به کار" : "خاتمه همکاری"}
              >
                {employee.isActive ? (
                  <Check className="size-3 text-white stroke-[3]" />
                ) : (
                  <XCircle className="size-3 text-white" />
                )}
              </span>
            </div>

            {/* عنوان، نام، کد پرسنلی و اطلاعات سازمانی */}
            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-black text-foreground tracking-tight">
                  {employee.firstName} {employee.lastName}
                </h1>
                <Badge
                  variant="outline"
                  className="font-mono text-xs font-black bg-primary/10 text-primary border-primary/30 px-2 py-0.5 cursor-pointer hover:bg-primary/20"
                  onClick={handleCopyCode}
                  title="کلیک برای کپی کد پرسنلی"
                >
                  {copiedCode ? <Check className="size-3 ml-1" /> : <Copy className="size-3 ml-1" />}
                  {employee.personnelCode}
                </Badge>
                <Badge
                  variant={employee.isActive ? "default" : "secondary"}
                  className={cn(
                    "text-[11px] font-bold px-2.5 py-0.5",
                    employee.isActive
                      ? "bg-emerald-500/10 text-emerald-700 hover:bg-emerald-500/20 border-emerald-500/30"
                      : "bg-rose-500/10 text-rose-700 hover:bg-rose-500/20 border-rose-500/30"
                  )}
                >
                  {employee.isActive ? "مشغول به کار (فعال)" : "پایان خدمت (غیرفعال)"}
                </Badge>
              </div>

              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                <div className="flex items-center gap-1 font-semibold text-foreground">
                  <UserCheck className="size-3.5 text-primary" />
                  <span>{employee.jobTitle}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Building2 className="size-3.5 text-muted-foreground/70" />
                  <span>{employee.department ? employee.department.name : "دفتر مرکزی"}</span>
                </div>
                <div className="flex items-center gap-1 font-mono">
                  <Calendar className="size-3.5 text-muted-foreground/70" />
                  <span>استخدام: {faDate(employee.hireDate)}</span>
                </div>
                <div className="flex items-center gap-1 font-semibold text-sky-700 bg-sky-500/10 px-2 py-0.5 rounded-md border border-sky-500/20">
                  <Clock className="size-3 text-sky-600" />
                  <span>سابقه: {formatServiceDuration(employee.hireDate, employee.terminationDate)}</span>
                </div>
                {employee.user && (
                  <div className="flex items-center gap-1 font-semibold text-indigo-700 bg-indigo-500/10 px-2 py-0.5 rounded-md border border-indigo-500/20">
                    <KeyRound className="size-3 text-indigo-600" />
                    <span>حساب کاربری: @{employee.user.username} ({ROLE_LABELS[employee.user.role] || employee.user.role})</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* خلاصه دریافتی و حساب بانکی پرسنل */}
          <div className="w-full md:w-auto bg-card/80 backdrop-blur-sm border border-border/80 rounded-xl p-3.5 shadow-2xs space-y-2">
            <div className="flex items-center justify-between gap-4 text-xs">
              <span className="text-muted-foreground">ناخالص ماهانه (حکم فعال):</span>
              <span className="font-mono font-black text-emerald-600 text-sm">
                {activeGrossTotal > 0 ? `${money(activeGrossTotal)} ریال` : "فاقد حکم فعال"}
              </span>
            </div>
            {employee.iban && (
              <div
                onClick={handleCopyIban}
                className="flex items-center justify-between gap-3 text-[11px] font-mono bg-muted/60 hover:bg-muted p-2 rounded-lg cursor-pointer transition-colors border border-border/60"
                title="کلیک برای کپی شماره شبا"
              >
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <CreditCard className="size-3.5 text-primary" />
                  <span>{employee.bankAccount ? `بانک ${employee.bankAccount}` : "شماره شبا"}:</span>
                </div>
                <div className="flex items-center gap-1 font-bold text-foreground">
                  <span>{employee.iban}</span>
                  {copiedIban ? (
                    <Check className="size-3 text-emerald-600" />
                  ) : (
                    <Copy className="size-3 text-muted-foreground" />
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ───────────────────────── کارت‌های برجسته KPI پرسنل ───────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="p-3.5 border-border/80 bg-card shadow-2xs">
          <div className="flex items-center justify-between text-muted-foreground text-xs">
            <span>مزد ماهانه پایه</span>
            <Wallet className="size-4 text-primary" />
          </div>
          <div className="mt-2 text-base font-black font-mono text-foreground">
            {activeMonthlySalary > 0 ? money(activeMonthlySalary) : "—"}
            <span className="text-[11px] font-normal text-muted-foreground mr-1">ریال</span>
          </div>
          <div className="mt-1 text-[11px] text-muted-foreground">
            مزد روزانه: {activeContract ? `${money(activeContract.baseDailySalary)} ریال` : "تعریف‌نشده"}
          </div>
        </Card>

        <Card className="p-3.5 border-border/80 bg-card shadow-2xs">
          <div className="flex items-center justify-between text-muted-foreground text-xs">
            <span>مزایای رفاهی و بن</span>
            <Sparkles className="size-4 text-emerald-600" />
          </div>
          <div className="mt-2 text-base font-black font-mono text-emerald-600">
            {money(activeHousing + activeGrocery + activeMarital + activeChild)}
            <span className="text-[11px] font-normal text-muted-foreground mr-1">ریال</span>
          </div>
          <div className="mt-1 text-[11px] text-muted-foreground">
            مسکن: {money(activeHousing)} | بن: {money(activeGrocery)}
          </div>
        </Card>

        <Card className="p-3.5 border-border/80 bg-card shadow-2xs">
          <div className="flex items-center justify-between text-muted-foreground text-xs">
            <span>تعداد احکام صادره</span>
            <Award className="size-4 text-amber-600" />
          </div>
          <div className="mt-2 text-base font-black font-mono text-foreground">
            {toFa(contracts.length)}
            <span className="text-[11px] font-normal text-muted-foreground mr-1">حکم کارگزینی</span>
          </div>
          <div className="mt-1 text-[11px] text-muted-foreground">
            {activeContract ? `آخرین حکم: ${faDate(activeContract.issueDate || activeContract.startDate)}` : "فاقد سابقه"}
          </div>
        </Card>

        <Card className="p-3.5 border-border/80 bg-card shadow-2xs">
          <div className="flex items-center justify-between text-muted-foreground text-xs">
            <span>آخرین فیش حقوقی</span>
            <Receipt className="size-4 text-sky-600" />
          </div>
          <div className="mt-2 text-base font-black font-mono text-sky-700">
            {latestSlip ? money(latestSlip.netPayable) : "—"}
            <span className="text-[11px] font-normal text-muted-foreground mr-1">ریال</span>
          </div>
          <div className="mt-1 text-[11px] text-muted-foreground">
            {latestSlip ? `دوره: ${latestSlip.period?.title || "ثبت‌شده"}` : "هنوز فیشی صادر نشده"}
          </div>
        </Card>
      </div>

      {/* ───────────────────────── تب‌های ناوبری اصلی پروفایل ───────────────────────── */}
      <div className="flex items-center gap-1.5 border-b border-border/80 pb-2 no-print">
        <button
          onClick={() => setActiveTab("overview")}
          className={cn(
            "kardo-pill-tab flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all",
            activeTab === "overview"
              ? "bg-primary text-primary-foreground shadow-xs"
              : "bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground"
          )}
        >
          <User className="size-3.5" />
          مشخصات هویتی و بانکی
        </button>

        <button
          onClick={() => setActiveTab("decrees")}
          className={cn(
            "kardo-pill-tab flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all",
            activeTab === "decrees"
              ? "bg-primary text-primary-foreground shadow-xs"
              : "bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground"
          )}
        >
          <FileCheck2 className="size-3.5" />
          احکام کارگزینی و قراردادها ({toFa(contracts.length)})
        </button>

        <button
          onClick={() => setActiveTab("payroll")}
          className={cn(
            "kardo-pill-tab flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all",
            activeTab === "payroll"
              ? "bg-primary text-primary-foreground shadow-xs"
              : "bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground"
          )}
        >
          <Receipt className="size-3.5" />
          سوابق فیش‌های حقوقی ({toFa(payrollSlips.length)})
        </button>

        <button
          onClick={() => setActiveTab("tasks")}
          className={cn(
            "kardo-pill-tab flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all",
            activeTab === "tasks"
              ? "bg-primary text-primary-foreground shadow-xs"
              : "bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground"
          )}
        >
          <Layers className="size-3.5" />
          فعالیت‌های انبار و مأموریت‌ها
        </button>
      </div>

      {/* ═════════════════════════ تب ۱: مشخصات هویتی و بانکی ═════════════════════════ */}
      {activeTab === "overview" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* کارت ۱: مشخصات سجلی و هویتی */}
          <Card className="p-4 border-border/80 shadow-2xs space-y-3">
            <div className="flex items-center justify-between border-b pb-2.5">
              <div className="flex items-center gap-2 font-bold text-xs text-foreground">
                <User className="size-4 text-primary" />
                <span>اطلاعات سجلی و شناسنامه‌ای</span>
              </div>
              <Badge variant="outline" className="text-[10px] font-mono">
                {employee.gender === "FEMALE" ? "زن" : "مرد"}
              </Badge>
            </div>

            <div className="space-y-2.5 text-xs">
              <div className="flex items-center justify-between py-1 border-b border-border/40">
                <span className="text-muted-foreground">کد ملی:</span>
                <span className="font-mono font-bold text-foreground">{toFa(employee.nationalId)}</span>
              </div>
              <div className="flex items-center justify-between py-1 border-b border-border/40">
                <span className="text-muted-foreground">شماره شناسنامه:</span>
                <span className="font-mono font-semibold text-foreground">
                  {employee.birthCertificate ? toFa(employee.birthCertificate) : "—"}
                </span>
              </div>
              <div className="flex items-center justify-between py-1 border-b border-border/40">
                <span className="text-muted-foreground">نام پدر:</span>
                <span className="font-semibold text-foreground">{employee.fatherName || "—"}</span>
              </div>
              <div className="flex items-center justify-between py-1 border-b border-border/40">
                <span className="text-muted-foreground">تاریخ تولد:</span>
                <span className="font-mono font-semibold text-foreground">
                  {employee.birthDate ? toFa(employee.birthDate) : "—"}
                </span>
              </div>
              <div className="flex items-center justify-between py-1 border-b border-border/40">
                <span className="text-muted-foreground">وضعیت نظام وظیفه:</span>
                <span className="font-semibold text-foreground">
                  {employee.militaryStatus === "COMPLETED"
                    ? "پایان خدمت"
                    : employee.militaryStatus === "EXEMPT"
                    ? "معافیت دائم"
                    : employee.militaryStatus === "ONGOING"
                    ? "مشمول / در حال خدمت"
                    : "معاف / غیرمشمول"}
                </span>
              </div>
              <div className="flex items-center justify-between py-1">
                <span className="text-muted-foreground">وضعیت تأهل و فرزندان:</span>
                <span className="font-semibold text-foreground">
                  {employee.maritalStatus === "MARRIED" ? "متأهل" : "مجرد"}{" "}
                  {employee.childrenCount > 0 ? `(${toFa(employee.childrenCount)} فرزند مشمول)` : ""}
                </span>
              </div>
            </div>
          </Card>

          {/* کارت ۲: اطلاعات تماس و موارد اضطراری */}
          <Card className="p-4 border-border/80 shadow-2xs space-y-3">
            <div className="flex items-center justify-between border-b pb-2.5">
              <div className="flex items-center gap-2 font-bold text-xs text-foreground">
                <Phone className="size-4 text-emerald-600" />
                <span>اطلاعات تماس و نشانی</span>
              </div>
              {employee.bloodType && (
                <Badge variant="outline" className="text-[10px] bg-rose-500/10 text-rose-700 border-rose-500/30">
                  <HeartPulse className="size-3 ml-1" />
                  گروه خونی: {employee.bloodType}
                </Badge>
              )}
            </div>

            <div className="space-y-2.5 text-xs">
              <div className="flex items-center justify-between py-1 border-b border-border/40">
                <span className="text-muted-foreground">تلفن همراه مستقیم:</span>
                <a
                  href={`tel:${employee.mobile}`}
                  className="font-mono font-bold text-primary hover:underline dir-ltr"
                >
                  {toFa(employee.mobile)}
                </a>
              </div>
              <div className="flex items-center justify-between py-1 border-b border-border/40">
                <span className="text-muted-foreground">شماره تماس اضطراری:</span>
                <span className="font-mono font-semibold text-foreground">
                  {employee.emergencyPhone ? toFa(employee.emergencyPhone) : "—"}
                </span>
              </div>
              <div className="py-1">
                <span className="text-muted-foreground block mb-1">نشانی محل سکونت:</span>
                <div className="flex items-start gap-1.5 text-muted-foreground bg-muted/40 p-2.5 rounded-lg border border-border/40 text-[11px] leading-relaxed">
                  <MapPin className="size-4 text-primary shrink-0 mt-0.5" />
                  <span>{employee.address || "نشانی ثبت نشده است."}</span>
                </div>
              </div>
            </div>
          </Card>

          {/* کارت ۳: امور بانکی و بیمه تأمین اجتماعی */}
          <Card className="p-4 border-border/80 shadow-2xs space-y-3">
            <div className="flex items-center justify-between border-b pb-2.5">
              <div className="flex items-center gap-2 font-bold text-xs text-foreground">
                <CreditCard className="size-4 text-sky-600" />
                <span>امور بانکی و بیمه تأمین اجتماعی</span>
              </div>
              <ShieldCheck className="size-4 text-emerald-600" />
            </div>

            <div className="space-y-2.5 text-xs">
              <div className="flex items-center justify-between py-1 border-b border-border/40">
                <span className="text-muted-foreground">شماره بیمه تأمین اجتماعی:</span>
                <span className="font-mono font-bold text-emerald-700 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                  {employee.insuranceNumber ? toFa(employee.insuranceNumber) : "فاقد بیمه"}
                </span>
              </div>
              <div className="flex items-center justify-between py-1 border-b border-border/40">
                <span className="text-muted-foreground">نام بانک عامل:</span>
                <span className="font-semibold text-foreground">{employee.bankAccount || "بانک ملی ایران"}</span>
              </div>
              <div className="py-1">
                <span className="text-muted-foreground block mb-1">شماره شبا (IBAN):</span>
                <div
                  onClick={handleCopyIban}
                  className="flex items-center justify-between gap-2 font-mono text-[11px] bg-muted/60 hover:bg-muted p-2 rounded-lg cursor-pointer transition-colors border border-border/60"
                  title="کلیک برای کپی شبا"
                >
                  <span className="font-bold text-foreground truncate">{employee.iban || "—"}</span>
                  {copiedIban ? (
                    <Check className="size-3.5 text-emerald-600 shrink-0" />
                  ) : (
                    <Copy className="size-3.5 text-muted-foreground shrink-0" />
                  )}
                </div>
              </div>
            </div>
          </Card>

          {/* کارت ۴: مشخصات سازمانی و حساب کاربری نرم‌افزار */}
          <Card className="p-4 border-border/80 shadow-2xs space-y-3">
            <div className="flex items-center justify-between border-b pb-2.5">
              <div className="flex items-center gap-2 font-bold text-xs text-foreground">
                <Building2 className="size-4 text-primary" />
                <span>جایگاه سازمانی و دسترسی نرم‌افزار</span>
              </div>
              <Badge variant="outline" className="text-[10px]">
                {employee.jobTitle}
              </Badge>
            </div>

            <div className="space-y-2.5 text-xs">
              <div className="flex items-center justify-between py-1 border-b border-border/40">
                <span className="text-muted-foreground">واحد سازمانی:</span>
                <span className="font-semibold text-foreground">
                  {employee.department ? employee.department.name : "دفتر مرکزی"}
                </span>
              </div>
              <div className="flex items-center justify-between py-1 border-b border-border/40">
                <span className="text-muted-foreground">تاریخ استخدام رسمی:</span>
                <span className="font-mono font-semibold text-foreground">{faDate(employee.hireDate)}</span>
              </div>
              <div className="flex items-center justify-between py-1 border-b border-border/40">
                <span className="text-muted-foreground">مدت سابقه خدمت:</span>
                <span className="font-semibold text-sky-700">
                  {formatServiceDuration(employee.hireDate, employee.terminationDate)}
                </span>
              </div>
              <div className="flex items-center justify-between py-1">
                <span className="text-muted-foreground">حساب کاربری متصل:</span>
                {employee.user ? (
                  <div className="flex items-center gap-1.5 bg-emerald-500/10 text-emerald-800 px-2 py-0.5 rounded border border-emerald-500/20 font-mono text-[11px]">
                    <UserCheck className="size-3 text-emerald-600" />
                    <span>{employee.user.username} ({employee.user.role})</span>
                  </div>
                ) : (
                  <span className="text-muted-foreground text-[11px]">بدون حساب متصل</span>
                )}
              </div>
            </div>
          </Card>

          {/* کارت ۵: توضیحات و یادداشت‌های پرونده کارگزینی */}
          <Card className="p-4 border-border/80 shadow-2xs space-y-3 md:col-span-2">
            <div className="flex items-center justify-between border-b pb-2.5">
              <div className="flex items-center gap-2 font-bold text-xs text-foreground">
                <FileText className="size-4 text-amber-600" />
                <span>یادداشت‌ها و ملاحظات اداری کارگزینی</span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsEditEmployeeOpen(true)}
                className="h-6 text-[10px] text-primary gap-1"
              >
                <Edit className="size-3" />
                ویرایش یادداشت
              </Button>
            </div>

            <div className="text-xs text-muted-foreground bg-muted/30 p-3 rounded-lg border border-border/40 min-h-[90px] leading-relaxed whitespace-pre-wrap">
              {employee.notes || "هیچ یادداشت یا ملاحظه خاصی برای این پرونده ثبت نشده است."}
            </div>
          </Card>
        </div>
      )}

      {/* ═════════════════════════ تب ۲: احکام کارگزینی و قراردادها ═════════════════════════ */}
      {activeTab === "decrees" && (
        <div className="space-y-6">
          {/* ویترین حکم جاری فعال */}
          {activeContract ? (
            <Card className="overflow-hidden border-emerald-500/40 shadow-sm bg-gradient-to-br from-card via-card to-emerald-500/[0.03]">
              <div className="flex flex-wrap items-center justify-between border-b border-emerald-500/30 bg-emerald-500/10 p-4">
                <div className="flex items-center gap-2.5">
                  <div className="size-8 rounded-lg bg-emerald-500/20 flex items-center justify-center border border-emerald-500/40 text-emerald-700">
                    <FileCheck2 className="size-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-black text-foreground">
                        {activeContract.decreeTitle || "حکم کارگزینی فعال پرسنل"}
                      </span>
                      <Badge className="bg-emerald-600 text-white text-[10px]">حکم جاری و معتبر</Badge>
                    </div>
                    <div className="text-xs text-muted-foreground flex items-center gap-3 mt-0.5 font-mono">
                      <span>شماره حکم: {activeContract.contractNumber}</span>
                      <span>نوع: {DECREE_TYPE_LABELS[activeContract.decreeType || "INITIAL"] || "حکم اداری"}</span>
                      <span>تاریخ صدور: {faDate(activeContract.issueDate || activeContract.startDate)}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 mt-2 sm:mt-0">
                  <Button
                    size="sm"
                    onClick={() =>
                      setSelectedPrintDecree({ ...activeContract, employee: employee as EmployeeRow })
                    }
                    className="h-8 text-xs gap-1.5 bg-primary text-primary-foreground font-bold shadow-xs"
                  >
                    <Printer className="size-3.5" />
                    مشاهده و چاپ حکم رسمی (A4)
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setEditingDecree(activeContract);
                      setIsNewDecreeOpen(true);
                    }}
                    className="h-8 text-xs gap-1.5 font-semibold"
                  >
                    <Pencil className="size-3.5" />
                    ویرایش حکم
                  </Button>
                </div>
              </div>

              {/* جدول ریز اقلام دستمزد و مزایا طبق قانون کار */}
              <div className="p-4 space-y-4">
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 text-xs">
                  <div className="p-3 bg-muted/40 rounded-xl border border-border/60">
                    <span className="text-muted-foreground block text-[11px]">مزد روزانه پایه:</span>
                    <span className="font-mono font-bold text-foreground text-sm block mt-1">
                      {money(activeContract.baseDailySalary)} ریال
                    </span>
                  </div>

                  <div className="p-3 bg-muted/40 rounded-xl border border-border/60">
                    <span className="text-muted-foreground block text-[11px]">مزد ماهانه (۳۰ روزه):</span>
                    <span className="font-mono font-bold text-foreground text-sm block mt-1">
                      {money(activeMonthlySalary)} ریال
                    </span>
                  </div>

                  <div className="p-3 bg-muted/40 rounded-xl border border-border/60">
                    <span className="text-muted-foreground block text-[11px]">کمک هزینه مسکن:</span>
                    <span className="font-mono font-bold text-foreground text-sm block mt-1">
                      {money(activeHousing)} ریال
                    </span>
                  </div>

                  <div className="p-3 bg-muted/40 rounded-xl border border-border/60">
                    <span className="text-muted-foreground block text-[11px]">بن خواربار (اقلام مصرفی):</span>
                    <span className="font-mono font-bold text-foreground text-sm block mt-1">
                      {money(activeGrocery)} ریال
                    </span>
                  </div>

                  <div className="p-3 bg-muted/40 rounded-xl border border-border/60">
                    <span className="text-muted-foreground block text-[11px]">حق عائله‌مندی (همسر):</span>
                    <span className="font-mono font-bold text-foreground text-sm block mt-1">
                      {money(activeMarital)} ریال
                    </span>
                  </div>

                  <div className="p-3 bg-muted/40 rounded-xl border border-border/60">
                    <span className="text-muted-foreground block text-[11px]">
                      حق اولاد ({toFa(employee.childrenCount)} فرزند):
                    </span>
                    <span className="font-mono font-bold text-foreground text-sm block mt-1">
                      {money(activeChild)} ریال
                    </span>
                  </div>

                  <div className="p-3 bg-muted/40 rounded-xl border border-border/60">
                    <span className="text-muted-foreground block text-[11px]">پایه سنوات تجمیعی:</span>
                    <span className="font-mono font-bold text-foreground text-sm block mt-1">
                      {money(activeSeniority)} ریال
                    </span>
                  </div>

                  <div className="p-3 bg-muted/40 rounded-xl border border-border/60">
                    <span className="text-muted-foreground block text-[11px]">حق مسئولیت / سرپرستی:</span>
                    <span className="font-mono font-bold text-foreground text-sm block mt-1">
                      {money(activeResponsibility)} ریال
                    </span>
                  </div>
                </div>

                {/* جمع کل ناخالص ماهانه */}
                <div className="flex flex-wrap items-center justify-between bg-primary/10 border border-primary/30 p-3.5 rounded-xl">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="size-5 text-primary" />
                    <div>
                      <span className="text-xs font-bold text-foreground block">
                        مجموع ناخالص ماهانه (حقوق و مزایای مستمر):
                      </span>
                      <span className="text-[11px] text-muted-foreground">
                        مبنای محاسبه اضافه‌کاری، حق بیمه و فیش حقوقی ماهانه
                      </span>
                    </div>
                  </div>
                  <div className="text-lg font-black font-mono text-primary">
                    {money(activeGrossTotal)} ریال
                  </div>
                </div>
              </div>
            </Card>
          ) : (
            <Card className="p-6 text-center border-dashed border-border/80">
              <FileCheck2 className="size-10 text-muted-foreground/40 mx-auto mb-2" />
              <p className="text-sm font-bold">هنوز هیچ حکم کارگزینی فعالی برای این پرسنل صادر نشده است.</p>
              <p className="text-xs text-muted-foreground mt-1 mb-4">
                برای تعیین حقوق پایه و محاسبه فیش‌های ماهانه، ابتدا یک حکم کارگزینی ثبت کنید.
              </p>
              <Button
                size="sm"
                onClick={() => {
                  setEditingDecree(null);
                  setIsNewDecreeOpen(true);
                }}
                className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2 font-bold"
              >
                <FileCheck2 className="size-4" />
                صدور اولین حکم کارگزینی
              </Button>
            </Card>
          )}

          {/* فهرست تاریخچه تمام احکام کارگزینی پرسنل */}
          <Card className="overflow-hidden border-border/80 shadow-2xs">
            <div className="flex items-center justify-between border-b border-border/80 bg-muted/40 p-3.5">
              <div className="flex items-center gap-2">
                <Award className="size-4 text-primary" />
                <span className="text-xs font-bold text-foreground">
                  تاریخچه احکام کارگزینی و قراردادهای صادر شده
                </span>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setEditingDecree(null);
                  setIsNewDecreeOpen(true);
                }}
                className="h-7 text-[11px] gap-1 font-semibold"
              >
                <FileCheck2 className="size-3 text-emerald-600" />
                ثبت حکم جدید
              </Button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead>
                  <tr className="border-b bg-muted/20 text-muted-foreground">
                    <th className="py-2.5 px-3 font-semibold">شماره حکم</th>
                    <th className="py-2.5 px-3 font-semibold">نوع حکم</th>
                    <th className="py-2.5 px-3 font-semibold">عنوان حکم</th>
                    <th className="py-2.5 px-3 font-semibold">تاریخ صدور / شروع</th>
                    <th className="py-2.5 px-3 font-semibold">مزد پایه ماهانه</th>
                    <th className="py-2.5 px-3 font-semibold">جمع ناخالص</th>
                    <th className="py-2.5 px-3 font-semibold text-center">وضعیت</th>
                    <th className="py-2.5 px-3 font-semibold text-center">عملیات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40">
                  {contracts.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-8 text-center text-muted-foreground">
                        هیچ حکمی در سوابق موجود نیست.
                      </td>
                    </tr>
                  ) : (
                    contracts.map((contract) => {
                      const gross =
                        contract.baseMonthlySalary +
                        contract.housingAllowance +
                        contract.groceryAllowance +
                        contract.maritalAllowance +
                        (contract.seniorityAllowance || 0) +
                        (contract.responsibilityAllowance || 0) +
                        contract.specialAllowance +
                        (employee.childrenCount > 0
                          ? contract.childAllowancePerChild * employee.childrenCount
                          : 0);

                      return (
                        <tr key={contract.id} className="hover:bg-primary/[0.02] transition-colors">
                          <td className="py-2.5 px-3 font-mono font-bold text-foreground">
                            {contract.contractNumber}
                          </td>
                          <td className="py-2.5 px-3">
                            <span className="font-semibold text-foreground">
                              {DECREE_TYPE_LABELS[contract.decreeType || "INITIAL"] || "حکم کارگزینی"}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-muted-foreground">
                            {contract.decreeTitle || "—"}
                          </td>
                          <td className="py-2.5 px-3 font-mono">
                            {faDate(contract.issueDate || contract.startDate)}
                          </td>
                          <td className="py-2.5 px-3 font-mono font-bold">
                            {money(contract.baseMonthlySalary)} ریال
                          </td>
                          <td className="py-2.5 px-3 font-mono font-black text-emerald-700">
                            {money(gross)} ریال
                          </td>
                          <td className="py-2.5 px-3 text-center">
                            {contract.isActive ? (
                              <Badge className="bg-emerald-600 text-white text-[10px]">جاری</Badge>
                            ) : (
                              <Badge variant="outline" className="text-[10px] text-muted-foreground">
                                منقضی / سابقه
                              </Badge>
                            )}
                          </td>
                          <td className="py-2.5 px-3 text-center">
                            <div className="flex items-center justify-center gap-1.5">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() =>
                                  setSelectedPrintDecree({ ...contract, employee: employee as EmployeeRow })
                                }
                                className="h-6.5 text-[10px] px-2 gap-1 rounded-md shadow-2xs font-bold text-primary border-primary/30 hover:bg-primary/10"
                                title="چاپ برگه A4 حکم"
                              >
                                <Printer className="size-3" />
                                چاپ
                              </Button>

                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setEditingDecree(contract);
                                  setIsNewDecreeOpen(true);
                                }}
                                className="h-6.5 text-[10px] px-1.5 rounded-md hover:bg-muted"
                                title="ویرایش حکم"
                              >
                                <Pencil className="size-3" />
                              </Button>

                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  if (confirm("آیا از حذف این حکم کارگزینی اطمینان دارید؟")) {
                                    deleteDecreeMutation.mutate(contract.id);
                                  }
                                }}
                                className="h-6.5 text-[10px] px-1.5 rounded-md text-rose-600 hover:bg-rose-500/10"
                                title="حذف حکم"
                              >
                                <XCircle className="size-3" />
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
        </div>
      )}

      {/* ═════════════════════════ تب ۳: سوابق فیش‌های حقوق و دستمزد ═════════════════════════ */}
      {activeTab === "payroll" && (
        <div className="space-y-4">
          <Card className="overflow-hidden border-border/80 shadow-2xs">
            <div className="flex flex-wrap items-center justify-between border-b border-border/80 bg-muted/40 p-3.5">
              <div className="flex items-center gap-2">
                <Receipt className="size-4 text-primary" />
                <span className="text-xs font-bold text-foreground">
                  فهرست فیش‌های حقوق و دستمزد پرداخت‌شده به این پرسنل
                </span>
              </div>
              <Button
                size="sm"
                onClick={() => setIsCalculateModalOpen(true)}
                className="h-7 text-[11px] gap-1.5 bg-primary text-primary-foreground font-bold shadow-xs"
              >
                <Receipt className="size-3" />
                محاسبه و صدور فیش جدید
              </Button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead>
                  <tr className="border-b bg-muted/20 text-muted-foreground">
                    <th className="py-2.5 px-3 font-semibold">دوره حقوقی</th>
                    <th className="py-2.5 px-3 font-semibold text-center">کارکرد (روز)</th>
                    <th className="py-2.5 px-3 font-semibold text-center">اضافه‌کاری</th>
                    <th className="py-2.5 px-3 font-semibold">حقوق ناخالص</th>
                    <th className="py-2.5 px-3 font-semibold">بیمه سهم کارگر (۷٪)</th>
                    <th className="py-2.5 px-3 font-semibold">مالیات حقوق</th>
                    <th className="py-2.5 px-3 font-semibold">سایر کسورات</th>
                    <th className="py-2.5 px-3 font-semibold font-black text-emerald-700">خالص پرداختی</th>
                    <th className="py-2.5 px-3 font-semibold text-center">چاپ رسمی</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40">
                  {payrollSlips.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="py-10 text-center text-muted-foreground">
                        <div className="flex flex-col items-center justify-center gap-2">
                          <Receipt className="size-8 text-muted-foreground/30 stroke-1" />
                          <p className="text-xs">هیچ فیش حقوقی برای این پرسنل صادر نشده است.</p>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setIsCalculateModalOpen(true)}
                            className="mt-1 text-xs"
                          >
                            محاسبه اولین فیش
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    payrollSlips.map((slip) => {
                      const totalDeductions =
                        slip.workerInsurance + slip.incomeTax + slip.loanDeductions + slip.otherDeductions;

                      return (
                        <tr key={slip.id} className="hover:bg-primary/[0.02] transition-colors">
                          <td className="py-3 px-3">
                            <div className="flex flex-col">
                              <span className="font-bold text-foreground text-xs">
                                {slip.period?.title || "دوره حقوقی"}
                              </span>
                              <span className="font-mono text-[10px] text-muted-foreground">
                                {faDate(slip.createdAt)}
                              </span>
                            </div>
                          </td>
                          <td className="py-3 px-3 font-mono text-center font-bold">
                            {toFa(slip.workingDays)} روز
                          </td>
                          <td className="py-3 px-3 font-mono text-center">
                            {slip.overtimeHours > 0 ? (
                              <span className="text-sky-700 font-bold bg-sky-500/10 px-1.5 py-0.5 rounded">
                                {toFa(slip.overtimeHours)} ساعت
                              </span>
                            ) : (
                              <span className="text-muted-foreground">—</span>
                            )}
                          </td>
                          <td className="py-3 px-3 font-mono font-bold text-foreground">
                            {money(slip.totalGrossSalary)} ریال
                          </td>
                          <td className="py-3 px-3 font-mono text-rose-600 font-semibold">
                            {money(slip.workerInsurance)} ریال
                          </td>
                          <td className="py-3 px-3 font-mono text-rose-600 font-semibold">
                            {slip.incomeTax > 0 ? `${money(slip.incomeTax)} ریال` : "معاف"}
                          </td>
                          <td className="py-3 px-3 font-mono text-muted-foreground">
                            {slip.loanDeductions + slip.otherDeductions > 0
                              ? `${money(slip.loanDeductions + slip.otherDeductions)} ریال`
                              : "—"}
                          </td>
                          <td className="py-3 px-3 font-mono font-black text-emerald-700 text-sm">
                            {money(slip.netPayable)} ریال
                          </td>
                          <td className="py-3 px-3 text-center">
                            <Button
                              size="sm"
                              onClick={() =>
                                setSelectedPrintSlip({ ...slip, employee: employee as EmployeeRow })
                              }
                              className="h-7 text-[11px] px-2.5 gap-1.5 bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground border border-primary/20 rounded-lg shadow-2xs font-bold"
                            >
                              <Printer className="size-3" />
                              فیش رسمی
                            </Button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {/* ═════════════════════════ تب ۴: فعالیت‌های انبار و مأموریت‌ها ═════════════════════════ */}
      {activeTab === "tasks" && (
        <div className="space-y-4">
          <Card className="p-4 border-border/80 shadow-2xs space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center gap-2 font-bold text-xs text-foreground">
                <Layers className="size-4 text-primary" />
                <span>وظایف محوله در انبار (Work Tasks & Picking)</span>
              </div>
              {employee.user ? (
                <Badge className="bg-emerald-600 text-white text-[10px]">
                  کاربر سیستم: {employee.user.username}
                </Badge>
              ) : (
                <Badge variant="outline" className="text-[10px] text-amber-600 border-amber-500/30">
                  حساب کاربری متصل ندارد
                </Badge>
              )}
            </div>

            {employee.user?.workTasksAssigned && employee.user.workTasksAssigned.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-right text-xs">
                  <thead>
                    <tr className="border-b bg-muted/20 text-muted-foreground">
                      <th className="py-2 px-3 font-semibold">شناسه / نوع وظیفه</th>
                      <th className="py-2 px-3 font-semibold">اولویت</th>
                      <th className="py-2 px-3 font-semibold">یادداشت و جزئیات</th>
                      <th className="py-2 px-3 font-semibold">زمان ثبت</th>
                      <th className="py-2 px-3 font-semibold text-center">وضعیت</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/40">
                    {employee.user.workTasksAssigned.map((task: any) => {
                      const st = TASK_STATUS_LABELS[task.status] || {
                        label: task.status,
                        color: "bg-muted text-muted-foreground",
                      };
                      return (
                        <tr key={task.id} className="hover:bg-primary/[0.02] transition-colors">
                          <td className="py-2.5 px-3">
                            <div className="flex items-center gap-2 font-bold text-foreground">
                              <span>{task.kind === "PICK" ? "جمع‌آوری اقلام (PICK)" : "چیدن کالا (PUTAWAY)"}</span>
                            </div>
                          </td>
                          <td className="py-2.5 px-3">
                            <span
                              className={cn(
                                "text-[10px] font-bold px-2 py-0.5 rounded",
                                task.priority === "URGENT"
                                  ? "bg-rose-500/10 text-rose-700 border border-rose-500/20"
                                  : "bg-muted text-muted-foreground"
                              )}
                            >
                              {task.priority === "URGENT" ? "فوری" : "عادی"}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-muted-foreground">{task.note || "—"}</td>
                          <td className="py-2.5 px-3 font-mono text-[11px] text-muted-foreground">
                            {faDate(task.createdAt)}
                          </td>
                          <td className="py-2.5 px-3 text-center">
                            <Badge variant="outline" className={cn("text-[10px] border", st.color)}>
                              {st.label}
                            </Badge>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="py-12 text-center text-muted-foreground space-y-2">
                <Layers className="size-8 text-muted-foreground/30 mx-auto stroke-1" />
                <p className="text-xs">هیچ وظیفه فعالی در انبار به این پرسنل منتسب نشده است.</p>
                <p className="text-[11px] text-muted-foreground/70">
                  برای انتساب وظایف انبارداری، ابتدا در برگه ویرایش پرونده حساب کاربری سیستم را انتخاب کنید.
                </p>
              </div>
            )}
          </Card>
        </div>
      )}

      {/* ───────────────────────── مودال‌ها و دیالوگ‌ها ───────────────────────── */}
      {/* ۱. دیالوگ ویرایش مشخصات پرسنل */}
      <EmployeeDialog
        open={isEditEmployeeOpen}
        onOpenChange={setIsEditEmployeeOpen}
        departments={departments}
        editEmployee={employee}
      />

      {/* ۲. دیالوگ صدور/ویرایش حکم کارگزینی */}
      <DecreeDialog
        open={isNewDecreeOpen}
        onOpenChange={setIsNewDecreeOpen}
        employees={[employee]}
        preselectedEmployeeId={employee.id}
        editDecree={editingDecree}
      />

      {/* ۳. دیالوگ پرینت حکم کارگزینی رسمی A4 */}
      <DecreePrintDialog
        decree={selectedPrintDecree}
        open={Boolean(selectedPrintDecree)}
        onOpenChange={(op) => !op && setSelectedPrintDecree(null)}
      />

      {/* ۴. دیالوگ پرینت فیش حقوقی رسمی */}
      <PayslipPrintDialog
        slip={selectedPrintSlip}
        open={Boolean(selectedPrintSlip)}
        onOpenChange={(op) => !op && setSelectedPrintSlip(null)}
      />

      {/* ۵. دیالوگ محاسبه فیش حقوقی اختصاصی برای این پرسنل */}
      <Dialog open={isCalculateModalOpen} onOpenChange={setIsCalculateModalOpen}>
        <DialogContent className="max-w-md p-6 font-sans">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base">
              <Receipt className="size-5 text-primary" />
              محاسبه فیش حقوقی برای {employee.firstName} {employee.lastName}
            </DialogTitle>
            <DialogDescription className="text-xs">
              کارکرد ماهانه و متغیرها را وارد کرده و دکمه محاسبه را بزنید.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3.5 py-2 text-xs">
            <div>
              <label className="font-bold text-foreground block mb-1">دوره حقوق و دستمزد:</label>
              <select
                className="w-full h-8 rounded-lg border border-input bg-card px-2.5 text-xs font-semibold"
                value={calcPeriodId}
                onChange={(e) => setCalcPeriodId(e.target.value)}
              >
                {periods.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.title} ({p.status === "PAID" ? "پرداخت شده" : p.status === "FINALIZED" ? "قطعی شده" : "جاری / پیش‌نویس"})
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="font-medium text-foreground block mb-1">روزهای کارکرد موثر:</label>
                <Input
                  type="number"
                  value={calcWorkingDays}
                  onChange={(e) => setCalcWorkingDays(Number(e.target.value))}
                  className="h-8 font-mono text-center font-bold"
                  min={0}
                  max={31}
                />
              </div>

              <div>
                <label className="font-medium text-foreground block mb-1">ساعات اضافه‌کاری:</label>
                <Input
                  type="number"
                  value={calcOvertimeHours}
                  onChange={(e) => setCalcOvertimeHours(Number(e.target.value))}
                  className="h-8 font-mono text-center font-bold"
                  min={0}
                />
              </div>

              <div>
                <label className="font-medium text-foreground block mb-1">کسر کار / تأخیر (ساعت):</label>
                <Input
                  type="number"
                  value={calcDelayHours}
                  onChange={(e) => setCalcDelayHours(Number(e.target.value))}
                  className="h-8 font-mono text-center font-bold"
                  min={0}
                />
              </div>

              <div>
                <label className="font-medium text-foreground block mb-1">غیبت غیرموجه (روز):</label>
                <Input
                  type="number"
                  value={calcAbsenceDays}
                  onChange={(e) => setCalcAbsenceDays(Number(e.target.value))}
                  className="h-8 font-mono text-center font-bold"
                  min={0}
                />
              </div>

              <div>
                <label className="font-medium text-foreground block mb-1">کسر وام پرسنلی (ریال):</label>
                <Input
                  type="number"
                  value={calcLoanDeductions}
                  onChange={(e) => setCalcLoanDeductions(Number(e.target.value))}
                  className="h-8 font-mono text-left font-bold"
                  min={0}
                  step={100000}
                />
              </div>

              <div>
                <label className="font-medium text-foreground block mb-1">سایر کسورات (ریال):</label>
                <Input
                  type="number"
                  value={calcOtherDeductions}
                  onChange={(e) => setCalcOtherDeductions(Number(e.target.value))}
                  className="h-8 font-mono text-left font-bold"
                  min={0}
                  step={100000}
                />
              </div>
            </div>

            {activeContract && (
              <div className="bg-muted/40 p-2.5 rounded-lg border border-border/40 text-[11px] space-y-1">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">مبنای محاسبه حکم جاری:</span>
                  <span className="font-mono font-bold text-foreground">
                    {money(activeMonthlySalary)} ریال
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">بیمه مشمول (۷٪ کارگر):</span>
                  <span className="font-mono text-rose-600 font-semibold">محاسبه خودکار</span>
                </div>
              </div>
            )}
          </div>

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsCalculateModalOpen(false)}
              className="text-xs"
            >
              انصراف
            </Button>
            <Button
              size="sm"
              disabled={calculateMutation.isPending || !calcPeriodId}
              onClick={() => {
                calculateMutation.mutate({
                  periodId: calcPeriodId,
                  employeeId: employee.id,
                  workingDays: calcWorkingDays,
                  overtimeHours: calcOvertimeHours,
                  delayHours: calcDelayHours,
                  absenceDays: calcAbsenceDays,
                  loanDeductions: calcLoanDeductions,
                  otherDeductions: calcOtherDeductions,
                });
              }}
              className="bg-primary text-primary-foreground text-xs font-bold gap-1.5"
            >
              {calculateMutation.isPending ? "در حال محاسبه..." : "محاسبه و صدور فیش"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* دیالوگ ایجاد حساب کاربری برای پرسنل */}
      <Dialog open={isCreateUserOpen} onOpenChange={setIsCreateUserOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <KeyRound className="size-4 text-primary" />
              ایجاد حساب کاربری سامانه
            </DialogTitle>
            <DialogDescription>
              ایجاد شناسه ورود و کلمه عبور برای «{employee.firstName} {employee.lastName}» (کد: {employee.personnelCode})
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-3 py-2">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="create-username">نام کاربری سامانه *</Label>
              <Input
                id="create-username"
                value={userForm.username}
                onChange={(e) => setUserForm((f) => ({ ...f, username: e.target.value }))}
                placeholder="مثلاً 1001 یا ali.r"
                className="font-mono text-left"
                dir="ltr"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="create-password">کلمه عبور ورود *</Label>
              <Input
                id="create-password"
                type="password"
                value={userForm.password}
                onChange={(e) => setUserForm((f) => ({ ...f, password: e.target.value }))}
                placeholder="حداقل ۶ کاراکتر"
                dir="ltr"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>نقش سازمانی *</Label>
              <Select
                value={userForm.role}
                onValueChange={(val: any) => setUserForm((f) => ({ ...f, role: val }))}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="انتخاب نقش" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="STAFF">کارمند / اپراتور (STAFF)</SelectItem>
                  <SelectItem value="SALES">فروشنده / صندوق‌دار (SALES)</SelectItem>
                  <SelectItem value="MANAGER">مدیر داخلی / سرپرست (MANAGER)</SelectItem>
                  <SelectItem value="ADMIN">مدیر ارشد سیستم (ADMIN)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <p className="text-[11px] text-muted-foreground bg-muted/40 p-2.5 rounded-lg mt-1 leading-relaxed">
              💡 با ساخت این حساب، کاربر می‌تواند با نام کاربری و رمز خود وارد سیستم شده و در پروفایل خود احکام کارگزینی، فیش‌های حقوقی و وظایف محوله را مشاهده نماید.
            </p>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsCreateUserOpen(false)}
            >
              انصراف
            </Button>
            <Button
              size="sm"
              disabled={createUserMut.isPending || !userForm.username.trim() || userForm.password.trim().length < 6}
              onClick={() => createUserMut.mutate()}
              className="bg-primary text-primary-foreground font-bold gap-1.5"
            >
              {createUserMut.isPending ? "در حال ایجاد..." : "ساخت و اتصال حساب"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
