import { app } from "./app";

const port = process.env.PORT || 3000;

app.listen(port, () =>
  console.log(`polkabtc-stats listening at http://localhost:${port}`)
);
