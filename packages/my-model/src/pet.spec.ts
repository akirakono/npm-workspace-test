import { describe, test, expect } from "vitest";
import { Pet, parsePet } from "./pet";

describe("parsePet", () => {
  test("valid", () => {
    const valid: Pet = {
      id: 12,
      name: "Peter",
    };
    expect(() => parsePet(valid)).not.toThrowError();
  });
});
