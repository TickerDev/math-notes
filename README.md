# Mathnotes

Mathnotes turns naturally written lecture notes into readable documents with typeset mathematics. Write the way a lecturer speaks; recognized expressions become KaTeX while the surrounding explanation remains editable prose.

## Features

- Natural-language parsing for integrals, sums, limits, roots, derivatives, fractions, powers, comparisons, arithmetic, functions, and Greek letters.
- Live, editable math rendering without separating source and preview panes.
- Transcript Beautify for speaker labels, spacing, and repeated-name cleanup.
- A searchable personal document library with autosave.
- Markdown and inline-LaTeX copy/export.
- Owner-controlled, read-only sharing through unguessable UUID links.
- Responsive React interface with Supabase authentication and persistence.

The parser is intentionally heuristic. It is designed for lecture notes, not as a computer algebra system or a substitute for checking mathematical notation.

## Security model

The Supabase publishable key is intentionally used in the browser. It identifies the project; it does not grant unrestricted database access.

Authorization is enforced in PostgreSQL Row Level Security, not trusted to React:

- Authenticated users can select, insert, update, and delete only rows whose `user_id` matches `auth.uid()`.
- Insert and update policies use `WITH CHECK`, preventing ownership reassignment.
- Anonymous users have no write grants.
- Shared notes require their UUID token and expose only `title`, `content`, and `updated_at` to anonymous readers.
- The `service_role` key must never be added to a `VITE_*` variable or committed to this repository.

The RLS behavior has a pgTAP regression suite in [`supabase/tests`](supabase/tests). See [SECURITY.md](SECURITY.md) for reporting vulnerabilities and the production checklist.

## Stack

- React 19 and TypeScript
- Vite
- KaTeX
- Supabase Auth and Postgres
- Cloudflare Workers Static Assets

## Local development

Requirements:

- Node.js 22.12 or newer
- npm
- A Supabase project, or Docker-compatible local containers for the complete local stack

Install dependencies and configure the client:

```bash
npm ci
cp .env.example .env.local
npm run dev
```

Set these values in `.env.local`:

```dotenv
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your-publishable-key
```

Only use a Supabase publishable key here. Every `VITE_*` value is included in the browser bundle.

### Supabase setup

To use a hosted project, link it and apply the committed migrations:

```bash
npx supabase login
npx supabase link --project-ref your-project-ref
npx supabase db push
```

For a fully local Supabase stack:

```bash
npm run db:start
npm run db:reset
npm run db:test
```

Copy the local API URL and publishable key reported by the CLI into `.env.local`. Stop the containers with `npm run db:stop`.

Before production, configure the hosted Supabase Auth URL/redirect allowlist, enable email confirmation, use production SMTP, and consider CAPTCHA for public sign-up.

## Commands

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start Vite development mode |
| `npm run check` | Run lint, unit tests, and the production build |
| `npm test` | Run parser, transcript, and policy-source tests |
| `npm run db:test` | Run live PostgreSQL RLS tests against local Supabase |
| `npm run db:types:local` | Generate database types from local Supabase |
| `npm run db:deploy` | Push migrations to the linked project, then regenerate types |
| `npm run preview` | Preview the Vite production output |
| `npm run preview:cloudflare` | Preview the built app in the Workers runtime |
| `npm run deploy` | Build and deploy through Wrangler |

## Deploy to Cloudflare Workers

The included [`wrangler.jsonc`](wrangler.jsonc) deploys `dist/` as Workers Static Assets, falls back to `index.html` for SPA routes, and applies the security policy in [`public/_headers`](public/_headers).

For Cloudflare's Git integration:

1. Push the repository to GitHub.
2. In **Workers & Pages**, import the repository as a Worker.
3. Use `npm run build` as the build command and `npx wrangler deploy` as the deploy command.
4. Add `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` as build variables in Cloudflare. They are public client configuration, not secrets.
5. Keep production and preview deployments on separate Supabase projects when possible.

Pull requests are validated independently by GitHub Actions before Cloudflare deploys merged changes.

## Project structure

```text
src/components/       Reusable UI and document rendering
src/screens/          Authentication, library, editor, and shared-note screens
src/lib/              Supabase and formatting utilities
src/mathParser.ts     Natural-language math parser
src/transcriptFormatter.ts
supabase/migrations/  Reproducible database schema and RLS policies
supabase/tests/       Database-level authorization tests
tests/                Fast Node.js regression tests
public/               Favicon and Cloudflare response headers
```

## Contributing

Issues and pull requests are welcome. Read [CONTRIBUTING.md](CONTRIBUTING.md) before making a change and follow the [Code of Conduct](CODE_OF_CONDUCT.md).

## License

Mathnotes is available under the [MIT License](LICENSE).
