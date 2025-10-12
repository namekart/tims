// Fider Types
export interface FiderWebhookPayload {
  type: string;
  author_name: string;
  author_email: string;
  author_id: number;
  author_role: string;
  post_id: number;
  post_number: number;
  post_title: string;
  post_description: string;
  post_url: string;
  post_slug: string;
  post_created_at: string;
  post_votes?: number;
  post_status?: string; // open, planned, started, completed, declined, duplicate
  post_response_text?: string; // Response text when status changes
  tenant_name: string;
  tenant_url: string;
  tenant_subdomain: string;
}

// Plane Types
export interface PlaneIssue {
  name: string;
  description: string;
  description_html?: string;
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  state?: string;
  labels?: string[];
}

export interface PlaneWebhookPayload {
  event: string;
  action?: string; // create | update | delete
  data?: any; // generic container for event data
  issue?: {
    id: string;
    name: string;
    description: string;
    state: string;
    priority: string;
    project: string;
    sequence_id: number;
  };
  workspace?: {
    id: string;
    slug: string;
  };
  project?: {
    id: string;
    name: string;
  };
}

// Config Types
export interface Config {
  port: number;
  nodeEnv: string;
  fider: {
    baseUrl: string;
    apiKey?: string;
  };
  plane: {
    baseUrl: string;
    apiKey: string;
    workspaceSlug: string;
    projectId: string;
  };
  webhookSecret?: string;
}

