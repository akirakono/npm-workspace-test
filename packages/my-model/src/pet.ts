import * as v from "valibot";

export const PetSchema = v.object({
  id: v.number([v.integer()]),
  name: v.string(),
  tag: v.optional(v.string()),
});

export const PetsSchema = v.array(PetSchema, [v.maxLength(1000)]);

export type Pet = v.Output<typeof PetSchema>;
export type Pets = v.Output<typeof PetsSchema>;

export const parsePet = (val: unknown) => v.parse(PetSchema, val);
export const parsePets = (val: unknown) => v.parse(PetsSchema, val);
