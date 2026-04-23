# Sub-plan 5: Deploy to DigitalOcean

> **Parent plan:** [Production Architecture Plan](production_architecture_plan_87189a29.plan.md)
> **Stage:** 4 (final)
> **Can start:** After Sub-plans 3 (Postgres Migration) and 4 (Production Infra) are complete
> **Blocks:** Nothing (this is the final step)
> **Depends on:** Sub-plan 1a (repos on GitHub), Sub-plan 3 (Postgres migration working), Sub-plan 4 (infra configs ready)

## Objective

Deploy manu-gen (backend + frontend) to DigitalOcean with Managed Postgres. Verify end-to-end: dashboard accessible over HTTPS, API responds, seed data works.

## Prerequisites

- `agrus-ops/manu-gen` repo exists with Postgres-migrated backend (Sub-plans 1a + 3)
- `agrus-ops/manu-infra` repo exists with production configs (Sub-plans 1a + 4)
- DigitalOcean account is set up
- A domain name is available and DNS can be configured
- `doctl` CLI installed and authenticated (optional but helpful)

## Tasks

### 1. Provision DigitalOcean Managed Postgres

Via DigitalOcean dashboard or `doctl`:

```bash
doctl databases create manugen-db \
  --engine pg \
  --version 17 \
  --size db-s-1vcpu-1gb \
  --region fra1 \
  --num-nodes 1
```

**Settings:**
- Engine: PostgreSQL 17
- Plan: Basic, $15/mo (1 vCPU, 1GB RAM, 10GB storage)
- Region: Choose closest to your users (e.g., `fra1` for Europe)
- Nodes: 1 (single node is fine for MVP)

**After creation:**
- Note the connection string (DATABASE_URL) from the dashboard
- Create a database named `manugen` (the default is `defaultdb`)
- The connection string includes `?sslmode=require` by default -- keep it

### 2. Provision DigitalOcean Droplet

```bash
doctl compute droplet create manugen-app \
  --image ubuntu-24-04-x64 \
  --size s-2vcpu-2gb \
  --region fra1 \
  --ssh-keys <your-ssh-key-fingerprint>
```

**Settings:**
- Image: Ubuntu 24.04 LTS
- Plan: $12/mo (2 vCPU, 2GB RAM, 50GB SSD)
- Region: Same as Postgres cluster
- SSH key: Add your public key

**After creation:**
- Note the Droplet's public IP address
- Add the Droplet to the database cluster's "Trusted Sources" (DigitalOcean dashboard -> Database -> Settings -> Trusted Sources -> Add Droplet)

### 3. Configure DNS

Point your domain to the Droplet IP:

```
A record:  app.your-domain.com  ->  <DROPLET_IP>
```

Caddy needs the DNS to resolve before it can issue a TLS certificate. Wait for DNS propagation (usually 1-5 minutes with most registrars).

### 4. Run provisioning script on Droplet

SSH into the Droplet and run the provisioning script from Sub-plan 4 (Production Infra):

```bash
ssh root@<DROPLET_IP>

# Install Docker + create deploy user + configure firewall
# (paste or scp the provision-droplet.sh script)
bash provision-droplet.sh
```

### 5. Deploy application

From your local machine (or as the `deploy` user on the Droplet):

```bash
# Clone repos on the Droplet
ssh deploy@<DROPLET_IP>
cd /opt/manu

# Clone application and infra repos
git clone git@github.com:agrus-ops/manu-gen.git
git clone git@github.com:agrus-ops/manu-infra.git

# Create .env from example
cp manu-infra/.env.example manu-infra/.env
# Edit .env with:
#   DATABASE_URL=<connection string from step 1>
#   DOMAIN=app.your-domain.com
#   CORS_ORIGIN=https://app.your-domain.com

# Build and start
cd manu-infra
docker compose -f docker-compose.prod.yml build
docker compose -f docker-compose.prod.yml up -d
```

**Note:** The `docker-compose.prod.yml` build contexts need to reference the `manu-gen` clone. Adjust paths in the compose file or use a symlink structure:

```
/opt/manu/
  manu-gen/          # cloned repo
    backend/
    frontend/
  manu-infra/        # cloned repo
    docker-compose.prod.yml  (build context: ../manu-gen/backend)
    caddy/
    .env
```

### 6. Verify deployment

```bash
# Check all containers are running
docker compose -f docker-compose.prod.yml ps

# Check backend health
curl https://app.your-domain.com/health
# Expected: {"status":"ok"}

# Check frontend loads
curl -s https://app.your-domain.com | head -20
# Expected: HTML with React app

# Check Caddy TLS
curl -vI https://app.your-domain.com 2>&1 | grep "SSL certificate"
# Expected: valid certificate from Let's Encrypt
```

### 7. Run migrations and seed data

Migrations should run automatically on backend startup (part of Sub-plan 3's migration runner). Verify:

```bash
# Check backend logs for migration output
docker compose -f docker-compose.prod.yml logs backend | grep -i migrat

# Optionally seed demo data
# (run seed-demo.mjs against the production API -- only if you want demo data)
API_URL=https://app.your-domain.com node /opt/manu/manu-gen/scripts/seed-demo.mjs
```

### 8. Set up DigitalOcean Cloud Firewall

Via dashboard or `doctl`:

```bash
doctl compute firewall create \
  --name manugen-fw \
  --droplet-ids <DROPLET_ID> \
  --inbound-rules "protocol:tcp,ports:22,address:0.0.0.0/0 protocol:tcp,ports:80,address:0.0.0.0/0 protocol:tcp,ports:443,address:0.0.0.0/0" \
  --outbound-rules "protocol:tcp,ports:all,address:0.0.0.0/0 protocol:udp,ports:all,address:0.0.0.0/0"
```

Only allow:
- Port 22 (SSH) -- consider restricting to your IP
- Port 80 (HTTP, for Caddy redirect to HTTPS)
- Port 443 (HTTPS)

### 9. Set up monitoring (basic)

- **DigitalOcean Monitoring:** Enable on the Droplet (free, tracks CPU/memory/disk)
- **Uptime check:** DigitalOcean Uptime -> Add check for `https://app.your-domain.com/health`
- **Postgres monitoring:** Built into Managed Postgres dashboard (connections, queries, storage)

## Validation Criteria

- [ ] `https://app.your-domain.com` loads the React dashboard over HTTPS
- [ ] `https://app.your-domain.com/health` returns `{"status":"ok"}`
- [ ] API endpoints work (create a station, create a pipeline, etc. via dashboard)
- [ ] Managed Postgres is accessible only from the Droplet (trusted sources configured)
- [ ] Firewall restricts access to ports 22, 80, 443 only
- [ ] Caddy auto-renews TLS certificates (verify cert expiry > 60 days)
- [ ] `docker compose logs` shows no errors
- [ ] Seed data (if run) is visible in the dashboard

## Cost Summary

| Resource | Monthly Cost |
|----------|-------------|
| Droplet (2 vCPU, 2GB) | $12 |
| Managed Postgres (1 vCPU, 1GB, 10GB) | $15 |
| **Total** | **$27/mo** |
