// پیکربندی ناوبری سایدبار کاردو ERP — معماری کامل سیستم‌های سازمانی (Real ERP)
import type { Role } from "./types";
import {
  AlertCircle,
  ArrowLeftRight,
  BadgePercent,
  BarChart3,
  BookOpen,
  Boxes,
  Building2,
  ClipboardCheck,
  ClipboardList,
  Factory,
  FileText,
  Globe,
  HardDrive,
  Image,
  Layers,
  LayoutDashboard,
  LibraryBig,
  MapPin,
  MessageSquare,
  Package,
  PackageCheck,
  PackagePlus,
  Receipt,
  RotateCcw,
  Scale,
  ScanLine,
  Scissors,
  ScrollText,
  Settings,
  ShieldAlert,
  ShoppingCart,
  SlidersHorizontal,
  Tags,
  TrendingUp,
  Truck,
  Route,
  Users,
  Wallet,
  Warehouse,
  Wrench,
} from "lucide-react";

export interface NavItem {
  title: string;
  /** برگ‌ها href دارند؛ هاب‌ها (فقط گروه‌بندی) می‌توانند نداشته باشند. */
  href?: string;
  icon: typeof LayoutDashboard;
  roles: Role[] | "ALL";
  /** فقط برای کاربرانی که پرچم canManageSite دارند */
  site?: boolean;
  /** زیرمجموعه‌ها */
  children?: NavItem[];
}

export interface NavSection {
  title: string;
  icon: typeof LayoutDashboard;
  pinned?: boolean;
  items: NavItem[];
}

export type WorkspaceMode = "ALL" | "SHOPFLOOR" | "COMMERCIAL" | "FINANCE" | "EXECUTIVE";

export interface WorkspaceModeOption {
  key: WorkspaceMode;
  label: string;
  shortLabel: string;
  description: string;
}

export const WORKSPACE_MODES: WorkspaceModeOption[] = [
  {
    key: "ALL",
    label: "همه ماژول‌ها (جامع)",
    shortLabel: "جامع",
    description: "دسترسی به تمامی ماژول‌ها و ابزارهای سازمانی",
  },
  {
    key: "SHOPFLOOR",
    label: "کارگاه و خط تولید",
    shortLabel: "کارگاه",
    description: "مخصوص برش‌کار، اپراتور CNC، مونتاژ، بسته‌بندی و نصاب",
  },
  {
    key: "COMMERCIAL",
    label: "بازرگانی و فروش",
    shortLabel: "فروش",
    description: "مخصوص ویزیتور، فروشندگان، صندوق و ارتباط با مشتریان",
  },
  {
    key: "FINANCE",
    label: "مالی و خزانه‌داری",
    shortLabel: "مالی",
    description: "مخصوص حسابداری، چک‌ها، اسناد و امور مالی قراردادها",
  },
  {
    key: "EXECUTIVE",
    label: "مدیریت ارشد",
    shortLabel: "مدیریت",
    description: "داشبورد پرواز، KPIها، نظارت بر خطوط و سیر سفارشات",
  },
];

/** فیلتر هوشمند بخش‌های سایدبار بر اساس حالت کاری انتخابی */
export function filterNavByWorkspaceMode(
  sections: NavSection[],
  mode: WorkspaceMode,
): NavSection[] {
  if (mode === "ALL") return sections;

  return sections
    .map((sec) => {
      if (sec.pinned) {
        if (mode === "SHOPFLOOR") {
          return {
            ...sec,
            items: sec.items.filter((it) => it.href === "/admin/chat" || it.href === "/admin/inbox"),
          };
        }
        if (mode === "COMMERCIAL" || mode === "FINANCE") {
          return {
            ...sec,
            items: sec.items.filter((it) => it.href === "/admin" || it.href === "/admin/chat" || it.href === "/admin/inbox"),
          };
        }
        return sec;
      }

      if (mode === "SHOPFLOOR") {
        if (sec.title.includes("تولید") || sec.title.includes("انبار")) {
          return {
            ...sec,
            items: sec.items.filter(
              (it) =>
                it.href?.includes("wood-industry") ||
                it.href?.includes("orders/tracking") ||
                it.href?.includes("shop-floor") ||
                it.href?.includes("manufacturing") ||
                it.href?.includes("drivers") ||
                it.href?.includes("labels"),
            ),
          };
        }
        return null;
      }

      if (mode === "COMMERCIAL") {
        if (sec.title.includes("بازرگانی") || sec.title.includes("کاتالوگ")) {
          return sec;
        }
        if (sec.title.includes("تولید")) {
          return {
            ...sec,
            items: sec.items.filter((it) => it.href?.includes("wood-industry") || it.href?.includes("tracking")),
          };
        }
        return null;
      }

      if (mode === "FINANCE") {
        if (sec.title.includes("مالی") || sec.title.includes("خرید") || sec.title.includes("حقوق")) {
          return sec;
        }
        return null;
      }

      if (mode === "EXECUTIVE") {
        if (sec.title.includes("بازرگانی") || sec.title.includes("تولید") || sec.title.includes("مالی") || sec.title.includes("حقوق")) {
          return sec;
        }
        return null;
      }

      return sec;
    })
    .filter((s): s is NavSection => s !== null && s.items.length > 0);
}

/**
 * پیکربندی ماژولار سایدبار کاردو مطابق با استانداردهای بین‌المللی ERP (Odoo, ERPNext, SAP B1, Dynamics 365)
 */
export const NAV_SECTIONS: NavSection[] = [
  // ───────────────────────── بخش ۱: میز کار و پیشخوان اجرایی ─────────────────────────
  {
    title: "",
    icon: LayoutDashboard,
    pinned: true,
    items: [
      {
        title: "داشبورد مدیریت",
        href: "/admin",
        icon: LayoutDashboard,
        roles: ["ADMIN", "MANAGER"],
      },
      {
        title: "کارتابل وظایف",
        href: "/admin/inbox",
        icon: ClipboardCheck,
        roles: ["ADMIN", "MANAGER"],
      },
      {
        title: "پیام‌رسان و چت سازمانی",
        href: "/admin/chat",
        icon: MessageSquare,
        roles: "ALL",
      },
      {
        title: "گزارش‌های تحلیلی و مالی",
        href: "/admin/reports",
        icon: BarChart3,
        roles: ["ADMIN", "MANAGER"],
      },
      {
        title: "هوش تجاری و تصمیم‌گیری (BI)",
        href: "/admin/bi",
        icon: TrendingUp,
        roles: ["ADMIN", "MANAGER"],
      },
    ],
  },

  // ───────────────────────── بخش ۲: بازرگانی و فروش (Sales & CRM) ─────────────────────────
  {
    title: "بازرگانی و فروش",
    icon: Receipt,
    items: [
      {
        title: "صندوق فروشگاهی (POS)",
        href: "/admin/pos",
        icon: ShoppingCart,
        roles: ["ADMIN", "MANAGER", "SALES"],
      },
      {
        title: "مشتریان و پرونده اعتباری",
        href: "/admin/customers",
        icon: Users,
        roles: ["ADMIN", "MANAGER", "SALES"],
      },
      {
        title: "اسناد و فاکتورهای فروش",
        href: "/admin/documents",
        icon: Receipt,
        roles: ["ADMIN", "MANAGER", "SALES"],
      },
      {
        title: "پیش‌فاکتورها و استعلام‌ها",
        href: "/admin/quotations",
        icon: FileText,
        roles: ["ADMIN", "MANAGER", "SALES"],
      },
      {
        title: "مرجوعی‌ها و خدمات فروش",
        href: "/admin/returns",
        icon: RotateCcw,
        roles: ["ADMIN", "MANAGER"],
      },
      {
        title: "خدمات پس از فروش و تعمیرگاه",
        href: "/admin/repairs",
        icon: Wrench,
        roles: ["ADMIN", "MANAGER", "SALES"],
      },
      {
        title: "سفارش‌های آنلاین پرتال",
        href: "/admin/online-orders",
        icon: Globe,
        roles: ["ADMIN", "MANAGER"],
        site: true,
      },
      {
        title: "پیگیری سفارشات و سیر تحویل",
        href: "/admin/orders/tracking",
        icon: Route,
        roles: ["ADMIN", "MANAGER", "SALES"],
      },
    ],
  },

  // ───────────────────────── بخش ۳: خرید و تدارکات (Procurement) ─────────────────────────
  {
    title: "خرید و تأمین کالا",
    icon: PackagePlus,
    items: [
      {
        title: "فاکتورهای خرید",
        href: "/admin/purchases",
        icon: PackagePlus,
        roles: ["ADMIN", "MANAGER"],
      },
      {
        title: "حساب تأمین‌کنندگان",
        href: "/admin/suppliers",
        icon: Building2,
        roles: ["ADMIN", "MANAGER"],
      },
      {
        title: "کسری انبار و سفارش خرید",
        href: "/admin/shortages",
        icon: AlertCircle,
        roles: ["ADMIN", "MANAGER", "STAFF"],
      },
    ],
  },

  // ───────────────────────── بخش ۴: مدیریت انبار و لجستیک (WMS) ─────────────────────────
  {
    title: "انبار و لجستیک (WMS)",
    icon: Warehouse,
    items: [
      {
        title: "موجودی و کاردکس کالا",
        href: "/admin/inventory",
        icon: Boxes,
        roles: ["ADMIN", "MANAGER", "STAFF"],
      },
      {
        title: "قفسه‌بندی و موقعیت‌ها",
        href: "/admin/locations",
        icon: MapPin,
        roles: ["ADMIN", "MANAGER"],
      },
      {
        title: "انتقال بین‌انباری",
        href: "/admin/inventory-transfer",
        icon: ArrowLeftRight,
        roles: ["ADMIN", "MANAGER", "STAFF"],
      },
      {
        title: "انبارگردانی و شمارش",
        href: "/admin/inventory-count",
        icon: ClipboardList,
        roles: ["ADMIN", "MANAGER", "STAFF"],
      },
      {
        title: "لیبل‌ها و چاپ بارکد",
        href: "/admin/labels",
        icon: Tags,
        roles: ["ADMIN", "MANAGER", "STAFF"],
      },
      {
        title: "رانندگان و ناوگان حمل‌ونقل",
        href: "/admin/logistics/drivers",
        icon: Truck,
        roles: ["ADMIN", "MANAGER", "STAFF"],
      },
    ],
  },

  // ───────────────────────── بخش ۵: مدیریت تولید و مهندسی ساخت (MRP) ─────────────────────────
  {
    title: "مدیریت تولید و ساخت",
    icon: Factory,
    items: [
      {
        title: "سفارشات تولید (Job Cards)",
        href: "/admin/manufacturing?tab=orders",
        icon: Factory,
        roles: ["ADMIN", "MANAGER"],
      },
      {
        title: "صنایع چوب و ابعاد برش (MDF)",
        href: "/admin/wood-industry",
        icon: Scissors,
        roles: ["ADMIN", "MANAGER"],
      },
      {
        title: "مانیتور اسکن خط تولید (Kiosk)",
        href: "/admin/shop-floor",
        icon: ScanLine,
        roles: ["ADMIN", "MANAGER", "STAFF"],
      },
      {
        title: "درخت محصول و فرمول ساخت (BOM)",
        href: "/admin/manufacturing?tab=bom",
        icon: Layers,
        roles: ["ADMIN", "MANAGER"],
      },
      {
        title: "ایستگاه‌های کاری و ماشین‌آلات",
        href: "/admin/manufacturing?tab=workstations",
        icon: Wrench,
        roles: ["ADMIN", "MANAGER"],
      },
    ],
  },

  // ───────────────────────── بخش ۶: مالی، حسابداری دوبل و خزانه‌داری ─────────────────────────
  {
    title: "حسابداری و دفاتر مالی",
    icon: Scale,
    items: [
      {
        title: "دفتر روزنامه و اسناد مالی",
        href: "/admin/vouchers",
        icon: ScrollText,
        roles: ["ADMIN", "MANAGER"],
      },
      {
        title: "تراز آزمایشی (۴ و ۸ ستونی)",
        href: "/admin/vouchers?tab=trial-balance",
        icon: Scale,
        roles: ["ADMIN", "MANAGER"],
      },
      {
        title: "دفتر کل و معین (مانده شناور)",
        href: "/admin/vouchers?tab=ledger",
        icon: BookOpen,
        roles: ["ADMIN", "MANAGER"],
      },
      {
        title: "ساختار کدینگ حساب‌ها",
        href: "/admin/vouchers?tab=chart",
        icon: Layers,
        roles: ["ADMIN", "MANAGER"],
      },
      {
        title: "خزانه‌داری، بانک‌ها و چک صیاد",
        href: "/admin/treasury",
        icon: Wallet,
        roles: ["ADMIN", "MANAGER"],
      },
      {
        title: "رسیدهای دریافت وجه نقد",
        href: "/admin/receipts",
        icon: Receipt,
        roles: ["ADMIN", "MANAGER"],
      },
      {
        title: "پرداخت‌ها و تسویه حساب",
        href: "/admin/payouts",
        icon: ArrowLeftRight,
        roles: ["ADMIN", "MANAGER"],
      },
    ],
  },

  // ───────────────────────── بخش ۷: کاتالوگ و مدیریت اقلام ─────────────────────────
  {
    title: "کاتالوگ و محصولات",
    icon: Package,
    items: [
      {
        title: "فهرست کالاها و خدمات",
        href: "/admin/products",
        icon: Package,
        roles: ["ADMIN", "MANAGER", "STAFF"],
      },
      {
        title: "مدیریت قیمت‌ها و لیست قیمت",
        href: "/admin/pricing",
        icon: BadgePercent,
        roles: ["ADMIN", "MANAGER"],
      },
      {
        title: "دسته‌بندی‌ها و مشخصات فنی",
        href: "/admin/base-data",
        icon: LibraryBig,
        roles: ["ADMIN", "MANAGER"],
      },
      {
        title: "تصاویر و آلبوم کالاها",
        href: "/admin/product-images",
        icon: Image,
        roles: ["ADMIN", "MANAGER"],
      },
      {
        title: "صفحهٔ سایت کالاها",
        href: "/admin/site-products",
        icon: Globe,
        roles: ["ADMIN", "MANAGER"],
      },
    ],
  },

  // ───────────────────────── بخش ۸: منابع انسانی، کارگزینی و حقوق و دستمزد (HR) ─────────────────────────
  {
    title: "منابع انسانی و حقوق",
    icon: Users,
    items: [
      {
        title: "پرسنل و احکام کارگزینی",
        href: "/admin/hr",
        icon: Users,
        roles: ["ADMIN", "MANAGER"],
      },
      {
        title: "ساختار و واحدهای سازمانی",
        href: "/admin/hr?tab=departments",
        icon: Building2,
        roles: ["ADMIN", "MANAGER"],
      },
      {
        title: "محاسبه حقوق و فیش (قانون کار)",
        href: "/admin/hr?tab=payroll",
        icon: Scale,
        roles: ["ADMIN", "MANAGER"],
      },
    ],
  },

  // ───────────────────────── بخش ۹: تنظیمات و مدیریت سیستم ─────────────────────────
  {
    title: "تنظیمات و امنیت",
    icon: Settings,
    items: [
      {
        title: "تنظیمات عمومی سازمان",
        href: "/admin/settings",
        icon: Building2,
        roles: ["ADMIN", "MANAGER"],
      },
      {
        title: "کاربران و سطوح دسترسی",
        href: "/admin/users",
        icon: ShieldAlert,
        roles: ["ADMIN"],
      },
      {
        title: "یکپارچه‌سازی و وب‌هوک‌ها",
        href: "/admin/integrations",
        icon: Globe,
        roles: ["ADMIN"],
      },
      {
        title: "پشتیبان‌گیری از پایگاه‌داده",
        href: "/admin/backups",
        icon: HardDrive,
        roles: ["ADMIN"],
      },
      {
        title: "پیکربندی فروشگاه و انبارها",
        href: "/admin/shop-settings",
        icon: SlidersHorizontal,
        roles: ["ADMIN", "MANAGER"],
      },
      {
        title: "قالب‌های پیامک و اعلانات",
        href: "/admin/sms-templates",
        icon: MessageSquare,
        roles: ["ADMIN", "MANAGER"],
      },
    ],
  },
];

/**
 * یک آیتم را برای نقش و دسترسیِ سایت فیلتر می‌کند؛ برای هاب، بازگشتی روی فرزندان.
 * `site: true` بدونِ پرچمِ `canManageSite` این آیتم (و در نتیجه کلِ هاب) را حذف می‌کند.
 */
function itemForRole(
  item: NavItem,
  role: Role,
  canManageSite: boolean
): NavItem | null {
  if (item.children) {
    const kids = item.children
      .map((c) => itemForRole(c, role, canManageSite))
      .filter((c): c is NavItem => c !== null);
    if (!kids.length) return null;
    return { ...item, children: kids };
  }

  if (item.site && !canManageSite) return null;
  if (item.roles === "ALL") return item;
  if (item.roles.includes(role)) return item;
  return null;
}

/**
 * فیلتر منو بر اساس نقش و پرچم سایت.
 * بخش‌های خالی بعد از فیلتر، حذف می‌شوند.
 */
export function filterNavByRole(
  sections: NavSection[],
  role: Role | undefined,
  canManageSite = false
): NavSection[] {
  if (!role) return [];
  return sections
    .map((s) => ({
      ...s,
      items: s.items
        .map((it) => itemForRole(it, role, canManageSite))
        .filter((it): it is NavItem => it !== null),
    }))
    .filter((s) => s.items.length > 0);
}

export function landingPathForRole(role: Role | undefined): string {
  switch (role) {
    case "ADMIN":
    case "MANAGER":
    case "SALES":
      return "/admin";
    case "STAFF":
      return "/admin/inventory";
    default:
      return "/admin";
  }
}

export function isSalesFocused(role: Role | undefined): boolean {
  return role === "SALES";
}

