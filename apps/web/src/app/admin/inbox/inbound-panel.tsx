"use client";

import * as React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Boxes,
  CheckCircle2,
  Check,
  Clock,
  Plus,
  RefreshCw,
  Search,
  ShieldCheck,
  Truck,
  XCircle,
} from "lucide-react";

import {
  getInboundReceipts,
  verifyInboundReceipt,
  createInboundReceipt,
  getWarehouses,
} from "@/lib/api";
import type { InboundReceiptRow, Warehouse } from "@/lib/types";
import { formatDateTime, toFa, faDate } from "@/lib/format";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export function InboundPanel({ embedded = false }: { embedded?: boolean }) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState<string>("PENDING");
  const [isCreateOpen, setIsCreateOpen] = React.useState(false);

  const [newInbound, setNewInbound] = React.useState({
    supplierName: "",
    driverName: "",
    truckPlate: "",
    waybillNumber: "",
    warehouseId: "",
    notes: "",
  });

  const { data: inboundReceipts = [], isLoading, refetch } = useQuery({
    queryKey: ["inbound-receipts"],
    queryFn: () => getInboundReceipts(),
    refetchInterval: 5000,
  });

  const { data: warehouses = [] } = useQuery({
    queryKey: ["warehouses", "active"],
    queryFn: () => getWarehouses(),
  });

  React.useEffect(() => {
    if (warehouses.length > 0 && !newInbound.warehouseId) {
      setNewInbound((prev) => ({ ...prev, warehouseId: warehouses[0].id }));
    }
  }, [warehouses, newInbound.warehouseId]);

  const verifyMutation = useMutation({
    mutationFn: (body: { id: string; status: "VERIFIED" | "REJECTED"; verifiedBy: string }) =>
      verifyInboundReceipt(body.id, { status: body.status, verifiedBy: body.verifiedBy }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inbound-receipts"] });
      queryClient.invalidateQueries({ queryKey: ["inbound-receipts-count"] });
      toast({ title: "تأییدیه بارنامه ثبت شد", description: "وضعیت محموله در گیت ورودی به روزرسانی شد." });
    },
  });

  const createMutation = useMutation({
    mutationFn: createInboundReceipt,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inbound-receipts"] });
      queryClient.invalidateQueries({ queryKey: ["inbound-receipts-count"] });
      setIsCreateOpen(false);
      setNewInbound({
        supplierName: "",
        driverName: "",
        truckPlate: "",
        waybillNumber: "",
        warehouseId: warehouses[0]?.id || "",
        notes: "",
      });
      toast({ title: "رسید ورود بار ثبت شد" });
    },
  });

  const filtered = inboundReceipts.filter((r) => {
    if (statusFilter !== "ALL" && r.status !== statusFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const match =
        r.receiptNumber.toLowerCase().includes(q) ||
        r.supplierName.toLowerCase().includes(q) ||
        (r.waybillNumber && r.waybillNumber.toLowerCase().includes(q)) ||
        (r.driverName && r.driverName.toLowerCase().includes(q));
      if (!match) return false;
    }
    return true;
  });

  return (
    <div className="flex flex-col gap-4">
      {/* نوار فیلتر و ابزار */}
      <div className="flex flex-wrap items-center justify-between gap-2.5 rounded-xl border border-border bg-card p-3 shadow-2xs">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative w-64">
            <Search className="size-3.5 absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground/60" />
            <Input
              placeholder="جستجو در شماره رسید، تأمین‌کننده، بارنامه..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-8 pe-8 text-xs bg-background"
            />
          </div>

          <div className="flex items-center gap-1 text-xs">
            <button
              onClick={() => setStatusFilter("PENDING")}
              className={cn(
                "rounded-md px-2.5 py-1 text-xs font-bold transition-all",
                statusFilter === "PENDING"
                  ? "bg-amber-500/20 text-amber-800 dark:text-amber-200 ring-1 ring-amber-500/40"
                  : "text-muted-foreground hover:bg-muted/60",
              )}
            >
              در انتظار بازرسی ({toFa(inboundReceipts.filter((r) => r.status === "PENDING_VERIFICATION").length)})
            </button>
            <button
              onClick={() => setStatusFilter("VERIFIED")}
              className={cn(
                "rounded-md px-2.5 py-1 text-xs font-bold transition-all",
                statusFilter === "VERIFIED"
                  ? "bg-emerald-500/20 text-emerald-800 dark:text-emerald-200 ring-1 ring-emerald-500/40"
                  : "text-muted-foreground hover:bg-muted/60",
              )}
            >
              تأییدشده ({toFa(inboundReceipts.filter((r) => r.status === "VERIFIED").length)})
            </button>
            <button
              onClick={() => setStatusFilter("ALL")}
              className={cn(
                "rounded-md px-2.5 py-1 text-xs font-bold transition-all",
                statusFilter === "ALL"
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted/60",
              )}
            >
              همه ({toFa(inboundReceipts.length)})
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => refetch()} className="h-8 text-xs gap-1.5">
            <RefreshCw className={cn("size-3.5", isLoading && "animate-spin")} />
            بروزرسانی
          </Button>
          <Button
            size="sm"
            onClick={() => setIsCreateOpen(true)}
            className="h-8 text-xs gap-1.5 bg-teal-600 hover:bg-teal-700 text-white"
          >
            <Plus className="size-3.5" />
            ثبت ورود بار جدید
          </Button>
        </div>
      </div>

      {/* جدول محموله‌ها */}
      <Card className="p-0 overflow-hidden border shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead className="bg-muted/60 text-muted-foreground font-semibold border-b border-border select-none">
              <tr>
                <th className="py-2.5 px-3">شماره رسید GRN</th>
                <th className="py-2.5 px-3">شرکت تأمین‌کننده</th>
                <th className="py-2.5 px-3">بارنامه و خودروی حمل</th>
                <th className="py-2.5 px-3">انبار مقصد</th>
                <th className="py-2.5 px-3 text-center">زمان ورود</th>
                <th className="py-2.5 px-3 text-center">وضعیت</th>
                <th className="py-2.5 px-3">تأییدکننده</th>
                <th className="py-2.5 px-3 text-center">عملیات بازرسی مدیر</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border font-medium">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-muted-foreground">
                    هیچ محموله باری در این فیلتر ثبت نشده است.
                  </td>
                </tr>
              ) : (
                filtered.map((r) => {
                  const wh = warehouses.find((w) => w.id === r.warehouseId);
                  const isPending = r.status === "PENDING_VERIFICATION";
                  return (
                    <tr key={r.id} className="hover:bg-primary/[0.03] transition-colors group">
                      <td className="py-3 px-3.5">
                        <span className="font-mono font-bold text-teal-700 bg-teal-500/10 px-2 py-1 rounded-md border border-teal-500/20 text-xs">
                          {r.receiptNumber}
                        </span>
                      </td>
                      <td className="py-3 px-3.5 font-bold text-foreground text-xs group-hover:text-primary transition-colors">
                        {r.supplierName}
                      </td>
                      <td className="py-3 px-3.5">
                        <div className="flex flex-col gap-0.5">
                          <span className="font-mono text-xs text-foreground font-semibold">
                            بارنامه: {r.waybillNumber || "—"}
                          </span>
                          <span className="text-[11px] text-muted-foreground">
                            راننده: {r.driverName || "—"} {r.truckPlate ? `(${r.truckPlate})` : ""}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-3 text-muted-foreground font-medium text-xs">
                        {wh?.name || "انبار مرکزی"}
                      </td>
                      <td className="py-3 px-3 text-center font-mono text-xs">
                        {faDate(r.createdAt)}
                      </td>
                      <td className="py-3 px-3 text-center">
                        {r.status === "VERIFIED" ? (
                          <Badge className="bg-emerald-500/15 text-emerald-700 border-emerald-500/30 text-[10px] rounded-full px-2 font-bold">
                            تأیید و انبارش شد
                          </Badge>
                        ) : r.status === "REJECTED" ? (
                          <Badge className="bg-rose-500/15 text-rose-700 border-rose-500/30 text-[10px] rounded-full px-2 font-bold">
                            رد شده
                          </Badge>
                        ) : (
                          <Badge className="bg-amber-500/15 text-amber-700 border-amber-500/30 text-[10px] rounded-full px-2 font-bold animate-pulse">
                            در انتظار تأیید گیت
                          </Badge>
                        )}
                      </td>
                      <td className="py-3 px-3 text-muted-foreground text-xs font-semibold">
                        {r.verifiedBy || "—"}
                      </td>
                      <td className="py-3 px-3.5 text-center">
                        {isPending ? (
                          <div className="flex items-center justify-center gap-1.5">
                            <Button
                              size="sm"
                              onClick={() =>
                                verifyMutation.mutate({
                                  id: r.id,
                                  status: "VERIFIED",
                                  verifiedBy: "مدیر انبار",
                                })
                              }
                              disabled={verifyMutation.isPending}
                              className="h-7 text-xs px-2.5 bg-emerald-600 hover:bg-emerald-700 text-white gap-1 rounded-lg shadow-2xs font-semibold"
                            >
                              <CheckCircle2 className="size-3" />
                              تأیید ورود
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() =>
                                verifyMutation.mutate({
                                  id: r.id,
                                  status: "REJECTED",
                                  verifiedBy: "مدیر انبار",
                                })
                              }
                              disabled={verifyMutation.isPending}
                              className="h-7 text-xs px-2 border-rose-500/30 text-rose-700 hover:bg-rose-500/10 rounded-lg shadow-2xs font-semibold"
                            >
                              رد
                            </Button>
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground flex items-center justify-center gap-1 font-semibold">
                            <ShieldCheck className="size-3.5 text-emerald-600" />
                            بررسی شد
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* مودال ثبت محموله ورودی جدید */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Boxes className="size-5 text-teal-600" />
              ثبت بارنامه ورودی جدید (گیت انبار)
            </DialogTitle>
            <DialogDescription>
              ثبت مشخصات محموله وارده جهت بازرسی فیزیکی و تأیید تخلیه
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-3 py-2 text-xs">
            <div>
              <label className="text-[11px] font-semibold text-muted-foreground">نام تأمین‌کننده / فروشنده کالا *</label>
              <Input
                placeholder="مثلاً شرکت پارس نئوپان، بازرگانی چوب آسیا، یراق‌آلات بلوم"
                value={newInbound.supplierName}
                onChange={(e) => setNewInbound({ ...newInbound, supplierName: e.target.value })}
                className="mt-1 h-8 text-xs"
              />
            </div>

            <div>
              <label className="text-[11px] font-semibold text-muted-foreground">شماره بارنامه یا فاکتور ورودی</label>
              <Input
                placeholder="مثلاً BL-984210"
                value={newInbound.waybillNumber}
                onChange={(e) => setNewInbound({ ...newInbound, waybillNumber: e.target.value })}
                className="mt-1 h-8 text-xs font-mono"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[11px] font-semibold text-muted-foreground">نام راننده خودروی حمل</label>
                <Input
                  placeholder="محمد رستمی"
                  value={newInbound.driverName}
                  onChange={(e) => setNewInbound({ ...newInbound, driverName: e.target.value })}
                  className="mt-1 h-8 text-xs"
                />
              </div>
              <div>
                <label className="text-[11px] font-semibold text-muted-foreground">شماره پلاک خودرو</label>
                <Input
                  placeholder="ایران ۳۳ - ۱۲۳ ج ۴۵"
                  value={newInbound.truckPlate}
                  onChange={(e) => setNewInbound({ ...newInbound, truckPlate: e.target.value })}
                  className="mt-1 h-8 text-xs font-mono"
                />
              </div>
            </div>

            <div>
              <label className="text-[11px] font-semibold text-muted-foreground">انبار مقصد تخلیه</label>
              <select
                value={newInbound.warehouseId}
                onChange={(e) => setNewInbound({ ...newInbound, warehouseId: e.target.value })}
                className="mt-1 h-8 w-full rounded-md border border-input bg-background px-2 text-xs"
              >
                {warehouses.map((wh) => (
                  <option key={wh.id} value={wh.id}>
                    {wh.name} ({wh.code})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-[11px] font-semibold text-muted-foreground">توضیحات و اقلام بارنامه</label>
              <Textarea
                rows={2}
                placeholder="اقلام بارنامه و نکات تخلیه..."
                value={newInbound.notes}
                onChange={(e) => setNewInbound({ ...newInbound, notes: e.target.value })}
                className="mt-1 text-xs resize-none"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setIsCreateOpen(false)}>
              انصراف
            </Button>
            <Button
              size="sm"
              disabled={!newInbound.supplierName || createMutation.isPending}
              onClick={() => createMutation.mutate(newInbound)}
              className="bg-teal-600 hover:bg-teal-700 text-white gap-1.5"
            >
              <CheckCircle2 className="size-3.5" />
              {createMutation.isPending ? "در حال ثبت..." : "ثبت ورود بار"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
