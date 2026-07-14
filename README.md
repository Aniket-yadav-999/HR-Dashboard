# HR Dashboard

AAGarg HR Dashboard is a MERN-based people operations workspace for employee records, attendance and leave, engagement, organization hierarchy, assets, helpdesk requests, notifications, and reports.

## Tech Stack

- React, Vite, Tailwind CSS
- Node.js, Express
- MongoDB with Mongoose
- GitHub Actions for CI/CD checks

## Local Setup

1. Install dependencies:

```bash
npm run install:all
```

2. Create the backend environment file:

```bash
copy backend\.env.example backend\.env
```

3. Update `backend/.env` with your MongoDB URI, email settings, JWT secret, and frontend URLs. `CLIENT_URLS` accepts comma-separated URLs, so local and deployed frontends can both be enabled.

4. Start the full development stack:

```bash
npm run dev
```

Backend runs on `http://localhost:5000`.
Frontend runs on `http://localhost:5173`.

The frontend uses `/api` by default. Vite proxies that path to the local backend during development, while `frontend/vercel.json` rewrites it to the Render backend in production. You can instead set `VITE_API_URL` (including the `/api` suffix) when deploying the frontend to another provider.

## Production Build

```bash
npm run build --prefix frontend
npm run start --prefix backend
```

## CI/CD

The workflow in `.github/workflows/ci-cd.yml` runs install, frontend build, and backend syntax checks on pushes and pull requests to `main`.

Deployment is prepared through an optional `DEPLOY_HOOK_URL` repository secret. Add that secret in GitHub when you connect a hosting provider such as Render, Railway, Vercel, or a custom deployment webhook.
