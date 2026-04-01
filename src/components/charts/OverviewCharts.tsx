"use client";

import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { DayActivity, HourActivity, PeerTokens } from "@/lib/analytics";

// ── Activity Timeline (Line Chart) ───────────────────────

const activityConfig = {
  messages: { label: "Messages", color: "var(--chart-1)" },
  tokens: { label: "Tokens", color: "var(--chart-2)" },
} satisfies ChartConfig;

export function ActivityTimeline({ data }: { data: DayActivity[] }) {
  if (!data.length) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Aktivitaet</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground py-12 text-center">
            Keine Daten verfuegbar
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Aktivitaet</CardTitle>
      </CardHeader>
      <CardContent>
        <ChartContainer config={activityConfig} className="aspect-[4/1] w-full">
          <LineChart data={data} accessibilityLayer>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="date"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              tickFormatter={(v: string) => v.slice(5)}
            />
            <YAxis
              yAxisId="left"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
            />
            <YAxis
              yAxisId="right"
              orientation="right"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
            />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Line
              yAxisId="left"
              type="monotone"
              dataKey="messages"
              stroke="var(--color-messages)"
              strokeWidth={2}
              dot={false}
            />
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="tokens"
              stroke="var(--color-tokens)"
              strokeWidth={2}
              dot={false}
            />
          </LineChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}

// ── Token Usage by Peer (Stacked Area Chart) ─────────────

const CHART_COLORS = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
];

export function TokensByPeerChart({
  data,
  peerIds,
}: {
  data: PeerTokens[];
  peerIds: string[];
}) {
  if (!data.length) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Token-Verbrauch nach Peer</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground py-12 text-center">
            Keine Daten verfuegbar
          </p>
        </CardContent>
      </Card>
    );
  }

  const config: ChartConfig = {};
  for (let i = 0; i < peerIds.length; i++) {
    const id = peerIds[i];
    config[id] = {
      label: id.slice(0, 8),
      color: CHART_COLORS[i % CHART_COLORS.length],
    };
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Token-Verbrauch nach Peer</CardTitle>
      </CardHeader>
      <CardContent>
        <ChartContainer config={config} className="aspect-[3/2] w-full">
          <AreaChart data={data} accessibilityLayer>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="date"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              tickFormatter={(v: string) => v.slice(5)}
            />
            <YAxis tickLine={false} axisLine={false} tickMargin={8} />
            <ChartTooltip content={<ChartTooltipContent indicator="dot" />} />
            {peerIds.map((id) => (
              <Area
                key={id}
                type="monotone"
                dataKey={id}
                stackId="tokens"
                fill={`var(--color-${id})`}
                stroke={`var(--color-${id})`}
                fillOpacity={0.4}
              />
            ))}
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}

// ── Activity by Hour (Bar Chart) ─────────────────────────

const hourConfig = {
  count: { label: "Messages", color: "var(--chart-3)" },
} satisfies ChartConfig;

export function HourlyActivityChart({ data }: { data: HourActivity[] }) {
  const hasData = data.some((d) => d.count > 0);

  if (!hasData) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Aktivitaet nach Stunde</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground py-12 text-center">
            Keine Daten verfuegbar
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Aktivitaet nach Stunde</CardTitle>
      </CardHeader>
      <CardContent>
        <ChartContainer config={hourConfig} className="aspect-[3/2] w-full">
          <BarChart data={data} accessibilityLayer>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="hour"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              tickFormatter={(v: number) => `${v}h`}
            />
            <YAxis tickLine={false} axisLine={false} tickMargin={8} />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Bar
              dataKey="count"
              fill="var(--color-count)"
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
