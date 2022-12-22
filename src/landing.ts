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
- https://ps2.nice.kiwi/

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
      "voidwell": 298,
      "kiwi": 281
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
          "kiwi": { ... }
        },
        "lastFetchTimes": {
          "saerro": "2020-10-10T00:00:00.000Z",
          "fisu": "2020-10-10T00:00:00.000Z",
          "honu": "2020-10-10T00:00:00.000Z",
          "voidwell": "2020-10-10T00:00:00.000Z"
          "kiwi": "2020-10-10T00:00:00.000Z"
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
        "voidwell": 298,
        "kiwi": 281
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
        "voidwell": 99,
        "kiwi": 97
      }
    }
  ]

  -- This also has a debug query parameter, but it's extremely verbose. It's good for debugging extreme async issues with the platform.

GET ~/flags - Get the current feature flags. These wiggle knobs that affect request timings, caching, and other things.

GET ~/health - Gets health of this and upstream services.

## Caching and usage limits

This service cached on a world basis for 3 minutes. Debug data is cached alongside world data too.`;

  return new Response(body, {
    headers: {
      "content-type": "text/plain",
    },
  });
};
