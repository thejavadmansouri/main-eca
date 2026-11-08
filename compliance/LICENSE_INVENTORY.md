# موجودی لایسنس وابستگی‌های پروژه (License Inventory)

این سند وضعیت لایسنس پکیج‌های شخص ثالث (Third-Party Dependencies) موجود در مخزن کاردو ERP را ثبت می‌کند.

## ۱. وابستگی‌های اصلی سرور (apps/api)
- `@nestjs/*`: MIT License
- `@prisma/client` / `prisma`: Apache 2.0 License
- `argon2`: MIT License
- `bcrypt`: MIT License
- `class-validator` / `class-transformer`: MIT License
- `sharp`: Apache 2.0 License
- `undici`: Apache 2.0 License
- `ws`: MIT License
- `xlsx`: Apache 2.0 (SheetJS Community Edition)

## ۲. وابستگی‌های اصلی فرانت‌اند (apps/web)
- `next` / `react` / `react-dom`: MIT License
- `@radix-ui/*`: MIT License
- `@tanstack/react-table` / `@tanstack/react-query`: MIT License
- `tailwindcss` / `@tailwindcss/postcss`: MIT License
- `lucide-react`: ISC License (کاملاً سازگار با MIT)
- `recharts`: MIT License
- `date-fns`: MIT License
- `framer-motion`: MIT License
- `sonner`: MIT License
- `cmdk`: MIT License

## ۳. نتیجه‌گیری ممیزی لایسنس‌ها
۱۰۰٪ پکیج‌های مورد استفاده در کدهای تولیدی (Production) تحت لایسنس‌های مجاز **MIT**, **Apache 2.0**, و **ISC** هستند و هیچ وابستگی مستقیم با لایسنس محدودکننده کپی‌لفت قوی (مانند GPL یا AGPL) در هسته اپلیکیشن وجود ندارد.
