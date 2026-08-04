import Anthropic from "@anthropic-ai/sdk";
import OpenAI from "openai";
import { GoogleGenerativeAI } from "@google/generative-ai";

export interface AIResponse {
  result: string;
}

function getRequiredEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

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

async function callOpenAI(config: {
  apiKey: string;
  baseURL: string;
  model: string;
  prompt: string;
}): Promise<AIResponse> {
  const client = new OpenAI({
    apiKey: config.apiKey,
    baseURL: config.baseURL,
  });

  const response = await client.chat.completions.create({
    model: config.model,
    messages: [{ role: "user", content: config.prompt }],
    max_tokens: 1024,
  });

  const content = response.choices[0]?.message?.content;
  if (!content) {
    throw new Error("No response content from OpenAI-compatible API");
  }

  return { result: content };
}

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

export async function callAI(prompt: string): Promise<AIResponse> {
  const provider = process.env.AI_PROVIDER?.toLowerCase() || "bailian";

  switch (provider) {
    case "bailian": {
      return callAnthropic({
        apiKey: getRequiredEnv("BAILIAN_API_KEY"),
        baseURL: process.env.BAILIAN_BASE_URL,
        model: process.env.BAILIAN_MODEL || "claude-3-5-sonnet-20241022",
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
