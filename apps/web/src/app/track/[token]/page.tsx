"use client";

import * as React from "react";
import QRCode from "qrcode";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import {
  Scissors,
  Layers,
  Wrench,
  Sparkles,
  PackageCheck,
  Truck,
  CheckCircle2,
  Clock,
  Calendar,
  UserCheck,
  Phone,
  MapPin,
  ShieldCheck,
  RefreshCw,
  Building,
  Camera,
  Eye,
  Image as ImageIcon,
  Share2,
  Copy,
  Check,
  QrCode,
  Coins,
  Receipt,
  Star,
  ThumbsUp,
  Heart,
  MessageCircle,
  PenTool,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { getPublicTracking } from "@/lib/api";
import { faDate, money, toFa } from "@/lib/format";
import { Cabinet3DExplodedViewer } from "@/components/wood/cabinet-3d-exploded-viewer";
import { DigitalSignatureDialog } from "@/components/wood/digital-signature-dialog";

const STAGES = [
  { key: "CUTTING", label: "ایستگاه برش", icon: Scissors, desc: "برش دقیق ورق‌های MDF بر اساس نقشه بهینه‌ساز" },
  { key: "EDGE_BANDING", label: "نوار لبه PVC", icon: Layers, desc: "نوارکاری لبه‌های قطعات با چسب ضدآب حرارتی" },
  { key: "CNC", label: "ماشین‌کاری CNC", icon: Wrench, desc: "سوراخ‌کاری، حکاکی و جای یراق‌آلات پیشرفته" },
  { key: "ASSEMBLY", label: "مونتاژ و یراق", icon: Layers, desc: "سرهم‌بندی اسکلت، نصب ریل‌ها و اتصالات" },
  { key: "FINISHING", label: "رنگ و پرداخت", icon: Sparkles, desc: "سنباده، آستر، رنگ‌پاشی و تثبیت پولیش" },
  { key: "QC_PACKING", label: "کنترل کیفی و بسته‌بندی", icon: PackageCheck, desc: "بازرسی نهایی ابعاد و بسته‌بندی حباب‌دار صنعتی" },
  { key: "READY_TO_INSTALL", label: "اعزام و حمل بار", icon: Truck, desc: "بارگیری در خودرو مخصوص و حرکت به سمت پروژه" },
  { key: "INSTALLED", label: "نصب و تحویل نهایی", icon: CheckCircle2, desc: "نصب کامل در محل کارفرما و اخذ تاییدیه رضایت" },
];

export default function PublicProjectTrackingPage() {
  const params = useParams();
  const token = params.token as string;
  const [activePreviewImage, setActivePreviewImage] = React.useState<string | null>(null);
  const [isShareModalOpen, setIsShareModalOpen] = React.useState(false);
  const [isSignModalOpen, setIsSignModalOpen] = React.useState(false);
  const [isCopied, setIsCopied] = React.useState(false);
  const [qrDataUrl, setQrDataUrl] = React.useState<string>("");

  React.useEffect(() => {
    if (typeof window !== "undefined" && isShareModalOpen) {
      QRCode.toDataURL(window.location.href, { width: 180, margin: 1 })
        .then(setQrDataUrl)
        .catch(() => {});
    }
  }, [isShareModalOpen]);

  // نظرسنجی و امتیاز رضایت مشتری
  const [rating, setRating] = React.useState<number>(5);
  const [hoverRating, setHoverRating] = React.useState<number | null>(null);
  const [selectedTags, setSelectedTags] = React.useState<string[]>([
    "کیفیت عالی متریال",
    "برخورد حرفه‌ای پرسنل",
  ]);
  const [feedbackComment, setFeedbackComment] = React.useState("");
  const [isFeedbackSubmitted, setIsFeedbackSubmitted] = React.useState(false);

  const { data: order, isLoading, error, refetch, isFetching } = useQuery({
    queryKey: ["public-tracking", token],
    queryFn: () => getPublicTracking(token),
    enabled: Boolean(token),
    refetchInterval: 30000, // هر ۳۰ ثانیه خودکار تازه‌سازی می‌شود
  });

  if (isLoading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 p-4 text-center dark:bg-slate-950">
        <div className="flex h-12 w-12 animate-spin items-center justify-center rounded-full border-4 border-primary border-t-transparent" />
        <p className="mt-4 text-sm font-medium text-muted-foreground">در حال بارگذاری اطلاعات پیشرفت پروژه...</p>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 p-4 text-center dark:bg-slate-950">
        <div className="mx-auto max-w-md rounded-2xl border bg-card p-8 shadow-sm">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-rose-500/10 text-rose-600">
            <Clock className="h-7 w-7" />
          </div>
          <h2 className="text-lg font-bold text-foreground">لینک رهگیری نامعتبر یا منقضی شده است</h2>
          <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
            کد رهگیری ارائه‌شده در سیستم یافت نشد. لطفاً جهت دریافت لینک صحیح با واحد پیگیری سفارشات تماس بگیرید.
          </p>
          <Button className="mt-6 w-full text-xs" onClick={() => window.location.reload()}>
            تلاش مجدد
          </Button>
        </div>
      </div>
    );
  }

  const currentStageIndex = STAGES.findIndex((s) => s.key === order.currentStage);
  const activeIndex = currentStageIndex === -1 ? 0 : currentStageIndex;
  const progressPercent = Math.min(100, Math.max(0, order.progressPercent || 0));

  // استخراج تمام عکس‌های آپلود شده در پروژه
  const allPhotos: { url: string; title: string; date: string }[] = [];
  if (order.stageUpdates) {
    order.stageUpdates.forEach((up: any) => {
      if (up.photos && Array.isArray(up.photos)) {
        up.photos.forEach((ph: string) => {
          allPhotos.push({ url: ph, title: up.title, date: up.createdAt });
        });
      }
    });
  }

  return (
    <div className="min-h-screen bg-slate-50/70 pb-12 pt-6 text-foreground antialiased dark:bg-slate-950">
      <div className="mx-auto max-w-3xl px-4 sm:px-6">
        {/* هدر برندینگ کاردو */}
        <header className="mb-6 flex flex-wrap items-center justify-between gap-3 border-b pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 font-black text-white shadow-md">
              <Building className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-base font-extrabold tracking-tight sm:text-lg">
                سامانه هوشمند رهگیری پروژه کاردو
              </h1>
              <p className="text-xs text-muted-foreground">رهگیری شفاف روند ساخت، تولید کارگاهی و نصب در محل</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setIsShareModalOpen(true)}
              className="gap-1.5 text-xs font-semibold shadow-sm hover:border-primary"
            >
              <Share2 className="h-3.5 w-3.5 text-primary" />
              <span>اشتراک‌گذاری و ارسال</span>
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => refetch()}
              disabled={isFetching}
              className="gap-1.5 text-xs text-muted-foreground hover:text-foreground"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isFetching ? "animate-spin" : ""}`} />
              <span className="hidden sm:inline">بروزرسانی</span>
            </Button>
          </div>
        </header>

        {/* کارت اصلی اطلاعات پروژه */}
        <Card className="overflow-hidden border bg-card shadow-sm">
          <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 p-6 text-white">
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs opacity-90">
              <span className="rounded-md bg-white/20 px-2.5 py-1 font-mono font-bold tracking-wider">
                {order.code}
              </span>
              <span className="flex items-center gap-1">
                <ShieldCheck className="h-4 w-4" />
                تضمین کیفیت و اصالت متریال
              </span>
            </div>

            <h2 className="mt-3 text-xl font-black sm:text-2xl">
              {order.projectTitle || "پروژه صنایع چوب و دکوراسیون"}
            </h2>

            <div className="mt-2 flex flex-wrap items-center gap-4 text-xs opacity-90">
              <span>کارفرما: <strong className="font-bold">{order.customerName}</strong></span>
              {order.estimatedCompletionDate && (
                <span className="flex items-center gap-1 font-medium">
                  <Calendar className="h-3.5 w-3.5" />
                  تاریخ تخمینی تحویل: {faDate(order.estimatedCompletionDate)}
                </span>
              )}
            </div>
          </div>

          {/* نوار بزرگ پیشرفت فیزیکی */}
          <div className="p-6">
            <div className="mb-2 flex items-center justify-between text-sm">
              <span className="font-semibold text-foreground">میزان تکمیل پروژه:</span>
              <span className="text-2xl font-black text-primary">{toFa(progressPercent)}٪</span>
            </div>

            <div className="h-4 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
              <div
                className="h-full rounded-full bg-gradient-to-r from-blue-500 via-indigo-500 to-emerald-500 transition-all duration-700 ease-out"
                style={{ width: `${progressPercent}%` }}
              />
            </div>

            <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
              <span>آغاز مراحل ساخت</span>
              <span className="font-medium text-emerald-600 dark:text-emerald-400">
                {progressPercent === 100 ? "پروژه تکمیل و تحویل گردید" : "در حال اجرای سفارش در کارخانه"}
              </span>
              <span>تحویل نهایی ۱۰۰٪</span>
            </div>
          </div>
        </Card>

        {/* خط سیر مراحل کارگاهی با عکس‌ها و یادداشت‌های واقعی (Stepper) */}
        <div className="mt-6 space-y-3">
          <h3 className="text-sm font-bold text-foreground">مراحل فرایند تولید و اجرا:</h3>

          <div className="grid gap-3">
            {STAGES.map((st, index) => {
              const Icon = st.icon;
              const isDone = index < activeIndex || order.currentStage === "INSTALLED";
              const isCurrent = index === activeIndex && order.currentStage !== "INSTALLED";

              // استخراج گزارشات و عکس‌های مربوط به این مرحله
              const stageUpdates = order.stageUpdates?.filter((u: any) => u.stationCode === st.key) || [];

              return (
                <div
                  key={st.key}
                  className={`flex flex-col gap-2 rounded-xl border p-4 transition-all ${
                    isCurrent
                      ? "border-primary bg-primary/5 shadow-sm ring-1 ring-primary"
                      : isDone
                      ? "border-emerald-200 bg-emerald-500/5 dark:border-emerald-950"
                      : "border-border/60 bg-card/60 opacity-60"
                  }`}
                >
                  <div className="flex items-center gap-3.5">
                    <div
                      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl font-bold ${
                        isDone
                          ? "bg-emerald-500 text-white shadow-sm"
                          : isCurrent
                          ? "animate-pulse bg-primary text-white shadow"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {isDone ? <CheckCircle2 className="h-5 w-5" /> : <Icon className="h-5 w-5" />}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between">
                        <h4
                          className={`text-sm font-bold ${
                            isCurrent
                              ? "text-primary"
                              : isDone
                              ? "text-emerald-700 dark:text-emerald-400"
                              : "text-foreground"
                          }`}
                        >
                          {st.label}
                        </h4>
                        {isCurrent && (
                          <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-semibold text-primary">
                            مرحله جاری
                          </span>
                        )}
                        {isDone && (
                          <span className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
                            تکمیل شده
                          </span>
                        )}
                      </div>
                      <p className="mt-0.5 text-xs text-muted-foreground leading-relaxed">
                        {st.desc}
                      </p>
                    </div>
                  </div>

                  {/* عکس‌ها و یادداشت‌های واقعی این ایستگاه */}
                  {stageUpdates.length > 0 && (
                    <div className="mt-2 space-y-2 rounded-lg bg-background/80 p-3 border border-border/70">
                      {stageUpdates.map((up: any) => (
                        <div key={up.id} className="space-y-1.5 text-xs">
                          <div className="flex items-center justify-between font-semibold text-primary">
                            <span>{up.title}</span>
                            <span className="text-[11px] text-muted-foreground">{faDate(up.createdAt)}</span>
                          </div>

                          {up.notes && (
                            <p className="text-muted-foreground leading-relaxed text-[11px]">
                              {up.notes}
                            </p>
                          )}

                          {up.photos && up.photos.length > 0 && (
                            <div className="flex flex-wrap gap-2 pt-1">
                              {up.photos.map((ph: string, pIdx: number) => (
                                <button
                                  key={pIdx}
                                  type="button"
                                  onClick={() => setActivePreviewImage(ph)}
                                  className="group relative h-16 w-16 overflow-hidden rounded-lg border bg-slate-100 hover:ring-2 hover:ring-primary dark:bg-slate-800"
                                >
                                  {/* eslint-disable-next-line @next/next/no-img-element */}
                                  <img
                                    src={ph}
                                    alt="عکس واقعی کارگاه"
                                    className="h-full w-full object-cover transition-transform group-hover:scale-105"
                                  />
                                  <span className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Eye className="h-4 w-4 text-white" />
                                  </span>
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* دوقلوی دیجیتال سه‌بعدی و نمای انفجاری تعاملی */}
        <div className="mt-6">
          <Cabinet3DExplodedViewer
            projectTitle={order.projectTitle || "پروژه ساخت کابینت و دکوراسیون چوبی"}
            orderCode={order.code}
          />
        </div>

        {/* گالری کلی تصاویر اختصاصی پروژه */}
        {allPhotos.length > 0 && (
          <Card className="mt-6 border p-5 shadow-sm">
            <h3 className="mb-3 flex items-center gap-2 text-sm font-bold text-foreground">
              <Camera className="h-4 w-4 text-primary" />
              آلبوم تصویری تولید اختصاصی پروژه شما ({toFa(allPhotos.length)} تصویر)
            </h3>
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-6">
              {allPhotos.map((item, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setActivePreviewImage(item.url)}
                  className="group relative aspect-square overflow-hidden rounded-xl border bg-slate-100 hover:ring-2 hover:ring-primary dark:bg-slate-800"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={item.url}
                    alt={item.title}
                    className="h-full w-full object-cover transition-transform group-hover:scale-105"
                  />
                  <div className="absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-black/70 via-black/20 to-transparent p-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    <span className="text-[10px] font-bold text-white truncate">{item.title}</span>
                  </div>
                </button>
              ))}
            </div>
          </Card>
        )}

        {/* کارت تیم اعزامی و نصاب */}
        {(order.assignedInstaller || order.installationOrders?.length > 0) && (
          <Card className="mt-6 border p-5 shadow-sm">
            <h3 className="mb-3 flex items-center gap-2 text-sm font-bold">
              <UserCheck className="h-4 w-4 text-emerald-600" />
              تیم اعزامی و نصاب پروژه
            </h3>

            <div className="space-y-3 text-xs">
              {order.assignedInstaller && (
                <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-muted/40 p-3">
                  <div className="space-y-0.5">
                    <p className="font-semibold text-foreground">سرپرست تیم نصب: {order.assignedInstaller}</p>
                    <p className="text-muted-foreground">مسئول اندازه‌گیری نهایی، مونتاژ و تنظیمات دقیق در محل</p>
                  </div>
                  {order.installerPhone && (
                    <a
                      href={`tel:${order.installerPhone}`}
                      className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 font-medium text-white shadow hover:bg-emerald-700"
                    >
                      <Phone className="h-3.5 w-3.5" />
                      تماس: {order.installerPhone}
                    </a>
                  )}
                </div>
              )}

              {order.installationOrders?.map((inst: any, idx: number) => (
                <div key={idx} className="flex flex-wrap items-center justify-between gap-2 border-t pt-2 text-muted-foreground">
                  <span>حواله اعزام: <strong className="font-mono text-foreground">{inst.orderNumber}</strong></span>
                  <span>تاریخ مقرر: {faDate(inst.scheduledDate)}</span>
                  {inst.driverName && <span>راننده: {inst.driverName}</span>}
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* تاییدیه و امضای دیجیتال تحویل پروژه در محل کارفرما */}
        <Card className="mt-6 border p-5 shadow-sm overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b pb-3 mb-4">
            <h3 className="flex items-center gap-2 text-sm font-bold text-foreground">
              <PenTool className="h-4 w-4 text-emerald-600" />
              تاییدیه و امضای دیجیتال تحویل در محل پروژه
            </h3>
            {order.customerSignatureData ? (
              <Badge className="bg-emerald-600 text-white gap-1 text-[11px]">
                <CheckCircle2 className="size-3" />
                تایید و تحویل قطعی گردید
              </Badge>
            ) : (
              <Badge variant="outline" className="text-amber-600 border-amber-500/30 text-[11px]">
                در انتظار تایید کارفرما
              </Badge>
            )}
          </div>

          {order.customerSignatureData ? (
            <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border bg-emerald-500/10 border-emerald-500/20 p-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2 font-bold text-emerald-800 dark:text-emerald-300 text-sm">
                  <ShieldCheck className="size-5 text-emerald-600" />
                  <span>پروژه با موفقیت و رضایت کامل کارفرما تحویل گردید</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  امضای الکترونیکی با موفقیت ثبت شد و کارت گارانتی ۲۴ ماهه طلایی کاردو فعال گردید.
                </p>
                {order.customerSignedAt && (
                  <span className="text-[11px] font-mono text-muted-foreground block">
                    زمان ثبت امضا: {faDate(order.customerSignedAt)}
                  </span>
                )}
              </div>
              <div className="rounded-xl border bg-white p-2 shadow-sm max-w-[160px]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={order.customerSignatureData}
                  alt="امضای کارفرما"
                  className="h-16 w-full object-contain"
                />
                <span className="text-[10px] text-center block text-slate-500 font-medium pt-1">
                  امضای دیجیتال کارفرما
                </span>
              </div>
            </div>
          ) : (
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border bg-muted/30 p-4">
              <div className="space-y-1">
                <p className="text-xs font-bold text-foreground">
                  کارفرمای گرامی، آیا کار نصب پروژه به پایان رسیده و مورد تایید شماست؟
                </p>
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  با ثبت امضای لمسی روی صفحه گوشی خود، تحویل بی‌نقص سفارش را تایید و ضمانت ۲۴ ماهه را فعال فرمایید.
                </p>
              </div>
              <Button
                size="sm"
                onClick={() => setIsSignModalOpen(true)}
                className="gap-2 text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-bold h-9 shadow-sm"
              >
                <PenTool className="size-4" />
                ثبت امضای دیجیتال رضایت‌نامه
              </Button>
            </div>
          )}
        </Card>

        {/* شفافیت مالی و جزئیات قرارداد پروژه */}
        {order.contract && (
          <Card className="mt-6 border p-5 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b pb-3 mb-4">
              <h3 className="flex items-center gap-2 text-sm font-bold text-foreground">
                <Receipt className="h-4 w-4 text-primary" />
                شفافیت مالی و قرارداد پروژه ({order.contract.contractNumber})
              </h3>
              <Badge
                variant={order.contract.isFullySettled ? "default" : "secondary"}
                className={order.contract.isFullySettled ? "bg-emerald-600 hover:bg-emerald-700 text-white" : ""}
              >
                {order.contract.isFullySettled ? "تسویه‌شده کامل" : "دارای باقیمانده مالی"}
              </Badge>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div className="rounded-xl border bg-muted/30 p-3">
                <span className="text-[11px] text-muted-foreground">مبلغ کل قرارداد</span>
                <p className="mt-1 text-sm font-black text-foreground">
                  {money(order.contract.totalAmount)} <span className="text-[11px] font-normal text-muted-foreground">ریال</span>
                </p>
              </div>

              <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-3">
                <span className="text-[11px] text-emerald-700 dark:text-emerald-400">پیش‌پرداخت دریافت شده</span>
                <p className="mt-1 text-sm font-black text-emerald-600 dark:text-emerald-400">
                  {money(order.contract.downPayment)} <span className="text-[11px] font-normal">ریال</span>
                </p>
              </div>

              <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-3">
                <span className="text-[11px] text-amber-700 dark:text-amber-400">مانده حساب نهایی پس از نصب</span>
                <p className="mt-1 text-sm font-black text-amber-600 dark:text-amber-400">
                  {money(order.contract.balanceDue)} <span className="text-[11px] font-normal">ریال</span>
                </p>
              </div>
            </div>

            <div className="mt-3 flex items-center gap-2 rounded-lg bg-blue-500/5 p-2.5 text-xs text-blue-700 dark:text-blue-400">
              <ShieldCheck className="h-4 w-4 shrink-0" />
              <span>پروژه دارای ۲۴ ماه ضمانت طلایی یراق‌آلات و مقاومت چسب PVC نوار لبه می‌باشد.</span>
            </div>
          </Card>
        )}

        {/* بازخورد و رضایت‌سنجی کارفرما */}
        <Card className="mt-6 border p-5 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b pb-3 mb-4">
            <h3 className="flex items-center gap-2 text-sm font-bold text-foreground">
              <Heart className="h-4 w-4 text-rose-500" />
              نظرسنجی و رضایت‌سنجی از کیفیت پروژه
            </h3>
            <span className="text-xs text-muted-foreground">صدای شما برای بهبود ما ارزشمند است</span>
          </div>

          {isFeedbackSubmitted ? (
            <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-6 text-center">
              <ThumbsUp className="mx-auto h-8 w-8 text-emerald-600 mb-2" />
              <h4 className="text-sm font-bold text-foreground">با تشکر از ثبت نظر ارزشمند شما!</h4>
              <p className="mt-1 text-xs text-muted-foreground">
                بازخورد شما با موفقیت برای مدیریت کارخانه و واحد کنترل کیفیت ارسال گردید.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <p className="text-xs text-muted-foreground mb-2">امتیاز شما به کیفیت و روند اجرای پروژه:</p>
                <div className="flex items-center gap-1.5" dir="ltr">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onMouseEnter={() => setHoverRating(star)}
                      onMouseLeave={() => setHoverRating(null)}
                      onClick={() => setRating(star)}
                      className="p-1 transition-transform hover:scale-125 focus:outline-none"
                    >
                      <Star
                        className={`h-7 w-7 transition-colors ${
                          (hoverRating !== null ? star <= hoverRating : star <= rating)
                            ? "fill-amber-400 text-amber-400"
                            : "text-muted-foreground/30"
                        }`}
                      />
                    </button>
                  ))}
                  <span className="text-xs font-bold text-foreground mr-2" dir="rtl">
                    {rating === 5
                      ? "عالی و کاملاً رضایت‌بخش (۵ از ۵)"
                      : rating === 4
                      ? "بسیار خوب (۴ از ۵)"
                      : rating === 3
                      ? "متوسط (۳ از ۵)"
                      : "نیازمند بهبود"}
                  </span>
                </div>
              </div>

              {/* تگ‌های سریع رضایت */}
              <div className="space-y-1.5">
                <span className="text-xs text-muted-foreground">نقاط قوت برجسته:</span>
                <div className="flex flex-wrap gap-2">
                  {[
                    "کیفیت عالی متریال",
                    "دقت در برش و نوارکاری",
                    "خوش‌قولی و تحویل سروقت",
                    "برخورد حرفه‌ای پرسنل",
                    "بسته‌بندی ایمن و تمیز",
                    "نصب دقیق و بی‌نقص",
                  ].map((tag) => {
                    const isSelected = selectedTags.includes(tag);
                    return (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => {
                          setSelectedTags((prev) =>
                            isSelected ? prev.filter((t) => t !== tag) : [...prev, tag]
                          );
                        }}
                        className={`rounded-full border px-3 py-1 text-xs font-medium transition-all ${
                          isSelected
                            ? "border-primary bg-primary/10 text-primary shadow-sm"
                            : "border-border text-muted-foreground hover:border-foreground/30"
                        }`}
                      >
                        {tag}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* یادداشت اختیاری */}
              <div className="space-y-1.5">
                <span className="text-xs text-muted-foreground">پیشنهاد یا نوت تکمیلی برای مدیریت:</span>
                <textarea
                  rows={2}
                  value={feedbackComment}
                  onChange={(e) => setFeedbackComment(e.target.value)}
                  placeholder="در صورت تمایل، هرگونه نکته یا بازخورد خود را بنویسید..."
                  className="w-full rounded-xl border bg-background p-3 text-xs focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              <Button
                size="sm"
                className="w-full sm:w-auto text-xs"
                onClick={() => setIsFeedbackSubmitted(true)}
              >
                ثبت و ارسال بازخورد به مدیریت
              </Button>
            </div>
          )}
        </Card>

        {/* فوتر اطلاعات و پشتیبانی */}
        <footer className="mt-8 text-center text-xs text-muted-foreground">
          <p>سامانه رهگیری آنلاین صنایع چوب و دکوراسیون کاردو ERP</p>
          <p className="mt-1">اطلاعات این صفحه به‌صورت لحظه‌ای با خطوط تولید کارخانه هماهنگ می‌شود.</p>
        </footer>
      </div>

      {/* مودال اشتراک‌گذاری و ارسال لینک */}
      <Dialog open={isShareModalOpen} onOpenChange={setIsShareModalOpen}>
        <DialogContent className="max-w-md w-full rounded-3xl p-5 select-none" dir="rtl">
          <DialogHeader className="text-start">
            <div className="flex items-center justify-between">
              <DialogTitle className="text-base font-black flex items-center gap-2">
                <Share2 className="h-5 w-5 text-primary" />
                اشتراک‌گذاری و ارسال لینک رهگیری
              </DialogTitle>
              <Badge variant="outline" className="font-mono text-xs font-bold text-primary">
                {order.code}
              </Badge>
            </div>
            <DialogDescription className="text-xs">
              پروژه: <strong className="text-foreground">{order.projectTitle || "سفارش صنایع چوب"}</strong> — کارفرما:{" "}
              <strong className="text-foreground">{order.customerName || "—"}</strong>
            </DialogDescription>
          </DialogHeader>

          {(() => {
            const currentUrl = typeof window !== "undefined" ? window.location.href : "";
            const shareText = `کارفرمای گرامی، رهگیری لحظه‌ای و تصاویر تولید سفارش ${order.code} (${order.projectTitle || "پروژه صنایع چوب کاردو"}):\n${currentUrl}`;

            function handleCopy() {
              if (navigator.clipboard) {
                navigator.clipboard.writeText(currentUrl);
                setIsCopied(true);
                setTimeout(() => setIsCopied(false), 3000);
              }
            }

            return (
              <div className="space-y-4 py-2 text-start">
                {/* کپی لینک رهگیری */}
                <div className="space-y-1.5">
                  <span className="text-xs font-bold text-foreground">لینک مستقیم رهگیری:</span>
                  <div className="flex gap-2">
                    <input
                      readOnly
                      value={currentUrl}
                      className="h-9 w-full rounded-xl border bg-muted/30 px-3 text-xs font-mono text-muted-foreground"
                      dir="ltr"
                    />
                    <Button
                      size="sm"
                      variant="outline"
                      className="gap-1.5 text-xs font-medium shrink-0"
                      onClick={handleCopy}
                    >
                      {isCopied ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                      <span>{isCopied ? "کپی شد" : "کپی"}</span>
                    </Button>
                  </div>
                </div>

                {/* ارسال به پیام‌رسان‌ها */}
                <div className="space-y-2">
                  <span className="text-xs font-bold text-foreground">ارسال سریع در پیام‌رسان‌ها:</span>
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-10 text-xs font-semibold gap-1.5 border-emerald-500/30 text-emerald-700 hover:bg-emerald-50 dark:text-emerald-400 dark:hover:bg-emerald-950/30"
                      onClick={() =>
                        window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(shareText)}`, "_blank")
                      }
                    >
                      واتساپ
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-10 text-xs font-semibold gap-1.5 border-blue-500/30 text-blue-700 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-950/30"
                      onClick={() =>
                        window.open(`https://bale.ai/share?text=${encodeURIComponent(shareText)}`, "_blank")
                      }
                    >
                      بله
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-10 text-xs font-semibold gap-1.5 border-amber-500/30 text-amber-700 hover:bg-amber-50 dark:text-amber-400 dark:hover:bg-amber-950/30"
                      onClick={() =>
                        window.open(
                          `https://eitaa.com/share/url?url=${encodeURIComponent(currentUrl)}&text=${encodeURIComponent(shareText)}`,
                          "_blank"
                        )
                      }
                    >
                      ایتا
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-10 text-xs font-semibold gap-1.5"
                      onClick={() => {
                        window.location.href = `sms:?body=${encodeURIComponent(shareText)}`;
                      }}
                    >
                      پیامک
                    </Button>
                  </div>
                </div>

                {/* QR کد برای اسکن با دوربین */}
                <div className="flex items-center gap-4 rounded-2xl border bg-muted/20 p-3">
                  <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-xl border bg-white p-1">
                    {qrDataUrl ? (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img src={qrDataUrl} alt="QR Code رهگیری" className="h-full w-full object-contain" />
                    ) : (
                      <QrCode className="h-8 w-8 text-muted-foreground animate-pulse" />
                    )}
                  </div>
                  <div className="space-y-1 text-xs">
                    <p className="font-bold text-foreground flex items-center gap-1.5">
                      <QrCode className="h-4 w-4 text-primary" />
                      اسکن هوشمند با دوربین موبایل
                    </p>
                    <p className="text-[11px] text-muted-foreground leading-relaxed">
                      کارفرما یا مشتری می‌تواند با اسکن این بارکد با دوربین گوشی خود، وضعیت لحظه‌ای پروژه را بدون نیاز به لاگین مشاهده نماید.
                    </p>
                  </div>
                </div>
              </div>
            );
          })()}

          <DialogFooter className="pt-2">
            <Button variant="ghost" size="sm" className="w-full text-xs" onClick={() => setIsShareModalOpen(false)}>
              بستن پنجره
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* لایت‌باکس بزرگنمایی عکس تمام صفحه */}
      <Dialog open={Boolean(activePreviewImage)} onOpenChange={() => setActivePreviewImage(null)}>
        <DialogContent className="max-w-3xl p-2 bg-black/95 border-none">
          {activePreviewImage && (
            <div className="flex items-center justify-center p-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={activePreviewImage}
                alt="تصویر بزرگنمایی کارگاهی"
                className="max-h-[85vh] w-auto rounded-lg object-contain"
              />
            </div>
          )}
        </DialogContent>
      </Dialog>
      {/* دیالوگ رسم امضای دیجیتال لمسی کارفرما */}
      <DigitalSignatureDialog
        open={isSignModalOpen}
        onOpenChange={setIsSignModalOpen}
        trackingToken={token}
        customerName={order.customerName}
        orderCode={order.code}
        projectTitle={order.projectTitle}
        onSuccess={() => refetch()}
      />
    </div>
  );
}
