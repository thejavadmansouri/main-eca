"use client";

import * as React from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import {
  BookOpen,
  ChevronDown,
  ChevronLeft,
  ExternalLink,
  Layers,
  Scale,
  ScrollText,
} from "lucide-react";

import { PageHeader } from "@/components/page-header";
import { LoadingState, ErrorState, EmptyState } from "@/components/states";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
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
import { DataTablePagination } from "@/components/data-table-pagination";
import { ActiveFilters, ListToolbar, type ActiveFilter } from "@/components/list-toolbar";
import { JalaliDateInput } from "@/components/jalali-date-input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { sourceHrefFor } from "@/components/voucher-card";
import { useAuthStore } from "@/lib/auth-store";
import { getVouchers } from "@/lib/api";
import { faDate, faTime, money, toFa } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { VoucherRow, VoucherSourceType } from "@/lib/types";

import { TrialBalanceView } from "./trial-balance-view";
import { GeneralLedgerView } from "./general-ledger-view";
import { ChartOfAccountsView } from "./chart-of-accounts-view";

/** برچسب فارسیِ نوع سند — با enum سمت سرور هماهنگ. */
const SOURCE_LABELS: Record<string, string> = {
  SALE_INVOICE: "فاکتور فروش",
  SALE_CANCEL: "ابطال فاکتور",
  RECEIPT: "دریافت وجه",
  SALE_RETURN: "مرجوعی",
  SALE_CORRECTION: "اصلاحیه",
  PURCHASE_INVOICE: "فاکتور خرید",
  PURCHASE_CANCEL: "ابطال فاکتور خرید",
};

const PAGE_SIZE = 20;

/** جمعِ بدهکار/بستانکارِ یک سند — فقط جمعِ نمایشیِ خطوطی که سرور فرستاده. */
function totals(v: VoucherRow) {
  let debit = 0;
  let credit = 0;
  for (const l of v.lines) {
    debit += l.debit;
    credit += l.credit;
  }
  return { debit, credit };
}

const NUM = "text-end tabular-nums";

export default function VouchersPage() {
  const role = useAuthStore((s) => s.user?.role);
  const isManager = role === "ADMIN" || role === "MANAGER";

  const [activeTab, setActiveTab] = React.useState("trial-balance");
  const [selectedLedgerAccount, setSelectedLedgerAccount] = React.useState("CUSTOMERS");

  const [sourceType, setSourceType] = React.useState<VoucherSourceType | "">("");
  const [from, setFrom] = React.useState<string | undefined>(undefined);
  const [to, setTo] = React.useState<string | undefined>(undefined);
  const [page, setPage] = React.useState(1);
  const [expanded, setExpanded] = React.useState<Set<string>>(() => new Set());

  const list = useQuery({
    queryKey: ["vouchers", sourceType, from, to, page],
    queryFn: () => getVouchers({ sourceType, from, to, page, limit: PAGE_SIZE }),
    enabled: isManager && activeTab === "journal",
  });

  const hasFilter = sourceType !== "" || !!from || !!to;

  const reset = () => {
    setSourceType("");
    setFrom(undefined);
    setTo(undefined);
    setPage(1);
  };

  const activeFilters: ActiveFilter[] = [
    ...(sourceType
      ? [
          {
            key: "type",
            label: `نوع: ${SOURCE_LABELS[sourceType] ?? sourceType}`,
            onRemove: () => {
              setSourceType("");
              setPage(1);
            },
          },
        ]
      : []),
    ...(from
      ? [
          {
            key: "from",
            label: `از ${faDate(from)}`,
            onRemove: () => {
              setFrom(undefined);
              setPage(1);
            },
          },
        ]
      : []),
    ...(to
      ? [
          {
            key: "to",
            label: `تا ${faDate(to)}`,
            onRemove: () => {
              setTo(undefined);
              setPage(1);
            },
          },
        ]
      : []),
  ];

  const toggle = (id: string) =>
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const handleSelectAccountForLedger = (acc: string) => {
    setSelectedLedgerAccount(acc);
    setActiveTab("general-ledger");
  };

  const rows = list.data?.data ?? [];
  const meta = list.data?.meta;
  const pageTotals = rows.reduce(
    (acc, v) => {
      const t = totals(v);
      return { debit: acc.debit + t.debit, credit: acc.credit + t.credit };
    },
    { debit: 0, credit: 0 },
  );
  const pageBalanced = pageTotals.debit === pageTotals.credit;

  return (
    <div className="space-y-4">
      <PageHeader
        title="حسابداری و دفاتر مالی"
        description="دفتر روزنامه، تراز آزمایشی ۴ و ۸ ستونی، دفتر معین و ساختار کدینگ حسابداری استاندارد ایران"
        icon={ScrollText}
      />

      {!isManager ? (
        <Card className="p-8 text-center text-sm text-muted-foreground">
          این صفحه فقط برای مدیر و حسابدار مجاز است.
        </Card>
      ) : (
        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          dir="rtl"
          className="space-y-4"
        >
          <TabsList className="h-9 justify-start rounded-md border bg-muted/50 p-1">
            <TabsTrigger value="trial-balance" className="text-xs gap-1.5">
              <Scale className="h-3.5 w-3.5" />
              <span>تراز آزمایشی (۴ و ۸ ستونی)</span>
            </TabsTrigger>
            <TabsTrigger value="journal" className="text-xs gap-1.5">
              <ScrollText className="h-3.5 w-3.5" />
              <span>دفتر روزنامه (اسناد مالی)</span>
            </TabsTrigger>
            <TabsTrigger value="general-ledger" className="text-xs gap-1.5">
              <BookOpen className="h-3.5 w-3.5" />
              <span>دفتر کل و معین</span>
            </TabsTrigger>
            <TabsTrigger value="chart-of-accounts" className="text-xs gap-1.5">
              <Layers className="h-3.5 w-3.5" />
              <span>ساختار کدینگ حساب‌ها</span>
            </TabsTrigger>
          </TabsList>

          {/* تب ۱: تراز آزمایشی ۴ و ۸ ستونی */}
          <TabsContent value="trial-balance" className="mt-0">
            <TrialBalanceView
              onSelectAccountForLedger={handleSelectAccountForLedger}
            />
          </TabsContent>

          {/* تب ۲: دفتر روزنامه */}
          <TabsContent value="journal" className="mt-0 space-y-4">
            <div className="space-y-2">
              <ListToolbar
                actions={
                  meta ? (
                    <span className="text-xs text-muted-foreground tabular-nums">
                      {toFa(meta.total)} سند
                    </span>
                  ) : null
                }
              >
                <Select
                  value={sourceType || "all"}
                  onValueChange={(v) => {
                    setSourceType(v === "all" ? "" : (v as VoucherSourceType));
                    setPage(1);
                  }}
                >
                  <SelectTrigger className="h-9 w-44" aria-label="نوع سند">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">همه‌ی انواع سند</SelectItem>
                    {Object.entries(SOURCE_LABELS).map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <div className="flex items-center gap-1.5">
                  <span className="text-xs text-muted-foreground">از</span>
                  <JalaliDateInput
                    value={from}
                    onChange={(iso) => {
                      setFrom(iso);
                      setPage(1);
                    }}
                  />
                </div>

                <div className="flex items-center gap-1.5">
                  <span className="text-xs text-muted-foreground">تا</span>
                  <JalaliDateInput
                    value={to}
                    onChange={(iso) => {
                      setTo(iso);
                      setPage(1);
                    }}
                  />
                </div>
              </ListToolbar>

              <ActiveFilters filters={activeFilters} onClearAll={reset} />
            </div>

            {list.isLoading ? (
              <LoadingState label="در حال بارگذاری سندها..." />
            ) : list.isError ? (
              <ErrorState onRetry={() => list.refetch()} />
            ) : !rows.length ? (
              <EmptyState
                title="سندی یافت نشد"
                description={
                  hasFilter
                    ? "با این فیلترها سندی ثبت نشده است"
                    : "هنوز هیچ اکشن مالی ثبت نشده — با اولین فاکتور، اولین سند اینجا می‌نشیند"
                }
              />
            ) : (
              <>
                <Card className="overflow-hidden p-0 border shadow-2xs">
                  <Table containerClassName="max-h-[calc(100vh-17rem)] overflow-y-auto">
                    <TableHeader sticky className="bg-muted/60 text-2xs">
                      <TableRow>
                        <TableHead className="w-12">ردیف</TableHead>
                        <TableHead className="w-28">تاریخ</TableHead>
                        <TableHead className="w-24">شماره سند</TableHead>
                        <TableHead className="w-36">نوع سند</TableHead>
                        <TableHead>شرح</TableHead>
                        <TableHead className="w-44">طرف حساب / مرجع</TableHead>
                        <TableHead className={cn(NUM, "w-36")}>بدهکار</TableHead>
                        <TableHead className={cn(NUM, "w-36")}>بستانکار</TableHead>
                      </TableRow>
                    </TableHeader>

                    <TableBody>
                      {rows.map((v, i) => (
                        <VoucherLedgerRows
                          key={v.id}
                          voucher={v}
                          index={(page - 1) * PAGE_SIZE + i + 1}
                          open={expanded.has(v.id)}
                          onToggle={() => toggle(v.id)}
                        />
                      ))}
                    </TableBody>

                    <TableFooter className="sticky bottom-0 z-10 bg-muted/95 backdrop-blur font-bold text-xs">
                      <TableRow className="hover:bg-transparent">
                        <TableCell colSpan={6} className="font-bold">
                          <span className="flex flex-wrap items-center gap-2">
                            جمع این صفحه
                            {pageBalanced ? (
                              <span className="text-xs font-normal text-muted-foreground">
                                · تراز است
                              </span>
                            ) : (
                              <span className="text-xs font-semibold text-destructive">
                                · اختلاف {money(Math.abs(pageTotals.debit - pageTotals.credit))}
                              </span>
                            )}
                          </span>
                        </TableCell>
                        <TableCell className={cn(NUM, "font-bold text-emerald-700 dark:text-emerald-400 font-mono")}>
                          {money(pageTotals.debit)}
                        </TableCell>
                        <TableCell className={cn(NUM, "font-bold text-amber-700 dark:text-amber-400 font-mono")}>
                          {money(pageTotals.credit)}
                        </TableCell>
                      </TableRow>
                    </TableFooter>
                  </Table>
                </Card>

                {meta ? (
                  <DataTablePagination
                    page={meta.page}
                    totalPages={Math.max(1, Math.ceil(meta.total / meta.limit))}
                    onChange={setPage}
                  />
                ) : null}
              </>
            )}
          </TabsContent>

          {/* تب ۳: دفتر معین و کل */}
          <TabsContent value="general-ledger" className="mt-0">
            <GeneralLedgerView initialAccount={selectedLedgerAccount} />
          </TabsContent>

          {/* تب ۴: ساختار کدینگ حساب‌ها */}
          <TabsContent value="chart-of-accounts" className="mt-0">
            <ChartOfAccountsView
              onSelectAccountForLedger={handleSelectAccountForLedger}
            />
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}

/**
 * یک سند در دفتر: ردیفِ سرصفحه (جمع بدهکار/بستانکار) + خطوطِ حساب‌ها وقتی باز است.
 * خطوط با تورفتگی زیر «شرح» می‌نشینند — همان شکلِ دفتر روزنامه‌ی کاغذی.
 */
function VoucherLedgerRows({
  voucher: v,
  index,
  open,
  onToggle,
}: {
  voucher: VoucherRow;
  index: number;
  open: boolean;
  onToggle: () => void;
}) {
  const { debit, credit } = totals(v);
  const balanced = debit === credit;
  const { href, label } = sourceHrefFor(v);
  const isReversal = !!v.reversesVoucherId;
  const cp = v.counterparty;
  const linesId = `voucher-lines-${v.id}`;

  return (
    <>
      <TableRow
        className={cn("cursor-pointer", open && "bg-muted/40")}
        onClick={onToggle}
      >
        <TableCell className="tabular-nums text-muted-foreground text-2xs">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onToggle();
            }}
            aria-expanded={open}
            aria-controls={linesId}
            aria-label={open ? "بستن خطوط سند" : "نمایش خطوط سند"}
            className="inline-flex items-center gap-1 rounded focus-visible:outline-2 focus-visible:outline-ring"
          >
            {open ? <ChevronDown className="size-3.5" /> : <ChevronLeft className="size-3.5" />}
            {toFa(index)}
          </button>
        </TableCell>
        <TableCell className="tabular-nums text-2xs">
          <div>{faDate(v.createdAt)}</div>
          <div className="text-3xs text-muted-foreground">{faTime(v.createdAt)}</div>
        </TableCell>
        <TableCell className="tabular-nums font-semibold text-2xs">
          {href ? (
            <Link
              href={href}
              onClick={(e) => e.stopPropagation()}
              title={label}
              className="inline-flex items-center gap-1 text-primary hover:underline"
            >
              {toFa(v.number)}
              <ExternalLink className="size-3 opacity-60" />
            </Link>
          ) : (
            toFa(v.number)
          )}
        </TableCell>
        <TableCell>
          <Badge
            variant="outline"
            className={cn(
              "font-normal text-3xs px-1.5 py-0",
              isReversal && "border-destructive/40 text-destructive"
            )}
          >
            {v.sourceLabel}
          </Badge>
        </TableCell>
        <TableCell className="max-w-0 whitespace-normal">
          <span className="line-clamp-2 text-2xs">{v.note ?? "—"}</span>
          {!balanced ? (
            <span className="text-3xs font-semibold text-destructive">سند نامتوازن</span>
          ) : null}
        </TableCell>
        <TableCell className="whitespace-normal text-2xs">
          {cp ? (
            <Link
              href={cp.kind === "CUSTOMER" ? `/admin/customers/${cp.id}` : `/admin/suppliers/${cp.id}`}
              onClick={(e) => e.stopPropagation()}
              className="hover:underline font-medium"
            >
              {cp.name}
              <span className="ms-1 text-3xs text-muted-foreground">
                {cp.kind === "CUSTOMER" ? "(مشتری)" : "(تأمین‌کننده)"}
              </span>
            </Link>
          ) : (
            <span className="text-muted-foreground text-3xs">عمومی</span>
          )}
        </TableCell>
        <TableCell className={cn(NUM, "font-semibold font-mono text-emerald-700 dark:text-emerald-400")}>
          {money(debit)}
        </TableCell>
        <TableCell className={cn(NUM, "font-semibold font-mono text-amber-700 dark:text-amber-400")}>
          {money(credit)}
        </TableCell>
      </TableRow>

      {open
        ? v.lines.map((l, li) => (
            <TableRow
              key={`${v.id}-${li}`}
              id={li === 0 ? linesId : undefined}
              className="border-border/30 bg-muted/20 text-xs hover:bg-muted/30"
            >
              <TableCell colSpan={4} />
              {/* بستانکار در دفترِ سنتی با تورفتگیِ بیشتر نوشته می‌شود. */}
              <TableCell className={cn("whitespace-normal", l.credit > 0 ? "ps-10" : "ps-5")}>
                <span className="font-medium text-2xs">{l.accountLabel}</span>
                {l.note ? (
                  <span className="ms-2 text-3xs text-muted-foreground">{l.note}</span>
                ) : null}
              </TableCell>
              <TableCell />
              <TableCell className={cn(NUM, "text-muted-foreground font-mono text-2xs")}>
                {l.debit > 0 ? money(l.debit) : ""}
              </TableCell>
              <TableCell className={cn(NUM, "text-muted-foreground font-mono text-2xs")}>
                {l.credit > 0 ? money(l.credit) : ""}
              </TableCell>
            </TableRow>
          ))
        : null}
    </>
  );
}
