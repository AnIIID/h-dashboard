import { getSessionMessages, getSessionContext } from "@/lib/honcho";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

export const dynamic = "force-dynamic";

interface Message {
  id: string;
  content: string;
  peer_id?: string;
  created_at?: string;
  token_count?: number;
  metadata?: Record<string, unknown>;
}

export default async function SessionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const [messages, context] = await Promise.all([
    getSessionMessages(id).catch(() => []),
    getSessionContext(id).catch(() => null),
  ]);

  const msgList: Message[] = Array.isArray(messages) ? messages : [];
  const peers = [...new Set(msgList.map((m) => m.peer_id).filter(Boolean))];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Session</h2>
        <p className="font-mono text-sm text-muted-foreground mt-1">{id}</p>
      </div>

      <div className="flex gap-2">
        {peers.map((p) => (
          <Badge key={p} variant="secondary">
            {p}
          </Badge>
        ))}
        {peers.length === 0 && (
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
            {msgList.map((msg) => (
              <Card key={msg.id}>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-xs font-mono text-muted-foreground">
                      {msg.peer_id && (
                        <Badge variant="secondary" className="mr-2">
                          {msg.peer_id}
                        </Badge>
                      )}
                      {msg.id}
                    </CardTitle>
                    <span className="text-xs text-muted-foreground">
                      {msg.created_at
                        ? new Date(msg.created_at).toLocaleString("de-DE")
                        : ""}
                      {msg.token_count != null && (
                        <span className="ml-2 font-mono">
                          {msg.token_count} tokens
                        </span>
                      )}
                    </span>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                </CardContent>
              </Card>
            ))}
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
