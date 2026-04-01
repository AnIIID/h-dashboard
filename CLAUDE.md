# h-dashboard

Honcho Dashboard — Web-UI zur Verwaltung von Sessions, Peers, Memory und Pipeline der Honcho-Plattform.

## Tech-Stack

- **Next.js 16.2.1** (App Router, Turbopack, standalone output)
- **React 19.2.4**, TypeScript
- **next-auth v5 beta** (Credentials Provider, JWT sessions)
- **@honcho-ai/sdk** — API-Client zum Honcho-Backend
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
    login/                   # Login-Seite (ungeschützt)
  lib/
    auth.ts             # NextAuth-Config (Credentials, JWT)
    honcho.ts           # Honcho SDK Client
  middleware.ts         # Auth-Middleware (schützt alles ausser /login, /api/auth)
  components/
    Providers.tsx       # SessionProvider (basePath: /dashboard/api/auth)
    layout/             # Header, Sidebar
    ui/                 # shadcn/ui Komponenten
```

## Auth-Flow

- **basePath** in `next.config.ts`: `/dashboard`
- **Auth basePath** in `auth.ts`: `/api/auth` (intern, Next.js strippt `/dashboard`)
- **SessionProvider basePath**: `/dashboard/api/auth` (browser-seitig, voller Pfad)
- **Credentials**: `ADMIN_USER` / `ADMIN_PASSWORD` aus Env-Vars
- **Middleware**: Exportiert `auth` als middleware, schützt alle Routes ausser Login/Auth/Static

## Deployment (Hetzner)

- **Server**: `root@91.99.134.32` (cax11 ARM, SSH Key Auth)
- **App-Dir**: `/opt/h-dashboard/`
- **Docker**: Container `h-dashboard`, Port `127.0.0.1:3100 -> 3000`
- **Reverse Proxy**: Caddy, `brain.andre-dueck.de/dashboard` -> `h-dashboard:3000`
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
- `NEXTAUTH_URL` NICHT setzen — `AUTH_TRUST_HOST=true` reicht, sonst `env-url-basepath-mismatch`
- Auth `basePath` in `auth.ts` ist `/api/auth` (NICHT `/dashboard/api/auth`)
- `pages.signIn` in `auth.ts` ist `/login` (NICHT `/dashboard/login`)
