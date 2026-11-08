"use client";

import * as React from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Boxes,
  Printer,
  Search,
  RotateCcw,
  SlidersHorizontal,
  History,
  Building2,
  Package,
  Layers,
  AlertTriangle,
  Coins,
  CheckCircle2,
  ExternalLink,
} from "lucide-react";

import { Checkbox } from "@/components/ui/checkbox";
import { LabelPrintDialog } from "@/components/labels/label-print-dialog";
import {
  getCurrentStock,
  getInventoryValuationSummary,
  getWarehouses,
  adjustStock,
} from "@/lib/api";
import type { InventoryRow } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import { formatNumber, money, toFa } from "@/lib/format";
import {
  LoadingState,
  EmptyState,
  ErrorState,
} from "@/components/states";
import { DataTablePagination } from "@/components/data-table-pagination";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
import { Textarea } from "@/components/ui/textarea";

const PAGE_SIZE = 25;

interface Props {
  onOpenKardex?: (productId: string) => void;
  canManage?: boolean;
}

export function WmsStockTable({ onOpenKardex, canManage = true }: Props) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [page, setPage] = React.useState(1);
  const [warehouseId, setWarehouseId] = React.useState<string>("ALL");
  const [searchInput, setSearchInput] = React.useState("");
  const [activeSearch, setActiveSearch] = React.useState("");

  // آمار کلی و خلاصه تجمیع انبار
  const valuationQ = useQuery({
    queryKey: ["inventory", "valuation-summary"],
    queryFn: () => getInventoryValuationSummary(),
    staleTime: 60_000,
  });

  // لیست انبارها
  const warehousesQ = useQuery({
    queryKey: ["warehouses", "active"],
    queryFn: () => getWarehouses(),
    staleTime: 120_000,
  });

  // لیست موجودی
  const stockQ = useQuery({
    queryKey: [
      "inventory",
      "current-stock",
      page,
      PAGE_SIZE,
      warehouseId,
      activeSearch,
    ],
    queryFn: () =>
      getCurrentStock(
        page,
        PAGE_SIZE,
        warehouseId === "ALL" ? undefined : warehouseId,
        activeSearch || undefined,
      ),
  });

  const meta = stockQ.data?.meta;
  const rows = stockQ.data?.data ?? [];
  const totalPages = meta?.totalPages ?? 1;

  // انتخاب ردیف‌ها برای چاپ لیبل
  const [selected, setSelected] = React.useState<
    Map<string, { productId: string; quantity: number }>
  >(new Map());

  const rowKey = (r: InventoryRow) => `${r.productId}-${r.locationId}`;

  const toggleRow = (r: InventoryRow) =>
    setSelected((prev) => {
      const n = new Map(prev);
      const k = rowKey(r);
      if (n.has(k)) n.delete(k);
      else n.set(k, { productId: r.productId, quantity: r.quantity });
      return n;
    });

  const visibleKeys = rows.map(rowKey);
  const allSelected =
    visibleKeys.length > 0 && visibleKeys.every((k) => selected.has(k));
  const someSelected =
    !allSelected && visibleKeys.some((k) => selected.has(k));

  const toggleAll = (checked: boolean) =>
    setSelected((prev) => {
      const n = new Map(prev);
      for (const r of rows) {
        if (checked) {
          n.set(rowKey(r), { productId: r.productId, quantity: r.quantity });
        } else {
          n.delete(rowKey(r));
        }
      }
      return n;
    });

  // دیالوگ چاپ لیبل
  const [printOpen, setPrintOpen] = React.useState(false);
  const [printItems, setPrintItems] = React.useState<
    { productId: string; quantity: number }[]
  >([]);
  const [printAll, setPrintAll] = React.useState(false);

  const openSelectedPrint = () => {
    setPrintAll(false);
    setPrintItems(Array.from(selected.values()));
    setPrintOpen(true);
  };

  const openRowPrint = (r: InventoryRow) => {
    setPrintAll(false);
    setPrintItems([{ productId: r.productId, quantity: r.quantity }]);
    setPrintOpen(true);
  };

  const openAllPrint = () => {
    setPrintItems([]);
    setPrintAll(true);
    setPrintOpen(true);
  };

  // دیالوگ تعدیل سریع موجودی
  const [adjustTarget, setAdjustTarget] = React.useState<InventoryRow | null>(
    null,
  );
  const [newTargetQty, setNewTargetQty] = React.useState<string>("");
  const [adjustNote, setAdjustNote] = React.useState<string>("");

  const openAdjustDialog = (r: InventoryRow) => {
    setAdjustTarget(r);
    setNewTargetQty(String(r.quantity));
    setAdjustNote("تعدیل و انبارگردانی دوره‌ای");
  };

  const closeAdjustDialog = () => {
    setAdjustTarget(null);
    setNewTargetQty("");
    setAdjustNote("");
  };

  const adjustMut = useMutation({
    mutationFn: (dto: {
      productId: string;
      locationId: string;
      targetQuantity: number;
      note?: string;
    }) => adjustStock(dto),
    onSuccess: () => {
      toast({
        title: "تعدیل موجودی ثبت شد",
        description: `موجودی کالا با موفقیت به ${toFa(newTargetQty)} اصلاح شد.`,
      });
      queryClient.invalidateQueries({ queryKey: ["inventory"] });
      closeAdjustDialog();
    },
    onError: (err: any) => {
      toast({
        title: "خطا در ثبت تعدیل",
        description: err?.message || "امکان ثبت تعدیل موجودی وجود ندارد.",
        variant: "destructive",
      });
    },
  });

  const handleAdjustSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjustTarget) return;
    const target = parseInt(newTargetQty, 10);
    if (isNaN(target) || target < 0) {
      toast({
        title: "تعداد نامعتبر",
        description: "لطفاً یک عدد صحیح مثبت یا صفر وارد کنید.",
        variant: "destructive",
      });
      return;
    }
    adjustMut.mutate({
      productId: adjustTarget.productId,
      locationId: adjustTarget.locationId,
      targetQuantity: target,
      note: adjustNote,
    });
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setActiveSearch(searchInput.trim());
    setPage(1);
  };

  const handleResetFilters = () => {
    setSearchInput("");
    setActiveSearch("");
    setWarehouseId("ALL");
    setPage(1);
  };

  const valuation = valuationQ.data;

  return (
    <div className="space-y-6">
      {/* KPI Cards — خلاصه ارزش و تجمیع کل انبار */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Card className="border-border/60 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">
              مجموع موجودی فیزیکی
            </CardTitle>
            <Package className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold tracking-tight text-foreground">
              {toFa(valuation?.totalQuantity ?? meta?.totalQuantity ?? 0)}{" "}
              <span className="text-xs font-normal text-muted-foreground">
                واحد / قطعه
              </span>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              در {toFa(valuation?.totalPositions ?? meta?.total ?? 0)} موقعیت انبار
            </p>
          </CardContent>
        </Card>

        <Card className="border-border/60 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">
              تنوع اقلام موجود (SKU)
            </CardTitle>
            <Boxes className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold tracking-tight text-foreground">
              {toFa(valuation?.uniqueProductCount ?? 0)}{" "}
              <span className="text-xs font-normal text-muted-foreground">
                قلم کالا
              </span>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              دارای موجودی فعال در قفسه‌ها
            </p>
          </CardContent>
        </Card>

        <Card className="border-border/60 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">
              اقلام در نقطه سفارش و کسری
            </CardTitle>
            <AlertTriangle
              className={`h-4 w-4 ${
                (valuation?.lowStockCount ?? 0) > 0
                  ? "text-amber-500 animate-pulse"
                  : "text-muted-foreground"
              }`}
            />
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold tracking-tight text-foreground">
                {toFa(valuation?.lowStockCount ?? 0)}
              </span>
              {(valuation?.lowStockCount ?? 0) > 0 && (
                <Badge variant="destructive" className="text-xs font-normal">
                  نیازمند تأمین
                </Badge>
              )}
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              کالاهای با موجودی کمتر از حد ایمن
            </p>
          </CardContent>
        </Card>

        <Card className="border-border/60 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">
              انبارهای فعال کاردو
            </CardTitle>
            <Building2 className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold tracking-tight text-foreground">
              {toFa(valuation?.warehouses?.length ?? 0)}{" "}
              <span className="text-xs font-normal text-muted-foreground">
                انبار فیزیکی
              </span>
            </div>
            <div className="mt-1 flex flex-wrap gap-1 text-[11px] text-muted-foreground">
              {valuation?.warehouses?.slice(0, 3).map((w) => (
                <span
                  key={w.id}
                  className="rounded bg-muted px-1.5 py-0.5"
                  title={`${w.name}: ${w.totalQuantity} موجودی`}
                >
                  {w.name}
                </span>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* نوار فیلتر و جستجو */}
      <Card className="border-border/60 shadow-sm">
        <CardContent className="pt-5">
          <form
            onSubmit={handleSearchSubmit}
            className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between"
          >
            <div className="flex flex-1 flex-col gap-2 sm:flex-row sm:items-center">
              {/* فیلتر انبار */}
              <div className="w-full sm:w-56">
                <Select
                  value={warehouseId}
                  onValueChange={(v) => {
                    setWarehouseId(v);
                    setPage(1);
                  }}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="همه انبارها" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">همه انبارها</SelectItem>
                    {warehousesQ.data?.map((w) => (
                      <SelectItem key={w.id} value={w.id}>
                        {w.name} ({w.code})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* کادر جستجو */}
              <div className="relative flex-1">
                <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  placeholder="جستجوی نام کالا، کد، SKU یا بارکد..."
                  className="pe-9"
                />
              </div>

              <Button type="submit" size="sm" className="h-9">
                اعمال جستجو
              </Button>

              {(activeSearch || warehouseId !== "ALL") && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleResetFilters}
                  className="h-9 gap-1"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  حذف فیلترها
                </Button>
              )}
            </div>

            {/* دکمه‌های پرینت برچسب */}
            <div className="flex items-center gap-2">
              {selected.size > 0 && (
                <Button size="sm" onClick={openSelectedPrint} className="gap-1">
                  <Printer className="h-4 w-4" />
                  چاپ لیبل ({toFa(selected.size)})
                </Button>
              )}
              <Button
                size="sm"
                variant="outline"
                onClick={openAllPrint}
                className="gap-1"
              >
                <Printer className="h-4 w-4" />
                چاپ لیبل کل صفحه
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* جدول اصلی موجودی */}
      <Card className="border-border/60 shadow-sm">
        <CardHeader className="flex-row items-center justify-between pb-3">
          <div>
            <CardTitle className="text-base font-bold">
              فهرست موجودی فیزیکی و ارزش ریالی
            </CardTitle>
            <CardDescription>
              مجموع {toFa(meta?.total ?? 0)} رکورد قفسه و انبار
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent>
          {stockQ.isLoading ? (
            <LoadingState label="در حال دریافت داده‌های موجودی انبار..." />
          ) : stockQ.isError ? (
            <ErrorState
              message="خطا در دریافت موجودی انبار."
              onRetry={() => stockQ.refetch()}
            />
          ) : rows.length === 0 ? (
            <EmptyState
              title="موجودی‌ای یافت نشد"
              description="با فیلترهای انتخابی هیچ کالایی در انبار ثبت نشده است."
              icon={Boxes}
            />
          ) : (
            <>
              <div className="overflow-x-auto rounded-lg border border-border">
                <Table>
                  <TableHeader className="bg-muted/50">
                    <TableRow>
                      <TableHead className="w-10">
                        <Checkbox
                          checked={
                            allSelected
                              ? true
                              : someSelected
                              ? "indeterminate"
                              : false
                          }
                          onCheckedChange={(v) => toggleAll(Boolean(v))}
                          aria-label="انتخاب همه"
                        />
                      </TableHead>
                      <TableHead className="min-w-[220px]">کالا و مشخصات فنی</TableHead>
                      <TableHead className="min-w-[160px]">موقعیت و انبار</TableHead>
                      <TableHead className="text-center">وضعیت حد سفارش</TableHead>
                      <TableHead className="text-end">موجودی فیزیکی</TableHead>
                      <TableHead className="text-end">آخرین فی فروش</TableHead>
                      <TableHead className="text-end">ارزش کل ردیف</TableHead>
                      <TableHead className="w-28 text-center">عملیات انبار</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rows.map((row) => {
                      const minStock = row.product?.minStock ?? 0;
                      const isLowStock = minStock > 0 && row.quantity <= minStock;
                      const isNearMin =
                        minStock > 0 &&
                        !isLowStock &&
                        row.quantity <= minStock * 1.5;

                      const latestPrice =
                        row.product?.prices?.[0]?.salePrice ?? null;
                      const rowValue =
                        latestPrice != null ? latestPrice * row.quantity : null;

                      return (
                        <TableRow
                          key={rowKey(row)}
                          className={
                            isLowStock
                              ? "bg-destructive/5 hover:bg-destructive/10"
                              : undefined
                          }
                        >
                          <TableCell>
                            <Checkbox
                              checked={selected.has(rowKey(row))}
                              onCheckedChange={() => toggleRow(row)}
                              aria-label="انتخاب ردیف"
                            />
                          </TableCell>

                          <TableCell>
                            <div className="flex flex-col">
                              <span className="font-semibold text-foreground">
                                {row.product?.name ?? "محصول بدون نام"}
                              </span>
                              <div className="mt-0.5 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                                {row.product?.sku && (
                                  <span className="font-mono">
                                    SKU: {row.product.sku}
                                  </span>
                                )}
                                {row.product?.unit && (
                                  <Badge
                                    variant="outline"
                                    className="px-1.5 py-0 text-[10px]"
                                  >
                                    {row.product.unit}
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </TableCell>

                          <TableCell>
                            <div className="flex flex-col">
                              <span className="font-medium text-foreground">
                                {row.location?.warehouse?.name ?? "انبار اصلی"}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                قفسه: {row.location?.name ?? "—"}{" "}
                                {row.location?.code && `(${row.location.code})`}
                              </span>
                            </div>
                          </TableCell>

                          <TableCell className="text-center">
                            {isLowStock ? (
                              <Badge
                                variant="destructive"
                                className="gap-1 text-xs"
                              >
                                <AlertTriangle className="h-3 w-3" />
                                کسری انبار (حد: {toFa(minStock)})
                              </Badge>
                            ) : isNearMin ? (
                              <Badge
                                variant="secondary"
                                className="border-amber-400 bg-amber-50 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300"
                              >
                                نزدیک حد ({toFa(minStock)})
                              </Badge>
                            ) : minStock > 0 ? (
                              <Badge
                                variant="outline"
                                className="border-emerald-300 text-emerald-700 dark:border-emerald-800 dark:text-emerald-400"
                              >
                                مطلوب
                              </Badge>
                            ) : (
                              <span className="text-xs text-muted-foreground">
                                نامشخص
                              </span>
                            )}
                          </TableCell>

                          <TableCell className="text-end">
                            <span
                              dir="ltr"
                              className="inline-block text-xl font-bold tabular-nums text-foreground"
                            >
                              {toFa(row.quantity)}
                            </span>
                          </TableCell>

                          <TableCell className="text-end font-mono text-sm">
                            {latestPrice != null ? (
                              money(latestPrice)
                            ) : (
                              <span className="text-xs text-muted-foreground">
                                —
                              </span>
                            )}
                          </TableCell>

                          <TableCell className="text-end font-mono text-sm font-semibold text-primary">
                            {rowValue != null ? (
                              money(rowValue)
                            ) : (
                              <span className="text-xs text-muted-foreground">
                                —
                              </span>
                            )}
                          </TableCell>

                          <TableCell>
                            <div className="flex items-center justify-center gap-1">
                              {/* دکمه کاردکس کالا */}
                              {onOpenKardex && (
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  className="h-8 w-8 text-muted-foreground hover:text-primary"
                                  title="مشاهده کاردکس و گردش کالا"
                                  onClick={() =>
                                    onOpenKardex(row.productId)
                                  }
                                >
                                  <History className="h-4 w-4" />
                                </Button>
                              )}

                              {/* دکمه تعدیل دستی */}
                              {canManage && (
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  className="h-8 w-8 text-muted-foreground hover:text-foreground"
                                  title="تعدیل و اصلاح موجودی"
                                  onClick={() => openAdjustDialog(row)}
                                >
                                  <SlidersHorizontal className="h-4 w-4" />
                                </Button>
                              )}

                              {/* دکمه چاپ لیبل */}
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-8 w-8 text-muted-foreground hover:text-foreground"
                                title="چاپ برچسب قفسه/کالا"
                                onClick={() => openRowPrint(row)}
                              >
                                <Printer className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>

              <div className="mt-4">
                <DataTablePagination
                  page={page}
                  totalPages={totalPages}
                  onChange={(p) => setPage(p)}
                />
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* دیالوگ چاپ برچسب */}
      <LabelPrintDialog
        open={printOpen}
        onOpenChange={setPrintOpen}
        mode="product"
        ids={printItems.map((i) => i.productId)}
        items={printAll ? undefined : printItems}
        allStock={printAll}
      />

      {/* دیالوگ تعدیل سریع موجودی */}
      <Dialog
        open={adjustTarget !== null}
        onOpenChange={(open) => !open && closeAdjustDialog()}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>تعدیل و انبارگردانی سریع</DialogTitle>
            <DialogDescription>
              ثبت موجودی واقعی فیزیکی شمرده شده برای رفع مغایرت کاردکس انبار.
            </DialogDescription>
          </DialogHeader>

          {adjustTarget && (
            <form onSubmit={handleAdjustSubmit} className="space-y-4 pt-2">
              <div className="rounded-lg border bg-muted/40 p-3 text-sm">
                <div className="font-semibold text-foreground">
                  {adjustTarget.product?.name ?? "کالا"}
                </div>
                <div className="mt-1 flex items-center justify-between text-xs text-muted-foreground">
                  <span>موقعیت: {adjustTarget.location?.name ?? "—"}</span>
                  <span>
                    موجودی فعلی در سیستم:{" "}
                    <strong className="text-foreground">
                      {toFa(adjustTarget.quantity)}
                    </strong>
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="target-qty">موجودی شمارش‌شده واقعی (تعداد جدید)</Label>
                <Input
                  id="target-qty"
                  type="number"
                  min="0"
                  step="1"
                  required
                  value={newTargetQty}
                  onChange={(e) => setNewTargetQty(e.target.value)}
                  className="font-mono text-lg font-bold"
                />
                {newTargetQty !== "" && (
                  <p className="text-xs text-muted-foreground">
                    اختلاف تعدیل:{" "}
                    {parseInt(newTargetQty, 10) - adjustTarget.quantity > 0 ? (
                      <span className="font-bold text-emerald-600">
                        +{toFa(parseInt(newTargetQty, 10) - adjustTarget.quantity)} (افزایش)
                      </span>
                    ) : parseInt(newTargetQty, 10) - adjustTarget.quantity < 0 ? (
                      <span className="font-bold text-destructive">
                        {toFa(parseInt(newTargetQty, 10) - adjustTarget.quantity)} (کسری/کاهش)
                      </span>
                    ) : (
                      <span className="text-muted-foreground">بدون تغییر</span>
                    )}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="adjust-note">علت و توضیحات تعدیل</Label>
                <Textarea
                  id="adjust-note"
                  rows={2}
                  value={adjustNote}
                  onChange={(e) => setAdjustNote(e.target.value)}
                  placeholder="مثال: مغایرت شمارش پایان دوره، ضایعات یا آسیب‌دیدگی"
                />
              </div>

              <DialogFooter className="gap-2 sm:gap-0">
                <Button
                  type="button"
                  variant="outline"
                  onClick={closeAdjustDialog}
                >
                  انصراف
                </Button>
                <Button type="submit" disabled={adjustMut.isPending}>
                  {adjustMut.isPending ? "در حال ثبت..." : "تأیید و اعمال تعدیل"}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
