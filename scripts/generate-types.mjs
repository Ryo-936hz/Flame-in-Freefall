import { readFile, writeFile, mkdir } from "node:fs/promises";
import openapiTS, { astToString } from "openapi-typescript";

const source = new URL("../packages/contracts/openapi.json", import.meta.url);
const destination = new URL("../packages/contracts/schema.d.ts", import.meta.url);
// A server default does not make a request property mandatory on the wire.
const ast = await openapiTS(source, { defaultNonNullable: false });
const generated = "// Generated from packages/contracts/openapi.json. Do not edit.\n" + astToString(ast);
if (process.argv.includes("--check")) {
  const saved = await readFile(destination, "utf8");
  if (saved !== generated) {
    console.error("TypeScript contract drift: run npm run generate:types after exporting OpenAPI.");
    process.exitCode = 1;
  } else console.log("TypeScript contract matches OpenAPI.");
} else {
  await mkdir(new URL("../packages/contracts/", import.meta.url), { recursive: true });
  await writeFile(destination, generated, "utf8");
  console.log("Generated packages/contracts/schema.d.ts");
}
