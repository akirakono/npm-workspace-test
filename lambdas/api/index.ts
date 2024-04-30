import * as v from "valibot";
import { PetsSchema } from "@soracom/my-model";
import { Router } from "@soracom/my-valibot-router";
import { hello } from "@internal/util";

const r = new Router();

r.addRoute(new RegExp("/pets"), undefined).addHandler({
  method: "get",
  queryParams: v.optional(
    v.object({
      limit: v.number([v.integer(), v.maxValue(100)]),
    })
  ),
  response: PetsSchema,
  handler: async (params) => ({
    statusCode: 200,
    headers: { hello: hello() },
    body: [],
  }),
});
