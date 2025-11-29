"use client";

import { faker } from "@faker-js/faker";
import type { ColumnDef } from "@tanstack/react-table";
import { COLUMN_SIZE } from "@/lib/data-grid-constants";
import * as React from "react";
import { DataGrid } from "@/components/data-grid/data-grid";
import { useDataGrid } from "@/hooks/use-data-grid";
import { AddColumnMenu } from "@/components/AddColumnMenu";
import type { ColumnType } from "@/types";

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

  const [columns, setColumns] = React.useState<ColumnDef<SkateTrick>[]>([]);
  const [columnMetadata, setColumnMetadata] = React.useState<Record<string, { type: ColumnType; prompt: string }>>({});

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

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="max-w-7xl mx-auto px-8 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Data Grid Demo</h1>
            <p className="text-muted-foreground text-sm">
              Editable data grid - click + to add columns, "Add row" at bottom to add rows
            </p>
          </div>
          <a
            href="#/"
            className="px-4 py-2 text-sm font-medium border rounded-md hover:bg-accent transition-colors"
          >
            ← Back to App
          </a>
        </div>
      </header>
      <div className="p-8">
        <div className="max-w-7xl mx-auto">
          <DataGrid
            {...dataGridProps}
            height={600}
            onColumnAdd={handleColumnAdd}
          />
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
    </div>
  );
}
