import { prisma } from '@/lib/prisma';
import { decrypt } from '@/lib/crypto';

interface FacebookPostOptions {
  message?: string;
  imageUrl: string;
  scheduledTime?: string;
}

interface FacebookPostData {
  attached_media: Array<{ media_fbid: string }>;
  access_token: string;
  message?: string;
  scheduled_publish_time?: number;
}

export class FacebookService {
  private static async getCredentials() {
    const settings = await prisma.facebookSettings.findFirst({
      orderBy: { createdAt: 'desc' }
    });

    console.log('Facebook settings:', {
      hasSettings: !!settings,
      isConnected: settings?.isConnected,
      pageId: settings?.pageId,
      hasPageAccessToken: !!settings?.pageAccessToken
    });

    if (!settings || !settings.isConnected) {
      throw new Error('Facebook integration is not configured');
    }

    const pageAccessToken = decrypt(settings.pageAccessToken);
    
    if (!pageAccessToken) {
      throw new Error('Invalid page access token');
    }

    if (!settings.pageId) {
      throw new Error('Invalid page ID');
    }

    console.log('Using credentials:', {
      pageId: settings.pageId,
      hasPageAccessToken: !!pageAccessToken,
      pageAccessTokenPrefix: pageAccessToken.substring(0, 20) + '...'
    });

    return {
      pageAccessToken,
      pageId: settings.pageId,
    };
  }

  static async createPost(options: FacebookPostOptions) {
    const { pageAccessToken, pageId } = await this.getCredentials();
    
    try {
      // Ensure imageUrl is absolute and publicly accessible
      let imageUrl = options.imageUrl;
      
      // Get the app URL - try ngrok first in development
      let appUrl = process.env.NEXT_PUBLIC_APP_URL;
      if (process.env.NODE_ENV === 'development') {
        try {
          const ngrokResponse = await fetch('http://localhost:4040/api/tunnels');
          const ngrokData = await ngrokResponse.json();
          appUrl = ngrokData.tunnels[0].public_url;
          console.log('Using ngrok URL:', appUrl);
        } catch (error) {
          console.warn('Could not get ngrok URL, falling back to localhost:', error);
          appUrl = 'http://localhost:3000';
        }
      }
      
      console.log('Facebook createPost called with:', {
        hasImageUrl: !!imageUrl,
        imageUrl,
        isAbsolute: imageUrl.startsWith('http'),
        pageId,
        nodeEnv: process.env.NODE_ENV,
        hasPageAccessToken: !!pageAccessToken,
        pageAccessTokenPrefix: pageAccessToken ? pageAccessToken.substring(0, 20) + '...' : null,
        appUrl
      });

      // If it's a relative path, make it absolute using the app URL
      if (!imageUrl.startsWith('http')) {
        imageUrl = `${appUrl}${imageUrl.startsWith('/') ? '' : '/'}${imageUrl}`;
        console.log('Converted to absolute URL:', { imageUrl });
      }

      // Upload image to Facebook using URL
      const imageUploadResponse = await fetch(
        `https://graph.facebook.com/v22.0/${pageId}/photos`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            url: imageUrl,
            access_token: pageAccessToken,
            published: false,
          }),
        }
      );

      if (!imageUploadResponse.ok) {
        const error = await imageUploadResponse.json();
        console.error('Facebook image upload error:', error);
        throw new Error(error.error?.message || 'Failed to upload image');
      }

      const imageData = await imageUploadResponse.json();
      console.log('Image uploaded successfully:', imageData);

      // Now create the post with the uploaded image
      const postData: FacebookPostData = {
        attached_media: [{ media_fbid: imageData.id }],
        access_token: pageAccessToken,
      };

      if (options.message) {
        postData.message = options.message;
      }

      if (options.scheduledTime) {
        postData.scheduled_publish_time = Math.floor(new Date(options.scheduledTime).getTime() / 1000);
      }

      console.log('Creating Facebook post:', {
        pageId,
        hasMedia: !!imageData.id,
        hasMessage: !!options.message,
        scheduledTime: options.scheduledTime
      });

      const postResponse = await fetch(
        `https://graph.facebook.com/v22.0/${pageId}/feed`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(postData),
        }
      );

      if (!postResponse.ok) {
        const error = await postResponse.json();
        console.error('Facebook post creation error:', error);
        throw new Error(error.error?.message || 'Failed to create post');
      }

      const postResult = await postResponse.json();
      console.log('Post created successfully:', postResult);
      
      return postResult.id; // Returns the Facebook post ID
    } catch (error) {
      console.error('Error creating Facebook post:', error);
      throw error;
    }
  }

  static async deletePost(postId: string) {
    const { pageAccessToken } = await this.getCredentials();

    try {
      const response = await fetch(
        `https://graph.facebook.com/v22.0/${postId}`,
        {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            access_token: pageAccessToken,
          }),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || 'Failed to delete post');
      }

      return true;
    } catch (error) {
      console.error('Error deleting Facebook post:', error);
      throw error;
    }
  }

  static async getPost(postId: string) {
    const { pageAccessToken } = await this.getCredentials();

    try {
      const response = await fetch(
        `https://graph.facebook.com/v22.0/${postId}?fields=message,created_time,permalink_url`,
        {
          headers: {
            'Authorization': `Bearer ${pageAccessToken}`,
          },
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || 'Failed to fetch post');
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching Facebook post:', error);
      throw error;
    }
  }

  static async testConnection() {
    await this.getCredentials();
    return true;
  }
} 