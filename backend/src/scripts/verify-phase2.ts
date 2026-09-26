import prisma from '../lib/prisma';
import { JobsService } from '../modules/jobs/jobs.service';
import { WorkersService } from '../modules/workers/workers.service';
import { AssignmentsService } from '../modules/assignments/assignments.service';
import { JobType } from '@prisma/client';

async function main() {
  console.log('Starting Phase 2 verification script...');

  // Clean up
  await prisma.jobStatusHistory.deleteMany({});
  await prisma.jobNote.deleteMany({});
  await prisma.jobAssignment.deleteMany({});
  await prisma.job.deleteMany({});
  await prisma.serviceSeason.deleteMany({});
  await prisma.property.deleteMany({});
  await prisma.customer.deleteMany({});
  await prisma.worker.deleteMany({});
  const workers = await prisma.user.findMany({ where: { role: 'WORKER' }});
  await prisma.user.deleteMany({ where: { id: { in: workers.map(w => w.id) } }});

  // 1. Create Customer
  const customer = await prisma.customer.create({
    data: {
      fullName: 'John Doe',
      email: 'john.doe@example.com',
      phone: '555-1234',
    }
  });
  console.log('Created Customer:', customer.id);

  // 2. Create Property
  const property = await prisma.property.create({
    data: {
      customerId: customer.id,
      addressLine1: '123 Main St',
      city: 'Springfield',
      state: 'IL',
      postalCode: '62701',
      country: 'USA',
    }
  });
  console.log('Created Property:', property.id);

  // 3. Create Worker (User + Worker profile)
  const worker = await WorkersService.createWorker({
    email: 'worker@example.com',
    password: 'password123',
    fullName: 'Jane Smith',
    phone: '555-9876',
  });
  console.log('Created Worker:', worker.id);

  // 4. Create Job (INSTALLATION -> auto season creation)
  const adminId = customer.id; // spoof admin ID for history
  const job = await JobsService.createJob({
    propertyId: property.id,
    type: JobType.INSTALLATION,
    scheduledDate: new Date('2026-10-15T10:00:00Z').toISOString(),
  }, adminId);
  console.log('Created Job:', job.id);
  
  const season = await prisma.serviceSeason.findUnique({ where: { id: job.serviceSeasonId } });
  console.log('Auto-created ServiceSeason Label:', season?.seasonLabel);

  // 5. Assign Worker to Job
  const assignment = await AssignmentsService.createAssignment(job.id, {
    workerId: worker.id,
    isLead: true,
  });
  console.log('Created Assignment:', assignment.id);

  console.log('Phase 2 verification passed!');
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
