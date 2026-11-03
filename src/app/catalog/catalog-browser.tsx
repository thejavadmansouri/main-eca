"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { formatToman, toFaDigits, toEnDigits } from "@/lib/digits";
import type { CatalogItem } from "@/lib/catalog";
import { QuickBuySheet } from "./quick-buy-sheet";
import { Icon } from "@/components/ui/icon";

export type { CatalogItem };

export type ShippingOption = {
  id: string;
  name: string;
  cost: number;
  freeAbove: number | null;
  note: string | null;
};

export type CartItem = {
  item: CatalogItem;
  qty: number;
};

/*
 * کاتالوگ پیشرفته سازمانی کاردو B2B:
 * - فیلترهای چندگانه: خودرو، مدل، قسمت‌های خودرو، سازنده قطعه، تاریخ و موجودی
 * - چیپس‌های لمسی سریع برای موبایل و تبلت
 * - کشوی فیلترهای پیشرفته با نشانگر تعداد فیلترهای فعال
 * - مرتب‌سازی هوشمند (جدیدترین، قیمت، موجودی)
 * - بدون لرزش و بدون درخواست‌های تکراری
 */
export function CatalogBrowser(props: {
  initialItems: CatalogItem[];
  canOrder: boolean;
  wallet: number;
  availableCredit: number;
  creditLimit: number;
  tierDiscount: number;
  customerDiscount: number;
  shipping: ShippingOption[];
  tierName?: string | null;
  inTransitCount?: number;
  activeChequesCount?: number;
  isAdmin?: boolean;
  defaultAddress?: string | null;
}) {
  const router = useRouter();

  // فیلترهای اصلی
  const [query, setQuery] = useState("");
  const [carBrand, setCarBrand] = useState(""); // برند خودرو: پراید، پژو...
  const [carModel, setCarModel] = useState(""); // مدل خودرو
  const [category, setCategory] = useState(""); // قسمت خودرو: ترمز، موتور...
  const [partBrand, setPartBrand] = useState(""); // سازنده قطعه: ایساکو، والئو...
  const [dateFilter, setDateFilter] = useState("all"); // تاریخ: all, week, month, quarter
  const [inStockOnly, setInStockOnly] = useState(false); // فقط موجود
  const [sort, setSort] = useState("default"); // مرتب‌سازی

  // وضعیت رابط، سبد و باربری
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [items, setItems] = useState<CatalogItem[]>(props.initialItems);
  const [loading, setLoading] = useState(false);
  const [selectedQuickBuy, setSelectedQuickBuy] = useState<{ item: CatalogItem; qty: number } | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [cartShippingId, setCartShippingId] = useState(props.shipping[0]?.id ?? "");
  const [shippingAddress, setShippingAddress] = useState(props.defaultAddress ?? "");
  const [showShippingPopover, setShowShippingPopover] = useState(false);
  const [draftSaved, setDraftSaved] = useState(false);
  const [checkoutBusy, setCheckoutBusy] = useState(false);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [addedToast, setAddedToast] = useState<string | null>(null);

  const shippingPopoverRef = useRef<HTMLDivElement>(null);
  const topCartRef = useRef<HTMLDivElement>(null);
  const CART_DRAFT_KEY = "kardo_b2b_cart_draft_v1";

  // سفارش مجدد هوشمند و هشدارهای موجودی
  const [smartReorderItems, setSmartReorderItems] = useState<any[]>([]);
  const [showSmartReorder, setShowSmartReorder] = useState(false);
  const [subscribedAlerts, setSubscribedAlerts] = useState<Record<string, boolean>>({});
  const [subscribingId, setSubscribingId] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/customer/smart-reorder")
      .then((r) => r.json())
      .then((d) => {
        if (d.ok && Array.isArray(d.items)) {
          setSmartReorderItems(d.items);
        }
      })
      .catch(() => {});
  }, []);

  async function handleStockAlert(productId: string) {
    setSubscribingId(productId);
    try {
      const res = await fetch("/api/catalog/stock-alert", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId }),
      });
      const d = await res.json();
      if (d.ok) {
        setSubscribedAlerts((prev) => ({ ...prev, [productId]: true }));
        setAddedToast(d.message);
      }
    } catch {}
    finally {
      setSubscribingId(null);
    }
  }

  function handleAddAllSmartReorder() {
    smartReorderItems.forEach((it) => {
      const full = items.find((x) => x.id === it.id);
      if (full) {
        addToCart(full, it.suggestedQty);
      }
    });
    setAddedToast("تمام اقلام پیشنهادی به سبد خرید اضافه شدند");
  }

  const isInitialMount = useRef(true);

  // واکشی کاتالوگ با فیلترها
  const load = useCallback(async () => {
    setLoading(true);
    setError(null);

    const qs = new URLSearchParams();
    if (query.trim()) qs.set("q", query.trim());
    if (carBrand) qs.set("brand", carBrand);
    if (carModel) qs.set("model", carModel);
    if (category) qs.set("category", category);
    if (partBrand) qs.set("partBrand", partBrand);
    if (inStockOnly) qs.set("inStock", "true");
    if (dateFilter !== "all") qs.set("dateFilter", dateFilter);
    if (sort !== "default") qs.set("sort", sort);

    try {
      const res = await fetch(`/api/catalog?${qs.toString()}`);
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setError(data.message ?? "کاتالوگ بارگذاری نشد");
        return;
      }

      setItems(data.items ?? []);
    } catch {
      setError("ارتباط با سرور برقرار نشد");
    } finally {
      setLoading(false);
    }
  }, [query, carBrand, carModel, category, partBrand, inStockOnly, dateFilter, sort]);

  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }

    const t = setTimeout(() => {
      load();
    }, 280);

    return () => clearTimeout(t);
  }, [query, carBrand, carModel, category, partBrand, inStockOnly, dateFilter, sort, load]);

  // استخراج لیست گزینه‌های فیلتر از کل کاتالوگ
  const allCarBrands = useMemo(
    () => Array.from(new Set(props.initialItems.map((i) => i.brand))).filter(Boolean).sort(),
    [props.initialItems],
  );

  const allCategories = useMemo(
    () => Array.from(new Set(props.initialItems.map((i) => i.category))).filter(Boolean).sort(),
    [props.initialItems],
  );

  const allPartBrands = useMemo(
    () => Array.from(new Set(props.initialItems.map((i) => i.partBrand))).filter(Boolean).sort() as string[],
    [props.initialItems],
  );

  const allModels = useMemo(() => {
    const list = props.initialItems
      .filter((i) => !carBrand || i.brand === carBrand)
      .map((i) => i.model)
      .filter(Boolean) as string[];
    return Array.from(new Set(list)).sort();
  }, [props.initialItems, carBrand]);

  // شمارش تعداد فیلترهای فعال
  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (carBrand) count++;
    if (carModel) count++;
    if (category) count++;
    if (partBrand) count++;
    if (inStockOnly) count++;
    if (dateFilter !== "all") count++;
    if (sort !== "default") count++;
    return count;
  }, [carBrand, carModel, category, partBrand, inStockOnly, dateFilter, sort]);

  const resetAllFilters = () => {
    setQuery("");
    setCarBrand("");
    setCarModel("");
    setCategory("");
    setPartBrand("");
    setInStockOnly(false);
    setDateFilter("all");
    setSort("default");
  };

  // افزودن به سبد خرید چندقلمی
  const addToCart = (item: CatalogItem, qtyToAdd?: number) => {
    const addQty = qtyToAdd && qtyToAdd > 0 ? qtyToAdd : 1;
    const maxStock = item.stockQty > 0 ? item.stockQty : 99999;

    setCart((prev) => {
      const existing = prev.find((c) => c.item.id === item.id);
      if (existing) {
        const nextQty = Math.min(maxStock, existing.qty + addQty);
        return prev.map((c) => (c.item.id === item.id ? { ...c, qty: nextQty } : c));
      }
      return [...prev, { item, qty: Math.min(maxStock, addQty) }];
    });

    setAddedToast(`«${item.name}» (${toFaDigits(addQty)} ${item.unit}) به سبد سفارش اضافه شد`);
    setTimeout(() => setAddedToast(null), 2500);
  };

  const updateCartQty = useCallback((productId: string, newQty: number) => {
    setCart((prev) =>
      prev
        .map((c) => {
          if (c.item.id !== productId) return c;
          if (newQty <= 0) return { ...c, qty: 0 };
          const max = c.item.stockQty > 0 ? c.item.stockQty : 99999;
          const target = Math.max(1, Math.min(max, newQty));
          return { ...c, qty: target };
        })
        .filter((c) => c.qty > 0),
    );
  }, []);

  const removeCartItem = (productId: string) => {
    setCart((prev) => prev.filter((c) => c.item.id !== productId));
  };

  // بررسی پارامتر add در URL برای اضافه شدن خودکار قطعه از صفحه جزییات کالا
  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const addId = params.get("add");
    const addQty = parseInt(params.get("qty") || "0", 10);
    if (addId) {
      const target = items.find((it) => it.id === addId);
      if (target) {
        addToCart(target, addQty > 0 ? addQty : undefined);
        topCartRef.current?.scrollIntoView({ behavior: "smooth" });
        window.history.replaceState({}, "", window.location.pathname);
      }
    }
  }, [items]);

  // مدیریت تعداد انتخابی در لحظه برای هر کالا
  const [itemQuantities, setItemQuantities] = useState<Record<string, number>>({});
  const [rawInputValues, setRawInputValues] = useState<Record<string, string>>({});

  const getItemQty = useCallback(
    (item: CatalogItem) => {
      const inCart = cart.find((c) => c.item.id === item.id);
      if (inCart) return inCart.qty;
      return itemQuantities[item.id] ?? 1;
    },
    [cart, itemQuantities],
  );

  const setItemQty = useCallback(
    (item: CatalogItem, desired: number) => {
      const max = item.stockQty > 0 ? item.stockQty : 99999;
      const valid = Math.max(1, Math.min(max, desired));

      const inCart = cart.find((c) => c.item.id === item.id);
      if (inCart) {
        updateCartQty(item.id, valid);
      } else {
        setItemQuantities((prev) => ({ ...prev, [item.id]: valid }));
      }
      setRawInputValues((prev) => {
        const next = { ...prev };
        delete next[item.id];
        return next;
      });
    },
    [cart, updateCartQty],
  );

  const adjustItemQty = useCallback(
    (item: CatalogItem, delta: number) => {
      const inCart = cart.find((c) => c.item.id === item.id);
      if (inCart) {
        const nextQty = inCart.qty + delta;
        if (nextQty <= 0) {
          removeCartItem(item.id);
        } else {
          updateCartQty(item.id, nextQty);
        }
      } else {
        if (delta > 0) {
          // افزودن مستقیم با ۱ کلیک از دکمه + در جدول کالاها
          addToCart(item, 1);
        } else {
          setItemQuantities((prev) => {
            const cur = prev[item.id] ?? 1;
            return { ...prev, [item.id]: Math.max(1, cur + delta) };
          });
        }
      }
    },
    [cart, updateCartQty, addToCart],
  );

  const handleQtyInputChange = (item: CatalogItem, text: string) => {
    const enText = toEnDigits(text);
    const digitsOnly = enText.replace(/\D/g, "");
    setRawInputValues((prev) => ({ ...prev, [item.id]: digitsOnly }));
    if (digitsOnly.length > 0) {
      const parsed = parseInt(digitsOnly, 10);
      if (!isNaN(parsed) && parsed > 0) {
        const inCart = cart.find((c) => c.item.id === item.id);
        const max = item.stockQty > 0 ? item.stockQty : 99999;
        const clamped = Math.min(max, parsed);
        if (inCart) {
          updateCartQty(item.id, clamped);
        } else {
          setItemQuantities((prev) => ({ ...prev, [item.id]: clamped }));
        }
      }
    }
  };

  const handleQtyInputBlur = (item: CatalogItem) => {
    const raw = rawInputValues[item.id];
    if (raw !== undefined) {
      const parsed = parseInt(toEnDigits(raw), 10);
      const inCart = cart.find((c) => c.item.id === item.id);
      if (isNaN(parsed) || parsed <= 0) {
        if (inCart) {
          removeCartItem(item.id);
        } else {
          setItemQuantities((prev) => ({ ...prev, [item.id]: 1 }));
        }
      } else {
        setItemQty(item, parsed);
      }
      setRawInputValues((prev) => {
        const next = { ...prev };
        delete next[item.id];
        return next;
      });
    }
  };

  // خلاصه مبالغ سبد
  const cartSummary = useMemo(() => {
    let subtotal = 0;
    let itemCount = 0;

    for (const c of cart) {
      itemCount += c.qty;
      const base = c.item.priceBefore ?? c.item.price ?? 0;
      let volumeDiscount = 0;
      for (const v of c.item.volumePrices) {
        if (c.qty >= v.qtyFrom) volumeDiscount = Math.max(volumeDiscount, v.discountPercent);
      }
      const totalDisc = Math.min(90, volumeDiscount + props.tierDiscount + props.customerDiscount);
      const unit = Math.round(base * (1 - totalDisc / 100));
      subtotal += unit * c.qty;
    }

    const shipping = props.shipping.find((s) => s.id === cartShippingId);
    const shippingCost =
      shipping && !(shipping.freeAbove && subtotal >= shipping.freeAbove) ? shipping.cost : 0;

    return {
      subtotal,
      itemCount,
      shippingCost,
      total: subtotal + shippingCost,
      distinctCount: cart.length,
    };
  }, [cart, props.tierDiscount, props.customerDiscount, props.shipping, cartShippingId]);

  // بازیابی سبد خرید ذخیره‌شده از حافظه مرورگر در بارگذاری اولیه
  useEffect(() => {
    try {
      const raw = localStorage.getItem(CART_DRAFT_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setCart(parsed);
        }
      }
      const savedShipping = localStorage.getItem(CART_DRAFT_KEY + "_shipping");
      if (savedShipping) setCartShippingId(savedShipping);
      const savedAddress = localStorage.getItem(CART_DRAFT_KEY + "_address");
      if (savedAddress) setShippingAddress(savedAddress);
    } catch {}
  }, []);

  // ذخیره خودکار تغییرات سبد در حافظه مرورگر
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      if (cart.length > 0) {
        localStorage.setItem(CART_DRAFT_KEY, JSON.stringify(cart));
        localStorage.setItem(CART_DRAFT_KEY + "_shipping", cartShippingId);
        if (shippingAddress) localStorage.setItem(CART_DRAFT_KEY + "_address", shippingAddress);
      } else {
        localStorage.removeItem(CART_DRAFT_KEY);
      }
    } catch {}
  }, [cart, cartShippingId, shippingAddress]);

  // بستن منوی کوچک انتخاب باربری هنگام کلیک در خارج از آن
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        shippingPopoverRef.current &&
        !shippingPopoverRef.current.contains(event.target as Node)
      ) {
        setShowShippingPopover(false);
      }
    }
    if (showShippingPopover) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [showShippingPopover]);

  // دکمه سیو دستی اقلام سبد
  const handleSaveCartDraft = () => {
    if (cart.length === 0) {
      setAddedToast("سبد سفارش خالی است");
      setTimeout(() => setAddedToast(null), 2000);
      return;
    }
    try {
      localStorage.setItem(CART_DRAFT_KEY, JSON.stringify(cart));
      localStorage.setItem(CART_DRAFT_KEY + "_shipping", cartShippingId);
      if (shippingAddress) localStorage.setItem(CART_DRAFT_KEY + "_address", shippingAddress);
      setDraftSaved(true);
      setAddedToast(`✓ اقلام سبد (${toFaDigits(cart.length)} ردیف) ذخیره شدند — با رفرش صفحه پاک نمی‌شوند`);
      setTimeout(() => {
        setDraftSaved(false);
        setAddedToast(null);
      }, 3500);
    } catch {
      setAddedToast("خطا در ذخیره‌سازی محلی سبد");
    }
  };

  const handleClearCart = () => {
    if (confirm("آیا مطمئن هستید می‌خواهید تمام اقلام سبد سفارش را خالی کنید؟")) {
      setCart([]);
      try {
        localStorage.removeItem(CART_DRAFT_KEY);
        localStorage.removeItem(CART_DRAFT_KEY + "_shipping");
      } catch {}
      setAddedToast("سبد سفارش خالی شد");
      setTimeout(() => setAddedToast(null), 2000);
    }
  };

  // ثبت پیش‌فاکتور از سبد خرید
  async function submitCartOrder() {
    setCheckoutBusy(true);
    setCheckoutError(null);

    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: cart.map((c) => ({ productId: c.item.id, qty: c.qty })),
          shippingId: cartShippingId,
          address: shippingAddress || undefined,
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setCheckoutError(data.message ?? "ثبت پیش‌فاکتور با خطا مواجه شد");
        setCheckoutBusy(false);
        return;
      }

      try {
        localStorage.removeItem(CART_DRAFT_KEY);
        localStorage.removeItem(CART_DRAFT_KEY + "_shipping");
        localStorage.removeItem(CART_DRAFT_KEY + "_address");
      } catch {}

      setCart([]);
      router.push(`/orders/${data.order.id}`);
    } catch {
      setCheckoutError("خطا در برقراری ارتباط با سرور");
      setCheckoutBusy(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-6xl px-3 sm:px-6 py-3 sm:py-6 pb-28">
      {/* اعلان موقت (Toast) */}
      {addedToast && (
        <div className="fixed top-18 left-1/2 -translate-x-1/2 z-50 bg-slate-900 text-white text-xs px-4 py-2.5 rounded-full shadow-lg flex items-center gap-2 animate-in fade-in slide-in-from-top-3 duration-200">
          <span className="size-2 rounded-full bg-emerald-500" />
          <span>{addedToast}</span>
        </div>
      )}

      {/* سر صفحه و وضعیت تخفیف‌ها */}
      <div className="flex items-center justify-between gap-4 flex-wrap pb-3 border-b border-slate-200">
        <div>
          <h1 className="text-lg sm:text-2xl font-extrabold tracking-tight text-slate-900">
            کاتالوگ قطعات یدکی خودرو
          </h1>
          <p className="hidden sm:block text-xs sm:text-sm text-slate-500 mt-0.5">
            فیلتر پیشرفته بر اساس خودرو، مدل، قسمت فنی، برند سازنده قطعه و تاریخ ورود
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs flex-wrap">
          <div className="border border-slate-200 rounded-lg px-3 py-1.5 bg-white shadow-2xs">
            <span className="text-slate-500 font-medium">تخفیف طبقه: </span>
            <b className="text-blue-600 nums font-bold text-sm">{toFaDigits(props.tierDiscount)}٪</b>
          </div>
          {props.customerDiscount > 0 && (
            <div className="border border-slate-200 rounded-lg px-3 py-1.5 bg-white shadow-2xs">
              <span className="text-slate-500 font-medium">تخفیف همکار: </span>
              <b className="text-blue-600 nums font-bold text-sm">{toFaDigits(props.customerDiscount)}٪</b>
            </div>
          )}
          <Link
            href="/catalog/print"
            prefetch={false}
            className="btn bg-slate-900 hover:bg-slate-800 text-white text-xs px-3 py-1.5 flex items-center gap-1.5 rounded-lg shadow-sm font-bold active:scale-95 transition-all"
            title="دانلود کاتالوگ چاپی و اکسل قیمت‌ها"
          >
            <Icon name="printer" className="size-4" />
            <span>کاتالوگ چاپی / PDF</span>
          </Link>
          {cart.length > 0 && (
            <button
              onClick={() => topCartRef.current?.scrollIntoView({ behavior: "smooth" })}
              className="btn btn-blue text-xs px-3.5 py-1.5 flex items-center gap-2 shadow-sm font-black rounded-lg"
            >
              <span>سبد سفارش</span>
              <span className="nums font-black bg-white text-blue-700 rounded-full px-1.5 py-0.5 text-[11px] leading-none shadow-2xs">
                {toFaDigits(cart.length)}
              </span>
            </button>
          )}
        </div>
      </div>

      {/* ۰. باکس جدولی سبد سفارش جاری در بالای قسمت سرچ (Top Cart Table Box) — به محض اضافه شدن اولین کالا باز می‌شود */}
      {cart.length > 0 && (
        <div ref={topCartRef} className="mt-3 sm:mt-4 p-4 sm:p-5 bg-white border-2 border-blue-200/90 rounded-2xl shadow-xs space-y-3.5 animate-in fade-in slide-in-from-top-3 duration-200">
          {/* هدر باکس سبد بالا */}
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <span className="size-8 rounded-xl bg-blue-50 border border-blue-200 text-blue-600 grid place-items-center">
                <Icon name="cart" className="size-4.5" />
              </span>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-extrabold text-sm sm:text-base text-slate-900">
                    سبد سفارش جاری شما
                  </h3>
                  <span className="nums text-xs font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">
                    {toFaDigits(cart.length)} قلم کالا
                  </span>
                  <span className="nums text-xs text-slate-500 hidden sm:inline">
                    ({toFaDigits(cartSummary.itemCount)} عدد)
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 mt-0.5 hidden sm:block">
                  اقلام انتخابی شما به‌صورت آنی به این لیست افزوده می‌شوند و می‌توانید تعداد را ویرایش کنید.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleSaveCartDraft}
                className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-xl border border-blue-200 bg-blue-50/80 hover:bg-blue-100 text-blue-800 shadow-2xs transition active:scale-95 cursor-pointer"
                title="ذخیره اقلام سبد تا با رفرش یا خروج از صفحه پاک نشوند"
              >
                <svg className="size-3.5 text-blue-700" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                  <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
                  <polyline points="17 21 17 13 7 13 7 21" />
                  <polyline points="7 3 7 8 15 8" />
                </svg>
                <span>{draftSaved ? "✓ ذخیره شد" : "سیو سبد"}</span>
              </button>

              <button
                type="button"
                onClick={handleClearCart}
                className="text-xs text-slate-400 hover:text-rose-600 px-2.5 py-1.5 rounded-lg hover:bg-rose-50 transition-colors font-medium cursor-pointer"
                title="تخلیه کامل سبد"
              >
                تخلیه سبد
              </button>
            </div>
          </div>

          {/* جدول اقلام سبد */}
          <div className="overflow-x-auto scrollbar-thin rounded-xl border border-slate-200/80">
            <table className="min-w-full divide-y divide-slate-200 text-xs text-right">
              <thead className="bg-slate-50 text-slate-600 font-bold">
                <tr>
                  <th className="py-2.5 px-3">نام و مشخصات کالا</th>
                  <th className="py-2.5 px-3">کد فنی (SKU)</th>
                  <th className="py-2.5 px-3 text-center">تعداد بسته</th>
                  <th className="py-2.5 px-3 text-center">تعداد سفارش</th>
                  <th className="py-2.5 px-3 text-left">قیمت واحد (تومان)</th>
                  <th className="py-2.5 px-3 text-left">جمع ردیف (تومان)</th>
                  <th className="py-2.5 px-2 text-center w-10">حذف</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {cart.map(({ item, qty }) => {
                  const base = item.priceBefore ?? item.price ?? 0;
                  let volumeDiscount = 0;
                  for (const v of item.volumePrices) {
                    if (qty >= v.qtyFrom) volumeDiscount = Math.max(volumeDiscount, v.discountPercent);
                  }
                  const totalDisc = Math.min(90, volumeDiscount + props.tierDiscount + props.customerDiscount);
                  const effectiveUnitPrice = Math.round(base * (1 - totalDisc / 100));
                  const lineTotal = effectiveUnitPrice * qty;
                  const step = Math.max(1, item.packSize);

                  return (
                    <tr key={item.id} className="hover:bg-blue-50/30 transition-colors">
                      <td className="py-2.5 px-3">
                        <div className="font-bold text-slate-900 truncate max-w-xs">{item.name}</div>
                        <div className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-1.5">
                          <span className="font-semibold text-slate-700">{item.brand}</span>
                          {item.partBrand && <span>· سازنده: {item.partBrand}</span>}
                        </div>
                      </td>
                      <td className="py-2.5 px-3">
                        <span className="font-mono text-xs font-semibold text-slate-700 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded inline-block nums">
                          {item.sku}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-center nums text-slate-700 font-bold text-xs">
                        {toFaDigits(item.packSize)} {item.unit}
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <div className="inline-flex items-center gap-1 bg-slate-50 border border-slate-300 rounded-lg p-0.5 shadow-2xs">
                          <button
                            type="button"
                            onClick={() => {
                              if (qty > 1) {
                                updateCartQty(item.id, qty - 1);
                              } else {
                                removeCartItem(item.id);
                              }
                            }}
                            className="size-7 grid place-items-center rounded bg-white text-slate-700 hover:bg-rose-50 hover:text-rose-600 active:scale-95 font-black text-sm border border-slate-200 transition-all cursor-pointer"
                            title={qty > 1 ? "کاهش یک عدد" : "حذف از سبد"}
                            aria-label="کاهش"
                          >
                            −
                          </button>
                          <input
                            type="text"
                            inputMode="numeric"
                            value={toFaDigits(rawInputValues[item.id] ?? qty)}
                            onChange={(e) => handleQtyInputChange(item, e.target.value)}
                            onBlur={() => handleQtyInputBlur(item)}
                            className="w-14 h-8 text-center font-black text-sm text-slate-900 bg-white border border-slate-300 rounded-lg outline-none focus:border-blue-500 focus:bg-blue-50/50 transition nums"
                            title="تغییر مستقیم تعداد"
                          />
                          <button
                            type="button"
                            onClick={() => updateCartQty(item.id, qty + 1)}
                            disabled={item.stockQty > 0 && qty >= item.stockQty}
                            className="size-7 grid place-items-center rounded bg-blue-600 text-white hover:bg-blue-700 active:scale-95 font-black text-sm disabled:opacity-30 disabled:pointer-events-none transition-all cursor-pointer shadow-2xs"
                            title="افزایش یک عدد"
                            aria-label="افزایش"
                          >
                            +
                          </button>
                        </div>
                      </td>
                      <td className="py-2.5 px-3 text-left">
                        <span className="font-extrabold text-sm text-slate-800 nums">
                          {formatToman(effectiveUnitPrice)}
                        </span>
                        <span className="text-[10px] text-slate-500 ms-1 font-normal font-sans">تومان</span>
                      </td>
                      <td className="py-2.5 px-3 text-left">
                        <span className="font-black text-base text-blue-700 nums">
                          {formatToman(lineTotal)}
                        </span>
                        <span className="text-[10px] text-blue-600/80 ms-1 font-normal font-sans">تومان</span>
                      </td>
                      <td className="py-2.5 px-2 text-center">
                        <button
                          type="button"
                          onClick={() => removeCartItem(item.id)}
                          className="size-7 grid place-items-center rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors mx-auto"
                          title="حذف از سبد"
                        >
                          ✕
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* نوار پایین جدول: جمع کل و انتخاب نحوه باربری و آدرس و صدور پیش‌فاکتور */}
          <div className="pt-2.5 flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3 sm:gap-4 text-xs flex-wrap">
              <div>
                <span className="text-slate-500 font-medium">مجموع اقلام: </span>
                <span className="nums font-black text-base sm:text-lg text-slate-900">
                  {formatToman(cartSummary.subtotal)}
                </span>
                <span className="text-[11px] text-slate-500 ms-1 font-sans">تومان</span>
              </div>

              {cartSummary.shippingCost > 0 ? (
                <div>
                  <span className="text-slate-500 font-medium">کرایه باربری: </span>
                  <span className="nums font-extrabold text-sm text-slate-800">
                    {formatToman(cartSummary.shippingCost)}
                  </span>
                  <span className="text-[11px] text-slate-500 ms-1 font-sans">تومان</span>
                </div>
              ) : (
                <div className="text-[11px] text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md font-bold">
                  ارسال رایگان
                </div>
              )}

              <div className="border-s border-slate-200 ps-3 sm:ps-4">
                <span className="text-slate-900 font-bold">مبلغ نهایی: </span>
                <span className="nums font-black text-lg sm:text-xl text-blue-700">
                  {formatToman(cartSummary.total)}
                </span>
                <span className="text-xs text-blue-900 font-bold ms-1 font-sans">تومان</span>
              </div>

              {(props.tierDiscount > 0 || props.customerDiscount > 0) && (
                <span className="text-[10px] text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full font-bold">
                  {toFaDigits(props.tierDiscount + props.customerDiscount)}٪ تخفیف اعمال شد
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              {/* منوی کوچک بازشونده در همان‌جا برای انتخاب باربری و نشانی */}
              <div className="relative" ref={shippingPopoverRef}>
                <button
                  type="button"
                  onClick={() => setShowShippingPopover((prev) => !prev)}
                  className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                    showShippingPopover
                      ? "bg-blue-50 border-blue-400 text-blue-900 shadow-xs"
                      : "bg-white border-slate-300 text-slate-700 hover:bg-slate-50 hover:border-slate-400 shadow-2xs"
                  }`}
                  title="انتخاب نحوه ارسال باربری و نشانی مقصد"
                >
                  <Icon name="truck" className="size-4 text-blue-600" />
                  <span>
                    {props.shipping.find((s) => s.id === cartShippingId)?.name ?? "انتخاب باربری و آدرس"}
                  </span>
                  <span className="text-[10px] text-slate-600 font-mono nums">
                    {cartSummary.shippingCost > 0
                      ? `(${formatToman(cartSummary.shippingCost)} ت)`
                      : "(رایگان)"}
                  </span>
                  <span className="text-[10px] text-slate-600">▾</span>
                </button>

                {showShippingPopover && (
                  <div className="absolute start-0 bottom-full mb-2 w-80 sm:w-96 bg-white border border-slate-200 rounded-2xl shadow-xl p-4 z-40 animate-in fade-in zoom-in-95 duration-150 space-y-3.5 text-right">
                    <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                      <div className="flex items-center gap-1.5 font-extrabold text-xs text-slate-900">
                        <Icon name="truck" className="size-4 text-blue-600" />
                        <span>روش باربری و نشانی مقصد</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setShowShippingPopover(false)}
                        className="size-6 grid place-items-center rounded-lg text-slate-600 hover:text-slate-700 hover:bg-slate-100 text-xs font-bold cursor-pointer"
                      >
                        ✕
                      </button>
                    </div>

                    {/* گزینه‌های باربری */}
                    <div className="space-y-1.5">
                      <span className="text-[11px] font-bold text-slate-600 block">
                        روش ارسال باربری:
                      </span>
                      <div className="space-y-1.5 max-h-48 overflow-y-auto scrollbar-thin">
                        {props.shipping.map((s) => {
                          const isSelected = s.id === cartShippingId;
                          const free = s.freeAbove !== null && cartSummary.subtotal >= s.freeAbove;
                          return (
                            <label
                              key={s.id}
                              onClick={() => setCartShippingId(s.id)}
                              className={`flex items-start justify-between gap-2 p-2.5 rounded-xl border cursor-pointer transition-all ${
                                isSelected
                                  ? "bg-blue-50/80 border-blue-400 shadow-2xs"
                                  : "bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/50"
                              }`}
                            >
                              <div className="flex items-center gap-2">
                                <input
                                  type="radio"
                                  name="inlineShipping"
                                  checked={isSelected}
                                  onChange={() => setCartShippingId(s.id)}
                                  className="accent-blue-600 size-3.5"
                                />
                                <div>
                                  <div className="text-xs font-bold text-slate-900">{s.name}</div>
                                  {s.note && (
                                    <div className="text-[10px] text-slate-600 mt-0.5">{s.note}</div>
                                  )}
                                </div>
                              </div>
                              <div className="text-left font-mono nums text-[11px] shrink-0 font-bold">
                                {free ? (
                                  <span className="text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                                    رایگان
                                  </span>
                                ) : s.cost > 0 ? (
                                  <span className="text-slate-800">{formatToman(s.cost)} ت</span>
                                ) : (
                                  <span className="text-slate-600">پس‌کرایه</span>
                                )}
                              </div>
                            </label>
                          );
                        })}
                      </div>
                    </div>

                    {/* نشانی و مقصد تحویل بار */}
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-slate-600 block">
                        نشانی فروشگاه یا پایانه باربری مقصد:
                      </label>
                      <input
                        type="text"
                        value={shippingAddress}
                        onChange={(e) => setShippingAddress(e.target.value)}
                        placeholder="کرمان، خیابان شریعتی، فروشگاه مرکزی..."
                        className="w-full text-xs p-2 rounded-xl border border-slate-300 focus:border-blue-500 focus:bg-blue-50/30 outline-none transition font-medium"
                      />
                      <span className="text-[10px] text-slate-600 block">
                        پیش‌فاکتور با این مشخصات باربری و آدرس صادر می‌شود.
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => setShowShippingPopover(false)}
                      className="w-full py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs transition cursor-pointer"
                    >
                      تأیید و ذخیره مشخصات باربری
                    </button>
                  </div>
                )}
              </div>

              {/* دکمه ثبت پیش‌فاکتور رسمی */}
              <button
                type="button"
                onClick={submitCartOrder}
                disabled={checkoutBusy}
                className="btn btn-emerald text-xs px-4 py-2 rounded-xl font-black shadow-xs active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer"
              >
                {checkoutBusy ? "در حال ثبت…" : "ثبت پیش‌فاکتور رسمی ←"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* مرکز صفحه: بخش جست‌وجوی هوشمند با زوم کامل (Focal Hero Search Console) */}
      <div className="mt-3 sm:mt-4 p-3.5 sm:p-6 bg-white border border-slate-200/90 rounded-2xl shadow-xs space-y-3.5">
        {/* ۱. نوار جست‌وجوی بزرگ و برجسته (Hero Zoom Search) */}
        <div className="relative w-full group">
          <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none text-slate-600 group-focus-within:text-blue-600 transition-colors">
            <svg className="size-5.5 sm:size-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" x2="16.65" y1="21" y2="16.65" />
            </svg>
          </div>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="جست‌وجوی سریع نام قطعه، کد فنی SKU، کد OEM، بارکد یا نام برند قطعه‌ساز..."
            className="w-full h-14 sm:h-16 pr-12 sm:pr-14 pl-12 sm:pl-14 text-sm sm:text-base border-2 border-slate-200 focus:border-blue-600 focus:ring-4 focus:ring-blue-100 rounded-2xl bg-slate-50/40 hover:bg-white focus:bg-white shadow-2xs focus:shadow-md transition-all font-medium placeholder:text-slate-400 text-slate-900 outline-none"
            autoComplete="off"
          />
          {query && (
            <div className="absolute inset-y-0 left-3 flex items-center">
              <button
                type="button"
                onClick={() => setQuery("")}
                className="size-8 grid place-items-center text-slate-600 hover:text-slate-700 hover:bg-slate-100 rounded-full transition-colors text-sm"
                aria-label="پاک کردن متن جست‌وجو"
              >
                ✕
              </button>
            </div>
          )}
        </div>

        {/* ۲. نوار ابزار: دکمه فیلترها و تیک سفارش مجدد هوشمند */}
        <div className="flex items-center justify-between gap-3 flex-wrap pt-0.5">
          <div className="flex items-center gap-2.5 flex-wrap">
            {/* دکمه فیلترها */}
            <button
              type="button"
              onClick={() => setShowAdvancedFilters((prev) => !prev)}
              className={`btn text-xs px-4 py-2.5 rounded-xl flex items-center gap-2 border transition-all shrink-0 min-h-[42px] font-bold ${
                activeFiltersCount > 0 || showAdvancedFilters
                  ? "bg-blue-50 border-blue-300 text-blue-700 shadow-xs"
                  : "bg-white border-slate-300 text-slate-700 hover:bg-slate-50 hover:border-slate-400"
              }`}
            >
              <svg className="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
              </svg>
              <span>فیلترها</span>
              {activeFiltersCount > 0 && (
                <span className="size-5 rounded-full bg-blue-600 text-white grid place-items-center text-[10px] font-black nums">
                  {toFaDigits(activeFiltersCount)}
                </span>
              )}
            </button>

            {/* تیک سفارش مجدد هوشمند — فقط با زدن این تیک دیده می‌شود */}
            <label className={`inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl border cursor-pointer select-none text-xs transition-all min-h-[42px] ${
              showSmartReorder
                ? "bg-amber-50 border-amber-300 text-amber-900 font-bold shadow-xs"
                : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300 font-medium"
            }`}>
              <input
                type="checkbox"
                checked={showSmartReorder}
                onChange={(e) => setShowSmartReorder(e.target.checked)}
                className="size-4 rounded border-slate-300 text-amber-600 focus:ring-amber-500 cursor-pointer"
              />
              <span>سفارش مجدد هوشمند (اقلام پرتکرار من)</span>
              {smartReorderItems.length > 0 && (
                <span className="nums text-[10px] bg-amber-200/80 text-amber-950 px-1.5 py-0.2 rounded-full font-black">
                  {toFaDigits(smartReorderItems.length)}
                </span>
              )}
            </label>

            {/* تیک فقط موجود */}
            <label className={`inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl border cursor-pointer select-none text-xs transition-all min-h-[42px] ${
              inStockOnly
                ? "bg-emerald-50 border-emerald-300 text-emerald-900 font-bold shadow-xs"
                : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300 font-medium"
            }`}>
              <input
                type="checkbox"
                checked={inStockOnly}
                onChange={(e) => setInStockOnly(e.target.checked)}
                className="size-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
              />
              <span>فقط موجود در انبار</span>
            </label>
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
            <span>تعداد نتایج:</span>
            <b className="nums font-black text-slate-900 text-sm">{toFaDigits(items.length)}</b>
            <span>قلم کالا</span>
          </div>
        </div>
      </div>

      {/* ۴. پنل فیلترهای پیشرفته: در دسکتاپ پنل آکاردئونی و در موبایل Bottom Sheet استاندارد */}
      {showAdvancedFilters && (
        <>
          {/* نسخه دسکتاپ (md به بالا) */}
          <div className="hidden md:block mt-3 p-5 card bg-white border border-slate-200 rounded-xl shadow-xs space-y-4 animate-in fade-in slide-in-from-top-2 duration-150">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <span className="font-bold text-sm text-slate-800">
                تنظیمات فیلترهای تخصصی و مرتب‌سازی
              </span>
              <button
                onClick={resetAllFilters}
                className="text-xs text-rose-600 hover:underline font-medium"
              >
                پاک‌سازی همه فیلترها
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 text-xs">
              <div>
                <label className="label block mb-1 font-bold text-slate-700">خانواده / برند خودرو:</label>
                <select
                  value={carBrand}
                  onChange={(e) => setCarBrand(e.target.value)}
                  className="input text-xs border-slate-300 rounded-lg bg-white h-10 font-medium"
                >
                  <option value="">همه خودروها</option>
                  {allCarBrands.map((b) => (
                    <option key={b} value={b}>
                      {b}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="label block mb-1 font-bold text-slate-700">مدل دقیق خودرو:</label>
                <select
                  value={carModel}
                  onChange={(e) => setCarModel(e.target.value)}
                  className="input text-xs border-slate-300 rounded-lg bg-white h-10 font-medium"
                >
                  <option value="">همه مدل‌ها</option>
                  {allModels.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="label block mb-1 font-bold text-slate-700">قسمت و گروه فنی قطعه:</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="input text-xs border-slate-300 rounded-lg bg-white h-10 font-medium"
                >
                  <option value="">همه قسمت‌ها</option>
                  {allCategories.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="label block mb-1 font-bold text-slate-700">برند سازنده قطعه (پارت برند):</label>
                <select
                  value={partBrand}
                  onChange={(e) => setPartBrand(e.target.value)}
                  className="input text-xs border-slate-300 rounded-lg bg-white h-10 font-medium"
                >
                  <option value="">همه برندهای سازنده</option>
                  {allPartBrands.map((pb) => (
                    <option key={pb} value={pb}>
                      {pb}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="label block mb-1 font-bold text-slate-700">تاریخ ورود به انبار:</label>
                <select
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value)}
                  className="input text-xs border-slate-300 rounded-lg bg-white h-10 font-medium"
                >
                  <option value="all">همه زمان‌ها</option>
                  <option value="week">اقلام جدید (۷ روز اخیر)</option>
                  <option value="month">اقلام ماه اخیر (۳۰ روز)</option>
                  <option value="quarter">سه ماه اخیر (۹۰ روز)</option>
                </select>
              </div>

              <div>
                <label className="label block mb-1 font-bold text-slate-700">مرتب‌سازی بر اساس:</label>
                <select
                  value={sort}
                  onChange={(e) => setSort(e.target.value)}
                  className="input text-xs border-slate-300 rounded-lg bg-white h-10 font-medium"
                >
                  <option value="default">پیش‌فرض (خودرو و گروه کالا)</option>
                  <option value="newest">جدیدترین قطعات اضافه شده</option>
                  <option value="price_asc">ارزان‌ترین به گران‌ترین</option>
                  <option value="price_desc">گران‌ترین به ارزان‌ترین</option>
                  <option value="stock_desc">بیشترین موجودی انبار</option>
                </select>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100 flex items-center justify-between flex-wrap gap-3">
              <label className="flex items-center gap-2 cursor-pointer select-none text-xs text-slate-700 font-medium">
                <input
                  type="checkbox"
                  checked={inStockOnly}
                  onChange={(e) => setInStockOnly(e.target.checked)}
                  className="size-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                />
                <span>فقط نمایش قطعات موجود در انبار مرکزی</span>
              </label>

              <span className="nums text-xs text-slate-500">
                تعداد نتایج منطبق: <b className="text-slate-900 font-bold">{toFaDigits(items.length)}</b> قلم کالا
              </span>
            </div>
          </div>

          {/* نسخه موبایل: کشوی لغزنده از پایین (Mobile Filter Bottom Sheet) */}
          <div className="md:hidden fixed inset-0 z-50 flex flex-col justify-end bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
            <div className="bg-white w-full rounded-t-2xl max-h-[85vh] overflow-y-auto p-4 flex flex-col border-t border-slate-200 shadow-2xl animate-in slide-in-from-bottom duration-200">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm text-slate-900">فیلترهای تخصصی و مرتب‌سازی</span>
                  {activeFiltersCount > 0 && (
                    <span className="size-5 rounded-full bg-blue-600 text-white grid place-items-center text-[10px] font-bold nums">
                      {toFaDigits(activeFiltersCount)}
                    </span>
                  )}
                </div>
                <button
                  onClick={() => setShowAdvancedFilters(false)}
                  className="size-8 grid place-items-center text-slate-600 hover:text-slate-700 rounded-full hover:bg-slate-100 text-base"
                  aria-label="بستن فیلترها"
                >
                  ✕
                </button>
              </div>

              <div className="py-4 space-y-3.5 text-xs">
                <div>
                  <label className="label block mb-1 font-bold text-slate-700">خانواده / برند خودرو:</label>
                  <select
                    value={carBrand}
                    onChange={(e) => setCarBrand(e.target.value)}
                    className="input text-xs border-slate-300 rounded-lg bg-white h-11 font-medium"
                  >
                    <option value="">همه خودروها</option>
                    {allCarBrands.map((b) => (
                      <option key={b} value={b}>
                        {b}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="label block mb-1 font-bold text-slate-700">مدل دقیق خودرو:</label>
                  <select
                    value={carModel}
                    onChange={(e) => setCarModel(e.target.value)}
                    className="input text-xs border-slate-300 rounded-lg bg-white h-11 font-medium"
                  >
                    <option value="">همه مدل‌ها</option>
                    {allModels.map((m) => (
                      <option key={m} value={m}>
                        {m}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="label block mb-1 font-bold text-slate-700">قسمت و گروه فنی قطعه:</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="input text-xs border-slate-300 rounded-lg bg-white h-11 font-medium"
                  >
                    <option value="">همه قسمت‌ها</option>
                    {allCategories.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="label block mb-1 font-bold text-slate-700">برند سازنده قطعه (پارت برند):</label>
                  <select
                    value={partBrand}
                    onChange={(e) => setPartBrand(e.target.value)}
                    className="input text-xs border-slate-300 rounded-lg bg-white h-11 font-medium"
                  >
                    <option value="">همه برندهای سازنده</option>
                    {allPartBrands.map((pb) => (
                      <option key={pb} value={pb}>
                        {pb}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="label block mb-1">تاریخ ورود به انبار:</label>
                  <select
                    value={dateFilter}
                    onChange={(e) => setDateFilter(e.target.value)}
                    className="input text-xs border-slate-300 rounded-lg bg-white h-11"
                  >
                    <option value="all">همه زمان‌ها</option>
                    <option value="week">اقلام جدید (۷ روز اخیر)</option>
                    <option value="month">اقلام ماه اخیر (۳۰ روز)</option>
                    <option value="quarter">سه ماه اخیر (۹۰ روز)</option>
                  </select>
                </div>

                <div>
                  <label className="label block mb-1">مرتب‌سازی بر اساس:</label>
                  <select
                    value={sort}
                    onChange={(e) => setSort(e.target.value)}
                    className="input text-xs border-slate-300 rounded-lg bg-white h-11 font-medium"
                  >
                    <option value="default">پیش‌فرض (خودرو و گروه کالا)</option>
                    <option value="newest">جدیدترین قطعات اضافه شده</option>
                    <option value="price_asc">ارزان‌ترین به گران‌ترین</option>
                    <option value="price_desc">گران‌ترین به ارزان‌ترین</option>
                    <option value="stock_desc">بیشترین موجودی انبار</option>
                  </select>
                </div>

                <div className="pt-2">
                  <label className="flex items-center gap-2.5 p-3 rounded-lg border border-slate-200 bg-slate-50 cursor-pointer select-none text-xs text-slate-800 font-medium">
                    <input
                      type="checkbox"
                      checked={inStockOnly}
                      onChange={(e) => setInStockOnly(e.target.checked)}
                      className="size-4.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span>فقط نمایش قطعات موجود در انبار مرکزی</span>
                  </label>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center gap-2">
                <button
                  type="button"
                  onClick={resetAllFilters}
                  className="btn btn-ghost text-xs px-3 py-3 rounded-lg text-rose-600 hover:bg-rose-50"
                >
                  پاک‌سازی همه
                </button>
                <button
                  type="button"
                  onClick={() => setShowAdvancedFilters(false)}
                  className="btn btn-brass flex-1 text-xs py-3 rounded-lg font-bold shadow-sm"
                >
                  اعمال و مشاهده نتایج ({toFaDigits(items.length)})
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* برچسب‌های فیلترهای فعال با امکان حذف تک‌تک */}
      {activeFiltersCount > 0 && (
        <div className="mt-3 flex items-center gap-1.5 flex-wrap text-[11px]">
          <span className="text-slate-500 font-medium">فیلترهای فعال:</span>

          {carBrand && (
            <span className="inline-flex items-center gap-1 bg-slate-100 text-slate-800 px-2 py-0.5 rounded-md border border-slate-200">
              <span>خودرو: {carBrand}</span>
              <button onClick={() => setCarBrand("")} className="hover:text-rose-600">✕</button>
            </span>
          )}

          {category && (
            <span className="inline-flex items-center gap-1 bg-slate-100 text-slate-800 px-2 py-0.5 rounded-md border border-slate-200">
              <span>بخش: {category}</span>
              <button onClick={() => setCategory("")} className="hover:text-rose-600">✕</button>
            </span>
          )}

          {partBrand && (
            <span className="inline-flex items-center gap-1 bg-blue-50 text-blue-700 px-2 py-0.5 rounded-md border border-blue-200">
              <span>سازنده: {partBrand}</span>
              <button onClick={() => setPartBrand("")} className="hover:text-rose-600">✕</button>
            </span>
          )}

          {carModel && (
            <span className="inline-flex items-center gap-1 bg-slate-100 text-slate-800 px-2 py-0.5 rounded-md border border-slate-200">
              <span>مدل: {carModel}</span>
              <button onClick={() => setCarModel("")} className="hover:text-rose-600">✕</button>
            </span>
          )}

          {dateFilter !== "all" && (
            <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-700 px-2 py-0.5 rounded-md border border-amber-200">
              <span>
                تاریخ: {dateFilter === "week" ? "هفته اخیر" : dateFilter === "month" ? "ماه اخیر" : "سه ماه اخیر"}
              </span>
              <button onClick={() => setDateFilter("all")} className="hover:text-rose-600">✕</button>
            </span>
          )}

          {inStockOnly && (
            <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-md border border-emerald-200">
              <span>فقط موجود</span>
              <button onClick={() => setInStockOnly(false)} className="hover:text-rose-600">✕</button>
            </span>
          )}

          {sort !== "default" && (
            <span className="inline-flex items-center gap-1 bg-slate-100 text-slate-800 px-2 py-0.5 rounded-md border border-slate-200">
              <span>
                مرتب‌سازی:{" "}
                {sort === "newest"
                  ? "جدیدترین"
                  : sort === "price_asc"
                  ? "ارزان‌ترین"
                  : sort === "price_desc"
                  ? "گران‌ترین"
                  : "بیشترین موجودی"}
              </span>
              <button onClick={() => setSort("default")} className="hover:text-rose-600">✕</button>
            </span>
          )}

          <button onClick={resetAllFilters} className="text-rose-600 hover:underline ms-1 font-medium">
            حذف همه
          </button>
        </div>
      )}

      {error && (
        <div className="mt-3 card border-rose-200 bg-rose-50 p-3 text-xs text-rose-700 rounded-lg">
          {error}
        </div>
      )}

      {/* بخش سفارش مجدد هوشمند بر اساس خریدهای پیشین — فقط با فعال شدن تیک نمایش داده می‌شود */}
      {showSmartReorder && (
        <div className="mt-4 p-4 sm:p-5 bg-gradient-to-r from-amber-500/10 via-orange-500/5 to-slate-50 border border-amber-300 rounded-2xl shadow-xs space-y-3 animate-in fade-in slide-in-from-top-2 duration-150">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <Icon name="refresh" className="size-4 shrink-0 text-amber-700" />
              <div>
                <h3 className="text-xs sm:text-sm font-black text-slate-900">
                  سفارش مجدد هوشمند (اقلام پرتکرار شما در ماه‌های اخیر)
                </h3>
                <p className="text-[11px] text-slate-500 hidden sm:block">
                  این اقلام بر اساس بیشترین تکرار خرید شما با تعداد پیشنهادی آماده ثبت سریع هستند.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {smartReorderItems.length > 0 && (
                <button
                  onClick={handleAddAllSmartReorder}
                  className="text-xs font-black bg-amber-500 hover:bg-amber-400 active:scale-95 text-slate-950 px-3 py-1.5 rounded-xl transition-all shadow-xs"
                >
                  افزودن همه به سبد ({toFaDigits(smartReorderItems.length)} قلم)
                </button>
              )}
              <button
                onClick={() => setShowSmartReorder(false)}
                className="text-xs text-slate-600 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100"
                title="بستن بخش پیشنهادی"
              >
                ✕
              </button>
            </div>
          </div>

          {smartReorderItems.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 pt-1">
              {smartReorderItems.map((sItem) => (
                <div
                  key={sItem.id}
                  className="p-3 bg-white border border-slate-200/90 rounded-xl flex items-center justify-between gap-2 shadow-2xs hover:border-amber-400 transition-colors"
                >
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-bold text-slate-900 truncate">{sItem.name}</div>
                    <div className="text-[11px] text-slate-500 mt-0.5">
                      <span className="nums font-bold text-amber-700">{formatToman(sItem.finalPrice)} ت</span>
                      <span className="mx-1">·</span>
                      <span>پیشنهاد: <b className="nums text-slate-800">{toFaDigits(sItem.suggestedQty)}</b> {sItem.unit}</span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const full = items.find((x) => x.id === sItem.id);
                      if (full) addToCart(full, sItem.suggestedQty);
                    }}
                    className="text-[11px] font-bold px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-white shrink-0 active:scale-95 transition-all shadow-xs"
                  >
                    + سبد
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-4 bg-white/80 border border-amber-200 rounded-xl text-center text-xs text-slate-600 font-medium">
              هنوز سابقه خرید پرتکراری برای این حساب کاربری ثبت نشده است. پس از ثبت فاکتورهای اولیه، اقلام پرمصرف شما به‌صورت هوشمند در این بخش پیشنهاد داده خواهند شد.
            </div>
          )}
        </div>
      )}

      {/* نمایش قطعات کاتالوگ: طراحی اختصاصی دوگانه (جدول متراکم برای دسکتاپ، کارت‌های لمسی مدرن برای موبایل) */}
      <div className="mt-4">
        {loading ? (
          <div className="card p-14 text-center text-xs text-slate-500 flex flex-col items-center gap-2.5 bg-white border border-slate-200 rounded-xl">
            <span className="size-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
            <span>در حال واکشی قطعات مطابق فیلترها...</span>
          </div>
        ) : items.length === 0 ? (
          <div className="card p-10 sm:p-14 text-center text-xs text-slate-500 space-y-3 bg-white border border-slate-200 rounded-xl">
            <p className="font-bold text-slate-800 text-base">قطعه‌ای مطابق با این فیلترها پیدا نشد.</p>
            <p className="text-slate-500 max-w-md mx-auto">
              می‌توانید فیلترها را حذف کنید، یا قطعه مورد نظر را در استعلام چندردیفی (RFQ) ثبت نمایید.
            </p>
            <div className="flex items-center justify-center gap-2 pt-2">
              <button onClick={resetAllFilters} className="btn btn-ghost text-xs px-4 py-2">
                پاک‌سازی فیلترها
              </button>
              <button
                onClick={() => router.push("/inquiries")}
                className="btn btn-brass text-xs px-4 py-2"
              >
                ثبت استعلام (RFQ)
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* ۱. نمای موبایل (Mobile Cards) — کاملاً لمسی، خوانا و با استانداردهای اپلیکیشن‌های B2B برتر دنیا */}
            <div className="md:hidden space-y-3">
              {items.map((item) => {
                const inCart = cart.find((c) => c.item.id === item.id);
                const hasVolumeDiscount = item.volumePrices && item.volumePrices.length > 0;
                const currentQty = getItemQty(item);

                return (
                  <div
                    key={item.id}
                    className="p-3.5 bg-white border border-slate-200/90 rounded-xl shadow-2xs space-y-3 transition-shadow hover:shadow-xs"
                  >
                    {/* ردیف اول: برند سازنده قطعه + کد فنی SKU + برچسب موجودی */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5 flex-wrap min-w-0">
                        {item.partBrand && (
                          <span className="text-[11px] font-bold text-blue-700 bg-blue-50 border border-blue-200/80 rounded-md px-2 py-0.5">
                            {item.partBrand}
                          </span>
                        )}
                        <span className="nums text-[11px] font-mono font-semibold text-slate-700 bg-slate-100 border border-slate-200 rounded-md px-2 py-0.5">
                          {item.sku}
                        </span>
                      </div>

                      {item.stockQty > 0 ? (
                        <span className="inline-flex items-center gap-1.5 text-emerald-700 bg-emerald-50 border border-emerald-200/80 px-2.5 py-0.5 rounded-full font-medium text-[11px] shrink-0">
                          <span className="size-1.5 rounded-full bg-emerald-600" />
                          <span className="nums font-bold">{toFaDigits(item.stockQty)}</span> {item.unit}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-rose-700 bg-rose-50 border border-rose-200/80 px-2 py-0.5 rounded-full font-medium text-[11px] shrink-0">
                          <span className="size-1.5 rounded-full bg-rose-600" />
                          <span>ناموجود</span>
                        </span>
                      )}
                    </div>

                    {/* نام قطعه و جزئیات سازگاری */}
                    <div className="flex gap-3 items-start">
                      {/* تصویر بندانگشتی قطعه */}
                      <Link
                        href={`/catalog/${item.id}`}
                        className="size-16 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-center shrink-0 overflow-hidden hover:border-amber-400 transition"
                      >
                        {item.imageUrl ? (
                          <img
                            src={item.imageUrl}
                            alt={item.name}
                            className="max-h-full max-w-full object-contain"
                          />
                        ) : (
                          <Icon name="gear" className="size-9 text-slate-400" />
                        )}
                      </Link>

                      <div className="min-w-0 flex-1">
                        <Link
                          href={`/catalog/${item.id}`}
                          className="font-extrabold text-sm text-slate-900 leading-snug hover:text-amber-600 transition block"
                        >
                          {item.name}
                        </Link>
                        <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-1 flex-wrap">
                          <span className="font-semibold text-slate-800 bg-slate-100 px-2 py-0.5 rounded text-[11px]">
                            {item.brand} {item.model ? `· ${item.model}` : ""}
                          </span>
                          <span className="text-slate-600 bg-slate-50 border border-slate-200 px-1.5 py-0.5 rounded text-[11px]">
                            {item.category}
                          </span>
                          {item.packSize > 1 && (
                            <span className="text-slate-700 bg-slate-100 border border-slate-200 px-1.5 py-0.5 rounded text-[10px] nums">
                              بسته {toFaDigits(item.packSize)} تایی
                            </span>
                          )}
                          {hasVolumeDiscount && (
                            <span className="text-amber-700 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded text-[10px] font-bold">
                              تخفیف تیراژ
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                      {/* برچسب‌های حرارتی و زنده (Live Badges) */}
                      <div className="flex items-center gap-1.5 flex-wrap mt-2">
                        {item.stockQty > 15 && (
                          <span className="text-[10px] font-black text-rose-700 bg-rose-50 border border-rose-200/80 px-2 py-0.5 rounded-md flex items-center gap-1">
                            <Icon name="flame" className="size-3" />
                            <span>پرفروش هفته کرمان</span>
                          </span>
                        )}
                        {item.priceBefore && item.priceBefore > (item.price ?? 0) && (
                          <span className="text-[10px] font-black text-amber-800 bg-amber-50 border border-amber-300 px-2 py-0.5 rounded-md flex items-center gap-1">
                            <Icon name="bolt" className="size-3" />
                            <span>آفر نقدی</span>
                          </span>
                        )}
                        {item.stockQty > 0 && (
                          <span className="text-[10px] font-medium text-emerald-800 bg-emerald-50/80 border border-emerald-200 px-1.5 py-0.5 rounded-md flex items-center gap-1">
                            <Icon name="box" className="size-3" />
                            <span>انبار مرکزی: آماده ارسال</span>
                          </span>
                        )}
                      </div>

                    {/* ردیف قیمت */}
                    <div className="pt-2 border-t border-slate-100 flex items-baseline justify-between">
                      <span className="text-xs text-slate-500 font-medium">قیمت همکاری:</span>
                      <div className="text-left nums">
                        {item.priceBefore && item.priceBefore > (item.price ?? 0) && (
                          <span className="block text-[11px] text-slate-600 line-through">
                            {formatToman(item.priceBefore)} تومان
                          </span>
                        )}
                        <div className="flex items-baseline gap-1">
                          {item.price !== null ? (
                            <>
                              <span className="font-black text-xl text-blue-700">
                                {formatToman(item.price)}
                              </span>
                              <span className="text-xs text-slate-500 font-bold">تومان</span>
                            </>
                          ) : (
                            <span className="text-xs text-slate-600">پس از تأیید حساب</span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* نوار انتخاب تعداد در لحظه (Instant Inline Quantity) */}
                    <div className="pt-2.5 border-t border-slate-100 space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5 text-xs text-slate-700 font-bold">
                          <span>تعداد موردنیاز:</span>
                          {item.packSize > 1 && (
                            <span className="text-[10px] text-slate-600 font-medium">
                              (بسته {toFaDigits(item.packSize)} عددی)
                            </span>
                          )}
                        </div>

                        {/* استپر تعداد با قابلیت درج مستقیم هر عدد */}
                        <div className="flex items-center border border-slate-300 rounded-xl overflow-hidden bg-slate-50 shadow-2xs">
                          <button
                            type="button"
                            onClick={() => adjustItemQty(item, -1)}
                            disabled={!inCart && (currentQty <= 1 || item.stockQty <= 0)}
                            className="size-9 grid place-items-center text-slate-700 hover:bg-slate-200 active:scale-90 font-black text-lg disabled:opacity-30 disabled:pointer-events-none transition-all cursor-pointer"
                            aria-label="کاهش تعداد"
                            title={inCart && currentQty <= 1 ? "حذف از سبد" : "کاهش تعداد"}
                          >
                            −
                          </button>
                          <div className="relative flex items-center">
                            <input
                              type="text"
                              inputMode="numeric"
                              value={toFaDigits(rawInputValues[item.id] ?? currentQty)}
                              onChange={(e) => handleQtyInputChange(item, e.target.value)}
                              onBlur={() => handleQtyInputBlur(item)}
                              disabled={item.stockQty <= 0}
                              className="w-14 h-9 text-center bg-white font-black text-base text-slate-900 border-x border-slate-300 outline-none focus:bg-blue-50 focus:text-blue-700 transition-colors nums"
                            />
                          </div>
                          <button
                            type="button"
                            onClick={() => adjustItemQty(item, 1)}
                            disabled={item.stockQty > 0 && currentQty >= item.stockQty}
                            className="size-9 grid place-items-center text-slate-700 hover:bg-slate-200 active:scale-90 font-black text-lg disabled:opacity-30 disabled:pointer-events-none transition-all cursor-pointer"
                            aria-label="افزایش تعداد"
                            title={inCart ? "افزایش تعداد" : "افزودن به سبد"}
                          >
                            +
                          </button>
                        </div>
                      </div>

                      {/* چیپس‌های میانبر پله‌های تخفیف تیراژ در صورت وجود */}
                      {hasVolumeDiscount && item.volumePrices.length > 0 && (
                        <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 scrollbar-none text-[11px]">
                          <span className="text-slate-600 text-[10px] shrink-0 font-medium">پله‌های تیراژ:</span>
                          {item.volumePrices.map((vp) => (
                            <button
                              key={vp.qtyFrom}
                              type="button"
                              onClick={() => setItemQty(item, vp.qtyFrom)}
                              className={`px-2 py-0.5 rounded-lg font-bold shrink-0 transition-colors text-[10px] ${
                                currentQty >= vp.qtyFrom
                                  ? "bg-amber-100 text-amber-900 border border-amber-300 shadow-2xs"
                                  : "bg-slate-100 text-slate-600 border border-slate-200 hover:bg-slate-200"
                              }`}
                            >
                              {toFaDigits(vp.qtyFrom)} {item.unit} ({toFaDigits(vp.discountPercent)}٪-)
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* دکمه‌های اقدام خرید یا هشدار موجودی */}
                    {item.stockQty <= 0 ? (
                      <div className="pt-1">
                        <button
                          type="button"
                          onClick={() => handleStockAlert(item.id)}
                          disabled={subscribingId === item.id || subscribedAlerts[item.id]}
                          className={`w-full h-11 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 active:scale-98 cursor-pointer ${
                            subscribedAlerts[item.id]
                              ? "bg-emerald-50 border border-emerald-300 text-emerald-800"
                              : "bg-linear-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 shadow-md shadow-orange-500/20"
                          }`}
                        >
                          {subscribedAlerts[item.id] ? (
                            <span>✓ درخواست اطلاع‌رسانی شما ثبت شد</span>
                          ) : (
                            <span className="inline-flex items-center gap-1">
                              موجود شد به من اطلاع بده
                              <Icon name="bell" className="size-3.5" />
                            </span>
                          )}
                        </button>
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 gap-2 pt-1">
                        {inCart ? (
                          <div className="h-11 rounded-xl px-2.5 text-xs font-black bg-blue-50 border border-blue-300 text-blue-800 flex items-center justify-between gap-1 shadow-2xs">
                            <span className="truncate">در سبد: {toFaDigits(inCart.qty)} {item.unit}</span>
                            <button
                              type="button"
                              onClick={() => removeCartItem(item.id)}
                              className="size-6 grid place-items-center text-rose-500 hover:text-rose-700 hover:bg-rose-100 rounded-md transition-colors font-bold text-xs"
                              title="حذف از سبد"
                            >
                              ✕
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => addToCart(item, currentQty)}
                            disabled={!props.canOrder || item.stockQty <= 0 || item.price === null}
                            className="h-11 rounded-xl text-xs font-black bg-slate-900 hover:bg-slate-800 active:scale-98 text-white shadow-xs transition-all flex items-center justify-center gap-1.5 disabled:opacity-50"
                          >
                            <svg className="size-4 text-blue-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <circle cx="8" cy="21" r="1" />
                              <circle cx="19" cy="21" r="1" />
                              <path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12" />
                            </svg>
                            <span>+ سبد ({toFaDigits(currentQty)})</span>
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => setSelectedQuickBuy({ item, qty: currentQty })}
                          disabled={!props.canOrder || item.stockQty <= 0 || item.price === null}
                          className="h-11 rounded-xl text-xs font-black btn-blue active:scale-98 transition-all flex items-center justify-center gap-1.5 disabled:opacity-50"
                        >
                          <svg className="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                          </svg>
                          <span>خرید فوری ({toFaDigits(currentQty)})</span>
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* ۲. نمای دسکتاپ (Desktop Table View) */}
            <div className="hidden md:block card overflow-hidden border-slate-200 shadow-2xs rounded-xl bg-white">
              <div className="grid grid-cols-[7.5rem_1.3fr_5.5rem_8rem_16.5rem] gap-2 px-5 py-3 border-b border-slate-200 bg-slate-50/90 text-xs font-semibold text-slate-600">
                <span>کد فنی و برند</span>
                <span>شرح قطعه و مشخصات</span>
                <span className="text-center">موجودی انبار</span>
                <span className="text-left">قیمت همکار</span>
                <span className="text-center">تعداد و اقدام سفارش</span>
              </div>

              <ul className="divide-y divide-slate-100">
                {items.map((item) => {
                  const inCart = cart.find((c) => c.item.id === item.id);
                  const hasVolumeDiscount = item.volumePrices && item.volumePrices.length > 0;
                  const currentQty = getItemQty(item);

                  return (
                    <li
                      key={item.id}
                      className="px-5 py-4 grid grid-cols-[7.5rem_1.3fr_5.5rem_8rem_16.5rem] items-center gap-2 hover:bg-slate-50/60 transition-colors"
                    >
                      <div className="flex flex-col gap-1">
                        <span className="nums text-[11px] font-mono font-semibold text-slate-700 border border-slate-200 rounded px-2 py-0.5 bg-slate-50 self-start">
                          {item.sku}
                        </span>
                        {item.partBrand && (
                          <span className="text-[11px] font-bold text-blue-700 bg-blue-50 border border-blue-200/60 rounded px-1.5 py-0.2 self-start">
                            {item.partBrand}
                          </span>
                        )}
                        {item.oemCode && (
                          <span className="text-[10px] text-slate-600 font-mono hidden lg:inline">
                            OEM: {item.oemCode}
                          </span>
                        )}
                      </div>

                      <div className="min-w-0 flex items-start gap-3">
                        <Link
                          href={`/catalog/${item.id}`}
                          className="size-12 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-center shrink-0 overflow-hidden hover:border-amber-400 transition"
                          title="مشاهده شناسنامه و عکس قطعه"
                        >
                          {item.imageUrl ? (
                            <img
                              src={item.imageUrl}
                              alt={item.name}
                              className="max-h-full max-w-full object-contain"
                            />
                          ) : (
                            <Icon name="gear" className="size-7 text-slate-400" />
                          )}
                        </Link>

                        <div className="min-w-0 flex-1">
                          <Link
                            href={`/catalog/${item.id}`}
                            className="font-extrabold text-sm text-slate-900 leading-snug hover:text-amber-600 transition block truncate"
                          >
                            {item.name}
                          </Link>
                          <div className="flex items-center gap-2 text-xs text-slate-500 mt-1 flex-wrap">
                            <span className="font-semibold text-slate-800">{item.brand}</span>
                            {item.model && <span>· {item.model}</span>}
                            <span className="text-slate-600">· {item.category}</span>
                            {item.packSize > 1 && (
                              <span className="text-slate-700 bg-slate-100 border border-slate-200 px-1.5 py-0.2 rounded text-[10px] nums font-medium">
                                بسته {toFaDigits(item.packSize)} تایی
                              </span>
                            )}
                            {hasVolumeDiscount && (
                              <span className="text-amber-700 bg-amber-50 border border-amber-200/60 px-1.5 py-0.2 rounded text-[10px] nums font-medium">
                                تخفیف تیراژ
                              </span>
                            )}
                            <Link
                              href={`/catalog/${item.id}`}
                              className="text-[10px] text-blue-600 hover:underline flex items-center gap-0.5"
                            >
                              <span>مشاهده عکس و شناسنامه</span>
                              <span>↗</span>
                            </Link>
                          </div>

                        {/* برچسب‌های حرارتی و زنده در دسکتاپ */}
                        <div className="flex items-center gap-1.5 flex-wrap mt-1">
                          {item.stockQty > 15 && (
                            <span className="text-[9px] font-black text-rose-700 bg-rose-50 border border-rose-200/80 px-1.5 py-0.2 rounded-md flex items-center gap-0.5">
                              <Icon name="flame" className="size-3" />
                              <span>پرفروش هفته کرمان</span>
                            </span>
                          )}
                          {item.priceBefore && item.priceBefore > (item.price ?? 0) && (
                            <span className="text-[9px] font-black text-amber-800 bg-amber-50 border border-amber-300 px-1.5 py-0.2 rounded-md flex items-center gap-0.5">
                              <Icon name="bolt" className="size-3" />
                              <span>آفر ویژه</span>
                            </span>
                          )}
                          {item.stockQty > 0 && (
                            <span className="text-[9px] font-medium text-emerald-800 bg-emerald-50/80 border border-emerald-200 px-1.5 py-0.2 rounded-md flex items-center gap-0.5">
                              <Icon name="box" className="size-3" />
                              <span>انبار مرکزی</span>
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                      <div className="text-center text-xs">
                        {item.stockQty > 0 ? (
                          <span className="inline-flex items-center gap-1 text-emerald-700 bg-emerald-50 border border-emerald-200/80 px-2 py-0.5 rounded-full font-medium text-[11px]">
                            <span className="size-1.5 rounded-full bg-emerald-600" />
                            <span className="nums font-bold">{toFaDigits(item.stockQty)}</span> {item.unit}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-rose-700 bg-rose-50 border border-rose-200/80 px-2 py-0.5 rounded-full font-medium text-[11px]">
                            <span className="size-1.5 rounded-full bg-rose-600" />
                            <span>ناموجود</span>
                          </span>
                        )}
                      </div>

                      <div className="text-left text-xs">
                        {item.price !== null ? (
                          <div className="nums">
                            {item.priceBefore && item.priceBefore > item.price && (
                              <span className="block text-[11px] text-slate-500 line-through">
                                {formatToman(item.priceBefore)}
                              </span>
                            )}
                            <span className="font-black text-lg text-blue-700">{formatToman(item.price)}</span>
                            <span className="text-xs text-slate-500 font-bold ms-1 font-sans">تومان</span>
                          </div>
                        ) : (
                          <span className="text-xs text-slate-600 font-medium">پس از تأیید حساب</span>
                        )}
                      </div>

                      <div className="flex items-center gap-2 justify-end">
                        {/* استپر تعداد با قابلیت درج مستقیم هر عدد */}
                        <div className="flex items-center border border-slate-300 rounded-lg overflow-hidden bg-white shadow-2xs h-8 shrink-0">
                          <button
                            type="button"
                            onClick={() => adjustItemQty(item, -1)}
                            disabled={!inCart && (currentQty <= 1 || item.stockQty <= 0)}
                            className="w-7 h-full grid place-items-center text-slate-700 hover:bg-slate-100 active:scale-90 font-black text-sm disabled:opacity-30 disabled:pointer-events-none transition-all cursor-pointer"
                            aria-label="کاهش"
                            title={inCart && currentQty <= 1 ? "حذف از سبد" : "کاهش تعداد"}
                          >
                            −
                          </button>
                          <input
                            type="text"
                            inputMode="numeric"
                            value={toFaDigits(rawInputValues[item.id] ?? currentQty)}
                            onChange={(e) => handleQtyInputChange(item, e.target.value)}
                            onBlur={() => handleQtyInputBlur(item)}
                            disabled={item.stockQty <= 0}
                            className="w-14 h-full text-center font-black text-sm text-slate-900 border-x border-slate-200 outline-none focus:bg-blue-50 focus:text-blue-700 transition-colors nums"
                          />
                          <button
                            type="button"
                            onClick={() => adjustItemQty(item, 1)}
                            disabled={item.stockQty > 0 && currentQty >= item.stockQty}
                            className="w-7 h-full grid place-items-center text-slate-700 hover:bg-slate-100 active:scale-90 font-black text-sm disabled:opacity-30 disabled:pointer-events-none transition-all cursor-pointer"
                            aria-label="افزایش"
                            title={inCart ? "افزایش تعداد" : "افزودن به سبد"}
                          >
                            +
                          </button>
                        </div>

                        {/* دکمه‌های اقدام سفارش یا هشدار موجودی */}
                        {item.stockQty <= 0 ? (
                          <div className="flex items-center gap-1.5 shrink-0">
                            <button
                              type="button"
                              onClick={() => handleStockAlert(item.id)}
                              disabled={subscribingId === item.id || subscribedAlerts[item.id]}
                              className={`text-[11px] font-bold px-3 py-1.5 rounded-lg border transition-all cursor-pointer active:scale-95 ${
                                subscribedAlerts[item.id]
                                  ? "bg-emerald-50 border-emerald-300 text-emerald-800"
                                  : "bg-amber-50 hover:bg-amber-100 border-amber-300 text-amber-900 shadow-2xs"
                              }`}
                            >
                              {subscribedAlerts[item.id] ? (
                                <span>✓ ثبت شد</span>
                              ) : (
                                <span className="inline-flex items-center gap-1">
                                  موجود شد خبرم کن
                                  <Icon name="bell" className="size-3.5" />
                                </span>
                              )}
                            </button>
                          </div>
                        ) : inCart ? (
                          <div className="flex items-center gap-1.5 shrink-0">
                            <span className="text-[11px] font-black text-blue-700 bg-blue-50 border border-blue-200 px-2 py-1 rounded-lg">
                              در سبد
                            </span>
                            <button
                              type="button"
                              onClick={() => removeCartItem(item.id)}
                              className="size-7 grid place-items-center text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors text-xs font-bold cursor-pointer"
                              title="حذف از سبد"
                            >
                              ✕
                            </button>
                            <button
                              type="button"
                              onClick={() => setSelectedQuickBuy({ item, qty: currentQty })}
                              disabled={!props.canOrder || item.stockQty <= 0 || item.price === null}
                              className="btn btn-blue text-xs px-2.5 py-1.5 rounded-lg font-black shadow-xs shrink-0"
                            >
                              فوری
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5 shrink-0">
                            <button
                              type="button"
                              onClick={() => addToCart(item, currentQty)}
                              disabled={!props.canOrder || item.stockQty <= 0 || item.price === null}
                              className="btn btn-ghost text-xs px-2.5 py-1.5 rounded-lg border border-slate-300 font-bold hover:bg-slate-100 hover:border-slate-400 shrink-0"
                              title="افزودن تعداد مشخص به سبد"
                            >
                              + سبد
                            </button>

                            <button
                              type="button"
                              onClick={() => setSelectedQuickBuy({ item, qty: currentQty })}
                              disabled={!props.canOrder || item.stockQty <= 0 || item.price === null}
                              className="btn btn-blue text-xs px-2.5 py-1.5 rounded-lg font-black shadow-xs hover:shadow-blue-500/20 shrink-0"
                            >
                              فوری
                            </button>
                          </div>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
          </>
        )}
      </div>

      {/* نوار شناور پایین صفحه در صورت داشتن کالا در سبد — هدایت به جدول سفارش بالا */}
      {cart.length > 0 && (
        <div className="fixed bottom-[calc(4.2rem+env(safe-area-inset-bottom))] md:bottom-6 inset-x-3 md:inset-x-auto md:left-8 md:right-8 md:max-w-2xl md:mx-auto z-30 animate-in slide-in-from-bottom-4 duration-200">
          <div className="card bg-slate-900 text-white p-3 sm:px-5 sm:py-3.5 rounded-xl shadow-2xl flex items-center justify-between gap-3 border border-slate-800">
            <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
              <span className="size-9 sm:size-10 grid place-items-center bg-blue-600 text-white rounded-lg font-bold text-xs sm:text-sm shrink-0">
                {toFaDigits(cartSummary.distinctCount)}
              </span>
              <div className="min-w-0">
                <p className="text-xs sm:text-sm font-bold text-white leading-tight truncate">سبد سفارش همکار</p>
                <p className="text-[10px] sm:text-[11px] text-slate-400 mt-0.5 nums truncate font-mono">
                  {toFaDigits(cartSummary.itemCount)} قطعه · مجموع: {formatToman(cartSummary.total)} تومان
                </p>
              </div>
            </div>

            <button
              onClick={() => topCartRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })}
              className="btn btn-blue text-xs px-3.5 sm:px-5 py-2 font-black shadow-md shadow-blue-500/20 hover:scale-102 transition-transform shrink-0"
            >
              مشاهده جدول سفارش ↑
            </button>
          </div>
        </div>
      )}

      {/* مدال خرید سریع تکی */}
      {selectedQuickBuy && (
        <QuickBuySheet
          item={selectedQuickBuy.item}
          initialQty={selectedQuickBuy.qty}
          shipping={props.shipping}
          wallet={props.wallet}
          availableCredit={props.availableCredit}
          creditLimit={props.creditLimit}
          tierDiscount={props.tierDiscount}
          customerDiscount={props.customerDiscount}
          onClose={() => setSelectedQuickBuy(null)}
          onCreated={(orderId) => {
            setSelectedQuickBuy(null);
            router.push(`/orders/${orderId}`);
          }}
        />
      )}
    </div>
  );
}
