import { Context } from 'koishi';
declare module 'koishi' {
    interface Tables {
        schedule: SnsRecord;
    }
}
export interface SnsRecord {
    id: number;
    create_time: Date;
    platform: string;
    userId: string;
    guildId: string;
    textContent: string[];
}
export declare function init(sns_record: any, ctx: Context): void;
export declare function init_collection(ctx: Context, config: any): Promise<void>;
