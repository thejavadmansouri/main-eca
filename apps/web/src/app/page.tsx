"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/auth-store";
import { landingPathForRole } from "@/lib/nav";

export default function Home() {
  const router = useRouter();
  const token = useAuthStore((s) => s.token);
  const user = useAuthStore((s) => s.user);
  const [hydrated, setHydrated] = React.useState(false);

  React.useEffect(() => {
    setHydrated(true);
  }, []);

  React.useEffect(() => {
    if (!hydrated) return;

    if (token && user?.role) {
      router.replace(landingPathForRole(user.role));
    } else {
      router.replace("/login");
    }
  }, [router, token, user, hydrated]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background" dir="rtl">
      <div className="text-center space-y-3">
        <div className="size-10 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-sm font-medium text-muted-foreground">در حال بارگذاری سامانه کاردو...</p>
      </div>
    </div>
  );
}
