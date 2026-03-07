import type BaseEntity from "./BaseEntity";

interface BookImage extends BaseEntity {
    url: string;
    isPrimary: boolean;
}

export type { BookImage };