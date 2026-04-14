# API Conventions

## Backend (Spring Controllers)

- Controllers live in `controller/`; one controller per domain resource (Bucket, PayPeriod, etc.)
- Use `@RestController` + `@RequestMapping("/api/<resource>")` at class level
- Return domain objects or lightweight response bodies — avoid leaking internal IDs or implementation details unnecessarily
- Use `@PathVariable` for resource IDs, `@RequestBody` for mutation payloads
- Return `ResponseEntity` when status code matters; return the plain object for simple 200 responses
- Service methods throw unchecked exceptions for not-found / invalid state; controllers catch and map to appropriate HTTP status

## API Endpoint Conventions

Follow the existing resource hierarchy strictly:

```
GET/POST   /api/buckets
GET/PUT/DELETE /api/buckets/:id

GET/POST   /api/payperiods
GET/PUT    /api/payperiods/:id
PUT        /api/payperiods/:id/close

POST       /api/payperiods/:id/allocations
PUT        /api/allocations/:id

POST       /api/allocations/:id/transactions
PUT/DELETE /api/transactions/:id
```

- Sub-resources are nested under their parent (e.g., transactions under allocations)
- Use `PUT` for full updates, not `PATCH`
- Avoid adding new top-level routes unless the resource has no parent

## Frontend (Axios Client)

- All API calls are defined in `api/client.ts` — group by resource, export named functions
- Use the TypeScript interfaces from `types/index.ts` for request and response shapes
- Handle errors at the call site in the component (show user-facing error messages); don't silently swallow errors
- Reload or refetch data after mutations — don't optimistically update local state unless specifically needed
