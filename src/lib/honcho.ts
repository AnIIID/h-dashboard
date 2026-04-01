const BASE = process.env.HONCHO_BASE_URL || "http://honcho-api-1:8000";

async function api(path: string, options?: RequestInit) {
  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error(`Honcho API ${res.status}: ${path}`);
  }
  return res.json();
}

function post(path: string, body: Record<string, unknown> = {}) {
  return api(path, { method: "POST", body: JSON.stringify(body) });
}

function get(path: string) {
  return api(path);
}

// Paginated list endpoints return {items: [...], total, page, size, pages}
async function listItems(path: string, body: Record<string, unknown> = {}) {
  const data = await post(path, body);
  return data.items ?? data;
}

// Workspace
export function listWorkspaces() {
  return listItems("/v3/workspaces/list");
}

// Sessions
export function listSessions(workspaceId = "default") {
  return listItems(`/v3/workspaces/${workspaceId}/sessions/list`);
}

export function getSession(sessionId: string, workspaceId = "default") {
  return get(`/v3/workspaces/${workspaceId}/sessions/${sessionId}`);
}

export function getSessionMessages(sessionId: string, workspaceId = "default") {
  return listItems(`/v3/workspaces/${workspaceId}/sessions/${sessionId}/messages/list`);
}

export function getSessionDetail(sessionId: string, workspaceId = "default") {
  return post(`/v3/workspaces/${workspaceId}/sessions/${sessionId}/peers`);
}

export function getSessionContext(sessionId: string, workspaceId = "default") {
  return post(`/v3/workspaces/${workspaceId}/sessions/${sessionId}/context`);
}

// Peers
export function listPeers(workspaceId = "default") {
  return listItems(`/v3/workspaces/${workspaceId}/peers/list`);
}

export function getPeer(peerId: string, workspaceId = "default") {
  return get(`/v3/workspaces/${workspaceId}/peers/${peerId}`);
}

export function getPeerCard(peerId: string, workspaceId = "default") {
  return get(`/v3/workspaces/${workspaceId}/peers/${peerId}/card`);
}

export function getPeerRepresentation(peerId: string, workspaceId = "default") {
  return get(`/v3/workspaces/${workspaceId}/peers/${peerId}/representation`);
}

export function getPeerConclusions(peerId: string, workspaceId = "default") {
  return listItems(`/v3/workspaces/${workspaceId}/peers/${peerId}/conclusions/list`);
}

// Dream
export function scheduleDream(
  peerId: string,
  workspaceId = "default",
  sessionId?: string,
  targetPeerId?: string
) {
  const body: Record<string, unknown> = {};
  if (sessionId) body.session_id = sessionId;
  if (targetPeerId) body.target_peer_id = targetPeerId;
  return post(`/v3/workspaces/${workspaceId}/peers/${peerId}/dream`, body);
}

// Queue
export function getQueueStatus() {
  return get("/v3/queue/status");
}
