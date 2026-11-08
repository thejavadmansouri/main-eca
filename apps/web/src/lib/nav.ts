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
  ScrollText,
  Settings,
  ShieldAlert,
  ShoppingCart,
  SlidersHorizontal,
  Tags,
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
        title: "گزارش‌های تحلیلی و مالی",
        href: "/admin/reports",
        icon: BarChart3,
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
        title: "سفارش‌های آنلاین پرتال",
        href: "/admin/online-orders",
        icon: Globe,
        roles: ["ADMIN", "MANAGER"],
        site: true,
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
        title: "خزانه‌داری و دریافت‌ها",
        href: "/admin/receipts",
        icon: Wallet,
        roles: ["ADMIN", "MANAGER"],
      },
      {
        title: "پرداخت‌ها و چک‌های صیادی",
        href: "/admin/payouts",
        icon: Receipt,
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

  // ───────────────────────── بخش ۸: تنظیمات و مدیریت سیستم ─────────────────────────
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
    case "SALES":
    case "ADMIN":
    case "MANAGER":
      return "/admin/pos";
    case "STAFF":
      return "/admin/inventory";
    default:
      return "/admin";
  }
}

export function isSalesFocused(role: Role | undefined): boolean {
  return role === "SALES";
}

