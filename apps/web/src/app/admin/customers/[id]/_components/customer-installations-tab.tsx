"use client";

import * as React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Wrench,
  Truck,
  UserCheck,
  Calendar,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Plus,
  MapPin,
  FileText,
  BadgeCheck,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { getInstallationOrders, createInstallationOrder, updateInstallationStatus } from "@/lib/api";
import { faDate, toFa } from "@/lib/format";
import type { InstallationOrderRow } from "@/lib/types";

interface CustomerInstallationsTabProps {
  customerId: string;
  customerName: string;
}

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  SCHEDULED: { label: "برنامه‌ریزی‌شده", color: "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-200" },
  DISPATCHED: { label: "اعزام راننده / در مسیر", color: "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-200" },
  IN_PROGRESS: { label: "در حال نصب در محل", color: "bg-purple-500/10 text-purple-700 dark:text-purple-400 border-purple-200" },
  COMPLETED: { label: "تکمیل و تحویل شد", color: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-200" },
  CANCELLED: { label: "لغو شده", color: "bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-200" },
};

export function CustomerInstallationsTab({ customerId, customerName }: CustomerInstallationsTabProps) {
  const queryClient = useQueryClient();
  const [createModalOpen, setCreateModalOpen] = React.useState(false);
  const [updateStatusModalOpen, setUpdateStatusModalOpen] = React.useState(false);
  const [selectedOrder, setSelectedOrder] = React.useState<InstallationOrderRow | null>(null);

  // فرم ایجاد
  const [newAddress, setNewAddress] = React.useState("");
  const [newPhone, setNewPhone] = React.useState("");
  const [newInstaller, setNewInstaller] = React.useState("");
  const [newDriver, setNewDriver] = React.useState("");
  const [newScheduledDate, setNewScheduledDate] = React.useState(
    new Date().toISOString().slice(0, 10)
  );

  // فرم تغییر وضعیت
  const [statusVal, setStatusVal] = React.useState("COMPLETED");
  const [notesVal, setNotesVal] = React.useState("");

  const { data: installations = [], isLoading } = useQuery({
    queryKey: ["customer-installations", customerId],
    queryFn: () => getInstallationOrders(customerId),
    enabled: Boolean(customerId),
  });

  const createMutation = useMutation({
    mutationFn: (body: any) => createInstallationOrder(body),
    onSuccess: () => {
      toast.success("سفارش اعزام و نصب با موفقیت ثبت شد.");
      queryClient.invalidateQueries({ queryKey: ["customer-installations"] });
      setCreateModalOpen(false);
      setNewAddress("");
    },
    onError: (err: any) => {
      toast.error(err?.message || "خطا در ثبت سفارش نصب");
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, body }: { id: string; body: any }) => updateInstallationStatus(id, body),
    onSuccess: () => {
      toast.success("وضعیت سفارش نصب به‌روز شد.");
      queryClient.invalidateQueries({ queryKey: ["customer-installations"] });
      setUpdateStatusModalOpen(false);
    },
    onError: (err: any) => {
      toast.error(err?.message || "خطا در تغییر وضعیت نصب");
    },
  });

  /** محاسبه تاخیر تحویل و نصب */
  const calculateDelay = (inst: InstallationOrderRow) => {
    const scheduled = new Date(inst.scheduledDate).getTime();
    if (isNaN(scheduled)) return null;

    if (inst.status === "COMPLETED") {
      const completed = inst.actualCompletedDate
        ? new Date(inst.actualCompletedDate).getTime()
        : inst.installedAt
        ? new Date(inst.installedAt).getTime()
        : null;

      if (!completed) {
        return { text: "تکمیل شده", isDelayed: false, days: 0 };
      }

      const diffMs = completed - scheduled;
      const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

      if (diffDays > 0) {
        return { text: `با ${toFa(diffDays)} روز تاخیر`, isDelayed: true, days: diffDays };
      }
      return { text: "تحویل به‌موقع", isDelayed: false, days: 0 };
    } else {
      const now = Date.now();
      const diffMs = now - scheduled;
      const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

      if (diffDays > 0) {
        return { text: `${toFa(diffDays)} روز معوقه`, isDelayed: true, days: diffDays };
      }
      return { text: "در موعد مقرر", isDelayed: false, days: 0 };
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-48 items-center justify-center text-sm text-muted-foreground">
        در حال بارگذاری سوابق نصب و تحویل...
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* هدر بخش */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border bg-card p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600">
            <Wrench className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-base font-semibold">سوابق نصب و تحویل پروژه به مشتری</h3>
            <p className="text-xs text-muted-foreground">
              تیم‌های نصب اعزامی، رانندگان بارگیری، تاریخ تحویل و گزارش تاخیرات زمانی
            </p>
          </div>
        </div>
        <Button
          size="sm"
          onClick={() => setCreateModalOpen(true)}
          className="gap-1.5 text-xs font-medium"
        >
          <Plus className="h-4 w-4" />
          ثبت اعزام و نصب جدید
        </Button>
      </div>

      {installations.length === 0 ? (
        <Card className="flex flex-col items-center justify-center p-8 text-center text-muted-foreground">
          <Wrench className="mb-3 h-10 w-10 opacity-40" />
          <p className="text-sm font-medium">سفارش یا ماموریت نصبی برای این مشتری ثبت نشده است.</p>
          <Button
            size="sm"
            variant="outline"
            className="mt-3 text-xs"
            onClick={() => setCreateModalOpen(true)}
          >
            ایجاد نخستین سفارش نصب
          </Button>
        </Card>
      ) : (
        <div className="overflow-x-auto rounded-lg border bg-card shadow-sm">
          <table className="w-full text-right text-xs">
            <thead className="border-b bg-muted/50 text-muted-foreground">
              <tr>
                <th className="p-3 font-medium">شماره حواله</th>
                <th className="p-3 font-medium">سرپرست نصاب</th>
                <th className="p-3 font-medium">راننده و حمل</th>
                <th className="p-3 font-medium">آدرس پروژه</th>
                <th className="p-3 font-medium">تاریخ مقرر</th>
                <th className="p-3 font-medium">تاریخ انجام واقعی</th>
                <th className="p-3 font-medium">وضعیت تاخیر</th>
                <th className="p-3 font-medium">وضعیت جاری</th>
                <th className="p-3 font-medium">عملیات</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {installations.map((inst) => {
                const statusMeta = STATUS_LABELS[inst.status] || {
                  label: inst.status,
                  color: "bg-muted text-muted-foreground",
                };
                const delay = calculateDelay(inst);

                return (
                  <tr key={inst.id} className="hover:bg-muted/20 transition-colors">
                    <td className="p-3 font-mono font-bold text-primary">
                      {inst.orderNumber}
                    </td>
                    <td className="p-3">
                      <div className="flex items-center gap-1 font-medium">
                        <UserCheck className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                        <span>{inst.installerLead || "تعیین نشده"}</span>
                      </div>
                    </td>
                    <td className="p-3">
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <Truck className="h-3.5 w-3.5 shrink-0" />
                        <span>{inst.driverName || "راننده مشخص نیست"}</span>
                      </div>
                    </td>
                    <td className="p-3 max-w-[200px] truncate" title={inst.projectAddress}>
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <MapPin className="h-3 w-3 shrink-0" />
                        <span>{inst.projectAddress}</span>
                      </div>
                    </td>
                    <td className="p-3 font-mono">
                      {faDate(inst.scheduledDate)}
                    </td>
                    <td className="p-3 font-mono">
                      {inst.actualCompletedDate || inst.installedAt ? (
                        faDate(inst.actualCompletedDate || inst.installedAt)
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </td>
                    <td className="p-3">
                      {delay && (
                        <span
                          className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 font-medium ${
                            delay.isDelayed
                              ? "bg-rose-500/10 text-rose-700 dark:text-rose-400 border border-rose-200"
                              : "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-200"
                          }`}
                        >
                          {delay.isDelayed ? (
                            <AlertTriangle className="h-3 w-3" />
                          ) : (
                            <CheckCircle2 className="h-3 w-3" />
                          )}
                          {delay.text}
                        </span>
                      )}
                    </td>
                    <td className="p-3">
                      <span className={`rounded-md border px-2 py-0.5 font-medium ${statusMeta.color}`}>
                        {statusMeta.label}
                      </span>
                    </td>
                    <td className="p-3">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          setSelectedOrder(inst);
                          setStatusVal(inst.status);
                          setNotesVal(inst.completionNotes || "");
                          setUpdateStatusModalOpen(true);
                        }}
                        className="h-7 px-2 text-xs text-primary hover:text-primary"
                      >
                        تغییر وضعیت
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* دیالوگ ثبت نصب جدید */}
      <Dialog open={createModalOpen} onOpenChange={setCreateModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base font-bold">
              <Wrench className="h-5 w-5 text-emerald-600" />
              ثبت ماموریت اعزام و نصب برای کارفرما
            </DialogTitle>
          </DialogHeader>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (!newAddress.trim()) {
                toast.error("آدرس پروژه الزامی است.");
                return;
              }
              createMutation.mutate({
                customerId,
                customerName,
                projectAddress: newAddress,
                contactPhone: newPhone || "09120000000",
                installerLead: newInstaller,
                driverName: newDriver,
                scheduledDate: newScheduledDate,
              });
            }}
            className="space-y-3 pt-2 text-xs"
          >
            <div>
              <label className="mb-1 block font-medium">نام مشتری:</label>
              <Input readOnly value={customerName} className="bg-muted text-xs font-semibold" />
            </div>

            <div>
              <label className="mb-1 block font-medium">آدرس محل پروژه / نصب (الزامی):</label>
              <Input
                value={newAddress}
                onChange={(e) => setNewAddress(e.target.value)}
                placeholder="مثال: تهران، پاسداران، گلستان دوم، پلاک ۲"
                className="text-xs"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="mb-1 block font-medium">شماره تماس در محل:</label>
                <Input
                  value={newPhone}
                  onChange={(e) => setNewPhone(e.target.value)}
                  placeholder="0912..."
                  className="text-xs"
                />
              </div>
              <div>
                <label className="mb-1 block font-medium">تاریخ مقرر نصب:</label>
                <Input
                  type="date"
                  value={newScheduledDate}
                  onChange={(e) => setNewScheduledDate(e.target.value)}
                  className="text-xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="mb-1 block font-medium">سرپرست نصاب:</label>
                <Input
                  value={newInstaller}
                  onChange={(e) => setNewInstaller(e.target.value)}
                  placeholder="مثال: مهندس رضوانی"
                  className="text-xs"
                />
              </div>
              <div>
                <label className="mb-1 block font-medium">راننده حامل بار:</label>
                <Input
                  value={newDriver}
                  onChange={(e) => setNewDriver(e.target.value)}
                  placeholder="مثال: علی اکبری (نیسان)"
                  className="text-xs"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setCreateModalOpen(false)}
              >
                انصراف
              </Button>
              <Button type="submit" size="sm" disabled={createMutation.isPending}>
                {createMutation.isPending ? "در حال ثبت..." : "ثبت سفارش اعزام"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* دیالوگ به‌روزرسانی وضعیت نصب و تاخیر */}
      <Dialog open={updateStatusModalOpen} onOpenChange={setUpdateStatusModalOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base font-bold">
              <BadgeCheck className="h-5 w-5 text-primary" />
              به‌روزرسانی وضعیت نصب {selectedOrder?.orderNumber}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-3 pt-2 text-xs">
            <div>
              <label className="mb-1 block font-medium">وضعیت جدید:</label>
              <select
                value={statusVal}
                onChange={(e) => setStatusVal(e.target.value)}
                className="w-full rounded-md border bg-background p-2 text-xs"
              >
                <option value="SCHEDULED">برنامه‌ریزی‌شده</option>
                <option value="DISPATCHED">اعزام راننده / بارگیری</option>
                <option value="IN_PROGRESS">در حال نصب در محل کارفرما</option>
                <option value="COMPLETED">تکمیل و تحویل نهایی به کارفرما</option>
                <option value="CANCELLED">لغو نصب</option>
              </select>
            </div>

            <div>
              <label className="mb-1 block font-medium">یادداشت و توضیحات تحویل:</label>
              <textarea
                rows={3}
                value={notesVal}
                onChange={(e) => setNotesVal(e.target.value)}
                placeholder="توضیحات رضایت مشتری، کسری یراق، علت تاخیر و ..."
                className="w-full rounded-md border bg-background p-2 text-xs"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setUpdateStatusModalOpen(false)}
              >
                انصراف
              </Button>
              <Button
                size="sm"
                disabled={updateStatusMutation.isPending}
                onClick={() => {
                  if (!selectedOrder) return;
                  updateStatusMutation.mutate({
                    id: selectedOrder.id,
                    body: {
                      status: statusVal,
                      completionNotes: notesVal,
                    },
                  });
                }}
              >
                {updateStatusMutation.isPending ? "در حال ثبت..." : "ذخیره وضعیت"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
