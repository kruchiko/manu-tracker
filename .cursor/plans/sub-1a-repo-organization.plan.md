# Sub-plan 1a: Repository Organization

> **Parent plan:** [Production Architecture Plan](production_architecture_plan_87189a29.plan.md)
> **Stage:** 1 (first)
> **Can start:** Immediately (no dependencies)
> **Blocks:** Sub-plan 1b (Frontend Polish), Sub-plan 3 (Postgres Migration), Sub-plan 5 (Deploy)
> **This runs first** so all subsequent work happens in the new org repos.

## Objective

Split the current monorepo (`manu-tracker`) into 3 repos under the `agrus-ops` GitHub organization:
- `agrus-ops/manu-gen` -- Backend API + Frontend Dashboard
- `agrus-ops/manu-eye` -- IoT Device Software (Python)
- `agrus-ops/manu-infra` -- Production infrastructure (populated by Sub-plan 4)

Preserve git history for each component using `git filter-repo`.

## Prerequisites

- The `agrus-ops` GitHub organization exists at https://github.com/agrus-ops
- `gh` CLI is authenticated with permissions to create repos in the org
- `git-filter-repo` is installed (`brew install git-filter-repo` or `pip install git-filter-repo`)

**Note:** This runs BEFORE the Postgres migration and frontend polish. The `infra/` directory (Sub-plan 4) doesn't exist yet, so `manu-infra` is created as an empty repo with a README and populated later.

## Tasks

### 1. Create GitHub repos

Using `gh` CLI (the GitHub MCP `create_repository` tool doesn't support org repos):

```bash
gh repo create agrus-ops/manu-gen --private --description "Manufacturing tracker: API + Dashboard"
gh repo create agrus-ops/manu-eye --private --description "Manufacturing tracker: IoT device software"
gh repo create agrus-ops/manu-infra --private --description "Manufacturing tracker: production infrastructure"
```

Do NOT initialize with README (we'll push existing code).

### 2. Split manu-gen (backend + frontend)

Clone a fresh copy of the monorepo and filter to keep only `manu-gen/`:

```bash
# Work in a temp directory
cd /tmp
git clone /Users/maksym/Projects/manu-tracker manu-gen-split
cd manu-gen-split

# Keep manu-gen/, docs/ (design specs needed for frontend), and root-level files
git filter-repo \
  --path manu-gen/ \
  --path docs/ \
  --path docker-compose.yml \
  --path .gitignore \
  --path README.md \
  --path scripts/seed-demo.mjs \
  --path scripts/clean-docker-db.sh \
  --path scripts/seed-fixtures.sh

# Move manu-gen/* contents up one level (flatten)
git filter-repo --path-rename manu-gen/backend/:backend/
git filter-repo --path-rename manu-gen/frontend/:frontend/

# Push to new repo
git remote add origin git@github.com:agrus-ops/manu-gen.git
git push -u origin main
```

**Post-push tasks:**
- Copy/adapt CI workflows from `.github/workflows/ci-manu-gen-backend.yml` and `ci-manu-gen-frontend.yml` to the new repo's `.github/workflows/`
- Update paths in CI workflows (remove `manu-gen/` prefix)
- Verify CI passes on the new repo

### 3. Split manu-eye

```bash
cd /tmp
git clone /Users/maksym/Projects/manu-tracker manu-eye-split
cd manu-eye-split

git filter-repo --path manu-eye/

# Flatten
git filter-repo --path-rename manu-eye/:./

# Push
git remote add origin git@github.com:agrus-ops/manu-eye.git
git push -u origin main
```

**Post-push tasks:**
- Copy/adapt CI workflow from `ci-manu-eye.yml`
- Update paths in CI workflow (remove `manu-eye/` prefix)
- Verify CI passes

### 4. Initialize manu-infra

Since the infra content (Sub-plan 4) hasn't been created yet, initialize with a README placeholder:

```bash
cd /tmp
mkdir manu-infra && cd manu-infra
git init
cat > README.md << 'EOF'
# manu-infra

Production infrastructure for ManuTracker: Docker Compose, Caddy, deploy scripts for DigitalOcean.

Content will be added by Sub-plan 4 (Production Infrastructure).
EOF
git add .
git commit -m "feat: initialize manu-infra repo"
git remote add origin git@github.com:agrus-ops/manu-infra.git
git push -u origin main
```

**Note:** Sub-plan 4 (Production Infra) will populate this repo with Docker Compose, Caddyfile, deploy scripts, etc.

### 5. Update CI workflows in each repo

**agrus-ops/manu-gen:**
- `.github/workflows/ci-backend.yml` -- same as current `ci-manu-gen-backend.yml` but with updated paths (no `manu-gen/` prefix). Keep SQLite `:memory:` for now; Postgres CI is added later in Sub-plan 3 (Postgres Migration).
- `.github/workflows/ci-frontend.yml` -- same as current `ci-manu-gen-frontend.yml` with updated paths
- Remove path filters that referenced `manu-gen/**` (now everything is at root)

**agrus-ops/manu-eye:**
- `.github/workflows/ci.yml` -- same as current `ci-manu-eye.yml` with updated paths
- Remove path filters that referenced `manu-eye/**`

**agrus-ops/manu-infra:**
- `.github/workflows/deploy.yml` -- new workflow for deployment (optional, can be manual for now)

### 6. Update cross-repo references

**manu-gen README.md:**
- Update to reflect standalone repo structure
- Reference `agrus-ops/manu-eye` for the IoT device component
- Reference `agrus-ops/manu-infra` for deployment
- Update setup instructions (no longer a monorepo)

**manu-eye README.md:**
- Update `BACKEND_URL` instructions to point to production URL
- Reference `agrus-ops/manu-gen` for the backend

### 7. Archive original repo

After verifying all three new repos work:

```bash
# Option A: Archive (read-only, keeps history as reference)
gh repo archive manu-tracker --yes

# Option B: Update README to point to new repos, keep for reference
# Add a prominent notice in README.md pointing to the new org repos
```

**Recommendation:** Option B for now -- keep the original repo with a redirect notice until you're confident everything works in the new repos.

## Validation Criteria

- [ ] `agrus-ops/manu-gen` contains `backend/`, `frontend/`, `docs/`, `docker-compose.yml`, and all scripts
- [ ] `agrus-ops/manu-eye` contains `src/`, `pyproject.toml`, tests, and README
- [ ] `agrus-ops/manu-infra` contains a placeholder README (content added by Sub-plan 4 later)
- [ ] Git history is preserved in manu-gen and manu-eye (verify with `git log`)
- [ ] CI passes in all three repos
- [ ] No dangling cross-repo references (paths, imports)
- [ ] Original manu-tracker repo has a redirect notice or is archived
