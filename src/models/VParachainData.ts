import { ViewEntity, ViewColumn } from "typeorm";

@ViewEntity({
    expression: `
        SELECT parachain_events.block_number,
        parachain_events.block_ts,
        (parachain_events.data ->> 'section'::text) AS section,
        (parachain_events.data ->> 'method'::text) AS method,
        (parachain_events.data -> 'data'::text) AS event_data
        FROM parachain_events;
    `
})
export class VParachainData {

    @ViewColumn()
    block_number: number;

    @ViewColumn()
    block_ts: string;

    @ViewColumn()
    section: string;

    @ViewColumn()
    method: string;

    @ViewColumn()
    event_data: string;

}