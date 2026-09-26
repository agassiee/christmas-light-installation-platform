import prisma from '../../lib/prisma';
import bcrypt from 'bcryptjs';
import { CreateWorkerInput, UpdateWorkerInput } from './workers.schema';

export class WorkersService {
  static async createWorker(data: CreateWorkerInput) {
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (existingUser) {
      throw new Error('User with this email already exists');
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(data.password, salt);

    // Atomic transaction for User + Worker
    return prisma.$transaction(async (tx: any) => {
      const user = await tx.user.create({
        data: {
          email: data.email,
          passwordHash,
          role: 'WORKER',
        },
      });

      const worker = await tx.worker.create({
        data: {
          userId: user.id,
          fullName: data.fullName,
          phone: data.phone,
          email: data.email,
          skills: data.skills,
        },
      });

      return worker;
    });
  }

  static async getWorkerByUserId(userId: string) {
    return prisma.worker.findUnique({
      where: { userId },
    });
  }

  static async getWorker(id: string) {
    return prisma.worker.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            email: true,
            active: true,
            createdAt: true,
          }
        }
      },
    });
  }

  static async updateWorker(id: string, data: UpdateWorkerInput) {
    // If active status is changed, update both worker and user
    if (data.active !== undefined) {
      const worker = await prisma.worker.findUnique({ where: { id } });
      if (!worker) {
        throw new Error('Worker not found');
      }

      return prisma.$transaction(async (tx: any) => {
        const updatedWorker = await tx.worker.update({
          where: { id },
          data,
        });

        await tx.user.update({
          where: { id: worker.userId },
          data: { active: data.active },
        });

        return updatedWorker;
      });
    }

    // Otherwise, just update the worker profile
    return prisma.worker.update({
      where: { id },
      data,
    });
  }

  static async listWorkers(page: number = 1, limit: number = 10, search?: string) {
    const skip = (page - 1) * limit;

    const where = search
      ? {
          OR: [
            { fullName: { contains: search, mode: 'insensitive' as const } },
            { email: { contains: search, mode: 'insensitive' as const } },
            { phone: { contains: search } },
          ],
        }
      : {};

    const [data, total] = await Promise.all([
      prisma.worker.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.worker.count({ where }),
    ]);

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}
