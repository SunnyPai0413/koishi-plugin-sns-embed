# koishi-plugin-sns-embed

[![npm](https://img.shields.io/npm/v/koishi-plugin-sns-embed?style=flat-square)](https://www.npmjs.com/package/koishi-plugin-sns-embed)

This is a plugin for Koishi that stroages SNS message records and create vectorized embeddings.

---

## Features | Todo List

- [✅] Dump all SNS messages to database. SQLite as default, MySQL supported.
- [❌] Store more Metadata for SNS messages so that we can use them in complicated RAG callback rules.
- [✅] Store MultiModal messages (Image, Video, Audio, etc.) to koishi assets. Local storage as default, S3 compatible or others not tested yet.
- [❌] More OSS provider support. Alibaba Cloud, Tencent Cloud, Cloudflare R2, etc.
- [❌] Use ASR model, VLM model, optical flow, etc. for MultiModal semantic understanding. Create vectorized embeddings for MultiModal messages. This is for further RAG callback.
- [✅] Create vectorized embeddings with OpenAI compatible API for SNS messages. Only Zhipu API is tested now.
- [✅] Store vectorized embeddings to vector database. Only Milvus is supported now.
- [❌] Create more RAG callback rules and NLP models workflow for message reply. Prompt engineering nessitates in this step.
- [❌] Cluster deployment parameters for Database, Vector Database, Object Storage, etc.

---

## Configuration Parameters


| Category          | Field            | Description                                            |
|--------------------|-------------------|---------------------------------------------------------|
| Database          | `table_name`      | Table name for SQL Database.                             |
| Milvus            | `db_name`         | DB name for Milvus. Only set as "default" can create collection automatically. Otherwise, you need to create collection manually. |
| Milvus            | `collection_name`  | Collection name for Milvus.                              |
| Milvus            | `consistency_level` | Consistency level for Milvus. Select one of "Strong", "Bounded Staleness", "Session", "Eventually". This parameter is only effective in cluster deployment. |
| Milvus/Embedding  | `embeddingDimension` | Embedding dimension for vectorized embeddings and vector database. |
| Embedding         | `model`            | Embedding model name.                                    |
| Embedding         | `apiUrl`           | API URL for embedding model. Including endpoint.          |
| Embedding         | `apiKey`            | API Key for embedding model.                             |

### Example Configuration

| Field        | Parameters                                      |
|-------------|--------------------------------------------------|
| `table_name` | `sns_record`                                    |
| `db_name`    | `default`                                       |
| `collection_name`   | `sns_record`                                    |
| `consistency_level` | `Eventually`                                    |
| `embeddingDimension`| `1536`                                          |
| `model`   | `embedding-3`                                    |
| `apiUrl`  | `https://open.bigmodel.cn/api/paas/v4/embeddings` |
| `apiKey`  | `your_api_key_here`                               |