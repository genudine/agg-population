import { Cache } from "./cache";
import { fisuFetchWorld } from "./sources/fisu";
import { honuFetchWorld } from "./sources/honu";
import { saerroFetchWorld } from "./sources/saerro";
import { sanctuaryFetchWorld } from "./sources/sanctuary";
import { voidwellFetchWorld } from "./sources/voidwell";
import { DebugPayload, Flags, OnePayload, ServiceResponse } from "./types";

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

  const [saerro, fisu, honu, voidwell, sanctuary] = await Promise.all([
    !flags.disableSaerro
      ? saerroFetchWorld(id, cache).catch((e) => {
          console.error("SAERRO ERROR:", e);
          return defaultServiceResponse;
        })
      : defaultServiceResponse,
    !flags.disableFisu
      ? fisuFetchWorld(id, cache, flags.fisuUsePS4EU).catch(
          () => defaultServiceResponse
        )
      : defaultServiceResponse,
    !flags.disableHonu
      ? honuFetchWorld(id, cache).catch(() => defaultServiceResponse)
      : defaultServiceResponse,
    !flags.disableVoidwell
      ? voidwellFetchWorld(id, cache, flags.voidwellUsePS4).catch(
          () => defaultServiceResponse
        )
      : defaultServiceResponse,
    !flags.disableSanctuary
      ? sanctuaryFetchWorld(id, cache).catch(() => defaultServiceResponse)
      : defaultServiceResponse,
  ]);

  const debug: DebugPayload = {
    raw: {
      saerro: saerro.raw,
      fisu: fisu.raw,
      honu: honu.raw,
      voidwell: voidwell.raw,
      sanctuary: sanctuary.raw,
    },
    timings: {
      saerro: saerro?.timings || null,
      fisu: fisu?.timings || null,
      honu: honu?.timings || null,
      voidwell: voidwell?.timings || null,
      sanctuary: sanctuary?.timings || null,
    },
    lastFetchTimes: {
      saerro: saerro.cachedAt,
      fisu: fisu.cachedAt,
      honu: honu.cachedAt,
      voidwell: voidwell.cachedAt,
      sanctuary: sanctuary.cachedAt,
    },
  };

  const totalPopulations = [
    saerro.population.total,
    fisu.population.total,
    honu.population.total,
    voidwell.population.total,
    sanctuary.population.total,
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
                sanctuary: 0,
              },
            },
      debug,
    });
  }

  const factionPopulations = [
    saerro.population,
    fisu.population,
    honu.population,
    sanctuary.population,
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
      sanctuary: sanctuary.population.total,
    },
  };

  return await cache.put(id, { world: payload, debug });
};
