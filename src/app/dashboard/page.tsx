import Link from "next/link";
import { connection } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifySession, SESSION_COOKIE } from "@/lib/session";
import { toFaDigits } from "@/lib/digits";
import { LogoutButton } from "@/app/dashboard/logout-button";

// داشبورد اختصاصی هر مشتری است — رندر مسدودی (پیش‌ساختی ندارد)
export const instant = false;

/*
 * وضعیت حساب — برای مشتریِ در انتظار تأیید.
 * حقیقت همیشه از DB خوانده می‌شود تا تأیید ادمین فوری اثر کند.
 */
export default async function DashboardPage() {
  await connection();

  const { cookies } = await import("next/headers");
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  const session = await verifySession(token ?? "");

  const customer = session
    ? await prisma.customer.findUnique({
        where: { id: session.sub },
        select: {
          id: true,
          companyName: true,
          contactName: true,
          phone: true,
          status: true,
          tier: { select: { name: true } },
        },
      })
    : null;

  if (!customer) {
    return (
      <main className="min-h-dvh grid place-items-center bg-slate-50 px-4">
        <div className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-sm">
          <p className="text-sm text-slate-600">نشست نامعتبر — دوباره وارد شوید.</p>
          <Link
            href="/login"
            className="mt-4 inline-flex h-11 items-center justify-center rounded-xl bg-blue-600 px-5 text-sm font-bold text-white transition-colors hover:bg-blue-700"
          >
            ورود به سامانه
          </Link>
        </div>
      </main>
    );
  }

  const statusMap: Record<
    string,
    { title: string; note: string; tone: string; dot: string; label: string }
  > = {
    PENDING: {
      title: "در انتظار تأیید ادمین",
      note: "حساب ساخته شده و در صف تأیید است. به‌محض تأیید، قیمت‌ها و موجودی فعال می‌شود — معمولاً کمتر از یک روز کاری.",
      tone: "border-amber-200 bg-amber-50",
      dot: "bg-amber-500",
      label: "در انتظار",
    },
    ACTIVE: {
      title: "حساب فعال است",
      note: "کاتالوگ، قیمت‌های عمده و پیش‌فاکتور برای شما باز است.",
      tone: "border-emerald-200 bg-emerald-50",
      dot: "bg-emerald-500",
      label: "فعال",
    },
    REJECTED: {
      title: "درخواست شما رد شد",
      note: "برای پیگیری با فروشگاه تماس بگیرید.",
      tone: "border-rose-200 bg-rose-50",
      dot: "bg-rose-500",
      label: "رد شده",
    },
    BLOCKED: {
      title: "حساب مسدود شده",
      note: "دسترسی موقتاً بسته است. با فروشگاه تماس بگیرید.",
      tone: "border-rose-200 bg-rose-50",
      dot: "bg-rose-500",
      label: "مسدود",
    },
  };

  const status = statusMap[customer.status] ?? statusMap.PENDING;

  return (
    <main className="min-h-dvh bg-slate-50">
      <header className="border-b border-slate-200 bg-white/95 backdrop-blur-md">
        <div className="mx-auto flex h-16 w-full max-w-2xl items-center gap-3 px-4">
          <Link href="/" className="flex items-center gap-2.5">
            <span className="grid size-9 place-items-center rounded-xl bg-blue-600 text-sm font-extrabold text-white shadow-xs">
              ک
            </span>
            <span className="flex flex-col leading-tight">
              <span className="text-sm font-extrabold text-slate-900">وضعیت حساب همکار</span>
              <span className="text-[11px] text-slate-500">کاردو B2B</span>
            </span>
          </Link>
          <div className="ms-auto">
            <LogoutButton />
          </div>
        </div>
      </header>

      <div className="mx-auto w-full max-w-2xl px-4 py-8">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-start gap-4">
            <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-blue-600 text-lg font-extrabold text-white shadow-xs">
              {customer.companyName.charAt(0) || "ک"}
            </span>
            <div className="min-w-0">
              <p className="text-[11px] font-medium text-slate-500">حساب تجاری</p>
              <h1 className="mt-0.5 truncate text-lg font-extrabold tracking-tight text-slate-900">
                {customer.companyName}
              </h1>
              <p className="mt-1 text-xs text-slate-600">
                {customer.contactName} ·{" "}
                <span dir="ltr" className="nums font-mono text-slate-500">
                  {toFaDigits(customer.phone ?? "")}
                </span>
              </p>
            </div>
          </div>

          <div className={`mt-5 flex items-start gap-3 rounded-xl border p-4 ${status.tone}`}>
            <span className={`mt-1.5 size-2.5 shrink-0 rounded-full ${status.dot}`} />
            <div>
              <h2 className="text-sm font-bold text-slate-900">{status.title}</h2>
              <p className="mt-1 text-xs leading-6 text-slate-600">{status.note}</p>
            </div>
          </div>

          <dl className="mt-4 grid grid-cols-2 gap-3">
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <dt className="text-[11px] font-medium text-slate-500">طبقه همکاری</dt>
              <dd className="mt-1 text-sm font-bold text-slate-900">
                {customer.tier?.name ?? "—"}
              </dd>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <dt className="text-[11px] font-medium text-slate-500">وضعیت حساب</dt>
              <dd className="mt-1 flex items-center gap-1.5 text-sm font-bold text-slate-900">
                <span className={`size-2 rounded-full ${status.dot}`} />
                {status.label}
              </dd>
            </div>
          </dl>

          {customer.status === "ACTIVE" && (
            <Link
              href="/catalog"
              className="mt-4 flex h-12 w-full items-center justify-center rounded-xl bg-blue-600 text-sm font-bold text-white shadow-xs transition-colors hover:bg-blue-700 active:scale-[0.99]"
            >
              ورود به کاتالوگ قطعات
            </Link>
          )}
        </div>

        <p className="mt-4 text-center text-xs leading-6 text-slate-500">
          سؤال دارید؟ با فروشگاه کاردو در کرمان تماس بگیرید.
        </p>
      </div>
    </main>
  );
}
