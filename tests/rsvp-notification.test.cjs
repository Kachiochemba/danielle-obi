const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');

test('RSVP notification goes to the configured recipient with an escaped summary and dashboard link', async () => {
  const calls = [];
  const exports = {};
  const code = ts.transpileModule(fs.readFileSync(path.join(__dirname, '../src/lib/rsvp-notify.server.ts'), 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  vm.runInNewContext(code, {
    exports, console,
    process: { env: { RESEND_API_KEY: 'test-key', ADMIN_NOTIFY_EMAILS: 'notify@example.test' } },
    require(name) {
      if (name === '@/data/wedding') return { wedding: { couple: { bride: 'Danielle', groom: 'Obi' } } };
      throw new Error(`Unexpected import: ${name}`);
    },
    fetch: async (url, init) => { calls.push({ url, ...init, body: JSON.parse(init.body) }); return { ok: true }; },
  });
  await exports.notifyRsvp({ id: 'test-rsvp', full_name: '<Guest & Friend>', email: 'guest@example.test', attending: false, guest_count: 2, confirmation_code: 'ABCDEFGH' }, 'https://www.danielleandobi.com.ng');
  assert.equal(calls.length, 2);
  const notice = calls.find(call => call.body.to[0] === 'notify@example.test');
  assert.ok(notice);
  assert.match(notice.body.html, /Hey Obi/);
  assert.match(notice.body.html, /&lt;Guest &amp; Friend&gt;/);
  assert.match(notice.body.html, /Attending: No/);
  assert.match(notice.body.html, /Party size: 2/);
  assert.match(notice.body.html, /https:\/\/www\.danielleandobi\.com\.ng\/admin\/rsvps/);
  assert.equal(notice.headers['Idempotency-Key'], 'rsvp-admin-test-rsvp-0');
  assert.ok(calls.find(call => call.body.to[0] === 'guest@example.test'));
});
