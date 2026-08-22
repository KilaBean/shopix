import { describe, expect, it } from "vitest";

import { addMoney, formatPesewas, multiplyMoney } from "@/lib/money";

describe("addMoney", () => {
  it("sums integer pesewas", () => {
    expect(addMoney(1050, 250, 100)).toBe(1400);
  });

  it("returns 0 for no arguments", () => {
    expect(addMoney()).toBe(0);
  });

  it("rejects non-integer amounts", () => {
    expect(() => addMoney(10.5)).toThrow(TypeError);
  });
});

describe("multiplyMoney", () => {
  it("multiplies a unit price by a quantity", () => {
    expect(multiplyMoney(1050, 3)).toBe(3150);
  });

  it("rejects a negative quantity", () => {
    expect(() => multiplyMoney(1050, -1)).toThrow(RangeError);
  });

  it("rejects a non-integer quantity", () => {
    expect(() => multiplyMoney(1050, 1.5)).toThrow(TypeError);
  });
});

describe("formatPesewas", () => {
  it("formats pesewas as GHS currency", () => {
    expect(formatPesewas(10050)).toBe("GH₵100.50");
  });

  it("formats zero correctly", () => {
    expect(formatPesewas(0)).toBe("GH₵0.00");
  });
});
