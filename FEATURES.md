# ManualMoney - Product Requirements Document

## Problem

Many people track their personal finances using a physical notebook or spreadsheet. Each paycheck is divided into spending categories, and every expense is written down by hand. This approach works because it forces intentionality, but it suffers from practical limitations: notebooks get lost, math errors compound, and there's no easy way to review historical data or adjust allocations. Existing budgeting apps solve these problems but introduce unwanted complexity -- bank integrations, automated categorization, subscription fees, and data privacy concerns. There is no simple digital tool that preserves the manual, zero-sum budgeting workflow.

## Solution

ManualMoney is a local-first web application that digitizes the notebook-based budgeting system. Every paycheck becomes a pay period where income is manually allocated across spending and savings categories (buckets). Every transaction is entered by hand, maintaining the ledger-style record of balance changes. Data is stored as a single JSON file with no external dependencies, no bank connections, and no cloud accounts. The app runs locally and gives users full control over their financial data.

## User Stories

- As a user, I want to create spending and savings categories so I can organize where my money goes.
- As a user, I want to create a pay period for each paycheck so I can budget that income from scratch.
- As a user, I want to allocate my income across categories so every dollar has a purpose (zero-sum budgeting).
- As a user, I want to manually enter each expense so I stay aware of my spending.
- As a user, I want to see a running balance for each category so I know how much I have left.
- As a user, I want to see previous and new balances on each transaction so it feels like a physical ledger.
- As a user, I want to close a pay period when it's done so I can distinguish current from past budgets.
- As a user, I want to export and import my data as JSON so I can back up or transfer my records.
- As a user, I want transaction dates validated against the pay period range so my records stay accurate.

## Features

### Bucket Management
- Create, edit, and delete buckets (spending/savings categories).
- Two bucket types: EXPENSE and SAVINGS.
- Buckets page displays expense and savings buckets in separate sections.
- Buckets are persistent across pay periods; balances exist only within allocations.

### Pay Period Management
- Create pay periods with a start date, end date, and income amount.
- Dashboard displays all pay periods split into Active and Closed sections.
- Close a pay period (with confirmation) to mark it as finalized.
- Pay period detail page shows summary cards: Income, Allocated, Unallocated, Remaining.

### Allocations
- Allocate income to buckets within a pay period.
- Each bucket can only be allocated once per pay period.
- Edit allocation amounts; the balance adjusts by the difference.
- Expandable allocation cards show transactions within each allocation.

### Transactions
- Manually add transactions (description, amount, date) against an allocation.
- Edit and delete transactions with confirmation.
- Ledger-style display: each transaction shows previous balance (struck through) and new balance.
- Balance recalculation: when a transaction is added, updated, or deleted, all balances in that allocation are recalculated to maintain consistency.
- Date validation: transaction dates must fall within the pay period's date range (inclusive). Backend returns 400 for out-of-range dates; frontend date pickers enforce min/max constraints.
- Auto-sort by date: transactions are automatically sorted by date after every add or update, with balances recalculated in sorted order.

### Data Management
- Export all data as a downloadable JSON file (timestamped filename).
- Import data from a JSON file (replaces all existing data, with confirmation).
- All data persisted as a single JSON file on the backend.

### Dashboard
- Landing page showing active and closed pay periods.
- Each pay period card shows date range, allocation count, income, allocated total, and remaining total.
- Quick links to create buckets or a new pay period.
- Welcome state for new users with no data.

## Out of Scope

- Bank account integrations or automatic transaction imports.
- Multi-user or shared household support.
- Cloud sync, hosted accounts, or authentication.
- Recurring transactions or scheduled payments.
- Charts, graphs, or spending analytics.
- Mobile native apps (iOS/Android).
- Currency conversion or multi-currency support.
- Bill reminders or notifications.

## Success Metrics

- Users can complete a full budgeting cycle (create buckets, create pay period, allocate income, enter transactions, close period) without errors.
- All monetary calculations maintain precision (no rounding drift across transactions).
- Data export produces a valid JSON file that can be re-imported without data loss.
- Ledger balances remain consistent after any combination of transaction adds, edits, and deletes.
- The app runs entirely locally with no external network dependencies beyond initial setup.
