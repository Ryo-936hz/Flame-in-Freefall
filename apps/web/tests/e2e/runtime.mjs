import { spawn } from "node:child_process";
import { createRequire } from "node:module";
import { existsSync, lstatSync, mkdtempSync, realpathSync, rmSync } from "node:fs";
import net from "node:net";
import { tmpdir } from "node:os";
import path from "node:path";

const WINDOWS = process.platform === "win32";
const pause = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function availablePort(requested) {
  if (requested !== undefined && (!Number.isInteger(requested) || requested < 1 || requested > 65535)) {
    throw new Error("Ports must be integers from 1 to 65535.");
  }
  const server = net.createServer();
  await new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen({ host: "127.0.0.1", port: requested ?? 0, exclusive: true }, resolve);
  });
  const port = server.address().port;
  await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
  return port;
}

/** Owns only newly spawned processes and one newly-created temporary directory. */
export async function createRuntime(root, { apiPort, webPort, tempBase, fixturePath } = {}) {
  const python = path.join(root, ".venv", WINDOWS ? "Scripts/python.exe" : "bin/python");
  if (!existsSync(python)) throw new Error("Project Python is missing. Run scripts/setup.ps1 (or uv sync --locked) first.");
  const fixture = path.resolve(fixturePath ?? path.join(root, "data/fixtures/demo.json"));
  if (!existsSync(fixture)) throw new Error("The explicitly selected dataset fixture is missing.");
  const require = createRequire(path.join(root, "package.json"));
  const vite = path.join(path.dirname(require.resolve("vite/package.json")), "bin/vite.js");
  const { chromium } = require("playwright");
  const apiNumber = await availablePort(apiPort);
  let webNumber = await availablePort(webPort);
  if (webNumber === apiNumber) {
    if (webPort !== undefined) throw new Error("API and web ports must be different.");
    do { webNumber = await availablePort(); } while (webNumber === apiNumber);
  }
  const apiUrl = `http://127.0.0.1:${apiNumber}`;
  const webUrl = `http://127.0.0.1:${webNumber}`;
  const temporaryRoot = realpathSync(tempBase ?? tmpdir());
  const directory = mkdtempSync(path.join(temporaryRoot, "flamelab-p6-e2e-"));
  const db = path.join(directory, "e2e.db");
  const children = new Set();
  const environment = Object.fromEntries(Object.entries(process.env).filter(([key]) => !key.startsWith("FLAMELAB_") && key !== "PYTHONPATH"));

  function start(name, command, args, env, cwd = root) {
    const log = [];
    const child = spawn(command, args, {
      cwd, env: { ...environment, NO_COLOR: "1", ...env }, windowsHide: true,
      stdio: ["ignore", "pipe", "pipe"], detached: !WINDOWS,
    });
    child.label = name;
    child.launchError = null;
    const keep = (chunk) => { log.push(String(chunk)); if (log.length > 200) log.shift(); };
    child.stdout.on("data", keep); child.stderr.on("data", keep);
    child.on("error", (error) => { child.launchError = error; });
    child.logTail = () => log.join("").split("\n").slice(-35).join("\n");
    children.add(child);
    return child;
  }

  async function stop(child) {
    if (!child || !child.pid || child.exitCode !== null || child.signalCode) return;
    if (WINDOWS) {
      // Only the PID that this runner created; never kill by port or process name.
      await new Promise((resolve) => {
        const killer = spawn("taskkill.exe", ["/PID", String(child.pid), "/T", "/F"], { windowsHide: true, stdio: "ignore", timeout: 5000, killSignal: "SIGKILL" });
        killer.on("error", resolve); killer.on("exit", resolve);
      });
    } else {
      try { process.kill(-child.pid, "SIGTERM"); } catch { child.kill("SIGTERM"); }
    }
    const until = Date.now() + 5000;
    while (child.exitCode === null && !child.signalCode && Date.now() < until) await pause(50);
    if (child.exitCode === null && !child.signalCode) {
      if (WINDOWS) child.kill("SIGKILL");
      else { try { process.kill(-child.pid, "SIGKILL"); } catch { child.kill("SIGKILL"); } }
      const forcedUntil = Date.now() + 2000;
      while (child.exitCode === null && !child.signalCode && Date.now() < forcedUntil) await pause(50);
    }
    if (child.exitCode === null && !child.signalCode) throw new Error(`Could not stop owned ${child.label} process ${child.pid}.`);
  }

  async function waitHttp(url, child, ms = 60000) {
    const until = Date.now() + ms;
    const marker = child.label === "api" ? `Uvicorn running on ${apiUrl}` : `${webUrl}/`;
    while (Date.now() < until) {
      if (child.launchError) throw new Error(`${child.label} could not start: ${child.launchError.message}`);
      if (child.exitCode !== null || child.signalCode) throw new Error(`${child.label} exited early:\n${child.logTail()}`);
      // Do not mistake a user's server for ours if another process wins a port race.
      if (child.logTail().includes(marker)) {
        try { if ((await fetch(url, { signal: AbortSignal.timeout(1500) })).ok) return; } catch { /* still starting */ }
      }
      await pause(100);
    }
    throw new Error(`Timeout waiting for owned ${child.label}:\n${child.logTail()}`);
  }

  return {
    apiUrl, webUrl, directory, chromium, stop, waitHttp,
    startApi: () => start("api", python, ["-m", "uvicorn", "flamelab.main:app", "--host", "127.0.0.1", "--port", String(apiNumber)], {
      PYTHONPATH: path.join(root, "apps/api/src"),
      FLAMELAB_DATABASE_URL: `sqlite:///${db.replaceAll("\\", "/")}`,
      FLAMELAB_SEED_DEMO: "true", FLAMELAB_AI_PROVIDER: "demo",
      FLAMELAB_FIXTURE_PATH: fixture,
      FLAMELAB_CORS_ORIGINS: JSON.stringify([webUrl]),
    }, directory), // No project .env: this process only sees the isolated demo settings.
    startWeb: () => start("web", process.execPath, [vite, "--config", "apps/web/vite.config.ts", "--port", String(webNumber), "--strictPort", "--host", "127.0.0.1"], { VITE_API_BASE_URL: apiUrl }),
    async close() {
      const failures = [];
      for (const child of children) { try { await stop(child); } catch (error) { failures.push(error); } }
      // Verify the exact absolute target before recursive cleanup; never remove a supplied DB.
      if (failures.length) throw new AggregateError(failures, "Owned process cleanup failed; temporary files retained.");
      if (path.dirname(path.resolve(directory)) !== temporaryRoot || !path.basename(directory).startsWith("flamelab-p6-e2e-") || lstatSync(directory).isSymbolicLink()) {
        throw new Error("Temporary directory cleanup target failed validation.");
      }
      rmSync(directory, { recursive: true, force: true, maxRetries: 5, retryDelay: 150 });
    },
  };
}
