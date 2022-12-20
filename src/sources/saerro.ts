import { Population, ServiceResponse } from "../types";

interface OneResponse {
  data: {
    world: {
      id: string;
      population: Population<number>;
    };
  };
}

export const saerroFetchWorld = async (
  id: string
): Promise<ServiceResponse<number, OneResponse>> => {
  const req = await fetch(`https://saerro.ps2.live/graphql`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify({
      query: `{
                world(by: {id: ${id}}) {
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

  const json: OneResponse = await req.json();

  return {
    population: json.data.world.population,
    raw: json,
    cachedAt: new Date(),
  };
};
