# Appzeto Helpdesk — Backend

A production-quality ticket management API built with Node.js, Express, and MongoDB/Mongoose. Follows MVC + service-layer architecture, with dynamic (cron-free) SLA computation, automatic load-balanced ticket assignment, a strict status state machine, optimistic locking, and JWT-based role authentication (customer/agent).

## Tech Stack

- Node.js + Express
- MongoDB + Mongoose
- express-validator
- jsonwebtoken + bcryptjs

## Getting Started

```bash
cd backend
npm install
cp .env.example .env   # edit MONGODB_URI/JWT_SECRET if needed
npm run dev             # starts the API and auto-seeds the 3 agents (with login credentials) on boot
```

The API listens on `http://localhost:5000` by default. Health check: `GET /health`.

To seed agents standalone (also idempotent, safe to run any time):
```bash
npm run seed
```

## Authentication & Authorization

Every route except `POST /auth/register`, `POST /auth/login`, and `GET /health` requires a `Authorization: Bearer <token>` header.

- **Two identities**: `Customer` (self-registers) and `Agent` (seeded only, see below) - not a single unified "user" model.
- **JWT payload**: `{ id, role }`, signed with `JWT_SECRET`, expires per `JWT_EXPIRES_IN` (default `1d`). Stateless verification - no server-side revocation, no refresh token (out of scope for this project's size).
- **Seeded agent logins** (password same for all three, from `DEFAULT_AGENT_PASSWORD`, default `Agent@123`):
  | Name | Email |
  |---|---|
  | Riya | riya@appzeto.com |
  | Karan | karan@appzeto.com |
  | Dev | dev@appzeto.com |
- **Customers** register themselves via `POST /auth/register` (name, email, password ≥8 chars).
- **Role permission matrix**:

  | Route | Who |
  |---|---|
  | `POST /tickets` | Customer only |
  | `GET /tickets` | Either — customers see only their own tickets (server-enforced), agents see everything |
  | `GET /tickets/stats` | Agent only |
  | `GET /tickets/:id` | Either — customer gets `403` on a ticket they don't own |
  | `PATCH /tickets/:id` | Agent only |
  | `POST /tickets/:id/comments` | Either — customer gets `403` on a ticket they don't own |
  | `GET /agents` | Agent only |

## Database

- Database name: `appzeto_helpdesk`
- Collections: `tickets`, `agents`, `customers`
- Seeded agents (idempotent — reruns never duplicate, and credentials self-heal via `$set` on every boot so a pre-existing agent document always ends up with working login credentials): Riya (maxLoad 3), Karan (maxLoad 4), Dev (maxLoad 5)

## Architecture

```
src/
  config/       # env loading, DB connection (also syncs Mongoose indexes on every boot)
  models/       # Mongoose schemas (Ticket, Agent, Customer)
  controllers/  # thin HTTP handlers
  routes/       # Express routers
  middlewares/  # validation, auth (protect/authorize), 404, centralized error handler
  services/     # all business logic (auth, assignment, SLA, stats, ticket orchestration)
  utils/        # pure helpers (ApiError, pagination, priority ranking, SLA config/aggregation)
  validators/   # express-validator chains
  seed/         # idempotent, self-healing agent seeding
```

## Core Business Rules

### Auto-Assignment (on ticket creation)
Ticket is assigned to the agent with the **lowest load percentage** (`active tickets / maxLoad`, where "active" = status `Open` or `In Progress`). Ties broken by lowest active ticket count, then alphabetically by name. If every agent is at capacity, the ticket is created with `status: Queued` and `assignedAgent: null`.

### Queue Promotion
When a ticket transitions to `Resolved` or `Closed`, the freed agent's capacity is rechecked and, if room exists, the **oldest** `Queued` ticket is immediately promoted to that agent (`status → Open`).

### SLA (computed dynamically — no cron)
| Priority | SLA Window |
|----------|-----------|
| Critical | 2 hours |
| High | 8 hours |
| Medium | 24 hours |
| Low | 72 hours |

Every `GET` response includes a freshly computed `slaDeadline` and `slaState`:
- `ok` — under 75% of the SLA window elapsed
- `at_risk` — **≥75% of the SLA window elapsed** (this exact threshold is not specified in the original brief; 75% was chosen as a sensible early-warning point and confirmed with stakeholders)
- `breached` — past the deadline

If a ticket is `breached` and still `Open`/`In Progress`, its priority is auto-escalated by one level **exactly once** (tracked via an internal `slaEscalated` flag not part of the original field list, but required to satisfy the "only once" rule). A `Priority Change` history entry is recorded. A ticket already at `Critical` logs the escalation attempt but priority stays `Critical`. Once a ticket reaches `Resolved`/`Closed`, its `resolvedAt` timestamp freezes the SLA verdict so it doesn't retroactively read as breached from wall-clock drift after closure.

### Status State Machine
```
Open → In Progress → Resolved → Closed
                Resolved → In Progress (reopen)
Closed is terminal — nothing leaves it.
```
Any other transition returns `400`.

### Optimistic Locking
Every `PATCH /api/tickets/:id` must include the ticket's current `version`. A mismatch returns `409` with the complete, up-to-date ticket embedded as `currentTicket` in the response body. `version` increments on every successful update (including system-driven SLA escalation, so a stale in-flight edit correctly gets rejected).

### Comments
`POST /api/tickets/:id/comments` requires `text` of at least 3 characters. Comments cannot be added to a `Closed` ticket (`400`).

### History
Every ticket tracks an audit trail (`history[]`) of: `Status Change`, `Priority Change`, `Auto Assignment`, `Queue Assignment`.

## API Reference

Base URL: `/api`. All endpoints below except the three `/auth` ones require the `Authorization: Bearer <token>` header.

### `POST /auth/register`
Customer self-signup. Auto-logs-in (returns a token immediately).
```json
{ "name": "Alice", "email": "alice@example.com", "password": "password123" }
```

### `POST /auth/login`
```json
{ "email": "riya@appzeto.com", "password": "Agent@123", "role": "agent" }
```
`role` is `"agent"` or `"customer"` and determines which collection is checked.

### `GET /auth/me`
Returns the current identity for whichever token is presented.

### `POST /tickets` (customer only)
Create a ticket. Triggers auto-assignment. `createdBy` is set from the token, not the body.
```json
{ "title": "Login page broken", "description": "Users cannot log in since this morning.", "category": "Bug", "priority": "High" }
```

### `GET /tickets` (either role)
Query params (all optional):
- `status` — one of the status enum values
- `priority` — one of the priority enum values
- `search` — case-insensitive substring match over `title` + `description`
- `sortBy` — `createdAt` | `slaDeadline` | `priority` (priority sorts by severity, Critical→Low, **not alphabetically**)
- `sortOrder` — `asc` | `desc` (default `desc`)
- `page` (default `1`), `limit` (default **6**, capped at 100)

A customer's results are always scoped to `createdBy: <their own id>` server-side, regardless of query params. Agents get everything.

Response: `{ success, data: [...], pagination: { page, limit, totalItems, totalPages } }`

### `GET /tickets/stats` (agent only)
Single-aggregation-pipeline stats: `{ total, byStatus, byPriority, byCategory, slaBreachedCount }`. `slaBreachedCount` is scoped to currently `Open`/`In Progress` tickets.

### `GET /tickets/:id` (either role)
Fetches a ticket; runs the SLA escalation check. `403` if a customer requests a ticket they don't own.

### `PATCH /tickets/:id` (agent only)
Requires `version` in the body. Any of `title`, `description`, `category`, `priority`, `status` may also be included.
```json
{ "version": 2, "status": "In Progress" }
```
Returns `409` with `currentTicket` on a version mismatch; `400` on an invalid status transition; `403` if called by a customer.

### `POST /tickets/:id/comments` (either role)
```json
{ "text": "Investigating now." }
```
`403` if a customer comments on a ticket they don't own. The stored comment carries `authorName`/`authorRole` stamped from the token.

### `GET /agents` (agent only, bonus, not in the original spec)
Returns each agent's current load, useful for verifying assignment/queue behavior without touching MongoDB directly:
```json
{ "success": true, "data": [{ "name": "Riya", "maxLoad": 3, "activeCount": 2, "loadPct": 0.6667 }, ...] }
```

## Error Response Shape

```json
{ "success": false, "message": "...", "errors": [...], "currentTicket": {...} }
```
`errors` present on validation failures (400); `currentTicket` present on optimistic-lock conflicts (409).

## Documented Assumptions

The original spec left a few implementation details open. These were resolved as follows:
1. `at_risk` fires at 75% of the SLA window elapsed (confirmed with stakeholder).
2. Search covers `title` + `description` via escaped regex (not a text index, to allow partial substring matches).
3. `POST /:id/comments` does not require `version` — the optimistic-lock rule is scoped to `PATCH /:id` only.
4. Status transitions are strictly sequential per the diagram in the spec (no direct Open→Resolved/Closed jumps).
5. SLA escalation also runs on `GET /tickets` (list), not just `GET /tickets/:id`, for response consistency.
6. `assignedAgent` is not client-editable via `PATCH` — assignment stays fully automatic.
7. Exactly one ticket is promoted from the queue per resolve/close event.
8. Pagination `limit` is capped at 100 server-side.
9. `priority` is required on ticket creation (no silent default).
10. `GET /api/agents` was added as a bonus endpoint to aid manual verification of load-balancing.
11. Two separate identity collections (`Agent`, `Customer`) rather than one unified `User` model with a role field — keeps the pre-existing `Agent` schema (used by auto-assignment) intact.
12. Agents are provisioned only via the seed script (no public agent self-registration); customers self-register.
13. JWT is stateless (`protect` does no DB lookup) — cheap on the 5s-polled `GET /tickets`, at the cost of no server-side session revocation before natural expiry.
14. `createdBy` is not `required` at the schema level, so tickets created before auth existed remain valid documents — they're simply invisible to every customer (no owner to match) and fully visible/manageable by agents.

## Testing the SLA/Escalation Logic Manually

Since there's no cron and SLA windows are hours long, backdate a ticket's `createdAt` directly to exercise breach/escalation without waiting:
```js
// mongosh
db.tickets.updateOne({ _id: ObjectId("...") }, { $set: { createdAt: new Date(Date.now() - 9*3600000) } })
```
Then `GET /api/tickets/:id` twice — the first call escalates and logs history; the second call is a no-op.

## Postman Collection

Import `Appzeto_Helpdesk.postman_collection.json`. Run **Auth → Register Customer** then **Auth → Login Agent (seeded: Riya)** first — both capture a token into collection variables (`token`, `customerToken`, `agentToken`) that every other request already references, so nothing else needs manual header setup. Includes example failure-path requests (invalid transition, stale version conflict, comment on a closed ticket, and the new role-boundary cases: customer hitting agent-only routes, agent trying to create a ticket, wrong password, duplicate email).
