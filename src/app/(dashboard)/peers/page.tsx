import Link from "next/link";
import { listPeers, getPeerConclusions } from "@/lib/honcho";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

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

  return (
    <div>
      <h2 className="text-2xl font-bold tracking-tight mb-6">Peers</h2>
      {enriched.length === 0 ? (
        <p className="text-muted-foreground">No peers found.</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Peer ID</TableHead>
              <TableHead className="text-right">Conclusions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {enriched.map((p) => (
              <TableRow key={p.id}>
                <TableCell>
                  <Link
                    href={`/peers/${p.id}`}
                    className="font-mono text-sm text-blue-600 hover:underline"
                  >
                    {p.id}
                  </Link>
                </TableCell>
                <TableCell className="text-right font-mono">
                  {p.conclusionCount}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
