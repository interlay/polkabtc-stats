import {getPolkaBtc} from "../common/polkaBtc";
import {ParachainConstants} from './constantsModel';
import Big from "big.js";

export const parachainConstants: Promise<ParachainConstants> = (async () => {
    const polkabtc = await getPolkaBtc();
    const [dustValue, btcConfirmations, issuePeriod, issueFee, issueGriefingCollateral, premiumRedeemFee, vaultPunishmentFee, secureCollateralThreshold] = await Promise.all([
        polkabtc.redeem.getDustValue(),
        polkabtc.btcRelay.getStableBitcoinConfirmations(),
        polkabtc.issue.getIssuePeriod(),
        polkabtc.issue.getFeeRate(),
        polkabtc.fee.getIssueGriefingCollateralRate(),
        polkabtc.redeem.getPremiumRedeemFee(),
        polkabtc.vaults.getPunishmentFee(),
        polkabtc.vaults.getSecureCollateralThreshold()
    ])
    return {
        dustValue: dustValue.toNumber(),
        btcConfirmations,
        issuePeriod,
        issueFee: new Big(issueFee.toString()), // polkabtc-js has an old incompatible Big.js
        issueGriefingCollateral: new Big(issueGriefingCollateral.toString()),
        premiumRedeemFee: new Big(premiumRedeemFee),
        vaultPunishmentFee: new Big(vaultPunishmentFee),
        secureCollateralThreshold: new Big(secureCollateralThreshold.toString())
    };
})();
