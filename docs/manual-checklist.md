# Verification checklist

## Automated checks completed

- `npm run build`: production bundle built successfully.
- `npm test`: six tests passed (five rule tests and one end-to-end API test).
- API checks: missing identity, volunteer denied staff actions, invalid event, saved event, invalid evidence signature, profile persistence, private evidence access, remote duration, duplicate overlap, self-approval denial, concurrent approval credits once, report totals, CSV and empty reports.
- Headless Chrome: blank-submit errors for all four forms, first invalid input focused, valid event/profile/remote save, profile reload persistence, Pending to Approved workflow, matching report, CSV download, empty state, and 390px mobile layouts. No JavaScript page errors.
- Actual browser evidence is under `docs/screenshots/`.

## Manual demonstration checklist

- [ ] Tab through each form: natural order, visible focus, labels and helpers.
- [ ] Create an event with invalid times and zero capacity; verify no saved record.
- [ ] Create a valid restricted event, then show differing qualification messages as a volunteer with current or expired vaccination.
- [ ] Save an expired vaccination record; verify Expired status.
- [ ] Try an oversize or unsupported upload and verify rejection.
- [ ] Edit a profile without replacing evidence; verify the old document is retained.
- [ ] Change fields then Reset changes; verify the last saved values return.
- [ ] Submit overlapping work; verify rejection and unchanged credited hours.
- [ ] Reject a pending submission; verify explanation is required and hours remain zero.
- [ ] Inspect downloaded CSV and compare credited totals with approved submissions.
- [ ] Close/reopen the app and confirm local records remain.
- [ ] Confirm all actual group members contributed commits and appear in Canvas comments.

## External integration limits

Supabase database, Auth, private storage and cross-process compare-and-swap require a configured live project. Those integration checks are not completed without credentials. Before demonstrating cloud mode, run the schema, provision accounts, and verify sign-in, session expiry, staff restrictions, uploads/downloads, saved records and concurrent writes there. The current local demo selector is explicitly not secure authentication.
