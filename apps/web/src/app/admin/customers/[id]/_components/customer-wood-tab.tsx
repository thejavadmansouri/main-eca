"use client";

import * as React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Scissors,
  Share2,
  ExternalLink,
  Copy,
  Calendar,
  CheckCircle2,
  Clock,
  UserCheck,
  Phone,
  Layers,
  Wrench,
  AlertCircle,
  Percent,
  Camera,
  Image as ImageIcon,
  Plus,
  Trash2,
  Eye,
  StickyNote,
  Box,
} from "lucide-react";
import { Cabinet3DExplodedViewer } from "@/components/wood/cabinet-3d-exploded-viewer";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { getWoodOrders, generateTrackingToken, updateOrderProgress, addStageUpdate } from "@/lib/api";
import { faDate, toFa } from "@/lib/format";
import type { WoodProductionOrderSummary } from "@/lib/types";

interface CustomerWoodTabProps {
  customerName: string;
  customerId: string;
}

const STAGE_LABELS: Record<string, { label: string; color: string }> = {
  CUTTING: { label: "ایستگاه برش", color: "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-200" },
  EDGE_BANDING: { label: "لبه‌چسبان (PVC)", color: "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-200" },
  CNC: { label: "ماشین‌کاری CNC", color: "bg-purple-500/10 text-purple-700 dark:text-purple-400 border-purple-200" },
  ASSEMBLY: { label: "مونتاژ و یراق", color: "bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 border-indigo-200" },
  FINISHING: { label: "رنگ‌کاری و سنباده", color: "bg-pink-500/10 text-pink-700 dark:text-pink-400 border-pink-200" },
  QC_PACKING: { label: "کنترل کیفیت و بسته‌بندی", color: "bg-teal-500/10 text-teal-700 dark:text-teal-400 border-teal-200" },
  READY_TO_INSTALL: { label: "آماده ارسال و اعزام", color: "bg-cyan-500/10 text-cyan-700 dark:text-cyan-400 border-cyan-200" },
  INSTALLED: { label: "تحویل و نصب‌شده", color: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-200" },
};

export function CustomerWoodTab({ customerName, customerId }: CustomerWoodTabProps) {
  const queryClient = useQueryClient();
  const [trackingModalOpen, setTrackingModalOpen] = React.useState(false);
  const [activeTrackingUrl, setActiveTrackingUrl] = React.useState<string | null>(null);
  const [selectedOrder, setSelectedOrder] = React.useState<WoodProductionOrderSummary | null>(null);

  // دیالوگ ویرایش درصد پیشرفت
  const [editProgressModalOpen, setEditProgressModalOpen] = React.useState(false);
  const [editProgressOrder, setEditProgressOrder] = React.useState<WoodProductionOrderSummary | null>(null);
  const [newProgress, setNewProgress] = React.useState<number>(0);
  const [newEstimatedDate, setNewEstimatedDate] = React.useState<string>("");

  // دیالوگ ثبت عکس و نوت مرحله
  const [stagePhotoModalOpen, setStagePhotoModalOpen] = React.useState(false);
  const [targetOrderForStage, setTargetOrderForStage] = React.useState<WoodProductionOrderSummary | null>(null);
  const [stageStationCode, setStageStationCode] = React.useState("CUTTING");
  const [stageTitle, setStageTitle] = React.useState("");
  const [stageNotes, setStageNotes] = React.useState("");
  const [stagePhotos, setStagePhotos] = React.useState<string[]>([]);
  const [advanceStageCheck, setAdvanceStageCheck] = React.useState(false);

  // لایت‌باکس عکس تمام‌صفحه
  const [activePreviewImage, setActivePreviewImage] = React.useState<string | null>(null);

  // دوقلوی سه‌بعدی و نمای انفجاری
  const [viewer3DOrder, setViewer3DOrder] = React.useState<WoodProductionOrderSummary | null>(null);

  const fileInputRef = React.useRef<HTMLInputElement | null>(null);

  const { data: orders = [], isLoading } = useQuery({
    queryKey: ["customer-wood-orders", customerName],
    queryFn: () => getWoodOrders({ customerName }),
    enabled: Boolean(customerName),
  });

  const progressMutation = useMutation({
    mutationFn: (data: { orderId: string; progressPercent: number; estimatedCompletionDate?: string }) =>
      updateOrderProgress(data.orderId, {
        progressPercent: data.progressPercent,
        estimatedCompletionDate: data.estimatedCompletionDate,
      }),
    onSuccess: () => {
      toast.success("درصد پیشرفت پروژه با موفقیت به‌روزرسانی شد.");
      queryClient.invalidateQueries({ queryKey: ["customer-wood-orders"] });
      setEditProgressModalOpen(false);
    },
    onError: (err: any) => {
      toast.error(err?.message || "خطا در به‌روزرسانی پیشرفت پروژه");
    },
  });

  const stageUpdateMutation = useMutation({
    mutationFn: (data: { orderId: string; body: any }) =>
      addStageUpdate(data.orderId, data.body),
    onSuccess: () => {
      toast.success("عکس‌ها و یادداشت مرحله با موفقیت ثبت شد.");
      queryClient.invalidateQueries({ queryKey: ["customer-wood-orders"] });
      setStagePhotoModalOpen(false);
      resetStageForm();
    },
    onError: (err: any) => {
      toast.error(err?.message || "خطا در ثبت یادداشت مرحله");
    },
  });

  const trackingTokenMutation = useMutation({
    mutationFn: (orderId: string) => generateTrackingToken(orderId),
    onSuccess: (data, orderId) => {
      const fullUrl = `${window.location.origin}${data.url}`;
      setActiveTrackingUrl(fullUrl);
      const ord = orders.find((o) => o.id === orderId) || null;
      setSelectedOrder(ord);
      setTrackingModalOpen(true);
      queryClient.invalidateQueries({ queryKey: ["customer-wood-orders"] });
    },
    onError: (err: any) => {
      toast.error(err?.message || "خطا در ایجاد لینک رهگیری");
    },
  });

  const handleCopyLink = () => {
    if (!activeTrackingUrl) return;
    navigator.clipboard.writeText(activeTrackingUrl);
    toast.success("لینک اختصاصی رهگیری مشتری کپی شد.");
  };

  const openProgressDialog = (order: WoodProductionOrderSummary) => {
    setEditProgressOrder(order);
    setNewProgress(order.progressPercent || 0);
    setNewEstimatedDate(
      order.estimatedCompletionDate
        ? new Date(order.estimatedCompletionDate).toISOString().slice(0, 10)
        : ""
    );
    setEditProgressModalOpen(true);
  };

  const openStagePhotoDialog = (order: WoodProductionOrderSummary) => {
    setTargetOrderForStage(order);
    setStageStationCode(order.currentStage || "CUTTING");
    const defaultLabel = STAGE_LABELS[order.currentStage]?.label || "گزارش پیشرفت مرحله";
    setStageTitle(`${defaultLabel} - ${order.code}`);
    setStageNotes("");
    setStagePhotos([]);
    setAdvanceStageCheck(false);
    setStagePhotoModalOpen(true);
  };

  const resetStageForm = () => {
    setStageTitle("");
    setStageNotes("");
    setStagePhotos([]);
    setAdvanceStageCheck(false);
    setTargetOrderForStage(null);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onload = (uploadEvent) => {
        const result = uploadEvent.target?.result as string;
        if (result) {
          setStagePhotos((prev) => [...prev, result]);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  if (isLoading) {
    return (
      <div className="flex h-48 items-center justify-center text-sm text-muted-foreground">
        در حال بارگذاری پروژه‌ها و سفارشات ساخت صنایع چوب...
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* کارت خلاصه */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border bg-card p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Scissors className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-base font-semibold">پروژه‌های چوب و ساخت MDF مشتری</h3>
            <p className="text-xs text-muted-foreground">
              سفارشات طراحی، قطعه‌بندی، ثبت عکس‌های پیشرفت کارگاهی و مانیتورینگ روند پروژه
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
            {toFa(orders.length)} سفارش ثبت‌شده
          </span>
        </div>
      </div>

      {orders.length === 0 ? (
        <Card className="flex flex-col items-center justify-center p-8 text-center text-muted-foreground">
          <Scissors className="mb-3 h-10 w-10 opacity-40" />
          <p className="text-sm font-medium">سفارش ساخت چوب یا پروژه‌ای برای این مشتری یافت نشد.</p>
          <p className="mt-1 text-xs">
            سفارشات تعریف‌شده در بخش «صنایع چوب و ابعاد برش» با نام این کارفرما در اینجا نمایش داده می‌شوند.
          </p>
        </Card>
      ) : (
        <div className="grid gap-4">
          {orders.map((order) => {
            const stageInfo = STAGE_LABELS[order.currentStage] || {
              label: order.currentStage,
              color: "bg-muted text-muted-foreground border-border",
            };
            const percent = Math.min(100, Math.max(0, order.progressPercent || 0));

            return (
              <Card key={order.id} className="overflow-hidden border p-5 shadow-sm transition hover:shadow-md">
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                  {/* عنوان سفارش و اطلاعات پایه */}
                  <div className="space-y-1.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-sm font-bold text-primary">{order.code}</span>
                      <span className="text-base font-bold text-foreground">
                        {order.projectTitle || "پروژه صنایع چوب"}
                      </span>
                      <span className={`rounded-md border px-2 py-0.5 text-xs font-medium ${stageInfo.color}`}>
                        {stageInfo.label}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
                      {order.product?.name && (
                        <span className="flex items-center gap-1">
                          <Layers className="h-3.5 w-3.5 text-primary" />
                          محصول: {order.product.name}
                        </span>
                      )}
                      {order.assignedInstaller && (
                        <span className="flex items-center gap-1">
                          <UserCheck className="h-3.5 w-3.5 text-emerald-600" />
                          نصاب: {order.assignedInstaller}
                          {order.installerPhone && ` (${order.installerPhone})`}
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3.5 w-3.5" />
                        ثبت: {faDate(order.createdAt)}
                      </span>
                      {order.estimatedCompletionDate && (
                        <span className="flex items-center gap-1 font-medium text-amber-700 dark:text-amber-400">
                          <Clock className="h-3.5 w-3.5" />
                          موعد تحویل: {faDate(order.estimatedCompletionDate)}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* دکمه‌های عملیاتی */}
                  <div className="flex flex-wrap items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setViewer3DOrder(order)}
                      className="gap-1.5 text-xs font-bold bg-primary/5 hover:bg-primary/10 text-primary border-primary/30 shadow-2xs"
                    >
                      <Box className="h-3.5 w-3.5" />
                      <span>دوقلوی سه‌بعدی</span>
                      <span className="font-mono text-[9px] bg-primary/20 px-1 py-0.2 rounded font-black">3D</span>
                    </Button>

                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => openStagePhotoDialog(order)}
                      className="gap-1.5 text-xs font-medium text-emerald-700 hover:text-emerald-800 dark:text-emerald-400"
                    >
                      <Camera className="h-3.5 w-3.5" />
                      عکس و نوت مرحله
                    </Button>

                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => openProgressDialog(order)}
                      className="gap-1.5 text-xs"
                    >
                      <Percent className="h-3.5 w-3.5" />
                      تنظیم پیشرفت
                    </Button>

                    <Button
                      size="sm"
                      onClick={() => trackingTokenMutation.mutate(order.id)}
                      disabled={trackingTokenMutation.isPending}
                      className="gap-1.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-xs font-medium text-white shadow hover:from-blue-700 hover:to-indigo-700"
                    >
                      <Share2 className="h-3.5 w-3.5" />
                      لینک رهگیری کارفرما
                    </Button>
                  </div>
                </div>

                {/* نوار پیشرفت فیزیکی */}
                <div className="mt-4 rounded-lg bg-muted/40 p-3">
                  <div className="mb-1.5 flex items-center justify-between text-xs">
                    <span className="font-medium text-foreground">پیشرفت ساخت و تحویل:</span>
                    <span className="font-bold text-primary">{toFa(percent)}٪</span>
                  </div>
                  <div className="h-3 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-blue-500 via-indigo-500 to-emerald-500 transition-all duration-500"
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                </div>

                {/* گالری عکس‌ها و یادداشت‌های ثبت‌شده برای این پروژه */}
                {order.stageUpdates && order.stageUpdates.length > 0 && (
                  <div className="mt-4 space-y-2.5 border-t pt-3">
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
                      <ImageIcon className="h-4 w-4 text-primary" />
                      عکس‌ها و گزارشات کارگاهی ثبت‌شده ({toFa(order.stageUpdates.length)} گزارش):
                    </div>

                    <div className="grid gap-2 sm:grid-cols-2">
                      {order.stageUpdates.map((update) => (
                        <div
                          key={update.id}
                          className="rounded-lg border bg-card/60 p-2.5 text-xs space-y-2"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-primary">{update.title}</span>
                            <span className="text-[11px] text-muted-foreground">{faDate(update.createdAt)}</span>
                          </div>

                          {update.notes && (
                            <p className="text-muted-foreground leading-relaxed text-[11px]">
                              {update.notes}
                            </p>
                          )}

                          {update.photos && update.photos.length > 0 && (
                            <div className="flex flex-wrap gap-1.5 pt-1">
                              {update.photos.map((ph, pIdx) => (
                                <button
                                  key={pIdx}
                                  type="button"
                                  onClick={() => setActivePreviewImage(ph)}
                                  className="group relative h-14 w-14 overflow-hidden rounded-md border bg-slate-100 hover:ring-2 hover:ring-primary dark:bg-slate-800"
                                >
                                  {/* eslint-disable-next-line @next/next/no-img-element */}
                                  <img
                                    src={ph}
                                    alt="عکس مرحله"
                                    className="h-full w-full object-cover transition-transform group-hover:scale-105"
                                  />
                                  <span className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Eye className="h-4 w-4 text-white" />
                                  </span>
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}

      {/* مودال ثبت عکس و نوت مرحله توسط اپراتور / سرپرست */}
      <Dialog open={stagePhotoModalOpen} onOpenChange={setStagePhotoModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base font-bold">
              <Camera className="h-5 w-5 text-emerald-600" />
              ثبت عکس و یادداشت مرحله کارگاهی
            </DialogTitle>
          </DialogHeader>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (!targetOrderForStage) return;
              if (!stageTitle.trim()) {
                toast.error("عنوان مرحله یا اقدام الزامی است.");
                return;
              }

              stageUpdateMutation.mutate({
                orderId: targetOrderForStage.id,
                body: {
                  stationCode: stageStationCode,
                  title: stageTitle,
                  notes: stageNotes || undefined,
                  photos: stagePhotos,
                  advanceStage: advanceStageCheck,
                },
              });
            }}
            className="space-y-3.5 pt-2 text-xs"
          >
            <div>
              <label className="text-xs font-medium text-muted-foreground">
                پروژه: <strong className="text-foreground">{targetOrderForStage?.projectTitle}</strong> (
                {targetOrderForStage?.code})
              </label>
            </div>

            <div>
              <label className="mb-1 block font-medium">ایستگاه و مرحله کارگاهی:</label>
              <select
                value={stageStationCode}
                onChange={(e) => setStageStationCode(e.target.value)}
                className="w-full rounded-md border bg-background p-2 text-xs"
              >
                {Object.entries(STAGE_LABELS).map(([code, meta]) => (
                  <option key={code} value={code}>
                    {meta.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block font-medium">عنوان اقدام / عنوان مرحله:</label>
              <Input
                value={stageTitle}
                onChange={(e) => setStageTitle(e.target.value)}
                placeholder="مثال: اتمام برش ورق‌ها و بازرسی ابعادی"
                className="text-xs"
              />
            </div>

            <div>
              <label className="mb-1 block font-medium">توضیحات و یادداشت فنی:</label>
              <textarea
                rows={3}
                value={stageNotes}
                onChange={(e) => setStageNotes(e.target.value)}
                placeholder="توضیحاتی در مورد کیفیت اجرای کار، نوارکاری، یراق‌آلات، کسری احتمالی و ..."
                className="w-full rounded-md border bg-background p-2 text-xs"
              />
            </div>

            {/* بخش آپلود و پیوست عکس */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="font-medium">تصاویر کارگاهی / عکس از محل پروژه:</label>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  className="h-7 gap-1 text-[11px]"
                >
                  <Plus className="h-3 w-3" />
                  انتخاب عکس از دستگاه
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleFileChange}
                  className="hidden"
                />
              </div>

              {stagePhotos.length === 0 ? (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="flex h-20 cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed text-muted-foreground hover:bg-muted/30 transition-colors"
                >
                  <Camera className="h-5 w-5 opacity-40 mb-1" />
                  <span className="text-[11px]">برای افزودن عکس کلیک کنید (چندگانه)</span>
                </div>
              ) : (
                <div className="flex flex-wrap gap-2 pt-1">
                  {stagePhotos.map((ph, idx) => (
                    <div key={idx} className="relative h-16 w-16 overflow-hidden rounded-md border">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={ph} alt="پیش‌نمایش" className="h-full w-full object-cover" />
                      <button
                        type="button"
                        onClick={() => setStagePhotos((prev) => prev.filter((_, i) => i !== idx))}
                        className="absolute right-0.5 top-0.5 rounded-full bg-rose-600 p-1 text-white shadow hover:bg-rose-700"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex items-center gap-2 pt-1">
              <input
                type="checkbox"
                id="advanceStage"
                checked={advanceStageCheck}
                onChange={(e) => setAdvanceStageCheck(e.target.checked)}
                className="h-4 w-4 rounded accent-primary cursor-pointer"
              />
              <label htmlFor="advanceStage" className="text-xs cursor-pointer select-none">
                وضعیت کلی سفارش هم به این مرحله ارتقا یابد
              </label>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  setStagePhotoModalOpen(false);
                  resetStageForm();
                }}
                className="text-xs"
              >
                انصراف
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={stageUpdateMutation.isPending}
                className="text-xs"
              >
                {stageUpdateMutation.isPending ? "در حال ثبت..." : "ثبت عکس و یادداشت"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* لایت‌باکس بزرگنمایی عکس */}
      <Dialog open={Boolean(activePreviewImage)} onOpenChange={() => setActivePreviewImage(null)}>
        <DialogContent className="max-w-2xl p-2 bg-black/95 border-none">
          {activePreviewImage && (
            <div className="flex items-center justify-center p-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={activePreviewImage}
                alt="تصویر بزرگنمایی کارگاهی"
                className="max-h-[80vh] w-auto rounded-lg object-contain"
              />
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* مودال لینک رهگیری کارفرما */}
      <Dialog open={trackingModalOpen} onOpenChange={setTrackingModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base font-bold">
              <Share2 className="h-5 w-5 text-primary" />
              لینک اختصاصی رهگیری زنده کارفرما
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 pt-2">
            <p className="text-xs leading-relaxed text-muted-foreground">
              با ارسال این لینک به مشتری، او می‌تواند در هر لحظه درصد پیشرفت، عکس‌های واقعی کارگاه و مراحل نصب را بدون نیاز به ورود به سیستم مشاهده کند:
            </p>

            <div className="flex items-center gap-2 rounded-lg border bg-muted/50 p-2.5">
              <Input
                readOnly
                value={activeTrackingUrl || ""}
                dir="ltr"
                className="font-mono text-xs select-all bg-background"
              />
              <Button size="sm" variant="default" onClick={handleCopyLink} className="gap-1 shrink-0 text-xs">
                <Copy className="h-3.5 w-3.5" />
                کپی لینک
              </Button>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  if (activeTrackingUrl) window.open(activeTrackingUrl, "_blank");
                }}
                className="gap-1.5 text-xs"
              >
                <ExternalLink className="h-3.5 w-3.5" />
                مشاهده صفحه رهگیری
              </Button>
              <Button size="sm" onClick={() => setTrackingModalOpen(false)} className="text-xs">
                بستن
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* مودال ویرایش پیشرفت پروژه توسط مدیر */}
      <Dialog open={editProgressModalOpen} onOpenChange={setEditProgressModalOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base font-bold">
              <Percent className="h-5 w-5 text-primary" />
              تنظیم درصد پیشرفت پروژه
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 pt-2">
            <div>
              <label className="text-xs font-medium text-muted-foreground">
                کد پروژه: <span className="font-mono font-bold text-foreground">{editProgressOrder?.code}</span>
              </label>
              <p className="text-xs font-semibold text-foreground">{editProgressOrder?.projectTitle}</p>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-xs font-medium">
                <span>میزان پیشرفت فیزیکی:</span>
                <span className="font-bold text-primary">{toFa(newProgress)}٪</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                step="5"
                value={newProgress}
                onChange={(e) => setNewProgress(Number(e.target.value))}
                className="w-full cursor-pointer accent-primary"
              />
              <div className="flex gap-2">
                {[25, 50, 75, 100].map((step) => (
                  <Button
                    key={step}
                    type="button"
                    variant={newProgress === step ? "default" : "outline"}
                    size="sm"
                    className="flex-1 text-xs"
                    onClick={() => setNewProgress(step)}
                  >
                    {toFa(step)}٪
                  </Button>
                ))}
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium">تاریخ تخمینی تکمیل و تحویل:</label>
              <Input
                type="date"
                value={newEstimatedDate}
                onChange={(e) => setNewEstimatedDate(e.target.value)}
                className="text-xs"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setEditProgressModalOpen(false)}
                className="text-xs"
              >
                انصراف
              </Button>
              <Button
                size="sm"
                disabled={progressMutation.isPending}
                onClick={() => {
                  if (!editProgressOrder) return;
                  progressMutation.mutate({
                    orderId: editProgressOrder.id,
                    progressPercent: newProgress,
                    estimatedCompletionDate: newEstimatedDate || undefined,
                  });
                }}
                className="text-xs"
              >
                {progressMutation.isPending ? "در حال ثبت..." : "ذخیره تغییرات"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* دیالوگ نمایش دوقلوی سه‌بعدی و نمای انفجاری ۳D */}
      <Dialog open={Boolean(viewer3DOrder)} onOpenChange={(open) => !open && setViewer3DOrder(null)}>
        <DialogContent className="max-w-4xl p-0 overflow-hidden font-sans border-0 shadow-2xl bg-transparent">
          {viewer3DOrder && (
            <Cabinet3DExplodedViewer
              projectTitle={viewer3DOrder.projectTitle || "پروژه صنایع چوب"}
              orderCode={viewer3DOrder.code}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
