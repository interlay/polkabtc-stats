export interface StatusUpdate {
    id: string;
    timestamp: string;
    proposedStatus: string;
    previousStatus: string;
    addError: string;
    removeError: string;
    btc_block_hash: string;
    yeas: number;
    nays: number;
    executed: boolean;
    rejected: boolean;
    forced: boolean;
};
