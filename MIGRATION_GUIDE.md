# Component Migration Guide

This guide helps you copy components from `demo.tsx` into another project, organized by dependency order.

## 📋 Overview

The `demo.tsx` file uses a complex data grid system with multiple layers of dependencies. Copy components in this order to ensure all dependencies are satisfied.

---

## 🎯 Migration Order

### **Phase 1: Foundation & Types** (Copy First)

#### 1.1 Type Definitions
- **`types/data-grid.ts`** - Core type definitions for the data grid
  - `CellPosition`, `SelectionState`, `FileCellData`, `SearchState`, etc.
  - Extends `@tanstack/react-table` types
  
- **`types.ts`** - Application-specific types
  - `ColumnType`, `DocumentFile`, `Column`, etc.

#### 1.2 Constants
- **`lib/data-grid-constants.ts`** - Column sizing constants
  - `COLUMN_SIZE.MIN`, `COLUMN_SIZE.DEFAULT`, `COLUMN_SIZE.MAX`

#### 1.3 Utilities
- **`lib/utils.ts`** - Utility functions (likely includes `cn()` for className merging)
- **`lib/compose-refs.ts`** - React ref composition utility
- **`lib/data-grid.ts`** - Data grid helper functions
  - `getCellKey()`, `parseCellKey()`, `getRowHeightValue()`, `getCommonPinningStyles()`

---

### **Phase 2: UI Components** (Copy Second)

#### 2.1 Base UI Components (shadcn/ui style)
Copy all files from `components/ui/`:
- `button.tsx`
- `textarea.tsx`
- `tabs.tsx`
- `dialog.tsx`
- `dropdown-menu.tsx`
- `popover.tsx`
- `select.tsx`
- `checkbox.tsx`
- `calendar.tsx`
- `command.tsx`
- `input.tsx`
- `separator.tsx`
- `skeleton.tsx`
- `tooltip.tsx`
- `badge.tsx`

**Dependencies:** Radix UI primitives, Tailwind CSS, `lib/utils.ts`

#### 2.2 Icons
- **`components/Icons.tsx`** - Icon exports from `lucide-react`
  - Re-export all icons used in the project

---

### **Phase 3: Data Grid Core** (Copy Third)

#### 3.1 Data Grid Cell Components
Copy all files from `components/data-grid/` in this order:

1. **`data-grid-cell-variants.tsx`** - Cell variant implementations
   - Different cell types: text, number, date, checkbox, file, etc.
   
2. **`data-grid-cell-wrapper.tsx`** - Wrapper component for cells
   
3. **`data-grid-cell.tsx`** - Main cell component
   - Uses cell variants based on column meta

4. **`data-grid-column-header.tsx`** - Column header component
   - Sorting, resizing, context menu

5. **`data-grid-row.tsx`** - Row component
   - Renders cells for a row

6. **`data-grid-search.tsx`** - Search functionality
   - Search overlay and navigation

7. **`data-grid-context-menu.tsx`** - Right-click context menu
   - Copy, paste, delete operations

8. **`data-grid-paste-dialog.tsx`** - Paste dialog
   - Handles paste operations that need row expansion

9. **`data-grid.tsx`** - Main grid component
   - Orchestrates all sub-components
   - **Dependencies:** All above components + `useDataGrid` hook

#### 3.2 Data Grid Hook
- **`hooks/use-data-grid.tsx`** - Core data grid logic hook
  - State management, navigation, selection, editing
  - **Dependencies:** `@tanstack/react-table`, `@tanstack/react-virtual`, `lib/data-grid.ts`
  - **Note:** This is a large file (~2400 lines) with complex state management

#### 3.3 Supporting Hooks
- **`hooks/use-badge-overflow.ts`** - Badge overflow handling
- **`hooks/use-callback-ref.ts`** - Callback ref utility
- **`hooks/use-debounced-callback.ts`** - Debounced callback utility

---

### **Phase 4: Document Processing Services** (Copy Fourth)

#### 4.1 Document Processing Services
- **`services/documentProcessor.ts`** - Backend communication for PDF/DOCX conversion
  - Sends files to backend server for conversion to markdown
  - **Dependencies:** Backend server (Python FastAPI)
  - **Environment:** `VITE_API_URL` (defaults to `http://localhost:8000`)

- **`services/documentProcessingService.ts`** - Main document processing service
  - Handles multiple file types (PDF, DOCX, TXT, MD, JSON)
  - Text files processed in browser, PDF/DOCX via backend
  - Comprehensive error handling and batch processing
  - **Dependencies:** `documentProcessor.ts`, `types.ts` (DocumentFile)
  - **Usage:** Main entry point for processing uploaded files

#### 4.2 AI Services
- **`services/geminiService.ts`** - AI service for extraction and analysis
  - `extractColumnData()` - Extracts data from documents using AI
  - `generatePromptHelper()` - Generates prompts for column extraction
  - `analyzeDataWithChat()` - Chat-based data analysis
  - **Dependencies:** `@google/genai`, `types.ts`
  - **Environment:** `VITE_GEMINI_API_KEY` required
  - **Note:** Includes retry logic with exponential backoff for rate limits

#### 4.3 Backend Server (Optional but Recommended)
- **`server/main.py`** - Python FastAPI backend for document conversion
  - `/convert` endpoint - Converts PDF/DOCX to markdown using Docling
  - `/analyze` endpoint - Alternative AI analysis endpoint
  - **Dependencies:** See `server/requirements.txt`
  - **Required packages:** `fastapi`, `docling`, `python-dotenv`, `uvicorn`
  - **Environment:** `VITE_GEMINI_API_KEY` (for `/analyze` endpoint)

- **`server/requirements.txt`** - Python dependencies
  - Full list of required Python packages
  - Main dependencies: `docling`, `fastapi`, `uvicorn`, `python-dotenv`

**Backend Setup:**
```bash
cd server
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
# Set VITE_GEMINI_API_KEY in .env or .env.local
uvicorn main:app --reload
```

---

### **Phase 5: Feature Components** (Copy Fifth)

#### 5.1 Add Column Menu
- **`components/AddColumnMenu.tsx`** - Column creation/editing dialog
  - **Dependencies:** 
    - UI components: `Textarea`, `Button`
    - Icons: `X`, `HelpCircle`, `ChevronDown`, `Check`, `Sparkles`, `Loader2`, etc.
    - Services: `services/geminiService.ts` (for AI prompt generation)
    - Types: `ColumnType` from `types.ts`

---

### **Phase 6: Demo Component** (Copy Last)

#### 6.1 Main Demo Component
- **`pages/demo.tsx`** - The main demo component
  - **Dependencies:** Everything above
  - Uses:
    - `DataGrid` component
    - `useDataGrid` hook
    - `AddColumnMenu` component
    - `Tabs` UI component
    - Icons
    - Types and constants
  - **Note:** Demo handles file drag-and-drop directly into grid cells
    - For full document processing workflow, see `App.tsx` which uses `documentProcessingService`

---

## 📦 Required NPM Packages

Install these packages in your target project:

```json
{
  "dependencies": {
    "@google/genai": "^1.30.0",
    "@radix-ui/react-checkbox": "^1.3.3",
    "@radix-ui/react-dialog": "^1.1.15",
    "@radix-ui/react-direction": "^1.1.1",
    "@radix-ui/react-dropdown-menu": "^2.1.16",
    "@radix-ui/react-popover": "^1.1.15",
    "@radix-ui/react-select": "^2.2.6",
    "@radix-ui/react-separator": "^1.1.8",
    "@radix-ui/react-slot": "^1.2.4",
    "@radix-ui/react-tooltip": "^1.2.8",
    "@tanstack/react-table": "^8.21.3",
    "@tanstack/react-virtual": "^3.13.12",
    "class-variance-authority": "^0.7.1",
    "clsx": "^2.1.1",
    "cmdk": "^1.1.1",
    "date-fns": "^4.1.0",
    "lucide-react": "^0.554.0",
    "react": "^19.2.0",
    "react-day-picker": "^9.11.2",
    "react-dom": "^19.2.0",
    "sonner": "^2.0.7",
    "tailwind-merge": "^3.4.0",
    "tailwindcss-animate": "^1.0.7"
  },
  "devDependencies": {
    "@faker-js/faker": "^10.1.0",
    "tailwindcss": "^4.1.17",
    "typescript": "~5.8.2"
  }
}
```

**Note:** `@google/genai` is required for AI features (extraction, prompt generation). If you don't need AI features, you can skip this package and the `geminiService.ts` file.

---

## 🔧 Configuration Requirements

### TypeScript Path Aliases
Ensure your `tsconfig.json` has path aliases configured:

```json
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

### Tailwind CSS
- Ensure Tailwind CSS is configured
- May need to configure content paths to include component directories
- Ensure `tailwindcss-animate` plugin is configured

### Build Tool
- Vite configuration may need path alias resolution
- Ensure proper handling of CSS imports

### Environment Variables
Create a `.env` or `.env.local` file with:

```env
# Backend API URL (defaults to http://localhost:8000)
VITE_API_URL=http://localhost:8000

# Google Gemini API Key (required for AI features)
VITE_GEMINI_API_KEY=your_api_key_here
```

**Note:** The backend server also needs `VITE_GEMINI_API_KEY` in its environment (or `.env` file) for the `/analyze` endpoint.

---

## 🚨 Common Issues & Solutions

### Issue: Import path errors
**Solution:** Update all `@/` imports to match your project's path alias structure

### Issue: Missing Radix UI styles
**Solution:** Ensure Radix UI components have proper CSS imports or Tailwind configuration

### Issue: Type errors with `@tanstack/react-table`
**Solution:** Ensure you're using compatible versions. The code uses v8.x

### Issue: Missing utility functions
**Solution:** Check `lib/utils.ts` - likely needs `cn()` function for className merging:
```typescript
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: any[]) {
  return twMerge(clsx(inputs));
}
```

---

## 📝 Step-by-Step Checklist

- [ ] **Phase 1:** Copy types, constants, and utilities
- [ ] **Phase 2:** Copy UI components and icons
- [ ] **Phase 3:** Copy data grid components (in order listed)
- [ ] **Phase 4:** Copy document processing services
  - [ ] Copy `documentProcessor.ts`
  - [ ] Copy `documentProcessingService.ts`
  - [ ] Copy `geminiService.ts` (if using AI features)
  - [ ] Set up Python backend (optional but recommended for PDF/DOCX)
    - [ ] Copy `server/main.py`
    - [ ] Copy `server/requirements.txt`
    - [ ] Install Python dependencies
    - [ ] Set up environment variables
    - [ ] Test backend server
- [ ] **Phase 5:** Copy feature components (AddColumnMenu)
- [ ] **Phase 6:** Copy demo component
- [ ] Install all required npm packages
- [ ] Configure TypeScript path aliases
- [ ] Configure Tailwind CSS
- [ ] Set up environment variables
- [ ] Update import paths to match your project structure
- [ ] Test each phase before moving to the next

---

## 🎯 Quick Start (Minimal Demo)

If you only need a basic data grid without all features:

**Minimum required:**
1. `types/data-grid.ts`
2. `lib/data-grid-constants.ts`
3. `lib/utils.ts`
4. `lib/data-grid.ts`
5. `hooks/use-data-grid.tsx`
6. `components/data-grid/*` (all files)
7. Basic UI components: `button`, `input`, `textarea`

**Skip for minimal:**
- `AddColumnMenu` (can add columns programmatically)
- AI services (`geminiService.ts`)
- Document processing services (if not processing PDF/DOCX)
- Backend server (if only using text files)
- Advanced UI components (tabs, dialogs, etc.)

**For document processing (PDF/DOCX):**
- Copy `services/documentProcessor.ts`
- Copy `services/documentProcessingService.ts`
- Set up Python backend server
- Install Python dependencies from `server/requirements.txt`

---

## 📚 Key Files Reference

| File | Purpose | Dependencies |
|------|---------|--------------|
| `demo.tsx` | Main demo component | Everything |
| `use-data-grid.tsx` | Core grid logic | React Table, React Virtual |
| `data-grid.tsx` | Grid component | All cell components, hook |
| `AddColumnMenu.tsx` | Column editor | UI components, services |
| `documentProcessingService.ts` | Document processing | documentProcessor, types |
| `documentProcessor.ts` | Backend communication | Backend server (Python) |
| `geminiService.ts` | AI extraction/analysis | @google/genai, types |
| `server/main.py` | Backend server | Python packages (see requirements.txt) |
| `types/data-grid.ts` | Type definitions | None (base types) |

---

## 💡 Tips

1. **Test incrementally:** After each phase, verify imports resolve and basic rendering works
2. **Start minimal:** Copy only what you need, add features gradually
3. **Check console:** Watch for missing dependencies or import errors
4. **Path aliases:** Update `@/` imports to match your project structure
5. **TypeScript:** Fix type errors as you go - they often reveal missing dependencies

---

Good luck with your migration! 🚀

