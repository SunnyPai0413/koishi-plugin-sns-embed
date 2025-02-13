import { Context } from "koishi";
export interface Embedding {
    apiKey: string;
    apiUrl: string;
    model: string;
    inputTexts: string[];
    dimensions: number;
}
export declare function fetchEmbeddings(ctx: Context, config: Embedding): Promise<any>;
