import {
  getPeerCard,
  getPeerRepresentation,
  getPeerConclusions,
} from "@/lib/honcho";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

export const dynamic = "force-dynamic";

export default async function PeerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const [card, representation, conclusions] = await Promise.all([
    getPeerCard(id).catch(() => null),
    getPeerRepresentation(id).catch(() => null),
    getPeerConclusions(id).catch(() => []),
  ]);

  const conclList = Array.isArray(conclusions) ? conclusions : [];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Peer</h2>
        <p className="font-mono text-sm text-muted-foreground mt-1">{id}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Peer Card</CardTitle>
          </CardHeader>
          <CardContent>
            {card ? (
              <pre className="text-sm font-mono whitespace-pre-wrap">
                {typeof card === "string" ? card : JSON.stringify(card, null, 2)}
              </pre>
            ) : (
              <p className="text-muted-foreground text-sm">
                No peer card yet.
              </p>
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
            {representation ? (
              <pre className="text-sm font-mono whitespace-pre-wrap">
                {typeof representation === "string"
                  ? representation
                  : JSON.stringify(representation, null, 2)}
              </pre>
            ) : (
              <p className="text-muted-foreground text-sm">
                No representation yet.
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      <Separator />

      <div>
        <h3 className="text-lg font-semibold mb-4">
          Conclusions ({conclList.length})
        </h3>
        {conclList.length === 0 ? (
          <p className="text-muted-foreground">
            No conclusions yet. Honcho will generate these from conversations.
          </p>
        ) : (
          <div className="space-y-3">
            {conclList.map(
              (c: { id: string; content: string; type?: string }) => (
                <Card key={c.id}>
                  <CardContent className="pt-4">
                    <p className="text-sm">{c.content}</p>
                    {c.type && (
                      <span className="text-xs text-muted-foreground font-mono mt-1 block">
                        {c.type}
                      </span>
                    )}
                  </CardContent>
                </Card>
              )
            )}
          </div>
        )}
      </div>
    </div>
  );
}
