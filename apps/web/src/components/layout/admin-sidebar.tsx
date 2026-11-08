"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/lib/auth-store";
import {
  NAV_SECTIONS,
  filterNavByRole,
  type NavItem,
  type NavSection,
} from "@/lib/nav";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ROLE_LABELS } from "@/lib/format";

/**
 * پیاده‌سازی راست‌چین اصیل و استاندارد پنل ERP (Native RTL):
 *
 * ستون آیکن‌ها به‌صورت عمودی در سمت راست قرار می‌گیرد.
 * عنوان ماژول‌ها در ادامه به سمت چپ امتداد می‌یابد و فلش‌ها در لبه‌ی چپ قرار می‌گیرند.
 */

function NavLink({
  item,
  collapsed,
  isActive,
  nested,
}: {
  item: NavItem;
  collapsed: boolean;
  isActive: boolean;
  nested?: boolean;
}) {
  const Icon = item.icon;
  return (
    <Link
      href={item.href ?? "#"}
      title={collapsed ? item.title : undefined}
      dir="rtl"
      className={cn(
        "group relative flex w-full items-center gap-2.5 rounded-lg text-xs font-medium transition-all duration-150 select-none",
        collapsed ? "justify-center p-2.5" : "px-3 py-2",
        nested && !collapsed && "py-1.5 pe-3 ps-7 text-[12px]",
        isActive
          ? "bg-primary/10 text-primary font-bold shadow-xs"
          : "text-muted-foreground hover:bg-muted/70 hover:text-foreground",
      )}
    >
      {/* نوار شاخص فعال در لبه‌ی راست */}
      {isActive ? (
        <span
          aria-hidden
          className={cn(
            "absolute inset-y-1.5 right-0 w-1 rounded-l-full bg-primary transition-all",
            collapsed && "inset-y-2",
          )}
        />
      ) : null}

      <Icon
        strokeWidth={isActive ? 2.1 : nested ? 1.8 : 1.9}
        className={cn(
          "size-4.5 shrink-0 transition-colors",
          nested && "size-4 opacity-85",
          isActive
            ? "text-primary"
            : "text-muted-foreground/80 group-hover:text-foreground",
        )}
      />

      {!collapsed ? (
        <span
          className={cn(
            "flex-1 truncate text-right",
            isActive ? "font-bold text-primary" : "text-foreground/85 group-hover:text-foreground",
          )}
        >
          {item.title}
        </span>
      ) : null}
    </Link>
  );
}

function NavGroup({
  item,
  isActive,
  onNavigate,
}: {
  item: NavItem;
  isActive: (href: string) => boolean;
  onNavigate?: () => void;
}) {
  const Icon = item.icon;
  const children = item.children ?? [];
  const anyActive = children.some((c) => c.href && isActive(c.href));
  const [open, setOpen] = React.useState(() => anyActive);

  React.useEffect(() => {
    if (anyActive) setOpen(true);
  }, [anyActive]);

  return (
    <div className="flex flex-col gap-0.5">
      <button
        type="button"
        dir="rtl"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className={cn(
          "group flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-medium transition-all duration-150 select-none",
          anyActive
            ? "bg-primary/5 text-foreground font-semibold"
            : "text-muted-foreground hover:bg-muted/70 hover:text-foreground",
        )}
      >
        <Icon
          strokeWidth={1.9}
          className={cn(
            "size-4.5 shrink-0 transition-colors",
            anyActive ? "text-primary" : "text-muted-foreground/80 group-hover:text-foreground",
          )}
        />
        <span className="flex-1 truncate text-right">{item.title}</span>
        <ChevronDown
          className={cn(
            "ms-auto size-3.5 shrink-0 text-muted-foreground/60 transition-transform duration-200",
            !open && "rotate-90",
          )}
        />
      </button>

      {open ? (
        <div
          className="ms-3 flex flex-col gap-0.5 border-r border-border/80 pe-1 my-0.5"
          role="group"
          aria-label={item.title}
        >
          {children.map((c) => (
            <div key={c.href ?? c.title} onClick={onNavigate}>
              <NavLink
                item={c}
                collapsed={false}
                nested
                isActive={c.href ? isActive(c.href) : false}
              />
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function NavTree({
  item,
  collapsed,
  isActive,
  onNavigate,
}: {
  item: NavItem;
  collapsed: boolean;
  isActive: (href: string) => boolean;
  onNavigate?: () => void;
}) {
  if (!item.children) {
    return (
      <div onClick={onNavigate}>
        <NavLink
          item={item}
          collapsed={collapsed}
          isActive={item.href ? isActive(item.href) : false}
        />
      </div>
    );
  }

  if (collapsed) {
    return (
      <>
        {item.children.map((c) => (
          <div key={c.href ?? c.title} onClick={onNavigate}>
            <NavLink
              item={c}
              collapsed
              isActive={c.href ? isActive(c.href) : false}
            />
          </div>
        ))}
      </>
    );
  }

  return <NavGroup item={item} isActive={isActive} onNavigate={onNavigate} />;
}

function SidebarSection({
  section,
  collapsed,
  isActive,
  isOpen,
  onToggle,
  onNavigate,
}: {
  section: NavSection;
  collapsed: boolean;
  isActive: (href: string) => boolean;
  isOpen: boolean;
  onToggle: () => void;
  onNavigate?: () => void;
}) {
  const containsActive = section.items.some(
    (it) =>
      (it.href ? isActive(it.href) : false) ||
      (it.children?.some((c) => (c.href ? isActive(c.href) : false)) ?? false),
  );

  if (section.pinned) {
    return (
      <div className="flex flex-col gap-0.5">
        {section.items.map((item) => (
          <NavTree
            key={item.href ?? item.title}
            item={item}
            collapsed={collapsed}
            isActive={isActive}
            onNavigate={onNavigate}
          />
        ))}
      </div>
    );
  }

  if (collapsed) {
    return (
      <div className="flex flex-col gap-0.5">
        <div className="mx-auto my-1.5 h-px w-8 bg-sidebar-border" />
        {section.items.map((item) => (
          <NavTree
            key={item.href ?? item.title}
            item={item}
            collapsed
            isActive={isActive}
            onNavigate={onNavigate}
          />
        ))}
      </div>
    );
  }

  const SectionIcon = section.icon;

  return (
    <div className="flex flex-col gap-0.5">
      <button
        type="button"
        dir="rtl"
        onClick={onToggle}
        aria-expanded={isOpen}
        className={cn(
          "flex w-full items-center gap-2 px-3 pb-1.5 pt-2.5 rounded-lg text-muted-foreground/75 hover:text-foreground hover:bg-muted/50 transition-all select-none cursor-pointer",
          (isOpen || containsActive) && "text-foreground font-semibold bg-muted/30",
        )}
      >
        {SectionIcon ? (
          <SectionIcon className={cn("size-3.5 shrink-0 transition-colors", (isOpen || containsActive) ? "text-primary" : "text-muted-foreground/60")} />
        ) : null}
        <span className="flex-1 text-right text-[11px] font-bold tracking-normal">
          {section.title}
        </span>
        <ChevronDown
          className={cn(
            "size-3 shrink-0 text-muted-foreground/50 transition-transform duration-200 ms-auto",
            !isOpen && "rotate-90",
          )}
        />
      </button>
      {isOpen ? (
        <div className="flex flex-col gap-0.5 ps-1 pt-0.5 transition-all">
          {section.items.map((item) => (
            <NavTree
              key={item.href ?? item.title}
              item={item}
              collapsed={false}
              isActive={isActive}
              onNavigate={onNavigate}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}

export function AdminSidebar({
  collapsed,
  onNavigate,
}: {
  collapsed: boolean;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  const user = useAuthStore((s) => s.user);
  const sections = filterNavByRole(NAV_SECTIONS, user?.role, user?.canManageSite);

  const isActive = (href: string) =>
    href === "/admin"
      ? pathname === "/admin"
      : pathname === href || pathname.startsWith(href + "/");

  // حالت آکاردئونی: در هر لحظه فقط یک سرفصل اصلی باز است تا منو منظم و منسجم بماند
  const [openSectionTitle, setOpenSectionTitle] = React.useState<string | null>(null);

  // هنگام تغییر صفحه، سرفصلی که آدرس فعلی در آن است خودکار باز می‌شود
  React.useEffect(() => {
    const activeSection = sections.find(
      (s) =>
        !s.pinned &&
        s.items.some(
          (it) =>
            (it.href ? isActive(it.href) : false) ||
            (it.children?.some((c) => (c.href ? isActive(c.href) : false)) ?? false),
        ),
    );
    if (activeSection) {
      setOpenSectionTitle(activeSection.title);
    }
  }, [pathname]);

  const handleToggle = (title: string) => {
    setOpenSectionTitle((prev) => (prev === title ? null : title));
  };

  return (
    <div className="flex h-full flex-col bg-sidebar text-sidebar-foreground border-e border-sidebar-border shadow-xs">
      {/* سربرگ برند و هویت سازمانی کاردو ERP */}
      <div
        dir="rtl"
        className={cn(
          "flex h-12 shrink-0 items-center gap-3 border-b border-sidebar-border bg-sidebar/50 px-3.5 transition-all",
          collapsed ? "justify-center px-2" : "",
        )}
      >
        <img
          src="/logo.png"
          alt="کاردو ERP"
          className="size-8 shrink-0 rounded-lg shadow-sm ring-1 ring-border"
        />
        {!collapsed ? (
          <div className="flex flex-col text-right min-w-0">
            <span className="truncate text-xs font-black tracking-tight text-foreground">
              کاردو ERP
            </span>
            <span className="truncate text-[10px] text-muted-foreground font-medium">
              سامانه جامع سازمانی
            </span>
          </div>
        ) : null}
      </div>

      <ScrollArea className="min-h-0 flex-1">
        <nav className="flex flex-col gap-1.5 px-2 py-2" aria-label="منوی اصلی">
          {sections.map((section, index) => (
            <SidebarSection
              key={`${section.title || "pinned"}-${index}`}
              section={section}
              collapsed={collapsed}
              isActive={isActive}
              isOpen={section.pinned || openSectionTitle === section.title}
              onToggle={() => handleToggle(section.title)}
              onNavigate={onNavigate}
            />
          ))}
        </nav>
      </ScrollArea>

      {/* اطلاعات کاربر و وضعیت نشست در انتهای سایدبار */}
      {!collapsed && user ? (
        <div className="shrink-0 border-t border-sidebar-border p-2 bg-sidebar/40">
          <div
            dir="rtl"
            className="flex items-center gap-2.5 rounded-lg bg-sidebar-accent/50 p-2 border border-border/40"
          >
            <div className="relative flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-xs ring-1 ring-primary/20">
              {(user.fullName ?? user.username).charAt(0)}
              <span className="absolute bottom-0 left-0 size-2 rounded-full bg-emerald-500 ring-1 ring-background" />
            </div>
            <div className="min-w-0 flex-1 text-right">
              <p className="truncate text-xs font-bold text-foreground">
                {user.fullName || user.username}
              </p>
              <p className="truncate text-[10px] text-muted-foreground font-medium">
                {ROLE_LABELS[user.role] ?? user.role}
              </p>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export function SidebarCollapseToggle({
  collapsed,
  onToggle,
}: {
  collapsed: boolean;
  onToggle: () => void;
}) {
  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={onToggle}
      className="size-7 shrink-0 rounded-md text-muted-foreground hover:bg-muted transition-colors"
      title={collapsed ? "باز کردن منو" : "جمع کردن منو"}
    >
      {collapsed ? (
        <ChevronLeft className="size-4" />
      ) : (
        <ChevronRight className="size-4" />
      )}
    </Button>
  );
}
