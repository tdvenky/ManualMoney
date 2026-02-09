# Features

This document is the source of truth for all implemented features in ManualMoney.

---

## Bucket Management

- Create, edit, and delete buckets (spending/savings categories)
- Two bucket types: EXPENSE and SAVINGS
- Buckets page shows expense and savings buckets in separate sections
- Buckets are persistent across pay periods (balances are per-allocation, not per-bucket)

## Pay Period Management

- Create pay periods with a start date, end date, and income amount
- View all pay periods on the dashboard, split into Active and Closed sections
- Close a pay period (with confirmation) to mark it as finalized
- Pay period detail page shows summary cards: Income, Allocated, Unallocated, Remaining

## Allocations

- Allocate income to buckets within a pay period
- Each bucket can only be allocated once per pay period
- Edit allocation amounts; balance adjusts by the difference
- Expandable allocation cards show transactions within each allocation

## Transactions

- Manually add transactions (description, amount, date) against an allocation
- Edit and delete transactions with confirmation
- Ledger-style display: each transaction shows previous balance (struck through) and new balance
- Balance recalculation: when a transaction is added, updated, or deleted, all balances in that allocation are recalculated from scratch to maintain consistency
- **Date validation**: transaction dates must fall within the pay period's date range (inclusive). Backend returns 400 Bad Request for out-of-range dates. Frontend date pickers are constrained with `min`/`max` attributes.
- **Auto-sort by date**: transactions are automatically sorted by date after every add or update. Balances are recalculated in the sorted order.

## Data Management

- Export all data as a downloadable JSON file (timestamped filename)
- Import data from a JSON file (replaces all existing data, with confirmation)
- All data persisted as a single JSON file on the backend

## Dashboard

- Landing page showing active and closed pay periods
- Each pay period card shows date range, allocation count, income, allocated total, and remaining total
- Quick links to create buckets or a new pay period
- Welcome state for new users with no data
