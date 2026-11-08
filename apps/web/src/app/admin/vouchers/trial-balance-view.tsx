"use client";

import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowDownLeft,
  ArrowUpRight,
  CheckCircle2,
  Download,
  FileSpreadsheet,
  Filter,
  Layers,
  RefreshCw,
  Scale,
  ShieldCheck,
  TrendingDown,
  TrendingUp,
} from "lucide-react";

import { getTrialBalance } from "@/lib/api";
import { faDate, money, toFa } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { CustomerDetailItem, TrialBalanceItem, TrialBalanceReport } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { JalaliDateInput } from "@/components/jalali-date-input";
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
import { LoadingState, ErrorState, EmptyState } from "@/components/states";

interface TrialBalanceViewProps {
  onSelectAccountForLedger?: (account: string) => void;
}

export function TrialBalanceView({ onSelectAccountForLedger }: TrialBalanceViewProps) {
  const [from, setFrom] = React.useState<string | undefined>(undefined);
  const [to, setTo] = React.useState<string | undefined>(undefined);
  const [includeZero, setIncludeZero] = React.useState(false);
  const [columnMode, setColumnMode] = React.useState<"4_COL" | "8_COL">("4_COL");
  const [levelFilter, setLevelFilter] = React.useState<"MOEIN" | "KOL" | "GROUP" | "CUSTOMER">("MOEIN");

  const query = useQuery({
    queryKey: ["trial-balance", from, to, includeZero],
    queryFn: () =>
      getTrialBalance({
        from,
        to,
        includeZero,
        includeCustomerDetails: true,
      }),
  });

  const data = query.data;

  // انتخاب داده‌های رندر بر اساس فیلتر سطح
  const items: (TrialBalanceItem | (CustomerDetailItem & { code: string; name: string; level: string }))[] =
    React.useMemo(() => {
      if (!data) return [];
      if (levelFilter === "GROUP") return data.groups;
      if (levelFilter === "KOL") return data.kols;
      if (levelFilter === "MOEIN") return data.moeins;
      if (levelFilter === "CUSTOMER" && data.customerDetails) {
        return data.customerDetails.map((c) => ({
          ...c,
          code: c.customerPhone || c.customerId.slice(0, 8),
          name: c.customerName,
          level: "DETAIL",
        }));
      }
      return data.moeins;
    }, [data, levelFilter]);

  const exportCsv = () => {
    if (!data) return;
    const is8 = columnMode === "8_COL";
    const headers = is8
      ? [
          "کد حساب",
          "نام حساب",
          "سطح",
          "ابتدای دوره بدهکار",
          "ابتدای دوره بستانکار",
          "طی دوره بدهکار",
          "طی دوره بستانکار",
          "گردش کل بدهکار",
          "گردش کل بستانکار",
          "مانده پایان دوره بدهکار",
          "مانده پایان دوره بستانکار",
        ]
      : [
          "کد حساب",
          "نام حساب",
          "سطح",
          "مجموع گردش بدهکار",
          "مجموع گردش بستانکار",
          "مانده بدهکار",
          "مانده بستانکار",
        ];

    const rows = items.map((it) => {
      if (is8) {
        return [
          it.code,
          `"${it.name.replace(/"/g, '""')}"`,
          it.level,
          it.openingDebitBalance,
          it.openingCreditBalance,
          it.periodDebit,
          it.periodCredit,
          "cumulativeDebit" in it ? it.cumulativeDebit : it.debitTurn,
          "cumulativeCredit" in it ? it.cumulativeCredit : it.creditTurn,
          it.closingDebitBalance,
          it.closingCreditBalance,
        ].join(",");
      } else {
        return [
          it.code,
          `"${it.name.replace(/"/g, '""')}"`,
          it.level,
          it.debitTurn,
          it.creditTurn,
          it.debitBalance,
          it.creditBalance,
        ].join(",");
      }
    });

    const csvContent = "\uFEFF" + [headers.join(","), ...rows].join("\r\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `kardo-trial-balance-${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-4">
      {/* نوار فیلتر و ابزار بالای تراز آزمایشی */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-md border bg-card p-3 shadow-2xs">
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <span>از تاریخ:</span>
            <JalaliDateInput value={from} onChange={setFrom} />
          </div>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <span>تا تاریخ:</span>
            <JalaliDateInput value={to} onChange={setTo} />
          </div>

          <Select
            value={levelFilter}
            onValueChange={(v) => setLevelFilter(v as any)}
          >
            <SelectTrigger className="h-8 w-36 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="MOEIN">سطح معین (پیش‌فرض)</SelectItem>
              <SelectItem value="KOL">سطح کل</SelectItem>
              <SelectItem value="GROUP">سطح گروه</SelectItem>
              <SelectItem value="CUSTOMER">تفصیلی مشتریان</SelectItem>
            </SelectContent>
          </Select>

          <Button
            variant="outline"
            size="sm"
            className="h-8 text-xs gap-1.5"
            onClick={() => setColumnMode(columnMode === "4_COL" ? "8_COL" : "4_COL")}
          >
            <Scale className="h-3.5 w-3.5" />
            <span>{columnMode === "4_COL" ? "تغییر به ۸ ستونی" : "تغییر به ۴ ستونی"}</span>
          </Button>

          <label className="flex items-center gap-1.5 text-xs cursor-pointer select-none px-2 text-muted-foreground hover:text-foreground">
            <input
              type="checkbox"
              checked={includeZero}
              onChange={(e) => setIncludeZero(e.target.checked)}
              className="h-3.5 w-3.5 rounded border-input"
            />
            <span>نمایش بدون گردش</span>
          </label>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="h-8 text-xs gap-1"
            onClick={exportCsv}
            disabled={!data || !items.length}
          >
            <Download className="h-3.5 w-3.5" />
            <span>اکسل (BOM فارسی)</span>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0"
            onClick={() => query.refetch()}
            title="به‌روزرسانی"
          >
            <RefreshCw className={cn("h-3.5 w-3.5", query.isFetching && "animate-spin")} />
          </Button>
        </div>
      </div>

      {/* بنر تراز بودن / موازنه دوطرفه */}
      {data && (
        <div
          className={cn(
            "flex items-center justify-between rounded-md border p-3 text-xs transition-colors",
            data.isBalanced
              ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-950 dark:text-emerald-200"
              : "border-destructive/30 bg-destructive/10 text-destructive"
          )}
        >
          <div className="flex items-center gap-2">
            {data.isBalanced ? (
              <ShieldCheck className="h-5 w-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
            ) : (
              <Scale className="h-5 w-5 text-destructive shrink-0" />
            )}
            <div>
              <span className="font-bold">
                {data.isBalanced
                  ? "تراز آزمایشی کاملاً موازنه است:"
                  : "هشدار: عدم تراز در مانده‌های آزمایشی!"}
              </span>{" "}
              {data.isBalanced
                ? "جمع مانده بدهکار با جمع مانده بستانکار دقیقاً برابر است (تفاضل: ۰ تومان)."
                : "گردش‌های بدهکار با بستانکار همخوانی ندارد؛ لطفاً دفتر اسناد را بررسی کنید."}
            </div>
          </div>
          <div className="flex items-center gap-3 text-2xs tabular-nums font-mono">
            <span>جمع بدهکار: {money(data.totals.totalClosingDebitBalance)}</span>
            <span>جمع بستانکار: {money(data.totals.totalClosingCreditBalance)}</span>
          </div>
        </div>
      )}

      {/* جدول تراز */}
      {query.isLoading ? (
        <LoadingState label="در حال محاسبه تراز آزمایشی و گردش حساب‌ها..." />
      ) : query.isError ? (
        <ErrorState onRetry={() => query.refetch()} />
      ) : !items.length ? (
        <EmptyState title="هیچ ردیفی با این فیلتر یافت نشد" />
      ) : (
        <div className="overflow-hidden rounded-md border bg-card shadow-2xs">
          <div className="overflow-x-auto">
            {columnMode === "4_COL" ? (
              /* جدول ۴ ستونی */
              <Table className="text-xs">
                <TableHeader className="bg-muted/60 text-2xs">
                  <TableRow>
                    <TableHead className="w-20 text-start">کد حساب</TableHead>
                    <TableHead className="text-start">نام سرفصل حسابداری</TableHead>
                    <TableHead className="w-16 text-center">سطح</TableHead>
                    <TableHead className="w-32 text-end">گردش بدهکار (تومان)</TableHead>
                    <TableHead className="w-32 text-end">گردش بستانکار (تومان)</TableHead>
                    <TableHead className="w-32 text-end font-semibold text-emerald-800 dark:text-emerald-400">
                      مانده بدهکار (تومان)
                    </TableHead>
                    <TableHead className="w-32 text-end font-semibold text-amber-800 dark:text-amber-400">
                      مانده بستانکار (تومان)
                    </TableHead>
                    <TableHead className="w-24 text-center">دفتر معین</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((row) => (
                    <TableRow key={row.code + row.name} className="hover:bg-muted/40">
                      <TableCell className="font-mono text-2xs text-muted-foreground">
                        {toFa(row.code)}
                      </TableCell>
                      <TableCell className="font-medium text-foreground">
                        {row.name}
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge
                          variant="outline"
                          className={cn(
                            "text-3xs px-1.5 py-0",
                            row.level === "GROUP" && "border-blue-500/40 text-blue-600 bg-blue-500/5",
                            row.level === "KOL" && "border-purple-500/40 text-purple-600 bg-purple-500/5",
                            row.level === "MOEIN" && "border-slate-500/40 text-slate-600 bg-slate-500/5",
                            row.level === "DETAIL" && "border-emerald-500/40 text-emerald-600 bg-emerald-500/5"
                          )}
                        >
                          {row.level === "GROUP"
                            ? "گروه"
                            : row.level === "KOL"
                            ? "کل"
                            : row.level === "MOEIN"
                            ? "معین"
                            : "تفصیلی"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-end tabular-nums text-muted-foreground font-mono">
                        {row.debitTurn > 0 ? money(row.debitTurn) : "—"}
                      </TableCell>
                      <TableCell className="text-end tabular-nums text-muted-foreground font-mono">
                        {row.creditTurn > 0 ? money(row.creditTurn) : "—"}
                      </TableCell>
                      <TableCell className="text-end tabular-nums font-semibold font-mono text-emerald-700 dark:text-emerald-400">
                        {row.debitBalance > 0 ? money(row.debitBalance) : "—"}
                      </TableCell>
                      <TableCell className="text-end tabular-nums font-semibold font-mono text-amber-700 dark:text-amber-400">
                        {row.creditBalance > 0 ? money(row.creditBalance) : "—"}
                      </TableCell>
                      <TableCell className="text-center">
                        {"fixedAccount" in row && row.fixedAccount && onSelectAccountForLedger ? (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 px-2 text-2xs hover:bg-primary/10 hover:text-primary"
                            onClick={() => onSelectAccountForLedger(row.fixedAccount!)}
                          >
                            مشاهده دفتر
                          </Button>
                        ) : "customerId" in row && onSelectAccountForLedger ? (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 px-2 text-2xs hover:bg-primary/10 hover:text-primary"
                            onClick={() => onSelectAccountForLedger("CUSTOMERS")}
                          >
                            دفتر حساب
                          </Button>
                        ) : (
                          "—"
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
                <TableFooter className="bg-muted/80 font-bold text-xs">
                  <TableRow>
                    <TableCell colSpan={3} className="text-start">
                      جمع کل تراز آزمایشی:
                    </TableCell>
                    <TableCell className="text-end tabular-nums font-mono">
                      {money(data?.totals.totalDebitTurn ?? 0)}
                    </TableCell>
                    <TableCell className="text-end tabular-nums font-mono">
                      {money(data?.totals.totalCreditTurn ?? 0)}
                    </TableCell>
                    <TableCell className="text-end tabular-nums font-mono text-emerald-700 dark:text-emerald-400">
                      {money(data?.totals.totalClosingDebitBalance ?? 0)}
                    </TableCell>
                    <TableCell className="text-end tabular-nums font-mono text-amber-700 dark:text-amber-400">
                      {money(data?.totals.totalClosingCreditBalance ?? 0)}
                    </TableCell>
                    <TableCell />
                  </TableRow>
                </TableFooter>
              </Table>
            ) : (
              /* جدول ۸ ستونی */
              <Table className="text-2xs">
                <TableHeader className="bg-muted/60">
                  <TableRow>
                    <TableHead rowSpan={2} className="w-16 text-start">کد</TableHead>
                    <TableHead rowSpan={2} className="text-start">نام حساب</TableHead>
                    <TableHead colSpan={2} className="text-center border-x bg-muted/90 font-bold">
                      گردش ابتدای دوره
                    </TableHead>
                    <TableHead colSpan={2} className="text-center border-x bg-muted/70 font-bold">
                      گردش طی دوره
                    </TableHead>
                    <TableHead colSpan={2} className="text-center border-x bg-muted/90 font-bold">
                      مجموع گردش دوره
                    </TableHead>
                    <TableHead colSpan={2} className="text-center border-x bg-emerald-500/10 font-bold text-emerald-900 dark:text-emerald-300">
                      مانده پایان دوره
                    </TableHead>
                  </TableRow>
                  <TableRow>
                    <TableHead className="w-24 text-end border-s">بدهکار</TableHead>
                    <TableHead className="w-24 text-end">بستانکار</TableHead>
                    <TableHead className="w-24 text-end border-s">بدهکار</TableHead>
                    <TableHead className="w-24 text-end">بستانکار</TableHead>
                    <TableHead className="w-24 text-end border-s">بدهکار</TableHead>
                    <TableHead className="w-24 text-end">بستانکار</TableHead>
                    <TableHead className="w-24 text-end border-s text-emerald-700 dark:text-emerald-400">
                      بدهکار
                    </TableHead>
                    <TableHead className="w-24 text-end border-e text-amber-700 dark:text-amber-400">
                      بستانکار
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((row) => (
                    <TableRow key={row.code + row.name} className="hover:bg-muted/40 font-mono">
                      <TableCell className="text-start text-muted-foreground">{toFa(row.code)}</TableCell>
                      <TableCell className="font-sans font-medium text-foreground text-start">
                        {row.name}
                      </TableCell>
                      {/* ابتدای دوره */}
                      <TableCell className="text-end border-s text-muted-foreground">
                        {row.openingDebitBalance > 0 ? money(row.openingDebitBalance) : "—"}
                      </TableCell>
                      <TableCell className="text-end text-muted-foreground">
                        {row.openingCreditBalance > 0 ? money(row.openingCreditBalance) : "—"}
                      </TableCell>
                      {/* طی دوره */}
                      <TableCell className="text-end border-s text-muted-foreground">
                        {row.periodDebit > 0 ? money(row.periodDebit) : "—"}
                      </TableCell>
                      <TableCell className="text-end text-muted-foreground">
                        {row.periodCredit > 0 ? money(row.periodCredit) : "—"}
                      </TableCell>
                      {/* گردش کل */}
                      <TableCell className="text-end border-s text-muted-foreground">
                        {"cumulativeDebit" in row && row.cumulativeDebit > 0
                          ? money(row.cumulativeDebit)
                          : row.debitTurn > 0
                          ? money(row.debitTurn)
                          : "—"}
                      </TableCell>
                      <TableCell className="text-end text-muted-foreground">
                        {"cumulativeCredit" in row && row.cumulativeCredit > 0
                          ? money(row.cumulativeCredit)
                          : row.creditTurn > 0
                          ? money(row.creditTurn)
                          : "—"}
                      </TableCell>
                      {/* مانده نهایی */}
                      <TableCell className="text-end border-s font-semibold text-emerald-700 dark:text-emerald-400">
                        {row.closingDebitBalance > 0 ? money(row.closingDebitBalance) : "—"}
                      </TableCell>
                      <TableCell className="text-end border-e font-semibold text-amber-700 dark:text-amber-400">
                        {row.closingCreditBalance > 0 ? money(row.closingCreditBalance) : "—"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
                <TableFooter className="bg-muted/80 font-bold font-mono">
                  <TableRow>
                    <TableCell colSpan={2} className="text-start font-sans">
                      جمع کل تراز:
                    </TableCell>
                    <TableCell className="text-end border-s">
                      {money(data?.totals.totalOpeningDebitBalance ?? 0)}
                    </TableCell>
                    <TableCell className="text-end">
                      {money(data?.totals.totalOpeningCreditBalance ?? 0)}
                    </TableCell>
                    <TableCell className="text-end border-s">
                      {money(data?.totals.totalPeriodDebit ?? 0)}
                    </TableCell>
                    <TableCell className="text-end">
                      {money(data?.totals.totalPeriodCredit ?? 0)}
                    </TableCell>
                    <TableCell className="text-end border-s">
                      {money(data?.totals.totalCumulativeDebit ?? 0)}
                    </TableCell>
                    <TableCell className="text-end">
                      {money(data?.totals.totalCumulativeCredit ?? 0)}
                    </TableCell>
                    <TableCell className="text-end border-s text-emerald-700 dark:text-emerald-400">
                      {money(data?.totals.totalClosingDebitBalance ?? 0)}
                    </TableCell>
                    <TableCell className="text-end border-e text-amber-700 dark:text-amber-400">
                      {money(data?.totals.totalClosingCreditBalance ?? 0)}
                    </TableCell>
                  </TableRow>
                </TableFooter>
              </Table>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
