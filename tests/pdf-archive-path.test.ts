import assert from "node:assert/strict";
import { test } from "node:test";
import { buildBulletinArchivePath } from "../lib/pdf/archive-path";

test("builds stable storage path for daily bulletin PDF", () => {
  assert.equal(
    buildBulletinArchivePath({
      number: 5,
      year: 2026,
      startDate: "2026-06-02",
      endDate: "2026-06-02",
      version: 1,
    }),
    "2026/BI_CFO_2026_N005_02-06-2026_v1.pdf",
  );
});

test("builds stable storage path for period bulletin PDF", () => {
  assert.equal(
    buildBulletinArchivePath({
      number: 6,
      year: 2026,
      startDate: "2026-06-01",
      endDate: "2026-06-03",
      version: 2,
    }),
    "2026/BI_CFO_2026_N006_01-06-2026_a_03-06-2026_v2.pdf",
  );
});
