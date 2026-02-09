# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

ManualMoney is a local-first, manual budgeting and expense tracking web app. It digitizes a notebook-based personal finance system — every paycheck is a zero-sum budget, every transaction is manually entered. No bank integrations, no automation. Data is stored as a single JSON file.

## Tech Stack

- **Backend**: Java 8, Spring Boot 2.7.18, Maven
- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS 3
- **Testing**: Vitest + @testing-library/react (frontend), Spring Boot Test (backend)
- **Data Storage**: Single JSON file (`backend/data/manualmoney.json`)

## Common Commands

### Backend (run from `backend/`)
```bash
./mvn spring-boot:run          # Start backend on port 8080
./mvn test                     # Run all backend tests
./mvn test -Dtest=ClassName    # Run a single test class
./mvn package                  # Build JAR
```

### Frontend (run from `frontend/`)
```bash
npm install          # Install dependencies
npm run dev          # Start Vite dev server on port 5173
npm build            # TypeScript check + Vite production build
npm test             # Run all tests once (vitest run)
npm run test:watch   # Run tests in watch mode (vitest)
npm run preview      # Preview production build
```

## Architecture

### Domain Model

The core data hierarchy is: **AppData → PayPeriods → Allocations → Transactions**, with **Buckets** as shared categories.

- **Bucket**: A persistent spending/savings category (e.g., "Groceries", "Rent"). Has a `type` (EXPENSE or SAVINGS). Buckets do NOT store balances — balances only exist within a pay period's allocation.
- **PayPeriod**: A pay cycle with income amount, date range, and status (ACTIVE/CLOSED). Contains a list of allocations.
- **Allocation**: Links a bucket to a pay period with an allocated amount and current balance. Contains a list of transactions.
- **Transaction**: A single expense entry with amount, description, date, and before/after balance snapshots (mimicking a physical ledger with strikethrough).

### Data Persistence

`JsonDataRepository` loads the entire JSON file on startup and saves after every mutation. There is no database — the single JSON file at `backend/data/manualmoney.json` is the complete data store. All monetary values use `BigDecimal`.

### Backend Structure (`backend/src/main/java/com/manualmoney/`)

- `ManualMoneyApplication.java` — Spring Boot entry point
- `config/CorsConfig.java` — CORS setup allowing `localhost:5173` and `localhost:3000`
- `model/` — Domain classes: `AppData`, `Bucket`, `BucketType`, `PayPeriod`, `PayPeriodStatus`, `Allocation`, `Transaction`
- `repository/JsonDataRepository.java` — File-based JSON persistence (path configured via `manualmoney.data.path` property)
- `service/` — `BucketService`, `PayPeriodService`, `DataService`
- `controller/` — `BucketController`, `PayPeriodController`, `DataController`

### API Endpoints

| Method         | Path                                | Description                   |
|----------------|-------------------------------------|-------------------------------|
| GET/POST       | `/api/buckets`                      | List/create buckets           |
| GET/PUT/DELETE | `/api/buckets/:id`                  | Single bucket CRUD            |
| GET/POST       | `/api/payperiods`                   | List/create pay periods       |
| GET/PUT        | `/api/payperiods/:id`               | Single pay period CRUD        |
| PUT            | `/api/payperiods/:id/close`         | Close a pay period            |
| POST           | `/api/payperiods/:id/allocations`   | Add allocation to pay period  |
| PUT            | `/api/allocations/:id`              | Update allocation             |
| POST           | `/api/allocations/:id/transactions` | Add transaction to allocation |
| PUT/DELETE     | `/api/transactions/:id`             | Update/delete transaction     |
| GET            | `/api/export`                       | Export all data as JSON       |
| POST           | `/api/import`                       | Import data (replaces all)    |

### Frontend Structure (`frontend/src/`)

- `api/client.ts` — Axios client with `baseURL: '/api'`, wraps all API calls
- `types/index.ts` — TypeScript interfaces mirroring backend models + request DTOs
- `pages/` — Dashboard, BucketsPage, NewPayPeriodPage, PayPeriodDetailPage, DataPage
- `components/` — BucketForm, PayPeriodForm, AllocationCard, TransactionList

### Frontend Routing

| Path              | Page                                            |
|-------------------|-------------------------------------------------|
| `/`               | Dashboard (active/closed pay periods)           |
| `/buckets`        | Bucket management                               |
| `/payperiods/new` | Create pay period                               |
| `/payperiods/:id` | Pay period detail with allocations/transactions |
| `/data`           | JSON export/import                              |

### Dev Proxy

Vite proxies `/api` requests to `http://localhost:8080` during development, so the frontend and backend run on separate ports but communicate seamlessly.

### Key Behavior: Balance Recalculation

When a transaction is updated or deleted, the service recalculates `previousBalance` and `newBalance` for all subsequent transactions in that allocation to maintain ledger consistency.
