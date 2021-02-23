import { Connection, createConnection } from "typeorm";

import { ParachainEvents } from "../models/ParachainEvents";
import { VParachainData } from "../models/VParachainData";
import { VParachainDataCancelIssue } from "../models/VParachainDataCancelIssue";
import { VParachainDataRequestIssue } from "../models/VParachainDataRequestIssue";
import { VParachainCanceledIssues } from "../models/VParachainCanceledIssues";
import { VParachainCollateralLock } from "../models/VParachainCollateralLock";
import { VParachainCollateralRelease } from "../models/VParachainCollateralRelease";
import { VParachainCollateralSlash } from "../models/VParachainCollateralSlash";
import { VParachainDataExecuteIssue } from "../models/VParachainDataExecuteIssue";
import { VParachainExecutedIssues } from "../models/VParachainExecutedIssues";
import { VParachainVaultIssueRedeem } from "../models/VParachainVaultIssueRedeem";
import { VParachainVaultRegistration } from "../models/VParachainVaultRegistration";
import { VParachainVaultSummary } from "../models/VParachainVaultSummary";
import { VParachainRedeemCancel } from "../models/VParachainRedeemCancel";
import { VParachainRedeemExecute } from "../models/VParachainRedeemExecute";
import { VParachainRedeemRequest } from "../models/VParachainRedeemRequest";
import { VParachainStakedrelayerRegister } from "../models/VParachainStakedrelayerRegister";
import { VParachainStakedrelayerDeregister } from "../models/VParachainStakedrelayerDeregister";
import { VParachainStatusSuggest } from "../models/VParachainStatusSuggest";
import { VParachainStatusVote } from "../models/VParachainStatusVote";
import { VParachainStatusReject } from "../models/VParachainStatusReject";
import { VParachainStatusForce } from "../models/VParachainStatusForce";
import { VParachainStatusExecute } from "../models/VParachainStatusExecute";
import { VParachainStakedrelayerSlash } from "../models/VParachainStakedrelayerSlash";
import { RequestTxCache } from "../models/RequestTxCache";

let conn: Connection | Promise<Connection> | undefined;

export const getTypeORMConnection: () => Promise<Connection> = async () => {
    if (conn === undefined) {
        conn = createConnection({
            type: "postgres",
            host: process.env.PGHOST,
            port: parseInt(process.env.PGPORT || "5432"),
            username: process.env.PGUSER,
            password: process.env.PGPASSWORD,
            database: process.env.PGDATABASE,
            synchronize: true,
            ssl: true,
            extra: { ssl: { rejectUnauthorized: false } },
            logging: false,
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
                VParachainVaultRegistration,
                VParachainVaultSummary,
                VParachainStakedrelayerDeregister,
                VParachainStakedrelayerRegister,
                VParachainStakedrelayerSlash,
                VParachainRedeemRequest,
                VParachainRedeemExecute,
                VParachainRedeemCancel,
                VParachainStatusSuggest,
                VParachainStatusVote,
                VParachainStatusExecute,
                VParachainStatusReject,
                VParachainStatusForce,
                RequestTxCache,
            ],
        });
    }
    return conn;
}
