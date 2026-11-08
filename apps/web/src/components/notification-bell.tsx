"use client";

import * as React from "react";
import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Bell,
  AlertTriangle,
  FileClock,
  Check,
  Send,
  MessageSquare,
  Sparkles,
  Info,
  Clock,
  ExternalLink,
} from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  getAlerts,
  getMyNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
} from "@/lib/api";
import { amount, faDate, money, toFa } from "@/lib/format";
import { useAuthStore } from "@/lib/auth-store";
import { cn } from "@/lib/utils";
import { SendNotificationDialog } from "./send-notification-dialog";

const SEEN_KEY = "notif-seen-v1";

export function NotificationBell() {
  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);
  const canSend = user?.role === "ADMIN" || user?.role === "MANAGER";

  const [sendOpen, setSendOpen] = React.useState(false);

  // هشدارهای مالی (بدهی معوق و چک)
  const alerts = useQuery({
    queryKey: ["alerts"],
    queryFn: getAlerts,
    refetchInterval: 60_000,
    retry: false,
  });

  // اعلان‌های اختصاصی کاربر
  const myNotifs = useQuery({
    queryKey: ["my-notifications"],
    queryFn: getMyNotifications,
    refetchInterval: 30_000,
    retry: false,
  });

  const markReadMut = useMutation({
    mutationFn: markNotificationAsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-notifications"] });
    },
  });

  const markAllReadMut = useMutation({
    mutationFn: markAllNotificationsAsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-notifications"] });
    },
  });

  const overdue = alerts.data?.overdue;
  const cheques = alerts.data?.cheques;
  const financialCount = (overdue?.customerCount ?? 0) + (cheques?.count ?? 0);

  const notificationsList = myNotifs.data || [];
  const unreadStaffNotifs = notificationsList.filter((n) => !n.isRead);
  const totalUnread = unreadStaffNotifs.length + (financialCount > 0 ? 1 : 0);

  // امضای وضعیتِ هشدارهای مالی
  const signature = React.useMemo(() => {
    if (!alerts.data) return "";
    return JSON.stringify({
      oc: overdue?.customerCount ?? 0,
      oa: overdue?.amount ?? 0,
      cc: cheques?.count ?? 0,
      oi: overdue?.top?.map((t) => t.id) ?? [],
      ci: cheques?.items?.map((c) => c.id) ?? [],
    });
  }, [alerts.data, overdue, cheques]);

  const seen = React.useSyncExternalStore(
    React.useCallback((onStoreChange) => {
      const handler = (e: StorageEvent) => {
        if (e.key === SEEN_KEY) onStoreChange();
      };
      window.addEventListener("storage", handler);
      return () => window.removeEventListener("storage", handler);
    }, []),
    React.useCallback(() => {
      try {
        return localStorage.getItem(SEEN_KEY) ?? "";
      } catch {
        return "";
      }
    }, []),
    () => "",
  );

  const unseenFinancial = financialCount > 0 && signature !== "" && signature !== seen;
  const hasBadge = unreadStaffNotifs.length > 0 || unseenFinancial;

  const markFinancialSeen = () => {
    try {
      localStorage.setItem(SEEN_KEY, signature);
    } catch {
      /* نادیده */
    }
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="relative size-7"
            title="مرکز اعلان‌ها و پیام‌ها"
          >
            <Bell className="size-4" />
            {hasBadge && (
              <span
                className="absolute -end-0.5 -top-0.5 flex min-w-4 h-4 items-center justify-center
                           rounded-full bg-destructive px-1 text-[9px] font-bold text-white shadow-xs"
              >
                {toFa(unreadStaffNotifs.length || "!")}
              </span>
            )}
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent align="end" className="w-88 p-0 max-h-[85vh] flex flex-col shadow-lg border-border/80">
          {/* هدر اعلان‌ها */}
          <div className="flex items-center justify-between border-b px-3.5 py-2.5 bg-muted/40">
            <div className="flex items-center gap-2">
              <Bell className="size-4 text-primary" />
              <span className="text-xs font-bold text-foreground">مرکز اعلان‌ها</span>
              {unreadStaffNotifs.length > 0 && (
                <Badge variant="secondary" className="text-[10px] h-4.5 px-1.5 font-mono">
                  {toFa(unreadStaffNotifs.length)} جدید
                </Badge>
              )}
            </div>

            <div className="flex items-center gap-1">
              {unreadStaffNotifs.length > 0 && (
                <button
                  type="button"
                  onClick={() => markAllReadMut.mutate()}
                  disabled={markAllReadMut.isPending}
                  className="flex items-center gap-1 rounded px-2 py-1 text-[11px] text-muted-foreground hover:bg-muted hover:text-foreground transition-colors font-medium"
                  title="خواندن همه اعلان‌ها"
                >
                  <Check className="size-3 text-emerald-600" />
                  همه خوانده شد
                </button>
              )}

              {canSend && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setSendOpen(true)}
                  className="h-6 text-[10px] px-2 gap-1 border-primary/30 text-primary hover:bg-primary/10 font-bold"
                >
                  <Send className="size-2.5" />
                  ارسال اعلان
                </Button>
              )}
            </div>
          </div>

          <div className="overflow-y-auto max-h-[380px] divide-y divide-border/50 text-xs">
            {/* ۱. اعلان‌های پرسنلی و اداری */}
            {notificationsList.length > 0 ? (
              <div className="flex flex-col">
                {notificationsList.slice(0, 15).map((n) => (
                  <div
                    key={n.id}
                    className={cn(
                      "p-3 flex items-start justify-between gap-2.5 transition-colors hover:bg-muted/40",
                      !n.isRead && "bg-primary/[0.04] font-medium",
                    )}
                  >
                    <div className="flex flex-col gap-1 min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <span className={cn("font-bold text-xs", !n.isRead ? "text-primary" : "text-foreground")}>
                          {n.title}
                        </span>
                        {n.type === "URGENT" && (
                          <Badge className="bg-rose-100 text-rose-700 text-[9px] px-1 h-4 font-bold">فوری</Badge>
                        )}
                        {n.type === "TASK" && (
                          <Badge className="bg-blue-100 text-blue-700 text-[9px] px-1 h-4">ماموریت</Badge>
                        )}
                      </div>
                      <p className="text-[11px] text-muted-foreground leading-relaxed line-clamp-2">
                        {n.message}
                      </p>
                      <div className="flex items-center gap-2 text-[10px] text-muted-foreground/80 mt-0.5">
                        <span>فرستنده: {n.sender?.fullName || "مدیریت سیستم"}</span>
                        <span>•</span>
                        <span>{faDate(n.createdAt)}</span>
                        {n.linkUrl && (
                          <Link
                            href={n.linkUrl}
                            className="text-primary hover:underline font-bold inline-flex items-center gap-0.5 ms-auto"
                          >
                            مشاهده
                            <ExternalLink className="size-2.5" />
                          </Link>
                        )}
                      </div>
                    </div>

                    {!n.isRead && (
                      <button
                        onClick={() => markReadMut.mutate(n.id)}
                        className="size-5 rounded-full hover:bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground shrink-0 mt-0.5"
                        title="علامت‌گذاری به عنوان خوانده شده"
                      >
                        <Check className="size-3 text-muted-foreground/60" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            ) : null}

            {/* ۲. هشدارهای مالی (بدهی معوق) */}
            {!!overdue?.customerCount && (
              <div className="p-3 bg-destructive/[0.03]">
                <Link
                  href="/admin/customers"
                  className="flex items-start gap-2 hover:underline"
                >
                  <AlertTriangle className="mt-0.5 size-4 shrink-0 text-destructive" />
                  <span className="min-w-0 flex-1">
                    <span className="block text-xs font-bold text-destructive">
                      {toFa(overdue.customerCount)} مشتری بدهی معوق دارند
                    </span>
                    <span className="block text-[11px] text-muted-foreground">
                      مجموع معوق خالص: {amount(overdue.amount)}
                    </span>
                  </span>
                </Link>
              </div>
            )}

            {/* ۳. هشدارهای سررسید چک‌ها */}
            {!!cheques?.count && (
              <div className="p-3 bg-amber-500/[0.03]">
                <div className="flex items-start gap-2">
                  <FileClock className="mt-0.5 size-4 shrink-0 text-amber-600" />
                  <span className="min-w-0 flex-1">
                    <span className="block text-xs font-bold text-amber-700">
                      {toFa(cheques.count)} فقره چک تا {toFa(cheques.withinDays)} روز آینده
                    </span>
                  </span>
                </div>
              </div>
            )}

            {notificationsList.length === 0 && financialCount === 0 && (
              <div className="py-10 text-center text-muted-foreground flex flex-col items-center justify-center gap-1.5">
                <Bell className="size-7 text-muted-foreground/30" />
                <p className="text-xs">هیچ اعلان جدیدی وجود ندارد.</p>
              </div>
            )}
          </div>

          {/* پاورقی دسترسی سریع */}
          <div className="p-2 border-t bg-muted/20 flex items-center justify-between text-[11px]">
            <Link
              href="/admin/profile"
              className="text-primary hover:underline font-bold px-1"
            >
              مشاهده کارتابل من
            </Link>
            <Link
              href="/admin/inbox"
              className="text-muted-foreground hover:text-foreground px-1"
            >
              کارتابل جامع وظایف
            </Link>
          </div>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* دیالوگ ارسال اعلان توسط مدیر */}
      <SendNotificationDialog
        open={sendOpen}
        onOpenChange={setSendOpen}
      />
    </>
  );
}
