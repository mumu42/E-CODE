/**
 * @file lib/ai/provider.ts
 * @description AI 服务商统一封装（Anthropic / OpenAI / Gemini）
 * @author English Agent Team
 * @date 2026-08-07
 */

import Anthropic from "@anthropic-ai/sdk";
import { GoogleGenerativeAI } from "@google/generative-ai";

/** AI 调用结果 */
export interface AIResponse {
  /** AI 返回的文本结果 */
  result: string;
}

/**
 * 获取必填环境变量
 * @param name - 环境变量名
 * @returns 环境变量值
 * @throws 当环境变量未设置时抛出错误
 */
function getRequiredEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

/**
 * 调用 Anthropic 兼容接口
 * @param config - 调用配置
 * @returns AI 响应
 */
async function callAnthropic(config: {
  apiKey: string;
  baseURL?: string;
  model: string;
  prompt: string;
}): Promise<AIResponse> {
  const client = new Anthropic({
    apiKey: config.apiKey,
    baseURL: config.baseURL,
  });

  const response = await client.messages.create({
    model: config.model,
    max_tokens: 1024,
    messages: [{ role: "user", content: config.prompt }],
  });

  const content = response.content.find((c) => c.type === "text");
  if (!content || content.type !== "text") {
    throw new Error("No text response from Anthropic-compatible API");
  }

  return { result: content.text };
}

/**
 * 调用 OpenAI 兼容接口
 * @param config - 调用配置
 * @returns AI 响应
 */
async function callOpenAI(config: {
  apiKey: string;
  baseURL: string;
  model: string;
  prompt: string;
}): Promise<AIResponse> {
  const baseURL = config.baseURL.replace(/\/$/, "");
  const url = `${baseURL}/v1/chat/completions`;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${config.apiKey}`,
    },
    body: JSON.stringify({
      model: config.model,
      messages: [{ role: "user", content: config.prompt }],
      max_tokens: 1024,
    }),
  });

  if (!response.ok) {
    const text = await response.text().catch(() => "no body");
    throw new Error(`${response.status} status code (${text})`);
  }

  const data = (await response.json()) as {
    choices?: { message?: { content?: string } }[];
  };
  const content = data.choices?.[0]?.message?.content;
  if (!content) {
    throw new Error("No response content from OpenAI-compatible API");
  }

  return { result: content };
}

/**
 * 调用 Gemini 接口
 * @param config - 调用配置
 * @returns AI 响应
 */
async function callGemini(config: {
  apiKey: string;
  model: string;
  prompt: string;
}): Promise<AIResponse> {
  const client = new GoogleGenerativeAI(config.apiKey);
  const model = client.getGenerativeModel({ model: config.model });

  const result = await model.generateContent(config.prompt);
  const text = result.response.text();

  if (!text) {
    throw new Error("No response content from Gemini API");
  }

  return { result: text };
}

/**
 * 统一调用 AI 服务
 * @param prompt - 提示词
 * @returns AI 响应
 * @example
 * ```ts
 * const { result } = await callAI("请翻译这句话");
 * ```
 */
export async function callAI(prompt: string): Promise<AIResponse> {
  const provider = process.env.AI_PROVIDER?.toLowerCase() || "bailian";

  switch (provider) {
    case "bailian": {
      return callOpenAI({
        apiKey: getRequiredEnv("BAILIAN_API_KEY"),
        baseURL: process.env.BAILIAN_BASE_URL || "https://cloud-ai-model.rd.ubtrobot.com/",
        model: process.env.BAILIAN_MODEL || "kimi-k2.7-code",
        prompt,
      });
    }

    case "claude": {
      return callAnthropic({
        apiKey: getRequiredEnv("CLAUDE_API_KEY"),
        baseURL: "https://api.anthropic.com",
        model: process.env.CLAUDE_MODEL || "claude-3-5-sonnet-20241022",
        prompt,
      });
    }

    case "deepseek": {
      return callOpenAI({
        apiKey: getRequiredEnv("DEEPSEEK_API_KEY"),
        baseURL: process.env.DEEPSEEK_BASE_URL || "https://api.deepseek.com",
        model: process.env.DEEPSEEK_MODEL || "deepseek-chat",
        prompt,
      });
    }

    case "kimi": {
      return callOpenAI({
        apiKey: getRequiredEnv("KIMI_API_KEY"),
        baseURL: process.env.KIMI_BASE_URL || "https://api.moonshot.cn",
        model: process.env.KIMI_MODEL || "moonshot-v1-8k",
        prompt,
      });
    }

    case "glm": {
      return callOpenAI({
        apiKey: getRequiredEnv("GLM_API_KEY"),
        baseURL: process.env.GLM_BASE_URL || "https://open.bigmodel.cn/api/paas/v4",
        model: process.env.GLM_MODEL || "glm-4",
        prompt,
      });
    }

    case "gemini": {
      return callGemini({
        apiKey: getRequiredEnv("GEMINI_API_KEY"),
        model: process.env.GEMINI_MODEL || "gemini-1.5-flash",
        prompt,
      });
    }

    case "gpt": {
      return callOpenAI({
        apiKey: getRequiredEnv("OPENAI_API_KEY"),
        baseURL: process.env.OPENAI_BASE_URL || "https://api.openai.com/v1",
        model: process.env.OPENAI_MODEL || "gpt-4o-mini",
        prompt,
      });
    }

    default:
      throw new Error(`Unknown AI provider: ${provider}`);
  }
}
