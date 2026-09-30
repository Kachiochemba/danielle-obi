const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");
const ts = require("typescript");
const path = require("node:path");
function load(file, imports, extra = {}) {
  const exports = {};
  const code = ts.transpileModule(
    fs.readFileSync(path.join(__dirname, "../src/lib", file), "utf8"),
    { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } },
  ).outputText;
  vm.runInNewContext(code, {
    exports,
    require: (n) => {
      if (n in imports) return imports[n];
      throw Error(n);
    },
    console,
    ...extra,
  });
  return exports;
}
const shared = load("gifts.shared.ts", { zod: require("zod") });
const base = {
  requestId: "00000000-0000-4000-8000-000000000001",
  fullName: "Test Guest",
  email: "test@example.com",
};
test("gift forms reject negative amounts, empty selections, duplicates and invalid identity", () => {
  for (const payload of [
    { ...base, kind: "money", amount: -1 },
    { ...base, kind: "money", amount: 0 },
    { ...base, kind: "money", amount: 1.001 },
    { ...base, kind: "items", items: [] },
    { ...base, kind: "items", items: ["ac", "ac"] },
    { ...base, email: "bad", kind: "items", items: ["ac"] },
  ])
    assert.equal(shared.giftSubmissionSchema.safeParse(payload).success, false);
  assert.equal(
    shared.giftSubmissionSchema.safeParse({ ...base, kind: "money", amount: 12345.67 }).success,
    true,
  );
  assert.equal(
    shared.giftSubmissionSchema.safeParse({ ...base, kind: "items", items: ["ac", "juicer"] })
      .success,
    true,
  );
});
function actions() {
  const calls = [];
  const middleware = {};
  const db = {
    from() {
      calls.push("db");
      throw Error("Must not read private data");
    },
  };
  const api = load("gifts.functions.ts", {
    "./gifts.shared": shared,
    zod: require("zod"),
    "@/data/gift-catalog.json": [],
    "./gifts.server": { giftDb: db },
    "@/integrations/supabase/auth-middleware": { requireSupabaseAuth: middleware },
    "@tanstack/react-start": {
      createServerFn(options) {
        return {
          options,
          middleware(x) {
            this.guards = x;
            return this;
          },
          inputValidator(x) {
            this.validate = x;
            return this;
          },
          handler(fn) {
            this.run = (context, data) =>
              fn({ context, data: this.validate ? this.validate(data) : data });
            return this;
          },
        };
      },
    },
  });
  return { api, calls, middleware };
}
test("private history and notification retry reject non-admin users", async () => {
  const { api, calls, middleware } = actions();
  const context = { userId: "test", supabase: { rpc: async () => ({ data: false }) } };
  for (const fn of [api.listGiftHistory, api.retryGiftNotification]) {
    assert.equal(fn.guards[0], middleware);
    await assert.rejects(fn.run(context, { id: base.requestId }), /Forbidden/);
  }
  assert.equal(calls.length, 0);
});
test("gift email goes only to Obi, escapes guest text, and identifies pledges honestly", async () => {
  const sent = [];
  let updated = false;
  const api = load(
    "gifts.server.ts",
    {
      "./gifts.shared": shared,
      "@/integrations/supabase/client.server": {
        supabaseAdmin: {
          from: () => ({
            update: () => ({
              eq: async () => {
                updated = true;
                return { error: null };
              },
            }),
          }),
        },
      },
    },
    {
      process: { env: { RESEND_API_KEY: "test-only" } },
      fetch: async (url, req) => {
        sent.push(JSON.parse(req.body));
        return { ok: true };
      },
    },
  );
  const row = {
    id: base.requestId,
    full_name: "<script>guest</script>",
    email: "guest@example.com",
    kind: "money",
    amount: 10000,
    items: [],
    notification_sent_at: null,
  };
  assert.equal(await api.notifyGift(row), true);
  assert.deepEqual(sent[0].to, ["obialoochemba@gmail.com"]);
  assert.match(sent[0].html, /pledged/);
  assert.match(sent[0].html, /not confirmation/);
  assert.match(sent[0].html, /&lt;script&gt;/);
  assert.ok(!sent[0].html.includes("<script>"));
  assert.equal(updated, true);
  await api.notifyGift({ ...row, notification_sent_at: "2026-09-30" });
  assert.equal(sent.length, 1);
});
test("email failure keeps the gift notification pending", async () => {
  const api = load(
    "gifts.server.ts",
    {
      "./gifts.shared": shared,
      "@/integrations/supabase/client.server": {
        supabaseAdmin: {
          from: () => {
            throw Error("Must not mark sent");
          },
        },
      },
    },
    {
      process: { env: { RESEND_API_KEY: "test-only" } },
      fetch: async () => ({ ok: false, status: 503 }),
    },
  );
  assert.equal(
    await api.notifyGift({
      id: base.requestId,
      full_name: "Test",
      email: "test@example.com",
      kind: "items",
      items: [{ id: "ac", name: "Air conditioner" }],
      notification_sent_at: null,
    }),
    false,
  );
});
