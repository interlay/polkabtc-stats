import { Entity, Column, PrimaryGeneratedColumn } from "typeorm";

@Entity()
export class ParachainEvents {

    @PrimaryGeneratedColumn()
    id: number;

    @Column("jsonb")
    data: object;

    @Column("integer")
    block_number: string;

    @Column("timestamp")
    block_ts: Date;

}