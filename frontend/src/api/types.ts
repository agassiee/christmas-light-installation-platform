export type Role = 'ADMIN' | 'WORKER';
export type JobType = 'INSTALLATION' | 'REMOVAL' | 'MAINTENANCE';
export type JobStatus = 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
export type EventType = 'STATUS_CHANGE' | 'RESCHEDULE';
export type AssignmentStatus = 'INVITED' | 'ACCEPTED' | 'DECLINED' | 'REMOVED';
export type PhotoType = 'BEFORE' | 'AFTER';

export interface JobPhoto {
  id: string;
  jobId: string;
  uploadedByUserId: string;
  type: PhotoType;
  storageKey: string;
  url?: string;
  createdAt: string;
}

export interface User {
  id: string;
  email: string;
  role: Role;
  active: boolean;
}

export interface Customer {
  id: string;
  fullName: string;
  phone: string;
  email?: string;
  notes?: string;
  whatsappOptIn: boolean;
  active: boolean;
}

export interface Property {
  id: string;
  customerId: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  notes?: string;
  customer?: Customer;
}

export interface Worker {
  id: string;
  userId: string;
  fullName: string;
  phone: string;
  email?: string;
  skills?: string;
  active: boolean;
}

export interface Job {
  id: string;
  propertyId: string;
  serviceSeasonId: string;
  type: JobType;
  status: JobStatus;
  scheduledDate: string;
  scheduledStartTime?: string;
  estimatedDurationMinutes?: number;
  instructions?: string;
  equipmentNotes?: string;
  cancellationReason?: string;
  completedAt?: string;
  property?: Property;
}

export interface JobAssignment {
  id: string;
  jobId: string;
  workerId: string;
  isLead: boolean;
  status: AssignmentStatus;
  worker?: Worker;
  job?: Job;
}

export interface JobNote {
  id: string;
  jobId: string;
  authorId: string;
  body: string;
  createdAt: string;
  author?: User;
}

export interface JobHistory {
  id: string;
  eventType: EventType;
  oldStatus?: JobStatus;
  newStatus?: JobStatus;
  oldScheduledDate?: string;
  newScheduledDate?: string;
  reason?: string;
  createdAt: string;
}
