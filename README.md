# PAWS Volunteer Portal

A classroom project built with React and Node.js. Staff can create events and review remote work, while volunteers can update their profiles and submit work for approval.

This is **not an official PAWS service**. Use fictional names, contact details, and documents when trying it.

## Get started

Install **Node.js 22.12 or newer** and npm. From the project folder, run:

```sh
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). The default local demo needs no account or configuration.

Use the identity selector at the top of any page to switch roles:

| Demo identity | What you can do |
| --- | --- |
| Ana Cruz — Staff | Create events, review remote work assigned to you, and generate reports |
| Maya Santos — Volunteer | Update a junior volunteer profile and submit remote work |
| Luis Reyes — Volunteer | Update a senior volunteer profile and submit remote work |

The selector is a demo feature, not a secure login. Records and uploads are saved in the ignored `data/` folder and remain after browser reloads and server restarts. Run only one Node process with that folder; use Supabase mode for multiple server instances.

## What the app includes

The activity has **two major forms and two supporting forms**. Each has eight inputs and two action buttons.

| Form | Type | Result |
| --- | --- | --- |
| Create Event | Major | Saves an event and displays it on the event board |
| Volunteer Profile and Vaccination Update | Major | Updates contact details, evidence, vaccination status, and event eligibility |
| Remote Work Submission | Supporting | Calculates submitted time; hours count only after the assigning staff approves them |
| Report Filters and Generation | Supporting | Shows filtered remote submissions, approved and pending totals, and an optional CSV download |

Each form includes labels, helper text, keyboard navigation, visible focus, and validation messages. Invalid submissions show an error summary and move focus to the first invalid field. Toggles are labeled checkboxes. Buttons count toward the assignment's allowed control types. The staff review panel is separate from the four assessed forms.

### Try a complete workflow

1. Select **Ana Cruz** and create an event.
2. Select **Maya Santos** or **Luis Reyes** and update the volunteer profile.
3. Submit remote work and assign it to Ana. It starts as pending, with no credited hours.
4. Switch to **Ana**, review the evidence, and approve or reject the submission.
5. Generate a report to see the submission and its credited hours.

See the [demo script](docs/demo-script.md) for a guided walkthrough.

## Build and test

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start the development server |
| `npm run build` | Create the production build |
| `npm start` | Serve the production build and API on the same port; build first |
| `npm test` | Run tests with an isolated API server and temporary data folder |

The `npm start` command uses POSIX environment-variable syntax. In Windows PowerShell, start the production server after building with:

```powershell
$env:NODE_ENV = "production"
node server/index.js
```

Tests need permission to open a local network port in restricted environments.

## Optional: use Supabase

Use this mode to sign in with provisioned accounts instead of selecting demo identities.

1. Create a Supabase project and run [supabase/schema.sql](supabase/schema.sql) in its SQL Editor.
2. In **Authentication > Users**, create fictional staff and volunteer test accounts.
3. Add each account's Auth UUID to `activity_members`. Set its name, role (`staff` or `volunteer`), and senior flag. Include at least one staff reviewer.
4. Copy [.env.example](.env.example) to `.env`. Set `STORAGE_MODE=supabase` and fill in `SUPABASE_URL`, `SUPABASE_ANON_KEY`, and `SUPABASE_SERVICE_ROLE_KEY`.
5. Restart the app and sign in with a test account's email and password.

### Access and storage

- Keep the service role key on the server. The backend checks access tokens, membership, staff permissions, and record ownership.
- Database tables have row-level security (RLS) enabled and no direct browser access. Only the server's service role can read or update them. Private evidence downloads also go through authorized backend routes.
- Sessions are stored in `sessionStorage`. Sign in again when the access token expires; automatic token refresh and session recovery are not included.
- Form records are stored together in a private JSONB document. A version check prevents concurrent updates from overwriting each other.

This small activity schema does not implement the paper's full relational database design. Use the thesis relational model before expanding the project into a full system.

Live Supabase database, storage, and authentication integration have **not been tested in this workspace** because they require configured credentials. The local mode, API business rules, and browser workflows were tested.

## Validation and limits

- **Uploads:** One JPEG, PNG, or PDF per upload, up to 5 MB. The browser checks the MIME type and the server checks the file signature. These checks do not verify authenticity or scan for malware; staff must review the document.
- **Work claims:** Duplicate or overlapping non-rejected claims are rejected. Approval updates are atomic, so a submission cannot receive credit twice.
- **CSV exports:** Fields are quoted and spreadsheet formulas are neutralized.
- **Vaccination dates:** Enter dates supplied by PAWS and the volunteer's record. The app does not infer medical policy from an expiry date.

The activity does not include full dashboards, task claiming, kiosk attendance, public registration, bulk account imports, automatic senior promotion, email delivery, or backups. Event capacity is saved, but joining events is not included. Reports cover saved remote submissions only, not onsite attendance or full-project analytics.

## Documentation

| Resource | Contents |
| --- | --- |
| [Form controls](docs/form-controls.md) | Complete list of controls used in each form |
| [Manual checklist](docs/manual-checklist.md) | Steps for checking the app's behavior |
| [Demo script](docs/demo-script.md) | A roughly three-minute walkthrough for your recording |
| [Screenshots](docs/screenshots/) | Browser captures made with synthetic test data |

The sample evidence files are tiny synthetic PNG fixtures, not medical records or real completed work.

## Submission checklist

1. Upload screenshots, your own **2–4 minute recording**, the actual group repository link, and the generated documentation PDF.
2. Ensure every group member makes genuine contributions and commits.
3. List all group members in the Canvas comments.

No repository link or member contributions are fabricated in this project.
