import prisma from '../../lib/prisma';
import { CreateJobInput, UpdateJobInput, TransitionJobInput, RescheduleJobInput } from './jobs.schema';
import { getServiceSeasonLabel } from '../../lib/season';
import { JobStatus, JobType, NotificationChannel } from '@prisma/client';
import { NotificationService } from '../notifications/notification.service';

export class JobsService {
  static async createJob(data: CreateJobInput, actorUserId: string) {
    const property = await prisma.property.findUnique({
      where: { id: data.propertyId },
      include: { customer: true }
    });

    if (!property) {
      throw new Error('Property not found');
    }

    const seasonLabel = getServiceSeasonLabel(new Date(data.scheduledDate));

    // Handle Season Linking
    let serviceSeason = await prisma.serviceSeason.findUnique({
      where: {
        propertyId_seasonLabel: {
          propertyId: data.propertyId,
          seasonLabel,
        },
      },
    });

    if (data.type === JobType.INSTALLATION) {
      if (!serviceSeason) {
        serviceSeason = await prisma.serviceSeason.create({
          data: {
            propertyId: data.propertyId,
            seasonLabel,
          },
        });
      }
    } else {
      // REMOVAL or MAINTENANCE
      if (!serviceSeason) {
        throw new Error('Cannot create removal/maintenance job without an existing service season');
      }
    }

    const result = await prisma.$transaction(async (tx: any) => {
      const job = await tx.job.create({
        data: {
          propertyId: data.propertyId,
          serviceSeasonId: serviceSeason.id,
          type: data.type,
          status: JobStatus.SCHEDULED,
          scheduledDate: new Date(data.scheduledDate),
          scheduledStartTime: data.scheduledStartTime,
          estimatedDurationMinutes: data.estimatedDurationMinutes,
          instructions: data.instructions,
          equipmentNotes: data.equipmentNotes,
        },
      });

      const history = await tx.jobStatusHistory.create({
        data: {
          jobId: job.id,
          eventType: 'STATUS_CHANGE',
          newStatus: JobStatus.SCHEDULED,
          actorUserId,
        },
      });

      return { job, history };
    });

    // Fire notification after transaction commits
    if (property.customer.whatsappOptIn) {
      await NotificationService.queueNotification({
        channel: NotificationChannel.WHATSAPP,
        idempotencyKey: `job:${result.job.id}:event:${result.history.id}:notification:${NotificationChannel.WHATSAPP}`,
        payload: {
          jobId: result.job.id,
          customerId: property.customerId,
          eventType: 'JOB_SCHEDULED'
        }
      }).catch(err => console.error('Failed to queue notification:', err));
    }

    return result.job;
  }

  static async getJob(id: string) {
    return prisma.job.findUnique({
      where: { id },
      include: {
        property: {
          include: {
            customer: true,
          },
        },
        serviceSeason: true,
        Assignments: {
          include: {
            worker: true,
          }
        },
      },
    });
  }

  static async updateJob(id: string, data: UpdateJobInput) {
    return prisma.job.update({
      where: { id },
      data,
    });
  }

  static async transitionJob(id: string, data: TransitionJobInput, actorUserId: string) {
    const result = await prisma.$transaction(async (tx: any) => {
      const job = await tx.job.findUnique({ 
        where: { id },
        include: { property: { include: { customer: true } } }
      });
      if (!job) {
        throw new Error('Job not found');
      }

      const isValidTransition = this.validateTransition(job.status, data.status);
      if (!isValidTransition) {
        throw new Error(`Invalid status transition from ${job.status} to ${data.status}`);
      }

      if (data.status === JobStatus.CANCELLED && !data.cancellationReason) {
        throw new Error('Cancellation requires a reason');
      }

      let completedAt = job.completedAt;
      if (data.status === JobStatus.COMPLETED) {
        completedAt = new Date();
      } else if (data.status === JobStatus.SCHEDULED) {
        completedAt = null; // reset if moving backward
      }

      const updatedJob = await tx.job.update({
        where: { id },
        data: {
          status: data.status,
          cancellationReason: data.status === JobStatus.CANCELLED ? data.cancellationReason : null,
          completedAt,
        },
      });

      const history = await tx.jobStatusHistory.create({
        data: {
          jobId: job.id,
          eventType: 'STATUS_CHANGE',
          oldStatus: job.status,
          newStatus: data.status,
          reason: data.cancellationReason,
          actorUserId,
        },
      });

      return { updatedJob, history };
    });

    if (result.updatedJob.property.customer.whatsappOptIn) {
      let eventType = 'JOB_STATUS_CHANGED';
      if (data.status === JobStatus.CANCELLED) eventType = 'JOB_CANCELLED';
      if (data.status === JobStatus.COMPLETED) eventType = 'JOB_COMPLETED';

      await NotificationService.queueNotification({
        channel: NotificationChannel.WHATSAPP,
        idempotencyKey: `job:${result.updatedJob.id}:event:${result.history.id}:notification:${NotificationChannel.WHATSAPP}`,
        payload: {
          jobId: result.updatedJob.id,
          customerId: result.updatedJob.property.customerId,
          eventType
        }
      }).catch(err => console.error('Failed to queue notification:', err));
    }

    return result.updatedJob;
  }

  static async rescheduleJob(id: string, data: RescheduleJobInput, actorUserId: string) {
    const result = await prisma.$transaction(async (tx: any) => {
      const job = await tx.job.findUnique({ 
        where: { id },
        include: { property: { include: { customer: true } } }
      });
      if (!job) {
        throw new Error('Job not found');
      }

      const updatedJob = await tx.job.update({
        where: { id },
        data: {
          scheduledDate: new Date(data.scheduledDate),
          scheduledStartTime: data.scheduledStartTime,
        },
      });

      const history = await tx.jobStatusHistory.create({
        data: {
          jobId: job.id,
          eventType: 'RESCHEDULE',
          oldScheduledDate: job.scheduledDate,
          newScheduledDate: new Date(data.scheduledDate),
          oldScheduledStartTime: job.scheduledStartTime,
          newScheduledStartTime: data.scheduledStartTime,
          reason: data.reason,
          actorUserId,
        },
      });

      return { updatedJob, history };
    });

    if (result.updatedJob.property.customer.whatsappOptIn) {
      await NotificationService.queueNotification({
        channel: NotificationChannel.WHATSAPP,
        idempotencyKey: `job:${result.updatedJob.id}:event:${result.history.id}:notification:${NotificationChannel.WHATSAPP}`,
        payload: {
          jobId: result.updatedJob.id,
          customerId: result.updatedJob.property.customerId,
          eventType: 'JOB_RESCHEDULED'
        }
      }).catch(err => console.error('Failed to queue notification:', err));
    }

    return result.updatedJob;
  }

  static validateTransition(current: JobStatus, target: JobStatus): boolean {
    const transitions: Record<JobStatus, JobStatus[]> = {
      [JobStatus.SCHEDULED]: [JobStatus.IN_PROGRESS, JobStatus.CANCELLED],
      [JobStatus.IN_PROGRESS]: [JobStatus.COMPLETED, JobStatus.SCHEDULED],
      [JobStatus.COMPLETED]: [], // Terminal by default for now
      [JobStatus.CANCELLED]: [], // Terminal
    };

    return transitions[current]?.includes(target) ?? false;
  }

  static async listJobs(page: number = 1, limit: number = 10, filters: { propertyId?: string, status?: JobStatus, type?: JobType, workerId?: string }) {
    const skip = (page - 1) * limit;

    const where: any = {};
    if (filters.propertyId) where.propertyId = filters.propertyId;
    if (filters.status) where.status = filters.status;
    if (filters.type) where.type = filters.type;
    
    // For worker job queries
    if (filters.workerId) {
      where.Assignments = {
        some: {
          workerId: filters.workerId
        }
      };
    }

    const [data, total] = await Promise.all([
      prisma.job.findMany({
        where,
        skip,
        take: limit,
        orderBy: { scheduledDate: 'asc' },
        include: {
          property: {
            include: { customer: true }
          },
          Assignments: {
            include: { worker: true }
          }
        },
      }),
      prisma.job.count({ where }),
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

  static async getJobHistory(id: string) {
    return prisma.jobStatusHistory.findMany({
      where: { jobId: id },
      orderBy: { createdAt: 'desc' },
    });
  }
}
