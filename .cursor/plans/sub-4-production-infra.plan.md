# Sub-plan 4: Production Infrastructure

> **Parent plan:** [Production Architecture Plan](production_architecture_plan_87189a29.plan.md)
> **Stage:** 3 (parallel with Sub-plan 3)
> **Can start:** After Sub-plan 1b (Frontend Polish) — or earlier since it creates new files with no conflicts
> **Blocks:** Sub-plan 5 (Deploy)
> **Parallel with:** Sub-plan 3 (Postgres Migration)

## Objective

Create the production infrastructure configuration: a production Docker Compose file, Caddy reverse proxy config, and deployment scripts. These will live in `agrus-ops/manu-infra` after the repo split, but for now can be developed in a new `infra/` directory at the monorepo root or as standalone files.

## Target Deployment Topology

```
DigitalOcean Droplet ($12/mo, 2 vCPU, 2GB RAM, Ubuntu 24.04)
├── Docker Compose
│   ├── caddy        (reverse proxy, auto-TLS via Let's Encrypt)
│   ├── backend      (manu-gen API, port 3000 internal)
│   └── frontend     (Nginx serving static build, port 80 internal)
└── External
    └── Managed Postgres ($15/mo, connection via DATABASE_URL)
```

## Working Directory

Clone and work directly in the `agrus-ops/manu-infra` repo (created as a placeholder in Sub-plan 1a).

```bash
git clone git@github.com:agrus-ops/manu-infra.git
cd manu-infra
# Add all infra content here, commit, push
```

## Tasks

### 1. Create directory structure

```
infra/
  docker-compose.prod.yml
  caddy/
    Caddyfile
  backend/
    Dockerfile.prod
  frontend/
    Dockerfile.prod
    nginx.conf
  scripts/
    provision-droplet.sh
    deploy.sh
    backup-db.sh
  .env.example
  README.md
```

### 2. Production Docker Compose (`docker-compose.prod.yml`)

Key differences from the dev compose:
- **No Postgres container** -- uses external Managed Postgres via `DATABASE_URL`
- **No source bind-mounts** -- images contain built code
- **Frontend served by Nginx** -- static build, not Vite dev server
- **Caddy** handles TLS termination and routing
- **Restart policies** for all services

```yaml
services:
  caddy:
    image: caddy:2-alpine
    restart: unless-stopped
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./caddy/Caddyfile:/etc/caddy/Caddyfile:ro
      - caddy_data:/data
      - caddy_config:/config
    depends_on:
      backend:
        condition: service_healthy
      frontend:
        condition: service_started

  backend:
    build:
      context: ../manu-gen/backend   # adjusted at deploy time
      dockerfile: Dockerfile.prod     # or path to infra/backend/Dockerfile.prod
    restart: unless-stopped
    environment:
      PORT: 3000
      HOST: 0.0.0.0
      DATABASE_URL: ${DATABASE_URL}
      CORS_ORIGIN: ${CORS_ORIGIN:-https://app.your-domain.com}
      NODE_ENV: production
    healthcheck:
      test: ["CMD", "node", "-e", "fetch('http://localhost:3000/health').then(r=>{if(!r.ok)throw 1})"]
      interval: 10s
      timeout: 3s
      retries: 3
      start_period: 10s

  frontend:
    build:
      context: ../manu-gen/frontend   # adjusted at deploy time
      dockerfile: Dockerfile.prod
    restart: unless-stopped

volumes:
  caddy_data:
  caddy_config:
```

### 3. Production backend Dockerfile (`backend/Dockerfile.prod`)

Multi-stage build for minimal image size:

```dockerfile
FROM node:24-alpine AS builder
WORKDIR /app
COPY package.json yarn.lock .yarnrc.yml ./
COPY .yarn .yarn
RUN yarn install --immutable
COPY tsconfig.json ./
COPY src ./src
COPY migrations ./migrations
RUN yarn build

FROM node:24-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/package.json /app/yarn.lock /app/.yarnrc.yml ./
COPY --from=builder /app/.yarn .yarn
RUN yarn workspaces focus --production
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/migrations ./migrations
EXPOSE 3000
CMD ["node", "dist/index.js"]
```

**Note:** The current dev Dockerfile runs `yarn dev` (tsx). Production must run the compiled JS from `yarn build` (`tsc`). Verify that `tsconfig.json` has an `outDir` configured (likely `dist/`).

### 4. Production frontend Dockerfile (`frontend/Dockerfile.prod`)

Multi-stage: build with Vite, serve with Nginx:

```dockerfile
FROM node:24-alpine AS builder
WORKDIR /app
COPY package.json yarn.lock .yarnrc.yml ./
COPY .yarn .yarn
RUN yarn install --immutable
COPY . .
ARG VITE_API_URL
ENV VITE_API_URL=${VITE_API_URL}
RUN yarn build

FROM nginx:alpine AS runner
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
```

**VITE_API_URL:** In production, the frontend is served from the same domain as the API (both behind Caddy). Set `VITE_API_URL=""` (empty = same origin) or omit it. The Vite proxy is dev-only; in production, Caddy routes `/api/*` to the backend.

### 5. Nginx config (`frontend/nginx.conf`)

```nginx
server {
    listen 80;
    root /usr/share/nginx/html;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff2?)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

### 6. Caddyfile (`caddy/Caddyfile`)

Caddy handles TLS automatically via Let's Encrypt:

```
{$DOMAIN:localhost} {
    # API routes -> backend
    handle /health {
        reverse_proxy backend:3000
    }
    handle /jobs/* {
        reverse_proxy backend:3000
    }
    handle /jobs {
        reverse_proxy backend:3000
    }
    handle /stations/* {
        reverse_proxy backend:3000
    }
    handle /stations {
        reverse_proxy backend:3000
    }
    handle /events/* {
        reverse_proxy backend:3000
    }
    handle /events {
        reverse_proxy backend:3000
    }
    handle /eyes/* {
        reverse_proxy backend:3000
    }
    handle /eyes {
        reverse_proxy backend:3000
    }
    handle /analytics/* {
        reverse_proxy backend:3000
    }
    handle /pipelines/* {
        reverse_proxy backend:3000
    }
    handle /pipelines {
        reverse_proxy backend:3000
    }
    handle /customer-orders/* {
        reverse_proxy backend:3000
    }
    handle /customer-orders {
        reverse_proxy backend:3000
    }

    # Everything else -> frontend
    handle {
        reverse_proxy frontend:80
    }
}
```

**Alternative (simpler, if API is prefixed):** If the backend adopts an `/api` prefix in the future, this simplifies to two `handle` blocks. For now, enumerate the routes.

### 7. Environment file (`.env.example`)

```bash
# Required
DATABASE_URL=postgres://user:password@host:25060/manugen?sslmode=require
DOMAIN=app.your-domain.com

# Optional
CORS_ORIGIN=https://app.your-domain.com
NODE_ENV=production
```

### 8. Provisioning script (`scripts/provision-droplet.sh`)

For first-time Droplet setup (run via SSH):

```bash
#!/usr/bin/env bash
set -euo pipefail

# Update system
apt-get update && apt-get upgrade -y

# Install Docker
curl -fsSL https://get.docker.com | sh

# Install Docker Compose plugin
apt-get install -y docker-compose-plugin

# Create app user
useradd -m -s /bin/bash deploy
usermod -aG docker deploy

# Create app directory
mkdir -p /opt/manu
chown deploy:deploy /opt/manu

# Set up firewall (UFW)
ufw allow 22/tcp    # SSH
ufw allow 80/tcp    # HTTP (Caddy redirect)
ufw allow 443/tcp   # HTTPS
ufw --force enable

echo "Provisioning complete. Deploy as 'deploy' user to /opt/manu"
```

### 9. Deploy script (`scripts/deploy.sh`)

For subsequent deployments (run from local machine or CI):

```bash
#!/usr/bin/env bash
set -euo pipefail

DROPLET_IP="${DROPLET_IP:?Set DROPLET_IP}"
DEPLOY_USER="${DEPLOY_USER:-deploy}"
REMOTE_DIR="/opt/manu"

echo "Deploying to ${DEPLOY_USER}@${DROPLET_IP}..."

# Sync infra files
rsync -avz --delete \
  docker-compose.prod.yml caddy/ scripts/ .env \
  "${DEPLOY_USER}@${DROPLET_IP}:${REMOTE_DIR}/"

# Build and restart on remote
ssh "${DEPLOY_USER}@${DROPLET_IP}" "cd ${REMOTE_DIR} && \
  docker compose -f docker-compose.prod.yml pull && \
  docker compose -f docker-compose.prod.yml build && \
  docker compose -f docker-compose.prod.yml up -d --remove-orphans"

echo "Deployment complete."
```

**Note:** This is a simple rsync+ssh deploy. For CI/CD, a GitHub Action can trigger this on push to `main`.

### 10. README.md

Document:
- Prerequisites (DigitalOcean account, domain, DNS pointing to Droplet)
- First-time setup (provision, create Managed Postgres, configure `.env`)
- Deploy workflow
- How to view logs (`docker compose logs -f`)
- How to run migrations manually if needed
- Backup strategy (Managed Postgres handles it, but document `backup-db.sh` for manual dumps)

## Validation Criteria

- [ ] `docker compose -f docker-compose.prod.yml config` validates without errors
- [ ] Backend Dockerfile.prod builds successfully and runs `node dist/index.js`
- [ ] Frontend Dockerfile.prod builds successfully and Nginx serves the SPA
- [ ] Caddyfile syntax is valid (`caddy validate --config Caddyfile`)
- [ ] `.env.example` documents all required environment variables
- [ ] README covers the full setup and deploy workflow
