# ManualMoney

ManualMoney is a **local-first, manual budgeting and expense tracking web app**
designed to digitize a notebook-based personal finance system.

It intentionally avoids bank integrations, automation, and “smart” budgeting
features. Instead, it preserves the **discipline, awareness, and mental model**
of writing things down — while removing manual math and improving clarity.

---

## 🧠 Philosophy

ManualMoney is built on a few core principles:

- **Every paycheck is a zero-sum budget**
- **Manual entry builds financial awareness**
- **Software should assist thinking, not replace it**
- **Transparency over automation**

If a transaction exists in ManualMoney, it’s because *you consciously recorded it*.

---

## 💡 How It Works

### Pay Periods (Paychecks)
- Each pay period is created manually.
- The paycheck amount is entered explicitly.
- The full amount is allocated across predefined expense and savings buckets.

### Buckets
- Buckets are persistent categories (e.g., Groceries, Rent, Travel, Savings).
- Buckets do **not** store balances.
- Balances exist only within a pay period.

### Expense Tracking
- Purchases are logged manually into expense buckets.
- Each transaction deducts from the bucket’s balance.
- Balance updates visually **strike out the previous amount** and show the new one,
  mimicking a physical ledger.

### Savings
- Savings are allocated per pay period.
- When money is transferred externally (e.g., to a HYSA), the transfer is
  **manually marked as complete**.
- Savings buckets can also be used as expense buckets when needed.

### End of Pay Period
- Any remaining money can be:
  - **Saved**, or
  - **Carried forward** into the same bucket for the next pay period.

### Monthly Insight
- Monthly savings percentage is calculated from two pay periods.
- Focus is on period-based clarity, not lifetime net-worth tracking.

---

## 🗂 Data & Storage

- Local-first storage using browser-based persistence.
- Manual export/import via JSON files.
- Designed for easy versioning in Google Drive
  (similar to a KeePass database workflow).

No accounts. No servers. Your data stays with you.

---

## 🚫 Explicitly Out of Scope (By Design)

- Bank or credit card integrations
- Automatic transaction imports
- AI-driven categorization
- Income prediction or forecasting
- Shared or collaborative budgeting (for now)

---

## 🛠 Tech Stack (Planned)

- Frontend: React
- UI: Minimal, ledger-inspired table layout
- Storage: IndexedDB (local)
- Charts: Optional, lightweight summaries only

---

## 🎯 Goal

ManualMoney exists to make a **disciplined, intentional personal finance system**
sustainable over the long term — without turning it into a black box.

If the app ever feels like it’s “doing things for you,” it’s probably doing too much.

---

## 📌 Status

Early development.  
Requirements and design are being finalized before implementation.

