import assert from "node:assert/strict";
import { test } from "node:test";
import type { AuditActorRow } from "../lib/audit/actors";
import {
  formatAuditActorName,
  uniqueAuditActorIds,
} from "../lib/audit/actors";

test("formats audit actor using war name first", () => {
  const actor: AuditActorRow = {
    user_id: "00000000-0000-0000-0000-000000000001",
    login: "coord.silva",
    full_name: "Joao da Silva",
    war_name: "SILVA",
    profile_name: "Coordenação",
    active: true,
  };

  assert.equal(
    formatAuditActorName(actor),
    "SILVA",
  );
});

test("falls back to full name, login, then unidentified", () => {
  const actorWithFullName: AuditActorRow = {
    user_id: "00000000-0000-0000-0000-000000000002",
    login: "coord.lima",
    full_name: "Maria Lima",
    war_name: "",
    profile_name: "Coordenação",
    active: true,
  };

  const actorWithLogin: AuditActorRow = {
    user_id: "00000000-0000-0000-0000-000000000003",
    login: "instr.costa",
    full_name: "",
    war_name: null,
    profile_name: "Instrutor",
    active: true,
  };

  assert.equal(
    formatAuditActorName(actorWithFullName),
    "Maria Lima",
  );

  assert.equal(
    formatAuditActorName(actorWithLogin),
    "instr.costa",
  );

  assert.equal(formatAuditActorName(null), "Usuário não identificado");
});

test("deduplicates audit actor ids and removes blanks", () => {
  assert.deepEqual(
    uniqueAuditActorIds([
      "00000000-0000-0000-0000-000000000001",
      null,
      "",
      "00000000-0000-0000-0000-000000000001",
      "00000000-0000-0000-0000-000000000002",
    ]),
    [
      "00000000-0000-0000-0000-000000000001",
      "00000000-0000-0000-0000-000000000002",
    ],
  );
});
