"use client";

import type { Cell, Table } from "@tanstack/react-table";
import * as React from "react";

import {
  CheckboxCell,
  DateCell,
  FileCell,
  LongTextCell,
  MultiSelectCell,
  NumberCell,
  SelectCell,
  ShortTextCell,
  UrlCell,
} from "@/components/data-grid/data-grid-cell-variants";
import type { FileCellData } from "@/types/data-grid";

interface DataGridCellProps<TData> {
  cell: Cell<TData, unknown>;
  table: Table<TData>;
}

// Helper to check if a value is a FileCellData array
function isFileCellDataArray(value: unknown): value is FileCellData[] {
  if (!Array.isArray(value)) return false;
  if (value.length === 0) return false;
  // Check if the first item has the shape of FileCellData
  const first = value[0];
  return (
    typeof first === "object" &&
    first !== null &&
    "id" in first &&
    "name" in first &&
    "size" in first
  );
}

export function DataGridCell<TData>({ cell, table }: DataGridCellProps<TData>) {
  const meta = table.options.meta;
  const originalRowIndex = cell.row.index;

  const rows = table.getRowModel().rows;
  const displayRowIndex = rows.findIndex(
    (row) => row.original === cell.row.original,
  );
  const rowIndex = displayRowIndex >= 0 ? displayRowIndex : originalRowIndex;
  const columnId = cell.column.id;

  const isFocused =
    meta?.focusedCell?.rowIndex === rowIndex &&
    meta?.focusedCell?.columnId === columnId;
  const isEditing =
    meta?.editingCell?.rowIndex === rowIndex &&
    meta?.editingCell?.columnId === columnId;
  const isSelected = meta?.getIsCellSelected?.(rowIndex, columnId) ?? false;
  const readOnly = meta?.readOnly ?? false;

  const cellOpts = cell.column.columnDef.meta?.cell;
  const configuredVariant = cellOpts?.variant ?? "text";
  
  // Auto-detect variant based on cell value for "auto" or "file" variants
  // This allows mixed content (files and text) in the same column
  const cellValue = cell.getValue();
  let variant = configuredVariant;
  
  if (configuredVariant === "auto" || configuredVariant === "file") {
    // If the value is a FileCellData array, render as file
    // Otherwise, render as short-text (allowing text input)
    if (isFileCellDataArray(cellValue)) {
      variant = "file";
    } else if (configuredVariant === "auto") {
      variant = "short-text";
    }
  }

  switch (variant) {
    case "short-text":
      return (
        <ShortTextCell
          cell={cell}
          table={table}
          rowIndex={rowIndex}
          columnId={columnId}
          isEditing={isEditing}
          isFocused={isFocused}
          isSelected={isSelected}
          readOnly={readOnly}
        />
      );
    case "long-text":
      return (
        <LongTextCell
          cell={cell}
          table={table}
          rowIndex={rowIndex}
          columnId={columnId}
          isEditing={isEditing}
          isFocused={isFocused}
          isSelected={isSelected}
          readOnly={readOnly}
        />
      );
    case "number":
      return (
        <NumberCell
          cell={cell}
          table={table}
          rowIndex={rowIndex}
          columnId={columnId}
          isEditing={isEditing}
          isFocused={isFocused}
          isSelected={isSelected}
          readOnly={readOnly}
        />
      );
    case "url":
      return (
        <UrlCell
          cell={cell}
          table={table}
          rowIndex={rowIndex}
          columnId={columnId}
          isEditing={isEditing}
          isFocused={isFocused}
          isSelected={isSelected}
          readOnly={readOnly}
        />
      );
    case "checkbox":
      return (
        <CheckboxCell
          cell={cell}
          table={table}
          rowIndex={rowIndex}
          columnId={columnId}
          isFocused={isFocused}
          isSelected={isSelected}
          readOnly={readOnly}
        />
      );
    case "select":
      return (
        <SelectCell
          cell={cell}
          table={table}
          rowIndex={rowIndex}
          columnId={columnId}
          isEditing={isEditing}
          isFocused={isFocused}
          isSelected={isSelected}
          readOnly={readOnly}
        />
      );
    case "multi-select":
      return (
        <MultiSelectCell
          cell={cell}
          table={table}
          rowIndex={rowIndex}
          columnId={columnId}
          isEditing={isEditing}
          isFocused={isFocused}
          isSelected={isSelected}
          readOnly={readOnly}
        />
      );
    case "date":
      return (
        <DateCell
          cell={cell}
          table={table}
          rowIndex={rowIndex}
          columnId={columnId}
          isEditing={isEditing}
          isFocused={isFocused}
          isSelected={isSelected}
          readOnly={readOnly}
        />
      );
    case "file": {
      // Always render FileCell when variant is "file"
      // FileCell handles empty values and allows file uploads
      return (
        <FileCell
          cell={cell}
          table={table}
          rowIndex={rowIndex}
          columnId={columnId}
          isEditing={isEditing}
          isFocused={isFocused}
          isSelected={isSelected}
          readOnly={readOnly}
        />
      );
    }

    default:
      return (
        <ShortTextCell
          cell={cell}
          table={table}
          rowIndex={rowIndex}
          columnId={columnId}
          isEditing={isEditing}
          isFocused={isFocused}
          isSelected={isSelected}
          readOnly={readOnly}
        />
      );
  }
}
