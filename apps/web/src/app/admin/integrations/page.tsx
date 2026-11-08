"use client";

import * as React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Activity,
  AlertCircle,
  ArrowRightLeft,
  CheckCircle2,
  Clock,
  ExternalLink,
  Globe,
  KeyRound,
  Layers,
  Play,
  Plus,
  RefreshCw,
  Send,
  ShieldCheck,
  ShoppingBag,
  SlidersHorizontal,
  Webhook,
} from "lucide-react";

import {
  createWebhook,
  getIntegrations,
  getWebhookLogs,
  getWebhooks,
  saveIntegration,
  syncWooCommerce,
  triggerWebhookTest,
} from "@/lib/api";
import { faDate, toFa } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { IntegrationConfigRow, WebhookEndpointRow, WebhookLogRow } from "@/lib/types";

import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function IntegrationsPage() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = React.useState<"woocommerce" | "webhooks">("woocommerce");

  // Queries
  const { data: integrations = [], isLoading: isLoadingInt } = useQuery({
    queryKey: ["integrations"],
    queryFn: getIntegrations,
  });

  const { data: webhooks = [], isLoading: isLoadingWh } = useQuery({
    queryKey: ["webhooks"],
    queryFn: getWebhooks,
  });

  const { data: logs = [], isLoading: isLoadingLogs } = useQuery({
    queryKey: ["webhook-logs"],
    queryFn: () => getWebhookLogs(),
  });

  // فرم ووکامرس
  const wooConfig = integrations.find((i) => i.type === "WOOCOMMERCE");
  const [wooForm, setWooForm] = React.useState({
    apiUrl: "",
    apiKey: "",
    apiSecret: "",
    syncInventory: true,
    syncPrices: true,
    autoCreateInvoice: true,
  });

  React.useEffect(() => {
    if (wooConfig) {
      setWooForm({
        apiUrl: wooConfig.apiUrl || "",
        apiKey: wooConfig.apiKey || "",
        apiSecret: wooConfig.apiSecret || "",
        syncInventory: wooConfig.syncInventory,
        syncPrices: wooConfig.syncPrices,
        autoCreateInvoice: wooConfig.autoCreateInvoice,
      });
    }
  }, [wooConfig]);

  // دیالوگ وب‌هوک جدید
  const [newWhOpen, setNewWhOpen] = React.useState(false);
  const [whForm, setWhForm] = React.useState({
    name: "",
    targetUrl: "",
    secret: "",
    events: ["invoice.created", "payment.received"],
  });

  // فیدبک همگام‌سازی
  const [syncFeedback, setSyncFeedback] = React.useState<string | null>(null);

  // Mutations
  const saveWooMutation = useMutation({
    mutationFn: () =>
      saveIntegration({
        type: "WOOCOMMERCE",
        name: "فروشگاه آنلاین ووکامرس",
        apiUrl: wooForm.apiUrl,
        apiKey: wooForm.apiKey,
        apiSecret: wooForm.apiSecret,
        syncInventory: wooForm.syncInventory,
        syncPrices: wooForm.syncPrices,
        autoCreateInvoice: wooForm.autoCreateInvoice,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["integrations"] });
      setSyncFeedback("تنظیمات اتصال با موفقیت ذخیره و فعال گردید.");
    },
  });

  const syncWooMutation = useMutation({
    mutationFn: (id: string) => syncWooCommerce(id),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ["integrations"] });
      setSyncFeedback(res.message);
    },
  });

  const createWhMutation = useMutation({
    mutationFn: () => createWebhook(whForm),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["webhooks"] });
      setNewWhOpen(false);
      setWhForm({
        name: "",
        targetUrl: "",
        secret: "",
        events: ["invoice.created", "payment.received"],
      });
    },
  });

  const testWhMutation = useMutation({
    mutationFn: (endpointId: string) =>
      triggerWebhookTest({
        endpointId,
        event: "invoice.created",
        payload: {
          testMode: true,
          message: "تست ارسال رویداد کاردو ERP",
          timestamp: new Date().toISOString(),
        },
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["webhook-logs"] });
    },
  });

  return (
    <div className="flex flex-col gap-6 p-6">
      <PageHeader
        title="یکپارچه‌سازی، وب‌هوک‌ها و فروشگاه آنلاین"
        description="پل اتصال کاردو ERP به فروشگاه‌های اینترنتی ووکامرس، وب‌هوک‌های بلادرنگ و APIهای خارجی"
        actions={
          <div className="flex items-center gap-2">
            {activeTab === "woocommerce" && wooConfig && (
              <Button
                onClick={() => syncWooMutation.mutate(wooConfig.id)}
                disabled={syncWooMutation.isPending}
                className="gap-2"
              >
                <RefreshCw className={cn("size-4", syncWooMutation.isPending && "animate-spin")} />
                همگام‌سازی آنی با سایت
              </Button>
            )}
            {activeTab === "webhooks" && (
              <Button onClick={() => setNewWhOpen(true)} className="gap-2">
                <Plus className="size-4" />
                تعریف وب‌هوک جدید
              </Button>
            )}
          </div>
        }
      />

      {/* Tabs */}
      <div className="flex border-b border-border text-sm font-medium">
        <button
          onClick={() => setActiveTab("woocommerce")}
          className={cn(
            "flex items-center gap-2 border-b-2 px-4 py-2.5 transition-colors",
            activeTab === "woocommerce"
              ? "border-primary text-primary font-bold"
              : "border-transparent text-muted-foreground hover:text-foreground",
          )}
        >
          <ShoppingBag className="size-4" />
          اتصال به ووکامرس و سایت اینترنتی
          {wooConfig && <Badge className="bg-emerald-500/10 text-emerald-600 text-xs">فعال</Badge>}
        </button>

        <button
          onClick={() => setActiveTab("webhooks")}
          className={cn(
            "flex items-center gap-2 border-b-2 px-4 py-2.5 transition-colors",
            activeTab === "webhooks"
              ? "border-primary text-primary font-bold"
              : "border-transparent text-muted-foreground hover:text-foreground",
          )}
        >
          <Webhook className="size-4" />
          وب‌هوک‌های سیستمی (Outbound Webhooks)
          <Badge variant="secondary" className="text-xs">{toFa(webhooks.length)}</Badge>
        </button>
      </div>

      {/* ───────────────────────── TAB 1: ووکامرس ───────────────────────── */}
      {activeTab === "woocommerce" && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <Card className="p-5 lg:col-span-2">
            <h3 className="text-base font-bold flex items-center gap-2">
              <Globe className="size-5 text-primary" />
              پیکربندی وب‌سرویس ووکامرس (WooCommerce REST API)
            </h3>
            <p className="mt-1 text-xs text-muted-foreground">
              کلیدهای احراز هویت Consumer Key و Consumer Secret سایت ووکامرسی خود را در زیر وارد نمایید.
            </p>

            {syncFeedback && (
              <div className="mt-4 flex items-center gap-2 rounded-lg bg-emerald-500/10 p-3 text-xs text-emerald-600 font-semibold">
                <CheckCircle2 className="size-4 shrink-0" />
                {syncFeedback}
              </div>
            )}

            <div className="mt-6 flex flex-col gap-4 text-xs">
              <div className="flex flex-col gap-1.5">
                <span className="font-semibold">آدرس فروشگاه آنلاین (Store URL):</span>
                <Input
                  dir="ltr"
                  placeholder="https://yourstore.ir"
                  value={wooForm.apiUrl}
                  onChange={(e) => setWooForm({ ...wooForm, apiUrl: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="flex flex-col gap-1.5">
                  <span className="font-semibold">کلید مصرف‌کننده (Consumer Key):</span>
                  <Input
                    dir="ltr"
                    placeholder="ck_xxxxxxxxxxxxxxxx"
                    value={wooForm.apiKey}
                    onChange={(e) => setWooForm({ ...wooForm, apiKey: e.target.value })}
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <span className="font-semibold">رمز مصرف‌کننده (Consumer Secret):</span>
                  <Input
                    dir="ltr"
                    type="password"
                    placeholder="cs_xxxxxxxxxxxxxxxx"
                    value={wooForm.apiSecret}
                    onChange={(e) => setWooForm({ ...wooForm, apiSecret: e.target.value })}
                  />
                </div>
              </div>

              {/* تنظیمات همگام‌سازی */}
              <div className="mt-2 rounded-lg border bg-muted/20 p-4">
                <span className="font-bold">سیاست‌های همگام‌سازی خودکار:</span>
                <div className="mt-3 flex flex-col gap-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={wooForm.syncInventory}
                      onChange={(e) => setWooForm({ ...wooForm, syncInventory: e.target.checked })}
                      className="rounded border-gray-300 text-primary"
                    />
                    <span>همگام‌سازی موجودی کالاها (تغییر موجودی انبار فوراً روی سایت اعمال شود)</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={wooForm.syncPrices}
                      onChange={(e) => setWooForm({ ...wooForm, syncPrices: e.target.checked })}
                      className="rounded border-gray-300 text-primary"
                    />
                    <span>همگام‌سازی قیمت‌ها (به‌روزرسانی قیمت‌های کاردو به عنوان قیمت فروش سایت)</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={wooForm.autoCreateInvoice}
                      onChange={(e) => setWooForm({ ...wooForm, autoCreateInvoice: e.target.checked })}
                      className="rounded border-gray-300 text-primary"
                    />
                    <span>صدور خودکار فاکتور فروش در کاردو ERP به محض ثبت سفارش آنلاین جدید</span>
                  </label>
                </div>
              </div>

              <div className="mt-2 flex items-center justify-end gap-3">
                <Button
                  onClick={() => saveWooMutation.mutate()}
                  disabled={saveWooMutation.isPending || !wooForm.apiUrl}
                >
                  ذخیره و فعال‌سازی اتصال
                </Button>
              </div>
            </div>
          </Card>

          {/* سایدبار اطلاعات اتصال */}
          <div className="flex flex-col gap-4">
            <Card className="p-4">
              <h4 className="text-sm font-bold flex items-center gap-2">
                <ShieldCheck className="size-4 text-emerald-600" />
                وضعیت کانکتور ووکامرس
              </h4>
              <div className="mt-3 flex flex-col gap-2 text-xs">
                <div className="flex justify-between border-b pb-2">
                  <span className="text-muted-foreground">وضعیت سرور:</span>
                  <Badge className="bg-emerald-500/10 text-emerald-600">متصل (Online)</Badge>
                </div>
                <div className="flex justify-between border-b pb-2">
                  <span className="text-muted-foreground">آخرین سینک:</span>
                  <span>{wooConfig?.lastSyncAt ? faDate(wooConfig.lastSyncAt) : "هنوز اجرا نشده"}</span>
                </div>
                <div className="flex justify-between border-b pb-2">
                  <span className="text-muted-foreground">پروتکل:</span>
                  <span className="font-mono">REST API v3</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">حالت رمزنگاری:</span>
                  <span className="font-mono">HTTPS + HMAC</span>
                </div>
              </div>
            </Card>

            <Card className="p-4 bg-muted/30">
              <h4 className="text-sm font-bold flex items-center gap-2 text-primary">
                <ArrowRightLeft className="size-4" />
                چرخه تبادل داده
              </h4>
              <p className="mt-2 text-xs text-muted-foreground leading-relaxed">
                ارتباط کاردو ERP با ووکامرس دوطرفه است: کالاهای تعریف‌شده و تغییرات موجودی از ERP به ووکامرس تزریق شده و سفارش‌های مشتریان با وب‌هوک به ERP ارسال می‌شوند.
              </p>
            </Card>
          </div>
        </div>
      )}

      {/* ───────────────────────── TAB 2: وب‌هوک‌ها ───────────────────────── */}
      {activeTab === "webhooks" && (
        <div className="flex flex-col gap-6">
          {/* لیست وب‌هوک‌ها */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {webhooks.map((wh) => (
              <Card key={wh.id} className="p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="text-sm font-bold">{wh.name}</h4>
                    <div className="mt-1 font-mono text-[11px] text-muted-foreground truncate max-w-sm">
                      {wh.targetUrl}
                    </div>
                  </div>
                  <Badge variant="outline" className="text-xs bg-emerald-50 text-emerald-700">
                    فعال
                  </Badge>
                </div>

                <div className="mt-3 flex flex-wrap gap-1.5 border-t pt-3">
                  {wh.events.map((ev) => (
                    <Badge key={ev} variant="secondary" className="font-mono text-[10px]">
                      {ev}
                    </Badge>
                  ))}
                </div>

                <div className="mt-4 flex items-center justify-between border-t pt-3 text-xs">
                  <span className="text-muted-foreground">
                    تعداد ارسال‌ها: {toFa(wh._count?.logs || 0)}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => testWhMutation.mutate(wh.id)}
                    disabled={testWhMutation.isPending}
                    className="h-7 gap-1 text-[11px]"
                  >
                    <Send className="size-3" />
                    ارسال تست
                  </Button>
                </div>
              </Card>
            ))}

            {webhooks.length === 0 && (
              <Card className="p-8 text-center text-xs text-muted-foreground col-span-2">
                هنوز وب‌هوکی تعریف نشده است. جهت ارسال خودکار رویدادها به سامانه‌های حسابداری، مالیاتی یا پیامکی روی «تعریف وب‌هوک جدید» کلیک کنید.
              </Card>
            )}
          </div>

          {/* جدول لاگ‌های ارسال */}
          <Card className="overflow-hidden">
            <div className="border-b p-4 text-xs font-bold text-muted-foreground">
              لاگ ارسال رویدادهای اخیر (Delivery Logs)
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead className="bg-muted/50 text-muted-foreground">
                  <tr>
                    <th className="p-3">وب‌هوک مقصد</th>
                    <th className="p-3">نوع رویداد</th>
                    <th className="p-3">کد وضعیت HTTP</th>
                    <th className="p-3">زمان پاسخ</th>
                    <th className="p-3">پاسخ سرور</th>
                    <th className="p-3">تاریخ و ساعت ارسال</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {logs.map((lg) => (
                    <tr key={lg.id} className="hover:bg-muted/30">
                      <td className="p-3 font-semibold">{lg.endpoint?.name || "وب‌هوک"}</td>
                      <td className="p-3 font-mono text-primary">{lg.event}</td>
                      <td className="p-3 font-mono">
                        <Badge
                          variant="outline"
                          className={lg.statusCode === 200 ? "text-emerald-600 bg-emerald-50" : "text-red-600 bg-red-50"}
                        >
                          {lg.statusCode || 200}
                        </Badge>
                      </td>
                      <td className="p-3 font-mono">{toFa(lg.durationMs || 12)} ms</td>
                      <td className="p-3 max-w-xs truncate text-muted-foreground font-mono text-[11px]">
                        {lg.responseBody}
                      </td>
                      <td className="p-3 text-muted-foreground">{faDate(lg.createdAt)}</td>
                    </tr>
                  ))}
                  {logs.length === 0 && (
                    <tr>
                      <td colSpan={6} className="p-6 text-center text-muted-foreground">
                        هنوز لاگی ثبت نشده است.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {/* ───────────────────────── DIALOG: وب‌هوک جدید ───────────────────────── */}
      <Dialog open={newWhOpen} onOpenChange={setNewWhOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>تعریف وب‌هوک خروجی جدید (Outbound Webhook)</DialogTitle>
            <DialogDescription>آدرس Endpoint و رویدادهای مدنظر را وارد کنید.</DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-3 text-xs">
            <div className="flex flex-col gap-1">
              <span>عنوان وب‌هوک:</span>
              <Input
                placeholder="مثلاً سامانه پیامک اختصاصی یا CRM"
                value={whForm.name}
                onChange={(e) => setWhForm({ ...whForm, name: e.target.value })}
              />
            </div>

            <div className="flex flex-col gap-1">
              <span>آدرس گیرنده (Target URL):</span>
              <Input
                dir="ltr"
                placeholder="https://api.yourdomain.ir/webhooks/kardo"
                value={whForm.targetUrl}
                onChange={(e) => setWhForm({ ...whForm, targetUrl: e.target.value })}
              />
            </div>

            <div className="flex flex-col gap-1">
              <span>کلید اشتراکی امضا (Secret Key):</span>
              <Input
                dir="ltr"
                placeholder="اختیاری — خودکار تولید می‌شود"
                value={whForm.secret}
                onChange={(e) => setWhForm({ ...whForm, secret: e.target.value })}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              onClick={() => createWhMutation.mutate()}
              disabled={createWhMutation.isPending || !whForm.name || !whForm.targetUrl}
            >
              ایجاد وب‌هوک
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
