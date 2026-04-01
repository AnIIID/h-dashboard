import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

export const dynamic = "force-dynamic";

async function getSettings() {
  const base = process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000";
  const res = await fetch(`${base}/api/honcho/settings`, {
    cache: "no-store",
  });
  if (!res.ok) throw new Error("Failed to load settings");
  return res.json();
}

export default async function SettingsPage() {
  const config = await getSettings().catch(() => ({
    modelRouting: [],
    systemInfo: { workspace: "default", embeddingDimensions: 1536, vectorStore: "pgvector" },
  }));

  const { modelRouting, systemInfo } = config;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">
          System Configuration
        </h2>
        <p className="text-muted-foreground mt-1">
          Current model routing and system parameters (read-only).
        </p>
      </div>

      {/* System Info */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Workspace
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold font-mono">{systemInfo.workspace}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Embedding Dimensions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold font-mono">
              {systemInfo.embeddingDimensions}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Vector Store
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold font-mono">{systemInfo.vectorStore}</p>
          </CardContent>
        </Card>
      </div>

      <Separator />

      {/* Model Routing */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Model Routing</h3>
        <Card>
          <CardContent className="pt-4 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left">
                  <th className="pb-2 pr-4 font-medium text-muted-foreground">
                    Component
                  </th>
                  <th className="pb-2 pr-4 font-medium text-muted-foreground">
                    Provider
                  </th>
                  <th className="pb-2 font-medium text-muted-foreground">
                    Model
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {modelRouting.map(
                  (
                    route: { component: string; provider: string; model: string },
                    i: number
                  ) => (
                    <tr key={i}>
                      <td className="py-2.5 pr-4 font-medium">
                        {route.component}
                      </td>
                      <td className="py-2.5 pr-4">
                        <Badge variant="secondary">{route.provider}</Badge>
                      </td>
                      <td className="py-2.5 font-mono text-muted-foreground">
                        {route.model}
                      </td>
                    </tr>
                  )
                )}
              </tbody>
            </table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
