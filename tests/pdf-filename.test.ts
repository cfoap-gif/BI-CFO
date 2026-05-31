import assert from "node:assert/strict";
import { test } from "node:test";
import { buildBulletinPdfFilename } from "../lib/pdf/filename";

test("builds daily bulletin PDF filename", () => {
  assert.equal(
    buildBulletinPdfFilename({
      number: 5,
      year: 2026,
      startDate: "2026-06-02",
      endDate: "2026-06-02",
    }),
    "BI_CFO_2026_N005_02-06-2026.pdf",
  );
});

test("builds period bulletin PDF filename", () => {
  assert.equal(
    buildBulletinPdfFilename({
      number: 6,
      year: 2026,
      startDate: "2026-06-01",
      endDate: "2026-06-03",
    }),
    "BI_CFO_2026_N006_01-06-2026_a_03-06-2026.pdf",
  );
});
