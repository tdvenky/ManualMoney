# Code Review Guidelines

This document defines expectations for reviewing code changes in ManualMoney.

## Review Checklist

### Correctness

- [ ] Business logic matches the expected behavior described in FEATURES.md
- [ ] Balance recalculation is preserved — adding, updating, or deleting a transaction must recalculate all subsequent balances in that allocation
- [ ] Transaction dates are validated against the pay period's date range (inclusive)
- [ ] Monetary values use `BigDecimal` on the backend; no floating-point arithmetic
- [ ] API responses use correct HTTP status codes (200, 204, 400, 404)

### Code Quality

- [ ] Follows existing naming conventions (PascalCase for classes/components, camelCase for methods/variables)
- [ ] No unnecessary dependencies introduced
- [ ] No dead code, commented-out code, or leftover debug statements
- [ ] Methods and components have a single responsibility
- [ ] Backend services contain business logic; controllers only handle HTTP concerns

### Type Safety

- [ ] Backend: `Optional` used instead of returning `null`
- [ ] Frontend: TypeScript interfaces in `types/index.ts` are updated if the data model changes
- [ ] Frontend: No `any` types without justification
- [ ] API client functions in `api/client.ts` are properly typed

### Testing

- [ ] New backend logic has corresponding unit tests in the matching test class
- [ ] New frontend components or pages have corresponding test files in `tests/`
- [ ] Tests cover both the happy path and error/edge cases
- [ ] Mocks are scoped correctly (Mockito for backend, `vi.mock()` for frontend)
- [ ] All existing tests still pass

### Data Integrity

- [ ] Changes to the domain model are reflected in both backend and frontend
- [ ] JSON serialization/deserialization is not broken (check Jackson annotations if fields change)
- [ ] The single-file persistence model is respected — no partial writes or concurrent access assumptions
- [ ] Import/export still works after data model changes

### Frontend Specific

- [ ] Loading, error, and empty states are handled
- [ ] API errors are caught and displayed to the user
- [ ] Forms validate required fields before submission
- [ ] Date inputs use `min`/`max` constraints where applicable
- [ ] UI is consistent with existing Tailwind patterns

### Security

- [ ] No secrets, credentials, or personal data committed
- [ ] User input is not used in unsafe operations (e.g., file path construction)
- [ ] CORS configuration changes are intentional

## Patterns to Follow

### Backend

**Service methods** should validate inputs, perform business logic, and delegate persistence to the repository:

```java
public PayPeriod createPayPeriod(String payDate, String endDate, BigDecimal amount) {
    PayPeriod payPeriod = new PayPeriod();
    payPeriod.setPayDate(LocalDate.parse(payDate));
    payPeriod.setEndDate(LocalDate.parse(endDate));
    payPeriod.setAmount(amount);
    // ... set defaults
    AppData data = repository.loadData();
    data.getPayPeriods().add(payPeriod);
    repository.saveData(data);
    return payPeriod;
}
```

**Controllers** should be thin — map HTTP to service calls and return `ResponseEntity`:

```java
@PostMapping
public ResponseEntity<PayPeriod> createPayPeriod(@RequestBody CreatePayPeriodRequest request) {
    PayPeriod created = payPeriodService.createPayPeriod(
        request.getPayDate(), request.getEndDate(), request.getAmount());
    return ResponseEntity.ok(created);
}
```

### Frontend

**Page components** own data fetching and mutation. Reusable components receive data and callbacks via props:

```tsx
// Page component fetches and mutates
const [allocations, setAllocations] = useState<Allocation[]>([]);
useEffect(() => { loadData(); }, []);

// Reusable component receives props
<AllocationCard allocation={alloc} onUpdate={handleUpdate} />
```

**API calls** go through `api/client.ts`, never directly from components:

```tsx
// Good
import { addTransaction } from '../api/client';
await addTransaction(allocationId, data);

// Bad
await axios.post(`/api/allocations/${id}/transactions`, data);
```

## Common Pitfalls

- **Forgetting balance recalculation**: Any change to transactions must trigger a full recalculation of balances in that allocation. The service handles this, but new transaction-related logic must go through the existing recalculation path.
- **Breaking the JSON structure**: The entire `AppData` object is serialized/deserialized as one unit. Adding or renaming fields requires careful handling of existing data files.
- **Mismatched types**: If the backend model changes, the corresponding TypeScript interface in `types/index.ts` and the API client functions in `api/client.ts` must also be updated.
- **Ignoring date validation**: Transaction dates must fall within the pay period's `payDate` to `endDate` range. Both backend validation and frontend input constraints must be kept in sync.
