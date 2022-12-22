import { Cache } from "../cache";
import { ServiceResponse } from "../types";

type KiwiResponse = {
  worldId: number;
  stats: {
    population: {
      nc: number;
      tr: number;
      vs: number;
      total: number;
    };
  };
}[];

const kiwiFetchAllWorlds = async (cache: Cache): Promise<KiwiResponse> => {
  return new Promise(async (resolve, reject) => {
    const cached = await cache.get<KiwiResponse>("kiwi");
    if (cached) {
      return cached;
    }
    let resp = await fetch(
      "https://planetside-2-api.herokuapp.com/socket.io/?EIO=3&transport=websocket",
      {
        headers: {
          Upgrade: "websocket",
          Origin: "https://ps2.nice.kiwi",
        },
      }
    );
    const ws = resp.webSocket;
    if (!ws) {
      throw new Error("kiwi: No websocket");
    }

    ws.accept();

    ws.addEventListener("message", async (e) => {
      let payload = e.data as string;
      if (payload.startsWith("42")) {
        ws.close();

        const [, data]: [string, KiwiResponse] = JSON.parse(payload.slice(2));
        await cache.put("kiwi", data);
        resolve(data);
      }
    });

    ws.send(`42["worlds-update-request"]`);
  });
};

export const kiwiFetchWorld = async (
  worldID: string,
  cache: Cache
): Promise<ServiceResponse<number, any>> => {
  const start = Date.now();
  const resp = await kiwiFetchAllWorlds(cache);
  const end = Date.now();

  const data = resp.find((w) => w.worldId === Number(worldID));

  if (!data) {
    throw new Error(`kiwi: World ${worldID} not found`);
  }

  return {
    population: {
      total: data.stats.population.total,
      nc: data.stats.population.nc,
      tr: data.stats.population.tr,
      vs: data.stats.population.vs,
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
