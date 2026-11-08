"use client";

import * as React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  AlertCircle,
  Barcode,
  CheckCircle2,
  Clock,
  Compass,
  ExternalLink,
  Factory,
  FileSpreadsheet,
  Filter,
  Layers,
  LayoutGrid,
  PackageCheck,
  Plus,
  Printer,
  QrCode,
  RefreshCw,
  Ruler,
  Scissors,
  Search,
  ShieldCheck,
  Sparkles,
  Tag,
  Truck,
  Wrench,
} from "lucide-react";

import {
  addCuttingItem,
  addWoodProfile,
  createInstallationOrder,
  getComprehensiveProductionMatrix,
  getCuttingList,
  getInstallationOrders,
  getProductionOrders,
  getWoodProfiles,
} from "@/lib/api";
import { faDate, money, toFa } from "@/lib/format";
import { cn } from "@/lib/utils";
import type {
  CuttingListItemRow,
  InstallationOrderRow,
  ProductionMatrixRow,
  ProductionOrderRow,
  WoodOrderProfileRow,
} from "@/lib/types";

import { PageHeader } from "@/components/page-header";
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

/** دیاگرام مینیاتوری بصری نوار PVC ۴ لبه قطعه کارگاهی */
function EdgeBandingMiniDiagram({
  l1,
  l2,
  w1,
  w2,
}: {
  l1?: string | null;
  l2?: string | null;
  w1?: string | null;
  w2?: string | null;
}) {
  const isL1 = l1 && l1 !== "بدون نوار";
  const isL2 = l2 && l2 !== "بدون نوار";
  const isW1 = w1 && w1 !== "بدون نوار";
  const isW2 = w2 && w2 !== "بدون نوار";

  return (
    <div
      className="relative size-7 rounded-sm bg-muted/60 flex items-center justify-center p-0.5 border border-dashed border-border transition-all hover:scale-110"
      title={`طول ۱: ${l1 || "بدون نوار"} | طول ۲: ${l2 || "بدون نوار"} | عرض ۱: ${w1 || "بدون نوار"} | عرض ۲: ${w2 || "بدون نوار"}`}
    >
      <span
        className={cn(
          "absolute top-0 inset-x-0 h-[2px] rounded-full transition-colors",
          isL1 ? "bg-amber-500 shadow-xs" : "bg-transparent",
        )}
      />
      <span
        className={cn(
          "absolute bottom-0 inset-x-0 h-[2px] rounded-full transition-colors",
          isL2 ? "bg-amber-500 shadow-xs" : "bg-transparent",
        )}
      />
      <span
        className={cn(
          "absolute right-0 inset-y-0 w-[2px] rounded-full transition-colors",
          isW1 ? "bg-blue-500 shadow-xs" : "bg-transparent",
        )}
      />
      <span
        className={cn(
          "absolute left-0 inset-y-0 w-[2px] rounded-full transition-colors",
          isW2 ? "bg-blue-500 shadow-xs" : "bg-transparent",
        )}
      />
      <span className="text-[8px] font-mono text-muted-foreground/60 select-none">MDF</span>
    </div>
  );
}

export default function WoodIndustryPage() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = React.useState<"cutting" | "profiles" | "matrix" | "installations">("cutting");
  const [selectedOrderId, setSelectedOrderId] = React.useState<string>("");
  const [searchQuery, setSearchQuery] = React.useState("");

  // دیالوگ‌های افزودن
  const [isAddCuttingOpen, setIsAddCuttingOpen] = React.useState(false);
  const [isAddProfileOpen, setIsAddProfileOpen] = React.useState(false);
  const [isAddInstallationOpen, setIsAddInstallationOpen] = React.useState(false);

  // پیش‌نمایش لیبل بارکد کارگاهی
  const [selectedLabelItem, setSelectedLabelItem] = React.useState<CuttingListItemRow | null>(null);

  // فرم قطعه برش
  const [newPart, setNewPart] = React.useState({
    partName: "",
    materialType: "MDF ۱۶ میل سفید صابونی",
    lengthMm: 720,
    widthMm: 560,
    thicknessMm: 16,
    quantity: 1,
    grainDirection: "LENGTHWISE",
    edgeL1: "2mm همرنگ",
    edgeL2: "2mm همرنگ",
    edgeW1: "1mm سفید",
    edgeW2: "بدون نوار",
    notes: "",
  });

  // فرم پروفیل و شیشه
  const [newProfile, setNewProfile] = React.useState({
    itemType: "GLASS",
    title: "",
    dimensions: "1800x450 mm",
    quantity: 1,
    unit: "جام",
    supplierName: "",
    notes: "",
  });

  // فرم اعزام و نصب
  const [newInstall, setNewInstall] = React.useState({
    customerName: "",
    contactPhone: "",
    projectAddress: "",
    driverName: "",
    installerLead: "",
    scheduledDate: new Date().toISOString().split("T")[0],
  });

  // کوئری‌ها
  const { data: productionOrders = [] } = useQuery({
    queryKey: ["production-orders"],
    queryFn: () => getProductionOrders(),
  });

  React.useEffect(() => {
    if (productionOrders.length > 0 && !selectedOrderId) {
      setSelectedOrderId(productionOrders[0].id);
    }
  }, [productionOrders, selectedOrderId]);

  const { data: cuttingItems = [], isLoading: isLoadingCutting } = useQuery({
    queryKey: ["cutting-list", selectedOrderId],
    queryFn: () => (selectedOrderId ? getCuttingList(selectedOrderId) : Promise.resolve([])),
    enabled: !!selectedOrderId,
  });

  const { data: profiles = [], isLoading: isLoadingProfiles } = useQuery({
    queryKey: ["wood-profiles", selectedOrderId],
    queryFn: () => (selectedOrderId ? getWoodProfiles(selectedOrderId) : Promise.resolve([])),
    enabled: !!selectedOrderId,
  });

  const { data: matrix = [], isLoading: isLoadingMatrix, refetch: refetchMatrix } = useQuery({
    queryKey: ["production-matrix"],
    queryFn: getComprehensiveProductionMatrix,
  });

  const { data: installations = [], isLoading: isLoadingInstallations, refetch: refetchInstallations } = useQuery({
    queryKey: ["wood-installations"],
    queryFn: getInstallationOrders,
  });

  // میوتیشن افزودن قطعه برش
  const addCuttingMutation = useMutation({
    mutationFn: (body: any) => addCuttingItem(body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cutting-list", selectedOrderId] });
      queryClient.invalidateQueries({ queryKey: ["production-matrix"] });
      setIsAddCuttingOpen(false);
      setNewPart({
        partName: "",
        materialType: "MDF ۱۶ میل سفید صابونی",
        lengthMm: 720,
        widthMm: 560,
        thicknessMm: 16,
        quantity: 1,
        grainDirection: "LENGTHWISE",
        edgeL1: "2mm همرنگ",
        edgeL2: "2mm همرنگ",
        edgeW1: "1mm سفید",
        edgeW2: "بدون نوار",
        notes: "",
      });
    },
  });

  // میوتیشن افزودن پروفیل و شیشه
  const addProfileMutation = useMutation({
    mutationFn: (body: any) => addWoodProfile(body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["wood-profiles", selectedOrderId] });
      setIsAddProfileOpen(false);
      setNewProfile({
        itemType: "GLASS",
        title: "",
        dimensions: "1800x450 mm",
        quantity: 1,
        unit: "جام",
        supplierName: "",
        notes: "",
      });
    },
  });

  // میوتیشن ثبت نصب
  const addInstallationMutation = useMutation({
    mutationFn: (body: any) => createInstallationOrder(body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["wood-installations"] });
      setIsAddInstallationOpen(false);
    },
  });

  const selectedOrder = productionOrders.find((o) => o.id === selectedOrderId);

  // محاسبات شاخص‌های خلاصه
  const totalCuttingCount = cuttingItems.length;
  const completedCuttingCount = cuttingItems.filter((i) => i.isCut).length;
  const totalEdgeCount = cuttingItems.filter((i) => i.isEdged).length;
  const totalCncCount = cuttingItems.filter((i) => i.isCncDone).length;

  // فیلتر جستجوی زنده قطعات برش
  const filteredCuttingItems = cuttingItems.filter((it) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      it.partName.toLowerCase().includes(q) ||
      it.barcode.toLowerCase().includes(q) ||
      it.materialType.toLowerCase().includes(q) ||
      (it.notes && it.notes.toLowerCase().includes(q))
    );
  });

  return (
    <div className="flex flex-col gap-5 p-5 sm:p-6 transition-all">
      <PageHeader
        title="مدیریت تخصصی صنایع چوب، MDF و برش‌کاری"
        description="سامانه هوشمند لیست ابعاد برش، کنترل نوار لبه PVC، لیبل پروفیل و شیشه، ماتریس جامع خط تولید و تحلیل بارگیری و نصب"
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                refetchMatrix();
                refetchInstallations();
              }}
              className="gap-2 text-xs h-8"
            >
              <RefreshCw className="size-3.5" />
              به‌روزرسانی
            </Button>
            {activeTab === "cutting" && (
              <Button size="sm" onClick={() => setIsAddCuttingOpen(true)} className="gap-2 text-xs h-8 shadow-xs">
                <Plus className="size-3.5" />
                ثبت قطعه برش جدید
              </Button>
            )}
            {activeTab === "profiles" && (
              <Button size="sm" onClick={() => setIsAddProfileOpen(true)} className="gap-2 text-xs h-8 shadow-xs">
                <Plus className="size-3.5" />
                ثبت پروفیل / شیشه
              </Button>
            )}
            {activeTab === "installations" && (
              <Button size="sm" onClick={() => setIsAddInstallationOpen(true)} className="gap-2 text-xs h-8 shadow-xs">
                <Plus className="size-3.5" />
                ثبت حواله بارگیری
              </Button>
            )}
          </div>
        }
      />

      {/* ۱. کارت‌های شاخص عملکرد (KPI Cards) با هاور مدرن و ریتم بصری دقیق */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="flex flex-col justify-between p-4 bg-card hover:border-amber-500/40 hover:shadow-md transition-all duration-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground">قطعات ثبت‌شده در برگه برش</span>
            <div className="rounded-xl bg-amber-500/10 p-2 text-amber-600 ring-1 ring-amber-500/20">
              <Scissors className="size-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black tracking-tight">{toFa(totalCuttingCount)} <span className="text-xs font-normal text-muted-foreground">قطعه</span></div>
            <p className="mt-1 text-[11px] text-muted-foreground flex items-center gap-1">
              <span>سفارش:</span>
              <strong className="font-mono text-foreground">{selectedOrder?.code || "—"}</strong>
            </p>
          </div>
        </Card>

        <Card className="flex flex-col justify-between p-4 bg-card hover:border-blue-500/40 hover:shadow-md transition-all duration-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground">پیشرفت اره برش (SAW)</span>
            <div className="rounded-xl bg-blue-500/10 p-2 text-blue-600 ring-1 ring-blue-500/20">
              <LayoutGrid className="size-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-blue-600 tracking-tight">{toFa(completedCuttingCount)} / {toFa(totalCuttingCount)}</div>
            <div className="mt-1 flex items-center gap-2">
              <div className="w-24 bg-muted rounded-full h-1.5 overflow-hidden">
                <div
                  className="bg-blue-600 h-1.5 rounded-full transition-all"
                  style={{ width: `${totalCuttingCount > 0 ? (completedCuttingCount / totalCuttingCount) * 100 : 0}%` }}
                />
              </div>
              <span className="text-[11px] font-mono text-muted-foreground">
                {totalCuttingCount > 0 ? toFa(Math.round((completedCuttingCount / totalCuttingCount) * 100)) : "۰"}٪
              </span>
            </div>
          </div>
        </Card>

        <Card className="flex flex-col justify-between p-4 bg-card hover:border-emerald-500/40 hover:shadow-md transition-all duration-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground">ایستگاه لبه‌چسبان PVC</span>
            <div className="rounded-xl bg-emerald-500/10 p-2 text-emerald-600 ring-1 ring-emerald-500/20">
              <Layers className="size-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-emerald-600 tracking-tight">{toFa(totalEdgeCount)} / {toFa(totalCuttingCount)}</div>
            <div className="mt-1 flex items-center gap-2">
              <div className="w-24 bg-muted rounded-full h-1.5 overflow-hidden">
                <div
                  className="bg-emerald-600 h-1.5 rounded-full transition-all"
                  style={{ width: `${totalCuttingCount > 0 ? (totalEdgeCount / totalCuttingCount) * 100 : 0}%` }}
                />
              </div>
              <span className="text-[11px] font-mono text-muted-foreground">
                {totalCuttingCount > 0 ? toFa(Math.round((totalEdgeCount / totalCuttingCount) * 100)) : "۰"}٪
              </span>
            </div>
          </div>
        </Card>

        <Card className="flex flex-col justify-between p-4 bg-card hover:border-indigo-500/40 hover:shadow-md transition-all duration-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground">پروژه‌های لجستیک و نصب</span>
            <div className="rounded-xl bg-indigo-500/10 p-2 text-indigo-600 ring-1 ring-indigo-500/20">
              <Truck className="size-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-indigo-600 tracking-tight">{toFa(installations.length)} <span className="text-xs font-normal text-muted-foreground">پروژه</span></div>
            <p className="mt-1 text-[11px] text-muted-foreground">آماده بارگیری و اعزام نصاب</p>
          </div>
        </Card>
      </div>

      {/* ۲. تب‌بار روان با کلیدهای کپسولی (Segmented Pill Switcher) */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-3">
        <div className="flex items-center gap-1.5 rounded-lg bg-muted/70 p-1 border border-border/60">
          <button
            onClick={() => setActiveTab("cutting")}
            className={cn(
              "flex items-center gap-2 rounded-md px-3.5 py-1.5 text-xs font-bold transition-all duration-150 select-none",
              activeTab === "cutting"
                ? "bg-background text-foreground shadow-xs ring-1 ring-border/50"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Scissors className="size-3.5 text-amber-600" />
            لیست ابعاد برش (Cutting List)
            <Badge variant="secondary" className="text-[10px] h-4.5 px-1.5 font-mono">{toFa(cuttingItems.length)}</Badge>
          </button>

          <button
            onClick={() => setActiveTab("profiles")}
            className={cn(
              "flex items-center gap-2 rounded-md px-3.5 py-1.5 text-xs font-bold transition-all duration-150 select-none",
              activeTab === "profiles"
                ? "bg-background text-foreground shadow-xs ring-1 ring-border/50"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Barcode className="size-3.5 text-primary" />
            لیبل پروفیل و شیشه
            <Badge variant="secondary" className="text-[10px] h-4.5 px-1.5 font-mono">{toFa(profiles.length)}</Badge>
          </button>

          <button
            onClick={() => setActiveTab("matrix")}
            className={cn(
              "flex items-center gap-2 rounded-md px-3.5 py-1.5 text-xs font-bold transition-all duration-150 select-none",
              activeTab === "matrix"
                ? "bg-background text-foreground shadow-xs ring-1 ring-border/50"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <FileSpreadsheet className="size-3.5 text-blue-600" />
            گزارش جامع تولید (FlexERP Matrix)
          </button>

          <button
            onClick={() => setActiveTab("installations")}
            className={cn(
              "flex items-center gap-2 rounded-md px-3.5 py-1.5 text-xs font-bold transition-all duration-150 select-none",
              activeTab === "installations"
                ? "bg-background text-foreground shadow-xs ring-1 ring-border/50"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Truck className="size-3.5 text-indigo-600" />
            بارگیری و نصب
            <Badge variant="secondary" className="text-[10px] h-4.5 px-1.5 font-mono">{toFa(installations.length)}</Badge>
          </button>
        </div>

        {/* فیلتر سریع و انتخاب سفارش */}
        <div className="flex items-center gap-2">
          {activeTab === "cutting" && (
            <div className="relative">
              <Search className="size-3.5 absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground/60" />
              <Input
                placeholder="جستجو در قطعات، بارکد..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-8 w-44 pe-8 text-xs bg-background"
              />
            </div>
          )}

          {(activeTab === "cutting" || activeTab === "profiles") && (
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-muted-foreground">سفارش:</span>
              <select
                value={selectedOrderId}
                onChange={(e) => setSelectedOrderId(e.target.value)}
                className="h-8 rounded-md border border-input bg-background px-2.5 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-primary shadow-xs"
              >
                {productionOrders.map((ord) => (
                  <option key={ord.id} value={ord.id}>
                    {ord.code} — {ord.product?.name || "سفارش کارگاهی"}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>

      {/* محتوای تب ۱: لیست ابعاد و قطعات برش MDF */}
      {activeTab === "cutting" && (
        <Card className="p-0 overflow-hidden border border-border shadow-xs">
          <div className="flex items-center justify-between border-b border-border bg-muted/40 p-3">
            <div className="flex items-center gap-2">
              <Scissors className="size-4 text-amber-600" />
              <span className="text-xs font-bold text-foreground">لیست تفصیلی قطعات MDF با ابعاد میلی‌متر و کنترل نوارهای چهار وجه</span>
              <Badge variant="outline" className="text-[10px] font-mono">{toFa(filteredCuttingItems.length)} ردیف</Badge>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.print()}
                className="gap-1.5 text-xs h-7"
              >
                <Printer className="size-3" />
                چاپ برگه برش اره‌کار
              </Button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead className="bg-muted/60 text-muted-foreground font-semibold border-b border-border select-none">
                <tr>
                  <th className="py-2.5 px-3">بارکد</th>
                  <th className="py-2.5 px-3">پیش‌نمایش نوار</th>
                  <th className="py-2.5 px-3">نام قطعه یونیت</th>
                  <th className="py-2.5 px-3">مغز و روکش ورق</th>
                  <th className="py-2.5 px-3 text-center">ابعاد برش (L × W)</th>
                  <th className="py-2.5 px-3 text-center">ضخامت</th>
                  <th className="py-2.5 px-3 text-center">تعداد</th>
                  <th className="py-2.5 px-3 text-center">جهت رگه</th>
                  <th className="py-2.5 px-3 text-center">نوار طول‌ها (L1 / L2)</th>
                  <th className="py-2.5 px-3 text-center">نوار عرض‌ها (W1 / W2)</th>
                  <th className="py-2.5 px-3 text-center">ایستگاه‌های خط</th>
                  <th className="py-2.5 px-3">دستور کارگاه</th>
                  <th className="py-2.5 px-2 text-center">لیبل</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border font-medium">
                {filteredCuttingItems.length === 0 ? (
                  <tr>
                    <td colSpan={13} className="py-12 text-center text-muted-foreground">
                      موردی یافت نشد. برای ثبت قطعه جدید روی «ثبت قطعه برش جدید» کلیک کنید.
                    </td>
                  </tr>
                ) : (
                  filteredCuttingItems.map((item) => (
                    <tr key={item.id} className="hover:bg-muted/30 transition-colors">
                      <td className="py-2 px-3">
                        <button
                          type="button"
                          onClick={() => setSelectedLabelItem(item)}
                          className="font-mono text-[11px] font-bold text-primary bg-primary/10 hover:bg-primary/20 px-1.5 py-0.5 rounded transition-colors"
                          title="مشاهده و چاپ لیبل بارکد کارگاهی"
                        >
                          {item.barcode}
                        </button>
                      </td>
                      <td className="py-2 px-3">
                        <EdgeBandingMiniDiagram
                          l1={item.edgeL1}
                          l2={item.edgeL2}
                          w1={item.edgeW1}
                          w2={item.edgeW2}
                        />
                      </td>
                      <td className="py-2 px-3 font-bold text-foreground">{item.partName}</td>
                      <td className="py-2 px-3 text-muted-foreground">{item.materialType}</td>
                      <td className="py-2 px-3 text-center font-mono font-bold text-foreground">
                        {toFa(item.lengthMm)} × {toFa(item.widthMm)} <span className="text-[10px] text-muted-foreground font-normal">mm</span>
                      </td>
                      <td className="py-2 px-3 text-center font-mono">{toFa(item.thicknessMm)} mm</td>
                      <td className="py-2 px-3 text-center font-bold text-foreground">{toFa(item.quantity)}</td>
                      <td className="py-2 px-3 text-center">
                        <Badge variant="outline" className="text-[10px] font-normal">
                          {item.grainDirection === "LENGTHWISE" ? "طولی" : item.grainDirection === "WIDTHWISE" ? "عرضی" : "بدون جهت"}
                        </Badge>
                      </td>
                      <td className="py-2 px-3 text-center text-[11px]">
                        <div className="flex items-center justify-center gap-1 font-mono">
                          <span className={cn("px-1 py-0.5 rounded text-[10px]", item.edgeL1 && item.edgeL1 !== "بدون نوار" ? "bg-amber-500/10 text-amber-700 font-bold" : "text-muted-foreground")}>
                            {item.edgeL1 || "—"}
                          </span>
                          <span className="text-muted-foreground">/</span>
                          <span className={cn("px-1 py-0.5 rounded text-[10px]", item.edgeL2 && item.edgeL2 !== "بدون نوار" ? "bg-amber-500/10 text-amber-700 font-bold" : "text-muted-foreground")}>
                            {item.edgeL2 || "—"}
                          </span>
                        </div>
                      </td>
                      <td className="py-2 px-3 text-center text-[11px]">
                        <div className="flex items-center justify-center gap-1 font-mono">
                          <span className={cn("px-1 py-0.5 rounded text-[10px]", item.edgeW1 && item.edgeW1 !== "بدون نوار" ? "bg-blue-500/10 text-blue-700 font-bold" : "text-muted-foreground")}>
                            {item.edgeW1 || "—"}
                          </span>
                          <span className="text-muted-foreground">/</span>
                          <span className={cn("px-1 py-0.5 rounded text-[10px]", item.edgeW2 && item.edgeW2 !== "بدون نوار" ? "bg-blue-500/10 text-blue-700 font-bold" : "text-muted-foreground")}>
                            {item.edgeW2 || "—"}
                          </span>
                        </div>
                      </td>
                      <td className="py-2 px-3 text-center">
                        <div className="flex items-center justify-center gap-1 text-[10px]">
                          <span className={cn("px-1 rounded font-bold", item.isCut ? "bg-emerald-500/10 text-emerald-700" : "bg-muted text-muted-foreground")}>اره</span>
                          <span className={cn("px-1 rounded font-bold", item.isEdged ? "bg-emerald-500/10 text-emerald-700" : "bg-muted text-muted-foreground")}>لبه</span>
                          <span className={cn("px-1 rounded font-bold", item.isCncDone ? "bg-emerald-500/10 text-emerald-700" : "bg-muted text-muted-foreground")}>CNC</span>
                          <span className={cn("px-1 rounded font-bold", item.isAssembled ? "bg-emerald-500/10 text-emerald-700" : "bg-muted text-muted-foreground")}>مونتاژ</span>
                        </div>
                      </td>
                      <td className="py-2 px-3 text-muted-foreground text-[11px] max-w-xs truncate">{item.notes || "—"}</td>
                      <td className="py-2 px-2 text-center">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setSelectedLabelItem(item)}
                          className="size-7 text-muted-foreground hover:text-primary"
                          title="پیش‌نمایش لیبل فیزیکی قطعه"
                        >
                          <Tag className="size-3.5" />
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* محتوای تب ۲: فرم تأمین‌کننده و لیبل پروفیل و شیشه */}
      {activeTab === "profiles" && (
        <Card className="p-0 overflow-hidden border border-border shadow-xs">
          <div className="flex items-center justify-between border-b border-border bg-muted/40 p-3">
            <div className="flex items-center gap-2">
              <Barcode className="size-4 text-primary" />
              <span className="text-xs font-bold text-foreground">اقلام غیر چوبی، پروفیل‌های آلومینیومی و شیشه‌های سفارش داده شده به کارگاه همکار</span>
              <Badge variant="outline" className="text-[10px] font-mono">{toFa(profiles.length)} قلم</Badge>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.print()}
              className="gap-1.5 text-xs h-7"
            >
              <Printer className="size-3" />
              چاپ فرم سفارش به تأمین‌کننده
            </Button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead className="bg-muted/60 text-muted-foreground font-semibold border-b border-border select-none">
                <tr>
                  <th className="py-2.5 px-3">بارکد ردیابی</th>
                  <th className="py-2.5 px-3">نوع قلم</th>
                  <th className="py-2.5 px-3">عنوان و مشخصات قطعه</th>
                  <th className="py-2.5 px-3 text-center">ابعاد / سایز برش</th>
                  <th className="py-2.5 px-3 text-center">مقدار و واحد</th>
                  <th className="py-2.5 px-3">نام تأمین‌کننده / کارگاه همکار</th>
                  <th className="py-2.5 px-3 text-center">وضعیت</th>
                  <th className="py-2.5 px-3">دستورالعمل و توضیحات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border font-medium">
                {profiles.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-muted-foreground">
                      هیچ آیتم پروفیل یا شیشه‌ای برای این سفارش ثبت نشده است.
                    </td>
                  </tr>
                ) : (
                  profiles.map((p) => (
                    <tr key={p.id} className="hover:bg-muted/30 transition-colors">
                      <td className="py-2.5 px-3">
                        <span className="font-mono text-[11px] font-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded">
                          {p.barcode}
                        </span>
                      </td>
                      <td className="py-2.5 px-3">
                        <Badge variant="outline" className="text-[10px]">
                          {p.itemType === "GLASS" ? "شیشه" : p.itemType === "PROFILE" ? "پروفیل" : "اینفیل"}
                        </Badge>
                      </td>
                      <td className="py-2.5 px-3 font-bold text-foreground">{p.title}</td>
                      <td className="py-2.5 px-3 text-center font-mono font-bold">{p.dimensions}</td>
                      <td className="py-2.5 px-3 text-center font-bold">
                        {toFa(p.quantity)} <span className="text-[10px] text-muted-foreground font-normal">{p.unit}</span>
                      </td>
                      <td className="py-2.5 px-3 text-muted-foreground">{p.supplierName || "تأمین داخلی"}</td>
                      <td className="py-2.5 px-3 text-center">
                        <Badge variant={p.status === "INSTALLED" ? "default" : "secondary"} className="text-[10px]">
                          {p.status === "INSTALLED" ? "نصب‌شده" : p.status === "CUT" ? "برش‌خورده" : "سفارش‌گذاری"}
                        </Badge>
                      </td>
                      <td className="py-2.5 px-3 text-muted-foreground text-[11px]">{p.notes || "—"}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* محتوای تب ۳: گزارش جامع تولید (FlexERP Matrix) */}
      {activeTab === "matrix" && (
        <Card className="p-0 overflow-hidden border border-border shadow-xs">
          <div className="flex items-center justify-between border-b border-border bg-muted/40 p-3">
            <div className="flex items-center gap-2">
              <FileSpreadsheet className="size-4 text-blue-600" />
              <span className="text-xs font-bold text-foreground">ماتریس چندبعدی ردیابی سفارشات در خطوط تولید کارخانه (FlexERP Matrix)</span>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetchMatrix()}
              className="gap-1.5 text-xs h-7"
            >
              <RefreshCw className="size-3" />
              تازه‌سازی ماتریس
            </Button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead className="bg-muted/60 text-muted-foreground font-semibold border-b border-border select-none">
                <tr>
                  <th className="py-2.5 px-3">کد سفارش</th>
                  <th className="py-2.5 px-3">محصول نهایی</th>
                  <th className="py-2.5 px-3 text-center">تیراژ</th>
                  <th className="py-2.5 px-3 text-center">کل قطعات</th>
                  <th className="py-2.5 px-3 text-center">اره (SAW)</th>
                  <th className="py-2.5 px-3 text-center">لبه‌چسبان (EDGE)</th>
                  <th className="py-2.5 px-3 text-center">ماشین‌کاری (CNC)</th>
                  <th className="py-2.5 px-3 text-center">مونتاژ (ASSM)</th>
                  <th className="py-2.5 px-3 text-center">پیشرفت نهایی</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border font-medium">
                {matrix.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-12 text-center text-muted-foreground">
                      هیچ سفارش تولید فعالی در خط وجود ندارد.
                    </td>
                  </tr>
                ) : (
                  matrix.map((row) => (
                    <tr key={row.id} className="hover:bg-muted/30 transition-colors">
                      <td className="py-2.5 px-3">
                        <span className="font-mono font-bold text-primary">{row.code}</span>
                      </td>
                      <td className="py-2.5 px-3 font-bold text-foreground">{row.productName}</td>
                      <td className="py-2.5 px-3 text-center font-mono">{toFa(row.targetQuantity)} عدد</td>
                      <td className="py-2.5 px-3 text-center font-bold text-amber-600 font-mono">{toFa(row.totalParts)} قطعه</td>
                      <td className="py-2.5 px-3 text-center font-mono">
                        {toFa(row.cutCount)} / {toFa(row.totalParts)}
                      </td>
                      <td className="py-2.5 px-3 text-center font-mono">
                        {toFa(row.edgeCount)} / {toFa(row.totalParts)}
                      </td>
                      <td className="py-2.5 px-3 text-center font-mono">
                        {toFa(row.cncCount)} / {toFa(row.totalParts)}
                      </td>
                      <td className="py-2.5 px-3 text-center font-mono">
                        {toFa(row.assembledCount)} / {toFa(row.totalParts)}
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <div className="w-20 bg-muted rounded-full h-2 overflow-hidden">
                            <div
                              className="bg-primary h-2 rounded-full transition-all"
                              style={{ width: `${row.progressPercent}%` }}
                            />
                          </div>
                          <span className="font-mono text-[11px] font-bold">{toFa(row.progressPercent)}٪</span>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* محتوای تب ۴: بارگیری، اعزام و نصب در محل */}
      {activeTab === "installations" && (
        <Card className="p-0 overflow-hidden border border-border shadow-xs">
          <div className="flex items-center justify-between border-b border-border bg-muted/40 p-3">
            <div className="flex items-center gap-2">
              <Truck className="size-4 text-indigo-600" />
              <span className="text-xs font-bold text-foreground">تحلیل بارگیری و برنامه اعزام تیم نصب در پروژه مشتری</span>
              <Badge variant="outline" className="text-[10px] font-mono">{toFa(installations.length)} پروژه</Badge>
            </div>
            <Button
              size="sm"
              onClick={() => setIsAddInstallationOpen(true)}
              className="gap-1.5 text-xs h-7 shadow-xs"
            >
              <Plus className="size-3" />
              ثبت حواله جدید
            </Button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead className="bg-muted/60 text-muted-foreground font-semibold border-b border-border select-none">
                <tr>
                  <th className="py-2.5 px-3">شماره حواله</th>
                  <th className="py-2.5 px-3">مشتری و شماره تماس</th>
                  <th className="py-2.5 px-3">آدرس محل نصب پروژه</th>
                  <th className="py-2.5 px-3">راننده و خودروی حمل</th>
                  <th className="py-2.5 px-3">سرپرست تیم نصب</th>
                  <th className="py-2.5 px-3 text-center">تاریخ اعزام</th>
                  <th className="py-2.5 px-3 text-center">وضعیت عملیات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border font-medium">
                {installations.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-muted-foreground">
                      هیچ برنامه نصب فعالی ثبت نشده است.
                    </td>
                  </tr>
                ) : (
                  installations.map((inst) => (
                    <tr key={inst.id} className="hover:bg-muted/30 transition-colors">
                      <td className="py-2.5 px-3">
                        <span className="font-mono font-bold text-primary">{inst.orderNumber}</span>
                      </td>
                      <td className="py-2.5 px-3 font-bold text-foreground">
                        {inst.customerName}
                        <div className="text-[10px] font-normal text-muted-foreground font-mono">{inst.contactPhone}</div>
                      </td>
                      <td className="py-2.5 px-3 text-muted-foreground text-[11px] max-w-xs truncate">{inst.projectAddress}</td>
                      <td className="py-2.5 px-3 text-foreground">{inst.driverName || "تعیین نشده"}</td>
                      <td className="py-2.5 px-3 text-foreground font-bold">{inst.installerLead || "تعیین نشده"}</td>
                      <td className="py-2.5 px-3 text-center font-mono">{faDate(inst.scheduledDate)}</td>
                      <td className="py-2.5 px-3 text-center">
                        <Badge
                          variant={inst.status === "COMPLETED" ? "default" : inst.status === "DISPATCHED" ? "secondary" : "outline"}
                          className="text-[10px]"
                        >
                          {inst.status === "COMPLETED" ? "نصب و تحویل نهایی" : inst.status === "DISPATCHED" ? "در حال اعزام" : "زمان‌بندی‌شده"}
                        </Badge>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* مودال پیش‌نمایش چاپ لیبل فیزیکی کارگاهی */}
      <Dialog open={!!selectedLabelItem} onOpenChange={() => setSelectedLabelItem(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Barcode className="size-5 text-primary" />
              پیش‌نمایش لیبل بارکد قطعه (Zebra / Thermal)
            </DialogTitle>
            <DialogDescription>
              لیبل چسبان حرارتی جهت نصب روی قطعه کارگاهی قبل از ورود به خط
            </DialogDescription>
          </DialogHeader>

          {selectedLabelItem && (
            <div className="p-4 border-2 border-dashed border-border rounded-xl bg-card flex flex-col gap-3 font-mono">
              <div className="flex items-center justify-between border-b pb-2 text-xs">
                <span className="font-bold text-primary font-sans">کاردو ERP — صنایع چوب</span>
                <span className="text-muted-foreground">{toFa(new Date().toLocaleDateString("fa-IR"))}</span>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-bold font-sans text-foreground">{selectedLabelItem.partName}</div>
                  <div className="text-xs text-muted-foreground font-sans mt-0.5">{selectedLabelItem.materialType}</div>
                </div>
                <div className="p-1 border rounded bg-white dark:bg-zinc-900">
                  <QrCode className="size-10 text-foreground" />
                </div>
              </div>

              <div className="bg-muted/50 p-2.5 rounded-lg flex items-center justify-between text-xs">
                <div>
                  <span className="text-[10px] text-muted-foreground font-sans">ابعاد: </span>
                  <strong className="text-sm font-bold">{selectedLabelItem.lengthMm} × {selectedLabelItem.widthMm} mm</strong>
                </div>
                <div>
                  <span className="text-[10px] text-muted-foreground font-sans">ضخامت: </span>
                  <strong>{selectedLabelItem.thicknessMm} mm</strong>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-[11px] font-sans">
                <div className="p-1.5 border rounded bg-background">
                  <span className="text-[10px] text-muted-foreground">نوارهای طولی:</span>
                  <div className="font-bold mt-0.5">L1: {selectedLabelItem.edgeL1 || "—"} / L2: {selectedLabelItem.edgeL2 || "—"}</div>
                </div>
                <div className="p-1.5 border rounded bg-background">
                  <span className="text-[10px] text-muted-foreground">نوارهای عرضی:</span>
                  <div className="font-bold mt-0.5">W1: {selectedLabelItem.edgeW1 || "—"} / W2: {selectedLabelItem.edgeW2 || "—"}</div>
                </div>
              </div>

              <div className="text-center py-2 bg-muted/40 rounded-lg border">
                <div className="font-mono text-base font-black tracking-widest text-primary">{selectedLabelItem.barcode}</div>
                <div className="text-[10px] text-muted-foreground font-sans">شناسه اختصاصی ردیابی در ایستگاه‌ها</div>
              </div>
            </div>
          )}

          <DialogFooter className="gap-2">
            <Button variant="outline" size="sm" onClick={() => setSelectedLabelItem(null)}>
              بستن
            </Button>
            <Button size="sm" onClick={() => window.print()} className="gap-1.5">
              <Printer className="size-3.5" />
              ارسال به چاپگر لیبل
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* مودال ثبت قطعه برش جدید */}
      <Dialog open={isAddCuttingOpen} onOpenChange={setIsAddCuttingOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>افزودن قطعه برش چوب / MDF</DialogTitle>
            <DialogDescription>
              مشخصات دقیق ابعاد به میلیمتر، مغز ورق و نوارهای ۴ لبه را وارد کنید.
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-2 gap-3 py-2 text-xs">
            <div className="col-span-2">
              <label className="text-[11px] font-semibold text-muted-foreground">نام قطعه یونیت</label>
              <Input
                placeholder="مثلاً بدنه چپ، کف یونیت، قید عقب، درب قاب‌دار"
                value={newPart.partName}
                onChange={(e) => setNewPart({ ...newPart, partName: e.target.value })}
                className="mt-1 h-8 text-xs"
              />
            </div>

            <div className="col-span-2">
              <label className="text-[11px] font-semibold text-muted-foreground">جنس و روکش ورق</label>
              <Input
                placeholder="MDF ۱۶ میل سفید صابونی، هایگلاس AGT کد ۶۰۱، پلای وود"
                value={newPart.materialType}
                onChange={(e) => setNewPart({ ...newPart, materialType: e.target.value })}
                className="mt-1 h-8 text-xs"
              />
            </div>

            <div>
              <label className="text-[11px] font-semibold text-muted-foreground">طول قطعه (میلیمتر)</label>
              <Input
                type="number"
                value={newPart.lengthMm}
                onChange={(e) => setNewPart({ ...newPart, lengthMm: Number(e.target.value) })}
                className="mt-1 h-8 text-xs"
              />
            </div>

            <div>
              <label className="text-[11px] font-semibold text-muted-foreground">عرض قطعه (میلیمتر)</label>
              <Input
                type="number"
                value={newPart.widthMm}
                onChange={(e) => setNewPart({ ...newPart, widthMm: Number(e.target.value) })}
                className="mt-1 h-8 text-xs"
              />
            </div>

            <div>
              <label className="text-[11px] font-semibold text-muted-foreground">ضخامت ورق (mm)</label>
              <select
                value={newPart.thicknessMm}
                onChange={(e) => setNewPart({ ...newPart, thicknessMm: Number(e.target.value) })}
                className="mt-1 h-8 w-full rounded-md border border-input bg-background px-2 text-xs"
              >
                <option value={16}>۱۶ میلیمتر (استاندارد MDF)</option>
                <option value={18}>۱۸ میلیمتر (پلای وود / هایگلاس)</option>
                <option value={25}>۲۵ میلیمتر (صفحه تاپس)</option>
                <option value={32}>۳۲ میلیمتر (دوبل)</option>
                <option value={8}>۸ میلیمتر (فیبر)</option>
                <option value={3}>۳ میلیمتر (پشت‌بند)</option>
              </select>
            </div>

            <div>
              <label className="text-[11px] font-semibold text-muted-foreground">جهت رگه چوب</label>
              <select
                value={newPart.grainDirection}
                onChange={(e) => setNewPart({ ...newPart, grainDirection: e.target.value })}
                className="mt-1 h-8 w-full rounded-md border border-input bg-background px-2 text-xs"
              >
                <option value="LENGTHWISE">طولی (موازی با طول)</option>
                <option value="WIDTHWISE">عرضی (موازی با عرض)</option>
                <option value="NONE">بدون جهت (ساده / مات)</option>
              </select>
            </div>

            <div className="col-span-2 pt-2 border-t border-border">
              <span className="text-[11px] font-bold text-foreground">تنظیمات نوار لبه PVC (چهار وجه):</span>
              <div className="grid grid-cols-2 gap-2 mt-2">
                <div>
                  <label className="text-[10px] text-muted-foreground">طول ۱ (L1)</label>
                  <Input
                    value={newPart.edgeL1}
                    onChange={(e) => setNewPart({ ...newPart, edgeL1: e.target.value })}
                    className="h-7 text-xs"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-muted-foreground">طول ۲ (L2)</label>
                  <Input
                    value={newPart.edgeL2}
                    onChange={(e) => setNewPart({ ...newPart, edgeL2: e.target.value })}
                    className="h-7 text-xs"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-muted-foreground">عرض ۱ (W1)</label>
                  <Input
                    value={newPart.edgeW1}
                    onChange={(e) => setNewPart({ ...newPart, edgeW1: e.target.value })}
                    className="h-7 text-xs"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-muted-foreground">عرض ۲ (W2)</label>
                  <Input
                    value={newPart.edgeW2}
                    onChange={(e) => setNewPart({ ...newPart, edgeW2: e.target.value })}
                    className="h-7 text-xs"
                  />
                </div>
              </div>
            </div>

            <div className="col-span-2">
              <label className="text-[11px] font-semibold text-muted-foreground">توضیحات و دستورالعمل کارگاهی</label>
              <Input
                placeholder="شیار پشت‌بند، دوبل، سوراخ لولا گازور و..."
                value={newPart.notes}
                onChange={(e) => setNewPart({ ...newPart, notes: e.target.value })}
                className="mt-1 h-8 text-xs"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setIsAddCuttingOpen(false)}>
              انصراف
            </Button>
            <Button
              size="sm"
              disabled={!newPart.partName || !selectedOrderId || addCuttingMutation.isPending}
              onClick={() =>
                addCuttingMutation.mutate({
                  ...newPart,
                  productionOrderId: selectedOrderId,
                })
              }
            >
              افزودن و صدور بارکد قطعه
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* مودال ثبت پروفیل و شیشه */}
      <Dialog open={isAddProfileOpen} onOpenChange={setIsAddProfileOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>صدور لیبل پروفیل، شیشه و قطعات خارجی</DialogTitle>
            <DialogDescription>
              ثبت سفارش اقلام غیر چوبی جهت ارجاع به تأمین‌کننده یا انبار
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-3 py-2 text-xs">
            <div>
              <label className="text-[11px] font-semibold text-muted-foreground">نوع قلم</label>
              <select
                value={newProfile.itemType}
                onChange={(e) => setNewProfile({ ...newProfile, itemType: e.target.value })}
                className="mt-1 h-8 w-full rounded-md border border-input bg-background px-2 text-xs"
              >
                <option value="GLASS">شیشه (سکوریت، دودی، برنز، مات)</option>
                <option value="PROFILE">پروفیل آلومینیومی (فریم درب، دستگیره مخفی)</option>
                <option value="INFILL">اینفیل و پنل تزیینی</option>
              </select>
            </div>

            <div>
              <label className="text-[11px] font-semibold text-muted-foreground">عنوان قطعه</label>
              <Input
                placeholder="شیشه ۶ میل دودی سکوریت فریم لس"
                value={newProfile.title}
                onChange={(e) => setNewProfile({ ...newProfile, title: e.target.value })}
                className="mt-1 h-8 text-xs"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[11px] font-semibold text-muted-foreground">ابعاد / متراژ</label>
                <Input
                  placeholder="مثلا 1800x450 mm"
                  value={newProfile.dimensions}
                  onChange={(e) => setNewProfile({ ...newProfile, dimensions: e.target.value })}
                  className="mt-1 h-8 text-xs"
                />
              </div>
              <div>
                <label className="text-[11px] font-semibold text-muted-foreground">تعداد</label>
                <Input
                  type="number"
                  value={newProfile.quantity}
                  onChange={(e) => setNewProfile({ ...newProfile, quantity: Number(e.target.value) })}
                  className="mt-1 h-8 text-xs"
                />
              </div>
            </div>

            <div>
              <label className="text-[11px] font-semibold text-muted-foreground">نام تأمین‌کننده / کارگاه همکار</label>
              <Input
                placeholder="شیشه‌بری نگین، شرکت آلومینیوم فرم و..."
                value={newProfile.supplierName}
                onChange={(e) => setNewProfile({ ...newProfile, supplierName: e.target.value })}
                className="mt-1 h-8 text-xs"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setIsAddProfileOpen(false)}>
              انصراف
            </Button>
            <Button
              size="sm"
              disabled={!newProfile.title || !selectedOrderId || addProfileMutation.isPending}
              onClick={() =>
                addProfileMutation.mutate({
                  ...newProfile,
                  productionOrderId: selectedOrderId,
                })
              }
            >
              ثبت و صدور بارکد ردیابی
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* مودال ثبت حواله بارگیری و نصب */}
      <Dialog open={isAddInstallationOpen} onOpenChange={setIsAddInstallationOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>ثبت برنامه بارگیری و نصب در محل مشتری</DialogTitle>
            <DialogDescription>
              مدیریت لجستیک ارسال و اعزام تیم نصب به پروژه
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-3 py-2 text-xs">
            <div>
              <label className="text-[11px] font-semibold text-muted-foreground">نام مشتری / کارفرما</label>
              <Input
                placeholder="آقای صادقی — پروژه مسکونی نیاوران"
                value={newInstall.customerName}
                onChange={(e) => setNewInstall({ ...newInstall, customerName: e.target.value })}
                className="mt-1 h-8 text-xs"
              />
            </div>

            <div>
              <label className="text-[11px] font-semibold text-muted-foreground">شماره تماس در محل</label>
              <Input
                placeholder="۰۹۱۲..."
                value={newInstall.contactPhone}
                onChange={(e) => setNewInstall({ ...newInstall, contactPhone: e.target.value })}
                className="mt-1 h-8 text-xs"
              />
            </div>

            <div>
              <label className="text-[11px] font-semibold text-muted-foreground">آدرس دقیق محل نصب</label>
              <Input
                placeholder="تهران، خ شریعتی، بن‌بست یاس، پلاک ۴، طبقه ۳"
                value={newInstall.projectAddress}
                onChange={(e) => setNewInstall({ ...newInstall, projectAddress: e.target.value })}
                className="mt-1 h-8 text-xs"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[11px] font-semibold text-muted-foreground">راننده و خودروی حمل</label>
                <Input
                  placeholder="محمدی (وانت نیسان)"
                  value={newInstall.driverName}
                  onChange={(e) => setNewInstall({ ...newInstall, driverName: e.target.value })}
                  className="mt-1 h-8 text-xs"
                />
              </div>
              <div>
                <label className="text-[11px] font-semibold text-muted-foreground">سرپرست تیم نصب</label>
                <Input
                  placeholder="استاد کریمی"
                  value={newInstall.installerLead}
                  onChange={(e) => setNewInstall({ ...newInstall, installerLead: e.target.value })}
                  className="mt-1 h-8 text-xs"
                />
              </div>
            </div>

            <div>
              <label className="text-[11px] font-semibold text-muted-foreground">تاریخ اعزام و نصب</label>
              <Input
                type="date"
                value={newInstall.scheduledDate}
                onChange={(e) => setNewInstall({ ...newInstall, scheduledDate: e.target.value })}
                className="mt-1 h-8 text-xs"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setIsAddInstallationOpen(false)}>
              انصراف
            </Button>
            <Button
              size="sm"
              disabled={!newInstall.customerName || !newInstall.projectAddress || addInstallationMutation.isPending}
              onClick={() =>
                addInstallationMutation.mutate({
                  ...newInstall,
                  productionOrderId: selectedOrderId || undefined,
                })
              }
            >
              ثبت حواله و زمان‌بندی
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
