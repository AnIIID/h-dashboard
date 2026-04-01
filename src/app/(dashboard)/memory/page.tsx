import {
  listPeers,
  getPeerConclusions,
  getPeerRepresentation,
  getPeerCard,
} from "@/lib/honcho";
import {
  fetchAllMessages,
  getConclusionTypeCounts,
  getPeerStats,
} from "@/lib/analytics";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import DreamButton from "@/components/DreamButton";
import {
  ConclusionDonut,
  PeerComparisonBar,
} from "@/components/charts/MemoryCharts";

export const dynamic = "force-dynamic";

export default async function MemoryPage() {
  const peers = await listPeers().catch(() => []);
  const peerList = Array.isArray(peers) ? peers : [];

  // Parallel: Peer-Details, Conclusion-Types, Messages+PeerStats
  const [peerData, conclusionTypes, allMsgData] = await Promise.all([
    Promise.all(
      peerList.map(async (p: { id: string }) => {
        const [conclusions, representation, card] = await Promise.all([
          getPeerConclusions(p.id).catch(() => []),
          getPeerRepresentation(p.id).catch(() => null),
          getPeerCard(p.id).catch(() => null),
        ]);
        return {
          id: p.id,
          conclusions: Array.isArray(conclusions) ? conclusions : [],
          representation,
          card,
        };
      })
    ),
    getConclusionTypeCounts().catch(() => []),
    fetchAllMessages().catch(() => ({ sessions: [], messages: [] })),
  ]);

  const peerStats = await getPeerStats(
    allMsgData.sessions,
    allMsgData.messages
  ).catch(() => []);

  const totalConclusions = peerData.reduce(
    (sum, p) => sum + p.conclusions.length,
    0
  );

  // Hilfsfunktion: Peer-Card/Representation-Objekt lesbar anzeigen
  function formatContent(value: unknown): string {
    if (!value) return "";
    if (typeof value === "string") return value;
    if (typeof value === "object") {
      // Versuche relevante Felder zu extrahieren
      const obj = value as Record<string, unknown>;
      if (obj.content && typeof obj.content === "string") return obj.content;
      return JSON.stringify(value, null, 2);
    }
    return String(value);
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Memory</h2>
        <p className="text-muted-foreground mt-1">
          What Honcho has learned across all conversations.
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: "Peers tracked", value: peerData.length },
          { label: "Total conclusions", value: totalConclusions },
          {
            label: "Representations",
            value: peerData.filter((p) => p.representation).length,
          },
        ].map(({ label, value }) => (
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

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ConclusionDonut data={conclusionTypes} />
        <PeerComparisonBar data={peerStats} />
      </div>

      <Separator />

      {/* Peer Sections */}
      {peerData.length === 0 && (
        <p className="text-sm text-muted-foreground">Keine Peers vorhanden.</p>
      )}

      {peerData.map((peer) => (
        <div key={peer.id} className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Badge variant="secondary">{peer.id}</Badge>
            </h3>
            <DreamButton peerId={peer.id} />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Peer Card */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">Peer Card</CardTitle>
              </CardHeader>
              <CardContent>
                {peer.card ? (
                  <p className="text-sm whitespace-pre-wrap leading-relaxed">
                    {formatContent(peer.card)}
                  </p>
                ) : (
                  <p className="text-muted-foreground text-sm">Leer</p>
                )}
              </CardContent>
            </Card>

            {/* Representation */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">
                  Representation
                </CardTitle>
              </CardHeader>
              <CardContent>
                {peer.representation ? (
                  <p className="text-sm whitespace-pre-wrap leading-relaxed">
                    {formatContent(peer.representation)}
                  </p>
                ) : (
                  <p className="text-muted-foreground text-sm">Leer</p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Conclusions */}
          {peer.conclusions.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-muted-foreground">
                Conclusions ({peer.conclusions.length})
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {peer.conclusions.map(
                  (c: { id: string; content: string; type?: string }) => (
                    <Card key={c.id}>
                      <CardContent className="pt-4 pb-3">
                        <div className="flex items-start gap-2">
                          {c.type && (
                            <Badge variant="outline" className="shrink-0 mt-0.5">
                              {c.type}
                            </Badge>
                          )}
                          <p className="text-sm leading-relaxed">{c.content}</p>
                        </div>
                      </CardContent>
                    </Card>
                  )
                )}
              </div>
            </div>
          )}

          {peer.conclusions.length === 0 && (
            <p className="text-sm text-muted-foreground">
              Keine Conclusions vorhanden.
            </p>
          )}

          <Separator />
        </div>
      ))}
    </div>
  );
}
