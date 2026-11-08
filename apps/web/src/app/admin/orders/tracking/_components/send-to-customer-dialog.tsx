"use client";

import * as React from "react";
import { useMutation } from "@tanstack/react-query";
import {
  Share2,
  Copy,
  Check,
  Send,
  MessageSquare,
  QrCode,
  Smartphone,
  ExternalLink,
  Loader2,
  ShieldCheck,
  Phone,
  User,
} from "lucide-react";

import { sendTrackingLinkSms } from "@/lib/api";
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

interface SendToCustomerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  order: {
    id: string;
    code: string;
    projectTitle?: string | null;
    customerName?: string | null;
    customerPhone?: string | null;
    trackingToken?: string | null;
  } | null;
}

export function SendToCustomerDialog({ open, onOpenChange, order }: SendToCustomerDialogProps) {
  const { toast } = useToast();
  const [mobileNumber, setMobileNumber] = React.useState("");
  const [isCopied, setIsCopied] = React.useState(false);

  React.useEffect(() => {
    if (order) {
      setMobileNumber(order.customerPhone || "");
      setIsCopied(false);
    }
  }, [order]);

  const sendSmsMut = useMutation({
    mutationFn: ({ orderId, mobile }: { orderId: string; mobile?: string }) =>
      sendTrackingLinkSms(orderId, mobile),
    onSuccess: (res) => {
      toast({
        title: "پیامک با موفقیت ارسال شد",
        description: `لینک رهگیری به شماره ${res.mobile} مخابره گردید.`,
      });
      onOpenChange(false);
    },
    onError: (err: any) => {
      toast({
        variant: "destructive",
        title: "خطا در ارسال پیامک",
        description: err.message || "لطفاً شماره همراه را بررسی فرمایید.",
      });
    },
  });

  if (!order) return null;

  // آدرس کامل رهگیری
  const baseUrl = typeof window !== "undefined" ? window.location.origin : "";
  const trackingUrl = order.trackingToken ? `${baseUrl}/track/${order.trackingToken}` : "";

  const smsPreview = `کارفرمای گرامی جناب ${order.customerName || "مشتری"}\nسفارش شما با کد ${order.code} (${order.projectTitle || "پروژه صنایع چوب"}) در کارخانه کاردو در حال آماده‌سازی است.\nجهت مشاهده پیشرفت لحظه‌ای و تصاویر تولید:\n${trackingUrl || `${baseUrl}/track/...`}\nکاردو OS`;

  function handleCopyLink() {
    if (!trackingUrl) return;
    navigator.clipboard.writeText(trackingUrl);
    setIsCopied(true);
    toast({
      title: "لینک رهگیری کپی شد",
      description: "لینک اختصاصی به کلیپ‌بورد منتقل گردید.",
    });
    setTimeout(() => setIsCopied(false), 3000);
  }

  function handleShareWhatsApp() {
    const text = encodeURIComponent(smsPreview);
    window.open(`https://api.whatsapp.com/send?text=${text}`, "_blank");
  }

  function handleShareBale() {
    const text = encodeURIComponent(smsPreview);
    window.open(`https://bale.ai/share?text=${text}`, "_blank");
  }

  function handleShareEitaa() {
    const text = encodeURIComponent(smsPreview);
    window.open(`https://eitaa.com/share/url?url=${encodeURIComponent(trackingUrl)}&text=${text}`, "_blank");
  }

  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(trackingUrl)}`;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md w-full rounded-3xl p-5 select-none" dir="rtl">
        <DialogHeader className="text-start">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-base font-black flex items-center gap-2">
              <Share2 className="size-5 text-primary" />
              ارسال لینک رهگیری به مشتری
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

        <div className="space-y-4 py-2 text-start">
          {/* شماره همراه کارفرما */}
          <div className="space-y-1.5">
            <Label className="text-xs font-bold flex items-center gap-1.5">
              <Phone className="size-3.5 text-muted-foreground" />
              شماره تلفن همراه مشتری:
            </Label>
            <div className="flex gap-2">
              <Input
                type="tel"
                placeholder="مثال: 09123456789"
                value={mobileNumber}
                onChange={(e) => setMobileNumber(e.target.value)}
                className="h-10 rounded-xl text-xs font-mono text-start tracking-wider flex-1"
                dir="ltr"
              />
              <Button
                onClick={() => sendSmsMut.mutate({ orderId: order.id, mobile: mobileNumber })}
                disabled={sendSmsMut.isPending}
                className="h-10 rounded-xl text-xs font-bold gap-1.5 bg-primary text-primary-foreground shadow-sm px-4"
              >
                {sendSmsMut.isPending ? (
                  <Loader2 className="size-3.5 animate-spin" />
                ) : (
                  <Send className="size-3.5" />
                )}
                ارسال پیامک
              </Button>
            </div>
          </div>

          {/* پیش‌نمایش پیامک */}
          <div className="space-y-1">
            <span className="text-[11px] font-bold text-muted-foreground">متن پیامک ارسالی به کارفرما:</span>
            <div className="p-3 rounded-2xl bg-muted/40 border border-border/60 text-xs leading-relaxed whitespace-pre-line font-sans text-foreground/90 select-text">
              {smsPreview}
            </div>
          </div>

          {/* کپی لینک رهگیری */}
          <div className="space-y-1.5">
            <Label className="text-xs font-bold">لینک اختصاصی رهگیری آنلاین:</Label>
            <div className="flex items-center gap-2 p-1.5 rounded-xl border border-border/80 bg-background">
              <input
                readOnly
                value={trackingUrl || "در حال ساخت توکن..."}
                className="flex-1 bg-transparent px-2 text-xs font-mono text-muted-foreground outline-none truncate"
                dir="ltr"
              />
              <Button
                size="sm"
                variant={isCopied ? "default" : "outline"}
                onClick={handleCopyLink}
                className="h-8 rounded-lg text-xs gap-1 font-bold shrink-0"
              >
                {isCopied ? <Check className="size-3.5 text-emerald-400" /> : <Copy className="size-3.5" />}
                {isCopied ? "کپی شد" : "کپی لینک"}
              </Button>
            </div>
          </div>

          {/* اشتراک‌گذاری در پیام‌رسان‌ها */}
          <div className="space-y-2">
            <span className="text-[11px] font-bold text-muted-foreground block">
              یا اشتراک‌گذاری مستقیم در شبکه‌های اجتماعی:
            </span>
            <div className="grid grid-cols-3 gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleShareWhatsApp}
                className="rounded-xl text-xs font-bold gap-1 text-emerald-700 border-emerald-300 hover:bg-emerald-50 h-9"
              >
                واتساپ
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleShareBale}
                className="rounded-xl text-xs font-bold gap-1 text-blue-700 border-blue-300 hover:bg-blue-50 h-9"
              >
                بله (Bale)
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleShareEitaa}
                className="rounded-xl text-xs font-bold gap-1 text-amber-700 border-amber-300 hover:bg-amber-50 h-9"
              >
                ایتا (Eitaa)
              </Button>
            </div>
          </div>

          {/* بارکد QR جهت اسکن حضوری */}
          {trackingUrl && (
            <div className="flex items-center gap-3 p-3 rounded-2xl bg-primary/5 border border-primary/20">
              <img
                src={qrImageUrl}
                alt="QR Code"
                className="size-16 rounded-xl border border-border bg-white p-1 shrink-0"
              />
              <div className="text-xs space-y-0.5">
                <p className="font-bold text-foreground flex items-center gap-1">
                  <QrCode className="size-3.5 text-primary" />
                  اسکن بارکد با دوربین گوشی
                </p>
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  کارفرما می‌تواند بارکد فوق را مستقیماً با دوربین گوشی اسکن کرده و وارد پرونده زنده پروژه شود.
                </p>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-0 pt-2 border-t border-border/40">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="rounded-xl text-xs font-bold h-10 w-full"
          >
            بستن
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
