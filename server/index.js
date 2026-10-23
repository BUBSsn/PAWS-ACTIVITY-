import 'node:process';
import fs from 'node:fs';
import path from 'node:path';
import express from 'express';
import multer from 'multer';
import { createClient } from '@supabase/supabase-js';

if (fs.existsSync('.env')) process.loadEnvFile('.env');
const { cloud, isCloud, demoUsers, readState, mutate, saveEvidence, removeEvidence, evidencePath } = await import('./store.js');
const { eventSchema, profileSchema, submissionSchema, reportSchema, errorsFor, minutes, assertNoOverlap, filterReports, csvCell } = await import('../shared/rules.js');
const app = express();
app.disable('x-powered-by');
app.use((req, res, next) => {
  res.set('X-Content-Type-Options', 'nosniff');
  res.set('Referrer-Policy', 'same-origin');
  res.set('X-Frame-Options', 'DENY');
  if (req.path.startsWith('/api')) res.set('Cache-Control', 'no-store');
  if (!['GET', 'HEAD'].includes(req.method) && req.headers.origin && req.headers.origin !== `${req.protocol}://${req.get('host')}`) return res.status(403).json({ message: 'Use this application’s own page to submit forms.' });
  next();
});
app.use(express.json({ limit: '64kb' }));
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024, files: 1, fields: 15 } });
function fail(message, status = 422, fields) { const e = new Error(message); e.status = status; e.fields = fields; throw e; }
function parse(schema, values) {
  const result = schema.safeParse(values);
  if (!result.success) fail('Please correct the highlighted fields.', 422, errorsFor(result));
  return result.data;
}
function staff(req) { if (req.user.role !== 'staff') fail('This action is available to authorized staff only.', 403); }
app.get('/api/config', (req, res) => res.json({ mode: isCloud ? 'supabase' : 'local', users: isCloud ? [] : demoUsers }));
const attempts = new Map();
app.post('/api/login', async (req, res) => {
  if (!isCloud) fail('Use the demo identity selector in local mode.', 400);
  const key = req.ip;
  const recent = (attempts.get(key) || []).filter(t => t > Date.now() - 600000);
  if (recent.length >= 10) fail('Too many login attempts. Try again in 10 minutes.', 429);
  recent.push(Date.now()); attempts.set(key, recent);
  if (attempts.size > 1000) for (const [k, times] of attempts) if (times.at(-1) < Date.now() - 600000) attempts.delete(k);
  const client = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY, { auth: { persistSession: false } });
  const { data, error } = await client.auth.signInWithPassword({ email: req.body.email || '', password: req.body.password || '' });
  if (error) fail('Email or password is incorrect.', 401);
  const member = await cloud.from('activity_members').select('id').eq('id', data.user.id).single();
  if (member.error) fail('Your account has not been provisioned for this activity.', 403);
  res.json({ token: data.session.access_token });
});
app.use('/api', async (req, res, next) => {
  if (!isCloud) {
    req.user = demoUsers.find(u => u.id === req.get('x-demo-user'));
  } else {
    const token = req.get('authorization')?.replace(/^Bearer /, '');
    if (!token) fail('Sign in to continue.', 401);
    const { data, error } = await cloud.auth.getUser(token);
    if (error) fail('Your session has expired. Sign in again.', 401);
    const member = await cloud.from('activity_members').select('id,name,role,senior').eq('id', data.user.id).single();
    if (member.error) fail('Your account is not authorized for this activity.', 403);
    req.user = member.data;
  }
  if (!req.user) fail('Choose a demo identity or sign in.', 401);
  next();
});
app.get('/api/state', async (req, res) => {
  const { state } = await readState();
  const profile = state.profiles[req.user.id] || {};
  const submissions = state.submissions.filter(s => s.userId === req.user.id || (req.user.role === 'staff' && s.reviewer === req.user.id));
  res.json({ user: req.user, profile, events: state.events, submissions, staff: state.users.filter(u => u.role === 'staff').map(({ id, name }) => ({ id, name })), volunteers: req.user.role === 'staff' ? state.users.filter(u => u.role === 'volunteer').map(({ id, name }) => ({ id, name })) : [] });
});
app.post('/api/events', async (req, res) => {
  staff(req);
  const value = parse(eventSchema, req.body);
  const record = { ...value, id: crypto.randomUUID(), createdBy: req.user.id, createdAt: new Date().toISOString() };
  await mutate(s => { s.events.unshift(record); });
  res.status(201).json(record);
});
app.put('/api/profile', upload.single('evidence'), async (req, res) => {
  if (req.user.role !== 'volunteer') fail('Switch to a volunteer account to update a volunteer profile.', 403);
  const value = parse(profileSchema, req.body);
  let evidence;
  try {
    if (req.file) evidence = await saveEvidence(req.file, req.user.id);
    const record = await mutate(s => {
      const old = s.profiles[req.user.id] || {};
      if (!evidence && !old.evidence) fail('Upload vaccination evidence.', 422, { evidence: 'Upload a JPEG, PNG, or PDF, up to 5 MB.' });
      if (Object.entries(s.profiles).some(([id, p]) => id !== req.user.id && p.email.toLowerCase() === value.email.toLowerCase())) fail('This email is already used by another profile.', 409, { email: 'Use your own unique email address.' });
      s.profiles[req.user.id] = { ...value, evidence: evidence || old.evidence, updatedAt: new Date().toISOString() };
      return s.profiles[req.user.id];
    });
    res.json(record);
  } catch (error) { await removeEvidence(evidence); throw error; }
});
app.post('/api/submissions', upload.single('evidence'), async (req, res) => {
  if (req.user.role !== 'volunteer') fail('Only volunteers can submit remote work.', 403);
  const value = parse(submissionSchema, req.body);
  if (!req.file) fail('Upload proof of completed work.', 422, { evidence: 'Upload a JPEG, PNG, or PDF, up to 5 MB.' });
  const { state } = await readState();
  if (!state.users.some(u => u.id === value.reviewer && u.role === 'staff')) fail('Select an authorized assigning staff member.', 422, { reviewer: 'Choose a staff member from the list.' });
  assertNoOverlap(state.submissions, req.user.id, value);
  const evidence = await saveEvidence(req.file, req.user.id);
  try {
    const record = { ...value, evidence, id: crypto.randomUUID(), userId: req.user.id, volunteerName: req.user.name, mode: 'Offsite', duration: minutes(value.start, value.end), status: 'Pending', credited: 0, submittedAt: new Date().toISOString() };
    await mutate(s => { assertNoOverlap(s.submissions, req.user.id, value); s.submissions.unshift(record); });
    res.status(201).json(record);
  } catch (error) { await removeEvidence(evidence); throw error; }
});
app.post('/api/submissions/:id/review', async (req, res) => {
  staff(req);
  const { decision, reason } = req.body;
  if (!['Approved', 'Rejected'].includes(decision)) fail('Choose Approve or Reject.');
  if (decision === 'Rejected' && (typeof reason !== 'string' || reason.trim().length < 5 || reason.length > 500)) fail('Explain the rejection in 5–500 characters.');
  const record = await mutate(s => {
    const entry = s.submissions.find(v => v.id === req.params.id);
    if (!entry) fail('Submission not found.', 404);
    if (entry.reviewer !== req.user.id || entry.userId === req.user.id) fail('Only the assigned staff member can review this submission.', 403);
    if (entry.status !== 'Pending') fail('This submission has already been reviewed.', 409);
    Object.assign(entry, { status: decision, reason: decision === 'Rejected' ? reason.trim() : '', credited: decision === 'Approved' ? entry.duration : 0, reviewedBy: req.user.id, reviewedAt: new Date().toISOString() });
    return entry;
  });
  res.json(record);
});
app.get('/api/evidence/:kind/:id', async (req, res) => {
  const { state } = await readState();
  let evidence;
  if (req.params.kind === 'profile') {
    if (req.params.id !== req.user.id) fail('You can only view your own vaccination evidence.', 403);
    evidence = state.profiles[req.user.id]?.evidence;
  } else if (req.params.kind === 'submission') {
    const record = state.submissions.find(s => s.id === req.params.id);
    if (!record || (record.userId !== req.user.id && record.reviewer !== req.user.id)) fail('Evidence not available to this account.', 403);
    evidence = record.evidence;
  }
  if (!evidence) fail('Evidence not found.', 404);
  res.set('Content-Disposition', 'attachment; filename="evidence.' + evidence.key.split('.').at(-1) + '"');
  res.type(evidence.mime);
  if (isCloud) {
    const { data, error } = await cloud.storage.from('activity-evidence').download(evidence.key);
    if (error) fail('Evidence could not be downloaded.', 404);
    return res.send(Buffer.from(await data.arrayBuffer()));
  }
  res.sendFile(evidencePath(evidence));
});
app.get('/api/reports', async (req, res) => {
  staff(req);
  const filters = parse(reportSchema, req.query);
  const { state } = await readState();
  if (filters.volunteer !== 'All' && !state.users.some(u => u.id === filters.volunteer && u.role === 'volunteer')) fail('Choose a valid volunteer.', 422, { volunteer: 'Choose a volunteer from the list.' });
  const rows = filterReports(state.submissions, filters);
  const totals = { count: rows.length, credited: rows.reduce((n, s) => n + s.credited, 0), pending: rows.filter(s => s.status === 'Pending').reduce((n, s) => n + s.duration, 0) };
  if (filters.format === 'csv') {
    const columns = filters.type === 'hours' ? ['Volunteer', 'Work date', 'Activity', 'Status', 'Duration minutes', 'Credited minutes'] : ['Volunteer', 'Work date', 'Activity', 'Category', 'Start', 'End', 'Status', 'Description', 'Review remarks'];
    const values = rows.map(s => filters.type === 'hours' ? [s.volunteerName, s.date, s.title, s.status, s.duration, s.credited] : [s.volunteerName, s.date, s.title, s.category, s.start, s.end, s.status, s.description, s.reason || '']);
    res.type('text/csv').attachment(`paws-${filters.type}-report.csv`).send('\uFEFF' + [columns, ...values].map(r => r.map(csvCell).join(',')).join('\r\n'));
  } else res.json({ rows, totals, type: filters.type });
});
app.use('/api', (req, res) => res.status(404).json({ message: 'This activity endpoint does not exist.' }));
if (process.env.NODE_ENV === 'production') {
  app.use(express.static('dist'));
  app.get('/{*path}', (req, res) => res.sendFile(path.resolve('dist/index.html')));
} else {
  const { createServer } = await import('vite');
  const vite = await createServer({ server: { middlewareMode: true }, appType: 'spa' });
  app.use(vite.middlewares);
}
app.use((error, req, res, next) => {
  if (res.headersSent) return next(error);
  if (error instanceof multer.MulterError) return res.status(422).json({ message: 'Upload one file no larger than 5 MB.', fields: { evidence: 'Choose one JPEG, PNG, or PDF up to 5 MB.' } });
  if (!error.status) console.error(error);
  res.status(error.status || 500).json({ message: error.status ? error.message : 'The request could not be completed. Please try again.', fields: error.fields || {} });
});
const port = Number(process.env.PORT || 3000);
app.listen(port, '127.0.0.1', () => console.log(`PAWS activity: http://localhost:${port} (${isCloud ? 'Supabase' : 'local demo'})`));
