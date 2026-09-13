# Deployment and rollback

Eigenflow deploys as one stateless Render web service. Render builds the root
`Dockerfile`, runs its existing `CMD`, terminates TLS, and sends application-level
health checks to `/api/health`. The `PORT=8000` service setting matches the port
used by the Docker image and local Compose workflow.

Production: [eigenflow-8tdq.onrender.com](https://eigenflow-8tdq.onrender.com)

The checked-in [`render.yaml`](../render.yaml) is intentionally limited to one
service. There is no database, persistent disk, cross-origin API, or production
secret to configure.

## Release sequence

1. Merge a reviewed commit to `main` and wait for GitHub Actions to pass.
2. Render builds that commit with the same multi-stage `Dockerfile` exercised by
   CI and promotes it only after `/api/health` succeeds.
3. Run the public HTTP smoke check:

   ```powershell
   $env:EIGENFLOW_BASE_URL = "https://eigenflow-8tdq.onrender.com"
   python scripts/container_smoke.py
   ```

4. Run the primary recruiter journey against both configured Playwright projects:

   ```powershell
   $env:EIGENFLOW_E2E_BASE_URL = "https://eigenflow-8tdq.onrender.com"
   cd frontend
   npx playwright test e2e/bottleneck.spec.ts
   ```

5. Confirm the repository homepage and README point to the same live host, then
   create the annotated release tag.

## Rollback

If a deploy fails its health check, Render retains the previous healthy deploy.
For a regression that passes readiness, restore one of the two previous deploys
from the Render dashboard, then revert the responsible Git commit on `main` and
let CI verify the corrective deploy.

## Free-service tradeoff

The initial portfolio deployment uses Render's free web-service plan. An idle
service spins down after 15 minutes and can take about one minute to wake. That is
acceptable for a no-cost portfolio release but is not an always-on production
SLA; moving to an always-on plan changes hosting only, not the application image.

Provider behavior and fields are grounded in Render's official documentation:
[Blueprint specification](https://render.com/docs/blueprint-spec),
[Docker services](https://render.com/docs/docker),
[health checks](https://render.com/docs/health-checks), and
[free-service limits](https://render.com/docs/free).
