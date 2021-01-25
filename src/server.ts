import { app } from "./app";

const port = process.env.PORT || 3007;

app.listen(port, () =>
  console.log(`polkabtc-stats listening at http://localhost:${port}`)
);
