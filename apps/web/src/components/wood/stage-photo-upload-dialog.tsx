"use client";

import * as React from "react";
import { Camera, Upload, Image as ImageIcon, X, Sparkles, Check } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createProjectPost } from "@/lib/api";

interface StagePhotoUploadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  stationName: string;
  orderCode?: string;
  orderId?: string;
}

export function StagePhotoUploadDialog({
  open,
  onOpenChange,
  stationName,
  orderCode,
  orderId,
}: StagePhotoUploadDialogProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);

  const [previewUrl, setPreviewUrl] = React.useState<string | null>(null);
  const [photoBase64, setPhotoBase64] = React.useState<string | null>(null);
  const [caption, setCaption] = React.useState<string>("");
  const [operator, setOperator] = React.useState<string>("اپراتور کارگاه");

  React.useEffect(() => {
    if (!open) {
      setPreviewUrl(null);
      setPhotoBase64(null);
      setCaption("");
    }
  }, [open]);

  const postMutation = useMutation({
    mutationFn: createProjectPost,
    onSuccess: () => {
      if (typeof navigator !== "undefined" && navigator.vibrate) {
        navigator.vibrate([100, 50, 100]);
      }
      queryClient.invalidateQueries({ queryKey: ["project-posters"] });
      queryClient.invalidateQueries({ queryKey: ["production-matrix"] });
      toast({
        title: "عکس کارگاهی با موفقیت ثبت شد",
        description: `تصویر ایستگاه ${stationName} به گزارش پروژه اضافه شد.`,
      });
      onOpenChange(false);
    },
    onError: (err: any) => {
      toast({
        title: "خطا در بارگذاری عکس",
        description: err.message || "امکان ثبت تصویر وجود ندارد.",
        variant: "destructive",
      });
    },
  });

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      setPreviewUrl(result);
      setPhotoBase64(result);
    };
    reader.readAsDataURL(file);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!photoBase64) {
      toast({
        title: "تصویری انتخاب نشده است",
        description: "لطفاً ابتدا با دوربین عکس بگیرید یا عکسی از گالری انتخاب کنید.",
        variant: "destructive",
      });
      return;
    }

    postMutation.mutate({
      productionOrderId: orderId,
      title: `مرحله ${stationName} — ${orderCode || "سفارش ساخت"}`,
      description: caption.trim() || `ثبت گزارش پیشرفت و کنترل کیفی در ایستگاه ${stationName}`,
      installerName: operator.trim() || "اپراتور کارگاه",
      category: stationName,
      photos: [photoBase64],
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md p-4 sm:p-6" dir="rtl">
        <DialogHeader className="text-right">
          <div className="flex items-center gap-2">
            <div className="flex size-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Camera className="size-5" />
            </div>
            <div>
              <DialogTitle className="text-base font-bold text-foreground">
                ثبت عکس کارگاهی و کنترل کیفی
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                ایستگاه: <strong className="text-foreground">{stationName}</strong> {orderCode && `• سفارش: ${orderCode}`}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="mt-3 flex flex-col gap-3.5">
          {/* کادر پیش‌نمایش تصویر یا دکمه عکس‌برداری */}
          <div
            onClick={() => fileInputRef.current?.click()}
            className="relative flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-primary/40 bg-muted/30 p-4 text-center cursor-pointer hover:bg-muted/50 transition-colors aspect-[16/10] overflow-hidden"
          >
            {previewUrl ? (
              <>
                <img
                  src={previewUrl}
                  alt="پیش‌نمایش"
                  className="h-full w-full object-cover rounded-xl"
                />
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setPreviewUrl(null);
                    setPhotoBase64(null);
                  }}
                  className="absolute top-2 left-2 size-7 rounded-full bg-black/70 text-white flex items-center justify-center hover:bg-black"
                >
                  <X className="size-4" />
                </button>
              </>
            ) : (
              <div className="flex flex-col items-center gap-2 text-muted-foreground">
                <div className="flex size-14 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <Camera className="size-7" />
                </div>
                <div>
                  <span className="font-bold text-xs text-foreground block">
                    لمس جهت عکاسی با دوربین گوشی یا انتخاب از گالری
                  </span>
                  <span className="text-[10px] text-muted-foreground mt-0.5 block">
                    تصویر قطعه، مونتاژ نهایی، تمیزی نوار PVC یا بارگیری
                  </span>
                </div>
              </div>
            )}
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handleFileChange}
            className="hidden"
          />

          <div>
            <label className="text-[11px] font-bold text-foreground block mb-1">
              توضیح یا یادداشت مرحله (اختیاری):
            </label>
            <Textarea
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="مثلاً: کلیه قطعات برش خورد و نوار ۲ میل کشیده شد..."
              className="text-xs h-16 resize-none"
            />
          </div>

          <DialogFooter className="flex flex-col sm:flex-row gap-2 pt-2">
            <Button
              type="submit"
              disabled={!photoBase64 || postMutation.isPending}
              className="gap-2 text-xs h-10 w-full sm:w-auto flex-1 font-bold bg-primary text-primary-foreground"
            >
              <Check className="size-4" />
              <span>{postMutation.isPending ? "در حال ارسال..." : "ثبت و ارسال به کارنامه پروژه"}</span>
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="text-xs h-10 w-full sm:w-auto"
            >
              انصراف
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
