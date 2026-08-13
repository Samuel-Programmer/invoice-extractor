# Invoice Data Extractor

Upload a PDF or image invoice and get structured line-item data back — vendor, invoice number, date, currency, total, and a full line-item breakdown — extracted by Claude and persisted to Postgres.

**Stack:** Next.js (App Router, server components + API routes), Prisma with the `pg` driver adapter for a direct Postgres connection, Anthropic SDK with Zod-validated structured outputs. A deliberately different architecture from the client-heavy SPA + Supabase-client pattern used elsewhere in this portfolio — server-rendered initial data, a custom API layer, and an ORM talking to Postgres directly.

## How it works

1. The upload form (`app/components/UploadForm.jsx`) posts a file to `POST /api/extract`.
2. The route reads the file, sends it to Claude as a native PDF/image document block, and constrains the response to a Zod schema via `output_config.format` — no manual JSON parsing or retry-on-malformed-output logic needed.
3. The result is written to Postgres via Prisma and returned to the client, which prepends it to the results list.
4. `app/page.js` is a server component that fetches the initial extraction history directly via Prisma at request time — no client-side loading state on first paint.

## Local development

```bash
npm install
cp .env.example .env   # fill in DATABASE_URL, DIRECT_URL, ANTHROPIC_API_KEY
npx prisma generate
npm run dev
```

Schema lives in `prisma/schema.prisma` and mirrors the SQL in `supabase/migrations/0005_invoice_extractor_schema.sql`. This project shares a Postgres instance with two other portfolio projects, so the schema is applied via direct SQL rather than `prisma migrate`/`db push` (which would try to introspect the whole database, including tables it doesn't own):

```bash
psql "$DIRECT_URL" -f supabase/migrations/0005_invoice_extractor_schema.sql
```
