"use client";

import * as React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  AlertCircle,
  ArrowRight,
  Boxes,
  CheckCircle2,
  Clock,
  ExternalLink,
  Factory,
  Layers,
  Play,
  Plus,
  RefreshCw,
  Scale,
  Search,
  Settings,
  ShieldAlert,
  ShieldCheck,
  Wrench,
} from "lucide-react";

import {
  completeProductionOrder,
  createBom,
  createProductionOrder,
  createWorkstation,
  getBoms,
  getProductionOrders,
  getWorkstations,
  issueProductionMaterials,
  recordProductionQualityCheck,
  startProductionOrder,
  updateProductionOperation,
} from "@/lib/api";
import { faDate, money, toFa } from "@/lib/format";
import { cn } from "@/lib/utils";
import type {
  BillOfMaterialsRow,
  ProductionOrderRow,
  ProductionOrderStatus,
  WorkstationRow,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { JalaliDateInput } from "@/components/jalali-date-input";

const STATUS_LABELS: Record<ProductionOrderStatus, { label: string; color: string }> = {
  DRAFT: { label: "پیش‌نویس", color: "border-slate-500/40 text-slate-600 bg-slate-500/5" },
  PLANNED: { label: "برنامه‌ریزی‌شده", color: "border-blue-500/40 text-blue-600 bg-blue-500/5" },
  IN_PROGRESS: { label: "در حال ساخت (WIP)", color: "border-amber-500/40 text-amber-600 bg-amber-500/5" },
  QUALITY_CHECK: { label: "کنترل کیفیت (QC)", color: "border-purple-500/40 text-purple-600 bg-purple-500/5" },
  COMPLETED: { label: "تکمیل‌شده", color: "border-emerald-500/40 text-emerald-600 bg-emerald-500/5" },
  CANCELLED: { label: "ابطال‌شده", color: "border-destructive/40 text-destructive bg-destructive/5" },
};

export default function ManufacturingPage() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = React.useState("orders");

  // فیلتر سفارشات
  const [statusFilter, setStatusFilter] = React.useState<string>("all");
  const [selectedOrder, setSelectedOrder] = React.useState<ProductionOrderRow | null>(null);

  // دیالوگ‌ها
  const [newOrderOpen, setNewOrderOpen] = React.useState(false);
  const [newBomOpen, setNewBomOpen] = React.useState(false);
  const [newWorkstationOpen, setNewWorkstationOpen] = React.useState(false);
  const [qcModalOpen, setQcModalOpen] = React.useState(false);

  // کوئری‌ها
  const ordersQuery = useQuery({
    queryKey: ["production-orders", statusFilter],
    queryFn: () =>
      getProductionOrders({
        status: statusFilter !== "all" ? (statusFilter as ProductionOrderStatus) : undefined,
      }),
  });

  const bomsQuery = useQuery({
    queryKey: ["manufacturing-boms"],
    queryFn: () => getBoms(),
  });

  const workstationsQuery = useQuery({
    queryKey: ["manufacturing-workstations"],
    queryFn: () => getWorkstations(),
  });

  // میوتیشن‌های سفارش تولید
  const startOrderMutation = useMutation({
    mutationFn: (id: string) => startProductionOrder(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["production-orders"] });
    },
  });

  const completeOrderMutation = useMutation({
    mutationFn: ({ id, qty }: { id: string; qty: number }) =>
      completeProductionOrder(id, { completedQuantity: qty }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["production-orders"] });
      setSelectedOrder(null);
    },
  });

  const orders = ordersQuery.data ?? [];
  const boms = bomsQuery.data ?? [];
  const workstations = workstationsQuery.data ?? [];

  // محاسبات شاخص‌های بالای داشبورد تولید
  const activeOrdersCount = orders.filter((o) => o.status === "IN_PROGRESS").length;
  const plannedOrdersCount = orders.filter((o) => o.status === "PLANNED").length;
  const qcOrdersCount = orders.filter((o) => o.status === "QUALITY_CHECK").length;
  const completedCost = orders
    .filter((o) => o.status === "COMPLETED")
    .reduce((acc, o) => acc + (o.totalCost || 0), 0);

  return (
    <div className="space-y-4">
      <PageHeader
        title="مدیریت تولید و مهندسی ساخت"
        description="فرمول ساخت چندسطحی (BOM)، برنامه‌ریزی کارگاهی، ایستگاه‌های کاری و کنترل کیفیت"
        icon={Factory}
      />

      {/* کارت‌های شاخص‌های کلیدی تولید */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card className="p-3 bg-card border shadow-2xs">
          <div className="flex items-center justify-between text-muted-foreground text-3xs">
            <span>در حال ساخت (WIP)</span>
            <Play className="h-3.5 w-3.5 text-amber-600" />
          </div>
          <div className="text-xl font-bold font-mono text-foreground mt-1">
            {toFa(activeOrdersCount)}
          </div>
          <div className="text-3xs text-muted-foreground mt-0.5">سفارش در خطوط کارگاهی</div>
        </Card>

        <Card className="p-3 bg-card border shadow-2xs">
          <div className="flex items-center justify-between text-muted-foreground text-3xs">
            <span>برنامه‌ریزی‌شده</span>
            <Clock className="h-3.5 w-3.5 text-blue-600" />
          </div>
          <div className="text-xl font-bold font-mono text-foreground mt-1">
            {toFa(plannedOrdersCount)}
          </div>
          <div className="text-3xs text-muted-foreground mt-0.5">آماده تخصیص مواد اولیه</div>
        </Card>

        <Card className="p-3 bg-card border shadow-2xs">
          <div className="flex items-center justify-between text-muted-foreground text-3xs">
            <span>کنترل کیفیت (QC)</span>
            <ShieldCheck className="h-3.5 w-3.5 text-purple-600" />
          </div>
          <div className="text-xl font-bold font-mono text-foreground mt-1">
            {toFa(qcOrdersCount)}
          </div>
          <div className="text-3xs text-muted-foreground mt-0.5">در انتظار بازرسی نهایی</div>
        </Card>

        <Card className="p-3 bg-card border shadow-2xs">
          <div className="flex items-center justify-between text-muted-foreground text-3xs">
            <span>بهای تمام‌شده تولید (COGM)</span>
            <Scale className="h-3.5 w-3.5 text-emerald-600" />
          </div>
          <div className="text-sm font-bold font-mono text-emerald-700 dark:text-emerald-400 mt-1">
            {money(completedCost)}
          </div>
          <div className="text-3xs text-muted-foreground mt-0.5">مجموع محصولات تکمیل‌شده</div>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} dir="rtl" className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b pb-2">
          <TabsList className="h-9 justify-start rounded-md border bg-muted/50 p-1">
            <TabsTrigger value="orders" className="text-xs gap-1.5">
              <Boxes className="h-3.5 w-3.5" />
              <span>سفارشات تولید ({toFa(orders.length)})</span>
            </TabsTrigger>
            <TabsTrigger value="boms" className="text-xs gap-1.5">
              <Layers className="h-3.5 w-3.5" />
              <span>فرمول‌های ساخت / BOM ({toFa(boms.length)})</span>
            </TabsTrigger>
            <TabsTrigger value="workstations" className="text-xs gap-1.5">
              <Wrench className="h-3.5 w-3.5" />
              <span>ایستگاه‌های کاری ({toFa(workstations.length)})</span>
            </TabsTrigger>
          </TabsList>

          <div className="flex items-center gap-2">
            {activeTab === "orders" && (
              <Button
                size="sm"
                className="h-8 text-xs gap-1.5 bg-primary text-primary-foreground"
                onClick={() => setNewOrderOpen(true)}
              >
                <Plus className="h-3.5 w-3.5" />
                <span>سفارش تولید جدید</span>
              </Button>
            )}
            {activeTab === "boms" && (
              <Button
                size="sm"
                className="h-8 text-xs gap-1.5 bg-primary text-primary-foreground"
                onClick={() => setNewBomOpen(true)}
              >
                <Plus className="h-3.5 w-3.5" />
                <span>فرمول ساخت جدید (BOM)</span>
              </Button>
            )}
            {activeTab === "workstations" && (
              <Button
                size="sm"
                className="h-8 text-xs gap-1.5 bg-primary text-primary-foreground"
                onClick={() => setNewWorkstationOpen(true)}
              >
                <Plus className="h-3.5 w-3.5" />
                <span>ایستگاه کاری جدید</span>
              </Button>
            )}
          </div>
        </div>

        {/* ───────────────────────── تب ۱: سفارشات تولید ───────────────────────── */}
        <TabsContent value="orders" className="mt-0 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2 rounded-md border bg-card p-2.5 shadow-2xs">
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">وضعیت:</span>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="h-8 w-40 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">همه وضعیت‌ها</SelectItem>
                  <SelectItem value="PLANNED">برنامه‌ریزی‌شده</SelectItem>
                  <SelectItem value="IN_PROGRESS">در حال ساخت (WIP)</SelectItem>
                  <SelectItem value="QUALITY_CHECK">کنترل کیفیت (QC)</SelectItem>
                  <SelectItem value="COMPLETED">تکمیل‌شده</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0"
              onClick={() => ordersQuery.refetch()}
              title="به‌روزرسانی"
            >
              <RefreshCw className={cn("h-3.5 w-3.5", ordersQuery.isFetching && "animate-spin")} />
            </Button>
          </div>

          {ordersQuery.isLoading ? (
            <LoadingState label="در حال دریافت سفارشات تولید..." />
          ) : ordersQuery.isError ? (
            <ErrorState onRetry={() => ordersQuery.refetch()} />
          ) : !orders.length ? (
            <EmptyState
              title="هیچ سفارش تولیدی یافت نشد"
              description="برای شروع فرآیند ساخت، سفارش تولید جدید ثبت کنید."
            />
          ) : (
            <div className="overflow-hidden rounded-md border bg-card shadow-2xs">
              <Table className="text-xs">
                <TableHeader className="bg-muted/60 text-2xs">
                  <TableRow>
                    <TableHead className="w-24 text-start">کد سفارش</TableHead>
                    <TableHead className="text-start">محصول خروجی</TableHead>
                    <TableHead className="text-start">فرمول ساخت (BOM)</TableHead>
                    <TableHead className="w-24 text-center">تیراژ درخواستی</TableHead>
                    <TableHead className="w-24 text-center">ساخته‌شده</TableHead>
                    <TableHead className="w-28 text-center">وضعیت</TableHead>
                    <TableHead className="w-28 text-end">بهای واحد (تومان)</TableHead>
                    <TableHead className="w-32 text-end">بهای کل (تومان)</TableHead>
                    <TableHead className="w-24 text-center">عملیات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orders.map((o) => {
                    const st = STATUS_LABELS[o.status] || { label: o.status, color: "" };
                    const progress = o.targetQuantity > 0 ? (o.completedQuantity / o.targetQuantity) * 100 : 0;

                    return (
                      <TableRow key={o.id} className="hover:bg-muted/40">
                        <TableCell className="font-mono text-2xs font-semibold text-foreground">
                          {o.code}
                        </TableCell>
                        <TableCell className="font-medium">
                          {o.product?.name ?? "—"}
                          {o.product?.sku && (
                            <span className="block text-3xs text-muted-foreground font-mono">
                              SKU: {o.product.sku}
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="text-muted-foreground text-2xs">
                          {o.bom?.name ?? "—"}
                        </TableCell>
                        <TableCell className="text-center font-mono tabular-nums">
                          {toFa(o.targetQuantity)}
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="flex flex-col items-center gap-1">
                            <span className="font-mono tabular-nums text-2xs">
                              {toFa(o.completedQuantity)}
                            </span>
                            <div className="h-1.5 w-16 bg-muted rounded-full overflow-hidden">
                              <div
                                className="h-full bg-primary rounded-full transition-all"
                                style={{ width: `${Math.min(progress, 100)}%` }}
                              />
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge variant="outline" className={cn("text-3xs px-1.5 py-0", st.color)}>
                            {st.label}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-end tabular-nums font-mono text-muted-foreground">
                          {o.unitCost > 0 ? money(o.unitCost) : "—"}
                        </TableCell>
                        <TableCell className="text-end tabular-nums font-mono font-semibold text-foreground">
                          {o.totalCost > 0 ? money(o.totalCost) : "—"}
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="flex items-center justify-center gap-1">
                            {o.status === "PLANNED" && (
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-6 px-2 text-2xs gap-1 border-amber-500/40 text-amber-700 hover:bg-amber-500/10"
                                onClick={() => startOrderMutation.mutate(o.id)}
                                disabled={startOrderMutation.isPending}
                              >
                                <Play className="h-3 w-3" />
                                <span>شروع</span>
                              </Button>
                            )}
                            {o.status === "IN_PROGRESS" && (
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-6 px-2 text-2xs gap-1 border-purple-500/40 text-purple-700 hover:bg-purple-500/10"
                                onClick={() => {
                                  setSelectedOrder(o);
                                  setQcModalOpen(true);
                                }}
                              >
                                <ShieldCheck className="h-3 w-3" />
                                <span>کنترل QC</span>
                              </Button>
                            )}
                            {o.status === "QUALITY_CHECK" && (
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-6 px-2 text-2xs gap-1 border-emerald-500/40 text-emerald-700 hover:bg-emerald-500/10"
                                onClick={() =>
                                  completeOrderMutation.mutate({
                                    id: o.id,
                                    qty: o.targetQuantity,
                                  })
                                }
                                disabled={completeOrderMutation.isPending}
                              >
                                <CheckCircle2 className="h-3 w-3" />
                                <span>تکمیل و رسید</span>
                              </Button>
                            )}
                            {o.status === "COMPLETED" && (
                              <span className="text-3xs text-emerald-600 font-semibold">تکمیل</span>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </TabsContent>

        {/* ───────────────────────── تب ۲: فرمول‌های ساخت (BOM) ───────────────────────── */}
        <TabsContent value="boms" className="mt-0 space-y-3">
          {bomsQuery.isLoading ? (
            <LoadingState label="در حال دریافت فرمول‌های ساخت..." />
          ) : !boms.length ? (
            <EmptyState
              title="هیچ فرمول ساختی ثبت نشده است"
              description="فرمول ساخت (BOM) شامل ریز مواد اولیه، درصد ضایعات و مراحل ایستگاه‌های کاری است."
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {boms.map((b) => (
                <Card key={b.id} className="p-4 border shadow-2xs space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-primary">
                          {b.code}
                        </span>
                        <Badge variant="outline" className="text-3xs px-1.5 py-0">
                          ورژن {toFa(b.version)}
                        </Badge>
                      </div>
                      <h4 className="text-sm font-bold text-foreground mt-1">{b.name}</h4>
                      <p className="text-2xs text-muted-foreground mt-0.5">
                        محصول نهایی: {b.product?.name} (مبنا: {toFa(b.quantity)} {b.unit})
                      </p>
                    </div>

                    <Badge
                      variant="outline"
                      className={cn(
                        "text-3xs",
                        b.isActive
                          ? "border-emerald-500/30 text-emerald-600 bg-emerald-500/5"
                          : "border-muted text-muted-foreground"
                      )}
                    >
                      {b.isActive ? "فعال" : "غیرفعال"}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-3 gap-2 rounded-md bg-muted/30 p-2 text-2xs">
                    <div>
                      <span className="text-muted-foreground block text-3xs">تعداد اقلام مواد:</span>
                      <span className="font-semibold">{toFa(b._count?.items ?? 0)} قلم</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground block text-3xs">برآورد دستمزد:</span>
                      <span className="font-semibold font-mono">{money(b.estimatedLaborCost)}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground block text-3xs">برآورد سربار:</span>
                      <span className="font-semibold font-mono">{money(b.estimatedOverheadCost)}</span>
                    </div>
                  </div>

                  {b.routingNote && (
                    <p className="text-3xs text-muted-foreground line-clamp-2">
                      شرح مسیر ساخت: {b.routingNote}
                    </p>
                  )}
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* ───────────────────────── تب ۳: ایستگاه‌های کاری ───────────────────────── */}
        <TabsContent value="workstations" className="mt-0 space-y-3">
          {workstationsQuery.isLoading ? (
            <LoadingState label="در حال دریافت لیست ایستگاه‌های کاری..." />
          ) : !workstations.length ? (
            <EmptyState
              title="هیچ ایستگاه کاری تعریف نشده است"
              description="ایستگاه‌های کاری نظیر برش، نوار لبه، CNC و مونتاژ را ثبت کنید."
            />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {workstations.map((ws) => (
                <Card key={ws.id} className="p-3 border shadow-2xs space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-2xs font-bold text-purple-600 dark:text-purple-400">
                      {ws.code}
                    </span>
                    <Badge
                      variant="outline"
                      className="text-3xs border-emerald-500/30 text-emerald-600 bg-emerald-500/5"
                    >
                      {ws.status === "ACTIVE" ? "در حال کار" : "آماده به کار"}
                    </Badge>
                  </div>
                  <h4 className="text-xs font-bold text-foreground">{ws.name}</h4>
                  <div className="text-2xs text-muted-foreground space-y-0.5">
                    <div>نرخ ساعتی: {money(ws.hourlyRate)} تومان</div>
                    <div>ظرفیت روزانه: {toFa(Math.round(ws.capacityMinutesPerDay / 60))} ساعت</div>
                    {ws.location && <div>موقعیت: {ws.location}</div>}
                  </div>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* مودال بازرسی کنترل کیفیت (QC) */}
      <Dialog open={qcModalOpen} onOpenChange={setQcModalOpen}>
        <DialogContent className="sm:max-w-md" dir="rtl">
          <DialogHeader>
            <DialogTitle className="text-sm font-bold">بازرسی کنترل کیفی محصول (QC)</DialogTitle>
            <DialogDescription className="text-xs">
              تأیید انطباق ابعاد، اتصالات و روکش پیش از تحویل به انبار محصول نهایی
            </DialogDescription>
          </DialogHeader>

          {selectedOrder && (
            <div className="space-y-3 py-2 text-xs">
              <div className="rounded bg-muted/40 p-2 space-y-1">
                <div>سفارش: <span className="font-mono font-semibold">{selectedOrder.code}</span></div>
                <div>محصول: <span className="font-semibold">{selectedOrder.product?.name}</span></div>
                <div>تعداد بازرسی: <span className="font-mono">{toFa(selectedOrder.targetQuantity)} دستگاه</span></div>
              </div>

              <div className="space-y-2 border-t pt-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" defaultChecked className="h-4 w-4 rounded border-input" />
                  <span>انطباق ابعاد برش با نقشه فنی (دقت کمتر از ۰.۵ میلی‌متر)</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" defaultChecked className="h-4 w-4 rounded border-input" />
                  <span>کیفیت چسبندگی و یکنواختی نوار لبه ۲ میل بدون لب‌پریدگی</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" defaultChecked className="h-4 w-4 rounded border-input" />
                  <span>دقت سوراخ‌کاری لولاها و ریل کشو در ایستگاه CNC</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" defaultChecked className="h-4 w-4 rounded border-input" />
                  <span>سلامت فیزیکی روکش MDF و بسته‌بندی نهایی</span>
                </label>
              </div>
            </div>
          )}

          <DialogFooter className="flex gap-2 sm:justify-start">
            <Button
              className="text-xs bg-emerald-600 hover:bg-emerald-700 text-white"
              onClick={async () => {
                if (selectedOrder) {
                  await recordProductionQualityCheck(selectedOrder.id, {
                    inspectorName: "کارشناس تضمین کیفیت",
                    passed: true,
                    checklist: {
                      dimensions: true,
                      edgeFinishing: true,
                      drillingFit: true,
                      packaging: true,
                    },
                  });
                  queryClient.invalidateQueries({ queryKey: ["production-orders"] });
                  setQcModalOpen(false);
                }
              }}
            >
              <CheckCircle2 className="h-3.5 w-3.5 ml-1" />
              تأیید کیفی و مجوز رسید انبار
            </Button>
            <Button variant="outline" className="text-xs" onClick={() => setQcModalOpen(false)}>
              انصراف
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
