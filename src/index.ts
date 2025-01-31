import { Context, Keys, Schema, Tables } from 'koishi';
import { init, init_collection } from './init';
import { fetchEmbeddings } from './requests';
import {} from 'koishi-plugin-milvus';

export const name = 'milvus-insert';
export const inject = ['database', 'milvus', 'assets']


// 定义配置接口
export interface Config {
  // database
  table_name: string;
  // milvus
  db_name: string;
  collection_name: string;
  consistency_level: string;
  embeddingDimension: number;
  // embedding
  model: string;
  apiUrl: string;
  apiKey: string;
}

// 定义配置 Schema
export const Config: Schema<Config> = Schema.object({
  // database
  table_name: Schema.string()
    .default("sns_record")
    .required()
    .description("SQL数据库表名"),
  // milvus
  db_name: Schema.string()
    .default("default")
    .required()
    .description("Milvus 数据库的名称"),
  collection_name: Schema.string()
    .default("sns_record")
    .required()
    .description("Milvus 中的 Collection 名称"),
  consistency_level: Schema.string()
    .default("Eventually")
    .required()
    .description("Milvus 的一致性级别，请在 Strong,Bounded Staleness,Session,Eventually 中选择填写"),
  embeddingDimension: Schema.number()
    .default(1536)
    .min(1)
    .required()
    .description("向量的维度"),
  // embedding
  model: Schema.string()
    .required()
    .default('embedding-3')
    .description("Embedding 模型的名称"),
  apiUrl: Schema.string()
    .required()
    .default("https://open.bigmodel.cn/api/paas/v4/embeddings")
    .description("Embedding 模型提供商的 URL Endpoint"),
  apiKey: Schema.string()
    .required()
    .role("secret")
    .description("Embedding 模型的 API Key")
}).description("Milvus-Insert 插件配置");


export function apply(ctx: Context, config: Config) {
  ctx.on('message-created', async (session) => {
    ctx.logger.warn(session);
    try {
      // 获取消息内容
      const platform = session.event.platform;
      const userId = session.event.user.id;
      const messageElements = session.event.message.elements;

      const textContents: string[] = [];
      for (const element of messageElements) {
        switch (element.type) {
          case 'text': {
            textContents.push(element.attrs.content);
            break; 
          }
          case 'face': {
            textContents.push(`[emoji:${element.attrs.name}]`); // emoji:/doge
            break;
          }
          case 'video': {
            let fileUrl = element.attrs.src;
            let fileName = element.attrs.fileName;
            // 持久化存储
            let storage = await ctx.assets.upload(fileUrl,fileName);
            ctx.logger.debug(storage);
            textContents.push("[video:null]");
            break;
          }
          case 'audio': {
            let fileUrl = element.attrs.src;
            let fileName = element.attrs.fileName;
            // 持久化存储
            let storage = await ctx.assets.upload(fileUrl,fileName);
            ctx.logger.debug(storage);
            textContents.push("[audio:null]");
            break;
          }
          case 'img': {
            let fileUrl = element.attrs.src;
            let fileName = element.attrs.fileName;
            // 持久化存储
            let storage = await ctx.assets.upload(fileUrl,fileName);
            ctx.logger.debug(storage);
            textContents.push("[image:null]");
            break;
          }
        }
      };

      // 存储全部消息到数据库 
      let data = {
        create_time: Date.now(),
        platform: platform,
        userId: userId,
        textContent: textContents,
      }
      try {
        await ctx.database.create(config.table_name as any, data)
      }
      catch (error) {
        ctx.logger.debug(error)
        if (error.message === `cannot resolve table "${config.table_name}"`){
          init(config.table_name, ctx)
          await ctx.database.create(config.table_name as any, data)
        }
      }



      // 初始化 collection
      let result = await ctx.milvus.client.hasCollection({
        db_name: config.db_name,//'koishi',
        collection_name: config.collection_name,//'sns_record',
      })
      if (!result.value) {
        await init_collection(ctx, config);
      }
      
      // 调用异步函数进行向量生成
      const embedding = await fetchEmbeddings(ctx, {
        apiKey: config.apiKey,
        apiUrl: config.apiUrl,
        model: config.model,
        inputTexts: textContents,
        dimensions: config.embeddingDimension,
      });

      // // 处理嵌入结果，存储到Milvus
      let RowData = {
        vector: embedding,
        timestamp: Date.now(),
        content: textContents,
      }
      result = await ctx.milvus.client.insert({
        db_name: config.db_name,
        collection_name: config.collection_name,
        data: [RowData,],
      })
      if (result.status.code!=0){
        ctx.logger.error("insert error:", result.status);
      }else{
        ctx.logger.info("insert success:", result);
      }

    } catch (error) {
      ctx.logger.error('Error processing message:', error);
    }
    ctx.on("dispose", async ()=> {
      
    });
  });
}

