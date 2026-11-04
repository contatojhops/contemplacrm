# Architecture
- CRM business records persist in shared browser-local stores, not Cloud tables; all mounted consumers must receive same-tab changes.
- Feature availability is centralized in src/lib/features.ts and enforced by navigation and route guards.
- Lead stage transitions use a single domain helper to enforce loss reasons and closure/stage timestamps.