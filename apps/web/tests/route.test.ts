import assert from "node:assert/strict";
import test from "node:test";
import { VIEWS, parseRoute, routeHash } from "../src/lib/route";

test("an empty hash opens the welcome page", () => {
  assert.deepEqual(parseRoute(""), { page: "home" });
  assert.deepEqual(parseRoute("#/"), { page: "home" });
});

test("dashboard routes keep the chosen view and default to Overview", () => {
  assert.deepEqual(parseRoute("#/dashboard"), { page: "dashboard", view: "overview" });
  assert.deepEqual(parseRoute("#/dashboard/lab"), { page: "dashboard", view: "lab" });
  assert.deepEqual(parseRoute("#/dashboard/saffire"), { page: "dashboard", view: "saffire" });
  assert.deepEqual(parseRoute("#/dashboard/unknown"), { page: "dashboard", view: "overview" });
});

test("in-page anchors are not routes", () => {
  assert.equal(parseRoute("#brief"), null);
  assert.equal(parseRoute("#evidence"), null);
});

test("every route round-trips through its hash", () => {
  for (const view of VIEWS) {
    assert.deepEqual(parseRoute(routeHash({ page: "dashboard", view })), { page: "dashboard", view });
  }
  assert.deepEqual(parseRoute(routeHash({ page: "home" })), { page: "home" });
});
