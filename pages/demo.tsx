"use client";

import { faker } from "@faker-js/faker";
import type { ColumnDef } from "@tanstack/react-table";
import { COLUMN_SIZE } from "@/lib/data-grid-constants";
import * as React from "react";
import { DataGrid } from "@/components/data-grid/data-grid";
import { useDataGrid } from "@/hooks/use-data-grid";
import { AddColumnMenu } from "@/components/AddColumnMenu";
import type { ColumnType } from "@/types";
import { Table, ChevronDown, Square, Play, Zap, Cpu, Brain, Download } from "@/components/Icons";

// Available Models
const MODELS = [
  { id: 'gemini-3-pro-preview', name: 'Gemini 3 Pro', description: 'Deepest Reasoning', icon: Brain },
  { id: 'gemini-2.5-pro-preview', name: 'Gemini 2.5 Pro', description: 'Balanced', icon: Cpu },
  { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash', description: 'Fastest', icon: Zap },
];

interface SkateTrick {
  id: string;
  trickName?: string;
  skaterName?: string;
  difficulty?: "beginner" | "intermediate" | "advanced" | "expert";
  variant?: "flip" | "grind" | "grab" | "transition" | "manual" | "slide";
  landed?: boolean;
  attempts?: number;
  bestScore?: number;
  location?: string;
  dateAttempted?: string;
}

const skateSpots = [
  "Venice Beach Skate Park",
  "Burnside Skate Park",
  "Love Park (Philadelphia)",
  "MACBA (Barcelona)",
  "Southbank (London)",
  "FDR Skate Park",
  "Brooklyn Banks",
  "El Toro High School",
  "Hubba Hideout",
  "Wallenberg High School",
  "EMB (Embarcadero)",
  "Pier 7 (San Francisco)",
] as const;

const skateTricks = {
  flip: [
    "Kickflip",
    "Heelflip",
    "Tre Flip",
    "Hardflip",
    "Inward Heelflip",
    "Frontside Flip",
    "Backside Flip",
    "Varial Flip",
    "Varial Heelflip",
    "Double Flip",
    "Laser Flip",
    "Anti-Casper Flip",
    "Casper Flip",
    "Impossible",
    "360 Flip",
    "Big Spin",
    "Bigspin Flip",
  ],
  grind: [
    "50-50 Grind",
    "5-0 Grind",
    "Nosegrind",
    "Crooked Grind",
    "Feeble Grind",
    "Smith Grind",
    "Lipslide",
    "Boardslide",
    "Tailslide",
    "Noseslide",
    "Bluntslide",
    "Nollie Backside Lipslide",
    "Switch Frontside Boardslide",
  ],
  grab: [
    "Indy Grab",
    "Melon Grab",
    "Stalefish",
    "Tail Grab",
    "Nose Grab",
    "Method",
    "Mute Grab",
    "Crail Grab",
    "Seatbelt Grab",
    "Roast Beef",
    "Chicken Wing",
    "Tweaked Indy",
    "Japan Air",
  ],
  transition: [
    "Frontside Air",
    "Backside Air",
    "McTwist",
    "540",
    "720",
    "900",
    "Frontside 180",
    "Backside 180",
    "Frontside 360",
    "Backside 360",
    "Alley-Oop",
    "Fakie",
    "Revert",
    "Carve",
    "Pump",
    "Drop In",
  ],
  manual: [
    "Manual",
    "Nose Manual",
    "Casper",
    "Rail Stand",
    "Pogo",
    "Handstand",
    "One Foot Manual",
    "Spacewalk",
    "Truckstand",
    "Primo",
  ],
  slide: [
    "Powerslide",
    "Bert Slide",
    "Coleman Slide",
    "Pendulum Slide",
    "Stand-up Slide",
    "Toeside Slide",
    "Heelside Slide",
  ],
} as const;

function generateTrickData(): SkateTrick[] {
  return Array.from({ length: 50 }, () => {
    const variant = faker.helpers.arrayElement(
      Object.keys(skateTricks) as Array<keyof typeof skateTricks>,
    );
    const trickName = faker.helpers.arrayElement(skateTricks[variant]);
    const skaterName = faker.person.fullName();
    const attempts = faker.number.int({ min: 1, max: 50 });
    const landed = faker.datatype.boolean(0.6);

    const getDifficulty = (trick: string): SkateTrick["difficulty"] => {
      const expertTricks = [
        "Tre Flip",
        "900",
        "McTwist",
        "Laser Flip",
        "Impossible",
      ];
      const advancedTricks = [
        "Hardflip",
        "720",
        "540",
        "Crooked Grind",
        "Switch Frontside Boardslide",
      ];
      const intermediateTricks = [
        "Kickflip",
        "Heelflip",
        "Frontside 180",
        "50-50 Grind",
        "Boardslide",
      ];

      if (expertTricks.some((t) => trick.includes(t))) return "expert";
      if (advancedTricks.some((t) => trick.includes(t))) return "advanced";
      if (intermediateTricks.some((t) => trick.includes(t)))
        return "intermediate";
      return "beginner";
    };

    const difficulty = getDifficulty(trickName);

    return {
      id: faker.string.nanoid(),
      trickName,
      skaterName,
      difficulty,
      variant,
      landed,
      attempts,
      bestScore: landed
        ? faker.number.int({ min: 6, max: 10 })
        : faker.number.int({ min: 1, max: 5 }),
      location: faker.helpers.arrayElement(skateSpots),
      dateAttempted:
        faker.date
          .between({
            from: new Date(2023, 0, 1),
            to: new Date(),
          })
          .toISOString()
          .split("T")[0] ?? "",
    };
  });
}

export function DataGridDemo() {
  const [data, setData] = React.useState<SkateTrick[]>([{ id: faker.string.nanoid() }]);
  const [addColumnAnchor, setAddColumnAnchor] = React.useState<DOMRect | null>(null);
  const [editingColumnId, setEditingColumnId] = React.useState<string | null>(null);
  const [projectName, setProjectName] = React.useState('Data Grid Demo');
  const [isEditingProjectName, setIsEditingProjectName] = React.useState(false);
  
  // Model State
  const [selectedModel, setSelectedModel] = React.useState<string>(MODELS[0].id);
  const [isModelMenuOpen, setIsModelMenuOpen] = React.useState(false);
  const [isProcessing, setIsProcessing] = React.useState(false);

  const [columns, setColumns] = React.useState<ColumnDef<SkateTrick>[]>([]);
  const [columnMetadata, setColumnMetadata] = React.useState<Record<string, { type: ColumnType; prompt: string }>>({});
  
  const currentModel = MODELS.find(m => m.id === selectedModel) || MODELS[0];

  const defaultColumns = React.useMemo<ColumnDef<SkateTrick>[]>(
    () => [
      {
        id: "name",
        accessorKey: "name" as any,
        header: "Name",
        meta: {
          cell: {
            variant: "short-text",
          },
        },
        size: COLUMN_SIZE.DEFAULT,
        minSize: COLUMN_SIZE.MIN,
        maxSize: COLUMN_SIZE.MAX,
      },
    ],
    [],
  );

  React.useEffect(() => {
    if (columns.length === 0) {
      setColumns(defaultColumns);
    }
  }, [columns.length, defaultColumns]);

  const handleSaveColumn = (colDef: { name: string; type: ColumnType; prompt: string }) => {
    const columnId = editingColumnId || colDef.name.toLowerCase().replace(/\s+/g, '-');

    // Map ColumnType to cell variant
    const variantMap: Record<ColumnType, string> = {
      'text': 'short-text',
      'number': 'number',
      'date': 'date',
      'boolean': 'checkbox',
      'list': 'long-text',
    };

    const newColumn: ColumnDef<SkateTrick> = {
      id: columnId,
      accessorKey: columnId as any,
      header: colDef.name,
      meta: {
        cell: {
          variant: variantMap[colDef.type] as any,
        },
      },
      size: COLUMN_SIZE.DEFAULT,
      minSize: COLUMN_SIZE.MIN,
      maxSize: COLUMN_SIZE.MAX,
      ...(colDef.type === 'boolean' ? {
        cell: ({ getValue }: any) => (getValue() ? "✓" : "✗"),
      } : {}),
    };

    if (editingColumnId) {
      // Update existing column
      setColumns(columns.map(c => c.id === editingColumnId ? newColumn : c));
    } else {
      // Add new column
      setColumns([...columns, newColumn]);
    }

    // Store metadata
    setColumnMetadata({
      ...columnMetadata,
      [columnId]: { type: colDef.type, prompt: colDef.prompt }
    });

    setAddColumnAnchor(null);
    setEditingColumnId(null);
  };

  const handleColumnAdd = () => {
    // Get the position of the + column header
    const addColumnButton = document.querySelector('[data-slot="grid-header-add-column"]');
    if (addColumnButton) {
      setEditingColumnId(null);
      setAddColumnAnchor(addColumnButton.getBoundingClientRect());
    }
  };

  const handleColumnEdit = (columnId: string, rect?: DOMRect) => {
    if (rect) {
      // Use the provided rect
      setEditingColumnId(columnId);
      setAddColumnAnchor(rect);
    } else {
      // Fallback: find the specific column header
      const columnHeader = document.querySelector(`[data-column-id="${columnId}"][data-slot="grid-header-cell"]`);
      if (columnHeader) {
        setEditingColumnId(columnId);
        setAddColumnAnchor(columnHeader.getBoundingClientRect());
      }
    }
  };

  const onRowAdd = React.useCallback(() => {
    setData((prev) => [...prev, { id: faker.string.nanoid() }]);

    return {
      rowIndex: data.length,
      columnId: "trickName",
    };
  }, [data.length]);

  const dataGridProps = useDataGrid({
    columns,
    data,
    onDataChange: setData,
    onRowAdd,
    enableSearch: true,
    meta: {
      onColumnEdit: handleColumnEdit,
    } as any,
  });

  const handleExportToCSV = React.useCallback(() => {
    const table = dataGridProps.table;
    
    // Get all visible columns (excluding select and actions columns)
    const visibleColumns = table.getAllColumns().filter(
      (column) => column.getIsVisible() && column.id !== 'select' && column.id !== 'actions'
    );

    if (visibleColumns.length === 0) {
      return;
    }

    // Get column headers
    const headers = visibleColumns.map((column) => {
      const header = column.columnDef.header;
      return typeof header === 'string' ? header : column.id;
    });

    // Helper function to escape CSV values
    const escapeCSV = (value: any): string => {
      if (value === null || value === undefined) {
        return '';
      }
      const stringValue = String(value);
      // If value contains comma, quote, or newline, wrap in quotes and escape quotes
      if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
        return `"${stringValue.replace(/"/g, '""')}"`;
      }
      return stringValue;
    };

    // Get all rows data
    const rows = table.getRowModel().rows.map((row) => {
      return visibleColumns.map((column) => {
        const cellValue = row.getValue(column.id);
        return escapeCSV(cellValue);
      });
    });

    // Combine headers and rows
    const csvContent = [
      headers.map(escapeCSV).join(','),
      ...rows.map((row) => row.join(','))
    ].join('\n');

    // Create blob and download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${projectName || 'data-grid'}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, [dataGridProps.table, projectName]);

  return (
    <div className="flex h-screen bg-slate-50 text-slate-900 font-sans">
      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="relative z-50 bg-white border-b border-slate-200 h-16 flex items-center justify-between px-6 shadow-sm">
          <div className="flex items-center gap-4 min-w-0">
            <h1 className="text-lg font-bold text-slate-800 tracking-tight whitespace-nowrap">Tabular Review</h1>
            <div className="h-4 w-px bg-slate-300 mx-2 flex-shrink-0"></div>
            {isEditingProjectName ? (
              <input
                type="text"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                onBlur={() => setIsEditingProjectName(false)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') setIsEditingProjectName(false);
                }}
                className="text-sm font-medium text-slate-800 border-b border-indigo-500 outline-none bg-transparent min-w-[150px]"
                autoFocus
              />
            ) : (
              <p 
                className="text-sm text-slate-500 font-medium cursor-text hover:text-slate-800 hover:bg-slate-50 px-2 py-1 rounded transition-all select-none truncate max-w-[200px] sm:max-w-[300px]"
                onDoubleClick={() => setIsEditingProjectName(true)}
                title="Double click to rename"
              >
                {projectName}
              </p>
            )}
          </div>
          <div className="flex items-center gap-3 flex-shrink-0">
             {/* Demo Button */}
             <a
                href="#/"
                className="flex items-center gap-2 px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-600 border border-slate-200 text-xs font-semibold rounded-md transition-all active:scale-95"
                title="Back to Main App"
             >
                <Table className="w-3.5 h-3.5" />
                Back to App
             </a>

             {/* Export CSV Button */}
             <button
                onClick={handleExportToCSV}
                disabled={data.length === 0 || columns.length === 0}
                className="flex items-center gap-2 px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-600 border border-slate-200 text-xs font-semibold rounded-md transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                title="Export to CSV"
             >
                <Download className="w-3.5 h-3.5" />
                Export CSV
             </button>

             <div className="h-6 w-px bg-slate-200 mx-1"></div>

             {/* Model Selector */}
             <div className="relative">
                <button 
                onClick={() => !isProcessing && setIsModelMenuOpen(!isModelMenuOpen)}
                disabled={isProcessing}
                className={`flex items-center gap-2 px-3 py-1.5 bg-indigo-50 text-indigo-700 rounded-md border border-indigo-100 transition-all ${!isProcessing ? 'hover:bg-indigo-100 active:scale-95' : 'opacity-60 cursor-not-allowed'}`}
                >
                  <div className="flex items-center gap-2">
                    <currentModel.icon className="w-3.5 h-3.5" />
                    <span className="text-xs font-semibold">{currentModel.name}</span>
                  </div>
                  <ChevronDown className="w-3 h-3 opacity-60" />
                </button>
                
                {isModelMenuOpen && (
                  <>
                  <div className="fixed inset-0 z-40" onClick={() => setIsModelMenuOpen(false)}></div>
                  <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-xl shadow-xl border border-slate-100 p-1 z-50 animate-in fade-in zoom-in-95 duration-100">
                    {MODELS.map(model => (
                      <button
                        key={model.id}
                        onClick={() => {
                          setSelectedModel(model.id);
                          setIsModelMenuOpen(false);
                        }}
                        className={`w-full text-left px-3 py-2 rounded-lg flex items-center gap-3 transition-colors ${
                          selectedModel === model.id ? 'bg-indigo-50 text-indigo-700' : 'hover:bg-slate-50 text-slate-700'
                        }`}
                      >
                        <div className={`p-1.5 rounded-md ${selectedModel === model.id ? 'bg-white shadow-sm' : 'bg-slate-100'}`}>
                          <model.icon className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="text-xs font-bold">{model.name}</div>
                          <div className="text-[10px] opacity-70">{model.description}</div>
                        </div>
                      </button>
                    ))}
                  </div>
                  </>
                )}
              </div>

             {/* Run / Stop Button */}
             {isProcessing ? (
                <button 
                  onClick={() => setIsProcessing(false)}
                  className="flex items-center gap-2 px-4 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 text-xs font-semibold rounded-md transition-all active:scale-95"
                >
                  <Square className="w-3.5 h-3.5 fill-current" />
                  Stop
                </button>
             ) : (
                <button 
                  onClick={() => setIsProcessing(true)}
                  disabled={data.length === 0 || columns.length === 0}
                  className="flex items-center gap-2 px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white border border-emerald-600 text-xs font-bold rounded-md transition-all active:scale-95 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  Run Analysis
                </button>
             )}
          </div>
        </header>
        {/* Workspace */}
        <main className="flex-1 flex overflow-hidden relative">
          <div className="flex-1 flex flex-col min-w-0 bg-white">
            <div className="p-8">
              <div className="max-w-7xl mx-auto">
                <DataGrid
                  {...dataGridProps}
                  height={600}
                  onColumnAdd={handleColumnAdd}
                />
              </div>
            </div>
          </div>

          {/* Add/Edit Column Menu */}
          {addColumnAnchor && (
            <AddColumnMenu
              triggerRect={addColumnAnchor}
              onClose={() => {
                setAddColumnAnchor(null);
                setEditingColumnId(null);
              }}
              onSave={handleSaveColumn}
              modelId="gemini-2.5-flash"
              initialData={editingColumnId ? {
                name: columns.find(c => c.id === editingColumnId)?.header as string || '',
                type: columnMetadata[editingColumnId]?.type || 'text',
                prompt: columnMetadata[editingColumnId]?.prompt || '',
              } : undefined}
            />
          )}
        </main>
      </div>
    </div>
  );
}
