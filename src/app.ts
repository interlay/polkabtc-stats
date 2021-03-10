import express, { Response as ExResponse, Request as ExRequest } from "express";
import swaggerUi from "swagger-ui-express";
import bodyParser from "body-parser";
import pino from "express-pino-logger";
import { RegisterRoutes } from "../build/routes";
import logFn from './common/logger'
import { VaultsController } from "./vaults/vaultDataController";

export const app = express();

app.use(pino({ logger: logFn() }))
app.use(
  bodyParser.urlencoded({
    extended: true,
  })
);
app.use(bodyParser.json());

app.use((_, res, next) => {
    res.append('Access-Control-Allow-Origin', ['*']);
    res.append('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
    res.append('Access-Control-Allow-Headers', 'Content-Type');
    next();
});

app.use("/docs", swaggerUi.serve, async (_req: ExRequest, res: ExResponse) => {
  return res.send(
    swaggerUi.generateHTML(await import("../build/swagger.json"))
  );
});

// application is alive
app.get("/health", (_, res) => {
  res.send('ok')
})

// ready to serve HTTP traffic
app.get("/ready", async (_, res) => {
  try {
    const vaults = await (new VaultsController()).getVaults(1)
    if (vaults.length > 0) {
      res.send('ok')
    }
  } catch (e) {
    res.status(500).json(e).send();
  }
})

RegisterRoutes(app);
