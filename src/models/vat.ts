import { RowDataPacket } from "mysql2";


const DEFINATION = `
CREATE TABLE vat (
  "id" int NOT NULL,
  "vat_percentage" decimal(10,2) NOT NULL DEFAULT '0.00',
  PRIMARY KEY (id)
)
`

export interface Vat extends RowDataPacket {
    id: number;
    vat_percentage: string;
}