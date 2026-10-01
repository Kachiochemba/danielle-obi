const test = require("node:test"),
  assert = require("node:assert/strict"),
  fs = require("node:fs"),
  vm = require("node:vm"),
  ts = require("typescript");
const code = ts.transpileModule(fs.readFileSync("src/lib/admin.functions.ts", "utf8"), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText;
function fixture(role = "usher", error = null) {
  const calls = [],
    exports = {};
  const guest = { confirmation_code: "ABCD1234", attending: true, checked_in: true };
  const admin = {
    from(table) {
      calls.push(["from", table]);
      const q = {};
      for (const m of ["select", "eq", "update"])
        q[m] = (...args) => {
          calls.push([m, ...args]);
          return q;
        };
      q.maybeSingle = async () => ({ data: guest, error });
      q.then = (ok, bad) => Promise.resolve({ count: 1201, error }).then(ok, bad);
      return q;
    },
  };
  vm.runInNewContext(code, {
    exports,
    require(name) {
      if (name === "zod") return require("zod");
      if (name.endsWith("auth-middleware")) return { requireSupabaseAuth: {} };
      if (name.endsWith("client.server")) return { supabaseAdmin: admin };
      if (name === "@tanstack/react-start")
        return {
          createServerFn() {
            return {
              middleware() {
                return this;
              },
              inputValidator(fn) {
                this.validate = fn;
                return this;
              },
              handler(fn) {
                return ({ context, data }) =>
                  fn({ context, data: this.validate ? this.validate(data) : data });
              },
            };
          },
        };
      throw Error(name);
    },
  });
  const context = {
    userId: "283f7db8-9b3f-42c4-803f-1856e8c00f5e",
    supabase: { rpc: async (_, { _role }) => ({ data: _role === role }) },
  };
  return { exports, calls, context };
}
test("usher can see counts above the row limit, look up and check in", async () => {
  const f = fixture();
  assert.equal((await f.exports.getCheckinTally({ context: f.context })).attending, 1201);
  await f.exports.lookupRsvp({ context: f.context, data: { code: "ABCD1234" } });
  await f.exports.checkInRsvp({ context: f.context, data: { code: "ABCD1234" } });
  assert.ok(f.calls.some((c) => c[0] === "eq" && c[1] === "attending" && c[2] === true));
  assert.ok(f.calls.some((c) => c[0] === "eq" && c[1] === "checked_in" && c[2] === false));
  assert.deepEqual(Object.keys(f.calls.find((c) => c[0] === "update")[1]).sort(), [
    "checked_in",
    "checked_in_at",
  ]);
});
test("usher cannot list, delete, or clear guests", async () => {
  const f = fixture();
  for (const [name, data] of [
    ["listRsvps"],
    ["deleteRsvp", { id: f.context.userId }],
    ["clearRsvps", { confirmation: "DELETE ALL", before: "2026-01-01T00:00:00.000Z" }],
  ])
    await assert.rejects(f.exports[name]({ context: f.context, data }), /Forbidden/);
  assert.equal(f.calls.length, 0);
});
test("regular accounts have no check-in access", async () => {
  const f = fixture("user");
  for (const name of ["getCheckinTally", "lookupRsvp", "checkInRsvp"])
    await assert.rejects(
      f.exports[name]({ context: f.context, data: { code: "ABCD1234" } }),
      /Forbidden/,
    );
  assert.equal(f.calls.length, 0);
});
test("admins retain check-in access", async () => {
  const f = fixture("admin");
  assert.equal((await f.exports.checkIsAdmin({ context: f.context })).admin, true);
  await f.exports.lookupRsvp({ context: f.context, data: { code: "ABCD1234" } });
});
test("database failures do not report a successful check-in", async () => {
  const f = fixture("usher", { message: "unavailable" });
  await assert.rejects(
    f.exports.checkInRsvp({ context: f.context, data: { code: "ABCD1234" } }),
    /Could not check in/,
  );
  await assert.rejects(f.exports.getCheckinTally({ context: f.context }), /Could not load/);
});
