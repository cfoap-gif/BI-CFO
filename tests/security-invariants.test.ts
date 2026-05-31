import assert from "node:assert/strict";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { test } from "node:test";

const ROOT = process.cwd();
const PRUNED_DIRS = new Set([
  ".git",
  ".next",
  ".turbo",
  ".vercel",
  "build",
  "coverage",
  "dist",
  "node_modules",
]);

function read(path: string): string {
  return readFileSync(join(ROOT, path), "utf8");
}

function listFiles(dir: string): string[] {
  const absolute = join(ROOT, dir);
  return readdirSync(absolute).flatMap((entry) => {
    const full = join(absolute, entry);
    const relative = join(dir, entry).replaceAll("\\", "/");
    if (statSync(full).isDirectory()) {
      if (PRUNED_DIRS.has(entry)) return [];
      return listFiles(relative);
    }
    return [relative];
  });
}

function sqlStatements(source: string): string[] {
  return source
    .split(";")
    .map((statement) => statement.trim())
    .filter(Boolean)
    .map((statement) => `${statement};`);
}

test("PDF and archive code do not read records directly", () => {
  const files = [
    ...listFiles("lib/pdf").filter((file) => file.endsWith(".ts") || file.endsWith(".tsx")),
    "app/boletins/[id]/actions.ts",
    "app/boletins/[id]/pdf/route.ts",
    "app/boletins/[id]/arquivo/route.ts",
  ];

  for (const file of files) {
    assert.doesNotMatch(
      read(file),
      /\.from\s*\(\s*["']records["']\s*\)/,
      `${file} must not query records; DT-003 requires PDF/archive to use bulletins + bulletin_items`,
    );
  }
});

test("event tables remain append-only in migrations", () => {
  const migrationSql = listFiles("supabase/migrations")
    .filter((file) => file.endsWith(".sql"))
    .map((file) => ({ file, source: read(file) }));

  for (const table of ["record_events", "bulletin_events"]) {
    const eventTableRegex = new RegExp(String.raw`\bon\s+public\.${table}\b`, "i");

    for (const { file, source } of migrationSql) {
      for (const statement of sqlStatements(source)) {
        if (!/\bcreate\s+policy\b/i.test(statement)) continue;
        if (!eventTableRegex.test(statement)) continue;

        const forClause = statement.match(/\bfor\s+(select|insert|update|delete|all)\b/i);
        assert.ok(
          forClause,
          `${file} policy on public.${table} must declare FOR SELECT or FOR INSERT; omitted FOR defaults to ALL`,
        );

        const operation = forClause[1].toLowerCase();
        assert.ok(
          operation === "select" || operation === "insert",
          `${file} policy on public.${table} must be append-only; FOR ${operation.toUpperCase()} is not allowed`,
        );
      }
    }
  }
});

test("PDF routes keep authenticated admin-like guards", () => {
  for (const file of [
    "app/boletins/[id]/pdf/route.ts",
    "app/boletins/[id]/arquivo/route.ts",
  ]) {
    const source = read(file);
    assert.match(source, /supabase\.auth\.getUser\(\)/, `${file} must check session`);
    assert.match(source, /getCurrentProfileName\(\)/, `${file} must load profile`);
    assert.match(source, /isAdminLike\(profile\)/, `${file} must require Admin/Coordenação`);
  }
});

test("service role key is not used by application code", () => {
  const files = [
    ...listFiles("app"),
    ...listFiles("components"),
    ...listFiles("lib"),
  ].filter((file) => /\.(ts|tsx)$/.test(file));

  for (const file of files) {
    assert.doesNotMatch(
      read(file),
      /SUPABASE_SERVICE_ROLE_KEY/,
      `${file} must not read SUPABASE_SERVICE_ROLE_KEY`,
    );
  }
});
