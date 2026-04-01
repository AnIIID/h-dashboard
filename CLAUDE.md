# h-dashboard

Honcho Dashboard — Web-UI zur Verwaltung von Sessions, Peers, Memory und Pipeline der Honcho-Plattform.

## Encoding

- IMMER echte UTF-8 Zeichen verwenden: ä ö ü ß é — NIEMALS Unicode-Escapes (`\u00e4`, `\u00fc` etc.)
- Gilt für Code, Strings, Kommentare, Commit-Messages, Doku, Memory-Files
- Dateien sind UTF-8 (siehe `.editorconfig`)

## Tech-Stack

- **Next.js 16.2.1** (App Router, Turbopack, standalone output)
- **React 19.2.4**, TypeScript
- **next-auth v5 beta** (Credentials Provider, JWT sessions)
- **Recharts 3** — Chart-Library für Visualisierungen
- **UI**: shadcn/ui, Tailwind CSS 4, Lucide Icons

## Next.js 16 — Wichtige Abweichungen

Trainings-Daten sind veraltet. Vor Code-Änderungen Docs lesen: `node_modules/next/dist/docs/`

- **`params` und `searchParams` sind async** — immer `await`en, nie synchron zugreifen
- **Turbopack ist Default** — kein Webpack, keine `~`-Imports
- **Server Actions statt API Routes** für Mutationen bevorzugen
- **next-auth v5**: `auth()` ist async, kein `useSession()` aus v4

## Projekt-Struktur

```
src/
  app/
    (dashboard)/        # Route-Group: geschützte Seiten
      page.tsx          # Overview (Home)
      sessions/         # Sessions-Liste + Detail
      peers/            # Peers-Liste + Detail
      memory/           # Memory-Ansicht
      settings/         # Einstellungen
      pipeline/         # Pipeline-Ansicht
    api/auth/[...nextauth]/  # NextAuth Route Handler
    api/honcho/              # Proxy-Routes zum Honcho-Backend
      dream/               # Dream-Trigger
      peers/[id]/          # Peer-Detail + Conclusions
      queue/               # Queue-Status
      sessions/[id]/       # Session-Messages
      settings/            # Workspace-Settings
      workspace/           # Workspace-Metadata
    login/                   # Login-Seite (ungeschützt)
  lib/
    auth.ts             # NextAuth-Config (Credentials, JWT)
    honcho.ts           # Honcho API-Client (plain fetch)
    analytics.ts        # Daten-Aggregation für Charts
    utils.ts            # cn()-Helper
  middleware.ts         # Auth-Middleware (schützt alles ausser /login, /api/auth)
  components/
    Providers.tsx       # SessionProvider (basePath: /api/auth)
    DreamButton.tsx     # Dream-Trigger Button
    layout/             # Header, Sidebar
    charts/             # OverviewCharts, MemoryCharts, ActivityHeatmap
    ui/                 # shadcn/ui Komponenten (13 Stück)
```

## Auth-Flow

- **Kein basePath** — App läuft direkt auf `brain.andre-dueck.de/`
- **Auth basePath** in `auth.ts`: `/api/auth`
- **SessionProvider basePath**: `/api/auth`
- **Credentials**: `ADMIN_USER` / `ADMIN_PASSWORD` aus Env-Vars
- **Middleware**: Exportiert `auth` als middleware, schützt alle Routes ausser Login/Auth/Static

## Deployment (Hetzner)

- **Server**: `root@91.99.134.32` (cax11 ARM, SSH Key Auth)
- **App-Dir**: `/opt/h-dashboard/`
- **Docker**: Container `h-dashboard`, Port `127.0.0.1:3100 -> 3000`
- **Reverse Proxy**: Caddy, `brain.andre-dueck.de` catch-all → `h-dashboard:3000`
- **Caddy-Routing**: `/v3*` → Honcho-API (Basic Auth), `/mcp*` → MCP, Rest → Dashboard
- **Netzwerk**: `honcho_default` (shared mit honcho-api-1:8000)

### Deploy-Befehl
```bash
git push origin main && ssh root@91.99.134.32 "cd /opt/h-dashboard && git pull && docker compose up -d --build"
```

### Env-Vars (Server .env)
```
HONCHO_BASE_URL=http://honcho-api-1:8000
ADMIN_USER=admin
ADMIN_PASSWORD="BastelBudenEmpfang77#tag"
AUTH_TRUST_HOST=true
AUTH_SECRET=<generiert>
```

### Bekannte Fallstricke
- `ADMIN_PASSWORD` mit `#` muss in `.env` gequotet sein
- `.dockerignore` schliesst `.env` aus — Env-Vars kommen nur via docker-compose
- `AUTH_URL` und `NEXTAUTH_URL` NICHT setzen — `AUTH_TRUST_HOST=true` reicht
- Auth `basePath` in `auth.ts` ist `/api/auth`
- `pages.signIn` in `auth.ts` ist `/login`
- Caddy-Config liegt in `/opt/BusinessOS/Caddyfile` (businessos-caddy-1 Container)
