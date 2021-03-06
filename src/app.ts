import express, { Response as ExResponse, Request as ExRequest } from "express";
import swaggerUi from "swagger-ui-express";
import bodyParser from "body-parser";
import pino from "express-pino-logger";
import { RegisterRoutes } from "../build/routes";
import logFn from './common/logger'
import { totalRelayedBlocks } from "./relayBlocks/blockService";

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
    const count = await totalRelayedBlocks()
    if (count.gte(0)) {
      res.send('ok')
    }
  } catch (e) {
    res.status(500).json(e).send();
  }
})

RegisterRoutes(app);
