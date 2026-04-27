import { execSync } from "child_process";
import { writeFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

let sha = "unknown";
try {
  sha = execSync("git rev-parse HEAD", { cwd: root }).toString().trim();
} catch {}

const version = {
  builtAt: new Date().toISOString(),
  sha,
  short: sha.slice(0, 7),
};

writeFileSync(
  join(root, "public", "version.json"),
  JSON.stringify(version, null, 2) + "\n"
);

console.log(`version.json → ${version.short} @ ${version.builtAt}`);
