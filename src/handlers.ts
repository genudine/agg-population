import { IRequest } from "itty-router";
import { saerroFetchWorld } from "./sources/saerro";
import { fisuFetchWorld } from "./sources/fisu";
import { honuFetchWorld } from "./sources/honu";
import { voidwellFetchWorld } from "./sources/voidwell";
import { noData } from "./errors";
import { DebugPayload, Flags, OnePayload, ServiceResponse } from "./types";
import { Cache } from "./cache";

const avgOf = (arr: number[]) =>
  Math.floor(arr.reduce((a, b) => a + b, 0) / arr.length);

const flatMapBy = (arr: any[], key: string) =>
  arr.reduce((a, b) => [...a, b[key]], []);

const defaultServiceResponse: ServiceResponse<number, null> = {
  population: {
    total: -1,
    nc: -1,
    tr: -1,
    vs: -1,
  },
  raw: null,
  cachedAt: new Date(),
};

type World = {
  world: OnePayload | null;
  debug: DebugPayload;
};

export const getWorld = async (id: string, cache: Cache, flags: Flags) => {
  const cached = await cache.get<World>(id);
  if (cached) {
    return cached;
  }

  const [saerro, fisu, honu, voidwell] = await Promise.all([
    !flags.disableSaerro
      ? saerroFetchWorld(id, cache).catch((e) => {
          console.error("SAERRO ERROR:", e);
          return defaultServiceResponse;
        })
      : defaultServiceResponse,
    !flags.disableFisu
      ? fisuFetchWorld(id, cache).catch(() => defaultServiceResponse)
      : defaultServiceResponse,
    !flags.disableHonu
      ? honuFetchWorld(id, cache).catch(() => defaultServiceResponse)
      : defaultServiceResponse,
    !flags.disableVoidwell
      ? voidwellFetchWorld(id, cache).catch(() => defaultServiceResponse)
      : defaultServiceResponse,
  ]);

  const debug: DebugPayload = {
    raw: {
      saerro: saerro.raw,
      fisu: fisu.raw,
      honu: honu.raw,
      voidwell: voidwell.raw,
    },
    timings: {
      saerro: saerro?.timings || null,
      fisu: fisu?.timings || null,
      honu: honu?.timings || null,
      voidwell: voidwell?.timings || null,
    },
    lastFetchTimes: {
      saerro: saerro.cachedAt,
      fisu: fisu.cachedAt,
      honu: honu.cachedAt,
      voidwell: voidwell.cachedAt,
    },
  };

  const totalPopulations = [
    saerro.population.total,
    fisu.population.total,
    honu.population.total,
    voidwell.population.total,
  ].filter((x) => x > 0);

  if (totalPopulations.length === 0) {
    return await cache.put<World>(id, {
      world:
        id !== "19"
          ? null
          : {
              // Jaeger gets a special case, we assume it's always up, but empty.
              id: 19,
              average: 0,
              factions: {
                nc: 0,
                tr: 0,
                vs: 0,
              },
              services: {
                saerro: 0,
                fisu: 0,
                honu: 0,
                voidwell: 0,
              },
            },
      debug,
    });
  }

  const factionPopulations = [
    saerro.population,
    fisu.population,
    honu.population,
  ].filter((x) => x.total > 0);

  const payload: OnePayload = {
    id: Number(id),
    average: avgOf(totalPopulations),
    factions: {
      nc: avgOf(flatMapBy(factionPopulations, "nc")),
      tr: avgOf(flatMapBy(factionPopulations, "tr")),
      vs: avgOf(flatMapBy(factionPopulations, "vs")),
    },
    services: {
      saerro: saerro.population.total,
      fisu: fisu.population.total,
      honu: honu.population.total,
      voidwell: voidwell.population.total,
    },
  };

  return await cache.put(id, { world: payload, debug });
};

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
  Cache: Cache,
  flags: Flags
): Promise<Response> => {
  const worlds = ["1", "10", "13", "17", "19", "40", "1000", "2000"];

  const worldData = [];

  for (const world of worlds) {
    worldData.push(await getWorld(world, Cache, flags));
  }

  if (debug === "1") {
    return new Response(JSON.stringify(worldData), {
      headers: {
        "content-type": "application/json",
      },
    });
  }

  const worldPayloads = worldData.map((x: any) => x.world || x);

  return new Response(JSON.stringify(worldPayloads), {
    headers: {
      "content-type": "application/json",
    },
  });
};

export const index = (): Response => {
  const body = `Aggregate Planetside 2 World Population

GitHub: https://github.com/genudine/agg-population
Production: https://agg.ps2.live/population

Need help with this data? 

## Methodology

This service aggregates the population data from the following sources:
- https://saerro.ps2.live/
- https://ps2.fisu.pw/
- https://wt.honu.pw/
- https://voidwell.com/ (caveat: no factions, non-standard counting method)

## Routes

GET /:id - Get one world by ID

  {
    "id": 17,
    "average": 285,
    "factions": {
      "nc": 91,
      "tr": 92,
      "vs": 91
    },
    "services": {
      "saerro": 282,
      "fisu": 271,
      "honu": 292,
      "voidwell": 298
    }
  }

  Query Parameters:

    ?debug=1 - Adds these fields to the response:
      { 
        /// ... other fields
        "raw": {
          "saerro": { ... },
          "fisu": { ... },
          "honu": { ... },
          "voidwell": { ... }
        },
        "lastFetchTimes": {
          "saerro": "2020-10-10T00:00:00.000Z",
          "fisu": "2020-10-10T00:00:00.000Z",
          "honu": "2020-10-10T00:00:00.000Z",
          "voidwell": "2020-10-10T00:00:00.000Z"
        }
      }

GET /all - Get all worlds

  [
    {
      "id": 17,
      "average": 285,
      "factions": {
        "nc": 91,
        "tr": 92,
        "vs": 91
      },
      "services": {
        "saerro": 282,
        "fisu": 271,
        "honu": 292,
        "voidwell": 298
      }
    },
    {
      "id": 1,
      "average": 83,
      "factions": {
        "nc": 30,
        "tr": 15,
        "vs": 29
      },
      "services": {
        "saerro": 95,
        "fisu": 48,
        "honu": 91,
        "voidwell": 99
      }
    }
  ]

  -- This also has a debug query parameter, but it's extremely verbose. It's good for debugging extreme async issues with the platform.

## Caching and usage limits

This service cached on a world basis for 3 minutes. Debug data is cached alongside world data too.`;

  return new Response(body, {
    headers: {
      "content-type": "text/plain",
    },
  });
};
