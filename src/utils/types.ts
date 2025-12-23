import { RowDataPacket } from "mysql2/promise";

export type Vote = "UP" | "DOWN"


export interface ExplainRow extends RowDataPacket {
    id: number;
    select_type: string;
    table: string;
    partitions: string;
    type: string;
    possible_keys: string;
    key: string;
    key_len: string;
    ref: string;
    rows: number;
    filtered: number;
    Extra: string;
  }
  