# PolkaBTC Stats API

A stats API wrapping a PostgreSQL database, to aggregate and make available historic data about PolkaBTC parachain operation.

## Usage

Ensure the proper environment variables for the PostgreSQL connection are set (`PGHOST`, `PGPORT`, `PGDATABASE`, `PGUSER`, `PGPASSWORD`). For client generation, ensure `java` is in the path.

```shell
yarn install
yarn build
yarn client
yarn dev
```
Then navigate to `localhost:3007/docs` for the SwaggerUI, or to the defined routes.

### For deployment
Run `yarn start` instead.

## Client

```shell
#yarn install, if necessary
yarn build
yarn client
```
This builds the client generated from the OpenAPI spec (which can then be published using `yarn publish`).

### Usage

```typescript
import * as polkabtcStats from "@interlay/polkabtc-stats";
const statsApi = new polkabtcStats.StatsApi(new polkabtcStats.Configuration({ basePath: "http://localhost:3001" }));
const issues = (await statsApi.getTotalSuccessfulIssues()).data;
```

Autogenerated paths
---
`src/` is the only directory containing hand-written code. Do not edit files in the other directories.

* `build/` contains the OpenAPI server (including the json definition and the routes to be served), generated from the definitons in `src`. Generated using `yarn build`.
* `client/` contains the generated typescript client, as an intermediate step in packaging the client.
* `dist/` contains the compiled client, publishable as an npm package. Generated (alongside `client/`) using `yarn client`.
