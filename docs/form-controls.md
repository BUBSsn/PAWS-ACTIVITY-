# Form purpose, controls and validation

Each row below is one of the ten controls in that form. A toggle is one checkbox control. Hidden fields and the demo identity selector are not counted. Shared server/client rules are in `shared/rules.js`; file and authorization checks also run on the backend.

## Major 1: Create Event

Purpose: authorized staff create an activity that appears on the event board.

| # | Control | Type | Rule / behavior |
| --- | --- | --- | --- |
| 1 | Event title | Text | Required, 3-100 trimmed characters |
| 2 | Description | Textarea | Required, 10-2,000 trimmed characters |
| 3 | Event date | Date | Required, real date, today or later in Manila |
| 4 | Volunteer capacity | Number | Required integer, 1-500 |
| 5 | Start time | Time | Required valid 24-hour time |
| 6 | End time | Time | Required, after start on the same day |
| 7 | Current vaccination required | Checkbox / toggle | Optional restriction; default off |
| 8 | Senior volunteers only | Checkbox / toggle | Optional restriction; default off |
| 9 | Clear form | Button | Restore blank inputs and default toggles |
| 10 | Create event | Submit button | Validate, save, display; disabled while saving |

Creator ID and timestamps come from the server. Capacity limit is a classroom default, not a stated PAWS policy. Volunteer views show whether saved vaccination and senior status meet the requirements. Vaccination must remain valid on the event date. Event joining and capacity reservations are outside this form activity.

## Major 2: Volunteer Profile and Vaccination Update

Purpose: volunteers update contact details and vaccination qualifications for their own account.

| # | Control | Type | Rule / behavior |
| --- | --- | --- | --- |
| 1 | First name | Text | Required, 1-60 trimmed characters |
| 2 | Last name | Text | Required, 1-60 trimmed characters |
| 3 | Email address | Email | Required valid format, up to 254 characters, unique across saved profiles |
| 4 | Mobile number | Telephone | Required Philippine mobile: 09 + 9 digits or +639 + 9 digits |
| 5 | Vaccination name | Text | Required, 2-100 trimmed characters |
| 6 | Date administered | Date | Required real date, not after today |
| 7 | Expiry date | Date | Required, after administration; expired records can be saved |
| 8 | Vaccination evidence | File | Required on first save; optional replacement on edit; JPEG/PNG/PDF, <=5 MB |
| 9 | Reset changes | Button | Restore the last saved profile and clear replacement file |
| 10 | Save profile | Submit button | Validate, persist and update the saved summary |

Expired vaccination is shown explicitly and blocks qualification for vaccination-restricted events. The authenticated account controls identity. Role and senior status are not editable. Existing evidence stays attached unless replaced. Only the volunteer can download their vaccination evidence in this activity.

## Supporting 1: Remote Work Submission

Purpose: a volunteer records completed offsite work for the assigning staff member to review.

| # | Control | Type | Rule / behavior |
| --- | --- | --- | --- |
| 1 | Activity title | Text | Required, 3-100 trimmed characters |
| 2 | Activity category | Select | Required recognized category |
| 3 | Assigning staff member | Select | Required existing staff account |
| 4 | Work date | Interactive Calendar / Date | Required real date, not in the future; interactive calendar widget with quick presets (Today, Yesterday, 2 days ago), month navigation, existing submission status markers, and accessible direct date input |
| 5 | Start time | Time | Required valid time |
| 6 | End time | Time | Required, after start on the same day |
| 7 | Work completed | Textarea | Required, 20-2,000 trimmed characters |
| 8 | Supporting document | File | Required JPEG/PNG/PDF, <=5 MB |
| 9 | Clear form | Button | Clear inputs and selected file |
| 10 | Submit for approval | Submit button | Validate, save as Pending, calculate duration on server |

No client-supplied credited hours, user IDs, or status values are accepted. Reject overlapping time periods for the same volunteer/date unless the earlier record was rejected. Pending or rejected time contributes zero credited minutes. Only the assigned staff reviewer may approve or reject; rejection requires a 5-500-character explanation. Reviewed entries cannot be reviewed again. A volunteer cannot approve their own submission.

## Supporting 2: Report Filters and Generation

Purpose: staff retrieve saved remote activity records and export a useful report.

| # | Control | Type | Rule / behavior |
| --- | --- | --- | --- |
| 1 | Report type | Select | Hours log or remote work submissions; changes preview/export columns |
| 2 | Volunteer scope | Select | All or an existing volunteer |
| 3 | Start date | Date | Required real date |
| 4 | End date | Date | Required, on/after start |
| 5 | Activity category | Select | All or a recognized category |
| 6 | Work mode | Select | All available modes or Offsite; only offsite records exist in this activity |
| 7 | Approval status | Select | All, Pending, Approved, Rejected |
| 8 | Output format | Select | Preview or Preview + CSV download |
| 9 | Reset filters | Button | Restore default filters and clear the preview |
| 10 | Generate report | Submit button | Validate range, retrieve matching records, show preview/download |

Date bounds are inclusive. No matching records produces an explicit empty state rather than invented data. Totals distinguish credited time and pending durations. Preview is cleared when filters change. CSV values are escaped and formula-prefixed cells are neutralized. Report access is staff-only.
