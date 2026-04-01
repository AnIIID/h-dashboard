import Link from "next/link";
import { listSessions, getSessionMessages } from "@/lib/honcho";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

export const dynamic = "force-dynamic";

interface Message {
  id: string;
  content: string;
  peer_id?: string;
  created_at?: string;
}

interface Session {
  id: string;
  is_active?: boolean;
  created_at?: string;
}

export default async function SessionsPage() {
  const sessions: Session[] = await listSessions().catch(() => []);

  const enriched = await Promise.all(
    sessions.map(async (s) => {
      const messages: Message[] = await getSessionMessages(s.id).catch(() => []);
      const peers = [...new Set(messages.map((m) => m.peer_id).filter(Boolean))];
      return {
        ...s,
        peers,
        messageCount: messages.length,
      };
    })
  );

  return (
    <div>
      <h2 className="text-2xl font-bold tracking-tight mb-6">Sessions</h2>
      {enriched.length === 0 ? (
        <p className="text-muted-foreground">No sessions found.</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Session ID</TableHead>
              <TableHead>Peers</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="text-right">Messages</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {enriched.map((s) => (
              <TableRow key={s.id}>
                <TableCell>
                  <Link
                    href={`/sessions/${s.id}`}
                    className="font-mono text-sm text-blue-600 hover:underline"
                  >
                    {s.id.slice(0, 8)}...
                  </Link>
                </TableCell>
                <TableCell className="space-x-1">
                  {s.peers.map((p) => (
                    <Badge key={p} variant="secondary">
                      {p}
                    </Badge>
                  ))}
                  {s.peers.length === 0 && (
                    <span className="text-muted-foreground text-sm">—</span>
                  )}
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {s.created_at
                    ? new Date(s.created_at).toLocaleString("de-DE")
                    : "—"}
                </TableCell>
                <TableCell className="text-right font-mono">
                  {s.messageCount}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
