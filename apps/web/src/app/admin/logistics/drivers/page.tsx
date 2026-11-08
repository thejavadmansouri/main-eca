"use client";

import * as React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Truck,
  Plus,
  Search,
  Phone,
  User,
  ShieldCheck,
  CreditCard,
  Pencil,
  Trash2,
  CheckCircle2,
  XCircle,
  FileText,
  Car,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { getDrivers, createDriver, updateDriver, deleteDriver } from "@/lib/api";
import { faDate, toFa } from "@/lib/format";
import type { DriverRow, CreateDriverInput } from "@/lib/types";

const VEHICLE_TYPES = [
  "وانت پراید / آریسان",
  "وانت نیسان زامیاد",
  "ایسوزو ۶ تن مسقف",
  "خاور چادری ۶۰۸ / ۸۰۸",
  "کامیون تک ۱۰ تن",
  "کامیون جفت ۱۵ تن",
  "تریلی کفی / ترانزیت",
  "سواری شخصی / باربری سبک",
];

/** کامپوننت شبیه‌ساز پلاک ملی ایران */
function IranLicensePlate({ plate }: { plate: string }) {
  return (
    <div className="inline-flex items-center overflow-hidden rounded border border-slate-700 bg-white font-mono text-xs font-bold text-slate-900 shadow-sm dark:bg-slate-100">
      <div className="flex h-7 w-5 flex-col items-center justify-center bg-blue-700 px-1 text-[8px] text-white">
        <span>IR</span>
        <span className="text-[6px]">IRAN</span>
      </div>
      <div className="px-2 py-0.5 tracking-wider font-sans text-xs font-extrabold text-slate-900">
        {plate}
      </div>
      <div className="border-r border-slate-300 px-1.5 py-0.5 text-[10px] font-semibold text-slate-700">
        ایران
      </div>
    </div>
  );
}

export default function DriversManagementPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = React.useState("");
  const [createModalOpen, setCreateModalOpen] = React.useState(false);
  const [editingDriver, setEditingDriver] = React.useState<DriverRow | null>(null);

  // فرم ثبت
  const [fullName, setFullName] = React.useState("");
  const [mobile, setMobile] = React.useState("");
  const [nationalId, setNationalId] = React.useState("");
  const [licenseNumber, setLicenseNumber] = React.useState("");
  const [plateNumber, setPlateNumber] = React.useState("");
  const [vehicleType, setVehicleType] = React.useState(VEHICLE_TYPES[1]);
  const [notes, setNotes] = React.useState("");

  const { data: drivers = [], isLoading } = useQuery({
    queryKey: ["drivers", search],
    queryFn: () => getDrivers(search),
  });

  const createMutation = useMutation({
    mutationFn: (body: CreateDriverInput) => createDriver(body),
    onSuccess: () => {
      toast.success("راننده جدید با موفقیت در پرونده ناوگان ثبت شد.");
      queryClient.invalidateQueries({ queryKey: ["drivers"] });
      resetForm();
      setCreateModalOpen(false);
    },
    onError: (err: any) => {
      toast.error(err?.message || "خطا در ثبت راننده");
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, body }: { id: string; body: any }) => updateDriver(id, body),
    onSuccess: () => {
      toast.success("اطلاعات راننده به‌روزرسانی شد.");
      queryClient.invalidateQueries({ queryKey: ["drivers"] });
      resetForm();
      setEditingDriver(null);
    },
    onError: (err: any) => {
      toast.error(err?.message || "خطا در ویرایش اطلاعات");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteDriver(id),
    onSuccess: () => {
      toast.success("راننده از سیستم حذف گردید.");
      queryClient.invalidateQueries({ queryKey: ["drivers"] });
    },
    onError: (err: any) => {
      toast.error(err?.message || "خطا در حذف راننده");
    },
  });

  const resetForm = () => {
    setFullName("");
    setMobile("");
    setNationalId("");
    setLicenseNumber("");
    setPlateNumber("");
    setVehicleType(VEHICLE_TYPES[1]);
    setNotes("");
  };

  const openEditModal = (driver: DriverRow) => {
    setEditingDriver(driver);
    setFullName(driver.fullName);
    setMobile(driver.mobile);
    setNationalId(driver.nationalId || "");
    setLicenseNumber(driver.licenseNumber || "");
    setPlateNumber(driver.plateNumber);
    setVehicleType(driver.vehicleType);
    setNotes(driver.notes || "");
  };

  return (
    <div className="space-y-5 p-4 md:p-6">
      {/* سربرگ صفحه */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b pb-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight md:text-2xl flex items-center gap-2">
            <Truck className="h-6 w-6 text-primary" />
            پرونده رانندگان و ناوگان حمل‌ونقل
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            مشخصات فردی، خودرو، پلاک انتظامی و سوابق ماموریت‌های بارگیری و اعزام کالا
          </p>
        </div>

        <Button
          size="sm"
          onClick={() => {
            resetForm();
            setCreateModalOpen(true);
          }}
          className="gap-1.5 text-xs font-semibold shadow"
        >
          <Plus className="h-4 w-4" />
          ثبت راننده و خودرو جدید
        </Button>
      </div>

      {/* نوار جستجو و فیلتر */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="relative w-full max-w-sm">
          <Search className="absolute right-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="جستجوی نام، شماره پلاک، موبایل، یا کد راننده..."
            className="pr-9 text-xs"
          />
        </div>

        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span>کل ناوگان فعال:</span>
          <strong className="text-foreground">{toFa(drivers.length)} راننده</strong>
        </div>
      </div>

      {/* نمایش لیست کارت‌های رانندگان */}
      {isLoading ? (
        <div className="flex h-48 items-center justify-center text-sm text-muted-foreground">
          در حال بارگذاری لیست رانندگان...
        </div>
      ) : drivers.length === 0 ? (
        <Card className="flex flex-col items-center justify-center p-12 text-center text-muted-foreground">
          <Truck className="mb-3 h-12 w-12 opacity-30" />
          <p className="text-sm font-semibold">هیچ راننده‌ای در سیستم ثبت نشده است.</p>
          <p className="mt-1 text-xs">جهت ثبت اولین راننده ناوگان، از دکمه «ثبت راننده جدید» استفاده کنید.</p>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {drivers.map((driver) => (
            <Card
              key={driver.id}
              className="flex flex-col justify-between overflow-hidden border p-5 shadow-sm transition hover:shadow-md"
            >
              <div className="space-y-3">
                {/* بخش فوقانی کارت: نام، کد و وضعیت */}
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-primary">{driver.code}</span>
                      <h3 className="font-bold text-foreground text-sm">{driver.fullName}</h3>
                    </div>
                    <span className="inline-block rounded bg-muted px-2 py-0.5 text-[11px] text-muted-foreground">
                      {driver.vehicleType}
                    </span>
                  </div>

                  <span
                    className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                      driver.isActive
                        ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
                        : "bg-rose-500/10 text-rose-700 dark:text-rose-400"
                    }`}
                  >
                    {driver.isActive ? <CheckCircle2 className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
                    {driver.isActive ? "آماده به کار" : "غیرفعال"}
                  </span>
                </div>

                {/* پلاک انتظامی ایران */}
                <div className="pt-1">
                  <IranLicensePlate plate={driver.plateNumber} />
                </div>

                {/* جزئیات تماس و مدارک */}
                <div className="space-y-1.5 border-t pt-3 text-xs text-muted-foreground">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <Phone className="h-3.5 w-3.5 text-primary" />
                      شماره تماس:
                    </span>
                    <a
                      href={`tel:${driver.mobile}`}
                      className="font-mono font-bold text-foreground hover:text-primary dir-ltr"
                    >
                      {driver.mobile}
                    </a>
                  </div>

                  {driver.nationalId && (
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <CreditCard className="h-3.5 w-3.5" />
                        کد ملی:
                      </span>
                      <span className="font-mono">{driver.nationalId}</span>
                    </div>
                  )}

                  {driver.licenseNumber && (
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <ShieldCheck className="h-3.5 w-3.5" />
                        گواهینامه:
                      </span>
                      <span className="font-mono">{driver.licenseNumber}</span>
                    </div>
                  )}

                  {driver.notes && (
                    <p className="mt-1 line-clamp-2 text-[11px] italic text-muted-foreground/80">
                      یادداشت: {driver.notes}
                    </p>
                  )}
                </div>
              </div>

              {/* اکشن‌های پایینی */}
              <div className="mt-4 flex items-center justify-between border-t pt-3">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() =>
                    updateMutation.mutate({
                      id: driver.id,
                      body: { isActive: !driver.isActive },
                    })
                  }
                  className="h-8 text-xs text-muted-foreground"
                >
                  {driver.isActive ? "غیرفعال‌سازی" : "فعال‌سازی مجدد"}
                </Button>

                <div className="flex items-center gap-1">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => openEditModal(driver)}
                    className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      if (confirm(`آیا از حذف راننده «${driver.fullName}» مطمئن هستید؟`)) {
                        deleteMutation.mutate(driver.id);
                      }
                    }}
                    className="h-8 w-8 p-0 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* مودال ثبت / ویرایش راننده */}
      <Dialog
        open={createModalOpen || Boolean(editingDriver)}
        onOpenChange={(open) => {
          if (!open) {
            setCreateModalOpen(false);
            setEditingDriver(null);
            resetForm();
          }
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base font-bold">
              <Truck className="h-5 w-5 text-primary" />
              {editingDriver ? `ویرایش مشخصات راننده: ${editingDriver.fullName}` : "ثبت راننده و خودرو جدید در ناوگان"}
            </DialogTitle>
          </DialogHeader>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (!fullName.trim() || !mobile.trim() || !plateNumber.trim()) {
                toast.error("نام، شماره تماس و شماره پلاک الزامی هستند.");
                return;
              }

              if (editingDriver) {
                updateMutation.mutate({
                  id: editingDriver.id,
                  body: {
                    fullName,
                    mobile,
                    nationalId: nationalId || undefined,
                    licenseNumber: licenseNumber || undefined,
                    plateNumber,
                    vehicleType,
                    notes: notes || undefined,
                  },
                });
              } else {
                createMutation.mutate({
                  fullName,
                  mobile,
                  nationalId: nationalId || undefined,
                  licenseNumber: licenseNumber || undefined,
                  plateNumber,
                  vehicleType,
                  notes: notes || undefined,
                });
              }
            }}
            className="space-y-3 pt-2 text-xs"
          >
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="mb-1 block font-medium">نام و نام خانوادگی راننده:</label>
                <Input
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="مثال: عباس محمدی"
                  className="text-xs"
                />
              </div>
              <div>
                <label className="mb-1 block font-medium">شماره موبایل:</label>
                <Input
                  value={mobile}
                  onChange={(e) => setMobile(e.target.value)}
                  placeholder="0912..."
                  className="text-xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="mb-1 block font-medium">شماره پلاک خودرو (الزامی):</label>
                <Input
                  value={plateNumber}
                  onChange={(e) => setPlateNumber(e.target.value)}
                  placeholder="مثال: ۱۲ ج ۳۴۵ ایران ۱۱"
                  className="text-xs"
                />
              </div>
              <div>
                <label className="mb-1 block font-medium">نوع وسیله نقلیه:</label>
                <select
                  value={vehicleType}
                  onChange={(e) => setVehicleType(e.target.value)}
                  className="w-full rounded-md border bg-background p-2 text-xs"
                >
                  {VEHICLE_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="mb-1 block font-medium">کد ملی راننده (اختیاری):</label>
                <Input
                  value={nationalId}
                  onChange={(e) => setNationalId(e.target.value)}
                  placeholder="کد ملی ۱۰ رقمی"
                  className="text-xs"
                />
              </div>
              <div>
                <label className="mb-1 block font-medium">شماره گواهینامه رانندگی:</label>
                <Input
                  value={licenseNumber}
                  onChange={(e) => setLicenseNumber(e.target.value)}
                  placeholder="شماره گواهینامه"
                  className="text-xs"
                />
              </div>
            </div>

            <div>
              <label className="mb-1 block font-medium">یادداشت، بیمه‌نامه یا مشخصات کارت ماشین:</label>
              <textarea
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="توضیحات تکمیلی، انقضای بیمه شخص ثالث، ظرفیت بار..."
                className="w-full rounded-md border bg-background p-2 text-xs"
              />
            </div>

            <div className="flex justify-end gap-2 pt-3">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  setCreateModalOpen(false);
                  setEditingDriver(null);
                  resetForm();
                }}
              >
                انصراف
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={createMutation.isPending || updateMutation.isPending}
              >
                {createMutation.isPending || updateMutation.isPending
                  ? "در حال ذخیره..."
                  : editingDriver
                  ? "ذخیره تغییرات"
                  : "ثبت در ناوگان"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
