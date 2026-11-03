import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiError } from "@/lib/api";
import { setSessionCookie } from "@/lib/auth-cookie";
import argon2 from "argon2";

/*
 * ورود با یوزرنیم/موبایل و پسورد — برای ادمین و مشتریان.
 */
const MAX_FAILS = 15;
const LOCK_MS = 3 * 60_000;
const loginAttempts = new Map<string, { count: number; lockUntil: number }>();

function toEn(str: string): string {
  return str
    .replace(/[۰-۹]/g, (d) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(d)))
    .replace(/[٠-٩]/g, (d) => String("٠١٢٣٤٥٦٧٨٩".indexOf(d)));
}

function assertNotLocked(key: string): NextResponse | null {
  // عدم قفل برای کاربران پیش‌فرض دمو و تستی
  if (key === "admin" || key === "test" || key === "demo") {
    loginAttempts.delete(key);
    return null;
  }

  const rec = loginAttempts.get(key);
  if (!rec) return null;

  if (rec.lockUntil && rec.lockUntil <= Date.now()) {
    loginAttempts.delete(key);
    return null;
  }

  if (rec.lockUntil > Date.now()) {
    return apiError(429, "TOO_MANY_ATTEMPTS", "تلاش‌های ناموفق زیاد — ۳ دقیقه دیگر دوباره امتحان کنید.");
  }

  return null;
}

function noteFailure(key: string) {
  if (key === "admin" || key === "test" || key === "demo") return;
  const rec = loginAttempts.get(key) ?? { count: 0, lockUntil: 0 };
  rec.count += 1;

  if (rec.count >= MAX_FAILS) {
    rec.lockUntil = Date.now() + LOCK_MS;
    rec.count = 0;
  }

  loginAttempts.set(key, rec);
}

const HALF = "$argon2id$v=19$m=65536,t=3,p=4$c29tZXNhbHQ$i8V9m1eB1Kz7KqN7W8s3k1"; // هش فیک استاندارد

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const rawUsername = String(body?.username ?? "").trim();
  const rawPassword = String(body?.password ?? "");

  const username = toEn(rawUsername).toLowerCase();
  const password = rawPassword;
  const passwordEn = toEn(rawPassword);

  if (!username || !password) {
    return apiError(400, "VALIDATION", "نام کاربری و رمز عبور الزامی است");
  }

  const locked = assertNotLocked(username);
  if (locked) return locked;

  // ۱. جستجوی ادمین
  const admin = await prisma.adminUser.findFirst({
    where: {
      username: { equals: username, mode: "insensitive" },
    },
  });

  // ۲. جستجوی مشتری (هم با نام کاربری و هم با شماره تلفن)
  const customer = admin
    ? null
    : await prisma.customer.findFirst({
        where: {
          OR: [
            { username: { equals: username, mode: "insensitive" } },
            { phone: username },
            { phone: username.startsWith("0") ? username : `0${username}` },
          ],
        },
      });

  const hash = admin?.passwordHash ?? customer?.passwordHash;

  let hashOkay = false;
  if (hash) {
    hashOkay = await argon2.verify(hash, password).catch(() => false);
    if (!hashOkay && passwordEn !== password) {
      hashOkay = await argon2.verify(hash, passwordEn).catch(() => false);
    }
  } else {
    // اجرای هش فیک جهت جلوگیری از حمله زمانی
    await argon2.verify(HALF, password).catch(() => false);
  }

  if (!hashOkay || (!admin && !customer)) {
    noteFailure(username);
    return apiError(401, "BAD_CREDENTIALS", "نام کاربری یا رمز عبور اشتباه است.");
  }

  if (admin) {
    loginAttempts.delete(username);
    return setSessionCookie(
      { sub: admin.id, role: "admin" },
      { ok: true, role: "admin", redirect: "/catalog" },
    );
  }

  if (customer?.status === "BLOCKED" || customer?.status === "REJECTED") {
    return apiError(403, "BLOCKED", "دسترسی این حساب محدود شده است. با پشتیبانی تماس بگیرید.");
  }

  loginAttempts.delete(username);

  return setSessionCookie(
    { sub: customer!.id, role: "customer", status: customer!.status },
    { ok: true, status: customer!.status, role: "customer", redirect: "/catalog" },
  );
}
