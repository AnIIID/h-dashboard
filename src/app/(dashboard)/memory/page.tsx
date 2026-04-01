import { listPeers, getPeerConclusions, getPeerRepresentation, getPeerCard } from "@/lib/honcho";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import DreamButton from "@/components/DreamButton";

export const dynamic = "force-dynamic";

export default async function MemoryPage() {
  const peers = await listPeers().catch(() => []);
  const peerList = Array.isArray(peers) ? peers : [];

  const peerData = await Promise.all(
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
  );

  const totalConclusions = peerData.reduce(
    (sum, p) => sum + p.conclusions.length,
    0
  );

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Memory</h2>
        <p className="text-muted-foreground mt-1">
          What Honcho has learned across all conversations.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Peers tracked
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold font-mono">{peerData.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total conclusions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold font-mono">{totalConclusions}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Representations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold font-mono">
              {peerData.filter((p) => p.representation).length}
            </p>
          </CardContent>
        </Card>
      </div>

      <Separator />

      {peerData.map((peer) => (
        <div key={peer.id} className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Badge variant="secondary">{peer.id}</Badge>
            </h3>
            <DreamButton peerId={peer.id} />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">
                  Peer Card
                </CardTitle>
              </CardHeader>
              <CardContent>
                {peer.card ? (
                  <pre className="text-sm font-mono whitespace-pre-wrap">
                    {typeof peer.card === "string"
                      ? peer.card
                      : JSON.stringify(peer.card, null, 2)}
                  </pre>
                ) : (
                  <p className="text-muted-foreground text-sm">Empty</p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">
                  Representation
                </CardTitle>
              </CardHeader>
              <CardContent>
                {peer.representation ? (
                  <pre className="text-sm font-mono whitespace-pre-wrap">
                    {typeof peer.representation === "string"
                      ? peer.representation
                      : JSON.stringify(peer.representation, null, 2)}
                  </pre>
                ) : (
                  <p className="text-muted-foreground text-sm">Empty</p>
                )}
              </CardContent>
            </Card>
          </div>

          {peer.conclusions.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-muted-foreground">
                Conclusions ({peer.conclusions.length})
              </h4>
              {peer.conclusions.map(
                (c: { id: string; content: string; type?: string }) => (
                  <Card key={c.id}>
                    <CardContent className="pt-4">
                      <p className="text-sm">{c.content}</p>
                      {c.type && (
                        <span className="text-xs text-muted-foreground font-mono">
                          {c.type}
                        </span>
                      )}
                    </CardContent>
                  </Card>
                )
              )}
            </div>
          )}

          <Separator />
        </div>
      ))}
    </div>
  );
}
