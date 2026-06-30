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

3. Update `backend/.env` with your MongoDB URI, email settings, JWT secret, and client URL.

4. Start the full development stack:

```bash
npm run dev
```

Backend runs on `http://localhost:5000`.
Frontend runs on `http://localhost:5173`.

## Production Build

```bash
npm run build --prefix frontend
npm run start --prefix backend
```

## CI/CD

The workflow in `.github/workflows/ci-cd.yml` runs install, frontend build, and backend syntax checks on pushes and pull requests to `main`.

Deployment is prepared through an optional `DEPLOY_HOOK_URL` repository secret. Add that secret in GitHub when you connect a hosting provider such as Render, Railway, Vercel, or a custom deployment webhook.
