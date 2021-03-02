import { Connection, createConnection, getConnection } from "typeorm";

import {
    ParachainEvents,
    VParachainData,
    VParachainDataCancelIssue,
    VParachainDataRequestIssue,
    VParachainCanceledIssues,
    VParachainCollateralLock,
    VParachainCollateralRelease,
    VParachainCollateralSlash,
    VParachainDataExecuteIssue,
    VParachainExecutedIssues,
    VParachainVaultCollateral,
    VParachainVaultIssueRedeem,
    VParachainVaultRegistration,
    VParachainRedeemCancel,
    VParachainRedeemExecute,
    VParachainRedeemRequest,
    VParachainStakedrelayerRegister,
    VParachainStakedrelayerDeregister,
    VParachainStatusSuggest,
    VParachainStatusVote,
    VParachainStatusReject,
    VParachainStatusForce,
    VParachainStatusExecute,
    VParachainStakedrelayerSlash,
    VParachainStakedrelayerStore,
    VParachainRefundRequest,
    VParachainRefundExecute,
    RequestTxCache,
    VParachainVaultSlaUpdate,
    VParachainStakedrelayerSlaUpdate,
} from "../models/";

createConnection({
    name: 'default',
    type: "postgres",
    //synchronize: false, // call synchronize() explicitly when the app starts
    extra: { ssl: { rejectUnauthorized: false } },
    logging: ["error"],
    maxQueryExecutionTime: 1000,
    entities: [
        ParachainEvents,
        VParachainData,
        VParachainDataCancelIssue,
        VParachainDataRequestIssue,
        VParachainCanceledIssues,
        VParachainCollateralLock,
        VParachainCollateralRelease,
        VParachainCollateralSlash,
        VParachainDataExecuteIssue,
        VParachainExecutedIssues,
        VParachainVaultIssueRedeem,
        VParachainVaultSlaUpdate,
        VParachainVaultCollateral,
        VParachainVaultRegistration,
        VParachainStakedrelayerDeregister,
        VParachainStakedrelayerRegister,
        VParachainStakedrelayerSlash,
        VParachainStakedrelayerSlaUpdate,
        VParachainStakedrelayerStore,
        VParachainRedeemRequest,
        VParachainRedeemExecute,
        VParachainRedeemCancel,
        VParachainStatusSuggest,
        VParachainStatusVote,
        VParachainStatusExecute,
        VParachainStatusReject,
        VParachainStatusForce,
        VParachainRefundRequest,
        VParachainRefundExecute,
        RequestTxCache,
    ],
})

export const getTypeORMConnection: () => Promise<Connection> = async () => {
    return getConnection('default');
};
