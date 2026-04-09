# Job Application Tracker — Frontend

A Next.js 15 frontend for an AI-assisted job application tracking platform. Built with App Router, TypeScript, and Tailwind CSS. Deployed on Vercel.

**Live app:** `https://job-tracker-frontend-blush.vercel.app`  
**Backend repo:** `https://github.com/jfeliweb/job-app-tracker-api`  
**Backend API:** `https://job-app-tracker-api-production.up.railway.app`

---

## What it does

Job seekers can register, track job applications across companies, update application statuses, set follow-up reminders, and generate AI-drafted cover letters by pasting a job description.

---

## Tech stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 15 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS |
| HTTP client | Native `fetch` (no axios) |
| Auth | JWT stored in localStorage |
| Hosting | Vercel |

No external HTTP library — the API layer is a thin native `fetch` wrapper with JWT injection and 401 handling built in.

---

## Architecture

```
Browser
  │
  │  All API calls go to /api/backend/*
  ▼
Next.js on Vercel (server-side rewrite)
  │
  │  Proxied to Railway backend
  ▼
Spring Boot API
```

The `next.config.ts` rewrites proxy all `/api/backend/*` requests server-side to the Railway backend. The backend URL is never exposed to the browser — no CORS issues, no leaked endpoints.

---

## Project structure

```
├── app/
│   ├── page.tsx                    # Root redirect (login or dashboard)
│   ├── layout.tsx                  # Root layout
│   ├── login/page.tsx              # Login page
│   ├── register/page.tsx           # Registration page
│   ├── dashboard/page.tsx          # Application list + stats + filters
│   └── applications/
│       ├── new/page.tsx            # New application form
│       └── [id]/page.tsx           # Application detail, edit, reminders, cover letter
├── lib/
│   ├── api.ts                      # fetch wrapper with JWT injection and 401 redirect
│   └── auth.ts                     # localStorage helpers with SSR guard
├── types/
│   └── index.ts                    # TypeScript interfaces (Application, AuthResponse, etc.)
└── next.config.ts                  # Rewrite proxy to Railway backend
```

---

## Key pages

**Dashboard** — shows all applications with status counts (Applied, Interview, Offer, Rejected), filterable by status, each card linking to the detail page.

**Application detail** — inline editing of title, company, status, notes, and date. Includes a reminder scheduler (date + time picker) that displays pending/sent state, and an AI cover letter generator that accepts a pasted job description and returns an editable draft.

**Auth pages** — register and login with JWT stored in localStorage. The root page redirects to `/dashboard` if a token exists, otherwise to `/login`. A 401 response on any API call clears the token and redirects to login.

---

## Key engineering decisions

**Native fetch over axios** — after the March 2026 axios npm supply chain compromise, the project was deliberately built on the native `fetch` API. The `lib/api.ts` wrapper handles JWT injection, error normalization, and 401 redirects with zero external dependencies.

**SSR guard on localStorage** — Next.js App Router pre-renders pages on the server where `localStorage` doesn't exist. All auth helpers in `lib/auth.ts` check `typeof window === 'undefined'` before accessing localStorage, preventing build-time crashes.

**Server-side proxy rewrites** — the backend URL lives only in Vercel's environment variables. Requests go from the browser to Vercel's edge, then Vercel proxies to Railway. The Spring Boot server never needs to handle browser CORS preflight for arbitrary origins.

**Parallel data fetching** — the application detail page uses `Promise.all()` to fetch the application and its reminders simultaneously rather than sequentially, cutting load time in half on that route.

---

## Local setup

**Prerequisites:** Node.js 20+

```bash
# Clone
git clone https://github.com/jfeliweb/job-tracker-frontend
cd job-tracker-frontend

# Install
npm install

# Configure
echo "BACKEND_URL=http://localhost:8080" > .env.local
# Or point at the live backend:
# echo "BACKEND_URL=https://job-app-tracker-api-production.up.railway.app" > .env.local

# Run
npm run dev
```

Open `http://localhost:3000`.

---

## Environment variables

| Variable | Description |
|----------|-------------|
| `BACKEND_URL` | Spring Boot backend base URL (no trailing slash) |

Set in `.env.local` for local dev. Set in Vercel dashboard for production.

---

## Deployment

Deployed to Vercel via GitHub integration. Every push to `main` triggers a production deploy automatically.

The `BACKEND_URL` environment variable is set in the Vercel dashboard pointing to the Railway backend. Next.js rewrites in `next.config.ts` handle all proxying at build and runtime.

```typescript
// next.config.ts
async rewrites() {
  return [{
    source: '/api/backend/:path*',
    destination: process.env.BACKEND_URL
      ? `${process.env.BACKEND_URL}/:path*`
      : 'http://localhost:8080/:path*',
  }]
}
```