import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { SESSION_COOKIE, verifySession } from "@/lib/session";
import { MarketTicker } from "@/components/ui/market-ticker";

export const instant = false;

/*
 * صفحه اصلی کاردو B2B
 * طراحی مینیمال، روان و صنعتی با پالت رنگی اختصاصی الهام‌گرفته از ACE (ace.insigniagroup.com)
 * و استانداردهای دیزاین سیستم Google Material 3:
 * - سرمه‌ای عمیق سازمانی (#0B1F3A)
 * - قرمز متمرکز اتوموتیو (#ED250A)
 * - پس‌زمینه لایت و تمیز استخوانی (#F5F4F1) و کارت‌های سفید یکدست (#FFFFFF)
 * - کادر جستجوی شاخص متریال ۳، چیپ‌های دسته‌بندی نرم و آمار دقیق انبار مرکزی کرمان.
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
    { label: "دیسک ترمز عظام", query: "دیسک عظام" },
    { label: "شمع موتور NGK", query: "شمع NGK" },
  ];

  const vehicleCategories = [
    { name: "پراید، تیبا و ساینا", query: "پراید", icon: "🚗", count: "۳,۲۰۰ قطعه", badge: "پرفروش‌ترین" },
    { name: "پژو ۴۰۵، پارس و سمند", query: "پژو ۴۰۵", icon: "🚘", count: "۲,۹۵۰ قطعه", badge: "ارسال فوری" },
    { name: "پژو ۲۰۶ و ۲۰۷", query: "پژو ۲۰۶", icon: "🏎️", count: "۲,۱۰۰ قطعه", badge: "اصلی شرکتی" },
    { name: "دنا و سمند موتور EF7", query: "دنا", icon: "🚙", count: "۱,۸۰۰ قطعه", badge: "تضمین قیمت" },
    { name: "کوییک و اطلس", query: "کوییک", icon: "🛞", count: "۱,۴۵۰ قطعه", badge: "موجودی کامل" },
    { name: "تندر ۹۰ و ساندرو", query: "ال۹۰", icon: "🚐", count: "۹۸۰ قطعه", badge: "کیفیت گرید A" },
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
    <div className="min-h-dvh flex flex-col justify-between bg-[#F5F4F1] text-[#231F20] selection:bg-[#ED250A] selection:text-white font-sans">
      {/* ۱. نوار اعلان نبض بازار (متن قابل انتخاب، توقف با هاور) */}
      <MarketTicker />

      {/* ۲. هدر مینیمال سرمه‌ای سازمانی (ACE Navy Navbar) */}
      <header className="bg-[#0B1F3A] border-b border-white/10 sticky top-0 z-40 shadow-sm">
        <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 h-18 flex items-center justify-between">
          {/* لوگوی کاردو B2B */}
          <Link href="/" className="flex items-center gap-3 group">
            <span className="size-10 grid place-items-center bg-[#ED250A] text-white text-xl font-black rounded-xl shadow-md group-hover:scale-105 transition-transform duration-200">
              ک
            </span>
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <span className="font-black text-xl tracking-tight text-white group-hover:text-slate-200 transition-colors">
                  کاردو B2B
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/10 text-white/90 border border-white/20">
                  انبار مرکزی کرمان
                </span>
              </div>
              <span className="text-[10px] text-[#B6BCC4] font-normal">
                پلتفرم تخصصی تأمین و توزیع عمده قطعات خودرو
              </span>
            </div>
          </Link>

          {/* پیوندهای دسترسی سریع دسکتاپ */}
          <nav className="hidden md:flex items-center gap-7 text-xs font-bold text-white/80">
            <Link href="/catalog" className="hover:text-white transition-colors">
              کاتالوگ و لیست قیمت
            </Link>
            <Link href="/orders/bulk" className="hover:text-white transition-colors flex items-center gap-1.5">
              <span>سفارش با فایل اکسل</span>
              <span className="text-[9px] font-black bg-[#ED250A] text-white px-1.5 py-0.2 rounded">
                سریع
              </span>
            </Link>
            <Link href="/catalog?partBrand=والئو" className="hover:text-white transition-colors">
              برندهای همکار
            </Link>
            <Link href="/statement" className="hover:text-white transition-colors">
              معین حساب و تسویه چکی
            </Link>
          </nav>

          {/* دکمه‌های ورود */}
          <div className="flex items-center gap-2.5 sm:gap-3">
            <Link
              href="/catalog"
              prefetch={false}
              className="hidden sm:inline-flex text-xs font-bold text-white/80 hover:text-white border border-white/20 hover:border-white/40 px-3.5 py-2 rounded-xl transition-all"
            >
              مشاهده کاتالوگ
            </Link>
            <Link
              href="/login"
              prefetch={false}
              className="text-xs font-bold bg-[#ED250A] hover:bg-[#D62007] text-white px-4.5 py-2.5 rounded-xl transition-all shadow-md active:scale-95 flex items-center gap-1.5"
            >
              <span>ورود همکاران</span>
              <span className="text-xs">←</span>
            </Link>
          </div>
        </div>
      </header>

      {/* ۳. بخش Hero: سرمه‌ای یکدست موقر (#0B1F3A) با تایپوگرافی تمیز به سبک ACE و سرچ‌بار متریال ۳ */}
      <section className="bg-[#0B1F3A] text-white px-4 sm:px-6 pt-12 sm:pt-20 pb-16 sm:pb-24 relative overflow-hidden border-b border-black/10">
        <div className="max-w-4xl mx-auto text-center space-y-7 relative z-10">
          {/* Eyebrow Pill Badge (Google M3 Tonal Badge) */}
          <div className="inline-flex items-center gap-2 bg-white/10 border border-white/15 px-4 py-1.5 rounded-full text-xs text-white/90 font-bold backdrop-blur-md">
            <span className="size-2 rounded-full bg-[#ED250A] shrink-0" />
            <span>مرکز توزیع عمده و پخش قطعات خودرو در استان کرمان و سراسر کشور</span>
          </div>

          {/* عنوان پرقدرت به سبک ACE (سفید + قرمز متمرکز) */}
          <div className="space-y-4">
            <h1 className="text-3xl sm:text-5xl md:text-6xl font-black tracking-tight leading-[1.25] sm:leading-[1.18]">
              توزیع و پخش عمده قطعات خودرو.
              <br />
              <span className="text-[#ED250A]">مستقیم از انبار کرمان، بدون واسطه.</span>
            </h1>
            <p className="text-sm sm:text-base md:text-lg text-[#B6BCC4] max-w-2xl mx-auto leading-relaxed font-normal">
              پلتفرم اختصاصی B2B ویژه فروشگاه‌داران و تعمیرکاران مجاز — دسترسی آنی به بیش از ۱۰ هزار قطعه یدکی، نرخ مصوب کارخانجات، تسویه چکی ۳۰ تا ۶۰ روزه با فاکتور رسمی.
            </p>
          </div>

          {/* کادر جستجوی یکپارچه به سبک Google Material 3 */}
          <div className="w-full max-w-2xl mx-auto pt-2">
            <form
              action="/catalog"
              method="GET"
              className="relative rounded-full bg-white shadow-xl p-1.5 sm:p-2 flex items-center gap-2 transition-all focus-within:ring-4 focus-within:ring-[#ED250A]/20"
            >
              <div className="pr-3.5 text-slate-400 text-base">🔍</div>
              <input
                type="text"
                name="q"
                placeholder="جستجوی نام قطعه، کد فنی OEM، برند یا خودرو (مثال: دیسک ترمز، واتر پمپ، پراید، پژو...)"
                className="flex-1 bg-transparent text-sm sm:text-base text-[#231F20] placeholder-slate-400 focus:outline-none py-2 px-1 font-medium"
              />
              <button
                type="submit"
                className="h-11 sm:h-12 px-6 sm:px-8 rounded-full bg-[#ED250A] hover:bg-[#D62007] text-white font-bold text-xs sm:text-sm shadow-md transition-all active:scale-95 shrink-0"
              >
                جستجو در انبار
              </button>
            </form>

            {/* چیپ‌های پرجستجو به سبک Material Chips */}
            <div className="flex items-center justify-center gap-2 flex-wrap pt-3.5 text-xs font-medium">
              <span className="text-[#B6BCC4] text-[11px]">پرفروش‌های هفته:</span>
              {popularSearches.map((ps) => (
                <Link
                  key={ps.query}
                  href={`/catalog?q=${encodeURIComponent(ps.query)}`}
                  className="rounded-full bg-white/10 hover:bg-white/20 border border-white/10 px-3 py-1 text-[11px] text-white/90 hover:text-white transition-colors"
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
              className="w-full sm:flex-1 h-12 sm:h-13 px-6 rounded-xl sm:rounded-2xl bg-[#ED250A] hover:bg-[#D62007] text-white font-black text-sm sm:text-base shadow-lg transition-all flex items-center justify-center gap-2 active:scale-98"
            >
              <span>ورود به کاتالوگ ۱۰ هزار قطعه</span>
              <span className="text-sm">←</span>
            </Link>

            <Link
              href="/orders/bulk"
              prefetch={false}
              className="w-full sm:flex-1 h-12 sm:h-13 px-6 rounded-xl sm:rounded-2xl bg-white/10 hover:bg-white/15 border border-white/20 text-white font-bold text-sm sm:text-base transition-all flex items-center justify-center gap-2 active:scale-98"
            >
              <span>سفارش با فایل اکسل</span>
              <span className="text-xs">📊</span>
            </Link>
          </div>
        </div>
      </section>

      {/* ۴. نوار افقی شاخص‌های کلیدی انبار کاردو (ACE Stat Strip) */}
      <section className="bg-white border-b border-[#ECEAE5] py-6 sm:py-8 shadow-2xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8 divide-y lg:divide-y-0 lg:divide-x lg:divide-x-reverse divide-[#ECEAE5]">
            <div className="text-center pt-3 lg:pt-0">
              <p className="text-2xl sm:text-3xl font-black text-[#0B1F3A] nums tracking-tight">۱۰,۰۰۰+</p>
              <p className="text-xs text-[#7A756F] font-bold mt-1">قلم قطعه فعال و آماده بارگیری</p>
            </div>
            <div className="text-center pt-3 lg:pt-0">
              <p className="text-2xl sm:text-3xl font-black text-[#ED250A] nums tracking-tight">۲ ساعته</p>
              <p className="text-xs text-[#7A756F] font-bold mt-1">تحویل سریع در شهر کرمان و حومه</p>
            </div>
            <div className="text-center pt-3 lg:pt-0">
              <p className="text-2xl sm:text-3xl font-black text-[#0B1F3A] nums tracking-tight">۶۰ روزه</p>
              <p className="text-xs text-[#7A756F] font-bold mt-1">تسویه اعتباری با چک صیادی بنفش</p>
            </div>
            <div className="text-center pt-3 lg:pt-0">
              <p className="text-2xl sm:text-3xl font-black text-[#059669] nums tracking-tight">۱۰۰٪</p>
              <p className="text-xs text-[#7A756F] font-bold mt-1">تضمین اصالت قطعات و فاکتور رسمی</p>
            </div>
          </div>
        </div>
      </section>

      {/* ۵. دسترسی سریع به کاتالوگ خودروها (Google M3 Clean Cards on #F5F4F1) */}
      <section className="max-w-7xl mx-auto w-full px-4 sm:px-6 py-12 sm:py-16 space-y-6">
        <div className="flex items-center justify-between border-b border-[#ECEAE5] pb-3 flex-wrap gap-2">
          <div>
            <h2 className="text-lg sm:text-xl font-black text-[#0B1F3A] flex items-center gap-2">
              <span>🚗 تفکیک و دسترسی سریع به قطعات بر اساس خودرو</span>
            </h2>
            <p className="text-xs text-[#7A756F] mt-0.5">
              جهت مشاهده فوری قطعات موجود، خودروی مورد نظرتان را انتخاب کنید:
            </p>
          </div>

          <Link href="/catalog" className="text-xs font-bold text-[#ED250A] hover:underline">
            مشاهده تمام قطعات کاتالوگ ←
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
          {vehicleCategories.map((v) => (
            <Link
              key={v.name}
              href={`/catalog?carBrand=${encodeURIComponent(v.query)}`}
              className="rounded-2xl bg-white border border-[#ECEAE5] hover:border-[#ED250A]/40 p-4 flex flex-col justify-between shadow-2xs hover:shadow-md transition-all duration-200 group active:scale-95"
            >
              <div className="flex items-center justify-between">
                <span className="text-2xl group-hover:scale-110 transition-transform duration-200">{v.icon}</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#F5F4F1] text-[#0B1F3A] border border-[#ECEAE5]">
                  {v.badge}
                </span>
              </div>
              <div className="mt-4">
                <p className="font-black text-xs sm:text-sm text-[#0B1F3A] group-hover:text-[#ED250A] transition-colors">
                  {v.name}
                </p>
                <p className="text-[11px] text-[#7A756F] font-mono nums mt-0.5 font-medium">{v.count}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* ۶. ارکان خدمات و مزایای همکاری کاردو B2B (Material 3 Feature Cards) */}
      <section className="bg-white border-y border-[#ECEAE5] py-12 sm:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-8">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#ED250A]">مزایای همکاری شرکتی</span>
            <h2 className="text-xl sm:text-2xl font-black text-[#0B1F3A]">چرا فروشگاه‌داران و تعمیرکاران کاردو را انتخاب می‌کنند؟</h2>
            <p className="text-xs text-[#7A756F] leading-relaxed">زیرساخت مدرن پخش عمده لوازم یدکی با سرعت تحویل انبار مرکزی و سهولت مالی</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="rounded-2xl p-5 bg-[#F5F4F1] border border-[#ECEAE5] space-y-2.5">
              <span className="size-10 rounded-xl bg-[#0B1F3A] text-white grid place-items-center text-lg font-bold">
                🏢
              </span>
              <h3 className="font-black text-sm text-[#0B1F3A]">انبار مرکزی استان کرمان</h3>
              <p className="text-xs text-[#7A756F] leading-5">
                تأمین بدون واسطه قطعات از انبار مرکزی، تحویل روزانه به باربری‌های پیام شمس و پیشتاز به تمام شهرستان‌ها.
              </p>
            </div>

            <div className="rounded-2xl p-5 bg-[#F5F4F1] border border-[#ECEAE5] space-y-2.5">
              <span className="size-10 rounded-xl bg-[#ED250A] text-white grid place-items-center text-lg font-bold">
                💰
              </span>
              <h3 className="font-black text-sm text-[#0B1F3A]">تخفیف پلکانی تیراژ</h3>
              <p className="text-xs text-[#7A756F] leading-5">
                محاسبه خودکار تخفیف روی کارتن و تیراژ کالا؛ قیمت همکاری پای فاکتور با بالاترین حاشیه سود برای مغازه‌دار.
              </p>
            </div>

            <div className="rounded-2xl p-5 bg-[#F5F4F1] border border-[#ECEAE5] space-y-2.5">
              <span className="size-10 rounded-xl bg-[#0B1F3A] text-white grid place-items-center text-lg font-bold">
                🧾
              </span>
              <h3 className="font-black text-sm text-[#0B1F3A]">خرید اعتباری و چک صیادی</h3>
              <p className="text-xs text-[#7A756F] leading-5">
                امکان تسویه چکی تا سقف اعتباری تعیین‌شده با ثبت در سامانه پیچک/صیاد بانک مرکزی بدون معطلی و کارمزد.
              </p>
            </div>

            <div className="rounded-2xl p-5 bg-[#F5F4F1] border border-[#ECEAE5] space-y-2.5">
              <span className="size-10 rounded-xl bg-[#059669] text-white grid place-items-center text-lg font-bold">
                🛡️
              </span>
              <h3 className="font-black text-sm text-[#0B1F3A]">تضمین اصالت و گارانتی ۴۸h</h3>
              <p className="text-xs text-[#7A756F] leading-5">
                تمام قطعات دارای برچسب و بارکد شرکتی هستند و در صورت هرگونه مغایرت ظرف ۴۸ ساعت قابل عودت می‌باشند.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ۷. برندهای معتبر همکار (Partner Brands) */}
      <section className="max-w-7xl mx-auto w-full px-4 sm:px-6 py-10 sm:py-14 space-y-5">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-2 border-b border-[#ECEAE5] pb-3 text-center sm:text-right">
          <div>
            <h3 className="text-sm font-black text-[#0B1F3A]">توزیع مستقیم بیش از ۲۰۰ برند قطعه‌سازی کشور</h3>
            <p className="text-xs text-[#7A756F] mt-0.5">ضمانت اصالت هولوگرام‌دار شرکتی</p>
          </div>
          <span className="text-xs font-bold text-[#ED250A]">تأمین بدون واسطه کارخانه</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
          {partnerBrands.map((b) => (
            <Link
              key={b.name}
              href={`/catalog?partBrand=${encodeURIComponent(b.name)}`}
              className="rounded-xl bg-white border border-[#ECEAE5] hover:border-[#0B1F3A]/40 p-3 text-center transition-all shadow-2xs group"
            >
              <p className="font-black text-xs text-[#0B1F3A] group-hover:text-[#ED250A] transition-colors">
                {b.name}
              </p>
              <p className="text-[9px] font-mono text-[#7A756F] mt-0.5 tracking-wider uppercase font-bold">{b.latin}</p>
              <p className="text-[9px] text-[#A39E97] mt-1 truncate">{b.note}</p>
            </Link>
          ))}
        </div>
      </section>

      {/* ۸. فوتر شرکتی به سبک ACE (#0B1F3A) */}
      <footer className="bg-[#0B1F3A] text-white py-10 border-t border-black/10 mt-6">
        <div className="mx-auto w-full max-w-7xl px-4 sm:px-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pb-8 border-b border-white/10 text-xs text-[#B6BCC4]">
            <div className="space-y-2.5">
              <div className="flex items-center gap-2">
                <span className="size-7 rounded-lg bg-[#ED250A] text-white font-black text-sm grid place-items-center">
                  ک
                </span>
                <span className="font-black text-base text-white">شرکت کاردو دیار کریمان (سهامی خاص)</span>
              </div>
              <p className="text-[#B6BCC4] text-xs leading-5">
                تأمین‌کننده و پخش‌کننده جامع قطعات یدکی خودروهای سبک و سواری در استان کرمان و منطقه جنوب‌شرق کشور.
              </p>
            </div>

            <div className="space-y-2.5">
              <span className="font-bold text-xs text-white block">واحد فروش و باربری کرمان:</span>
              <p className="flex items-center gap-2">
                <span>تلفن هماهنگی و فروش:</span>
                <span className="font-bold text-[#ED250A] nums font-mono text-sm" dir="ltr">
                  ۰۳۴-۳۳۲۲۴۴۵۵
                </span>
              </p>
              <p className="flex items-center gap-2">
                <span>پشتیبانی لجستیک و انبار:</span>
                <span className="font-bold text-white nums font-mono text-sm" dir="ltr">
                  ۰۳۴-۳۳۲۰۰۰۰۰
                </span>
              </p>
            </div>

            <div className="space-y-2.5">
              <span className="font-bold text-xs text-white block">نشانی انبار مرکزی:</span>
              <p className="text-[#B6BCC4] leading-5">
                استان کرمان، شهر کرمان، بلوار شهید صدوقی، مجتمع کاردو دیار کریمان، انبار مرکزی شماره ۱
              </p>
            </div>
          </div>

          <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-white/50 text-center sm:text-right">
            <span>کلیه حقوق برای شرکت کاردو دیار کریمان محفوظ است.</span>
            <div className="flex items-center gap-5 text-xs font-bold text-white/70">
              <Link href="/catalog" className="hover:text-white transition">کاتالوگ کالاها</Link>
              <Link href="/orders/bulk" className="hover:text-white transition">سفارش اکسل</Link>
              <Link href="/login" className="hover:text-white transition">ورود همکاران</Link>
              <Link href="/admin" className="hover:text-white transition">پنل مدیریت</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
