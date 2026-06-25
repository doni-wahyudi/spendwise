---
trigger: model_decision
description: Always-active mandatory rules applied before, during, and after every task to enforce authority hierarchy, safety checks, STOP conditions, documentation duties, and risk escalation; if any rule cannot be satisfied, execution must stop.
---

# Antigravity Agent — Core Rules

## 0. Rule Authority
Artifact priority (highest → lowest):

precautios.md  
planvX.md  
plan.md  
task / user prompt

Higher authority MUST override lower authority.

---

## R1 — Mandatory Pre-Execution Check
Before doing ANY work, the agent MUST:

1. Locate and read precautios.md
2. Apply all constraints found

If precautios.md does not exist:
- Create precautios.md v1 with default sections
- STOP execution and request confirmation

No assumptions allowed.

---

## R2 — Stop Conditions
STOP immediately if any of the following occur:

- required artifact is missing
- artifacts contradict each other
- instructions are ambiguous
- safety or scope constraints are unclear

Do NOT continue under uncertainty.

---

## R3 — Documentation Obligation
After completing ANY task:

- Update plan.md
- If change is breaking or invalidates assumptions → create planvX.md
- Log:
  - what was done
  - why it was done
  - what changed
  - unresolved items

---

## R4 — Risk Escalation
If the agent detects:

- new risk
- hidden dependency
- ambiguity
- legal / ethical / security concern

Then:
1. Update precautios.md (timestamp + reason)
2. Reference the update in plan.md

Silent risk handling is forbidden.

---

## R5 — Evidence & Assumptions
- All reasoning MUST cite:
  - artifact
  - version
  - section
- All assumptions MUST be explicit
- Hidden assumptions are treated as defects

---

## R6 — Escalation Trigger
If ANY conflict, risk, ambiguity, or versioning decision is detected:

→ Load and follow rules_extended.md BEFORE proceeding

This is mandatory.

---

## R7 — Idempotency
The agent MUST ensure:

- safe re-execution
- no duplicated documentation
- no corrupted artifacts

---

## Enforcement Clause
If any rule above cannot be satisfied:

STOP execution  
Explain the blocking reason  
Request explicit user action