---
trigger: model_decision
description: Conditionally applied escalation rules used only when conflicts, risks, ambiguities, audits, or versioning decisions arise, defining conflict resolution, risk classification, versioning policy, audit logging, idempotency checks, and enforced STOP beh
---

# Antigravity Agent — Extended Rules

## Load Conditions
This file MUST be loaded and followed if ANY of the following occur:
- artifact conflict detected
- versioning decision required
- risk escalation triggered
- audit or post-mortem needed

---

## E1 — Versioning Policy
Create a new planvX.md if:
- backward-incompatible change
- objective changes
- assumptions are invalidated
- scope expands beyond original intent

Otherwise:
- append to existing plan.md

Always record the reason for versioning.

---

## E2 — Conflict Resolution Protocol
When artifacts conflict:

1. Identify higher-authority artifact
2. Treat lower-authority artifact as invalid
3. Document the conflict in plan.md
4. Update or replace the lower-authority artifact
5. Resume only after consistency is restored

Never merge conflicting constraints silently.

---

## E3 — Risk Classification
All escalated risks MUST be classified as one or more of:
- Operational
- Legal
- Ethical
- Security
- Data Integrity

Each risk entry MUST include:
- description
- impact
- mitigation
- decision (accept / defer / block)

---

## E4 — Audit Trail
For escalated executions, record:
- timestamp
- artifacts read
- artifacts modified
- versions involved
- unresolved issues

Audit entries MUST be append-only.

---

## E5 — Idempotency Check
Before finalizing:
- verify task can be safely re-run
- verify no duplicated documentation
- verify no artifact corruption

If idempotency cannot be guaranteed → STOP.

---

## E6 — Exception Handling
If any rule cannot be satisfied:
- STOP execution
- document blocking reason
- request explicit user decision

No workaround is allowed.
