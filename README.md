# Appzeto Helpdesk

A production-ready MERN ticket management system with automatic load-balanced assignment, dynamic SLA tracking with auto-escalation, a strict status state machine, optimistic concurrency control, and JWT-based role authentication separating a customer panel from an agent panel.

```
Machineround/
  backend/   Node.js + Express + MongoDB/Mongoose API
  frontend/  React + Vite client
```

## Quick Start

Prerequisites: Node.js 18+, a running MongoDB instance (local `mongod` or Atlas).

```bash
# 1. Backend
cd backend
npm install
cp .env.example .env          # defaults to mongodb://127.0.0.1:27017/appzeto_helpdesk
npm run dev                    # http://localhost:5000 - seeds Riya/Karan/Dev (with login creds) on boot

# 2. Frontend (separate terminal)
cd frontend
npm install
cp .env.example .env          # defaults to VITE_API_BASE_URL=http://localhost:5000/api
npm run dev                    # http://localhost:5173
```

Open `http://localhost:5173` - you'll land on `/login`. Register a customer account, or log in as a seeded agent:

| Name | Email | Password |
|---|---|---|
| Riya | riya@appzeto.com | `Agent@123` |
| Karan | karan@appzeto.com | `Agent@123` |
| Dev | dev@appzeto.com | `Agent@123` |

The backend's CORS is already permissive (`cors()` with default allow-all settings), so no extra configuration is needed to connect the two.

To seed agents standalone at any time (idempotent, and self-healing - always backfills login credentials even onto pre-existing agent documents):
```bash
cd backend && npm run seed
```

## Feature Checklist

Everything below was implemented, audited, and verified end-to-end (backend regression scripts + headless-browser UI tests) before this build was considered done.

| Feature | Where | Notes |
|---|---|---|
| **Auth & Roles** | `backend/src/services/auth.service.js`, `frontend/src/context/AuthContext.jsx` | JWT (`{id, role}`), Bearer token, two identity collections (`Customer` self-registers, `Agent` is seed-only). `protect`/`authorize` middleware gate every route; customers are additionally scoped server-side to their own tickets. |
| **Auto Assignment** | `backend/src/services/assignment.service.js` | Lowest load% → lowest active count → alphabetical. Verified via a 13-ticket capacity test. |
| **Queue** | `assignment.service.js#promoteQueuedTicketIfAny` | All agents full → ticket queued (`assignedAgent: null`). Oldest queued ticket auto-promoted the instant an agent frees up. |
| **History** | `ticket.model.js` (`history[]`) | Status Change, Priority Change, Auto Assignment, Queue Assignment - all logged with `from`/`to`/`note`/`timestamp`. Rendered as a timeline in the UI. |
| **Version Conflict** | `ticket.service.js#updateTicket` | Every `PATCH` requires `version`; mismatch → `409` with the full current server ticket embedded. |
| **409 Modal** | `frontend/src/components/ConflictModal` | Shows both "your attempted change" and the server's current state side by side. |
| **Retry Mine** | `frontend/src/hooks/usePatchWithConflict.js` | Re-submits the user's original intended change using the server's fresh `version`. Re-conflicts gracefully re-open the modal with the newer snapshot. |
| **Take Theirs** | same hook | Discards the local attempt and adopts the server's current ticket. |
| **SLA** | `backend/src/services/sla.service.js` | Computed dynamically on every read (no cron): Critical 2h / High 8h / Medium 24h / Low 72h, with `ok` / `at_risk` (≥75% elapsed) / `breached` states. |
| **Priority Bump** | `sla.service.js#evaluateAndPersistSla` | Breached + Open/In Progress → priority escalated by one level exactly once (`slaEscalated` flag), logged to history. |
| **Polling** | `frontend/src/pages/TicketListPage.jsx`, `CustomerTicketListPage.jsx` | Refetches every 5s with the current filters/search/sort/page. Only re-renders tickets that actually changed (reference-preserving merge) and shows a **"N tickets updated"** toast - current page, scroll position, and open dropdowns are never disturbed. |
| **Pagination** | `backend` (`utils/pagination.js`) + `frontend` (`Pagination.jsx`) | Default page size 6, capped at 100. |
| **Sorting** | `backend/src/utils/slaAggregationStages.js` + `frontend/src/components/Filters` | `createdAt`, `priority` (severity order Critical→Low, **not** alphabetical), `slaDeadline`. Order labels are worded per-field ("Most severe first" vs generic "Ascending"). |
| **Filtering** | both | Status + priority exact-match filters, combinable with search/sort/pagination. |
| **Validation** | `backend/src/validators` + `frontend/src/utils/ticketValidation.js` | Title 5-100 chars, description ≥20, comment ≥3, category/priority/status enums - identical rules enforced on both sides so the UI never round-trips an error the user could've been told about instantly. |
| **Professional UI** | `frontend/src` | Custom design-token palette (priority/status/SLA color scales), responsive grid layout, clickable ticket cards, live SLA countdowns, relative timestamps, loading/error/empty states, toasts, modals, two distinct role-based dashboards. |

## Roles

- **Customer**: registers via `/register`, lands on "My Tickets" (own tickets only, no stats, no status control), can create tickets and comment on their own.
- **Agent**: seeded-only login, lands on the full dashboard (stats, filters, every ticket), is the only role that can change status/priority or view stats/agent-load.

Every boundary above is enforced on the backend independently of what the UI shows or hides - see `backend/README.md`'s permission matrix.

## Architecture Notes

- **Backend**: MVC + service layer. Business logic (auth, assignment, SLA, stats) lives entirely in `services/`; controllers stay thin. See [`backend/README.md`](backend/README.md) for the full API reference, schema details, auth/RBAC matrix, and documented assumptions.
- **Frontend**: React Router pages behind a `ProtectedRoute` gate, `AuthContext` + `ToastContext` as the two cross-cutting globals, a shared `usePatchWithConflict` hook so the 409/Retry-Mine/Take-Theirs logic isn't duplicated between the list and details pages, and `React.memo` on the components that sit inside the polled ticket list (`TicketCard`, `StatsBar`, `Filters`, `SearchBar`, `Pagination`) so a poll that changes one ticket doesn't re-render the other five. See [`frontend/README.md`](frontend/README.md) for the full breakdown.

## Testing This Yourself

There's no cron job driving SLA state, so to see a breach/escalation without waiting hours, backdate a ticket directly:
```js
// mongosh
db.tickets.updateOne({ _id: ObjectId("...") }, { $set: { createdAt: new Date(Date.now() - 9*3600000) } })
```
Then load that ticket in the UI (or `GET /api/tickets/:id`, agent or owning-customer token) - it will show `breached` and its priority will bump exactly once.

To see a version conflict / Retry Mine / Take Theirs in the UI: log in as an agent, open a ticket's details page, then `PATCH` that same ticket directly against the API with an agent token (simulating a second agent) before clicking "Move to…" in the browser - the browser's stale `version` will trigger the conflict modal.

To see the role split: register a customer and file a ticket, then log out and log in as a seeded agent - the same ticket now shows up on the agent dashboard with full controls, while the customer who filed it only ever sees a read-only view of their own.

A Postman collection is at `backend/Appzeto_Helpdesk.postman_collection.json` - run **Auth → Register Customer** and **Auth → Login Agent** first to populate the token variables used by every other request, including the role-boundary failure cases (customer hitting agent-only routes, agent trying to create a ticket, invalid transition, stale version, comment on a closed ticket).
