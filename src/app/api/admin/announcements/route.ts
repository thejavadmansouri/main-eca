import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { currentUser } from "@/lib/current-user";
import { apiError } from "@/lib/api";

/*
 * ادمین: مدیریت اطلاعیه‌ها و پیام‌های نوار اعلان بالای صفحه (Ticker & Announcements)
 */
export async function GET(req: NextRequest) {
  const user = await currentUser(req);
  if (!user || user.role !== "admin") {
    return apiError(403, "FORBIDDEN", "دسترسی ادمین لازم است");
  }

  const items = await prisma.announcement.findMany({
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ ok: true, items });
}

export async function POST(req: NextRequest) {
  const user = await currentUser(req);
  if (!user || user.role !== "admin") {
    return apiError(403, "FORBIDDEN", "دسترسی ادمین لازم است");
  }

  try {
    const body = await req.json();
    const { title, message, level = "INFO", target = "ALL", link, isActive = true } = body;

    if (!title?.trim() || !message?.trim()) {
      return apiError(400, "VALIDATION", "عنوان برچسب و متن اطلاعیه الزامی است");
    }

    const created = await prisma.announcement.create({
      data: {
        title: title.trim(),
        message: message.trim(),
        level: ["INFO", "SUCCESS", "WARNING", "URGENT"].includes(level) ? level : "INFO",
        target: ["ALL", "CUSTOMER", "ADMIN"].includes(target) ? target : "ALL",
        link: link?.trim() || null,
        isActive: Boolean(isActive),
      },
    });

    return NextResponse.json({ ok: true, item: created });
  } catch (err: any) {
    return apiError(500, "SERVER_ERROR", err.message || "خطا در ایجاد اطلاعیه");
  }
}
