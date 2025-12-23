import { RowDataPacket } from "mysql2";

const DEFINATION = `
CREATE TABLE "banner" (
    "id" int NOT NULL AUTO_INCREMENT,
    "image_en" varchar(1024) NOT NULL,
    "image_ar" varchar(1024) NOT NULL,
    "link" varchar(1024) NOT NULL,
    "start_timestamp" timestamp NOT NULL,
    "end_timestamp" timestamp NOT NULL,
    "created_timestamp" timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY ("id")
)
`

export interface Banner extends RowDataPacket {
    id: number;
    image_en: string;
    image_ar: string;
    link: string;
    start_timestamp: Date;
    end_timestamp: Date;
    created_timestamp: Date;
}
