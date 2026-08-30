# Security policy

## Supported versions

Security fixes are applied to the current `main` branch. Until stable releases are published, older commits are not supported separately.

## Reporting a vulnerability

Please do not open a public issue for a suspected vulnerability. Use GitHub's **Report a vulnerability** flow under the repository's Security tab. If private vulnerability reporting is unavailable, contact the maintainer through the contact method on their GitHub profile.

Include the affected component, reproduction steps, impact, and any suggested mitigation. Do not include real user documents, credentials, session tokens, or service-role keys.

You should receive an acknowledgement within seven days. Please allow a reasonable remediation window before public disclosure.

## Supabase boundary

Mathnotes is a browser application, so its Supabase URL and publishable key are public by design. Security depends on the committed grants and Row Level Security policies being applied to the deployed database.

Before operating a public instance:

- Apply every migration in `supabase/migrations`.
- Run `npm run db:test` against a local reset database.
- Confirm RLS remains enabled on every table in an exposed schema.
- Never expose a Supabase `service_role` or secret key to the browser.
- Use separate Supabase projects for untrusted preview deployments and production.
- Enable email confirmation, production SMTP, and appropriate Auth abuse controls.
- Review Supabase's Security and Performance Advisors after schema changes.

The application provides no end-to-end encryption. The operator of a Supabase project can access data stored in that project.
