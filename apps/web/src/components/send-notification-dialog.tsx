"use client";

import * as React from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Bell,
  Send,
  AlertTriangle,
  Info,
  CheckCircle2,
  Users,
  Sparkles,
  Link as LinkIcon,
} from "lucide-react";

import { sendStaffNotification, getUsers } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ROLE_LABELS } from "@/lib/format";

interface SendNotificationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultRecipientId?: string;
}

export function SendNotificationDialog({
  open,
  onOpenChange,
  defaultRecipientId = "ALL",
}: SendNotificationDialogProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [recipientId, setRecipientId] = React.useState(defaultRecipientId);
  const [title, setTitle] = React.useState("");
  const [message, setMessage] = React.useState("");
  const [type, setType] = React.useState("INFO");
  const [linkUrl, setLinkUrl] = React.useState("");

  React.useEffect(() => {
    if (defaultRecipientId) {
      setRecipientId(defaultRecipientId);
    }
  }, [defaultRecipientId, open]);

  // فهرست کاربران برای انتخاب گیرنده
  const usersQ = useQuery({
    queryKey: ["users"],
    queryFn: getUsers,
    enabled: open,
  });

  const sendMut = useMutation({
    mutationFn: () =>
      sendStaffNotification({
        recipientId,
        title: title.trim(),
        message: message.trim(),
        type,
        linkUrl: linkUrl.trim() || undefined,
      }),
    onSuccess: () => {
      toast({
        title: "پیام / اعلان با موفقیت ارسال شد",
        description:
          recipientId === "ALL"
            ? "اعلان به تمام پرسنل فعال سیستم مخابره شد."
            : "اعلان به کاربر مقصد ارسال گردید.",
      });
      queryClient.invalidateQueries({ queryKey: ["my-notifications"] });
      queryClient.invalidateQueries({ queryKey: ["unread-notifications-count"] });
      setTitle("");
      setMessage("");
      setLinkUrl("");
      onOpenChange(false);
    },
    onError: (err: any) => {
      toast({
        title: "خطا در ارسال اعلان",
        description: err?.message || "مشکلی در ارسال رخ داد.",
        variant: "destructive",
      });
    },
  });

  const users = usersQ.data || [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base font-bold">
            <Bell className="size-4 text-primary" />
            ارسال اعلان و پیام سازمانی
          </DialogTitle>
          <DialogDescription className="text-xs">
            ارسال اعلان رسمی یا ماموریت به یک کاربر مشخص یا به صورت همگانی برای کلیه پرسنل
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-3.5 py-1">
          {/* انتخاب گیرنده */}
          <div className="flex flex-col gap-1.5">
            <Label className="text-xs">گیرنده پیام *</Label>
            <Select value={recipientId} onValueChange={setRecipientId}>
              <SelectTrigger className="w-full text-xs">
                <SelectValue placeholder="انتخاب مخاطب..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL" className="font-bold text-primary">
                  📢 ارسال همگانی به تمامی پرسنل
                </SelectItem>
                {users.map((u) => (
                  <SelectItem key={u.id} value={u.id}>
                    {u.fullName} (@{u.username} - {ROLE_LABELS[u.role] || u.role})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* نوع اعلان */}
          <div className="flex flex-col gap-1.5">
            <Label className="text-xs">نوع پیام *</Label>
            <Select value={type} onValueChange={setType}>
              <SelectTrigger className="w-full text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="INFO">اطلاع‌رسانی عمومی (INFO)</SelectItem>
                <SelectItem value="TASK">ماموریت و تسک فوری (TASK)</SelectItem>
                <SelectItem value="WARNING">هشدار اداری و کاری (WARNING)</SelectItem>
                <SelectItem value="URGENT">پیام بسیار فوری و اضطراری (URGENT)</SelectItem>
                <SelectItem value="ANNOUNCEMENT">اطلاعیه مدیریت (ANNOUNCEMENT)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* عنوان */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="notif-title" className="text-xs">
              عنوان اعلان *
            </Label>
            <Input
              id="notif-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="مثلاً: هماهنگی اعزام بار به پروژه نیاوران"
              className="text-xs"
            />
          </div>

          {/* متن پیام */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="notif-message" className="text-xs">
              متن پیام یا دستورالعمل *
            </Label>
            <Textarea
              id="notif-message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="شرح کامل کار یا پیام اداری مورد نظر را وارد نمایید..."
              rows={4}
              className="text-xs leading-relaxed"
            />
          </div>

          {/* لینک اختیاری */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="notif-link" className="text-xs">
              پیوند مرتبط (اختیاری)
            </Label>
            <Input
              id="notif-link"
              value={linkUrl}
              onChange={(e) => setLinkUrl(e.target.value)}
              placeholder="مثلاً /admin/inbox یا /admin/wood"
              className="text-xs font-mono"
              dir="ltr"
            />
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}
            disabled={sendMut.isPending}
            className="text-xs"
          >
            انصراف
          </Button>
          <Button
            size="sm"
            onClick={() => sendMut.mutate()}
            disabled={sendMut.isPending || !title.trim() || !message.trim()}
            className="text-xs font-bold gap-1.5"
          >
            <Send className="size-3.5" />
            {sendMut.isPending ? "در حال ارسال..." : "ارسال اعلان"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
