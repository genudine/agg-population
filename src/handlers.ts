import { IRequest } from "itty-router";
import { saerroFetchWorld } from "./sources/saerro";
import { fisuFetchWorld } from "./sources/fisu";
import { honuFetchWorld } from "./sources/honu";
import { voidwellFetchWorld } from "./sources/voidwell";
import { noData } from "./errors";
import { DebugPayload, Flags, OnePayload } from "./types";
import { WorldCache } from "./cache";

const avgOf = (arr: number[]) =>
  Math.floor(arr.reduce((a, b) => a + b, 0) / arr.length);

const flatMapBy = (arr: any[], key: string) =>
  arr.reduce((a, b) => [...a, b[key]], []);

const defaultServiceResponse = {
  population: {
    total: -1,
    nc: null,
    tr: null,
    vs: null,
  },
  raw: null,
  cachedAt: undefined,
};

export const getWorld = async (id: string, cache: WorldCache, flags: Flags) => {
  const cached = await cache.get(id);
  if (cached) {
    return cached;
  }

  const [saerro, fisu, honu, voidwell] = await Promise.all([
    !flags.disableSaerro
      ? saerroFetchWorld(id).catch(() => defaultServiceResponse)
      : defaultServiceResponse,
    !flags.disableFisu
      ? fisuFetchWorld(id).catch(() => defaultServiceResponse)
      : defaultServiceResponse,
    !flags.disableHonu
      ? honuFetchWorld(id).catch(() => defaultServiceResponse)
      : defaultServiceResponse,
    !flags.disableVoidwell
      ? voidwellFetchWorld(id).catch(() => defaultServiceResponse)
      : defaultServiceResponse,
  ]);

  const debug: DebugPayload = {
    raw: {
      saerro: saerro.raw,
      fisu: fisu.raw,
      honu: honu.raw,
      voidwell: voidwell.raw,
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
    return await cache.put(id, {
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
  worldCache: WorldCache,
  flags: Flags
) => {
  const { world, debug } = await getWorld(id, worldCache, flags);

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
  _1: unknown,
  _2: unknown,
  _3: unknown,
  worldCache: WorldCache,
  flags: Flags
): Promise<Response> => {
  const worlds = ["1", "10", "13", "17", "19", "40", "1000", "2000"];

  const worldData = await Promise.all(
    worlds.map((x) =>
      getWorld(x, worldCache, flags).catch(() => {
        error: "World data is missing. Is it down?";
      })
    )
  );
  const worldPayloads = worldData.map((x) => x?.world || x);

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

## Caching and usage limits

This service cached on a world basis for 3 minutes.`;

  return new Response(body, {
    headers: {
      "content-type": "text/plain",
    },
  });
};
