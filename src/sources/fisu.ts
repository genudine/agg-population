import { Population, ServiceResponse } from "../types";

const subdomain = (worldID: string) => {
  switch (worldID) {
    case "1000":
      return "ps4us.ps2";
    case "2000":
      return "ps4eu.ps2";
    default:
      return "ps2";
  }
};

interface FisuResponse {
  config: {
    world: string[];
  };
  result: {
    worldId: number;
    vs: number;
    nc: number;
    tr: number;
    ns: number;
  }[];
  timing: {
    "start-ms": number;
    "query-ms": number;
    "total-ms": number;
    "process-ms": number;
  };
}

export const fisuFetchWorld = async (
  worldID: string
): Promise<ServiceResponse<number | undefined, FisuResponse | null>> => {
  const url = `https://${subdomain(
    worldID
  )}.fisu.pw/api/population/?world=${worldID}`;

  const res = await fetch(url);

  const data: FisuResponse = await res.json();

  const { vs, nc, tr, ns } = data.result[0];

  return {
    raw: data,
    population: {
      total: vs + nc + tr + ns,
      nc,
      tr,
      vs,
    },
    cachedAt: new Date(),
  };
};
