import { describe, expect, it, vi } from "vitest";
import type { ExpenseRepository } from "../domain/ExpenseRepository";
import { ExpenseService } from "./ExpenseService";
describe("ExpenseService", () => {
  it("rejects a non-positive amount before persistence", () => {
    const record = vi.fn();
    const repository: ExpenseRepository = {
      getSnapshot: vi.fn(),
      record,
      createCategory: vi.fn(),
    };
    const service = new ExpenseService(repository);
    expect(() =>
      service.record({
        date: "2026-07-17",
        category: "Feed",
        amount: 0,
        description: "",
      }),
    ).toThrow();
    expect(record).not.toHaveBeenCalled();
  });
});
