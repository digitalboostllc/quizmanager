import axios from 'axios';
import { FACEBOOK_SETTINGS } from '@/lib/config';
import { BaseApiService } from '../base/BaseApiService';
import { FacebookError } from '../errors/ApiError';
import type { FacebookPostOptions, FacebookPostResponse, ApiResponse } from '../types';

export class FacebookService extends BaseApiService {
  private static instance: FacebookService;
  private accessToken: string;

  private constructor() {
    super();
    this.accessToken = process.env.FACEBOOK_ACCESS_TOKEN!;
  }

  protected validateEnvironment(): void {
    if (!process.env.FACEBOOK_ACCESS_TOKEN) {
      throw new FacebookError('Facebook access token is not configured');
    }
  }

  public static getInstance(): FacebookService {
    if (!FacebookService.instance) {
      FacebookService.instance = new FacebookService();
    }
    return FacebookService.instance;
  }

  public async createPost(options: FacebookPostOptions): Promise<ApiResponse<FacebookPostResponse>> {
    return this.handleRequest(
      async () => {
        // Validate message length
        if (options.message && options.message.length > FACEBOOK_SETTINGS.MAX_POST_LENGTH) {
          throw new FacebookError('Message exceeds maximum length');
        }

        const postData: {
          access_token: string;
          message?: string;
          url?: string;
          scheduled_publish_time?: number;
          published?: boolean;
        } = {
          access_token: this.accessToken,
        };

        // Add message if provided
        if (options.message) {
          postData.message = options.message;
        }

        // Add image if provided
        if (options.imageUrl) {
          postData.url = options.imageUrl;
        }

        // Add scheduling if provided
        if (options.scheduledPublishTime) {
          postData.scheduled_publish_time = options.scheduledPublishTime;
          postData.published = false;
        }

        try {
          const response = await this.retryRequest(
            () => axios.post(
              `https://graph.facebook.com/v18.0/${options.pageId}/photos`,
              postData
            )
          );

          return {
            id: response.data.id,
            postUrl: `https://facebook.com/${response.data.id}`
          };
        } catch (error) {
          if (axios.isAxiosError(error) && error.response) {
            throw new FacebookError(
              error.response.data?.error?.message || 'Failed to create Facebook post',
              error.response.data
            );
          }
          throw error;
        }
      },
      'Failed to create Facebook post'
    );
  }

  public async deletePost(postId: string): Promise<ApiResponse<boolean>> {
    return this.handleRequest(
      async () => {
        await this.retryRequest(
          () => axios.delete(
            `https://graph.facebook.com/v18.0/${postId}`,
            {
              params: {
                access_token: this.accessToken
              }
            }
          )
        );
        return true;
      },
      'Failed to delete Facebook post'
    );
  }

  public async validateAccessToken(): Promise<ApiResponse<boolean>> {
    return this.handleRequest(
      async () => {
        try {
          const response = await this.retryRequest(
            () => axios.get(
              'https://graph.facebook.com/v18.0/debug_token',
              {
                params: {
                  input_token: this.accessToken,
                  access_token: this.accessToken
                }
              }
            )
          );
          return response.data.data.is_valid === true;
        } catch (error) {
          if (axios.isAxiosError(error) && error.response) {
            throw new FacebookError(
              error.response.data?.error?.message || 'Failed to validate access token',
              error.response.data
            );
          }
          throw error;
        }
      },
      'Failed to validate Facebook access token'
    );
  }
} 