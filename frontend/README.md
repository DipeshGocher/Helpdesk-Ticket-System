# Appzeto Helpdesk — Frontend

A React + Vite frontend for the Appzeto Helpdesk ticketing system, talking to the Express/MongoDB backend in `../backend`. Two role-based experiences behind a JWT login: a customer panel (file/track your own tickets) and an agent panel (triage/resolve everything).

## Tech Stack

- React 19 + Vite
- React Router (v7)
- Axios (single shared instance)
- CSS Modules + a small global design-token stylesheet (no UI framework)

## Getting Started

```bash
cd frontend
npm install
cp .env.example .env   # edit VITE_API_BASE_URL if the backend isn't on localhost:5000
npm run dev             # http://localhost:5173
```

The backend must also be running (`cd ../backend && npm run dev`, see `backend/README.md`). The backend already has `cors()` enabled with default (allow-all) settings, so no backend changes are needed to talk to the Vite dev server on a different port.

On first load you'll land on `/login`. Register a new customer account, or log in as one of the seeded agents (see `backend/README.md` for the seeded emails/password).

## Project Structure

```
src/
  api/            # axios instance (attaches JWT + handles 401) + one module per resource
  components/     # reusable UI pieces, one folder per component
  constants/      # enums mirrored from the backend (category/priority/status, transitions)
  context/        # ToastContext + AuthContext - the two cross-cutting globals
  hooks/          # useDebouncedValue, useInterval, useNow
  pages/          # LoginPage, RegisterPage, TicketListPage (agent), CustomerTicketListPage,
                  # CreateTicketPage, TicketDetailsPage
  utils/          # priority/status colors, relative time, SLA countdown math, API error parsing
```

## Roles

| | Customer | Agent |
|---|---|---|
| Sign-up | Self-register (`/register`) | Seeded only, no public sign-up |
| Lands on `/` | `CustomerTicketListPage` - own tickets only, no stats bar, no status control | `TicketListPage` - every ticket, stats bar, filters, status dropdown |
| Create ticket | Yes (`/tickets/new`) | No (route + nav item both hidden) |
| Edit ticket / change status | No | Yes |
| Comment | Yes, on own tickets | Yes, on any ticket |

The backend enforces every one of these boundaries independently of the UI (a hidden button is not the security layer) - the frontend gating is purely for a coherent experience per role.

## Notable Implementation Details

- **Auth**: `AuthContext` hydrates the current user from `GET /auth/me` on load (using the token in `localStorage`) rather than decoding the JWT client-side - this also confirms server-side that the token is still valid. `ProtectedRoute` gates routes on `isLoading`/`isAuthenticated`/`roles`, avoiding a redirect-flash on hard refresh while that check is in flight.
- **401 handling**: the axios response interceptor can't call `useNavigate()` directly (it's not a component), so `AuthProvider` (rendered inside `BrowserRouter`) registers a callback via `setUnauthorizedHandler()` once it mounts. Login/register requests are excluded from this (a wrong password is a normal 401, not a session expiry), and it's deduped so two requests 401-ing in the same 5s poll tick don't double-log-out the user.
- **Debounced search** (400ms) via `useDebouncedValue`, so keystrokes don't spam the API.
- **Status Dropdown** only ever offers the transitions the backend's state machine actually allows (`constants/enums.js#ALLOWED_STATUS_TRANSITIONS`, mirroring `backend/src/utils/statusTransitions.js`) - it renders as a "Move to…" action picker, not a full status selector. Customers get a plain `StatusBadge` instead (`TicketCard`'s `readOnly` prop).
- **Optimistic updates + rollback**: changing status (agent, list or details page) updates the UI immediately, then confirms against the server. A failed request reverts to the last known-good snapshot.
- **Conflict Modal + Retry Mine / Take Theirs**: a `409` response (stale `version`) shows both the user's attempted change and the server's current state. "Retry my change" re-submits the same edit using the server's fresh version; "Take latest" discards the attempt and adopts the server's state. Shared between the list and details pages via `hooks/usePatchWithConflict.js` so this logic exists in one place.
- **Polling**: the ticket list (both roles) refetches every 5 seconds with whatever filters/search/sort/page are currently active. If the poll finds real changes, it updates the list and shows a **"N tickets updated"** toast without resetting the current page, scroll position, or any open dropdown - ticket cards are keyed by `_id` and reuse the same object reference when unchanged (`utils/ticketDiff.js#mergeTicketLists`), which also lets `React.memo` on `TicketCard` skip re-rendering untouched cards.
- **Live SLA countdown**: `SlaCountdown` ticks locally every second (via `useNow`) purely client-side from the `slaDeadline` the backend already computed - no extra network calls.
- **Relative time**: `RelativeTime` re-renders every 30s so "2 minutes ago" keeps advancing.

## Pages

| Route | Page | Access |
|---|---|---|
| `/login` | Log in (role tabs: Customer / Agent) | Public |
| `/register` | Customer sign-up | Public |
| `/` | `TicketListPage` (agent) or `CustomerTicketListPage` (customer) | Any authenticated role |
| `/tickets/new` | Create Ticket | Customer only |
| `/tickets/:id` | Ticket Details - role-aware (status/edit controls only for agents) | Any authenticated role |
