// Discover every checked-in client test, including P5/P6 subdirectories, on Windows and Linux.
import { readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
function collect(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    return entry.isDirectory() ? collect(path) : /\.test\.tsx?$/.test(entry.name) ? [path] : [];
  });
}
const files = collect(join(root, "apps/web/tests")).sort();
if (!files.length) throw new Error("No client tests found.");
const result = spawnSync(process.execPath, ["--import", "tsx", "--test", ...files], {
  cwd: root, stdio: "inherit", windowsHide: true,
});
if (result.error) throw result.error;
process.exitCode = result.status ?? 1;
