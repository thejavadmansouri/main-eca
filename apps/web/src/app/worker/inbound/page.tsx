"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  AlertTriangle,
  ArrowRight,
  Boxes,
  Building2,
  Calendar,
  Check,
  CheckCircle2,
  ChevronDown,
  Clock,
  FileCheck2,
  FileSpreadsheet,
  FileText,
  Loader2,
  Package,
  Plus,
  RefreshCw,
  Search,
  ShieldAlert,
  ShieldCheck,
  Truck,
  User,
  X,
  XCircle,
} from "lucide-react";

import {
  createInboundReceipt,
  getInboundReceipts,
  getWarehouses,
  verifyInboundReceipt,
} from "@/lib/api";
import { useAuthStore } from "@/lib/auth-store";
import { faDate, toFa } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { InboundReceiptRow, Warehouse } from "@/lib/types";
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

const STATUS_MAP = {
  PENDING_VERIFICATION: {
    label: "در انتظار بازرسی و تایید",
    color: "bg-amber-500/10 text-amber-700 border-amber-500/30",
    badge: "bg-amber-500/20 text-amber-800",
  },
  VERIFIED: {
    label: "تایید شده و ترخیص به انبار",
    color: "bg-emerald-500/10 text-emerald-700 border-emerald-500/30",
    badge: "bg-emerald-600 text-white",
  },
  REJECTED: {
    label: "رد شده / دارای مغایرت",
    color: "bg-rose-500/10 text-rose-700 border-rose-500/30",
    badge: "bg-rose-600 text-white",
  },
};

export default function WorkerInboundPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = React.useState<"PENDING" | "VERIFIED" | "REJECTED" | "ALL">("PENDING");
  const [searchQuery, setSearchQuery] = React.useState("");

  // دیالوگ تایید یا رد بازرسی
  const [selectedReceipt, setSelectedReceipt] = React.useState<InboundReceiptRow | null>(null);
  const [isApproving, setIsApproving] = React.useState(true);
  const [qcPackageOk, setQcPackageOk] = React.useState(true);
  const [qcCountOk, setQcCountOk] = React.useState(true);
  const [qcSpecsOk, setQcSpecsOk] = React.useState(true);
  const [qcNotes, setQcNotes] = React.useState("");

  // دیالوگ ثبت محموله جدید ورودی
  const [isNewReceiptOpen, setIsNewReceiptOpen] = React.useState(false);
  const [newSupplier, setNewSupplier] = React.useState("");
  const [newDriver, setNewDriver] = React.useState("");
  const [newPlate, setNewPlate] = React.useState("");
  const [newWaybill, setNewWaybill] = React.useState("");
  const [newWarehouseId, setNewWarehouseId] = React.useState("");
  const [newItemsSummary, setNewItemsSummary] = React.useState("");

  // دریافت رسیدهای ورودی
  const {
    data: receipts = [],
    isLoading,
    refetch,
    isRefetching,
  } = useQuery<InboundReceiptRow[]>({
    queryKey: ["inbound-receipts"],
    queryFn: () => getInboundReceipts(),
    refetchInterval: 15000,
  });

  // دریافت انبارها
  const { data: warehouses = [] } = useQuery<Warehouse[]>({
    queryKey: ["warehouses"],
    queryFn: getWarehouses,
  });

  React.useEffect(() => {
    if (warehouses.length > 0 && !newWarehouseId) {
      setNewWarehouseId(warehouses[0].id);
    }
  }, [warehouses, newWarehouseId]);

  // میوتیشن بازرسی و تایید
  const verifyMutation = useMutation({
    mutationFn: ({
      id,
      approved,
      notes,
    }: {
      id: string;
      approved: boolean;
      notes?: string;
    }) =>
      verifyInboundReceipt(id, {
        status: approved ? "VERIFIED" : "REJECTED",
        verifiedBy: user?.fullName || user?.username || "مسئول کنترل کیفیت و بازرسی بار",
        notes,
      }),
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ["inbound-receipts"] });
      setSelectedReceipt(null);
      setQcNotes("");
      toast({
        title: vars.approved ? "محموله با موفقیت تایید و ترخیص شد" : "محموله رد شد و گزارش مغایرت ثبت گردید",
        description: vars.approved
          ? "اقلام وارده آماده چیدن در قفسه‌ها (Putaway) می‌باشند."
          : "گزارش عدم انطباق برای واحد بازرگانی ارسال شد.",
        variant: vars.approved ? "default" : "destructive",
      });
    },
    onError: (err: any) => {
      toast({
        title: "خطا در ثبت تاییدیه بار",
        description: err?.message || "مشکلی در ذخیره رخ داد.",
        variant: "destructive",
      });
    },
  });

  // میوتیشن ثبت ورود جدید
  const createMutation = useMutation({
    mutationFn: createInboundReceipt,
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ["inbound-receipts"] });
      setIsNewReceiptOpen(false);
      setNewSupplier("");
      setNewDriver("");
      setNewPlate("");
      setNewWaybill("");
      setNewItemsSummary("");
      toast({
        title: "ورود محموله با موفقیت ثبت شد",
        description: `شماره قبض: ${res.receiptNumber}`,
      });
    },
    onError: (err: any) => {
      toast({
        title: "خطا در ثبت محموله ورودی",
        description: err?.message || "مشکلی رخ داده است.",
        variant: "destructive",
      });
    },
  });

  const filteredReceipts = React.useMemo(() => {
    return receipts.filter((rc) => {
      if (activeTab === "PENDING" && rc.status !== "PENDING_VERIFICATION") return false;
      if (activeTab === "VERIFIED" && rc.status !== "VERIFIED") return false;
      if (activeTab === "REJECTED" && rc.status !== "REJECTED") return false;

      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase().trim();
      return (
        rc.receiptNumber.toLowerCase().includes(q) ||
        rc.supplierName.toLowerCase().includes(q) ||
        (rc.driverName && rc.driverName.toLowerCase().includes(q)) ||
        (rc.waybillNumber && rc.waybillNumber.toLowerCase().includes(q)) ||
        (rc.truckPlate && rc.truckPlate.toLowerCase().includes(q))
      );
    });
  }, [receipts, activeTab, searchQuery]);

  const pendingCount = receipts.filter((r) => r.status === "PENDING_VERIFICATION").length;
  const verifiedCount = receipts.filter((r) => r.status === "VERIFIED").length;
  const rejectedCount = receipts.filter((r) => r.status === "REJECTED").length;

  return (
    <div className="flex flex-1 flex-col min-h-screen bg-muted/20 pb-16 font-sans">
      {/* ───────────────────────── هدر ساده موبایل ───────────────────────── */}
      <header className="sticky top-0 z-30 flex items-center justify-between border-b bg-background/95 px-4 py-3 backdrop-blur-md shadow-2xs">
        <div className="flex items-center gap-2.5">
          <Link
            href="/worker"
            className="flex size-9 items-center justify-center rounded-xl bg-muted/80 text-foreground hover:bg-muted active:scale-95 transition-all"
            aria-label="بازگشت"
          >
            <ArrowRight className="size-4" />
          </Link>
          <div>
            <h1 className="text-sm font-black text-foreground flex items-center gap-1.5">
              <Truck className="size-4 text-sky-600" />
              تاییدیه و ترخیص ورود بار
            </h1>
            <p className="text-[11px] text-muted-foreground">
              کنترل کیفی و تایید ورودی‌های انبار
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <Button
            size="sm"
            onClick={() => setIsNewReceiptOpen(true)}
            className="h-8 text-xs gap-1 bg-sky-600 hover:bg-sky-700 text-white rounded-xl shadow-xs font-bold"
          >
            <Plus className="size-3.5" />
            ثبت ورود بار
          </Button>

          <Button
            variant="ghost"
            size="icon"
            onClick={() => refetch()}
            disabled={isRefetching}
            className="size-8 rounded-xl hover:bg-muted"
            title="بروزرسانی"
          >
            <RefreshCw className={cn("size-3.5 text-muted-foreground", isRefetching && "animate-spin text-primary")} />
          </Button>
        </div>
      </header>

      {/* ───────────────────────── فیلترها و تب‌های وضعیت ───────────────────────── */}
      <div className="border-b bg-card px-3 py-2.5 shadow-2xs space-y-2.5">
        <div className="relative">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="جستجو در تأمین‌کننده، راننده، شماره بارنامه یا پلاک..."
            className="h-10 pr-9 pl-8 text-xs font-semibold rounded-xl bg-muted/40 border-border/80"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-1"
            >
              <X className="size-3.5" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-1.5 text-xs">
          <button
            onClick={() => setActiveTab("PENDING")}
            className={cn(
              "flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl font-bold text-xs transition-all border",
              activeTab === "PENDING"
                ? "bg-amber-500 text-white border-amber-600 shadow-xs"
                : "bg-muted/60 text-muted-foreground border-border/60 hover:bg-muted"
            )}
          >
            <Clock className="size-3.5" />
            <span>در انتظار تایید</span>
            {pendingCount > 0 && (
              <span className="font-mono text-[10px] bg-black/20 text-white px-1.5 py-0.2 rounded-full">
                {toFa(pendingCount)}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab("VERIFIED")}
            className={cn(
              "flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl font-bold text-xs transition-all border",
              activeTab === "VERIFIED"
                ? "bg-emerald-600 text-white border-emerald-700 shadow-xs"
                : "bg-muted/60 text-muted-foreground border-border/60 hover:bg-muted"
            )}
          >
            <CheckCircle2 className="size-3.5" />
            <span>تایید شده</span>
            {verifiedCount > 0 && (
              <span className="font-mono text-[10px] bg-black/20 text-white px-1.5 py-0.2 rounded-full">
                {toFa(verifiedCount)}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab("REJECTED")}
            className={cn(
              "flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl font-bold text-xs transition-all border",
              activeTab === "REJECTED"
                ? "bg-rose-600 text-white border-rose-700 shadow-xs"
                : "bg-muted/60 text-muted-foreground border-border/60 hover:bg-muted"
            )}
          >
            <XCircle className="size-3.5" />
            <span>رد شده</span>
            {rejectedCount > 0 && (
              <span className="font-mono text-[10px] bg-black/20 text-white px-1.5 py-0.2 rounded-full">
                {toFa(rejectedCount)}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* ───────────────────────── لیست محموله‌های بار ورودی ───────────────────────── */}
      <main className="flex-1 p-3 space-y-3">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <Loader2 className="size-8 text-primary animate-spin" />
            <span className="text-xs text-muted-foreground font-semibold">در حال بارگذاری لیست محموله‌ها...</span>
          </div>
        ) : filteredReceipts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center gap-3">
            <div className="size-14 rounded-2xl bg-muted/60 flex items-center justify-center text-muted-foreground/50 border border-border">
              <Truck className="size-7" />
            </div>
            <div>
              <p className="text-sm font-bold text-foreground">هیچ محموله‌ای با این وضعیت ثبت نشده است</p>
              <p className="text-xs text-muted-foreground mt-1">
                برای اعلام ورود کامیون جدید، روی دکمه «ثبت ورود بار» در بالا کلیک کنید.
              </p>
            </div>
          </div>
        ) : (
          filteredReceipts.map((rc) => {
            const st = STATUS_MAP[rc.status] || STATUS_MAP.PENDING_VERIFICATION;
            const isPending = rc.status === "PENDING_VERIFICATION";

            return (
              <Card
                key={rc.id}
                className="overflow-hidden border-border/80 shadow-xs bg-card transition-all hover:border-primary/40"
              >
                {/* هدر کارت قبض ورود */}
                <div className="flex items-center justify-between border-b border-border/60 bg-muted/30 px-3.5 py-2">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-black text-foreground text-xs">{rc.receiptNumber}</span>
                    <Badge variant="outline" className={cn("text-[10px] font-bold px-2 py-0.5 border", st.color)}>
                      {st.label}
                    </Badge>
                  </div>

                  <span className="font-mono text-[11px] text-muted-foreground">
                    {faDate(rc.createdAt)}
                  </span>
                </div>

                {/* مشخصات محموله */}
                <div className="p-3.5 space-y-3">
                  <div>
                    <h3 className="font-bold text-sm text-foreground flex items-center gap-1.5">
                      <Building2 className="size-4 text-primary shrink-0" />
                      تأمین‌کننده: {rc.supplierName}
                    </h3>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs bg-muted/40 p-2.5 rounded-xl border border-border/50">
                    <div>
                      <span className="text-muted-foreground block text-[11px]">راننده و ناوگان:</span>
                      <span className="font-semibold text-foreground">
                        {rc.driverName || "راننده نامشخص"}
                      </span>
                    </div>

                    <div>
                      <span className="text-muted-foreground block text-[11px]">پلاک خودرو:</span>
                      <span className="font-mono font-bold text-foreground">
                        {rc.truckPlate || "—"}
                      </span>
                    </div>

                    <div>
                      <span className="text-muted-foreground block text-[11px]">شماره بارنامه:</span>
                      <span className="font-mono font-bold text-foreground">
                        {rc.waybillNumber ? toFa(rc.waybillNumber) : "—"}
                      </span>
                    </div>

                    <div>
                      <span className="text-muted-foreground block text-[11px]">انبار مقصد:</span>
                      <span className="font-semibold text-foreground">
                        {rc.warehouse ? rc.warehouse.name : "انبار مرکزی"}
                      </span>
                    </div>
                  </div>

                  {/* خلاصه اقلام بار */}
                  {rc.itemsJson && Array.isArray(rc.itemsJson) && rc.itemsJson.length > 0 && (
                    <div className="space-y-1.5">
                      <span className="text-xs font-bold text-muted-foreground block">
                        اقلام ثبت‌شده در بارنامه ({toFa(rc.itemsJson.length)} قلم):
                      </span>
                      <div className="bg-background rounded-lg border border-border/60 p-2 space-y-1 text-xs">
                        {rc.itemsJson.map((item, idx) => (
                          <div key={idx} className="flex items-center justify-between py-0.5">
                            <span className="font-medium text-foreground">{item.name}</span>
                            <span className="font-mono font-bold text-primary">
                              {toFa(item.quantity)} {item.unit || "عدد"}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* توضیحات ممیزی */}
                  {rc.notes && (
                    <div className="text-xs bg-muted/30 p-2 rounded-lg border border-border/40 text-muted-foreground">
                      <span className="font-bold text-foreground ml-1">ملاحظات بازرسی:</span>
                      {rc.notes}
                    </div>
                  )}

                  {/* بازرس تاییدکننده در صورت اتمام */}
                  {rc.verifiedBy && (
                    <div className="text-[11px] text-muted-foreground flex items-center justify-between pt-1 border-t border-border/40">
                      <span>بازرسی و ترخیص توسط:</span>
                      <span className="font-bold text-foreground">{rc.verifiedBy}</span>
                    </div>
                  )}

                  {/* دکمه‌های اقدام لمسی برای پرسنل */}
                  {isPending && (
                    <div className="flex items-center gap-2 pt-1">
                      <Button
                        size="lg"
                        onClick={() => {
                          setSelectedReceipt(rc);
                          setIsApproving(true);
                          setQcPackageOk(true);
                          setQcCountOk(true);
                          setQcSpecsOk(true);
                          setQcNotes("");
                        }}
                        className="flex-1 h-11 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-xs gap-1.5"
                      >
                        <ShieldCheck className="size-4" />
                        تایید و ترخیص بار به انبار
                      </Button>

                      <Button
                        variant="outline"
                        size="lg"
                        onClick={() => {
                          setSelectedReceipt(rc);
                          setIsApproving(false);
                          setQcNotes("");
                        }}
                        className="h-11 px-3 text-xs font-bold text-rose-600 hover:bg-rose-500/10 border-rose-500/30 rounded-xl"
                      >
                        <ShieldAlert className="size-4" />
                        عدم تایید
                      </Button>
                    </div>
                  )}
                </div>
              </Card>
            );
          })
        )}
      </main>

      {/* ───────────────────────── دیالوگ بازرسی کیفی و تایید/رد بار ───────────────────────── */}
      <Dialog open={Boolean(selectedReceipt)} onOpenChange={(open) => !open && setSelectedReceipt(null)}>
        <DialogContent className="max-w-md p-6 font-sans">
          {selectedReceipt && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2 text-base">
                  {isApproving ? (
                    <ShieldCheck className="size-5 text-emerald-600" />
                  ) : (
                    <ShieldAlert className="size-5 text-rose-600" />
                  )}
                  {isApproving ? "تایید نهایی و ترخیص ورود محموله" : "رد محموله و ثبت مغایرت بازرسی"}
                </DialogTitle>
                <DialogDescription className="text-xs">
                  قبض ورود: <span className="font-mono font-bold text-foreground">{selectedReceipt.receiptNumber}</span> |{" "}
                  تأمین‌کننده: {selectedReceipt.supplierName}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-3.5 py-2 text-xs">
                {isApproving ? (
                  <div className="space-y-2 bg-muted/40 p-3 rounded-xl border border-border/80">
                    <span className="font-bold text-foreground block mb-1">چک‌لیست بازرسی کنترل کیفی (QC):</span>

                    <label className="flex items-center gap-2 cursor-pointer py-1">
                      <input
                        type="checkbox"
                        checked={qcPackageOk}
                        onChange={(e) => setQcPackageOk(e.target.checked)}
                        className="size-4 rounded text-primary focus:ring-primary"
                      />
                      <span className="font-medium text-foreground">بسته‌بندی و سلامت فیزیکی بار بدون شکستگی</span>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer py-1">
                      <input
                        type="checkbox"
                        checked={qcCountOk}
                        onChange={(e) => setQcCountOk(e.target.checked)}
                        className="size-4 rounded text-primary focus:ring-primary"
                      />
                      <span className="font-medium text-foreground">تعداد اقلام دریافتی با برگه بارنامه مطابقت دارد</span>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer py-1">
                      <input
                        type="checkbox"
                        checked={qcSpecsOk}
                        onChange={(e) => setQcSpecsOk(e.target.checked)}
                        className="size-4 rounded text-primary focus:ring-primary"
                      />
                      <span className="font-medium text-foreground">تطابق رنگ، ابعاد، گرید و مشخصات فنی سفارش</span>
                    </label>
                  </div>
                ) : (
                  <div className="bg-rose-500/10 border border-rose-500/30 p-3 rounded-xl text-rose-800 text-xs leading-relaxed">
                    با ثبت عدم تایید، محموله بار متوقف شده و گزارش مغایرت رسمی برای مدیر انبار و تأمین‌کننده ارسال می‌گردد.
                  </div>
                )}

                <div>
                  <label className="font-bold text-foreground block mb-1">
                    {isApproving ? "یادداشت بازرسی کیفی (اختیاری):" : "علت دقیق عدم تایید / کسری یا خسارت بار:"}
                  </label>
                  <Textarea
                    value={qcNotes}
                    onChange={(e) => setQcNotes(e.target.value)}
                    placeholder={
                      isApproving
                        ? "مثال: بار سالم تخلیه شد و برچسب انبار الصاق گردید..."
                        : "مثال: تعداد ۵ ورق های‌گلاس دارای خط و خش و گوشه‌پریدگی بود..."
                    }
                    className="text-xs rounded-xl min-h-[80px]"
                  />
                </div>

                <div className="text-[11px] text-muted-foreground bg-muted/40 p-2.5 rounded-lg border border-border/50">
                  بازرس مسئول:{" "}
                  <span className="font-semibold text-foreground">
                    {user?.fullName || user?.username || "پرسنل انبار"}
                  </span>
                </div>
              </div>

              <DialogFooter className="gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedReceipt(null)}
                  className="text-xs"
                >
                  انصراف
                </Button>
                <Button
                  size="sm"
                  disabled={verifyMutation.isPending || (!isApproving && !qcNotes.trim())}
                  onClick={() => {
                    verifyMutation.mutate({
                      id: selectedReceipt.id,
                      approved: isApproving,
                      notes: qcNotes || undefined,
                    });
                  }}
                  className={cn(
                    "text-white text-xs font-bold gap-1.5",
                    isApproving ? "bg-emerald-600 hover:bg-emerald-700" : "bg-rose-600 hover:bg-rose-700"
                  )}
                >
                  {verifyMutation.isPending
                    ? "در حال ثبت..."
                    : isApproving
                    ? "تایید نهایی و ترخیص"
                    : "ثبت قطعی رد بار"}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* ───────────────────────── دیالوگ ثبت ورود محموله جدید ───────────────────────── */}
      <Dialog open={isNewReceiptOpen} onOpenChange={setIsNewReceiptOpen}>
        <DialogContent className="max-w-md p-6 font-sans">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base">
              <Truck className="size-5 text-sky-600" />
              ثبت ورود محموله جدید بار به انبار
            </DialogTitle>
            <DialogDescription className="text-xs">
              اطلاعات بارنامه و راننده مستقر پشت درب انبار را وارد کنید.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2 text-xs">
            <div>
              <label className="font-bold text-foreground block mb-1">نام شرکت یا تأمین‌کننده:</label>
              <Input
                value={newSupplier}
                onChange={(e) => setNewSupplier(e.target.value)}
                placeholder="مثال: شرکت بازرگانی ام‌دی‌اف آسیا"
                className="h-9 text-xs rounded-lg"
              />
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="font-medium text-foreground block mb-1">نام راننده:</label>
                <Input
                  value={newDriver}
                  onChange={(e) => setNewDriver(e.target.value)}
                  placeholder="علی حسینی"
                  className="h-9 text-xs rounded-lg"
                />
              </div>

              <div>
                <label className="font-medium text-foreground block mb-1">پلاک خودرو:</label>
                <Input
                  value={newPlate}
                  onChange={(e) => setNewPlate(e.target.value)}
                  placeholder="۲۲ ب ۴۵۶ ایران ۶۶"
                  className="h-9 text-xs rounded-lg font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="font-medium text-foreground block mb-1">شماره بارنامه:</label>
                <Input
                  value={newWaybill}
                  onChange={(e) => setNewWaybill(e.target.value)}
                  placeholder="۹۸۷۶۵۴"
                  className="h-9 text-xs rounded-lg font-mono"
                />
              </div>

              <div>
                <label className="font-medium text-foreground block mb-1">انبار مقصد:</label>
                <select
                  value={newWarehouseId}
                  onChange={(e) => setNewWarehouseId(e.target.value)}
                  className="w-full h-9 rounded-lg border border-input bg-card px-2 text-xs font-semibold"
                >
                  {warehouses.map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="font-medium text-foreground block mb-1">شرح اقلام و مقادیر (اختیاری):</label>
              <Textarea
                value={newItemsSummary}
                onChange={(e) => setNewItemsSummary(e.target.value)}
                placeholder="مثال: ۴۰ ورق های‌گلاس سفید، ۲۰ شاخه پروفیل تاج، ۵ کارتن یراق بلوم"
                className="text-xs rounded-lg min-h-[70px]"
              />
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsNewReceiptOpen(false)}
              className="text-xs"
            >
              انصراف
            </Button>
            <Button
              size="sm"
              disabled={createMutation.isPending || !newSupplier.trim() || !newWarehouseId}
              onClick={() => {
                createMutation.mutate({
                  supplierName: newSupplier.trim(),
                  driverName: newDriver.trim() || undefined,
                  truckPlate: newPlate.trim() || undefined,
                  waybillNumber: newWaybill.trim() || undefined,
                  warehouseId: newWarehouseId,
                  notes: newItemsSummary.trim() || undefined,
                });
              }}
              className="bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold gap-1.5"
            >
              {createMutation.isPending ? "در حال ثبت..." : "ثبت و صدور قبض ورود"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
