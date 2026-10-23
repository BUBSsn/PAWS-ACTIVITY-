import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { once } from 'node:events';
import { today } from '../shared/rules.js';

test('API persistence, permissions, evidence, approval, and report workflow', async t => {
  const dir = mkdtempSync(path.join(tmpdir(), 'paws-api-'));
  const server = spawn(process.execPath, ['server/index.js'], { env: { ...process.env, PORT: '43179', NODE_ENV: 'production', STORAGE_MODE: 'local', DATA_DIR: dir }, stdio: ['ignore', 'pipe', 'pipe'] });
  t.after(async () => { if (server.exitCode === null) { server.kill(); await once(server, 'exit'); } rmSync(dir, { recursive: true, force: true }); });
  let output = '';
  await new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error(`Test server did not start: ${output}`)), 10000);
    server.stdout.on('data', b => { output += b; if (output.includes('PAWS activity:')) { clearTimeout(timeout); resolve(); } });
    server.stderr.on('data', b => { output += b; });
    server.once('exit', code => { clearTimeout(timeout); reject(new Error(`Server exited ${code}: ${output}`)); });
  });
  const api = async (url, user = 'staff-ana', method = 'GET', body) => {
    const form = body instanceof FormData;
    return fetch(`http://127.0.0.1:43179/api${url}`, { method, headers: { 'x-demo-user': user, ...(!form && body ? { 'Content-Type': 'application/json' } : {}) }, body: body ? form ? body : JSON.stringify(body) : undefined });
  };
  assert.equal((await api('/state', 'invalid')).status, 401);
  const event = { title: 'Shelter care day', description: 'Support staff with approved shelter activities.', date: today(), start: '09:00', end: '12:00', capacity: 12, vaccination: true, senior: false };
  assert.equal((await api('/events', 'volunteer-maya', 'POST', event)).status, 403);
  assert.equal((await api('/events', 'staff-ana', 'POST', { ...event, capacity: 0 })).status, 422);
  assert.equal((await api('/events', 'staff-ana', 'POST', event)).status, 201);
  assert.equal((await (await api('/state')).json()).events.length, 1);
  const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+a9ioAAAAASUVORK5CYII=', 'base64');
  function form(values, proof = png) {
    const f = new FormData(); Object.entries(values).forEach(([k, v]) => f.append(k, v));
    f.append('evidence', new Blob([proof], { type: 'image/png' }), 'synthetic-demo-proof.png'); return f;
  }
  const profile = { firstName: 'Maya', lastName: 'Santos', email: 'maya@example.com', phone: '09171234567', vaccine: 'Anti-rabies', administered: '2020-01-01', expires: '2021-01-01' };
  assert.equal((await api('/profile', 'volunteer-maya', 'PUT', form(profile, Buffer.from('invalid image')))).status, 422);
  assert.equal((await api('/profile', 'volunteer-maya', 'PUT', form(profile))).status, 200);
  const state = await (await api('/state', 'volunteer-maya')).json();
  assert.equal(state.profile.email, profile.email);
  assert.equal((await api('/evidence/profile/volunteer-maya', 'volunteer-luis')).status, 403);
  const work = { title: 'Adoption campaign design', description: 'Designed a synthetic adoption campaign poster for this classroom demonstration.', category: 'Creative work', date: today(), start: '09:00', end: '11:30', reviewer: 'staff-ana' };
  const created = await api('/submissions', 'volunteer-maya', 'POST', form(work));
  assert.equal(created.status, 201);
  const saved = await created.json();
  assert.equal(saved.duration, 150); assert.equal(saved.credited, 0);
  assert.equal((await api('/submissions', 'volunteer-maya', 'POST', form(work))).status, 409);
  assert.equal((await api(`/submissions/${saved.id}/review`, 'volunteer-maya', 'POST', { decision: 'Approved' })).status, 403);
  const decisions = await Promise.all([api(`/submissions/${saved.id}/review`, 'staff-ana', 'POST', { decision: 'Approved' }), api(`/submissions/${saved.id}/review`, 'staff-ana', 'POST', { decision: 'Approved' })]);
  assert.deepEqual(decisions.map(r => r.status).sort(), [200, 409]);
  const query = new URLSearchParams({ type: 'hours', start: today(), end: today(), volunteer: 'All', category: 'All', mode: 'All', status: 'All', format: 'preview' });
  const report = await (await api(`/reports?${query}`)).json();
  assert.equal(report.totals.credited, 150); assert.equal(report.totals.pending, 0);
  assert.equal((await api(`/reports?${query}`, 'volunteer-maya')).status, 403);
  query.set('format', 'csv');
  assert.match(await (await api(`/reports?${query}`)).text(), /Credited minutes/);
  query.set('format', 'preview'); query.set('volunteer', 'volunteer-luis');
  assert.equal((await (await api(`/reports?${query}`)).json()).rows.length, 0);
  assert.equal((await api('/missing')).status, 404);
});
