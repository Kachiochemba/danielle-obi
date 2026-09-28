const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');

// Exercise the real validators and handlers with a recording database client.
// No requests or deletes are made against a live database.
const code = ts.transpileModule(fs.readFileSync(path.join(__dirname, '../src/lib/admin.functions.ts'), 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText;
const id = '550e4d68-2042-4000-be98-9fd5a6876bbd';

function fixture({ isAdmin = true, error = null, count = 1 } = {}) {
  const calls = [];
  const middleware = {};
  const admin = { from(table) {
    calls.push(['from', table]);
    return { delete(options) {
      calls.push(['delete', options]);
      return Object.fromEntries(['eq', 'lte'].map((method) => [method, async (...args) => {
        calls.push([method, ...args]);
        return { error, count };
      }]));
    } };
  } };
  const exports = {};
  vm.runInNewContext(code, { exports, require(name) {
    if (name === 'zod') return require('zod');
    if (name === '@/integrations/supabase/auth-middleware') return { requireSupabaseAuth: middleware };
    if (name === '@/integrations/supabase/client.server') return { supabaseAdmin: admin };
    if (name === '@tanstack/react-start') return { createServerFn(options) {
      return { options, middleware(list) { this.guards = list; return this; }, inputValidator(fn) { this.validate = fn; return this; }, handler(fn) {
        this.run = (context, data) => fn({ context, data: this.validate ? this.validate(data) : data });
        return this;
      } };
    } };
    throw new Error(`Unexpected import: ${name}`);
  } });
  const context = { userId: id, supabase: { rpc: async () => ({ data: isAdmin }) } };
  return { exports, calls, context, middleware };
}

test('both deletion actions require authentication and POST', () => {
  const f = fixture();
  for (const action of [f.exports.deleteRsvp, f.exports.clearRsvps]) {
    assert.equal(action.options.method, 'POST');
    assert.equal(action.guards[0], f.middleware);
  }
});
test('non-admins cannot reach either database delete', async () => {
  const f = fixture({ isAdmin: false });
  await assert.rejects(f.exports.deleteRsvp.run(f.context, { id }), /Forbidden/);
  await assert.rejects(f.exports.clearRsvps.run(f.context, { confirmation: 'DELETE ALL', before: '2026-01-01T00:00:00.000Z' }), /Forbidden/);
  assert.equal(f.calls.length, 0);
});
test('individual deletion is limited to a validated UUID', async () => {
  const f = fixture();
  assert.throws(() => f.exports.deleteRsvp.run(f.context, { id: '*' }));
  assert.equal(f.calls.length, 0);
  const result = await f.exports.deleteRsvp.run(f.context, { id });
  assert.equal(result.deleted, 1);
  assert.deepEqual(f.calls[2], ['eq', 'id', id]);
});
test('clear-all rejects missing confirmation and future cutoffs', () => {
  const f = fixture();
  assert.throws(() => f.exports.clearRsvps.run(f.context, { confirmation: 'delete', before: '2026-01-01T00:00:00.000Z' }));
  assert.throws(() => f.exports.clearRsvps.run(f.context, { confirmation: 'DELETE ALL', before: '2999-01-01T00:00:00.000Z' }));
  assert.equal(f.calls.length, 0);
});
test('clear-all keeps submissions newer than the confirmed snapshot', async () => {
  const f = fixture({ count: 6 });
  const before = '2026-01-01T00:00:00.000Z';
  const result = await f.exports.clearRsvps.run(f.context, { confirmation: 'DELETE ALL', before });
  assert.equal(result.deleted, 6);
  assert.deepEqual(f.calls[2], ['lte', 'submitted_at', before]);
});
test('database errors cannot be reported as successful deletions', async () => {
  const f = fixture({ error: { message: 'database unavailable' }, count: null });
  await assert.rejects(f.exports.deleteRsvp.run(f.context, { id }), /Could not delete/);
  await assert.rejects(f.exports.clearRsvps.run(f.context, { confirmation: 'DELETE ALL', before: '2026-01-01T00:00:00.000Z' }), /Could not clear/);
});
test('already deleted records report zero removed', async () => {
  const f = fixture({ count: 0 });
  assert.equal((await f.exports.deleteRsvp.run(f.context, { id })).deleted, 0);
});
