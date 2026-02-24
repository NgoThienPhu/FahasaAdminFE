import type BaseEntity from "./BaseEntity";

export interface Image extends BaseEntity {
    url: string;
    isPrimary: boolean;
}