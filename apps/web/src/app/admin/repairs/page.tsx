"use client";

import * as React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  ExternalLink,
  PackagePlus,
  Play,
  Plus,
  Printer,
  RefreshCw,
  Search,
  ShieldAlert,
  ShieldCheck,
  User,
  Wrench,
} from "lucide-react";

import {
  addRepairItem,
  createRepairOrder,
  searchCustomers,
  getProducts,
  getRepairOrders,
  removeRepairItem,
  settleRepairOrder,
  updateRepairStatus,
} from "@/lib/api";
import { faDate, money, toFa } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { Customer, Product, RepairOrderRow } from "@/lib/types";

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
} from "@/components/ui/dialog";

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  RECEIVED: { label: "پذیرش شده", color: "bg-blue-500/10 text-blue-600 border-blue-200" },
  DIAGNOSING: { label: "در حال عیب‌یابی", color: "bg-amber-500/10 text-amber-600 border-amber-200" },
  ESTIMATED: { label: "اعلام هزینه شده", color: "bg-purple-500/10 text-purple-600 border-purple-200" },
  APPROVED: { label: "تأیید مشتری", color: "bg-indigo-500/10 text-indigo-600 border-indigo-200" },
  REPAIRING: { label: "در حال تعمیر", color: "bg-orange-500/10 text-orange-600 border-orange-200" },
  QC_TESTING: { label: "تست و کنترل کیفیت", color: "bg-cyan-500/10 text-cyan-600 border-cyan-200" },
  READY: { label: "آماده تحویل", color: "bg-emerald-500/10 text-emerald-600 border-emerald-200" },
  DELIVERED: { label: "تحویل و تسویه", color: "bg-zinc-500/10 text-zinc-600 border-zinc-200" },
  CANCELLED: { label: "لغو شده / عدم تعمیر", color: "bg-red-500/10 text-red-600 border-red-200" },
};

export default function RepairsPage() {
  const queryClient = useQueryClient();
  const [selectedStatus, setSelectedStatus] = React.useState<string>("ALL");
  const [searchTerm, setSearchTerm] = React.useState("");

  // Queries
  const { data: orders = [], isLoading } = useQuery({
    queryKey: ["repair-orders", selectedStatus, searchTerm],
    queryFn: () =>
      getRepairOrders({
        status: selectedStatus === "ALL" ? undefined : selectedStatus,
        search: searchTerm || undefined,
      }),
  });

  const { data: customers = [] } = useQuery({
    queryKey: ["customers"],
    queryFn: () => searchCustomers("", 50),
  });

  const { data: products = [] } = useQuery({
    queryKey: ["products-for-repairs"],
    queryFn: () => getProducts(),
  });

  // دیالوگ‌ها و وضعیت انتخاب
  const [newOrderOpen, setNewOrderOpen] = React.useState(false);
  const [detailOrder, setDetailOrder] = React.useState<RepairOrderRow | null>(null);
  const [addItemOpen, setAddItemOpen] = React.useState(false);

  // فرم پذیرش جدید
  const [form, setForm] = React.useState({
    customerId: "",
    deviceType: "",
    brandAndModel: "",
    serialNumber: "",
    accessories: "",
    customerProblem: "",
    laborCost: 0,
    depositPaid: 0,
    isUnderWarranty: false,
    notes: "",
  });

  // فرم قطعه مصرفی
  const [itemForm, setItemForm] = React.useState({
    productId: "",
    quantity: 1,
    unitPrice: 0,
    hasOldPart: true,
  });

  // Mutations
  const createMutation = useMutation({
    mutationFn: () =>
      createRepairOrder({
        ...form,
        laborCost: Number(form.laborCost),
        depositPaid: Number(form.depositPaid),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["repair-orders"] });
      setNewOrderOpen(false);
      setForm({
        customerId: "",
        deviceType: "",
        brandAndModel: "",
        serialNumber: "",
        accessories: "",
        customerProblem: "",
        laborCost: 0,
        depositPaid: 0,
        isUnderWarranty: false,
        notes: "",
      });
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status, report }: { id: string; status: string; report?: string }) =>
      updateRepairStatus(id, { status, technicalReport: report }),
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: ["repair-orders"] });
      setDetailOrder(updated);
    },
  });

  const addItemMutation = useMutation({
    mutationFn: () => {
      if (!detailOrder) throw new Error("سفارش انتخاب نشده");
      return addRepairItem(detailOrder.id, {
        productId: itemForm.productId,
        quantity: Number(itemForm.quantity),
        unitPrice: Number(itemForm.unitPrice),
        hasOldPart: itemForm.hasOldPart,
      });
    },
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: ["repair-orders"] });
      setDetailOrder(updated);
      setAddItemOpen(false);
      setItemForm({ productId: "", quantity: 1, unitPrice: 0, hasOldPart: true });
    },
  });

  const removeItemMutation = useMutation({
    mutationFn: (itemId: string) => {
      if (!detailOrder) throw new Error("سفارش انتخاب نشده");
      return removeRepairItem(detailOrder.id, itemId);
    },
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: ["repair-orders"] });
      setDetailOrder(updated);
    },
  });

  const totalReceived = orders.filter((o) => o.status === "RECEIVED").length;
  const totalInProgress = orders.filter((o) => ["DIAGNOSING", "APPROVED", "REPAIRING", "QC_TESTING"].includes(o.status)).length;
  const totalReady = orders.filter((o) => o.status === "READY").length;
  const totalIncome = orders.reduce((sum, o) => sum + o.totalAmount, 0);

  return (
    <div className="flex flex-col gap-6 p-6">
      <PageHeader
        title="خدمات پس از فروش و مدیریت تعمیرگاه"
        description="پذیرش دستگاه و ابزارآلات، پیگیری وضعیت تعمیر، ثبت قطعات یدکی مصرفی از انبار و صدور فاکتور خدمات"
        actions={
          <Button onClick={() => setNewOrderOpen(true)} className="gap-2">
            <Plus className="size-4" />
            پذیرش دستگاه جدید
          </Button>
        }
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="flex items-center gap-4 p-4">
          <div className="flex size-12 items-center justify-center rounded-xl bg-blue-500/10 text-blue-600">
            <Clock className="size-6" />
          </div>
          <div>
            <div className="text-xs text-muted-foreground">دستگاه‌های تازه‌پذیرش‌شده</div>
            <div className="text-2xl font-bold">{toFa(totalReceived)} <span className="text-xs font-normal">مورد</span></div>
          </div>
        </Card>

        <Card className="flex items-center gap-4 p-4">
          <div className="flex size-12 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600">
            <Wrench className="size-6" />
          </div>
          <div>
            <div className="text-xs text-muted-foreground">در حال عیب‌یابی و تعمیر</div>
            <div className="text-2xl font-bold">{toFa(totalInProgress)} <span className="text-xs font-normal">دستگاه</span></div>
          </div>
        </Card>

        <Card className="flex items-center gap-4 p-4">
          <div className="flex size-12 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600">
            <CheckCircle2 className="size-6" />
          </div>
          <div>
            <div className="text-xs text-muted-foreground">آماده تحویل به مشتری</div>
            <div className="text-2xl font-bold">{toFa(totalReady)} <span className="text-xs font-normal">مورد</span></div>
          </div>
        </Card>

        <Card className="flex items-center gap-4 p-4">
          <div className="flex size-12 items-center justify-center rounded-xl bg-purple-500/10 text-purple-600">
            <ShieldCheck className="size-6" />
          </div>
          <div>
            <div className="text-xs text-muted-foreground">مجموع ارزش فاکتورهای خدمات</div>
            <div className="text-2xl font-bold">{money(totalIncome)}</div>
          </div>
        </Card>
      </div>

      {/* Filter Bar */}
      <Card className="p-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-2">
            {[
              { id: "ALL", label: "همه" },
              { id: "RECEIVED", label: "پذیرش شده" },
              { id: "REPAIRING", label: "در حال تعمیر" },
              { id: "READY", label: "آماده تحویل" },
              { id: "DELIVERED", label: "تحویل شده" },
            ].map((tab) => (
              <Button
                key={tab.id}
                variant={selectedStatus === tab.id ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedStatus(tab.id)}
                className="h-8 text-xs font-medium"
              >
                {tab.label}
              </Button>
            ))}
          </div>

          <div className="relative w-72">
            <Search className="absolute right-3 top-2.5 size-4 text-muted-foreground" />
            <Input
              placeholder="جست‌وجوی شماره قبض، مدل، سریال یا مشتری..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pr-9 text-xs"
            />
          </div>
        </div>
      </Card>

      {/* جدول سفارشات تعمیرگاه */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead className="bg-muted/50 text-muted-foreground">
              <tr>
                <th className="p-3">شماره قبض</th>
                <th className="p-3">نام مشتری</th>
                <th className="p-3">دستگاه و برند/مدل</th>
                <th className="p-3">شماره سریال</th>
                <th className="p-3">ایراد اعلامی</th>
                <th className="p-3">وضعیت چرخه</th>
                <th className="p-3">هزینه کل</th>
                <th className="p-3">بیعانه</th>
                <th className="p-3">مانده</th>
                <th className="p-3">تاریخ پذیرش</th>
                <th className="p-3 text-center">عملیات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {orders.map((ord) => {
                const st = STATUS_LABELS[ord.status] || { label: ord.status, color: "bg-gray-100" };
                return (
                  <tr key={ord.id} className="hover:bg-muted/30">
                    <td className="p-3 font-mono font-bold text-primary">{ord.orderNumber}</td>
                    <td className="p-3 font-semibold">
                      {ord.customer.firstName} {ord.customer.lastName || ""}
                    </td>
                    <td className="p-3">
                      <div className="font-semibold">{ord.deviceType}</div>
                      <div className="text-[11px] text-muted-foreground">{ord.brandAndModel}</div>
                    </td>
                    <td className="p-3 font-mono">{ord.serialNumber ? toFa(ord.serialNumber) : "—"}</td>
                    <td className="p-3 max-w-xs truncate text-muted-foreground">{ord.customerProblem}</td>
                    <td className="p-3">
                      <Badge variant="outline" className={cn("text-[11px] font-semibold", st.color)}>
                        {st.label}
                      </Badge>
                    </td>
                    <td className="p-3 font-mono font-bold">{money(ord.totalAmount)}</td>
                    <td className="p-3 font-mono text-emerald-600">{money(ord.depositPaid)}</td>
                    <td className="p-3 font-mono font-bold text-amber-600">{money(ord.balanceDue)}</td>
                    <td className="p-3 text-muted-foreground">{faDate(ord.receivedAt)}</td>
                    <td className="p-3 text-center">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setDetailOrder(ord)}
                        className="h-8 gap-1.5 text-[11px]"
                      >
                        <Wrench className="size-3.5" />
                        مدیریت و قطعات
                      </Button>
                    </td>
                  </tr>
                );
              })}
              {orders.length === 0 && (
                <tr>
                  <td colSpan={11} className="p-8 text-center text-muted-foreground">
                    هیچ برگه پذیرشی در این وضعیت یافت نشد.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* ───────────────────────── DIALOG: پذیرش جدید ───────────────────────── */}
      <Dialog open={newOrderOpen} onOpenChange={setNewOrderOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>پذیرش دستگاه و تجهیز جدید در تعمیرگاه</DialogTitle>
            <DialogDescription>اطلاعات دستگاه تعمیری و ایراد اعلام‌شده را ثبت نمایید.</DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="col-span-2 flex flex-col gap-1">
              <span>انتخاب مشتری:</span>
              <select
                className="h-9 rounded-md border bg-background px-3 font-semibold"
                value={form.customerId}
                onChange={(e) => setForm({ ...form, customerId: e.target.value })}
              >
                <option value="">انتخاب مشتری...</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.firstName} {c.lastName || ""} {c.phones?.[0]?.phone ? `(${c.phones[0].phone})` : ""}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-1">
              <span>نوع دستگاه:</span>
              <Input
                placeholder="مثلاً اره فارسی‌بر، پمپ باد"
                value={form.deviceType}
                onChange={(e) => setForm({ ...form, deviceType: e.target.value })}
              />
            </div>

            <div className="flex flex-col gap-1">
              <span>برند و مدل:</span>
              <Input
                placeholder="مثلاً بوش GCM 12 GDL"
                value={form.brandAndModel}
                onChange={(e) => setForm({ ...form, brandAndModel: e.target.value })}
              />
            </div>

            <div className="flex flex-col gap-1">
              <span>شماره سریال / شاسی:</span>
              <Input
                placeholder="اختیاری"
                value={form.serialNumber}
                onChange={(e) => setForm({ ...form, serialNumber: e.target.value })}
              />
            </div>

            <div className="flex flex-col gap-1">
              <span>اقلام و متعلقات همراه:</span>
              <Input
                placeholder="جعبه، کابل، تیغه و..."
                value={form.accessories}
                onChange={(e) => setForm({ ...form, accessories: e.target.value })}
              />
            </div>

            <div className="col-span-2 flex flex-col gap-1">
              <span>ایراد اعلامی توسط مشتری:</span>
              <Input
                placeholder="شرح دقیق اشکال و علت خرابی..."
                value={form.customerProblem}
                onChange={(e) => setForm({ ...form, customerProblem: e.target.value })}
              />
            </div>

            <div className="flex flex-col gap-1">
              <span>برآورد اجرت اولیه (ریال):</span>
              <Input
                type="number"
                value={form.laborCost}
                onChange={(e) => setForm({ ...form, laborCost: Number(e.target.value) })}
              />
            </div>

            <div className="flex flex-col gap-1">
              <span>بیعانه دریافتی (ریال):</span>
              <Input
                type="number"
                value={form.depositPaid}
                onChange={(e) => setForm({ ...form, depositPaid: Number(e.target.value) })}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              onClick={() => createMutation.mutate()}
              disabled={createMutation.isPending || !form.customerId || !form.deviceType}
            >
              صدور برگه پذیرش و چاپ رسید
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ───────────────────────── DIALOG: جزئیات، قطعات و ترخیص ───────────────────────── */}
      {detailOrder && (
        <Dialog open={!!detailOrder} onOpenChange={(open) => !open && setDetailOrder(null)}>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <div className="flex items-center justify-between">
                <div>
                  <DialogTitle className="flex items-center gap-2">
                    برگه پذیرش {detailOrder.orderNumber}
                    <Badge variant="outline" className={STATUS_LABELS[detailOrder.status]?.color}>
                      {STATUS_LABELS[detailOrder.status]?.label}
                    </Badge>
                  </DialogTitle>
                  <DialogDescription>
                    دستگاه: {detailOrder.deviceType} ({detailOrder.brandAndModel}) — مشتری: {detailOrder.customer.firstName} {detailOrder.customer.lastName}
                  </DialogDescription>
                </div>
                <Button variant="outline" size="sm" onClick={() => window.print()} className="gap-1.5 text-xs">
                  <Printer className="size-3.5" />
                  چاپ رسید مشتری
                </Button>
              </div>
            </DialogHeader>

            <div className="flex flex-col gap-4 text-xs">
              {/* بخش تغییر وضعیت */}
              <div className="rounded-lg border bg-muted/30 p-3">
                <span className="font-bold text-muted-foreground">تغییر وضعیت چرخه خدمات:</span>
                <div className="mt-2 flex flex-wrap gap-2">
                  {[
                    { id: "DIAGNOSING", label: "شروع عیب‌یابی" },
                    { id: "APPROVED", label: "تأیید مشتری" },
                    { id: "REPAIRING", label: "در حال تعمیر" },
                    { id: "QC_TESTING", label: "تست نهایی QC" },
                    { id: "READY", label: "آماده تحویل" },
                    { id: "DELIVERED", label: "تحویل به مشتری" },
                  ].map((s) => (
                    <Button
                      key={s.id}
                      variant="outline"
                      size="sm"
                      onClick={() => updateStatusMutation.mutate({ id: detailOrder.id, status: s.id })}
                      className="h-7 text-xs"
                    >
                      {s.label}
                    </Button>
                  ))}
                </div>
              </div>

              {/* قطعات یدکی مصرفی */}
              <div className="rounded-lg border p-3">
                <div className="flex items-center justify-between border-b pb-2">
                  <span className="font-bold">قطعات یدکی مصرف‌شده از انبار:</span>
                  <Button size="sm" variant="outline" onClick={() => setAddItemOpen(true)} className="h-7 gap-1 text-xs">
                    <Plus className="size-3" />
                    افزودن قطعه از انبار
                  </Button>
                </div>

                <div className="mt-2 divide-y">
                  {detailOrder.repairItems?.map((it) => (
                    <div key={it.id} className="flex items-center justify-between py-2">
                      <div>
                        <span className="font-semibold">{it.product.name}</span>
                        <span className="mr-2 text-muted-foreground font-mono">({it.product.sku})</span>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="font-mono">{toFa(it.quantity)} {it.product.unit}</span>
                        <span className="font-mono font-bold">{money(it.totalPrice)}</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeItemMutation.mutate(it.id)}
                          className="h-6 px-2 text-red-600"
                        >
                          حذف
                        </Button>
                      </div>
                    </div>
                  ))}
                  {(!detailOrder.repairItems || detailOrder.repairItems.length === 0) && (
                    <div className="py-4 text-center text-muted-foreground">هنوز قطعه‌ای برای این سفارش ثبت نشده است.</div>
                  )}
                </div>
              </div>

              {/* مالی و مبالغ */}
              <div className="grid grid-cols-4 gap-3 rounded-lg border bg-muted/40 p-3 font-mono">
                <div>
                  <div className="text-[11px] text-muted-foreground">اجرت خدمات:</div>
                  <div className="font-bold">{money(detailOrder.laborCost)}</div>
                </div>
                <div>
                  <div className="text-[11px] text-muted-foreground">جمع قطعات:</div>
                  <div className="font-bold">{money(detailOrder.partsCost)}</div>
                </div>
                <div>
                  <div className="text-[11px] text-muted-foreground">مبلغ نهایی:</div>
                  <div className="font-bold text-primary">{money(detailOrder.totalAmount)}</div>
                </div>
                <div>
                  <div className="text-[11px] text-muted-foreground">مانده قابل پرداخت:</div>
                  <div className="font-bold text-amber-600">{money(detailOrder.balanceDue)}</div>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* ───────────────────────── DIALOG: افزودن قطعه یدکی ───────────────────────── */}
      <Dialog open={addItemOpen} onOpenChange={setAddItemOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>افزودن قطعه یدکی از انبار</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-3 text-xs">
            <div className="flex flex-col gap-1">
              <span>انتخاب قطعه یدکی:</span>
              <select
                className="h-9 rounded-md border bg-background px-2 font-semibold"
                value={itemForm.productId}
                onChange={(e) => {
                  const p = products.find((x) => x.id === e.target.value);
                  setItemForm({
                    ...itemForm,
                    productId: e.target.value,
                    unitPrice: p?.prices?.[0]?.salePrice || 0,
                  });
                }}
              >
                <option value="">انتخاب قطعه...</option>
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.sku})
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <span>تعداد مصرفی:</span>
              <Input
                type="number"
                min="1"
                value={itemForm.quantity}
                onChange={(e) => setItemForm({ ...itemForm, quantity: Number(e.target.value) })}
              />
            </div>
            <div className="flex flex-col gap-1">
              <span>قیمت واحد قطعه (ریال):</span>
              <Input
                type="number"
                value={itemForm.unitPrice}
                onChange={(e) => setItemForm({ ...itemForm, unitPrice: Number(e.target.value) })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              onClick={() => addItemMutation.mutate()}
              disabled={addItemMutation.isPending || !itemForm.productId}
            >
              ثبت مصرف قطعه
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
