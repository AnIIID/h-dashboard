import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { listSessions, listPeers, getQueueStatus } from "@/lib/honcho";
import {
  fetchAllMessages,
  aggregateByDay,
  aggregateByHour,
  aggregateTokensByPeer,
} from "@/lib/analytics";
import {
  ActivityTimeline,
  TokensByPeerChart,
  HourlyActivityChart,
} from "@/components/charts/OverviewCharts";
import { MessageSquare, Users, Layers, Clock } from "lucide-react";

export const dynamic = "force-dynamic";

const metricCards = [
  { key: "sessions", label: "Sessions", icon: MessageSquare, accent: "text-chart-1" },
  { key: "peers", label: "Peers", icon: Users, accent: "text-chart-2" },
  { key: "queueTotal", label: "Queue Total", icon: Layers, accent: "text-chart-3" },
  { key: "queuePending", label: "Queue Pending", icon: Clock, accent: "text-chart-4" },
] as const;

export default async function OverviewPage() {
  const [sessions, peers, queue, msgData] = await Promise.all([
    listSessions().catch(() => []),
    listPeers().catch(() => []),
    getQueueStatus().catch(() => ({ totalWorkUnits: 0, pendingWorkUnits: 0 })),
    fetchAllMessages().catch(() => ({ sessions: [], messages: [] })),
  ]);

  const values: Record<string, number> = {
    sessions: Array.isArray(sessions) ? sessions.length : 0,
    peers: Array.isArray(peers) ? peers.length : 0,
    queueTotal: queue.totalWorkUnits ?? 0,
    queuePending: queue.pendingWorkUnits ?? 0,
  };

  const dayData = aggregateByDay(msgData.messages);
  const hourData = aggregateByHour(msgData.messages);
  const peerTokenData = aggregateTokensByPeer(msgData.messages);

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold tracking-tight">Overview</h2>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {metricCards.map(({ key, label, icon: Icon, accent }) => (
          <Card key={key}>
            <CardContent className="flex items-center gap-4 pt-4">
              <div className="rounded-lg bg-muted p-2.5">
                <Icon className={`h-5 w-5 ${accent}`} />
              </div>
              <div className="flex-1 text-right">
                <p className="text-sm font-medium text-muted-foreground">
                  {label}
                </p>
                <p className="text-3xl font-bold font-mono tabular-nums">
                  {values[key]}
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Activity Timeline — volle Breite */}
      <ActivityTimeline data={dayData} />

      {/* Token by Peer (2/3) + Hourly Activity (1/3) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          <TokensByPeerChart
            data={peerTokenData.data}
            peerIds={peerTokenData.peerIds}
          />
        </div>
        <div>
          <HourlyActivityChart data={hourData} />
        </div>
      </div>
    </div>
  );
}
