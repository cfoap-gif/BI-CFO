import assert from "node:assert/strict";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { test } from "node:test";

const ROOT = process.cwd();

function read(path: string): string {
  return readFileSync(join(ROOT, path), "utf8");
}

function listFiles(dir: string): string[] {
  const absolute = join(ROOT, dir);
  return readdirSync(absolute).flatMap((entry) => {
    const full = join(absolute, entry);
    const relative = join(dir, entry).replaceAll("\\", "/");
    if (statSync(full).isDirectory()) return listFiles(relative);
    return [relative];
  });
}

test("PDF and archive code do not read records directly", () => {
  const files = [
    ...listFiles("lib/pdf").filter((file) => file.endsWith(".ts") || file.endsWith(".tsx")),
    "app/boletins/[id]/pdf/route.ts",
    "app/boletins/[id]/arquivo/route.ts",
  ];

  for (const file of files) {
    assert.doesNotMatch(
      read(file),
      /\.from\(["']records["']\)/,
      `${file} must not query records; DT-003 requires PDF/archive to use bulletins + bulletin_items`,
    );
  }
});

test("event tables remain append-only in migrations", () => {
  const recordEvents = read("supabase/migrations/0013_record_events.sql");
  const bulletinEvents = read("supabase/migrations/0014_bulletins.sql");

  assert.doesNotMatch(
    recordEvents,
    /record_events[^;]*(for update|for delete)/i,
    "record_events must not have UPDATE/DELETE policies",
  );
  assert.doesNotMatch(
    bulletinEvents,
    /bulletin_events[^;]*(for update|for delete)/i,
    "bulletin_events must not have UPDATE/DELETE policies",
  );
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
