import prisma from '../../lib/prisma';
import { CreateAssignmentInput, UpdateAssignmentInput } from './assignments.schema';
import { AssignmentStatus } from '@prisma/client';

export class AssignmentsService {
  static async listAssignments(jobId: string) {
    return prisma.jobAssignment.findMany({
      where: { jobId },
      include: {
        worker: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  static async createAssignment(jobId: string, data: CreateAssignmentInput) {
    return prisma.$transaction(async (tx: any) => {
      if (data.isLead) {
        // Enforce single lead at service level
        const existingLead = await tx.jobAssignment.findFirst({
          where: { jobId, isLead: true },
        });
        if (existingLead) {
          throw new Error('This job already has a lead worker');
        }
      }

      return tx.jobAssignment.create({
        data: {
          jobId,
          workerId: data.workerId,
          isLead: data.isLead,
        },
        include: {
          worker: true,
        },
      });
    });
  }

  static async getAssignment(id: string) {
    return prisma.jobAssignment.findUnique({
      where: { id },
    });
  }

  static async updateAssignment(id: string, data: UpdateAssignmentInput) {
    return prisma.$transaction(async (tx: any) => {
      const assignment = await tx.jobAssignment.findUnique({ where: { id } });
      if (!assignment) {
        throw new Error('Assignment not found');
      }

      let respondedAt = assignment.respondedAt;

      // Handle worker accept/decline responses
      if (data.status === AssignmentStatus.ACCEPTED || data.status === AssignmentStatus.DECLINED) {
        if (!respondedAt) {
          respondedAt = new Date();
        }
      }

      // Handle isLead changes
      if (data.isLead && !assignment.isLead) {
        const existingLead = await tx.jobAssignment.findFirst({
          where: { jobId: assignment.jobId, isLead: true },
        });
        if (existingLead) {
          throw new Error('This job already has a lead worker');
        }
      }

      return tx.jobAssignment.update({
        where: { id },
        data: {
          ...data,
          respondedAt,
        },
      });
    });
  }

  static async deleteAssignment(id: string) {
    // Requirements state: "Do not delete assignment history simply because a worker is removed."
    // "Removing an assignment: ACCEPTED -> REMOVED"
    return prisma.jobAssignment.update({
      where: { id },
      data: {
        status: AssignmentStatus.REMOVED,
      },
    });
  }
}
