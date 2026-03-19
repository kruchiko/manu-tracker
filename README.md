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

To clean the database (e.g. clear all orders and events) while keeping the stack running:

```bash
./scripts/clean-docker-db.sh
```

This removes the DB files inside the backend container and restarts the backend so it starts with an empty database. To remove the volume entirely (e.g. before `docker-compose up`), use:

```bash
docker-compose down -v
```

### Option B — Local

```bash
cd manu-gen/backend && yarn install && yarn dev
cd manu-gen/frontend && yarn install && yarn dev
```

To clean the local database, stop the backend then run `cd manu-gen/backend && yarn db:clean` and start the backend again.

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
