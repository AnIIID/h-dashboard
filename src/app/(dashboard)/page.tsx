import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { listSessions, listPeers, getQueueStatus } from "@/lib/honcho";

export const dynamic = "force-dynamic";

export default async function OverviewPage() {
  const [sessions, peers, queue] = await Promise.all([
    listSessions().catch(() => []),
    listPeers().catch(() => []),
    getQueueStatus().catch(() => ({ totalWorkUnits: 0, pendingWorkUnits: 0 })),
  ]);

  const stats = [
    { label: "Sessions", value: Array.isArray(sessions) ? sessions.length : 0 },
    { label: "Peers", value: Array.isArray(peers) ? peers.length : 0 },
    { label: "Queue Total", value: queue.totalWorkUnits ?? 0 },
    { label: "Queue Pending", value: queue.pendingWorkUnits ?? 0 },
  ];

  return (
    <div>
      <h2 className="text-2xl font-bold tracking-tight mb-6">Overview</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map(({ label, value }) => (
          <Card key={label}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {label}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold font-mono">{value}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
