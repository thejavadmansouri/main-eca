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
  Building2,
  Boxes,
  CheckSquare,
  ShieldAlert,
  UserCheck,
  HardHat,
  ArrowRight,
  ChevronRight,
  PackagePlus,
  CheckCircle,
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
  createWoodProductionOrder,
  advanceOrderStage,
  checkOrderMaterialsFeasibility,
  getInboundReceipts,
  createInboundReceipt,
  verifyInboundReceipt,
  getWarehouses,
} from "@/lib/api";
import { faDate, money, toFa } from "@/lib/format";
import { cn } from "@/lib/utils";
import type {
  CuttingListItemRow,
  InstallationOrderRow,
  ProductionMatrixRow,
  ProductionOrderRow,
  WoodOrderProfileRow,
  InboundReceiptRow,
  MaterialsFeasibilityResult,
} from "@/lib/types";

import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ProductSearchSelect } from "@/components/product-search-select";
import { useToast } from "@/hooks/use-toast";
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

const STAGE_CONFIG: Record<
  string,
  { label: string; badgeClass: string; step: number }
> = {
  CUTTING: { label: "برش و اره‌کاری", badgeClass: "bg-amber-500/15 text-amber-700 border-amber-500/30", step: 1 },
  EDGE_BANDING: { label: "لبه‌چسبان PVC", badgeClass: "bg-blue-500/15 text-blue-700 border-blue-500/30", step: 2 },
  CNC: { label: "ماشین‌کاری CNC", badgeClass: "bg-purple-500/15 text-purple-700 border-purple-500/30", step: 3 },
  ASSEMBLY: { label: "مونتاژ و یراق‌آلات", badgeClass: "bg-indigo-500/15 text-indigo-700 border-indigo-500/30", step: 4 },
  PAINTING: { label: "رنگ و پوشش‌دهی", badgeClass: "bg-pink-500/15 text-pink-700 border-pink-500/30", step: 5 },
  QC_PACKING: { label: "کنترل کیفی و بسته‌بندی", badgeClass: "bg-teal-500/15 text-teal-700 border-teal-500/30", step: 6 },
  INSTALLATION: { label: "تحویل به نصاب / پروژه", badgeClass: "bg-emerald-500/15 text-emerald-700 border-emerald-500/30", step: 7 },
};

export default function WoodIndustryPage() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = React.useState<"matrix" | "cutting" | "profiles" | "inbound" | "installations">("matrix");
  const [selectedOrderId, setSelectedOrderId] = React.useState<string>("");
  const [searchQuery, setSearchQuery] = React.useState("");

  // دیالوگ‌های افزودن
  const [isAddCuttingOpen, setIsAddCuttingOpen] = React.useState(false);
  const [isAddProfileOpen, setIsAddProfileOpen] = React.useState(false);
  const [isAddInstallationOpen, setIsAddInstallationOpen] = React.useState(false);
  const [isAddOrderOpen, setIsAddOrderOpen] = React.useState(false);
  const [isAddInboundOpen, setIsAddInboundOpen] = React.useState(false);

  // دیالوگ استعلام متریال و ارتقای مرحله
  const [feasibilityOrderId, setFeasibilityOrderId] = React.useState<string | null>(null);
  const [advanceOrderId, setAdvanceOrderId] = React.useState<string | null>(null);
  const [advanceStage, setAdvanceStage] = React.useState<string>("EDGE_BANDING");
  const [advanceOperator, setAdvanceOperator] = React.useState<string>("اپراتور کارگاه");
  const [advanceNotes, setAdvanceNotes] = React.useState<string>("");

  // پیش‌نمایش لیبل بارکد کارگاهی
  const [selectedLabelItem, setSelectedLabelItem] = React.useState<CuttingListItemRow | null>(null);

  // فرم سفارش جدید صنایع چوب
  const [newOrder, setNewOrder] = React.useState({
    customerType: "B2B" as "B2B" | "B2C",
    customerName: "",
    endClientName: "",
    projectTitle: "",
    assignedInstaller: "",
    installerPhone: "",
    productId: "",
    targetQuantity: 1,
    priority: 1,
    dueDate: new Date(Date.now() + 14 * 86400000).toISOString().split("T")[0],
    notes: "",
  });

  // فرم ثبت بارنامه ورود بار
  const [newInbound, setNewInbound] = React.useState({
    supplierName: "",
    driverName: "",
    truckPlate: "",
    waybillNumber: "",
    warehouseId: "",
    notes: "",
  });

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

  const { data: warehouses = [] } = useQuery({
    queryKey: ["warehouses", "active"],
    queryFn: () => getWarehouses(),
  });

  const { data: inboundReceipts = [], refetch: refetchInbound } = useQuery({
    queryKey: ["inbound-receipts"],
    queryFn: () => getInboundReceipts(),
  });

  const feasibilityQ = useQuery({
    queryKey: ["order-feasibility", feasibilityOrderId],
    queryFn: () => (feasibilityOrderId ? checkOrderMaterialsFeasibility(feasibilityOrderId) : null),
    enabled: !!feasibilityOrderId,
  });

  React.useEffect(() => {
    if (productionOrders.length > 0 && !selectedOrderId) {
      setSelectedOrderId(productionOrders[0].id);
    }
  }, [productionOrders, selectedOrderId]);

  React.useEffect(() => {
    if (warehouses.length > 0 && !newInbound.warehouseId) {
      setNewInbound((prev) => ({ ...prev, warehouseId: warehouses[0].id }));
    }
  }, [warehouses, newInbound.warehouseId]);

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

  // میوتیشن‌ها
  const createOrderMutation = useMutation({
    mutationFn: (body: any) => createWoodProductionOrder(body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["production-orders"] });
      queryClient.invalidateQueries({ queryKey: ["production-matrix"] });
      setIsAddOrderOpen(false);
      toast({
        title: "سفارش با موفقیت ثبت شد",
        description: "سفارش صنایع چوب در سامانه ایجاد و به خط تولید کاردو متصل شد.",
      });
      setNewOrder({
        customerType: "B2B",
        customerName: "",
        endClientName: "",
        projectTitle: "",
        assignedInstaller: "",
        installerPhone: "",
        productId: "",
        targetQuantity: 1,
        priority: 1,
        dueDate: new Date(Date.now() + 14 * 86400000).toISOString().split("T")[0],
        notes: "",
      });
    },
    onError: (err: any) => {
      toast({ title: "خطا در ثبت سفارش", description: err?.message, variant: "destructive" });
    },
  });

  const advanceStageMutation = useMutation({
    mutationFn: (body: { orderId: string; stage: string; operatorName: string; notes?: string }) =>
      advanceOrderStage(body.orderId, { stage: body.stage, operatorName: body.operatorName, notes: body.notes }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["production-matrix"] });
      queryClient.invalidateQueries({ queryKey: ["production-orders"] });
      setAdvanceOrderId(null);
      toast({ title: "مرحله کارگاه ارتقا یافت", description: "پیشرفت مرحله سفارش ثبت و به ایستگاه بعد منتقل شد." });
    },
    onError: (err: any) => {
      toast({ title: "خطا در تغییر مرحله", description: err?.message, variant: "destructive" });
    },
  });

  const createInboundMutation = useMutation({
    mutationFn: (body: any) => createInboundReceipt(body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inbound-receipts"] });
      setIsAddInboundOpen(false);
      toast({ title: "رسید ورود بار ثبت شد", description: "بارنامه با موفقیت در گیت ورودی انبار ثبت شد." });
      setNewInbound({
        supplierName: "",
        driverName: "",
        truckPlate: "",
        waybillNumber: "",
        warehouseId: warehouses[0]?.id || "",
        notes: "",
      });
    },
  });

  const verifyInboundMutation = useMutation({
    mutationFn: (body: { id: string; status: "VERIFIED" | "REJECTED"; verifiedBy: string }) =>
      verifyInboundReceipt(body.id, { status: body.status, verifiedBy: body.verifiedBy }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inbound-receipts"] });
      queryClient.invalidateQueries({ queryKey: ["inventory"] });
      toast({ title: "تأییدیه بارنامه ثبت شد", description: "اقلام محموله ورودی تایید و در انبار ثبت گردید." });
    },
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
                refetchInbound();
              }}
              className="gap-2 text-xs h-8"
            >
              <RefreshCw className="size-3.5" />
              به‌روزرسانی
            </Button>
            {activeTab === "matrix" && (
              <Button
                size="sm"
                onClick={() => setIsAddOrderOpen(true)}
                className="gap-2 text-xs h-8 shadow-xs bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                <Plus className="size-3.5" />
                ثبت سفارش صنایع چوب (B2B / B2C)
              </Button>
            )}
            {activeTab === "inbound" && (
              <Button
                size="sm"
                onClick={() => setIsAddInboundOpen(true)}
                className="gap-2 text-xs h-8 shadow-xs bg-primary hover:bg-primary/90 text-primary-foreground"
              >
                <Plus className="size-3.5" />
                ثبت ورود بار به انبار
              </Button>
            )}
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
            onClick={() => setActiveTab("matrix")}
            className={cn(
              "flex items-center gap-2 rounded-md px-3.5 py-1.5 text-xs font-bold transition-all duration-150 select-none",
              activeTab === "matrix"
                ? "bg-background text-foreground shadow-xs ring-1 ring-border/50"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Factory className="size-3.5 text-emerald-600" />
            جریان سفارشات B2B/B2C و ماتریس تولید
            <Badge variant="secondary" className="text-[10px] h-4.5 px-1.5 font-mono">{toFa(matrix.length)}</Badge>
          </button>

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
            onClick={() => setActiveTab("inbound")}
            className={cn(
              "flex items-center gap-2 rounded-md px-3.5 py-1.5 text-xs font-bold transition-all duration-150 select-none",
              activeTab === "inbound"
                ? "bg-background text-foreground shadow-xs ring-1 ring-border/50"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Boxes className="size-3.5 text-teal-600" />
            ورود و بازرسی بار انبار (GRN)
            <Badge variant="secondary" className="text-[10px] h-4.5 px-1.5 font-mono">{toFa(inboundReceipts.length)}</Badge>
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
            بارگیری و نصاب‌ها
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

      {/* محتوای تب ۳: جریان سفارشات B2B / B2C و ماتریس جامع تولید */}
      {activeTab === "matrix" && (
        <Card className="p-0 overflow-hidden border border-border shadow-xs">
          <div className="flex flex-wrap items-center justify-between border-b border-border bg-muted/40 p-3 gap-2">
            <div className="flex items-center gap-2">
              <Factory className="size-4 text-emerald-600" />
              <span className="text-xs font-bold text-foreground">
                جریان ردیابی سفارشات B2B/B2C، استعلام انبار WMS و ارتقای مرحله کارگاه
              </span>
              <Badge variant="outline" className="text-[10px] font-mono">{toFa(matrix.length)} سفارش</Badge>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => refetchMatrix()}
                className="gap-1.5 text-xs h-7"
              >
                <RefreshCw className="size-3" />
                تازه‌سازی
              </Button>
              <Button
                size="sm"
                onClick={() => setIsAddOrderOpen(true)}
                className="gap-1.5 text-xs h-7 bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                <Plus className="size-3" />
                ثبت سفارش جدید
              </Button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead className="bg-muted/60 text-muted-foreground font-semibold border-b border-border select-none">
                <tr>
                  <th className="py-2.5 px-3">کد و مدل سفارش</th>
                  <th className="py-2.5 px-3">مشتری و کارفرمای نهایی (B2B/B2C)</th>
                  <th className="py-2.5 px-3 text-center">تیراژ و قطعات</th>
                  <th className="py-2.5 px-3 text-center">مرحله جاری کارگاه</th>
                  <th className="py-2.5 px-3 text-center">ایستگاه‌های خط (اره / لبه / CNC / مونتاژ)</th>
                  <th className="py-2.5 px-3">نصاب و پروژه</th>
                  <th className="py-2.5 px-3 text-center">پیشرفت</th>
                  <th className="py-2.5 px-3 text-center">عملیات هوشمند کارگاه</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border font-medium">
                {matrix.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-muted-foreground">
                      هیچ سفارش تولید فعالی در خط وجود ندارد. برای ثبت سفارش، روی «ثبت سفارش جدید» کلیک کنید.
                    </td>
                  </tr>
                ) : (
                  matrix.map((row) => {
                    const stageConf = STAGE_CONFIG[row.currentStage || "CUTTING"] || STAGE_CONFIG.CUTTING;
                    const isB2B = row.customerType === "B2B";

                    return (
                      <tr key={row.id} className="hover:bg-muted/30 transition-colors">
                        <td className="py-2.5 px-3">
                          <div className="flex flex-col gap-0.5">
                            <span className="font-mono font-bold text-primary">{row.code}</span>
                            <span className="text-[11px] font-semibold text-foreground">{row.productName}</span>
                            <div className="mt-0.5">
                              {isB2B ? (
                                <Badge variant="outline" className="text-[9px] h-4 px-1 border-indigo-500/40 text-indigo-700 bg-indigo-500/10">
                                  همکار عمده (B2B)
                                </Badge>
                              ) : (
                                <Badge variant="outline" className="text-[9px] h-4 px-1 border-emerald-500/40 text-emerald-700 bg-emerald-500/10">
                                  مشتری نهایی (B2C)
                                </Badge>
                              )}
                            </div>
                          </div>
                        </td>

                        <td className="py-2.5 px-3">
                          <div className="flex flex-col gap-0.5">
                            <div className="font-bold text-foreground">
                              {row.customerName || "—"}
                            </div>
                            {row.endClientName && (
                              <div className="text-[11px] text-muted-foreground flex items-center gap-1">
                                <span className="text-muted-foreground/70">کارفرمای نهایی:</span>
                                <strong className="text-foreground">{row.endClientName}</strong>
                              </div>
                            )}
                            {row.projectTitle && (
                              <div className="text-[10px] text-indigo-600 font-semibold truncate max-w-[200px]">
                                {row.projectTitle}
                              </div>
                            )}
                          </div>
                        </td>

                        <td className="py-2.5 px-3 text-center">
                          <div className="font-mono font-bold text-foreground">{toFa(row.targetQuantity)} عدد</div>
                          <div className="text-[11px] font-mono text-amber-600 font-semibold">{toFa(row.totalParts)} قطعه برگه</div>
                        </td>

                        <td className="py-2.5 px-3 text-center">
                          <span className={cn("inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border", stageConf.badgeClass)}>
                            {stageConf.label}
                          </span>
                        </td>

                        <td className="py-2.5 px-3 text-center">
                          <div className="flex items-center justify-center gap-1 font-mono text-[10px]">
                            <span className={cn("px-1.5 py-0.5 rounded font-bold", row.cutCount >= row.totalParts && row.totalParts > 0 ? "bg-emerald-500/15 text-emerald-700" : "bg-muted text-muted-foreground")} title="اره برش">
                              اره: {toFa(row.cutCount)}
                            </span>
                            <span className={cn("px-1.5 py-0.5 rounded font-bold", row.edgeCount >= row.totalParts && row.totalParts > 0 ? "bg-emerald-500/15 text-emerald-700" : "bg-muted text-muted-foreground")} title="لبه‌چسبان">
                              لبه: {toFa(row.edgeCount)}
                            </span>
                            <span className={cn("px-1.5 py-0.5 rounded font-bold", row.cncCount >= row.totalParts && row.totalParts > 0 ? "bg-emerald-500/15 text-emerald-700" : "bg-muted text-muted-foreground")} title="ماشین‌کاری CNC">
                              CNC: {toFa(row.cncCount)}
                            </span>
                            <span className={cn("px-1.5 py-0.5 rounded font-bold", row.assembledCount >= row.totalParts && row.totalParts > 0 ? "bg-emerald-500/15 text-emerald-700" : "bg-muted text-muted-foreground")} title="مونتاژ نهایی">
                              مونتاژ: {toFa(row.assembledCount)}
                            </span>
                          </div>
                        </td>

                        <td className="py-2.5 px-3">
                          <div className="flex flex-col gap-0.5">
                            <span className="font-bold text-foreground text-[11px]">
                              {row.assignedInstaller || "بدون نصاب"}
                            </span>
                            {row.installerPhone && (
                              <span className="font-mono text-[10px] text-muted-foreground">
                                {row.installerPhone}
                              </span>
                            )}
                          </div>
                        </td>

                        <td className="py-2.5 px-3 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <div className="w-16 bg-muted rounded-full h-1.5 overflow-hidden">
                              <div
                                className="bg-primary h-1.5 rounded-full transition-all"
                                style={{ width: `${row.progressPercent}%` }}
                              />
                            </div>
                            <span className="font-mono text-[10px] font-bold">{toFa(row.progressPercent)}٪</span>
                          </div>
                        </td>

                        <td className="py-2.5 px-3 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setFeasibilityOrderId(row.id)}
                              className="h-7 text-[10px] px-2 gap-1 border-blue-500/30 text-blue-700 hover:bg-blue-500/10"
                              title="استعلام موجودی ورق، روکش و نوارهای PVC در انبار"
                            >
                              <Boxes className="size-3 text-blue-600" />
                              استعلام انبار
                            </Button>
                            <Button
                              size="sm"
                              onClick={() => {
                                setAdvanceOrderId(row.id);
                                setAdvanceStage(row.currentStage || "EDGE_BANDING");
                              }}
                              className="h-7 text-[10px] px-2 gap-1 bg-emerald-600 hover:bg-emerald-700 text-white"
                              title="ثبت تأییدیه مرحله کارگاهی و انتقال به مرحله بعد"
                            >
                              <CheckCircle2 className="size-3" />
                              ارتقای مرحله
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* محتوای تب گیت ورود و بازرسی بار انبار (GRN) */}
      {activeTab === "inbound" && (
        <Card className="p-0 overflow-hidden border border-border shadow-xs">
          <div className="flex flex-wrap items-center justify-between border-b border-border bg-muted/40 p-3 gap-2">
            <div className="flex items-center gap-2">
              <Boxes className="size-4 text-teal-600" />
              <span className="text-xs font-bold text-foreground">
                گیت بازرسی و رسید ورود بار انبار (GRN — Goods Receipt Note)
              </span>
              <Badge variant="outline" className="text-[10px] font-mono">{toFa(inboundReceipts.length)} محموله</Badge>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => refetchInbound()}
                className="gap-1.5 text-xs h-7"
              >
                <RefreshCw className="size-3" />
                تازه‌سازی
              </Button>
              <Button
                size="sm"
                onClick={() => setIsAddInboundOpen(true)}
                className="gap-1.5 text-xs h-7 shadow-xs bg-teal-600 hover:bg-teal-700 text-white"
              >
                <Plus className="size-3" />
                ثبت ورود بار جدید
              </Button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead className="bg-muted/60 text-muted-foreground font-semibold border-b border-border select-none">
                <tr>
                  <th className="py-2.5 px-3">شماره رسید GRN</th>
                  <th className="py-2.5 px-3">تأمین‌کننده / شرکت فروشنده</th>
                  <th className="py-2.5 px-3">بارنامه و خودروی حمل</th>
                  <th className="py-2.5 px-3">انبار مقصد</th>
                  <th className="py-2.5 px-3 text-center">تاریخ ورود</th>
                  <th className="py-2.5 px-3 text-center">وضعیت تأییدیه</th>
                  <th className="py-2.5 px-3">تأییدکننده</th>
                  <th className="py-2.5 px-3 text-center">عملیات انباردار</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border font-medium">
                {inboundReceipts.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-muted-foreground">
                      هیچ محموله ورودی ثبت نشده است. برای ثبت ورود بار جدید روی دکمه بالا کلیک کنید.
                    </td>
                  </tr>
                ) : (
                  inboundReceipts.map((r) => {
                    const wh = warehouses.find((w) => w.id === r.warehouseId);
                    return (
                      <tr key={r.id} className="hover:bg-muted/30 transition-colors">
                        <td className="py-2.5 px-3">
                          <span className="font-mono font-bold text-teal-700 bg-teal-500/10 px-1.5 py-0.5 rounded">
                            {r.receiptNumber}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 font-bold text-foreground">
                          {r.supplierName}
                        </td>
                        <td className="py-2.5 px-3">
                          <div className="flex flex-col gap-0.5">
                            <span className="font-mono text-[11px] text-foreground">
                              بارنامه: {r.waybillNumber || "—"}
                            </span>
                            <span className="text-[10px] text-muted-foreground">
                              راننده: {r.driverName || "—"} {r.truckPlate ? `(${r.truckPlate})` : ""}
                            </span>
                          </div>
                        </td>
                        <td className="py-2.5 px-3 text-muted-foreground">
                          {wh?.name || "انبار مرکزی"}
                        </td>
                        <td className="py-2.5 px-3 text-center font-mono">
                          {faDate(r.createdAt)}
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          {r.status === "VERIFIED" ? (
                            <Badge className="bg-emerald-500/15 text-emerald-700 border-emerald-500/30 text-[10px]">
                              تأیید و انبارش شد
                            </Badge>
                          ) : r.status === "REJECTED" ? (
                            <Badge className="bg-rose-500/15 text-rose-700 border-rose-500/30 text-[10px]">
                              رد شده / نامنطبق
                            </Badge>
                          ) : (
                            <Badge className="bg-amber-500/15 text-amber-700 border-amber-500/30 text-[10px]">
                              در انتظار تأیید گیت
                            </Badge>
                          )}
                        </td>
                        <td className="py-2.5 px-3 text-muted-foreground text-[11px]">
                          {r.verifiedBy || "—"}
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          {r.status === "PENDING_VERIFICATION" ? (
                            <div className="flex items-center justify-center gap-1">
                              <Button
                                size="sm"
                                onClick={() =>
                                  verifyInboundMutation.mutate({
                                    id: r.id,
                                    status: "VERIFIED",
                                    verifiedBy: "مدیر انبار",
                                  })
                                }
                                disabled={verifyInboundMutation.isPending}
                                className="h-6 text-[10px] px-2 bg-emerald-600 hover:bg-emerald-700 text-white gap-1"
                              >
                                <CheckCircle2 className="size-2.5" />
                                تأیید بار
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() =>
                                  verifyInboundMutation.mutate({
                                    id: r.id,
                                    status: "REJECTED",
                                    verifiedBy: "مدیر انبار",
                                  })
                                }
                                disabled={verifyInboundMutation.isPending}
                                className="h-6 text-[10px] px-2 border-rose-500/30 text-rose-700 hover:bg-rose-500/10"
                              >
                                رد
                              </Button>
                            </div>
                          ) : (
                            <span className="text-[10px] text-muted-foreground flex items-center justify-center gap-1">
                              <CheckCircle className="size-3 text-emerald-600" />
                              ثبت نهایی
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

      {/* ۱. مودال ثبت سفارش جدید صنایع چوب (B2B / B2C) */}
      <Dialog open={isAddOrderOpen} onOpenChange={setIsAddOrderOpen}>
        <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Factory className="size-5 text-emerald-600" />
              ثبت سفارش جدید صنایع چوب و کابینت (B2B / B2C)
            </DialogTitle>
            <DialogDescription>
              سفارش با تفکیک مشتری مستقیم و همکاران، تعریف کارفرمای نهایی و تخصیص نصاب
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-3 py-2 text-xs">
            {/* نوع مشتری */}
            <div>
              <label className="text-[11px] font-bold text-foreground">نوع مشتری و ساختار سفارش</label>
              <div className="grid grid-cols-2 gap-2 mt-1">
                <button
                  type="button"
                  onClick={() => setNewOrder({ ...newOrder, customerType: "B2B" })}
                  className={cn(
                    "flex flex-col items-start p-2.5 rounded-lg border text-right transition-all",
                    newOrder.customerType === "B2B"
                      ? "border-indigo-600 bg-indigo-500/10 text-indigo-900 dark:text-indigo-200 ring-1 ring-indigo-600"
                      : "border-border hover:bg-muted/50"
                  )}
                >
                  <div className="flex items-center gap-1.5 font-bold text-xs">
                    <Building2 className="size-3.5 text-indigo-600" />
                    همکار / پیمانکار (B2B)
                  </div>
                  <span className="text-[10px] text-muted-foreground mt-0.5">
                    فروش به همکار یا دکوراتور با ثبت مشخصات کارفرمای نهایی
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setNewOrder({ ...newOrder, customerType: "B2C" })}
                  className={cn(
                    "flex flex-col items-start p-2.5 rounded-lg border text-right transition-all",
                    newOrder.customerType === "B2C"
                      ? "border-emerald-600 bg-emerald-500/10 text-emerald-900 dark:text-emerald-200 ring-1 ring-emerald-600"
                      : "border-border hover:bg-muted/50"
                  )}
                >
                  <div className="flex items-center gap-1.5 font-bold text-xs">
                    <UserCheck className="size-3.5 text-emerald-600" />
                    مشتری مصرف‌کننده (B2C)
                  </div>
                  <span className="text-[10px] text-muted-foreground mt-0.5">
                    سفارش مستقیم بدون واسطه برای منزل یا پروژه شخصی
                  </span>
                </button>
              </div>
            </div>

            {/* نام مشتری یا همکار */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div>
                <label className="text-[11px] font-semibold text-muted-foreground">
                  {newOrder.customerType === "B2B" ? "نام شرکت یا همکار خریدار *" : "نام مشتری خریدار *"}
                </label>
                <Input
                  placeholder={newOrder.customerType === "B2B" ? "مثلاً استودیو معماری کیان، مهندس عباسی" : "مثلاً آقای حسینی"}
                  value={newOrder.customerName}
                  onChange={(e) => setNewOrder({ ...newOrder, customerName: e.target.value })}
                  className="mt-1 h-8 text-xs"
                />
              </div>

              {newOrder.customerType === "B2B" ? (
                <div>
                  <label className="text-[11px] font-semibold text-indigo-600 flex items-center gap-1">
                    نام کارفرمای نهایی همکار *
                    <span className="text-[10px] font-normal text-muted-foreground">(بدانیم برای چه کسی ساخته می‌شود)</span>
                  </label>
                  <Input
                    placeholder="مثلاً خانم دکتر فرهمند"
                    value={newOrder.endClientName}
                    onChange={(e) => setNewOrder({ ...newOrder, endClientName: e.target.value })}
                    className="mt-1 h-8 text-xs border-indigo-400/50"
                  />
                </div>
              ) : (
                <div>
                  <label className="text-[11px] font-semibold text-muted-foreground">شماره تماس مشتری</label>
                  <Input
                    placeholder="۰۹۱۲..."
                    value={newOrder.notes}
                    onChange={(e) => setNewOrder({ ...newOrder, notes: e.target.value })}
                    className="mt-1 h-8 text-xs font-mono"
                  />
                </div>
              )}
            </div>

            {/* عنوان پروژه */}
            <div>
              <label className="text-[11px] font-semibold text-muted-foreground">عنوان سفارش و موقعیت پروژه</label>
              <Input
                placeholder="مثلاً کابینت مدرن هایگلاس و پلی‌اورتان — پروژه ولنجک برج آناهید"
                value={newOrder.projectTitle}
                onChange={(e) => setNewOrder({ ...newOrder, projectTitle: e.target.value })}
                className="mt-1 h-8 text-xs"
              />
            </div>

            {/* محصول کاتالوگ (اختیاری) */}
            <div>
              <label className="text-[11px] font-semibold text-muted-foreground">انتخاب محصول کاتالوگ کاردو (اختیاری)</label>
              <div className="mt-1">
                <ProductSearchSelect
                  value={newOrder.productId}
                  onChange={(p) => setNewOrder({ ...newOrder, productId: p?.id || "" })}
                  placeholder="جستجو یا انتخاب از محصولات پایه..."
                />
              </div>
            </div>

            {/* تیراژ، تاریخ تحویل و اولویت */}
            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="text-[11px] font-semibold text-muted-foreground">تیراژ (تعداد)</label>
                <Input
                  type="number"
                  min={1}
                  value={newOrder.targetQuantity}
                  onChange={(e) => setNewOrder({ ...newOrder, targetQuantity: Number(e.target.value) || 1 })}
                  className="mt-1 h-8 text-xs font-mono"
                />
              </div>
              <div>
                <label className="text-[11px] font-semibold text-muted-foreground">موعد تحویل</label>
                <Input
                  type="date"
                  value={newOrder.dueDate}
                  onChange={(e) => setNewOrder({ ...newOrder, dueDate: e.target.value })}
                  className="mt-1 h-8 text-xs font-mono"
                />
              </div>
              <div>
                <label className="text-[11px] font-semibold text-muted-foreground">اولویت تولید</label>
                <select
                  value={newOrder.priority}
                  onChange={(e) => setNewOrder({ ...newOrder, priority: Number(e.target.value) })}
                  className="mt-1 h-8 w-full rounded-md border border-input bg-background px-2 text-xs"
                >
                  <option value={1}>عادی</option>
                  <option value={2}>فوری</option>
                  <option value={3}>خیلی فوری / VIP</option>
                </select>
              </div>
            </div>

            {/* نصاب اختصاصی */}
            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-border">
              <div>
                <label className="text-[11px] font-semibold text-muted-foreground flex items-center gap-1">
                  <HardHat className="size-3 text-amber-600" />
                  نصاب اختصاصی کاردو
                </label>
                <Input
                  placeholder="مثلاً استاد بهرامی"
                  value={newOrder.assignedInstaller}
                  onChange={(e) => setNewOrder({ ...newOrder, assignedInstaller: e.target.value })}
                  className="mt-1 h-8 text-xs"
                />
              </div>
              <div>
                <label className="text-[11px] font-semibold text-muted-foreground">شماره تماس نصاب</label>
                <Input
                  placeholder="۰۹۱۲..."
                  value={newOrder.installerPhone}
                  onChange={(e) => setNewOrder({ ...newOrder, installerPhone: e.target.value })}
                  className="mt-1 h-8 text-xs font-mono"
                />
              </div>
            </div>

            {/* توضیحات */}
            <div>
              <label className="text-[11px] font-semibold text-muted-foreground">توضیحات فنی سفارش</label>
              <Textarea
                rows={2}
                placeholder="رنگ روکش، نوع دستگیره، ریل آرام‌بند، الزامات بسته‌بندی و..."
                value={newOrder.notes}
                onChange={(e) => setNewOrder({ ...newOrder, notes: e.target.value })}
                className="mt-1 text-xs resize-none"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setIsAddOrderOpen(false)}>
              انصراف
            </Button>
            <Button
              size="sm"
              disabled={!newOrder.customerName || createOrderMutation.isPending}
              onClick={() => createOrderMutation.mutate(newOrder)}
              className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5"
            >
              <CheckCircle2 className="size-3.5" />
              {createOrderMutation.isPending ? "در حال ثبت..." : "ثبت نهایی سفارش"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ۲. مودال ثبت گیت ورود بار به انبار (محموله جدید GRN) */}
      <Dialog open={isAddInboundOpen} onOpenChange={setIsAddInboundOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Boxes className="size-5 text-teal-600" />
              ثبت گیت ورود بار به انبار (محموله جدید تأمین‌کننده)
            </DialogTitle>
            <DialogDescription>
              ثبت بارنامه و اطلاعات خودروی حامل ورق‌های MDF، نوار لبه یا یراق‌آلات قبل از تخلیه
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
              <label className="text-[11px] font-semibold text-muted-foreground">شماره بارنامه رسمی یا فاکتور ورودی</label>
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
                placeholder="مثلاً ۱۲۰ برگ هایگلاس کد ۷۰۲ + ۵ کارتن ریل آرام‌بند ۵۰ سانت"
                value={newInbound.notes}
                onChange={(e) => setNewInbound({ ...newInbound, notes: e.target.value })}
                className="mt-1 text-xs resize-none"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setIsAddInboundOpen(false)}>
              انصراف
            </Button>
            <Button
              size="sm"
              disabled={!newInbound.supplierName || createInboundMutation.isPending}
              onClick={() => createInboundMutation.mutate(newInbound)}
              className="bg-teal-600 hover:bg-teal-700 text-white gap-1.5"
            >
              <CheckCircle2 className="size-3.5" />
              {createInboundMutation.isPending ? "در حال ثبت..." : "ثبت ورود بار و صدور رسید"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ۳. مودال استعلام متریال و موجودی انبار WMS (MTO Feasibility Check) */}
      <Dialog open={!!feasibilityOrderId} onOpenChange={() => setFeasibilityOrderId(null)}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Boxes className="size-5 text-blue-600" />
              استعلام امکان‌سنجی متریال و موجودی انبار WMS
            </DialogTitle>
            <DialogDescription>
              تطبیق بلادرنگ قطعات برگه برش سفارش با کالاهای موجود در انبار جهت شروع تولید
            </DialogDescription>
          </DialogHeader>

          {feasibilityQ.isLoading ? (
            <div className="py-12 text-center text-muted-foreground text-xs">
              در حال استعلام موجودی از انبار...
            </div>
          ) : feasibilityQ.data ? (
            <div className="flex flex-col gap-3 py-2 text-xs">
              {/* خلاصه و وضعیت کلی تولید */}
              <div
                className={cn(
                  "p-3 rounded-xl border flex items-center justify-between",
                  !feasibilityQ.data.hasShortage
                    ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-900 dark:text-emerald-200"
                    : "bg-rose-500/10 border-rose-500/30 text-rose-900 dark:text-rose-200"
                )}
              >
                <div className="flex items-center gap-2.5">
                  {!feasibilityQ.data.hasShortage ? (
                    <CheckCircle2 className="size-6 text-emerald-600" />
                  ) : (
                    <ShieldAlert className="size-6 text-rose-600" />
                  )}
                  <div>
                    <div className="font-bold text-sm">
                      {!feasibilityQ.data.hasShortage
                        ? "امکان تولید بلافاصله وجود دارد"
                        : "کسری متریال در انبار — نیاز به تأمین بار"}
                    </div>
                    <div className="text-[11px] opacity-90 mt-0.5">
                      {!feasibilityQ.data.hasShortage
                        ? "تمامی ورق‌ها و متریال‌های لازم در موجودی آزاد انبار موجود هستند."
                        : "تعدادی از متریال‌ها با کسری مواجه هستند. لطفاً بارنامه ورود کالا ثبت نمایید."}
                    </div>
                  </div>
                </div>

                <div className="text-left font-mono">
                  <div className="text-[10px] opacity-75">کد سفارش</div>
                  <div className="font-bold text-sm">{feasibilityQ.data.orderCode}</div>
                </div>
              </div>

              {/* شاخص‌های ردیفی */}
              <div className="grid grid-cols-3 gap-2">
                <div className="p-2.5 rounded-lg border bg-muted/30 text-center">
                  <div className="text-muted-foreground text-[10px]">کل اقلام موردنیاز</div>
                  <div className="text-base font-bold font-mono mt-0.5">{toFa(feasibilityQ.data.materials.length)} قلم</div>
                </div>
                <div className="p-2.5 rounded-lg border bg-emerald-500/5 text-center border-emerald-500/20">
                  <div className="text-emerald-700 text-[10px]">موجودی کافی</div>
                  <div className="text-base font-bold font-mono text-emerald-700 mt-0.5">
                    {toFa(feasibilityQ.data.materials.filter((m) => m.status === "AVAILABLE").length)} قلم
                  </div>
                </div>
                <div className="p-2.5 rounded-lg border bg-rose-500/5 text-center border-rose-500/20">
                  <div className="text-rose-700 text-[10px]">اقلام دارای کسری</div>
                  <div className="text-base font-bold font-mono text-rose-700 mt-0.5">
                    {toFa(feasibilityQ.data.materials.filter((m) => m.status === "SHORTAGE").length)} قلم
                  </div>
                </div>
              </div>

              {/* جدول اقلام تفصیلی برگه برش */}
              <div className="rounded-lg border overflow-hidden mt-1">
                <table className="w-full text-right text-xs">
                  <thead className="bg-muted/70 text-muted-foreground font-semibold border-b">
                    <tr>
                      <th className="p-2">نام متریال / ورق</th>
                      <th className="p-2 text-center">نیاز سفارش</th>
                      <th className="p-2 text-center">موجودی انبار</th>
                      <th className="p-2 text-center">کسری</th>
                      <th className="p-2 text-center">وضعیت</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y font-medium">
                    {feasibilityQ.data.materials.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="p-6 text-center text-muted-foreground">
                          هیچ قطعه برشی برای این سفارش ثبت نشده است. ابتدا در تب «لیست ابعاد برش» قطعات را ثبت نمایید.
                        </td>
                      </tr>
                    ) : (
                      feasibilityQ.data.materials.map((it, idx) => (
                        <tr key={idx} className="hover:bg-muted/30">
                          <td className="p-2 font-bold text-foreground">{it.materialName}</td>
                          <td className="p-2 text-center font-mono">
                            {toFa(it.requiredQty)} <span className="text-[10px] text-muted-foreground">واحد</span>
                          </td>
                          <td className="p-2 text-center font-mono">
                            {toFa(it.stockQty)} <span className="text-[10px] text-muted-foreground">واحد</span>
                          </td>
                          <td className="p-2 text-center font-mono font-bold text-rose-600">
                            {it.shortageQty > 0 ? `${toFa(it.shortageQty)} واحد` : "—"}
                          </td>
                          <td className="p-2 text-center">
                            {it.status === "AVAILABLE" ? (
                              <Badge className="bg-emerald-500/15 text-emerald-700 border-emerald-500/30 text-[9px]">
                                کافی
                              </Badge>
                            ) : (
                              <Badge className="bg-rose-500/15 text-rose-700 border-rose-500/30 text-[9px]">
                                کسری در انبار
                              </Badge>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          ) : null}

          <DialogFooter className="gap-2">
            <Button variant="outline" size="sm" onClick={() => setFeasibilityOrderId(null)}>
              بستن
            </Button>
            {feasibilityQ.data && feasibilityQ.data.hasShortage && (
              <Button
                size="sm"
                onClick={() => {
                  setFeasibilityOrderId(null);
                  setIsAddInboundOpen(true);
                }}
                className="bg-teal-600 hover:bg-teal-700 text-white gap-1.5"
              >
                <Plus className="size-3.5" />
                ثبت رسید ورود بار تأمین‌کننده
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ۴. مودال ارتقای مرحله کارگاه و تأییدیه */}
      <Dialog open={!!advanceOrderId} onOpenChange={() => setAdvanceOrderId(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle2 className="size-5 text-emerald-600" />
              ارتقای مرحله سفارش در خط تولید
            </DialogTitle>
            <DialogDescription>
              ثبت تأییدیه اپراتور و انتقال قطعات سفارش به ایستگاه کاری بعدی
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-3 py-2 text-xs">
            <div>
              <label className="text-[11px] font-semibold text-muted-foreground">انتخاب مرحله جدید در کارگاه</label>
              <select
                value={advanceStage}
                onChange={(e) => setAdvanceStage(e.target.value)}
                className="mt-1 h-9 w-full rounded-md border border-input bg-background px-2.5 text-xs font-bold"
              >
                <option value="CUTTING">۱. برش و اره‌کاری (SAW)</option>
                <option value="EDGE_BANDING">۲. لبه‌چسبان نوار PVC (EDGE)</option>
                <option value="CNC">۳. ماشین‌کاری و سوراخ‌کاری CNC</option>
                <option value="ASSEMBLY">۴. مونتاژ یونیت و یراق‌آلات (ASSM)</option>
                <option value="PAINTING">۵. رنگ، سیلر، کیلر و فینیشینگ</option>
                <option value="QC_PACKING">۶. کنترل کیفی و بسته‌بندی نهایی (QC)</option>
                <option value="INSTALLATION">۷. تحویل به نصاب / اعزام به پروژه</option>
              </select>
            </div>

            <div>
              <label className="text-[11px] font-semibold text-muted-foreground">نام اپراتور یا سرپرست ایستگاه</label>
              <Input
                placeholder="مثلاً اپراتور اره‌کاری، استاد رحیمی"
                value={advanceOperator}
                onChange={(e) => setAdvanceOperator(e.target.value)}
                className="mt-1 h-8 text-xs"
              />
            </div>

            <div>
              <label className="text-[11px] font-semibold text-muted-foreground">توضیحات و نکات کنترل کیفیت</label>
              <Textarea
                rows={2}
                placeholder="تأیید ابعاد برش، تست لولا، بدون خط و خش و..."
                value={advanceNotes}
                onChange={(e) => setAdvanceNotes(e.target.value)}
                className="mt-1 text-xs resize-none"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setAdvanceOrderId(null)}>
              انصراف
            </Button>
            <Button
              size="sm"
              disabled={advanceStageMutation.isPending}
              onClick={() => {
                if (advanceOrderId) {
                  advanceStageMutation.mutate({
                    orderId: advanceOrderId,
                    stage: advanceStage,
                    operatorName: advanceOperator,
                    notes: advanceNotes,
                  });
                }
              }}
              className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5"
            >
              <CheckCircle2 className="size-3.5" />
              {advanceStageMutation.isPending ? "در حال ثبت..." : "تأیید و ارتقای مرحله"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
