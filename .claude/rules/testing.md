# Testing Rules

## Frameworks

### Backend (Java 8, Spring Boot 2.7.18)
- Use `@SpringBootTest` for integration tests
- Use `@WebMvcTest` for controller-layer tests
- Use `@ExtendWith(MockitoExtension.class)` with `@Mock` / `@InjectMocks` for pure unit tests
- Test files live in `backend/src/test/java/com/manualmoney/`
- Run all: `./mvnw test` from `backend/`
- Run one class: `./mvnw test -Dtest=ClassName` from `backend/`

### Frontend (React 18, TypeScript)
- Use Vitest + `@testing-library/react`
- Use `render()`, `screen`, `userEvent`, `waitFor` from testing-library
- Mock API calls via `vi.mock()` on `api/client.ts`
- Test files live alongside source or in `__tests__/` directories
- Run all: `npm test` from `frontend/`
- Watch mode: `npm run test:watch` from `frontend/`

## Domain-Specific Rules

- **Always use `BigDecimal`** for monetary values in backend tests — never use floating point
- **Balance recalculation**: When testing transaction update/delete, verify that `previousBalance` and `newBalance` are recalculated correctly for all subsequent transactions in the allocation
- **Pay period status**: Test transitions between ACTIVE and CLOSED states explicitly

## Naming Conventions

- Backend: `should_expectedBehavior_when_condition()` or `testMethodName_condition_expectedResult()`
- Frontend: `it('should display error message when API call fails')` — descriptive strings

## Test Quality Standards

- Each test covers ONE behavior
- Tests must be independent — no shared mutable state
- Use `beforeEach` / `@BeforeEach` for common setup
- Test behavior and outcomes, not implementation details
- Use realistic test data, not trivial placeholders
- Always run tests after writing them to confirm they pass
