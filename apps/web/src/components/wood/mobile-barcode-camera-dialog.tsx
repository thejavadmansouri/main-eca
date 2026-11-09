"use client";

import * as React from "react";
import { Camera, RefreshCw, X, AlertCircle, Sparkles, CheckCircle2, Image as ImageIcon } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface MobileBarcodeCameraDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onScan: (barcode: string) => void;
  stationName?: string;
}

export function MobileBarcodeCameraDialog({
  open,
  onOpenChange,
  onScan,
  stationName,
}: MobileBarcodeCameraDialogProps) {
  const videoRef = React.useRef<HTMLVideoElement | null>(null);
  const streamRef = React.useRef<MediaStream | null>(null);
  const animFrameRef = React.useRef<number | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);

  const [hasCamera, setHasCamera] = React.useState<boolean>(true);
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);
  const [isScanning, setIsScanning] = React.useState<boolean>(false);
  const [detectedCode, setDetectedCode] = React.useState<string | null>(null);

  // راه‌اندازی دوربین هنگام باز شدن دیالوگ
  React.useEffect(() => {
    if (!open) {
      stopCamera();
      setDetectedCode(null);
      setErrorMsg(null);
      return;
    }

    startCamera();

    return () => {
      stopCamera();
    };
  }, [open]);

  async function startCamera() {
    setErrorMsg(null);
    setDetectedCode(null);
    try {
      if (!navigator?.mediaDevices?.getUserMedia) {
        setHasCamera(false);
        setErrorMsg("مرورگر شما از دسترسی مستقیم به وبکم پشتیبانی نمی‌کند. لطفاً از دکمه بارگذاری تصویر استفاده کنید.");
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: "environment" },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.setAttribute("playsinline", "true"); // برای iOS Safari
        await videoRef.current.play();
        setIsScanning(true);
        startBarcodeDetection();
      }
    } catch (err: any) {
      console.warn("Camera access error:", err);
      setHasCamera(false);
      setErrorMsg(
        err.name === "NotAllowedError"
          ? "دسترسی به دوربین توسط شما مسدود شده است. لطفاً در تنظیمات مرورگر اجازه دسترسی به دوربین را صادر کنید."
          : "خطا در برقراری ارتباط با ماژول دوربین گوشی.",
      );
    }
  }

  function stopCamera() {
    setIsScanning(false);
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }

  // فرآیند تشخیص بارکد زنده با BarcodeDetector وب
  function startBarcodeDetection() {
    if (typeof window === "undefined") return;

    const BarcodeDetectorClass = (window as any).BarcodeDetector;
    if (!BarcodeDetectorClass) {
      // در صورتی که مرورگر API بارکد دتکتور بومی نداشته باشد، کاربر می‌تواند با لمس دکمه شات بگیرد
      return;
    }

    try {
      const detector = new BarcodeDetectorClass({
        formats: ["code_128", "code_39", "ean_13", "ean_8", "qr_code", "data_matrix"],
      });

      async function scanLoop() {
        if (!videoRef.current || !streamRef.current) return;

        if (videoRef.current.readyState === videoRef.current.HAVE_ENOUGH_DATA) {
          try {
            const barcodes = await detector.detect(videoRef.current);
            if (barcodes && barcodes.length > 0) {
              const code = barcodes[0].rawValue;
              if (code) {
                handleSuccessfulCode(code);
                return; // پایان حلقه بعد از یافتن بارکد
              }
            }
          } catch (e) {
            // خطاهای فریم موقت را نادیده می‌گیریم
          }
        }
        animFrameRef.current = requestAnimationFrame(scanLoop);
      }

      animFrameRef.current = requestAnimationFrame(scanLoop);
    } catch (e) {
      console.warn("BarcodeDetector initialization failed:", e);
    }
  }

  function handleSuccessfulCode(code: string) {
    setDetectedCode(code);
    if (typeof navigator !== "undefined" && navigator.vibrate) {
      navigator.vibrate([100, 50, 100]);
    }
    stopCamera();
    setTimeout(() => {
      onScan(code);
      onOpenChange(false);
    }, 600);
  }

  // پشتیبانی از عکاسی با دوربین بومی و خواندن عکس
  function handleFileCapture(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const img = new Image();
    const url = URL.createObjectURL(file);
    img.src = url;
    img.onload = async () => {
      URL.revokeObjectURL(url);
      const BarcodeDetectorClass = (window as any).BarcodeDetector;
      if (BarcodeDetectorClass) {
        try {
          const detector = new BarcodeDetectorClass({
            formats: ["code_128", "code_39", "ean_13", "qr_code"],
          });
          const barcodes = await detector.detect(img);
          if (barcodes && barcodes.length > 0 && barcodes[0].rawValue) {
            handleSuccessfulCode(barcodes[0].rawValue);
            return;
          }
        } catch {}
      }
      // اگر بارکد دتکتور عکس را نخواند، نام یا کدی پیش‌فرض برای تست
      setErrorMsg("بارکد در تصویر ارسالی خوانده نشد. لطفاً زاویه و نور را تنظیم کنید.");
    };
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md p-4 sm:p-6" dir="rtl">
        <DialogHeader className="text-right">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex size-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Camera className="size-5" />
              </div>
              <div>
                <DialogTitle className="text-base font-bold text-foreground">
                  اسکن بارکد با دوربین گوشی
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                  {stationName ? `ایستگاه کاری فعال: ${stationName}` : "کادر قرمز را روی لیبل بارکد قطعه تنظیم کنید"}
                </DialogDescription>
              </div>
            </div>
          </div>
        </DialogHeader>

        <div className="relative mt-2 flex flex-col items-center justify-center overflow-hidden rounded-2xl bg-black aspect-[4/3] w-full border-2 border-primary/40 shadow-inner">
          {/* پیش‌نمایش تصویر زنده ویدیو */}
          <video
            ref={videoRef}
            className="h-full w-full object-cover"
            playsInline
            muted
          />

          {/* کادر نشانه‌روی و لیزر اسکن */}
          {isScanning && !detectedCode && (
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
              <div className="relative size-56 rounded-2xl border-2 border-dashed border-primary/80 bg-primary/5 shadow-[0_0_0_9999px_rgba(0,0,0,0.5)]">
                {/* خط لیزر اسکن سبز متحرک */}
                <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-transparent via-emerald-400 to-transparent shadow-[0_0_8px_#34d399] animate-[bounce_2s_infinite]" />
                <span className="absolute -bottom-7 inset-x-0 text-center font-mono text-[11px] font-bold text-white drop-shadow">
                  تنظیم بارکد در مرکز کادر
                </span>
              </div>
            </div>
          )}

          {/* حالت موفقیت اسکن */}
          {detectedCode && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-emerald-950/90 text-white backdrop-blur-xs animate-in zoom-in-95">
              <CheckCircle2 className="size-14 text-emerald-400 animate-bounce" />
              <span className="mt-2 text-sm font-black">بارکد با موفقیت شناسایی شد</span>
              <span className="mt-1 font-mono text-lg font-bold text-emerald-300 bg-emerald-900/60 px-3 py-1 rounded-xl border border-emerald-500/50">
                {detectedCode}
              </span>
            </div>
          )}

          {/* پیام خطا در صورت عدم دسترسی به دوربین */}
          {errorMsg && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2.5 p-6 bg-black/90 text-center text-white">
              <AlertCircle className="size-10 text-amber-400" />
              <p className="text-xs text-muted-foreground leading-relaxed">{errorMsg}</p>
              <Button
                size="sm"
                variant="outline"
                onClick={startCamera}
                className="mt-2 gap-1.5 text-xs text-foreground bg-background"
              >
                <RefreshCw className="size-3.5" />
                تلاش مجدد
              </Button>
            </div>
          )}
        </div>

        {/* فیلد ورودی فایل مخفی مخصوص دوربین گوشی */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={handleFileCapture}
          className="hidden"
        />

        <DialogFooter className="mt-4 flex flex-col sm:flex-row gap-2">
          <Button
            type="button"
            variant="outline"
            className="gap-2 text-xs h-10 w-full sm:w-auto flex-1 font-bold"
            onClick={() => fileInputRef.current?.click()}
          >
            <ImageIcon className="size-4 text-primary" />
            <span>عکس‌برداری با نرم‌افزار دوربین گوشی</span>
          </Button>

          <Button
            type="button"
            variant="ghost"
            onClick={() => onOpenChange(false)}
            className="text-xs h-10 w-full sm:w-auto"
          >
            بستن
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
