import Link from "next/link";
import {
  listPeers,
  listSessions,
  getSessionMessages,
  getPeerConclusions,
  getPeerCard,
} from "@/lib/honcho";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Bot, Brain, MessageSquare, FileText } from "lucide-react";

export const dynamic = "force-dynamic";

/** Bekannte AI-Peers mit Zusatzinfos — wird durch Honcho-Metadata ergänzt, sobald vorhanden */
const knownAgents: Record<
  string,
  { label: string; model?: string; description: string; icon: string }
> = {
  "claude-code": {
    label: "Claude Code",
    model: "Claude Opus 4.6",
    description:
      "Coding-Agent für Entwicklung, Debugging und Infrastruktur-Aufgaben.",
    icon: "🛠️",
  },
  Assistant: {
    label: "Assistant",
    model: "Claude (Chat)",
    description:
      "Konversations-Agent für allgemeine Fragen und Dialoge.",
    icon: "💬",
  },
  hermes: {
    label: "Hermes",
    model: "Honcho Intern",
    description:
      "Interner Honcho-Agent für Memory-Verarbeitung und Wissensextraktion.",
    icon: "⚡",
  },
};

interface Message {
  peer_id?: string;
}

interface Session {
  id: string;
}

export default async function AIPage() {
  const [peers, sessions] = await Promise.all([
    listPeers().catch(() => []),
    listSessions().catch(() => []),
  ]);

  const peerList = (Array.isArray(peers) ? peers : []) as { id: string }[];
  const sessionList = (Array.isArray(sessions) ? sessions : []) as Session[];

  // AI-Peers filtern (alles ausser dem User "andre")
  const aiPeers = peerList.filter((p) => p.id !== "andre");

  // Conclusions pro Peer laden
  const conclusionsMap = new Map<string, number>();
  await Promise.all(
    aiPeers.map(async (p) => {
      const concl = await getPeerConclusions(p.id).catch(() => []);
      conclusionsMap.set(p.id, Array.isArray(concl) ? concl.length : 0);
    })
  );

  // Sessions pro Peer zählen (aus Messages)
  const sessionCountMap = new Map<string, number>();
  await Promise.all(
    sessionList.map(async (s) => {
      const msgs: Message[] = await getSessionMessages(s.id).catch(() => []);
      const peerIds = new Set(msgs.map((m) => m.peer_id).filter(Boolean));
      for (const pid of peerIds) {
        if (pid && aiPeers.some((ap) => ap.id === pid)) {
          sessionCountMap.set(pid, (sessionCountMap.get(pid) || 0) + 1);
        }
      }
    })
  );

  // Peer Cards laden
  const cardMap = new Map<string, string[] | null>();
  await Promise.all(
    aiPeers.map(async (p) => {
      const card = await getPeerCard(p.id).catch(() => null);
      cardMap.set(p.id, card);
    })
  );

  // Gesamt-Stats
  const totalConclusions = Array.from(conclusionsMap.values()).reduce(
    (a, b) => a + b,
    0
  );
  const totalSessions = new Set(
    Array.from(sessionCountMap.entries()).flatMap(([, count]) =>
      Array(count).fill(null)
    )
  ).size;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">AI-Modelle</h2>
        <p className="text-muted-foreground mt-1">
          Übersicht der aktiven KI-Agenten und ihre Aufgaben im Workspace.
        </p>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Bot className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-2xl font-bold">{aiPeers.length}</p>
                <p className="text-xs text-muted-foreground">Agenten</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <FileText className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-2xl font-bold">{totalConclusions}</p>
                <p className="text-xs text-muted-foreground">Conclusions</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <MessageSquare className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-2xl font-bold">{sessionList.length}</p>
                <p className="text-xs text-muted-foreground">Sessions</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Separator />

      {/* Agent Cards */}
      {aiPeers.length === 0 ? (
        <p className="text-muted-foreground">Keine AI-Agenten gefunden.</p>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
          {aiPeers.map((p) => {
            const info = knownAgents[p.id];
            const conclusions = conclusionsMap.get(p.id) || 0;
            const sessionCount = sessionCountMap.get(p.id) || 0;
            const card = cardMap.get(p.id);

            return (
              <Link key={p.id} href={`/peers/${p.id}`} className="group">
                <Card className="transition-colors group-hover:border-primary/40 h-full">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">
                          {info?.icon ?? "🤖"}
                        </span>
                        <div>
                          <CardTitle className="text-base">
                            {info?.label ?? p.id}
                          </CardTitle>
                          {info?.model && (
                            <p className="text-xs text-muted-foreground font-mono mt-0.5">
                              {info.model}
                            </p>
                          )}
                        </div>
                      </div>
                      <Badge
                        variant="outline"
                        className="text-xs font-mono shrink-0"
                      >
                        {p.id}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-sm text-muted-foreground">
                      {info?.description ??
                        "AI-Agent im Workspace — keine Beschreibung hinterlegt."}
                    </p>

                    {/* Peer Card Facts */}
                    {card && Array.isArray(card) && card.length > 0 && (
                      <div className="space-y-1">
                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                          Peer Card
                        </p>
                        <ul className="text-xs text-muted-foreground space-y-0.5">
                          {card.slice(0, 3).map((fact, i) => (
                            <li key={i} className="truncate">
                              • {fact}
                            </li>
                          ))}
                          {card.length > 3 && (
                            <li className="text-muted-foreground/60">
                              +{card.length - 3} weitere
                            </li>
                          )}
                        </ul>
                      </div>
                    )}

                    {/* Stats */}
                    <div className="flex items-center gap-4 pt-2 border-t">
                      <div className="flex items-center gap-1.5">
                        <Brain className="h-3.5 w-3.5 text-muted-foreground" />
                        <span className="text-sm font-medium">
                          {conclusions}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          Conclusions
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <MessageSquare className="h-3.5 w-3.5 text-muted-foreground" />
                        <span className="text-sm font-medium">
                          {sessionCount}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          Sessions
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
