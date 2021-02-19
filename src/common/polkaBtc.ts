import { createPolkabtcAPI, PolkaBTCAPI } from "@interlay/polkabtc";
import { BTC_NETWORK, ENDPOINT_URL } from "./constants";

let polkabtc: PolkaBTCAPI | Promise<PolkaBTCAPI> | undefined;

export const getPolkaBtc: () => Promise<PolkaBTCAPI> = async () => {
    if (polkabtc === undefined) polkabtc = createPolkabtcAPI(ENDPOINT_URL, BTC_NETWORK);
    return polkabtc;
}
