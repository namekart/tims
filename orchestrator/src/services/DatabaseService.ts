import { PrismaClient } from '@prisma/client';

class DatabaseService {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = new PrismaClient();
  }

  async connect(): Promise<void> {
    try {
      await this.prisma.$connect();
      console.log('✅ Database connected');
    } catch (error: any) {
      console.error('❌ Database connection failed:', error.message);
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    await this.prisma.$disconnect();
  }

  // === Mapping Methods ===

  async createMapping(data: {
    fiderPostNumber: number;
    fiderPostUrl: string;
    fiderPostTitle: string;
    planeIssueId: string;
    planeIssueUrl: string;
    planeProjectId: string;
  }) {
    return await this.prisma.mapping.create({ data });
  }

  async getMappingByFiderPost(fiderPostNumber: number) {
    return await this.prisma.mapping.findUnique({
      where: { fiderPostNumber },
    });
  }

  async getMappingByPlaneIssue(planeIssueId: string) {
    return await this.prisma.mapping.findUnique({
      where: { planeIssueId },
    });
  }

  async getAllMappings() {
    return await this.prisma.mapping.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  // === Project Mapping Methods ===

  async createProjectMapping(data: {
    productTag: string;
    planeProjectId: string;
    projectName: string;
  }) {
    return await this.prisma.projectMapping.upsert({
      where: { productTag: data.productTag },
      create: data,
      update: { planeProjectId: data.planeProjectId, projectName: data.projectName },
    });
  }

  async getProjectByTag(productTag: string) {
    return await this.prisma.projectMapping.findUnique({
      where: { productTag },
    });
  }

  async getAllProjectMappings() {
    return await this.prisma.projectMapping.findMany({
      orderBy: { productTag: 'asc' },
    });
  }

  async updateProjectMappingForProject(data: {
    planeProjectId: string;
    projectName?: string;
    productTag?: string;
  }) {
    const updateData: any = {};
    if (data.projectName !== undefined) updateData.projectName = data.projectName;
    if (data.productTag !== undefined) updateData.productTag = data.productTag.toLowerCase();

    if (Object.keys(updateData).length === 0) return { count: 0 };

    return await this.prisma.projectMapping.updateMany({
      where: { planeProjectId: data.planeProjectId },
      data: updateData,
    });
  }

  async deleteProjectMappingForProject(planeProjectId: string) {
    return await this.prisma.projectMapping.deleteMany({
      where: { planeProjectId },
    });
  }

  // === Webhook Log Methods ===

  async logWebhook(data: {
    source: string;
    eventType: string;
    payload: any;
    status: string;
    error?: string;
  }) {
    return await this.prisma.webhookLog.create({
      data: {
        ...data,
        payload: JSON.stringify(data.payload),
      },
    });
  }

  async updateWebhookStatus(id: string, status: string, error?: string) {
    return await this.prisma.webhookLog.update({
      where: { id },
      data: { status, error },
    });
  }

  async getRecentWebhookLogs(limit: number = 50) {
    return await this.prisma.webhookLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }
}

export default new DatabaseService();

