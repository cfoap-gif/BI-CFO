import assert from "node:assert/strict";
import { test } from "node:test";
import { normalizeRepositoryFilters } from "../lib/boletins/repository-filters";

test("normalizes repository filters with valid values", () => {
  assert.deepEqual(
    normalizeRepositoryFilters({
      year: "2026",
      number: " 12 ",
      q: " ALFA ",
      start: "2026-06-01",
      end: "2026-06-30",
    }),
    {
      year: 2026,
      number: 12,
      q: "ALFA",
      start: "2026-06-01",
      end: "2026-06-30",
    },
  );
});

test("drops invalid numeric and date filters", () => {
  assert.deepEqual(
    normalizeRepositoryFilters({
      year: "1999",
      number: "abc",
      q: "a",
      start: "01-06-2026",
      end: "2026-6-30",
    }),
    {},
  );
});

test("keeps only non-empty repository filter query params", () => {
  assert.deepEqual(
    normalizeRepositoryFilters({
      year: "",
      number: "7",
      q: "missão externa",
      start: undefined,
      end: "2026-12-31",
    }),
    {
      number: 7,
      q: "missão externa",
      end: "2026-12-31",
    },
  );
});
