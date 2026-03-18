# Manu-Tracker

Ceramic order tracking system — QR labels on trays, cameras at stations, live status on screen.

## Components

| Service | Description | Tech |
|---------|-------------|------|
| **manu-gen** | QR label creator — order form, QR generation, event tracking, dashboard | React + Node.js |
| **manu-eye** | Camera station — reads QR codes, sends events | Python + OpenCV |

> Event ingestion and analytics will be added to manu-gen when manu-eye is ready.

## Getting Started

Each service has its own README with setup instructions. Start with `manu-gen`:

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
