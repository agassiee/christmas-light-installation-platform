import prisma from '../../lib/prisma';
import { CreateNoteInput } from './notes.schema';

export class NotesService {
  static async listNotes(jobId: string) {
    return prisma.jobNote.findMany({
      where: { jobId },
      include: {
        author: {
          select: {
            id: true,
            email: true,
            role: true,
            Worker: {
              select: {
                fullName: true,
              }
            }
          }
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  static async createNote(jobId: string, authorId: string, data: CreateNoteInput) {
    return prisma.jobNote.create({
      data: {
        jobId,
        authorId,
        body: data.body,
      },
      include: {
        author: {
          select: {
            id: true,
            email: true,
            role: true,
            Worker: {
              select: {
                fullName: true,
              }
            }
          }
        }
      }
    });
  }
}
