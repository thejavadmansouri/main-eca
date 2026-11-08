"use client";

import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import {
  ChevronDown,
  ChevronLeft,
  FileText,
  Folder,
  FolderOpen,
  Layers,
  Search,
} from "lucide-react";

import { getChartOfAccounts } from "@/lib/api";
import { toFa } from "@/lib/format";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { LoadingState, ErrorState } from "@/components/states";

interface ChartOfAccountsViewProps {
  onSelectAccountForLedger?: (account: string) => void;
}

export function ChartOfAccountsView({ onSelectAccountForLedger }: ChartOfAccountsViewProps) {
  const [search, setSearch] = React.useState("");
  const [expandedGroups, setExpandedGroups] = React.useState<Set<string>>(
    () => new Set(["1", "3", "6", "7"])
  );
  const [expandedKols, setExpandedKols] = React.useState<Set<string>>(
    () => new Set(["101", "102", "103", "104", "301", "302", "601", "602", "603", "701"])
  );

  const query = useQuery({
    queryKey: ["chart-of-accounts"],
    queryFn: () => getChartOfAccounts(),
  });

  const toggleGroup = (code: string) => {
    setExpandedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(code)) next.delete(code);
      else next.add(code);
      return next;
    });
  };

  const toggleKol = (code: string) => {
    setExpandedKols((prev) => {
      const next = new Set(prev);
      if (next.has(code)) next.delete(code);
      else next.add(code);
      return next;
    });
  };

  const groups = query.data?.groups ?? [];

  // فیلتر جستجو
  const filteredGroups = React.useMemo(() => {
    if (!search.trim()) return groups;
    const term = search.trim().toLowerCase();

    return groups
      .map((g) => {
        const matchesGroup =
          g.groupName.toLowerCase().includes(term) || g.groupCode.includes(term);
        const filteredKols = g.kols
          .map((k) => {
            const matchesKol =
              k.kolName.toLowerCase().includes(term) || k.kolCode.includes(term);
            const filteredMoeins = k.moeins.filter(
              (m) =>
                m.moeinName.toLowerCase().includes(term) ||
                m.moeinCode.includes(term) ||
                m.description.toLowerCase().includes(term)
            );
            if (matchesKol || filteredMoeins.length > 0) {
              return { ...k, moeins: matchesKol ? k.moeins : filteredMoeins };
            }
            return null;
          })
          .filter(Boolean) as typeof g.kols;

        if (matchesGroup || filteredKols.length > 0) {
          return { ...g, kols: matchesGroup ? g.kols : filteredKols };
        }
        return null;
      })
      .filter(Boolean) as typeof groups;
  }, [groups, search]);

  return (
    <div className="space-y-4">
      {/* سرچ و خلاصه */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-md border bg-card p-3 shadow-2xs">
        <div className="relative w-full max-w-sm">
          <Search className="absolute right-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="جستجوی کد یا نام سرفصل حسابداری..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-8 pr-8 text-xs"
          />
        </div>
        <div className="flex items-center gap-2 text-2xs text-muted-foreground">
          <Badge variant="outline" className="border-blue-500/30 text-blue-600 bg-blue-500/5">
            گروه (تک‌رقمی)
          </Badge>
          <Badge variant="outline" className="border-purple-500/30 text-purple-600 bg-purple-500/5">
            کل (۳ رقمی)
          </Badge>
          <Badge variant="outline" className="border-slate-500/30 text-slate-600 bg-slate-500/5">
            معین (۵ رقمی)
          </Badge>
        </div>
      </div>

      {query.isLoading ? (
        <LoadingState label="در حال دریافت ساختار کدینگ حسابداری..." />
      ) : query.isError ? (
        <ErrorState onRetry={() => query.refetch()} />
      ) : (
        <div className="space-y-3">
          {filteredGroups.map((group) => {
            const isGroupOpen = expandedGroups.has(group.groupCode) || !!search;
            return (
              <Card key={group.groupCode} className="overflow-hidden border shadow-2xs">
                {/* هدر گروه */}
                <div
                  className="flex items-center justify-between bg-muted/40 p-3 cursor-pointer select-none hover:bg-muted/60 transition-colors"
                  onClick={() => toggleGroup(group.groupCode)}
                >
                  <div className="flex items-center gap-2">
                    {isGroupOpen ? (
                      <FolderOpen className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                    ) : (
                      <Folder className="h-4 w-4 text-muted-foreground" />
                    )}
                    <span className="font-mono text-xs font-bold text-blue-600 dark:text-blue-400">
                      {toFa(group.groupCode)}
                    </span>
                    <span className="text-xs font-bold text-foreground">
                      {group.groupName}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-3xs px-1.5 py-0">
                      {group.category === "BALANCE_SHEET" ? "ترازنامه‌ای" : "سود و زیانی"}
                    </Badge>
                    <Badge
                      variant="outline"
                      className={cn(
                        "text-3xs px-1.5 py-0",
                        group.nature === "DEBIT"
                          ? "border-emerald-500/30 text-emerald-600 bg-emerald-500/5"
                          : "border-amber-500/30 text-amber-600 bg-amber-500/5"
                      )}
                    >
                      ماهیت: {group.nature === "DEBIT" ? "بدهکار" : "بستانکار"}
                    </Badge>
                    {isGroupOpen ? (
                      <ChevronDown className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <ChevronLeft className="h-4 w-4 text-muted-foreground" />
                    )}
                  </div>
                </div>

                {/* حساب‌های کل و معین درون گروه */}
                {isGroupOpen && (
                  <div className="divide-y border-t bg-card">
                    {group.kols.map((kol) => {
                      const isKolOpen = expandedKols.has(kol.kolCode) || !!search;
                      return (
                        <div key={kol.kolCode} className="p-2 sm:pr-6">
                          <div
                            className="flex items-center justify-between p-2 rounded hover:bg-muted/30 cursor-pointer select-none transition-colors"
                            onClick={() => toggleKol(kol.kolCode)}
                          >
                            <div className="flex items-center gap-2">
                              {isKolOpen ? (
                                <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                              ) : (
                                <ChevronLeft className="h-3.5 w-3.5 text-muted-foreground" />
                              )}
                              <span className="font-mono text-2xs font-bold text-purple-600 dark:text-purple-400">
                                {toFa(kol.kolCode)}
                              </span>
                              <span className="text-xs font-semibold text-foreground">
                                {kol.kolName}
                              </span>
                            </div>
                            <span className="text-3xs text-muted-foreground">
                              {toFa(kol.moeins.length)} معین
                            </span>
                          </div>

                          {/* لیست حساب‌های معین */}
                          {isKolOpen && (
                            <div className="mt-1 space-y-1.5 pr-6">
                              {kol.moeins.map((moein) => (
                                <div
                                  key={moein.moeinCode}
                                  className="flex flex-wrap items-center justify-between rounded-md border border-dashed p-2 text-xs bg-muted/10 hover:bg-muted/30 transition-colors"
                                >
                                  <div className="space-y-0.5">
                                    <div className="flex items-center gap-2">
                                      <FileText className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                                      <span className="font-mono text-2xs font-semibold text-slate-700 dark:text-slate-300">
                                        {toFa(moein.moeinCode)}
                                      </span>
                                      <span className="font-medium text-foreground">
                                        {moein.moeinName}
                                      </span>
                                      <Badge variant="outline" className="text-3xs px-1 py-0 font-mono">
                                        {moein.fixedAccount}
                                      </Badge>
                                    </div>
                                    <p className="text-3xs text-muted-foreground pr-5">
                                      {moein.description}
                                    </p>
                                  </div>

                                  <div className="flex items-center gap-2">
                                    {onSelectAccountForLedger && (
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-6 px-2 text-2xs text-primary hover:bg-primary/10"
                                        onClick={() => onSelectAccountForLedger(moein.fixedAccount)}
                                      >
                                        گردش و دفتر معین
                                      </Button>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
