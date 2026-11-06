# Architecture
- CRM business records persist per user in Lovable Cloud tables (one JSON document per row, RLS owner-only) through src/lib/cloudStore.ts; a shared in-memory cache keeps all mounted consumers in sync, saves are optimistic diffs with rollback, and data reloads on window focus.
- localStorage holds only screen preferences and the legacy crm_initialized_v5.* data offered for one-time import.
- Sign-in is gated client-side in AppLayout (public paths: /login, /reset-password); RLS is the real security boundary.
- Feature availability is centralized in src/lib/features.ts and enforced by navigation and route guards.
- Lead stage transitions use a single domain helper to enforce loss reasons and closure/stage timestamps.
- Normalizations (auto "Geral" pipeline, orphan leads, task lead_id backfill) run only after cloud data finishes loading, to avoid duplicates.
- Dashboard: current-status figures (active, in proposal, open value, funnel, alerts) ignore the period; flow figures use criadoEm / closed_at / stage_changed_at; 6-month evolution always ignores the period.
