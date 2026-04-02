import Link from "next/link";
import { notFound } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft } from "lucide-react";

export const dynamic = "force-dynamic";

/* ── Agent-Konfiguration (aus config.toml auf dem Server) ── */

interface AgentLevel {
  level: string;
  model: string;
  thinkingBudget: number;
  maxIterations: number;
  maxOutput: number;
}

interface Specialist {
  name: string;
  model: string;
  maxOutput: number;
  maxIterations: number;
  description: string;
}

interface AgentConfig {
  name: string;
  icon: string;
  role: "realtime" | "background";
  description: string;
  longDescription: string;
  provider: string;
  model: string;
  settings: Record<string, string | number | boolean | string[]>;
  levels?: AgentLevel[];
  specialists?: Specialist[];
  tools?: string[];
}

const agentConfigs: Record<string, AgentConfig> = {
  deriver: {
    name: "Deriver",
    icon: "🔍",
    role: "realtime",
    description:
      "Extrahiert Schlussfolgerungen und Beobachtungen aus eingehenden Nachrichten.",
    longDescription:
      "Analysiert jede eingehende Nachricht und extrahiert explizite, atomare Fakten. Keine höhere Reasoning — rein faktenbasierte Beobachtungen. Beispiel: \"I just had my 25th birthday\" wird zu \"Peer ist 25 Jahre alt\" + \"Geburtstag ist am 21. Juni\".",
    provider: "Requesty AI Gateway",
    model: "google/gemini-2.5-flash-lite",
    settings: {
      "Max Output Tokens": 4096,
      "Thinking Budget": 1024,
      "Max Input Tokens": 23000,
      Workers: 1,
      "Flush (Sofort-Verarbeitung)": true,
      Deduplizierung: true,
    },
  },
  dialectic: {
    name: "Dialectic",
    icon: "💬",
    role: "realtime",
    description:
      "Beantwortet natürlichsprachliche Fragen über Peers anhand des gesammelten Wissens.",
    longDescription:
      "Context-Synthesis-Agent, der Fragen über User beantwortet. Nutzt mehrere Reasoning-Level je nach Komplexität der Anfrage. Hat Zugriff auf Memory-Search, Reasoning-Chains, Message-Suche und temporale Abfragen.",
    provider: "Requesty AI Gateway",
    model: "google/gemini-2.5-flash-lite — claude-haiku-4-5",
    settings: {
      "Max Output Tokens": 8192,
      "Max Input Tokens": 100000,
      "History Token Limit": 8192,
      "Session History Max Tokens": 4096,
    },
    levels: [
      { level: "minimal", model: "google/gemini-2.5-flash-lite", thinkingBudget: 0, maxIterations: 1, maxOutput: 250 },
      { level: "low", model: "google/gemini-2.5-flash-lite", thinkingBudget: 0, maxIterations: 5, maxOutput: 8192 },
      { level: "medium", model: "anthropic/claude-haiku-4-5", thinkingBudget: 0, maxIterations: 2, maxOutput: 8192 },
      { level: "high", model: "anthropic/claude-haiku-4-5", thinkingBudget: 0, maxIterations: 4, maxOutput: 8192 },
      { level: "max", model: "anthropic/claude-haiku-4-5", thinkingBudget: 0, maxIterations: 10, maxOutput: 8192 },
    ],
    tools: [
      "search_memory",
      "get_reasoning_chain",
      "search_messages",
      "grep_messages",
      "get_observation_context",
      "get_messages_by_date_range",
      "search_messages_temporal",
    ],
  },
  dreamer: {
    name: "Dreamer",
    icon: "🌙",
    role: "background",
    description:
      "Konsolidiert Memory im Hintergrund — dedupliziert, bereinigt und erstellt Peer-Cards.",
    longDescription:
      "Dream-Cycle mit einem Orchestrator und zwei Spezialisten. Der Deduction Specialist findet logische Implikationen und Knowledge-Updates. Der Induction Specialist identifiziert Verhaltensmuster und Persönlichkeitsmerkmale. Mindestens 8 Stunden zwischen Dream-Cycles.",
    provider: "Anthropic (direkt)",
    model: "claude-sonnet-4-20250514",
    settings: {
      "Max Output Tokens": 16384,
      "Thinking Budget": 8192,
      "Max Tool Iterations": 20,
      "History Token Limit": 16384,
      "Min. Stunden zwischen Dreams": 8,
      "Document Threshold": 50,
      "Idle Timeout (Min.)": 60,
      "Dream-Typen": ["omni"],
    },
    specialists: [
      {
        name: "Deduction Specialist",
        model: "claude-haiku-4-5",
        maxOutput: 8192,
        maxIterations: 12,
        description:
          "Detektiv-artig. Findet logische Implikationen, Knowledge-Updates (alte Fakten ersetzen) und Contradictions.",
      },
      {
        name: "Induction Specialist",
        model: "claude-haiku-4-5",
        maxOutput: 8192,
        maxIterations: 10,
        description:
          "Psychologen-artig. Identifiziert Verhaltensmuster, Präferenzen und Persönlichkeitsmerkmale. Braucht min. 2 Quellen pro Pattern.",
      },
    ],
    tools: [
      "get_recent_observations",
      "search_memory",
      "search_messages",
      "create_observations_deductive",
      "create_observations_inductive",
      "delete_observation",
      "update_peer_card",
    ],
  },
  summary: {
    name: "Summary",
    icon: "📝",
    role: "realtime",
    description:
      "Erstellt kurze und lange Zusammenfassungen von Konversationen in regelmäßigen Abständen.",
    longDescription:
      "Erzeugt automatisch Zusammenfassungen auf zwei Ebenen: Kurze Summaries alle 20 Nachrichten und lange Summaries alle 60 Nachrichten. Hilft bei der Kontextkomprimierung für nachfolgende Agent-Aufrufe.",
    provider: "Requesty AI Gateway",
    model: "google/gemini-2.5-flash",
    settings: {
      "Max Tokens (kurz)": 1000,
      "Max Tokens (lang)": 4000,
      "Thinking Budget": 512,
      "Kurze Summary alle": "20 Messages",
      "Lange Summary alle": "60 Messages",
    },
  },
};

/* ── Hilfs-Komponenten ── */

function SettingRow({ label, value }: { label: string; value: string | number | boolean | string[] }) {
  const display = Array.isArray(value)
    ? value.join(", ")
    : typeof value === "boolean"
      ? value ? "Ja" : "Nein"
      : String(value);

  return (
    <div className="flex items-center justify-between py-2 border-b last:border-0">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-sm font-mono font-medium">{display}</span>
    </div>
  );
}

/* ── Page ── */

export default async function AgentDetailPage({
  params,
}: {
  params: Promise<{ agent: string }>;
}) {
  const { agent: slug } = await params;
  const config = agentConfigs[slug];

  if (!config) notFound();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <Link
          href="/pipeline"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-4"
        >
          <ArrowLeft className="h-4 w-4" />
          Zurück zur Pipeline
        </Link>
        <div className="flex items-center gap-3">
          <span className="text-3xl">{config.icon}</span>
          <div>
            <h2 className="text-2xl font-bold tracking-tight">{config.name}</h2>
            <p className="text-muted-foreground mt-0.5">{config.description}</p>
          </div>
        </div>
      </div>

      {/* Modell + Provider */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Modell</p>
            <p className="font-mono text-sm font-semibold">{config.model}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Provider</p>
            <p className="text-sm font-semibold">{config.provider}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Verarbeitung</p>
            <Badge variant={config.role === "realtime" ? "default" : "secondary"}>
              {config.role === "realtime" ? "Echtzeit" : "Hintergrund"}
            </Badge>
          </CardContent>
        </Card>
      </div>

      {/* Beschreibung */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium">Funktionsweise</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {config.longDescription}
          </p>
        </CardContent>
      </Card>

      {/* Einstellungen */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium">Einstellungen</CardTitle>
        </CardHeader>
        <CardContent>
          {Object.entries(config.settings).map(([key, val]) => (
            <SettingRow key={key} label={key} value={val} />
          ))}
        </CardContent>
      </Card>

      {/* Reasoning-Level (Dialectic) */}
      {config.levels && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Reasoning-Level</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left">
                    <th className="pb-2 font-medium text-muted-foreground">Level</th>
                    <th className="pb-2 font-medium text-muted-foreground">Modell</th>
                    <th className="pb-2 font-medium text-muted-foreground text-right">Thinking</th>
                    <th className="pb-2 font-medium text-muted-foreground text-right">Iterationen</th>
                    <th className="pb-2 font-medium text-muted-foreground text-right">Max Output</th>
                  </tr>
                </thead>
                <tbody>
                  {config.levels.map((l) => (
                    <tr key={l.level} className="border-b last:border-0">
                      <td className="py-2">
                        <Badge
                          variant={
                            l.level === "max"
                              ? "default"
                              : l.level === "high"
                                ? "default"
                                : "secondary"
                          }
                          className="text-xs"
                        >
                          {l.level}
                        </Badge>
                      </td>
                      <td className="py-2 font-mono text-xs">{l.model}</td>
                      <td className="py-2 text-right font-mono">{l.thinkingBudget}</td>
                      <td className="py-2 text-right font-mono">{l.maxIterations}</td>
                      <td className="py-2 text-right font-mono">{l.maxOutput.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Spezialisten (Dreamer) */}
      {config.specialists && (
        <>
          <Separator />
          <div>
            <h3 className="text-lg font-semibold mb-4">Spezialisten</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {config.specialists.map((s) => (
                <Card key={s.name}>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">{s.name}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <p className="text-sm text-muted-foreground">{s.description}</p>
                    <div className="space-y-1 pt-2 border-t">
                      <div className="flex justify-between text-xs">
                        <span className="text-muted-foreground">Modell</span>
                        <span className="font-mono font-medium">{s.model}</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-muted-foreground">Max Output</span>
                        <span className="font-mono font-medium">{s.maxOutput.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-muted-foreground">Max Iterationen</span>
                        <span className="font-mono font-medium">{s.maxIterations}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </>
      )}

      {/* Tools */}
      {config.tools && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Verfügbare Tools</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {config.tools.map((t) => (
                <Badge key={t} variant="outline" className="font-mono text-xs">
                  {t}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
