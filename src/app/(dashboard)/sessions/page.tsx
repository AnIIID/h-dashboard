import Link from "next/link";
import { listSessions, getSessionPeers, getSessionMessages } from "@/lib/honcho";
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

export default async function SessionsPage() {
  const sessions = await listSessions().catch(() => []);
  const list = Array.isArray(sessions) ? sessions : [];

  const enriched = await Promise.all(
    list.map(async (s: { id: string }) => {
      const [peers, messages] = await Promise.all([
        getSessionPeers(s.id).catch(() => []),
        getSessionMessages(s.id).catch(() => []),
      ]);
      return {
        id: s.id,
        peers: Array.isArray(peers) ? peers : [],
        messageCount: Array.isArray(messages) ? messages.length : 0,
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
                  {s.peers.map((p: string) => (
                    <Badge key={p} variant="secondary">
                      {p}
                    </Badge>
                  ))}
                  {s.peers.length === 0 && (
                    <span className="text-muted-foreground text-sm">—</span>
                  )}
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
