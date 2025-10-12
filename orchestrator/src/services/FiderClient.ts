import axios, { AxiosInstance } from 'axios';
import config from '../config';

class FiderClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: config.fider.baseUrl,
      headers: {
        'Content-Type': 'application/json',
        ...(config.fider.apiKey && { 'Authorization': `Bearer ${config.fider.apiKey}` }),
      },
      timeout: 10000,
    });
  }

  /**
   * Get post by number
   */
  async getPost(postNumber: number): Promise<any> {
    try {
      const response = await this.client.get(`/api/v1/posts/${postNumber}`);
      return response.data;
    } catch (error: any) {
      console.error('❌ Failed to get Fider post:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Add comment to post
   */
  async addComment(postNumber: number, content: string): Promise<any> {
    try {
      console.log(`💬 Adding comment to Fider post ${postNumber}`);

      const response = await this.client.post(`/api/v1/posts/${postNumber}/comments`, {
        content,
      });

      console.log(`✅ Comment added to Fider post`);
      return response.data;
    } catch (error: any) {
      console.error('❌ Failed to add Fider comment:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Update post status
   */
  async updatePostStatus(postNumber: number, status: string): Promise<any> {
    try {
      console.log(`📝 Updating Fider post ${postNumber} status to: ${status}`);

      const response = await this.client.put(`/api/v1/posts/${postNumber}/status`, {
        status,
      });

      console.log(`✅ Fider post status updated`);
      return response.data;
    } catch (error: any) {
      console.error('❌ Failed to update Fider post status:', error.response?.data || error.message);
      throw error;
    }
  }
}

export default new FiderClient();

