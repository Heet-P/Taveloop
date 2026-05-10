# Traveloop — Full-Stack Travel Planning Platform

> A production-grade web application for end-to-end travel planning: itinerary building, budget tracking, packing checklists, collaborative community sharing, AI-powered activity discovery, and administrative analytics — built on a normalised relational MySQL database with a REST API backend and a React/Next.js frontend.

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Architecture Overview](#2-architecture-overview)
3. [Database Design](#3-database-design)
   - [Schema Diagram (ERD Description)](#schema-diagram-erd-description)
   - [Table Definitions](#table-definitions)
   - [Normalisation Rationale](#normalisation-rationale)
   - [Indexing and Constraints](#indexing-and-constraints)
4. [Backend — Express REST API](#4-backend--express-rest-api)
   - [Tech Stack](#backend-tech-stack)
   - [Project Structure](#backend-project-structure)
   - [API Endpoints Reference](#api-endpoints-reference)
   - [Middleware & Security](#middleware--security)
   - [External API Integrations](#external-api-integrations)
5. [Frontend — Next.js Application](#5-frontend--nextjs-application)
   - [Tech Stack](#frontend-tech-stack)
   - [Project Structure](#frontend-project-structure)
   - [Pages & Features](#pages--features)
   - [State Management](#state-management)
6. [Feature Walkthrough](#6-feature-walkthrough)
7. [Authentication & Authorisation](#7-authentication--authorisation)
8. [Setup & Installation](#8-setup--installation)
9. [Environment Variables](#9-environment-variables)
10. [Design Decisions](#10-design-decisions)

---

## 1. Project Overview

Traveloop solves a fragmented planning problem: travellers currently manage trips across spreadsheets, messaging apps, note-taking tools, and booking platforms with no single source of truth. Traveloop consolidates every stage of a trip — planning, budgeting, packing, and sharing — into one coherent platform.

**Core capabilities:**

| Capability                   | Description                                                       |
| ---------------------------- | ----------------------------------------------------------------- |
| Trip Management              | Create, edit, publish, and share multi-stop trips                 |
| Itinerary Builder            | Drag-and-drop stop ordering, nested activity management           |
| AI Activity Discovery        | OpenTripMap radius search with Wikipedia extracts; POI caching    |
| Budget Tracker               | Expense categories, Recharts visualisations, daily cost breakdown |
| Packing Checklist            | Category-grouped items, progress tracking, batch reset            |
| Trip Notes                   | Trip-level and stop-level rich notes with search                  |
| Invoice Generator            | Split-cost calculator, tax/discount support, print to PDF         |
| Community Feed               | Public trip gallery with likes, copies, and multi-sort            |
| Shared Trip Links            | Token-based public read-only views                                |
| Profile & Saved Destinations | User stats, saved cities, recent trips                            |
| Admin Dashboard              | Platform analytics, user directory, trend charts                  |

---

## 2. Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                        CLIENT BROWSER                       │
│                  Next.js 16  (React 19, App Router)         │
│      Clerk Auth  │  Recharts  │  DnD Kit  │  Framer Motion  │
└────────────────────────┬────────────────────────────────────┘
                         │  HTTPS / REST JSON
┌────────────────────────▼────────────────────────────────────┐
│                   EXPRESS 5 REST API                        │
│   Node.js  │  TypeScript  │  Helmet  │  CORS  │  Morgan     │
│   Clerk SDK  │  Multer (file uploads)  │  mysql2             │
└────────────────────────┬────────────────────────────────────┘
                         │  mysql2 connection pool
┌────────────────────────▼────────────────────────────────────┐
│                   MySQL 8 DATABASE                          │
│   12 normalised tables  │  foreign key constraints          │
│   compound indexes  │  transactions for multi-table writes   │
└─────────────────────────────────────────────────────────────┘
                         │  HTTP fetch
┌────────────────────────▼────────────────────────────────────┐
│               EXTERNAL SERVICES                             │
│   OpenTripMap API  │  Nominatim (OpenStreetMap geocoding)   │
│   Clerk (JWT auth) │  multer → local /uploads storage       │
└─────────────────────────────────────────────────────────────┘
```

Both the frontend (`traveloop-frontend/`) and backend (`traveloop-backend/`) live in the same monorepo and are run as independent processes.

---

## 3. Database Design

### Schema Diagram (ERD Description)

The database is in **Third Normal Form (3NF)** throughout. Every non-key attribute depends solely on the primary key of its table, with no transitive dependencies. The twelve tables map cleanly to business entities with no attribute duplication across tables.

```
users ──────────────────────────────────────────────────────┐
  │ 1:N                                                      │
  ▼                                                          │
trips ──────────────────────────────────────────────────────┤
  │ 1:N                                                      │
  ▼                                                          │
stops ──────── M:1 ──── cities ─── 1:N ─── activity_catalog │
  │ 1:N                   │ M:N                              │
  ▼                       ▼                                  │
activities         saved_destinations ── M:1 ── users        │
                                                             │
trips ─── 1:N ─── budget_items                              │
trips ─── 1:N ─── checklist_items                           │
trips ─── 1:N ─── notes ─── (optional) ─── stops           │
trips ─── M:N ─── community_likes ── M:1 ── users           │
trips ─── 1:N ─── trip_copies ──────────── users            │
```

## 4. Backend — Express REST API

### Backend Tech Stack

| Package               | Version | Role                                                         |
| --------------------- | ------- | ------------------------------------------------------------ |
| Node.js               | 18+     | Runtime                                                      |
| Express               | 5.2.1   | HTTP framework                                               |
| TypeScript            | 5.x     | Type safety                                                  |
| mysql2                | 3.22.3  | MySQL driver with prepared statements and connection pooling |
| @clerk/clerk-sdk-node | 4.13.23 | JWT verification middleware                                  |
| helmet                | 8.1.0   | HTTP security headers                                        |
| cors                  | 2.8.6   | Cross-origin resource policy                                 |
| morgan                | 1.10.1  | HTTP request logging                                         |
| multer                | 2.1.1   | Multipart file upload handling                               |
| dotenv                | 17.4.2  | Environment variable management                              |

### Backend Project Structure

```
traveloop-backend/
├── src/
│   ├── server.ts              # Express app bootstrap, middleware, route mounting
│   ├── db/
│   │   ├── connection.ts      # mysql2 connection pool (singleton)
│   │   └── seed.ts            # City and activity catalog seed script
│   ├── middleware/
│   │   ├── auth.ts            # requireAuth (Clerk), attachUser (DB lookup)
│   │   └── adminOnly.ts       # Role guard for admin routes
│   ├── controllers/
│   │   ├── trips.controller.ts
│   │   ├── stops.controller.ts
│   │   ├── activities.controller.ts
│   │   ├── cities.controller.ts   # OpenTripMap integration + caching
│   │   ├── budget.controller.ts
│   │   ├── checklist.controller.ts
│   │   ├── notes.controller.ts
│   │   ├── community.controller.ts
│   │   ├── users.controller.ts
│   │   └── admin.controller.ts
│   ├── routes/
│   │   ├── trips.ts, stops.ts, activities.ts, cities.ts
│   │   ├── budget.ts, checklist.ts, notes.ts
│   │   ├── community.ts, users.ts, admin.ts, upload.ts
│   └── types/
│       └── index.ts           # DbUser, DbTrip, DbStop, DbActivity … interfaces
│                              # Express Request augmentation (req.dbUser)
└── uploads/                   # Local static file storage for cover photos
```

### API Endpoints Reference

#### Trips — `/api/trips`

| Method | Path                            | Auth   | Description                                             |
| ------ | ------------------------------- | ------ | ------------------------------------------------------- |
| GET    | `/api/trips`                    | User   | List own trips; filterable by `?status=`, paginated     |
| POST   | `/api/trips`                    | User   | Create a new trip                                       |
| GET    | `/api/trips/:id`                | User   | Full trip with nested stops and activities (JOIN query) |
| PUT    | `/api/trips/:id`                | User   | Update trip fields (COALESCE patch pattern)             |
| DELETE | `/api/trips/:id`                | User   | Delete trip (cascades to stops → activities)            |
| POST   | `/api/trips/:id/publish`        | User   | Toggle `is_public`, generate UUID `share_token`         |
| GET    | `/api/trips/shared/:token`      | Public | Read-only trip by share token                           |
| POST   | `/api/trips/shared/:token/copy` | User   | Deep-copy a shared trip into user's account             |

#### Stops — `/api/stops`

| Method | Path                 | Auth | Description                                   |
| ------ | -------------------- | ---- | --------------------------------------------- |
| POST   | `/api/stops`         | User | Add stop to a trip; auto-assigns `stop_order` |
| PUT    | `/api/stops/:id`     | User | Update stop dates                             |
| DELETE | `/api/stops/:id`     | User | Remove stop (cascades activities)             |
| PUT    | `/api/stops/reorder` | User | Batch reorder (transactional UPDATE loop)     |

#### Activities — `/api/activities`

| Method | Path                  | Auth | Description             |
| ------ | --------------------- | ---- | ----------------------- |
| POST   | `/api/activities`     | User | Add activity to a stop  |
| PUT    | `/api/activities/:id` | User | Update activity details |
| DELETE | `/api/activities/:id` | User | Remove activity         |

#### Cities — `/api/cities`

| Method | Path                         | Auth | Description                                  |
| ------ | ---------------------------- | ---- | -------------------------------------------- |
| GET    | `/api/cities`                | User | Search/filter cities (dynamic query builder) |
| GET    | `/api/cities/:id`            | User | City detail + normalised activity catalog    |
| GET    | `/api/cities/:id/activities` | User | Filtered catalog (category, cost range)      |
| GET    | `/api/cities/:id/discover`   | User | OpenTripMap discovery → cache → return       |

#### Budget — `/api/budget`

| Method | Path                       | Auth | Description                                         |
| ------ | -------------------------- | ---- | --------------------------------------------------- |
| GET    | `/api/budget/trip/:tripId` | User | Full summary: items + category totals + daily costs |
| POST   | `/api/budget`              | User | Add budget line item                                |
| PUT    | `/api/budget/:id`          | User | Update item                                         |
| DELETE | `/api/budget/:id`          | User | Remove item                                         |

#### Checklist — `/api/checklist`

| Method | Path                                | Auth | Description                    |
| ------ | ----------------------------------- | ---- | ------------------------------ |
| GET    | `/api/checklist/trip/:tripId`       | User | All checklist items for a trip |
| POST   | `/api/checklist`                    | User | Add item                       |
| PUT    | `/api/checklist/:id`                | User | Toggle packed / rename         |
| DELETE | `/api/checklist/:id`                | User | Remove item                    |
| DELETE | `/api/checklist/trip/:tripId/reset` | User | Mark all items unpacked        |

#### Notes — `/api/notes`

| Method | Path                      | Auth | Description                            |
| ------ | ------------------------- | ---- | -------------------------------------- |
| GET    | `/api/notes/trip/:tripId` | User | All notes; optional `?stopId=` filter  |
| POST   | `/api/notes`              | User | Create note (trip-level or stop-level) |
| PUT    | `/api/notes/:id`          | User | Update content                         |
| DELETE | `/api/notes/:id`          | User | Delete note                            |

#### Community — `/api/community`

| Method | Path                          | Auth | Description                                 |
| ------ | ----------------------------- | ---- | ------------------------------------------- |
| GET    | `/api/community`              | User | Public feed (sort: latest / liked / copied) |
| POST   | `/api/community/like/:tripId` | User | Like a trip (`INSERT IGNORE`)               |
| DELETE | `/api/community/like/:tripId` | User | Unlike a trip                               |
| POST   | `/api/community/copy/:tripId` | User | Deep-copy public trip (transactional)       |

#### Users — `/api/users`

| Method | Path                                       | Auth | Description                           |
| ------ | ------------------------------------------ | ---- | ------------------------------------- |
| POST   | `/api/users/sync`                          | User | Upsert user record from Clerk payload |
| GET    | `/api/users/me`                            | User | Get own profile                       |
| PUT    | `/api/users/me`                            | User | Update name, bio, language            |
| DELETE | `/api/users/me`                            | User | Delete account                        |
| GET    | `/api/users/me/saved-destinations`         | User | List saved cities                     |
| POST   | `/api/users/me/saved-destinations/:cityId` | User | Save city                             |
| DELETE | `/api/users/me/saved-destinations/:cityId` | User | Unsave city                           |

#### Admin — `/api/admin`

| Method | Path                       | Auth  | Description                                               |
| ------ | -------------------------- | ----- | --------------------------------------------------------- |
| GET    | `/api/admin/stats`         | Admin | Aggregate stats: users, trips, active this week, top city |
| GET    | `/api/admin/users`         | Admin | User directory with trip counts                           |
| GET    | `/api/admin/top-cities`    | Admin | Top 10 cities by stop count                               |
| GET    | `/api/admin/trips-per-day` | Admin | Trip creation count per day (30-day window)               |

#### File Upload — `/api/upload`

| Method | Path          | Auth | Description                            |
| ------ | ------------- | ---- | -------------------------------------- |
| POST   | `/api/upload` | User | Upload cover photo; returns static URL |

---

### External API Integrations

#### OpenTripMap (Activity Discovery)

The `/api/cities/:id/discover` endpoint implements a two-step live discovery flow:

1. **Geoname lookup:** `GET https://api.opentripmap.com/0.1/en/places/geoname?name={city}&country={country}` — returns lat/lon for the city
2. **Radius search:** `GET /radius?radius=10000&lat=…&lon=…&kinds=interesting_places,museums,cultural,…&rate=2&limit=50` — returns up to 50 significant POIs (rate ≥ 2 filters out minor entries)
3. **Detail fetch:** For each POI, `GET /xid/{xid}` retrieves Wikipedia extract, website, phone, and opening hours
4. **Cache write:** Results are written to `activity_catalog` with `WHERE NOT EXISTS` deduplication — subsequent requests for the same city are served entirely from MySQL

This architecture means the external API is only called once per city, ever. All users after the first get sub-10ms responses from the database.

---

## 5. Frontend — Next.js Application

### Frontend Tech Stack

| Package                  | Version    | Role                                              |
| ------------------------ | ---------- | ------------------------------------------------- |
| Next.js                  | 16.2.6     | React framework (App Router, Turbopack)           |
| React                    | 19.2.4     | UI library                                        |
| TypeScript               | 5.x        | Type safety                                       |
| Tailwind CSS             | 3.x        | Utility-first styling                             |
| @clerk/nextjs            | 7.3.3      | Auth provider, `useAuth`, `useUser`               |
| @dnd-kit/core + sortable | 6.3 / 10.0 | Accessible drag-and-drop for itinerary reordering |
| recharts                 | 3.8.1      | Budget pie chart and bar chart                    |
| framer-motion            | 12.38.0    | Page transitions and card hover animations        |
| lucide-react             | 1.14.0     | Icon library                                      |
| react-loading-skeleton   | 3.5.0      | Content placeholder skeletons                     |

### Frontend Project Structure

```
traveloop-frontend/
├── src/
│   ├── app/
│   │   ├── (auth)/            # Clerk sign-in / sign-up routes
│   │   ├── (dashboard)/       # Protected routes (requireAuth layout)
│   │   │   ├── home/          # Dashboard home
│   │   │   ├── trips/
│   │   │   │   ├── page.tsx           # Trips list (All/Ongoing/Upcoming/Completed)
│   │   │   │   ├── new/page.tsx       # Create trip form + cover photo upload
│   │   │   │   └── [id]/
│   │   │   │       ├── layout.tsx     # TripProvider + hero + tab nav
│   │   │   │       ├── page.tsx       # Redirect → /itinerary
│   │   │   │       ├── itinerary/     # Drag-and-drop builder + AI discovery
│   │   │   │       ├── budget/        # Expense tracker + Recharts
│   │   │   │       ├── checklist/     # Packing checklist
│   │   │   │       ├── notes/         # Trip notes
│   │   │   │       └── invoice/       # Split-cost invoice generator
│   │   │   ├── community/     # Public trip feed
│   │   │   ├── profile/       # User profile + stats
│   │   │   └── admin/         # Admin analytics panel
│   │   └── shared/[token]/    # Public read-only trip view (no auth required)
│   ├── components/
│   │   ├── ui/                # Button, Input, Modal, Badge, Card, Skeleton
│   │   ├── layout/            # Navbar, Sidebar, PageWrapper, UserSync
│   │   ├── trip/              # TripCard component
│   │   └── skeletons/         # DashboardSkeleton, TripSkeleton
│   ├── contexts/
│   │   └── TripContext.tsx    # Trip data provider — single fetch, shared across tabs
│   └── lib/
│       ├── api.ts             # All API call functions (typed with generics)
│       ├── types.ts           # TypeScript interfaces: Trip, Stop, City, Activity…
│       └── utils.ts           # costIndexLabel, date helpers, className utilities
```

### Pages & Features

#### Home (`/home`)

- Hero banner with personalised greeting
- Recent trips preview (last 4)
- Top Destinations grid — 6 highest-scoring cities from the database, each showing name, country, cost tier badge, and star rating

#### Trips List (`/trips`)

- Tab bar filters: All / Ongoing / Upcoming / Completed
- Inline search across trip names
- Trip cards with cover photo, date range, status badge, and quick navigation

#### New Trip (`/trips/new`)

- Validated form: name, date range, optional description
- Cover photo: drag-and-drop or click-to-upload with live preview, 5 MB limit
- Quick-start preset buttons pre-fill the trip name with popular city combinations

#### Trip Layout (`/trips/[id]/layout.tsx`)

- `TripProvider` wraps all sub-pages — trip data fetched once, shared via context
- Hero section with cover photo or gradient fallback
- Sticky tab bar: Itinerary → Budget → Checklist → Notes → Invoice

#### Itinerary Builder (`/trips/[id]/itinerary`)

- Add stops: search any city → Nominatim geocoding if not in DB → date picker constrained to trip window
- **Drag-and-drop reordering** via `@dnd-kit` with optimistic UI + API persistence
- Per-stop activity management: browse catalog, one-click add to itinerary
- **Discover button**: calls OpenTripMap API, fetches real landmarks with descriptions, costs, duration estimates
- Custom activity form: name, category, cost, duration, time slot

#### Budget Tracker (`/trips/[id]/budget`)

- Manual line items: category, description, quantity × unit cost
- Grand total + category subtotals
- **Recharts PieChart** — spending by category
- **Recharts BarChart** — daily cost distribution across the trip window

#### Packing Checklist (`/trips/[id]/checklist`)

- Items grouped by category tabs: Documents / Clothing / Electronics / Toiletries / Other
- Progress bar: packed count / total
- Toggle packed state inline; add new items; reset all to unpacked

#### Trip Notes (`/trips/[id]/notes`)

- Create, edit, delete notes
- Optional stop association for day-specific notes
- Hover-reveal edit/delete controls

#### Invoice Generator (`/trips/[id]/invoice`)

- Add travellers and distribute trip expenses
- Apply percentage discount and 5% tax
- Per-person split calculation
- Browser print / PDF export

#### Community (`/community`)

- Public trip feed with cover photos and city lists
- Sort: Latest / Most Liked / Most Copied
- Like/unlike toggle
- **Use this trip** — copies full trip to user's account with one click

#### Shared Trip (`/shared/[token]`)

- No authentication required
- Read-only view of a published trip: stops, cities, dates, activity list
- "Copy to my trips" CTA for authenticated users

#### Profile (`/profile`)

- Editable name, bio, language
- Stats: Total trips / Completed / Upcoming / Public
- Saved destinations grid
- Recent trips list

#### Admin (`/admin`)

- Stat cards: total users, total trips, active this week, top city
- Trips-per-day BarChart (30-day window)
- Top destinations bar progress chart
- User directory table with search

---

### State Management

There is no global state library. State is managed at three levels:

1. **URL / navigation state** — Next.js App Router; route params passed via `use(params)` in client components
2. **Trip context** — `TripContext` (React Context + `useReducer`-style `rev` counter) fetches the trip once when navigating to any `/trips/[id]/*` sub-page, exposes `trip`, `loading`, `error`, and `refetch()`. All four sub-pages (itinerary, budget, checklist, notes) consume this context without re-fetching
3. **Local component state** — `useState` / `useCallback` for modal open/close, form fields, optimistic list updates

This avoids the overhead of Redux or Zustand for a domain where server state is the primary concern and client-derived state is minimal.

---

## 6. Feature Walkthrough

```
User signs up
  └─ Clerk issues JWT
       └─ POST /api/users/sync creates DB user record

User creates a trip
  └─ POST /api/trips → trips row inserted
       └─ Redirect to /trips/{id}/itinerary

User adds a stop (city)
  └─ GET /api/cities?search=… → live city search
       └─ POST /api/stops → stop inserted, auto-ordered
            └─ Trip refetched via TripContext.refetch()

User discovers activities
  └─ GET /api/cities/{id}/discover
       └─ OpenTripMap geoname → radius search → xid details
            └─ Results cached in activity_catalog
                 └─ User adds activities → POST /api/activities

User publishes trip
  └─ POST /api/trips/{id}/publish
       └─ is_public = TRUE, share_token = UUID
            └─ Shareable link generated: /shared/{token}

Community user copies trip
  └─ POST /api/community/copy/{tripId}
       └─ BEGIN TRANSACTION
            COPY trips row → new trip
            COPY stops rows → new stops
            COPY activities rows → new activities
            INSERT trip_copies audit row
          COMMIT
```

---

## 7. Authentication & Authorisation

- Authentication is handled entirely by **Clerk** — no password storage or session management in the application database
- The backend uses `ClerkExpressRequireAuth()` which validates the Bearer JWT against Clerk's public keys; no outbound network call is made per request (JWT is verified locally using the cached public key)
- On successful verification, `attachUser` middleware performs a single DB lookup (`SELECT * FROM users WHERE clerk_id = ?`) and attaches the full user row to `req.dbUser`
- Admin routes are additionally guarded by `adminOnly` middleware which checks `req.dbUser.role === 'admin'`
- The shared trip endpoint (`/api/trips/shared/:token`) is public — no auth required, trip ownership is not checked
- Frontend route protection is handled by Clerk's Next.js middleware via `clerkMiddleware()` in `middleware.ts`, which redirects unauthenticated users to the sign-in page before any page renders

---

## 8. Setup & Installation

### Prerequisites

- Node.js 18+
- MySQL 8.0+
- A Clerk account (free tier) → [clerk.com](https://clerk.com)
- An OpenTripMap API key → [opentripmap.io](https://opentripmap.io)

### Backend Setup

```bash
cd traveloop-backend
npm install

# Create the database
mysql -u root -p -e "CREATE DATABASE traveloop CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"

# Copy env template
cp .env.example .env
# Fill in DB credentials, Clerk secret key, OpenTripMap key

# Run migrations (create tables)
npx ts-node src/db/migrate.ts

# Seed initial cities and activity catalog
npx ts-node src/db/seed.ts

# Start development server (nodemon + ts-node)
npm run dev
```

Backend runs on `http://localhost:4000`

### Frontend Setup

```bash
cd traveloop-frontend
npm install

# Copy env template
cp .env.local.example .env.local
# Set NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY and NEXT_PUBLIC_API_URL

# Start development server (Turbopack)
npm run dev
```

Frontend runs on `http://localhost:3000`

---

## 9. Environment Variables

### Backend (`.env`)

| Variable           | Description                                        |
| ------------------ | -------------------------------------------------- |
| `PORT`             | Server port (default: 4000)                        |
| `DB_HOST`          | MySQL host                                         |
| `DB_PORT`          | MySQL port (default: 3306)                         |
| `DB_USER`          | MySQL username                                     |
| `DB_PASSWORD`      | MySQL password                                     |
| `DB_NAME`          | Database name (`traveloop`)                        |
| `CLERK_SECRET_KEY` | Clerk backend secret key                           |
| `CLIENT_URL`       | Frontend origin for CORS (`http://localhost:3000`) |
| `OPENTRIPMAP_KEY`  | OpenTripMap API key                                |

### Frontend (`.env.local`)

| Variable                            | Description                                |
| ----------------------------------- | ------------------------------------------ |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Clerk publishable key                      |
| `NEXT_PUBLIC_API_URL`               | Backend base URL (`http://localhost:4000`) |

---

---

## Tech Stack Summary

| Layer              | Technology                                    |
| ------------------ | --------------------------------------------- |
| Frontend framework | Next.js 16 (App Router, React 19)             |
| Styling            | Tailwind CSS                                  |
| Authentication     | Clerk                                         |
| HTTP client        | Native `fetch`                                |
| Charts             | Recharts 3                                    |
| Drag and drop      | @dnd-kit                                      |
| Animations         | Framer Motion                                 |
| Backend framework  | Express 5                                     |
| Database           | MySQL 8                                       |
| DB driver          | mysql2 (connection pool, prepared statements) |
| File storage       | Local disk (multer)                           |
| External APIs      | OpenTripMap, Nominatim                        |
| Language           | TypeScript (full-stack)                       |

---

_Built during OdooxPU Hackathon — Traveloop v1.0_
