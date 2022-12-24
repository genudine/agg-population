import { Cache } from "../cache";
import { ServiceResponse } from "../types";

// {"world_population_list":[{"world_id":1,"last_updated":1671886187,"total":122,"population":{"VS":49,"NC":45,"TR":28,"NSO":0}},

type SanctuaryResponse = {
  world_population_list: {
    world_id: number;
    last_updated: string;
    total: number;
    population: {
      NC: number;
      TR: number;
      VS: number;
      NSO: number;
    };
  }[];
};

const sanctuaryFetchAllWorlds = async (
  cache: Cache
): Promise<SanctuaryResponse> => {
  const cached = await cache.get<SanctuaryResponse>("sanctuary");
  if (cached) {
    return cached;
  }

  const req = await fetch(
    "https://census.lithafalcon.cc/get/ps2/world_population?c:censusJSON=false"
  );

  return await cache.put("sanctuary", await req.json<SanctuaryResponse>());
};

export const sanctuaryFetchWorld = async (
  worldID: string,
  cache: Cache
): Promise<ServiceResponse<number, any>> => {
  // No PS4 data nor Jaeger
  if (worldID === "1000" || worldID === "2000" || worldID === "19") {
    return {
      population: {
        total: -1,
        nc: -1,
        tr: -1,
        vs: -1,
      },
      raw: {},
      cachedAt: new Date(),
    };
  }

  const start = Date.now();
  const resp = await sanctuaryFetchAllWorlds(cache);
  const end = Date.now();

  const data = resp.world_population_list.find(
    (w) => w.world_id === Number(worldID)
  );

  if (!data) {
    throw new Error(`sanctuary: World ${worldID} not found`);
  }

  if (data.last_updated < (Date.now() / 1000 - 60 * 5).toString()) {
    throw new Error(`sanctuary: World ${worldID} is stale`);
  }

  return {
    population: {
      total: data.total,
      nc: data.population.NC,
      tr: data.population.TR,
      vs: data.population.VS,
    },
    raw: data,
    cachedAt: new Date(),
    timings: {
      enter: start,
      exit: end,
      upstream: end - start,
    },
  };
};
