import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { canTransitionActivity } from "@/lib/activities/status";
import { assertResourceOwner } from "@/lib/permissions/resources";

describe("autorización y estados", () => {
  it("acepta recursos propios y rechaza ajenos", () => {
    expect(assertResourceOwner({ educator_id: "user-a" }, "user-a").educator_id).toBe("user-a");
    expect(() => assertResourceOwner({ educator_id: "user-b" }, "user-a")).toThrow(/sin acceso/);
  });
  it("solo permite transiciones válidas", () => {
    expect(canTransitionActivity("accepted", "applied")).toBe(true);
    expect(canTransitionActivity("generated", "evaluated")).toBe(false);
    expect(canTransitionActivity("applied", "evaluated")).toBe(true);
  });
  it("la migración activa RLS y vincula políticas con auth.uid", () => {
    const sql = readFileSync("supabase/migrations/202607310001_aula_puente.sql", "utf8");
    expect(sql).toContain("alter table app.students enable row level security");
    expect(sql).toContain("educator_id = (select auth.uid())");
    expect(sql).toContain("educator_owns_options");
  });
});
