import prisma from '../../lib/prisma';
import { CreatePropertyInput, UpdatePropertyInput } from './properties.schema';

export class PropertiesService {
  static async createProperty(data: CreatePropertyInput) {
    return prisma.property.create({
      data,
    });
  }

  static async getProperty(id: string) {
    return prisma.property.findUnique({
      where: { id },
      include: {
        customer: true,
        ServiceSeasons: true,
      },
    });
  }

  static async updateProperty(id: string, data: UpdatePropertyInput) {
    return prisma.property.update({
      where: { id },
      data,
    });
  }

  static async listProperties(page: number = 1, limit: number = 10, search?: string, customerId?: string) {
    const skip = (page - 1) * limit;

    const where: any = {};
    if (customerId) {
      where.customerId = customerId;
    }
    if (search) {
      where.OR = [
        { addressLine1: { contains: search, mode: 'insensitive' as const } },
        { city: { contains: search, mode: 'insensitive' as const } },
        { postalCode: { contains: search, mode: 'insensitive' as const } },
      ];
    }

    const [data, total] = await Promise.all([
      prisma.property.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          customer: true,
        },
      }),
      prisma.property.count({ where }),
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
