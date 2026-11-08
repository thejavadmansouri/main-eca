"use client";

import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import {
  AlertTriangle,
  PackagePlus,
  History,
  FileSpreadsheet,
  ArrowUpDown,
  ShoppingCart,
  Boxes,
} from "lucide-react";

import { getLowStock } from "@/lib/api";
import { toFa, formatNumber } from "@/lib/format";
import { LoadingState, EmptyState, ErrorState } from "@/components/states";
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
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const PAGE_SIZE = 25;

interface Props {
  onOpenKardex?: (productId: string) => void;
  onQuickReplenish?: (productId: string, productName: string) => void;
}

export function WmsLowStockPanel({ onOpenKardex, onQuickReplenish }: Props) {
  const [page, setPage] = React.useState(1);

  const query = useQuery({
    queryKey: ["reports", "low-stock", page, PAGE_SIZE],
    queryFn: () => getLowStock({ page, limit: PAGE_SIZE }),
  });

  const items = query.data?.items?.data ?? [];
  const meta = query.data?.items?.meta;
  const total = meta?.total ?? 0;
  const totalPages = meta?.lastPage ?? Math.ceil(total / PAGE_SIZE) ?? 1;

  // محاسبه مجموع کسری
  const totalShortage = items.reduce((sum, item) => sum + item.shortage, 0);

  return (
    <div className="space-y-6">
      {/* کارتهای خلاصه وضعیت کسری */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card className="border-border/60 shadow-sm border-l-4 border-l-destructive">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">
              تعداد اقلام بحرانی زیر نقطه سفارش
            </CardTitle>
            <AlertTriangle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold tracking-tight text-destructive">
              {toFa(total)}{" "}
              <span className="text-xs font-normal text-muted-foreground">
                قلم کالا
              </span>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              موجودی فعلی کمتر از حد تعیین‌شده (minStock) است
            </p>
          </CardContent>
        </Card>

        <Card className="border-border/60 shadow-sm border-l-4 border-l-amber-500">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">
              مجموع کسری قطعات (کسری تا نقطه سفارش)
            </CardTitle>
            <ShoppingCart className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold tracking-tight text-foreground">
              {toFa(totalShortage)}{" "}
              <span className="text-xs font-normal text-muted-foreground">
                عدد / قطعه
              </span>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              تعداد مورد نیاز برای رساندن موجودی به حد ایمن
            </p>
          </CardContent>
        </Card>

        <Card className="border-border/60 shadow-sm border-l-4 border-l-primary">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">
              سیاست شارژ و سفارش مجدد
            </CardTitle>
            <Boxes className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-sm font-semibold text-foreground">
              تأمین بهنگام (JIT) و حداقل موجودی ایمن
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              پیشنهاد می‌شود برای ردیف‌های با اولویت فوری، پیش‌نویس فاکتور خرید صادر شود.
            </p>
          </CardContent>
        </Card>
      </div>

      {/* جدول اقلام در نقطه سفارش */}
      <Card className="border-border/60 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-bold">
            لیست کالاهای کسری و نیازمند سفارش خرید
          </CardTitle>
          <CardDescription>
            کالاهایی که بر اساس گردش فروش و خط تولید کاردو، به نقطه سفارش رسیده‌اند.
          </CardDescription>
        </CardHeader>

        <CardContent>
          {query.isLoading ? (
            <LoadingState label="در حال استخراج لیست هشدارهای کسری انبار..." />
          ) : query.isError ? (
            <ErrorState
              message="خطا در دریافت هشدارهای کسری موجودی."
              onRetry={() => query.refetch()}
            />
          ) : items.length === 0 ? (
            <EmptyState
              title="تمام اقلام در حد ایمن هستند"
              description="در حال حاضر هیچ کالایی در انبار زیر حد سفارش (minStock) قرار ندارد."
              icon={Boxes}
            />
          ) : (
            <>
              <div className="overflow-x-auto rounded-lg border border-border">
                <Table>
                  <TableHeader className="bg-muted/50">
                    <TableRow>
                      <TableHead className="min-w-[240px]">کالا و مشخصات فنی</TableHead>
                      <TableHead className="text-center">موجودی فعلی</TableHead>
                      <TableHead className="text-center">حد سفارش (نقطه ایمن)</TableHead>
                      <TableHead className="text-center">میزان کسری</TableHead>
                      <TableHead className="w-48 text-center">شاخص وضعیت ذخیره</TableHead>
                      <TableHead className="w-28 text-center">عملیات</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {items.map((item) => {
                      const stockPct =
                        item.minStock > 0
                          ? Math.min(100, Math.round((item.currentStock / item.minStock) * 100))
                          : 0;

                      return (
                        <TableRow key={item.productId}>
                          <TableCell>
                            <div className="flex flex-col">
                              <span className="font-semibold text-foreground">
                                {item.productName}
                              </span>
                              {item.sku && (
                                <span className="text-xs font-mono text-muted-foreground">
                                  کد: {item.sku}
                                </span>
                              )}
                            </div>
                          </TableCell>

                          <TableCell className="text-center">
                            <span
                              dir="ltr"
                              className={`inline-block text-lg font-bold tabular-nums ${
                                item.currentStock === 0
                                  ? "text-destructive"
                                  : "text-foreground"
                              }`}
                            >
                              {toFa(item.currentStock)}
                            </span>
                          </TableCell>

                          <TableCell className="text-center font-mono text-sm font-medium text-muted-foreground">
                            {toFa(item.minStock)}
                          </TableCell>

                          <TableCell className="text-center">
                            <Badge
                              variant="destructive"
                              className="font-mono text-xs font-bold"
                            >
                              -{toFa(item.shortage)}
                            </Badge>
                          </TableCell>

                          <TableCell>
                            <div className="flex flex-col gap-1">
                              <div className="flex justify-between text-[11px] text-muted-foreground">
                                <span>{stockPct}% موجود</span>
                                <span className="text-destructive font-medium">
                                  {item.currentStock === 0 ? "اتمام موجودی" : "رو به اتمام"}
                                </span>
                              </div>
                              <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                                <div
                                  className={`h-full rounded-full transition-all ${
                                    stockPct === 0
                                      ? "bg-destructive"
                                      : stockPct < 50
                                      ? "bg-destructive"
                                      : "bg-amber-500"
                                  }`}
                                  style={{ width: `${Math.max(5, stockPct)}%` }}
                                />
                              </div>
                            </div>
                          </TableCell>

                          <TableCell>
                            <div className="flex items-center justify-center gap-1">
                              {onQuickReplenish && (
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  className="h-8 w-8 text-primary hover:text-primary hover:bg-primary/10"
                                  title="ورود و شارژ سریع به انبار"
                                  onClick={() =>
                                    onQuickReplenish(item.productId, item.productName)
                                  }
                                >
                                  <PackagePlus className="h-4 w-4" />
                                </Button>
                              )}

                              {onOpenKardex && (
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  className="h-8 w-8 text-muted-foreground hover:text-foreground"
                                  title="مشاهده کاردکس کالا"
                                  onClick={() => onOpenKardex(item.productId)}
                                >
                                  <History className="h-4 w-4" />
                                </Button>
                              )}
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
    </div>
  );
}
