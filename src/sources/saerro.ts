import { Cache } from "../cache";
import { Population, ServiceResponse } from "../types";

interface SaerroResponse {
  data: {
    allWorlds: {
      id: number;
      population: Population<number>;
    }[];
  };
}

const saerroFetchAllWorlds = async (cache: Cache): Promise<SaerroResponse> => {
  const cached = await cache.get<SaerroResponse>("saerro");
  if (cached) {
    return cached;
  }

  const req = await fetch(`https://saerro.ps2.live/graphql`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify({
      query: `{
                allWorlds {
                  id 
                  population {
                    total
                    nc
                    tr
                    vs
                  }
                }
              }`,
    }),
  });

  return await cache.put("saerro", await req.json<SaerroResponse>());
};

export const saerroFetchWorld = async (
  id: string,
  cache: Cache
): Promise<ServiceResponse<number, SaerroResponse["data"]["allWorlds"][1]>> => {
  const start = Date.now();

  const json: SaerroResponse = await saerroFetchAllWorlds(cache);
  const end = Date.now();

  const world = json.data.allWorlds.find((w) => w.id === Number(id));

  if (!world) {
    throw new Error(`World ${id} not found`);
  }

  return {
    population: world.population,
    raw: world,
    cachedAt: new Date(),
    timings: {
      enter: start,
      exit: end,
      upstream: end - start,
    },
  };
};
