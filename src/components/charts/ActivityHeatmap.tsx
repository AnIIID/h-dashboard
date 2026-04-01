"use client";

import { useMemo, useState, useRef, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { DayActivity } from "@/lib/analytics";

// ── Konstanten ────────────────────────────────────────────

const CELL_SIZE = 13;
const CELL_GAP = 3;
const CELL_STEP = CELL_SIZE + CELL_GAP;
const WEEKS = 53;
const DAYS_PER_WEEK = 7;
const LABEL_WIDTH = 28;
const TOP_PADDING = 20;

const WEEKDAY_LABELS: [number, string][] = [
  [1, "Mo"],
  [3, "Mi"],
  [5, "Fr"],
];

const MONTH_NAMES = [
  "Jan", "Feb", "Mär", "Apr", "Mai", "Jun",
  "Jul", "Aug", "Sep", "Okt", "Nov", "Dez",
];

// 5 Farbstufen: oklch-basiert, Hue 265 (passend zu --chart-1)
// Stufe 0 = leer (muted background)
const LEVELS = 5;

function getLevelColor(level: number): string {
  switch (level) {
    case 0: return "var(--color-heatmap-empty, oklch(0.25 0.01 265))";
    case 1: return "oklch(0.40 0.08 265)";
    case 2: return "oklch(0.48 0.13 265)";
    case 3: return "oklch(0.56 0.17 265)";
    case 4: return "oklch(0.65 0.22 265)";
    default: return "oklch(0.65 0.22 265)";
  }
}

function getLevel(count: number, max: number): number {
  if (count === 0) return 0;
  if (max === 0) return 0;
  const ratio = count / max;
  if (ratio <= 0.25) return 1;
  if (ratio <= 0.50) return 2;
  if (ratio <= 0.75) return 3;
  return 4;
}

function formatDate(d: Date): string {
  const day = d.getDate();
  const month = MONTH_NAMES[d.getMonth()];
  const year = d.getFullYear();
  return `${day}. ${month} ${year}`;
}

// ── Komponente ────────────────────────────────────────────

type TooltipData = {
  x: number;
  y: number;
  date: string;
  count: number;
};

export function ActivityHeatmap({ data }: { data: DayActivity[] }) {
  const [tooltip, setTooltip] = useState<TooltipData | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  // Daten-Map: "YYYY-MM-DD" → messages
  const dataMap = useMemo(() => {
    const map = new Map<string, number>();
    for (const d of data) {
      map.set(d.date, d.messages);
    }
    return map;
  }, [data]);

  // Grid berechnen: 53 Wochen rückwärts ab heute
  const { cells, monthLabels, maxCount } = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Startdatum: 52 Wochen + restliche Tage bis Sonntag zurück
    const todayDow = (today.getDay() + 6) % 7; // Mo=0
    const start = new Date(today);
    start.setDate(start.getDate() - (WEEKS - 1) * 7 - todayDow);

    const cellList: {
      date: Date;
      dateStr: string;
      week: number;
      day: number;
      count: number;
    }[] = [];

    let mCount = 0;
    const current = new Date(start);

    while (current <= today) {
      const dateStr = current.toISOString().slice(0, 10);
      const dow = (current.getDay() + 6) % 7; // Mo=0
      const diffDays = Math.floor(
        (current.getTime() - start.getTime()) / 86400000
      );
      const week = Math.floor(diffDays / 7);
      const count = dataMap.get(dateStr) || 0;
      if (count > mCount) mCount = count;

      cellList.push({
        date: new Date(current),
        dateStr,
        week,
        day: dow,
        count,
      });
      current.setDate(current.getDate() + 1);
    }

    // Monatslabels: Erstes Auftreten eines Monats in Woche
    const seenMonths = new Set<number>();
    const labels: { week: number; label: string }[] = [];
    for (const cell of cellList) {
      const m = cell.date.getMonth();
      if (!seenMonths.has(m) && cell.day === 0) {
        seenMonths.add(m);
        labels.push({ week: cell.week, label: MONTH_NAMES[m] });
      }
    }

    return { cells: cellList, monthLabels: labels, maxCount: mCount };
  }, [dataMap]);

  const handleMouseEnter = useCallback(
    (e: React.MouseEvent<SVGRectElement>, dateStr: string, count: number) => {
      if (!svgRef.current) return;
      const rect = svgRef.current.getBoundingClientRect();
      const targetRect = (e.target as SVGRectElement).getBoundingClientRect();
      setTooltip({
        x: targetRect.left - rect.left + CELL_SIZE / 2,
        y: targetRect.top - rect.top - 8,
        date: dateStr,
        count,
      });
    },
    []
  );

  const handleMouseLeave = useCallback(() => {
    setTooltip(null);
  }, []);

  const svgWidth = LABEL_WIDTH + WEEKS * CELL_STEP;
  const svgHeight = TOP_PADDING + DAYS_PER_WEEK * CELL_STEP;

  if (!data.length) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Aktivität</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground py-12 text-center">
            Keine Daten verfügbar
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Aktivität</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <div className="relative inline-block">
            <svg
              ref={svgRef}
              width={svgWidth}
              height={svgHeight}
              className="block"
            >
              {/* Monatslabels oben */}
              {monthLabels.map(({ week, label }) => (
                <text
                  key={`month-${week}`}
                  x={LABEL_WIDTH + week * CELL_STEP}
                  y={12}
                  className="fill-muted-foreground"
                  fontSize={11}
                >
                  {label}
                </text>
              ))}

              {/* Wochentags-Labels links */}
              {WEEKDAY_LABELS.map(([dayIdx, label]) => (
                <text
                  key={`dow-${dayIdx}`}
                  x={0}
                  y={TOP_PADDING + dayIdx * CELL_STEP + CELL_SIZE - 2}
                  className="fill-muted-foreground"
                  fontSize={11}
                >
                  {label}
                </text>
              ))}

              {/* Zellen */}
              {cells.map((cell) => {
                const level = getLevel(cell.count, maxCount);
                return (
                  <rect
                    key={cell.dateStr}
                    x={LABEL_WIDTH + cell.week * CELL_STEP}
                    y={TOP_PADDING + cell.day * CELL_STEP}
                    width={CELL_SIZE}
                    height={CELL_SIZE}
                    rx={2}
                    ry={2}
                    fill={getLevelColor(level)}
                    className="transition-colors duration-100"
                    onMouseEnter={(e) =>
                      handleMouseEnter(e, cell.dateStr, cell.count)
                    }
                    onMouseLeave={handleMouseLeave}
                  />
                );
              })}
            </svg>

            {/* Tooltip */}
            {tooltip && (
              <div
                className="absolute pointer-events-none z-50 rounded-md border bg-popover px-3 py-1.5 text-sm text-popover-foreground shadow-md"
                style={{
                  left: tooltip.x,
                  top: tooltip.y,
                  transform: "translate(-50%, -100%)",
                }}
              >
                <span className="font-semibold">{tooltip.count} Messages</span>
                {" am "}
                {formatDate(new Date(tooltip.date + "T00:00:00"))}
              </div>
            )}

            {/* Legende */}
            <div className="flex items-center gap-1.5 mt-2 text-xs text-muted-foreground">
              <span>Weniger</span>
              {Array.from({ length: LEVELS }, (_, i) => (
                <span
                  key={i}
                  className="inline-block rounded-sm"
                  style={{
                    width: CELL_SIZE,
                    height: CELL_SIZE,
                    backgroundColor: getLevelColor(i),
                  }}
                />
              ))}
              <span>Mehr</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
