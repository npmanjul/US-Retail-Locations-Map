
# US Retail Locations Map

A scalable geospatial retail mapping platform built to efficiently render and manage large retail datasets using clustering, spatial queries, caching, and viewport-based APIs.

---

## Tech Stack

- **Backend**: Node.js, Express, TypeScript, PostgreSQL, PostGIS, Supercluster, node-cache, Papa Parse, Docker
- **Frontend**: React Vite, TypeScript, Axios

---

## Project Layout

Top-level structure (important folders):

```
.github/worklflows/deploy.yml

backend/
	├─ src/
	├─ data/
	├─ dataset/
	├─ init/
	├─ package.json
	└─ dockerfile

frontend/
	├─ src/
	├─ public/
	├─ package.json
	└─ vite.config.ts

readme.md
```

---

## Getting Started

Prerequisites: Node.js, pnpm, Docker (optional), PostgreSQL with PostGIS.

### Backend

1. Change to the backend folder:

```bash
cd backend
```

2. Install dependencies:

```bash
pnpm install
```

3. Create a `.env` file in `backend/` with these variables:

```
PORT=8000
DATABASE_URL=postgresql://postgres:password@localhost:5432/retail_map
FRONTEND_URL=http://localhost:5173
```

4. Run the backend in development:

```bash
pnpm dev
```

The backend listens on `http://localhost:8000` by default.

### Frontend

1. Change to the frontend folder:

```bash
cd frontend
```

2. Install dependencies:

```bash
pnpm install
```

3. Run the frontend:

```bash
pnpm dev
```

The frontend runs at `http://localhost:5173` by default.

---

## Features

- Scalable retail location visualization
- Marker clustering (Supercluster)
- Viewport-based, bounding-box queries
- Geospatial queries via PostGIS
- CSV dataset import support
- In-memory API caching in the backend using node-cache for improved performance.
- Dockerized setup for deployment

---

## Architecture Overview

- Backend:
	- `src/controller` — request handlers
	- `src/services` — business logic (clustering, DB queries, caching)
	- `src/db` — database connection and setup
	- `startup/seedDatabase.ts` — dataset seeding helper

- Frontend:
	- `src/components/Map.tsx` — map display and clustering
	- `src/services/axiosClient.ts` — API client
	- `src/utils` — helper utilities and memoization

---

## Optimization Techniques

- Use PostGIS spatial indexes and bounding-box queries to limit DB work
- Supercluster on the server for efficient clustering
- Node-cache for cheap in-memory caching of API responses
- Frontend payload minimization and viewport-based fetches

---

## Environment Variables

- `PORT` — backend server port
- `DATABASE_URL` — PostgreSQL connection string (with PostGIS)
- `FRONTEND_URL` — allowed frontend origin for CORS

---

## Trade-offs and Notes

- Authentication and advanced UI were omitted to prioritize map performance and core geospatial features.
- In-memory caching (node-cache) used for simplicity; consider Redis for production.
- Limited automated tests due to time constraints.

---

## Future Improvements

- Replace in-memory cache with Redis for distributed caching
- Add authentication/authorization and role-based views
- Support real-time updates (websockets) for live data
- Add advanced filtering, analytics, and an admin dashboard
- Add CI/CD, monitoring, and horizontal scaling

---

## Author

Anjul Singh 
