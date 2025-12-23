import { RowDataPacket } from "mysql2";

const DEFINATION = `
CREATE TABLE "branch" (
    "id" int NOT NULL AUTO_INCREMENT,
    "name_ar" VARCHAR(1024) NOT NULL,
    "name_en" VARCHAR(1024) NOT NULL,
    "city_en" TEXT NOT NULL,
    "city_ar" TEXT NOT NULL,
    "latitude" DECIMAL(10,8) NOT NULL,
    "longitude" DECIMAL(11,8) NOT NULL,
    PRIMARY KEY ("id")
)
`

export interface Branch  {
    id: number;
    name_ar: string;
    name_en: string;
    city_en: string;
    city_ar: string;
    latitude: number;
    longitude: number;
}

export interface BranchRow extends RowDataPacket, Branch {}
