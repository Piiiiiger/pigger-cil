import { chmod, cp, mkdir, rm } from "node:fs/promises";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const distDir = resolve(root, "dist");

const COPY_TARGETS = [
  ["src", "src"],
  ["vendor", "vendor"],
  ["__generated__", "__generated__"],
  ["cli.js", "cli.js"],
  ["image-processor.js", "image-processor.js"],
  ["README.md", "README.md"],
  ["README.zh-CN.md", "README.zh-CN.md"],
  ["PIGGER_CONFIG.md", "PIGGER_CONFIG.md"],
  ["PIGGER_UI_GUIDE.md", "PIGGER_UI_GUIDE.md"],
  ["PIGGER_DOCS_MAP.md", "PIGGER_DOCS_MAP.md"]
];

async function build() {
  await rm(distDir, { recursive: true, force: true });
  await mkdir(distDir, { recursive: true });

  for (const [from, to] of COPY_TARGETS) {
    await cp(resolve(root, from), resolve(distDir, to), {
      recursive: true,
      force: true
    });
  }

  await chmod(resolve(distDir, "cli.js"), 0o755);
}

await build();
