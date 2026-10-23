# PAWS Volunteer Portal - Form Controls Activity

A working React + Node.js app containing two major forms and two supporting forms, styled with the green, cream, white, and charcoal colors observed on the PAWS website. This is an academic project, not an official PAWS service.

## Run locally

Use Node.js 22.12 or newer and npm.

```sh
npm install
npm run dev
```

Open **http://localhost:3000**. No external account is needed in local mode. The banner explicitly identifies this as a classroom demonstration. Demo identity selection is not authentication; use fictional data only.

- **Ana Cruz - Staff:** create events, approve or reject assigned remote submissions, and generate reports.
- **Maya Santos - Volunteer:** edit a junior volunteer profile and submit remote work.
- **Luis Reyes - Volunteer:** edit a senior volunteer profile and submit remote work.

The identity selector is at the top of every page. Switching identities is only a local demo convenience. Files and records persist under the ignored `data/` directory. They survive browser reloads and server restarts. Run one Node process per local data directory; multiple replicas require Supabase mode.

```sh
npm run build
npm start
npm test
```

`npm test` starts an isolated local API server and temporary data directory. Local network permissions are needed in restricted environments. `npm start` serves the production build on the same port as the API.

## Activity scope

| Classification | Form | Controls | Data handling |
| --- | --- | --- | --- |
| Major | Create Event | 8 inputs + 2 buttons | Saved event appears on the event board |
| Major | Volunteer Profile and Vaccination Update | 8 inputs + 2 buttons | Contact details, evidence, vaccination status and event eligibility update |
| Supporting | Remote Work Submission | 8 inputs + 2 buttons | Server-calculated time remains pending until the assigning staff approves |
| Supporting | Report Filters and Generation | 8 inputs + 2 buttons | Filtered preview, approved/pending totals, and CSV download |

Buttons are included in the assignment's permitted control types. Toggle controls are labeled checkboxes. Each form uses natural keyboard order, visible focus, explicit labels, helper text, inline errors, an error summary and first-invalid-field focus. The review panel is supplementary to the four assessed forms.

This activity does not implement full dashboards, task claiming, kiosk attendance, public registration, bulk account import, automatic senior promotion, email delivery, or backups. Event capacity is stored but event joining is outside this activity. Reports cover saved remote submissions, not onsite attendance or full-project analytics. No medical policy is inferred from an expiry date: enter dates supplied by PAWS and the volunteer's record.

## Configure Supabase

1. Create a Supabase project and execute `supabase/schema.sql` in its SQL Editor.
2. Create staff and volunteer accounts under Authentication > Users. Use fictional test accounts for the activity. Add each Auth UUID to `activity_members`, with the correct name, role (`staff` or `volunteer`) and senior flag. Provision at least one staff reviewer.
3. Copy `.env.example` to `.env`. Set `STORAGE_MODE=supabase`, `SUPABASE_URL`, `SUPABASE_ANON_KEY`, and `SUPABASE_SERVICE_ROLE_KEY`.
4. Restart the app. It now shows a login form rather than the demo identity selector. Use the provisioned email/password to sign in.

The service role key is server-only. Private evidence is downloaded through authorized backend routes. Database tables have RLS enabled and no browser access; only the server's service role may read or update them. Each request verifies its bearer token and membership on the server. Staff permissions and record ownership are checked on the backend. Sessions are held in sessionStorage, expire with the Supabase access token, and require sign-in again when expired; refresh-token/session recovery is outside the activity.

The focused activity schema stores form records in a private JSONB state document, with an atomic version check for concurrent writes. This is a deliberately small activity implementation, not a migration of the full relational ERD in the paper. Use the thesis relational model before expanding into the full system. Cloud database/storage and real Auth behavior require configured credentials and have not been integration-tested against a live Supabase project in this workspace. The default local mode, API business rules and browser workflows were tested.

## Validation and evidence

See `docs/form-controls.md` for the complete control list, `docs/manual-checklist.md` for checks, and `docs/demo-script.md` for a 3-minute walkthrough. `docs/screenshots/` contains actual browser captures from synthetic test data. Screenshot evidence files are tiny synthetic PNG fixtures; they are not medical records or real completed work.

File uploads are limited to one JPEG, PNG, or PDF up to 5 MB, checked by MIME at the client and file signatures at the server. This checks type, not document authenticity or malware. Staff must review the actual document. Duplicate and overlapping non-rejected work claims are rejected. Review transitions are atomic and cannot credit the same entry twice. CSV fields are quoted and spreadsheet formulas are neutralized.

## Submission responsibilities

Upload screenshots, a 2-4 minute recording, the actual group repository link, and the generated documentation PDF. Record your own video using the script. Each member must make genuine contributions and commits; no member contributions or repository link are fabricated here. List all group members in the Canvas comments.
