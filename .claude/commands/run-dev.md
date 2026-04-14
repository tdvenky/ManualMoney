Start the ManualMoney development environment.

The app requires two processes running simultaneously:

**Backend** (Spring Boot on port 8080):
```bash
cd backend && ./mvnw spring-boot:run
```

**Frontend** (Vite dev server on port 5173):
```bash
cd frontend && npm run dev
```

The frontend proxies `/api` requests to `http://localhost:8080` automatically — no extra config needed.

Open http://localhost:5173 in a browser once both are running.

> Note: Start the backend first so the frontend doesn't show API errors on load.
