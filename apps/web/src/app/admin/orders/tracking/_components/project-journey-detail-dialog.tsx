"use client";

import * as React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Route,
  Search,
  PackageCheck,
  Scissors,
  Layers,
  Wrench,
  Sparkles,
  Truck,
  CheckCircle2,
  Clock,
  ArrowRight,
  ExternalLink,
  Share2,
  Calendar,
  UserCheck,
  Percent,
  TrendingUp,
  AlertCircle,
  Eye,
  Camera,
  MessageSquare,
  User,
  Phone,
  Coins,
  Receipt,
  PlusCircle,
  Loader2,
  Check,
  ChevronLeft,
  Sliders,
  ShieldCheck,
  FileText,
  Boxes,
} from "lucide-react";

import { getWoodOrder, addStageUpdate, updateOrderProgress, advanceOrderStage } from "@/lib/api";
import { amount, faDate, faDateTime, money, toFa } from "@/lib/format";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
import { useToast } from "@/hooks/use-toast";
import { Cabinet3DExplodedViewer } from "@/components/wood/cabinet-3d-exploded-viewer";

const STAGE_CONFIG: Record<string, { label: string; color: string; icon: any }> = {
  CUTTING: { label: "ایستگاه برش", color: "bg-blue-100 text-blue-800 border-blue-200", icon: Scissors },
  EDGE_BANDING: { label: "لبه‌چسبان PVC", color: "bg-amber-100 text-amber-800 border-amber-200", icon: Layers },
  CNC: { label: "ماشین‌کاری CNC", color: "bg-purple-100 text-purple-800 border-purple-200", icon: Wrench },
  ASSEMBLY: { label: "مونتاژ و یراق", color: "bg-indigo-100 text-indigo-800 border-indigo-200", icon: Layers },
  FINISHING: { label: "رنگ و پرداخت", color: "bg-pink-100 text-pink-800 border-pink-200", icon: Sparkles },
  QC_PACKING: { label: "کنترل کیفی و بسته‌بندی", color: "bg-teal-100 text-teal-800 border-teal-200", icon: PackageCheck },
  READY_TO_INSTALL: { label: "آماده اعزام و حمل", color: "bg-cyan-100 text-cyan-800 border-cyan-200", icon: Truck },
  INSTALLED: { label: "تحویل و نصب نهایی", color: "bg-emerald-100 text-emerald-800 border-emerald-200", icon: CheckCircle2 },
};

interface ProjectJourneyDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orderId: string | null;
  onOpenSendToCustomer: (order: any) => void;
}

export function ProjectJourneyDetailDialog({
  open,
  onOpenChange,
  orderId,
  onOpenSendToCustomer,
}: ProjectJourneyDetailDialogProps) {
  const { toast } = useToast();
  const qc = useQueryClient();

  const [activeTab, setActiveTab] = React.useState("timeline");
  const [activePreviewImage, setActivePreviewImage] = React.useState<string | null>(null);

  // فرم ثبت نوت/دستور جدید توسط مدیر
  const [managerStation, setManagerStation] = React.useState("QC_PACKING");
  const [managerTitle, setManagerTitle] = React.useState("");
  const [managerNote, setManagerNote] = React.useState("");
  const [managerPhotos, setManagerPhotos] = React.useState<string[]>([]);
  const [isAddingNote, setIsAddingNote] = React.useState(false);

  // فرم تغییر درصد پیشرفت و مرحله
  const [editProgress, setEditProgress] = React.useState<number>(0);
  const [editEstimatedDate, setEditEstimatedDate] = React.useState("");

  const {
    data: order,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ["wood-order-detail", orderId],
    queryFn: () => getWoodOrder(orderId!),
    enabled: Boolean(orderId) && open,
  });

  React.useEffect(() => {
    if (order) {
      setEditProgress(order.progressPercent || 0);
      setEditEstimatedDate(
        order.estimatedCompletionDate ? new Date(order.estimatedCompletionDate).toISOString().slice(0, 10) : "",
      );
    }
  }, [order]);

  const updateProgressMut = useMutation({
    mutationFn: () =>
      updateOrderProgress(orderId!, {
        progressPercent: Number(editProgress),
        estimatedCompletionDate: editEstimatedDate ? new Date(editEstimatedDate).toISOString() : undefined,
      }),
    onSuccess: () => {
      toast({
        title: "پیشرفت پروژه به‌روز شد",
        description: `درصد پیشرفت به ${toFa(editProgress)}٪ تغییر یافت.`,
      });
      qc.invalidateQueries({ queryKey: ["wood-order-detail", orderId] });
      qc.invalidateQueries({ queryKey: ["all-wood-orders"] });
    },
    onError: (err: any) => {
      toast({ variant: "destructive", title: "خطا در به‌روزرسانی پیشرفت", description: err.message });
    },
  });

  const advanceStageMut = useMutation({
    mutationFn: (stage: string) =>
      advanceOrderStage(orderId!, { stage, operatorName: "مدیر کارخانه" }),
    onSuccess: (_, stage) => {
      toast({
        title: "مرحله پروژه تغییر کرد",
        description: `مرحله جاری به ${STAGE_CONFIG[stage]?.label || stage} ارتقا یافت.`,
      });
      qc.invalidateQueries({ queryKey: ["wood-order-detail", orderId] });
      qc.invalidateQueries({ queryKey: ["all-wood-orders"] });
    },
    onError: (err: any) => {
      toast({ variant: "destructive", title: "خطا در تغییر مرحله", description: err.message });
    },
  });

  const addNoteMut = useMutation({
    mutationFn: () =>
      addStageUpdate(orderId!, {
        stationCode: managerStation,
        title: managerTitle || "دستور و نظارت مدیریت",
        notes: managerNote,
        photos: managerPhotos,
        operatorName: "مدیریت کارگاه",
      }),
    onSuccess: () => {
      toast({
        title: "یادداشت مدیر ثبت شد",
        description: "یادداشت و دستور با موفقیت در خط زمانی پروژه درج گردید.",
      });
      setIsAddingNote(false);
      setManagerTitle("");
      setManagerNote("");
      setManagerPhotos([]);
      qc.invalidateQueries({ queryKey: ["wood-order-detail", orderId] });
      qc.invalidateQueries({ queryKey: ["all-wood-orders"] });
    },
    onError: (err: any) => {
      toast({ variant: "destructive", title: "خطا در ثبت یادداشت", description: err.message });
    },
  });

  function handlePhotoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast({ variant: "destructive", title: "حجم فایل بیش از ۵ مگابایت است" });
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setManagerPhotos((prev) => [...prev, reader.result as string]);
    };
    reader.readAsDataURL(file);
  }

  if (!order && isLoading) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl p-12 text-center" dir="rtl">
          <Loader2 className="size-8 animate-spin mx-auto text-primary mb-2" />
          <p className="text-xs text-muted-foreground">در حال بارگذاری پرونده و تصاویر پروژه...</p>
        </DialogContent>
      </Dialog>
    );
  }

  if (!order) return null;

  const stageMeta = STAGE_CONFIG[order.currentStage] || {
    label: order.currentStage,
    color: "bg-gray-100 text-gray-800",
    icon: Route,
  };
  const StageIcon = stageMeta.icon;

  const stageUpdates = order.stageUpdates || [];
  const contract = order.contract;

  // جمع‌آوری تمام عکس‌های ثبت‌شده در تمامی مراحل توسط کارگران
  const allPhotos: { url: string; title: string; operator: string; date: string; station: string }[] = [];
  stageUpdates.forEach((u: any) => {
    if (u.photos && Array.isArray(u.photos)) {
      u.photos.forEach((ph: string) => {
        allPhotos.push({
          url: ph,
          title: u.title,
          operator: u.operatorName || "اپراتور کارگاه",
          date: u.createdAt,
          station: u.stationCode,
        });
      });
    }
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl w-full rounded-3xl p-0 overflow-hidden select-none max-h-[92vh] flex flex-col" dir="rtl">
        {/* ───────────────────────── هدر مشخصات پروژه ───────────────────────── */}
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-5 shrink-0 border-b border-white/10">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="size-11 rounded-2xl bg-primary/20 border border-primary/40 flex items-center justify-center text-primary-foreground font-black text-sm">
                <StageIcon className="size-6 text-primary" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-mono text-xs font-bold bg-white/10 px-2 py-0.5 rounded-md">
                    {order.code}
                  </span>
                  <h2 className="text-base sm:text-lg font-black text-white">
                    {order.projectTitle || "پروژه صنایع چوب و دکوراسیون"}
                  </h2>
                  <Badge variant="outline" className={cn("text-[10px] font-bold border", stageMeta.color)}>
                    {stageMeta.label}
                  </Badge>
                </div>
                <div className="flex items-center gap-3 text-xs text-white/70 mt-1 flex-wrap">
                  <span>کارفرما: <strong className="text-white font-bold">{order.customerName || "—"}</strong></span>
                  {order.customerPhone && (
                    <span className="font-mono text-white/80">({order.customerPhone})</span>
                  )}
                  <span>•</span>
                  <span>تاریخ ثبت: {faDate(order.createdAt)}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => onOpenSendToCustomer(order)}
                className="h-8 rounded-xl text-xs font-bold gap-1.5 bg-white/10 hover:bg-white/20 text-white border-white/20"
              >
                <Share2 className="size-3.5 text-primary" />
                ارسال به مشتری
              </Button>
              {order.trackingToken && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => window.open(`/track/${order.trackingToken}`, "_blank")}
                  className="h-8 rounded-xl text-xs font-bold gap-1.5 bg-white/10 hover:bg-white/20 text-white border-white/20"
                >
                  <ExternalLink className="size-3.5" />
                  لینک عمومی
                </Button>
              )}
            </div>
          </div>

          {/* نوار متریال و پیشرفت سریع در هدر */}
          <div className="mt-4 pt-3 border-t border-white/10 flex flex-wrap items-center justify-between gap-4 text-xs">
            <div className="flex items-center gap-2 flex-1 min-w-[200px]">
              <span className="text-white/70">پیشرفت کل:</span>
              <div className="flex-1 h-2 rounded-full bg-white/10 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-blue-400 via-indigo-400 to-emerald-400"
                  style={{ width: `${order.progressPercent || 0}%` }}
                />
              </div>
              <span className="font-mono font-black text-emerald-400">{toFa(order.progressPercent || 0)}٪</span>
            </div>

            <div className="flex items-center gap-4 text-white/80 text-[11px]">
              <span className="flex items-center gap-1">
                <Camera className="size-3.5 text-primary" />
                {toFa(allPhotos.length)} تصویر کارگاهی
              </span>
              <span className="flex items-center gap-1">
                <MessageSquare className="size-3.5 text-amber-400" />
                {toFa(stageUpdates.length)} گزارش مرحله
              </span>
            </div>
          </div>
        </div>

        {/* ───────────────────────── تب‌های ناوبری داخلی پروژه ───────────────────────── */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid grid-cols-2 sm:grid-cols-5 h-auto p-1 bg-muted/60 rounded-xl gap-1">
              <TabsTrigger value="timeline" className="gap-1.5 py-2 text-xs font-bold">
                <MessageSquare className="size-3.5 text-blue-600" />
                یادداشت‌ها و خط زمانی ({toFa(stageUpdates.length)})
              </TabsTrigger>

              <TabsTrigger value="photos" className="gap-1.5 py-2 text-xs font-bold">
                <Camera className="size-3.5 text-emerald-600" />
                آلبوم تصاویر ({toFa(allPhotos.length)})
              </TabsTrigger>

              <TabsTrigger value="control" className="gap-1.5 py-2 text-xs font-bold">
                <Sliders className="size-3.5 text-purple-600" />
                کنترل مراحل و پیشرفت
              </TabsTrigger>

              <TabsTrigger value="finance" className="gap-1.5 py-2 text-xs font-bold">
                <Coins className="size-3.5 text-amber-600" />
                قرارداد و وضعیت مالی
              </TabsTrigger>

              <TabsTrigger value="twin" className="gap-1.5 py-2 text-xs font-bold">
                <Boxes className="size-3.5 text-indigo-600" />
                دوقلوی سه‌بعدی ۳D
              </TabsTrigger>
            </TabsList>

            {/* ───────────────── تب ۱: خط زمانی یادداشت‌ها و عکس‌های کارگران ───────────────── */}
            <TabsContent value="timeline" className="mt-4 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-muted-foreground flex items-center gap-1.5">
                  <Clock className="size-4" />
                  گزارشات و یادداشت‌های ثبت‌شده توسط پرسنل و کارگران خط:
                </h3>

                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setIsAddingNote(!isAddingNote)}
                  className="h-8 text-xs font-bold rounded-xl gap-1.5 border-primary/30 text-primary hover:bg-primary/10"
                >
                  <PlusCircle className="size-3.5" />
                  {isAddingNote ? "بستن فرم نوت" : "ثبت دستور / نوت جدید"}
                </Button>
              </div>

              {/* فرم افزودن نوت توسط مدیر */}
              {isAddingNote && (
                <Card className="border-2 border-primary/30 bg-primary/[0.02] p-4 rounded-2xl space-y-3">
                  <div className="flex items-center justify-between border-b pb-2">
                    <span className="text-xs font-bold text-foreground">ثبت یادداشت یا دستور مدیریتی به پروژه:</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label className="text-xs font-bold">مربوط به ایستگاه:</Label>
                      <Select value={managerStation} onValueChange={setManagerStation}>
                        <SelectTrigger className="h-9 text-xs rounded-xl">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl">
                          {Object.entries(STAGE_CONFIG).map(([k, v]) => (
                            <SelectItem key={k} value={k} className="text-xs">
                              {v.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-1">
                      <Label className="text-xs font-bold">عنوان یادداشت:</Label>
                      <Input
                        placeholder="مثال: کنترل کیفی لبه‌های PVC و بسته‌بندی"
                        value={managerTitle}
                        onChange={(e) => setManagerTitle(e.target.value)}
                        className="h-9 text-xs rounded-xl"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <Label className="text-xs font-bold">متن توضیحات / دستور به کارگران:</Label>
                    <Textarea
                      placeholder="متن یادداشت، تذکر کیفی یا دستور کار..."
                      rows={2}
                      value={managerNote}
                      onChange={(e) => setManagerNote(e.target.value)}
                      className="rounded-xl text-xs resize-none"
                    />
                  </div>

                  {/* آپلود عکس توسط مدیر */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-muted-foreground">الصاق تصاویر (اختیاری):</span>
                      <label className="cursor-pointer inline-flex items-center gap-1 text-xs font-bold text-primary hover:underline">
                        <Camera className="size-3.5" />
                        افزودن تصویر
                        <input type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" />
                      </label>
                    </div>
                    {managerPhotos.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {managerPhotos.map((ph, idx) => (
                          <div key={idx} className="relative size-14 rounded-xl overflow-hidden border">
                            <img src={ph} alt="پیوست" className="size-full object-cover" />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="flex justify-end gap-2 pt-2 border-t">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setIsAddingNote(false)}
                      className="rounded-xl text-xs h-8"
                    >
                      انصراف
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => addNoteMut.mutate()}
                      disabled={addNoteMut.isPending}
                      className="rounded-xl text-xs font-bold h-8 gap-1.5 shadow-sm"
                    >
                      {addNoteMut.isPending && <Loader2 className="size-3 animate-spin" />}
                      ثبت نوت در پروژه
                    </Button>
                  </div>
                </Card>
              )}

              {/* لیست کارت‌های گزارش کارگران */}
              {stageUpdates.length === 0 ? (
                <Card className="p-8 text-center border-dashed rounded-2xl bg-card">
                  <MessageSquare className="size-10 text-muted-foreground/30 mx-auto mb-2" />
                  <p className="text-xs font-bold text-foreground">هنوز هیچ یادداشتی برای این پروژه ثبت نشده است</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    کارگران هنگام تایید هر مرحله در موبایل یا مدیر از طریق دکمه فوق می‌توانند نوت و عکس ثبت نمایند.
                  </p>
                </Card>
              ) : (
                <div className="space-y-3">
                  {stageUpdates.map((u: any) => {
                    const stMeta = STAGE_CONFIG[u.stationCode] || { label: u.stationCode, color: "bg-muted" };

                    return (
                      <div
                        key={u.id}
                        className="p-4 rounded-2xl border border-border/80 bg-card shadow-2xs space-y-2.5 transition-all hover:border-primary/40"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2.5">
                            <div className="size-9 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-black text-xs">
                              <User className="size-4" />
                            </div>
                            <div>
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-bold text-xs text-foreground">
                                  {u.operatorName || "اپراتور کارگاه"}
                                </span>
                                <Badge variant="outline" className={cn("text-[10px] font-bold px-2 py-0.5", stMeta.color)}>
                                  {stMeta.label}
                                </Badge>
                              </div>
                              <span className="text-[10px] text-muted-foreground font-mono">
                                {faDateTime(u.createdAt)}
                              </span>
                            </div>
                          </div>

                          <span className="text-xs font-bold text-foreground">{u.title}</span>
                        </div>

                        {u.notes && (
                          <p className="text-xs text-foreground/90 leading-relaxed bg-muted/30 p-2.5 rounded-xl border border-border/40 select-text">
                            {u.notes}
                          </p>
                        )}

                        {/* عکس‌های گرفته شده توسط کارگر */}
                        {u.photos && u.photos.length > 0 && (
                          <div className="space-y-1">
                            <span className="text-[10px] font-bold text-muted-foreground">عکس‌های گرفته‌شده با دوربین موبایل:</span>
                            <div className="flex flex-wrap gap-2 pt-1">
                              {u.photos.map((ph: string, pIdx: number) => (
                                <button
                                  key={pIdx}
                                  type="button"
                                  onClick={() => setActivePreviewImage(ph)}
                                  className="group relative size-16 rounded-xl overflow-hidden border border-border/80 hover:ring-2 hover:ring-primary transition-all bg-black/5"
                                >
                                  <img src={ph} alt="عکس کارگاه" className="size-full object-cover group-hover:scale-105 transition-transform" />
                                  <span className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                    <Eye className="size-4 text-white" />
                                  </span>
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </TabsContent>

            {/* ───────────────── تب ۲: آلبوم و گالری کلیه تصاویر پروژه ───────────────── */}
            <TabsContent value="photos" className="mt-4 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-bold text-foreground flex items-center gap-1.5">
                    <Camera className="size-4 text-primary" />
                    گالری جامع تصاویر پروژه ({toFa(allPhotos.length)} تصویر)
                  </h3>
                  <p className="text-[11px] text-muted-foreground">
                    تمامی تصاویری که کارگران، مونتاژکاران و نصاب‌ها در خط تولید یا محل پروژه عکاسی کرده‌اند
                  </p>
                </div>
              </div>

              {allPhotos.length === 0 ? (
                <Card className="p-12 text-center border-dashed rounded-2xl bg-card">
                  <Camera className="size-12 text-muted-foreground/30 mx-auto mb-2" />
                  <p className="text-xs font-bold text-foreground">هنوز عکسی برای این پروژه بارگذاری نشده است</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    کارگران می‌توانند در پنل موبایل از هر مرحله عکس گرفته و پیوست نمایند.
                  </p>
                </Card>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {allPhotos.map((item, idx) => {
                    const stMeta = STAGE_CONFIG[item.station] || { label: item.station };

                    return (
                      <div
                        key={idx}
                        className="group relative rounded-2xl overflow-hidden border border-border/80 bg-card shadow-2xs hover:shadow-md transition-all"
                      >
                        <div
                          className="aspect-square relative cursor-pointer overflow-hidden bg-black/10"
                          onClick={() => setActivePreviewImage(item.url)}
                        >
                          <img
                            src={item.url}
                            alt={item.title}
                            className="size-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <Eye className="size-6 text-white" />
                          </div>
                        </div>

                        <div className="p-2.5 space-y-1">
                          <div className="flex items-center justify-between text-[11px]">
                            <Badge variant="outline" className="text-[9px] font-bold h-4.5 px-1.5">
                              {stMeta.label}
                            </Badge>
                            <span className="text-[10px] text-muted-foreground font-mono">{faDate(item.date)}</span>
                          </div>
                          <p className="text-xs font-bold text-foreground truncate">{item.title}</p>
                          <p className="text-[10px] text-muted-foreground truncate">ثبت: {item.operator}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </TabsContent>

            {/* ───────────────── تب ۳: کنترل مراحل و پیشرفت فیزیکی ───────────────── */}
            <TabsContent value="control" className="mt-4 space-y-4">
              <Card className="rounded-2xl border-border/80 p-5 space-y-4">
                <div>
                  <h3 className="text-sm font-black text-foreground flex items-center gap-2">
                    <Sliders className="size-4 text-primary" />
                    تنظیمات پیشرفت فیزیکی و زمان‌بندی
                  </h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    تغییر دستی درصد تکمیل کار، تاریخ تحویل و تغییر مرحله توسط سرپرست کارگاه
                  </p>
                </div>

                <div className="space-y-3 p-4 rounded-2xl bg-muted/30 border border-border/60">
                  <div className="flex items-center justify-between text-xs">
                    <Label className="font-bold">درصد پیشرفت فیزیکی پروژه:</Label>
                    <span className="font-mono text-base font-black text-primary">{toFa(editProgress)}٪</span>
                  </div>

                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={editProgress}
                    onChange={(e) => setEditProgress(Number(e.target.value))}
                    className="w-full accent-primary h-2 bg-slate-200 dark:bg-slate-700 rounded-lg cursor-pointer"
                  />

                  <div className="grid grid-cols-2 gap-3 pt-2">
                    <div className="space-y-1">
                      <Label className="text-xs font-bold">تاریخ تخمینی اتمام و نصب:</Label>
                      <Input
                        type="date"
                        value={editEstimatedDate}
                        onChange={(e) => setEditEstimatedDate(e.target.value)}
                        className="h-9 rounded-xl text-xs font-mono"
                      />
                    </div>

                    <div className="flex items-end">
                      <Button
                        onClick={() => updateProgressMut.mutate()}
                        disabled={updateProgressMut.isPending}
                        className="h-9 rounded-xl text-xs font-bold gap-1.5 w-full shadow-sm"
                      >
                        {updateProgressMut.isPending && <Loader2 className="size-3.5 animate-spin" />}
                        ذخیره درصد پیشرفت
                      </Button>
                    </div>
                  </div>
                </div>

                {/* دکمه‌های سریع تغییر مرحله جاری */}
                <div className="space-y-2">
                  <Label className="text-xs font-bold block">انتقال سریع به مرحله بعد:</Label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {Object.entries(STAGE_CONFIG).map(([k, v]) => {
                      const isCurrent = order.currentStage === k;
                      return (
                        <Button
                          key={k}
                          variant={isCurrent ? "default" : "outline"}
                          size="sm"
                          onClick={() => advanceStageMut.mutate(k)}
                          disabled={advanceStageMut.isPending}
                          className={cn("h-9 rounded-xl text-xs font-bold justify-start gap-1.5", isCurrent && "shadow-xs")}
                        >
                          <v.icon className="size-3.5" />
                          {v.label}
                        </Button>
                      );
                    })}
                  </div>
                </div>
              </Card>
            </TabsContent>

            {/* ───────────────── تب ۴: وضعیت مالی و قرارداد ───────────────── */}
            <TabsContent value="finance" className="mt-4 space-y-4">
              {contract ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-center">
                    <div className="p-3.5 rounded-2xl bg-card border border-border/80 shadow-2xs">
                      <p className="text-[11px] text-muted-foreground font-medium">مبلغ کل قرارداد</p>
                      <p className="text-base font-black text-foreground mt-1 font-mono">
                        {money(contract.totalAmount)} <span className="text-[10px]">ریال</span>
                      </p>
                      <p className="text-[10px] text-muted-foreground font-bold">
                        ({money(Math.round(contract.totalAmount / 10))} تومان)
                      </p>
                    </div>

                    <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-800 shadow-2xs">
                      <p className="text-[11px] font-medium">مجموع پرداخت‌شده (پیش‌پرداخت)</p>
                      <p className="text-base font-black mt-1 font-mono">
                        {money(contract.downPayment)} <span className="text-[10px]">ریال</span>
                      </p>
                    </div>

                    <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-800 shadow-2xs">
                      <p className="text-[11px] font-medium">مانده تا تسویه نهایی</p>
                      <p className="text-base font-black mt-1 font-mono">
                        {money(contract.balanceDue)} <span className="text-[10px]">ریال</span>
                      </p>
                    </div>
                  </div>

                  {/* مراحل پرداخت و اقساط */}
                  {contract.milestones && contract.milestones.length > 0 && (
                    <Card className="rounded-2xl border-border/80 overflow-hidden">
                      <CardHeader className="p-4 border-b border-border/80">
                        <CardTitle className="text-xs font-bold flex items-center gap-2">
                          <Receipt className="size-4 text-primary" />
                          مراحل و اقساط پرداخت قرارداد
                        </CardTitle>
                      </CardHeader>
                      <div className="divide-y divide-border/60 text-xs">
                        {contract.milestones.map((ms: any) => (
                          <div key={ms.id} className="p-3 flex items-center justify-between">
                            <div className="space-y-0.5">
                              <span className="font-bold text-foreground">{ms.title}</span>
                              <span className="text-[10px] text-muted-foreground block font-mono">
                                سررسید در مرحله: {STAGE_CONFIG[ms.dueStage]?.label || ms.dueStage || "—"}
                              </span>
                            </div>
                            <div className="flex items-center gap-3">
                              <span className="font-mono font-bold text-foreground">
                                {money(ms.amount)} ریال
                              </span>
                              <Badge
                                variant="outline"
                                className={cn(
                                  "text-[10px] font-bold",
                                  ms.status === "PAID"
                                    ? "bg-emerald-100 text-emerald-800 border-emerald-300"
                                    : "bg-amber-100 text-amber-800 border-amber-300",
                                )}
                              >
                                {ms.status === "PAID" ? "تسویه شده" : "در انتظار پرداخت"}
                              </Badge>
                            </div>
                          </div>
                        ))}
                      </div>
                    </Card>
                  )}
                </div>
              ) : (
                <Card className="p-12 text-center border-dashed rounded-2xl bg-card">
                  <Coins className="size-10 text-muted-foreground/30 mx-auto mb-2" />
                  <p className="text-xs font-bold text-foreground">قرارداد مالی مجزا برای این سفارش ثبت نشده است</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    تسویه‌حساب این پروژه از طریق فاکتورهای رسمی در پرونده کارفرما انجام شده است.
                  </p>
                </Card>
              )}
            </TabsContent>

            {/* ───────────────── تب ۵: دوقلوی سه‌بعدی ۳D ───────────────── */}
            <TabsContent value="twin" className="mt-4">
              <Cabinet3DExplodedViewer
                projectTitle={order.projectTitle || "پروژه ساخت کابینت و دکوراسیون چوبی"}
                orderCode={order.code}
              />
            </TabsContent>
          </Tabs>
        </div>

        {/* ───────────────────────── فوتر دیالوگ با دکمه‌های عملیاتی ───────────────────────── */}
        <div className="p-4 bg-muted/40 border-t border-border/80 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2">
            <Button
              onClick={() => onOpenSendToCustomer(order)}
              className="rounded-xl text-xs font-bold gap-1.5 h-9 bg-primary text-primary-foreground shadow-sm"
            >
              <Share2 className="size-3.5" />
              ارسال پیامک و لینک به مشتری
            </Button>
            {order.trackingToken && (
              <Button
                variant="outline"
                onClick={() => window.open(`/track/${order.trackingToken}`, "_blank")}
                className="rounded-xl text-xs font-bold gap-1.5 h-9"
              >
                <ExternalLink className="size-3.5" />
                مشاهده صفحه رهگیری زنده
              </Button>
            )}
          </div>

          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="rounded-xl text-xs font-bold h-9 px-5"
          >
            بستن
          </Button>
        </div>
      </DialogContent>

      {/* لایت‌باکس بزرگنمایی عکس تمام صفحه */}
      <Dialog open={Boolean(activePreviewImage)} onOpenChange={() => setActivePreviewImage(null)}>
        <DialogContent className="max-w-3xl p-2 bg-black/95 border-none" dir="rtl">
          {activePreviewImage && (
            <div className="flex items-center justify-center p-2">
              <img
                src={activePreviewImage}
                alt="تصویر کارگاهی"
                className="max-h-[85vh] w-auto rounded-xl object-contain shadow-2xl"
              />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </Dialog>
  );
}
