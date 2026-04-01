import { User } from '@prisma/client';
import prisma from '@/lib/prisma';

export class UserService {
  static async findOrCreateBySession(sessionId: string): Promise<User> {
    const existing = await prisma.user.findUnique({
      where: { sessionId },
    });

    if (existing) {
      return existing;
    }

    return prisma.user.create({
      data: { sessionId },
    });
  }

  static async findOrCreateByEmail(email: string, name?: string): Promise<User> {
    const existing = await prisma.user.findUnique({
      where: { email },
    });

    if (existing) {
      return existing;
    }

    return prisma.user.create({
      data: { email, name },
    });
  }

  static async getById(id: string) {
    return prisma.user.findUnique({
      where: { id },
    });
  }

  static async getWithProjects(userId: string) {
    return prisma.user.findUnique({
      where: { id: userId },
      include: {
        projects: {
          orderBy: { createdAt: 'desc' },
          take: 20,
          include: {
            blueprint: {
              select: {
                featureCount: true,
                modelCount: true,
                endpointCount: true,
                pageCount: true,
              },
            },
          },
        },
      },
    });
  }
}
