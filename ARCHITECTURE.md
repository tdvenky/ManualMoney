# Architecture

This document describes the technical architecture of ManualMoney.

## System Overview

ManualMoney is a two-tier web application: a Spring Boot backend serving a REST API over a single JSON file, and a React frontend that communicates with it via Axios. There is no database, no external services, and no authentication layer.

```
Browser (React + Vite)
   │
   │  HTTP / JSON
   │  Proxied via Vite in dev (:5173 → :8080)
   ▼
Spring Boot REST API (:8080)
   │
   │  Read / Write
   ▼
Single JSON File (backend/data/manualmoney.json)
```

## Domain Model

The core data hierarchy is **AppData → PayPeriods → Allocations → Transactions**, with **Buckets** as shared categories.

```
AppData (root)
├── buckets: Bucket[]
│   └── Bucket { id, name, type (EXPENSE|SAVINGS), createdAt, updatedAt }
└── payPeriods: PayPeriod[]
    └── PayPeriod { id, payDate, endDate, amount, status (ACTIVE|CLOSED) }
        └── allocations: Allocation[]
            └── Allocation { id, bucketId, allocatedAmount, currentBalance }
                └── transactions: Transaction[]
                    └── Transaction { id, description, amount, date, previousBalance, newBalance }
```

Key relationships:
- A **Bucket** is a persistent category. It does not hold a balance — balances only exist within an Allocation.
- A **PayPeriod** represents one paycheck cycle. It contains Allocations that distribute income across Buckets.
- An **Allocation** links a Bucket to a PayPeriod with a budget amount and running balance.
- A **Transaction** is a single manual expense entry. It records both the previous and new balance (ledger-style).

## Backend Architecture

### Layered Structure

```
Controller (HTTP)  →  Service (Business Logic)  →  Repository (Persistence)
                                                         │
                                                    JSON File
```

| Layer | Responsibility | Example |
|-------|---------------|---------|
| `model/` | Domain classes and enums | `PayPeriod`, `BucketType`, `Transaction` |
| `repository/` | Load and save the JSON file | `JsonDataRepository` |
| `service/` | Business rules, validation, balance recalculation | `PayPeriodService`, `BucketService` |
| `controller/` | HTTP endpoints, request/response mapping | `PayPeriodController`, `BucketController` |
| `config/` | Cross-cutting concerns | `CorsConfig` |

### Data Persistence

`JsonDataRepository` holds the entire `AppData` object in memory. On startup it reads the JSON file; after every mutation it writes the full object back to disk. Jackson is configured with `JavaTimeModule` for date serialization and `INDENT_OUTPUT` for readability. All monetary values use `BigDecimal`.

There is no transaction rollback — if the JVM crashes mid-write, data could be lost. This is an accepted trade-off for simplicity.

### Balance Recalculation

When a transaction is added, updated, or deleted, `PayPeriodService` recalculates every transaction's `previousBalance` and `newBalance` in that allocation from scratch, in date-sorted order. The allocation's `currentBalance` is updated to reflect the final state.

### API Design

All endpoints live under `/api`. Controllers return `ResponseEntity` with appropriate status codes:
- **200** for successful reads and writes
- **204** for successful deletes
- **400** for validation failures (e.g., transaction date outside pay period range)
- **404** for missing resources

Request DTOs are defined as static inner classes within controllers.

## Frontend Architecture

### Routing

React Router v6 maps five routes to page components:

| Path | Page Component | Purpose |
|------|---------------|---------|
| `/` | `Dashboard` | Active and closed pay periods |
| `/buckets` | `BucketsPage` | Bucket CRUD |
| `/payperiods/new` | `NewPayPeriodPage` | Create a pay period |
| `/payperiods/:id` | `PayPeriodDetailPage` | Allocations and transactions |
| `/data` | `DataPage` | JSON export/import |

### State Management

There is no global state library. Each page component manages its own state with `useState` and fetches data on mount with `useEffect`. After a mutation, the component re-fetches from the API to stay in sync.

### API Client

`api/client.ts` wraps Axios with `baseURL: '/api'`. Every backend endpoint has a corresponding typed async function. During development, Vite proxies `/api` requests to `http://localhost:8080`.

### Component Hierarchy

```
App (Router)
├── Dashboard
├── BucketsPage
│   └── BucketForm
├── NewPayPeriodPage
│   └── PayPeriodForm
├── PayPeriodDetailPage
│   ├── AllocationCard
│   │   └── TransactionList
│   └── PayPeriodForm (edit mode)
└── DataPage
```

Page components own data fetching and mutation logic. Reusable components (`BucketForm`, `PayPeriodForm`, `AllocationCard`, `TransactionList`) receive data and callbacks via props.

## Directory Structure

```
ManualMoney/
├── backend/
│   ├── src/main/java/com/manualmoney/
│   │   ├── ManualMoneyApplication.java
│   │   ├── config/CorsConfig.java
│   │   ├── model/          (7 files: AppData, Bucket, BucketType, PayPeriod, PayPeriodStatus, Allocation, Transaction)
│   │   ├── repository/     (JsonDataRepository.java)
│   │   ├── service/        (BucketService, PayPeriodService, DataService)
│   │   └── controller/     (BucketController, PayPeriodController, DataController)
│   ├── src/main/resources/application.properties
│   ├── src/test/java/com/manualmoney/   (7 test files)
│   ├── data/manualmoney.json
│   └── pom.xml
├── frontend/
│   ├── src/
│   │   ├── api/client.ts
│   │   ├── types/index.ts
│   │   ├── components/     (AllocationCard, BucketForm, PayPeriodForm, TransactionList)
│   │   ├── pages/          (Dashboard, BucketsPage, NewPayPeriodPage, PayPeriodDetailPage, DataPage)
│   │   ├── App.tsx
│   │   ├── main.tsx
│   │   └── index.css
│   ├── tests/              (10 test files mirroring src/ structure)
│   ├── vite.config.ts
│   ├── tailwind.config.js
│   ├── tsconfig.json
│   └── package.json
├── CLAUDE.md
├── FEATURES.md
└── README.md
```
