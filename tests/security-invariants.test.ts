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

test("event read policies are hardened by latest migration", () => {
  const source = read("supabase/migrations/0019_event_read_hardening.sql");

  assert.doesNotMatch(source, /using\s*\(\s*true\s*\)/i);

  for (const table of ["record_events", "bulletin_events"]) {
    const statement = sqlStatements(source).find(
      (candidate) =>
        /\bcreate\s+policy\b/i.test(candidate) &&
        new RegExp(String.raw`\bon\s+public\.${table}\b`, "i").test(candidate),
    );

    assert.ok(statement, `0019 must recreate ${table}_read policy`);
    assert.match(statement, /for\s+select/i);
    assert.match(statement, /public\.user_profile_name\(\)/i);
    assert.match(statement, /'Administrador'/);
    assert.match(statement, /'Coordenação'/);
  }
});

test("bulletin creation checks initial audit event insert", () => {
  const source = read("app/boletins/actions.ts");

  assert.match(source, /error:\s*eventError/);
  assert.match(source, /if\s*\(\s*eventError\s*\)\s*throw\s+eventError/);
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
