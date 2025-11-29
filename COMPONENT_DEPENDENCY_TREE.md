# Component Dependency Tree

Visual representation of component dependencies for migration.

```
demo.tsx
│
├── DataGrid (components/data-grid/data-grid.tsx)
│   ├── useDataGrid (hooks/use-data-grid.tsx)
│   │   ├── @tanstack/react-table
│   │   ├── @tanstack/react-virtual
│   │   ├── lib/data-grid.ts
│   │   ├── lib/data-grid-constants.ts
│   │   └── types/data-grid.ts
│   │
│   ├── DataGridRow (components/data-grid/data-grid-row.tsx)
│   │   └── DataGridCell (components/data-grid/data-grid-cell.tsx)
│   │       ├── DataGridCellWrapper (components/data-grid/data-grid-cell-wrapper.tsx)
│   │       └── Cell Variants (components/data-grid/data-grid-cell-variants.tsx)
│   │           ├── UI Components (components/ui/*)
│   │           └── Icons (components/Icons.tsx)
│   │
│   ├── DataGridColumnHeader (components/data-grid/data-grid-column-header.tsx)
│   │   └── UI Components
│   │
│   ├── DataGridSearch (components/data-grid/data-grid-search.tsx)
│   │   └── UI Components
│   │
│   ├── DataGridContextMenu (components/data-grid/data-grid-context-menu.tsx)
│   │   └── UI Components
│   │
│   └── DataGridPasteDialog (components/data-grid/data-grid-paste-dialog.tsx)
│       └── UI Components
│
├── AddColumnMenu (components/AddColumnMenu.tsx)
│   ├── UI Components (Textarea, Button)
│   ├── Icons
│   ├── types.ts (ColumnType)
│   └── services/geminiService.ts (optional - for AI features)
│       └── @google/genai
│
├── Document Processing Services
│   ├── documentProcessingService.ts
│   │   ├── documentProcessor.ts
│   │   │   └── Backend Server (server/main.py)
│   │   │       ├── docling (Python)
│   │   │       ├── fastapi (Python)
│   │   │       └── uvicorn (Python)
│   │   └── types.ts (DocumentFile)
│   │
│   └── geminiService.ts
│       ├── @google/genai
│       └── types.ts (DocumentFile, Column, ExtractionResult)
│
├── Backend Server (server/main.py)
│   ├── Python packages (see requirements.txt)
│   │   ├── docling (document conversion)
│   │   ├── fastapi (API framework)
│   │   ├── uvicorn (ASGI server)
│   │   └── python-dotenv (env vars)
│   └── Environment: VITE_GEMINI_API_KEY
│
├── Tabs (components/ui/tabs.tsx)
│   └── @radix-ui/react-tabs
│
└── Icons (components/Icons.tsx)
    └── lucide-react
```

## Dependency Layers

### Layer 0: External Dependencies
**NPM packages:**
- `@tanstack/react-table`
- `@tanstack/react-virtual`
- `@radix-ui/*` (multiple packages)
- `lucide-react`
- `tailwind-merge`, `clsx`
- `sonner` (toasts)
- `date-fns`
- `react-day-picker`
- `@google/genai` (optional - for AI features)

**Python packages (for backend):**
- `docling` (document conversion)
- `fastapi` (API framework)
- `uvicorn` (ASGI server)
- `python-dotenv` (environment variables)
- See `server/requirements.txt` for full list

### Layer 1: Types & Constants
- `types/data-grid.ts`
- `types.ts`
- `lib/data-grid-constants.ts`

### Layer 2: Utilities
- `lib/utils.ts` (cn function)
- `lib/compose-refs.ts`
- `lib/data-grid.ts` (helper functions)

### Layer 3: UI Primitives
- `components/ui/*` (all shadcn/ui components)
- `components/Icons.tsx`

### Layer 4: Data Grid Core
- `hooks/use-data-grid.tsx`
- `components/data-grid/data-grid-cell-variants.tsx`
- `components/data-grid/data-grid-cell-wrapper.tsx`
- `components/data-grid/data-grid-cell.tsx`
- `components/data-grid/data-grid-row.tsx`
- `components/data-grid/data-grid-column-header.tsx`
- `components/data-grid/data-grid-search.tsx`
- `components/data-grid/data-grid-context-menu.tsx`
- `components/data-grid/data-grid-paste-dialog.tsx`
- `components/data-grid/data-grid.tsx`

### Layer 5: Document Processing Services
- `services/documentProcessor.ts` (backend communication)
- `services/documentProcessingService.ts` (main processing service)
- `services/geminiService.ts` (AI extraction/analysis - optional)
- `server/main.py` (Python backend - optional but recommended for PDF/DOCX)

### Layer 6: Feature Components
- `components/AddColumnMenu.tsx`

### Layer 7: Demo/Application
- `pages/demo.tsx`

## Copy Order Summary

1. **Layer 0:** Install NPM packages (and Python packages if using backend)
2. **Layer 1:** Copy types & constants
3. **Layer 2:** Copy utilities
4. **Layer 3:** Copy UI primitives
5. **Layer 4:** Copy data grid core (in sub-order)
6. **Layer 5:** Copy document processing services (and set up backend if needed)
7. **Layer 6:** Copy feature components
8. **Layer 7:** Copy demo component

