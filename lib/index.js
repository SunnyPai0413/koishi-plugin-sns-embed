var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });
var __export = (target, all) => {
  for (var name2 in all)
    __defProp(target, name2, { get: all[name2], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/index.ts
var src_exports = {};
__export(src_exports, {
  Config: () => Config,
  apply: () => apply,
  inject: () => inject,
  name: () => name
});
module.exports = __toCommonJS(src_exports);
var import_koishi = require("koishi");

// src/init.ts
var import_milvus2_sdk_node = require("@zilliz/milvus2-sdk-node");
function init(sns_record, ctx) {
  ctx.model.extend(sns_record, {
    id: "unsigned(8)",
    create_time: "timestamp",
    platform: "char(32)",
    userId: "char(64)",
    guildId: "char(64)",
    textContent: "list"
  }, {
    primary: "id",
    autoInc: true
  });
}
__name(init, "init");
async function init_collection(ctx, config) {
  const createResult = await ctx.milvus.client.createCollection({
    collection_name: config.collection_name,
    consistency_level: config.consistency_level,
    //"Eventually",
    description: "Collection for storing SNS chat records",
    enableDynamicField: true,
    schema: [
      {
        name: "id",
        description: "Unique ID of the chat record",
        data_type: import_milvus2_sdk_node.DataType.Int64,
        autoID: true,
        is_primary_key: true
      },
      {
        name: "vector",
        description: "Chat record embedding vector",
        data_type: import_milvus2_sdk_node.DataType.FloatVector,
        type_params: {
          dim: config.embeddingDimension.toString()
        }
      },
      {
        name: "timestamp",
        description: "Timestamp of the chat record",
        data_type: import_milvus2_sdk_node.DataType.Int64
      },
      {
        name: "content",
        description: "Original content of the chat record",
        data_type: import_milvus2_sdk_node.DataType.VarChar,
        type_params: {
          max_length: "65535"
        }
      }
    ],
    timeout: config.timeout
  });
  ctx.logger.info(createResult);
}
__name(init_collection, "init_collection");

// src/requests.ts
async function fetchEmbeddings(ctx, config) {
  const url = config.apiUrl;
  const requestData = {
    model: config.model,
    input: config.inputTexts
  };
  if (config.dimensions) {
    requestData["dimensions"] = config.dimensions;
  }
  try {
    const response = await ctx.http.post(url, requestData, {
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${config.apiKey}`
        // 使用 Bearer token 进行认证
      }
    });
    return response.data[0].embedding;
  } catch (error) {
    ctx.logger.error("Error fetching embeddings:", error);
    return false;
  }
}
__name(fetchEmbeddings, "fetchEmbeddings");

// src/index.ts
var name = "milvus-insert";
var inject = ["database", "milvus", "assets"];
var Config = import_koishi.Schema.object({
  // database
  table_name: import_koishi.Schema.string().default("sns_record").description("SQL数据库表名"),
  // milvus
  db_name: import_koishi.Schema.string().default("default").description("Milvus 数据库的名称"),
  collection_name: import_koishi.Schema.string().default("sns_record").description("Milvus 中的 Collection 名称"),
  consistency_level: import_koishi.Schema.string().default("Eventually").description("Milvus 的一致性级别，请在 Strong,Bounded Staleness,Session,Eventually 中选择填写"),
  embeddingDimension: import_koishi.Schema.number().default(1536).min(1).description("向量的维度"),
  // embedding
  model: import_koishi.Schema.string().default("embedding-3").description("Embedding 模型的名称"),
  apiUrl: import_koishi.Schema.string().default("https://open.bigmodel.cn/api/paas/v4/embeddings").description("Embedding 模型提供商的 URL Endpoint"),
  apiKey: import_koishi.Schema.string().required().role("secret").description("Embedding 模型的 API Key")
}).description("Milvus-Insert 插件配置");
function apply(ctx, config) {
  ctx.on("message-created", async (session) => {
    try {
      const platform = session.event.platform;
      const userId = session.event.user.id;
      const messageElements = session.event.message.elements;
      const guildId = session.event.guild;
      const textContents = [];
      for (const element of messageElements) {
        switch (element.type) {
          case "text": {
            textContents.push(element.attrs.content);
            break;
          }
          case "face": {
            textContents.push(`[emoji:${element.attrs.name}]`);
            break;
          }
          case "video": {
            let fileUrl = element.attrs.src;
            let fileName = element.attrs.fileName;
            let storage = await ctx.assets.upload(fileUrl, fileName);
            ctx.logger.debug(storage);
            textContents.push("[video:null]");
            break;
          }
          case "audio": {
            let fileUrl = element.attrs.src;
            let fileName = element.attrs.fileName;
            let storage = await ctx.assets.upload(fileUrl, fileName);
            ctx.logger.debug(storage);
            textContents.push("[audio:null]");
            break;
          }
          case "img": {
            let fileUrl = element.attrs.src;
            let fileName = element.attrs.fileName;
            let storage = await ctx.assets.upload(fileUrl, fileName);
            ctx.logger.debug(storage);
            textContents.push("[image:null]");
            break;
          }
        }
      }
      ;
      let data = {
        create_time: Date.now(),
        platform,
        userId,
        guildId,
        textContent: textContents
      };
      try {
        await ctx.database.create(config.table_name, data);
      } catch (error) {
        ctx.logger.debug(error);
        if (error.message === `cannot resolve table "${config.table_name}"`) {
          init(config.table_name, ctx);
          await ctx.database.create(config.table_name, data);
        }
      }
      let colresult = await ctx.milvus.client.hasCollection({
        db_name: config.db_name,
        //'koishi',
        collection_name: config.collection_name
        //'sns_record',
      });
      if (!colresult.value) {
        await init_collection(ctx, config);
      }
      const embedding = await fetchEmbeddings(ctx, {
        apiKey: config.apiKey,
        apiUrl: config.apiUrl,
        model: config.model,
        inputTexts: textContents,
        dimensions: config.embeddingDimension
      });
      let RowData = {
        vector: embedding,
        timestamp: Date.now(),
        content: textContents
      };
      let embedresult = await ctx.milvus.client.insert({
        db_name: config.db_name,
        collection_name: config.collection_name,
        data: [RowData]
      });
      if (embedresult.status.code != 0) {
        ctx.logger.error("insert error:", embedresult.status);
      } else {
        ctx.logger.info("insert success:", embedresult);
      }
    } catch (error) {
      ctx.logger.error("Error processing message:", error);
    }
    ctx.on("dispose", async () => {
    });
  });
}
__name(apply, "apply");
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  Config,
  apply,
  inject,
  name
});
