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
  const variant = cellOpts?.variant ?? "text";

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
      // Check if the value is a string or FileCellData[]
      const cellValue = cell.getValue();
      
      // If it's explicitly a string, render as ShortTextCell for text editing
      if (typeof cellValue === 'string') {
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
      
      // If it's a FileCellData[] array with at least one file, render as FileCell
      const isFileArray = Array.isArray(cellValue) && cellValue.length > 0;
      if (isFileArray) {
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
      
      // If empty (null, undefined, or empty array), render as ShortTextCell to allow text input
      // Files can still be added via page-level drag-and-drop
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
