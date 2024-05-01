import { BaseSchema, Output, parse } from "valibot";

export interface MyRequest {
  path: string;
  queryParams: Record<string, any>;
  method: string;
  headers: Record<string, string | undefined>;
  body: string | undefined;
}

export type MyResponse<T> = {
  statusCode: number;
  body: T;
  headers?: Record<string, string>;
};

export type RequestHandler<
  PathParamSchema extends BaseSchema | undefined,
  QueryParamSchema extends BaseSchema | undefined,
  RequestBodySchema extends BaseSchema | undefined,
  ResponseBodySchema extends BaseSchema | undefined,
  HandlerResponseType extends Output<Exclude<ResponseBodySchema, undefined>>
> = (
  // merge all params into one object
  params: (PathParamSchema extends BaseSchema
    ? Output<Exclude<PathParamSchema, undefined>>
    : {}) &
    (QueryParamSchema extends BaseSchema
      ? Output<Exclude<QueryParamSchema, undefined>>
      : {}) &
    (RequestBodySchema extends BaseSchema
      ? Output<Exclude<RequestBodySchema, undefined>>
      : {}),
  context: {
    original: MyRequest;
  }
) => Promise<
  MyResponse<ResponseBodySchema extends BaseSchema ? HandlerResponseType : null>
>;

export type RequestHandlerDefinition<
  PathParamSchema extends BaseSchema | undefined,
  QueryParamSchema extends BaseSchema | undefined,
  RequestBodySchema extends BaseSchema | undefined,
  ResponseBodySchema extends BaseSchema | undefined,
  HandlerResponseType extends Output<Exclude<ResponseBodySchema, undefined>>
> = {
  pathParams?: PathParamSchema;
  queryParams?: QueryParamSchema;
  bodyParams?: RequestBodySchema;
  response?: ResponseBodySchema;
  handler: RequestHandler<
    PathParamSchema,
    QueryParamSchema,
    RequestBodySchema,
    ResponseBodySchema,
    HandlerResponseType
  >;
};

class RouteHandler<PathParamShema extends BaseSchema | undefined = undefined> {
  public handlers: Record<
    string,
    RequestHandlerDefinition<any, any, any, any, any>
  > = {};

  constructor(
    public readonly pathRegex: RegExp,
    public readonly pathSchema: PathParamShema
  ) {}

  addHandler<
    Q extends BaseSchema | undefined = undefined,
    B extends BaseSchema | undefined = undefined,
    R extends BaseSchema | undefined = undefined,
    HR extends Output<Exclude<R, undefined>> = Output<Exclude<R, undefined>>
  >(
    config: { method: string } & Omit<
      RequestHandlerDefinition<PathParamShema, Q, B, R, HR>,
      "pathParams"
    >
  ) {
    this.handlers[config.method.toLowerCase()] = {
      pathParams: this.pathSchema,
      ...config,
    };
    return this;
  }

  /**
   * handle
   * @param request
   * @returns
   */
  async handleIfMatch(request: MyRequest): Promise<{
    statusCode: number;
    body: string | undefined;
    headers: Record<string, string>;
  } | null> {
    const match = this.pathRegex.exec(request.path);
    if (!match) {
      return null;
    }

    const config = this.handlers[request.method.toLowerCase()];
    if (!config) {
      return { statusCode: 404, headers: {}, body: undefined };
    }

    try {
      const body = request.body ? jsonParseOrThrow(request.body) : null;
      const params = {
        ...(config.pathParams
          ? parseOrThrow(config.pathParams, match.groups ?? {})
          : {}),
        ...(config.queryParams
          ? parseOrThrow(config.queryParams, request.queryParams)
          : {}),
        ...(config.bodyParams ? parseOrThrow(config.bodyParams, body) : {}),
      };

      const result = await config.handler(params as any, { original: request });

      if (config.response) {
        const body = parseOrThrow(config.response, result.body); // TODO: this is system error
        return {
          statusCode: result.statusCode,
          headers: {
            "content-type": "application/json",
            ...result.headers,
          },
          body: JSON.stringify(body),
        };
      } else {
        return {
          statusCode: result.statusCode,
          body: undefined,
          headers: {
            ...result.headers,
          },
        };
      }
    } catch (e) {
      return { statusCode: 500, body: String(e), headers: {} };
    }
  }
}

export class Router {
  private routes: RouteHandler<any>[] = [];

  addRoute<P extends BaseSchema | undefined>(
    pathRegexp: RegExp,
    pathSchema: P
  ): RouteHandler<P> {
    const h = new RouteHandler<P>(pathRegexp, pathSchema);
    this.routes.push(h);
    return h;
  }

  async handleRequest(req: MyRequest): Promise<MyResponse<string | undefined>> {
    for (const route of this.routes) {
      const result = await route.handleIfMatch(req);
      if (result) {
        return result;
      }
    }
    return { statusCode: 404, headers: {}, body: undefined };
  }
}

/**
 * @throws SoracomError
 */
const jsonParseOrThrow = (s: string): any => {
  return JSON.parse(s);
};

/**
 * do valibot.parse and throws SoracomError on error
 * @throws SoracomError
 */
const parseOrThrow: typeof parse = (schema, value) => {
  return parse(schema, value);
};
