export class MyRouterError extends Error {
  constructor(public code: string, public msg: string) {
    super(msg);
  }
}
