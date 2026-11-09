"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  Calculator,
  Scissors,
  Receipt,
  ShoppingCart,
  Users,
  Route,
  Camera,
  MessageSquare,
  Scale,
  Settings,
  Boxes,
  Plus,
  ArrowRight,
  TrendingUp,
  FileCheck2,
  HardHat,
  Truck,
  Sparkles,
} from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

interface CommandItem {
  id: string;
  title: string;
  subtitle?: string;
  category: "PAGES" | "WOOD" | "ACTIONS" | "FINANCE";
  icon: any;
  href?: string;
  badge?: string;
  action?: () => void;
}

const COMMAND_ITEMS: CommandItem[] = [
  // اقدامات سریع
  {
    id: "act-new-order",
    title: "ثبت سفارش کابینت / دکوراسیون جدید",
    subtitle: "ایجاد سفارش کارگاهی با کارفرما و دوقلوی دیجیتال",
    category: "ACTIONS",
    icon: Plus,
    href: "/admin/wood-industry",
    badge: "اقدام سریع",
  },
  {
    id: "act-parametric-bom",
    title: "ماشین‌حساب BOM پارامتریک و پارت‌لیست",
    subtitle: "محاسبه خودکار قطعات برش، ورق MDF و نوار PVC",
    category: "WOOD",
    icon: Calculator,
    href: "/admin/wood-industry",
    badge: "پیشرفته",
  },
  {
    id: "act-tracking",
    title: "سیر سفارشات و مانیتورینگ کارگاهی",
    subtitle: "مشاهده نوت‌ها، عکس‌های خط تولید و ارسال لینک رهگیری",
    category: "WOOD",
    icon: Route,
    href: "/admin/orders/tracking",
    badge: "لحظه‌ای",
  },
  {
    id: "act-cutrite",
    title: "پارت‌لیست و خروجی برش Cut Rite / OptiCut",
    subtitle: "فایل بهینه‌ساز برش پانل دستگاه کات اره",
    category: "WOOD",
    icon: Scissors,
    href: "/admin/wood-industry",
  },
  {
    id: "act-posters",
    title: "پوستر کاردو (نمایشگاه کارهای نصب‌شده)",
    subtitle: "گالری پروژه‌ها، لایک و نظرات کنترل کیفی",
    category: "WOOD",
    icon: Camera,
    href: "/admin/wood-industry",
  },

  // صفحات بازرگانی
  {
    id: "page-pos",
    title: "صندوق فروشگاهی سریع (POS)",
    subtitle: "فروش نقدی، اعتباری، بارکدی و تسویه فاکتور",
    category: "PAGES",
    icon: ShoppingCart,
    href: "/admin/pos",
  },
  {
    id: "page-customers",
    title: "پرونده ۳۶۰ درجه مشتریان و کارفرمایان",
    subtitle: "مانده حساب، تاریخچه خرید، پروژه‌ها و امتیاز رضایت",
    category: "PAGES",
    icon: Users,
    href: "/admin/customers",
  },
  {
    id: "page-quotations",
    title: "پیش‌فاکتورها و استعلام قیمت",
    subtitle: "صدور پیش‌نویس بدون اثر بر موجودی انبار",
    category: "PAGES",
    icon: Receipt,
    href: "/admin/quotations",
  },

  // مالی و اداری
  {
    id: "page-vouchers",
    title: "اسناد حسابداری دوبل (Vouchers)",
    subtitle: "ثبت سند پیش‌نویس، تراز و نهایی‌سازی",
    category: "FINANCE",
    icon: Scale,
    href: "/admin/vouchers",
  },
  {
    id: "page-hr",
    title: "پرسنل، احکام حقوقی و فیش ماهانه",
    subtitle: "محاسبه کارکرد، مرخصی ساعتی/روزانه و مساعده",
    category: "FINANCE",
    icon: Users,
    href: "/admin/hr",
  },
  {
    id: "page-chat",
    title: "پیام‌رسان و چت سازمانی کاردو",
    subtitle: "کانال‌های عمومی، خط تولید و پیام خصوصی",
    category: "PAGES",
    icon: MessageSquare,
    href: "/admin/chat",
  },
  {
    id: "page-kiosk",
    title: "کیوسک اسکن خط تولید (موبایل و تبلت)",
    subtitle: "اسکن بارکد قطعات و ایستگاه‌های کارگاهی",
    category: "WOOD",
    icon: HardHat,
    href: "/admin/shop-floor",
  },
  {
    id: "page-logistics",
    title: "ناوگان حمل، بارگیری و اعزام نصاب‌ها",
    subtitle: "حواله‌های خروج و زمان‌بندی نصب در محل",
    category: "WOOD",
    icon: Truck,
    href: "/admin/logistics/drivers",
  },
];

export function openCommandPalette() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("kardo:open-command-palette"));
  }
}

export function CommandPaletteDialog() {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");
  const [selectedIndex, setSelectedIndex] = React.useState(0);

  // گوش دادن به کلید Ctrl+K یا Cmd+K یا رویداد بازگشایی سفارشی
  React.useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((o) => !o);
      }
    }
    function handleCustomOpen() {
      setOpen(true);
    }
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("kardo:open-command-palette", handleCustomOpen);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("kardo:open-command-palette", handleCustomOpen);
    };
  }, []);

  const filteredItems = React.useMemo(() => {
    if (!query.trim()) return COMMAND_ITEMS;
    const q = query.toLowerCase();
    return COMMAND_ITEMS.filter(
      (it) =>
        it.title.toLowerCase().includes(q) ||
        it.subtitle?.toLowerCase().includes(q) ||
        it.badge?.toLowerCase().includes(q),
    );
  }, [query]);

  React.useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  function handleSelect(item: CommandItem) {
    setOpen(false);
    setQuery("");
    if (item.action) {
      item.action();
    } else if (item.href) {
      router.push(item.href);
    }
  }

  function handleInputKeyDown(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((idx) => (idx + 1) % filteredItems.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((idx) => (idx - 1 + filteredItems.length) % filteredItems.length);
    } else if (e.key === "Enter" && filteredItems[selectedIndex]) {
      e.preventDefault();
      handleSelect(filteredItems[selectedIndex]);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-xl p-0 overflow-hidden rounded-3xl border-border/70 shadow-2xl bg-card" dir="rtl">
        {/* کادر سرچ هوشمند */}
        <div className="flex items-center gap-3 border-b px-4 py-3 bg-muted/20">
          <Search className="size-5 text-primary shrink-0" />
          <Input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleInputKeyDown}
            placeholder="جستجو در تمام ماژول‌ها، سفارشات، محاسبات BOM، فاکتورها... (یا کلیدهای جهت‌نما)"
            className="border-none shadow-none text-xs focus-visible:ring-0 p-0 h-8 bg-transparent"
          />
          <Badge variant="outline" className="font-mono text-[10px] px-1.5 py-0.5 text-muted-foreground select-none shrink-0">
            Esc
          </Badge>
        </div>

        {/* لیست نتایج فیلترشده */}
        <div className="max-h-80 overflow-y-auto p-2 space-y-1">
          {filteredItems.length === 0 ? (
            <div className="py-8 text-center text-xs text-muted-foreground">
              موردی مطابق با جستجوی شما یافت نشد.
            </div>
          ) : (
            filteredItems.map((item, idx) => {
              const Icon = item.icon;
              const isSelected = idx === selectedIndex;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleSelect(item)}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={`w-full flex items-center justify-between gap-3 p-2.5 rounded-xl text-start transition-all text-xs ${
                    isSelected
                      ? "bg-primary text-primary-foreground font-bold shadow-xs"
                      : "hover:bg-muted/60 text-foreground"
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div
                      className={`p-2 rounded-lg ${
                        isSelected
                          ? "bg-white/20 text-white"
                          : "bg-primary/10 text-primary"
                      }`}
                    >
                      <Icon className="size-4 shrink-0" />
                    </div>
                    <div className="min-w-0">
                      <p className="truncate font-bold leading-tight">{item.title}</p>
                      {item.subtitle && (
                        <p
                          className={`text-[11px] truncate leading-tight pt-0.5 ${
                            isSelected ? "text-primary-foreground/80" : "text-muted-foreground"
                          }`}
                        >
                          {item.subtitle}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {item.badge && (
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                          isSelected
                            ? "bg-white/30 text-white"
                            : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {item.badge}
                      </span>
                    )}
                    <ArrowRight className="size-3.5 opacity-60" />
                  </div>
                </button>
              );
            })
          )}
        </div>

        {/* فوتر راهنما */}
        <div className="border-t bg-muted/40 px-4 py-2 flex items-center justify-between text-[11px] text-muted-foreground select-none">
          <div className="flex items-center gap-3">
            <span>↑↓ انتخاب</span>
            <span>↵ ورود</span>
            <span>Esc بستن</span>
          </div>
          <span>سامانه هوشمند کاردو ERP</span>
        </div>
      </DialogContent>
    </Dialog>
  );
}
