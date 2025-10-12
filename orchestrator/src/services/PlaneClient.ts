import axios, { AxiosInstance } from 'axios';
import config from '../config';
import { PlaneIssue } from '../types';

class PlaneClient {
  private client: AxiosInstance;
  private workspaceSlug: string;
  private projectId: string;

  constructor() {
    this.workspaceSlug = config.plane.workspaceSlug;
    this.projectId = config.plane.projectId;

    this.client = axios.create({
      baseURL: config.plane.baseUrl,
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': config.plane.apiKey,
      },
      timeout: 10000,
    });
  }

  /**
   * Create a new issue in Plane
   */
  async createIssue(issue: PlaneIssue, projectId?: string): Promise<any> {
    try {
      const targetProjectId = projectId || this.projectId;
      const url = `/api/v1/workspaces/${this.workspaceSlug}/projects/${targetProjectId}/issues/`;

      console.log(`📤 Creating Plane issue: ${issue.name} in project: ${targetProjectId}`);
      console.log(`   ↳ Description: "${issue.description}"`);
      console.log(`   ↳ Full payload:`, JSON.stringify(issue, null, 2));

      const response = await this.client.post(url, issue);

      console.log(`✅ Plane issue created: ${response.data.id}`);
      return response.data;
    } catch (error: any) {
      console.error('❌ Failed to create Plane issue:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Get issue by ID
   */
  async getIssue(issueId: string): Promise<any> {
    try {
      const url = `/api/v1/workspaces/${this.workspaceSlug}/projects/${this.projectId}/issues/${issueId}/`;
      const response = await this.client.get(url);
      return response.data;
    } catch (error: any) {
      console.error('❌ Failed to get Plane issue:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Update issue
   */
  async updateIssue(issueId: string, updates: Partial<PlaneIssue>): Promise<any> {
    try {
      const url = `/api/v1/workspaces/${this.workspaceSlug}/projects/${this.projectId}/issues/${issueId}/`;

      console.log(`📝 Updating Plane issue: ${issueId}`);

      const response = await this.client.patch(url, updates);

      console.log(`✅ Plane issue updated`);
      return response.data;
    } catch (error: any) {
      console.error('❌ Failed to update Plane issue:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Add comment to issue
   */
  async addComment(issueId: string, comment: string): Promise<any> {
    try {
      const url = `/api/v1/workspaces/${this.workspaceSlug}/projects/${this.projectId}/issues/${issueId}/comments/`;

      const response = await this.client.post(url, {
        comment,
      });

      console.log(`✅ Comment added to Plane issue`);
      return response.data;
    } catch (error: any) {
      console.error('❌ Failed to add comment:', error.response?.data || error.message);
      throw error;
    }
  }
}

export default new PlaneClient();

