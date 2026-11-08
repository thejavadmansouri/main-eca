import { describe, expect, it } from "vitest";

import {
  NAV_SECTIONS,
  filterNavByRole,
  landingPathForRole,
  isSalesFocused,
  type NavItem,
  type NavSection,
} from "./nav";
import type { Role } from "./types";

const ROLES: Role[] = ["ADMIN", "MANAGER", "SALES", "STAFF"];

/** همه‌ی برگ‌های یک بخش — هاب‌ها خودشان مقصد نیستند. */
function leaves(sections: NavSection[]): NavItem[] {
  const out: NavItem[] = [];
  const walk = (items: NavItem[]) => {
    for (const it of items) {
      if (it.children) walk(it.children);
      else out.push(it);
    }
  };
  sections.forEach((s) => walk(s.items));
  return out;
}

describe("ساختار ماژولار کاردو ERP", () => {
  it("مدیر کل به تمام دامنه‌های عملیاتی ERP دسترسی دارد", () => {
    const sections = filterNavByRole(NAV_SECTIONS, "ADMIN");
    // ۱ پیشخوان سنجاق‌شده + ۸ ماژول تخصصی سازمانی
    expect(sections).toHaveLength(9);

    const titles = sections.map((s) => s.title);
    expect(titles).toContain("بازرگانی و فروش");
    expect(titles).toContain("خرید و تأمین کالا");
    expect(titles).toContain("انبار و لجستیک (WMS)");
    expect(titles).toContain("مدیریت تولید و ساخت");
    expect(titles).toContain("حسابداری و دفاتر مالی");
    expect(titles).toContain("کاتالوگ و محصولات");
    expect(titles).toContain("منابع انسانی و حقوق");
    expect(titles).toContain("تنظیمات و امنیت");
  });

  it("فروشنده دسترسی به بخش‌های بازرگانی و فروش دارد", () => {
    const salesLeaves = leaves(filterNavByRole(NAV_SECTIONS, "SALES")).map((i) => i.href);
    expect(salesLeaves).toContain("/admin/pos");
    expect(salesLeaves).toContain("/admin/customers");
    expect(salesLeaves).toContain("/admin/documents");
    expect(salesLeaves).toContain("/admin/quotations");
    expect(salesLeaves).toContain("/admin/repairs");
    // گزارش‌ها و تنظیمات نباید برای فروشنده باشد
    expect(salesLeaves).not.toContain("/admin/reports");
    expect(salesLeaves).not.toContain("/admin/settings");
  });

  it("انباردار به کاردکس، قفسه‌بندی و انبارگردانی دسترسی دارد", () => {
    const staffLeaves = leaves(filterNavByRole(NAV_SECTIONS, "STAFF")).map((i) => i.href);
    expect(staffLeaves).toContain("/admin/inventory");
    expect(staffLeaves).toContain("/admin/inventory-count");
    expect(staffLeaves).toContain("/admin/inventory-transfer");
    expect(staffLeaves).not.toContain("/admin/pos");
    expect(staffLeaves).not.toContain("/admin/vouchers");
  });

  it("هیچ صفحه‌ای برای یک نقش دو بار در منو تکرار نمی‌شود", () => {
    for (const role of ROLES) {
      const hrefs = leaves(filterNavByRole(NAV_SECTIONS, role))
        .map((i) => i.href)
        .filter((h): h is string => !!h);
      const dupes = hrefs.filter((h, i) => hrefs.indexOf(h) !== i);
      expect(dupes, `نقش ${role}`).toEqual([]);
    }
  });

  it("هر برگ مقصد دارد و هر هاب فرزند", () => {
    const walk = (items: NavItem[]) => {
      for (const it of items) {
        if (it.children) expect(it.children.length, it.title).toBeGreaterThan(0);
        else expect(it.href, it.title).toBeTruthy();
      }
    };
    NAV_SECTIONS.forEach((s) => walk(s.items));
  });

  it("فرود هر نقش متناسب با مسئولیت‌های عملیاتی است", () => {
    expect(landingPathForRole("SALES")).toBe("/admin");
    expect(landingPathForRole("ADMIN")).toBe("/admin");
    expect(landingPathForRole("STAFF")).toBe("/admin/inventory");
    expect(isSalesFocused("SALES")).toBe(true);
    expect(isSalesFocused("ADMIN")).toBe(false);
  });
});
