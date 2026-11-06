# #3 — Multi-year data integrity and identity safety

**Issue:** https://github.com/BenWassa/the-pushup-challenge-2025/issues/3  
**Status:** Planned — design/data audit before any implementation  
**Depends on:** #2 foundation; coordinate schema with #4

## Research tasks
- Read full Firestore access rules and deployment environment; clarify relationship between email auth UID and username document path.
- Inventory real data types without writing/mutating records. Note demos, legacy years, historical submitted_date entries, duplicate timestamps and missing season fields.
- Define canonical `challengeYear`, `phase`, `localDate`, amount, stable log ID, creation timestamp and user ownership model.
- Decide year-scoped documents vs append-only entries; provide comparability, atomicity and quota trade-offs.
- Define read-only migration/reconciliation of 2025/2026 records and a backup/export with rollback.
- Specify add/undo/edit consistency and cloud error/queued sync UX.

## Acceptance
1. Written proposal and anonymized data fixtures reviewed before any live write.
2. Backups and restoration path verified.
3. No cross-user read/write possible under Firestore rules.
4. Challenge total excludes non-official and prior-year activity.
5. Undo/edit cannot silently lose records under concurrent updates.

## Boundaries
Do not create public signup, destructive migration, or new multi-user UX.
