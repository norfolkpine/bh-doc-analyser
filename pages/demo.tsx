"use client";

import { faker } from "@faker-js/faker";
import type { ColumnDef } from "@tanstack/react-table";
import { COLUMN_SIZE } from "@/lib/data-grid-constants";
import * as React from "react";
import { DataGrid } from "@/components/data-grid/data-grid";
import { useDataGrid } from "@/hooks/use-data-grid";
import { AddColumnMenu } from "@/components/AddColumnMenu";
import type { ColumnType } from "@/types";
import type { FileCellData } from "@/types/data-grid";
import { Table, ChevronDown, Square, Play, Zap, Cpu, Brain, Download, Upload } from "@/components/Icons";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

// Available Models
const MODELS = [
  { id: 'gemini-3-pro-preview', name: 'Gemini 3 Pro', description: 'Deepest Reasoning', icon: Brain },
  { id: 'gemini-2.5-pro-preview', name: 'Gemini 2.5 Pro', description: 'Balanced', icon: Cpu },
  { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash', description: 'Fastest', icon: Zap },
];


export function DataGridDemo() {
  const [data, setData] = React.useState<Record<string, any>[]>([{ id: faker.string.nanoid() }]);
  const [addColumnAnchor, setAddColumnAnchor] = React.useState<DOMRect | null>(null);
  const [editingColumnId, setEditingColumnId] = React.useState<string | null>(null);
  const [projectName, setProjectName] = React.useState('Data Grid Demo');
  const [isEditingProjectName, setIsEditingProjectName] = React.useState(false);
  const [isDraggingOver, setIsDraggingOver] = React.useState(false);
  const [activeTab, setActiveTab] = React.useState<string>("files");
  
  // Model State
  const [selectedModel, setSelectedModel] = React.useState<string>(MODELS[0].id);
  const [isModelMenuOpen, setIsModelMenuOpen] = React.useState(false);
  const [isProcessing, setIsProcessing] = React.useState(false);
  const processingAbortRef = React.useRef(false);

  const [columns, setColumns] = React.useState<ColumnDef<Record<string, any>>[]>([]);
  const [columnMetadata, setColumnMetadata] = React.useState<Record<string, { type: ColumnType; prompt: string }>>({});
  
  const currentModel = MODELS.find(m => m.id === selectedModel) || MODELS[0];

  const defaultColumns = React.useMemo<ColumnDef<Record<string, any>>[]>(
    () => [
      {
        id: "content",
        accessorKey: "content" as any,
        header: "Content",
        meta: {
          cell: {
            variant: "file",
            multiple: false, // Only one file per cell
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

    const newColumn: ColumnDef<Record<string, any>> = {
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

  // Call AI API to process prompt with content
  const callAI = async (content: string, prompt: string, modelId: string): Promise<string> => {
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';

    try {
      const response = await fetch(`${apiUrl}/analyze`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content,
          prompt,
          model: modelId,
        }),
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.statusText}`);
      }

      const data = await response.json();
      return data.result || '';
    } catch (error) {
      console.error('AI API call failed:', error);
      throw error;
    }
  };

  // Process cells using prompts and first column data
  const handleRunAnalysis = React.useCallback(async () => {
    processingAbortRef.current = false;
    setIsProcessing(true);

    // Get all columns except the first one
    const processingColumns = columns.slice(1);

    // Process each row
    for (let rowIndex = 0; rowIndex < data.length; rowIndex++) {
      // Check if processing was aborted
      if (processingAbortRef.current) {
        break;
      }

      const row = data[rowIndex];
      const firstColumnValue = row[columns[0]?.id as string] || row.content;

      // Skip if first column is empty
      if (!firstColumnValue) continue;

      // Handle FileCellData[] - extract file names
      let contentToProcess: string;
      if (Array.isArray(firstColumnValue) && firstColumnValue.length > 0) {
        // If it's an array of FileCellData, use file names
        contentToProcess = firstColumnValue.map(f => f.name).join(', ');
      } else {
        contentToProcess = String(firstColumnValue);
      }

      // Process each column for this row
      for (const column of processingColumns) {
        // Check if processing was aborted
        if (processingAbortRef.current) {
          break;
        }

        const columnId = column.id as string;
        const metadata = columnMetadata[columnId];

        if (!metadata?.prompt) continue;

        try {
          // Call AI API to process the content with the prompt
          const result = await callAI(
            contentToProcess,
            metadata.prompt,
            selectedModel
          );

          // Update the cell
          setData(prevData => {
            const newData = [...prevData];
            newData[rowIndex] = {
              ...newData[rowIndex],
              [columnId]: result
            };
            return newData;
          });
        } catch (error) {
          console.error(`Failed to process row ${rowIndex}, column ${columnId}:`, error);
          // On error, keep the cell empty or show error
          setData(prevData => {
            const newData = [...prevData];
            newData[rowIndex] = {
              ...newData[rowIndex],
              [columnId]: '[Error]'
            };
            return newData;
          });
        }
      }
    }

    setIsProcessing(false);
  }, [data, columns, columnMetadata, selectedModel]);

  const handleStopProcessing = React.useCallback(() => {
    processingAbortRef.current = true;
    setIsProcessing(false);
  }, []);

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

  const tableRef = React.useRef<any>(null);

  const onRowAdd = React.useCallback(() => {
    // Clear sorting so new rows appear at the bottom
    if (tableRef.current?.getState().sorting.length > 0) {
      tableRef.current.setSorting([]);
    }
    
    setData((prev) => [...prev, { id: faker.string.nanoid() }]);

    return {
      rowIndex: data.length,
      columnId: "content",
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

  // Store table reference for clearing sorting
  React.useEffect(() => {
    tableRef.current = dataGridProps.table;
  }, [dataGridProps.table]);

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
      // Handle FileCellData[] arrays
      let stringValue: string;
      if (Array.isArray(value) && value.length > 0 && typeof value[0] === 'object' && 'name' in value[0]) {
        // It's an array of FileCellData, extract file names
        stringValue = (value as FileCellData[]).map(f => f.name).join(', ');
      } else {
        stringValue = String(value);
      }
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
                  onClick={handleStopProcessing}
                  className="flex items-center gap-2 px-4 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 text-xs font-semibold rounded-md transition-all active:scale-95"
                >
                  <Square className="w-3.5 h-3.5 fill-current" />
                  Stop
                </button>
             ) : (
                <button
                  onClick={handleRunAnalysis}
                  disabled={data.length === 0 || columns.length <= 1}
                  className="flex items-center gap-2 px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white border border-emerald-600 text-xs font-bold rounded-md transition-all active:scale-95 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  Run Analysis
                </button>
             )}
          </div>
        </header>
        {/* Tabs */}
        <div className="bg-white border-b border-slate-200 px-6 py-3 flex justify-center">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full max-w-md">
            <TabsList className="w-full grid grid-cols-3">
              <TabsTrigger value="files">Files</TabsTrigger>
              <TabsTrigger value="analyse">Analyse</TabsTrigger>
              <TabsTrigger value="workflow">Workflow</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
        {/* Workspace */}
        <main className="flex-1 flex overflow-hidden relative">
          <div 
            className={`flex-1 flex flex-col min-w-0 bg-white relative ${isDraggingOver ? 'bg-indigo-50/30' : ''}`}
            onDragOver={(e) => {
              e.preventDefault();
              e.stopPropagation();
              if (e.dataTransfer.types.includes('Files')) {
                setIsDraggingOver(true);
              }
            }}
            onDragLeave={(e) => {
              e.preventDefault();
              e.stopPropagation();
              // Only set to false if we're leaving the main container
              const rect = e.currentTarget.getBoundingClientRect();
              const x = e.clientX;
              const y = e.clientY;
              if (x <= rect.left || x >= rect.right || y <= rect.top || y >= rect.bottom) {
                setIsDraggingOver(false);
              }
            }}
            onDrop={async (e) => {
              e.preventDefault();
              e.stopPropagation();
              setIsDraggingOver(false);
              
              const fileList = e.dataTransfer.files;
              if (!fileList || fileList.length === 0) return;

              const files = Array.from(fileList) as File[];
              if (files.length === 0) return;

              // Clear sorting so new rows appear at the bottom
              if (dataGridProps.table.getState().sorting.length > 0) {
                dataGridProps.table.setSorting([]);
              }

              // Create a new row for each file
              const newRows: Record<string, any>[] = files.map((file: File) => {
                const fileData: FileCellData = {
                  id: crypto.randomUUID(),
                  name: file.name,
                  size: file.size,
                  type: file.type,
                  url: URL.createObjectURL(file),
                };

                return {
                  id: faker.string.nanoid(),
                  content: [fileData],
                };
              });

              setData((prev) => [...prev, ...newRows]);
            }}
          >
            {isDraggingOver && (
              <div className="absolute inset-0 z-50 flex items-center justify-center bg-indigo-50/80 backdrop-blur-sm border-2 border-indigo-400 border-dashed m-4 rounded-xl pointer-events-none">
                <div className="flex flex-col items-center">
                  <Upload className="w-12 h-12 text-indigo-600 mb-2" />
                  <p className="text-lg font-bold text-indigo-800">Drop files to create new rows</p>
                </div>
              </div>
            )}
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
