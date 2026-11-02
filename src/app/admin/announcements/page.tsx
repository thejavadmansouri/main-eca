import { connection } from "next/server";
import { prisma } from "@/lib/prisma";
import { AnnouncementsManagerView } from "./announcements-manager-view";

export const instant = false;

export default async function AdminAnnouncementsPage() {
  await connection();

  const announcements = await prisma.announcement.findMany({
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-6">
      <AnnouncementsManagerView
        initialItems={announcements.map((a) => ({
          id: a.id,
          title: a.title,
          message: a.message,
          level: a.level as any,
          target: a.target as any,
          link: a.link,
          isActive: a.isActive,
          createdAt: a.createdAt.toISOString(),
        }))}
      />
    </div>
  );
}
