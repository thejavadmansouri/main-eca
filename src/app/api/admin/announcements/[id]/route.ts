import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { currentUser } from "@/lib/current-user";
import { apiError } from "@/lib/api";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await currentUser(req);
  if (!user || user.role !== "admin") {
    return apiError(403, "FORBIDDEN", "دسترسی ادمین لازم است");
  }

  const { id } = await params;

  try {
    const body = await req.json();
    const { title, message, level, target, link, isActive } = body;

    const data: Record<string, any> = {};
    if (title !== undefined) data.title = title.trim();
    if (message !== undefined) data.message = message.trim();
    if (level !== undefined && ["INFO", "SUCCESS", "WARNING", "URGENT"].includes(level)) {
      data.level = level;
    }
    if (target !== undefined && ["ALL", "CUSTOMER", "ADMIN"].includes(target)) {
      data.target = target;
    }
    if (link !== undefined) data.link = link?.trim() || null;
    if (isActive !== undefined) data.isActive = Boolean(isActive);

    const updated = await prisma.announcement.update({
      where: { id },
      data,
    });

    return NextResponse.json({ ok: true, item: updated });
  } catch (err: any) {
    return apiError(500, "SERVER_ERROR", err.message || "خطا در به‌روزرسانی اطلاعیه");
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await currentUser(req);
  if (!user || user.role !== "admin") {
    return apiError(403, "FORBIDDEN", "دسترسی ادمین لازم است");
  }

  const { id } = await params;

  try {
    await prisma.announcement.delete({ where: { id } });
    return NextResponse.json({ ok: true, message: "اطلاعیه با موفقیت حذف شد" });
  } catch (err: any) {
    return apiError(500, "SERVER_ERROR", err.message || "خطا در حذف اطلاعیه");
  }
}
