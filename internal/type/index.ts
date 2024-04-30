import { type Pet, parsePet } from "@soracom/my-model";

export function parsePetSafe(val: unknown): Pet | null {
  try {
    return parsePet(val);
  } catch (e) {
    console.warn(`Failed to parse pet`, e);
    return null;
  }
}
