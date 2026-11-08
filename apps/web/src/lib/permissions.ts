import type { User, Role } from "./types";

export interface PermissionItem {
  key: string;
  label: string;
  description: string;
}

export interface PermissionGroup {
  id: string;
  title: string;
  icon: string;
  color: string;
  permissions: PermissionItem[];
}

export const PERMISSION_GROUPS: PermissionGroup[] = [
  {
    id: "inventory",
    title: "انبارداری، کالاها و موقعیت‌ها",
    icon: "Package",
    color: "text-amber-600 bg-amber-500/10 border-amber-500/30",
    permissions: [
      {
        key: "inventory:view",
        label: "مشاهده موجودی و کاردکس کالاها",
        description: "دسترسی به فهرست موجودی، قفسه‌ها و گردش کاردکس انبار",
      },
      {
        key: "inventory:manage",
        label: "ورود، خروج و انتقال کالا بین انبارها",
        description: "ثبت اسناد انتقال، تعدیل موجودی و جانمایی روی قفسه",
      },
      {
        key: "inventory:count",
        label: "انبارگردانی و مغایرت‌گیری",
        description: "ایجاد سرفصل انبارگردانی، شمارش فیزیکی و ثبت مغایرت",
      },
      {
        key: "products:manage",
        label: "تعریف کالا، دسته‌بندی و بارکد",
        description: "تعریف کالای جدید، ویرایش کاتالوگ و چاپ برچسب بارکد",
      },
    ],
  },
  {
    id: "sales",
    title: "فروش، فاکتور و صندوق POS",
    icon: "Receipt",
    color: "text-emerald-600 bg-emerald-500/10 border-emerald-500/30",
    permissions: [
      {
        key: "sales:pos",
        label: "صندوق فروش سریع (POS) و نوبت‌دهی",
        description: "فروش پشت پیشخوان، صدور فیش و تسویه نقدی/کارتخوان",
      },
      {
        key: "sales:invoices",
        label: "مدیریت فاکتورهای فروش و پیش‌فاکتور",
        description: "مشاهده، ثبت و صدور فاکتورهای رسمی و پیش‌فاکتور",
      },
      {
        key: "sales:returns",
        label: "مرجوعی از فروش و لغو سند",
        description: "ثبت برگشت از فروش، ابطال و اصلاح فاکتورها",
      },
      {
        key: "sales:discount",
        label: "اعمال تخفیف ویژه و تغییر قیمت پایه",
        description: "مجوز ثبت تخفیف‌های بالای سقف یا تغییر دستی قیمت فروش",
      },
    ],
  },
  {
    id: "wood",
    title: "تولید، صنایع چوب و نصاب‌ها",
    icon: "Factory",
    color: "text-indigo-600 bg-indigo-500/10 border-indigo-500/30",
    permissions: [
      {
        key: "wood:orders",
        label: "سفارشات ساخت و کابینت B2B/B2C",
        description: "ثبت پروژه، تخصیص نصاب و ره‌گیری ساخت سفارشات",
      },
      {
        key: "wood:shop_floor",
        label: "تایید مراحل خط تولید کارگاه",
        description: "تایید ایستگاه‌های برش، لبه‌چسبانی، CNC، مونتاژ و رنگ",
      },
      {
        key: "wood:installations",
        label: "مدیریت اعزام، بارگیری و نصاب‌ها",
        description: "ثبت زمان‌بندی اعزام، چک‌لیست نصب در محل و امضای تحویل",
      },
      {
        key: "wood:cutting",
        label: "لیست ابعاد برش و لیبل‌های قطعات",
        description: "مشاهده Cutting List و چاپ برچسب بارکدی پروفیل و شیشه",
      },
    ],
  },
  {
    id: "treasury",
    title: "خزانه‌داری، چک‌ها و حسابداری",
    icon: "CreditCard",
    color: "text-sky-600 bg-sky-500/10 border-sky-500/30",
    permissions: [
      {
        key: "treasury:view",
        label: "مشاهده حساب‌های بانکی و صندوق",
        description: "مشاهده مانده بانک‌ها، تنخواه‌گردان و صورتحساب‌ها",
      },
      {
        key: "treasury:manage",
        label: "ثبت تراکنش‌های مالی و چک‌های صیادی",
        description: "واریز، برداشت، ثبت و واگذاری چک‌های دریافتی/پرداختی",
      },
      {
        key: "vouchers:manage",
        label: "اسناد حسابداری و تراز مالی",
        description: "ثبت سند دوبل حسابداری، تراز آزمایشی و سود و زیان",
      },
    ],
  },
  {
    id: "hr",
    title: "کارگزینی، احکام و حقوق دستمزد",
    icon: "Users",
    color: "text-purple-600 bg-purple-500/10 border-purple-500/30",
    permissions: [
      {
        key: "hr:view",
        label: "مشاهده پرونده‌های پرسنلی",
        description: "دسترسی به فهرست کارکنان و پروفایل اختصاصی پرسنل",
      },
      {
        key: "hr:manage",
        label: "ثبت پرسنل و صدور احکام کارگزینی",
        description: "ثبت قرارداد، صدور احکام ارتقا، افزایش سالانه و چاپ فرم A4",
      },
      {
        key: "hr:payroll",
        label: "محاسبه حقوق، دیسکت بیمه و پایا",
        description: "صدور فیش، دانلود دیسکت بیمه (DSK) و فایل واریز شبا بانکی",
      },
    ],
  },
  {
    id: "commercial",
    title: "مشتریان، خرید و بازرسی بار",
    icon: "Truck",
    color: "text-teal-600 bg-teal-500/10 border-teal-500/30",
    permissions: [
      {
        key: "customers:manage",
        label: "مدیریت مشتریان و سقف اعتبار",
        description: "ثبت مشتری B2B/B2C، سقف اعتبار دفتری و دفتر معین",
      },
      {
        key: "purchases:manage",
        label: "فاکتورهای خرید و تامین‌کنندگان",
        description: "ثبت فاکتور خرید، مدیریت فروشندگان و بدهی‌ها",
      },
      {
        key: "inbound:verify",
        label: "بازرسی کیفی و تاییدیه ورود بار",
        description: "کنترل کیفی محموله پشت درب انبار و ترخیص بارنامه",
      },
    ],
  },
  {
    id: "reports",
    title: "گزارشات و هوش تجاری (BI)",
    icon: "TrendingUp",
    color: "text-blue-600 bg-blue-500/10 border-blue-500/30",
    permissions: [
      {
        key: "reports:view",
        label: "مشاهده گزارشات جامع مدیریتی",
        description: "گزارش سود و زیان، کالاهای راکد، فروشنده برتر و نمودارهای تحلیلی",
      },
    ],
  },
  {
    id: "system",
    title: "تنظیمات و مدیریت سیستم",
    icon: "ShieldAlert",
    color: "text-rose-600 bg-rose-500/10 border-rose-500/30",
    permissions: [
      {
        key: "users:manage",
        label: "مدیریت کاربران و تعیین سطوح دسترسی",
        description: "ایجاد حساب کاربری، تغییر رمز و تنظیم دسترسی‌های پرسنل",
      },
      {
        key: "system:settings",
        label: "تنظیمات پایه و پشتیبان‌گیری",
        description: "پشتیبان‌گیری پایگاه داده، اطلاعات شرکت و پیکربندی سخت‌افزار",
      },
    ],
  },
];

/** الگوهای پیش‌فرض سطح دسترسی برای نقش‌های مختلف سازمانی */
export const PERMISSION_PRESETS: Array<{
  id: string;
  name: string;
  role: Role;
  permissions: string[];
}> = [
  {
    id: "warehouse_keeper",
    name: "انباردار و تحویل‌دار",
    role: "STAFF",
    permissions: [
      "inventory:view",
      "inventory:manage",
      "inventory:count",
      "inbound:verify",
      "purchases:manage",
      "wood:shop_floor",
    ],
  },
  {
    id: "cashier_sales",
    name: "صندوق‌دار و فروشنده",
    role: "SALES",
    permissions: [
      "sales:pos",
      "sales:invoices",
      "inventory:view",
      "customers:manage",
    ],
  },
  {
    id: "accountant",
    name: "حسابدار و مدیر مالی",
    role: "MANAGER",
    permissions: [
      "treasury:view",
      "treasury:manage",
      "vouchers:manage",
      "sales:invoices",
      "sales:returns",
      "customers:manage",
      "hr:payroll",
      "reports:view",
    ],
  },
  {
    id: "workshop_lead",
    name: "سرپرست کارگاه و تولید",
    role: "STAFF",
    permissions: [
      "wood:orders",
      "wood:shop_floor",
      "wood:cutting",
      "wood:installations",
      "inventory:view",
    ],
  },
  {
    id: "installer_lead",
    name: "سرپرست تیم نصب و میدانی",
    role: "STAFF",
    permissions: ["wood:installations", "wood:shop_floor"],
  },
  {
    id: "hr_specialist",
    name: "کارشناس کارگزینی و منابع انسانی",
    role: "STAFF",
    permissions: ["hr:view", "hr:manage", "hr:payroll"],
  },
  {
    id: "internal_manager",
    name: "مدیر اجرایی و شعب",
    role: "MANAGER",
    permissions: [
      "inventory:view",
      "inventory:manage",
      "inventory:count",
      "products:manage",
      "sales:pos",
      "sales:invoices",
      "sales:returns",
      "sales:discount",
      "wood:orders",
      "wood:shop_floor",
      "wood:installations",
      "wood:cutting",
      "treasury:view",
      "hr:view",
      "customers:manage",
      "inbound:verify",
      "reports:view",
    ],
  },
  {
    id: "super_admin",
    name: "مدیر ارشد سیستم (دسترسی کامل)",
    role: "ADMIN",
    permissions: [
      "inventory:view",
      "inventory:manage",
      "inventory:count",
      "products:manage",
      "sales:pos",
      "sales:invoices",
      "sales:returns",
      "sales:discount",
      "wood:orders",
      "wood:shop_floor",
      "wood:installations",
      "wood:cutting",
      "treasury:view",
      "treasury:manage",
      "vouchers:manage",
      "hr:view",
      "hr:manage",
      "hr:payroll",
      "customers:manage",
      "purchases:manage",
      "inbound:verify",
      "reports:view",
      "users:manage",
      "system:settings",
    ],
  },
];

/** اعتبارسنجی سطح دسترسی کاربر */
export function hasPermission(
  user: User | null | undefined,
  requiredPermission: string,
): boolean {
  if (!user) return false;
  // مدیر ارشد دسترسی نامحدود به تمامی بخش‌ها دارد
  if (user.role === "ADMIN") return true;

  const perms = user.permissions;
  if (!perms || !Array.isArray(perms)) return false;

  return perms.includes(requiredPermission) || perms.includes("*");
}
