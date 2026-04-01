import Link from "next/link";
import { listPeers, getPeerConclusions } from "@/lib/honcho";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const dynamic = "force-dynamic";

export default async function PeersPage() {
  const peers = await listPeers().catch(() => []);
  const list = Array.isArray(peers) ? peers : [];

  const enriched = await Promise.all(
    list.map(async (p: { id: string }) => {
      const conclusions = await getPeerConclusions(p.id).catch(() => []);
      return {
        id: p.id,
        conclusionCount: Array.isArray(conclusions) ? conclusions.length : 0,
      };
    })
  );

  const maxConclusions = Math.max(1, ...enriched.map((p) => p.conclusionCount));

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Peers</h2>
        <p className="text-muted-foreground mt-1">
          All tracked peers and their activity.
        </p>
      </div>

      {enriched.length === 0 ? (
        <p className="text-muted-foreground">Keine Peers gefunden.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {enriched.map((p) => {
            const relativeWidth = Math.round(
              (p.conclusionCount / maxConclusions) * 100
            );

            return (
              <Link key={p.id} href={`/peers/${p.id}`} className="group">
                <Card className="transition-colors group-hover:border-primary/40">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-mono truncate">
                      {p.id}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">
                        Conclusions
                      </span>
                      <Badge variant="secondary">{p.conclusionCount}</Badge>
                    </div>

                    {/* Aktivitäts-Balken */}
                    <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                      <div
                        className="h-full rounded-full bg-primary/60 transition-all"
                        style={{ width: `${relativeWidth}%` }}
                      />
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
