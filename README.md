# Manu-Tracker

Ceramic order tracking system — QR labels on trays, cameras at stations, live status on screen.

## Components

| Service | Description | Tech |
|---------|-------------|------|
| **manu-gen** | QR label creator — order form, QR generation, event tracking, dashboard | React + Node.js |
| **manu-eye** | Camera station — reads QR codes, sends events | Python + OpenCV |

> Event ingestion and analytics will be added to manu-gen when manu-eye is ready.

## Getting Started

### Option A — Docker (recommended)

Requires Docker Engine and Docker Compose. On macOS with [Colima](https://github.com/abiosoft/colima):

```bash
brew install docker docker-compose colima
colima start
```

Then run everything with a single command:

```bash
docker-compose up --build
```

| Service  | URL                    |
|----------|------------------------|
| Frontend | http://localhost:5173  |
| Backend  | http://localhost:3000  |

Source files are bind-mounted, so changes in `manu-gen/backend/src` and `manu-gen/frontend/src` trigger hot-reload automatically.

To stop and remove containers:

```bash
docker-compose down
```

To also wipe the SQLite volume:

```bash
docker-compose down -v
```

### Option B — Local

```bash
cd manu-gen/backend && yarn install && yarn dev
cd manu-gen/frontend && yarn install && yarn dev
```

## Architecture

```
[manu-gen]                    [manu-eye]
 React form  ──> Node API      Camera ──> Python QR reader
                  │                           │
                  │         POST /events      │
                  ◄───────────────────────────┘
                  │
                  ▼
               SQLite ──> Dashboard
```
