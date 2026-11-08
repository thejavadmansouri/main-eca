# ممیزی جامع مخزن و ساختار فنی (Repository Audit) — کاردو ERP

**مخزن:** `thejavadmansouri/main-eca`  
**تاریخ ممیزی:** ۸ نوامبر ۲۰۲۶  
**تیم ممیزی:** معمار ارشد سیستم، لید DevOps و مهندس ارشد پایگاه‌داده

---

## ۱. تایید پشته فناوری (Technology Stack Verification)

بررسی دقیق ساختار کدهای موجود در مخزن نشان می‌دهد که پشته فناوری به شرح زیر است و هیچ نیازی به تغییر بنیادین در زبان‌ها و فریم‌ورک‌های اصلی وجود ندارد:

| لایه سیستم | فناوری‌های استفاده‌شده | وضعیت سلامت فنی |
| :--- | :--- | :--- |
| **هسته سرویس‌دهنده (Backend API)** | NestJS 11, TypeScript 5.8, Express, WebSockets (`ws`), RxJS | کاملاً پایدار، سازمان‌یافته به صورت ماژولار در ۴۲ ماژول مجزا. |
| **دسترسی به داده و پایگاه‌داده** | PostgreSQL, Prisma ORM 6.19 | ۸۵ مدل رابطه‌ای تعریف‌شده، مایگریشن‌های ساختاریافته، رعایت ایزولاسیون تراکنش‌ها در عملیات انبارداری. |
| **رابط کاربری وب و پرتال ادمین** | Next.js 16 (App Router), React 19, Tailwind CSS v4, Radix UI Primitives, TanStack Table, Lucide Icons | مدرن، تایپ‌چک ۱۰۰٪ بدون خطا، ساختار RTL در صفحات اصلی. |
| **اپلیکیشن همراه انباردار (Mobile)** | Android Native (Kotlin, Jetpack, CameraX, Barcode Scanner) | پایدار، مناسب برای تبلت و دستگاه‌های بارکداسکنر صنعتی (PDA). |
| **اپلیکیشن فروشگاهی دسکتاپ (POS)** | Tauri (Rust + Web frontend) | بسیار سبک (مصرف رم زیر ۶۰ مگابایت)، بدون وابستگی به Electron سنگین. |
| **مدیریت پکیج‌ها و ورک‌اسپیس** | npm Workspaces (`apps/*`, `packages/*`) | ساختار تمیز، بسته مشترک `shared-types`. |

---

## ۲. ممیزی پایگاه‌داده و مدل‌های داده (Data Architecture)

مدل‌های پایگاه داده در مسیر `apps/api/prisma/schema.prisma` شامل **۸۵ مدل** به شرح زیر می‌باشند:

1. **مدیریت کاربران و دسترسی‌ها:** `User`, `ShopSettings`, `AuditLog`, `BackupConfig`, `BackupRun`.
2. **اطلاعات پایه و کاتالوگ تخصصی خودرو:** `Category`, `Brand`, `Supplier`, `VehicleModel`, `PartCatalog`, `Product`, `ProductVehicle`, `ProductBarcode`, `ProductPrice`, `Asset`.
3. **انبارداری ماتریسی و مکانیزه (WMS):** `Warehouse`, `LocationType`, `Location`, `Inventory`, `InventoryLog`, `InventorySession`, `InventorySessionLocation`, `InventoryCount`, `InventoryItem`, `ItemBarcode`, `PickTask`, `WorkTask`.
4. **خرید و زنجیره تأمین:** `PurchaseInvoice`, `ProductCreationRequest`, `ProductShortage`.
5. **فروش، صندوق و اسناد مالی:** `SaleInvoice`, `Payment`, `PaymentReversal`, `OpenAccount`, `Cheque`, `Receipt`, `ReceiptPayment`, `CustomerLedger`, `ReceiptAllocation`, `CustomerPayout`, `SaleReturn`, `SaleReturnLine`, `Quotation`, `BlankQuotation`.
6. **مشتریان و بازاریابی:** `Customer`, `CustomerCategory`, `CustomerPhone`, `SmsTemplate`, `SmsMessage`.
7. **حسابداری پایه و دفاتر:** `Voucher`, `VoucherLine`, `AccountingSync`.
8. **سخت‌افزار و چاپ:** `LabelSettings`, `PrintJob`, `PrintJobItem`.
9. **فروشگاه اینترنتی و تعاملات آنلاین:** `SiteCustomer`, `OnlineOrder`, `OnlineOrderLine`, `Coupon`, `Banner`, `StockNotify`, `ShopContent`.

### نقاط قوت معماری داده:
- **قانون تغییرناپذیری لاگ انبارداری (Ledger Integrity):** تمامی افزایش یا کاهش‌های موجودی از طریق `InventoryOperationService` انجام شده و مستقیماً در جدول `InventoryLog` لاگ غیرقابل‌دستکاری می‌اندازند.
- **تفکیک قیمت و کالا:** جدول `ProductPrice` سوابق تاریخی قیمت‌ها را بر اساس نوع قیمت نگهداری می‌کند.

---

## ۳. ممیزی ماژول‌های بک‌اند (API Modules)

پروژه `apps/api/src` دارای **۴۲ ماژول** است. نقاط کلیدی معماری سرویس‌ها:
- **احراز هویت و مجوزها:** مبتنی بر Passport JWT و Argon2 برای هش کلمات عبور. نقش‌های تعریف‌شده: `ADMIN`, `CASHIER`, `WAREHOUSE_OPERATOR`, `ACCOUNTANT`, `SELLER`.
- **کنترل نرخ درخواست‌ها (Throttling):** فعال‌سازی `@nestjs/throttler` بر روی اندپوینت‌های عمومی و فروشگاه اینترنتی.
- **سیستم رویدادهای زنده:** ماژول `realtime` با پشتیبانی از WebSocket برای بروزرسانی لحظه‌ای کاردکس و سفارشات.

---

## ۴. ممیزی فرانت‌اند و رابط کاربری (Frontend & UX)

- **صفحات مدیریت (`apps/web/src/app/admin`):** دارای ۳۸ صفحه عملیاتی شامل انبارداری، فاکتورها، مرجوعی، چک‌ها، دسته‌بندی‌ها و گزارشات.
- **کامپوننت‌های پایه:** بر مبنای مجموعه‌ای از کامپوننت‌های Radix UI و کامپوننت‌های محلی.
- **وضعیت کنونی رابط کاربری:** رابط کاربری کنونی کاراست اما تا حدی حالت داشبورد ادمین سنتی دارد و از استانداردهای یکپارچه سیستم‌های ERP پیشرفته (نظیر فرم‌های متراکم دو مرحله‌ای، درختواره‌های تعاملی، پالت رنگی حرفه‌ای شرکتی) فاصله دارد که در فاز ۲ به صورت اساسی بازطراحی خواهد شد.

---

## ۵. ارزیابی آزمون‌ها و کیفیت کد (Tests & Quality Gates)

- **وضعیت تایپ‌ها:** `npm run typecheck` با موفقیت کامل و بدون کوچک‌ترین خطا پاس می‌شود.
- **تعداد فایل‌های تست واحد:** ۵۰ فایل تست استاندارد (`.spec.ts`) در بخش‌های کلیدی مالی، انبارداری و قیمت‌گذاری موجود است.
- **گیت‌های اعتبارسنجی:** پروژه دارای اسکریپت‌های صحت‌سنجی در ریشه و پکیج‌هاست.

---

## ۶. تحلیل بدهی‌های فنی و ریسک‌ها (Technical Debt Inventory)

1. **دستور مخرب `db:push` در وب:** در فایل `apps/web/package.json` خط ۱۱ اسکریپت `"db:push": "prisma db push --accept-data-loss"` درج شده بود که خلاف موازین ایمنی دیتابیس سازمانی است و باید فوراً حذف یا جایگزین شود.
2. **فایل‌های باینری و لاگ‌های تست در ریشه مخزن:** برخی فایل‌های لاگ محلی یا دامپ‌های آزمایشی در پوشه ریشه دیده می‌شوند که برای پاکیزگی پروژه باید به مسیرهای استاندارد انتقال یابند.
3. **تمرکز بیش از حد منطق مالی روی اشخاص به جای ساختار کامل حسابداری دوبل:** کاردو در حال حاضر دارای دفتر کل و اسناد مالی (`Voucher`) اولیه است، اما سرفصل‌های جامع کل و معین و تراز آزمایشی ۴ ستونی باید تکمیل گردند تا جایگزین نرم‌افزارهای خارجی مثل سپیدار یا پارسیان شود.
