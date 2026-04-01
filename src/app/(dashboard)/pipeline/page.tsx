import { getQueueStatus } from "@/lib/honcho";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

export const dynamic = "force-dynamic";

const agents = [
  {
    name: "Deriver",
    icon: "🔍",
    description:
      "Extrahiert Schlussfolgerungen und Beobachtungen aus eingehenden Nachrichten.",
    role: "realtime" as const,
  },
  {
    name: "Dialectic",
    icon: "💬",
    description:
      "Beantwortet natürlichsprachliche Fragen über Peers anhand des gesammelten Wissens.",
    role: "realtime" as const,
  },
  {
    name: "Dreamer",
    icon: "🌙",
    description:
      "Konsolidiert Memory im Hintergrund — dedupliziert, bereinigt und erstellt Peer-Cards.",
    role: "background" as const,
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

  const total = queue.totalWorkUnits ?? 0;
  const completed = queue.completedWorkUnits ?? 0;
  const inProgress = queue.inProgressWorkUnits ?? 0;
  const pending = queue.pendingWorkUnits ?? 0;

  const pctCompleted = total > 0 ? (completed / total) * 100 : 0;
  const pctInProgress = total > 0 ? (inProgress / total) * 100 : 0;
  const pctPending = total > 0 ? (pending / total) * 100 : 0;

  const hasActivity = inProgress > 0 || pending > 0;

  const sessionQueues = queue.sessions
    ? Object.entries(queue.sessions)
    : [];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Pipeline</h2>
        <p className="text-muted-foreground mt-1">
          Verarbeitungs-Agents und Queue-Status.
        </p>
      </div>

      {/* Queue-Status Progress Bar */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Queue-Status
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {total === 0 ? (
            <p className="text-sm text-muted-foreground">
              Keine Work Units in der Queue.
            </p>
          ) : (
            <>
              {/* Progress Bar */}
              <div className="h-6 w-full rounded-full bg-muted overflow-hidden flex">
                {pctCompleted > 0 && (
                  <div
                    className="h-full bg-green-500 transition-all duration-500"
                    style={{ width: `${pctCompleted}%` }}
                  />
                )}
                {pctInProgress > 0 && (
                  <div
                    className="h-full bg-blue-500 transition-all duration-500"
                    style={{ width: `${pctInProgress}%` }}
                  />
                )}
                {pctPending > 0 && (
                  <div
                    className="h-full bg-amber-500 transition-all duration-500"
                    style={{ width: `${pctPending}%` }}
                  />
                )}
              </div>

              {/* Prozent + Labels */}
              <div className="flex items-center justify-between text-sm">
                <div className="flex gap-4">
                  <span className="flex items-center gap-1.5">
                    <span className="inline-block h-2.5 w-2.5 rounded-full bg-green-500" />
                    <span className="text-muted-foreground">Completed</span>
                    <span className="font-mono font-semibold">
                      {completed}
                    </span>
                    <span className="text-muted-foreground text-xs">
                      ({pctCompleted.toFixed(0)}%)
                    </span>
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="inline-block h-2.5 w-2.5 rounded-full bg-blue-500" />
                    <span className="text-muted-foreground">In Progress</span>
                    <span className="font-mono font-semibold">
                      {inProgress}
                    </span>
                    <span className="text-muted-foreground text-xs">
                      ({pctInProgress.toFixed(0)}%)
                    </span>
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="inline-block h-2.5 w-2.5 rounded-full bg-amber-500" />
                    <span className="text-muted-foreground">Pending</span>
                    <span className="font-mono font-semibold">{pending}</span>
                    <span className="text-muted-foreground text-xs">
                      ({pctPending.toFixed(0)}%)
                    </span>
                  </span>
                </div>
                <span className="font-mono text-muted-foreground">
                  {total} gesamt
                </span>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <Separator />

      {/* Agents */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Agents</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {agents.map((agent) => {
            const isActive =
              agent.role === "realtime" ? hasActivity : pending > 0;
            return (
              <Card key={agent.name}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <span className="text-lg">{agent.icon}</span>
                      {agent.name}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span
                        className={`inline-block h-2 w-2 rounded-full ${
                          isActive ? "bg-green-500 animate-pulse" : "bg-muted-foreground/30"
                        }`}
                      />
                      <Badge
                        variant={isActive ? "default" : "secondary"}
                        className="text-[10px]"
                      >
                        {isActive ? "aktiv" : "inaktiv"}
                      </Badge>
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    {agent.description}
                  </p>
                  <p className="text-xs text-muted-foreground/60 mt-2">
                    {agent.role === "realtime"
                      ? "Echtzeit-Verarbeitung"
                      : "Hintergrund-Verarbeitung"}
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Session Queue Breakdown */}
      {sessionQueues.length > 0 && (
        <>
          <Separator />
          <div>
            <h3 className="text-lg font-semibold mb-4">
              Session-Queues ({sessionQueues.length})
            </h3>
            <div className="space-y-2">
              {sessionQueues.map(
                ([sessionId, data]: [string, unknown]) => {
                  const d = data as {
                    totalWorkUnits: number;
                    completedWorkUnits: number;
                    pendingWorkUnits: number;
                  };
                  const sTotal = d.totalWorkUnits || 1;
                  const sPctCompleted =
                    (d.completedWorkUnits / sTotal) * 100;
                  const sPctPending =
                    (d.pendingWorkUnits / sTotal) * 100;
                  return (
                    <Card key={sessionId}>
                      <CardContent className="pt-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-mono text-sm">
                            {sessionId.slice(0, 12)}...
                          </span>
                          <div className="flex gap-3 text-xs text-muted-foreground">
                            <span>
                              <span className="text-green-600 font-semibold">
                                {d.completedWorkUnits}
                              </span>{" "}
                              done
                            </span>
                            <span>
                              <span className="text-amber-600 font-semibold">
                                {d.pendingWorkUnits}
                              </span>{" "}
                              pending
                            </span>
                          </div>
                        </div>
                        {/* Mini Progress Bar */}
                        <div className="h-2 w-full rounded-full bg-muted overflow-hidden flex">
                          {sPctCompleted > 0 && (
                            <div
                              className="h-full bg-green-500"
                              style={{ width: `${sPctCompleted}%` }}
                            />
                          )}
                          {sPctPending > 0 && (
                            <div
                              className="h-full bg-amber-500"
                              style={{ width: `${sPctPending}%` }}
                            />
                          )}
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
