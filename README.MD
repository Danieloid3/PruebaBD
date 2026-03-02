# MegaStore Data Platform

Full-stack exam project that ingests a denormalized CSV dataset, normalizes it into PostgreSQL, exposes CRUD APIs with Express, and keeps an aggregated customer-history view in MongoDB. Infrastructure can run locally or through Docker Compose.

## Architecture at a Glance
- **Express API (`src/app.js`)** – REST endpoints for admins, patients, doctors, appointments, insurances, treatments, and specialties. Health probe at `/health`.
- **PostgreSQL 16** – Holds the normalized transactional schema (`sql/01_schema.sql`). A staging table is populated from `sql/staging_megastore.csv` before normalization.
- **MongoDB 7** – Stores patient history documents (`patients_history` collection) fed by admin sync or appointment lifecycle hooks.
- **Data pipeline helpers** – SQL scripts (`sql/00_staging_schema.sql`, `sql/02_normalize.sql`) and admin routes handle schema resets, data migration, and Mongo sync.
- **Docs** – Conceptual diagram available in `docs/MER.pdf`.

```
src/
  app.js              # Express bootstrap + route mounting
  config/db.js        # Postgres pool + staging bootstrap
  mongo/              # Mongo connection + patient history services
  controllers/        # HTTP controllers per resource
  services/           # Business logic (SQL + Mongo sync)
  routes/             # Express routers mounted under /api
sql/
  00_staging_schema.sql
  01_schema.sql
  02_normalize.sql
  staging_saludplus.csv
```

## Prerequisites
- Node.js 20.x and npm 10+
- PostgreSQL 16 (local or remote) or Docker Desktop + Compose
- MongoDB 7 (local or remote)
- Optional CLIs: `psql`, `mongosh`, `curl`

## Environment Variables
Copy `.env.example` to `.env` and adjust as needed.

| Name | Description | Default |
| --- | --- | --- |
| `PORT` | Express listening port | `3000`
| `DATABASE_URL` | Full Postgres cloud URL (`postgres://user:pass@host:port/db`) | empty
| `PGLOCAL_USER` | Local Postgres user for fallback pool | `postgres`
| `PGLOCAL_PASSWORD` | Local Postgres password | `postgres`
| `PGLOCAL_DB` | Local Postgres database name | `saludplus`
| `PGLOCAL_HOST` | Local Postgres host | `localhost`
| `PGLOCAL_PORT` | Local Postgres port | `5432`
| `MONGODB_URI` | Cloud Mongo URI (if provided, takes precedence) | empty
| `MONGODB_DB` | Mongo database name used with `MONGODB_URI` | `simulacroBD`
| `MONGOLOCAL_URI` | Local Mongo URI fallback | `mongodb://localhost:28017`
| `MONGOLOCAL_DB` | Local Mongo database fallback | `simulacroBD`

## Install Dependencies
```powershell
cd C:\Users\danig\WebstormProjects\simulacroBD
npm install
```

## Running the Databases
### Option A – Docker Compose (recommended)
```powershell
docker compose up -d postgres mongo
```
- Postgres is exposed on `localhost:5432` with credentials defined in `.env` (defaults: `postgres/postgres`).
- Mongo is exposed on `localhost:28017`.
- Volumes `pgdata` and `mongodata` persist data between runs.

### Option B – Bring Your Own Instances
1. Create a Postgres database named `saludplus` (or match `PGLOCAL_DB`).
2. Create a Mongo database named `simulacroBD` (or match `MONGOLOCAL_DB`).
3. Update `.env` so the API can reach both services.

## Provisioning PostgreSQL Data
The API automatically creates/loads the staging table when it connects to a local Postgres instance. Run the normalization scripts before serving real traffic:

1. **Reset schema (drops/recreates transactional tables):**
   ```powershell
   psql -h localhost -U postgres -d saludplus -f sql/01_schema.sql
   ```
2. **Normalize data from staging into final tables:**
   ```powershell
   psql -h localhost -U postgres -d saludplus -f sql/02_normalize.sql
   ```

> Alternatively, once the API is running you can hit the admin helper endpoints:
> - `POST /api/admin/reset-schema`
> - `POST /api/admin/migrate-data`
> These endpoints stream the same SQL files through the Node connection.

## Run the API (local development)
1. Ensure Postgres and Mongo are reachable.
2. Start the server with hot reload:
   ```powershell
   npm run dev
   ```
3. Verify the health probe: <http://localhost:3000/health>

## Run Everything with Docker Compose
1. Make sure you have a `start` script in `package.json` (e.g., `"start": "node src/app.js"`). Docker’s CMD runs `npm start`, so the container will fail without it.
2. Build and start all services:
   ```powershell
   docker compose up --build
   ```
3. The API will be available on `http://localhost:3000` (or the port set via `PORT`).
4. During development you can mount live code (already configured via the `api` service volumes) and inspect logs with `docker compose logs -f api`.

## Core API Surface
Base URL: `http://localhost:3000/api`

| Resource | Routes |
| --- | --- |
| `admin` | `POST /reset-schema`, `POST /migrate-data`, `GET /sync-mongo`, `GET /mongo-history` |
| `customers` | `GET /`, `GET /:id`, `POST /`, `PUT /:id`, `DELETE /:id` |
| `suppliers` | CRUD mirrors customer routes |


All responses are JSON. Controllers propagate SQL errors with meaningful HTTP status codes (e.g., FK violations on appointments return 400).

## MongoDB Customer History Sync
- Whenever an appointment is created, updated, or deleted, the API rebuilds the patient’s full history from Postgres and upserts it into the `patients_history` collection.
- To backfill or re-sync every patient, call `GET /api/admin/sync-mongo`. The response summarizes how many documents were updated and returns sample payloads.
- Inspect Mongo contents with:
  ```powershell
  mongosh "mongodb://localhost:28017/simulacroBD" --eval "db.patients_history.find({}, {_id:0}).limit(3).pretty()"
  ```

## Testing & Validation
- No automated tests ship with the template. Use the health endpoint and CRUD operations to validate manually.
- Recommended manual checks after setup:
  1. `GET /api/patients` returns normalized patients.
  2. `POST /api/appointments` both inserts in Postgres and updates Mongo (`GET /api/admin/mongo-history`).
  3. `GET /api/insurances` shows providers derived from the CSV.

## Troubleshooting
- **Docker API container exits immediately:** Ensure `npm start` exists or override the command (`docker compose run api npm run dev`).
- **Postgres connection fails:** Confirm credentials in `.env`, ensure the container is healthy (`docker compose ps`) and that no other service is using port 5432.
- **Mongo sync errors:** The API logs Mongo issues but keeps serving HTTP requests. Check `MONGODB_URI` and that the target database allows writes.
- **CSV changes:** Update `sql/staging_saludplus.csv` and rerun the staging + normalization steps to refresh all tables.

## Reference Material
- `docs/MER.pdf` – conceptual data model and entity relationships.
- `sql/` directory – reproducible migrations for exams/demos.

With the steps above you should be able to stand up the full stack, load the sample data set, and exercise every endpoint locally or inside containers.
