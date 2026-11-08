"use client";

// پروفایل اختصاصی کاربر لاگین‌شده و کارتابل وظایف سازمانی و حقوق و دستمزد
import * as React from "react";
import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  UserCircle,
  Briefcase,
  FileText,
  Receipt,
  ClipboardList,
  CheckCircle2,
  Clock,
  AlertCircle,
  Shield,
  Building2,
  Calendar,
  CreditCard,
  Phone,
  Mail,
  Award,
  Bell,
  CalendarDays,
  RefreshCw,
  Wallet,
  ExternalLink,
  ChevronLeft,
  Sparkles,
  Info,
} from "lucide-react";

import { ProfileLeavesTab } from "./profile-leaves-tab";
import { ProfileAdvancesTab } from "./profile-advances-tab";

import { getMyProfile } from "@/lib/api";
import { useAuthStore } from "@/lib/auth-store";
import { amount, faDate, money, toFa, ROLE_LABELS } from "@/lib/format";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { PageHeader } from "@/components/page-header";
import { LoadingState, ErrorState } from "@/components/states";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const ROLE_BADGE_CLASS: Record<string, string> = {
  ADMIN: "bg-rose-100 text-rose-700 border-rose-200",
  MANAGER: "bg-amber-100 text-amber-700 border-amber-200",
  STAFF: "bg-emerald-100 text-emerald-700 border-emerald-200",
  SALES: "bg-sky-100 text-sky-700 border-sky-200",
};

export default function UserProfilePage() {
  const currentUser = useAuthStore((s) => s.user);
  const { toast } = useToast();
  const qc = useQueryClient();

  const profileQ = useQuery({
    queryKey: ["my-profile"],
    queryFn: getMyProfile,
  });

  const data = profileQ.data;
  const employee = data?.employee;
  const activeContract = employee?.contracts?.[0];
  const payrollSlips = employee?.payrollSlips || [];
  const assignedTasks = data?.workTasksAssigned || [];
  const notifications = data?.notificationsReceived || [];

  if (profileQ.isLoading) {
    return <LoadingState label="در حال دریافت اطلاعات پرونده و پروفایل شما..." />;
  }

  if (profileQ.isError || !data) {
    return (
      <ErrorState
        message="بارگذاری اطلاعات پروفایل با خطا مواجه شد."
        onRetry={() => profileQ.refetch()}
      />
    );
  }

  // محاسبه ناخالص حکم جاری
  const grossSalary = activeContract
    ? (activeContract.baseDailySalary * 30) +
      (activeContract.housingAllowance || 0) +
      (activeContract.groceryAllowance || 0) +
      (activeContract.maritalAllowance || 0) +
      ((activeContract.childAllowancePerChild || 0) * (employee.childrenCount || 0)) +
      (activeContract.seniorityAllowance || 0) +
      (activeContract.responsibilityAllowance || 0)
    : 0;

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6 select-none max-w-7xl mx-auto w-full">
      <PageHeader
        title="پروفایل پرسنلی و کارتابل من"
        description="مشاهده پرونده کارگزینی، حکم حقوق و مزایا، فیش‌های حقوقی و تسک‌های محوله سازمانی"
        icon={UserCircle}
        actions={
          <Button
            variant="outline"
            size="sm"
            onClick={() => profileQ.refetch()}
            className="gap-2 text-xs"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            به‌روزرسانی
          </Button>
        }
      />

      {/* کارت سربرگ هویت پرسنلی */}
      <Card className="border-border/80 shadow-sm overflow-hidden bg-gradient-to-r from-card via-card to-primary/5">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="size-16 sm:size-20 rounded-2xl bg-primary/10 border-2 border-primary/20 flex items-center justify-center text-primary font-black text-2xl shadow-inner">
                {data.fullName?.charAt(0) || data.username.charAt(0)}
              </div>
              <div className="flex flex-col gap-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-xl sm:text-2xl font-black text-foreground">
                    {data.fullName}
                  </h1>
                  <Badge className={cn("text-xs font-normal", ROLE_BADGE_CLASS[data.role])}>
                    {ROLE_LABELS[data.role] || data.role}
                  </Badge>
                  {data.isActive !== false ? (
                    <Badge variant="outline" className="text-xs bg-emerald-50 text-emerald-700 border-emerald-300">
                      حساب فعال
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-xs bg-rose-50 text-rose-700 border-rose-300">
                      مسدود شده
                    </Badge>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground mt-1">
                  <span className="font-mono">نام کاربری: @{data.username}</span>
                  {employee?.personnelCode && (
                    <span className="font-mono">کد پرسنلی: {employee.personnelCode}</span>
                  )}
                  {employee?.jobTitle && (
                    <span className="font-bold text-foreground">سمت: {employee.jobTitle}</span>
                  )}
                  {employee?.department?.name && (
                    <Badge variant="secondary" className="text-[11px] h-5">
                      {employee.department.name}
                    </Badge>
                  )}
                </div>
              </div>
            </div>

            {/* کارت‌های خلاصه مالی و وظایف سریع */}
            <div className="flex items-center gap-3 w-full md:w-auto">
              <div className="flex-1 md:flex-initial rounded-xl bg-card border border-border p-3 text-center min-w-[120px]">
                <p className="text-[11px] text-muted-foreground font-medium">تسک‌های منتظر اقدام</p>
                <p className="text-xl font-bold mt-1 text-primary">{toFa(assignedTasks.length)}</p>
              </div>

              {activeContract && (
                <div className="flex-1 md:flex-initial rounded-xl bg-emerald-500/10 border border-emerald-500/20 p-3 text-center min-w-[140px]">
                  <p className="text-[11px] text-emerald-800 font-medium">ناخالص حکم جاری</p>
                  <p className="text-sm font-black mt-1 text-emerald-700 font-mono">
                    {money(grossSalary)} <span className="text-[10px]">ریال</span>
                  </p>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* تب‌های اصلی محتوا */}
      <Tabs defaultValue="tasks" className="w-full">
        <TabsList className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 h-auto p-1 bg-muted/60 rounded-xl gap-1">
          <TabsTrigger value="tasks" className="gap-1.5 py-2.5 text-xs font-bold">
            <ClipboardList className="size-3.5 text-blue-600" />
            وظایف و تسک‌ها
            {assignedTasks.length > 0 && (
              <Badge variant="secondary" className="text-[10px] h-4.5 px-1 font-mono">
                {toFa(assignedTasks.length)}
              </Badge>
            )}
          </TabsTrigger>

          <TabsTrigger value="contract" className="gap-1.5 py-2.5 text-xs font-bold">
            <FileText className="size-3.5 text-emerald-600" />
            حکم حقوق و مزایا
          </TabsTrigger>

          <TabsTrigger value="payroll" className="gap-1.5 py-2.5 text-xs font-bold">
            <Receipt className="size-3.5 text-amber-600" />
            فیش‌های حقوقی
            {payrollSlips.length > 0 && (
              <Badge variant="secondary" className="text-[10px] h-4.5 px-1 font-mono">
                {toFa(payrollSlips.length)}
              </Badge>
            )}
          </TabsTrigger>

          <TabsTrigger value="leaves" className="gap-1.5 py-2.5 text-xs font-bold">
            <CalendarDays className="size-3.5 text-teal-600" />
            مرخصی و کاردکس
          </TabsTrigger>

          <TabsTrigger value="advances" className="gap-1.5 py-2.5 text-xs font-bold">
            <Wallet className="size-3.5 text-emerald-600" />
            مساعده و وام
          </TabsTrigger>

          <TabsTrigger value="duties" className="gap-1.5 py-2.5 text-xs font-bold">
            <Briefcase className="size-3.5 text-indigo-600" />
            شرح وظایف سازمانی
          </TabsTrigger>

          <TabsTrigger value="notifications" className="gap-1.5 py-2.5 text-xs font-bold">
            <Bell className="size-3.5 text-purple-600" />
            پیام‌های مدیر
            {notifications.length > 0 && (
              <Badge variant="secondary" className="text-[10px] h-4.5 px-1 font-mono">
                {toFa(notifications.length)}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        {/* ───────────────── تب ۱: وظایف و تسک‌های من ───────────────── */}
        <TabsContent value="tasks" className="mt-4">
          <Card className="border-border/80 shadow-xs">
            <CardHeader className="p-4 border-b border-border/80 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                  <ClipboardList className="size-4 text-primary" />
                  وظایف محول شده به من (Work Tasks)
                </CardTitle>
                <CardDescription className="text-xs mt-1">
                  کارهای عملیاتی و تسک‌های ارجاع‌شده توسط مدیران سیستم
                </CardDescription>
              </div>
              <Link href="/admin/inbox">
                <Button variant="ghost" size="sm" className="text-xs gap-1 text-primary">
                  ورود به کارتابل وظایف
                  <ChevronLeft className="size-3.5" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent className="p-4">
              {assignedTasks.length === 0 ? (
                <div className="py-12 text-center text-muted-foreground flex flex-col items-center justify-center gap-2">
                  <CheckCircle2 className="size-10 text-emerald-500/40" />
                  <p className="text-xs font-medium">عالی است! در حال حاضر هیچ وظیفه منتظر اقدامی به شما ارجاع داده نشده است.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {assignedTasks.map((t: any) => (
                    <div
                      key={t.id}
                      className="p-3.5 rounded-xl border border-border/80 bg-card hover:border-primary/40 transition-all flex flex-col justify-between gap-3 shadow-2xs"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-xs text-foreground">
                              {t.kind === "PICK" ? "برداشت کالا از قفسه (PICK)" :
                               t.kind === "PUTAWAY" ? "چیدمان ورودی در انبار (PUTAWAY)" : "وظیفه عملیاتی"}
                            </span>
                            {t.priority === "URGENT" && (
                              <Badge className="bg-rose-100 text-rose-700 text-[10px] font-bold">
                                فوری
                              </Badge>
                            )}
                          </div>
                          {t.note && (
                            <p className="text-xs text-muted-foreground leading-relaxed">
                              {t.note}
                            </p>
                          )}
                        </div>
                        <Badge variant="outline" className="text-[10px]">
                          {t.status === "PENDING" ? "در انتظار" :
                           t.status === "IN_PROGRESS" ? "در حال انجام" : t.status}
                        </Badge>
                      </div>

                      {t.items && t.items.length > 0 && (
                        <div className="text-[11px] text-muted-foreground bg-muted/30 p-2 rounded-lg font-mono">
                          شامل {toFa(t.items.length)} قلم کالای عملیاتی
                        </div>
                      )}

                      <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-2 border-t border-border/40">
                        <span>ارسال توسط: {t.requestedBy?.fullName || "مدیریت"}</span>
                        <span>{faDate(t.createdAt)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ───────────────── تب ۲: حکم حقوق و مزایا ───────────────── */}
        <TabsContent value="contract" className="mt-4">
          {!employee ? (
            <Card className="p-8 text-center border-amber-200 bg-amber-50/30">
              <AlertCircle className="size-8 text-amber-600 mx-auto mb-2" />
              <h3 className="text-sm font-bold text-amber-900">پرونده پرسنلی متصل نیست</h3>
              <p className="text-xs text-amber-700 mt-1">
                حساب کاربری شما هنوز به یک پرونده کارگزینی در بخش منابع انسانی متصل نشده است.
                لطفاً از مدیر سیستم بخواهید پرونده پرسنلی شما را به این حساب متصل کند.
              </p>
            </Card>
          ) : !activeContract ? (
            <Card className="p-8 text-center text-muted-foreground">
              <FileText className="size-8 text-muted-foreground/40 mx-auto mb-2" />
              <h3 className="text-sm font-bold">حکم کارگزینی فعالی ثبت نشده است</h3>
              <p className="text-xs mt-1">
                هنوز حکم کارگزینی سالانه یا قرارداد استخدامی فعالی برای شما صادر نشده است.
              </p>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {/* خلاصه کل دریافتی */}
              <Card className="md:col-span-1 border-emerald-500/30 bg-emerald-500/5 shadow-xs flex flex-col justify-between">
                <CardHeader className="p-5 pb-2">
                  <Badge variant="outline" className="w-fit bg-emerald-100 text-emerald-800 border-emerald-300 text-xs">
                    حکم کارگزینی معتبر
                  </Badge>
                  <CardTitle className="text-base font-black mt-2">
                    {activeContract.decreeTitle || "حکم برقراری حقوق و مزایای استخدامی"}
                  </CardTitle>
                  <CardDescription className="text-xs font-mono">
                    شماره حکم: {activeContract.contractNumber}
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-5 pt-0">
                  <div className="p-4 rounded-xl bg-card border border-emerald-500/20 mt-3">
                    <span className="text-xs text-muted-foreground font-medium">مجموع ناخالص ماهانه مصوب:</span>
                    <div className="text-2xl font-black text-emerald-700 font-mono mt-1">
                      {money(grossSalary)} <span className="text-xs font-normal">ریال</span>
                    </div>
                  </div>

                  <div className="mt-4 space-y-2 text-xs text-muted-foreground">
                    <div className="flex justify-between">
                      <span>تاریخ شروع اجرا:</span>
                      <strong className="text-foreground">{faDate(activeContract.startDate)}</strong>
                    </div>
                    {activeContract.endDate && (
                      <div className="flex justify-between">
                        <span>تاریخ پایان اعتبار:</span>
                        <strong className="text-foreground">{faDate(activeContract.endDate)}</strong>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span>شماره بیمه تأمین اجتماعی:</span>
                      <strong className="text-foreground font-mono">{employee.insuranceNumber || "—"}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span>شماره شبا بانکی:</span>
                      <strong className="text-foreground font-mono text-[10px]">{employee.iban || "—"}</strong>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* ریز اقلام و مزایای قانونی */}
              <Card className="md:col-span-2 border-border/80 shadow-xs">
                <CardHeader className="p-4 border-b border-border/80">
                  <CardTitle className="text-sm font-bold flex items-center gap-2">
                    <Sparkles className="size-4 text-amber-500" />
                    ریز اقلام و مزایای قانونی طبق مصوبه شورای عالی کار
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <table className="w-full text-right text-xs">
                    <tbody className="divide-y divide-border/60">
                      <tr className="hover:bg-muted/30">
                        <td className="p-3 font-medium">دستمزد پایه ماهانه (۳۰ روزه)</td>
                        <td className="p-3 text-left font-mono font-bold text-foreground">
                          {money(activeContract.baseDailySalary * 30)} ریال
                        </td>
                      </tr>
                      <tr className="hover:bg-muted/30">
                        <td className="p-3 font-medium">بن خواربار و اقلام مصرفی</td>
                        <td className="p-3 text-left font-mono font-bold text-foreground">
                          {money(activeContract.groceryAllowance || 0)} ریال
                        </td>
                      </tr>
                      <tr className="hover:bg-muted/30">
                        <td className="p-3 font-medium">کمک هزینه مسکن</td>
                        <td className="p-3 text-left font-mono font-bold text-foreground">
                          {money(activeContract.housingAllowance || 0)} ریال
                        </td>
                      </tr>
                      <tr className="hover:bg-muted/30">
                        <td className="p-3 font-medium">کمک هزینه عائله‌مندی (حق تأهل)</td>
                        <td className="p-3 text-left font-mono font-bold text-foreground">
                          {money(activeContract.maritalAllowance || 0)} ریال
                        </td>
                      </tr>
                      <tr className="hover:bg-muted/30">
                        <td className="p-3 font-medium">
                          حق اولاد ({toFa(employee.childrenCount || 0)} فرزند تحت تکفل)
                        </td>
                        <td className="p-3 text-left font-mono font-bold text-foreground">
                          {money((activeContract.childAllowancePerChild || 0) * (employee.childrenCount || 0))} ریال
                        </td>
                      </tr>
                      {activeContract.seniorityAllowance > 0 && (
                        <tr className="hover:bg-muted/30">
                          <td className="p-3 font-medium">پایه سنوات تجمیعی</td>
                          <td className="p-3 text-left font-mono font-bold text-foreground">
                            {money(activeContract.seniorityAllowance)} ریال
                          </td>
                        </tr>
                      )}
                      {activeContract.responsibilityAllowance > 0 && (
                        <tr className="hover:bg-muted/30">
                          <td className="p-3 font-medium">حق مسئولیت / سرپرستی / تخصص</td>
                          <td className="p-3 text-left font-mono font-bold text-foreground">
                            {money(activeContract.responsibilityAllowance)} ریال
                          </td>
                        </tr>
                      )}
                      <tr className="bg-primary/5 font-bold">
                        <td className="p-3 text-primary">مجموع ناخالص استحقاقی ماهانه</td>
                        <td className="p-3 text-left font-mono text-primary text-sm font-black">
                          {money(grossSalary)} ریال
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        {/* ───────────────── تب ۳: فیش‌های حقوقی ───────────────── */}
        <TabsContent value="payroll" className="mt-4">
          <Card className="border-border/80 shadow-xs">
            <CardHeader className="p-4 border-b border-border/80">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <Receipt className="size-4 text-primary" />
                سوابق فیش‌های حقوقی ماهانه صادر شده
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {payrollSlips.length === 0 ? (
                <div className="py-12 text-center text-muted-foreground flex flex-col items-center justify-center gap-2">
                  <Receipt className="size-8 text-muted-foreground/40" />
                  <p className="text-xs">هنوز فیش حقوقی برای دوره‌ای برای شما صادر نشده است.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-right text-xs">
                    <thead className="bg-muted/60 text-muted-foreground font-bold border-b border-border/80">
                      <tr>
                        <th className="py-3 px-4">دوره محاسباتی</th>
                        <th className="py-3 px-3">کارکرد (روز)</th>
                        <th className="py-3 px-3">اضافه کار (ساعت)</th>
                        <th className="py-3 px-3">جمع ناخالص</th>
                        <th className="py-3 px-3">بیمه سهم کارگر (۷٪)</th>
                        <th className="py-3 px-3">مالیات حقوق</th>
                        <th className="py-3 px-3">سایر کسورات</th>
                        <th className="py-3 px-4 text-left">خالص پرداختی نهایی</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/60 font-medium">
                      {payrollSlips.map((slip: any) => (
                        <tr key={slip.id} className="hover:bg-muted/30">
                          <td className="py-3 px-4 font-bold text-foreground">
                            {slip.period?.title || `${slip.period?.month || "—"} / ${slip.period?.year || "۱۴۰۴"}`}
                          </td>
                          <td className="py-3 px-3 font-mono">{toFa(slip.workingDays)} روز</td>
                          <td className="py-3 px-3 font-mono">{toFa(slip.overtimeHours || 0)} ساعت</td>
                          <td className="py-3 px-3 font-mono text-muted-foreground">{money(slip.grossSalary)}</td>
                          <td className="py-3 px-3 font-mono text-rose-600">{money(slip.insuranceDeduction)}</td>
                          <td className="py-3 px-3 font-mono text-rose-600">{money(slip.taxDeduction)}</td>
                          <td className="py-3 px-3 font-mono text-rose-600">
                            {money((slip.loanDeductions || 0) + (slip.otherDeductions || 0))}
                          </td>
                          <td className="py-3 px-4 text-left font-mono font-black text-emerald-700 text-sm">
                            {money(slip.netPay)} ریال
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ───────────────── تب مرخصی‌ها و کاردکس ───────────────── */}
        <TabsContent value="leaves" className="mt-4">
          <ProfileLeavesTab employee={employee} />
        </TabsContent>

        {/* ───────────────── تب مساعده و وام ───────────────── */}
        <TabsContent value="advances" className="mt-4">
          <ProfileAdvancesTab employee={employee} />
        </TabsContent>

        {/* ───────────────── تب ۴: شرح وظایف سازمانی ───────────────── */}
        <TabsContent value="duties" className="mt-4">
          <Card className="border-border/80 shadow-xs">
            <CardHeader className="p-4 border-b border-border/80">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <Briefcase className="size-4 text-primary" />
                شرح وظایف و اختیارات سازمانی
              </CardTitle>
            </CardHeader>
            <CardContent className="p-5 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-3.5 rounded-xl border border-border bg-muted/20">
                  <span className="text-xs text-muted-foreground font-medium">عنوان سمت سازمانی:</span>
                  <p className="text-sm font-bold text-foreground mt-1">
                    {employee?.jobTitle || ROLE_LABELS[data.role] || "پرسنل رسمی"}
                  </p>
                </div>
                <div className="p-3.5 rounded-xl border border-border bg-muted/20">
                  <span className="text-xs text-muted-foreground font-medium">واحد و دپارتمان:</span>
                  <p className="text-sm font-bold text-foreground mt-1">
                    {employee?.department?.name || "ستاد مرکزی و عملیات کاردو"}
                  </p>
                </div>
              </div>

              <div className="p-4 rounded-xl border border-border bg-card">
                <h4 className="text-xs font-bold text-foreground mb-2 flex items-center gap-1.5">
                  <Shield className="size-3.5 text-primary" />
                  اختیارات و مجوزهای فعال در سیستم:
                </h4>
                {data.role === "ADMIN" ? (
                  <Badge className="bg-purple-100 text-purple-800 border-purple-200 text-xs">
                    دسترسی تام مدیر ارشد (دسترسی به تمامی ماژول‌ها و عملیات مالی و کارگزینی)
                  </Badge>
                ) : data.permissions && data.permissions.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {data.permissions.map((p: string) => (
                      <Badge key={p} variant="outline" className="text-[11px] bg-indigo-50/50 text-indigo-700 border-indigo-200">
                        {p}
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground">
                    دسترسی‌های استاندارد مبتنی بر نقش سازمانی ({ROLE_LABELS[data.role]}).
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ───────────────── تب ۵: پیام‌های مدیر ───────────────── */}
        <TabsContent value="notifications" className="mt-4">
          <Card className="border-border/80 shadow-xs">
            <CardHeader className="p-4 border-b border-border/80">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <Bell className="size-4 text-primary" />
                پیام‌ها و اعلان‌های دریافتی از مدیر سیستم
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              {notifications.length === 0 ? (
                <div className="py-12 text-center text-muted-foreground flex flex-col items-center justify-center gap-2">
                  <Bell className="size-8 text-muted-foreground/30" />
                  <p className="text-xs">هیچ اعلان یا پیام جدیدی از طرف مدیر برای شما وجود ندارد.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {notifications.map((n: any) => (
                    <div
                      key={n.id}
                      className={cn(
                        "p-3.5 rounded-xl border transition-colors flex items-start justify-between gap-3",
                        n.isRead ? "bg-card border-border" : "bg-primary/5 border-primary/30",
                      )}
                    >
                      <div className="flex flex-col gap-1">
                        <h4 className="text-xs font-bold text-foreground">{n.title}</h4>
                        <p className="text-xs text-muted-foreground leading-relaxed">{n.message}</p>
                        <span className="text-[10px] text-muted-foreground font-mono mt-1">
                          {faDate(n.createdAt)}
                        </span>
                      </div>
                      <Badge variant="outline" className="text-[10px]">
                        {n.type}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
