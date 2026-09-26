import prisma from '../../lib/prisma';
import { CreateCustomerInput, UpdateCustomerInput } from './customers.schema';

export class CustomersService {
  static async createCustomer(data: CreateCustomerInput) {
    // Check for duplicates
    const existing = await prisma.customer.findFirst({
      where: {
        OR: [
          { phone: data.phone },
          { email: data.email ? data.email : undefined },
        ],
      },
    });

    const isDuplicate = !!existing;

    const customer = await prisma.customer.create({
      data: {
        ...data,
        whatsappOptInAt: data.whatsappOptIn ? new Date() : null,
      },
    });

    return { customer, isDuplicate };
  }

  static async getCustomer(id: string) {
    return prisma.customer.findUnique({
      where: { id },
      include: {
        Properties: true,
      },
    });
  }

  static async updateCustomer(id: string, data: UpdateCustomerInput) {
    let whatsappOptInAt = undefined;
    if (data.whatsappOptIn === true) {
      whatsappOptInAt = new Date();
    } else if (data.whatsappOptIn === false) {
      whatsappOptInAt = null;
    }

    return prisma.customer.update({
      where: { id },
      data: {
        ...data,
        whatsappOptInAt,
      },
    });
  }

  static async listCustomers(page: number = 1, limit: number = 10, search?: string) {
    const skip = (page - 1) * limit;

    const where = search
      ? {
          OR: [
            { fullName: { contains: search, mode: 'insensitive' as const } },
            { phone: { contains: search } },
            { email: { contains: search, mode: 'insensitive' as const } },
          ],
        }
      : {};

    const [data, total] = await Promise.all([
      prisma.customer.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.customer.count({ where }),
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
