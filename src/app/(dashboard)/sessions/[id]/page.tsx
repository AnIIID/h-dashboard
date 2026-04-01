import { getSessionMessages, getSessionPeers, getSessionContext } from "@/lib/honcho";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

export const dynamic = "force-dynamic";

export default async function SessionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const [messages, peers, context] = await Promise.all([
    getSessionMessages(id).catch(() => []),
    getSessionPeers(id).catch(() => []),
    getSessionContext(id).catch(() => null),
  ]);

  const msgList = Array.isArray(messages) ? messages : [];
  const peerList = Array.isArray(peers) ? peers : [];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Session</h2>
        <p className="font-mono text-sm text-muted-foreground mt-1">{id}</p>
      </div>

      <div className="flex gap-2">
        {peerList.map((p: string) => (
          <Badge key={p} variant="secondary">
            {p}
          </Badge>
        ))}
        {peerList.length === 0 && (
          <span className="text-sm text-muted-foreground">No peers</span>
        )}
      </div>

      <Separator />

      <div>
        <h3 className="text-lg font-semibold mb-4">
          Messages ({msgList.length})
        </h3>
        {msgList.length === 0 ? (
          <p className="text-muted-foreground">No messages in this session.</p>
        ) : (
          <div className="space-y-3">
            {msgList.map(
              (msg: { id: string; content: string; metadata?: Record<string, unknown> }) => (
                <Card key={msg.id}>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-xs font-mono text-muted-foreground">
                      {msg.id}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                    {msg.metadata &&
                      Object.keys(msg.metadata).length > 0 && (
                        <pre className="mt-2 text-xs font-mono bg-gray-50 p-2 overflow-x-auto">
                          {JSON.stringify(msg.metadata, null, 2)}
                        </pre>
                      )}
                  </CardContent>
                </Card>
              )
            )}
          </div>
        )}
      </div>

      {context && (
        <>
          <Separator />
          <div>
            <h3 className="text-lg font-semibold mb-4">Context</h3>
            <pre className="text-xs font-mono bg-gray-50 p-4 overflow-x-auto">
              {JSON.stringify(context, null, 2)}
            </pre>
          </div>
        </>
      )}
    </div>
  );
}
