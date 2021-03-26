export interface OracleStatus {
    id: string;
    source: string;
    feed: string;
    lastUpdate: Date;
    exchangeRate: string;
    online: boolean;
};
