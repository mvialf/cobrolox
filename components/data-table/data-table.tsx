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
  FilterFn,
  TableMeta,
} from "@tanstack/react-table";

// Extender ColumnMeta para incluir clases CSS personalizadas
declare module "@tanstack/react-table" {
  // eslint-disable-next-line unused-imports/no-unused-vars
  interface ColumnMeta<TData, TValue> {
    headerClassName?: string;
    cellClassName?: string;
  }
}

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

import { DataTablePagination } from "./data-table-pagination";
import { DataTableToolbar } from "./data-table-toolbar";
import { TABLE_DEFAULT_PAGE_SIZE } from "@/lib/constants/table-config";

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  searchKey?: string;
  searchPlaceholder?: string;
  enableGlobalFilter?: boolean;
  globalFilterFn?: FilterFn<TData>;
  filterableColumns?: {
    id: string;
    title: string;
    options: { label: string; value: string }[];
    onFilterChange?: (values: string[]) => void;
  }[];
  onRowSelectionChange?: (selectedRows: TData[]) => void;
  enableRowSelection?: boolean;
  meta?: TableMeta<TData>;
  showCompleted?: boolean;
  onToggleCompleted?: (show: boolean) => void;
  initialColumnVisibility?: VisibilityState;
  // Server-side pagination support
  manualPagination?: boolean;
  pageCount?: number;
  pagination?: { pageIndex: number; pageSize: number };
  onPaginationChange?: (
    updater:
      | { pageIndex: number; pageSize: number }
      | ((old: { pageIndex: number; pageSize: number }) => {
          pageIndex: number;
          pageSize: number;
        })
  ) => void;
}

export function DataTable<TData, TValue>({
  columns,
  data,
  searchKey = "",
  searchPlaceholder = "Buscar...",
  enableGlobalFilter = false,
  globalFilterFn,
  filterableColumns = [],
  onRowSelectionChange,
  enableRowSelection = false,
  meta,
  showCompleted,
  onToggleCompleted,
  initialColumnVisibility = {},
  manualPagination = false,
  pageCount,
  pagination: externalPagination,
  onPaginationChange,
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    []
  );
  const [globalFilter, setGlobalFilter] = React.useState("");
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>(initialColumnVisibility);
  const [rowSelection, setRowSelection] = React.useState({});
  const [internalPagination, setInternalPagination] = React.useState({
    pageIndex: 0,
    pageSize: TABLE_DEFAULT_PAGE_SIZE,
  });

  // Use external pagination if provided, otherwise use internal
  const currentPagination = externalPagination ?? internalPagination;
  const handlePaginationChange = onPaginationChange ?? setInternalPagination;

  const table = useReactTable({
    data,
    columns,
    initialState: {
      pagination: {
        pageSize: TABLE_DEFAULT_PAGE_SIZE,
      },
    },
    state: {
      sorting,
      columnFilters,
      globalFilter,
      columnVisibility,
      rowSelection,
      pagination: currentPagination,
    },
    enableRowSelection,
    onRowSelectionChange: setRowSelection,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: setGlobalFilter,
    onColumnVisibilityChange: setColumnVisibility,
    onPaginationChange: handlePaginationChange,
    globalFilterFn,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    // Server-side pagination: delegate pagination to backend
    ...(manualPagination
      ? {
          manualPagination: true,
          pageCount: pageCount ?? -1,
        }
      : {
          getPaginationRowModel: getPaginationRowModel(),
        }),
    meta,
  });

  // Callback cuando cambia la selección de filas
  React.useEffect(() => {
    if (onRowSelectionChange) {
      const selectedRows = table
        .getSelectedRowModel()
        .rows.map((row) => row.original);
      onRowSelectionChange(selectedRows);
    }
  }, [rowSelection, onRowSelectionChange, table]);

  return (
    <div className="space-y-4">
      <DataTableToolbar
        table={table}
        searchKey={searchKey}
        searchPlaceholder={searchPlaceholder}
        enableGlobalFilter={enableGlobalFilter}
        filterableColumns={filterableColumns}
        showCompleted={showCompleted}
        onToggleCompleted={onToggleCompleted}
      />
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead
                      key={header.id}
                      className={cn(
                        header.column.columnDef.meta?.headerClassName
                      )}
                    >
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell
                      key={cell.id}
                      className={cn(cell.column.columnDef.meta?.cellClassName)}
                    >
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  No se encontraron resultados.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <DataTablePagination table={table} />
    </div>
  );
}
