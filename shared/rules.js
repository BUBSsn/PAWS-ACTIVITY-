import { z } from 'zod';

export const categories = ['Social media', 'Office / administration', 'Humane education', 'Outreach', 'Creative work'];
export const today = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Manila', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
const text = (min, max) => z.string().trim().min(min, `Enter at least ${min} characters.`).max(max, `Use ${max} characters or fewer.`);
const date = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Choose a valid date.').refine(v => !Number.isNaN(Date.parse(v)) && new Date(v).toISOString().slice(0, 10) === v, 'Choose a real calendar date.');
const time = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Choose a valid time.');
const check = z.preprocess(v => v === true || v === 'true' || v === 'on', z.boolean());
export const eventSchema = z.object({
  title: text(3, 100), description: text(10, 2000), date: date.refine(v => v >= today(), 'Choose today or a future date.'),
  start: time, end: time, capacity: z.coerce.number().int('Enter a whole number.').min(1, 'At least one volunteer is required.').max(500, 'Maximum capacity is 500.'), vaccination: check, senior: check,
}).refine(v => v.end > v.start, { path: ['end'], message: 'End time must be after start time.' });
export const profileSchema = z.object({
  firstName: text(1, 60), lastName: text(1, 60), email: z.email('Enter a valid email address.').max(254),
  phone: z.string().trim().regex(/^(09\d{9}|\+639\d{9})$/, 'Use 09 followed by 9 digits, or +639 followed by 9 digits.'),
  vaccine: text(2, 100), administered: date.refine(v => v <= today(), 'Administration date cannot be in the future.'), expires: date,
}).refine(v => v.expires > v.administered, { path: ['expires'], message: 'Expiry must be after the administration date.' });
export const submissionSchema = z.object({
  title: text(3, 100), category: z.enum(categories, { error: 'Choose an activity category.' }), date: date.refine(v => v <= today(), 'Work date cannot be in the future.'),
  start: time, end: time, reviewer: text(1, 100), description: text(20, 2000),
}).refine(v => v.end > v.start, { path: ['end'], message: 'End time must be after start time on the same day.' });
export const reportSchema = z.object({
  type: z.enum(['hours', 'submissions']), start: date, end: date, volunteer: z.string().min(1),
  category: z.enum(['All', ...categories]), mode: z.enum(['All', 'Offsite']), status: z.enum(['All', 'Pending', 'Approved', 'Rejected']), format: z.enum(['preview', 'csv']),
}).refine(v => v.end >= v.start, { path: ['end'], message: 'End date must be on or after start date.' });
export const minutes = (start, end) => {
  const parse = s => Number(s.slice(0, 2)) * 60 + Number(s.slice(3));
  return parse(end) - parse(start);
};
export const vaccinationStatus = p => !p?.expires ? 'Not submitted' : p.expires < today() ? 'Expired' : 'Current';
export const hours = m => `${Math.floor(m / 60)}h ${m % 60}m`;
export function errorsFor(result) {
  return result.success ? {} : Object.fromEntries(result.error.issues.map(e => [e.path[0] || 'form', e.message]));
}
export function assertNoOverlap(records, userId, v) {
  if (records.some(s => s.userId === userId && s.date === v.date && s.status !== 'Rejected' && v.start < s.end && v.end > s.start)) {
    const error = new Error('This work period overlaps an existing submission. Check your saved records.');
    error.status = 409; error.fields = { start: error.message }; throw error;
  }
}
export const csvCell = value => {
  let s = String(value ?? '');
  if (/^[\s]*[=+\-@\t\r\n]/.test(s)) s = `'${s}`;
  return `"${s.replaceAll('"', '""')}"`;
};
export function filterReports(records, f) {
  return records.filter(s => s.date >= f.start && s.date <= f.end && (f.volunteer === 'All' || s.userId === f.volunteer) && (f.category === 'All' || s.category === f.category) && (f.status === 'All' || s.status === f.status));
}
