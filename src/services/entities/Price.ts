import type BaseEntity from "./BaseEntity";

export interface Price extends BaseEntity {
    price: number;
    effectiveFrom: string;
    effectiveTo: string;
}