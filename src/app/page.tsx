import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { SESSION_COOKIE, verifySession } from "@/lib/session";

export const instant = false;

/*
 * صفحه اصلی کاردو B2B
 * طراحی خلوت، سریع و مدرن:
 * - تمرکز اصلی بر متن توزیع و فروش عمده
 * - دکمه‌های شفاف ورود به سامانه و مشاهده کاتالوگ
 */
export default async function Home() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;

  if (token) {
    const session = await verifySession(token);
    if (session) {
      if (session.role === "admin") {
        redirect("/catalog");
      }
      if (session.role === "customer") {
        redirect("/catalog");
      }
    }
  }

  return (
    <div className="min-h-dvh flex flex-col justify-between bg-slate-50 text-slate-900 selection:bg-blue-600 selection:text-white font-sans">
      {/* هدر ناوبری خلوت و رسمی */}
      <header className="bg-white/95 backdrop-blur-md border-b border-slate-200 sticky top-0 z-40 shadow-xs">
        <div className="mx-auto w-full max-w-5xl px-4 sm:px-6 h-16 sm:h-18 flex items-center justify-between">
          {/* لوگوی کاردو B2B */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <span className="size-10 grid place-items-center bg-blue-600 text-white text-xl font-black rounded-xl shadow-xs group-hover:scale-105 transition-transform duration-200">
              ک
            </span>
            <div className="flex flex-col">
              <span className="font-extrabold text-lg sm:text-xl tracking-tight text-slate-900">
                کاردو <span className="text-blue-600 text-[10px] font-bold bg-blue-50 px-1.5 py-0.2 rounded border border-blue-200/80 align-top">B2B</span>
              </span>
              <span className="text-[10px] text-slate-500 font-medium">
                سامانه توزیع و فروش قطعات خودرو
              </span>
            </div>
          </Link>

          {/* دکمه ورود در هدر */}
          <div className="flex items-center gap-3">
            <Link
              href="/catalog"
              prefetch={false}
              className="text-xs font-bold text-slate-700 hover:text-slate-950 border border-slate-300 hover:border-slate-400 bg-white px-3.5 py-2 rounded-xl transition-all shadow-xs"
            >
              کاتالوگ
            </Link>
            <Link
              href="/login"
              prefetch={false}
              className="text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white px-4 sm:px-5 py-2.5 rounded-xl transition-all shadow-xs active:scale-95 flex items-center gap-1.5"
            >
              <span>ورود</span>
              <span className="text-xs">←</span>
            </Link>
          </div>
        </div>
      </header>

      {/* بخش اصلی (Hero) خلوت و متمرکز بر توزیع و فروش */}
      <main className="flex-1 flex items-center justify-center px-4 sm:px-6 py-16 sm:py-24">
        <div className="max-w-2xl mx-auto text-center space-y-8">
          {/* نشانگر بالای صفحه */}
          <div className="inline-flex items-center gap-2 bg-white border border-blue-200 shadow-2xs px-4 py-1.5 rounded-full text-xs text-blue-800 font-bold">
            <span className="size-2 rounded-full bg-blue-600 animate-pulse shrink-0" />
            <span>پلتفرم رسمی تأمین و پخش عمده قطعات خودرو</span>
          </div>

          {/* عنوان اصلی متمرکز */}
          <div className="space-y-4">
            <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-slate-900 leading-[1.3] sm:leading-[1.2]">
              توزیع و فروش عمده قطعات خودرو
            </h1>
            <p className="text-sm sm:text-base text-slate-600 max-w-lg mx-auto leading-relaxed font-medium">
              تأمین مستقیم و پخش سراسری قطعات یدکی خودرو ویژه همکاران، فروشگاه‌داران و خریداران عمده.
            </p>
          </div>

          {/* دکمه‌های اقدام به ورود */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2 max-w-sm mx-auto">
            <Link
              href="/login"
              prefetch={false}
              className="w-full sm:flex-1 h-12 sm:h-13 px-6 rounded-xl sm:rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm sm:text-base shadow-xs transition-all flex items-center justify-center gap-2 active:scale-98"
            >
              <span>ورود به سامانه</span>
              <span className="text-sm">←</span>
            </Link>

            <Link
              href="/catalog"
              prefetch={false}
              className="w-full sm:flex-1 h-12 sm:h-13 px-6 rounded-xl sm:rounded-2xl bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 font-bold text-sm sm:text-base transition-all flex items-center justify-center gap-2 active:scale-98 shadow-2xs"
            >
              <span>کاتالوگ محصولات</span>
            </Link>
          </div>
        </div>
      </main>

      {/* فوتر مینیمال */}
      <footer className="bg-white border-t border-slate-200 py-6">
        <div className="mx-auto w-full max-w-5xl px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500 text-center sm:text-right">
          <span>کاردو دیار کریمان — سامانه یکپارچه توزیع و فروش عمده قطعات خودرو</span>
          <div className="flex items-center gap-4 font-bold text-slate-600">
            <Link href="/catalog" className="hover:text-blue-600 transition">کاتالوگ</Link>
            <Link href="/login" className="hover:text-blue-600 transition">ورود</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
