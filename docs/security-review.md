# Candidate Firestore rules review

Issue #3 / #6, November 5, 2026. Reviewed candidate `firestore.rules` and v2 activity repository using the Firebase Security Rules Auditor skill. This assesses source and isolated tests, not deployed production permissions. Production rule changes require owner approval.

```json
{
  "score": 4,
  "summary": "Strict UID ownership and consistent bounded validation prevent cross-owner access and update escalation. Candidate rules still accept owner-supplied phase metadata and bounded timezone text; application reporting and safe removal now contain these self-integrity risks.",
  "findings": [
    {
      "check": "Business Logic vs Rules",
      "severity": "minor",
      "issue": "Rules validate the phase enum but do not evaluate annual organizer dates. A direct owner SDK request can store a phase inconsistent with its date.",
      "recommendation": "Keep reporting derived from the saved local date and reviewed annual configuration. Preserve the stored metadata and flag discrepancies; do not grant official credit from owner-supplied labels. Server validation generated from annual configuration remains an optional further hardening step."
    },
    {
      "check": "Type Safety",
      "severity": "minor",
      "issue": "Rules bound timezone text but cannot establish that every value is a supported IANA zone. A direct owner request can store an invalid zone.",
      "recommendation": "Flag malformed metadata without hiding physical activity. Reject new invalid client entries and edits, while allowing a validated owner tombstone to preserve recovery. A reviewed server zone allowlist is an optional stricter policy."
    }
  ]
}
```

## Mandatory checks

- **Update bypass:** create and update both execute `validEntry`; updates additionally preserve identity, year, date, phase, timezone and original creation time. Only amount, tombstone, revision, update time and operation ID may change. Incremented revision and changed operation ID prevent stale replacements; deleted records cannot be resurrected.
- **Authority:** `request.auth.uid` must equal the UID in the document path. User-supplied owner data must match that path and cannot grant access to another participant. No self-assigned role or email-based privilege exists.
- **Read exposure:** reads/listing are limited to the owner's entries; unrelated/legacy paths default deny. Administrative archive imports remain a trusted operator boundary with explicit owner mapping.
- **Storage:** the fixed field set prevents arbitrary arrays/maps; all strings are bounded, amount/revision/timestamps are bounded, and amounts are integers. Rules do not rate-limit an authenticated owner's document creation. Quotas and authorized account provisioning remain operational controls.
- **Types/dates:** calendar dates validate month lengths and Gregorian leap years. Typed amount/revision/deletion and immutable year ownership are enforced. Phase enum and timezone bounds have the residual semantic limits above.
- **Archive behavior:** historical years are denied writes outside the current global local-year interval. The interval intentionally spans UTC+14 through UTC-12, so both adjacent years can briefly be writable around global New Year. Reserved `legacy_` IDs deny client creates/updates at all times. Administrative imported provenance is readable by the owner but immutable through the client.

## Remediation and regression evidence

The read model derives configured-edition reporting phase from `localDate` and the edition engine, even when saved phase text is inconsistent. It retains the original records unchanged. `summary.metadataWarnings` identifies suspicious record IDs/fields; the UI must display this warning. Malformed timezone/phase metadata does not silently remove otherwise valid physical activity.

New entries/edits still require a valid IANA timezone. Safe removal permits an invalid IANA name only when the resulting record is a tombstone; identity, bounded fields, amount, date and creation-time checks remain active. Imported IDs remain read-only.

Native tests cover phase spoofing in both directions, training boundaries, future-edition inspection, immutable originals, metadata warnings and malformed-zone tombstones. The emulator suite includes an owner direct-write malformed timezone followed by repository removal, with another user's read still denied. The yearly security fixture derives its phase through the same annual engine so it remains valid after the calendar advances.

Lead integration must run the candidate emulator suite and browser warning/removal flow before release. No production rules were deployed or modified during this review.
