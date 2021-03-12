export interface ParachainStatusUpdate {
    id: string;
    timestamp: string;
    proposedStatus: string;
    addError: string;
    removeError: string;
    btc_block_hash: string;
    yeas: number;
    nays: number;
    executed: boolean;
    rejected: boolean;
    forced: boolean;
}

export interface ParachainStats {
    totalStakedRelayers: number;
    totalUpdateProposals: number;
    declined: {
        count: number;
        fractionOfTotal: number;
    };
    passed: {
        count: number;
        fractionOfTotal: number;
    };
}
