"use client";

import * as React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  AlertCircle,
  AlertTriangle,
  ArrowDownLeft,
  ArrowUpRight,
  Boxes,
  Check,
  CheckCircle2,
  Clock,
  Filter,
  Flame,
  HardHat,
  Layers,
  MapPin,
  Package,
  PackageCheck,
  Plus,
  Printer,
  QrCode,
  RefreshCw,
  Search,
  Trash2,
  User,
  UserCheck,
  UserPlus,
  Users,
  X,
  XCircle,
} from "lucide-react";

import {
  getWorkTasks,
  getWorkTask,
  createWorkTask,
  cancelWorkTask,
  completeWorkTask,
  reassignWorkTask,
  updateWorkTaskPriority,
  syncWorkTaskMutations,
  getWorkers,
  getWarehouses,
  getLocations,
} from "@/lib/api";
import type { WorkTask, WorkTaskItem, Worker, Warehouse, Location } from "@/lib/types";
import { formatDateTime, toFa } from "@/lib/format";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ProductSearchSelect } from "@/components/product-search-select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface CreateTaskLineDraft {
  productId: string;
  productName: string;
  productSku?: string;
  locationId?: string;
  quantity: number;
}

export function WorkTasksPanel({ embedded = false }: { embedded?: boolean }) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // فیلترها
  const [statusFilter, setStatusFilter] = React.useState<string>("ALL");
  const [kindFilter, setKindFilter] = React.useState<string>("ALL");
  const [priorityFilter, setPriorityFilter] = React.useState<string>("ALL");
  const [warehouseFilter, setWarehouseFilter] = React.useState<string>("ALL");
  const [workerFilter, setWorkerFilter] = React.useState<string>("ALL");
  const [searchQuery, setSearchQuery] = React.useState<string>("");

  // دیالوگ‌ها
  const [isCreateOpen, setIsCreateOpen] = React.useState(false);
  const [detailTaskId, setDetailTaskId] = React.useState<string | null>(null);
  const [reassignTaskId, setReassignTaskId] = React.useState<string | null>(null);
  const [selectedWorkerId, setSelectedWorkerId] = React.useState<string>("");
  const [cancelTaskId, setCancelTaskId] = React.useState<string | null>(null);
  const [cancelReason, setCancelReason] = React.useState<string>("");
  const [printTask, setPrintTask] = React.useState<WorkTask | null>(null);

  // فرم ایجاد تسک جدید
  const [newKind, setNewKind] = React.useState<"PICK" | "PUTAWAY">("PICK");
  const [newPriority, setNewPriority] = React.useState<"NORMAL" | "URGENT">("NORMAL");
  const [newWarehouseId, setNewWarehouseId] = React.useState<string>("");
  const [newAssigneeId, setNewAssigneeId] = React.useState<string>("");
  const [newNote, setNewNote] = React.useState<string>("");
  const [newLines, setNewLines] = React.useState<CreateTaskLineDraft[]>([]);

  // کوئری‌ها
  const { data: tasks = [], isLoading, refetch } = useQuery({
    queryKey: ["work-tasks", statusFilter, warehouseFilter],
    queryFn: () =>
      getWorkTasks({
        status: statusFilter !== "ALL" ? (statusFilter as any) : undefined,
        warehouseId: warehouseFilter !== "ALL" ? warehouseFilter : undefined,
      }),
    refetchInterval: 4000,
  });

  const { data: workers = [] } = useQuery({
    queryKey: ["work-tasks-workers"],
    queryFn: () => getWorkers(),
  });

  const { data: warehouses = [] } = useQuery({
    queryKey: ["warehouses", "active"],
    queryFn: () => getWarehouses(),
  });

  const { data: locations = [] } = useQuery({
    queryKey: ["locations"],
    queryFn: () => getLocations(),
  });

  const { data: taskDetail, isLoading: isLoadingDetail } = useQuery({
    queryKey: ["work-task-detail", detailTaskId],
    queryFn: () => (detailTaskId ? getWorkTask(detailTaskId) : null),
    enabled: !!detailTaskId,
  });

  React.useEffect(() => {
    if (warehouses.length > 0 && !newWarehouseId) {
      setNewWarehouseId(warehouses[0].id);
    }
  }, [warehouses, newWarehouseId]);

  // میوتیشن‌ها
  const createMutation = useMutation({
    mutationFn: createWorkTask,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["work-tasks"] });
      setIsCreateOpen(false);
      setNewLines([]);
      setNewNote("");
      toast({ title: "وظیفه کارگاهی ثبت شد", description: "وظیفه در تابلوی کارگران فعال گردید." });
    },
    onError: (err: any) => {
      toast({ title: "خطا در ثبت وظیفه", description: err.message, variant: "destructive" });
    },
  });

  const completeMutation = useMutation({
    mutationFn: (id: string) => completeWorkTask(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["work-tasks"] });
      queryClient.invalidateQueries({ queryKey: ["work-task-detail"] });
      toast({ title: "وظیفه تکمیل شد", description: "تمام اقلام وظیفه با موفقیت تیک خوردند." });
    },
  });

  const reassignMutation = useMutation({
    mutationFn: (body: { id: string; workerIds: string[] }) =>
      reassignWorkTask(body.id, body.workerIds),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["work-tasks"] });
      setReassignTaskId(null);
      toast({ title: "تخصیص بروز شد", description: "کارگر جدید برای وظیفه تعیین شد." });
    },
  });

  const priorityMutation = useMutation({
    mutationFn: (body: { id: string; priority: "NORMAL" | "URGENT" }) =>
      updateWorkTaskPriority(body.id, body.priority),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["work-tasks"] });
      toast({ title: "اولویت وظیفه تغییر کرد" });
    },
  });

  const cancelMutation = useMutation({
    mutationFn: (body: { id: string; reason: string }) =>
      cancelWorkTask(body.id, body.reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["work-tasks"] });
      setCancelTaskId(null);
      setCancelReason("");
      toast({ title: "وظیفه لغو شد" });
    },
  });

  const tickItemMutation = useMutation({
    mutationFn: (body: { taskId: string; itemId: string }) =>
      syncWorkTaskMutations([
        {
          clientMutationId: `mgr_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
          taskId: body.taskId,
          itemId: body.itemId,
        },
      ]),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["work-tasks"] });
      queryClient.invalidateQueries({ queryKey: ["work-task-detail"] });
      toast({ title: "قلم تیک خورد" });
    },
  });

  // فیلتر کردن وظایف
  const filteredTasks = tasks.filter((t) => {
    if (kindFilter !== "ALL" && (t.kind || "PICK") !== kindFilter) return false;
    if (priorityFilter !== "ALL" && (t.priority || "NORMAL") !== priorityFilter) return false;
    if (workerFilter === "UNASSIGNED" && (t.assignedToId || t.assignees?.length)) return false;
    if (
      workerFilter !== "ALL" &&
      workerFilter !== "UNASSIGNED" &&
      t.assignedToId !== workerFilter &&
      !t.assignees?.some((a) => a.id === workerFilter)
    ) {
      return false;
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const refNumber = String(t.invoice?.number || t.quotation?.number || t.purchase?.number || "");
      const matchesSearch =
        t.id.toLowerCase().includes(q) ||
        (t.note && t.note.toLowerCase().includes(q)) ||
        (t.assignedTo?.fullName && t.assignedTo.fullName.toLowerCase().includes(q)) ||
        refNumber.includes(q);
      if (!matchesSearch) return false;
    }

    return true;
  });

  const activeCount = tasks.filter((t) => t.status === "PENDING" || t.status === "IN_PROGRESS").length;
  const urgentCount = tasks.filter(
    (t) => (t.status === "PENDING" || t.status === "IN_PROGRESS") && t.priority === "URGENT",
  ).length;
  const completedCount = tasks.filter((t) => t.status === "COMPLETED").length;

  return (
    <div className="flex flex-col gap-4">
      {/* ۱. نوار ابزار و فیلترهای جامع */}
      <div className="flex flex-col gap-3 rounded-xl border border-border bg-card p-3 sm:p-4 shadow-2xs">
        <div className="flex flex-wrap items-center justify-between gap-2.5">
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative min-w-[200px] flex-1 sm:w-64">
              <Search className="size-3.5 absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground/60" />
              <Input
                placeholder="جستجو در کد، یادداشت، کارگر یا شماره سند..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-8 pe-8 text-xs bg-background"
              />
            </div>

            {/* فیلتر نوع کار */}
            <select
              value={kindFilter}
              onChange={(e) => setKindFilter(e.target.value)}
              className="h-8 rounded-md border border-input bg-background px-2 text-xs font-semibold"
            >
              <option value="ALL">همه نوع عملیات</option>
              <option value="PICK">برداشت از قفسه (PICK)</option>
              <option value="PUTAWAY">چیدن در قفسه (PUTAWAY)</option>
            </select>

            {/* فیلتر اولویت */}
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="h-8 rounded-md border border-input bg-background px-2 text-xs font-semibold"
            >
              <option value="ALL">همه اولویت‌ها</option>
              <option value="URGENT">فقط فوری (URGENT)</option>
              <option value="NORMAL">عادی (NORMAL)</option>
            </select>

            {/* فیلتر انبار */}
            <select
              value={warehouseFilter}
              onChange={(e) => setWarehouseFilter(e.target.value)}
              className="h-8 rounded-md border border-input bg-background px-2 text-xs font-semibold"
            >
              <option value="ALL">همه انبارها</option>
              {warehouses.map((wh) => (
                <option key={wh.id} value={wh.id}>
                  {wh.name}
                </option>
              ))}
            </select>

            {/* فیلتر کارگر */}
            <select
              value={workerFilter}
              onChange={(e) => setWorkerFilter(e.target.value)}
              className="h-8 rounded-md border border-input bg-background px-2 text-xs font-semibold"
            >
              <option value="ALL">همه کارگران</option>
              <option value="UNASSIGNED">بدون کارگر (استخر باز)</option>
              {workers.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.fullName}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetch()}
              className="h-8 text-xs gap-1.5"
            >
              <RefreshCw className={cn("size-3.5", isLoading && "animate-spin")} />
              بروزرسانی
            </Button>
            <Button
              size="sm"
              onClick={() => setIsCreateOpen(true)}
              className="h-8 text-xs gap-1.5 bg-primary text-primary-foreground shadow-xs"
            >
              <Plus className="size-3.5" />
              تعریف وظیفه جدید
            </Button>
          </div>
        </div>

        {/* فیلتر تب‌های وضعیت */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-border/60">
          <div className="flex items-center gap-1 overflow-x-auto text-xs">
            <button
              onClick={() => setStatusFilter("ALL")}
              className={cn(
                "rounded-md px-2.5 py-1 text-xs font-bold transition-all",
                statusFilter === "ALL"
                  ? "bg-primary text-primary-foreground shadow-2xs"
                  : "text-muted-foreground hover:bg-muted/60 hover:text-foreground",
              )}
            >
              همه ({toFa(tasks.length)})
            </button>
            <button
              onClick={() => setStatusFilter("PENDING")}
              className={cn(
                "rounded-md px-2.5 py-1 text-xs font-bold transition-all",
                statusFilter === "PENDING"
                  ? "bg-amber-500/20 text-amber-800 dark:text-amber-200 ring-1 ring-amber-500/40"
                  : "text-muted-foreground hover:bg-muted/60 hover:text-foreground",
              )}
            >
              در انتظار ({toFa(tasks.filter((t) => t.status === "PENDING").length)})
            </button>
            <button
              onClick={() => setStatusFilter("IN_PROGRESS")}
              className={cn(
                "rounded-md px-2.5 py-1 text-xs font-bold transition-all",
                statusFilter === "IN_PROGRESS"
                  ? "bg-blue-500/20 text-blue-800 dark:text-blue-200 ring-1 ring-blue-500/40"
                  : "text-muted-foreground hover:bg-muted/60 hover:text-foreground",
              )}
            >
              در جریان ({toFa(tasks.filter((t) => t.status === "IN_PROGRESS").length)})
            </button>
            <button
              onClick={() => setStatusFilter("COMPLETED")}
              className={cn(
                "rounded-md px-2.5 py-1 text-xs font-bold transition-all",
                statusFilter === "COMPLETED"
                  ? "bg-emerald-500/20 text-emerald-800 dark:text-emerald-200 ring-1 ring-emerald-500/40"
                  : "text-muted-foreground hover:bg-muted/60 hover:text-foreground",
              )}
            >
              تکمیل‌شده ({toFa(completedCount)})
            </button>
            <button
              onClick={() => setStatusFilter("CANCELLED")}
              className={cn(
                "rounded-md px-2.5 py-1 text-xs font-bold transition-all",
                statusFilter === "CANCELLED"
                  ? "bg-rose-500/20 text-rose-800 dark:text-rose-200 ring-1 ring-rose-500/40"
                  : "text-muted-foreground hover:bg-muted/60 hover:text-foreground",
              )}
            >
              لغوشده ({toFa(tasks.filter((t) => t.status === "CANCELLED").length)})
            </button>
          </div>

          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            {urgentCount > 0 && (
              <Badge variant="destructive" className="gap-1 text-[11px] font-mono animate-pulse">
                <Flame className="size-3" />
                {toFa(urgentCount)} وظیفه فوری
              </Badge>
            )}
            <span>نمایش {toFa(filteredTasks.length)} از {toFa(tasks.length)} وظیفه</span>
          </div>
        </div>
      </div>

      {/* ۲. شبکه کارت‌های وظیفه کارگاهی */}
      {filteredTasks.length === 0 ? (
        <Card className="flex flex-col items-center justify-center p-12 text-center border-dashed">
          <PackageCheck className="size-12 text-muted-foreground/40 mb-3" />
          <div className="text-sm font-bold text-foreground">هیچ وظیفه‌ای در این فیلتر یافت نشد</div>
          <p className="text-xs text-muted-foreground mt-1 max-w-sm">
            تمام وظایف متناسب با فیلترهای انتخابی انجام شده یا هنوز کار جدیدی ثبت نشده است.
          </p>
          <Button
            size="sm"
            onClick={() => setIsCreateOpen(true)}
            className="mt-4 gap-1.5 text-xs"
          >
            <Plus className="size-3.5" />
            ثبت اولین وظیفه
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3.5">
          {filteredTasks.map((task) => {
            const isUrgent = task.priority === "URGENT";
            const isPick = (task.kind || "PICK") === "PICK";
            const progressPct =
              task.totalItems > 0 ? Math.round((task.doneItems / task.totalItems) * 100) : 0;
            const refDoc = task.invoice?.number
              ? `فاکتور فروش #${toFa(task.invoice.number)}`
              : task.quotation?.number
                ? `پیش‌فاکتور #${toFa(task.quotation.number)}`
                : task.purchase?.number
                  ? `فاکتور خرید #${toFa(task.purchase.number)}`
                  : null;

            return (
              <Card
                key={task.id}
                className={cn(
                  "p-3.5 flex flex-col justify-between gap-3 border transition-all duration-200 hover:shadow-md",
                  isUrgent && task.status !== "COMPLETED" && task.status !== "CANCELLED"
                    ? "border-rose-500/50 bg-rose-500/5 dark:bg-rose-950/10"
                    : "bg-card hover:border-primary/40",
                )}
              >
                {/* سربرگ کارت: نوع، اولویت و زمان */}
                <div className="flex items-center justify-between gap-2 border-b border-border/50 pb-2">
                  <div className="flex items-center gap-1.5">
                    {/* بج نوع کار */}
                    <span
                      className={cn(
                        "inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold border",
                        isPick
                          ? "bg-amber-500/10 text-amber-700 border-amber-500/30 dark:text-amber-300"
                          : "bg-blue-500/10 text-blue-700 border-blue-500/30 dark:text-blue-300",
                      )}
                    >
                      {isPick ? <ArrowUpRight className="size-3" /> : <ArrowDownLeft className="size-3" />}
                      {isPick ? "برداشت از قفسه (PICK)" : "چیدن در قفسه (PUTAWAY)"}
                    </span>

                    {/* بج اولویت */}
                    {isUrgent && (
                      <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md text-[10px] font-bold bg-rose-500 text-white animate-pulse">
                        <Flame className="size-2.5" />
                        فوری
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-1 text-[11px] text-muted-foreground font-mono">
                    <Clock className="size-3" />
                    {task.ageHours !== undefined
                      ? task.ageHours === 0
                        ? "همین حالا"
                        : `${toFa(task.ageHours)} ساعت پیش`
                      : formatDateTime(task.createdAt)}
                  </div>
                </div>

                {/* بدنه: سند مرجع، یادداشت و انبار */}
                <div className="flex flex-col gap-1.5 text-xs">
                  {refDoc && (
                    <div className="font-bold text-foreground flex items-center gap-1 text-[11px]">
                      <span className="text-primary">{refDoc}</span>
                    </div>
                  )}

                  {task.note && (
                    <p className="text-[11px] text-muted-foreground line-clamp-2 bg-muted/40 p-1.5 rounded-md border border-border/40">
                      {task.note}
                    </p>
                  )}

                  {/* کارگر تخصیص‌یافته */}
                  <div className="flex items-center justify-between pt-1">
                    <div className="flex items-center gap-1.5 text-[11px]">
                      <HardHat className="size-3.5 text-muted-foreground" />
                      <span className="text-muted-foreground">کارگر:</span>
                      {task.assignedTo?.fullName ? (
                        <strong className="text-foreground">{task.assignedTo.fullName}</strong>
                      ) : task.assignees && task.assignees.length > 0 ? (
                        <strong className="text-foreground">
                          {task.assignees.map((a) => a.fullName).join("، ")}
                        </strong>
                      ) : (
                        <span className="text-amber-600 dark:text-amber-400 font-semibold">
                          استخر عمومی (بدون تخصیص)
                        </span>
                      )}
                    </div>

                    {/* وضعیت تسک */}
                    <Badge
                      variant={
                        task.status === "COMPLETED"
                          ? "default"
                          : task.status === "IN_PROGRESS"
                            ? "secondary"
                            : task.status === "CANCELLED"
                              ? "destructive"
                              : "outline"
                      }
                      className="text-[10px] h-4.5"
                    >
                      {task.status === "COMPLETED"
                        ? "تکمیل شد"
                        : task.status === "IN_PROGRESS"
                          ? "در حال انجام"
                          : task.status === "CANCELLED"
                            ? "لغو شده"
                            : "در انتظار"}
                    </Badge>
                  </div>
                </div>

                {/* نوار پیشرفت */}
                <div className="flex flex-col gap-1 bg-muted/30 p-2 rounded-lg border border-border/40">
                  <div className="flex items-center justify-between text-[11px] font-mono">
                    <span className="text-muted-foreground text-[10px]">پیشرفت اقلام:</span>
                    <strong>
                      {toFa(task.doneItems)} از {toFa(task.totalItems)} قلم ({toFa(progressPct)}٪)
                    </strong>
                  </div>
                  <div className="w-full bg-muted rounded-full h-1.5 overflow-hidden">
                    <div
                      className={cn(
                        "h-1.5 rounded-full transition-all duration-300",
                        progressPct === 100
                          ? "bg-emerald-600"
                          : isUrgent
                            ? "bg-rose-600"
                            : "bg-primary",
                      )}
                      style={{ width: `${progressPct}%` }}
                    />
                  </div>
                </div>

                {/* پاورقی: دکمه‌های عملیاتی */}
                <div className="flex items-center justify-between pt-1 border-t border-border/50 gap-1">
                  <div className="flex items-center gap-1">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setDetailTaskId(task.id)}
                      className="h-7 text-[11px] px-2.5 gap-1"
                    >
                      <Layers className="size-3" />
                      اقلام و چک‌لیست
                    </Button>

                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setPrintTask(task)}
                      className="size-7 text-muted-foreground hover:text-foreground"
                      title="چاپ دستور کار انبار"
                    >
                      <Printer className="size-3.5" />
                    </Button>

                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        setReassignTaskId(task.id);
                        setSelectedWorkerId(task.assignedToId || "");
                      }}
                      className="size-7 text-muted-foreground hover:text-foreground"
                      title="تغییر کارگر تخصیص‌یافته"
                    >
                      <UserPlus className="size-3.5" />
                    </Button>

                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() =>
                        priorityMutation.mutate({
                          id: task.id,
                          priority: isUrgent ? "NORMAL" : "URGENT",
                        })
                      }
                      className={cn(
                        "size-7",
                        isUrgent
                          ? "text-rose-600 hover:text-rose-700"
                          : "text-muted-foreground hover:text-rose-600",
                      )}
                      title={isUrgent ? "تغییر به اولویت عادی" : "تغییر به اولویت فوری (URGENT)"}
                    >
                      <Flame className="size-3.5" />
                    </Button>
                  </div>

                  <div className="flex items-center gap-1">
                    {task.status !== "COMPLETED" && task.status !== "CANCELLED" && (
                      <>
                        <Button
                          size="sm"
                          onClick={() => completeMutation.mutate(task.id)}
                          disabled={completeMutation.isPending}
                          className="h-7 text-[10px] px-2 bg-emerald-600 hover:bg-emerald-700 text-white gap-1"
                          title="تکمیل تمام اقلام این وظیفه"
                        >
                          <CheckCircle2 className="size-3" />
                          تکمیل
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setCancelTaskId(task.id)}
                          className="size-7 text-muted-foreground hover:text-rose-600"
                          title="لغو وظیفه"
                        >
                          <X className="size-3.5" />
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* ۳. مودال تعریف وظیفه کاری جدید */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <PackageCheck className="size-5 text-primary" />
              تعریف وظیفه جدید برای کارگران انبار (Work Task)
            </DialogTitle>
            <DialogDescription>
              ثبت وظیفه برداشت از قفسه (PICK) یا چیدن کالای ورودی (PUTAWAY) با اقلام مشخص
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-3.5 py-2 text-xs">
            {/* نوع وظیفه و اولویت */}
            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="text-[11px] font-bold text-foreground">نوع وظیفه کاری</label>
                <div className="grid grid-cols-2 gap-2 mt-1">
                  <button
                    type="button"
                    onClick={() => setNewKind("PICK")}
                    className={cn(
                      "flex items-center justify-center gap-1.5 p-2 rounded-lg border font-bold text-xs transition-all",
                      newKind === "PICK"
                        ? "border-amber-600 bg-amber-500/10 text-amber-900 dark:text-amber-200 ring-1 ring-amber-600"
                        : "border-border hover:bg-muted/50",
                    )}
                  >
                    <ArrowUpRight className="size-3.5" />
                    برداشت از قفسه (PICK)
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewKind("PUTAWAY")}
                    className={cn(
                      "flex items-center justify-center gap-1.5 p-2 rounded-lg border font-bold text-xs transition-all",
                      newKind === "PUTAWAY"
                        ? "border-blue-600 bg-blue-500/10 text-blue-900 dark:text-blue-200 ring-1 ring-blue-600"
                        : "border-border hover:bg-muted/50",
                    )}
                  >
                    <ArrowDownLeft className="size-3.5" />
                    چیدن در قفسه (PUTAWAY)
                  </button>
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-foreground">درجه اولویت</label>
                <div className="grid grid-cols-2 gap-2 mt-1">
                  <button
                    type="button"
                    onClick={() => setNewPriority("NORMAL")}
                    className={cn(
                      "flex items-center justify-center gap-1.5 p-2 rounded-lg border font-bold text-xs transition-all",
                      newPriority === "NORMAL"
                        ? "border-primary bg-primary/10 text-primary ring-1 ring-primary"
                        : "border-border hover:bg-muted/50",
                    )}
                  >
                    <Clock className="size-3.5" />
                    عادی (NORMAL)
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewPriority("URGENT")}
                    className={cn(
                      "flex items-center justify-center gap-1.5 p-2 rounded-lg border font-bold text-xs transition-all",
                      newPriority === "URGENT"
                        ? "border-rose-600 bg-rose-500/10 text-rose-700 dark:text-rose-200 ring-1 ring-rose-600"
                        : "border-border hover:bg-muted/50",
                    )}
                  >
                    <Flame className="size-3.5 text-rose-600" />
                    فوری (مشتری حاضر)
                  </button>
                </div>
              </div>
            </div>

            {/* انبار و تخصیص کارگر */}
            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="text-[11px] font-semibold text-muted-foreground">انبار مبدأ/مقصد *</label>
                <select
                  value={newWarehouseId}
                  onChange={(e) => setNewWarehouseId(e.target.value)}
                  className="mt-1 h-8 w-full rounded-md border border-input bg-background px-2 text-xs font-semibold"
                >
                  {warehouses.map((wh) => (
                    <option key={wh.id} value={wh.id}>
                      {wh.name} ({wh.code})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-muted-foreground">تخصیص به کارگر (اختیاری)</label>
                <select
                  value={newAssigneeId}
                  onChange={(e) => setNewAssigneeId(e.target.value)}
                  className="mt-1 h-8 w-full rounded-md border border-input bg-background px-2 text-xs font-semibold"
                >
                  <option value="">استخر عمومی (قابل انجام توسط هر کارگری)</option>
                  {workers.map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.fullName} ({w.username})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* یادداشت دستور کار */}
            <div>
              <label className="text-[11px] font-semibold text-muted-foreground">دستور کار و توضیحات برای کارگر</label>
              <Textarea
                rows={2}
                placeholder="مثلاً اقلام جهت تحویل به پیک موتوری ساعت ۱۲، با دقت بررسی شود..."
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                className="mt-1 text-xs resize-none"
              />
            </div>

            {/* بخش اقلام کالا */}
            <div className="pt-2 border-t border-border flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-foreground flex items-center gap-1.5">
                  <Boxes className="size-3.5 text-primary" />
                  اقلام کالایی این وظیفه ({toFa(newLines.length)} قلم)
                </span>
                <span className="text-[10px] text-muted-foreground">حداقل یک کالا باید انتخاب شود</span>
              </div>

              {/* ورودی افزودن سریع کالا */}
              <div className="p-2.5 rounded-lg border bg-muted/30 flex flex-col gap-2">
                <div className="text-[11px] font-semibold text-muted-foreground">انتخاب کالا جهت افزودن به لیست:</div>
                <ProductSearchSelect
                  onChange={(p) => {
                    if (p) {
                      setNewLines((prev) => [
                        ...prev,
                        {
                          productId: p.id,
                          productName: p.name,
                          productSku: p.sku || undefined,
                          quantity: 1,
                        },
                      ]);
                    }
                  }}
                  placeholder="جستجوی نام یا بارکد کالا برای افزودن..."
                />
              </div>

              {/* جدول اقلام ثبت‌شده */}
              {newLines.length > 0 && (
                <div className="rounded-lg border overflow-hidden">
                  <table className="w-full text-right text-xs">
                    <thead className="bg-muted/60 text-muted-foreground font-semibold border-b">
                      <tr>
                        <th className="p-2">نام کالا</th>
                        <th className="p-2">قفسه / آدرس</th>
                        <th className="p-2 text-center w-24">تعداد</th>
                        <th className="p-2 text-center w-12">حذف</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y font-medium">
                      {newLines.map((line, idx) => (
                        <tr key={idx} className="hover:bg-muted/30">
                          <td className="p-2 font-bold text-foreground">
                            {line.productName}
                            {line.productSku && (
                              <span className="text-[10px] text-muted-foreground font-mono block">
                                کد: {line.productSku}
                              </span>
                            )}
                          </td>
                          <td className="p-2">
                            <select
                              value={line.locationId || ""}
                              onChange={(e) => {
                                const val = e.target.value;
                                setNewLines((prev) =>
                                  prev.map((l, i) => (i === idx ? { ...l, locationId: val || undefined } : l)),
                                );
                              }}
                              className="h-7 w-full rounded border border-input bg-background px-1.5 text-[11px]"
                            >
                              <option value="">بدون قفسه مشخص</option>
                              {locations.map((loc) => (
                                <option key={loc.id} value={loc.id}>
                                  {loc.path || loc.name} ({loc.code})
                                </option>
                              ))}
                            </select>
                          </td>
                          <td className="p-2 text-center">
                            <Input
                              type="number"
                              min={1}
                              value={line.quantity}
                              onChange={(e) => {
                                const q = Number(e.target.value) || 1;
                                setNewLines((prev) =>
                                  prev.map((l, i) => (i === idx ? { ...l, quantity: q } : l)),
                                );
                              }}
                              className="h-7 w-20 text-center font-mono text-xs mx-auto"
                            />
                          </td>
                          <td className="p-2 text-center">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => setNewLines((prev) => prev.filter((_, i) => i !== idx))}
                              className="size-6 text-muted-foreground hover:text-rose-600"
                            >
                              <Trash2 className="size-3" />
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setIsCreateOpen(false)}>
              انصراف
            </Button>
            <Button
              size="sm"
              disabled={newLines.length === 0 || !newWarehouseId || createMutation.isPending}
              onClick={() =>
                createMutation.mutate({
                  warehouseId: newWarehouseId,
                  kind: newKind,
                  priority: newPriority,
                  assignedToId: newAssigneeId || null,
                  assignedToIds: newAssigneeId ? [newAssigneeId] : undefined,
                  note: newNote,
                  lines: newLines.map((l) => ({
                    productId: l.productId,
                    locationId: l.locationId,
                    quantity: l.quantity,
                  })),
                })
              }
              className="gap-1.5"
            >
              <CheckCircle2 className="size-3.5" />
              {createMutation.isPending ? "در حال ثبت..." : "ثبت و ارسال به کارگران"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ۴. مودال جزئیات و چک‌لیست اقلام تسک */}
      <Dialog open={!!detailTaskId} onOpenChange={() => setDetailTaskId(null)}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Layers className="size-5 text-primary" />
              چک‌لیست اقلام و پیشرفت وظیفه کارگاهی
            </DialogTitle>
            <DialogDescription>
              مشاهده اقلام، آدرس قفسه‌ها و ثبت تیک دستی توسط مدیر یا کارگر
            </DialogDescription>
          </DialogHeader>

          {isLoadingDetail ? (
            <div className="py-12 text-center text-muted-foreground text-xs">
              در حال بارگذاری جزئیات وظیفه...
            </div>
          ) : taskDetail ? (
            <div className="flex flex-col gap-3 py-2 text-xs">
              {/* سربرگ مشخصات */}
              <div className="p-3 rounded-lg border bg-muted/40 flex items-center justify-between">
                <div>
                  <div className="text-[11px] text-muted-foreground font-mono">
                    کد تسک: {taskDetail.id}
                  </div>
                  <div className="font-bold text-foreground mt-0.5">
                    {taskDetail.note || "دستور کار بدون یادداشت"}
                  </div>
                </div>

                <div className="text-left font-mono">
                  <Badge
                    variant={taskDetail.status === "COMPLETED" ? "default" : "secondary"}
                    className="text-xs"
                  >
                    {taskDetail.status === "COMPLETED" ? "تکمیل شده" : "در حال انجام"}
                  </Badge>
                  <div className="text-[11px] text-muted-foreground mt-1">
                    {toFa(taskDetail.doneItems)} / {toFa(taskDetail.totalItems)} قلم
                  </div>
                </div>
              </div>

              {/* جدول چک‌لیست */}
              <div className="rounded-lg border overflow-hidden">
                <table className="w-full text-right text-xs">
                  <thead className="bg-muted/70 text-muted-foreground font-semibold border-b">
                    <tr>
                      <th className="p-2.5">نام کالا و بارکد</th>
                      <th className="p-2.5">آدرس قفسه</th>
                      <th className="p-2.5 text-center">تعداد</th>
                      <th className="p-2.5 text-center">وضعیت تیک</th>
                      <th className="p-2.5 text-center">عملیات</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y font-medium">
                    {taskDetail.items?.map((item) => {
                      const isDone = item.status === "DONE";
                      return (
                        <tr
                          key={item.id}
                          className={cn("transition-colors", isDone ? "bg-emerald-500/5" : "hover:bg-muted/30")}
                        >
                          <td className="p-2.5 font-bold text-foreground">
                            {item.product?.name || "کالای نامشخص"}
                            <div className="text-[10px] text-muted-foreground font-mono font-normal mt-0.5">
                              کد: {item.product?.sku || "—"} | بارکد: {item.product?.internalBarcode || "—"}
                            </div>
                          </td>
                          <td className="p-2.5">
                            {item.location ? (
                              <div className="flex items-center gap-1 font-mono text-[11px] text-foreground">
                                <MapPin className="size-3 text-muted-foreground" />
                                {item.location.code} ({item.location.name})
                              </div>
                            ) : (
                              <span className="text-muted-foreground text-[10px]">بدون قفسه مشخص</span>
                            )}
                          </td>
                          <td className="p-2.5 text-center font-mono font-bold text-sm">
                            {toFa(item.quantity)} {item.product?.unit || "عدد"}
                          </td>
                          <td className="p-2.5 text-center">
                            {isDone ? (
                              <div className="flex flex-col items-center">
                                <span className="inline-flex items-center gap-1 text-emerald-700 dark:text-emerald-300 font-bold text-[10px]">
                                  <Check className="size-3" />
                                  تیک خورد
                                </span>
                                {item.doneBy && (
                                  <span className="text-[9px] text-muted-foreground">
                                    توسط {item.doneBy.fullName}
                                  </span>
                                )}
                              </div>
                            ) : (
                              <span className="text-amber-600 dark:text-amber-400 font-bold text-[10px]">
                                در انتظار
                              </span>
                            )}
                          </td>
                          <td className="p-2.5 text-center">
                            {!isDone && (
                              <Button
                                size="sm"
                                onClick={() =>
                                  tickItemMutation.mutate({
                                    taskId: taskDetail.id,
                                    itemId: item.id,
                                  })
                                }
                                disabled={tickItemMutation.isPending}
                                className="h-6 text-[10px] px-2 bg-emerald-600 hover:bg-emerald-700 text-white gap-1"
                              >
                                <Check className="size-2.5" />
                                ثبت تیک
                              </Button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          ) : null}

          <DialogFooter className="gap-2">
            <Button variant="outline" size="sm" onClick={() => setDetailTaskId(null)}>
              بستن
            </Button>
            {taskDetail && taskDetail.status !== "COMPLETED" && (
              <Button
                size="sm"
                onClick={() => {
                  completeMutation.mutate(taskDetail.id);
                  setDetailTaskId(null);
                }}
                className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5"
              >
                <CheckCircle2 className="size-3.5" />
                تکمیل کل وظیفه
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ۵. مودال تغییر تخصیص کارگر */}
      <Dialog open={!!reassignTaskId} onOpenChange={() => setReassignTaskId(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserPlus className="size-5 text-primary" />
              تخصیص مجدد کارگر به وظیفه
            </DialogTitle>
            <DialogDescription>
              انتخاب کارگر جدید یا بازگرداندن وظیفه به استخر عمومی کارگران
            </DialogDescription>
          </DialogHeader>

          <div className="py-3 text-xs">
            <label className="text-[11px] font-semibold text-muted-foreground">انتخاب کارگر مسئول:</label>
            <select
              value={selectedWorkerId}
              onChange={(e) => setSelectedWorkerId(e.target.value)}
              className="mt-1.5 h-9 w-full rounded-md border border-input bg-background px-2 text-xs font-semibold"
            >
              <option value="">استخر عمومی (قابل انجام توسط همه کارگران)</option>
              {workers.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.fullName} ({w.username})
                </option>
              ))}
            </select>
          </div>

          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setReassignTaskId(null)}>
              انصراف
            </Button>
            <Button
              size="sm"
              disabled={reassignMutation.isPending}
              onClick={() => {
                if (reassignTaskId) {
                  reassignMutation.mutate({
                    id: reassignTaskId,
                    workerIds: selectedWorkerId ? [selectedWorkerId] : [],
                  });
                }
              }}
              className="gap-1.5"
            >
              <Check className="size-3.5" />
              ذخیره تخصیص
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ۶. مودال لغو وظیفه */}
      <Dialog open={!!cancelTaskId} onOpenChange={() => setCancelTaskId(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-rose-600">
              <XCircle className="size-5" />
              لغو وظیفه کاری
            </DialogTitle>
            <DialogDescription>
              دلیل لغو این وظیفه را جهت ثبت در سوابق سیستم کاردو وارد کنید.
            </DialogDescription>
          </DialogHeader>

          <div className="py-2 text-xs">
            <label className="text-[11px] font-semibold text-muted-foreground">علت لغو کار:</label>
            <Textarea
              rows={3}
              placeholder="مثلاً انصراف مشتری، تغییر فاکتور، عدم تطابق کالا..."
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              className="mt-1 text-xs resize-none"
            />
          </div>

          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setCancelTaskId(null)}>
              بازگشت
            </Button>
            <Button
              variant="destructive"
              size="sm"
              disabled={cancelMutation.isPending}
              onClick={() => {
                if (cancelTaskId) {
                  cancelMutation.mutate({ id: cancelTaskId, reason: cancelReason });
                }
              }}
              className="gap-1.5"
            >
              <X className="size-3.5" />
              تأیید لغو وظیفه
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ۷. پیش‌نمایش چاپ برگه کار و جمع‌آوری اقلام انبار */}
      <Dialog open={!!printTask} onOpenChange={() => setPrintTask(null)}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Printer className="size-5 text-primary" />
              برگه کار انبارداری (Pick & Pack Sheet)
            </DialogTitle>
            <DialogDescription>
              نسخه آماده چاپ جهت تحویل فیزیکی به انباردار یا کارگر شیفت
            </DialogDescription>
          </DialogHeader>

          {printTask && (
            <div className="p-4 border rounded-xl bg-card flex flex-col gap-3 font-sans text-xs">
              <div className="flex items-center justify-between border-b pb-2">
                <span className="font-bold text-sm text-primary">کاردو ERP — دستور کار انبارداری</span>
                <span className="font-mono text-muted-foreground">{toFa(new Date().toLocaleDateString("fa-IR"))}</span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <div>
                  <span className="text-muted-foreground">نوع عملیات: </span>
                  <strong>{printTask.kind === "PUTAWAY" ? "چیدن در قفسه (PUTAWAY)" : "برداشت از قفسه (PICK)"}</strong>
                </div>
                <div>
                  <span className="text-muted-foreground">اولویت: </span>
                  <strong>{printTask.priority === "URGENT" ? "فوری (URGENT)" : "عادی"}</strong>
                </div>
                <div>
                  <span className="text-muted-foreground">کارگر مسئول: </span>
                  <strong>{printTask.assignedTo?.fullName || "استخر عمومی"}</strong>
                </div>
                <div>
                  <span className="text-muted-foreground">تعداد کل اقلام: </span>
                  <strong className="font-mono">{toFa(printTask.totalItems)} قلم</strong>
                </div>
              </div>

              {printTask.note && (
                <div className="bg-muted/40 p-2 rounded border text-[11px]">
                  <strong>یادداشت: </strong>
                  {printTask.note}
                </div>
              )}

              <div className="border-t pt-3 text-center text-muted-foreground text-[10px]">
                شناسه پیگیری سیستمی: <span className="font-mono">{printTask.id}</span>
              </div>
            </div>
          )}

          <DialogFooter className="gap-2">
            <Button variant="outline" size="sm" onClick={() => setPrintTask(null)}>
              بستن
            </Button>
            <Button size="sm" onClick={() => window.print()} className="gap-1.5">
              <Printer className="size-3.5" />
              ارسال به چاپگر
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
