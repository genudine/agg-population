# https://agg.ps2.live/population

A Planetside 2 population aggreggation API between

- https://ps2.fisu.pw
- https://wt.honu.pw
- https://saerro.ps2.live
- https://voidwell.com
- https://ps2.nice.kiwi

Has some jank filters and will average between all 4 sources with as much data as can be used.

If you have a population API to add to this aggreggator, open an issue with your API details. The more sources, the merrier, but we usually need to make some performance considerations.

This API is hosted on Cloudflare Workers, and makes use of aggressive caching with a 3 minute TTL.

Need help? Talk to us on the [Planetside Community Developers Discord](https://discord.gg/yVzGEg3RKV) in `#ps2live`

## API

- [/$worldID](https://agg.ps2.live/population/1) - Single world
- [/all](https://agg.ps2.live/population/all) - All worlds at once
- [~/flags](https://agg.ps2.live/population~/flags) - Feature flags that help limit useless requests and add speed.
- [~/health](https://agg.ps2.live/population~/health) - Tests reachability

## Developing

```
npm install

npm start
```
