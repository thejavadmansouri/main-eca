import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { SESSION_COOKIE, verifySession } from "@/lib/session";
import { MarketTicker } from "@/components/ui/market-ticker";

export const instant = false;

/*
 * صفحه اصلی کاردو B2B
 * طراحی آرامش‌بخش، تمیز، روان و یکپارچه با دیزاین سیستم Google Material 3:
 * - پالت رنگی هماهنگ با صفحات ورود و کاتالوگ (Slate 50 + سفید + آبی موقر متریال #1d4ed8)
 * - کادر جستجوی شاخص کپسولی M3
 * - دسته‌بندی‌های نرم و چیپ‌های لمسی
 * - هماهنگی صددرصدی استایل هدر، کارت‌ها، دکمه‌ها و فرم‌ها با کل پلتفرم.
 */
export default async function Home() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;

  if (token) {
    const session = await verifySession(token);
    if (session) {
      if (session.role === "admin") {
        redirect("/admin");
      }
      if (session.role === "customer") {
        redirect("/catalog");
      }
    }
  }

  const popularSearches = [
    { label: "لنت ترمز پراید", query: "لنت پراید" },
    { label: "کیت کلاچ پژو ۴۰۵ والئو", query: "کلاچ ۴۰۵" },
    { label: "فیلتر روغن سرکان", query: "فیلتر سرکان" },
    { label: "تسمه تایم و دینام دایکو", query: "تسمه دایکو" },
    { label: "دیسک ترمز چرخ عظام", query: "دیسک عظام" },
    { label: "شمع موتور NGK", query: "شمع NGK" },
  ];

  const vehicleCategories = [
    { name: "پراید، تیبا و ساینا", query: "پراید", icon: "🚗", count: "۳,۲۰۰ قطعه", badge: "پرفروش‌ترین" },
    { name: "پژو ۴۰۵، پارس و سمند", query: "پژو ۴۰۵", icon: "🚘", count: "۲,۹۵۰ قطعه", badge: "ارسال فوری" },
    { name: "پژو ۲۰۶ و ۲۰۷", query: "پژو ۲۰۶", icon: "🏎️", count: "۲,۱۰۰ قطعه", badge: "اصلی شرکتی" },
    { name: "دنا و سمند موتور EF7", query: "دنا", icon: "🚙", count: "۱,۸۰۰ قطعه", badge: "تضمین قیمت" },
    { name: "کوییک و اطلس", query: "کوییک", icon: "🛞", count: "۱,۴۵۰ قطعه", badge: "موجودی کامل" },
    { name: "تندر ۹۰ و ساندرو", query: "ال۹۰", icon: "🚐", count: "۹۸۰ قطعه", badge: "کیفیت استاندارد" },
  ];

  const partnerBrands = [
    { name: "والئو", latin: "VALEO", note: "کلاچ و دیسک فرانسه" },
    { name: "فیلتر سرکان", latin: "SERKAN", note: "استاندارد فیلتراسیون" },
    { name: "دایکو", latin: "DAYCO", note: "تسمه‌جات اورجینال" },
    { name: "گروه عظام", latin: "EZAM", note: "سیستم ترمز و تعلیق" },
    { name: "ایساکو", latin: "ISACO", note: "لوازم شرکتی ایران‌خودرو" },
    { name: "صنایع کروز", latin: "CROUSE", note: "سیستم‌های برقی و سنسور" },
    { name: "لنت پارس", latin: "PARS LENT", note: "لنت متالیک و سرامیک" },
  ];

  return (
    <div className="min-h-dvh flex flex-col justify-between bg-slate-50 text-slate-900 selection:bg-blue-600 selection:text-white font-sans">
      {/* ۱. نوار اعلان نبض بازار (متن کاملاً قابل انتخاب با موس و توقف با هاور) */}
      <MarketTicker />

      {/* ۲. هدر ناوبری یکپارچه و تمیز (Clean M3 Navbar) */}
      <header className="bg-white/95 backdrop-blur-md border-b border-slate-200 sticky top-0 z-40 shadow-xs">
        <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 h-16 sm:h-18 flex items-center justify-between gap-3">
          {/* لوگوی کاردو B2B — هماهنگ با صفحه ورود و کاتالوگ */}
          <Link href="/" className="flex items-center gap-2.5 sm:gap-3 group">
            <span className="size-9.5 sm:size-10 grid place-items-center bg-blue-600 text-white text-lg sm:text-xl font-black rounded-xl shadow-xs group-hover:scale-105 transition-transform duration-200">
              ک
            </span>
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-lg sm:text-xl tracking-tight text-slate-900">
                  کاردو <span className="text-blue-600 text-[10px] font-bold bg-blue-50 px-1.5 py-0.2 rounded border border-blue-200/80 align-top">B2B</span>
                </span>
                <span className="hidden sm:inline-block text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                  انبار مرکزی کرمان
                </span>
              </div>
              <span className="text-[10px] text-slate-500 font-medium hidden sm:inline-block">
                تأمین و پخش مویرگی قطعات یدکی خودرو در کشور
              </span>
            </div>
          </Link>

          {/* پیوندهای دسکتاپ */}
          <nav className="hidden md:flex items-center gap-6 text-xs font-bold text-slate-600">
            <Link href="/catalog" className="hover:text-blue-600 transition-colors">
              کاتالوگ و لیست قیمت
            </Link>
            <Link href="/orders/bulk" className="hover:text-blue-600 transition-colors flex items-center gap-1.5">
              <span>سفارش اکسل</span>
              <span className="text-[9px] font-black bg-blue-100 text-blue-700 px-1.5 py-0.2 rounded">
                سریع
              </span>
            </Link>
            <Link href="/catalog?partBrand=والئو" className="hover:text-blue-600 transition-colors">
              برندهای همکار
            </Link>
            <Link href="/statement" className="hover:text-blue-600 transition-colors">
              معین حساب و اعتبار
            </Link>
          </nav>

          {/* دکمه‌های ورود — دقیقاً با استایل صفحه لاگین */}
          <div className="flex items-center gap-2 sm:gap-3">
            <Link
              href="/catalog"
              prefetch={false}
              className="hidden sm:inline-flex text-xs font-bold text-slate-700 hover:text-slate-950 border border-slate-300 hover:border-slate-400 bg-white px-3.5 py-2 rounded-xl transition-all shadow-xs"
            >
              مشاهده کاتالوگ
            </Link>
            <Link
              href="/login"
              prefetch={false}
              className="text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white px-4 sm:px-5 py-2.5 rounded-xl transition-all shadow-xs active:scale-95 flex items-center gap-1.5"
            >
              <span>ورود همکاران</span>
              <span className="text-xs">←</span>
            </Link>
          </div>
        </div>
      </header>

      {/* ۳. بخش Hero: زمینه ملایم و آرامش‌بخش Slate 50، سرچ‌بار کپسولی M3 و تایپوگرافی چشم‌نواز */}
      <section className="px-4 sm:px-6 pt-12 sm:pt-20 pb-14 sm:pb-20 relative overflow-hidden">
        {/* هاله محو نورانی برای عمق‌بخشی به صفحه بدون ایجاد شلوغی */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-4xl mx-auto text-center space-y-7 relative z-10">
          {/* نشانگر متریال ۳ برای وضعیت انبار کرمان */}
          <div className="inline-flex items-center gap-2 bg-white border border-blue-200/90 shadow-2xs px-4 py-1.5 rounded-full text-xs text-blue-800 font-bold">
            <span className="size-2 rounded-full bg-blue-600 animate-pulse shrink-0" />
            <span>پلتفرم رسمی توزیع و پخش قطعات خودرو | انبار مرکزی استان کرمان</span>
          </div>

          {/* عنوان اصلی با فونت وزیرمتن و لحن اعتمادبخش */}
          <div className="space-y-3.5">
            <h1 className="text-3xl sm:text-5xl md:text-5xl font-black tracking-tight text-slate-900 leading-[1.3] sm:leading-[1.2]">
              توزیع و فروش عمده قطعات خودرو،
              <br />
              <span className="text-blue-600">مستقیم از انبار کرمان با فاکتور رسمی.</span>
            </h1>
            <p className="text-sm sm:text-base md:text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed font-normal">
              سامانه یکپارچه تأمین ویژه فروشگاه‌داران و تعمیرکاران مجاز — دسترسی لحظه‌ای به بیش از ۱۰ هزار قطعه یدکی استاندارد، نرخ مصوب کارخانجات و تسویه چکی ۳۰ تا ۶۰ روزه.
            </p>
          </div>

          {/* کادر جستجوی یکپارچه به سبک Google Material 3 */}
          <div className="w-full max-w-2xl mx-auto pt-2">
            <form
              action="/catalog"
              method="GET"
              className="relative rounded-full bg-white border border-slate-300 shadow-sm hover:shadow-md focus-within:shadow-md focus-within:border-blue-600 p-1.5 sm:p-2 flex items-center gap-2 transition-all"
            >
              <div className="pr-3.5 text-slate-400 text-base">🔍</div>
              <input
                type="text"
                name="q"
                placeholder="جستجوی نام قطعه، کد فنی OEM، سازنده یا مدل خودرو..."
                className="flex-1 bg-transparent text-sm sm:text-base text-slate-900 placeholder-slate-400 focus:outline-none py-2 px-1 font-medium"
              />
              <button
                type="submit"
                className="h-11 sm:h-12 px-6 sm:px-8 rounded-full bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs sm:text-sm shadow-xs transition-all active:scale-95 shrink-0"
              >
                جستجو در انبار
              </button>
            </form>

            {/* چیپ‌های پرجستجو به سبک Material Chips */}
            <div className="flex items-center justify-center gap-2 flex-wrap pt-3.5 text-xs font-medium">
              <span className="text-slate-500 text-[11px]">پرفروش‌های هفته:</span>
              {popularSearches.map((ps) => (
                <Link
                  key={ps.query}
                  href={`/catalog?q=${encodeURIComponent(ps.query)}`}
                  className="rounded-full bg-white hover:bg-blue-50 border border-slate-200 hover:border-blue-300 text-slate-700 hover:text-blue-700 px-3 py-1 text-[11px] transition-colors shadow-2xs"
                >
                  {ps.label}
                </Link>
              ))}
            </div>
          </div>

          {/* دکمه‌های اقدام به خرید */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-3 max-w-md mx-auto">
            <Link
              href="/catalog"
              prefetch={false}
              className="w-full sm:flex-1 h-12 sm:h-13 px-6 rounded-xl sm:rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm sm:text-base shadow-xs transition-all flex items-center justify-center gap-2 active:scale-98"
            >
              <span>ورود به کاتالوگ قطعات</span>
              <span className="text-sm">←</span>
            </Link>

            <Link
              href="/orders/bulk"
              prefetch={false}
              className="w-full sm:flex-1 h-12 sm:h-13 px-6 rounded-xl sm:rounded-2xl bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 font-bold text-sm sm:text-base transition-all flex items-center justify-center gap-2 active:scale-98 shadow-2xs"
            >
              <span>سفارش با فایل اکسل</span>
              <span className="text-xs text-blue-600">📊</span>
            </Link>
          </div>
        </div>
      </section>

      {/* ۴. نوار افقی شاخص‌های کلیدی انبار کاردو (M3 Tonal Stat Strip) */}
      <section className="bg-white border-y border-slate-200 py-6 sm:py-8 shadow-2xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8 divide-y lg:divide-y-0 lg:divide-x lg:divide-x-reverse divide-slate-100">
            <div className="text-center pt-3 lg:pt-0">
              <p className="text-2xl sm:text-3xl font-black text-blue-600 nums tracking-tight">۱۰,۰۰۰+</p>
              <p className="text-xs text-slate-500 font-bold mt-1">قلم قطعه فعال و آماده بارگیری</p>
            </div>
            <div className="text-center pt-3 lg:pt-0">
              <p className="text-2xl sm:text-3xl font-black text-slate-900 nums tracking-tight">۲ ساعته</p>
              <p className="text-xs text-slate-500 font-bold mt-1">تحویل سریع در شهر کرمان و حومه</p>
            </div>
            <div className="text-center pt-3 lg:pt-0">
              <p className="text-2xl sm:text-3xl font-black text-blue-600 nums tracking-tight">۶۰ روزه</p>
              <p className="text-xs text-slate-500 font-bold mt-1">تسویه اعتباری با چک صیادی بنفش</p>
            </div>
            <div className="text-center pt-3 lg:pt-0">
              <p className="text-2xl sm:text-3xl font-black text-emerald-600 nums tracking-tight">۱۰۰٪</p>
              <p className="text-xs text-slate-500 font-bold mt-1">تضمین اصالت قطعات و فاکتور رسمی</p>
            </div>
          </div>
        </div>
      </section>

      {/* ۵. دسترسی سریع به کاتالوگ خودروها (M3 Clean Cards) */}
      <section className="max-w-7xl mx-auto w-full px-4 sm:px-6 py-12 sm:py-16 space-y-6">
        <div className="flex items-center justify-between border-b border-slate-200 pb-3 flex-wrap gap-2">
          <div>
            <h2 className="text-lg sm:text-xl font-black text-slate-900 flex items-center gap-2">
              <span>🚗 تفکیک و دسترسی سریع به قطعات بر اساس خودرو</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              جهت مشاهده فوری قطعات موجود، خودروی مورد نظرتان را انتخاب کنید:
            </p>
          </div>

          <Link href="/catalog" className="text-xs font-bold text-blue-600 hover:underline">
            مشاهده تمام قطعات کاتالوگ ←
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
          {vehicleCategories.map((v) => (
            <Link
              key={v.name}
              href={`/catalog?carBrand=${encodeURIComponent(v.query)}`}
              className="rounded-2xl bg-white border border-slate-200 hover:border-blue-400 p-4 flex flex-col justify-between shadow-2xs hover:shadow-md transition-all duration-200 group active:scale-95"
            >
              <div className="flex items-center justify-between">
                <span className="text-2xl group-hover:scale-110 transition-transform duration-200">{v.icon}</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-50 text-slate-700 border border-slate-200">
                  {v.badge}
                </span>
              </div>
              <div className="mt-4">
                <p className="font-black text-xs sm:text-sm text-slate-900 group-hover:text-blue-600 transition-colors">
                  {v.name}
                </p>
                <p className="text-[11px] text-slate-500 font-mono nums mt-0.5 font-medium">{v.count}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* ۶. ارکان خدمات و مزایای همکاری کاردو B2B */}
      <section className="bg-white border-y border-slate-200 py-12 sm:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-8">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-blue-600">مزایای همکاری شرکتی</span>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900">چرا فروشگاه‌داران و تعمیرکاران کاردو را انتخاب می‌کنند؟</h2>
            <p className="text-xs text-slate-500 leading-relaxed">زیرساخت مدرن پخش عمده لوازم یدکی با سرعت تحویل انبار مرکزی و سهولت مالی</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="rounded-2xl p-5 bg-slate-50 border border-slate-200 space-y-2.5">
              <span className="size-10 rounded-xl bg-blue-100 text-blue-700 grid place-items-center text-lg font-bold">
                🏢
              </span>
              <h3 className="font-black text-sm text-slate-900">انبار مرکزی استان کرمان</h3>
              <p className="text-xs text-slate-600 leading-5">
                تأمین بدون واسطه قطعات از انبار مرکزی، تحویل روزانه به باربری‌های پیام شمس و پیشتاز به تمام شهرستان‌ها.
              </p>
            </div>

            <div className="rounded-2xl p-5 bg-slate-50 border border-slate-200 space-y-2.5">
              <span className="size-10 rounded-xl bg-blue-100 text-blue-700 grid place-items-center text-lg font-bold">
                💰
              </span>
              <h3 className="font-black text-sm text-slate-900">تخفیف پلکانی تیراژ</h3>
              <p className="text-xs text-slate-600 leading-5">
                محاسبه خودکار تخفیف روی کارتن و تیراژ کالا؛ قیمت همکاری پای فاکتور با بالاترین حاشیه سود برای مغازه‌دار.
              </p>
            </div>

            <div className="rounded-2xl p-5 bg-slate-50 border border-slate-200 space-y-2.5">
              <span className="size-10 rounded-xl bg-blue-100 text-blue-700 grid place-items-center text-lg font-bold">
                🧾
              </span>
              <h3 className="font-black text-sm text-slate-900">خرید اعتباری و چک صیادی</h3>
              <p className="text-xs text-slate-600 leading-5">
                امکان تسویه چکی تا سقف اعتباری تعیین‌شده با ثبت در سامانه پیچک/صیاد بانک مرکزی بدون معطلی و کارمزد.
              </p>
            </div>

            <div className="rounded-2xl p-5 bg-slate-50 border border-slate-200 space-y-2.5">
              <span className="size-10 rounded-xl bg-emerald-100 text-emerald-700 grid place-items-center text-lg font-bold">
                🛡️
              </span>
              <h3 className="font-black text-sm text-slate-900">تضمین اصالت و گارانتی ۴۸h</h3>
              <p className="text-xs text-slate-600 leading-5">
                تمام قطعات دارای برچسب و بارکد شرکتی هستند و در صورت هرگونه مغایرت ظرف ۴۸ ساعت قابل عودت می‌باشند.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ۷. برندهای معتبر همکار */}
      <section className="max-w-7xl mx-auto w-full px-4 sm:px-6 py-10 sm:py-14 space-y-5">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-2 border-b border-slate-200 pb-3 text-center sm:text-right">
          <div>
            <h3 className="text-sm font-black text-slate-900">توزیع مستقیم بیش از ۲۰۰ برند قطعه‌سازی کشور</h3>
            <p className="text-xs text-slate-500 mt-0.5">ضمانت اصالت هولوگرام‌دار شرکتی</p>
          </div>
          <span className="text-xs font-bold text-blue-600">تأمین بدون واسطه کارخانه</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
          {partnerBrands.map((b) => (
            <Link
              key={b.name}
              href={`/catalog?partBrand=${encodeURIComponent(b.name)}`}
              className="rounded-xl bg-white border border-slate-200 hover:border-blue-400 p-3 text-center transition-all shadow-2xs group"
            >
              <p className="font-black text-xs text-slate-900 group-hover:text-blue-600 transition-colors">
                {b.name}
              </p>
              <p className="text-[9px] font-mono text-slate-500 mt-0.5 tracking-wider uppercase font-bold">{b.latin}</p>
              <p className="text-[9px] text-slate-400 mt-1 truncate">{b.note}</p>
            </Link>
          ))}
        </div>
      </section>

      {/* ۸. فوتر رسمی و شفاف کاردو B2B */}
      <footer className="bg-white border-t border-slate-200 py-10">
        <div className="mx-auto w-full max-w-7xl px-4 sm:px-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pb-8 border-b border-slate-100 text-xs text-slate-600">
            <div className="space-y-2.5">
              <div className="flex items-center gap-2">
                <span className="size-7 rounded-lg bg-blue-600 text-white font-black text-sm grid place-items-center shadow-xs">
                  ک
                </span>
                <span className="font-black text-base text-slate-900">شرکت کاردو دیار کریمان (سهامی خاص)</span>
              </div>
              <p className="text-slate-500 text-xs leading-5">
                تأمین‌کننده و پخش‌کننده جامع قطعات یدکی خودروهای سبک و سواری در استان کرمان و منطقه جنوب‌شرق کشور.
              </p>
            </div>

            <div className="space-y-2.5">
              <span className="font-bold text-xs text-slate-900 block">واحد فروش و باربری کرمان:</span>
              <p className="flex items-center gap-2">
                <span>تلفن هماهنگی و فروش:</span>
                <span className="font-bold text-blue-600 nums font-mono text-sm" dir="ltr">
                  ۰۳۴-۳۳۲۲۴۴۵۵
                </span>
              </p>
              <p className="flex items-center gap-2">
                <span>پشتیبانی لجستیک و انبار:</span>
                <span className="font-bold text-slate-900 nums font-mono text-sm" dir="ltr">
                  ۰۳۴-۳۳۲۰۰۰۰۰
                </span>
              </p>
            </div>

            <div className="space-y-2.5">
              <span className="font-bold text-xs text-slate-900 block">نشانی انبار مرکزی:</span>
              <p className="text-slate-500 leading-5">
                استان کرمان، شهر کرمان، بلوار شهید صدوقی، مجتمع کاردو دیار کریمان، انبار مرکزی شماره ۱
              </p>
            </div>
          </div>

          <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500 text-center sm:text-right">
            <span>کلیه حقوق برای شرکت کاردو دیار کریمان محفوظ است.</span>
            <div className="flex items-center gap-5 text-xs font-bold text-slate-600">
              <Link href="/catalog" className="hover:text-blue-600 transition">کاتالوگ کالاها</Link>
              <Link href="/orders/bulk" className="hover:text-blue-600 transition">سفارش اکسل</Link>
              <Link href="/login" className="hover:text-blue-600 transition">ورود همکاران</Link>
              <Link href="/admin" className="hover:text-blue-600 transition">پنل مدیریت</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
