"use client";

import * as React from "react";
import { History, Search, Package, ArrowRight, BookOpen } from "lucide-react";

import { ProductSearchSelect } from "@/components/product-search-select";
import { ProductKardex } from "@/app/admin/products/_components/product-kardex";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface Props {
  productId?: string;
  onProductChange?: (productId: string) => void;
  canEdit?: boolean;
}

export function WmsKardexPanel({
  productId: initialProductId,
  onProductChange,
  canEdit = true,
}: Props) {
  const [selectedProductId, setSelectedProductId] = React.useState<string>(
    initialProductId || "",
  );

  React.useEffect(() => {
    if (initialProductId) {
      setSelectedProductId(initialProductId);
    }
  }, [initialProductId]);

  const handleSelectProduct = (product: any) => {
    const id = product?.id || "";
    setSelectedProductId(id);
    onProductChange?.(id);
  };

  return (
    <div className="space-y-6">
      {/* هدر انتخاب کالا برای کاردکس */}
      <Card className="border-border/60 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-bold flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-primary" />
            انتخاب کالا برای مشاهده کاردکس انبار
          </CardTitle>
          <CardDescription>
            کاردکس حساب مقداری و ریالی گردش کالا (شامل ورود، خروج، فروش، مرجوعی، تعدیل و انتقال) با مانده متحرک
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="flex-1 max-w-xl">
              <ProductSearchSelect
                value={selectedProductId}
                onChange={handleSelectProduct}
                placeholder="جستجو و انتخاب کالا (نام، چوب، یراق، کد SKU، بارکد)..."
              />
            </div>
            {selectedProductId && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSelectedProductId("");
                  onProductChange?.("");
                }}
              >
                پاک کردن انتخاب
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* نمایش کاردکس کالا یا وضعیت خالی */}
      {selectedProductId ? (
        <ProductKardex productId={selectedProductId} canEdit={canEdit} />
      ) : (
        <Card className="border-dashed border-2 bg-muted/20">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <div className="rounded-full bg-primary/10 p-4 text-primary mb-4">
              <History className="h-10 w-10" />
            </div>
            <h3 className="text-lg font-bold text-foreground">
              هیچ کالایی برای نمایش کاردکس انتخاب نشده است
            </h3>
            <p className="mt-2 text-sm text-muted-foreground max-w-md">
              از کادر بالا یک کالا (ورق MDF، روکش چوب، یراق‌آلات، قطعات تولیدی یا کالای بازرگانی) را جستجو و انتخاب کنید، یا در تب «موجودی» روی آیکون کاردکس هر ردیف کلیک نمایید.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
