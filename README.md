# QuickFood - Frontend

QuickFood is a food delivery platform built with Next.js. Customers discover local kitchens, plan meals around a budget, check out with transparent pricing and track orders live. Restaurant partners run a live kitchen board, manage menus and read analytics.

Live: https://quickfood-frontend.vercel.app/
Backend repo: https://github.com/junaaid96/quickfood_backend

## Features

### For customers
- **Discover**: search restaurants *and dishes*, mood shortcuts, cuisine and dietary filters, open now, free delivery, rating and ETA filters, sorting. Filters live in the URL, so results are shareable.
- **Budget Bites**: set a total budget and party size and get complete meals (mains, sides, drinks, dessert) across every open kitchen, fees included. Also available per restaurant ("Feed me for...").
- **Restaurant pages**: sticky category navigation with scrollspy, in-menu search, dietary and spice tags, "most ordered" badges, verified reviews with rating breakdown and owner replies.
- **Persistent basket**: survives reloads, per-item notes, minimum order progress, and a guard against mixing kitchens.
- **Checkout**: saved addresses, ASAP or scheduled delivery, Priority / Standard / eco *Wait & Save* delivery, rider tips, promo codes, loyalty points. Every price is a live quote from the server.
- **Live tracking**: status timeline, ETA countdown, illustrated route, chat with the kitchen, self-cancel while pending, split-the-bill calculator, rate and review, one-tap reorder.
- **Rewards**: points on every order, Bronze to Platinum tiers.
- **Dark mode**, mobile tab bar, reduced-motion support, and a notice when the API host is waking up.

### For restaurant partners
- **Overview**: revenue, orders, average order, rating, repeat customers, cancellation rate, busiest hour, daily revenue and hourly charts, top dishes, delivery mix, review replies.
- **Kitchen board**: live columns (New, Accepted, Cooking, On the way), one-tap status changes, chime on new orders, reject with reason, pause/resume each restaurant.
- **Menu management**: categories, dietary flags, spice level, calories, photo upload or URL, instant sold-out toggle.

## Tech Stack

- **Next.js 15** (App Router), **React 19**, **TypeScript**
- **Tailwind CSS 4** with design tokens for light and dark themes
- **SWR** for data fetching, caching and live polling
- **Phosphor Icons**
- JWT auth with automatic token refresh

## Getting Started

```bash
npm install
cp .env.example .env.local   # optional, defaults to the hosted API
npm run dev
```

Open http://localhost:3000.

To run against a local backend, set `NEXT_PUBLIC_API_URL=http://localhost:8000/api` and run `python manage.py seed_demo` in the backend for demo data. Demo logins (`demo_customer` / `demo_owner`, password `quickfood123`) appear as one-click buttons on the login page; hide them with `NEXT_PUBLIC_DEMO_LOGINS=false`.

## Environment variables

| Variable | Default | Purpose |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | `https://quickfood-backend-bice.vercel.app/api` | Backend API base URL |
| `NEXT_PUBLIC_CURRENCY_SYMBOL` | `$` | Currency shown in prices |
| `NEXT_PUBLIC_DEMO_LOGINS` | `true` | Show demo login buttons |

## Project Structure

```
app/
├── (auth)/              # Login and register
├── restaurants/         # Discover and restaurant pages
├── planner/             # Budget Bites
├── checkout/            # Checkout with live quote
├── orders/              # Order history and live tracking
├── favorites/, profile/ # Saved restaurants, account, rewards, addresses
└── dashboard/           # Partner overview, kitchen board, restaurant and menu management
components/              # UI primitives, shell, restaurant, cart, orders, dashboard
lib/                     # API client, types, formatting, hooks
providers/               # Auth, cart, theme, toast
```
