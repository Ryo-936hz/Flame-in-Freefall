import test from "node:test";
import assert from "node:assert/strict";
import { ApiError, createApi, demoRanking, sourceLink } from "../src/lib/client.ts";

test("the generated client sends explicit filters without changing them", async () => {
  let received: Request | undefined;
  const transport: typeof fetch = async (input) => {
    received = input as Request;
    return Response.json({ id: "synthetic:run", provider: "demo", status: "completed" });
  };
  const api = createApi("http://127.0.0.1:8000", transport);
  const body = { question: "Consulta de integración", ranking: demoRanking };
  const response = await api.research(body);
  assert.equal(received?.url, "http://127.0.0.1:8000/api/v1/research");
  assert.equal(received?.method, "POST");
  assert.deepEqual(await received?.json(), body);
  assert.equal(response.provider, "demo");
});

test("IDs in evidence paths are encoded, not interpreted as extra path segments", async () => {
  let received: Request | undefined;
  const api = createApi("http://127.0.0.1:8000", async (input) => {
    received = input as Request;
    return Response.json({ id: "synthetic:a/b?x" });
  });
  await api.evidence("synthetic:a/b?x");
  assert.equal(received?.url, "http://127.0.0.1:8000/api/v1/evidence/synthetic%3Aa%2Fb%3Fx");
});

test("canonical API errors retain status, code and correlation ID", async () => {
  const api = createApi("http://127.0.0.1:8000", async () => Response.json({
    code: "not_found", message: "No se encontró la evidencia.", request_id: "request:demo"
  }, { status: 404 }));
  await assert.rejects(api.evidence("missing"), (error: unknown) => {
    assert.ok(error instanceof ApiError);
    assert.equal(error.status, 404);
    assert.equal(error.code, "not_found");
    assert.equal(error.requestId, "request:demo");
    assert.match(error.message, /evidencia/);
    return true;
  });
});

test("zero and absent numeric results pass through distinctly", async () => {
  const api = createApi("http://127.0.0.1:8000", async () => Response.json({
    items: [{ trial_id: "synthetic:zero", similarity: 0 }, { trial_id: "synthetic:missing", similarity: null }]
  }));
  const response = await api.rank(demoRanking);
  assert.equal(response.items[0]?.similarity, 0);
  assert.equal(response.items[1]?.similarity, null);
});

test("reports and stored SSE replay are consumed as plain text", async () => {
  const api = createApi("http://127.0.0.1:8000", async (input) => {
    const request = input as Request;
    return new Response(request.url.endsWith("/report") ? "# SINTÉTICO\nInforme" : ": stored replay\ndata: {}\n\n");
  });
  assert.equal(await api.report("synthetic:run"), "# SINTÉTICO\nInforme");
  assert.match(await api.events("synthetic:run"), /stored replay/);
});

test("source links permit only HTTP(S) and never execute corpus URLs", () => {
  assert.equal(sourceLink("javascript:alert(1)"), null);
  assert.equal(sourceLink("data:text/html,unsafe"), null);
  assert.equal(sourceLink("file:///private/source.pdf"), null);
  assert.equal(sourceLink(null), null);
  assert.equal(sourceLink("https://example.org/source"), "https://example.org/source");
});
