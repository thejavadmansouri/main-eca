"use client";

// طبق بخش ۶.۱۰ — مدیریت کاربران و تعیین سطح دسترسی (فقط ADMIN)
import * as React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Users as UsersIcon,
  UserPlus,
  KeyRound,
  ShieldCheck,
  Shield,
  ShieldAlert,
  CheckCircle2,
  XCircle,
  Search,
  Filter,
  UserCheck,
  UserX,
  Sparkles,
} from "lucide-react";
import { useAuthStore } from "@/lib/auth-store";
import {
  getUsers,
  createUser,
  updateUserRole,
  updateUserPassword,
  setUserSiteAccess,
  setUserActiveStatus,
} from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { ApiException } from "@/lib/api-error-messages";
import { PageHeader } from "@/components/page-header";
import { LoadingState, EmptyState, ErrorState } from "@/components/states";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ROLE_LABELS, toFa } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { User, Role, CreateUserDto } from "@/lib/types";
import { UserPermissionsDialog } from "./permissions-dialog";

const ROLE_OPTIONS: Role[] = ["ADMIN", "MANAGER", "STAFF", "SALES"];

const ROLE_BADGE_CLASS: Record<Role, string> = {
  ADMIN: "bg-rose-100 text-rose-700 border-rose-200",
  MANAGER: "bg-amber-100 text-amber-700 border-amber-200",
  STAFF: "bg-emerald-100 text-emerald-700 border-emerald-200",
  SALES: "bg-sky-100 text-sky-700 border-sky-200",
};

/** داخلِ صفحه‌ی میزبان سرتیترِ خودش را نشان نمی‌دهد. */
export function UsersPanel({ embedded }: { embedded?: boolean } = {}) {
  const currentUser = useAuthStore((s) => s.user);
  const { toast } = useToast();
  const qc = useQueryClient();

  // فیلترها و جستجو
  const [searchQuery, setSearchQuery] = React.useState("");
  const [roleFilter, setRoleFilter] = React.useState<string>("ALL");
  const [statusFilter, setStatusFilter] = React.useState<string>("ALL");

  // GET /users
  const usersQ = useQuery({
    queryKey: ["users"],
    queryFn: () => getUsers(),
  });

  // ----- state دیالوگ‌ها -----
  const [createOpen, setCreateOpen] = React.useState(false);
  const [createForm, setCreateForm] = React.useState<CreateUserDto>({
    username: "",
    password: "",
    fullName: "",
    role: "STAFF",
  });

  // دیالوگ تعیین سطح دسترسی‌ها
  const [permissionsTarget, setPermissionsTarget] = React.useState<User | null>(null);

  // دیالوگ تغییر نقش
  const [roleTarget, setRoleTarget] = React.useState<User | null>(null);
  const [roleValue, setRoleValue] = React.useState<Role>("STAFF");

  // دیالوگ بازنشانی رمز
  const [pwdTarget, setPwdTarget] = React.useState<User | null>(null);
  const [pwdValue, setPwdValue] = React.useState("");

  // ----- دسترسی به فروشگاه اینترنتی (مستقل از نقش) -----
  const siteAccessMut = useMutation({
    mutationFn: (u: User) => setUserSiteAccess(u.id, !u.canManageSite),
    onSuccess: () => {
      toast({ title: "دسترسی فروشگاه اینترنتی به‌روزرسانی شد" });
      qc.invalidateQueries({ queryKey: ["users"] });
    },
    onError: (e: unknown) => {
      const msg =
        e instanceof ApiException ? e.message : "خطا در تغییر دسترسی";
      toast({ variant: "destructive", title: "خطا", description: msg });
    },
  });

  // ----- تغییر وضعیت فعال/مسدود بودن حساب کاربر -----
  const toggleActiveMut = useMutation({
    mutationFn: (u: User) => setUserActiveStatus(u.id, u.isActive === false ? true : false),
    onSuccess: () => {
      toast({ title: "وضعیت کاربر به‌روزرسانی شد" });
      qc.invalidateQueries({ queryKey: ["users"] });
    },
    onError: (e: unknown) => {
      const msg =
        e instanceof ApiException ? e.message : "خطا در تغییر وضعیت کاربر";
      toast({ variant: "destructive", title: "خطا", description: msg });
    },
  });

  // ----- mutations -----

  // POST /users
  const createMut = useMutation({
    mutationFn: () => createUser(createForm),
    onSuccess: (createdUser) => {
      toast({ title: "کاربر با موفقیت ساخته شد" });
      qc.invalidateQueries({ queryKey: ["users"] });
      setCreateOpen(false);
      setCreateForm({ username: "", password: "", fullName: "", role: "STAFF" });
      // اگر کاربر جدید ادمین نیست، دیالوگ دسترسی‌ها را برای تنظیم اختیارات باز می‌کنیم
      if (createdUser && createdUser.role !== "ADMIN") {
        setPermissionsTarget(createdUser);
      }
    },
    onError: (e: unknown) => {
      const msg = e instanceof ApiException ? e.message : "خطا در ساخت کاربر";
      toast({ variant: "destructive", title: "خطا", description: msg });
    },
  });

  // PATCH /users/:id/role
  const roleMut = useMutation({
    mutationFn: () => updateUserRole(roleTarget!.id, { role: roleValue }),
    onSuccess: () => {
      toast({ title: "نقش کاربر به‌روزرسانی شد" });
      qc.invalidateQueries({ queryKey: ["users"] });
      setRoleTarget(null);
    },
    onError: (e: unknown) => {
      const msg =
        e instanceof ApiException ? e.message : "خطا در تغییر نقش";
      toast({ variant: "destructive", title: "خطا", description: msg });
    },
  });

  // PATCH /users/:id/password
  const pwdMut = useMutation({
    mutationFn: () => updateUserPassword(pwdTarget!.id, { password: pwdValue }),
    onSuccess: () => {
      toast({ title: "رمز عبور با موفقیت بازنشانی شد" });
      setPwdTarget(null);
      setPwdValue("");
    },
    onError: (e: unknown) => {
      const msg =
        e instanceof ApiException ? e.message : "خطا در بازنشانی رمز";
      toast({ variant: "destructive", title: "خطا", description: msg });
    },
  });

  // محافظت نقش — فقط ADMIN
  if (currentUser && currentUser.role !== "ADMIN") {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Card className="max-w-md border-destructive/40">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <ShieldCheck className="h-5 w-5" />
              دسترسی غیرمجاز
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              این صفحه فقط برای نقش «مدیر کل» (ADMIN) قابل دسترس است.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const allUsers = usersQ.data || [];

  // آمار کلیدی
  const totalCount = allUsers.length;
  const activeCount = allUsers.filter((u) => u.isActive !== false).length;
  const blockedCount = allUsers.filter((u) => u.isActive === false).length;
  const adminCount = allUsers.filter((u) => u.role === "ADMIN").length;
  const customPermCount = allUsers.filter((u) => (u.permissions && u.permissions.length > 0) || u.role === "ADMIN").length;

  // فیلتر نتایج
  const filteredUsers = allUsers.filter((u) => {
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchName = u.fullName?.toLowerCase().includes(q);
      const matchUsername = u.username?.toLowerCase().includes(q);
      if (!matchName && !matchUsername) return false;
    }
    if (roleFilter !== "ALL" && u.role !== roleFilter) return false;
    if (statusFilter === "ACTIVE" && u.isActive === false) return false;
    if (statusFilter === "BLOCKED" && u.isActive !== false) return false;
    return true;
  });

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        compact={embedded}
        title="مدیریت کاربران و سطح دسترسی"
        description="تعریف کاربران، انتساب نقش‌ها و تعیین دقیق اختیارات و مجوزهای هر پرسنل"
        icon={UsersIcon}
        actions={
          <Button onClick={() => setCreateOpen(true)} className="gap-2">
            <UserPlus className="h-4 w-4" />
            کاربر جدید
          </Button>
        }
      />

      {/* کارت‌های خلاصه وضعیت */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <Card className="bg-slate-50/50 border-slate-200">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground font-medium">کل کاربران</p>
              <p className="text-2xl font-bold mt-1 text-slate-800">{toFa(totalCount)}</p>
            </div>
            <div className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-600">
              <UsersIcon className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-emerald-50/40 border-emerald-200">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-emerald-800 font-medium">کاربران فعال</p>
              <p className="text-2xl font-bold mt-1 text-emerald-700">{toFa(activeCount)}</p>
            </div>
            <div className="h-10 w-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700">
              <UserCheck className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-rose-50/40 border-rose-200">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-rose-800 font-medium">مسدود / غیرفعال</p>
              <p className="text-2xl font-bold mt-1 text-rose-700">{toFa(blockedCount)}</p>
            </div>
            <div className="h-10 w-10 rounded-full bg-rose-100 flex items-center justify-center text-rose-700">
              <UserX className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-indigo-50/40 border-indigo-200">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-indigo-800 font-medium">دارای مجوز اختصاصی</p>
              <p className="text-2xl font-bold mt-1 text-indigo-700">{toFa(customPermCount)}</p>
            </div>
            <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700">
              <Shield className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* نوار جستجو و فیلتر */}
      <Card className="shadow-sm">
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row items-center gap-3">
            <div className="relative flex-1 w-full">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="جستجوی نام یا نام کاربری..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pr-9"
              />
            </div>
            <div className="flex items-center gap-2 w-full md:w-auto">
              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="نقش" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">همه‌ی نقش‌ها</SelectItem>
                  {ROLE_OPTIONS.map((r) => (
                    <SelectItem key={r} value={r}>
                      {ROLE_LABELS[r]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="وضعیت" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">همه‌ی وضعیت‌ها</SelectItem>
                  <SelectItem value="ACTIVE">فقط فعال</SelectItem>
                  <SelectItem value="BLOCKED">فقط مسدود</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* جدول کاربران */}
      <Card className="shadow-sm">
        <CardContent className="p-0">
          {usersQ.isLoading ? (
            <LoadingState />
          ) : usersQ.isError ? (
            <ErrorState
              message="بارگذاری کاربران ناموفق بود"
              onRetry={() => usersQ.refetch()}
            />
          ) : !filteredUsers.length ? (
            <EmptyState
              title="کاربری یافت نشد"
              description={searchQuery || roleFilter !== "ALL" || statusFilter !== "ALL"
                ? "با فیلترهای انتخابی کاربری پیدا نشد."
                : "برای شروع، اولین کاربر را بسازید."}
              action={
                <Button onClick={() => setCreateOpen(true)}>
                  <UserPlus className="h-4 w-4" />
                  کاربر جدید
                </Button>
              }
            />
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>نام کامل</TableHead>
                    <TableHead>نام کاربری</TableHead>
                    <TableHead>نقش سازمانی</TableHead>
                    <TableHead>سطح دسترسی و اختیارات</TableHead>
                    <TableHead>فروشگاه اینترنتی</TableHead>
                    <TableHead>وضعیت حساب</TableHead>
                    <TableHead className="text-end">عملیات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.map((u) => {
                    const isSelf = u.id === currentUser?.id;
                    const isActive = u.isActive !== false;
                    const permCount = u.permissions?.length || 0;

                    return (
                      <TableRow key={u.id} className={!isActive ? "opacity-60 bg-muted/20" : ""}>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            <span>{u.fullName}</span>
                            {isSelf && (
                              <Badge variant="outline" className="text-[10px] bg-slate-100 text-slate-700">
                                شما
                              </Badge>
                            )}
                          </div>
                        </TableCell>

                        <TableCell className="font-mono text-xs text-muted-foreground">
                          {u.username}
                        </TableCell>

                        <TableCell>
                          <Badge className={cn("border font-normal text-xs", ROLE_BADGE_CLASS[u.role])}>
                            {ROLE_LABELS[u.role] ?? u.role}
                          </Badge>
                        </TableCell>

                        <TableCell>
                          {u.role === "ADMIN" ? (
                            <Badge className="bg-purple-100 text-purple-800 border-purple-200 text-xs font-normal">
                              <ShieldCheck className="h-3 w-3 ml-1 text-purple-600 inline" />
                              دسترسی کامل (مدیر ارشد)
                            </Badge>
                          ) : (
                            <Button
                              variant="outline"
                              size="sm"
                              className={cn(
                                "h-7 text-xs gap-1.5 font-normal",
                                permCount > 0
                                  ? "border-indigo-300 text-indigo-700 bg-indigo-50/50 hover:bg-indigo-100"
                                  : "text-muted-foreground hover:bg-muted"
                              )}
                              onClick={() => setPermissionsTarget(u)}
                            >
                              <Shield className="h-3.5 w-3.5 text-indigo-600" />
                              {permCount > 0
                                ? `${toFa(permCount)} مجوز فعال`
                                : "پیش‌فرض نقش (بدون مجوز سفارشی)"}
                            </Button>
                          )}
                        </TableCell>

                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Switch
                              checked={u.canManageSite === true}
                              onCheckedChange={() => siteAccessMut.mutate(u)}
                              disabled={siteAccessMut.isPending}
                              title="دسترسی به بخش فروشگاه اینترنتی"
                            />
                            <span className="text-xs text-muted-foreground">
                              {u.canManageSite ? "فعال" : "غیرفعال"}
                            </span>
                          </div>
                        </TableCell>

                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Switch
                              checked={isActive}
                              onCheckedChange={() => toggleActiveMut.mutate(u)}
                              disabled={toggleActiveMut.isPending || isSelf}
                              title={isSelf ? "نمی‌توانید حساب کاربری خودتان را مسدود کنید" : "فعال / مسدودسازی دسترسی کاربر به سیستم"}
                            />
                            <span
                              className={cn(
                                "text-xs font-medium",
                                isActive ? "text-emerald-700" : "text-rose-600"
                              )}
                            >
                              {isActive ? "فعال" : "مسدود"}
                            </span>
                          </div>
                        </TableCell>

                        <TableCell className="text-end">
                          <div className="flex items-center justify-end gap-1.5">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setPermissionsTarget(u)}
                              className="text-xs gap-1 border-indigo-200 text-indigo-700 hover:bg-indigo-50"
                              title="تنظیم دقیق دسترسی‌ها و مجوزهای بخش‌های سیستم"
                            >
                              <Shield className="h-3.5 w-3.5" />
                              مجوزها
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-xs gap-1"
                              onClick={() => {
                                setRoleTarget(u);
                                setRoleValue(u.role);
                              }}
                            >
                              <ShieldCheck className="h-3.5 w-3.5" />
                              تغییر نقش
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-xs gap-1"
                              onClick={() => {
                                setPwdTarget(u);
                                setPwdValue("");
                              }}
                            >
                              <KeyRound className="h-3.5 w-3.5" />
                              رمز
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* دیالوگ تعیین سطح دسترسی‌ها */}
      <UserPermissionsDialog
        user={permissionsTarget}
        open={Boolean(permissionsTarget)}
        onOpenChange={(op) => !op && setPermissionsTarget(null)}
      />

      {/* دیالوگ کاربر جدید */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>کاربر جدید</DialogTitle>
            <DialogDescription>
              مشخصات حساب کاربری را وارد کنید. پس از ساخت، می‌توانید مجوزهای بخش‌های سیستم را نیز سفارشی کنید.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-2">
              <Label htmlFor="u-fullname">نام کامل *</Label>
              <Input
                id="u-fullname"
                value={createForm.fullName}
                onChange={(e) =>
                  setCreateForm((f) => ({ ...f, fullName: e.target.value }))
                }
                placeholder="مثلاً علی رضایی"
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="u-username">نام کاربری *</Label>
              <Input
                id="u-username"
                value={createForm.username}
                onChange={(e) =>
                  setCreateForm((f) => ({ ...f, username: e.target.value }))
                }
                placeholder="مثلاً ali.r"
                autoComplete="off"
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="u-password">رمز عبور *</Label>
              <Input
                id="u-password"
                type="password"
                value={createForm.password}
                onChange={(e) =>
                  setCreateForm((f) => ({ ...f, password: e.target.value }))
                }
                placeholder="حداقل ۶ کاراکتر"
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label>نقش سازمانی *</Label>
              <Select
                value={createForm.role}
                onValueChange={(v: Role) =>
                  setCreateForm((f) => ({ ...f, role: v }))
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="انتخاب نقش" />
                </SelectTrigger>
                <SelectContent>
                  {ROLE_OPTIONS.map((r) => (
                    <SelectItem key={r} value={r}>
                      {ROLE_LABELS[r]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setCreateOpen(false)}
              disabled={createMut.isPending}
            >
              انصراف
            </Button>
            <Button
              onClick={() => createMut.mutate()}
              disabled={
                createMut.isPending ||
                !createForm.username.trim() ||
                !createForm.password.trim() ||
                !createForm.fullName.trim()
              }
            >
              {createMut.isPending ? "در حال ساخت..." : "ساخت کاربر"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* دیالوگ تغییر نقش */}
      <Dialog
        open={!!roleTarget}
        onOpenChange={(o) => !o && setRoleTarget(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>تغییر نقش کاربر</DialogTitle>
            <DialogDescription>
              نقش جدید را برای «{roleTarget?.fullName}» انتخاب کنید.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-2">
            <Label>نقش</Label>
            <Select
              value={roleValue}
              onValueChange={(v: Role) => setRoleValue(v)}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ROLE_OPTIONS.map((r) => (
                  <SelectItem key={r} value={r}>
                    {ROLE_LABELS[r]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setRoleTarget(null)}
              disabled={roleMut.isPending}
            >
              انصراف
            </Button>
            <Button
              onClick={() => roleMut.mutate()}
              disabled={roleMut.isPending || roleValue === roleTarget?.role}
            >
              {roleMut.isPending ? "در حال ذخیره..." : "ذخیره"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* دیالوگ بازنشانی رمز */}
      <Dialog
        open={!!pwdTarget}
        onOpenChange={(o) => !o && setPwdTarget(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>بازنشانی رمز عبور</DialogTitle>
            <DialogDescription>
              رمز عبور جدید را برای «{pwdTarget?.fullName}» وارد کنید.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-2">
            <Label htmlFor="new-pwd">رمز جدید *</Label>
            <Input
              id="new-pwd"
              type="password"
              value={pwdValue}
              onChange={(e) => setPwdValue(e.target.value)}
              placeholder="حداقل ۶ کاراکتر"
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setPwdTarget(null)}
              disabled={pwdMut.isPending}
            >
              انصراف
            </Button>
            <Button
              onClick={() => pwdMut.mutate()}
              disabled={pwdMut.isPending || pwdValue.trim().length < 6}
            >
              {pwdMut.isPending ? "در حال ذخیره..." : "بازنشانی رمز"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

/** مسیرِ مستقل — پیوندهای قدیمی نباید بشکنند. */
export default function UsersPage() {
  return <UsersPanel />;
}
