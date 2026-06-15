import { Prisma } from '@prisma/client';
import prisma from '@/lib/prisma';
import { Blueprint } from '@/validators/blueprint.validator';

export interface DatabaseExplorerViewer {
  id: string;
  name: string;
  email: string;
  role: string;
  avatarUrl: string | null;
  createdAt: Date;
  lastLoginAt: Date | null;
  emailVerified: Date | null;
  hasPassword: boolean;
  projectCount: number;
  usageEventCount: number;
}

export interface DatabaseExplorerTableStat {
  name: string;
  rows: number;
  description: string;
  access: string;
}

export interface DatabaseExplorerProjectRecord {
  id: string;
  displayName: string;
  name: string;
  description: string;
  userPrompt: string;
  status: string;
  totalFiles: number;
  totalSizeBytes: number;
  generationTimeMs: number;
  createdAt: Date;
  updatedAt: Date;
  owner: {
    name: string | null;
    email: string | null;
  };
  blueprint: {
    featureCount: number;
    modelCount: number;
    endpointCount: number;
    pageCount: number;
    wasRepaired: boolean;
    warnings: string[];
  } | null;
  latestGeneration: {
    createdAt: Date;
    totalFiles: number;
    templateFiles: number;
    aiFiles: number;
    latencyMs: number;
    providersUsed: string[];
    warnings: string[];
  } | null;
  deployment: {
    status: string;
    githubUrl: string | null;
    vercelUrl: string | null;
    updatedAt: Date;
  } | null;
}

export interface DatabaseExplorerSchemaRecord {
  projectId: string;
  projectName: string;
  description: string;
  techStack: Blueprint['techStack'];
  models: Blueprint['dataModels'];
  pages: Blueprint['pages'];
  endpoints: Blueprint['apiEndpoints'];
  featureCount: number;
  warnings: string[];
}

export interface DatabaseExplorerUsageRecord {
  id: string;
  provider: string;
  task: string;
  success: boolean;
  latencyMs: number;
  totalTokens: number | null;
  fromCache: boolean;
  errorMessage: string | null;
  createdAt: Date;
  user: {
    name: string | null;
    email: string | null;
  } | null;
}

export interface DatabaseExplorerUserRecord {
  id: string;
  name: string | null;
  email: string | null;
  role: string;
  isActive: boolean;
  createdAt: Date;
  lastLoginAt: Date | null;
  projectCount: number;
  usageEventCount: number;
}

export interface DatabaseExplorerData {
  scope: 'workspace' | 'admin';
  viewer: DatabaseExplorerViewer;
  overview: {
    totalRowsInScope: number;
    totalProjects: number;
    totalBlueprints: number;
    totalGenerations: number;
    totalUsageLogs: number;
    totalDeployments: number;
    totalUsersInScope: number;
  };
  tableStats: DatabaseExplorerTableStat[];
  projectStatusBreakdown: Array<{ status: string; count: number }>;
  providerBreakdown: Array<{ provider: string; count: number }>;
  recentProjects: DatabaseExplorerProjectRecord[];
  schemaCatalog: DatabaseExplorerSchemaRecord[];
  recentUsage: DatabaseExplorerUsageRecord[];
  recentUsers: DatabaseExplorerUserRecord[];
}

export async function getDatabaseExplorerData(
  viewerId: string
): Promise<DatabaseExplorerData> {
  const viewer = await prisma.user.findUnique({
    where: { id: viewerId },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      avatarUrl: true,
      createdAt: true,
      lastLoginAt: true,
      emailVerified: true,
      passwordHash: true,
      _count: {
        select: {
          projects: true,
          usageLogs: true,
        },
      },
    },
  });

  if (!viewer) {
    throw new Error('Viewer not found.');
  }

  const isAdmin = viewer.role === 'ADMIN';
  const projectWhere: Prisma.ProjectWhereInput = isAdmin ? {} : { userId: viewer.id };
  const blueprintWhere: Prisma.BlueprintWhereInput = isAdmin
    ? {}
    : { project: { userId: viewer.id } };
  const generationWhere: Prisma.GenerationWhereInput = isAdmin
    ? {}
    : { project: { userId: viewer.id } };
  const deploymentWhere: Prisma.DeploymentWhereInput = isAdmin
    ? {}
    : { project: { userId: viewer.id } };
  const usageWhere: Prisma.UsageLogWhereInput = isAdmin ? {} : { userId: viewer.id };

  const [
    totalUsersInScope,
    totalProjects,
    totalBlueprints,
    totalGenerations,
    totalDeployments,
    totalUsageLogs,
    projectStatusGroups,
    providerGroups,
    recentProjects,
    recentUsage,
    recentUsers,
  ] = await Promise.all([
    isAdmin ? prisma.user.count() : Promise.resolve(1),
    prisma.project.count({ where: projectWhere }),
    prisma.blueprint.count({ where: blueprintWhere }),
    prisma.generation.count({ where: generationWhere }),
    prisma.deployment.count({ where: deploymentWhere }),
    prisma.usageLog.count({ where: usageWhere }),
    prisma.project.groupBy({
      by: ['status'],
      where: projectWhere,
      _count: {
        _all: true,
      },
    }),
    prisma.usageLog.groupBy({
      by: ['provider'],
      where: usageWhere,
      _count: {
        _all: true,
      },
    }),
    prisma.project.findMany({
      where: projectWhere,
      orderBy: { updatedAt: 'desc' },
      take: 8,
      include: {
        user: {
          select: {
            name: true,
            email: true,
          },
        },
        blueprint: {
          select: {
            data: true,
            featureCount: true,
            modelCount: true,
            endpointCount: true,
            pageCount: true,
            wasRepaired: true,
            warnings: true,
          },
        },
        generations: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          select: {
            createdAt: true,
            totalFiles: true,
            templateFiles: true,
            aiFiles: true,
            latencyMs: true,
            providersUsed: true,
            warnings: true,
          },
        },
        deployment: {
          select: {
            status: true,
            githubUrl: true,
            vercelUrl: true,
            updatedAt: true,
          },
        },
      },
    }),
    prisma.usageLog.findMany({
      where: usageWhere,
      orderBy: { createdAt: 'desc' },
      take: 12,
      select: {
        id: true,
        provider: true,
        task: true,
        success: true,
        latencyMs: true,
        totalTokens: true,
        fromCache: true,
        errorMessage: true,
        createdAt: true,
        user: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    }),
    isAdmin
      ? prisma.user.findMany({
          orderBy: { createdAt: 'desc' },
          take: 8,
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            isActive: true,
            createdAt: true,
            lastLoginAt: true,
            _count: {
              select: {
                projects: true,
                usageLogs: true,
              },
            },
          },
        })
      : Promise.resolve([]),
  ]);

  const schemaCatalog = recentProjects
    .map((project) => {
      const blueprint = normalizeBlueprint(project.blueprint?.data);
      if (!blueprint) {
        return null;
      }

      return {
        projectId: project.id,
        projectName: project.displayName,
        description: project.description,
        techStack: blueprint.techStack,
        models: blueprint.dataModels,
        pages: blueprint.pages,
        endpoints: blueprint.apiEndpoints,
        featureCount: blueprint.features.length,
        warnings: project.blueprint?.warnings ?? [],
      } satisfies DatabaseExplorerSchemaRecord;
    })
    .filter((schema): schema is DatabaseExplorerSchemaRecord => schema !== null);

  const tableStats: DatabaseExplorerTableStat[] = [
    {
      name: 'User',
      rows: totalUsersInScope,
      description: isAdmin ? 'Authenticated workspace members' : 'Your signed-in account record',
      access: isAdmin ? 'Admin-wide visibility' : 'Only your record',
    },
    {
      name: 'Project',
      rows: totalProjects,
      description: 'Generated app workspaces and save states',
      access: isAdmin ? 'All project rows' : 'Only your generated projects',
    },
    {
      name: 'Blueprint',
      rows: totalBlueprints,
      description: 'Structured product plans and schema definitions',
      access: isAdmin ? 'All blueprint rows' : 'Schemas attached to your projects',
    },
    {
      name: 'Generation',
      rows: totalGenerations,
      description: 'Stored file outputs for each generation run',
      access: isAdmin ? 'All generation rows' : 'Runs linked to your projects',
    },
    {
      name: 'Deployment',
      rows: totalDeployments,
      description: 'GitHub and Vercel deployment tracking rows',
      access: isAdmin ? 'All deployment rows' : 'Deployments tied to your projects',
    },
    {
      name: 'UsageLog',
      rows: totalUsageLogs,
      description: 'Provider latency, token, and failure telemetry',
      access: isAdmin ? 'All usage events' : 'Only your AI activity',
    },
  ];

  return {
    scope: isAdmin ? 'admin' : 'workspace',
    viewer: {
      id: viewer.id,
      name: viewer.name?.trim() || viewer.email?.split('@')[0] || 'ShipStack user',
      email: viewer.email ?? 'No email available',
      role: viewer.role,
      avatarUrl: viewer.avatarUrl,
      createdAt: viewer.createdAt,
      lastLoginAt: viewer.lastLoginAt,
      emailVerified: viewer.emailVerified,
      hasPassword: Boolean(viewer.passwordHash),
      projectCount: viewer._count.projects,
      usageEventCount: viewer._count.usageLogs,
    },
    overview: {
      totalRowsInScope:
        totalUsersInScope +
        totalProjects +
        totalBlueprints +
        totalGenerations +
        totalDeployments +
        totalUsageLogs,
      totalProjects,
      totalBlueprints,
      totalGenerations,
      totalUsageLogs,
      totalDeployments,
      totalUsersInScope,
    },
    tableStats,
    projectStatusBreakdown: projectStatusGroups.map((group) => ({
      status: group.status,
      count: group._count._all,
    })),
    providerBreakdown: providerGroups.map((group) => ({
      provider: group.provider,
      count: group._count._all,
    })),
    recentProjects: recentProjects.map((project) => ({
      id: project.id,
      displayName: project.displayName,
      name: project.name,
      description: project.description,
      userPrompt: project.userPrompt,
      status: project.status,
      totalFiles: project.totalFiles,
      totalSizeBytes: project.totalSizeBytes,
      generationTimeMs: project.generationTimeMs,
      createdAt: project.createdAt,
      updatedAt: project.updatedAt,
      owner: {
        name: project.user.name,
        email: project.user.email,
      },
      blueprint: project.blueprint
        ? {
            featureCount: project.blueprint.featureCount,
            modelCount: project.blueprint.modelCount,
            endpointCount: project.blueprint.endpointCount,
            pageCount: project.blueprint.pageCount,
            wasRepaired: project.blueprint.wasRepaired,
            warnings: project.blueprint.warnings,
          }
        : null,
      latestGeneration: project.generations[0]
        ? {
            createdAt: project.generations[0].createdAt,
            totalFiles: project.generations[0].totalFiles,
            templateFiles: project.generations[0].templateFiles,
            aiFiles: project.generations[0].aiFiles,
            latencyMs: project.generations[0].latencyMs,
            providersUsed: project.generations[0].providersUsed,
            warnings: project.generations[0].warnings,
          }
        : null,
      deployment: project.deployment
        ? {
            status: project.deployment.status,
            githubUrl: project.deployment.githubUrl,
            vercelUrl: project.deployment.vercelUrl,
            updatedAt: project.deployment.updatedAt,
          }
        : null,
    })),
    schemaCatalog,
    recentUsage: recentUsage.map((entry) => ({
      id: entry.id,
      provider: entry.provider,
      task: entry.task,
      success: entry.success,
      latencyMs: entry.latencyMs,
      totalTokens: entry.totalTokens,
      fromCache: entry.fromCache,
      errorMessage: entry.errorMessage,
      createdAt: entry.createdAt,
      user: entry.user
        ? {
            name: entry.user.name,
            email: entry.user.email,
          }
        : null,
    })),
    recentUsers: recentUsers.map((entry) => ({
      id: entry.id,
      name: entry.name,
      email: entry.email,
      role: entry.role,
      isActive: entry.isActive,
      createdAt: entry.createdAt,
      lastLoginAt: entry.lastLoginAt,
      projectCount: entry._count.projects,
      usageEventCount: entry._count.usageLogs,
    })),
  };
}

function normalizeBlueprint(data: Prisma.JsonValue | null | undefined): Blueprint | null {
  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    return null;
  }

  return data as unknown as Blueprint;
}
