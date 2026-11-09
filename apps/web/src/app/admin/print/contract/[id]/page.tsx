"use client";

import { use, useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Printer, ArrowRight, FileDown, CheckCircle2 } from "lucide-react";
import { getProjectContract } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { ContractSheet } from "../../_components/contract-sheet";
import type { PaperSize } from "../../_components/print-styles";

export default function ContractPrintPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const { id } = use(params);

  const [size, setSize] = useState<PaperSize>(() => {
    if (typeof window === "undefined") return "a4";
    const q = new URLSearchParams(window.location.search).get("size");
    return q === "a5" ? "a5" : "a4";
  });
  const [showTermsDetail, setShowTermsDetail] = useState(true);

  const contractQuery = useQuery({
    queryKey: ["contract-print", id],
    queryFn: () => getProjectContract(id),
  });

  const contract = contractQuery.data;

  if (contractQuery.isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-100 p-6 text-sm text-slate-600 font-sans" dir="rtl">
        در حال آماده‌سازی و بارگذاری برگه‌ی رسمی قرارداد…
      </div>
    );
  }

  if (contractQuery.isError || !contract) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-3 bg-slate-100 p-6 text-sm text-slate-700 font-sans" dir="rtl">
        <p className="font-bold text-red-600">قرارداد پروژه یافت نشد یا هنوز ثبت نشده است.</p>
        <Button variant="outline" size="sm" onClick={() => router.back()} className="gap-1.5">
          <ArrowRight className="size-4" />
          بازگشت به پنل
        </Button>
      </div>
    );
  }

  return (
    <>
      {/* نوار ابزار بالای برگه (هنگام چاپ یا خروجی PDF به صورت خودکار مخفی می‌شود) */}
      <div className="no-print sticky top-0 z-50 flex flex-wrap items-center justify-between gap-3 border-b border-slate-300 bg-white/95 px-5 py-2.5 text-xs font-sans backdrop-blur-xs shadow-xs" dir="rtl">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.back()}
            className="h-8 gap-1.5 text-slate-600 hover:text-slate-900"
          >
            <ArrowRight className="size-4" />
            <span>بازگشت</span>
          </Button>
          <span className="text-slate-300">|</span>
          <span className="font-bold text-slate-800">
            برگه چاپی قرارداد: <span className="font-mono text-primary font-black">{contract.contractNumber}</span>
          </span>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 p-1">
            {(["a4", "a5"] as const).map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setSize(s)}
                className={`rounded px-2.5 py-1 text-[11px] font-bold transition-all ${
                  size === s
                    ? "bg-primary text-primary-foreground shadow-2xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                کاغذ {s.toUpperCase()}
              </button>
            ))}
          </div>

          <label className="inline-flex cursor-pointer items-center gap-1.5 text-slate-700 select-none">
            <input
              type="checkbox"
              checked={showTermsDetail}
              onChange={(e) => setShowTermsDetail(e.target.checked)}
              className="size-4 rounded border-slate-300 accent-primary"
            />
            <span>بندهای گارانتی و تاخیر</span>
          </label>

          <Button
            size="sm"
            onClick={() => window.print()}
            className="h-8 gap-2 bg-primary px-4 font-bold text-primary-foreground shadow-xs cursor-pointer"
          >
            <Printer className="size-4" />
            <span>چاپ / ذخیره PDF</span>
          </Button>
        </div>
      </div>

      {/* سند رسمی قرارداد */}
      <ContractSheet
        contract={contract}
        size={size}
        showTermsDetail={showTermsDetail}
      />
    </>
  );
}
