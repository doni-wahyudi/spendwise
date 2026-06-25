# Precautions (precautios.md) v1

**Last Updated**: 2026-06-25T17:08:46+07:00

## 1. Safety & Security Constraints
- Do not execute modifications or code that could compromise workspace integrity.
- Verify all configurations and credentials prior to execution.
- Adhere strictly to repository-based agent rules.

## 2. Scope & Boundaries
- Target Directory: `c:\Users\whydo\D9043DB2025\code\explore\apk\spendwise`
- Ensure changes are localized, minimal, and fully documented.
- No untested or unverified changes should be introduced.

## 3. Known Risks & Mitigations
- **Risk**: Loss of offline-first/PWA state integrity.
  - *Mitigation*: Ensure database changes are backwards-compatible and test IndexedDB functionality.
- **Risk**: Breaking Capacitor/Android build paths.
  - *Mitigation*: Verify plugins and build targets align with Capacitor configuration.

## 4. Environment & Tool Limits
- Node.js environment on Windows.
- Standard IDE tools and terminal access.

## 5. Version History
- **v1 (2026-06-25)**: Created with default precaution sections as required by Core Rules.
