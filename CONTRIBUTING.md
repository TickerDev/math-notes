# Contributing to Mathnotes

Thank you for helping improve Mathnotes.

## Before opening an issue

- Search existing issues first.
- For parser problems, include the exact input, actual output, and expected notation.
- Remove lecture content or account information that should not be public.
- Report security problems privately as described in [SECURITY.md](SECURITY.md).

## Development workflow

1. Fork the repository and create a focused branch.
2. Install the locked dependencies with `npm ci`.
3. Copy `.env.example` to `.env.local` and use your own Supabase project or the local stack.
4. Make the smallest coherent change.
5. Add regression coverage for behavior changes.
6. Run `npm run check` before opening a pull request.

Changes to migrations or RLS policies must also pass the database suite:

```bash
npm run db:start
npm run db:reset
npm run db:test
npm run db:stop
```

## Pull requests

- Explain the user-visible problem and the chosen solution.
- Keep unrelated formatting or refactors out of the change.
- Include screenshots for interface changes at desktop and mobile sizes.
- Update README or security documentation when setup or permissions change.
- Never commit `.env` files, service-role keys, access tokens, or real lecture data.

By contributing, you agree that your contributions are licensed under the repository's MIT License.
