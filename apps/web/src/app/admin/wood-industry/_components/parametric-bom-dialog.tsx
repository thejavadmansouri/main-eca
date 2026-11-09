"use client";

import * as React from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Calculator,
  Layers,
  Scissors,
  CheckCircle2,
  FileSpreadsheet,
  Download,
  Plus,
  Boxes,
  Sparkles,
  ArrowRight,
  RotateCcw,
  Ruler,
  DollarSign,
} from "lucide-react";

import { calculateParametricBom, applyParametricBomToOrder } from "@/lib/api";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { money, toFa } from "@/lib/format";
import type { ParametricBomDto, ParametricBomResult, WoodProductionOrderSummary } from "@/lib/types";

interface ParametricBomDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orders: WoodProductionOrderSummary[];
  defaultOrderId?: string;
}

export function ParametricBomDialog({
  open,
  onOpenChange,
  orders,
  defaultOrderId = "",
}: ParametricBomDialogProps) {
  const { toast } = useToast();
  const qc = useQueryClient();

  const [selectedOrderId, setSelectedOrderId] = React.useState(defaultOrderId);
  const [params, setParams] = React.useState<ParametricBomDto>({
    unitType: "BASE_CABINET",
    widthMm: 900,
    heightMm: 720,
    depthMm: 550,
    quantity: 1,
    shelfCount: 1,
    doorCount: 2,
    drawerCount: 0,
    bodyMaterial: "MDF سفید صابونی ۱۶ میل",
    doorMaterial: "هایگلاس AGT سفید براق",
    edgeThicknessMm: 2,
  });

  const [calculationResult, setCalculationResult] = React.useState<ParametricBomResult | null>(null);

  // محاسبه خودکار به محض تغییر پارامترها
  const calculateMut = useMutation({
    mutationFn: (dto: ParametricBomDto) => calculateParametricBom(dto),
    onSuccess: (data) => {
      setCalculationResult(data);
    },
    onError: (err: any) => {
      toast({ variant: "destructive", title: "خطا در محاسبه BOM", description: err.message });
    },
  });

  // اولین محاسبه هنگام باز شدن
  React.useEffect(() => {
    if (open) {
      calculateMut.mutate(params);
    }
  }, [open]);

  function handleParamChange<K extends keyof ParametricBomDto>(key: K, value: ParametricBomDto[K]) {
    const updated = { ...params, [key]: value };
    setParams(updated);
    calculateMut.mutate(updated);
  }

  // انتقال مستقیم به سفارش
  const applyMut = useMutation({
    mutationFn: () => {
      if (!selectedOrderId) throw new Error("لطفاً یک سفارش را برای انتقال قطعات انتخاب کنید.");
      return applyParametricBomToOrder(selectedOrderId, params);
    },
    onSuccess: (res) => {
      toast({
        title: "قطعات به سفارش اضافه شدند",
        description: res.message,
      });
      qc.invalidateQueries({ queryKey: ["wood-cutting-list", selectedOrderId] });
      qc.invalidateQueries({ queryKey: ["all-wood-orders"] });
      onOpenChange(false);
    },
    onError: (err: any) => {
      toast({ variant: "destructive", title: "خطا در انتقال قطعات", description: err.message });
    },
  });

  // خروجی فوری فایل CSV کات‌رایت از نتیجه
  function handleDownloadQuickCsv() {
    if (!calculationResult) return;
    const headers = ["PartName", "Material", "Length_mm", "Width_mm", "Thickness_mm", "Quantity", "GrainDirection", "EdgeL1", "EdgeL2", "EdgeW1", "EdgeW2"];
    const rows = calculationResult.parts.map((p) => [
      `"${p.partName}"`,
      `"${p.material}"`,
      p.lengthMm,
      p.widthMm,
      p.thicknessMm,
      p.quantity,
      p.grainDirection,
      p.edgeL1 ? "PVC_2MM" : "-",
      p.edgeL2 ? "PVC_2MM" : "-",
      p.edgeW1 ? "PVC_2MM" : "-",
      p.edgeW2 ? "PVC_2MM" : "-",
    ]);

    const csvContent = "\uFEFF" + [headers.join(","), ...rows.map((r) => r.join(","))].join("\r\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `CutRite_${params.unitType}_${params.widthMm}x${params.heightMm}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast({ title: "فایل Cut Rite دانلود شد", description: "خروجی پارت‌لیست با موفقیت استخراج گردید." });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl w-full rounded-3xl p-6 select-none max-h-[90vh] overflow-y-auto" dir="rtl">
        <DialogHeader className="text-start">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-lg font-black flex items-center gap-2">
              <Calculator className="size-5 text-emerald-600" />
              ماشین‌حساب و ساختار مواد پارامتریک صنایع چوب (Parametric BOM)
            </DialogTitle>
            <Badge variant="outline" className="text-xs font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40">
              فرموله لحظه‌ای
            </Badge>
          </div>
          <DialogDescription className="text-xs">
            با وارد کردن ابعاد یونیت، تمامی قطعات بدنه، درب‌ها، تعداد ورق، متراژ نوار PVC و بهای تمام‌شده خودکار برآورد می‌شود.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 py-3">
          {/* ستون ۱: ورودی پارامترهای ابعاد و مشخصات */}
          <div className="space-y-4 rounded-2xl border bg-muted/20 p-4">
            <h4 className="text-xs font-black text-foreground flex items-center gap-1.5 border-b pb-2">
              <Ruler className="size-4 text-primary" />
              مشخصات و ابعاد کلی یونیت
            </h4>

            {/* تیپ یونیت */}
            <div className="space-y-1">
              <Label className="text-xs font-bold">نوع یونیت:</Label>
              <select
                value={params.unitType}
                onChange={(e) => handleParamChange("unitType", e.target.value as any)}
                className="h-9 w-full rounded-xl border bg-background px-3 text-xs font-medium"
              >
                <option value="BASE_CABINET">کابینت زمینی (Base Unit)</option>
                <option value="WALL_CABINET">کابینت دیواری / هوایی (Wall Unit)</option>
                <option value="TALL_CABINET">کابینت کمدی قدی / سوپرمارکت</option>
                <option value="WARDROBE">کمد لباس دیواری / واک‌این کلوزت</option>
                <option value="DRAWER_BOX">باکس و دراور چند کشو</option>
              </select>
            </div>

            {/* ابعاد اصلی */}
            <div className="grid grid-cols-3 gap-2">
              <div className="space-y-1">
                <Label className="text-[11px] font-bold">عرض (W mm):</Label>
                <Input
                  type="number"
                  value={params.widthMm}
                  onChange={(e) => handleParamChange("widthMm", Number(e.target.value))}
                  className="h-8 text-xs font-mono"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-[11px] font-bold">ارتفاع (H mm):</Label>
                <Input
                  type="number"
                  value={params.heightMm}
                  onChange={(e) => handleParamChange("heightMm", Number(e.target.value))}
                  className="h-8 text-xs font-mono"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-[11px] font-bold">عمق (D mm):</Label>
                <Input
                  type="number"
                  value={params.depthMm}
                  onChange={(e) => handleParamChange("depthMm", Number(e.target.value))}
                  className="h-8 text-xs font-mono"
                />
              </div>
            </div>

            {/* تعداد و اجزا */}
            <div className="grid grid-cols-3 gap-2">
              <div className="space-y-1">
                <Label className="text-[11px] font-bold">تعداد یونیت:</Label>
                <Input
                  type="number"
                  min={1}
                  value={params.quantity}
                  onChange={(e) => handleParamChange("quantity", Number(e.target.value))}
                  className="h-8 text-xs font-mono"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-[11px] font-bold">تعداد طبقه:</Label>
                <Input
                  type="number"
                  min={0}
                  value={params.shelfCount}
                  onChange={(e) => handleParamChange("shelfCount", Number(e.target.value))}
                  className="h-8 text-xs font-mono"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-[11px] font-bold">تعداد درب:</Label>
                <select
                  value={params.doorCount}
                  onChange={(e) => handleParamChange("doorCount", Number(e.target.value))}
                  className="h-8 w-full rounded-lg border bg-background px-2 text-xs"
                >
                  <option value={0}>بدون درب (اوپن / دکوری)</option>
                  <option value={1}>تک لنگه</option>
                  <option value={2}>دو لنگه</option>
                </select>
              </div>
            </div>

            {/* جنس بدنه و درب */}
            <div className="space-y-2 pt-1 border-t">
              <div className="space-y-1">
                <Label className="text-[11px] font-bold">جنس ورق بدنه:</Label>
                <Input
                  value={params.bodyMaterial}
                  onChange={(e) => handleParamChange("bodyMaterial", e.target.value)}
                  className="h-8 text-xs"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-[11px] font-bold">جنس ورق درب / نما:</Label>
                <Input
                  value={params.doorMaterial}
                  onChange={(e) => handleParamChange("doorMaterial", e.target.value)}
                  className="h-8 text-xs"
                />
              </div>
            </div>
          </div>

          {/* ستون ۲ و ۳: جدول قطعات استخراج‌شده و خلاصه مواد و هزینه‌ها */}
          <div className="md:col-span-2 space-y-4">
            {calculationResult && (
              <>
                {/* کارت‌های خلاصه مصرف مواد */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                  <div className="rounded-xl border bg-blue-500/10 border-blue-500/20 p-2.5">
                    <span className="text-[10px] text-blue-700 dark:text-blue-400 font-medium">ورق بدنه لازم</span>
                    <p className="text-base font-black text-blue-800 dark:text-blue-300">
                      {toFa(calculationResult.summary.bodySheetsRequired)} <span className="text-[10px] font-normal">ورق کامل</span>
                    </p>
                    <span className="text-[10px] text-muted-foreground">{toFa(calculationResult.summary.totalBodyAreaM2)} مترمربع</span>
                  </div>

                  <div className="rounded-xl border bg-purple-500/10 border-purple-500/20 p-2.5">
                    <span className="text-[10px] text-purple-700 dark:text-purple-400 font-medium">ورق درب / نما</span>
                    <p className="text-base font-black text-purple-800 dark:text-purple-300">
                      {toFa(calculationResult.summary.doorSheetsRequired)} <span className="text-[10px] font-normal">ورق هایگلاس</span>
                    </p>
                    <span className="text-[10px] text-muted-foreground">{toFa(calculationResult.summary.totalDoorAreaM2)} مترمربع</span>
                  </div>

                  <div className="rounded-xl border bg-emerald-500/10 border-emerald-500/20 p-2.5">
                    <span className="text-[10px] text-emerald-700 dark:text-emerald-400 font-medium">نوار لبه PVC</span>
                    <p className="text-base font-black text-emerald-800 dark:text-emerald-300">
                      {toFa(calculationResult.summary.totalEdgeLengthMeters)} <span className="text-[10px] font-normal">متر طول</span>
                    </p>
                    <span className="text-[10px] text-muted-foreground">ضخامت ۲ میل</span>
                  </div>

                  <div className="rounded-xl border bg-amber-500/10 border-amber-500/20 p-2.5">
                    <span className="text-[10px] text-amber-700 dark:text-amber-400 font-medium">قیمت پیشنهادی</span>
                    <p className="text-sm font-black text-amber-800 dark:text-amber-300">
                      {money(calculationResult.summary.financials.suggestedPrice)} <span className="text-[9px] font-normal">ریال</span>
                    </p>
                    <span className="text-[10px] text-muted-foreground">بهای تمام‌شده: {money(calculationResult.summary.financials.totalCost)}</span>
                  </div>
                </div>

                {/* جدول قطعات خروجی برای برش */}
                <div className="rounded-2xl border overflow-hidden">
                  <div className="bg-muted/40 px-3 py-2 border-b flex items-center justify-between text-xs font-bold">
                    <span>لیست قطعات خروجی یونیت ({toFa(calculationResult.parts.length)} ردیف قطعه)</span>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleDownloadQuickCsv}
                      className="h-7 gap-1 text-[11px] font-semibold text-emerald-600 hover:text-emerald-700"
                    >
                      <Download className="size-3" />
                      خروجی Cut Rite
                    </Button>
                  </div>
                  <div className="max-h-52 overflow-y-auto">
                    <table className="w-full text-right text-xs">
                      <thead className="bg-muted/20 text-[11px] text-muted-foreground sticky top-0">
                        <tr>
                          <th className="p-2">نام قطعه</th>
                          <th className="p-2">طول × عرض (mm)</th>
                          <th className="p-2">تعداد</th>
                          <th className="p-2">جنس</th>
                          <th className="p-2">نوار لبه</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y text-[11px]">
                        {calculationResult.parts.map((p, idx) => (
                          <tr key={idx} className="hover:bg-muted/20">
                            <td className="p-2 font-bold text-foreground">{p.partName}</td>
                            <td className="p-2 font-mono" dir="ltr">
                              {p.lengthMm} × {p.widthMm}
                            </td>
                            <td className="p-2 font-bold text-primary">{toFa(p.quantity)}</td>
                            <td className="p-2 text-muted-foreground truncate max-w-[120px]">{p.material}</td>
                            <td className="p-2">
                              {p.edgeL1 || p.edgeW1 ? (
                                <Badge variant="outline" className="text-[10px] px-1 py-0 text-emerald-600">
                                  PVC ۲ میل
                                </Badge>
                              ) : (
                                <span className="text-muted-foreground/60">—</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* لیست یراق‌آلات مورد نیاز */}
                <div className="rounded-2xl border bg-card p-3 space-y-1.5">
                  <h5 className="text-xs font-bold text-foreground flex items-center gap-1.5">
                    <Boxes className="size-3.5 text-primary" />
                    یراق‌آلات و اتصالات مورد نیاز یونیت:
                  </h5>
                  <div className="flex flex-wrap gap-2 pt-1">
                    {calculationResult.summary.hardwareList.map((hw, hIdx) => (
                      <span
                        key={hIdx}
                        className="rounded-lg bg-muted/50 border px-2 py-1 text-[11px] text-muted-foreground font-medium"
                      >
                        {hw.name}: <strong className="text-foreground">{toFa(hw.quantity)} {hw.unit}</strong>
                      </span>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* انتقال مستقیم به سفارش کارگاهی */}
        <div className="mt-2 rounded-2xl border bg-emerald-500/5 border-emerald-500/20 p-3 flex flex-wrap items-center justify-between gap-3">
          <div className="space-y-0.5">
            <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
              <Plus className="size-3.5 text-emerald-600" />
              افزودن مستقیم این قطعات به پارت‌لیست سفارش کارگاهی
            </span>
            <p className="text-[11px] text-muted-foreground">
              قطعات به همراه بارکد یکتای برش مستقیم در جدول سفارش کارگاهی ذخیره می‌شوند.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <select
              value={selectedOrderId}
              onChange={(e) => setSelectedOrderId(e.target.value)}
              className="h-8 rounded-xl border bg-background px-3 text-xs font-medium"
            >
              <option value="">-- انتخاب سفارش مقصد --</option>
              {orders.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.code} — {o.projectTitle || o.customerName || "پروژه صنایع چوب"}
                </option>
              ))}
            </select>
            <Button
              size="sm"
              disabled={!selectedOrderId || applyMut.isPending}
              onClick={() => applyMut.mutate()}
              className="h-8 text-xs gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
            >
              <Plus className="size-3.5" />
              <span>{applyMut.isPending ? "در حال ثبت..." : "انتقال قطعات به سفارش"}</span>
            </Button>
          </div>
        </div>

        <DialogFooter className="gap-2 pt-3">
          <Button variant="ghost" size="sm" onClick={() => onOpenChange(false)} className="text-xs">
            بستن
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
