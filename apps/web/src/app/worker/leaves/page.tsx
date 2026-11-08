"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  CalendarDays,
  Clock,
  PlusCircle,
  FileText,
  CheckCircle2,
  XCircle,
  AlertCircle,
  ArrowRight,
  Camera,
  Upload,
  Calendar,
  User,
  ShieldCheck,
  ChevronLeft,
  Sparkles,
  Info,
  Loader2,
  Trash2,
} from "lucide-react";

import { useAuthStore } from "@/lib/auth-store";
import { getLeaves, getLeaveBalance, createLeave, getMyProfile } from "@/lib/api";
import { faDate, toFa } from "@/lib/format";
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

const LEAVE_TYPE_LABELS: Record<string, { label: string; color: string; desc: string }> = {
  DAILY: { label: "استحقاقی روزانه", color: "bg-emerald-100 text-emerald-800 border-emerald-200", desc: "کسر از مرخصی سالانه (۲.۵ روز در ماه)" },
  HOURLY: { label: "ساعتی", color: "bg-blue-100 text-blue-800 border-blue-200", desc: "هر ۸ ساعت معادل ۱ روز کاری" },
  SICK: { label: "استعلاجی (بیماری)", color: "bg-amber-100 text-amber-800 border-amber-200", desc: "همراه با الصاق گواهی پزشک" },
  UNPAID: { label: "بدون حقوق", color: "bg-purple-100 text-purple-800 border-purple-200", desc: "کسر کامل حقوق و مزایای روز" },
  MARRIAGE: { label: "ازدواج", color: "bg-rose-100 text-rose-800 border-rose-200", desc: "۳ روز مرخصی تشویقی با حقوق" },
  BEREAVEMENT: { label: "فوت بستگان درجه یک", color: "bg-zinc-100 text-zinc-800 border-zinc-200", desc: "۳ روز مرخصی تشویقی طبق قانون کار" },
  OTHER: { label: "سایر موارد", color: "bg-gray-100 text-gray-800 border-gray-200", desc: "نیازمند موافقت مدیر مستقیم" },
};

export default function WorkerLeavesPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { toast } = useToast();
  const qc = useQueryClient();

  const [isOpenNewLeave, setIsOpenNewLeave] = React.useState(false);
  const [leaveType, setLeaveType] = React.useState("DAILY");
  const [startDate, setStartDate] = React.useState("");
  const [endDate, setEndDate] = React.useState("");
  const [hours, setHours] = React.useState<number>(2);
  const [days, setDays] = React.useState<number>(1);
  const [reason, setReason] = React.useState("");
  const [medicalCertUrl, setMedicalCertUrl] = React.useState<string | null>(null);

  // دریافت اطلاعات پروفایل پرسنلی
  const profileQ = useQuery({
    queryKey: ["my-profile"],
    queryFn: getMyProfile,
  });

  const employeeId = profileQ.data?.employee?.id;

  // دریافت کاردکس مانده مرخصی
  const balanceQ = useQuery({
    queryKey: ["leave-balance", employeeId],
    queryFn: () => getLeaveBalance(employeeId!),
    enabled: !!employeeId,
  });

  // دریافت سوابق مرخصی
  const leavesQ = useQuery({
    queryKey: ["my-leaves", employeeId],
    queryFn: () => getLeaves({ employeeId: employeeId! }),
    enabled: !!employeeId,
  });

  // ارسال درخواست مرخصی
  const createMutation = useMutation({
    mutationFn: createLeave,
    onSuccess: () => {
      toast({
        title: "درخواست مرخصی ثبت شد",
        description: "درخواست شما جهت بررسی و تایید به مدیر ارجاع گردید.",
      });
      setIsOpenNewLeave(false);
      resetForm();
      qc.invalidateQueries({ queryKey: ["my-leaves"] });
      qc.invalidateQueries({ queryKey: ["leave-balance"] });
    },
    onError: (err: any) => {
      toast({
        variant: "destructive",
        title: "خطا در ثبت درخواست",
        description: err.message || "لطفاً ورودی‌ها را بررسی و مجدداً تلاش نمایید.",
      });
    },
  });

  function resetForm() {
    setLeaveType("DAILY");
    setStartDate("");
    setEndDate("");
    setHours(2);
    setDays(1);
    setReason("");
    setMedicalCertUrl(null);
  }

  function handlePhotoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast({
        variant: "destructive",
        title: "حجم فایل بالاست",
        description: "حداکثر حجم تصویر گواهی پزشکی ۵ مگابایت است.",
      });
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setMedicalCertUrl(reader.result as string);
      toast({
        title: "تصویر گواهی ضمیمه شد",
        description: "عکس با موفقیت به درخواست اضافه گردید.",
      });
    };
    reader.readAsDataURL(file);
  }

  function handleSubmit() {
    if (!employeeId) {
      toast({
        variant: "destructive",
        title: "پرونده پرسنلی یافت نشد",
        description: "حساب کاربری شما هنوز به پرونده پرسنلی در کارگزینی متصل نشده است.",
      });
      return;
    }

    if (!startDate) {
      toast({
        variant: "destructive",
        title: "تاریخ شروع الزامی است",
      });
      return;
    }

    createMutation.mutate({
      employeeId,
      leaveType,
      startDate: new Date(startDate).toISOString(),
      endDate: endDate ? new Date(endDate).toISOString() : new Date(startDate).toISOString(),
      hours: leaveType === "HOURLY" ? Number(hours) : undefined,
      days: leaveType === "HOURLY" ? 0 : Number(days),
      reason,
      medicalCertUrl: medicalCertUrl || undefined,
    });
  }

  const balance = balanceQ.data;
  const leaves = leavesQ.data || [];

  return (
    <div className="flex flex-1 flex-col min-h-screen bg-muted/20 font-sans pb-10">
      {/* ───────────────────────── هدر موبایل ───────────────────────── */}
      <header className="sticky top-0 z-30 flex items-center justify-between border-b bg-background/95 px-4 py-3 backdrop-blur-md shadow-2xs">
        <div className="flex items-center gap-3">
          <Link
            href="/worker"
            className="flex size-9 items-center justify-center rounded-xl bg-muted/60 text-muted-foreground hover:text-foreground transition-colors"
          >
            <ChevronLeft className="size-5 rotate-180" />
          </Link>
          <div>
            <h1 className="text-base font-black text-foreground">درخواست مرخصی و کاردکس</h1>
            <p className="text-[11px] text-muted-foreground">ثبت مرخصی ساعتی، روزانه، استعلاجی و رهگیری مانده</p>
          </div>
        </div>

        <Button
          size="sm"
          onClick={() => setIsOpenNewLeave(true)}
          className="h-8 rounded-xl font-bold gap-1 text-xs shadow-xs"
        >
          <PlusCircle className="size-3.5" />
          درخواست جدید
        </Button>
      </header>

      <main className="flex flex-1 flex-col gap-4 p-4 max-w-2xl mx-auto w-full">
        {/* ───────────────────────── کارت کاردکس مانده مرخصی سالانه ───────────────────────── */}
        <Card className="border-2 border-primary/20 bg-gradient-to-br from-card via-card to-primary/[0.04] shadow-sm rounded-2xl overflow-hidden">
          <CardHeader className="p-4 pb-2 border-b border-border/40">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-black flex items-center gap-2 text-foreground">
                <CalendarDays className="size-4 text-primary" />
                کاردکس مرخصی سال ۱۴۰۳ (قانون کار)
              </CardTitle>
              <Badge variant="outline" className="text-[10px] bg-primary/10 text-primary border-primary/30 font-bold">
                ۲.۵ روز در ماه
              </Badge>
            </div>
            <CardDescription className="text-xs">
              سهمیه قانونی سالانه: ۳۰ روز استحقاقی با احتساب روزهای جمعه و تعطیلات رسمی
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4">
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="p-3 rounded-xl bg-background border border-border/60">
                <p className="text-[11px] text-muted-foreground font-medium">سهمیه کل سال</p>
                <p className="text-lg font-black text-foreground mt-1">
                  {toFa(balance?.totalEntitledDays ?? 30)} <span className="text-[10px] font-normal">روز</span>
                </p>
              </div>

              <div className="p-3 rounded-xl bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-900/40">
                <p className="text-[11px] text-amber-800 dark:text-amber-300 font-medium">استفاده شده</p>
                <p className="text-lg font-black text-amber-700 dark:text-amber-400 mt-1">
                  {toFa(balance?.usedDays ?? 0)} <span className="text-[10px] font-normal">روز</span>
                </p>
                {balance && balance.usedHourlyHours > 0 && (
                  <p className="text-[10px] text-amber-600 mt-0.5 font-mono">
                    +{toFa(balance.usedHourlyHours)} ساعت ساعتی
                  </p>
                )}
              </div>

              <div className="p-3 rounded-xl bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200/60 dark:border-emerald-900/40">
                <p className="text-[11px] text-emerald-800 dark:text-emerald-300 font-medium">مانده قابل استفاده</p>
                <p className="text-lg font-black text-emerald-700 dark:text-emerald-400 mt-1">
                  {toFa(balance?.remainingDays ?? 30)} <span className="text-[10px] font-normal">روز</span>
                </p>
              </div>
            </div>

            {balance && balance.sickDays > 0 && (
              <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground bg-muted/40 p-2.5 rounded-xl border border-border/50">
                <span>مرخصی‌های استعلاجی تاییدشده با تایید بیمه تامین اجتماعی:</span>
                <span className="font-bold text-foreground">{toFa(balance.sickDays)} روز</span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* ───────────────────────── سوابق مرخصی‌های پرسنل ───────────────────────── */}
        <div className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-sm font-black text-foreground flex items-center gap-2">
              <Clock className="size-4 text-muted-foreground" />
              سوابق و وضعیت درخواست‌ها ({toFa(leaves.length)})
            </h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                qc.invalidateQueries({ queryKey: ["my-leaves"] });
                qc.invalidateQueries({ queryKey: ["leave-balance"] });
              }}
              className="h-7 text-[11px] text-muted-foreground hover:text-foreground"
            >
              به‌روزرسانی
            </Button>
          </div>

          {leavesQ.isLoading ? (
            <div className="py-12 text-center text-muted-foreground flex flex-col items-center justify-center gap-2">
              <Loader2 className="size-8 text-primary animate-spin" />
              <p className="text-xs">در حال بارگذاری کاردکس و سوابق مرخصی...</p>
            </div>
          ) : leaves.length === 0 ? (
            <Card className="p-8 text-center border-dashed rounded-2xl bg-card">
              <Calendar className="size-10 text-muted-foreground/30 mx-auto mb-2" />
              <p className="text-sm font-bold text-foreground">تاکنون هیچ درخواست مرخصی ثبت نشده است</p>
              <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
                هر زمان نیاز به مرخصی روزانه، ساعتی یا استعلاجی داشتید، روی دکمه درخواست جدید کلیک کنید.
              </p>
              <Button
                size="sm"
                onClick={() => setIsOpenNewLeave(true)}
                className="mt-4 rounded-xl text-xs font-bold"
              >
                ثبت اولین مرخصی
              </Button>
            </Card>
          ) : (
            <div className="space-y-3">
              {leaves.map((leave) => {
                const typeInfo = LEAVE_TYPE_LABELS[leave.leaveType] || {
                  label: leave.leaveType,
                  color: "bg-gray-100 text-gray-800",
                  desc: "",
                };

                return (
                  <Card key={leave.id} className="rounded-2xl border border-border/80 shadow-2xs overflow-hidden">
                    <CardContent className="p-4 space-y-3">
                      {/* هدر کارت: نوع مرخصی و وضعیت */}
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge variant="outline" className={cn("text-xs font-bold px-2.5 py-0.5", typeInfo.color)}>
                            {typeInfo.label}
                          </Badge>
                          <span className="text-xs font-bold text-foreground">
                            {leave.leaveType === "HOURLY"
                              ? `${toFa(leave.hours)} ساعت`
                              : `${toFa(leave.days)} روز`}
                          </span>
                        </div>

                        {leave.status === "APPROVED" && (
                          <Badge className="bg-emerald-600 text-white text-[11px] font-bold gap-1">
                            <CheckCircle2 className="size-3" />
                            تایید شده
                          </Badge>
                        )}
                        {leave.status === "PENDING" && (
                          <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-300 text-[11px] font-bold gap-1">
                            <Clock className="size-3" />
                            در انتظار تایید مدیر
                          </Badge>
                        )}
                        {leave.status === "REJECTED" && (
                          <Badge variant="outline" className="bg-rose-50 text-rose-700 border-rose-300 text-[11px] font-bold gap-1">
                            <XCircle className="size-3" />
                            عدم موافقت
                          </Badge>
                        )}
                      </div>

                      {/* بازه تاریخ */}
                      <div className="flex items-center gap-4 text-xs text-muted-foreground bg-muted/30 p-2.5 rounded-xl font-mono">
                        <div>
                          <span className="text-muted-foreground/70">از: </span>
                          <span className="text-foreground font-bold">{faDate(leave.startDate)}</span>
                        </div>
                        {leave.endDate && leave.endDate !== leave.startDate && (
                          <div>
                            <span className="text-muted-foreground/70">تا: </span>
                            <span className="text-foreground font-bold">{faDate(leave.endDate)}</span>
                          </div>
                        )}
                        <span className="text-[11px] text-muted-foreground/60 mr-auto">
                          ثبت: {faDate(leave.createdAt)}
                        </span>
                      </div>

                      {/* علت مرخصی */}
                      {leave.reason && (
                        <p className="text-xs text-foreground/90 leading-relaxed bg-card p-2 rounded-lg border border-border/40">
                          <span className="font-bold text-muted-foreground">علت: </span>
                          {leave.reason}
                        </p>
                      )}

                      {/* تصویر گواهی پزشکی ضمیمه شده */}
                      {leave.medicalCertUrl && (
                        <div className="space-y-1">
                          <span className="text-[11px] font-bold text-muted-foreground">تصویر پیوست گواهی پزشکی:</span>
                          <div className="relative rounded-xl overflow-hidden border border-border/80 max-h-48 bg-black/5">
                            <img
                              src={leave.medicalCertUrl}
                              alt="گواهی پزشکی"
                              className="w-full h-auto object-contain max-h-48"
                            />
                          </div>
                        </div>
                      )}

                      {/* یادداشت و نتیجه بررسی مدیر */}
                      {leave.status !== "PENDING" && (
                        <div className="text-[11px] p-2.5 rounded-xl bg-muted/40 border border-border/50 flex flex-col gap-1">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-foreground">
                              بررسی‌کننده: {leave.approvedBy?.fullName || "مدیریت کارگاه/انبار"}
                            </span>
                            {leave.approvedAt && (
                              <span className="text-muted-foreground">{faDate(leave.approvedAt)}</span>
                            )}
                          </div>
                          {leave.managerNotes && (
                            <p className="text-muted-foreground leading-normal">
                              نظر مدیر: {leave.managerNotes}
                            </p>
                          )}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </main>

      {/* ───────────────────────── دیالوگ ثبت مرخصی جدید ───────────────────────── */}
      <Dialog open={isOpenNewLeave} onOpenChange={setIsOpenNewLeave}>
        <DialogContent className="max-w-md w-full rounded-3xl p-5 select-none" dir="rtl">
          <DialogHeader className="text-start">
            <DialogTitle className="text-base font-black flex items-center gap-2">
              <CalendarDays className="size-5 text-primary" />
              ثبت فرم مرخصی جدید
            </DialogTitle>
            <DialogDescription className="text-xs">
              درخواست شما بلافاصله در کارتابل سرپرست کارگاه و واحد منابع انسانی ظاهر خواهد شد.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2 text-start">
            {/* انتخاب نوع مرخصی */}
            <div className="space-y-1.5">
              <Label className="text-xs font-bold">نوع مرخصی:</Label>
              <Select value={leaveType} onValueChange={setLeaveType}>
                <SelectTrigger className="h-10 rounded-xl text-xs">
                  <SelectValue placeholder="انتخاب نوع مرخصی" />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  {Object.entries(LEAVE_TYPE_LABELS).map(([k, v]) => (
                    <SelectItem key={k} value={k} className="text-xs py-2">
                      <div className="flex flex-col">
                        <span className="font-bold">{v.label}</span>
                        <span className="text-[10px] text-muted-foreground">{v.desc}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* تاریخ شروع */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold">از تاریخ:</Label>
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="h-10 rounded-xl text-xs font-mono"
                />
              </div>

              {leaveType === "HOURLY" ? (
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold">مدت مرخصی (ساعت):</Label>
                  <Input
                    type="number"
                    min={1}
                    max={8}
                    value={hours}
                    onChange={(e) => setHours(Number(e.target.value))}
                    className="h-10 rounded-xl text-xs font-bold font-mono"
                  />
                </div>
              ) : (
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold">تا تاریخ:</Label>
                  <Input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="h-10 rounded-xl text-xs font-mono"
                  />
                </div>
              )}
            </div>

            {leaveType !== "HOURLY" && (
              <div className="space-y-1.5">
                <Label className="text-xs font-bold">تعداد روز مرخصی:</Label>
                <Input
                  type="number"
                  min={1}
                  max={30}
                  value={days}
                  onChange={(e) => setDays(Number(e.target.value))}
                  className="h-10 rounded-xl text-xs font-bold font-mono"
                />
              </div>
            )}

            {/* علت مرخصی */}
            <div className="space-y-1.5">
              <Label className="text-xs font-bold">علت و توضیحات:</Label>
              <Textarea
                placeholder="توضیح کوتاه در مورد علت درخواست مرخصی..."
                rows={2}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="rounded-xl text-xs resize-none"
              />
            </div>

            {/* در صورت استعلاجی بودن: آپلود مستقیم گواهی پزشکی با دوربین گوشی */}
            {leaveType === "SICK" && (
              <div className="space-y-2 p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-bold text-amber-900 dark:text-amber-300 flex items-center gap-1.5">
                    <Camera className="size-4 text-amber-700" />
                    عکاسی / الصاق گواهی پزشک
                  </Label>
                  {medicalCertUrl && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setMedicalCertUrl(null)}
                      className="h-6 text-[10px] text-rose-600 hover:text-rose-700 p-1"
                    >
                      <Trash2 className="size-3 mr-1" />
                      حذف عکس
                    </Button>
                  )}
                </div>

                {medicalCertUrl ? (
                  <div className="relative rounded-xl overflow-hidden border border-amber-500/30 max-h-36 bg-black/10">
                    <img
                      src={medicalCertUrl}
                      alt="گواهی پزشکی"
                      className="w-full h-auto object-contain max-h-36"
                    />
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center border-2 border-dashed border-amber-500/40 rounded-xl p-4 cursor-pointer hover:bg-amber-500/5 transition-colors">
                    <Camera className="size-6 text-amber-600 mb-1" />
                    <span className="text-xs font-bold text-foreground">گرفتن عکس با دوربین گوشی</span>
                    <span className="text-[10px] text-muted-foreground mt-0.5">یا انتخاب عکس گواهی نسخه پزشک</span>
                    <input
                      type="file"
                      accept="image/*"
                      capture="environment"
                      onChange={handlePhotoUpload}
                      className="hidden"
                    />
                  </label>
                )}
              </div>
            )}
          </div>

          <DialogFooter className="gap-2 sm:gap-0 pt-2 border-t border-border/40">
            <Button
              variant="outline"
              onClick={() => setIsOpenNewLeave(false)}
              className="rounded-xl text-xs font-bold h-10"
            >
              انصراف
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={createMutation.isPending}
              className="rounded-xl text-xs font-bold h-10 gap-1.5 shadow-sm"
            >
              {createMutation.isPending && <Loader2 className="size-3.5 animate-spin" />}
              ثبت و ارسال درخواست
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
