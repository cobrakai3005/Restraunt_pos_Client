import { readdir, readFile } from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const ignored = new Set([
  "node_modules",
  ".next",
  ".git",
  "package-lock.json",
  "SECURITY_SCAN_REPORT.md",
  "security-scan.mjs",
]);

const patterns = [
  {
    name: "hardcoded Vinimay backend URL",
    regex: /https?:\/\/[^\s"']*(?:sharda\.co\.in|vercel\.app)[^\s"']*/gi,
  },
  {
    name: "embedded secret assignment",
    regex: /(?:api[_-]?key|jwt[_-]?secret|mongodb(?:\+srv)?|password)\s*[:=]\s*["'][^"']{8,}["']/gi,
  },
  {
    name: "mock credential",
    regex: /Demo@123|developer@example\.com|MOCK_CREDENTIALS/gi,
  },
];

async function files(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const output = [];
  for (const entry of entries) {
    if (ignored.has(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) output.push(...(await files(full)));
    else output.push(full);
  }
  return output;
}

const findings = [];
for (const file of await files(root)) {
  if (!/\.(?:ts|tsx|js|mjs|css|json|md|env|example)$/.test(file)) continue;
  const text = await readFile(file, "utf8").catch(() => "");
  for (const pattern of patterns) {
    if (pattern.regex.test(text)) {
      findings.push(`${path.relative(root, file)}: ${pattern.name}`);
    }
    pattern.regex.lastIndex = 0;
  }
}

if (findings.length) {
  console.error(findings.join("\n"));
  process.exit(1);
}

console.log(
  "Security scan passed: no hardcoded backend URL, embedded secret, mock credential, or copied authentication code was detected.",
);
