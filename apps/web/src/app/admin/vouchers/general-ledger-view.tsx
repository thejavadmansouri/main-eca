"use client";

import * as React from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowDownLeft,
  ArrowUpRight,
  Download,
  ExternalLink,
  Layers,
  RefreshCw,
  Search,
} from "lucide-react";

import { getGeneralLedger } from "@/lib/api";
import { faDate, faTime, money, toFa } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { GeneralLedgerReport } from "@/lib/types";
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
import { sourceHrefFor } from "@/components/voucher-card";
import { LoadingState, ErrorState, EmptyState } from "@/components/states";

const ACCOUNTS_LIST = [
  { value: "CASH", label: "صندوق (۱۰۱۰۱)" },
  { value: "BANK", label: "حساب‌های بانکی (۱۰۱۰۲)" },
  { value: "CHEQUES", label: "اسناد دریافتنی / چک‌ها (۱۰۲۰۱)" },
  { value: "CUSTOMERS", label: "حساب مشتریان (۱۰۳۰۱)" },
  { value: "INVENTORY", label: "موجودی انبار کالا (۱۰۴۰۱)" },
  { value: "SUPPLIERS", label: "حساب تأمین‌کنندگان (۳۰۱۰۱)" },
  { value: "REFUND_PAYABLE", label: "بستانکاری مشتریان (۳۰۲۰۱)" },
  { value: "SALES", label: "درآمد فروش کالا (۶۰۱۰۱)" },
  { value: "SALES_RETURN", label: "برگشت از فروش (۶۰۲۰۱)" },
  { value: "DISCOUNT", label: "تخفیفات اعطایی (۶۰۲۰۲)" },
  { value: "FINANCE_CHARGE", label: "درآمد سود فروش مدت‌دار (۶۰۳۰۱)" },
  { value: "COGS", label: "بهای تمام‌شده کالای فروش‌رفته (۷۰۱۰۱)" },
];

interface GeneralLedgerViewProps {
  initialAccount?: string;
}

export function GeneralLedgerView({ initialAccount = "CUSTOMERS" }: GeneralLedgerViewProps) {
  const [account, setAccount] = React.useState<string>(initialAccount);
  const [from, setFrom] = React.useState<string | undefined>(undefined);
  const [to, setTo] = React.useState<string | undefined>(undefined);

  React.useEffect(() => {
    if (initialAccount) {
      setAccount(initialAccount);
    }
  }, [initialAccount]);

  const query = useQuery({
    queryKey: ["general-ledger", account, from, to],
    queryFn: () => getGeneralLedger(account, { from, to }),
    enabled: !!account,
  });

  const data = query.data;

  const exportCsv = () => {
    if (!data) return;
    const headers = [
      "ردیف",
      "شماره سند",
      "تاریخ",
      "ساعت",
      "نوع رویداد",
      "طرف حساب",
      "شرح سند",
      "بدهکار",
      "بستانکار",
      "مانده شناور",
      "وضعیت",
    ];

    const rows = data.entries.map((e, idx) => [
      idx + 1,
      e.voucherNumber,
      `"${faDate(e.date)}"`,
      `"${faTime(e.date)}"`,
      `"${e.sourceLabel}"`,
      `"${e.counterparty ? e.counterparty.name.replace(/"/g, '""') : ""}"`,
      `"${(e.note || "").replace(/"/g, '""')}"`,
      e.debit,
      e.credit,
      e.runningBalance,
      e.runningBalance > 0 ? "بد" : e.runningBalance < 0 ? "بس" : "تسویه",
    ]);

    const csvContent = "\uFEFF" + [headers.join(","), ...rows.map((r) => r.join(","))].join("\r\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `kardo-ledger-${account}-${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-4">
      {/* ابزار فیلتر و انتخاب سرفصل حساب */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-md border bg-card p-3 shadow-2xs">
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5 text-xs">
            <span className="text-muted-foreground">حساب معین:</span>
            <Select value={account} onValueChange={setAccount}>
              <SelectTrigger className="h-8 w-56 text-xs font-medium">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ACCOUNTS_LIST.map((a) => (
                  <SelectItem key={a.value} value={a.value}>
                    {a.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <span>از:</span>
            <JalaliDateInput value={from} onChange={setFrom} />
          </div>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <span>تا:</span>
            <JalaliDateInput value={to} onChange={setTo} />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="h-8 text-xs gap-1"
            onClick={exportCsv}
            disabled={!data || !data.entries.length}
          >
            <Download className="h-3.5 w-3.5" />
            <span>خروجی اکسل دفتر</span>
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

      {/* خلاصه حساب و مانده‌ها */}
      {data && (
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
          <Card className="p-3 bg-card border shadow-2xs">
            <div className="text-3xs text-muted-foreground">مشخصات سرفصل</div>
            <div className="text-xs font-bold text-foreground mt-0.5">
              {data.accountInfo.name} ({toFa(data.accountInfo.code)})
            </div>
            <div className="text-3xs text-muted-foreground mt-0.5">
              کل: {data.accountInfo.kolName} | گروه: {data.accountInfo.groupName}
            </div>
          </Card>

          <Card className="p-3 bg-card border shadow-2xs">
            <div className="text-3xs text-muted-foreground">مانده اول دوره</div>
            <div className="text-xs font-bold tabular-nums font-mono mt-0.5">
              {data.openingBalance.amount === 0
                ? "۰ تومان"
                : `${money(Math.abs(data.openingBalance.amount))} ${
                    data.openingBalance.amount > 0 ? "بد" : "بس"
                  }`}
            </div>
            <div className="text-3xs text-muted-foreground mt-0.5">
              {from ? `تا قبل از ${faDate(from)}` : "ابتدای فعالیت سیستم"}
            </div>
          </Card>

          <Card className="p-3 bg-card border shadow-2xs">
            <div className="text-3xs text-muted-foreground">گردش طی دوره</div>
            <div className="text-xs font-bold tabular-nums font-mono mt-0.5 text-muted-foreground flex items-center gap-2">
              <span className="text-emerald-700 dark:text-emerald-400">
                +{money(data.periodTotals.debit)}
              </span>
              <span>/</span>
              <span className="text-amber-700 dark:text-amber-400">
                -{money(data.periodTotals.credit)}
              </span>
            </div>
            <div className="text-3xs text-muted-foreground mt-0.5">
              تعداد رویدادها: {toFa(data.entries.length)} سند
            </div>
          </Card>

          <Card className="p-3 bg-primary/5 border-primary/20 shadow-2xs">
            <div className="text-3xs text-primary font-medium">مانده نهایی پایان دوره</div>
            <div className="text-sm font-bold tabular-nums font-mono mt-0.5 text-primary">
              {data.closingBalance.amount === 0
                ? "تسویه (۰ تومان)"
                : `${money(Math.abs(data.closingBalance.amount))} ${
                    data.closingBalance.amount > 0 ? "بدهکار" : "بستانکار"
                  }`}
            </div>
            <div className="text-3xs text-muted-foreground mt-0.5">
              ماهیت اصلی سرفصل: {data.accountInfo.nature === "DEBIT" ? "بدهکار" : "بستانکار"}
            </div>
          </Card>
        </div>
      )}

      {/* جدول گردش دفتر معین / کل */}
      {query.isLoading ? (
        <LoadingState label="در حال دریافت ریز تراکنش‌های دفتر معین..." />
      ) : query.isError ? (
        <ErrorState onRetry={() => query.refetch()} />
      ) : !data?.entries.length ? (
        <EmptyState title="هیچ ردیفی در این بازه برای این حساب ثبت نشده است" />
      ) : (
        <div className="overflow-hidden rounded-md border bg-card shadow-2xs">
          <div className="overflow-x-auto">
            <Table className="text-xs">
              <TableHeader className="bg-muted/60 text-2xs">
                <TableRow>
                  <TableHead className="w-12 text-center">ردیف</TableHead>
                  <TableHead className="w-20 text-start">شماره سند</TableHead>
                  <TableHead className="w-28 text-start">تاریخ و زمان</TableHead>
                  <TableHead className="w-32 text-start">نوع رویداد مالی</TableHead>
                  <TableHead className="w-40 text-start">طرف حساب</TableHead>
                  <TableHead className="text-start">شرح تراکنش</TableHead>
                  <TableHead className="w-28 text-end text-emerald-800 dark:text-emerald-400">
                    بدهکار (تومان)
                  </TableHead>
                  <TableHead className="w-28 text-end text-amber-800 dark:text-amber-400">
                    بستانکار (تومان)
                  </TableHead>
                  <TableHead className="w-32 text-end font-semibold text-foreground">
                    مانده شناور (تومان)
                  </TableHead>
                  <TableHead className="w-16 text-center">وضعیت</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.entries.map((e, idx) => {
                  const { href } = sourceHrefFor({
                    sourceType: e.sourceType,
                    sourceId: e.sourceId,
                    invoiceId: null,
                  } as any);
                  const isDeb = e.runningBalance > 0;
                  const isCrd = e.runningBalance < 0;

                  return (
                    <TableRow key={e.lineId} className="hover:bg-muted/40">
                      <TableCell className="text-center text-muted-foreground text-2xs">
                        {toFa(idx + 1)}
                      </TableCell>
                      <TableCell className="font-mono text-2xs font-semibold text-foreground">
                        {toFa(e.voucherNumber)}
                      </TableCell>
                      <TableCell className="text-2xs text-muted-foreground whitespace-nowrap">
                        <span>{faDate(e.date)}</span>
                        <span className="text-muted-foreground/60 mr-1 text-3xs">{faTime(e.date)}</span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5">
                          <span className="text-2xs font-medium">{e.sourceLabel}</span>
                          {href && (
                            <Link
                              href={href}
                              className="text-muted-foreground hover:text-primary"
                              title="مشاهده سند مبدأ"
                            >
                              <ExternalLink className="h-3 w-3" />
                            </Link>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-2xs font-medium text-foreground">
                        {e.counterparty ? (
                          <span className="truncate max-w-[140px] block" title={e.counterparty.name}>
                            {e.counterparty.name}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-2xs text-muted-foreground">
                        {e.note || "—"}
                      </TableCell>
                      <TableCell className="text-end tabular-nums font-mono text-emerald-700 dark:text-emerald-400">
                        {e.debit > 0 ? money(e.debit) : "—"}
                      </TableCell>
                      <TableCell className="text-end tabular-nums font-mono text-amber-700 dark:text-amber-400">
                        {e.credit > 0 ? money(e.credit) : "—"}
                      </TableCell>
                      <TableCell className="text-end tabular-nums font-semibold font-mono">
                        {money(Math.abs(e.runningBalance))}
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge
                          variant="outline"
                          className={cn(
                            "text-3xs px-1 py-0",
                            isDeb && "border-emerald-500/40 text-emerald-600 bg-emerald-500/5",
                            isCrd && "border-amber-500/40 text-amber-600 bg-amber-500/5",
                            !isDeb && !isCrd && "border-muted text-muted-foreground"
                          )}
                        >
                          {isDeb ? "بدهکار" : isCrd ? "بستانکار" : "تسویه"}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
              <TableFooter className="bg-muted/80 font-bold text-xs">
                <TableRow>
                  <TableCell colSpan={6} className="text-start">
                    مجموع گردش و مانده نهایی دفتر معین:
                  </TableCell>
                  <TableCell className="text-end tabular-nums font-mono text-emerald-700 dark:text-emerald-400">
                    {money(data.periodTotals.debit)}
                  </TableCell>
                  <TableCell className="text-end tabular-nums font-mono text-amber-700 dark:text-amber-400">
                    {money(data.periodTotals.credit)}
                  </TableCell>
                  <TableCell className="text-end tabular-nums font-mono text-primary font-bold">
                    {money(Math.abs(data.closingBalance.amount))}
                  </TableCell>
                  <TableCell className="text-center text-2xs">
                    {data.closingBalance.amount > 0
                      ? "بدهکار"
                      : data.closingBalance.amount < 0
                      ? "بستانکار"
                      : "تسویه"}
                  </TableCell>
                </TableRow>
              </TableFooter>
            </Table>
          </div>
        </div>
      )}
    </div>
  );
}
