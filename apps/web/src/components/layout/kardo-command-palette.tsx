"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  ShoppingCart,
  Users,
  Package,
  Boxes,
  Warehouse,
  Receipt,
  RotateCcw,
  BarChart3,
  Settings,
  PlusCircle,
  FileText,
  Search,
  Wallet,
  Building2,
  Printer,
  ShieldCheck,
  Factory,
} from "lucide-react";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from "@/components/ui/command";

export interface KardoCommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function KardoCommandPalette({ open, onOpenChange }: KardoCommandPaletteProps) {
  const router = useRouter();

  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if ((e.key === "k" || e.key === "K") && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        onOpenChange(!open);
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, [open, onOpenChange]);

  const handleSelect = React.useCallback(
    (href: string) => {
      onOpenChange(false);
      router.push(href);
    },
    [onOpenChange, router],
  );

  return (
    <CommandDialog
      open={open}
      onOpenChange={onOpenChange}
      title="فرمان‌های سراسری کاردو ERP"
      description="جستجوی سریع صفحات، عملیات و اسناد"
      className="max-w-xl font-sans"
    >
      <div dir="rtl">
        <CommandInput placeholder="جستجوی صفحه، عملیات یا ماژول... (مثال: فاکتور، کالا، مشتری، چک)" />
        <CommandList className="max-h-[350px]">
          <CommandEmpty>موردی مطابق با جستجوی شما یافت نشد.</CommandEmpty>

          <CommandGroup heading="عملیات و اقدامات سریع">
            <CommandItem
              onSelect={() => handleSelect("/admin/pos")}
              className="flex items-center justify-between cursor-pointer py-2.5"
            >
              <div className="flex items-center gap-2">
                <ShoppingCart className="size-4 text-primary" />
                <span>صدور فاکتور فروش در صندوق (POS)</span>
              </div>
              <CommandShortcut className="text-xs">F2 / POS</CommandShortcut>
            </CommandItem>

            <CommandItem
              onSelect={() => handleSelect("/admin/pos")}
              className="flex items-center justify-between cursor-pointer py-2.5"
            >
              <div className="flex items-center gap-2">
                <RotateCcw className="size-4 text-amber-600" />
                <span>ثبت سریع مرجوعی کالا</span>
              </div>
              <CommandShortcut className="text-xs">Alt + R</CommandShortcut>
            </CommandItem>

            <CommandItem
              onSelect={() => handleSelect("/admin/products")}
              className="flex items-center justify-between cursor-pointer py-2.5"
            >
              <div className="flex items-center gap-2">
                <PlusCircle className="size-4 text-emerald-600" />
                <span>تعریف و افزودن کالای جدید</span>
              </div>
            </CommandItem>

            <CommandItem
              onSelect={() => handleSelect("/admin/vouchers")}
              className="flex items-center justify-between cursor-pointer py-2.5"
            >
              <div className="flex items-center gap-2">
                <Wallet className="size-4 text-blue-600" />
                <span>دفاتر مالی، تراز آزمایشی و کدینگ حساب‌ها</span>
              </div>
            </CommandItem>

            <CommandItem
              onSelect={() => handleSelect("/admin/manufacturing")}
              className="flex items-center justify-between cursor-pointer py-2.5"
            >
              <div className="flex items-center gap-2">
                <Factory className="size-4 text-amber-600" />
                <span>مدیریت تولید، سفارشات ساخت و فرمول ساخت (BOM)</span>
              </div>
            </CommandItem>
          </CommandGroup>

          <CommandSeparator />

          <CommandGroup heading="ماژول‌های بازرگانی و فروش">
            <CommandItem
              onSelect={() => handleSelect("/admin/documents")}
              className="flex items-center gap-2 cursor-pointer py-2"
            >
              <Receipt className="size-4 text-muted-foreground" />
              <span>فهرست فاکتورها و اسناد فروش</span>
            </CommandItem>

            <CommandItem
              onSelect={() => handleSelect("/admin/quotations")}
              className="flex items-center gap-2 cursor-pointer py-2"
            >
              <FileText className="size-4 text-muted-foreground" />
              <span>پیش‌فاکتورها و استعلام‌ها (Quotations)</span>
            </CommandItem>

            <CommandItem
              onSelect={() => handleSelect("/admin/customers")}
              className="flex items-center gap-2 cursor-pointer py-2"
            >
              <Users className="size-4 text-muted-foreground" />
              <span>مشتریان و طرف‌حساب‌های تجاری</span>
            </CommandItem>

            <CommandItem
              onSelect={() => handleSelect("/admin/purchases")}
              className="flex items-center gap-2 cursor-pointer py-2"
            >
              <Package className="size-4 text-muted-foreground" />
              <span>فاکتورهای خرید و تأمین‌کنندگان</span>
            </CommandItem>
          </CommandGroup>

          <CommandSeparator />

          <CommandGroup heading="انبارداری مکانیزه و کاتالوگ (WMS)">
            <CommandItem
              onSelect={() => handleSelect("/admin/inventory")}
              className="flex items-center gap-2 cursor-pointer py-2"
            >
              <Boxes className="size-4 text-muted-foreground" />
              <span>کاردکس و موجودی لحظه‌ای انبار</span>
            </CommandItem>

            <CommandItem
              onSelect={() => handleSelect("/admin/locations")}
              className="flex items-center gap-2 cursor-pointer py-2"
            >
              <Warehouse className="size-4 text-muted-foreground" />
              <span>ماتریس قفسه‌بندی و جانمایی فیزیکی (Shelves)</span>
            </CommandItem>

            <CommandItem
              onSelect={() => handleSelect("/admin/inventory-count")}
              className="flex items-center gap-2 cursor-pointer py-2"
            >
              <ShieldCheck className="size-4 text-muted-foreground" />
              <span>انبارگردانی و مغایرت‌گیری موجودی</span>
            </CommandItem>

            <CommandItem
              onSelect={() => handleSelect("/admin/labels")}
              className="flex items-center gap-2 cursor-pointer py-2"
            >
              <Printer className="size-4 text-muted-foreground" />
              <span>چاپ لیبل بارکد و رول حرارتی</span>
            </CommandItem>
          </CommandGroup>

          <CommandSeparator />

          <CommandGroup heading="گزارشات و تنظیمات سازمانی">
            <CommandItem
              onSelect={() => handleSelect("/admin/reports")}
              className="flex items-center gap-2 cursor-pointer py-2"
            >
              <BarChart3 className="size-4 text-muted-foreground" />
              <span>گزارشات تحلیلی سود و زیان و گردش</span>
            </CommandItem>

            <CommandItem
              onSelect={() => handleSelect("/admin/settings")}
              className="flex items-center gap-2 cursor-pointer py-2"
            >
              <Settings className="size-4 text-muted-foreground" />
              <span>تنظیمات عمومی، کاربران و نقش‌ها</span>
            </CommandItem>

            <CommandItem
              onSelect={() => handleSelect("/admin/backups")}
              className="flex items-center gap-2 cursor-pointer py-2"
            >
              <Building2 className="size-4 text-muted-foreground" />
              <span>پشتیبان‌گیری پایگاه داده و امنیت سیستم</span>
            </CommandItem>
          </CommandGroup>
        </CommandList>
      </div>
    </CommandDialog>
  );
}
