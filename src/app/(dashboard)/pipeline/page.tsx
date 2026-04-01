import { getQueueStatus } from "@/lib/honcho";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

export const dynamic = "force-dynamic";

const agents = [
  {
    name: "Deriver",
    description: "Extracts conclusions and observations from messages as they arrive.",
    status: "active",
  },
  {
    name: "Dialectic",
    description: "Answers natural language queries about any peer using accumulated knowledge.",
    status: "active",
  },
  {
    name: "Dreamer",
    description: "Consolidates memory in the background — deduplicates, prunes, and builds peer cards.",
    status: "background",
  },
];

export default async function PipelinePage() {
  const queue = await getQueueStatus().catch(() => ({
    totalWorkUnits: 0,
    completedWorkUnits: 0,
    inProgressWorkUnits: 0,
    pendingWorkUnits: 0,
    sessions: {},
  }));

  const sessionQueues = queue.sessions
    ? Object.entries(queue.sessions)
    : [];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Pipeline</h2>
        <p className="text-muted-foreground mt-1">
          Processing agents and queue status.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Work Units
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold font-mono">
              {queue.totalWorkUnits ?? 0}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Completed
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold font-mono text-green-600">
              {queue.completedWorkUnits ?? 0}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              In Progress
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold font-mono text-blue-600">
              {queue.inProgressWorkUnits ?? 0}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Pending
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold font-mono text-amber-600">
              {queue.pendingWorkUnits ?? 0}
            </p>
          </CardContent>
        </Card>
      </div>

      <Separator />

      <div>
        <h3 className="text-lg font-semibold mb-4">Agents</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {agents.map((agent) => (
            <Card key={agent.name}>
              <CardHeader>
                <CardTitle className="text-sm font-medium flex items-center justify-between">
                  {agent.name}
                  <Badge
                    variant={
                      agent.status === "active" ? "default" : "secondary"
                    }
                  >
                    {agent.status}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  {agent.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {sessionQueues.length > 0 && (
        <>
          <Separator />
          <div>
            <h3 className="text-lg font-semibold mb-4">
              Session Queues ({sessionQueues.length})
            </h3>
            <div className="space-y-2">
              {sessionQueues.map(
                ([sessionId, data]: [string, unknown]) => {
                  const d = data as {
                    totalWorkUnits: number;
                    completedWorkUnits: number;
                    pendingWorkUnits: number;
                  };
                  return (
                    <Card key={sessionId}>
                      <CardContent className="pt-4 flex items-center justify-between">
                        <span className="font-mono text-sm">
                          {sessionId.slice(0, 20)}...
                        </span>
                        <div className="flex gap-3 text-sm">
                          <span className="text-green-600">
                            {d.completedWorkUnits} done
                          </span>
                          <span className="text-amber-600">
                            {d.pendingWorkUnits} pending
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  );
                }
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
