# Code Style Rules

## Backend (Java 8)

- Target Java 8 — no lambdas or streams beyond what Spring Boot 2.7 already uses in the codebase; no records, no var
- All monetary values use `BigDecimal` — never `double` or `float`
- Domain model lives in `model/`; keep it plain (no business logic in model classes)
- Services own all business logic; controllers are thin (validate input, delegate, return response)
- Use constructor injection over field injection (`@Autowired` on fields is discouraged)
- Prefer explicit null checks over Optional chaining when the codebase doesn't already use Optional

## Frontend (TypeScript + React 18)

- All new code in TypeScript — no `any` types; define interfaces in `types/index.ts`
- Functional components only — no class components
- Keep components in `components/`, full pages in `pages/`
- All API calls go through `api/client.ts` — never use `fetch` or a raw axios instance elsewhere
- Use Tailwind utility classes for styling — no inline styles, no CSS modules
- Prefer explicit `undefined` checks over falsy checks for optional fields

## General

- No dead code, commented-out blocks, or TODO comments left in committed files
- Do not add docstrings or JSDoc to code you didn't write or weren't asked to document
- Keep files focused — if a file is doing too many things, that's a sign to split, not to add more
