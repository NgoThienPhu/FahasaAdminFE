import type BaseEntity from "./BaseEntity";
import type { Category } from "./Category";
import type { Price } from "./Price";

export interface Book extends BaseEntity {
    title: string;
    description: string;
    author: string;
    publisher: string;
    isbn: string;
    category: Category;
    publishDate: string;
    price: Price;
}