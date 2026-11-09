"use client";

import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { getShopSettings } from "@/lib/api";
import { faDate, money, toFa } from "@/lib/format";
import type { ProjectContractRow } from "@/lib/types";
import { PrintStyles, type PaperSize } from "./print-styles";

interface ContractSheetProps {
  contract: ProjectContractRow;
  size?: PaperSize;
  showTermsDetail?: boolean;
}

export function ContractSheet({
  contract,
  size = "a4",
  showTermsDetail = true,
}: ContractSheetProps) {
  const shopQuery = useQuery({
    queryKey: ["shop-settings"],
    queryFn: getShopSettings,
    staleTime: 5 * 60_000,
  });

  const shop = shopQuery.data;
  const companyName = shop?.name?.trim() || "شرکت صنایع چوب و دکوراسیون کاردو";
  const phone = shop?.phone || "۰۲۱-۸۸۸۸۹۹۹۹";
  const address = shop?.address || "تهران، شهرک صنعتی چهاردانگه، خیابان ۲۴، پلاک ۱۲";
  const nationalId = "۱۴۰۰۹۸۲۳۱۲۰";
  const regNo = "۵۸۲۴۱۹";
  const ecoCode = "۴۱۱۵۸۲۳۹۱۸۲";

  const order = contract.productionOrder;
  const customerName = order?.customerName || "کارفرمای محترم";
  const customerPhone = order?.customerPhone || "—";
  const projectTitle = order?.projectTitle || "پروژه ساخت و نصب کابینت و دکوراسیون چوبی";
  const endClient = order?.endClientName;

  const totalAmount = contract.totalAmount;
  const discount = contract.discount || 0;
  const paidAmount = contract.paidAmount || 0;
  const payable = Math.max(0, totalAmount - discount);
  const remaining = Math.max(0, payable - paidAmount);
  const warranty = contract.warrantyMonths || 12;

  const todayFa = toFa(new Date().toLocaleDateString("fa-IR"));
  const createdFa = contract.createdAt ? faDate(contract.createdAt) : todayFa;

  return (
    <>
      <PrintStyles size={size} />

      <div className={`sheet ${size}`} dir="rtl">
        {/* ۱. سربرگ رسمی قرارداد به سبک استاندارد حقوقی ایران */}
        <div className="flex items-center justify-between border-b-2 border-slate-900 pb-3">
          <div className="flex items-center gap-3">
            <img
              src="/logo.png"
              alt="لوگو"
              className="size-14 object-contain rounded-lg border border-slate-300 p-0.5"
            />
            <div>
              <h1 className="text-base font-black tracking-tight text-slate-900">
                {companyName}
              </h1>
              <p className="text-[10px] text-slate-600 font-bold mt-0.5">
                تولید تخصصی انواع کابینت مدرن و کلاسیک، کمد دیواری و دکوراسیون داخلی
              </p>
              <div className="text-[9px] text-slate-500 font-mono mt-0.5 flex gap-3">
                <span>شناسه ملی: {toFa(nationalId)}</span>
                <span>شماره ثبت: {toFa(regNo)}</span>
                <span>کد اقتصادی: {toFa(ecoCode)}</span>
              </div>
            </div>
          </div>

          <div className="text-center px-4">
            <h2 className="text-sm font-black text-slate-900 border-2 border-slate-900 px-3 py-1 rounded-md bg-slate-50">
              قرارداد رسمی سفارش ساخت و اجرا
            </h2>
            <span className="text-[9px] text-slate-500 mt-0.5 block">پیمانکاری صنایع چوب و MDF</span>
          </div>

          <div className="text-left font-mono text-[10px] space-y-1">
            <div>
              <span className="text-slate-500">شماره قرارداد: </span>
              <strong className="text-slate-900 font-black">{contract.contractNumber}</strong>
            </div>
            <div>
              <span className="text-slate-500">کد رهگیری سفارش: </span>
              <strong className="text-slate-900">{order?.code || "—"}</strong>
            </div>
            <div>
              <span className="text-slate-500">تاریخ انعقاد: </span>
              <strong className="text-slate-800">{createdFa}</strong>
            </div>
            <div>
              <span className="text-slate-500">پیوست: </span>
              <strong className="text-slate-800">نقشه فنی و پارت‌لیست</strong>
            </div>
          </div>
        </div>

        {/* ۲. ماده ۱: مشخصات طرفین قرارداد */}
        <div className="mt-3 rounded-lg border border-slate-300 bg-slate-50/50 p-2.5 text-[11px]">
          <h3 className="font-black text-slate-900 border-b border-slate-200 pb-1 mb-2">
            ماده ۱ — طرفین قرارداد
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1 border-e border-slate-200 pe-3">
              <span className="font-bold text-slate-800 block text-[10px] text-primary">
                طرف اول (مجری / پیمانکار):
              </span>
              <div>
                <strong>نام مجموعه: </strong> {companyName}
              </div>
              <div>
                <strong>نشانی کارخانه / دفتر: </strong> {address}
              </div>
              <div>
                <strong>تلفن تماس: </strong> {toFa(phone)}
              </div>
            </div>

            <div className="space-y-1 ps-1">
              <span className="font-bold text-slate-800 block text-[10px] text-primary">
                طرف دوم (کارفرما / خریدار):
              </span>
              <div>
                <strong>نام سفارش‌دهنده: </strong> {customerName}
                {endClient && <span className="text-slate-500"> (ذینفع: {endClient})</span>}
              </div>
              <div>
                <strong>تلفن تماس همراه: </strong> {toFa(customerPhone)}
              </div>
              <div>
                <strong>محل اجرای پروژه: </strong> {projectTitle}
              </div>
            </div>
          </div>
        </div>

        {/* ۳. ماده ۲: موضوع قرارداد و مشخصات فنی */}
        <div className="mt-2.5 rounded-lg border border-slate-300 p-2.5 text-[11px]">
          <h3 className="font-black text-slate-900 border-b border-slate-200 pb-1 mb-1.5">
            ماده ۲ — موضوع قرارداد و مشخصات فنی
          </h3>
          <p className="text-slate-700 leading-relaxed text-[10.5px]">
            عبارت است از تهیه متریال، برش دقیق ورق‌های MDF / هایگلاس مطابق ابعاد نقشه مصوب، اجرای نوار PVC ضخامت ۲ میلی‌متر با ماشین‌آلات تمام‌اتوماتیک، سوراخ‌کاری CNC، مونتاژ بدنه و اتصالات الیت / پیچ، نصب یراق‌آلات درجه یک (لولا آرام‌بند، ریل ساچمه‌ای ۳ زمانه / تاندوم)، بسته‌بندی، حمل به محل پروژه و نصب و ریگلاژ کامل برای:
          </p>
          <div className="mt-1.5 p-2 bg-slate-100/70 rounded border border-slate-200 font-medium text-slate-800">
            <strong>عنوان پروژه: </strong> {projectTitle} • <strong>کالای موضوع پیمان: </strong> {order?.product?.name || "کابینت آشپزخانه و دکوراسیون چوبی سفارشی"}
          </div>
        </div>

        {/* ۴. ماده ۳: مبلغ قرارداد و شرایط پرداخت اقساطی متصل به خط تولید */}
        <div className="mt-2.5 rounded-lg border border-slate-300 p-2.5 text-[11px]">
          <div className="flex items-center justify-between border-b border-slate-200 pb-1 mb-2">
            <h3 className="font-black text-slate-900">
              ماده ۳ — مبلغ قرارداد و برنامه پرداخت اقساط (Milestone Payment)
            </h3>
            <div className="text-left font-mono font-bold text-slate-900">
              مبلغ کل: <span className="text-primary text-xs">{money(payable)} تومان</span>
              {discount > 0 && <span className="text-slate-400 text-[10px] me-2 font-normal">(تخفیف: {money(discount)})</span>}
            </div>
          </div>

          <table className="w-full border-collapse text-[10px] text-center">
            <thead>
              <tr className="bg-slate-100 text-slate-800 font-black border border-slate-300">
                <th className="py-1 px-1.5 border border-slate-300 w-8">ردیف</th>
                <th className="py-1 px-2 border border-slate-300 text-right">عنوان مرحله پرداخت</th>
                <th className="py-1 px-1.5 border border-slate-300 w-16">درصد</th>
                <th className="py-1 px-2 border border-slate-300 text-left">مبلغ (تومان)</th>
                <th className="py-1 px-2 border border-slate-300 w-28">شرط آزاد‌سازی در کارخانه</th>
                <th className="py-1 px-2 border border-slate-300 w-20">وضعیت تسویه</th>
              </tr>
            </thead>
            <tbody>
              {contract.milestones && contract.milestones.length > 0 ? (
                contract.milestones.map((m, idx) => (
                  <tr key={m.id} className="border border-slate-300 hover:bg-slate-50/50">
                    <td className="py-1 px-1.5 border border-slate-300 font-mono">{toFa(idx + 1)}</td>
                    <td className="py-1 px-2 border border-slate-300 text-right font-bold text-slate-900">{m.title}</td>
                    <td className="py-1 px-1.5 border border-slate-300 font-mono">{toFa(Math.round(m.percentage))}٪</td>
                    <td className="py-1 px-2 border border-slate-300 text-left font-mono font-bold">{money(m.amount)}</td>
                    <td className="py-1 px-2 border border-slate-300 text-slate-600 text-[9px]">
                      {m.dueStage ? `پایان مرحله ${m.dueStage}` : "همزمان با عقد قرارداد"}
                    </td>
                    <td className="py-1 px-2 border border-slate-300">
                      {m.status === "PAID" ? (
                        <span className="font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded text-[9px]">تسویه شد</span>
                      ) : (
                        <span className="text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded text-[9px]">در انتظار</span>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="py-2 text-center text-slate-500">
                    برنامه اقساط ۳ مرحله‌ای استاندارد کاردو (۴۰٪ پیش‌پرداخت، ۴۰٪ بعد از برش و بدنه، ۲۰٪ پس از نصب نهایی)
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          <div className="mt-2 flex items-center justify-between bg-slate-50 p-2 rounded border border-slate-200 text-[10px]">
            <div>
              <span>مجموع پرداختی تا این لحظه: </span>
              <strong className="font-mono text-emerald-700">{money(paidAmount)} تومان</strong>
            </div>
            <div>
              <span>مانده بدهی تا تسویه نهایی: </span>
              <strong className="font-mono text-rose-700">{money(remaining)} تومان</strong>
            </div>
            {shop?.cardNumber && (
              <div>
                <span>شماره کارت واریز: </span>
                <strong className="font-mono" dir="ltr">{toFa(shop.cardNumber)}</strong>
                {shop.cardHolder && <span> ({shop.cardHolder})</span>}
              </div>
            )}
          </div>
        </div>

        {/* ۵. ماده ۴ و ۵: گارانتی، تعهدات تحویل و شرایط حقوقی */}
        {showTermsDetail && (
          <div className="mt-2.5 rounded-lg border border-slate-300 p-2.5 text-[10px] space-y-1.5">
            <div>
              <h3 className="font-black text-slate-900 mb-0.5">ماده ۴ — دوره گارانتی و تضمین کیفیت</h3>
              <p className="text-slate-700 leading-relaxed">
                مجری متعهد می‌گردد کلیه یراق‌آلات، ریل‌ها، لولاهای آرام‌بند و چسبندگی نوارهای PVC را به مدت{" "}
                <strong className="font-mono text-slate-900">{toFa(warranty)} ماه شمسی</strong> از تاریخ نصب تضمین نموده و در صورت هرگونه نقص فنی ناشی از تولید یا جنس یراق‌آلات، نسبت به تعویض یا رفع عیب رایگان در محل اقدام نماید.
              </p>
            </div>

            <div>
              <h3 className="font-black text-slate-900 mb-0.5">ماده ۵ — تعهدات طرفین و خسارت تاخیر</h3>
              <p className="text-slate-700 leading-relaxed">
                کارفرما متعهد به پرداخت به موقع اقساط طبق پیشرفت خط تولید می‌باشد. در صورت تاخیر کارفرما در واریز، مدت تاخیر به موعد تحویل پروژه افزوده خواهد شد. مجری متعهد است در موعد مقرر سفارش را تحویل نماید؛ در غیر اینصورت به ازای هر روز تاخیر غیرموجه، مبلغ دو در هزار کل قرارداد به عنوان خسارت به کارفرما پرداخت خواهد شد.
              </p>
            </div>
          </div>
        )}

        {/* ۶. بخش امضاها و تاییدات رسمی طرفین */}
        <div className="mt-3 pt-2 border-t-2 border-slate-900 grid grid-cols-2 gap-4 text-center">
          {/* باکس امضای کارفرما / خریدار */}
          <div className="rounded-lg border border-slate-300 p-2.5 bg-slate-50/40 flex flex-col justify-between min-h-[110px]">
            <div>
              <span className="font-black text-xs text-slate-900 block">
                محل امضا و اثر انگشت کارفرما / خریدار
              </span>
              <span className="text-[9px] text-slate-500 mt-0.5 block">
                «کلیه مفاد و شرایط فنی و مالی قرارداد مورد تایید می‌باشد»
              </span>
            </div>

            {/* در صورت وجود امضای دیجیتال لمسی ثبت شده توسط مشتری در محل */}
            {order?.customerSignatureData ? (
              <div className="my-1 flex flex-col items-center justify-center">
                <img
                  src={order.customerSignatureData}
                  alt="امضای دیجیتال کارفرما"
                  className="max-h-16 object-contain"
                />
                {order.customerSignedAt && (
                  <span className="text-[8px] text-emerald-700 font-mono">
                    امضای الکترونیکی ثبت شده در {faDate(order.customerSignedAt)}
                  </span>
                )}
              </div>
            ) : (
              <div className="my-3 text-slate-400 text-[10px]">محل امضا و تاریخ</div>
            )}

            <div className="text-[9px] text-slate-600 font-bold border-t border-slate-200 pt-1">
              نام و نام خانوادگی: {customerName}
            </div>
          </div>

          {/* باکس مهر و امضای رسمی کارخانه کاردو */}
          <div className="rounded-lg border border-slate-300 p-2.5 bg-slate-50/40 flex flex-col justify-between min-h-[110px]">
            <div>
              <span className="font-black text-xs text-slate-900 block">
                محل مهر و امضای رسمی مجری ({companyName})
              </span>
              <span className="text-[9px] text-slate-500 mt-0.5 block">
                مدیریت عامل و تاییدیه واحد کنترل کیفیت خط تولید
              </span>
            </div>

            <div className="my-3 text-slate-400 text-[10px]">محل مهر رسمی شرکت و امضای مجاز</div>

            <div className="text-[9px] text-slate-600 font-bold border-t border-slate-200 pt-1">
              مدیریت صنایع چوب و کابینت کاردو
            </div>
          </div>
        </div>

        {/* پانوشت امنیتی نسخه رسمی */}
        <div className="mt-2 text-center text-[8px] text-slate-500 border-t border-slate-200 pt-1">
          این برگه سند رسمی تعهدات و قرارداد ساخت کاردو ERP می‌باشد • تنظیم شده در ۲ نسخه معتبر با حکم واحد قانونی.
        </div>
      </div>
    </>
  );
}
