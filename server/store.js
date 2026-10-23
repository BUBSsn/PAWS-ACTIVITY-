import fs from 'node:fs';
import path from 'node:path';
import { createClient } from '@supabase/supabase-js';
import { today } from '../shared/rules.js';

export const isCloud = process.env.STORAGE_MODE === 'supabase';
if (process.env.STORAGE_MODE && !['local', 'supabase'].includes(process.env.STORAGE_MODE)) throw new Error('STORAGE_MODE must be local or supabase.');
if (isCloud && (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY || !process.env.SUPABASE_ANON_KEY)) throw new Error('Set all three Supabase variables in .env.');
export const cloud = isCloud ? createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false, autoRefreshToken: false } }) : null;
const root = path.resolve(process.env.DATA_DIR || 'data');
fs.mkdirSync(root, { recursive: true });
const file = path.join(root, 'records.json');
export const demoUsers = [
  { id: 'volunteer-maya', name: 'Maya Santos', role: 'volunteer', senior: false },
  { id: 'volunteer-luis', name: 'Luis Reyes', role: 'volunteer', senior: true },
  { id: 'staff-ana', name: 'Ana Cruz', role: 'staff', senior: false },
];
export function seed() {
  return { events: [], profiles: {}, submissions: [], users: isCloud ? [] : demoUsers };
}
export async function readState() {
  if (!isCloud) {
    if (!fs.existsSync(file)) fs.writeFileSync(file, JSON.stringify(seed(), null, 2), { mode: 0o600 });
    return { state: JSON.parse(fs.readFileSync(file, 'utf8')), version: 0 };
  }
  const { data, error } = await cloud.from('activity_state').select('data,version').eq('id', 1).single();
  if (error) throw new Error('Database unavailable. Check the Supabase migration and connection.');
  const members = await cloud.from('activity_members').select('id,name,role,senior');
  if (members.error) throw new Error('Unable to load authorized members.');
  return { state: { ...data.data, users: members.data }, version: data.version };
}
let tail = Promise.resolve();
export function mutate(fn) {
  const work = tail.then(async () => {
    for (let attempt = 0; attempt < 8; attempt++) {
      const { state, version } = await readState();
      const result = fn(state);
      if (!isCloud) {
        const temp = `${file}.tmp`;
        fs.writeFileSync(temp, JSON.stringify(state, null, 2), { mode: 0o600 });
        fs.renameSync(temp, file);
        return result;
      }
      const { users, ...persisted } = state;
      const { data, error } = await cloud.rpc('activity_compare_and_swap', { expected_version: version, new_data: persisted });
      if (error) throw new Error('Unable to save changes. Please try again.');
      if (data) return result;
    }
    const error = new Error('Another update is in progress. Please try again.'); error.status = 409; throw error;
  });
  tail = work.catch(() => {});
  return work;
}
export async function saveEvidence(file, userId) {
  const id = crypto.randomUUID();
  const bytes = file.buffer;
  let extension;
  if (bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))) extension = 'png';
  else if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) extension = 'jpg';
  else if (bytes.subarray(0, 5).toString() === '%PDF-') extension = 'pdf';
  else { const error = new Error('Upload a real JPEG, PNG, or PDF document.'); error.status = 422; error.fields = { evidence: error.message }; throw error; }
  const key = `${userId}/${id}.${extension}`;
  const mime = { png: 'image/png', jpg: 'image/jpeg', pdf: 'application/pdf' }[extension];
  if (isCloud) {
    const { error } = await cloud.storage.from('activity-evidence').upload(key, bytes, { contentType: mime, upsert: false });
    if (error) throw new Error('Evidence upload failed. Please try again.');
  } else {
    fs.mkdirSync(path.join(root, 'uploads', userId), { recursive: true });
    fs.writeFileSync(path.join(root, 'uploads', key), bytes, { mode: 0o600 });
  }
  return { key, name: file.originalname.slice(0, 200), mime, uploaded: today() };
}
export async function removeEvidence(evidence) {
  if (!evidence) return;
  if (isCloud) await cloud.storage.from('activity-evidence').remove([evidence.key]);
  else fs.rmSync(path.join(root, 'uploads', evidence.key), { force: true });
}
export function evidencePath(evidence) { return path.join(root, 'uploads', evidence.key); }
