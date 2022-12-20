import { Route, Router, RouterType } from "itty-router";
import { handleAll, handleOne, index } from "./handlers";
import { Env, Flags } from "./types";
import { WorldCache } from "./cache";

interface BasicRouter extends RouterType {
  all: Route;
  get: Route;
}

const router = <BasicRouter>Router();

router
  .get<BasicRouter>("/", index)
  .get<BasicRouter>("/all", handleAll)
  .get<BasicRouter>("/:id", handleOne)
  .all<BasicRouter>("*", () => {
    return new Response("Not found", {
      headers: { "content-type": "text/plain" },
    });
  });

export default {
  fetch: async (request: Request, env: Env, ctx: ExecutionContext) => {
    const worldCache = new WorldCache(env.CACHE, env.DISABLE_CACHE === "1");

    const flags: Flags = {
      disableFisu: env.DISABLE_FISU === "1",
      disableHonu: env.DISABLE_HONU === "1",
      disableSaerro: env.DISABLE_SAERRO === "1",
      disableVoidwell: env.DISABLE_VOIDWELL === "1",
    };

    return router
      .handle(request as any, env, ctx, worldCache, flags)
      .then((response) => {
        response.headers.set("access-control-allow-origin", "*");
        response.headers.set(
          "access-control-allow-method",
          "GET, HEAD, OPTIONS"
        );
        return response;
      });
  },
};