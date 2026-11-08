"use client";

import * as React from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  PackagePlus,
  PackageMinus,
  SlidersHorizontal,
  Barcode,
  Search,
  CheckCircle2,
  AlertCircle,
  Building2,
  Layers,
} from "lucide-react";

import {
  getLocations,
  stockIn,
  stockOut,
  adjustStock,
  resolveForSale,
} from "@/lib/api";
import type { InventoryOperationDto } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import { toFa } from "@/lib/format";
import { ProductSearchSelect } from "@/components/product-search-select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

interface Props {
  prefilledProductId?: string;
  prefilledProductName?: string;
  canManage?: boolean;
}

export function WmsQuickOperations({
  prefilledProductId,
  prefilledProductName,
  canManage = true,
}: Props) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [activeOp, setActiveOp] = React.useState<"in" | "out" | "adjust">("in");

  // فرم‌های ورودی
  const [productId, setProductId] = React.useState<string>(
    prefilledProductId || "",
  );
  const [productName, setProductName] = React.useState<string>(
    prefilledProductName || "",
  );
  const [locationId, setLocationId] = React.useState<string>("");
  const [quantity, setQuantity] = React.useState<string>("");
  const [unitPrice, setUnitPrice] = React.useState<string>("");
  const [note, setNote] = React.useState<string>("");

  // بارکدخوان سریع
  const [barcodeInput, setBarcodeInput] = React.useState<string>("");
  const [barcodeScanning, setBarcodeScanning] = React.useState(false);

  // موقعیت‌ها
  const locationsQ = useQuery({
    queryKey: ["locations", "all"],
    queryFn: () => getLocations(),
  });

  React.useEffect(() => {
    if (prefilledProductId) {
      setProductId(prefilledProductId);
      setProductName(prefilledProductName || "");
    }
  }, [prefilledProductId, prefilledProductName]);

  const resetFields = () => {
    setProductId("");
    setProductName("");
    setLocationId("");
    setQuantity("");
    setUnitPrice("");
    setNote("");
  };

  // اسکن سریع بارکد با هندل یا اینتر
  const handleBarcodeLookup = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const code = barcodeInput.trim();
    if (!code) return;

    setBarcodeScanning(true);
    try {
      const resolved = await resolveForSale(code);
      if (resolved?.product) {
        setProductId(resolved.product.id);
        setProductName(resolved.product.name);
        if (resolved.product.salePrice) {
          setUnitPrice(String(resolved.product.salePrice));
        }
        if (resolved.stock && resolved.stock.length > 0) {
          setLocationId(resolved.stock[0].locationId);
        }
        toast({
          title: "بارکد شناسایی شد",
          description: `کالا: ${resolved.product.name} (موجودی فعلی: ${toFa(
            resolved.onHand,
          )})`,
        });
        setBarcodeInput("");
      }
    } catch (err: any) {
      toast({
        title: "کالا پیدا نشد",
        description: "هیچ کالایی با این بارکد یا کد فنی در سیستم یافت نشد.",
        variant: "destructive",
      });
    } finally {
      setBarcodeScanning(false);
    }
  };

  // میوتیشن ورود به انبار
  const inMut = useMutation({
    mutationFn: (dto: InventoryOperationDto) => stockIn(dto),
    onSuccess: () => {
      toast({
        title: "ورود به انبار ثبت شد",
        description: `تعداد ${toFa(quantity)} واحد به موجودی کالا اضافه شد.`,
      });
      queryClient.invalidateQueries({ queryKey: ["inventory"] });
      resetFields();
    },
    onError: (err: any) => {
      toast({
        title: "خطا در ثبت ورود",
        description: err?.message || "خطا در ثبت عملیات ورود.",
        variant: "destructive",
      });
    },
  });

  // میوتیشن خروج از انبار
  const outMut = useMutation({
    mutationFn: (dto: InventoryOperationDto) => stockOut(dto),
    onSuccess: () => {
      toast({
        title: "خروج از انبار ثبت شد",
        description: `تعداد ${toFa(quantity)} واحد از انبار کسر شد.`,
      });
      queryClient.invalidateQueries({ queryKey: ["inventory"] });
      resetFields();
    },
    onError: (err: any) => {
      toast({
        title: "خطا در ثبت خروج",
        description: err?.message || "موجودی کافی نیست یا موقعیت نامعتبر است.",
        variant: "destructive",
      });
    },
  });

  // میوتیشن تعدیل
  const adjustMut = useMutation({
    mutationFn: (dto: {
      productId: string;
      locationId: string;
      targetQuantity: number;
      note?: string;
    }) => adjustStock(dto),
    onSuccess: () => {
      toast({
        title: "تعدیل موجودی ثبت شد",
        description: `موجودی کالا به ${toFa(quantity)} اصلاح شد.`,
      });
      queryClient.invalidateQueries({ queryKey: ["inventory"] });
      resetFields();
    },
    onError: (err: any) => {
      toast({
        title: "خطا در ثبت تعدیل",
        description: err?.message || "امکان ثبت تعدیل وجود ندارد.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!productId) {
      toast({ title: "انتخاب کالا الزامی است", variant: "destructive" });
      return;
    }
    if (!locationId) {
      toast({ title: "انتخاب موقعیت الزامی است", variant: "destructive" });
      return;
    }

    const qtyNum = parseInt(quantity, 10);
    if (isNaN(qtyNum) || qtyNum < 0) {
      toast({ title: "تعداد نامعتبر است", variant: "destructive" });
      return;
    }

    if (activeOp === "in") {
      inMut.mutate({
        productId,
        locationId,
        quantity: qtyNum,
        note: note || "ورود سریع به انبار",
      });
    } else if (activeOp === "out") {
      const priceNum = unitPrice ? parseFloat(unitPrice) : undefined;
      outMut.mutate({
        productId,
        locationId,
        quantity: qtyNum,
        unitPrice: priceNum,
        note: note || "خروج سریع از انبار",
      });
    } else if (activeOp === "adjust") {
      adjustMut.mutate({
        productId,
        locationId,
        targetQuantity: qtyNum,
        note: note || "تعدیل و انبارگردانی",
      });
    }
  };

  const isPending = inMut.isPending || outMut.isPending || adjustMut.isPending;

  return (
    <div className="space-y-6">
      {/* نوار اسکنر سریع بارکد */}
      <Card className="border-primary/30 bg-primary/5 shadow-sm">
        <CardContent className="pt-5">
          <form
            onSubmit={handleBarcodeLookup}
            className="flex flex-col gap-3 sm:flex-row sm:items-center"
          >
            <div className="flex items-center gap-2 text-primary font-bold text-sm min-w-[140px]">
              <Barcode className="h-5 w-5" />
              <span>اسکنر بارکدخوان:</span>
            </div>
            <div className="relative flex-1">
              <Input
                value={barcodeInput}
                onChange={(e) => setBarcodeInput(e.target.value)}
                placeholder="بارکد کالا، شماره فنی یا کد SKU را اسکن یا تایپ کنید..."
                className="bg-card font-mono text-base"
                autoFocus
              />
            </div>
            <Button
              type="submit"
              disabled={barcodeScanning || !barcodeInput.trim()}
              className="h-10 px-5"
            >
              {barcodeScanning ? "در حال جستجو..." : "شناسایی کالا"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* فرم سه منظوره عملیات انبار */}
      <Card className="border-border/60 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-bold">
            عملیات انبارداری سریع و ثبت مستقیم
          </CardTitle>
          <CardDescription>
            ثبت اسناد مقداری ورود، حواله خروج و تعدیل مغایرت انبارگردانی
          </CardDescription>
        </CardHeader>

        <CardContent>
          <Tabs
            value={activeOp}
            onValueChange={(v) => setActiveOp(v as any)}
            className="w-full"
          >
            <TabsList className="grid w-full grid-cols-3 max-w-lg mb-6">
              <TabsTrigger value="in" className="gap-2">
                <PackagePlus className="h-4 w-4 text-emerald-600" />
                ورود به انبار
              </TabsTrigger>
              <TabsTrigger value="out" className="gap-2">
                <PackageMinus className="h-4 w-4 text-rose-600" />
                خروج از انبار
              </TabsTrigger>
              <TabsTrigger value="adjust" className="gap-2">
                <SlidersHorizontal className="h-4 w-4 text-amber-600" />
                تعدیل و انبارگردانی
              </TabsTrigger>
            </TabsList>

            <form onSubmit={handleSubmit} className="space-y-4 max-w-2xl">
              {/* کالا */}
              <div className="space-y-2">
                <Label>کالای مورد نظر</Label>
                <ProductSearchSelect
                  value={productId}
                  onChange={(p) => {
                    setProductId(p?.id || "");
                    setProductName(p?.name || "");
                  }}
                  placeholder="جستجو و انتخاب کالا..."
                />
                {productName && (
                  <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                    <span>کالای انتخاب‌شده: <strong>{productName}</strong></span>
                  </div>
                )}
              </div>

              {/* موقعیت / قفسه */}
              <div className="space-y-2">
                <Label htmlFor="op-location">موقعیت / قفسه انبار</Label>
                <Select value={locationId} onValueChange={setLocationId}>
                  <SelectTrigger id="op-location">
                    <SelectValue placeholder="انتخاب موقعیت یا قفسه انبار..." />
                  </SelectTrigger>
                  <SelectContent>
                    {locationsQ.data?.map((loc) => (
                      <SelectItem key={loc.id} value={loc.id}>
                        {loc.name} {loc.code ? `(${loc.code})` : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* تعداد */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="op-qty">
                    {activeOp === "adjust"
                      ? "تعداد شمارش‌شده جدید (موجودی واقعی)"
                      : "تعداد"}
                  </Label>
                  <Input
                    id="op-qty"
                    type="number"
                    min="0"
                    step="1"
                    required
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    placeholder="مثال: 10"
                    className="font-mono text-base font-bold"
                  />
                </div>

                {activeOp === "out" && (
                  <div className="space-y-2">
                    <Label htmlFor="op-price">قیمت واحد ریالی (اختیاری)</Label>
                    <Input
                      id="op-price"
                      type="number"
                      min="0"
                      value={unitPrice}
                      onChange={(e) => setUnitPrice(e.target.value)}
                      placeholder="ریال"
                      className="font-mono"
                    />
                  </div>
                )}
              </div>

              {/* یادداشت / علت */}
              <div className="space-y-2">
                <Label htmlFor="op-note">توضیحات و عطف سند</Label>
                <Textarea
                  id="op-note"
                  rows={2}
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder={
                    activeOp === "in"
                      ? "شماره بارنامه، فاکتور خرید یا تحویل از تولید"
                      : activeOp === "out"
                      ? "حواله خروج مصرفی، دستور کار، فروش متفرقه"
                      : "علت مغایرت انبارگردانی"
                  }
                />
              </div>

              {/* دکمه ثبت */}
              <div className="pt-2 flex items-center gap-3">
                <Button
                  type="submit"
                  disabled={isPending || !productId || !locationId || !quantity}
                  className="px-6"
                >
                  {isPending
                    ? "در حال ثبت..."
                    : activeOp === "in"
                    ? "ثبت ورود به انبار"
                    : activeOp === "out"
                    ? "ثبت خروج از انبار"
                    : "اعمال تعدیل موجودی"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={resetFields}
                  disabled={isPending}
                >
                  پاک کردن فرم
                </Button>
              </div>
            </form>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
