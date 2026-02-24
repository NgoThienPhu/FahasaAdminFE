import type BaseEntity from "./BaseEntity";
import type { Category } from "./Category";
import type { Price } from "./Price";
import type { Image } from "./Image";

export interface Book extends BaseEntity {
    title: string;
    description: string;
    author: string;
    publisher: string;
    isbn: string;
    category: Category;
    publishDate: string;
    price: Price;
    images: Image[];
}