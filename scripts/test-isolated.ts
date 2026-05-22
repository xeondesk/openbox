import { readdirSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { join, relative } from "node:path";

const testPatterns = ["**/*.test.ts", "**/*.test.tsx"];

function isIgnoredPath(path: string): boolean {
  return path.startsWith("node_modules/") || path.startsWith(".");
}

function matchGlob(pattern: string, root: string): string[] {
  const parts = pattern.split("/");
  const globPart = parts[parts.length - 1]!;

  function isMatch(name: string): boolean {
    if (globPart === "**/*.test.ts" || globPart === "**/*.test.tsx") {
      const ext = globPart.split(".").slice(-2).join(".");
      return name.endsWith("." + ext);
    }
    return false;
  }

  const results: string[] = [];

  function walk(dir: string): void {
    let entries: string[];
    try {
      entries = readdirSync(dir, { withFileTypes: true });
    } catch {
      return;
    }

    for (const entry of entries) {
      const fullPath = join(dir, entry.name);
      const relPath = relative(root, fullPath);

      if (isIgnoredPath(relPath)) {
        continue;
      }

      if (entry.isDirectory()) {
        walk(fullPath);
      } else if (entry.isFile() && isMatch(entry.name)) {
        results.push(relPath);
      }
    }
  }

  walk(root);
  return results;
}

async function collectTestFiles(): Promise<string[]> {
  const files = new Set<string>();

  for (const pattern of testPatterns) {
    const matches = matchGlob(pattern, ".");
    for (const path of matches) {
      if (isIgnoredPath(path)) {
        continue;
      }
      files.add(path);
    }
  }

  return [...files].sort((a, b) => a.localeCompare(b));
}

async function runTestsIndividually(files: string[]): Promise<void> {
  for (const file of files) {
    console.log(`\nRunning ${file}`);

    const result = spawnSync("pnpm", ["vitest", "run", file], {
      stdio: "inherit",
      cwd: process.cwd(),
    });

    if (result.status !== 0) {
      throw new Error(`Test failed: ${file}`);
    }
  }
}

async function main() {
  const files = await collectTestFiles();

  if (files.length === 0) {
    console.log("No test files found.");
    return;
  }

  console.log(`Running ${files.length} test files in isolated processes...`);
  await runTestsIndividually(files);
  console.log("\nAll isolated tests passed.");
}

main().catch((error) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(message);
  process.exit(1);
});
