import {
  listSessions,
  getSessionMessages,
  listPeers,
  getPeerConclusions,
  getQueueStatus,
} from "./honcho";

// ── Types ──────────────────────────────────────────────

export type DayActivity = { date: string; messages: number; tokens: number };
export type HourActivity = { hour: number; count: number };
export type PeerTokens = { date: string; [peerId: string]: string | number };
export type ConclusionTypeCount = { type: string; count: number };
export type PeerStats = {
  id: string;
  sessions: number;
  messages: number;
  tokens: number;
  conclusions: number;
};

// ── Data Fetching (cached per request) ─────────────────

export async function fetchAllMessages() {
  const sessions = await listSessions();
  const messageArrays = await Promise.all(
    sessions.map((s: { id: string }) => getSessionMessages(s.id).catch(() => []))
  );

  return {
    sessions,
    messages: messageArrays.flatMap((msgs: unknown[], i: number) =>
      (msgs ?? []).map((m: Record<string, unknown>) => ({
        ...m,
        session_id: sessions[i].id,
      }))
    ),
  };
}

// ── Aggregations ───────────────────────────────────────

/** Messages + tokens per day */
export function aggregateByDay(
  messages: Record<string, unknown>[]
): DayActivity[] {
  const byDay: Record<string, { messages: number; tokens: number }> = {};

  for (const msg of messages) {
    const created = msg.created_at as string | undefined;
    if (!created) continue;
    const date = created.slice(0, 10); // YYYY-MM-DD
    if (!byDay[date]) byDay[date] = { messages: 0, tokens: 0 };
    byDay[date].messages += 1;
    byDay[date].tokens += (msg.token_count as number) || 0;
  }

  return Object.entries(byDay)
    .map(([date, v]) => ({ date, ...v }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

/** Activity by hour of day (0-23) */
export function aggregateByHour(
  messages: Record<string, unknown>[]
): HourActivity[] {
  const hours = Array.from({ length: 24 }, (_, i) => ({ hour: i, count: 0 }));

  for (const msg of messages) {
    const created = msg.created_at as string | undefined;
    if (!created) continue;
    const h = new Date(created).getHours();
    hours[h].count += 1;
  }

  return hours;
}

/** Tokens per day, split by peer_id */
export function aggregateTokensByPeer(
  messages: Record<string, unknown>[]
): { data: PeerTokens[]; peerIds: string[] } {
  const peerSet = new Set<string>();
  const byDay: Record<string, Record<string, number>> = {};

  for (const msg of messages) {
    const created = msg.created_at as string | undefined;
    const peerId = (msg.peer_id as string) || "unknown";
    if (!created) continue;

    peerSet.add(peerId);
    const date = created.slice(0, 10);
    if (!byDay[date]) byDay[date] = {};
    byDay[date][peerId] = (byDay[date][peerId] || 0) + ((msg.token_count as number) || 0);
  }

  const peerIds = [...peerSet];
  const data = Object.entries(byDay)
    .map(([date, peers]) => {
      const row: PeerTokens = { date };
      for (const id of peerIds) row[id] = peers[id] || 0;
      return row;
    })
    .sort((a, b) => (a.date as string).localeCompare(b.date as string));

  return { data, peerIds };
}

/** Conclusion type distribution across all peers */
export async function getConclusionTypeCounts(): Promise<ConclusionTypeCount[]> {
  const peers = await listPeers();
  const conclusionArrays = await Promise.all(
    peers.map((p: { id: string }) => getPeerConclusions(p.id).catch(() => []))
  );

  const typeCounts: Record<string, number> = {};
  for (const conclusions of conclusionArrays) {
    for (const c of conclusions ?? []) {
      const t = (c as Record<string, unknown>).type as string || "untyped";
      typeCounts[t] = (typeCounts[t] || 0) + 1;
    }
  }

  return Object.entries(typeCounts)
    .map(([type, count]) => ({ type, count }))
    .sort((a, b) => b.count - a.count);
}

/** Per-peer stats for comparison */
export async function getPeerStats(
  sessions: Record<string, unknown>[],
  messages: Record<string, unknown>[]
): Promise<PeerStats[]> {
  const peers = await listPeers();
  const conclusionArrays = await Promise.all(
    peers.map((p: { id: string }) => getPeerConclusions(p.id).catch(() => []))
  );

  return peers.map((peer: { id: string }, i: number) => {
    const peerMsgs = messages.filter((m) => m.peer_id === peer.id);
    const peerSessions = new Set(
      peerMsgs.map((m) => m.session_id as string)
    );

    return {
      id: peer.id,
      sessions: peerSessions.size,
      messages: peerMsgs.length,
      tokens: peerMsgs.reduce((s, m) => s + ((m.token_count as number) || 0), 0),
      conclusions: (conclusionArrays[i] ?? []).length,
    };
  });
}

/** Queue status */
export async function getQueueStats() {
  return getQueueStatus();
}
