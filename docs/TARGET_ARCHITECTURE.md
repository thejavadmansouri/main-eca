# سند معماری هدف پلتفرم (Target Architecture) — کاردو ERP

این سند معماری بلندمدت و استانداردهای مهندسی کاردو ERP را برای تبدیل شدن به یک سیستم پایدار، امن و در کلاس جهانی تبیین می‌کند.

---

## ۱. نمای کلی سیستم و نمودار معماری (System Topology)

```mermaid
graph TD
    subgraph ClientLayer ["لایه کلاینت‌ها و کاربران"]
        WebAdmin["پرتال وب و پرسنل (Next.js 16 + React 19)"]
        B2BPortal["پرتال مشتریان عمده و نمایندگی‌ها"]
        DesktopApp["کلاینت دسکتاپ فروشگاه و صندوق (Tauri + Rust)"]
        MobileApp["اپلیکیشن PDA انبارداری (Android Native Kotlin)"]
    end

    subgraph GatewayLayer ["درگاه ارتباطی و پوسته"]
        ReverseProxy["Reverse Proxy / Nginx / Node Layer"]
        AuthGuard["JWT / Session Cookie / RBAC Guard"]
        RateLimiter["Throttler / DDOS Protection"]
    end

    subgraph ServiceLayer ["هسته ماژولار کاردو (NestJS Modular Monolith)"]
        CoreModule["ماژول هسته: شرکت‌ها، شعب، کاربران، تنظیمات"]
        AccountingEngine["موتور حسابداری دوبل: کل، معین، تفصیلی، دفاتر"]
        InventoryEngine["موتور متمرکز انبار (WMS): لاگ تغییرناپذیر و ماتریس قفسه"]
        SalesModule["فروش و قراردادها: پیش‌فاکتور، سفارش، فاکتور، مرجوعی"]
        PurchaseModule["خرید و زنجیره تأمین: درخواست خرید، فاکتور خرید"]
        ManufacturingModule["تولید و بهای تمام‌شده: درخت محصول (BOM)، سفارش کار"]
        CRMModule["ارتباط با مشتری: سرنخ‌ها، پایپ‌لاین و اعتبارسنجی"]
        TreasuryModule["خزانه‌داری: چک صیادی، صندوق، بانک، مغایرت‌گیری"]
        PrintService["سرویس پرینت حرارتی، رول و چاپ لیبل بارکد"]
    end

    subgraph EventAndJobs ["موتور رویدادها و وظایف پس‌زمینه"]
        EventBus["Transactional Outbox / Domain Event Bus"]
        JobScheduler["NestJS Schedule / Task Runner"]
    end

    subgraph DataLayer ["لایه پایگاه داده و ذخیره‌سازی"]
        PostgresDB[(پایگاه داده اصلی PostgreSQL 16+)]
        PrismaORM["Prisma Data Access & Migrations"]
        LocalStorage["فایل‌های مدیا و بایگانی مدارک (Local / S3)"]
    end

    WebAdmin --> GatewayLayer
    B2BPortal --> GatewayLayer
    DesktopApp --> GatewayLayer
    MobileApp --> GatewayLayer

    GatewayLayer --> ServiceLayer
    ServiceLayer --> EventAndJobs
    ServiceLayer --> PrismaORM
    PrismaORM --> PostgresDB
    ServiceLayer --> LocalStorage
```

---

## ۲. اصول یکپارچگی داده و تراکنش‌ها (Data Integrity Principles)

1. **انزوای مالی و انبارداری (Transactional ACID Boundaries):**
   هرگونه عملیات تأثیرگذار بر موجودی انبار یا تراز مالی باید درون یک تراکنش تعهدشده (`$transaction`) پایگاه‌داده اجرا شود. در صورت بروز هرگونه خطا در زنجیره، کل سند به وضعیت قبل بازمی‌گردد.
2. **الگوی ثبت تغییرناپذیر (Immutable Event Ledger):**
   هیچ سطری در کاردکس انبار (`InventoryLog`) یا اسناد حسابداری نهایی‌شده قابل به‌روزرسانی (Update) مستقیم نیست. اصلاح اشتباهات حسابداری یا انبارداری صرفاً از طریق صدور **سند اصلاحی یا سند معکوس (Reversal Document)** انجام می‌شود.
3. **پشتیبانی کامل از واحد پولی رسمی (تومان/ریال):**
   تمامی مبالغ مالی در پایگاه داده با دقت اعشاری (`Decimal`) ذخیره شده و نمایش‌ها در سراسر رابط کاربری با فرمت شفاف **تومان** با امکان مشاهده ریز ریالی انجام می‌پذیرد.
4. **طراحی چندشرکتی و چندشعبه‌ای (Multi-Company & Multi-Branch):**
   تمامی اسناد، فاکتورها، حساب‌ها و انبارها به یک شناسه شرکت (`CompanyId`) و شعبه (`BranchId`) متصل هستند تا سیستم توان مدیریت چند هلدینگ یا شرکت زیرمجموعه را داشته باشد.
