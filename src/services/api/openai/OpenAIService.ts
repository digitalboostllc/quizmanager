import OpenAI from "openai";
import { API_CONFIG } from "@/lib/config";
import { BaseApiService } from "../base/BaseApiService";
import { OpenAIError } from "../errors/ApiError";
import type { ChatCompletionOptions, ApiResponse } from "../types";

export class OpenAIService extends BaseApiService {
  private static instance: OpenAIService;
  private client: OpenAI;

  private constructor() {
    super();
    this.client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
      baseURL: "https://api.openai.com/v1",
    });
  }

  protected validateEnvironment(): void {
    if (!process.env.OPENAI_API_KEY) {
      throw new OpenAIError('OpenAI API key is not configured in environment variables');
    }
  }

  public static getInstance(): OpenAIService {
    if (!OpenAIService.instance) {
      OpenAIService.instance = new OpenAIService();
    }
    return OpenAIService.instance;
  }

  public async createChatCompletion(
    systemPrompt: string,
    userPrompt: string,
    options: ChatCompletionOptions = {}
  ): Promise<ApiResponse<string>> {
    return this.handleRequest(
      async () => {
        try {
          const completion = await this.retryRequest(
            async () => this.client.chat.completions.create({
              model: options.model || API_CONFIG.OPENAI.DEFAULT_MODEL,
              messages: [
                {
                  role: "system",
                  content: systemPrompt
                },
                {
                  role: "user",
                  content: userPrompt
                }
              ],
              max_tokens: options.maxTokens || API_CONFIG.OPENAI.MAX_TOKENS,
              temperature: options.temperature || API_CONFIG.OPENAI.DEFAULT_TEMPERATURE,
            })
          );

          const content = completion.choices[0]?.message?.content?.trim();
          if (!content) {
            throw new OpenAIError('No content generated from OpenAI');
          }

          return content;
        } catch (error) {
          if (error instanceof OpenAI.APIError) {
            throw new OpenAIError(error.message, {
              code: error.code,
              type: error.type,
              param: error.param
            });
          }
          throw error;
        }
      },
      'Failed to generate content with OpenAI'
    );
  }

  public async validateConnection(): Promise<ApiResponse<boolean>> {
    return this.handleRequest(
      async () => {
        try {
          const completion = await this.client.chat.completions.create({
            model: API_CONFIG.OPENAI.DEFAULT_MODEL,
            messages: [
              {
                role: "system",
                content: "You are a test assistant."
              },
              {
                role: "user",
                content: "Test connection.",
              }
            ],
            max_tokens: 10,
            temperature: 0,
          });

          return !!completion.choices[0]?.message?.content;
        } catch (error) {
          if (error instanceof OpenAI.APIError) {
            throw new OpenAIError('OpenAI connection test failed', {
              code: error.code,
              type: error.type,
              param: error.param
            });
          }
          throw error;
        }
      },
      'Failed to validate OpenAI connection'
    );
  }
} 