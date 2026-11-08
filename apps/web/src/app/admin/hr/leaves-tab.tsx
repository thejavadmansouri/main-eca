"use client";

import * as React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  CalendarDays,
  CheckCircle2,
  XCircle,
  Clock,
  Search,
  Filter,
  Eye,
  Camera,
  FileText,
  AlertCircle,
  PlusCircle,
  Sparkles,
  User,
  Building2,
  Calendar,
  Loader2,
  Check,
  X,
  RefreshCw,
} from "lucide-react";

import { getLeaves, getLeaveBalance, updateLeaveStatus, createLeave } from "@/lib/api";
import { EmployeeRow, EmployeeLeaveRow, LeaveBalance } from "@/lib/types";
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

const LEAVE_TYPE_META: Record<string, { label: string; badge: string }> = {
  DAILY: { label: "استحقاقی روزانه", badge: "bg-emerald-100 text-emerald-800 border-emerald-200" },
  HOURLY: { label: "ساعتی", badge: "bg-blue-100 text-blue-800 border-blue-200" },
  SICK: { label: "استعلاجی (پزشکی)", badge: "bg-amber-100 text-amber-800 border-amber-200" },
  UNPAID: { label: "بدون حقوق", badge: "bg-purple-100 text-purple-800 border-purple-200" },
  MARRIAGE: { label: "ازدواج", badge: "bg-rose-100 text-rose-800 border-rose-200" },
  BEREAVEMENT: { label: "فوت بستگان", badge: "bg-zinc-100 text-zinc-800 border-zinc-200" },
  OTHER: { label: "سایر", badge: "bg-gray-100 text-gray-800 border-gray-200" },
};

export function LeavesTab({ employees }: { employees: EmployeeRow[] }) {
  const qc = useQueryClient();
  const { toast } = useToast();

  const [selectedEmpFilter, setSelectedEmpFilter] = React.useState<string>("ALL");
  const [statusFilter, setStatusFilter] = React.useState<string>("ALL");
  const [typeFilter, setTypeFilter] = React.useState<string>("ALL");
  const [searchQuery, setSearchQuery] = React.useState("");

  // بررسی و تایید/رد مرخصی
  const [reviewLeave, setReviewLeave] = React.useState<EmployeeLeaveRow | null>(null);
  const [reviewAction, setReviewAction] = React.useState<"APPROVED" | "REJECTED">("APPROVED");
  const [managerNote, setManagerNote] = React.useState("");

  // نمایش تصویر گواهی پزشکی
  const [previewCertUrl, setPreviewCertUrl] = React.useState<string | null>(null);

  // دیالوگ ثبت مرخصی جدید توسط مدیر
  const [isNewLeaveOpen, setIsNewLeaveOpen] = React.useState(false);
  const [manualEmpId, setManualEmpId] = React.useState("");
  const [manualType, setManualType] = React.useState("DAILY");
  const [manualStartDate, setManualStartDate] = React.useState("");
  const [manualEndDate, setManualEndDate] = React.useState("");
  const [manualHours, setManualHours] = React.useState<number>(2);
  const [manualDays, setManualDays] = React.useState<number>(1);
  const [manualReason, setManualReason] = React.useState("");

  // دیالوگ نمایش کاردکس یک پرسنل
  const [cardexEmpId, setCardexEmpId] = React.useState<string | null>(null);

  const leavesQ = useQuery({
    queryKey: ["admin-leaves", selectedEmpFilter, statusFilter, typeFilter],
    queryFn: () =>
      getLeaves({
        employeeId: selectedEmpFilter !== "ALL" ? selectedEmpFilter : undefined,
        status: statusFilter !== "ALL" ? statusFilter : undefined,
        leaveType: typeFilter !== "ALL" ? typeFilter : undefined,
      }),
  });

  const cardexQ = useQuery({
    queryKey: ["cardex-balance", cardexEmpId],
    queryFn: () => getLeaveBalance(cardexEmpId!),
    enabled: !!cardexEmpId,
  });

  const updateStatusMut = useMutation({
    mutationFn: ({ id, status, managerNotes }: { id: string; status: string; managerNotes?: string }) =>
      updateLeaveStatus(id, { status, managerNotes }),
    onSuccess: (_, vars) => {
      toast({
        title: vars.status === "APPROVED" ? "درخواست تایید شد" : "درخواست رد شد",
        description: "وضعیت مرخصی با موفقیت در پرونده پرسنل و کاردکس ثبت گردید.",
      });
      setReviewLeave(null);
      setManagerNote("");
      qc.invalidateQueries({ queryKey: ["admin-leaves"] });
      qc.invalidateQueries({ queryKey: ["cardex-balance"] });
    },
    onError: (err: any) => {
      toast({
        variant: "destructive",
        title: "خطا در ویرایش وضعیت",
        description: err.message || "عملیات با خطا مواجه شد.",
      });
    },
  });

  const createMut = useMutation({
    mutationFn: createLeave,
    onSuccess: () => {
      toast({
        title: "مرخصی ثبت شد",
        description: "مرخصی با موفقیت در پرونده پرسنل درج گردید.",
      });
      setIsNewLeaveOpen(false);
      resetManualForm();
      qc.invalidateQueries({ queryKey: ["admin-leaves"] });
      qc.invalidateQueries({ queryKey: ["cardex-balance"] });
    },
    onError: (err: any) => {
      toast({
        variant: "destructive",
        title: "خطا در ثبت مرخصی",
        description: err.message || "لطفاً اطلاعات را بازبینی فرمایید.",
      });
    },
  });

  function resetManualForm() {
    setManualEmpId("");
    setManualType("DAILY");
    setManualStartDate("");
    setManualEndDate("");
    setManualHours(2);
    setManualDays(1);
    setManualReason("");
  }

  function handleManualSubmit() {
    if (!manualEmpId) {
      toast({ variant: "destructive", title: "انتخاب پرسنل الزامی است" });
      return;
    }
    if (!manualStartDate) {
      toast({ variant: "destructive", title: "تاریخ شروع الزامی است" });
      return;
    }

    createMut.mutate({
      employeeId: manualEmpId,
      leaveType: manualType,
      startDate: new Date(manualStartDate).toISOString(),
      endDate: manualEndDate ? new Date(manualEndDate).toISOString() : new Date(manualStartDate).toISOString(),
      hours: manualType === "HOURLY" ? Number(manualHours) : undefined,
      days: manualType === "HOURLY" ? 0 : Number(manualDays),
      reason: manualReason,
    });
  }

  const allLeaves = leavesQ.data || [];
  const filteredLeaves = allLeaves.filter((l) => {
    if (!searchQuery) return true;
    const name = `${l.employee?.firstName || ""} ${l.employee?.lastName || ""}`.toLowerCase();
    const code = (l.employee?.personnelCode || "").toLowerCase();
    const reason = (l.reason || "").toLowerCase();
    const q = searchQuery.toLowerCase();
    return name.includes(q) || code.includes(q) || reason.includes(q);
  });

  const pendingCount = allLeaves.filter((l) => l.status === "PENDING").length;
  const approvedCount = allLeaves.filter((l) => l.status === "APPROVED").length;
  const sickCount = allLeaves.filter((l) => l.leaveType === "SICK").length;

  return (
    <div className="space-y-6">
      {/* ───────────────────────── کارت‌های آماری مرخصی ───────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
        <Card className="border-amber-200/80 bg-amber-500/[0.04]">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs text-amber-800 font-bold">درخواست‌های در انتظار بررسی</p>
              <p className="text-2xl font-black text-amber-700">{toFa(pendingCount)}</p>
            </div>
            <div className="size-11 rounded-2xl bg-amber-500/10 text-amber-700 flex items-center justify-center">
              <Clock className="size-6" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-emerald-200/80 bg-emerald-500/[0.04]">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs text-emerald-800 font-bold">مرخصی‌های تاییدشده</p>
              <p className="text-2xl font-black text-emerald-700">{toFa(approvedCount)}</p>
            </div>
            <div className="size-11 rounded-2xl bg-emerald-500/10 text-emerald-700 flex items-center justify-center">
              <CheckCircle2 className="size-6" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-blue-200/80 bg-blue-500/[0.04]">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs text-blue-800 font-bold">مرخصی استعلاجی (پزشکی)</p>
              <p className="text-2xl font-black text-blue-700">{toFa(sickCount)}</p>
            </div>
            <div className="size-11 rounded-2xl bg-blue-500/10 text-blue-700 flex items-center justify-center">
              <FileText className="size-6" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-purple-200/80 bg-purple-500/[0.04]">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs text-purple-800 font-bold">کل درخواست‌های ثبت‌شده</p>
              <p className="text-2xl font-black text-purple-700">{toFa(allLeaves.length)}</p>
            </div>
            <div className="size-11 rounded-2xl bg-purple-500/10 text-purple-700 flex items-center justify-center">
              <CalendarDays className="size-6" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ───────────────────────── فیلترها و عملیات ───────────────────────── */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-card p-3 rounded-2xl border border-border/80 shadow-2xs">
        <div className="flex flex-wrap items-center gap-2 flex-1">
          {/* فیلتر کارمند */}
          <Select value={selectedEmpFilter} onValueChange={setSelectedEmpFilter}>
            <SelectTrigger className="w-[180px] h-9 text-xs rounded-xl">
              <SelectValue placeholder="همه پرسنل" />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              <SelectItem value="ALL" className="text-xs">همه پرسنل</SelectItem>
              {employees.map((e) => (
                <SelectItem key={e.id} value={e.id} className="text-xs">
                  {e.firstName} {e.lastName} ({e.personnelCode})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* فیلتر وضعیت */}
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[140px] h-9 text-xs rounded-xl">
              <SelectValue placeholder="همه وضعیت‌ها" />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              <SelectItem value="ALL" className="text-xs">همه وضعیت‌ها</SelectItem>
              <SelectItem value="PENDING" className="text-xs">منتظر بررسی</SelectItem>
              <SelectItem value="APPROVED" className="text-xs">تایید شده</SelectItem>
              <SelectItem value="REJECTED" className="text-xs">رد شده</SelectItem>
            </SelectContent>
          </Select>

          {/* فیلتر نوع */}
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-[150px] h-9 text-xs rounded-xl">
              <SelectValue placeholder="همه انواع مرخصی" />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              <SelectItem value="ALL" className="text-xs">همه انواع</SelectItem>
              <SelectItem value="DAILY" className="text-xs">استحقاقی روزانه</SelectItem>
              <SelectItem value="HOURLY" className="text-xs">ساعتی</SelectItem>
              <SelectItem value="SICK" className="text-xs">استعلاجی</SelectItem>
              <SelectItem value="UNPAID" className="text-xs">بدون حقوق</SelectItem>
              <SelectItem value="MARRIAGE" className="text-xs">ازدواج</SelectItem>
              <SelectItem value="BEREAVEMENT" className="text-xs">فوت بستگان</SelectItem>
            </SelectContent>
          </Select>

          {/* جستجو */}
          <div className="relative min-w-[200px] flex-1">
            <Search className="size-4 text-muted-foreground absolute right-3 top-1/2 -translate-y-1/2" />
            <Input
              placeholder="جستجو در نام، علت یا کد پرسنلی..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-9 pr-9 pl-3 text-xs rounded-xl"
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => qc.invalidateQueries({ queryKey: ["admin-leaves"] })}
            className="h-9 rounded-xl text-xs gap-1.5"
          >
            <RefreshCw className="size-3.5" />
            به‌روزرسانی
          </Button>

          <Button
            size="sm"
            onClick={() => setIsNewLeaveOpen(true)}
            className="h-9 rounded-xl text-xs font-bold gap-1.5 shadow-sm"
          >
            <PlusCircle className="size-4" />
            ثبت مرخصی پرسنل
          </Button>
        </div>
      </div>

      {/* ───────────────────────── جدول مرخصی‌ها ───────────────────────── */}
      <Card className="rounded-2xl border-border/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-start">
            <thead className="bg-muted/50 border-b border-border/80 text-muted-foreground font-bold">
              <tr>
                <th className="p-3 text-start">پرسنل</th>
                <th className="p-3 text-start">نوع مرخصی</th>
                <th className="p-3 text-start">بازه تاریخ / مدت</th>
                <th className="p-3 text-start">علت درخواست</th>
                <th className="p-3 text-center">پیوست</th>
                <th className="p-3 text-center">وضعیت</th>
                <th className="p-3 text-center">بررسی‌کننده</th>
                <th className="p-3 text-center">عملیات مدیریت</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {leavesQ.isLoading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-muted-foreground">
                    <Loader2 className="size-6 animate-spin mx-auto mb-2 text-primary" />
                    در حال بارگذاری لیست مرخصی‌ها...
                  </td>
                </tr>
              ) : filteredLeaves.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-muted-foreground">
                    هیچ موردی با فیلترهای جاری یافت نشد.
                  </td>
                </tr>
              ) : (
                filteredLeaves.map((l) => {
                  const meta = LEAVE_TYPE_META[l.leaveType] || { label: l.leaveType, badge: "bg-gray-100 text-gray-800" };

                  return (
                    <tr key={l.id} className="hover:bg-muted/30 transition-colors">
                      {/* پرسنل */}
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => setCardexEmpId(l.employeeId)}
                            className="font-bold text-foreground hover:text-primary transition-colors text-start"
                            title="مشاهده کاردکس مانده مرخصی"
                          >
                            {l.employee?.firstName} {l.employee?.lastName}
                          </button>
                        </div>
                        <div className="text-[10px] text-muted-foreground font-mono flex items-center gap-1.5 mt-0.5">
                          <span>کد: {l.employee?.personnelCode}</span>
                          <span>•</span>
                          <span>{l.employee?.jobTitle}</span>
                        </div>
                      </td>

                      {/* نوع */}
                      <td className="p-3">
                        <Badge variant="outline" className={cn("text-[10px] font-bold px-2 py-0.5", meta.badge)}>
                          {meta.label}
                        </Badge>
                      </td>

                      {/* تاریخ و مدت */}
                      <td className="p-3">
                        <div className="font-bold text-foreground">
                          {l.leaveType === "HOURLY" ? `${toFa(l.hours)} ساعت` : `${toFa(l.days)} روز`}
                        </div>
                        <div className="text-[10px] text-muted-foreground font-mono mt-0.5">
                          {faDate(l.startDate)} {l.endDate && l.endDate !== l.startDate ? `تا ${faDate(l.endDate)}` : ""}
                        </div>
                      </td>

                      {/* علت */}
                      <td className="p-3 max-w-[200px]">
                        <p className="truncate text-muted-foreground" title={l.reason || ""}>
                          {l.reason || "—"}
                        </p>
                      </td>

                      {/* پیوست پزشکی */}
                      <td className="p-3 text-center">
                        {l.medicalCertUrl ? (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setPreviewCertUrl(l.medicalCertUrl!)}
                            className="h-7 px-2 text-[10px] gap-1 text-primary hover:bg-primary/10"
                          >
                            <Camera className="size-3" />
                            مشاهده گواهی
                          </Button>
                        ) : (
                          <span className="text-muted-foreground/40">—</span>
                        )}
                      </td>

                      {/* وضعیت */}
                      <td className="p-3 text-center">
                        {l.status === "APPROVED" && (
                          <Badge className="bg-emerald-600 text-white text-[10px] font-bold gap-1">
                            <CheckCircle2 className="size-3" />
                            تایید شده
                          </Badge>
                        )}
                        {l.status === "PENDING" && (
                          <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-300 text-[10px] font-bold gap-1">
                            <Clock className="size-3" />
                            منتظر بررسی
                          </Badge>
                        )}
                        {l.status === "REJECTED" && (
                          <Badge variant="outline" className="bg-rose-50 text-rose-700 border-rose-300 text-[10px] font-bold gap-1">
                            <XCircle className="size-3" />
                            رد شده
                          </Badge>
                        )}
                      </td>

                      {/* بررسی‌کننده */}
                      <td className="p-3 text-center text-[10px] text-muted-foreground">
                        {l.approvedBy ? (
                          <div>
                            <span className="font-bold text-foreground">{l.approvedBy.fullName}</span>
                            {l.approvedAt && <div>{faDate(l.approvedAt)}</div>}
                          </div>
                        ) : (
                          "—"
                        )}
                      </td>

                      {/* عملیات */}
                      <td className="p-3 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          {l.status === "PENDING" ? (
                            <>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setReviewLeave(l);
                                  setReviewAction("APPROVED");
                                  setManagerNote("");
                                }}
                                className="h-7 px-2 text-[11px] font-bold text-emerald-700 border-emerald-300 hover:bg-emerald-50 gap-1"
                              >
                                <Check className="size-3" />
                                موافقت
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setReviewLeave(l);
                                  setReviewAction("REJECTED");
                                  setManagerNote("");
                                }}
                                className="h-7 px-2 text-[11px] font-bold text-rose-700 border-rose-300 hover:bg-rose-50 gap-1"
                              >
                                <X className="size-3" />
                                رد درخواست
                              </Button>
                            </>
                          ) : (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setReviewLeave(l);
                                setReviewAction(l.status as any);
                                setManagerNote(l.managerNotes || "");
                              }}
                              className="h-7 px-2 text-[11px] text-muted-foreground"
                            >
                              مشاهده نظر
                            </Button>
                          )}
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

      {/* ───────────────────────── دیالوگ تایید / رد مرخصی ───────────────────────── */}
      <Dialog open={!!reviewLeave} onOpenChange={(open) => !open && setReviewLeave(null)}>
        <DialogContent className="max-w-md w-full rounded-3xl p-5" dir="rtl">
          <DialogHeader className="text-start">
            <DialogTitle className="text-base font-black flex items-center gap-2">
              {reviewAction === "APPROVED" ? (
                <>
                  <CheckCircle2 className="size-5 text-emerald-600" />
                  موافقت با درخواست مرخصی
                </>
              ) : (
                <>
                  <XCircle className="size-5 text-rose-600" />
                  عدم موافقت و رد مرخصی
                </>
              )}
            </DialogTitle>
            <DialogDescription className="text-xs">
              پرسنل: {reviewLeave?.employee?.firstName} {reviewLeave?.employee?.lastName} (
              {reviewLeave?.leaveType === "HOURLY"
                ? `${toFa(reviewLeave?.hours)} ساعت ساعتی`
                : `${toFa(reviewLeave?.days)} روز استحقاقی`}
              )
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2 text-start">
            <div className="p-3 rounded-xl bg-muted/40 border border-border/50 text-xs space-y-1">
              <p>
                <span className="font-bold">علت اعلام شده توسط پرسنل: </span>
                {reviewLeave?.reason || "ذکر نشده"}
              </p>
              <p className="text-[11px] text-muted-foreground font-mono">
                تاریخ شروع: {reviewLeave?.startDate ? faDate(reviewLeave.startDate) : "—"}
              </p>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold">توضیحات و یادداشت مدیر (جهت ثبت در کارگزینی):</Label>
              <Textarea
                placeholder="توضیحات یا علت موافقت/مخالفت..."
                value={managerNote}
                onChange={(e) => setManagerNote(e.target.value)}
                rows={3}
                className="rounded-xl text-xs resize-none"
              />
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0 pt-2 border-t border-border/40">
            <Button
              variant="outline"
              onClick={() => setReviewLeave(null)}
              className="rounded-xl text-xs font-bold h-10"
            >
              انصراف
            </Button>
            <Button
              onClick={() => {
                if (reviewLeave) {
                  updateStatusMut.mutate({
                    id: reviewLeave.id,
                    status: reviewAction,
                    managerNotes: managerNote,
                  });
                }
              }}
              disabled={updateStatusMut.isPending}
              className={cn(
                "rounded-xl text-xs font-bold h-10 gap-1.5 shadow-sm",
                reviewAction === "APPROVED"
                  ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                  : "bg-rose-600 hover:bg-rose-700 text-white",
              )}
            >
              {updateStatusMut.isPending && <Loader2 className="size-3.5 animate-spin" />}
              {reviewAction === "APPROVED" ? "تایید نهایی مرخصی" : "رد درخواست مرخصی"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ───────────────────────── دیالوگ ثبت مرخصی پرسنل توسط کارگزینی ───────────────────────── */}
      <Dialog open={isNewLeaveOpen} onOpenChange={setIsNewLeaveOpen}>
        <DialogContent className="max-w-md w-full rounded-3xl p-5" dir="rtl">
          <DialogHeader className="text-start">
            <DialogTitle className="text-base font-black flex items-center gap-2">
              <CalendarDays className="size-5 text-primary" />
              ثبت مرخصی پرسنل توسط امور اداری
            </DialogTitle>
            <DialogDescription className="text-xs">
              درج مستقیم مرخصی در پرونده و کاردکس سالانه
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2 text-start">
            {/* انتخاب پرسنل */}
            <div className="space-y-1.5">
              <Label className="text-xs font-bold">انتخاب پرسنل:</Label>
              <Select value={manualEmpId} onValueChange={setManualEmpId}>
                <SelectTrigger className="h-10 rounded-xl text-xs">
                  <SelectValue placeholder="انتخاب کارمند..." />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  {employees.map((e) => (
                    <SelectItem key={e.id} value={e.id} className="text-xs">
                      {e.firstName} {e.lastName} ({e.jobTitle} - کد: {e.personnelCode})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* نوع مرخصی */}
            <div className="space-y-1.5">
              <Label className="text-xs font-bold">نوع مرخصی:</Label>
              <Select value={manualType} onValueChange={setManualType}>
                <SelectTrigger className="h-10 rounded-xl text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  {Object.entries(LEAVE_TYPE_META).map(([k, v]) => (
                    <SelectItem key={k} value={k} className="text-xs">
                      {v.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* تاریخ شروع و پایان / ساعت */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold">از تاریخ:</Label>
                <Input
                  type="date"
                  value={manualStartDate}
                  onChange={(e) => setManualStartDate(e.target.value)}
                  className="h-10 rounded-xl text-xs font-mono"
                />
              </div>

              {manualType === "HOURLY" ? (
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold">تعداد ساعت:</Label>
                  <Input
                    type="number"
                    min={1}
                    max={8}
                    value={manualHours}
                    onChange={(e) => setManualHours(Number(e.target.value))}
                    className="h-10 rounded-xl text-xs font-bold font-mono"
                  />
                </div>
              ) : (
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold">تا تاریخ:</Label>
                  <Input
                    type="date"
                    value={manualEndDate}
                    onChange={(e) => setManualEndDate(e.target.value)}
                    className="h-10 rounded-xl text-xs font-mono"
                  />
                </div>
              )}
            </div>

            {manualType !== "HOURLY" && (
              <div className="space-y-1.5">
                <Label className="text-xs font-bold">تعداد روز مرخصی:</Label>
                <Input
                  type="number"
                  min={1}
                  max={30}
                  value={manualDays}
                  onChange={(e) => setManualDays(Number(e.target.value))}
                  className="h-10 rounded-xl text-xs font-bold font-mono"
                />
              </div>
            )}

            <div className="space-y-1.5">
              <Label className="text-xs font-bold">علت و توضیحات:</Label>
              <Textarea
                placeholder="علت مرخصی..."
                rows={2}
                value={manualReason}
                onChange={(e) => setManualReason(e.target.value)}
                className="rounded-xl text-xs resize-none"
              />
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0 pt-2 border-t border-border/40">
            <Button
              variant="outline"
              onClick={() => setIsNewLeaveOpen(false)}
              className="rounded-xl text-xs font-bold h-10"
            >
              انصراف
            </Button>
            <Button
              onClick={handleManualSubmit}
              disabled={createMut.isPending}
              className="rounded-xl text-xs font-bold h-10 gap-1.5 shadow-sm"
            >
              {createMut.isPending && <Loader2 className="size-3.5 animate-spin" />}
              ثبت در سیستم
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ───────────────────────── دیالوگ پیش‌نمایش عکس گواهی پزشکی ───────────────────────── */}
      <Dialog open={!!previewCertUrl} onOpenChange={(open) => !open && setPreviewCertUrl(null)}>
        <DialogContent className="max-w-lg w-full rounded-3xl p-5" dir="rtl">
          <DialogHeader className="text-start">
            <DialogTitle className="text-base font-black flex items-center gap-2">
              <Camera className="size-5 text-amber-600" />
              تصویر گواهی پزشک معالج
            </DialogTitle>
          </DialogHeader>

          {previewCertUrl && (
            <div className="rounded-2xl overflow-hidden border border-border bg-black/10 max-h-[70vh] flex items-center justify-center p-2">
              <img
                src={previewCertUrl}
                alt="گواهی پزشکی"
                className="max-h-[65vh] w-auto object-contain rounded-xl"
              />
            </div>
          )}

          <DialogFooter className="pt-2">
            <Button
              variant="outline"
              onClick={() => setPreviewCertUrl(null)}
              className="rounded-xl text-xs font-bold h-10 w-full"
            >
              بستن
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ───────────────────────── دیالوگ کاردکس مانده مرخصی پرسنل ───────────────────────── */}
      <Dialog open={!!cardexEmpId} onOpenChange={(open) => !open && setCardexEmpId(null)}>
        <DialogContent className="max-w-md w-full rounded-3xl p-5" dir="rtl">
          <DialogHeader className="text-start">
            <DialogTitle className="text-base font-black flex items-center gap-2">
              <CalendarDays className="size-5 text-primary" />
              کاردکس مرخصی پرسنل
            </DialogTitle>
            <DialogDescription className="text-xs">
              خلاصه محاسبات سهمیه سالانه و مانده مرخصی استحقاقی
            </DialogDescription>
          </DialogHeader>

          {cardexQ.isLoading ? (
            <div className="py-8 text-center text-muted-foreground">
              <Loader2 className="size-6 animate-spin mx-auto mb-2 text-primary" />
              در حال محاسبه کاردکس...
            </div>
          ) : cardexQ.data ? (
            <div className="space-y-3 py-2 text-start">
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="p-3 rounded-xl bg-background border border-border/60">
                  <p className="text-[10px] text-muted-foreground font-medium">سهمیه کل سال</p>
                  <p className="text-lg font-black text-foreground mt-1">
                    {toFa(cardexQ.data.totalEntitledDays)} روز
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-800">
                  <p className="text-[10px] font-medium">استفاده شده</p>
                  <p className="text-lg font-black mt-1">
                    {toFa(cardexQ.data.usedDays)} روز
                  </p>
                  {cardexQ.data.usedHourlyHours > 0 && (
                    <p className="text-[10px] font-mono">+{toFa(cardexQ.data.usedHourlyHours)} س ساعتی</p>
                  )}
                </div>

                <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-800">
                  <p className="text-[10px] font-medium">مانده قابل استفاده</p>
                  <p className="text-lg font-black mt-1">
                    {toFa(cardexQ.data.remainingDays)} روز
                  </p>
                </div>
              </div>

              <div className="text-xs space-y-1.5 p-3 rounded-xl bg-muted/40 border border-border/50">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">مرخصی استعلاجی پزشکی:</span>
                  <span className="font-bold">{toFa(cardexQ.data.sickDays)} روز</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">مرخصی بدون حقوق:</span>
                  <span className="font-bold">{toFa(cardexQ.data.unpaidDays)} روز</span>
                </div>
              </div>
            </div>
          ) : null}

          <DialogFooter className="pt-2 border-t border-border/40">
            <Button
              variant="outline"
              onClick={() => setCardexEmpId(null)}
              className="rounded-xl text-xs font-bold h-10 w-full"
            >
              بستن
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
