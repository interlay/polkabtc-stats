import Big from "big.js";

export interface ParachainConstants {
    dustValue: number;
    btcConfirmations: number;
    issuePeriod: number;
    issueFee: Big;
    issueGriefingCollateral: Big;
    premiumRedeemFee: Big;
    vaultPunishmentFee: Big;
    secureCollateralThreshold: Big;
}
