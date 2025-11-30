"use client";

import { faker } from "@faker-js/faker";
import type { ColumnDef } from "@tanstack/react-table";
import { COLUMN_SIZE } from "@/lib/data-grid-constants";
import * as React from "react";
import { DataGrid } from "@/components/data-grid/data-grid";
import { useDataGrid } from "@/hooks/use-data-grid";
import { AddColumnMenu } from "@/components/AddColumnMenu";
import type { ColumnType, ExtractionCell } from "@/types";
import type { FileCellData } from "@/types/data-grid";
import { Table, ChevronDown, ChevronLeft, ChevronRight, Square, Play, Zap, Cpu, Brain, Download, Upload, Loader2, AlertCircle, CheckCircle2, X, FileText, Eye, Quote } from "@/components/Icons";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { processDocumentFiles } from "@/services/documentProcessingService";
import { extractColumnData } from "@/services/geminiService";

// Analysis results with quotes and reasoning
type AnalysisResults = {
  [rowId: string]: {
    [columnId: string]: ExtractionCell;
  };
};

// Processing status for each row
type ProcessingStatus = 'pending' | 'processing' | 'completed' | 'error';

// Available Models
const MODELS = [
  { id: 'gemini-3-pro-preview', name: 'Gemini 3 Pro', description: 'Deepest Reasoning', icon: Brain },
  { id: 'gemini-2.5-pro-preview', name: 'Gemini 2.5 Pro', description: 'Balanced', icon: Cpu },
  { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash', description: 'Fastest', icon: Zap },
];


// Row data interface for type safety
interface RowData {
  id: string;
  content?: FileCellData[];
  processedContent?: string; // Base64 encoded markdown from document processing
  processingStatus?: ProcessingStatus;
  errorMessage?: string;
  [key: string]: any;
}

export function DataGridDemo() {
  const [data, setData] = React.useState<RowData[]>([{ id: faker.string.nanoid() }]);
  const [addColumnAnchor, setAddColumnAnchor] = React.useState<DOMRect | null>(null);
  const [editingColumnId, setEditingColumnId] = React.useState<string | null>(null);
  const [projectName, setProjectName] = React.useState('Data Grid Demo');
  const [isEditingProjectName, setIsEditingProjectName] = React.useState(false);
  const [isDraggingOver, setIsDraggingOver] = React.useState(false);
  const [activeTab, setActiveTab] = React.useState<string>("analyse");
  
  // Model State
  const [selectedModel, setSelectedModel] = React.useState<string>(MODELS[0].id);
  const [isModelMenuOpen, setIsModelMenuOpen] = React.useState(false);
  const [isProcessing, setIsProcessing] = React.useState(false);
  const [isConverting, setIsConverting] = React.useState(false);
  const processingAbortRef = React.useRef(false);

  const [columns, setColumns] = React.useState<ColumnDef<Record<string, any>>[]>([]);
  const [columnMetadata, setColumnMetadata] = React.useState<Record<string, { type: ColumnType; prompt: string }>>({
    content: { type: 'short-text', prompt: '' }, // Content column is editable via column menu
  });
  
  // Sidebar State
  type SidebarMode = 'none' | 'document' | 'cell';
  const [sidebarMode, setSidebarMode] = React.useState<SidebarMode>('none');
  const [selectedRowId, setSelectedRowId] = React.useState<string | null>(null);
  const [selectedCell, setSelectedCell] = React.useState<{ rowIndex: number; columnId: string } | null>(null);
  const [isSidebarExpanded, setIsSidebarExpanded] = React.useState(false);
  
  // Analysis results with quotes and reasoning
  const [analysisResults, setAnalysisResults] = React.useState<AnalysisResults>({});
  
  const selectedRow = React.useMemo(() => data.find(r => r.id === selectedRowId), [data, selectedRowId]);
  
  // Get the ExtractionCell for the selected cell with additional context
  const selectedCellData = React.useMemo(() => {
    if (!selectedCell || !selectedRowId || !selectedRow) return null;
    
    const extractionCell = analysisResults[selectedRowId]?.[selectedCell.columnId];
    const metadata = columnMetadata[selectedCell.columnId];
    const column = columns.find(c => c.id === selectedCell.columnId);
    
    // Get source file name from the row's content
    const sourceFileName = Array.isArray(selectedRow.content) && selectedRow.content[0] 
      ? selectedRow.content[0].name 
      : 'Unknown document';
    
    // Get column name from the column definition
    const columnName = column && typeof column.header === 'string' 
      ? column.header 
      : selectedCell.columnId;
    
    return {
      // ExtractionCell fields
      value: extractionCell?.value || (selectedRow[selectedCell.columnId] as string) || '',
      confidence: extractionCell?.confidence || 'Medium',
      quote: extractionCell?.quote || '',
      page: extractionCell?.page || 1,
      reasoning: extractionCell?.reasoning || '',
      status: extractionCell?.status || 'needs_review',
      // Additional context
      columnName,
      sourceFileName,
      prompt: metadata?.prompt || '',
      columnId: selectedCell.columnId,
    };
  }, [selectedCell, selectedRowId, selectedRow, analysisResults, columnMetadata, columns]);
  
  const currentModel = MODELS.find(m => m.id === selectedModel) || MODELS[0];
  
  // Decode markdown content for display
  const decodedMarkdown = React.useMemo(() => {
    if (!selectedRow?.processedContent) return null;
    try {
      return decodeURIComponent(escape(atob(selectedRow.processedContent)));
    } catch {
      return selectedRow.processedContent;
    }
  }, [selectedRow?.processedContent]);

  const defaultColumns = React.useMemo<ColumnDef<Record<string, any>>[]>(
    () => [
      {
        id: "content",
        accessorKey: "content" as any,
        header: "Content",
        meta: {
          cell: {
            variant: "auto", // Auto-detects: shows file badge for files, text input for text
            multiple: false,
          },
        },
        size: 200, // Wider to fit file badge with view/delete icons
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
    const promptValue = colDef.prompt || '';
    const columnId = editingColumnId || colDef.name.toLowerCase().replace(/\s+/g, '-');

    // Map ColumnType to cell variant
    const variantMap: Record<ColumnType, string> = {
      'short-text': 'short-text',
      'long-text': 'long-text',
      'number': 'number',
      'date': 'date',
      'boolean': 'checkbox',
      'list': 'long-text',
      'file': 'file',
    };

    // Special handling for content column - preserve accessorKey
    const isContentColumn = editingColumnId === 'content';
    
    const newColumn: ColumnDef<Record<string, any>> = {
      id: columnId,
      accessorKey: columnId as any,
      header: isContentColumn ? 'Content' : colDef.name, // Keep Content header for content column
      meta: {
        cell: colDef.type === 'file' 
          ? {
              variant: "file" as const,
              multiple: isContentColumn ? false : true, // Content column only allows single file
              maxFiles: isContentColumn ? 1 : 10,
              maxFileSize: 10 * 1024 * 1024, // 10MB
            }
          : {
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
      [columnId]: { type: colDef.type, prompt: promptValue }
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

  // Process cells using prompts and processed document content
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
      
      // Skip rows that are still processing or had errors
      if (row.processingStatus === 'processing' || row.processingStatus === 'pending') {
        continue;
      }

      // Skip if no processed content
      if (!row.processedContent) {
        continue;
      }

      // Create a DocumentFile-like object for extractColumnData
      const documentFile = {
        id: row.id,
        name: Array.isArray(row.content) && row.content[0] ? row.content[0].name : 'document',
        type: 'text/markdown',
        size: row.processedContent.length,
        content: row.processedContent, // Already base64
        mimeType: 'text/markdown',
      };

      // Process each column for this row
      for (const column of processingColumns) {
        // Check if processing was aborted
        if (processingAbortRef.current) {
          break;
        }

        const columnId = column.id as string;
        const metadata = columnMetadata[columnId];

        if (!metadata?.prompt) continue;

        // Create a Column object for extractColumnData
        const columnForExtraction = {
          id: columnId,
          name: typeof column.header === 'string' ? column.header : columnId,
          type: metadata.type,
          prompt: metadata.prompt,
          status: 'extracting' as const,
        };

        try {
          // Call extractColumnData to get structured result with quote
          const extractionResult = await extractColumnData(
            documentFile,
            columnForExtraction,
            selectedModel
          );

          // Store the full extraction result for the sidebar
          setAnalysisResults(prev => ({
            ...prev,
            [row.id]: {
              ...prev[row.id],
              [columnId]: extractionResult
            }
          }));

          // Update the cell value in the data grid
          setData(prevData => {
            const newData = [...prevData];
            newData[rowIndex] = {
              ...newData[rowIndex],
              [columnId]: extractionResult.value
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

  // Handle view file to open document viewer sidebar
  const handleViewFile = React.useCallback(({ rowIndex }: {
    file: FileCellData;
    rowIndex: number;
    columnId: string;
    row: RowData;
  }) => {
    const row = data[rowIndex];
    if (row?.id) {
      setSelectedRowId(row.id);
      setSelectedCell(null);
      setSidebarMode('document');
      setIsSidebarExpanded(false);
    }
  }, [data]);

  // Handle result cell click to open cell review sidebar
  const handleResultCellClick = React.useCallback((rowIndex: number, columnId: string) => {
    // Don't open for content column - that uses handleViewFile
    if (columnId === 'content') return;
    
    const row = data[rowIndex];
    if (!row) return;
    
    // Only open if the cell has a value
    const cellValue = row[columnId];
    if (cellValue === undefined || cellValue === null || cellValue === '') return;
    
    setSelectedCell({ rowIndex, columnId });
    setSelectedRowId(row.id);
    setSidebarMode('cell');
    setIsSidebarExpanded(false);
  }, [data]);

  // Close sidebar
  const handleCloseSidebar = React.useCallback(() => {
    setSidebarMode('none');
    setSelectedRowId(null);
    setSelectedCell(null);
    setIsSidebarExpanded(false);
  }, []);

  const onRowsDelete = React.useCallback(async (rows: RowData[], rowIndices: number[]) => {
    // Remove deleted rows from data
    setData((prev) => prev.filter((_, index) => !rowIndices.includes(index)));
    
    // Clear selected row if it was deleted
    if (selectedRowId && rows.some(r => r.id === selectedRowId)) {
      setSelectedRowId(null);
    }
  }, [selectedRowId]);

  // Handle file uploads within cells
  const onFilesUpload = React.useCallback(async ({ files, rowIndex, columnId }: {
    files: File[];
    rowIndex: number;
    columnId: string;
    row: RowData;
  }): Promise<FileCellData[]> => {
    // Note: "auto" variant auto-detects file vs text based on cell value
    // No need to switch column variant - just set the file data and it will render correctly

    // Create FileCellData objects for each file
    const uploadedFiles: FileCellData[] = files.map((file) => ({
      id: crypto.randomUUID(),
      name: file.name,
      size: file.size,
      type: file.type,
      url: URL.createObjectURL(file),
    }));

    // Process files for content column (document conversion)
    if (columnId === 'content' && files.length > 0) {
      setIsConverting(true);
      
      try {
        const result = await processDocumentFiles(files);
        
        if (result.success.length > 0) {
          const processedFile = result.success[0];
          // Update row with processed content
          setData((prev) => prev.map((row, idx) => 
            idx === rowIndex 
              ? { 
                  ...row, 
                  processedContent: processedFile.content,
                  processingStatus: 'completed' as ProcessingStatus,
                }
              : row
          ));
        } else if (result.errors.length > 0) {
          setData((prev) => prev.map((row, idx) => 
            idx === rowIndex 
              ? { 
                  ...row, 
                  processingStatus: 'error' as ProcessingStatus,
                  errorMessage: result.errors[0].error,
                }
              : row
          ));
        }
      } catch (error) {
        setData((prev) => prev.map((row, idx) => 
          idx === rowIndex 
            ? { 
                ...row, 
                processingStatus: 'error' as ProcessingStatus,
                errorMessage: error instanceof Error ? error.message : 'Unknown error',
              }
            : row
        ));
      } finally {
        setIsConverting(false);
      }
    }

    return uploadedFiles;
  }, []);

  // Handle file deletions within cells
  const onFilesDelete = React.useCallback(async ({ fileIds, rowIndex, columnId }: {
    fileIds: string[];
    rowIndex: number;
    columnId: string;
    row: RowData;
  }) => {
    // Clear processed content when file is deleted from content column
    if (columnId === 'content') {
      setData((prev) => prev.map((row, idx) => 
        idx === rowIndex 
          ? { 
              ...row, 
              processedContent: undefined,
              processingStatus: undefined,
              errorMessage: undefined,
            }
          : row
      ));
    }
  }, []);

  // Handle view cell details from context menu
  const handleViewCellDetails = React.useCallback(({ rowIndex, columnId }: { rowIndex: number; columnId: string }) => {
    handleResultCellClick(rowIndex, columnId);
  }, [handleResultCellClick]);

  const dataGridProps = useDataGrid({
    columns,
    data,
    onDataChange: setData,
    onRowAdd,
    onRowsDelete,
    onFilesUpload,
    onFilesDelete,
    enableSearch: true,
    enablePaste: true,
    meta: {
      onColumnEdit: handleColumnEdit,
      onViewFile: handleViewFile,
      onViewCellDetails: handleViewCellDetails,
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
            <h1 className="text-lg font-bold text-slate-800 tracking-tight whitespace-nowrap">Document Analysis</h1>
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
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden">
          <div className="bg-white border-b border-slate-200 px-6 py-3 flex justify-center">
            <TabsList className="w-full max-w-md grid grid-cols-3">
              <TabsTrigger value="files">Files</TabsTrigger>
              <TabsTrigger value="analyse">Analyse</TabsTrigger>
              <TabsTrigger value="workflow">Workflow</TabsTrigger>
            </TabsList>
          </div>
          
          {/* Files Tab */}
          <TabsContent value="files" className="flex-1 flex overflow-hidden m-0">
            <div className="flex-1 flex items-center justify-center bg-slate-50">
              <div className="text-center">
                <FileText className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-slate-600 mb-2">Files Management</h3>
                <p className="text-sm text-slate-400">Upload and manage your documents here</p>
              </div>
            </div>
          </TabsContent>

          {/* Analyse Tab - DataGrid */}
          <TabsContent value="analyse" className="flex-1 flex overflow-hidden m-0">
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

              // Note: "auto" variant auto-detects file vs text based on cell value
              // No need to switch column variant - just set the file data and it will render correctly

              // Clear sorting so new rows appear at the bottom
              if (dataGridProps.table.getState().sorting.length > 0) {
                dataGridProps.table.setSorting([]);
              }

              setIsConverting(true);

              // Create initial rows with pending status
              const initialRows: RowData[] = files.map((file: File) => {
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
                  processingStatus: 'pending' as ProcessingStatus,
                };
              });

              // Add rows immediately so user sees them
              // If there's only empty rows (no content), replace them instead of appending
              setData((prev) => {
                const hasOnlyEmptyRows = prev.every(row => {
                  const content = row.content;
                  // Empty if: undefined, null, empty string, or empty array
                  return !content || content === '' || (Array.isArray(content) && content.length === 0);
                });
                if (hasOnlyEmptyRows) {
                  return initialRows;
                }
                return [...prev, ...initialRows];
              });

              // Process each file individually for real-time updates
              for (let i = 0; i < files.length; i++) {
                const file = files[i];
                const rowId = initialRows[i].id;

                // Update status to processing
                setData((prev) => prev.map((row) => 
                  row.id === rowId 
                    ? { ...row, processingStatus: 'processing' as ProcessingStatus }
                    : row
                ));

                try {
                  // Process single file
                  const result = await processDocumentFiles([file]);

                  if (result.success.length > 0) {
                    const processedFile = result.success[0];
                    // Update row with processed content
                    setData((prev) => prev.map((row) => 
                      row.id === rowId 
                        ? { 
                            ...row, 
                            processedContent: processedFile.content,
                            processingStatus: 'completed' as ProcessingStatus,
                          }
                        : row
                    ));
                  } else if (result.errors.length > 0) {
                    // Update row with error status
                    setData((prev) => prev.map((row) => 
                      row.id === rowId 
                        ? { 
                            ...row, 
                            processingStatus: 'error' as ProcessingStatus,
                            errorMessage: result.errors[0].error,
                          }
                        : row
                    ));
                  }
                } catch (error) {
                  // Update row with error status
                  setData((prev) => prev.map((row) => 
                    row.id === rowId 
                      ? { 
                          ...row, 
                          processingStatus: 'error' as ProcessingStatus,
                          errorMessage: error instanceof Error ? error.message : 'Unknown error',
                        }
                      : row
                  ));
                }
              }

              setIsConverting(false);
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
            {/* Conversion Progress Overlay */}
            {isConverting && (
              <div className="absolute bottom-4 right-4 z-50 bg-white rounded-xl shadow-xl border border-indigo-100 p-4 flex items-center gap-3 animate-in slide-in-from-bottom-2 duration-200">
                <div className="bg-indigo-50 p-2 rounded-lg">
                  <Loader2 className="w-5 h-5 text-indigo-600 animate-spin" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-800">Processing Documents</p>
                  <p className="text-xs text-slate-500">Converting files to markdown...</p>
                </div>
              </div>
            )}
            <div className="p-8">
              <div className={`transition-all duration-300 ${sidebarMode !== 'none' ? (isSidebarExpanded ? 'max-w-4xl' : 'max-w-5xl') : 'max-w-7xl'} mx-auto`}>
                <DataGrid
                  {...dataGridProps}
                  height={600}
                  onColumnAdd={handleColumnAdd}
                />
              </div>
            </div>
          </div>

          {/* Review Sidebar - Document or Cell mode */}
          <div 
            className={`transition-all duration-300 ease-in-out border-l border-slate-200 bg-white shadow-xl relative flex ${
              sidebarMode !== 'none' 
                ? isSidebarExpanded ? 'w-[900px] translate-x-0' : 'w-[400px] translate-x-0'
                : 'w-0 translate-x-10 opacity-0 overflow-hidden'
            }`}
          >
            {sidebarMode !== 'none' && (
              <div className="w-full h-full flex">
                {/* Left Panel - Answer/Info */}
                <div className={`${isSidebarExpanded ? 'w-[400px] border-r border-slate-200' : 'w-full'} flex-shrink-0 flex flex-col bg-white`}>
                  {/* Header */}
                  <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-white flex-shrink-0">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${sidebarMode === 'cell' ? 'bg-emerald-50 text-emerald-600' : 'bg-indigo-50 text-indigo-600'}`}>
                        {sidebarMode === 'cell' ? <Eye className="w-5 h-5" /> : <FileText className="w-5 h-5" />}
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[10px] uppercase tracking-wider font-bold text-slate-400">
                          {sidebarMode === 'cell' ? 'Cell Review' : 'Document Preview'}
                        </span>
                        <span className="text-sm font-semibold text-slate-900 truncate max-w-[200px]" title={
                          sidebarMode === 'cell' ? selectedCellData?.columnName : selectedRow?.content?.[0]?.name
                        }>
                          {sidebarMode === 'cell' ? selectedCellData?.columnName : (selectedRow?.content?.[0]?.name || 'Untitled')}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <button 
                        onClick={() => setIsSidebarExpanded(!isSidebarExpanded)}
                        className="p-2 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600 transition-colors"
                        title={isSidebarExpanded ? 'Collapse' : 'Expand to show document'}
                      >
                        {isSidebarExpanded ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
                      </button>
                      <button 
                        onClick={handleCloseSidebar}
                        className="p-2 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600 transition-colors"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                  </div>

                  {/* Body Content */}
                  {sidebarMode === 'cell' && selectedCellData ? (
                    <div className="flex-1 overflow-y-auto p-6">
                      {/* Source File */}
                      <div className="mb-6">
                        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Source Document</h4>
                        <div className="flex items-center gap-2 p-3 bg-slate-50 rounded-lg border border-slate-100">
                          <FileText className="w-4 h-4 text-slate-400" />
                          <span className="text-sm text-slate-700 truncate" title={selectedCellData.sourceFileName}>{selectedCellData.sourceFileName}</span>
                        </div>
                      </div>

                      {/* Extracted Value with Confidence */}
                      <div className="mb-6">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Extracted Value</h4>
                          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                            selectedCellData.confidence === 'High' ? 'bg-emerald-100 text-emerald-700' :
                            selectedCellData.confidence === 'Medium' ? 'bg-amber-100 text-amber-700' :
                            'bg-red-100 text-red-700'
                          }`}>
                            {selectedCellData.confidence} Confidence
                          </span>
                        </div>
                        <div className="p-4 bg-white rounded-lg border border-slate-200 shadow-sm">
                          <p className="text-lg text-slate-900 leading-relaxed font-medium whitespace-pre-wrap">
                            {selectedCellData.value || <span className="text-slate-400 italic">No value</span>}
                          </p>
                        </div>
                      </div>

                      {/* Quote from Document */}
                      {selectedCellData.quote && (
                        <div className="mb-6">
                          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                            <span className="flex items-center gap-1">
                              <Quote className="w-3 h-3" />
                              Quote from Document
                            </span>
                          </h4>
                          <div className="p-4 bg-amber-50 rounded-lg border-l-4 border-amber-400">
                            <p className="text-sm text-slate-700 leading-relaxed italic">
                              "{selectedCellData.quote}"
                            </p>
                            {selectedCellData.page > 0 && (
                              <p className="text-xs text-slate-500 mt-2">Page {selectedCellData.page}</p>
                            )}
                          </div>
                        </div>
                      )}

                      {/* AI Reasoning */}
                      {selectedCellData.reasoning && (
                        <div className="mb-6">
                          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">AI Reasoning</h4>
                          <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                            <p className="text-sm text-slate-600 leading-relaxed">
                              {selectedCellData.reasoning}
                            </p>
                          </div>
                        </div>
                      )}

                      {/* Prompt Used */}
                      {selectedCellData.prompt && (
                        <div className="mb-6">
                          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Extraction Prompt</h4>
                          <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                            <p className="text-sm text-slate-600 leading-relaxed">
                              {selectedCellData.prompt}
                            </p>
                          </div>
                        </div>
                      )}

                      {/* View Document Button (when collapsed) */}
                      {!isSidebarExpanded && decodedMarkdown && (
                        <button
                          onClick={() => setIsSidebarExpanded(true)}
                          className="w-full py-3 px-4 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg text-sm font-semibold transition-colors flex items-center justify-center gap-2"
                        >
                          <Eye className="w-4 h-4" />
                          View Source Document
                        </button>
                      )}
                    </div>
                  ) : sidebarMode === 'document' && selectedRow ? (
                    <div className="flex-1 overflow-y-auto p-6">
                      {/* Status Badge */}
                      {selectedRow.processingStatus && selectedRow.processingStatus !== 'completed' && (
                        <div className={`mb-4 px-3 py-2 rounded-lg flex items-center gap-2 text-sm ${
                          selectedRow.processingStatus === 'processing' ? 'bg-blue-50 text-blue-700 border border-blue-200' :
                          selectedRow.processingStatus === 'pending' ? 'bg-slate-50 text-slate-600 border border-slate-200' :
                          'bg-red-50 text-red-700 border border-red-200'
                        }`}>
                          {selectedRow.processingStatus === 'processing' && (
                            <>
                              <Loader2 className="w-4 h-4 animate-spin" />
                              <span>Processing document...</span>
                            </>
                          )}
                          {selectedRow.processingStatus === 'pending' && (
                            <>
                              <span className="w-2 h-2 bg-slate-400 rounded-full"></span>
                              <span>Waiting to process...</span>
                            </>
                          )}
                          {selectedRow.processingStatus === 'error' && (
                            <>
                              <AlertCircle className="w-4 h-4" />
                              <span>{selectedRow.errorMessage || 'Processing failed'}</span>
                            </>
                          )}
                        </div>
                      )}

                      {/* Document Content (when not expanded) */}
                      {!isSidebarExpanded && (
                        <>
                          {decodedMarkdown ? (
                            <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-4">
                              <pre className="whitespace-pre-wrap text-sm leading-relaxed text-slate-800 font-mono">
                                {decodedMarkdown}
                              </pre>
                            </div>
                          ) : (
                            <div className="flex flex-col items-center justify-center py-12 text-center">
                              <FileText className="w-12 h-12 text-slate-200 mb-4" />
                              <p className="text-sm text-slate-500 mb-2">No content available</p>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  ) : null}
                </div>

                {/* Right Panel - Full Document (when expanded) */}
                {isSidebarExpanded && (
                  <div className="flex-1 bg-slate-100 flex flex-col overflow-y-auto">
                    <div className="p-8">
                      <div className="max-w-[600px] mx-auto bg-white shadow-lg p-8">
                        {decodedMarkdown ? (
                          <pre className="whitespace-pre-wrap text-sm leading-relaxed text-slate-800 font-mono">
                            {(() => {
                              // If we have a quote to highlight (in cell mode), split and highlight
                              const quoteToHighlight = sidebarMode === 'cell' && selectedCellData?.quote;
                              if (quoteToHighlight && decodedMarkdown.includes(quoteToHighlight)) {
                                const parts = decodedMarkdown.split(quoteToHighlight);
                                return parts.map((part, i) => (
                                  <React.Fragment key={i}>
                                    {part}
                                    {i < parts.length - 1 && (
                                      <mark 
                                        className="bg-amber-200 text-slate-900 px-0.5 rounded scroll-mt-32"
                                        ref={i === 0 ? (el) => {
                                          // Auto-scroll to first highlighted quote
                                          if (el) {
                                            setTimeout(() => {
                                              el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                                            }, 100);
                                          }
                                        } : undefined}
                                      >
                                        {quoteToHighlight}
                                      </mark>
                                    )}
                                  </React.Fragment>
                                ));
                              }
                              return decodedMarkdown;
                            })()}
                          </pre>
                        ) : (
                          <div className="flex flex-col items-center justify-center py-12 text-center">
                            <FileText className="w-12 h-12 text-slate-200 mb-4" />
                            <p className="text-sm text-slate-500">No document content available</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
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
          </TabsContent>

          {/* Workflow Tab */}
          <TabsContent value="workflow" className="flex-1 flex overflow-hidden m-0">
            <div className="flex-1 flex items-center justify-center bg-slate-50">
              <div className="text-center">
                <Zap className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-slate-600 mb-2">Workflow Builder</h3>
                <p className="text-sm text-slate-400">Create automated document processing workflows</p>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
