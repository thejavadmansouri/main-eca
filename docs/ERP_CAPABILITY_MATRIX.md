# ماتریس جامع قابلیت‌های سازمانی (ERP Capability Matrix) — کاردو ERP

این سند نقشه راه و وضعیت دقیق ماژول‌های بیست‌گانه پلتفرم سازمانی کاردو (KARDO ERP) را در مقایسه با پیشروان متن‌باز جهان (ERPNext / Frappe و Odoo Community) تبیین می‌کند.

---

## ۱. جدول ماتریس جامع ماژول‌ها و مقایسه عملکردی

| حوزه سازمانی (Domain) | وضعیت فعلی در کاردو | مرجع در ERPNext | مرجع در Odoo | منبع بازاستفاده پیشنهادی | استراتژی پیاده‌سازی | اولویت اجرایی |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **A. هسته پلتفرم (ERP Core)** | شرکت واحد، نقش‌های کاربری، تنظیمات پایه فروشگاه | Multi-company, DocType, Roles & Permissions | Res.Company, Groups, Ir.Model | فراپه / معماری ماژولار بومی کاردو | تعمیم مدل سازمان به چندشرکته و شعبه‌محور در Prisma | **بسیار بالا (Wave 1)** |
| **B. مدیریت ارتباط با مشتری (CRM)** | پایگاه مشتریان، تلفن‌ها، تاریخچه خرید، یادداشت‌ها | CRM Lead, Opportunity, Pipeline | Crm.Lead, Stage, Team | Frappe CRM (MIT) | افزودن پایپ‌لاین سرنخ‌ها و فرصت‌های فروش | **بالا (Wave 2)** |
| **C. فروش و قراردادها (Sales)** | پیش‌فاکتور، فاکتور، مرجوعی، تخفیفات، قیمت‌گذاری سطحی | Sales Order, Delivery Note, Sales Invoice | Sale.Order, Invoice, Pricing | الگوی فرآیندی ERPNext | تکمیل جریان استعلام ➔ پیش‌فاکتور ➔ سفارش ➔ حواله | **بسیار بالا (Wave 2)** |
| **D. حسابداری و مالی (Accounting)** | سند روزنامه (`Voucher`)، کاردکس مشتری، تسویه‌ها | General Ledger, Chart of Accounts, Journal | Account.Move, Account.Account | کدینگ حسابداری استاندارد ایران + منطق دوبل | پیاده‌سازی درختواره کل/معین/تفصیلی و گزارشات تراز | **بسیار بالا (Wave 2)** |
| **E. خزانه‌داری (Treasury)** | ثبت چک صیادی، صندوق نقدی، وضعیت‌های وصول/برگشت | Payment Entry, Bank Clearance | Account.Payment, Bank Statement | بومی ایرانی (سامانه پیچک/صیاد) | تکمیل خواباندن به حساب، خرج چک و مغایرت‌گیری بانکی | **بالا (Wave 2)** |
| **F. خرید و تدارکات (Purchasing)** | فاکتور خرید، تأمین‌کنندگان، قیمت خرید از فاکتور | Material Request, Purchase Order, Receipt | Purchase.Order, Purchase.Requisition | الگوی خرید ERPNext | سیستم درخواست خرید (PR) و مقایسه استعلام قیمت | **بالا (Wave 2)** |
| **G. انبارداری و لجستیک (WMS)** | ماتریس قفسه‌بندی چند سطحی، کاردکس تغییرناپذیر، جابجایی | Stock Entry, Warehouse, Batch, Serial | Stock.Picking, Stock.Location | هسته بومی کاردو (بسیار قوی‌تر از پیش‌فرض Odoo) | تکمیل روش‌های ارزیابی انبار (FIFO / میانگین موزون) | **پایه‌ای (موجود - تقویت در Wave 2)** |
| **H. تولید و بهای تمام‌شده (Manufacturing)** | ماژول پایه‌ای تبدیل، بدون درخت محصول و برنامه‌ریزی | BOM, Work Order, Routing, Scrap, MRP | Mrp.Bom, Mrp.Production, Workcenter | مدل داده‌ای Frappe ERPNext BOM | پیاده‌سازی فرمول ساخت (BOM)، سفارش کار و بهای تمام‌شده | **بالا (Wave 3 - سناریو MDF)** |
| **I. کنترل کیفیت (Quality Control)** | بررسی چشمی مرجوعی، بدون چک‌لیست رسمی کیفی | Quality Inspection, Quality Action | Quality.Check, Quality.Alert | چک‌لیست‌های بازرسی Odoo | افزودن فرم بازرسی ورود مواد اولیه و محصول تولیدی | **متوسط (Wave 3)** |
| **J. نگهداری و تعمیرات (Maintenance)** | پیگیری دستی دستگاه‌ها | Maintenance Schedule, Equipment | Maintenance.Equipment, Request | الگوی نگهداری پیشگیرانه (PM) | تعریف دارایی‌ها و زمان‌بندی سرویس ماشین‌آلات | **متوسط (Wave 3)** |
| **K. منابع انسانی و حقوق و دستمزد (HRMS)** | لیست کاربران و تخصیص وظایف انباردار | Frappe HRMS (Employee, Attendance, Payroll) | Hr.Employee, Hr.Attendance, Payslip | Frappe HRMS (MIT) به عنوان الگوی داده | ماژول پرونده پرسنلی، احکام، مرخصی و فیش حقوقی | **متوسط (Wave 4)** |
| **L. مدیریت پروژه‌ها (Projects)** | وظایف کاری (`WorkTask`) و تسک‌های جمع‌آوری | Project, Task, Timesheet, Milestone | Project.Project, Project.Task | الگوی پروژه‌محور Frappe | توسعه گانت‌چارت، ثبت ساعات کار و هزینه پروژه | **متوسط (Wave 4)** |
| **M. خدمات و تیکتینگ (Helpdesk)** | ارسال پیامک و اطلاع‌رسانی | Frappe Helpdesk, Issue, SLA | Helpdesk.Ticket, SLA.Policy | Frappe Helpdesk (MIT) | پرتال تیکت و ثبت درخواست‌های گارانتی و تعمیرات | **متوسط (Wave 4)** |
| **N. بازاریابی و کمپین (Marketing)** | ارسال پیامک انبوه و قالب‌های پیامکی | Newsletter, Campaign, Lead Source | Mass.Mailing, Marketing.Campaign | سیستم بومی با درگاه‌های SMS ایران (کاوه نگار و...) | موتور اتوماسیون ارسال پیامک و کمپین‌های دوره‌ای | **متوسط (Wave 5)** |
| **O. مدیریت اسناد (DMS)** | پیوست تصاویر کالا و تصاویر بارکد | File Manager, Attachment, Versioning | Document.Folder, Document.Share | پکیج‌های استاندارد S3 / Local MinIO | بایگانی مدارک پیوست فاکتورها و اسناد قرارداد | **بالا (Wave 1/2)** |
| **P. همکاری سازمانی (Collaboration)** | پیام‌های زنده با وب‌سوکت برای نوتیفیکیشن‌ها | Chat, Activity, Calendar, Notification | Mail.Thread, Calendar.Event | موتور سوکت و اعلان درون‌برنامه‌ای کاردو | مرکز اعلان‌های سراسری، تقویم کاری و چت داخلی | **بالا (Wave 1)** |
| **Q. فروشگاه آنلاین و پرتال (E-commerce)** | فرانت‌اند `apps/site` و پرتال `kardo-b2b` | Webshop, Customer Portal, Cart | Website.Sale, Customer Portal | بومی Next.js 16 در ساختار مخزن کاردو | هماهنگی بلادرنگ سبد خرید، قیمت‌ها و موجودی | **موجود (تکمیل در Wave 5)** |
| **R. هوش تجاری و گزارش‌ساز (BI)** | گزارشات آماری فروش و ورود/خروج کالا | Frappe Insights, Query Report, Dashboard | Dashboards, Spreadsheet | Chart.js / Recharts با کوئری‌های بهینه‌شده | داشبوردهای نقش‌محور متراکم و فیلترپذیر | **بالا (Wave 1/2)** |
| **S. اتوماسیون و گردش کار (Automation)** | عملیات دوره‌ای با NestJS Schedule | Server Scripts, Workflow, Auto-repeat | Base.Automation, Automated Actions | BullMQ / Redis Event Queue | موتور اجرای رویدادمحور و تایید اسناد چندمرحله‌ای | **بالا (Wave 1)** |
| **T. سفارشی‌سازی و توسعه (Customization)** | تنظیمات فروشگاه و پیکربندی سخت‌افزار | Custom Field, Custom DocType, Webhooks | Studio, Custom Fields, Webhooks | ساختار JSON Schema برای فیلدهای سفارشی | امکان تعریف فیلدهای دلخواه در جداول پایه بدون تغییر کد | **بالا (Wave 1)** |

---

## ۲. اولویت‌بندی اجرایی و معیارهای پذیرش (Acceptance Criteria)

### اولویت ۱: ارکان اساسی Wave 1 (هسته، پوسته و استانداردهای رابط کاربری)
- **پوسته یکپارچه (Shell):** تمام ماژول‌ها باید داخل پوسته اختصاصی کاردو با نوار کناری تاشو، جستجوی سراسری (Command Palette)، ناوبری روان و هدر سازمانی اجرا شوند.
- **داشبوردهای نقش‌محور:** بدون استفاده از اعداد فیک، مبتنی بر شاخص‌های کلیدی عملکرد واقعی دیتابیس.
- **جدول داده‌های پیشرفته (Data Table Pattern):** سورت، فیلتر، تغییر ستون‌ها، خروجی اکسل و پیجینیشن کاملاً فارسی و راست‌چین.

### اولویت ۲: جریان پیوسته Wave 2 و سناریوی نمایشی Wave 3 (تولید MDF)
- تسلسل منطقی و یکپارچه: **مشتری ➔ پیش‌فاکتور ➔ سفارش فروش ➔ فرمول ساخت (BOM) ➔ حواله انبار چوب و ورق ➔ تولید و کنترل کیفیت ➔ رسید محصول آماده ➔ تحویل ➔ فاکتور رسمی ➔ ثبت اتوماتیک اسناد دوبل در دفاتر مالی**.
