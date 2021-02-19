import { Column, Entity, PrimaryColumn } from "typeorm";
import {RequestType} from "../common/btcTxUtils";

@Entity()
export class RequestTxCache {
    @PrimaryColumn()
    id: string;

    @PrimaryColumn()
    request_type: RequestType;

    @Column({
        length: 64,
    })
    txid: string;

    @Column()
    block_height: number;

    @Column()
    confirmations: number;
}
