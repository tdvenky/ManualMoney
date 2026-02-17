# Unit Tests

This document describes the testing strategy, structure, and conventions for ManualMoney.

## Overview

| Layer | Framework | Coverage | Test Files |
|-------|-----------|----------|------------|
| Backend | JUnit 5 + Mockito | ~95% | 7 |
| Frontend | Vitest + Testing Library | ~93% | 10 |

## Backend Tests

### Frameworks

- **JUnit 5 (Jupiter)** — Test runner and assertions (`assertEquals`, `assertTrue`, `assertThrows`)
- **Mockito** — Mocking (`@Mock`, `when().thenReturn()`, `verify()`)
- **Spring Boot Test** — JUnit integration
- **JaCoCo** — Code coverage reporting

### Test Files

| Test File | Tests | What It Covers |
|-----------|-------|----------------|
| `BucketServiceTest` | Bucket CRUD | Create, update, delete, list, find by ID |
| `PayPeriodServiceTest` | Pay period lifecycle, allocations, transactions | 52+ tests covering creation, closing, allocation management, transaction CRUD, balance recalculation, date validation, sorting |
| `DataServiceTest` | Export/import | Data retrieval and replacement |
| `JsonDataRepositoryTest` | File persistence | Load, save, file creation |
| `BucketControllerTest` | Bucket HTTP endpoints | Request mapping, response codes, error handling |
| `PayPeriodControllerTest` | Pay period HTTP endpoints | Request mapping, response codes, exception handling |
| `DataControllerTest` | Export/import endpoints | GET export, POST import |

Test files are located at `backend/src/test/java/com/manualmoney/`.

### Conventions

**Structure**: One test class per production class. Tests are organized by method under test:

```java
@ExtendWith(MockitoExtension.class)
class PayPeriodServiceTest {
    @Mock private JsonDataRepository repository;
    private PayPeriodService payPeriodService;

    @BeforeEach
    void setUp() {
        payPeriodService = new PayPeriodService(repository);
    }

    // --- getAllPayPeriods ---
    @Test
    void getAllPayPeriods_shouldReturnAllPayPeriods() { ... }

    // --- addTransaction ---
    @Test
    void addTransaction_shouldCreateTransactionAndUpdateBalance() { ... }

    @Test
    void addTransaction_shouldRejectDateOutsidePayPeriod() { ... }
}
```

**Naming**: `methodName_shouldExpectedBehavior` or `methodName_shouldExpectedBehavior_whenCondition`.

**Mocking**: Repository is always mocked. Services are tested in isolation against the mocked repository.

**Assertions**: Standard JUnit assertions. `assertThrows` for expected exceptions.

### Running

```bash
cd backend
./mvnw test                              # Run all tests
./mvnw test -Dtest=PayPeriodServiceTest  # Run a single test class
./mvnw verify                            # Run tests + generate JaCoCo report
```

Coverage report: `backend/target/site/jacoco/index.html`

## Frontend Tests

### Frameworks

- **Vitest** — Test runner (ESM-native, TypeScript support)
- **@testing-library/react** — Component rendering (`render`, `screen`, `fireEvent`)
- **@testing-library/jest-dom** — DOM matchers (`toBeInTheDocument`, `toHaveValue`)
- **@vitest/coverage-v8** — Code coverage
- **jsdom** — Browser environment simulation

### Test Files

| Test File | Tests | What It Covers |
|-----------|-------|----------------|
| `api/client.test.ts` | API client functions | All Axios calls for buckets, pay periods, allocations, transactions, export/import |
| `components/AllocationCard.test.tsx` | AllocationCard component | Rendering, expand/collapse, inline editing |
| `components/BucketForm.test.tsx` | BucketForm component | Default values, initial values, submission, cancel, input trimming |
| `components/PayPeriodForm.test.tsx` | PayPeriodForm component | Form rendering, validation, submission |
| `components/TransactionList.test.tsx` | TransactionList component | Transaction display, add/edit/delete flows |
| `pages/Dashboard.test.tsx` | Dashboard page | Loading state, empty state, active/closed periods, error handling |
| `pages/BucketsPage.test.tsx` | BucketsPage page | Bucket list, create/edit/delete, type sections |
| `pages/NewPayPeriodPage.test.tsx` | NewPayPeriodPage page | Form submission, navigation |
| `pages/PayPeriodDetailPage.test.tsx` | PayPeriodDetailPage page | Allocation list, transaction management, summary cards |
| `pages/DataPage.test.tsx` | DataPage page | Export download, import upload, confirmation |

Test files are located at `frontend/tests/`, mirroring the `src/` directory structure.

### Conventions

**Structure**: `describe`/`it` blocks. One test file per component or module:

```typescript
describe('BucketForm', () => {
    it('renders with default values', () => {
        render(<BucketForm onSubmit={vi.fn()} />);
        expect(screen.getByLabelText('Name')).toHaveValue('');
    });

    it('calls onSubmit with form values', async () => {
        const onSubmit = vi.fn();
        render(<BucketForm onSubmit={onSubmit} />);
        fireEvent.change(screen.getByLabelText('Name'), { target: { value: 'Rent' } });
        fireEvent.click(screen.getByText('Create'));
        expect(onSubmit).toHaveBeenCalledWith('Rent', 'EXPENSE');
    });
});
```

**Mocking**: The API client is mocked at the module level with `vi.mock()`. Components are tested against mocked API responses using `mockResolvedValue` and `mockRejectedValue`.

**Async**: Use `waitFor()` for assertions that depend on async operations (API calls, state updates).

**Routing**: Components that use React Router are wrapped in `MemoryRouter` during tests.

### Running

```bash
cd frontend
npm test                    # Run all tests once
npm run test:watch          # Run tests in watch mode
```

Coverage report: `frontend/coverage/index.html`

## What to Test

### Backend

| Area | What to Cover |
|------|--------------|
| Service methods | Happy path, not-found cases, validation failures, edge cases |
| Balance recalculation | Add/update/delete transactions, verify all balances recalculated correctly |
| Date validation | Boundary dates (first/last day of period), out-of-range dates |
| Controller endpoints | Correct HTTP status codes, request/response mapping, exception handling |
| Repository | File read/write, missing file handling |

### Frontend

| Area | What to Cover |
|------|--------------|
| Page components | Loading state, error state, empty state, data rendering, user interactions |
| Form components | Default values, initial values, submission, validation, cancel |
| API client | All endpoint functions, request parameters, response handling |
| User flows | Add/edit/delete operations with confirmation dialogs |

## Adding New Tests

1. **Backend**: Create a test class in the corresponding package under `src/test/java/com/manualmoney/`. Use `@ExtendWith(MockitoExtension.class)` and mock the repository.
2. **Frontend**: Create a test file in the corresponding directory under `tests/`. Mock API dependencies with `vi.mock('../api/client')`.
3. Run the full test suite to ensure nothing is broken.
4. Check coverage to identify untested paths.
