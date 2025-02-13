import { Context, Schema } from 'koishi';
export declare const name = "milvus-insert";
export declare const inject: string[];
export interface Config {
    table_name: string;
    db_name: string;
    collection_name: string;
    consistency_level: string;
    embeddingDimension: number;
    model: string;
    apiUrl: string;
    apiKey: string;
}
export declare const Config: Schema<Config>;
export declare function apply(ctx: Context, config: Config): void;
