# PAWS form-controls activity

## Approved scope

Build only the four forms selected from the project paper: Create Event, Volunteer Profile and Vaccination Update, Remote Work Submission, and Report Filters and Generation. Include the result views necessary to demonstrate data handling and a small staff review panel for remote submissions. Exclude full dashboards, public registration, shared task assignment, kiosk attendance, imports, and backup management.

## Architecture and delivery

Use React for the interface and a Node.js REST backend. Supply a Supabase PostgreSQL schema and environment configuration for database persistence and private evidence storage. Include an explicitly labeled local demonstration mode with disk persistence so the activity can run without external account credentials. Local mode is a classroom demonstration, not production authentication. Do not describe demo role selection as secure access control. Supabase mode must verify authenticated users and enforce staff permissions on the server. Keep service credentials out of browser code and version control.

The interface has four navigation tabs, a consistent form layout, inline errors, and a result area. Match the PAWS website color scheme as requested by the user: vivid green #00CB00 for brand accents, white #FFFFFF for form surfaces, warm backgrounds #FAF4EC and #FFF9F1, and charcoal #1E1E1E for text. These values were observed in the public homepage styles at https://paws.org.ph/ on 2026-10-23; they are not asserted to be an official brand manual. Use charcoal text on bright green buttons for contrast and a darker green for small text on white. Maintain readable typography, responsive layouts, visible keyboard focus, and text labels for every control. Do not imply official PAWS endorsement.

## Forms and controls

Each form contains ten meaningful controls, counting its two action buttons. Hidden identifiers do not count toward this total.

### Major: Create Event

Controls: title, description, event date, start time, end time, maximum volunteers, vaccination required checkbox, senior volunteers only checkbox, Create event button, and Clear form button.

Require a trimmed title of 3–100 characters, description of 10–2000 characters, a valid date no earlier than the current Manila date, an end time later than the start time, and an integer capacity of 1–500. Reject invalid requests in both layers. Save valid events and display them on an event list. Capacity limits are activity defaults, not claims about PAWS policy. Creator identity and timestamps come from the server.

### Major: Volunteer Profile and Vaccination Update

Controls: first name, last name, email, contact number, vaccination name, administered date, expiry date, vaccination evidence file, Save profile button, and Reset changes button.

Require names, valid email, a Philippine mobile number in 09 or +639 format, vaccination name, administered date no later than today, expiry later than administration, and evidence for a new vaccination record. Permit saving an expired record, clearly mark it expired, and make it ineligible for vaccination-restricted events. When editing, retain existing evidence unless replaced. Validate file content, size, and type; accept JPEG, PNG, and PDF up to 5 MB. Show saved contact details, vaccination status, and event eligibility. Volunteer identity is fixed by the session; experience level and role are read-only server data.

### Supporting: Remote Work Submission

Controls: activity title, activity category, work date, start time, end time, assigning staff selector, work description, proof file, and Submit for approval and Clear form buttons.

Require all fields, a date no later than today, end after start on the same day, a description of 20–2000 characters, a recognized category and staff account, and JPEG/PNG/PDF evidence up to 5 MB. Compute duration on the server. Prevent duplicate and overlapping submissions for the same volunteer. Save with Pending status and zero credited minutes. Display submissions and calculated duration. A staff review panel approves or rejects pending entries; rejection requires a reason. Only the designated staff reviewer can decide in authenticated mode. Pending entries can transition once; only approved minutes count in totals. Demo identities are fictional and explicitly labeled.

### Supporting: Report Filters and Generation

Controls: report type, start date, end date, volunteer scope, activity category, work mode, approval status, output format, Generate report button, and Reset filters button.

Support hours and submission reports using actual saved activity records. Require a valid inclusive date range, start no later than end, and valid enumerated filters. Volunteer choices come from saved records. Support All where meaningful. Work mode offers All or Offsite because this activity does not implement onsite logging. Output choices are on-screen preview and CSV download. Show pending durations separately from credited hours; only approved records contribute to credited totals. Show an explicit empty state for no matches. Escape CSV values to prevent spreadsheet formula interpretation. Report access is staff-only in authenticated mode.

## Error handling and accessibility

Use native semantic controls and natural DOM tab order. Associate helper and error text with inputs, provide an error summary, focus the first invalid field, preserve entered values after failures, announce save results, and prevent duplicate submissions while saving. Resetting an edited profile restores the saved values. Report filter reset restores initial filters. Network failures must show actionable feedback and must not claim a save succeeded.

## Verification

Check invalid and successful submission for each form, reload persistence, expired vaccination eligibility, file rejection, duration calculations, overlapping remote entries, approval transitions, credited totals, report filters, CSV escaping, keyboard navigation, and mobile layouts. Test staff permissions in configured Supabase mode; clearly document any integration checks unavailable without credentials. Provide synthetic seed data only.

## Activity handoff

Include setup instructions, a controls and validation matrix, manual test checklist, and a 2–4 minute demo script. Screenshot evidence must come from the running application. Do not fabricate member commits, a repository URL, a demo recording, or completed external integration checks. The user supplies actual group-member contributions and uploads the submission.
