import test from "node:test";
import assert from "node:assert/strict";
import {
  MAX_RECENT_RUNS, RECENT_RUNS_KEY, loadRecentRuns, rememberRun, reportFileName
} from "../src/features/report/report.ts";

function memoryStorage(initial: Record<string, string> = {}) {
  const data = new Map(Object.entries(initial));
  return {
    data,
    getItem: (key: string) => data.has(key) ? data.get(key)! : null,
    setItem: (key: string, value: string) => { data.set(key, value); }
  };
}

test("reportFileName produce un nombre seguro y estable", () => {
  assert.equal(reportFileName("synthetic:run-1"), "flamelab-report-synthetic-run-1.md");
  assert.equal(reportFileName("research:2026-11-14T10:00:00Z"), "flamelab-report-research-2026-11-14T10-00-00Z.md");
  assert.equal(reportFileName("../../etc/passwd"), "flamelab-report-etc-passwd.md");
  assert.equal(reportFileName("a/b\\c <d>|e?*\"f"), "flamelab-report-a-b-c-d-e-f.md");
  assert.equal(reportFileName(""), "flamelab-report-research.md");
  assert.equal(reportFileName(":::"), "flamelab-report-research.md");
  const long = reportFileName("x".repeat(500));
  assert.ok(long.length <= "flamelab-report-.md".length + 120);
  assert.match(reportFileName("run:ñandú-1"), /^flamelab-report-[A-Za-z0-9._-]+\.md$/);
});

test("rememberRun deja el más reciente primero, sin duplicados", () => {
  const storage = memoryStorage();
  rememberRun("synthetic:run-1", storage);
  rememberRun("synthetic:run-2", storage);
  const list = rememberRun("synthetic:run-1", storage);
  assert.deepEqual(list, ["synthetic:run-1", "synthetic:run-2"]);
  assert.deepEqual(loadRecentRuns(storage), list);
  assert.deepEqual(JSON.parse(storage.data.get(RECENT_RUNS_KEY)!), list);
});

test("rememberRun conserva como máximo 10", () => {
  const storage = memoryStorage();
  for (let i = 0; i < 15; i += 1) rememberRun(`run-${i}`, storage);
  const list = loadRecentRuns(storage);
  assert.equal(list.length, MAX_RECENT_RUNS);
  assert.equal(list[0], "run-14");
  assert.equal(list.at(-1), "run-5");
});

test("rememberRun ignora ids vacíos y recorta espacios", () => {
  const storage = memoryStorage();
  assert.deepEqual(rememberRun("   ", storage), []);
  assert.deepEqual(rememberRun("  run-a  ", storage), ["run-a"]);
});

test("loadRecentRuns tolera contenido corrupto o ajeno", () => {
  assert.deepEqual(loadRecentRuns(memoryStorage({ [RECENT_RUNS_KEY]: "{not json" })), []);
  assert.deepEqual(loadRecentRuns(memoryStorage({ [RECENT_RUNS_KEY]: "{\"a\":1}" })), []);
  assert.deepEqual(
    loadRecentRuns(memoryStorage({ [RECENT_RUNS_KEY]: JSON.stringify(["a", 0, null, "a", "", "b", { id: "c" }]) })),
    ["a", "b"]
  );
});

test("almacenamiento roto no lanza", () => {
  const broken = {
    getItem: () => { throw new Error("SecurityError"); },
    setItem: () => { throw new Error("QuotaExceededError"); }
  };
  assert.deepEqual(loadRecentRuns(broken), []);
  assert.deepEqual(rememberRun("synthetic:run-1", broken), ["synthetic:run-1"]);
  const readOnly = { ...memoryStorage(), setItem: () => { throw new Error("QuotaExceededError"); } };
  assert.deepEqual(rememberRun("run-x", readOnly), ["run-x"]);
});

test("sin localStorage global devuelve lista vacía", () => {
  assert.deepEqual(loadRecentRuns(), []);
  assert.deepEqual(rememberRun("run-1"), ["run-1"]);
});
