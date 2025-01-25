import { Context } from "koishi";

export interface Embedding {
  apiKey: string;
  apiUrl: string;
  model: string;
  inputTexts: string[];
  dimensions: number;
}

// 调用Embedding API
export async function fetchEmbeddings(ctx: Context, config: Embedding) {
    const url = config.apiUrl;
    
    // 构建请求数据
    const requestData = {
        model: config.model,
        input: config.inputTexts,
    };

    // 如果指定了维度，添加到请求数据中
    if (config.dimensions) {
        requestData['dimensions'] = config.dimensions;
    }

    try {
        // 发送 POST 请求
        const response = await ctx.http.post(url, requestData, {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${config.apiKey}`  // 使用 Bearer token 进行认证
            }
        });
        return response.data[0].embedding;
    } catch (error) {
        ctx.logger.error("Error fetching embeddings:", error);
        return false;
    }
}


