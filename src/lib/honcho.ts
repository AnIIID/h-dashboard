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

  const contentType = res.headers.get("content-type") ?? "";
  const isJson = contentType.includes("application/json");

  if (!res.ok) {
    let detail = "";

    try {
      if (isJson) {
        const data = await res.json();
        if (typeof data?.detail === "string") detail = data.detail;
        else if (typeof data?.error === "string") detail = data.error;
      } else {
        detail = (await res.text()).trim();
      }
    } catch {
      detail = "";
    }

    throw new Error(
      detail
        ? `Honcho API ${res.status}: ${detail}`
        : `Honcho API ${res.status}: ${path}`
    );
  }

  if (res.status === 204) {
    return null;
  }

  if (!isJson) {
    return null;
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

export async function getPeerRepresentation(peerId: string, workspaceId = "default") {
  const data = await post(`/v3/workspaces/${workspaceId}/peers/${peerId}/representation`, { peer_id: peerId });
  return data.representation ?? null;
}

export function getPeerConclusions(peerId: string, workspaceId = "default") {
  return listItems(`/v3/workspaces/${workspaceId}/conclusions/list`, { observer_id: peerId });
}

// Dream
export function scheduleDream(
  peerId: string,
  workspaceId = "default",
  sessionId?: string,
  targetPeerId?: string
) {
  const body: Record<string, unknown> = {
    observer: peerId,
    dream_type: "omni",
  };
  if (sessionId) body.session_id = sessionId;
  if (targetPeerId) body.observed = targetPeerId;
  return post(`/v3/workspaces/${workspaceId}/schedule_dream`, body);
}

// Peer Context (Card + Representation combined)
export async function getPeerContext(peerId: string, workspaceId = "default") {
  return post(`/v3/workspaces/${workspaceId}/peers/${peerId}/context`, { peer_id: peerId });
}

// Session-Peers (welche Peers sind einer Session zugeordnet)
export function getSessionPeers(sessionId: string, workspaceId = "default") {
  return post(`/v3/workspaces/${workspaceId}/sessions/${sessionId}/peers`);
}

// Queue
export function getQueueStatus() {
  return get("/v3/queue/status");
}
