"use client";

import * as React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  AlertCircle,
  AlertTriangle,
  ArrowDownLeft,
  ArrowLeftRight,
  ArrowUpRight,
  Banknote,
  Building2,
  Calendar,
  CheckCircle2,
  Clock,
  Coins,
  Copy,
  CreditCard,
  ExternalLink,
  FileText,
  Filter,
  History,
  Landmark,
  Plus,
  RefreshCw,
  Search,
  Send,
  ShieldAlert,
  Sparkles,
  TrendingUp,
  User,
  Wallet,
} from "lucide-react";
import { toast } from "sonner";

import {
  bounceSayadCheque,
  clearSayadCheque,
  createTreasuryAccount,
  depositSayadCheque,
  endorseSayadCheque,
  getChequeAnalytics,
  getSayadCheques,
  getTreasuryAccounts,
  getTreasuryTransactions,
  registerSayadCheque,
  returnSayadCheque,
  transferTreasuryFunds,
} from "@/lib/api";
import { faDate, money, toFa } from "@/lib/format";
import { cn } from "@/lib/utils";
import type {
  ChequeAnalytics,
  SayadChequeRow,
  TreasuryAccountRow,
  TreasuryTransactionRow,
} from "@/lib/types";

import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const CHEQUE_STATUS_MAP: Record<string, { label: string; variant: "default" | "secondary" | "outline" | "destructive"; color: string }> = {
  IN_HAND: { label: "نزد صندوق (در دست)", variant: "outline", color: "text-amber-600 bg-amber-500/10 border-amber-500/20" },
  DEPOSITED: { label: "در جریان وصول (بانک)", variant: "secondary", color: "text-blue-600 bg-blue-500/10 border-blue-500/20" },
  CASHED: { label: "وصول‌شده (نقدی)", variant: "default", color: "text-emerald-700 bg-emerald-500/10 border-emerald-500/20 font-bold" },
  BOUNCED: { label: "برگشت‌خورده (واخواست)", variant: "destructive", color: "text-red-700 bg-red-500/10 border-red-500/30 font-bold" },
  PASSED: { label: "خرج‌شده به غیر", variant: "secondary", color: "text-purple-700 bg-purple-500/10 border-purple-500/20" },
  RETURNED: { label: "مسترد به مشتری", variant: "outline", color: "text-muted-foreground bg-muted border-border" },
  CANCELLED: { label: "باطل‌شده", variant: "outline", color: "text-muted-foreground bg-muted border-border" },
};

export default function TreasuryPage() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = React.useState<"cheques" | "accounts" | "transfers">("cheques");
  const [chequeStatusFilter, setChequeStatusFilter] = React.useState<string>("ALL");
  const [searchQuery, setSearchQuery] = React.useState("");

  // مدال‌ها
  const [isRegisterChequeOpen, setIsRegisterChequeOpen] = React.useState(false);
  const [isNewAccountOpen, setIsNewAccountOpen] = React.useState(false);
  const [isTransferOpen, setIsTransferOpen] = React.useState(false);

  // اکشن‌های روی چک منتخب
  const [selectedChequeForDeposit, setSelectedChequeForDeposit] = React.useState<SayadChequeRow | null>(null);
  const [selectedChequeForClear, setSelectedChequeForClear] = React.useState<SayadChequeRow | null>(null);
  const [selectedChequeForBounce, setSelectedChequeForBounce] = React.useState<SayadChequeRow | null>(null);
  const [selectedChequeForEndorse, setSelectedChequeForEndorse] = React.useState<SayadChequeRow | null>(null);

  // استیت‌های فرم‌های عملیاتی
  const [depositBankId, setDepositBankId] = React.useState("");
  const [bounceReason, setBounceReason] = React.useState("کسر موجودی در تاریخ سررسید");
  const [endorseTargetName, setEndorseTargetName] = React.useState("");

  // فرم ثبت چک صیادی جدید
  const [newCheque, setNewCheque] = React.useState({
    number: "",
    sayadId: "",
    chequeType: "RECEIVABLE",
    amount: 10000000,
    bankName: "بانک ملت",
    branch: "",
    holderName: "",
    drawerNationalId: "",
    dueDate: new Date(Date.now() + 14 * 24 * 3600 * 1000).toISOString().split("T")[0],
    note: "",
  });

  // فرم ایجاد حساب بانکی/صندوق جدید
  const [newAccount, setNewAccount] = React.useState({
    name: "",
    type: "BANK",
    accountNumber: "",
    iban: "",
    bankName: "بانک ملت",
    branchName: "",
    balance: 0,
    posTerminalId: "",
    notes: "",
  });

  // فرم انتقال وجه بین‌حسابی
  const [transferData, setTransferData] = React.useState({
    sourceAccountId: "",
    targetAccountId: "",
    amount: 10000000,
    trackingCode: "",
    description: "انتقال وجه بین‌حسابی",
  });

  // کوئری‌ها
  const { data: accounts = [], isLoading: isLoadingAccounts, refetch: refetchAccounts } = useQuery({
    queryKey: ["treasury-accounts"],
    queryFn: getTreasuryAccounts,
  });

  const { data: analytics, refetch: refetchAnalytics } = useQuery({
    queryKey: ["cheque-analytics"],
    queryFn: getChequeAnalytics,
  });

  const { data: cheques = [], isLoading: isLoadingCheques, refetch: refetchCheques } = useQuery({
    queryKey: ["sayad-cheques", chequeStatusFilter, searchQuery],
    queryFn: () =>
      getSayadCheques({
        status: chequeStatusFilter !== "ALL" && chequeStatusFilter !== "OVERDUE" ? chequeStatusFilter : undefined,
        isOverdue: chequeStatusFilter === "OVERDUE" ? true : undefined,
        q: searchQuery || undefined,
      }),
  });

  const { data: transactions = [], refetch: refetchTransactions } = useQuery({
    queryKey: ["treasury-transactions"],
    queryFn: () => getTreasuryTransactions(30),
    enabled: activeTab === "transfers",
  });

  // میوتیشن‌ها
  const registerChequeMutation = useMutation({
    mutationFn: registerSayadCheque,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sayad-cheques"] });
      queryClient.invalidateQueries({ queryKey: ["cheque-analytics"] });
      setIsRegisterChequeOpen(false);
      setNewCheque({
        number: "",
        sayadId: "",
        chequeType: "RECEIVABLE",
        amount: 10000000,
        bankName: "بانک ملت",
        branch: "",
        holderName: "",
        drawerNationalId: "",
        dueDate: new Date(Date.now() + 14 * 24 * 3600 * 1000).toISOString().split("T")[0],
        note: "",
      });
      toast.success("چک صیادی با موفقیت در خزانه ثبت شد.");
    },
  });

  const createAccountMutation = useMutation({
    mutationFn: createTreasuryAccount,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["treasury-accounts"] });
      setIsNewAccountOpen(false);
      toast.success("حساب خزانه‌داری با موفقیت تعریف شد.");
    },
  });

  const depositMutation = useMutation({
    mutationFn: ({ id, targetAccountId }: { id: string; targetAccountId: string }) =>
      depositSayadCheque(id, { targetAccountId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sayad-cheques"] });
      queryClient.invalidateQueries({ queryKey: ["cheque-analytics"] });
      setSelectedChequeForDeposit(null);
      toast.success("چک با موفقیت به بانک واگذار گردید.");
    },
  });

  const clearMutation = useMutation({
    mutationFn: ({ id, targetAccountId }: { id: string; targetAccountId?: string }) =>
      clearSayadCheque(id, { targetAccountId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sayad-cheques"] });
      queryClient.invalidateQueries({ queryKey: ["cheque-analytics"] });
      queryClient.invalidateQueries({ queryKey: ["treasury-accounts"] });
      setSelectedChequeForClear(null);
      toast.success("چک با موفقیت وصول شد و مانده بانک به‌روزرسانی گردید.");
    },
  });

  const bounceMutation = useMutation({
    mutationFn: ({ id, bounceReason }: { id: string; bounceReason: string }) =>
      bounceSayadCheque(id, { bounceReason }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sayad-cheques"] });
      queryClient.invalidateQueries({ queryKey: ["cheque-analytics"] });
      setSelectedChequeForBounce(null);
      toast.error("وضعیت چک به برگشتی (واخواست) تغییر یافت.");
    },
  });

  const endorseMutation = useMutation({
    mutationFn: ({ id, endorsedTo }: { id: string; endorsedTo: string }) =>
      endorseSayadCheque(id, { endorsedTo }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sayad-cheques"] });
      queryClient.invalidateQueries({ queryKey: ["cheque-analytics"] });
      setSelectedChequeForEndorse(null);
      toast.success("چک با موفقیت به شخص ثالث / تأمین‌کننده خرج گردید.");
    },
  });

  const returnMutation = useMutation({
    mutationFn: (id: string) => returnSayadCheque(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sayad-cheques"] });
      queryClient.invalidateQueries({ queryKey: ["cheque-analytics"] });
      toast.info("چک به صاحب حساب مسترد شد.");
    },
  });

  const transferMutation = useMutation({
    mutationFn: transferTreasuryFunds,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["treasury-accounts"] });
      queryClient.invalidateQueries({ queryKey: ["treasury-transactions"] });
      setIsTransferOpen(false);
      toast.success("انتقال وجه بین‌حسابی با موفقیت ثبت شد.");
    },
    onError: (err: any) => {
      toast.error(err.message || "خطا در انتقال وجه");
    },
  });

  // محاسبات نقدینگی کل در خزانه
  const totalTreasuryBalance = accounts.reduce((acc, a) => acc + (a.isActive ? a.balance : 0), 0);

  const bankAccounts = accounts.filter((a) => a.type === "BANK");

  return (
    <div className="flex flex-col gap-5 p-5 sm:p-6 transition-all">
      <PageHeader
        title="خزانه‌داری، حساب‌های بانکی و کارتابل چک صیاد"
        description="مدیریت جامع نقدینگی، حساب‌های بانکی و پوز، چرخه عمر چک‌های صیادی (واگذاری، وصول، واخواست و خرج چک) و انتقال وجوه"
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                refetchAccounts();
                refetchCheques();
                refetchAnalytics();
                refetchTransactions();
              }}
              className="gap-2 text-xs h-8"
            >
              <RefreshCw className="size-3.5" />
              به‌روزرسانی
            </Button>
            {activeTab === "cheques" && (
              <Button size="sm" onClick={() => setIsRegisterChequeOpen(true)} className="gap-2 text-xs h-8 shadow-xs">
                <Plus className="size-3.5" />
                ثبت چک صیادی جدید
              </Button>
            )}
            {activeTab === "accounts" && (
              <Button size="sm" onClick={() => setIsNewAccountOpen(true)} className="gap-2 text-xs h-8 shadow-xs">
                <Plus className="size-3.5" />
                افتتاح حساب / صندوق
              </Button>
            )}
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                if (accounts.length >= 2) {
                  setTransferData({
                    sourceAccountId: accounts[0].id,
                    targetAccountId: accounts[1].id,
                    amount: 50000000,
                    trackingCode: "",
                    description: "انتقال وجه بین حساب‌های شرکت",
                  });
                  setIsTransferOpen(true);
                } else {
                  toast.error("برای انتقال حداقل ۲ حساب یا صندوق نیاز است.");
                }
              }}
              className="gap-2 text-xs h-8"
            >
              <ArrowLeftRight className="size-3.5" />
              انتقال وجه بین‌حسابی
            </Button>
          </div>
        }
      />

      {/* ۱. کارت‌های شاخص‌های کلیدی نقدینگی و چک‌های صیادی */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="flex flex-col justify-between p-4 bg-gradient-to-br from-card to-emerald-500/5 hover:border-emerald-500/40 hover:shadow-md transition-all duration-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground">کل نقدینگی خزانه (بانک + صندوق)</span>
            <div className="rounded-xl bg-emerald-500/10 p-2 text-emerald-600 ring-1 ring-emerald-500/20">
              <Landmark className="size-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-emerald-600 tracking-tight font-mono">
              {money(totalTreasuryBalance)}
            </div>
            <p className="mt-1 text-[11px] text-muted-foreground">
              در {toFa(accounts.length)} حساب بانکی و صندوق فعال
            </p>
          </div>
        </Card>

        <Card className="flex flex-col justify-between p-4 bg-gradient-to-br from-card to-amber-500/5 hover:border-amber-500/40 hover:shadow-md transition-all duration-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground">چک‌های نزد صندوق (در دست)</span>
            <div className="rounded-xl bg-amber-500/10 p-2 text-amber-600 ring-1 ring-amber-500/20">
              <CreditCard className="size-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-amber-600 tracking-tight font-mono">
              {money(analytics?.inHandAmount || 0)}
            </div>
            <p className="mt-1 text-[11px] text-muted-foreground">
              {toFa(analytics?.inHandCount || 0)} فقره چک آماده واگذاری
            </p>
          </div>
        </Card>

        <Card className="flex flex-col justify-between p-4 bg-gradient-to-br from-card to-blue-500/5 hover:border-blue-500/40 hover:shadow-md transition-all duration-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground">چک‌های در جریان وصول (بانک)</span>
            <div className="rounded-xl bg-blue-500/10 p-2 text-blue-600 ring-1 ring-blue-500/20">
              <Clock className="size-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-blue-600 tracking-tight font-mono">
              {money(analytics?.depositedAmount || 0)}
            </div>
            <p className="mt-1 text-[11px] text-muted-foreground">
              {toFa(analytics?.depositedCount || 0)} فقره چک سپرده‌شده
            </p>
          </div>
        </Card>

        <Card className="flex flex-col justify-between p-4 bg-gradient-to-br from-card to-red-500/5 hover:border-red-500/40 hover:shadow-md transition-all duration-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground">چک‌های برگشتی (واخواست)</span>
            <div className="rounded-xl bg-red-500/10 p-2 text-red-600 ring-1 ring-red-500/20">
              <AlertCircle className="size-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-red-600 tracking-tight font-mono">
              {money(analytics?.bouncedAmount || 0)}
            </div>
            <p className="mt-1 text-[11px] text-muted-foreground flex items-center gap-1">
              <span className="text-red-600 font-bold">{toFa(analytics?.bouncedCount || 0)} فقره</span>
              <span>نیازمند پیگیری و واخواست</span>
            </p>
          </div>
        </Card>
      </div>

      {/* ۲. تب‌بار سه‌گانه خزانه */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-3">
        <div className="flex items-center gap-1.5 rounded-lg bg-muted/70 p-1 border border-border/60">
          <button
            onClick={() => setActiveTab("cheques")}
            className={cn(
              "flex items-center gap-2 rounded-md px-3.5 py-1.5 text-xs font-bold transition-all duration-150 select-none",
              activeTab === "cheques"
                ? "bg-background text-foreground shadow-xs ring-1 ring-border/50"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <CreditCard className="size-3.5 text-primary" />
            کارتابل چک‌های صیادی
            <Badge variant="secondary" className="text-[10px] h-4.5 px-1.5 font-mono">{toFa(cheques.length)}</Badge>
          </button>

          <button
            onClick={() => setActiveTab("accounts")}
            className={cn(
              "flex items-center gap-2 rounded-md px-3.5 py-1.5 text-xs font-bold transition-all duration-150 select-none",
              activeTab === "accounts"
                ? "bg-background text-foreground shadow-xs ring-1 ring-border/50"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Landmark className="size-3.5 text-emerald-600" />
            حساب‌های بانکی، پوز و صندوق‌ها
            <Badge variant="secondary" className="text-[10px] h-4.5 px-1.5 font-mono">{toFa(accounts.length)}</Badge>
          </button>

          <button
            onClick={() => setActiveTab("transfers")}
            className={cn(
              "flex items-center gap-2 rounded-md px-3.5 py-1.5 text-xs font-bold transition-all duration-150 select-none",
              activeTab === "transfers"
                ? "bg-background text-foreground shadow-xs ring-1 ring-border/50"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <History className="size-3.5 text-indigo-600" />
            تاریخچه تراکنش‌ها و انتقالات
          </button>
        </div>

        {/* فیلترهای سریع کارتابل چک */}
        {activeTab === "cheques" && (
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="size-3.5 absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground/60" />
              <Input
                placeholder="جستجوی شناسه صیاد، شماره چک، نام..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-8 w-56 pe-8 text-xs bg-background"
              />
            </div>

            <div className="flex items-center gap-1 bg-muted/60 p-0.5 rounded-md border text-xs">
              {[
                { id: "ALL", label: "همه" },
                { id: "IN_HAND", label: "نزد صندوق" },
                { id: "DEPOSITED", label: "واگذار به بانک" },
                { id: "OVERDUE", label: "سررسید گذشته" },
                { id: "CASHED", label: "وصول‌شده" },
                { id: "BOUNCED", label: "برگشتی" },
                { id: "PASSED", label: "خرج‌شده" },
              ].map((f) => (
                <button
                  key={f.id}
                  onClick={() => setChequeStatusFilter(f.id)}
                  className={cn(
                    "px-2 py-1 rounded text-[11px] font-semibold transition-colors",
                    chequeStatusFilter === f.id
                      ? "bg-background text-foreground shadow-xs font-bold"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* محتوای تب ۱: کارتابل چک‌های صیادی */}
      {activeTab === "cheques" && (
        <Card className="p-0 overflow-hidden border border-border shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead className="bg-muted/60 text-muted-foreground font-semibold border-b border-border select-none">
                <tr>
                  <th className="py-2.5 px-3">شناسه صیاد (۱۶ رقمی)</th>
                  <th className="py-2.5 px-3">شماره برگه چک</th>
                  <th className="py-2.5 px-3">نوع</th>
                  <th className="py-2.5 px-3">مبلغ چک (ریال)</th>
                  <th className="py-2.5 px-3">بانک و شعبه</th>
                  <th className="py-2.5 px-3">صاحب حساب / مشتری</th>
                  <th className="py-2.5 px-3 text-center">تاریخ سررسید</th>
                  <th className="py-2.5 px-3 text-center">وضعیت چرخه</th>
                  <th className="py-2.5 px-3">حساب مقصد / توضیحات</th>
                  <th className="py-2.5 px-3 text-center">عملیات چرخه عمر</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border font-medium">
                {cheques.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="py-12 text-center text-muted-foreground">
                      هیچ چکی با این فیلترها در خزانه یافت نشد.
                    </td>
                  </tr>
                ) : (
                  cheques.map((ch) => {
                    const st = CHEQUE_STATUS_MAP[ch.status] || { label: ch.status, variant: "outline", color: "" };
                    const isOverdue =
                      ["IN_HAND", "DEPOSITED"].includes(ch.status) && new Date(ch.dueDate) < new Date();

                    return (
                      <tr key={ch.id} className="hover:bg-muted/30 transition-colors">
                        <td className="py-2.5 px-3">
                          {ch.sayadId ? (
                            <div className="flex items-center gap-1">
                              <span className="font-mono text-[11px] font-bold text-foreground bg-muted px-1.5 py-0.5 rounded">
                                {ch.sayadId}
                              </span>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="size-5 text-muted-foreground hover:text-foreground"
                                onClick={() => {
                                  navigator.clipboard.writeText(ch.sayadId!);
                                  toast.success("شناسه صیاد کپی شد.");
                                }}
                                title="کپی شناسه صیادی"
                              >
                                <Copy className="size-3" />
                              </Button>
                            </div>
                          ) : (
                            <span className="text-muted-foreground text-[11px]">بدون صیاد</span>
                          )}
                        </td>
                        <td className="py-2.5 px-3 font-mono font-bold text-foreground">{ch.number}</td>
                        <td className="py-2.5 px-3">
                          <Badge variant="outline" className="text-[10px]">
                            {ch.chequeType === "RECEIVABLE" ? "دریافتی" : "پرداختی"}
                          </Badge>
                        </td>
                        <td className="py-2.5 px-3 font-mono font-black text-foreground">
                          {money(ch.effectiveAmount)}
                        </td>
                        <td className="py-2.5 px-3 text-foreground">
                          {ch.bankName}
                          {ch.branch && <span className="text-muted-foreground text-[10px] block">{ch.branch}</span>}
                        </td>
                        <td className="py-2.5 px-3 font-bold text-foreground">
                          {ch.customerName}
                          {ch.drawerNationalId && (
                            <span className="text-muted-foreground text-[10px] font-mono block font-normal">
                              کد ملی: {ch.drawerNationalId}
                            </span>
                          )}
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <span className={cn("font-mono text-xs", isOverdue ? "text-red-600 font-bold" : "text-foreground")}>
                            {faDate(ch.dueDate)}
                          </span>
                          {isOverdue && (
                            <Badge variant="destructive" className="text-[9px] block mx-auto mt-0.5 w-fit h-4">
                              سررسید گذشته
                            </Badge>
                          )}
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <span className={cn("px-2 py-0.5 rounded text-[10px] border inline-block", st.color)}>
                            {st.label}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-muted-foreground text-[11px] max-w-xs truncate">
                          {ch.status === "DEPOSITED" && ch.targetAccount && (
                            <span className="text-blue-600 font-bold block">بانک: {ch.targetAccount.name}</span>
                          )}
                          {ch.status === "PASSED" && ch.endorsedTo && (
                            <span className="text-purple-600 font-bold block">خرج شد به: {ch.endorsedTo}</span>
                          )}
                          {ch.status === "BOUNCED" && ch.bounceReason && (
                            <span className="text-red-600 block">{ch.bounceReason}</span>
                          )}
                          {ch.note || "—"}
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <div className="flex items-center justify-center gap-1">
                            {/* اکشن‌های مخصوص چک نزد صندوق */}
                            {ch.status === "IN_HAND" && (
                              <>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="h-6 text-[10px] px-2 text-blue-600 border-blue-200 hover:bg-blue-50"
                                  onClick={() => setSelectedChequeForDeposit(ch)}
                                  title="واگذاری به بانک (خواباندن به حساب)"
                                >
                                  واگذاری به بانک
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="h-6 text-[10px] px-2 text-purple-600 border-purple-200 hover:bg-purple-50"
                                  onClick={() => setSelectedChequeForEndorse(ch)}
                                  title="خرج کردن چک به تأمین‌کننده یا شخص ثالث"
                                >
                                  خرج چک
                                </Button>
                              </>
                            )}

                            {/* اکشن‌های مخصوص چک واگذار شده به بانک */}
                            {ch.status === "DEPOSITED" && (
                              <>
                                <Button
                                  size="sm"
                                  className="h-6 text-[10px] px-2 bg-emerald-600 hover:bg-emerald-700"
                                  onClick={() => setSelectedChequeForClear(ch)}
                                  title="اعلام وصول چک و افزایش موجودی بانک"
                                >
                                  اعلام وصول
                                </Button>
                                <Button
                                  variant="destructive"
                                  size="sm"
                                  className="h-6 text-[10px] px-2"
                                  onClick={() => setSelectedChequeForBounce(ch)}
                                  title="برگشت چک (واخواست)"
                                >
                                  برگشت
                                </Button>
                              </>
                            )}

                            {/* اگر وصول یا خرج شده است */}
                            {ch.status === "CASHED" && (
                              <span className="text-[10px] text-emerald-600 font-bold flex items-center gap-0.5">
                                <CheckCircle2 className="size-3" /> تسویه شد
                              </span>
                            )}
                            {ch.status === "BOUNCED" && (
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-6 text-[10px] px-2 text-emerald-600"
                                onClick={() => setSelectedChequeForClear(ch)}
                                title="وصول مجدد پس از پیگیری برگشت"
                              >
                                وصول مجدد
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* محتوای تب ۲: حساب‌های بانکی، پوز و صندوق‌ها */}
      {activeTab === "accounts" && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {accounts.map((acc) => (
            <Card key={acc.id} className="p-4 flex flex-col justify-between border hover:border-primary/40 hover:shadow-md transition-all">
              <div>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-lg bg-primary/10 text-primary">
                      {acc.type === "BANK" ? <Landmark className="size-5" /> : acc.type === "PETTY_CASH" ? <Coins className="size-5" /> : <Wallet className="size-5" />}
                    </div>
                    <div>
                      <div className="font-bold text-sm text-foreground">{acc.name}</div>
                      <Badge variant="outline" className="text-[10px] mt-0.5">
                        {acc.type === "BANK" ? "حساب بانکی" : acc.type === "PETTY_CASH" ? "تنخواه‌گردان" : "صندوق نقدی"}
                      </Badge>
                    </div>
                  </div>
                  <span className={cn("size-2.5 rounded-full", acc.isActive ? "bg-emerald-500" : "bg-muted")} />
                </div>

                <div className="mt-4 flex flex-col gap-1.5 text-xs">
                  {acc.accountNumber && (
                    <div className="flex items-center justify-between text-muted-foreground">
                      <span>شماره حساب:</span>
                      <strong className="font-mono text-foreground">{acc.accountNumber}</strong>
                    </div>
                  )}
                  {acc.iban && (
                    <div className="flex items-center justify-between text-muted-foreground">
                      <span>شماره شبا:</span>
                      <span className="font-mono text-[11px] text-foreground">{acc.iban}</span>
                    </div>
                  )}
                  {acc.posTerminalId && (
                    <div className="flex items-center justify-between text-muted-foreground">
                      <span>پایانه کارتخوان (POS):</span>
                      <strong className="font-mono text-primary">{acc.posTerminalId}</strong>
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-5 pt-3 border-t border-border flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-muted-foreground block">موجودی فعلی:</span>
                  <div className="font-mono font-black text-lg text-emerald-600">{money(acc.balance)}</div>
                </div>
                <div className="text-[10px] text-muted-foreground">
                  {toFa(acc._count?.depositedCheques || 0)} چک در جریان
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* محتوای تب ۳: تاریخچه تراکنش‌ها و انتقالات */}
      {activeTab === "transfers" && (
        <Card className="p-0 overflow-hidden border border-border shadow-xs">
          <div className="flex items-center justify-between border-b border-border bg-muted/40 p-3">
            <div className="flex items-center gap-2">
              <History className="size-4 text-indigo-600" />
              <span className="text-xs font-bold text-foreground">لاگ تراکنش‌های واریز، برداشت و انتقال وجوه بین حساب‌ها</span>
            </div>
            <Badge variant="outline" className="text-[10px] font-mono">{toFa(transactions.length)} رکورد اخیر</Badge>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead className="bg-muted/60 text-muted-foreground font-semibold border-b border-border select-none">
                <tr>
                  <th className="py-2.5 px-3">شماره سند تراکنش</th>
                  <th className="py-2.5 px-3">نوع عملیات</th>
                  <th className="py-2.5 px-3">حساب مبدا</th>
                  <th className="py-2.5 px-3">حساب مقصد</th>
                  <th className="py-2.5 px-3">مبلغ جابجا شده (ریال)</th>
                  <th className="py-2.5 px-3">کد پیگیری بانکی</th>
                  <th className="py-2.5 px-3 text-center">تاریخ</th>
                  <th className="py-2.5 px-3">شرح عملیات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border font-medium">
                {transactions.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-muted-foreground">
                      هنوز هیچ تراکنش انتقالی در سیستم ثبت نشده است.
                    </td>
                  </tr>
                ) : (
                  transactions.map((tr) => (
                    <tr key={tr.id} className="hover:bg-muted/30 transition-colors">
                      <td className="py-2.5 px-3 font-mono font-bold text-primary">{tr.transactionNumber}</td>
                      <td className="py-2.5 px-3">
                        <Badge variant="outline" className="text-[10px]">
                          {tr.type === "TRANSFER" ? "انتقال بین‌حسابی" : tr.type === "DEPOSIT" ? "واریز" : "برداشت"}
                        </Badge>
                      </td>
                      <td className="py-2.5 px-3 text-foreground">{tr.sourceAccount?.name || "—"}</td>
                      <td className="py-2.5 px-3 font-bold text-emerald-600">{tr.targetAccount?.name || "—"}</td>
                      <td className="py-2.5 px-3 font-mono font-black text-foreground">{money(tr.amount)}</td>
                      <td className="py-2.5 px-3 font-mono text-[11px] text-muted-foreground">{tr.trackingCode || "—"}</td>
                      <td className="py-2.5 px-3 text-center font-mono">{faDate(tr.transactionDate)}</td>
                      <td className="py-2.5 px-3 text-muted-foreground text-[11px]">{tr.description}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* مودال ثبت چک صیادی جدید */}
      <Dialog open={isRegisterChequeOpen} onOpenChange={setIsRegisterChequeOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>ثبت چک صیادی جدید در خزانه</DialogTitle>
            <DialogDescription>
              مشخصات چک صیادی دریافتی از مشتری یا پرداختی شرکت را وارد کنید.
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-2 gap-3 py-2 text-xs">
            <div className="col-span-2">
              <label className="text-[11px] font-semibold text-muted-foreground">شناسه ۱۶ رقمی صیاد</label>
              <Input
                placeholder="مثلاً 1209384756102938"
                value={newCheque.sayadId}
                onChange={(e) => setNewCheque({ ...newCheque, sayadId: e.target.value })}
                className="mt-1 h-8 font-mono tracking-widest text-xs"
              />
            </div>

            <div>
              <label className="text-[11px] font-semibold text-muted-foreground">شماره برگه چک</label>
              <Input
                placeholder="مثلاً 482910"
                value={newCheque.number}
                onChange={(e) => setNewCheque({ ...newCheque, number: e.target.value })}
                className="mt-1 h-8 font-mono text-xs"
              />
            </div>

            <div>
              <label className="text-[11px] font-semibold text-muted-foreground">مبلغ چک (ریال)</label>
              <Input
                type="number"
                value={newCheque.amount}
                onChange={(e) => setNewCheque({ ...newCheque, amount: Number(e.target.value) })}
                className="mt-1 h-8 font-mono text-xs"
              />
            </div>

            <div>
              <label className="text-[11px] font-semibold text-muted-foreground">بانک صادرکننده</label>
              <Input
                placeholder="بانک ملت، ملی، سامان..."
                value={newCheque.bankName}
                onChange={(e) => setNewCheque({ ...newCheque, bankName: e.target.value })}
                className="mt-1 h-8 text-xs"
              />
            </div>

            <div>
              <label className="text-[11px] font-semibold text-muted-foreground">شعبه</label>
              <Input
                placeholder="شعبه مرکزی، نیاوران..."
                value={newCheque.branch}
                onChange={(e) => setNewCheque({ ...newCheque, branch: e.target.value })}
                className="mt-1 h-8 text-xs"
              />
            </div>

            <div>
              <label className="text-[11px] font-semibold text-muted-foreground">نام صادرکننده / صاحب حساب</label>
              <Input
                placeholder="نام شخص یا شرکت..."
                value={newCheque.holderName}
                onChange={(e) => setNewCheque({ ...newCheque, holderName: e.target.value })}
                className="mt-1 h-8 text-xs"
              />
            </div>

            <div>
              <label className="text-[11px] font-semibold text-muted-foreground">کد ملی صادرکننده</label>
              <Input
                placeholder="۱۰ رقمی..."
                value={newCheque.drawerNationalId}
                onChange={(e) => setNewCheque({ ...newCheque, drawerNationalId: e.target.value })}
                className="mt-1 h-8 font-mono text-xs"
              />
            </div>

            <div>
              <label className="text-[11px] font-semibold text-muted-foreground">تاریخ سررسید چک</label>
              <Input
                type="date"
                value={newCheque.dueDate}
                onChange={(e) => setNewCheque({ ...newCheque, dueDate: e.target.value })}
                className="mt-1 h-8 text-xs"
              />
            </div>

            <div>
              <label className="text-[11px] font-semibold text-muted-foreground">نوع چک</label>
              <select
                value={newCheque.chequeType}
                onChange={(e) => setNewCheque({ ...newCheque, chequeType: e.target.value })}
                className="mt-1 h-8 w-full rounded-md border border-input bg-background px-2 text-xs"
              >
                <option value="RECEIVABLE">چک دریافتی (از مشتری)</option>
                <option value="PAYABLE">چک پرداختی (صادره شرکت)</option>
              </select>
            </div>

            <div className="col-span-2">
              <label className="text-[11px] font-semibold text-muted-foreground">توضیحات و بابت</label>
              <Input
                placeholder="بابت تسویه فاکتور یا پروژه..."
                value={newCheque.note}
                onChange={(e) => setNewCheque({ ...newCheque, note: e.target.value })}
                className="mt-1 h-8 text-xs"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setIsRegisterChequeOpen(false)}>
              انصراف
            </Button>
            <Button
              size="sm"
              disabled={!newCheque.number || !newCheque.amount || registerChequeMutation.isPending}
              onClick={() => registerChequeMutation.mutate(newCheque)}
            >
              ثبت در کارتابل خزانه
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* مودال افتتاح حساب یا صندوق */}
      <Dialog open={isNewAccountOpen} onOpenChange={setIsNewAccountOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>افتتاح حساب بانکی یا صندوق جدید</DialogTitle>
            <DialogDescription>
              مشخصات حساب، شبا و پایانه کارتخوان متصل را تعریف کنید.
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-3 py-2 text-xs">
            <div>
              <label className="text-[11px] font-semibold text-muted-foreground">عنوان حساب</label>
              <Input
                placeholder="مثلاً بانک تجارت - جاری حقوق، صندوق کارگاه..."
                value={newAccount.name}
                onChange={(e) => setNewAccount({ ...newAccount, name: e.target.value })}
                className="mt-1 h-8 text-xs"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[11px] font-semibold text-muted-foreground">نوع حساب</label>
                <select
                  value={newAccount.type}
                  onChange={(e) => setNewAccount({ ...newAccount, type: e.target.value })}
                  className="mt-1 h-8 w-full rounded-md border border-input bg-background px-2 text-xs"
                >
                  <option value="BANK">حساب بانکی</option>
                  <option value="CASH_DESK">صندوق نقدی</option>
                  <option value="PETTY_CASH">تنخواه‌گردان</option>
                </select>
              </div>
              <div>
                <label className="text-[11px] font-semibold text-muted-foreground">نام بانک</label>
                <Input
                  placeholder="ملت، سامان، ملی..."
                  value={newAccount.bankName}
                  onChange={(e) => setNewAccount({ ...newAccount, bankName: e.target.value })}
                  className="mt-1 h-8 text-xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[11px] font-semibold text-muted-foreground">شماره حساب</label>
                <Input
                  placeholder="شماره حساب..."
                  value={newAccount.accountNumber}
                  onChange={(e) => setNewAccount({ ...newAccount, accountNumber: e.target.value })}
                  className="mt-1 h-8 font-mono text-xs"
                />
              </div>
              <div>
                <label className="text-[11px] font-semibold text-muted-foreground">شماره پایانه کارتخوان (POS)</label>
                <Input
                  placeholder="POS-XXXX..."
                  value={newAccount.posTerminalId}
                  onChange={(e) => setNewAccount({ ...newAccount, posTerminalId: e.target.value })}
                  className="mt-1 h-8 font-mono text-xs"
                />
              </div>
            </div>

            <div>
              <label className="text-[11px] font-semibold text-muted-foreground">شماره شبا (IBAN)</label>
              <Input
                placeholder="IR..."
                value={newAccount.iban}
                onChange={(e) => setNewAccount({ ...newAccount, iban: e.target.value })}
                className="mt-1 h-8 font-mono text-xs"
              />
            </div>

            <div>
              <label className="text-[11px] font-semibold text-muted-foreground">موجودی اولیه (ریال)</label>
              <Input
                type="number"
                value={newAccount.balance}
                onChange={(e) => setNewAccount({ ...newAccount, balance: Number(e.target.value) })}
                className="mt-1 h-8 font-mono text-xs"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setIsNewAccountOpen(false)}>
              انصراف
            </Button>
            <Button
              size="sm"
              disabled={!newAccount.name || createAccountMutation.isPending}
              onClick={() => createAccountMutation.mutate(newAccount)}
            >
              ایجاد حساب
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* مودال واگذاری چک به بانک (خواباندن به حساب) */}
      <Dialog open={!!selectedChequeForDeposit} onOpenChange={() => setSelectedChequeForDeposit(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>واگذاری چک به بانک (در جریان وصول)</DialogTitle>
            <DialogDescription>
              چک شماره {selectedChequeForDeposit?.number} به کدام حساب بانکی سپرده شود؟
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-3 py-2 text-xs">
            <div className="p-3 rounded-lg bg-muted text-xs flex justify-between">
              <span>مبلغ چک:</span>
              <strong className="font-mono text-foreground font-black">
                {money(selectedChequeForDeposit?.effectiveAmount || 0)}
              </strong>
            </div>

            <div>
              <label className="text-[11px] font-semibold text-muted-foreground">انتخاب حساب بانکی مقصد</label>
              <select
                value={depositBankId}
                onChange={(e) => setDepositBankId(e.target.value)}
                className="mt-1 h-8 w-full rounded-md border border-input bg-background px-2 text-xs font-semibold"
              >
                <option value="">-- انتخاب بانک مقصد --</option>
                {bankAccounts.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name} ({money(b.balance)})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setSelectedChequeForDeposit(null)}>
              انصراف
            </Button>
            <Button
              size="sm"
              disabled={!depositBankId || depositMutation.isPending}
              onClick={() =>
                selectedChequeForDeposit &&
                depositMutation.mutate({
                  id: selectedChequeForDeposit.id,
                  targetAccountId: depositBankId,
                })
              }
            >
              تأیید واگذاری به بانک
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* مودال اعلام وصول چک */}
      <Dialog open={!!selectedChequeForClear} onOpenChange={() => setSelectedChequeForClear(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>اعلام وصول نهایی چک</DialogTitle>
            <DialogDescription>
              تأیید واریز وجه چک شماره {selectedChequeForClear?.number} به حساب بانکی
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-3 py-2 text-xs">
            <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-xs flex justify-between">
              <span className="text-emerald-800 dark:text-emerald-200">مبلغ واریزی به حساب:</span>
              <strong className="font-mono text-emerald-700 font-black">
                {money(selectedChequeForClear?.effectiveAmount || 0)}
              </strong>
            </div>

            <div>
              <label className="text-[11px] font-semibold text-muted-foreground">واریز به حساب:</label>
              <div className="mt-1 p-2 rounded-md border text-xs font-bold text-foreground">
                {selectedChequeForClear?.targetAccount?.name || "حساب پیش‌فرض خزانه‌داری"}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setSelectedChequeForClear(null)}>
              انصراف
            </Button>
            <Button
              size="sm"
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
              disabled={clearMutation.isPending}
              onClick={() =>
                selectedChequeForClear &&
                clearMutation.mutate({
                  id: selectedChequeForClear.id,
                  targetAccountId: selectedChequeForClear.targetAccountId || undefined,
                })
              }
            >
              تأیید وصول و ثبت در حساب
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* مودال اعلام برگشت چک */}
      <Dialog open={!!selectedChequeForBounce} onOpenChange={() => setSelectedChequeForBounce(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-destructive flex items-center gap-2">
              <AlertCircle className="size-4" />
              اعلام برگشت چک (واخواست)
            </DialogTitle>
            <DialogDescription>
              ثبت علت برگشت چک شماره {selectedChequeForBounce?.number} و صدور سند واخواست
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-3 py-2 text-xs">
            <div>
              <label className="text-[11px] font-semibold text-muted-foreground">علت واخواست / برگشت بانک</label>
              <select
                value={bounceReason}
                onChange={(e) => setBounceReason(e.target.value)}
                className="mt-1 h-8 w-full rounded-md border border-input bg-background px-2 text-xs"
              >
                <option value="کسر موجودی در تاریخ سررسید">کسر موجودی در تاریخ سررسید</option>
                <option value="عدم تطابق امضا با نمونه امضای بانک">عدم تطابق امضا با نمونه امضای بانک</option>
                <option value="اختلاف در رقم و حروف">اختلاف در رقم و حروف</option>
                <option value="مسدودی حساب صادرکننده">مسدودی حساب صادرکننده</option>
                <option value="قلم‌خوردگی در متن یا تاریخ">قلم‌خوردگی در متن یا تاریخ</option>
              </select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setSelectedChequeForBounce(null)}>
              انصراف
            </Button>
            <Button
              variant="destructive"
              size="sm"
              disabled={bounceMutation.isPending}
              onClick={() =>
                selectedChequeForBounce &&
                bounceMutation.mutate({
                  id: selectedChequeForBounce.id,
                  bounceReason,
                })
              }
            >
              ثبت قطعی برگشت چک
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* مودال خرج چک به تأمین‌کننده یا شخص ثالث */}
      <Dialog open={!!selectedChequeForEndorse} onOpenChange={() => setSelectedChequeForEndorse(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>خرج کردن چک به غیر (تأمین‌کننده)</DialogTitle>
            <DialogDescription>
              انتقال چک شماره {selectedChequeForEndorse?.number} بابت تسویه حساب به شخص ثالث
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-3 py-2 text-xs">
            <div className="p-3 rounded-lg bg-muted text-xs flex justify-between">
              <span>مبلغ چک:</span>
              <strong className="font-mono text-foreground font-black">
                {money(selectedChequeForEndorse?.effectiveAmount || 0)}
              </strong>
            </div>

            <div>
              <label className="text-[11px] font-semibold text-muted-foreground">نام تحویل‌گیرنده / شرکت تأمین‌کننده</label>
              <Input
                placeholder="مثلاً شرکت ورق‌های صنعتی، آقای حسینی..."
                value={endorseTargetName}
                onChange={(e) => setEndorseTargetName(e.target.value)}
                className="mt-1 h-8 text-xs"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setSelectedChequeForEndorse(null)}>
              انصراف
            </Button>
            <Button
              size="sm"
              disabled={!endorseTargetName || endorseMutation.isPending}
              onClick={() =>
                selectedChequeForEndorse &&
                endorseMutation.mutate({
                  id: selectedChequeForEndorse.id,
                  endorsedTo: endorseTargetName,
                })
              }
            >
              تأیید واگذاری به شخص ثالث
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* مودال انتقال وجه بین‌حسابی */}
      <Dialog open={isTransferOpen} onOpenChange={setIsTransferOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>انتقال وجه بین حساب‌ها و صندوق‌ها</DialogTitle>
            <DialogDescription>
              جابجایی نقدینگی بین حساب‌های بانکی، صندوق‌ها و تنخواه‌گردان
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-3 py-2 text-xs">
            <div>
              <label className="text-[11px] font-semibold text-muted-foreground">حساب مبدا (کسر وجه)</label>
              <select
                value={transferData.sourceAccountId}
                onChange={(e) => setTransferData({ ...transferData, sourceAccountId: e.target.value })}
                className="mt-1 h-8 w-full rounded-md border border-input bg-background px-2 text-xs font-semibold"
              >
                {accounts.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name} ({money(a.balance)})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-[11px] font-semibold text-muted-foreground">حساب مقصد (واریز وجه)</label>
              <select
                value={transferData.targetAccountId}
                onChange={(e) => setTransferData({ ...transferData, targetAccountId: e.target.value })}
                className="mt-1 h-8 w-full rounded-md border border-input bg-background px-2 text-xs font-semibold"
              >
                {accounts.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name} ({money(a.balance)})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-[11px] font-semibold text-muted-foreground">مبلغ انتقال (ریال)</label>
              <Input
                type="number"
                value={transferData.amount}
                onChange={(e) => setTransferData({ ...transferData, amount: Number(e.target.value) })}
                className="mt-1 h-8 font-mono text-xs"
              />
            </div>

            <div>
              <label className="text-[11px] font-semibold text-muted-foreground">شماره یا کد پیگیری بانکی</label>
              <Input
                placeholder="شماره فیش یا ارجاع بانکی..."
                value={transferData.trackingCode}
                onChange={(e) => setTransferData({ ...transferData, trackingCode: e.target.value })}
                className="mt-1 h-8 font-mono text-xs"
              />
            </div>

            <div>
              <label className="text-[11px] font-semibold text-muted-foreground">شرح سند</label>
              <Input
                placeholder="تأمین وجه صندوق، شارژ تنخواه و..."
                value={transferData.description}
                onChange={(e) => setTransferData({ ...transferData, description: e.target.value })}
                className="mt-1 h-8 text-xs"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setIsTransferOpen(false)}>
              انصراف
            </Button>
            <Button
              size="sm"
              disabled={!transferData.amount || transferMutation.isPending}
              onClick={() => transferMutation.mutate(transferData)}
            >
              تأیید و اجرای انتقال
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
