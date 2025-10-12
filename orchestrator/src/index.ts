import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import config from './config';
import { handleFiderWebhook, handlePlaneWebhook } from './controllers/webhookController';
import DatabaseService from './services/DatabaseService';

const app: Express = express();

// Initialize database
DatabaseService.connect().catch((error) => {
  console.error('Failed to connect to database:', error);
  process.exit(1);
});

// Middleware
app.use(helmet());
app.use(cors());
app.use(morgan('dev'));
// Capture raw body for HMAC verification
app.use(express.json({
  verify: (req: Request & { rawBody?: Buffer }, _res, buf) => {
    (req as any).rawBody = Buffer.from(buf);
  },
}));
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// Webhook endpoints
// Accept ANY content-type for Fider; capture raw body and try to JSON-parse strings
app.post(
  '/webhooks/fider',
  express.text({ type: '*/*' }),
  (req: Request & { rawBody?: Buffer }, res: Response, _next: NextFunction) => {
    try {
      const body = (req as any).body;
      const asString = typeof body === 'string' ? body : JSON.stringify(body || {});
      (req as any).rawBody = Buffer.from(asString);
      if (typeof body === 'string' && asString.trim().startsWith('{')) {
        try { (req as any).body = JSON.parse(asString); } catch {}
      }
    } catch {}
    return handleFiderWebhook(req as any, res);
  }
);
app.post('/webhooks/plane', handlePlaneWebhook);

// Admin API: Get all mappings
app.get('/api/mappings', async (req: Request, res: Response) => {
  try {
    const mappings = await DatabaseService.getAllMappings();
    res.status(200).json({ success: true, data: mappings });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Admin API: Get all project mappings
app.get('/api/projects', async (req: Request, res: Response) => {
  try {
    const projects = await DatabaseService.getAllProjectMappings();
    res.status(200).json({ success: true, data: projects });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Admin API: Create/Update project mapping
app.post('/api/projects', async (req: Request, res: Response) => {
  try {
    const { productTag, planeProjectId, projectName } = req.body;

    if (!productTag || !planeProjectId || !projectName) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: productTag, planeProjectId, projectName'
      });
    }

    const mapping = await DatabaseService.createProjectMapping({
      productTag,
      planeProjectId,
      projectName,
    });

    res.status(200).json({ success: true, data: mapping });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Admin API: Get recent webhook logs
app.get('/api/logs', async (req: Request, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string) || 50;
    const logs = await DatabaseService.getRecentWebhookLogs(limit);
    res.status(200).json({ success: true, data: logs });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Test endpoint to manually create a Plane issue
app.post('/test/create-issue', async (req: Request, res: Response) => {
  try {
    const PlaneClient = (await import('./services/PlaneClient')).default;
    const issue = await PlaneClient.createIssue({
      name: req.body.name || 'Test Issue',
      description: req.body.description || 'This is a test issue',
      priority: req.body.priority || 'medium',
    });
    res.status(200).json({ success: true, issue });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({ error: 'Not Found' });
});

// Error handler
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error('❌ Error:', err.message);
  res.status(500).json({ error: 'Internal Server Error' });
});

// Start server
app.listen(config.port, () => {
  console.log('');
  console.log('🚀 Fider-Plane Orchestrator Started');
  console.log('=====================================');
  console.log(`📡 Server: http://localhost:${config.port}`);
  console.log(`🌍 Environment: ${config.nodeEnv}`);
  console.log('');
  console.log('📋 Webhook Endpoints:');
  console.log(`   Fider:  http://localhost:${config.port}/webhooks/fider`);
  console.log(`   Plane:  http://localhost:${config.port}/webhooks/plane`);
  console.log('');
  console.log('🔧 Configuration:');
  console.log(`   Fider:  ${config.fider.baseUrl}`);
  console.log(`   Plane:  ${config.plane.baseUrl}`);
  console.log(`   Workspace: ${config.plane.workspaceSlug}`);
  console.log(`   Project: ${config.plane.projectId}`);
  console.log('=====================================');
  console.log('');
});

export default app;

