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

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return "heute";
  if (days === 1) return "gestern";
  if (days < 30) return `vor ${days} Tagen`;
  return `vor ${Math.floor(days / 30)} Monaten`;
}

const peerColors = [
  "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
  "bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-200",
  "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
  "bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200",
  "bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-200",
];

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
      const messages: Message[] = await getSessionMessages(s.id).catch(
        () => []
      );
      const peers = [
        ...new Set(messages.map((m) => m.peer_id).filter(Boolean)),
      ];
      return {
        ...s,
        peers,
        messageCount: messages.length,
      };
    })
  );

  // Neueste Sessions zuerst (nach created_at absteigend)
  enriched.sort((a, b) => {
    if (!a.created_at || !b.created_at) return 0;
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });

  const totalSessions = enriched.length;
  const activeSessions = enriched.filter((s) => s.is_active).length;
  const totalMessages = enriched.reduce((sum, s) => sum + s.messageCount, 0);
  const maxMessages = Math.max(...enriched.map((s) => s.messageCount), 1);

  // Stabile Farbzuweisung pro Peer
  const allPeers = [...new Set(enriched.flatMap((s) => s.peers))];
  const peerColorMap = new Map<string, string>();
  allPeers.forEach((p, i) => {
    peerColorMap.set(p!, peerColors[i % peerColors.length]);
  });

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Sessions</h2>
        {totalSessions > 0 && (
          <p className="text-muted-foreground mt-1 text-sm">
            {totalSessions} Sessions, {activeSessions} aktiv, {totalMessages}{" "}
            Messages gesamt
          </p>
        )}
      </div>

      {enriched.length === 0 ? (
        <p className="text-muted-foreground">Keine Sessions gefunden.</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-10">Status</TableHead>
              <TableHead>Session ID</TableHead>
              <TableHead>Peers</TableHead>
              <TableHead>Erstellt</TableHead>
              <TableHead className="text-right">Messages</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {enriched.map((s) => (
              <TableRow key={s.id}>
                {/* Status Dot */}
                <TableCell>
                  <span
                    className={`inline-block h-2.5 w-2.5 rounded-full ${
                      s.is_active
                        ? "bg-green-500"
                        : "bg-muted-foreground/30"
                    }`}
                    title={s.is_active ? "Aktiv" : "Inaktiv"}
                  />
                </TableCell>
                {/* Session ID gekürzt */}
                <TableCell>
                  <Link
                    href={`/sessions/${s.id}`}
                    className="font-mono text-sm text-blue-600 hover:underline"
                  >
                    {s.id.slice(0, 8)}
                  </Link>
                </TableCell>
                {/* Farbige Peer-Badges */}
                <TableCell>
                  <div className="flex flex-wrap gap-1">
                    {s.peers.map((p) => (
                      <span
                        key={p}
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                          peerColorMap.get(p!) ?? peerColors[0]
                        }`}
                      >
                        {p}
                      </span>
                    ))}
                    {s.peers.length === 0 && (
                      <span className="text-muted-foreground text-sm">
                        —
                      </span>
                    )}
                  </div>
                </TableCell>
                {/* Datum relativ + Tooltip */}
                <TableCell
                  className="text-sm text-muted-foreground"
                  title={
                    s.created_at
                      ? new Date(s.created_at).toLocaleString("de-DE")
                      : undefined
                  }
                >
                  {s.created_at ? timeAgo(s.created_at) : "—"}
                </TableCell>
                {/* Message Count mit Mini-Bar */}
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-2">
                    <div className="w-20 h-2 rounded-full bg-muted overflow-hidden">
                      <div
                        className="h-full bg-blue-500 rounded-full transition-all"
                        style={{
                          width: `${(s.messageCount / maxMessages) * 100}%`,
                        }}
                      />
                    </div>
                    <span className="font-mono text-sm w-8 text-right">
                      {s.messageCount}
                    </span>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
