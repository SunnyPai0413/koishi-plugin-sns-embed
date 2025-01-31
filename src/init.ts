import { Context } from 'koishi';
import { DataType } from '@zilliz/milvus2-sdk-node';

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

export function init(sns_record, ctx: Context){
    ctx.model.extend(sns_record, {
        id: 'unsigned(8)',
        create_time: 'timestamp',
        platform: 'char(32)',
        userId: 'char(64)',
        guildId: 'char(64)',
        textContent: 'list',
    }, {
        primary: 'id',
        autoInc: true,
    });
}


export async function init_collection(ctx: Context, config: any) {
  const createResult = await ctx.milvus.client.createCollection({
    collection_name: config.collection_name,
    consistency_level: config.consistency_level,//"Eventually",
    description: "Collection for storing SNS chat records",
    enableDynamicField: true,
    schema: [
      {
        name: "id",
        description: "Unique ID of the chat record",
        data_type: DataType.Int64,
        autoID: true,
        is_primary_key: true,
      },
      {
        name: "vector",
        description: "Chat record embedding vector",
        data_type: DataType.FloatVector,
        type_params: {
          dim: config.embeddingDimension.toString(),
        },
      },
      {
        name: "timestamp",
        description: "Timestamp of the chat record",
        data_type: DataType.Int64,
      },
      {
        name: "content",
        description: "Original content of the chat record",
        data_type: DataType.VarChar,
        type_params: {
          max_length: "65535",
        },
      }
    ],
    timeout: config.timeout,
  });
  ctx.logger.info(createResult);
}
