# Demo.tsx Dependencies

This document lists all files required for `demo.tsx` to work.

---

## Core Files

| File | Purpose |
|------|---------|
| `pages/demo.tsx` | The main demo page |
| `types.ts` | Core type definitions (`ColumnType`, `ExtractionCell`) |
| `types/data-grid.ts` | Data grid types (`FileCellData`) |

---

## Components

### Data Grid (all required)

| File |
|------|
| `components/data-grid/data-grid.tsx` |
| `components/data-grid/data-grid-cell.tsx` |
| `components/data-grid/data-grid-cell-variants.tsx` |
| `components/data-grid/data-grid-cell-wrapper.tsx` |
| `components/data-grid/data-grid-column-header.tsx` |
| `components/data-grid/data-grid-context-menu.tsx` |
| `components/data-grid/data-grid-keyboard-shortcuts.tsx` |
| `components/data-grid/data-grid-paste-dialog.tsx` |
| `components/data-grid/data-grid-row.tsx` |
| `components/data-grid/data-grid-search.tsx` |

### UI Components (used by data-grid)

| File |
|------|
| `components/ui/badge.tsx` |
| `components/ui/button.tsx` |
| `components/ui/calendar.tsx` |
| `components/ui/checkbox.tsx` |
| `components/ui/command.tsx` |
| `components/ui/dialog.tsx` |
| `components/ui/dropdown-menu.tsx` |
| `components/ui/input.tsx` |
| `components/ui/popover.tsx` |
| `components/ui/select.tsx` |
| `components/ui/skeleton.tsx` |
| `components/ui/tabs.tsx` |
| `components/ui/textarea.tsx` |
| `components/ui/tooltip.tsx` |

### Other Components

| File |
|------|
| `components/AddColumnMenu.tsx` |
| `components/Icons.tsx` |

---

## Hooks

| File |
|------|
| `hooks/use-data-grid.tsx` |
| `hooks/use-badge-overflow.ts` |
| `hooks/use-callback-ref.ts` |
| `hooks/use-debounced-callback.ts` |

---

## Services

| File |
|------|
| `services/documentProcessingService.ts` |
| `services/geminiService.ts` |

---

## Lib/Utils

| File |
|------|
| `lib/data-grid-constants.ts` |
| `lib/data-grid.ts` |
| `lib/compose-refs.ts` |
| `lib/utils.ts` |

---

## NPM Packages

| Package | Purpose |
|---------|---------|
| `@faker-js/faker` | Generate random IDs |
| `@tanstack/react-table` | Table state management |
| `lucide-react` | Icons |
| `sonner` | Toast notifications |
| `@radix-ui/*` | UI primitives (popover, dialog, etc.) |
| `tailwindcss` | Styling |
| `clsx` | Class name utilities |
| `tailwind-merge` | Tailwind class merging |
| `date-fns` | Date formatting (calendar) |
