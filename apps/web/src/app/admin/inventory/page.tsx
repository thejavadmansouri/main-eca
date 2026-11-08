"use client";

/**
 * سامانه پیشرفته مدیریت انبارداری و WMS کاردو (Warehouse OS)
 *
 * شامل:
 * ۱. موجودی لحظه‌ای و ارزش ریالی اقلام به تفکیک انبارها و قفسه‌ها
 * ۲. کاردکس کالا با مانده متحرک و گزارش‌گیری تحلیلی
 * ۳. هشدارهای نقطه سفارش و کسری موجودی
 * ۴. ورود، خروج و تعدیل سریع انبار با اسکنر بارکدخوان
 * ۵. حواله و انتقال بین‌انباری و بین‌قفسه‌ای
 * ۶. لاگ و تاریخچه ممیزی تمام حرکات انبار
 */

import * as React from "react";
import {
  Boxes,
  History,
  AlertTriangle,
  ArrowLeftRight,
  ClipboardList,
  PackagePlus,
  Layers,
} from "lucide-react";

import { useAuthStore } from "@/lib/auth-store";
import { PageHeader } from "@/components/page-header";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { WmsStockTable } from "./_components/wms-stock-table";
import { WmsKardexPanel } from "./_components/wms-kardex-panel";
import { WmsLowStockPanel } from "./_components/wms-low-stock-panel";
import { WmsQuickOperations } from "./_components/wms-quick-operations";
import { InventoryLogsPanel } from "./logs/page";
import { InventoryTransferPanel } from "../inventory-transfer/page";

export default function InventoryHubPage() {
  const hasRole = useAuthStore((s) => s.hasRole);
  const canSeeLogs = hasRole("ADMIN", "MANAGER");
  const canManage = hasRole("ADMIN", "MANAGER", "STAFF");

  const [activeTab, setActiveTab] = React.useState<string>("stock");
  const [kardexProductId, setKardexProductId] = React.useState<string>("");
  const [replenishProduct, setReplenishProduct] = React.useState<{
    id: string;
    name: string;
  } | null>(null);

  // تغییر به تب کاردکس برای یک محصول خاص
  const handleOpenKardex = (productId: string) => {
    setKardexProductId(productId);
    setActiveTab("kardex");
  };

  // تغییر به تب ورود سریع برای شارژ کسری
  const handleQuickReplenish = (id: string, name: string) => {
    setReplenishProduct({ id, name });
    setActiveTab("operations");
  };

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="مرکز انبارداری و WMS کاردو"
        description="مدیریت متمرکز موجودی فیزیکی، ارزش ریالی، کاردکس کالا، هشدارهای کسری و حواله‌های انتقال انبار"
        icon={Boxes}
      />

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="overflow-x-auto pb-1">
          <TabsList className="inline-flex h-11 items-center justify-start rounded-lg bg-muted p-1 text-muted-foreground w-auto">
            <TabsTrigger value="stock" className="gap-2 px-4 py-2 text-sm">
              <Boxes className="h-4 w-4" />
              موجودی و ارزش انبار
            </TabsTrigger>

            <TabsTrigger value="kardex" className="gap-2 px-4 py-2 text-sm">
              <History className="h-4 w-4" />
              کاردکس کالا
            </TabsTrigger>

            <TabsTrigger value="low-stock" className="gap-2 px-4 py-2 text-sm">
              <AlertTriangle className="h-4 w-4 text-amber-500" />
              هشدارهای نقطه سفارش و کسری
            </TabsTrigger>

            {canManage && (
              <TabsTrigger value="operations" className="gap-2 px-4 py-2 text-sm">
                <PackagePlus className="h-4 w-4" />
                عملیات سریع و بارکد
              </TabsTrigger>
            )}

            <TabsTrigger value="transfer" className="gap-2 px-4 py-2 text-sm">
              <ArrowLeftRight className="h-4 w-4" />
              حواله و انتقال انبار
            </TabsTrigger>

            {canSeeLogs && (
              <TabsTrigger value="logs" className="gap-2 px-4 py-2 text-sm">
                <ClipboardList className="h-4 w-4" />
                تاریخچه حرکات
              </TabsTrigger>
            )}
          </TabsList>
        </div>

        {/* ۱. تب موجودی و ارزش ریالی */}
        <TabsContent value="stock" className="mt-4">
          <WmsStockTable
            onOpenKardex={handleOpenKardex}
            canManage={canManage}
          />
        </TabsContent>

        {/* ۲. تب کاردکس کالا */}
        <TabsContent value="kardex" className="mt-4">
          <WmsKardexPanel
            productId={kardexProductId}
            onProductChange={setKardexProductId}
            canEdit={canSeeLogs}
          />
        </TabsContent>

        {/* ۳. تب هشدارهای نقطه سفارش و کسری */}
        <TabsContent value="low-stock" className="mt-4">
          <WmsLowStockPanel
            onOpenKardex={handleOpenKardex}
            onQuickReplenish={handleQuickReplenish}
          />
        </TabsContent>

        {/* ۴. تب عملیات سریع و اسکنر بارکد */}
        {canManage && (
          <TabsContent value="operations" className="mt-4">
            <WmsQuickOperations
              prefilledProductId={replenishProduct?.id}
              prefilledProductName={replenishProduct?.name}
              canManage={canManage}
            />
          </TabsContent>
        )}

        {/* ۵. تب انتقال بین‌انباری */}
        <TabsContent value="transfer" className="mt-4">
          <InventoryTransferPanel embedded />
        </TabsContent>

        {/* ۶. تب تاریخچه و لاگ */}
        {canSeeLogs && (
          <TabsContent value="logs" className="mt-4">
            <InventoryLogsPanel embedded />
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
