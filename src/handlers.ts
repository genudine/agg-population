import { IRequest } from "itty-router";
import { noData } from "./errors";
import { DebugPayload, Flags, OnePayload } from "./types";
import { Cache } from "./cache";
import { getWorld } from "./fetcher";

export const handleOne = async (
  { params: { id }, query: { debug: debugParam } }: IRequest,
  _1: unknown,
  _2: unknown,
  Cache: Cache,
  flags: Flags
) => {
  const { world, debug } = await getWorld(id, Cache, flags);

  if (world === null) {
    return noData();
  }

  let output: OnePayload | (OnePayload & DebugPayload) = world;

  if (debugParam) {
    output = { ...output, ...debug };
  }

  return new Response(JSON.stringify(output), {
    headers: {
      "content-type": "application/json",
    },
  });
};

export const handleAll = async (
  { query: { debug } }: IRequest,
  _2: unknown,
  _3: unknown,
  cache: Cache,
  flags: Flags
): Promise<Response> => {
  const cached = await cache.get(`all${debug ? ".debug" : ""}`);
  if (false && cached) {
    return new Response(JSON.stringify(cached), {
      headers: {
        "content-type": "application/json",
      },
    });
  }

  const worlds = ["1", "10", "13", "17", "19", "40", "1000", "2000"];

  const worldTasks = [];

  for (const world of worlds) {
    worldTasks.push(getWorld(world, cache, flags));
  }

  await worldTasks[0]; // Force the first one to cache for the rest
  const worldData = await Promise.all(worldTasks);

  if (debug === "1") {
    return new Response(JSON.stringify(worldData), {
      headers: {
        "content-type": "application/json",
      },
    });
  }

  const worldPayloads = worldData.map((x: any) => x.world || x);

  await cache.put(`all${debug ? ".debug" : ""}`, worldPayloads);

  return new Response(JSON.stringify(worldPayloads), {
    headers: {
      "content-type": "application/json",
    },
  });
};
