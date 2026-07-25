# Capitol Command Center

Federal construction project operations demo — evidence to payment for primes and subs on federal work in Washington, D.C.

**Stack:** Next.js 14 · TypeScript · Tailwind · Prisma · SQLite

## Local setup

```bash
npm install
npx prisma migrate dev
npx prisma db seed
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Demo project

**Franklin Court Federal Building — Phase 1 Modernization** (hypothetical)  
Contract `47PA0326C0018` · GSA · Meridian Federal Constructors

## Notes

- Seed is idempotent (`npx prisma db seed`).
- AI narratives use `ANTHROPIC_API_KEY` when set; otherwise template fallbacks.
- On Vercel, the app boots from a committed `prisma/demo.db` snapshot copied into `/tmp`.
