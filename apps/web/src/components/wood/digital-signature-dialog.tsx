"use client";

import * as React from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { PenTool, CheckCircle, RotateCcw, ShieldCheck, X } from "lucide-react";

import { saveCustomerSignature, savePublicSignature } from "@/lib/api";
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
import { useToast } from "@/hooks/use-toast";

interface DigitalSignatureDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orderId?: string;
  trackingToken?: string;
  customerName?: string;
  projectTitle?: string;
  orderCode?: string;
  onSuccess?: () => void;
}

export function DigitalSignatureDialog({
  open,
  onOpenChange,
  orderId,
  trackingToken,
  customerName = "",
  projectTitle = "پروژه صنایع چوب کاردو",
  orderCode = "",
  onSuccess,
}: DigitalSignatureDialogProps) {
  const { toast } = useToast();
  const qc = useQueryClient();
  const canvasRef = React.useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = React.useState(false);
  const [hasDrawn, setHasDrawn] = React.useState(false);
  const [signerName, setSignerName] = React.useState(customerName);
  const [notes, setNotes] = React.useState("");

  React.useEffect(() => {
    if (customerName) setSignerName(customerName);
  }, [customerName]);

  // ریست بوم نقاشی هنگام باز شدن
  React.useEffect(() => {
    if (open) {
      setTimeout(() => {
        clearCanvas();
      }, 150);
    }
  }, [open]);

  function getCanvasPos(e: MouseEvent | TouchEvent, canvas: HTMLCanvasElement) {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    if ("touches" in e) {
      const touch = e.touches[0] || (e as any).changedTouches[0];
      return {
        x: (touch.clientX - rect.left) * scaleX,
        y: (touch.clientY - rect.top) * scaleY,
      };
    }
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  }

  function startDrawing(e: React.MouseEvent | React.TouchEvent) {
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const pos = getCanvasPos(e.nativeEvent, canvas);
    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);
    setIsDrawing(true);
    setHasDrawn(true);
  }

  function draw(e: React.MouseEvent | React.TouchEvent) {
    e.preventDefault();
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const pos = getCanvasPos(e.nativeEvent, canvas);
    ctx.lineTo(pos.x, pos.y);
    ctx.strokeStyle = "#1e293b";
    ctx.lineWidth = 3;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.stroke();
  }

  function stopDrawing(e: React.MouseEvent | React.TouchEvent) {
    e.preventDefault();
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (ctx) ctx.closePath();
    setIsDrawing(false);
  }

  function clearCanvas() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    setHasDrawn(false);
  }

  const signMut = useMutation({
    mutationFn: async () => {
      const canvas = canvasRef.current;
      if (!canvas || !hasDrawn) {
        throw new Error("لطفاً ابتدا امضای خود را روی کادر رسم نمایید.");
      }
      const signatureData = canvas.toDataURL("image/png");

      if (trackingToken) {
        return savePublicSignature(trackingToken, {
          signatureData,
          signerName,
          notes,
        });
      }
      if (orderId) {
        return saveCustomerSignature(orderId, {
          signatureData,
          signerName,
          notes,
        });
      }
      throw new Error("شناسه سفارش یا توکن رهگیری یافت نشد.");
    },
    onSuccess: (res) => {
      toast({
        title: "امضای الکترونیکی ثبت شد",
        description: res.message || "تاییدیه تحویل با موفقیت در سامانه ذخیره گردید.",
      });
      if (orderId) {
        qc.invalidateQueries({ queryKey: ["wood-order-detail", orderId] });
        qc.invalidateQueries({ queryKey: ["all-wood-orders"] });
        qc.invalidateQueries({ queryKey: ["wood-installations"] });
      }
      if (trackingToken) {
        qc.invalidateQueries({ queryKey: ["public-tracking", trackingToken] });
      }
      onOpenChange(false);
      onSuccess?.();
    },
    onError: (err: any) => {
      toast({
        variant: "destructive",
        title: "خطا در ثبت امضا",
        description: err.message,
      });
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md w-full rounded-3xl p-5 select-none" dir="rtl">
        <DialogHeader className="text-start">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-base font-black flex items-center gap-2">
              <PenTool className="size-5 text-emerald-600" />
              امضای دیجیتال و تاییدیه تحویل نهایی
            </DialogTitle>
            {orderCode && (
              <span className="font-mono text-xs font-bold text-primary rounded-md bg-primary/10 px-2 py-0.5">
                {orderCode}
              </span>
            )}
          </div>
          <DialogDescription className="text-xs">
            پروژه: <strong className="text-foreground">{projectTitle}</strong>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2 text-start">
          <div className="space-y-1.5">
            <Label className="text-xs font-bold">نام و نام خانوادگی امضاکننده / تحویل‌گیرنده:</Label>
            <Input
              value={signerName}
              onChange={(e) => setSignerName(e.target.value)}
              placeholder="مثال: محمدرضا حسینی"
              className="h-9 rounded-xl text-xs"
            />
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-bold flex items-center gap-1.5">
                <span>محل رسم امضا با لمس صفحه یا موس:</span>
              </Label>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={clearCanvas}
                className="h-6 gap-1 px-2 text-[11px] text-muted-foreground hover:text-foreground"
              >
                <RotateCcw className="size-3" />
                <span>پاک کردن</span>
              </Button>
            </div>

            {/* کادر لمسی رسم امضا */}
            <div className="overflow-hidden rounded-2xl border-2 border-dashed border-slate-300 dark:border-slate-700 bg-white shadow-inner">
              <canvas
                ref={canvasRef}
                width={500}
                height={220}
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={stopDrawing}
                onMouseLeave={stopDrawing}
                onTouchStart={startDrawing}
                onTouchMove={draw}
                onTouchEnd={stopDrawing}
                className="w-full h-44 touch-none cursor-crosshair bg-white"
              />
            </div>
            <p className="text-[11px] text-muted-foreground text-center">
              انگشت یا قلم خود را داخل کادر سفید بکشید تا امضا رسم شود.
            </p>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">توضیحات یا نکات تحویل (اختیاری):</Label>
            <Input
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="مثال: کابینت با کیفیت کامل و بدون کسری تحویل گرفته شد."
              className="h-9 rounded-xl text-xs"
            />
          </div>

          <div className="flex items-center gap-2 rounded-xl bg-emerald-500/10 p-2.5 text-xs text-emerald-800 dark:text-emerald-400">
            <ShieldCheck className="size-4 shrink-0" />
            <span>با ثبت امضا، پروژه به وضعیت «تحویل قطعی ۱۰۰٪» ارتقا یافته و گارانتی طلایی فعال می‌شود.</span>
          </div>
        </div>

        <DialogFooter className="gap-2 pt-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => onOpenChange(false)}
            className="text-xs"
          >
            انصراف
          </Button>
          <Button
            type="button"
            size="sm"
            disabled={!hasDrawn || signMut.isPending}
            onClick={() => signMut.mutate()}
            className="gap-1.5 text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
          >
            <CheckCircle className="size-4" />
            <span>{signMut.isPending ? "در حال ثبت امضا..." : "تایید و ثبت نهایی امضا"}</span>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
