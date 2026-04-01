"use client";

import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

// ── Donut: Conclusion Types ──────────────────────────────

const DONUT_COLORS = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
];

type ConclusionTypeData = { type: string; count: number };

export function ConclusionDonut({ data }: { data: ConclusionTypeData[] }) {
  if (!data.length) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">
            Conclusion Types
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Keine Daten</p>
        </CardContent>
      </Card>
    );
  }

  const chartConfig: ChartConfig = Object.fromEntries(
    data.map((d, i) => [
      d.type,
      {
        label: d.type,
        color: DONUT_COLORS[i % DONUT_COLORS.length],
      },
    ])
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium">Conclusion Types</CardTitle>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="mx-auto aspect-square max-h-[280px]">
          <PieChart>
            <ChartTooltip content={<ChartTooltipContent nameKey="type" />} />
            <Pie
              data={data}
              dataKey="count"
              nameKey="type"
              innerRadius="55%"
              outerRadius="85%"
              paddingAngle={2}
            >
              {data.map((entry, i) => (
                <Cell
                  key={entry.type}
                  fill={DONUT_COLORS[i % DONUT_COLORS.length]}
                />
              ))}
            </Pie>
            <ChartLegend content={<ChartLegendContent nameKey="type" />} />
          </PieChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}

// ── Bar Chart: Peer-Vergleich ────────────────────────────

type PeerStatsData = {
  id: string;
  sessions: number;
  messages: number;
  conclusions: number;
};

const peerBarConfig: ChartConfig = {
  sessions: { label: "Sessions", color: "var(--chart-1)" },
  messages: { label: "Messages", color: "var(--chart-2)" },
  conclusions: { label: "Conclusions", color: "var(--chart-3)" },
};

export function PeerComparisonBar({ data }: { data: PeerStatsData[] }) {
  if (!data.length) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">
            Peer-Vergleich
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Keine Daten</p>
        </CardContent>
      </Card>
    );
  }

  // Kürze Peer-IDs für Lesbarkeit
  const displayData = data.map((d) => ({
    ...d,
    name: d.id.slice(0, 8),
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium">Peer-Vergleich</CardTitle>
      </CardHeader>
      <CardContent>
        <ChartContainer config={peerBarConfig} className="aspect-video max-h-[300px]">
          <BarChart data={displayData} layout="horizontal">
            <CartesianGrid vertical={false} />
            <XAxis dataKey="name" tickLine={false} axisLine={false} fontSize={12} />
            <YAxis tickLine={false} axisLine={false} fontSize={12} />
            <ChartTooltip content={<ChartTooltipContent />} />
            <ChartLegend content={<ChartLegendContent />} />
            <Bar dataKey="sessions" fill="var(--color-sessions)" radius={[4, 4, 0, 0]} />
            <Bar dataKey="messages" fill="var(--color-messages)" radius={[4, 4, 0, 0]} />
            <Bar dataKey="conclusions" fill="var(--color-conclusions)" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}

// ── Area Chart: Memory-Wachstumskurve ───────────────────

type ConclusionGrowthData = { date: string; total: number };

const growthConfig: ChartConfig = {
  total: { label: "Gesamte Conclusions", color: "var(--chart-4)" },
};

export function ConclusionGrowthChart({ data }: { data: ConclusionGrowthData[] }) {
  if (!data.length) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">
            Gedächtnis-Wachstum
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Keine Daten</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium">Gedächtnis-Wachstum</CardTitle>
      </CardHeader>
      <CardContent>
        <ChartContainer config={growthConfig} className="aspect-video max-h-[300px]">
          <AreaChart data={data}>
            <defs>
              <linearGradient id="growthFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--color-total)" stopOpacity={0.3} />
                <stop offset="95%" stopColor="var(--color-total)" stopOpacity={0.05} />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="date"
              tickLine={false}
              axisLine={false}
              fontSize={12}
              tickFormatter={(v: string) => {
                const [, m, d] = v.split("-");
                return `${d}.${m}.`;
              }}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              fontSize={12}
              allowDecimals={false}
            />
            <ChartTooltip
              content={
                <ChartTooltipContent
                  labelFormatter={(v) => {
                    const s = String(v);
                    const [y, m, d] = s.split("-");
                    return `${d}.${m}.${y}`;
                  }}
                />
              }
            />
            <Area
              type="monotone"
              dataKey="total"
              stroke="var(--color-total)"
              strokeWidth={2}
              fill="url(#growthFill)"
            />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
