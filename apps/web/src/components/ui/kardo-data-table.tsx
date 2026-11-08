"use client";

import * as React from "react";
import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
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
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  ArrowUpDown,
  ChevronDown,
  Download,
  Filter,
  Search,
  SlidersHorizontal,
  X,
} from "lucide-react";
import { DataTablePagination } from "@/components/data-table-pagination";
import { toFa } from "@/lib/format";
import { cn } from "@/lib/utils";

export interface KardoDataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  searchPlaceholder?: string;
  searchColumn?: string;
  exportFilename?: string;
  pageSize?: number;
  isLoading?: boolean;
  emptyMessage?: string;
  extraActions?: React.ReactNode;
}

export function KardoDataTable<TData, TValue>({
  columns,
  data,
  searchPlaceholder = "جستجو در فهرست...",
  searchColumn,
  exportFilename = "export",
  pageSize = 15,
  isLoading = false,
  emptyMessage = "هیچ رکوردی برای نمایش یافت نشد.",
  extraActions,
}: KardoDataTableProps<TData, TValue>) {
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = React.useState({});
  const [globalFilter, setGlobalFilter] = React.useState("");

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
      globalFilter: searchColumn ? undefined : globalFilter,
    },
    initialState: {
      pagination: {
        pageSize,
      },
    },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  });

  const handleExportCSV = React.useCallback(() => {
    if (data.length === 0) return;
    const visibleCols = table.getVisibleLeafColumns().filter((c) => c.id !== "actions" && c.id !== "select");
    const headers = visibleCols.map((c) => {
      const header = c.columnDef.header;
      return typeof header === "string" ? header : c.id;
    });

    const rows = table.getFilteredRowModel().rows.map((row) => {
      return visibleCols.map((col) => {
        const val = row.getValue(col.id);
        if (val === null || val === undefined) return '""';
        return `"${String(val).replace(/"/g, '""')}"`;
      });
    });

    // UTF-8 BOM جهت باز شدن تمیز در اکسل بدون به‌هم‌ریختگی فونت فارسی
    const csvContent = "\uFEFF" + [headers.join(","), ...rows.map((r) => r.join(","))].join("\r\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `${exportFilename}_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, [data, exportFilename, table]);

  const totalRows = table.getFilteredRowModel().rows.length;
  const currentPage = table.getState().pagination.pageIndex + 1;
  const totalPages = table.getPageCount();

  return (
    <div className="w-full space-y-2.5 font-sans" dir="rtl">
      {/* نوار ابزار متراکم بالای جدول */}
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border/80 bg-surface px-3 py-2">
        <div className="flex flex-1 items-center gap-2 min-w-[240px] max-w-sm">
          <div className="relative w-full">
            <Search className="absolute right-2.5 top-2.5 size-4 text-muted-foreground" />
            <Input
              placeholder={searchPlaceholder}
              value={
                searchColumn
                  ? (table.getColumn(searchColumn)?.getFilterValue() as string) ?? ""
                  : globalFilter
              }
              onChange={(event) => {
                const val = event.target.value;
                if (searchColumn) {
                  table.getColumn(searchColumn)?.setFilterValue(val);
                } else {
                  setGlobalFilter(val);
                }
              }}
              className="h-8 pr-8 pl-8 text-xs bg-background/50 border-border/80 focus-visible:ring-1"
            />
            {(searchColumn ? table.getColumn(searchColumn)?.getFilterValue() : globalFilter) ? (
              <button
                type="button"
                onClick={() => {
                  if (searchColumn) table.getColumn(searchColumn)?.setFilterValue("");
                  else setGlobalFilter("");
                }}
                className="absolute left-2.5 top-2.5 text-muted-foreground hover:text-foreground"
              >
                <X className="size-3.5" />
              </button>
            ) : null}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {extraActions}

          {/* دکمه خروجی اکسل */}
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportCSV}
            className="h-8 gap-1.5 px-2.5 text-xs border-border/80 text-muted-foreground hover:text-foreground"
            title="دریافت فایل اکسل (CSV UTF-8)"
          >
            <Download className="size-3.5" />
            <span className="hidden sm:inline">اکسل</span>
          </Button>

          {/* انتخاب ستون‌های قابل مشاهده */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="h-8 gap-1.5 px-2.5 text-xs border-border/80 text-muted-foreground hover:text-foreground"
              >
                <SlidersHorizontal className="size-3.5" />
                <span className="hidden sm:inline">ستون‌ها</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44">
              {table
                .getAllColumns()
                .filter((column) => column.getCanHide())
                .map((column) => {
                  const headerTitle =
                    typeof column.columnDef.header === "string"
                      ? column.columnDef.header
                      : column.id;
                  return (
                    <DropdownMenuCheckboxItem
                      key={column.id}
                      className="text-xs"
                      checked={column.getIsVisible()}
                      onCheckedChange={(value) => column.toggleVisibility(!!value)}
                    >
                      {headerTitle}
                    </DropdownMenuCheckboxItem>
                  );
                })}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* شمارنده کل ردیف‌ها */}
          <div className="hidden sm:flex items-center text-xs text-muted-foreground border-r border-border/80 pr-2.5">
            <span>مجموع: </span>
            <span className="font-semibold text-foreground mr-1">{toFa(totalRows)}</span>
          </div>
        </div>
      </div>

      {/* جدول داده‌ها */}
      <div className="rounded-lg border border-border/80 bg-surface overflow-hidden shadow-xs">
        <Table className="border-collapse text-xs">
          <TableHeader className="bg-muted/50 border-b border-border/80">
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className="hover:bg-transparent">
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead
                      key={header.id}
                      className="h-9 px-3 text-right font-semibold text-muted-foreground border-e border-border/40 last:border-e-0"
                    >
                      {header.isPlaceholder
                        ? null
                        : flexRender(header.column.columnDef.header, header.getContext())}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, idx) => (
                <TableRow key={idx} className="h-10 animate-pulse">
                  {columns.map((_, cIdx) => (
                    <TableCell key={cIdx} className="px-3 py-2 border-e border-border/30 last:border-e-0">
                      <div className="h-4 w-3/4 bg-muted/60 rounded" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                  className="h-9 hover:bg-muted/30 transition-colors border-b border-border/40 last:border-b-0"
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell
                      key={cell.id}
                      className="px-3 py-1.5 border-e border-border/30 last:border-e-0"
                    >
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-32 text-center text-muted-foreground">
                  <div className="flex flex-col items-center justify-center gap-1.5">
                    <Filter className="size-6 text-muted-foreground/40" />
                    <p className="text-sm font-medium">{emptyMessage}</p>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* صفحه‌بندی هوشمند فارسی */}
      {totalPages > 1 && (
        <div className="flex flex-wrap items-center justify-between gap-2 px-1 pt-1">
          <div className="text-xs text-muted-foreground">
            صفحه <span className="font-semibold text-foreground">{toFa(currentPage)}</span> از{" "}
            <span className="font-semibold text-foreground">{toFa(totalPages)}</span>
          </div>
          <DataTablePagination
            page={currentPage}
            totalPages={totalPages}
            onChange={(newPage) => table.setPageIndex(newPage - 1)}
            className="mt-0"
          />
        </div>
      )}
    </div>
  );
}
