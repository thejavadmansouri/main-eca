import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { SESSION_COOKIE, verifySession } from "@/lib/session";
import { MarketTicker } from "@/components/ui/market-ticker";
import { toFaDigits } from "@/lib/digits";

export const instant = false;

/*
 * صفحه‌ی اصلی کاردو B2B
 * طراحی مدرن با گرادیانت آبی عمیق (Deep Royal Blue)، افکت‌های شیشه‌ای (Glassmorphism)،
 * کادر جستجوی آنی در کاتالوگ، کارت‌های هایلایت انبار مرکزی کرمان، و نوار متحرک نبض بازار.
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
    { label: "کیت کلاچ پژو ۴۰۵", query: "کلاچ ۴۰۵" },
    { label: "فیلتر روغن سرکان", query: "فیلتر سرکان" },
    { label: "تسمه دینام دایکو", query: "تسمه دایکو" },
    { label: "دیسک چرخ عظام", query: "دیسک عظام" },
    { label: "شمع موتور NGK", query: "شمع NGK" },
  ];

  const vehicleShortcuts = [
    { name: "پراید و تیبا", query: "پراید", icon: "🚗", count: "۳,۲۰۰ قطعه", badge: "پرفروش" },
    { name: "پژو ۴۰۵ و پارس", query: "پژو ۴۰۵", icon: "🚘", count: "۲,۸۰۰ قطعه", badge: "تأمین فوری" },
    { name: "پژو ۲۰۶ و ۲۰۷", query: "پژو ۲۰۶", icon: "🏎️", count: "۲,۱۰۰ قطعه", badge: "اصلی و شرکتی" },
    { name: "سمند و دنا EF7", query: "سمند", icon: "🚙", count: "۱,۹۵۰ قطعه", badge: "تضمین قیمت" },
    { name: "کوییک و ساینا", query: "کوییک", icon: "🛞", count: "۱,۴۰۰ قطعه", badge: "موجودی کامل" },
    { name: "تندر ۹۰ و ساندرو", query: "ال۹۰", icon: "🚐", count: "۹۸۰ قطعه", badge: "وارداتی اصلی" },
  ];

  const brandLogos = [
    { name: "والئو", latin: "VALEO", tag: "دیسک و صفحه فرانسه" },
    { name: "فیلتر سرکان", latin: "SERKAN", tag: "فیلتراسیون استاندارد" },
    { name: "دایکو", latin: "DAYCO", tag: "تسمه‌جات اورجینال" },
    { name: "گروه عظام", latin: "EZAM", tag: "قطعات ترمز و جلوبندی" },
    { name: "ایساکو", latin: "ISACO", tag: "لوازم یدکی شرکتی ایران‌خودرو" },
    { name: "صنایع کروز", latin: "CROUSE", tag: "برقی و سنسورها" },
    { name: "لنت پارس", latin: "PARS LENT", tag: "لنت ترمز سرامیکی" },
  ];

  return (
    <div className="min-h-dvh flex flex-col justify-between bg-[#040817] text-slate-100 selection:bg-amber-400 selection:text-slate-950 font-sans relative overflow-x-hidden">
      {/* لایه‌های افکت نوری و گرادیانت آبی عمیق (Deep Blue Mesh Gradient) */}
      <div className="fixed inset-0 pointer-events-none z-0">
        {/* گرادیانت زمینه پایه */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#07112d] via-[#09163a] to-[#030612]" />

        {/* هاله‌های نوری آبی کبالت، فیروزه‌ای و کهربایی */}
        <div className="absolute -top-40 -right-40 w-[600px] h-[600px] bg-blue-600/20 rounded-full blur-[140px]" />
        <div className="absolute top-1/4 -left-40 w-[550px] h-[550px] bg-cyan-500/15 rounded-full blur-[160px]" />
        <div className="absolute top-2/3 right-1/4 w-[500px] h-[500px] bg-indigo-600/15 rounded-full blur-[180px]" />
        <div className="absolute -bottom-20 left-1/3 w-[450px] h-[450px] bg-amber-500/10 rounded-full blur-[140px]" />

        {/* الگوی شبکه‌ای بسیار ملایم (Subtle Grid Overlay) */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e3a8a0d_1px,transparent_1px),linear-gradient(to_bottom,#1e3a8a0d_1px,transparent_1px)] bg-[size:40px_40px]" />
      </div>

      <div className="relative z-10 flex flex-col min-h-dvh">
        {/* ۱. نوار اطلاعیه و تابلوی زنده نبض بازار (متن کاملاً قابل انتخاب با موس) */}
        <MarketTicker />

        {/* ۲. هدر ناوبری مدرن شیشه‌ای (Glassmorphism Navbar) */}
        <header className="border-b border-white/10 bg-slate-950/70 backdrop-blur-xl sticky top-0 z-40">
          <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 h-18 flex items-center justify-between">
            {/* لوگو و عنوان کاردو B2B */}
            <div className="flex items-center gap-3">
              <Link href="/" className="flex items-center gap-3 group">
                <span className="size-11 grid place-items-center bg-gradient-to-tr from-blue-600 via-indigo-600 to-cyan-400 text-white text-xl font-black rounded-2xl shadow-lg shadow-blue-500/25 group-hover:scale-105 transition-transform">
                  ک
                </span>
                <div className="flex flex-col">
                  <div className="flex items-center gap-2">
                    <span className="font-black text-xl tracking-tight text-white group-hover:text-cyan-300 transition-colors">
                      کاردو B2B
                    </span>
                    <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-400/30">
                      پخش سراسری
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-400 font-medium">
                    شرکت توزیع و پخش قطعات کاردو دیار کریمان (سهامی خاص)
                  </span>
                </div>
              </Link>
            </div>

            {/* لینک‌های سریع دسکتاپ */}
            <nav className="hidden md:flex items-center gap-6 text-xs font-bold text-slate-300">
              <Link href="/catalog" className="hover:text-cyan-400 transition-colors">
                کاتالوگ و لیست قیمت قطعات
              </Link>
              <Link href="/orders/bulk" className="hover:text-cyan-400 transition-colors flex items-center gap-1">
                <span>سفارش با فایل اکسل</span>
                <span className="text-[9px] bg-blue-500/20 text-blue-300 px-1.5 py-0.2 rounded border border-blue-400/30">سریع</span>
              </Link>
              <Link href="/catalog?partBrand=والئو" className="hover:text-cyan-400 transition-colors">
                برندهای همکار
              </Link>
            </nav>

            {/* دکمه‌های اقدام به ورود */}
            <div className="flex items-center gap-2.5 sm:gap-3">
              <Link
                href="/catalog"
                prefetch={false}
                className="hidden sm:inline-flex text-xs font-bold text-slate-300 hover:text-white border border-white/10 hover:border-white/20 bg-white/5 hover:bg-white/10 px-3.5 py-2 rounded-xl transition-all shadow-xs"
              >
                مشاهده انبار
              </Link>
              <Link
                href="/login"
                prefetch={false}
                className="text-xs font-black bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white px-4 sm:px-5 py-2.5 rounded-xl transition-all shadow-lg shadow-blue-600/30 active:scale-95 flex items-center gap-1.5"
              >
                <span>ورود همکاران</span>
                <span className="text-[11px]">←</span>
              </Link>
            </div>
          </div>
        </header>

        {/* ۳. بخش اصلی Hero (عنوان چشم‌گیر، افکت‌های مدرن و کادر جستجوی شیشه‌ای) */}
        <main className="flex-1 flex flex-col items-center justify-center px-4 sm:px-6 py-10 sm:py-16">
          <div className="w-full max-w-4xl text-center space-y-7 mx-auto">
            {/* نشانگر زنده انبار مرکزی کرمان */}
            <div className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-950/80 via-slate-900/80 to-blue-950/80 border border-blue-400/30 px-4 py-1.5 rounded-full text-xs text-blue-200 font-bold shadow-md shadow-blue-950/50 backdrop-blur-md">
              <span className="size-2 rounded-full bg-cyan-400 animate-ping shrink-0" />
              <span>انبار مرکزی استان کرمان | آماده تحویل فوری ۲ ساعته و ارسال بین‌شهری</span>
            </div>

            {/* تیتر دو رنگ با گرادیانت مدرن آبی-فیروزه‌ای-طلایی */}
            <div className="space-y-4">
              <h1 className="text-3xl sm:text-5xl md:text-6xl leading-[1.2] sm:leading-[1.15] font-black tracking-tight text-white">
                توزیع مستقیم و فروش عمده
                <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 via-blue-400 to-amber-300 drop-shadow-sm">
                  قطعات یدکی خودرو در کشور
                </span>
              </h1>
              <p className="text-sm sm:text-base md:text-lg text-slate-300 max-w-2xl mx-auto leading-relaxed font-normal">
                پلتفرم اختصاصی B2B ویژه فروشگاه‌داران، نمایندگی‌ها و تعمیرکاران مجاز — دسترسی لحظه‌ای به موجودی انبار کرمان، نرخ مصوب کارخانجات، تسویه چکی ۳۰ تا ۶۰ روزه و فاکتور رسمی.
              </p>
            </div>

            {/* کادر جستجوی شیشه‌ای سریع در هیرو (Quick Catalog Search Bar) */}
            <div className="w-full max-w-2xl mx-auto pt-2">
              <form
                action="/catalog"
                method="GET"
                className="relative rounded-2xl bg-white/10 hover:bg-white/15 focus-within:bg-white/15 border border-white/20 focus-within:border-cyan-400/80 shadow-2xl backdrop-blur-2xl transition-all p-2 flex items-center gap-2"
              >
                <div className="pr-3 text-cyan-400 text-lg">🔍</div>
                <input
                  type="text"
                  name="q"
                  placeholder="جستجوی نام قطعه، کد فنی OEM یا خودرو (مثال: دیسک ترمز، واتر پمپ، پراید، پژو...)"
                  className="flex-1 bg-transparent text-sm sm:text-base text-white placeholder-slate-400 focus:outline-none py-2 px-1 font-medium"
                />
                <button
                  type="submit"
                  className="h-11 px-5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-black text-xs sm:text-sm shadow-md transition-all active:scale-95 shrink-0"
                >
                  جستجو در انبار
                </button>
              </form>

              {/* چیپ‌های پرجستجو زیر کادر جستجو */}
              <div className="flex items-center justify-center gap-2 flex-wrap pt-3 text-xs text-slate-400 font-medium">
                <span className="text-slate-500 text-[11px]">پرفروش‌های هفته:</span>
                {popularSearches.map((ps) => (
                  <Link
                    key={ps.query}
                    href={`/catalog?q=${encodeURIComponent(ps.query)}`}
                    className="rounded-lg bg-white/5 hover:bg-white/15 border border-white/10 px-2.5 py-1 text-[11px] text-slate-300 hover:text-cyan-300 transition-colors"
                  >
                    {ps.label}
                  </Link>
                ))}
              </div>
            </div>

            {/* دکمه‌های اقدام اصلی (CTAs) */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4 max-w-lg mx-auto">
              <Link
                href="/catalog"
                prefetch={false}
                className="w-full sm:flex-1 h-13 px-6 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white font-black text-sm sm:text-base shadow-xl shadow-blue-600/30 transition-all flex items-center justify-center gap-2 active:scale-98"
              >
                <span>ورود به کاتالوگ ۱۰ هزار قطعه</span>
                <span className="text-base">←</span>
              </Link>

              <Link
                href="/orders/bulk"
                prefetch={false}
                className="w-full sm:flex-1 h-13 px-6 rounded-2xl bg-slate-900/80 hover:bg-slate-800/90 border border-white/15 text-slate-200 hover:text-white font-bold text-sm sm:text-base transition-all flex items-center justify-center gap-2 active:scale-98 backdrop-blur-md"
              >
                <span>ثبت فاکتور اکسل</span>
                <span className="text-xs text-cyan-400">📊</span>
              </Link>
            </div>
          </div>

          {/* ۴. چهار کارت شاخص‌های خدمات کاردو B2B (Glass KPI Highlights) */}
          <div className="w-full max-w-6xl mx-auto mt-14 sm:mt-20 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="rounded-2xl p-4.5 bg-gradient-to-br from-white/10 via-white/5 to-transparent border border-white/15 hover:border-cyan-400/50 backdrop-blur-xl shadow-lg transition-all group">
              <div className="size-10 rounded-xl bg-cyan-500/20 text-cyan-400 grid place-items-center text-lg mb-3 border border-cyan-400/30 group-hover:scale-110 transition-transform">
                📦
              </div>
              <h3 className="font-black text-base text-white mb-1">۱۰,۰۰۰+ قلم قطعه فعال</h3>
              <p className="text-xs text-slate-300 leading-relaxed font-normal">
                تأمین مستقیم از ۵۰+ برند معتبر قطعه‌سازی کشور؛ لنت، دیسک، فیلتراسیون، موتوری و جلوبندی.
              </p>
            </div>

            <div className="rounded-2xl p-4.5 bg-gradient-to-br from-white/10 via-white/5 to-transparent border border-white/15 hover:border-blue-400/50 backdrop-blur-xl shadow-lg transition-all group">
              <div className="size-10 rounded-xl bg-blue-500/20 text-blue-400 grid place-items-center text-lg mb-3 border border-blue-400/30 group-hover:scale-110 transition-transform">
                🚚
              </div>
              <h3 className="font-black text-base text-white mb-1">ارسال ۲ تا ۲۴ ساعته</h3>
              <p className="text-xs text-slate-300 leading-relaxed font-normal">
                تحویل همان‌روز در شهر کرمان با پیک، و ارسال روزانه با باربری پیام شمس و پیشتاز به تمام شهرستان‌ها.
              </p>
            </div>

            <div className="rounded-2xl p-4.5 bg-gradient-to-br from-white/10 via-white/5 to-transparent border border-white/15 hover:border-amber-400/50 backdrop-blur-xl shadow-lg transition-all group">
              <div className="size-10 rounded-xl bg-amber-500/20 text-amber-400 grid place-items-center text-lg mb-3 border border-amber-400/30 group-hover:scale-110 transition-transform">
                💳
              </div>
              <h3 className="font-black text-base text-white mb-1">تسویه اعتباری و چکی</h3>
              <p className="text-xs text-slate-300 leading-relaxed font-normal">
                خرید اعتباری تا ۶۰ روزه ویژه همکاران معتبر با پذیرش چک صیادی بنفش و ثبت فاکتور رسمی دارایی.
              </p>
            </div>

            <div className="rounded-2xl p-4.5 bg-gradient-to-br from-white/10 via-white/5 to-transparent border border-white/15 hover:border-emerald-400/50 backdrop-blur-xl shadow-lg transition-all group">
              <div className="size-10 rounded-xl bg-emerald-500/20 text-emerald-400 grid place-items-center text-lg mb-3 border border-emerald-400/30 group-hover:scale-110 transition-transform">
                🛡️
              </div>
              <h3 className="font-black text-base text-white mb-1">تضمین اصالت و گارانتی ۴۸h</h3>
              <p className="text-xs text-slate-300 leading-relaxed font-normal">
                ضمانت کامل اصالت کارخانجات و مهلت تست ۴۸ ساعته جهت مرجوعی بدون قید و شرط در صورت مغایرت.
              </p>
            </div>
          </div>

          {/* ۵. دسترسی سریع به کاتالوگ خودروها (Vehicle Category Shortcuts) */}
          <div className="w-full max-w-6xl mx-auto mt-14 sm:mt-18 space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div>
                <h2 className="text-lg sm:text-xl font-black text-white flex items-center gap-2">
                  <span>🚗 دسترسی سریع به قطعات بر اساس خودرو</span>
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  برای مشاهده فوری قطعات موجود خودروی مورد نظر، روی کارت کلیک کنید:
                </p>
              </div>

              <Link href="/catalog" className="text-xs font-bold text-cyan-400 hover:underline">
                مشاهده همه خودروها ←
              </Link>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              {vehicleShortcuts.map((v) => (
                <Link
                  key={v.name}
                  href={`/catalog?carBrand=${encodeURIComponent(v.query)}`}
                  className="rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-cyan-400/40 p-3.5 flex flex-col justify-between transition-all group active:scale-95"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xl group-hover:scale-110 transition-transform">{v.icon}</span>
                    <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-cyan-500/20 text-cyan-300">
                      {v.badge}
                    </span>
                  </div>
                  <div className="mt-3">
                    <p className="font-black text-xs sm:text-sm text-white group-hover:text-cyan-300 transition-colors">
                      {v.name}
                    </p>
                    <p className="text-[10px] text-slate-400 font-mono nums mt-0.5">{v.count}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          {/* ۶. نشان برندهای معتبر قطعه‌سازی همکار (Partner Brands) */}
          <div className="w-full max-w-6xl mx-auto mt-14 sm:mt-18 rounded-3xl bg-white/5 border border-white/10 p-5 sm:p-6 backdrop-blur-xl">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pb-4 border-b border-white/10 text-center sm:text-right">
              <div>
                <h3 className="text-sm font-black text-white">برندهای همکار و تأمین مستقیم کاردو B2B</h3>
                <p className="text-xs text-slate-400 mt-0.5">توزیع قطعات با هولوگرام اصالت و گارانتی معتبر شرکتی</p>
              </div>
              <span className="text-xs font-bold text-amber-400">بیش از ۲۰۰ تولیدکننده و واردکننده برتر</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3 pt-4">
              {brandLogos.map((b) => (
                <Link
                  key={b.name}
                  href={`/catalog?partBrand=${encodeURIComponent(b.name)}`}
                  className="rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/20 p-2.5 text-center transition-all group"
                >
                  <p className="font-black text-xs text-white group-hover:text-cyan-300 transition-colors">
                    {b.name}
                  </p>
                  <p className="text-[9px] font-mono text-slate-400 mt-0.5 uppercase tracking-wider">{b.latin}</p>
                  <p className="text-[9px] text-slate-500 mt-1 truncate">{b.tag}</p>
                </Link>
              ))}
            </div>
          </div>
        </main>

        {/* ۷. فوتر پیشرفته و اطلاعات انبار مرکزی کرمان */}
        <footer className="border-t border-white/10 bg-slate-950/80 backdrop-blur-xl mt-12 py-8">
          <div className="mx-auto w-full max-w-7xl px-4 sm:px-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pb-6 border-b border-white/10 text-xs text-slate-400">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="size-6 rounded-lg bg-blue-600 text-white font-black text-xs grid place-items-center">
                    ک
                  </span>
                  <span className="font-black text-sm text-white">شرکت کاردو دیار کریمان</span>
                </div>
                <p className="text-slate-400 text-xs leading-5">
                  مرکز تخصصی پخش عمده و توزیع مویرگی قطعات یدکی خودرو در استان کرمان و جنوب‌شرق کشور.
                </p>
              </div>

              <div className="space-y-2">
                <span className="font-black text-xs text-white block">پشتیبانی و باربری کرمان:</span>
                <p className="flex items-center gap-2">
                  <span>تلفن فروش و هماهنگی:</span>
                  <span className="font-bold text-amber-400 nums font-mono text-sm" dir="ltr">
                    ۰۳۴-۳۳۲۲۴۴۵۵
                  </span>
                </p>
                <p className="flex items-center gap-2">
                  <span>واحد لجستیک و انبار:</span>
                  <span className="font-bold text-cyan-400 nums font-mono text-sm" dir="ltr">
                    ۰۳۴-۳۳۲۰۰۰۰۰
                  </span>
                </p>
              </div>

              <div className="space-y-2">
                <span className="font-black text-xs text-white block">موقعیت انبار مرکزی:</span>
                <p className="text-slate-400 leading-5">
                  استان کرمان، شهر کرمان، بلوار شهید صدوقی، مجتمع کاردو دیار کریمان، انبار مرکزی شماره ۱
                </p>
              </div>
            </div>

            <div className="pt-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500 text-center sm:text-right">
              <span>کلیه حقوق مادی و معنوی متعلق به شرکت کاردو دیار کریمان است.</span>
              <div className="flex items-center gap-4 text-xs font-bold text-slate-400">
                <Link href="/catalog" className="hover:text-cyan-400 transition">کاتالوگ کالاها</Link>
                <Link href="/login" className="hover:text-cyan-400 transition">ورود همکاران</Link>
                <Link href="/admin" className="hover:text-cyan-400 transition">پنل مدیریت</Link>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
