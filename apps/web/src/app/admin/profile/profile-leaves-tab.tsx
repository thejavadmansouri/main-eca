"use client";

import * as React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  CalendarDays,
  Clock,
  PlusCircle,
  Camera,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Loader2,
  Trash2,
  Calendar,
} from "lucide-react";

import { getLeaves, getLeaveBalance, createLeave } from "@/lib/api";
import { EmployeeRow, EmployeeLeaveRow } from "@/lib/types";
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

const LEAVE_TYPE_LABELS: Record<string, { label: string; color: string }> = {
  DAILY: { label: "استحقاقی روزانه", color: "bg-emerald-100 text-emerald-800 border-emerald-200" },
  HOURLY: { label: "ساعتی", color: "bg-blue-100 text-blue-800 border-blue-200" },
  SICK: { label: "استعلاجی (بیماری)", color: "bg-amber-100 text-amber-800 border-amber-200" },
  UNPAID: { label: "بدون حقوق", color: "bg-purple-100 text-purple-800 border-purple-200" },
  MARRIAGE: { label: "ازدواج", color: "bg-rose-100 text-rose-800 border-rose-200" },
  BEREAVEMENT: { label: "فوت بستگان", color: "bg-zinc-100 text-zinc-800 border-zinc-200" },
  OTHER: { label: "سایر", color: "bg-gray-100 text-gray-800 border-gray-200" },
};

export function ProfileLeavesTab({ employee }: { employee?: EmployeeRow | null }) {
  const { toast } = useToast();
  const qc = useQueryClient();

  const [isOpenModal, setIsOpenModal] = React.useState(false);
  const [leaveType, setLeaveType] = React.useState("DAILY");
  const [startDate, setStartDate] = React.useState("");
  const [endDate, setEndDate] = React.useState("");
  const [hours, setHours] = React.useState<number>(2);
  const [days, setDays] = React.useState<number>(1);
  const [reason, setReason] = React.useState("");
  const [medicalCertUrl, setMedicalCertUrl] = React.useState<string | null>(null);

  const employeeId = employee?.id;

  // کاردکس مانده مرخصی
  const balanceQ = useQuery({
    queryKey: ["profile-leave-balance", employeeId],
    queryFn: () => getLeaveBalance(employeeId!),
    enabled: !!employeeId,
  });

  // سوابق مرخصی
  const leavesQ = useQuery({
    queryKey: ["profile-leaves", employeeId],
    queryFn: () => getLeaves({ employeeId: employeeId! }),
    enabled: !!employeeId,
  });

  const createMutation = useMutation({
    mutationFn: createLeave,
    onSuccess: () => {
      toast({
        title: "درخواست مرخصی ثبت شد",
        description: "درخواست شما جهت تایید به مدیر سیستم ارجاع گردید.",
      });
      setIsOpenModal(false);
      resetForm();
      qc.invalidateQueries({ queryKey: ["profile-leaves"] });
      qc.invalidateQueries({ queryKey: ["profile-leave-balance"] });
    },
    onError: (err: any) => {
      toast({
        variant: "destructive",
        title: "خطا در ثبت مرخصی",
        description: err.message || "لطفاً ورودی‌ها را بررسی نمایید.",
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
        description: "حداکثر حجم تصویر ۵ مگابایت است.",
      });
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setMedicalCertUrl(reader.result as string);
    };
    reader.readAsDataURL(file);
  }

  function handleSubmit() {
    if (!employeeId) {
      toast({
        variant: "destructive",
        title: "پرونده پرسنلی یافت نشد",
        description: "حساب کاربری شما هنوز به پرونده پرسنلی متصل نیست.",
      });
      return;
    }

    if (!startDate) {
      toast({ variant: "destructive", title: "تاریخ شروع الزامی است" });
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
  const leaves = leavesQ.data || employee?.leaves || [];

  return (
    <div className="space-y-4">
      {/* ───────────────────────── کارت کاردکس مرخصی ───────────────────────── */}
      <Card className="border-2 border-primary/20 bg-gradient-to-br from-card via-card to-primary/[0.04] shadow-xs">
        <CardHeader className="p-4 pb-2 border-b border-border/40 flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <CalendarDays className="size-4 text-primary" />
              کاردکس مانده مرخصی سالانه (قانون کار)
            </CardTitle>
            <CardDescription className="text-xs">
              سهمیه قانونی سالانه: ۳۰ روز استحقاقی با حقوق (۲.۵ روز در ماه)
            </CardDescription>
          </div>
          <Button
            size="sm"
            onClick={() => setIsOpenModal(true)}
            className="gap-1.5 text-xs font-bold rounded-xl shadow-xs"
          >
            <PlusCircle className="size-3.5" />
            ثبت درخواست مرخصی
          </Button>
        </CardHeader>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-center">
            <div className="p-3 rounded-xl bg-background border border-border/60">
              <p className="text-[11px] text-muted-foreground font-medium">سهمیه کل سال</p>
              <p className="text-lg font-black text-foreground mt-1">
                {toFa(balance?.totalEntitledDays ?? 30)} <span className="text-[10px] font-normal">روز</span>
              </p>
            </div>
            <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-800">
              <p className="text-[11px] font-medium">استفاده شده</p>
              <p className="text-lg font-black mt-1">
                {toFa(balance?.usedDays ?? 0)} <span className="text-[10px] font-normal">روز</span>
              </p>
              {balance && balance.usedHourlyHours > 0 && (
                <p className="text-[10px] font-mono mt-0.5">+{toFa(balance.usedHourlyHours)} س ساعتی</p>
              )}
            </div>
            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-800">
              <p className="text-[11px] font-medium">مانده قابل استفاده</p>
              <p className="text-lg font-black mt-1">
                {toFa(balance?.remainingDays ?? 30)} <span className="text-[10px] font-normal">روز</span>
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ───────────────────────── سوابق مرخصی‌ها ───────────────────────── */}
      <Card className="border-border/80 shadow-xs">
        <CardHeader className="p-4 border-b border-border/80">
          <CardTitle className="text-sm font-bold flex items-center gap-2">
            <Clock className="size-4 text-primary" />
            سوابق درخواست‌های مرخصی من
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4">
          {leaves.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground flex flex-col items-center justify-center gap-2">
              <CalendarDays className="size-8 text-muted-foreground/30" />
              <p className="text-xs">تاکنون درخواست مرخصی برای شما ثبت نشده است.</p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {leaves.map((l: any) => {
                const meta = LEAVE_TYPE_LABELS[l.leaveType] || { label: l.leaveType, color: "bg-gray-100 text-gray-800" };

                return (
                  <div
                    key={l.id}
                    className="p-3.5 rounded-xl border border-border/80 bg-card flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-2xs"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className={cn("text-xs font-bold", meta.color)}>
                          {meta.label}
                        </Badge>
                        <span className="text-xs font-bold text-foreground">
                          {l.leaveType === "HOURLY" ? `${toFa(l.hours)} ساعت` : `${toFa(l.days)} روز`}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground font-mono">
                        {faDate(l.startDate)} {l.endDate && l.endDate !== l.startDate ? `تا ${faDate(l.endDate)}` : ""}
                        {l.reason ? ` — علت: ${l.reason}` : ""}
                      </p>
                      {l.managerNotes && (
                        <p className="text-[11px] text-amber-700 bg-amber-500/10 p-1.5 rounded-lg border border-amber-500/20">
                          نظر مدیر: {l.managerNotes}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-center">
                      {l.status === "APPROVED" && (
                        <Badge className="bg-emerald-600 text-white text-[11px] font-bold gap-1">
                          <CheckCircle2 className="size-3" />
                          تایید شده
                        </Badge>
                      )}
                      {l.status === "PENDING" && (
                        <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-300 text-[11px] font-bold gap-1">
                          <Clock className="size-3" />
                          در انتظار تایید
                        </Badge>
                      )}
                      {l.status === "REJECTED" && (
                        <Badge variant="outline" className="bg-rose-50 text-rose-700 border-rose-300 text-[11px] font-bold gap-1">
                          <XCircle className="size-3" />
                          رد شده
                        </Badge>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* ───────────────────────── دیالوگ ثبت مرخصی جدید ───────────────────────── */}
      <Dialog open={isOpenModal} onOpenChange={setIsOpenModal}>
        <DialogContent className="max-w-md w-full rounded-3xl p-5" dir="rtl">
          <DialogHeader className="text-start">
            <DialogTitle className="text-base font-black flex items-center gap-2">
              <CalendarDays className="size-5 text-primary" />
              ثبت تقاضای مرخصی جدید
            </DialogTitle>
            <DialogDescription className="text-xs">
              درخواست شما جهت موافقت برای مدیریت سیستم ارسال خواهد شد.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2 text-start">
            <div className="space-y-1.5">
              <Label className="text-xs font-bold">نوع مرخصی:</Label>
              <Select value={leaveType} onValueChange={setLeaveType}>
                <SelectTrigger className="h-10 rounded-xl text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  {Object.entries(LEAVE_TYPE_LABELS).map(([k, v]) => (
                    <SelectItem key={k} value={k} className="text-xs">
                      {v.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

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

            <div className="space-y-1.5">
              <Label className="text-xs font-bold">علت و توضیحات:</Label>
              <Textarea
                placeholder="توضیح کوتاه..."
                rows={2}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="rounded-xl text-xs resize-none"
              />
            </div>

            {leaveType === "SICK" && (
              <div className="space-y-2 p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
                    <Camera className="size-4 text-amber-700" />
                    عکس گواهی پزشک
                  </Label>
                  {medicalCertUrl && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setMedicalCertUrl(null)}
                      className="h-6 text-[10px] text-rose-600 p-1"
                    >
                      <Trash2 className="size-3 mr-1" />
                      حذف
                    </Button>
                  )}
                </div>

                {medicalCertUrl ? (
                  <div className="relative rounded-xl overflow-hidden border border-amber-500/30 max-h-36 bg-black/10">
                    <img src={medicalCertUrl} alt="گواهی" className="w-full h-auto object-contain max-h-36" />
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center border-2 border-dashed border-amber-500/40 rounded-xl p-3 cursor-pointer hover:bg-amber-500/5 transition-colors">
                    <Camera className="size-5 text-amber-600 mb-1" />
                    <span className="text-xs font-bold">بارگذاری عکس نسخه/گواهی</span>
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
              onClick={() => setIsOpenModal(false)}
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
              ارسال درخواست مرخصی
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
