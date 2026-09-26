import { apiClient } from './client';
import type { Customer, Property, Worker, Job, JobAssignment, JobNote, JobHistory, JobPhoto, PhotoType } from './types';


// Customers
export const getCustomers = () => apiClient.get<{ data: Customer[] }>('/customers').then(res => res.data.data);
export const createCustomer = (data: Partial<Customer>) => apiClient.post<{ data: Customer }>('/customers', data).then(res => res.data.data);
export const updateCustomer = (id: string, data: Partial<Customer>) => apiClient.patch<{ data: Customer }>(`/customers/${id}`, data).then(res => res.data.data);

// Properties
export const getProperties = () => apiClient.get<{ data: Property[] }>('/properties').then(res => res.data.data);
export const createProperty = (data: Partial<Property>) => apiClient.post<{ data: Property }>('/properties', data).then(res => res.data.data);
export const updateProperty = (id: string, data: Partial<Property>) => apiClient.patch<{ data: Property }>(`/properties/${id}`, data).then(res => res.data.data);

// Workers
export const getWorkers = () => apiClient.get<{ data: Worker[] }>('/workers').then(res => res.data.data);
export const createWorker = (data: Partial<Worker> & { password?: string }) => apiClient.post<{ data: Worker }>('/workers', data).then(res => res.data.data);
export const updateWorker = (id: string, data: Partial<Worker>) => apiClient.patch<{ data: Worker }>(`/workers/${id}`, data).then(res => res.data.data);

// Jobs
export const getJobs = () => apiClient.get<{ data: Job[] }>('/jobs').then(res => res.data.data);
export const createJob = (data: Partial<Job>) => apiClient.post<{ data: Job }>('/jobs', data).then(res => res.data.data);
export const updateJob = (id: string, data: Partial<Job>) => apiClient.patch<{ data: Job }>(`/jobs/${id}`, data).then(res => res.data.data);
export const transitionJobStatus = (id: string, status: string) => apiClient.patch<{ data: Job }>(`/jobs/${id}/status`, { status }).then(res => res.data.data);
export const rescheduleJob = (id: string, data: { scheduledDate: string, scheduledStartTime?: string, reason: string }) => apiClient.patch<{ data: Job }>(`/jobs/${id}/reschedule`, data).then(res => res.data.data);
export const getJobHistory = (id: string) => apiClient.get<{ data: JobHistory[] }>(`/jobs/${id}/history`).then(res => res.data.data);

// Assignments
export const getAssignments = (jobId: string) => apiClient.get<{ data: JobAssignment[] }>(`/jobs/${jobId}/assignments`).then(res => res.data.data);
export const createAssignment = (jobId: string, data: { workerId: string, isLead: boolean }) => apiClient.post<{ data: JobAssignment }>(`/jobs/${jobId}/assignments`, data).then(res => res.data.data);
export const updateAssignment = (id: string, data: { status: string }) => apiClient.patch<{ data: JobAssignment }>(`/assignments/${id}`, data).then(res => res.data.data);
export const deleteAssignment = (id: string) => apiClient.delete(`/assignments/${id}`).then(res => res.data);

// Notes
export const getNotes = (jobId: string) => apiClient.get<{ data: JobNote[] }>(`/jobs/${jobId}/notes`).then(res => res.data.data);
export const createNote = (jobId: string, body: string) => apiClient.post<{ data: JobNote }>(`/jobs/${jobId}/notes`, { body }).then(res => res.data.data);

// Photos
export const getUploadSignature = (jobId: string, type: PhotoType) => apiClient.post(`/jobs/${jobId}/photos/upload-signature`, { type }).then(res => res.data);
export const createJobPhoto = (jobId: string, data: { type: PhotoType, storageKey: string, url?: string }) => apiClient.post<{ data: JobPhoto }>(`/jobs/${jobId}/photos`, data).then(res => res.data);
export const getJobPhotos = (jobId: string) => apiClient.get<{ data: JobPhoto[] }>(`/jobs/${jobId}/photos`).then(res => res.data);
export const deleteJobPhoto = (jobId: string, photoId: string) => apiClient.delete(`/jobs/${jobId}/photos/${photoId}`).then(res => res.data);

export const uploadToCloudinary = async (file: File, signatureData: any) => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('api_key', signatureData.api_key);
  formData.append('timestamp', signatureData.timestamp);
  formData.append('signature', signatureData.signature);
  formData.append('folder', signatureData.folder);
  if (signatureData.public_id) formData.append('public_id', signatureData.public_id);
  const res = await fetch(`https://api.cloudinary.com/v1_1/${signatureData.cloud_name}/image/upload`, { method: 'POST', body: formData });
  if (!res.ok) throw new Error('Cloudinary upload failed');
  return res.json();
};
