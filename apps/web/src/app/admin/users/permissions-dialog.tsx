"use client";

import * as React from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Check,
  CheckCheck,
  CheckCircle2,
  CreditCard,
  Factory,
  Layers,
  Lock,
  Package,
  Receipt,
  Search,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  Truck,
  Users,
  Wrench,
  X,
} from "lucide-react";

import { updateUserPermissions } from "@/lib/api";
import {
  PERMISSION_GROUPS,
  PERMISSION_PRESETS,
  type PermissionGroup,
} from "@/lib/permissions";
import type { User } from "@/lib/types";
import { toFa } from "@/lib/format";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const ICON_MAP: Record<string, any> = {
  Package,
  Receipt,
  Factory,
  CreditCard,
  Users,
  Truck,
  TrendingUp,
  ShieldAlert,
};

interface UserPermissionsDialogProps {
  user: User | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function UserPermissionsDialog({
  user,
  open,
  onOpenChange,
}: UserPermissionsDialogProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [selectedPerms, setSelectedPerms] = React.useState<Set<string>>(new Set());
  const [searchFilter, setSearchFilter] = React.useState("");

  // هنگام باز شدن دیالوگ، دسترسی‌های فعلی کاربر لود می‌شود
  React.useEffect(() => {
    if (user) {
      if (user.role === "ADMIN") {
        // برای ادمین، همه دسترسی‌ها فعال هستند
        const allKeys = PERMISSION_GROUPS.flatMap((g) => g.permissions.map((p) => p.key));
        setSelectedPerms(new Set(allKeys));
      } else {
        setSelectedPerms(new Set(user.permissions || []));
      }
    }
  }, [user, open]);

  const updateMutation = useMutation({
    mutationFn: (perms: string[]) => updateUserPermissions(user!.id, perms),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      onOpenChange(false);
      toast({
        title: "سطح دسترسی با موفقیت به‌روزرسانی شد",
        description: `تعداد ${toFa(selectedPerms.size)} مجوز دسترسی برای کاربر «${user?.fullName}» تنظیم گردید.`,
      });
    },
    onError: (err: any) => {
      toast({
        title: "خطا در ذخیره دسترسی‌ها",
        description: err?.message || "مشکلی در ذخیره تغییرات رخ داد.",
        variant: "destructive",
      });
    },
  });

  const togglePerm = (key: string) => {
    setSelectedPerms((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  const toggleGroup = (group: PermissionGroup) => {
    const groupKeys = group.permissions.map((p) => p.key);
    const allSelected = groupKeys.every((k) => selectedPerms.has(k));

    setSelectedPerms((prev) => {
      const next = new Set(prev);
      if (allSelected) {
        groupKeys.forEach((k) => next.delete(k));
      } else {
        groupKeys.forEach((k) => next.add(k));
      }
      return next;
    });
  };

  const handleSelectAll = () => {
    const all = PERMISSION_GROUPS.flatMap((g) => g.permissions.map((p) => p.key));
    setSelectedPerms(new Set(all));
  };

  const handleClearAll = () => {
    setSelectedPerms(new Set());
  };

  const applyPreset = (presetPerms: string[]) => {
    setSelectedPerms(new Set(presetPerms));
    toast({
      title: "الگوی دسترسی اعمال شد",
      description: "برای نهایی‌سازی، دکمه ذخیره تغییرات را بزنید.",
    });
  };

  const allKeysCount = PERMISSION_GROUPS.flatMap((g) => g.permissions).length;

  if (!user) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col p-6 font-sans">
        <DialogHeader className="border-b pb-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <div className="size-9 rounded-xl bg-primary/10 flex items-center justify-center text-primary border border-primary/20">
                <Shield className="size-5" />
              </div>
              <div>
                <DialogTitle className="text-base font-black text-foreground flex items-center gap-2">
                  <span>تعیین سطح دسترسی کاربر:</span>
                  <span className="text-primary">{user.fullName}</span>
                  <span className="font-mono text-xs text-muted-foreground font-normal">
                    ({user.username})
                  </span>
                </DialogTitle>
                <DialogDescription className="text-xs">
                  دسترسی‌های مجاز کاربر را به صورت جزئی تیک بزنید یا از الگوهای سازمانی آماده استفاده کنید.
                </DialogDescription>
              </div>
            </div>

            <Badge
              variant="outline"
              className="font-mono text-xs font-bold px-2.5 py-1 bg-muted/60"
            >
              {toFa(selectedPerms.size)} از {toFa(allKeysCount)} مجوز فعال
            </Badge>
          </div>
        </DialogHeader>

        {/* نوار الگوهای آماده و فیلتر جستجو */}
        <div className="space-y-2.5 pt-2">
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
              <Input
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                placeholder="جستجو در نام یا شرح مجوزها..."
                className="h-8.5 pr-8.5 text-xs rounded-xl bg-muted/30 border-border/80"
              />
              {searchFilter && (
                <button
                  onClick={() => setSearchFilter("")}
                  className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X className="size-3" />
                </button>
              )}
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={handleSelectAll}
              className="h-8.5 text-[11px] gap-1 font-bold shadow-2xs"
            >
              <CheckCheck className="size-3.5 text-emerald-600" />
              انتخاب همه
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={handleClearAll}
              className="h-8.5 text-[11px] gap-1 font-bold shadow-2xs text-rose-600 hover:bg-rose-500/10"
            >
              <X className="size-3.5" />
              پاک‌کردن
            </Button>
          </div>

          {/* اسلایدر الگوهای شغلی آماده */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1 text-xs">
            <span className="text-[11px] font-bold text-muted-foreground shrink-0 ml-1">
              الگوهای آماده:
            </span>
            {PERMISSION_PRESETS.map((preset) => (
              <button
                key={preset.id}
                type="button"
                onClick={() => applyPreset(preset.permissions)}
                className="shrink-0 text-[11px] font-semibold px-2.5 py-1 rounded-lg border border-border/70 bg-card hover:bg-primary/10 hover:border-primary/40 hover:text-primary transition-all shadow-2xs"
              >
                {preset.name}
              </button>
            ))}
          </div>
        </div>

        {/* لیست گروه‌ها و مجوزها */}
        <div className="flex-1 overflow-y-auto space-y-3.5 pr-1 py-2">
          {PERMISSION_GROUPS.map((group) => {
            const Icon = ICON_MAP[group.icon] || Shield;
            const groupKeys = group.permissions.map((p) => p.key);
            const selectedInGroup = groupKeys.filter((k) => selectedPerms.has(k)).length;
            const isAllGroupSelected = selectedInGroup === groupKeys.length && groupKeys.length > 0;

            // فیلتر بر اساس جستجو
            const filteredPerms = group.permissions.filter(
              (p) =>
                !searchFilter.trim() ||
                p.label.toLowerCase().includes(searchFilter.toLowerCase().trim()) ||
                p.description.toLowerCase().includes(searchFilter.toLowerCase().trim())
            );

            if (filteredPerms.length === 0) return null;

            return (
              <div
                key={group.id}
                className="border border-border/80 rounded-2xl overflow-hidden bg-card shadow-2xs transition-colors"
              >
                {/* هدر ماژول / گروه */}
                <div className="flex items-center justify-between p-3 bg-muted/40 border-b border-border/60">
                  <div className="flex items-center gap-2">
                    <div
                      className={cn(
                        "size-7 rounded-lg flex items-center justify-center border",
                        group.color
                      )}
                    >
                      <Icon className="size-4" />
                    </div>
                    <span className="text-xs font-bold text-foreground">{group.title}</span>
                    <span className="font-mono text-[10px] text-muted-foreground">
                      ({toFa(selectedInGroup)} از {toFa(groupKeys.length)})
                    </span>
                  </div>

                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleGroup(group)}
                    className="h-6.5 text-[11px] px-2 font-bold text-primary hover:bg-primary/10 rounded-md"
                  >
                    {isAllGroupSelected ? "لغو کل این بخش" : "انتخاب کل این بخش"}
                  </Button>
                </div>

                {/* ردیف‌های مجوزها */}
                <div className="p-2.5 grid grid-cols-1 md:grid-cols-2 gap-2">
                  {filteredPerms.map((perm) => {
                    const isChecked = selectedPerms.has(perm.key);

                    return (
                      <label
                        key={perm.key}
                        className={cn(
                          "flex items-start gap-2.5 p-2.5 rounded-xl border cursor-pointer transition-all select-none",
                          isChecked
                            ? "bg-primary/[0.04] border-primary/40 shadow-2xs"
                            : "bg-background border-border/60 hover:bg-muted/40"
                        )}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => togglePerm(perm.key)}
                          className="mt-0.5 size-4 rounded text-primary focus:ring-primary shrink-0"
                        />
                        <div className="space-y-0.5 min-w-0">
                          <span
                            className={cn(
                              "text-xs font-bold block leading-snug",
                              isChecked ? "text-primary" : "text-foreground"
                            )}
                          >
                            {perm.label}
                          </span>
                          <span className="text-[11px] text-muted-foreground block leading-relaxed line-clamp-2">
                            {perm.description}
                          </span>
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        <DialogFooter className="border-t pt-3 gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}
            className="text-xs font-semibold"
          >
            انصراف
          </Button>
          <Button
            type="button"
            size="sm"
            disabled={updateMutation.isPending}
            onClick={() => updateMutation.mutate(Array.from(selectedPerms))}
            className="bg-primary text-primary-foreground text-xs font-bold gap-1.5 shadow-xs"
          >
            {updateMutation.isPending ? "در حال ذخیره..." : "ذخیره دسترسی‌های کاربر"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
