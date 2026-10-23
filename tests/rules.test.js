import { test } from 'node:test';
import assert from 'node:assert/strict';
import { eventSchema, profileSchema, submissionSchema, reportSchema, minutes, assertNoOverlap, filterReports, csvCell, vaccinationStatus, today } from '../shared/rules.js';
const event = { title: 'Shelter day', description: 'Help clean the shelter.', date: today(), start: '09:00', end: '12:00', capacity: 10, vaccination: false, senior: false };
test('event rejects invalid capacity and reversed times', () => {
  assert.ok(eventSchema.safeParse(event).success);
  for (const capacity of [0, 1.5, 501, '']) assert.equal(eventSchema.safeParse({ ...event, capacity }).success, false);
  assert.equal(eventSchema.safeParse({ ...event, end: '08:00' }).success, false);
  assert.equal(eventSchema.safeParse({ ...event, date: '2026-02-30' }).success, false);
});
test('expired vaccinations can be saved but do not qualify', () => {
  const profile = { firstName: 'Maya', lastName: 'Santos', email: 'maya@example.com', phone: '09171234567', vaccine: 'Anti-rabies', administered: '2020-01-01', expires: '2021-01-01' };
  assert.ok(profileSchema.safeParse(profile).success);
  assert.equal(vaccinationStatus(profile), 'Expired');
  assert.equal(profileSchema.safeParse({ ...profile, expires: '2019-01-01' }).success, false);
  assert.equal(profileSchema.safeParse({ ...profile, phone: '123' }).success, false);
});
test('remote work rejects invalid periods and duplicate or overlapping claims', () => {
  const s = { title: 'Poster design', description: 'Created a poster for the adoption campaign.', category: 'Creative work', reviewer: 'staff-ana', date: today(), start: '09:00', end: '11:30' };
  assert.ok(submissionSchema.safeParse(s).success);
  assert.equal(minutes(s.start, s.end), 150);
  assert.equal(submissionSchema.safeParse({ ...s, end: s.start }).success, false);
  const saved = [{ ...s, userId: 'v', status: 'Pending' }];
  assert.throws(() => assertNoOverlap(saved, 'v', { ...s, start: '11:00', end: '12:00' }), /overlaps/);
  assert.doesNotThrow(() => assertNoOverlap(saved, 'v', { ...s, start: '11:30', end: '12:00' }));
  assert.doesNotThrow(() => assertNoOverlap(saved, 'other', s));
});
test('reports enforce valid dates and filter saved records', () => {
  const f = { type: 'hours', start: '2026-01-01', end: '2026-12-31', volunteer: 'All', category: 'All', mode: 'All', status: 'Approved', format: 'preview' };
  assert.ok(reportSchema.safeParse(f).success);
  assert.equal(reportSchema.safeParse({ ...f, end: '2025-01-01' }).success, false);
  const rows = [{ date: '2026-06-01', status: 'Pending', userId: 'v' }, { date: '2026-06-01', status: 'Approved', userId: 'v' }];
  assert.equal(filterReports(rows, f).length, 1);
  assert.equal(filterReports(rows, { ...f, volunteer: 'another' }).length, 0);
});
test('CSV escapes quotes and neutralizes formulas, including leading whitespace', () => {
  assert.equal(csvCell('a"b'), '"a""b"');
  assert.equal(csvCell('=SUM(1,2)'), '"\'=SUM(1,2)"');
  assert.equal(csvCell('  +2'), '"\'  +2"');
});
