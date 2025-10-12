import dotenv from 'dotenv';
import { Config } from '../types';

dotenv.config();

const config: Config = {
  port: parseInt(process.env.PORT || '3001', 10),
  nodeEnv: process.env.NODE_ENV || 'development',

  fider: {
    baseUrl: process.env.FIDER_BASE_URL || 'http://localhost:8081',
    apiKey: process.env.FIDER_API_KEY,
  },

  plane: {
    baseUrl: process.env.PLANE_BASE_URL || 'http://localhost',
    apiKey: process.env.PLANE_API_KEY || '',
    workspaceSlug: process.env.PLANE_WORKSPACE_SLUG || 'namekart',
    projectId: process.env.PLANE_PROJECT_ID || '',
  },

  webhookSecret: process.env.WEBHOOK_SECRET,
};

// Validate required config
if (!config.plane.apiKey) {
  console.warn('⚠️  PLANE_API_KEY is not set');
}

if (!config.plane.projectId) {
  console.warn('⚠️  PLANE_PROJECT_ID is not set');
}

export default config;

