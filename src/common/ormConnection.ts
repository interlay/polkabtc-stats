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
import { ENABLE_PG_SSL, SYNC_DB_SCHEMA, PGREPLICAHOST } from "./constants";

const connectionPromise: Promise<Connection> = createConnection({
    name: 'default',
    type: "postgres",
    synchronize: SYNC_DB_SCHEMA,
    extra: ENABLE_PG_SSL ? { ssl: { rejectUnauthorized: false } } : {},
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

// create connection to the read-only replica
createConnection({
    name: "pg_replica",
    type: "postgres",
    host: PGREPLICAHOST,
    synchronize: false,
    extra: ENABLE_PG_SSL ? { ssl: { rejectUnauthorized: false } } : {},
    logging: ["error"],
    maxQueryExecutionTime: 1000
})


export const getTypeORMConnection: () => Promise<Connection> = async () => {
    await connectionPromise; // make sure promise is resolved to prevent race condition
    return getConnection('default');
};
